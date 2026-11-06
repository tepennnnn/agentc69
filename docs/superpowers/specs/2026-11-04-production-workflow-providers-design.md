# AgentCut Production Workflow and Providers Design

Date: 2026-11-04

## Intent

Turn AgentCut from an editor an agent can operate into a compact, resumable video-production system without replacing its strongest property: Studio and agents edit the same revisioned EDL through the same operations.

The production layer must make expensive or consequential work visible before it happens, retain the evidence needed to resume after interruption, and make generated media traceable to the provider inputs that created it.

## Goals

- Add a small staged workflow with two binding human gates: proposal approval before production spend and asset approval before final rendering.
- Expose one capability registry for video, images, voice, music, transcription, and rendering.
- Extend video generation with provider/model selection, reference media, deterministic parameters, estimates, and provenance.
- Use one prompt-enhancement function from Studio and agent tools.
- Store reference analysis, storyboards, asset manifests, checkpoints, and post-render QA as typed production artifacts.
- Restore explicit Chatterbox voice-cloning language and tooling while reusing the existing local Chatterbox implementation.

## Non-goals

- No second timeline, project format, renderer, or direct provider access from the sandboxed editing agent.
- No speculative provider SDK or adapter hierarchy. The registry describes the providers AgentCut actually has; the n8n gateway remains the first video adapter.
- No import of OpenMontage's hundreds of instruction files or a large pipeline catalogue.
- No automatic creative judgment disguised as deterministic analysis. Agents inspect frames/transcripts and save a structured reference-analysis artifact; host code supplies technical facts.
- No new external dependency.

## Constraints

- All timeline mutations continue through `project.edit` and the revisioned EDL.
- Studio and MCP use the same core schemas and server functions.
- The editing agent keeps its no-network/no-shell boundary; host-owned tools call providers and inspect files.
- Existing projects that never start a production run keep their current behavior.
- Existing `video.generate` callers remain valid.
- Existing Chatterbox runtime configuration and offline worker remain authoritative.
- Sensitive tokens and local file contents are never returned by capability/status tools.

## Approaches considered

### 1. Copy OpenMontage's pipeline and skill system

This would provide many ready-made stages and provider instructions, but it would duplicate AgentCut's editor authority, enlarge the agent prompt substantially, and create two systems that can disagree about project state.

### 2. Add only more MCP tools

This is the smallest code change, but approval and resume state would live in chat convention rather than shared project state. Studio could not reliably show what was approved, and interrupted runs could not resume safely.

### 3. Add a thin production contract over the EDL and a concrete provider registry below it

Selected. A per-project production record owns workflow stages, approvals, artifacts, checkpoints, provider decisions, cost, and QA. It never owns timeline edits. Shared core tools expose the same record to Studio and agents. The registry reports real providers and capabilities without inventing a general plugin framework.

## Production model

Each project may have one current `ProductionRun`. Starting one creates revision `1`; every update requires the caller's expected production revision and increments it. The record contains:

- brief and target delivery
- current stage: `proposal`, `reference`, `storyboard`, `assets`, `edit`, `render`, `qa`, or `complete`
- proposal and asset approvals with actor, timestamp, and optional note
- provider decisions and estimated/actual cost totals
- optional typed artifacts: reference analysis, storyboard, asset manifest, and post-render QA report
- append-only checkpoints containing stage, progress summary, artifact presence, and timestamp

The SQLite workspace database stores the JSON record keyed by project ID. This gives Studio and agents one source of truth and avoids a second file-locking implementation. Production revision is separate from EDL revision because workflow metadata is not a timeline edit.

### Gate behavior

- Once a production run exists, `video.generate` requires an approved proposal. Estimate-only calls remain allowed before approval.
- Once a production run exists, project rendering requires approved assets. Draft editing and previews remain allowed.
- Approval is invalidated only when the approved artifact itself is replaced, not by unrelated EDL edits.
- Projects with no production run are not gated, preserving existing workflows.

Stage transitions are automatic and monotonic: start → proposal; proposal approval → reference; reference save → storyboard; storyboard save → assets; asset approval → edit; successful render → qa; passing QA → complete. A project may skip reference analysis by saving a storyboard after proposal approval. Checkpoints do not move stages.

## Capability registry

`capabilities.summary` returns provider records with:

- provider ID and display name
- capability (`video`, `image`, `voice`, `music`, `transcription`, `rendering`)
- actual supported modes
- availability/configuration status and safe setup guidance
- supported inputs and limits
- cost-estimation information where configured
- provenance fields the provider can return

The initial registry is intentionally concrete:

- n8n video gateway: text-to-video plus reference-conditioned modes supported by the configured workflow
- existing online image search/import providers
- local Chatterbox voice and voice clone
- existing music/audio search path
- existing local transcription path
- Remotion renderer

## Provider-aware video generation

`video.generate` remains backwards compatible and gains optional fields:

- `provider` (initially `n8n`)
- `model`
- `mode`: `text-to-video`, `image-to-video`, or `reference-to-video`
- `referenceAssetIds`, `startFrameAssetId`, `endFrameAssetId`, and `sourceVideoAssetId`
- `seed`, `resolution`, `fps`, `generateAudio`, and `negativePrompt`
- `enhancePrompt` (default true)
- `estimateOnly`

Reference assets are resolved by the trusted host, validated as accessible to the project, size-limited, and sent to the configured n8n bridge as explicit JSON reference descriptors with data URLs. The provider request includes normalized prompt and parameters. Estimate-only returns the normalized request and configured estimate without creating a job or calling the provider.

Every stored generation records original/enhanced prompt, provider, model, mode, input asset IDs, seed, remote job ID, estimate/actual cost when known, timestamps, output media ID, and output checksum.

## Shared prompt enhancement

The existing deterministic Studio prompt enhancer moves into `@agentcut/core/modules/video-generation/lib/prompt-enhancer`. Studio imports it directly; the host gateway uses it for agent and API calls. This removes the UI-only behavior without adding a second agent/model call or cost.

## Production artifacts

- `ReferenceAnalysis`: media ID, technical probe, hook, structure, pacing, visual language, audio approach, reusable traits, changes to make, and evidence timestamps.
- `Storyboard`: ordered scenes with duration, purpose, visual prompt, narration, transition, and referenced assets.
- `AssetManifest`: assets mapped to scene IDs with provider, status, cost, provenance, and approval notes.
- `Checkpoint`: append-only resume marker with stage, completed scene IDs, pending scene IDs, spend, and summary.
- `PostRenderQaReport`: render revision, file/probe results, existing pack/style review results, sampled-frame status, audio/loudness facts, blocking findings, and verdict.

Agents perform creative reference analysis using the existing frame/transcript/signal tools, then save the typed artifact. Host code resolves the referenced EDL media, supplies media probe values, and validates evidence timestamps against its duration; callers cannot invent technical probe values. Storyboards and manifests are likewise authored by either Studio or agents through the same production commands.

## Chatterbox voice cloning

The existing implementation already clones from a 5.1–30 second clean audio reference through `VoiceoverInput.referenceAssetId`. Add an explicit `voiceover.clone` tool that requires the reference ID and delegates to the same `generateVoiceover` function. The capability registry advertises local/offline voice and clone modes. Generation provenance identifies Chatterbox model, reference asset ID, and local/offline execution; no second voice engine is introduced.

## Post-render QA

`production.qa.run` composes existing capabilities instead of replacing them:

- read the immutable render manifest and reject missing/stale outputs
- probe container, duration, dimensions, codecs, and audio presence
- run existing output-frame/style audit and pack review
- measure integrated loudness where audio exists
- save the combined report to production state

Critical findings set a failed verdict and prevent the production run from being marked complete. Existing review waivers remain the explicit exception mechanism.

## Studio surface

The Generate tab gains a compact production section rather than a new application area. It shows stage, provider preflight, proposal approval, storyboard/asset counts, checkpoint/resume status, and QA verdict. Advanced artifact authoring can continue through the agent; Studio must at minimum expose both approvals, registry status, generation parameters, and saved state.

## Failure handling

- Stale production revisions fail with the current revision in the error.
- Provider calls do not mutate production state until host validation succeeds.
- Checkpoints are append-only and bounded to avoid unbounded project records.
- Reference payloads over the configured limit fail before network submission.
- Resume reads the last checkpoint and current artifact state; it never blindly repeats completed provider jobs.
- QA failures are durable production artifacts, not transient console output.

## Acceptance

An agent or Studio user can start a production, inspect available providers, save and approve a costed proposal, analyze a reference, save a storyboard and asset manifest, generate reference-conditioned video with reproducible provenance, explicitly clone a Chatterbox voice, checkpoint/resume the run, approve assets, render, and obtain a durable post-render QA verdict. Existing non-production editing and generation callers continue to work.
