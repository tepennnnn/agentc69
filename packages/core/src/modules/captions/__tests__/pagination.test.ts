import { test } from "node:test";
import assert from "node:assert/strict";
import { paginateWords } from "../lib/pagination";
import type { WordTiming } from "../types";

test("paginateWords groups short word sequences into readable subtitle pages", () => {
  const words: WordTiming[] = [
    { word: "This", startMs: 0, endMs: 250 },
    { word: "is", startMs: 260, endMs: 400 },
    { word: "a", startMs: 410, endMs: 500 },
    { word: "viral", startMs: 510, endMs: 800 },
    { word: "hook", startMs: 810, endMs: 1200 },
  ];

  const pages = paginateWords(words, { maxCharsPerPage: 30, maxWordsPerPage: 5 });
  assert.equal(pages.length, 1);
  assert.equal(pages[0].text, "This is a viral hook");
  assert.equal(pages[0].words.length, 5);
  assert.equal(pages[0].startMs, 0);
  assert.equal(pages[0].endMs, 1200);
});

test("paginateWords splits on significant speaker pauses even when under char limit", () => {
  const words: WordTiming[] = [
    { word: "Wait", startMs: 0, endMs: 400 },
    { word: "listen.", startMs: 450, endMs: 900 },
    // 600ms pause
    { word: "Here", startMs: 1500, endMs: 1800 },
    { word: "comes", startMs: 1810, endMs: 2100 },
    { word: "the", startMs: 2110, endMs: 2200 },
    { word: "drop.", startMs: 2210, endMs: 2600 },
  ];

  const pages = paginateWords(words, { maxCharsPerPage: 50, pauseThresholdMs: 500 });
  assert.equal(pages.length, 2);
  assert.equal(pages[0].text, "Wait listen.");
  assert.equal(pages[1].text, "Here comes the drop.");
});

test("paginateWords splits long continuous sentences into bounded pages without breaking words", () => {
  const sentence = "In the heart of Tokyo the bright neon billboards flickered in the pouring rain";
  const words: WordTiming[] = sentence.split(" ").map((word, i) => ({
    word,
    startMs: i * 300,
    endMs: (i + 1) * 300 - 20,
  }));

  const pages = paginateWords(words, { maxCharsPerPage: 25 });
  assert.ok(pages.length > 1);
  assert.ok(pages.every(p => p.text.length <= 35)); // allows slight boundary grace
  assert.equal(pages.flatMap(p => p.words.map(w => w.word)).join(" "), sentence);
});
