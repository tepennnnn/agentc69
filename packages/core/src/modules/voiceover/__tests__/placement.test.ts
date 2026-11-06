import { test } from "node:test";
import assert from "node:assert/strict";
import { assetEdit } from "../../editor/lib/asset-edit";

test("narration keeps its full length and voice gain when placed at a playhead", () => {
  const edit = assetEdit({ id: "voice", kind: "audio", source: "chatterbox", duration_sec: 12 }, 4, 5);
  assert.deepEqual(edit, { type: "music", t: 4, d: 12, src: "voice", gain: 1, duck: false, loop: false, by: "" });
});

test("ordinary music retains the shared bed defaults", () => {
  const edit = assetEdit({ id: "bed", kind: "audio" }, 4, 10);
  assert.deepEqual(edit, { type: "music", t: 4, d: 6, src: "bed", gain: .28, duck: true, loop: true, by: "" });
});
