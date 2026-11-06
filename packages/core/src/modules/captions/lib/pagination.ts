import type { CaptionPage, PaginationOptions, WordTiming } from "../types";

/**
 * Groups word-level speech tokens into comfortable, natural subtitle display pages.
 * Handles speaker pauses, punctuation breaks, and line boundaries to maximize viewer retention.
 */
export function paginateWords(
  words: WordTiming[],
  options: PaginationOptions = {},
): CaptionPage[] {
  if (!words.length) return [];

  const maxChars = options.maxCharsPerPage ?? 32;
  const maxWords = options.maxWordsPerPage ?? 6;
  const pauseThreshold = options.pauseThresholdMs ?? 350;

  const pages: CaptionPage[] = [];
  let currentWords: WordTiming[] = [];
  let currentChars = 0;

  const flushPage = () => {
    if (!currentWords.length) return;
    const text = currentWords.map((w) => w.word).join(" ");
    pages.push({
      id: `page-${pages.length + 1}`,
      text,
      startMs: currentWords[0].startMs,
      endMs: currentWords[currentWords.length - 1].endMs,
      words: [...currentWords],
    });
    currentWords = [];
    currentChars = 0;
  };

  for (let i = 0; i < words.length; i++) {
    const item = words[i];
    const prev = currentWords[currentWords.length - 1];

    // Check pause threshold from previous word
    if (prev && item.startMs - prev.endMs >= pauseThreshold) {
      flushPage();
    }

    const nextChars = currentChars === 0 ? item.word.length : currentChars + 1 + item.word.length;

    if (
      currentWords.length > 0 &&
      (nextChars > maxChars || currentWords.length >= maxWords)
    ) {
      flushPage();
    }

    currentWords.push(item);
    currentChars = currentWords.map((w) => w.word).join(" ").length;

    // Split on strong punctuation terminal
    if (/[.!?]$/.test(item.word) && i < words.length - 1 && currentChars >= maxChars * 0.7) {
      flushPage();
    }
  }

  flushPage();
  return pages;
}
