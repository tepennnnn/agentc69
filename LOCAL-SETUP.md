# AgentCut Local

This separate clone keeps the editor, renderer, agent chat, and Codex/MCP integration. It uses local Whisper for recognition and the same offline Chatterbox Nano runtime as your earlier Agent Cut project. Postgun, Postbridge, and Google CSE are disabled in shared server code as well as their studio controls. Local exports and free image sources remain available.

## Open the editor

Double-click `start-local.cmd`, or run `node scripts/local-studio.mjs`. Open http://127.0.0.1:7937. The clone keeps its own projects in `workspace/`; it does not reuse the original checkout's workspace. The development server is bound to localhost. Node.js and the installed workspace dependencies are required. This delivered copy includes those dependencies; to reinstall, run `pnpm install --frozen-lockfile`.

In either editor, open **Assets → Voice-over**. Write an English script, generate narration, listen, and add it at the playhead. Imported clean speech references of 5.1–30 seconds can be selected as custom voices. Narration keeps its full duration at normal gain, without music looping or ducking. Once placed it is an ordinary editable audio item. Generating an asset alone does not alter the timeline.

## Speech runtime

Chatterbox configuration lives in `workspace/voiceover.local.json`. It points to your existing runtime under `C:\Users\tepen\Documents\Codex\2026-10-16\how-to-open-codex-terminal\outputs\agent-cut-runtime\chatterbox`. Keep that directory. The worker was copied unchanged from your confirmed `agent-cut-github-candidate-2026-10-26-lTKW59` project. It loads local checkpoints, rejects network connections, and retains upstream Perth watermarking. Nano and Turbo English checkpoints are supported. Use **Local speech setup** to check a different installed runtime after moving this clone. This is a configured source clone, not a portable installer containing the Python/model runtime.

Whisper Windows v1.9.2 and its multilingual Small model are installed inside `runtime/whisper/`. Recognition and dictation run locally. Optional agent proofreading is off; explicitly set `AGENTCUT_TRANSCRIPT_POLISH=1` to use it. Chat and editing agents still contact their own AI provider normally.

Overrides: `AGENTCUT_WHISPER_BIN`, `AGENTCUT_WHISPER_MODEL_DIR`, `AGENTCUT_WHISPER_MODEL`; `AGENTCUT_CHATTERBOX_PYTHON`, `AGENTCUT_CHATTERBOX_MODEL_DIR`, `AGENTCUT_CHATTERBOX_MODEL`, `AGENTCUT_CHATTERBOX_DEVICE`, `AGENTCUT_CHATTERBOX_THREADS`. Changed Chatterbox files/settings must be checked and saved again. A crashed speech process can leave `workspace/voiceover.lock`; stop the failed worker before removing that lock.

## Codex and MCP

Codex chat/authentication code is retained. The installed current Codex CLI reported **Logged in using ChatGPT**. The editor shows a Codex model picker. This does not make the AI provider free; it continues using your own account/subscription or configured API billing.

The clone's stdio MCP launch command is:

```powershell
node "C:\Users\tepen\Documents\Codex\2026-10-31\using-rea-inspect-this-repository-and\outputs\agentcut-local\scripts\agentcut.mjs" mcp
```

Use a separate MCP name such as `agentcut-local` if connecting it alongside the original. Existing global MCP settings were not replaced. The shared tool surface includes `agentcut_voiceover_status`, `agentcut_voiceover_configure`, and `agentcut_voiceover_generate`; use existing `project.edit` operations for placement. Windows launcher fixes use file URLs for the TypeScript loader and shell-free Node subprocesses.

## Verification and limits

Real local Nano generation produced a 4.24-second WAV. Local Whisper recognized the complete test sentence correctly with 12 word timestamps. Shared operations placed it on the demo timeline, and the studio exported an MP4. Twelve focused service/speech/placement tests pass. See `../VERIFICATION.md` for broader test results and REA scope. The upstream test suites are not fully green on Windows; this copy should not be described as release-certified.

The original renderer and dependencies retain their licenses, including Remotion's applicable license terms. No license checks were bypassed. This work removes paid service integrations; it does not change third-party licensing.
