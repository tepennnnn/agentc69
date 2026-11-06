import test from "node:test";
import assert from "node:assert/strict";
import { listTransitions, listTransitionCategories, importTransitionPrfpset } from "../server/registry";

test("listTransitions returns standard presets even without external file", async () => {
  const transitions = await listTransitions();
  assert(transitions.length >= 9, "Should contain at least the 9 standard presets");
  const zoom = transitions.find(t => t.kind === "zoom");
  assert(zoom, "Should have a zoom transition");
});

test("listTransitions filters by category and search term", async () => {
  const all = await listTransitions();
  const glitches = await listTransitions({ kind: "glitch" });
  assert(glitches.every(t => t.kind === "glitch"), "All results should be glitch kind");
});

test("importTransitionPrfpset parses XML and merges new presets", async () => {
  const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<PremiereData Version="3">
  <BinTreeItem ObjectID="10"><TreeItemBase><Name>Custom Glitch Bins</Name></TreeItemBase></BinTreeItem>
  <TreeItem ObjectID="101"><TreeItemBase><Name>Custom Super Glitch 01</Name></TreeItemBase></TreeItem>
</PremiereData>`;

  const result = await importTransitionPrfpset(sampleXml, true);
  assert.equal(result.totalImported, 1);
  assert.equal(result.presets[0].name, "Custom Super Glitch 01");
  assert.equal(result.presets[0].kind, "glitch");
});
