import { VOICEOVER_CHUNK_CHARACTERS } from "./data";

/** Keep phrases short enough for Turbo/Nano, splitting long words without losing text. */
export function voiceoverChunks(text: string): Array<{ text: string }> {
  const phrases = text.trim().match(/[^.!?\n]+[.!?]*|[.!?]+/g) ?? [];
  const chunks: Array<{ text: string }> = [];
  for (const phrase of phrases) {
    let remaining = phrase.trim().replace(/\s+/g, " ");
    while (remaining.length > VOICEOVER_CHUNK_CHARACTERS) {
      const space = remaining.lastIndexOf(" ", VOICEOVER_CHUNK_CHARACTERS);
      const end = space > 0 ? space : VOICEOVER_CHUNK_CHARACTERS;
      chunks.push({ text: remaining.slice(0, end).trim() });
      remaining = remaining.slice(end).trim();
    }
    if (remaining) chunks.push({ text: remaining });
  }
  return chunks;
}
