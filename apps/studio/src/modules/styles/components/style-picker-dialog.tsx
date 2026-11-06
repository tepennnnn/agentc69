"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, Sparkles, Star, Palette, Camera, Clapperboard, Brush, Flame, Skull, Compass, ShieldAlert, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/common/ui/dialog";
import { Input } from "@/common/ui/input";
import { Button } from "@/common/ui/button";
import { Switch } from "@/common/ui/switch";
import { Label } from "@/common/ui/label";
import { api } from "@agentcut/core/common/api/client";
import type { StylePreset } from "@agentcut/core/modules/styles/types";

export function StylePickerDialog({
  open,
  projectId,
  onClose,
  onSelectStyle,
}: {
  open: boolean;
  projectId: string;
  onClose: () => void;
  onSelectStyle: (style: StylePreset) => void;
}) {
  const [styles, setStyles] = useState<StylePreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [adultEnabled, setAdultEnabled] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const savedNsfw = localStorage.getItem("agentcut_nsfw_enabled") === "true";
    setAdultEnabled(savedNsfw);
    try {
      const favs = JSON.parse(localStorage.getItem("agentcut_style_favorites") || "[]");
      setFavorites(favs);
    } catch {}
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.editorTool<StylePreset[]>(projectId, {
      tool: "styles.list",
      includeNsfw: adultEnabled,
    })
      .then((res) => setStyles(res || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, projectId, adultEnabled]);

  const toggleAdult = (enabled: boolean) => {
    setAdultEnabled(enabled);
    localStorage.setItem("agentcut_nsfw_enabled", enabled ? "true" : "false");
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(next);
    localStorage.setItem("agentcut_style_favorites", JSON.stringify(next));
  };

  const categories = useMemo(() => {
    const cats = [
      { id: "all", label: "All Styles", icon: Palette },
      { id: "favorites", label: "Favorites", icon: Star },
      { id: "Photography", label: "Photography", icon: Camera },
      { id: "Cinematic", label: "Cinematic", icon: Clapperboard },
      { id: "Art", label: "Art", icon: Palette },
      { id: "Illustration", label: "Illustration", icon: Brush },
      { id: "Animation", label: "Animation", icon: Sparkles },
      { id: "Fantasy", label: "Fantasy", icon: Flame },
      { id: "Sci Fi", label: "Sci Fi", icon: Compass },
      { id: "Horror", label: "Horror", icon: Skull },
      { id: "Vintage", label: "Vintage", icon: Camera },
      { id: "Adult", label: "Adult 18+", icon: ShieldAlert, isAdult: true },
    ];
    return cats;
  }, []);

  const filteredStyles = useMemo(() => {
    const q = search.toLowerCase().trim();
    return styles.filter((s) => {
      if (!adultEnabled && s.isNsfw) return false;
      if (activeCategory === "favorites") {
        if (!favorites.includes(s.id)) return false;
      } else if (activeCategory !== "all") {
        if (s.category.toLowerCase() !== activeCategory.toLowerCase()) return false;
      }
      if (q) {
        const text = `${s.name} ${s.desc} ${s.tags.join(" ")} ${s.prompt}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [styles, activeCategory, search, adultEnabled, favorites]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6 gap-4 bg-zinc-950 border border-white/10 text-white overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between gap-4 pb-2 border-b border-white/10">
          <div>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="size-5 text-amber-400" />
              Style Library & Prompt Builder
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Browse and apply visual style presets directly into your image & video prompts ({styles.length} styles available).
            </p>
          </div>
          <div className="flex items-center gap-2 pr-6">
            <Switch
              checked={adultEnabled}
              onCheckedChange={toggleAdult}
              label={adultEnabled ? "18+ Unlocked" : "18+ Locked"}
              about="Adult content filter"
            />
          </div>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search styles by keyword, film stock, lighting, or tags..."
              className="pl-9 bg-zinc-900 border-white/15 h-9 text-xs"
            />
          </div>
        </div>

        {/* Categories Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {categories.map((cat) => {
            if (cat.isAdult && !adultEnabled) return null;
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors border text-xs font-medium ${
                  isActive
                    ? "bg-amber-400/20 text-amber-300 border-amber-400/40"
                    : "bg-zinc-900/80 text-muted-foreground border-white/10 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <Icon className="size-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Styles Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-16 text-center text-xs text-muted-foreground">Loading styles...</div>
          ) : filteredStyles.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              No styles found matching &quot;{search}&quot;. Try a different category or search term.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredStyles.map((style) => {
                const isFav = favorites.includes(style.id);
                return (
                  <div
                    key={style.id}
                    onClick={() => {
                      onSelectStyle(style);
                      onClose();
                    }}
                    className={`group relative flex flex-col justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                      style.isNsfw
                        ? "bg-pink-950/20 border-pink-500/20 hover:border-pink-500/50 hover:bg-pink-950/30"
                        : "bg-zinc-900/60 border-white/10 hover:border-amber-400/50 hover:bg-zinc-900"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`size-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            style.isNsfw ? "bg-pink-500/20 text-pink-300 border border-pink-500/30" : "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                          }`}>
                            {style.name.slice(0, 1)}
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">
                              {style.name}
                            </h4>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                              {style.category} {style.isNsfw && "· 18+"}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(style.id, e)}
                          className="text-muted-foreground hover:text-amber-400 transition-colors p-1"
                        >
                          <Star className={`size-3.5 ${isFav ? "fill-amber-400 text-amber-400" : ""}`} />
                        </button>
                      </div>

                      <p className="mt-2 text-[11px] text-zinc-300 line-clamp-2 leading-relaxed">
                        {style.desc}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-1">
                        {style.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-muted-foreground border border-white/5"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-muted-foreground group-hover:text-amber-300">
                      <span>Click to apply</span>
                      <Check className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
