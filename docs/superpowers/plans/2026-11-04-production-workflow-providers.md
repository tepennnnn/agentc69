# AgentCut Production Workflow and Providers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared, gated, resumable production workflow with provider-aware generation, explicit Chatterbox cloning, and durable post-render QA.

**Architecture:** Keep the EDL as the only editing authority. Store one revisioned production record per project in the workspace database, expose it through the existing shared editor-tool schema, and compose existing generation, voice, render, review, and media services behind a concrete capability registry.

**Tech Stack:** TypeScript, Zod, Node SQLite, Next.js/React, existing ffmpeg/Remotion services, Node test runner.

**Spec:** `docs/superpowers/specs/2026-11-04-production-workflow-providers-design.md`

## Global Constraints

- Do not add dependencies or a second EDL, renderer, provider runtime, or direct agent network path.
- Existing projects without a production run and existing `video.generate` callers retain current behavior.
- Studio and MCP call the same core schemas and server functions.
- Timeline changes remain revisioned `project.edit` operations.
- Chatterbox generation remains local/offline and uses the existing worker/configuration.
- Follow strict RED → verify failure → GREEN → verify pass for each production behavior.

## Review Focus

- A stale production revision must never overwrite a newer approval or artifact; test the conflict path in Task 2.
- An unapproved production must allow estimates but block paid video submission; test both branches in Task 3.
- A reference asset outside the project/shared library or over the payload limit must fail before fetch; test in Task 3.
- Replacing a proposal or asset manifest must invalidate only its corresponding approval; test in Task 2.
- A missing, stale, or technically invalid render must persist a failed QA report rather than report success; test in Task 5.

---

### Task 1: Shared prompt enhancer and concrete capability registry

**Files:**
- Create: `packages/core/src/modules/video-generation/lib/prompt-enhancer.ts`
- Create: `packages/core/src/modules/capabilities/types.ts`
- Create: `packages/core/src/modules/capabilities/server/registry.ts`
- Create: `packages/core/src/modules/capabilities/__tests__/registry.test.ts`
- Create: `packages/core/src/modules/video-generation/__tests__/prompt-enhancer.test.ts`
- Move/modify: `apps/studio/src/modules/video-generation/lib/prompt-enhancer.ts`
- Modify: `apps/studio/src/app/api/video-generation/polish/route.ts`
- Modify: `apps/studio/src/modules/video-generation/components/video-generation-panel.tsx`
- Modify: `packages/core/src/modules/editor/server/tools.ts`
- Modify: `packages/core/src/modules/agent/server/mcp.ts`

**Interfaces:**
- Produces: `polishVideoPrompt(raw, options): string` from core.
- Produces: `capabilitySummary(projectId: string): Promise<CapabilityProvider[]>` and editor tool `capabilities.summary`.
- Consumes: existing video config, image-provider listing, Chatterbox status, transcription status, and renderer readiness.

- [x] **Step 1: Write failing core tests**

Add tests proving the core enhancer preserves the current deterministic output and the registry returns all six capability families without leaking secrets.

- [x] **Step 2: Verify RED**

Run: `pnpm --dir packages/core exec tsx --test --test-force-exit src/modules/capabilities/__tests__/registry.test.ts src/modules/video-generation/__tests__/prompt-enhancer.test.ts`

Expected: FAIL because the core modules/tool do not exist.

- [x] **Step 3: Implement the minimal shared modules and tool wiring**

Move the existing pure enhancer unchanged, re-export it from the old Studio path for compatibility, and build concrete provider records from existing status functions. Use `media/server/search/index.ts#listProviders`, `render/server/remotion.ts#rendererReady`, and project-scoped transcription status. Add `capabilities.summary` to the shared editor schema and MCP descriptions.

- [x] **Step 4: Verify GREEN**

Run the Task 1 command; expected PASS.

### Task 2: Revisioned production state, artifacts, and approval gates

**Files:**
- Create: `packages/core/src/modules/production/types.ts`
- Create: `packages/core/src/modules/production/server/workflow.ts`
- Create: `packages/core/src/modules/production/__tests__/workflow.test.ts`
- Modify: `packages/core/src/modules/editor/server/tools.ts`
- Modify: `packages/core/src/modules/agent/server/mcp.ts`

**Interfaces:**
- Produces: `readProduction(projectId)`, `startProduction(projectId, input)`, `updateProduction(projectId, expectedRevision, command)`, `assertProposalApproved(projectId)`, and `assertAssetsApproved(projectId)`.
- Produces editor tools: `production.read`, `production.start`, `production.proposal.save`, `production.proposal.approve`, `production.reference.save`, `production.storyboard.save`, `production.assets.save`, `production.assets.approve`, and `production.checkpoint`.
- Consumes: project existence from the current workspace database.

- [x] **Step 1: Write failing workflow tests**

Cover start/read without overwrite, stale-revision rejection, proposal approval, asset approval, artifact replacement invalidation, automatic stage transitions, manifest coverage for every storyboard scene, bounded checkpoints, host-resolved reference probe facts, evidence timestamps outside duration, and typed reference/storyboard/manifest validation.

- [x] **Step 2: Verify RED**

Run: `pnpm --dir packages/core exec tsx --test --test-force-exit src/modules/production/__tests__/workflow.test.ts`

Expected: FAIL because the production module does not exist.

- [x] **Step 3: Implement the production record and shared commands**

Use one SQLite table keyed by project ID with `revision`, `state_json`, and `updated_at`. Use compare-and-swap updates inside a transaction. Keep checkpoints append-only and capped at 100. Resolve reference media from the EDL, call `probe`, reject caller-supplied technical facts, and validate evidence timestamps against duration.

- [x] **Step 4: Verify GREEN**

Run the Task 2 command; expected PASS.

### Task 3: Provider-aware video generation, reference payloads, cost, and provenance

**Files:**
- Modify: `packages/core/src/modules/video-generation/types.ts`
- Modify: `packages/core/src/modules/video-generation/server/config.ts`
- Modify: `packages/core/src/modules/video-generation/server/store.ts`
- Modify: `packages/core/src/modules/video-generation/server/gateway.ts`
- Modify: `packages/core/src/modules/video-generation/__tests__/generation.test.ts`
- Modify: `packages/core/src/modules/editor/server/tools.ts`

**Interfaces:**
- Consumes: `polishVideoPrompt`, `assertProposalApproved`, and the n8n provider record/cost rate.
- Produces: backwards-compatible `VideoGenerationRequest` v2, estimate-only result, normalized n8n request with references, and durable `VideoGenerationProvenance`.

- [x] **Step 1: Write failing generation tests**

Add behaviors for shared enhancement on the agent path, estimate-only with no fetch/job, proposal gating, deterministic/provider fields, valid inline references, kind validation, inaccessible/oversized reference rejection before fetch, cost parsing, and provenance/output-checksum round-trip through the store.

- [x] **Step 2: Verify RED**

Run: `pnpm --dir packages/core exec tsx --test --test-force-exit src/modules/video-generation/__tests__/generation.test.ts`

Expected: FAIL on the new request/provenance behavior.

- [x] **Step 3: Implement request normalization and storage migration**

Keep `n8n` as the only accepted provider, add optional v2 fields, resolve and size-limit references on the host before reading or fetching, use the shared enhancer by default, and forward a fully normalized request. Use `AGENTCUT_N8N_COST_PER_SECOND_USD` when configured and return `null` otherwise; accept remote `costUsd` only when finite and nonnegative. Add idempotent SQLite columns for provenance, cost, and checksum after checking `PRAGMA table_info`; parse old rows safely.

- [x] **Step 4: Verify GREEN**

Run the Task 3 command; expected PASS including the original bridge tests.

### Task 4: Explicit Chatterbox clone tool and provenance

**Files:**
- Modify: `packages/core/src/modules/voiceover/types.ts`
- Modify: `packages/core/src/modules/voiceover/server/chatterbox.ts`
- Modify: `packages/core/src/modules/voiceover/__tests__/chatterbox.test.ts`
- Modify: `packages/core/src/modules/editor/server/tools.ts`
- Modify: `packages/core/src/modules/agent/server/mcp.ts`
- Modify: `apps/studio/src/modules/voiceover/components/voiceover-panel.tsx`

**Interfaces:**
- Produces: editor tool `voiceover.clone` requiring `referenceAssetId` and delegating to `generateVoiceover`.
- Produces: voiceover result provenance with model, reference asset ID, and `offline: true`.
- Consumes: existing Chatterbox validation and worker.

- [x] **Step 1: Write failing clone tests**

Prove the explicit tool rejects missing/invalid references, invokes the same offline worker for a valid reference, and returns clone provenance.

- [x] **Step 2: Verify RED**

Run: `pnpm --dir packages/core exec tsx --test --test-force-exit src/modules/voiceover/__tests__/chatterbox.test.ts src/modules/voiceover/__tests__/placement.test.ts`

Expected: FAIL because `voiceover.clone` and provenance do not exist.

- [x] **Step 3: Add the alias and surface it in Studio**

Reuse `generateVoiceover`; do not add another engine or worker path. Label reference-conditioned generation as voice cloning in the existing Voiceover panel and make its hook submit `voiceover.clone` whenever `referenceAssetId` is present.

- [x] **Step 4: Verify GREEN**

Run the Task 4 command; expected PASS.

### Task 5: Render gate and durable post-render QA

**Files:**
- Create: `packages/core/src/modules/production/server/qa.ts`
- Create: `packages/core/src/modules/production/__tests__/qa.test.ts`
- Modify: `packages/core/src/modules/render/server/render-project.ts`
- Modify: `packages/core/src/modules/editor/server/tools.ts`
- Modify: `packages/core/src/modules/agent/server/mcp.ts`

**Interfaces:**
- Consumes: `assertAssetsApproved`, render manifest, `probe`, `loudness`, `auditStyle`, `runReview`, and `updateProduction`.
- Produces: `runPostRenderQa(projectId, expectedRevision, sequenceId?)` and editor tool `production.qa.run`.

- [x] **Step 1: Write failing gate and QA tests**

Cover no-run compatibility, render blocked by unapproved active production, approved render allowed, missing/stale manifest failure, technical probe facts, existing audit/review composition, and durable failed/passed QA state.

- [x] **Step 2: Verify RED**

Run: `pnpm --dir packages/core exec tsx --test --test-force-exit src/modules/production/__tests__/qa.test.ts`

Expected: FAIL because the render gate and QA service do not exist.

- [x] **Step 3: Implement the gate and QA composition**

Call the gate inside core `renderProject` so Studio and agents share it. Reuse the existing render audit/`runReview` paths and add only technical probe/loudness aggregation. Persist failed QA from a catch/finalization path so probe or audit exceptions become durable findings.

- [x] **Step 4: Verify GREEN**

Run the Task 5 command; expected PASS.

### Task 6: Compact Studio production controls and integration verification

**Files:**
- Create: `apps/studio/src/modules/production/components/production-panel.tsx`
- Create: `apps/studio/src/modules/production/lib/panel-state.ts`
- Create: `apps/studio/src/modules/production/__tests__/panel-state.test.ts`
- Modify: `apps/studio/src/modules/media/components/media-browser.tsx`
- Modify: `apps/studio/src/modules/video-generation/components/video-generation-panel.tsx`

**Interfaces:**
- Consumes: `production.*`, `capabilities.summary`, and video-generation v2 through `api.editorTool`.
- Produces: shared-state stage/status display, start/resume, proposal approval, asset approval, provider/model/reference/seed/estimate controls, and QA action.

- [x] **Step 1: Read the bundled Next.js docs relevant to client components and route handlers**

Use `node_modules/next/dist/docs` as required by the Studio repository instructions.

- [x] **Step 2: Write the failing Studio state/action test**

The repository has no jsdom/React Testing Library. Prove through a pure helper that the panel derives the current stage, disables approval for a missing proposal/manifest, includes expected revisions in actions, and exposes estimate before generation.

- [x] **Step 3: Verify RED**

Run the pure helper with the existing Node test runner from the Studio package.

Expected: FAIL because the production panel does not exist.

- [x] **Step 4: Implement the compact controls**

Mount the panel in the existing Generate tab and extend, rather than duplicate, the current video-generation form.

- [x] **Step 5: Verify GREEN and repository checks**

Run the narrow Studio test, all new/modified core tests, `pnpm exec tsc --noEmit`, `pnpm --dir apps/studio build`, `pnpm test`, and `pnpm test:render`. Record any pre-existing/environment-specific failures by exact test name without claiming a clean suite.

## Execution ruling

This checkout has no baseline commit and every repository file is currently untracked. Follow the repository instruction to work on `main`, do not create a worktree, and do not create partial commits that would silently establish an incomplete baseline. Track task completion in the plan/ledger and leave commit creation to the owner after review.

