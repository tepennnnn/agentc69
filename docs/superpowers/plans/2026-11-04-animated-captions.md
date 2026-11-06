# AgentCut High-Retention Animated Captions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement word-level animated typography, smart pagination, and viral caption presets (Bounce, Karaoke Pill, Neon, Typewriter) natively within AgentCut's Remotion engine.

**Architecture:** Extend `@agentcut/core` with smart caption pagination and SRT parsing math; implement native Remotion animation presets in `@agentcut/render` using `useCurrentFrame`, `interpolate`, and `spring`; integrate caption controls into Studio's timeline editor.

**Tech Stack:** TypeScript, React 19, Remotion 4.x, Zod, Vitest/Node test runner.

**Spec:** `docs/superpowers/specs/2026-11-04-animated-captions-design.md`

## Global Constraints

- Do not break existing EDL schema, project timeline edits, or Remotion composition tracks.
- No heavy external caption services; animations must render programmatically in Remotion.
- Smart pagination must split on natural speech pauses (threshold ~300ms) and limit line length (default 28-32 chars) to avoid awkward word breaks.
- All styles must be responsive across 16:9 landscape and 9:16 vertical short-form compositions.
- Follow strict TDD: RED → verify failure → GREEN → verify pass for every task.

## Review Focus

- Raw Whisper transcription word tokens with zero duration or missing spaces must be safely normalized.
- SRT files with both dot and comma millisecond separators (`00:00:01.500` vs `00:00:01,500`) must parse identically.
- Fast multi-word bursts must not cause spring oscillations to overflow the canvas boundary.
- Caption tracks must automatically scale font sizes proportionally between 1080x1920 (vertical) and 1920x1080 (horizontal).
- An empty audio transcript or empty project must fail gracefully with user-friendly notices.

---

### Task 1: Core Caption Schemas, Smart Pagination & SRT Parser

**Files:**
- Create: `packages/core/src/modules/captions/types.ts`
- Create: `packages/core/src/modules/captions/lib/pagination.ts`
- Create: `packages/core/src/modules/captions/lib/srt-parser.ts`
- Create: `packages/core/src/modules/captions/__tests__/pagination.test.ts`
- Create: `packages/core/src/modules/captions/__tests__/srt-parser.test.ts`
- Modify: `packages/core/src/modules/editor/server/tools.ts`

**Interfaces:**
- Produces: `paginateWords(words: WordTiming[], options?: PaginationOptions): CaptionPage[]`
- Produces: `parseSrtSubtitles(srtText: string): WordTiming[]`
- Produces: Editor tools `captions.generate` and `captions.presets`

- [ ] **Step 1: Write failing core tests**
Write unit tests for `pagination.test.ts` and `srt-parser.test.ts` checking word grouping, natural pause line-breaks, and comma/dot SRT parsing.

- [ ] **Step 2: Verify RED**
Run: `node -e "const { spawnSync } = require('child_process'); process.exit(spawnSync('npx', ['tsx', '--test', 'src/modules/captions/__tests__/pagination.test.ts'], { cwd: 'packages/core', stdio: 'inherit' }).status);"`
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement core types and pagination logic**
Create `types.ts`, `pagination.ts`, and `srt-parser.ts` with natural speech splitting and millisecond normalization.

- [ ] **Step 4: Verify GREEN**
Re-run the tests and verify all pass.

---

### Task 2: Remotion Animated Caption Presets

**Files:**
- Create: `packages/render/src/captions/types.ts`
- Create: `packages/render/src/captions/AnimatedCaptionTrack.tsx`
- Create: `packages/render/src/captions/presets/BounceCaption.tsx`
- Create: `packages/render/src/captions/presets/KaraokeCaption.tsx`
- Create: `packages/render/src/captions/presets/NeonCaption.tsx`
- Create: `packages/render/src/captions/presets/TypewriterCaption.tsx`
- Modify: `packages/render/src/SequenceComposition.tsx`
- Modify: `packages/render/src/Root.tsx`

**Interfaces:**
- Produces: `<AnimatedCaptionTrack pages={pages} style="bounce" />`
- Consumes: Remotion `useCurrentFrame`, `useVideoConfig`, `spring`, `interpolate`.

- [ ] **Step 1: Create Remotion caption components and presets**
Implement `AnimatedCaptionTrack.tsx` and the 4 preset components with spring scaling, active word highlighting, and drop-shadow styling.

- [ ] **Step 2: Mount into SequenceComposition**
Hook `AnimatedCaptionTrack` into `SequenceComposition.tsx` conditionally rendered when `captions` prop exists on the composition.

- [ ] **Step 3: Verify build**
Run: `pnpm --filter @agentcut/render build` or verify with `@agentcut/studio` Next.js Turbopack build.

---

### Task 3: Studio UI Controls & One-Click Viral Captions

**Files:**
- Create: `apps/studio/src/modules/captions/components/caption-controls.tsx`
- Modify: `apps/studio/src/modules/media/components/media-browser.tsx`
- Modify: `apps/studio/src/modules/editor/components/timeline-ruler.tsx`

**Interfaces:**
- Produces: Studio UI controls to pick caption presets (Bounce, Karaoke, Neon, Typewriter), customize font/accent colors, and toggle caption overlay on timeline.

- [ ] **Step 1: Implement Caption Controls in Studio**
Add preset preview pills and style customizer.

- [ ] **Step 2: Wire to Timeline & Active EDL**
Allow users to generate animated captions directly from any transcribed project audio or imported SRT.

- [ ] **Step 3: Verify end-to-end Studio build and tests**
Run: `npx next build` in `apps/studio` and verify exit code 0.
