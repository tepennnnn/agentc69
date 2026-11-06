/** English Nano/Turbo checkpoints used by the existing local Chatterbox runtime. */
export const VOICEOVER_MODEL_FILES = [
  "ve.safetensors", "s3gen_meanflow.safetensors", "conds.pt", "merges.txt",
  "vocab.json", "tokenizer_config.json", "special_tokens_map.json", "added_tokens.json",
] as const;
export const VOICEOVER_CHUNK_CHARACTERS = 200;
export const VOICEOVER_GENERATION_TIMEOUT_MS = 30 * 60_000;
export const VOICEOVER_PROBE_TIMEOUT_MS = 120_000;
