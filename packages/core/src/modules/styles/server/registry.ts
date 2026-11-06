import { STYLES_CATALOG } from "../data";
import type { StylePreset, StyleQueryOptions } from "../types";

/**
 * Returns available generative style presets with optional category, search, and NSFW filtering.
 */
export function listStyles(options: StyleQueryOptions = { includeNsfw: false }): StylePreset[] {
  let list = STYLES_CATALOG;

  // Unless explicitly requested by authorized user, omit NSFW styles
  if (!options.includeNsfw) {
    list = list.filter((s) => !s.isNsfw);
  }

  if (options.category && options.category !== "all") {
    list = list.filter((s) => s.category.toLowerCase() === options.category!.toLowerCase());
  }

  if (options.search && options.search.trim()) {
    const q = options.search.toLowerCase().trim();
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.desc.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }

  return list;
}

/**
 * Returns all distinct style categories.
 */
export function listStyleCategories(includeNsfw = false): string[] {
  const categories = new Set<string>();
  for (const s of STYLES_CATALOG) {
    if (s.isNsfw && !includeNsfw) continue;
    categories.add(s.category);
  }
  return Array.from(categories);
}

/**
 * Finds a specific style preset by ID or name.
 */
export function getStylePreset(idOrName: string): StylePreset | null {
  const key = idOrName.toLowerCase().trim();
  return STYLES_CATALOG.find((s) => s.id.toLowerCase() === key || s.name.toLowerCase() === key) ?? null;
}
