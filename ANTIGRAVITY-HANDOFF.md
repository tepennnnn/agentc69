# Handoff — finish the Antigravity (Gemini 3.8) harness in agentcut

You are continuing an in-progress code change in this repository. Read this whole file first,
then the code it references. The repo is a pnpm monorepo; work on `main`, never a branch, and
run `pnpm exec tsc --noEmit` and `pnpm test` before committing (see AGENTS.md).

## Objective

Make **Antigravity CLI** (`agy`, which runs Gemini 3.8 with a personal Google account and the
*full* model context — not the reduced Gemini-API-key tier) a working agent harness in
agentcut, so the model picker shows "Antigravity" and a clipping/editing run actually completes.

## Current status

- The harness is **implemented and type-checks** (`pnpm exec tsc --noEmit` is green).
- The driver **connects, authenticates, and reaches Gemini with full context** — a real run
  showed `input_tokens: 61891` + `cache_read_tokens: 231532` ≈ 293k tokens of context, which is
  exactly the full-context behavior the user wanted.
- **BLOCKED:** agy's headless mode auto-denies *every* permission-gated tool (shell, and also
  `read_file`/`write_file`). The agent returns an empty response and does no work. The per-run
  `--settings` grants already added do **not** fix it (see "The exact failure").

## Files already changed

| File | Change |
|------|--------|
| `packages/core/src/modules/agent/lib/registry.ts` | added `"antigravity"` to `HarnessId` and a `HARNESSES` entry (`bin: "agy"`, `binEnv: "AGENTCUT_ANTIGRAVITY_BIN"`) |
| `packages/core/src/modules/agent/server/antigravity.ts` | **new** driver — see below |
| `packages/core/src/modules/agent/server/providers.ts` | imports/exports `antigravityProvider`, registers it in `providers[]` |
| `packages/core/src/modules/agent/server/auth.ts` | `probeAntigravity()` reads `~/.gemini/google_accounts.json` |
| `packages/core/src/modules/agent/server/model-discover.ts` | `parseAgyModels()` + `discoverAntigravity()` (`agy models`) |
| `packages/core/src/modules/agent/lib/model-catalog.ts` | `antigravity: []` in `CURATED` |
| `apps/studio/src/common/components/brand-marks.tsx` | `antigravity: GeminiMark` |
| `docs/SETUP.md` | harness list updated to five |
| `packages/core/src/modules/agent/__tests__/agents.test.ts` | added `parseAgyModels` test (passes) |

The driver currently spawns (see `packages/core/src/modules/agent/server/antigravity.ts`):

```
agy -p <prompt> --output-format json --add-dir <cwd> --sandbox
    --settings {"permissions":{"allow":["read_file(<cwd with /)","write_file(<cwd with /)"]}}
    [--model <model>]
```

and parses the JSON `response` field from stdout (logs go to stderr).

## The exact failure

Real run output (clipping flow), twice, after the prompt-note fix stopped the shell attempt:

```
jetski: no output produced — a tool required the "read_file" permission that headless mode
cannot prompt for, so it was auto-denied. Add an allow-rule under permissions.allow in
settings.json (e.g. read_file(<target>)). Alternatively, re-run with
--dangerously-skip-permissions to auto-approve all tools.

{"conversation_id":"…","status":"SUCCESS","response":"","duration_seconds":340.6,"num_turns":1,
 "usage":{"input_tokens":190758,"output_tokens":15125,"thinking_tokens":7071,
          "cache_read_tokens":3009500,"total_tokens":205883},
 "denied_actions":[{"action":"read_file","display_name":"ReadFile"}]}
```

Before the prompt-note fix, the denial was `{"action":"command","display_name":"RunCommand"}`.

Key point: `status: "SUCCESS"` is a **false positive** — the run is a failure when `response`
is empty and `denied_actions` is non-empty. The agent reached the model (huge token usage) but
every tool call was auto-denied.

## Ground truth already gathered (do not re-discover)

- `agy` v1.4.11 at `C:\Users\tepen\AppData\Local\agy\bin\agy.exe`.
- Permission rule syntax (from Antigravity's **own shipped docs**, authoritative):
  - `read_file(<absolute_path>)` — e.g. `read_file(/Users/alice/notes)` (a directory → tree)
  - `write_file(<absolute_path>)`
  - `command(<binary_and_subcommand>)` — e.g. `command(gh pr list)`
  - `mcp(<server>/<tool>)`
  - `read_url(<domain>)` / `execute_url(<domain>)`
  - Explicitly **never** `read_file(*)`, `read_file(/)`, `write_file(*)`, `command(*)`, `mcp(*)`.
  - These are documented at
    `~/.gemini/antigravity-cli/builtin/skills/automation/SKILL.md` (see the `agent_permissions` /
    `access_grants` / `workspace_uris` example) — **read that file**.
- Two config surfaces share the same rule vocabulary:
  - `~/.gemini/antigravity-cli/settings.json` → `{"permissions":{"allow":[…],"deny":[…]}}`
    (this is what the CLI error message itself points at, and what the Scrapeless walkthrough
    confirmed works for `mcp(...)` on agy 1.2.2).
  - sidecar `agent_permissions.access_grants` + `workspace_uris: ["file:///abs/path"]` for
    scheduled automations.
- Tool action names present in the `agy.exe` binary: `read_file`, `write_file`, `create_file`,
  `edit_file`, `list_dir`, `list_directory`, `glob`, `grep`, `search_content`, `run_command`,
  `web_search`, `read_url`, `execute_url`.
- Settings keys seen in `~/.gemini/antigravity-cli/builtin/skills/antigravity_guide/references/app.md`:
  "Non-Workspace File Access" (allow/ask/deny), "Permission Grants", "Tool Execution Policy",
  "Internet Access Policy", "Terminal Sandbox".
- The clipping agent works **entirely inside its run directory** (it reads `transcript.txt`,
  `signals.json`, `source.json`, `frames/`, `rules.json`, `selection-glossary.json`,
  `selection-preferences.md` and writes `clips.json` into the same dir). Its `cwd` is that run
  dir, passed as `opts.cwd` to the driver. Run dirs live at `workspace/projects/<id>/`.
  The current failing run is `workspace/projects/7f168f75-d/` (a 14.7s, 360x640, no-speech test).

## Why the `--settings` grants did not work — hypotheses (ranked)

1. **`--settings` may not merge `permissions` the way the persistent settings.json does.**
   The CLI error and the working Scrapeless example both used the *persistent*
   `~/.gemini/antigravity-cli/settings.json`. The per-session `--settings` flag may apply a
   different (narrower) set of keys, or the inline JSON shape is wrong.
2. **Path format.** The driver normalized the dir to forward slashes (`C:/Users/…`). agy may
   compare against native backslash paths on Windows, so the rule never matches.
3. **Wrong grant target/scope.** `read_file(<dir>)` may need the exact path the tool accesses,
   a trailing separator, or the `workspace_uris: ["file:///…"]` form instead of a rule string.
4. **The denied read is of a file *outside* the run dir** (e.g. the source video path embedded
   in `source.json`), so the run-dir-only grant is too narrow.

## Next steps (experiment in this order)

1. **Reproduce with verbose detail.** Run `agy -p "<prompt>" --output-format json` manually in a
   scratch dir and capture the FULL stderr + stdout, and whether the `denied_actions` entry
   carries a path (it currently only shows `action`/`display_name`). Log what file the agent
   tried to read — that tells us hypothesis 4.
2. **Test the persistent settings.json path.** Put
   `{"permissions":{"allow":["read_file(<abs native path>)","write_file(<abs native path>)"]}}`
   into `~/.gemini/antigravity-cli/settings.json` (merge with existing keys, don't clobber
   `trustedWorkspaces`) and confirm it changes behavior. Use the **native** backslash path.
3. **Test `workspace_uris`.** Try `{"agent_permissions":{"workspace_uris":["file:///C:/…"]}}`
   (or the `permissions`-level equivalent if the docs show one) as an alternative to rule
   strings.
4. **Isolate path format.** Try the same grant with forward slashes, native backslashes, and a
   trailing slash, one at a time, to find which matches.
5. **Last resort for confirmation only:** run once with `--dangerously-skip-permissions` to
   prove the driver end-to-end works when un-gated, then immediately remove it and re-narrow the
   grants. Do **not** ship it (see security).

## Security constraints (do not violate)

- agentcut denies the shell (`Bash`/`command`) and web (`WebFetch`/`WebSearch`) for these runs
  because the transcript is attacker-controlled text. `--dangerously-skip-permissions`,
  `command(*)`, and `read_url(*)` are all **off the table** for the shipped driver. The only
  grants that belong are `read_file`/`write_file` scoped to the run directory (plus, if the
  clipping flow genuinely needs it, the source file's directory for reads).
- Mirror the existing drivers: Claude Code uses `--permission-mode dontAsk` + deny-lists; Codex
  uses `--sandbox workspace-write`; Cursor uses `--sandbox enabled`. The Antigravity driver's
  fence is "headless auto-denies everything except explicit read/write grants."

## Verification (definition of done)

1. Run the clipping flow in agentcut with Antigravity selected; the agent writes `clips.json`
   (or `video.json`) and `response` is non-empty with **no** `denied_actions`.
2. `pnpm exec tsc --noEmit` green.
3. `pnpm test` green (note: on this Windows machine, two pre-existing `binary.ts` tests fail —
   Unix exec-bit and `~/.local/bin` padding — plus an `EBUSY` temp-db cleanup; those are
   environmental, not caused by this change).
4. The Antigravity row shows a Google account (not `gemini-api-key`) in `probeAntigravity` —
   the user must run `agy` interactively once and sign in with their Google account, otherwise
   they still get the reduced API-key context.

## Environment facts

- Windows. Repo root: `C:\Users\tepen\Documents\Codex\2026-10-31\using-rea-inspect-this-repository-and\outputs\agentcut-local`
- `~/.gemini/settings.json` currently has `security.auth.selectedType: "gemini-api-key"` and
  `~/.gemini/google_accounts.json` has `active: null` → the user is on API-key auth, not yet a
  Google account. Full context requires Google-account sign-in.
- The agent module's harness registry is hardcoded; adding a 5th harness required touching every
  `Record<HarnessId, …>` map (registry, `model-catalog` CURATED, `auth` PROBES,
  `model-discover` DISCOVERERS). Any future harness addition must do the same.
