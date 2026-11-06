import fs from "node:fs/promises";
import path from "node:path";
import cp from "node:child_process";
import { promisify } from "node:util";
import { projectDir } from "../../../common/server/config";
import { registerAsset } from "./assets";

const execFile = promisify(cp.execFile);

export type KitReferenceAsset = {
  id: string;
  name: string;
  relPath: string;
  absPath: string;
};

export type KitManifest = {
  kitDir: string;
  files: string[];
  referenceAssets: KitReferenceAsset[];
  masterDirectivePath?: string;
  creativeSpecPath?: string;
  shotPrompts: string[];
  brief: string;
};

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".bmp"]);

async function walkDir(dir: string): Promise<string[]> {
  const results: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = await walkDir(full);
      results.push(...sub);
    } else if (entry.isFile()) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Extracts a production kit ZIP archive into `projectDir/kit`, registers
 * reference images into the project asset database, and builds `KIT_BRIEF.md`.
 */
export async function unpackProductionKit(archiveAbsPath: string, projectId: string): Promise<KitManifest> {
  const pDir = projectDir(projectId);
  const kitDir = path.join(pDir, "kit");
  await fs.mkdir(kitDir, { recursive: true });

  // 1. Extract archive using bsdtar (tar.exe) or fallback to Python zipfile
  try {
    await execFile("tar", ["-xf", archiveAbsPath, "-C", kitDir]);
  } catch {
    await execFile("python", ["-m", "zipfile", "-e", archiveAbsPath, kitDir]);
  }

  // 2. If the kit extracted into a single outer wrapper directory, flatten it
  const topEntries = await fs.readdir(kitDir, { withFileTypes: true });
  if (topEntries.length === 1 && topEntries[0].isDirectory()) {
    const singleDir = path.join(kitDir, topEntries[0].name);
    const innerEntries = await fs.readdir(singleDir);
    for (const item of innerEntries) {
      await fs.rename(path.join(singleDir, item), path.join(kitDir, item));
    }
    await fs.rmdir(singleDir).catch(() => {});
  }

  // 3. Scan extracted files
  const allFiles = await walkDir(kitDir);
  const relFiles = allFiles.map((f) => path.relative(kitDir, f).replace(/\\/g, "/"));

  // 4. Register all images (especially references/) as project assets
  const referenceAssets: KitReferenceAsset[] = [];
  for (const file of allFiles) {
    const ext = path.extname(file).toLowerCase();
    if (IMAGE_EXTS.has(ext)) {
      const rel = path.relative(kitDir, file).replace(/\\/g, "/");
      const name = path.basename(file);
      try {
        const asset = await registerAsset({
          file,
          kind: "image",
          scope: "project",
          projectId,
          name,
          tags: rel.includes("references") ? "reference,character,kit" : "kit,asset",
          source: "production-kit",
        });
        referenceAssets.push({
          id: asset.id,
          name,
          relPath: rel,
          absPath: file,
        });
      } catch {
        // Continue if one image fails to register
      }
    }
  }

  // 5. Create convenient aliases for shot prompts (e.g. shot_01.txt -> SHOT_01_STILL_IMAGE.txt)
  const shotPromptsDir = path.join(kitDir, "shot_prompts");
  try {
    const shotFiles = await fs.readdir(shotPromptsDir);
    for (const file of shotFiles) {
      const match = file.match(/^SHOT_(\d+)_STILL_IMAGE\.txt$/i);
      if (match) {
        const num = match[1];
        const numInt = parseInt(num, 10);
        const aliases = [`shot_${num}.txt`, `shot_${numInt}.txt`, `SHOT_${num}.txt`];
        for (const alias of aliases) {
          const aliasPath = path.join(shotPromptsDir, alias);
          await fs.copyFile(path.join(shotPromptsDir, file), aliasPath).catch(() => {});
        }
      }
    }
  } catch {}

  // Re-scan files to include generated aliases
  const refreshedFiles = await walkDir(kitDir);
  const relFilesUpdated = refreshedFiles.map((f) => path.relative(kitDir, f).replace(/\\/g, "/"));

  // 6. Detect key production documents
  const masterDirectiveRel = relFilesUpdated.find(
    (f) => /directive/i.test(f) || /07_.*\.txt/i.test(f) || /master/i.test(f)
  );
  const creativeSpecRel = relFilesUpdated.find((f) => /creative_spec\.json$/i.test(f));
  const shotPrompts = relFilesUpdated.filter((f) => /shot_prompts\//i.test(f) || /shot_.*\.txt$/i.test(f));
  const characterAnchorsRel = relFilesUpdated.find((f) => /character/i.test(f) || /01_.*\.md/i.test(f));
  const shotTableRel = relFilesUpdated.find((f) => /shot.*table/i.test(f) || /03_.*\.md/i.test(f));
  const dialogueScriptRel = relFilesUpdated.find((f) => /dialogue/i.test(f) || /tts/i.test(f) || /04_.*\.txt/i.test(f));

  // 6. Build KIT_BRIEF.md
  const briefLines: string[] = [
    `# Production Kit: ${path.basename(archiveAbsPath, ".zip")}`,
    "",
    `Extracted into: \`kit/\` (${relFiles.length} files total)`,
    "",
    "## Registered Character Reference Assets",
    referenceAssets.length
      ? referenceAssets.map((a) => `- **${a.name}** (Asset ID: \`${a.id}\`, Path: \`kit/${a.relPath}\`)`).join("\n")
      : "*(No reference images found in kit)*",
    "",
    "## Key Directive & Production Documents",
    masterDirectiveRel ? `- **Master Directive**: \`kit/${masterDirectiveRel}\`` : "",
    creativeSpecRel ? `- **Creative Specification**: \`kit/${creativeSpecRel}\`` : "",
    characterAnchorsRel ? `- **Character Anchors**: \`kit/${characterAnchorsRel}\`` : "",
    shotTableRel ? `- **Shot-by-Shot Table**: \`kit/${shotTableRel}\`` : "",
    dialogueScriptRel ? `- **Dialogue Transcript**: \`kit/${dialogueScriptRel}\`` : "",
    shotPrompts.length ? `- **Shot Prompts Directory**: \`kit/shot_prompts/\` (contains \`SHOT_01_STILL_IMAGE.txt\` through \`SHOT_09_STILL_IMAGE.txt\` with aliases like \`shot_01.txt\`, and \`SHOT_01_IMAGE_TO_VIDEO.txt\` through \`SHOT_09_IMAGE_TO_VIDEO.txt\`)` : "",
    "",
  ].filter(Boolean);

  // If master directive exists, append its initial guidelines or full text if reasonable
  if (masterDirectiveRel) {
    try {
      const directiveContent = await fs.readFile(path.join(kitDir, masterDirectiveRel), "utf8");
      briefLines.push("## Master Production Directive Excerpt", "```text", directiveContent.slice(0, 4000), "```", "");
    } catch {}
  }

  const brief = briefLines.join("\n");
  await fs.writeFile(path.join(pDir, "KIT_BRIEF.md"), brief, "utf8");
  await fs.writeFile(
    path.join(pDir, "kit_manifest.json"),
    JSON.stringify(
      {
        archive: path.basename(archiveAbsPath),
        extractedAt: Date.now(),
        referenceAssets,
        keyDocs: {
          masterDirective: masterDirectiveRel,
          creativeSpec: creativeSpecRel,
          characterAnchors: characterAnchorsRel,
          shotTable: shotTableRel,
          dialogueScript: dialogueScriptRel,
        },
        shotPrompts,
        files: relFiles,
      },
      null,
      2
    ),
    "utf8"
  );

  return {
    kitDir,
    files: relFiles,
    referenceAssets,
    masterDirectivePath: masterDirectiveRel ? path.join(kitDir, masterDirectiveRel) : undefined,
    creativeSpecPath: creativeSpecRel ? path.join(kitDir, creativeSpecRel) : undefined,
    shotPrompts,
    brief,
  };
}
