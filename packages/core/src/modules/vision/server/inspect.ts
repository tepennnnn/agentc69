import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { WORKSPACE, projectDir } from "../../../common/server/config";
import { resolveAssetPath } from "../../media/server/assets";
import { resolveProvider } from "../../agent/server/providers";
import { formatAnalyzerPrompt } from "../lib/default-template";
import { parseImageAnalysisOutput } from "../lib/parser";
import { ImageInspectRequest, ImageInspectResult } from "../types";

export interface InspectImageOptions {
  projectId?: string;
  timeoutMs?: number;
}

export async function inspectImage(
  request: ImageInspectRequest,
  options: InspectImageOptions = {},
): Promise<ImageInspectResult> {
  const validated = ImageInspectRequest.parse(request);

  // 1. Resolve source image
  let imageBuffer: Buffer | null = null;
  let sourceExt = ".png";

  if (validated.base64) {
    const base64Data = validated.base64.replace(/^data:image\/[a-zA-Z0-9.+_-]+;base64,/, "");
    imageBuffer = Buffer.from(base64Data, "base64");
  } else if (validated.assetId) {
    const projectId = options.projectId || "default";
    const resolvedPath = resolveAssetPath(validated.assetId, projectId);
    if (!existsSync(resolvedPath)) {
      throw new Error(`Asset not found: ${validated.assetId} (resolved to ${resolvedPath})`);
    }
    imageBuffer = await fs.readFile(resolvedPath);
    sourceExt = path.extname(resolvedPath) || ".png";
  } else if (validated.imagePath) {
    const fullPath = path.isAbsolute(validated.imagePath)
      ? validated.imagePath
      : path.join(WORKSPACE, validated.imagePath);
    if (!existsSync(fullPath)) {
      throw new Error(`Image file not found: ${validated.imagePath}`);
    }
    imageBuffer = await fs.readFile(fullPath);
    sourceExt = path.extname(fullPath) || ".png";
  } else {
    throw new Error("Must provide one of: base64, assetId, or imagePath");
  }

  // 2. Prepare staging workspace directory
  const runId = crypto.randomUUID();
  const stagingDir = path.join(WORKSPACE, ".tmp", "vision-inspect", runId);
  await fs.mkdir(stagingDir, { recursive: true });

  const refImageName = `reference${sourceExt}`;
  const refImagePath = path.join(stagingDir, refImageName);
  await fs.writeFile(refImagePath, imageBuffer);

  // 3. Resolve AI provider
  let chosenHarness = validated.harness;
  let chosenModel = validated.model;

  if (!chosenHarness) {
    try {
      const { resolveSelection } = await import("../../agent/server/selection");
      const selected = resolveSelection(options.projectId);
      if (selected?.provider) {
        chosenHarness = selected.provider;
        if (!chosenModel && selected.model) {
          chosenModel = selected.model;
        }
      }
    } catch {
      // Fallback
    }
  }

  let provider;
  if (chosenHarness) {
    provider = await resolveProvider(chosenHarness);
  } else {
    const { antigravityProvider } = await import("../../agent/server/antigravity");
    if (await antigravityProvider.available()) {
      provider = antigravityProvider;
    } else {
      provider = await resolveProvider();
    }
  }

  // 4. Build prompt
  const analyzerInstructions = formatAnalyzerPrompt({
    target: validated.target,
    energy: validated.energy,
    customTemplate: validated.customTemplate,
  });

  const runPrompt = `Inspect the image file '${refImageName}' located in your current working directory.\n\n${analyzerInstructions}`;

  // 5. Execute provider with automatic fallback if primary harness fails
  let runResult;
  try {
    runResult = await provider.run({
      cwd: stagingDir,
      prompt: runPrompt,
      model: chosenModel,
      timeoutMs: options.timeoutMs ?? 180_000,
    });
  } catch (primaryErr) {
    const { antigravityProvider } = await import("../../agent/server/antigravity");
    if (provider.id !== "antigravity" && (await antigravityProvider.available())) {
      runResult = await antigravityProvider.run({
        cwd: stagingDir,
        prompt: runPrompt,
        timeoutMs: options.timeoutMs ?? 180_000,
      });
    } else {
      throw primaryErr;
    }
  }

  // 6. Parse structured response
  const rawText = runResult.text.trim();
  const parsed = parseImageAnalysisOutput(rawText);

  // Clean up staging directory asynchronously (best effort)
  void fs.rm(stagingDir, { recursive: true, force: true }).catch(() => {});

  return {
    target: validated.target,
    energy: validated.energy ?? "viral-hook",
    imageDescription: parsed.imageDescription,
    positivePrompt: parsed.positivePrompt,
    negativePrompt: parsed.negativePrompt,
    raw: rawText,
  };
}
