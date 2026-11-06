import { describe, it } from "node:test";
import assert from "node:assert";
import { polishVideoPrompt } from "../lib/prompt-enhancer";

describe("polishVideoPrompt", () => {
  it("enriches a user prompt while preserving specific exclusions", () => {
    const input = "A cinematic continuous tracking shot of a rain drop from the clouds until hitting the roof. No text, no extra particles(dust), no human.";
    const result = polishVideoPrompt(input);

    assert.ok(result.length > input.length, "Result should be enhanced");
    assert.match(result, /rain drop/i);
    assert.match(result, /roof/i);
    assert.match(result, /no text/i);
    assert.match(result, /no extra particles\(dust\)/i);
    assert.match(result, /no human|no people/i);
    assert.match(result, /photorealistic/i);
  });

  it("adds cinematic camera and lighting to a brief object description", () => {
    const input = "Lego figure of pacman";
    const result = polishVideoPrompt(input);

    assert.match(result, /pacman/i);
    assert.match(result, /lego/i);
    assert.match(result, /cinematic/i);
    assert.match(result, /no text/i);
    assert.match(result, /no logos/i);
    assert.match(result, /no people/i);
  });

  it("handles empty or whitespace prompts gracefully", () => {
    assert.strictEqual(polishVideoPrompt(""), "");
    assert.strictEqual(polishVideoPrompt("   "), "");
  });

  it("strips conversational prefixes cleanly", () => {
    const input = "Please create a video of a red sports car speeding along an empty desert highway";
    const result = polishVideoPrompt(input);

    assert.doesNotMatch(result, /please create a video of/i);
    assert.match(result, /red sports car/i);
    assert.match(result, /desert highway/i);
  });
});
