"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Blend, FolderUp, Search, Sparkles, Check, Film, Layers } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/common/ui/dialog";
import { Input } from "@/common/ui/input";
import { Button } from "@/common/ui/button";
import { api } from "@agentcut/core/common/api/client";
import type { TransitionPreset, TransitionImportResult } from "@agentcut/core/modules/transitions/types";

export function TransitionPickerDialog({
  open,
  projectId,
  onClose,
  onSelectTransition,
}: {
  open: boolean;
  projectId: string;
  onClose: () => void;
  onSelectTransition?: (preset: TransitionPreset) => void;
}) {
  const [transitions, setTransitions] = useState<TransitionPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshTransitions = () => {
    setLoading(true);
    api.editorTool<TransitionPreset[]>(projectId, {
      tool: "transitions.list",
    })
      .then((res) => setTransitions(res || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (open) refreshTransitions();
  }, [open, projectId]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    transitions.forEach((t) => cats.add(t.category));
    return ["all", ...Array.from(cats)];
  }, [transitions]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return transitions.filter((t) => {
      if (activeCategory !== "all" && t.category.toLowerCase() !== activeCategory.toLowerCase()) return false;
      if (q) {
        const text = `${t.name} ${t.bin} ${t.kind} ${t.description || ""}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [transitions, activeCategory, search]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus("Importing preset file...");
    try {
      const xml = await file.text();
      const res = await api.editorTool<TransitionImportResult>(projectId, {
        tool: "transitions.import",
        fileOrXml: xml,
        isXml: true,
      });
      setImportStatus(`Successfully imported ${res.totalImported} transitions!`);
      refreshTransitions();
    } catch (err) {
      setImportStatus(`Failed to import: ${(err as Error).message}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6 gap-4 bg-zinc-950 border border-white/10 text-white overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between gap-4 pb-2 border-b border-white/10">
          <div>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Blend className="size-5 text-indigo-400" />
              Transitions & Video Effects Library
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Browse cinematic Remotion &amp; Premiere transitions ({transitions.length} presets loaded).
            </p>
          </div>
          <div className="flex items-center gap-2 pr-6">
            <input
              type="file"
              ref={fileInputRef}
              accept=".prfpset,.xml"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs gap-1.5 border-white/20 hover:border-indigo-400/50"
            >
              <FolderUp className="size-3.5" />
              Import .prfpset
            </Button>
          </div>
        </DialogHeader>

        {importStatus && (
          <div className="text-xs px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-300">
            {importStatus}
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transitions by name (e.g. Zoom, Glitch, Wiggle, Offset, Stretch)..."
              className="pl-9 bg-zinc-900 border-white/15 h-9 text-xs"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors border text-xs font-medium capitalize ${
                activeCategory === cat
                  ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                  : "bg-zinc-900/80 text-muted-foreground border-white/10 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Layers className="size-3" />
              {cat === "all" ? "All Transitions" : cat}
            </button>
          ))}
        </div>

        {/* Transition Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-16 text-center text-xs text-muted-foreground">Loading transitions...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              No transitions found matching &quot;{search}&quot;.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (onSelectTransition) {
                      onSelectTransition(item);
                      onClose();
                    }
                  }}
                  className="group relative flex flex-col justify-between p-3.5 rounded-xl border border-white/10 bg-zinc-900/60 hover:border-indigo-400/50 hover:bg-zinc-900 transition-all cursor-pointer"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
                          <Blend className="size-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                            {item.name}
                          </h4>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            {item.bin} · {item.kind}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-zinc-400 line-clamp-2">
                      {item.description || `Preset transition of type ${item.kind}`}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-muted-foreground group-hover:text-indigo-300">
                    <span>Duration: {item.durationSec}s</span>
                    <Check className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
