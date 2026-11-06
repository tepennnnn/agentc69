import { listProviders } from "../../media/server/search";
import { rendererReady } from "../../render/server/remotion";
import { resolveTranscribeMode } from "../../transcription/server/settings";
import { videoGenerationConfig } from "../../video-generation/server/config";
import { voiceoverStatus } from "../../voiceover/server/chatterbox";
import type { CapabilityProvider } from "../types";

/** A concrete inventory of the providers AgentCut can actually call today. */
export async function capabilitySummary(projectId: string): Promise<CapabilityProvider[]> {
  const video = videoGenerationConfig();
  const voice = await voiceoverStatus();
  const transcription = resolveTranscribeMode(projectId);
  const rate = Number(process.env.AGENTCUT_N8N_COST_PER_SECOND_USD);
  return [
    {
      id: "n8n", name: "n8n video gateway", capability: "video", modes: ["text-to-video", "image-to-video", "reference-to-video"],
      available: video.configured, configured: video.configured,
      setup: video.configured ? "Configured on this machine." : "Configure the n8n video gateway under Settings → This machine.",
      limits: { maxDurationSeconds: 60, referenceTransport: "inline-data-url" },
      cost: { unit: "generated-second", usd: Number.isFinite(rate) && rate >= 0 ? rate : null },
      provenance: ["provider", "model", "mode", "seed", "remoteJobId", "inputAssetIds", "outputSha256", "costUsd"],
    },
    ...listProviders().map<CapabilityProvider>((provider) => ({
      id: provider.id, name: provider.label, capability: "image", modes: ["search", "import"],
      available: provider.configured, configured: provider.configured, setup: provider.note,
      provenance: ["provider", "sourceUrl", "license", "attribution"],
    })),
    {
      id: "chatterbox", name: "Local Chatterbox", capability: "voice", modes: ["speech", "clone"],
      available: voice.ready, configured: voice.ready, setup: voice.message,
      limits: { referenceMinSeconds: 5.1, referenceMaxSeconds: 30, offline: true },
      cost: { unit: "generation", usd: 0 }, provenance: ["engine", "model", "referenceAssetId", "offline"],
    },
    {
      id: "openverse-audio", name: "Openverse audio", capability: "music", modes: ["search", "import"],
      available: true, configured: true, setup: "Ready; imported audio retains source and licence metadata.",
      cost: { unit: "asset", usd: 0 }, provenance: ["provider", "sourceUrl", "license", "attribution"],
    },
    {
      id: "agentcut-transcription", name: "AgentCut transcription", capability: "transcription", modes: ["recognize", "provided-transcript"],
      available: true, configured: transcription.mode !== "off", setup: `Import-time transcription is ${transcription.mode} (${transcription.scope}).`,
      provenance: ["engine", "model", "wordCount", "source"],
    },
    {
      id: "remotion", name: "Remotion", capability: "rendering", modes: ["composition", "render"],
      available: rendererReady(), configured: rendererReady(), setup: rendererReady() ? "Renderer is ready." : "The renderer will be prepared on first use.",
      provenance: ["revision", "contentSignature", "file"],
    },
  ];
}
