export interface PolishPromptOptions {
  aspectRatio?: "16:9" | "9:16" | "1:1";
  durationSeconds?: number;
}

const FILLER_PREFIXES = [
  /^please\s+(generate|create|make|produce)\s+(a\s+)?(video|shot|clip)\s+(of|showing|with)?\s*/i,
  /^(generate|create|make|produce)\s+(a\s+)?(video|shot|clip)\s+(of|showing|with)?\s*/i,
  /^i\s+(want|would like|need)\s+(a\s+)?(video|shot|clip)\s+(of|showing|with)?\s*/i,
  /^(a\s+)?(video|shot|clip)\s+(of|showing|with)\s*/i,
  /^(can\s+you\s+)?(make|generate|create)\s*/i,
];

const NEGATIVE_PATTERNS = [
  /\bno\s+([a-z0-9_\-\(\)\s]+?)(?=[,\.;]|$)/gi,
  /\bwithout\s+([a-z0-9_\-\(\)\s]+?)(?=[,\.;]|$)/gi,
  /\bexclude\s+([a-z0-9_\-\(\)\s]+?)(?=[,\.;]|$)/gi,
  /\bavoid\s+([a-z0-9_\-\(\)\s]+?)(?=[,\.;]|$)/gi,
];

const DEFAULT_NEGATIVES = ["no text", "no logos", "no watermarks", "no distorted artifacts"];

/** Deterministic prompt cleanup shared by Studio and every provider call. */
export function polishVideoPrompt(rawPrompt: string, _options?: PolishPromptOptions): string {
  const trimmed = rawPrompt.trim();
  if (!trimmed) return "";
  let cleaned = trimmed;
  for (const prefix of FILLER_PREFIXES) cleaned = cleaned.replace(prefix, "");
  cleaned = cleaned.trim();
  if (!cleaned) return "";

  const userNegatives: string[] = [];
  let descriptionWithoutNegatives = cleaned;
  for (const pattern of NEGATIVE_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(cleaned)) !== null) {
      const negativeText = match[0].trim().replace(/^[,\.;]+|[,\.;]+$/g, "");
      if (negativeText && !userNegatives.some((item) => item.toLowerCase() === negativeText.toLowerCase())) userNegatives.push(negativeText);
    }
  }
  for (const negative of userNegatives) {
    const escaped = negative.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    descriptionWithoutNegatives = descriptionWithoutNegatives.replace(new RegExp(`[,\\.;]?\\s*${escaped}`, "gi"), "");
  }
  descriptionWithoutNegatives = descriptionWithoutNegatives.replace(/[,\.;\s]+$/, "").replace(/^[,\.;\s]+/, "").trim() || cleaned;
  const lower = descriptionWithoutNegatives.toLowerCase();

  const hasCameraMotion = /\b(tracking shot|panning|pan|dolly|zoom|close-up|macro|aerial|drone|tilt|orbit|crane shot|camera|framing|angle|shot)\b/i.test(lower);
  let cameraEnhancement = "";
  if (!hasCameraMotion) {
    if (/\b(rolling|running|flying|driving|falling|moving|walking|sliding|spinning|dropping)\b/i.test(lower)) cameraEnhancement = "steady cinematic tracking camera with smooth motion";
    else if (/\b(tiny|small|drop|marble|insect|eye|leaf|flower|hand|detail|miniature|lego)\b/i.test(lower)) cameraEnhancement = "cinematic close-up macro framing with subtle slow push-in";
    else if (/\b(landscape|mountain|ocean|city|sky|forest|horizon|valley|desert)\b/i.test(lower)) cameraEnhancement = "sweeping cinematic wide shot with gentle forward drift";
    else cameraEnhancement = "steady cinematic camera with smooth single-take pacing";
  }

  const hasLighting = /\b(lighting|light|sunlit|sunlight|sun|neon|shadow|shadows|glow|overcast|golden hour|backlit|dramatic light)\b/i.test(lower);
  let lightingEnhancement = "";
  if (!hasLighting) {
    if (/\b(rain|storm|cloud|clouds|dark|moody|fog|mist|night)\b/i.test(lower)) lightingEnhancement = "dramatic overcast volumetric lighting, photorealistic fluid reflections, and atmospheric depth";
    else if (/\b(sun|window|desk|morning|afternoon|day|outdoor|beach|summer)\b/i.test(lower)) lightingEnhancement = "warm natural sunlight casting soft directional shadows and realistic specular highlights";
    else if (/\b(neon|cyber|arcade|night|disco|stage|futuristic)\b/i.test(lower)) lightingEnhancement = "vibrant cinematic ambient illumination with colorful rim lighting and soft reflections";
    else lightingEnhancement = "natural cinematic lighting with soft shadows and authentic depth of field";
  }

  const hasTextures = /\b(photorealistic|texture|reflections|depth of field|bokeh|fluid dynamics|8k|4k|hyperrealistic)\b/i.test(lower);
  let detailEnhancement = "";
  if (!hasTextures) {
    if (/\b(rain|water|liquid|drop|splash|fluid|wave|ocean)\b/i.test(lower)) detailEnhancement = "photorealistic fluid dynamics and shallow depth of field";
    else if (/\b(glass|marble|metal|mirror|chrome|crystal|gold)\b/i.test(lower)) detailEnhancement = "realistic light refraction, caustic reflections, and shallow depth of field";
    else detailEnhancement = "rich photorealistic textures and crisp focus";
  }

  let description = descriptionWithoutNegatives.charAt(0).toUpperCase() + descriptionWithoutNegatives.slice(1);
  if (!/^(a|an|the|cinematic)\s/i.test(description) && !hasCameraMotion) description = `A cinematic shot of ${description.charAt(0).toLowerCase() + description.slice(1)}`;
  const clauses = [description, cameraEnhancement, lightingEnhancement, detailEnhancement].filter(Boolean);
  const finalNegatives: string[] = [];
  for (const negative of userNegatives) {
    const normalized = negative.toLowerCase().replace(/^(without|avoid|exclude)\s+/i, "no ").trim();
    if (!finalNegatives.includes(normalized)) finalNegatives.push(normalized);
  }
  const mentionsPeople = /\b(man|woman|person|people|human|crowd|face|girl|boy)\b/i.test(lower);
  if (!mentionsPeople && !finalNegatives.some((item) => /human|people|person/i.test(item))) finalNegatives.push("no people");
  for (const fallback of DEFAULT_NEGATIVES) {
    const keyword = fallback.replace(/^no\s+/i, "");
    if (!finalNegatives.some((item) => item.includes(keyword))) finalNegatives.push(fallback);
  }

  const main = clauses.join(", ").replace(/,\s*,/g, ",").replace(/\s\s+/g, " ").trim();
  const negatives = finalNegatives.join(", ");
  return `${main}${main.endsWith(".") ? " " : ". "}${negatives.charAt(0).toUpperCase() + negatives.slice(1)}.`.trim();
}
