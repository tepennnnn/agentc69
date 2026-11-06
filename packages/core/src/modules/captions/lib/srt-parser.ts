import type { WordTiming } from "../types";

export interface SrtCue {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
}

/**
 * Parses timestamp string HH:MM:SS,mmm or HH:MM:SS.mmm to milliseconds.
 */
function parseTimestamp(timeStr: string): number {
  const normalized = timeStr.trim().replace(",", ".");
  const parts = normalized.split(":");
  if (parts.length < 3) return 0;

  const hours = parseFloat(parts[0]) || 0;
  const minutes = parseFloat(parts[1]) || 0;
  const seconds = parseFloat(parts[2]) || 0;

  return Math.round((hours * 3600 + minutes * 60 + seconds) * 1000);
}

/**
 * Robust SRT parser handling varied decimal separators, multi-line cues, and formatting tags.
 */
export function parseSrtSubtitles(srtText: string): SrtCue[] {
  const blocks = srtText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split(/\n\s*\n/);
  const cues: SrtCue[] = [];

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 2) continue;

    let timeLineIndex = 0;
    // Some SRT blocks start with index number on line 0
    if (/^\d+$/.test(lines[0].trim()) && lines.length >= 3) {
      timeLineIndex = 1;
    }

    const timeLine = lines[timeLineIndex];
    const match = timeLine.match(/(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})/);
    if (!match) continue;

    const startMs = parseTimestamp(match[1]);
    const endMs = parseTimestamp(match[2]);

    const textLines = lines.slice(timeLineIndex + 1);
    const text = textLines
      .join(" ")
      .replace(/<[^>]+>/g, "") // remove HTML/ASS tags like <b>, <i>, <font>
      .trim();

    if (text) {
      cues.push({
        id: `cue-${cues.length + 1}`,
        startMs,
        endMs,
        text,
      });
    }
  }

  return cues;
}

/**
 * Converts coarse SRT cue intervals into interpolated word timings if word-level data is absent.
 */
export function srtCuesToWordTimings(cues: SrtCue[]): WordTiming[] {
  const result: WordTiming[] = [];

  for (const cue of cues) {
    const words = cue.text.split(/\s+/).filter(Boolean);
    if (!words.length) continue;

    const totalDuration = Math.max(cue.endMs - cue.startMs, 100);
    const perWord = totalDuration / words.length;

    for (let i = 0; i < words.length; i++) {
      result.push({
        word: words[i],
        startMs: Math.round(cue.startMs + i * perWord),
        endMs: Math.round(cue.startMs + (i + 1) * perWord),
      });
    }
  }

  return result;
}
