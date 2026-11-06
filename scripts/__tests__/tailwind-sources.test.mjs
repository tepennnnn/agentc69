import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

test("Studio Tailwind scans source trees instead of runtime workspace data", () => {
  const source = fs.readFileSync(path.join(root, "apps", "studio", "src", "app", "globals.css"), "utf8");
  assert.match(source, /@import "tailwindcss" source\(none\);/);
  assert.match(source, /@source "\.\.\/";/);
});
