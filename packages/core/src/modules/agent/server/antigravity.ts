import { harnessBinary, spawnable } from "./binary";
import { spawnStream, makeEvent } from "./spawn";
import { extractJson, type AgentEvent, type AgentProvider, type AgentResult, type AgentRunOptions } from "../types";

/**
 * Antigravity CLI (`agy`) in print mode: `agy -p --output-format json`.
 *
 * Google now points personal Gemini CLI users at Antigravity, and its CLI is the
 * one place a personal Google account still buys the full model context — an API
 * key does not. The JSON output is a single object that carries the answer in
 * `response` (with a `status`), so it is parsed whole at the end rather than
 * line by line the way stream-json drivers are.
 *
 * Confinement: headless `-p` auto-denies any tool that would otherwise ask for a
 * permission — and that includes the file tools, not just shell/web/MCP. The run
 * is file-transport, so we grant `read_file`/`write_file` for the run directory
 * via `--settings` and rely on headless denial to keep shell, web and MCP off.
 * `--add-dir` pins the workspace and `--sandbox` keeps the terminal restricted.
 * agy has no per-tool allow/deny flags, so `allowedTools`/`deniedTools` cannot be
 * applied per run the way Claude Code's can — the per-run grants plus headless
 * denial are the whole boundary, exactly like Cursor's driver.
 */
export const antigravityProvider: AgentProvider = {
  id: "antigravity",
  label: "Antigravity",

  async available() {
    return harnessBinary("antigravity") !== null;
  },

  async run(opts: AgentRunOptions): Promise<AgentResult> {
    const started = Date.now();
    const events: AgentEvent[] = [];
    const emit = (e: AgentEvent) => {
      events.push(e);
      opts.onEvent?.(e);
    };

    // agy headless mode auto-denies the shell ("command") tool because it would
    // need to prompt, and the agent has been seen to give up on that denial rather
    // than fall back to its file tools. Remind the agent that shell commands are
    // unavailable, and to only work with the files in its current directory.
    const prompt = `Shell commands are disabled in this run — the "command" tool is unavailable and will be denied. Work entirely within your working directory using your file tools (read, write). Never attempt a shell command, do not attempt to read raw video or audio media files directly (rely on metadata JSON and frames/ stills instead), and do not attempt to read or write files outside your working directory.\n\n${opts.prompt}`;

    // agy's headless mode auto-denies even read_file/write_file unless they are
    // explicitly granted. The run is confined to its own directory, so grant that
    // tree and nothing else. Forward and backslash variants cover Windows path
    // comparisons cleanly.
    const runDirSlash = opts.cwd.replace(/\\/g, "/").replace(/\/+$/, "");
    const runDirBackslash = opts.cwd.replace(/\//g, "\\").replace(/\\+$/, "");
    const settings = JSON.stringify({
      permissions: {
        allow: [
          `read_file(${runDirSlash})`,
          `write_file(${runDirSlash})`,
          `read_file(${runDirBackslash})`,
          `write_file(${runDirBackslash})`,
        ],
      },
    });

    const effort = process.env.AGENTCUT_ANTIGRAVITY_EFFORT ?? "medium";
    const modelHasEffort = Boolean(opts.model && /-(low|medium|high|xhigh|max)$/i.test(opts.model));
    const args = [
      "-p", prompt,
      "--output-format", "json",
      "--add-dir", opts.cwd,
      "--sandbox",
      "--dangerously-skip-permissions",
      "--settings", settings,
    ];
    if (opts.model) args.push("--model", opts.model);
    if (!modelHasEffort) args.push("--effort", effort);

    const res = await spawnStream(spawnable("antigravity"), args, {
      cwd: opts.cwd,
      idleMs: opts.idleMs ?? 30 * 60_000,
      maxMs: opts.timeoutMs ?? 2 * 60 * 60_000,
      busy: opts.busy,
      onStderr: (c) => emit(makeEvent("log", c)),
    });

    // The answer is one JSON object on stdout; the language server and its logs
    // go to stderr, which is already on the event stream above.
    let text = "";
    let status = "";
    let denied: string[] = [];
    if (res.stdout.trim()) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(res.stdout);
      } catch {
        try {
          parsed = extractJson(res.stdout);
        } catch {
          parsed = undefined;
        }
      }
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const record = parsed as Record<string, unknown>;
        if (typeof record.response === "string") text = record.response;
        if (typeof record.status === "string") status = record.status;
        if (Array.isArray(record.denied_actions) && record.denied_actions.length > 0) {
          denied = record.denied_actions.map((a: unknown) => {
            if (a && typeof a === "object") {
              const rec = a as Record<string, unknown>;
              return String(rec.action ?? rec.display_name ?? "unknown");
            }
            return String(a);
          });
          emit(makeEvent("error", `tools denied by policy: ${denied.join(", ")}`));
        }
      }
    }

    // A run with denied actions and an empty response is a headless denial failure,
    // even if the status field falsely reports SUCCESS.
    if (denied.length && !text.trim()) {
      status = "DENIED";
      text = `tools denied by policy: ${denied.join(", ")}`;
    }

    // A run that produced no parseable answer still owes the reader the raw tail.
    if (!text) text = res.stdout.trim();
    if (status && status !== "SUCCESS") emit(makeEvent("error", status));
    if (res.code !== 0 && !text) {
      throw new Error(`agy exited ${res.code}: ${res.stderr.trim().split("\n").slice(-4).join("\n")}`);
    }

    emit(makeEvent("result", text));
    return { provider: "antigravity", text, events, durationMs: Date.now() - started };
  },
};
