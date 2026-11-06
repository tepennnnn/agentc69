import path from "node:path";
import fs from "node:fs/promises";
import type { TransitionPreset, TransitionImportResult } from "../types";
import { parsePrfpsetFile, parsePrfpsetXml } from "./prfpset-parser";

let cachedPresets: TransitionPreset[] | null = null;

// Built-in standard transitions
const STANDARD_PRESETS: TransitionPreset[] = [
  { id: "std_cross_dissolve", name: "Cross Dissolve", bin: "Standard", category: "Standard", kind: "dissolve", durationSec: 0.5, effectType: "fade", description: "Smooth linear opacity crossfade" },
  { id: "std_dip_black", name: "Dip to Black", bin: "Standard", category: "Standard", kind: "dip", durationSec: 0.5, effectType: "fade", description: "Color plate dip through black" },
  { id: "std_wipe_left", name: "Wipe Left", bin: "Standard", category: "Standard", kind: "wipe", durationSec: 0.5, effectType: "wipe", description: "Linear wipe from right to left" },
  { id: "std_slide_right", name: "Slide Right", bin: "Standard", category: "Standard", kind: "slide", durationSec: 0.5, effectType: "slide", description: "Push slide translation to the right" },
  { id: "std_zoom_punch", name: "Zoom Punch In", bin: "WGFX Zoom", category: "Zoom", kind: "zoom", durationSec: 0.4, effectType: "scale", description: "Fast punch scale transition" },
  { id: "std_glitch_jitter", name: "Glitch Jitter", bin: "WGFX Glitch", category: "Glitch", kind: "glitch", durationSec: 0.35, effectType: "jitter", description: "Chromatic aberration and horizontal displacement" },
  { id: "std_wiggle_shake", name: "Wiggle Shake", bin: "WGFX Wiggle", category: "Wiggle", kind: "wiggle", durationSec: 0.4, effectType: "shake", description: "Rotational spring shake" },
  { id: "std_offset_pan", name: "Offset Pan", bin: "WGFX Offset", category: "Offset", kind: "offset", durationSec: 0.4, effectType: "slide", description: "Horizontal offset translation" },
  { id: "std_stretch_anamorphic", name: "Stretch Anamorphic", bin: "WGFX Stretch", category: "Stretch", kind: "stretch", durationSec: 0.45, effectType: "scale", description: "Horizontal optical anamorphic stretch" },
];

const DEFAULT_WGFX_PATH = "C:\\Users\\tepen\\Downloads\\60+ Transitions WGFX\\60+ Transitions WGFX.prfpset";

export async function loadTransitionPresets(): Promise<TransitionPreset[]> {
  if (cachedPresets) return cachedPresets;

  const presets = [...STANDARD_PRESETS];

  try {
    const stat = await fs.stat(DEFAULT_WGFX_PATH).catch(() => null);
    if (stat && stat.isFile()) {
      const parsed = await parsePrfpsetFile(DEFAULT_WGFX_PATH);
      presets.push(...parsed.presets);
    }
  } catch {
    // If external file is unavailable, standard presets remain loaded
  }

  cachedPresets = presets;
  return cachedPresets;
}

export async function importTransitionPrfpset(fileOrContent: string, isXmlContent = false): Promise<TransitionImportResult> {
  const result = isXmlContent ? parsePrfpsetXml(fileOrContent) : await parsePrfpsetFile(fileOrContent);
  if (!cachedPresets) await loadTransitionPresets();
  if (cachedPresets) {
    const existingIds = new Set(cachedPresets.map(p => p.id));
    for (const p of result.presets) {
      if (!existingIds.has(p.id)) {
        cachedPresets.push(p);
        existingIds.add(p.id);
      }
    }
  }
  return result;
}

export async function listTransitions(options: { category?: string; kind?: string; search?: string } = {}): Promise<TransitionPreset[]> {
  const all = await loadTransitionPresets();
  return all.filter(p => {
    if (options.category && p.category.toLowerCase() !== options.category.toLowerCase()) return false;
    if (options.kind && p.kind !== options.kind) return false;
    if (options.search) {
      const q = options.search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.bin.toLowerCase().includes(q) || (p.description?.toLowerCase().includes(q) ?? false);
    }
    return true;
  });
}

export async function listTransitionCategories(): Promise<Array<{ name: string; count: number }>> {
  const all = await loadTransitionPresets();
  const counts = new Map<string, number>();
  for (const p of all) {
    counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
}
