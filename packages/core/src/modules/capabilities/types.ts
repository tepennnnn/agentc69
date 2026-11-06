export type ProductionCapability = "video" | "image" | "voice" | "music" | "transcription" | "rendering";

export type CapabilityProvider = {
  id: string;
  name: string;
  capability: ProductionCapability;
  modes: string[];
  available: boolean;
  configured: boolean;
  setup: string;
  limits?: Record<string, string | number | boolean>;
  cost?: { unit: string; usd: number | null };
  provenance: string[];
};
