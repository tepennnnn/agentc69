import { test } from "node:test";
import assert from "node:assert/strict";
import { getStylePreset, listStyleCategories, listStyles } from "../server/registry";

test("listStyles returns standard 100 safe styles when includeNsfw is false", () => {
  const styles = listStyles({ includeNsfw: false });
  assert.equal(styles.length, 100);
  assert.ok(styles.every((s) => !s.isNsfw));
  assert.ok(styles.every((s) => s.category !== "Adult 18+"));
});

test("listStyles includes all 129 styles including 29 unlocked Adult 18+ styles when includeNsfw is true", () => {
  const styles = listStyles({ includeNsfw: true });
  assert.equal(styles.length, 129);
  const adult = styles.filter((s) => s.isNsfw);
  assert.equal(adult.length, 29);
  assert.ok(adult.some((s) => s.name === "Boudoir Photography"));
  assert.ok(adult.some((s) => s.name === "Classic Pinup"));
});

test("listStyleCategories reports categories and respects NSFW filtering", () => {
  const safeCategories = listStyleCategories(false);
  assert.ok(!safeCategories.includes("Adult 18+"));
  assert.ok(safeCategories.includes("Photography"));
  assert.ok(safeCategories.includes("Cinematic"));

  const allCategories = listStyleCategories(true);
  assert.ok(allCategories.includes("Adult 18+"));
});

test("listStyles filters accurately by category and search keyword", () => {
  const cinematic = listStyles({ category: "Cinematic", includeNsfw: false });
  assert.ok(cinematic.length > 0);
  assert.ok(cinematic.every((s) => s.category === "Cinematic"));

  const searchResults = listStyles({ search: "portrait", includeNsfw: false });
  assert.ok(searchResults.length > 0);
  assert.ok(searchResults.some((s) => s.name.toLowerCase().includes("portrait") || s.tags.includes("portrait")));
});

test("getStylePreset retrieves style by id or name", () => {
  const style = getStylePreset("photorealistic");
  assert.ok(style);
  assert.equal(style?.name, "Photorealistic");
  assert.ok(style?.prompt.includes("photorealistic"));
});
