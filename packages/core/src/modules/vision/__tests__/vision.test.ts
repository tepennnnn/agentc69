import test from "node:test";
import assert from "node:assert/strict";
import { formatAnalyzerPrompt, DEFAULT_IMAGE_ANALYZER_PROMPT } from "../lib/default-template";
import { parseImageAnalysisOutput } from "../lib/parser";
import { EnergyLevel, ImageInspectRequest } from "../types";

test("formatAnalyzerPrompt replaces {target} with chosen target", () => {
  const prompt = formatAnalyzerPrompt({ target: "kling-2.1", energy: "viral-hook" });
  assert.ok(prompt.includes("**TARGET MODEL:** `kling-2.1`"));
  assert.ok(prompt.includes("Adapt the finished prompt to `kling-2.1`."));
  assert.ok(prompt.includes("immediate visual hook"));
});

test("formatAnalyzerPrompt adapts energy instructions", () => {
  const subtlePrompt = formatAnalyzerPrompt({ target: "google-veo", energy: "subtle" });
  assert.ok(subtlePrompt.includes("Select only minimal, restrained movements"));

  const viralPrompt = formatAnalyzerPrompt({ target: "google-veo", energy: "viral-hook" });
  assert.ok(viralPrompt.includes("Select high-retention, engaging movement optimized for short-form video hooks"));
});

test("formatAnalyzerPrompt allows editable custom template while falling back to default", () => {
  const custom = "Analyze for {target} with energy {energy}. Return IMAGE DESCRIPTION: and POSITIVE PROMPT:";
  const prompt = formatAnalyzerPrompt({
    target: "flux",
    energy: "balanced",
    customTemplate: custom,
  });
  assert.equal(prompt, "Analyze for flux with energy balanced. Return IMAGE DESCRIPTION: and POSITIVE PROMPT:");

  // Blank custom template falls back to default
  const defaultPrompt = formatAnalyzerPrompt({
    target: "google-veo",
    customTemplate: "   ",
  });
  assert.ok(defaultPrompt.includes("# IMAGE-TO-VIDEO PROMPT ANALYZER"));
});

test("parseImageAnalysisOutput parses standard 3-section output", () => {
  const sample = `
### IMAGE DESCRIPTION:
A young woman in a yellow raincoat standing in neon-lit rain. Cinematic bokeh, reflection in puddles.

### POSITIVE PROMPT:
Cinematic medium shot of a woman in a vibrant yellow raincoat looking directly into the camera with an intriguing expression. Raindrops fall and glisten under neon lights as camera smoothly tracks in.

### NEGATIVE PROMPT:
facial distortion, extra limbs, morphing, identity drift, blurry textures
`;

  const parsed = parseImageAnalysisOutput(sample);
  assert.equal(parsed.imageDescription, "A young woman in a yellow raincoat standing in neon-lit rain. Cinematic bokeh, reflection in puddles.");
  assert.equal(parsed.positivePrompt, "Cinematic medium shot of a woman in a vibrant yellow raincoat looking directly into the camera with an intriguing expression. Raindrops fall and glisten under neon lights as camera smoothly tracks in.");
  assert.equal(parsed.negativePrompt, "facial distortion, extra limbs, morphing, identity drift, blurry textures");
});

test("parseImageAnalysisOutput handles unformatted / bold header variants", () => {
  const sample = `
**IMAGE DESCRIPTION:**
Close-up of vintage sports car on coastal highway.

**POSITIVE PROMPT:**
Low angle dynamic tracking shot of a red vintage convertible cruising along a sunlit coastal cliff.

**NEGATIVE PROMPT:**
warped wheels, flickering reflections, unnatural smoke
`;

  const parsed = parseImageAnalysisOutput(sample);
  assert.equal(parsed.imageDescription, "Close-up of vintage sports car on coastal highway.");
  assert.equal(parsed.positivePrompt, "Low angle dynamic tracking shot of a red vintage convertible cruising along a sunlit coastal cliff.");
  assert.equal(parsed.negativePrompt, "warped wheels, flickering reflections, unnatural smoke");
});

test("parseImageAnalysisOutput handles unstructured fallback safely", () => {
  const raw = "A dramatic shot of waves crashing against a rocky lighthouse at dusk.";
  const parsed = parseImageAnalysisOutput(raw);
  assert.equal(parsed.imageDescription, "");
  assert.equal(parsed.positivePrompt, raw);
  assert.equal(parsed.negativePrompt, "");
});

test("ImageInspectRequest validates parameters and defaults", () => {
  const parsed = ImageInspectRequest.parse({
    base64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    target: "runway-gen3",
  });
  assert.equal(parsed.target, "runway-gen3");
  assert.equal(parsed.energy, "viral-hook");
});

test("EditorToolCall parses image.inspect tool call", async () => {
  const { EditorToolCall } = await import("../../editor/server/tools");
  const parsed = EditorToolCall.parse({
    tool: "image.inspect",
    base64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    target: "google-veo",
    energy: "viral-hook",
    customTemplate: "Custom prompt for {target}",
  });
  assert.equal(parsed.tool, "image.inspect");
  if (parsed.tool === "image.inspect") {
    assert.equal(parsed.target, "google-veo");
    assert.equal(parsed.energy, "viral-hook");
    assert.equal(parsed.customTemplate, "Custom prompt for {target}");
  }
});
