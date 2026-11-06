import test from "node:test";
import assert from "node:assert/strict";
import { decomposeStorylineToScenes } from "../server/gateway";

test("decomposeStorylineToScenes accurately segments narrative text into structured scenes", () => {
  const storyline = "A detective walks through an abandoned city at night. He discovers a mysterious glowing building. He enters the building through broken doors. Inside he finds an ancient cybernetic artifact.";
  const scenes = decomposeStorylineToScenes(storyline, { sceneCount: 4 });

  assert.equal(scenes.length, 4, "Should create 4 distinct scenes");
  assert.equal(scenes[0].sceneNumber, 1);
  assert.match(scenes[0].cameraAngle || "", /wide/i);
  assert.equal(scenes[3].sceneNumber, 4);
  assert.match(scenes[3].cameraAngle || "", /close-up/i);
  assert.match(scenes[0].prompt, /detective/i);
});

test("decomposeStorylineToScenes embeds style preset tokens across all scenes", () => {
  const storyline = "Astronaut steps onto a red alien world. A strange obelisk activates.";
  const scenes = decomposeStorylineToScenes(storyline, {
    sceneCount: 2,
    stylePresetId: "cyberpunk",
  });

  assert.equal(scenes.length, 2);
  assert.match(scenes[0].prompt, /cyberpunk|neon/i);
  assert.match(scenes[1].prompt, /cyberpunk|neon/i);
});
