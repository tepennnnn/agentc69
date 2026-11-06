import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSrtSubtitles } from "../lib/srt-parser";

test("parseSrtSubtitles parses standard comma-separated SRT blocks", () => {
  const srt = `1
00:00:01,000 --> 00:00:03,500
Hello world, welcome to AgentCut.

2
00:00:04,000 --> 00:00:06,200
Creating viral videos fast.`;

  const cues = parseSrtSubtitles(srt);
  assert.equal(cues.length, 2);
  assert.equal(cues[0].startMs, 1000);
  assert.equal(cues[0].endMs, 3500);
  assert.equal(cues[0].text, "Hello world, welcome to AgentCut.");
  assert.equal(cues[1].startMs, 4000);
  assert.equal(cues[1].endMs, 6200);
  assert.equal(cues[1].text, "Creating viral videos fast.");
});

test("parseSrtSubtitles seamlessly handles dot decimal separators and whitespace quirks", () => {
  const srt = `1\r\n00:01:10.250 --> 00:01:12.750\r\nDot separated timing.\r\n\r\n2\r\n00:01:13.000 --> 00:01:15.000\r\nNext cue.`;

  const cues = parseSrtSubtitles(srt);
  assert.equal(cues.length, 2);
  assert.equal(cues[0].startMs, 70250);
  assert.equal(cues[0].endMs, 72750);
  assert.equal(cues[0].text, "Dot separated timing.");
});
