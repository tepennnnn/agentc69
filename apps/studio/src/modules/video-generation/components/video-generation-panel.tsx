"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  CircleDollarSign,
  Eye,
  Loader2,
  RefreshCw,
  Sparkles,
  Square,
  TriangleAlert,
  Undo2,
  Wand2,
  Palette,
  Film,
  Image as ImageIcon,
  Layers,
  BookOpen,
  Trash2,
  Blend,
} from "lucide-react";
import { api, type AssetSummary } from "@agentcut/core/common/api/client";
import type { VideoGeneration, VideoGenerationConfig, VideoGenerationEstimate } from "@agentcut/core/modules/video-generation/types";
import type { ImageGenerationJob, StoryboardJob } from "@agentcut/core/modules/image-generation/types";
import type { StylePreset } from "@agentcut/core/modules/styles/types";
import { polishVideoPrompt } from "../lib/prompt-enhancer";
import { ImageInspectorDialog } from "@/modules/vision/components/image-inspector-dialog";
import { StylePickerDialog } from "@/modules/styles/components/style-picker-dialog";
import { TransitionPickerDialog } from "@/modules/editor/components/transition-picker-dialog";
import { Button } from "@/common/ui/button";
import { Input } from "@/common/ui/input";
import { Label } from "@/common/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/ui/select";
import { Textarea } from "@/common/ui/textarea";

const ACTIVE = new Set(["submitting", "queued", "generating", "downloading", "importing"]);

type PanelMode = "video" | "image" | "storyboard";

export function VideoGenerationPanel({
  projectId,
  assets,
  disabled,
  onImported,
  onUse,
}: {
  projectId: string;
  assets: AssetSummary[];
  disabled: boolean;
  onImported: () => Promise<void>;
  onUse: (mediaId: string) => void;
}) {
  const [panelMode, setPanelMode] = useState<PanelMode>("video");
  const [config, setConfig] = useState<VideoGenerationConfig | null>(null);
  const [jobs, setJobs] = useState<VideoGeneration[]>([]);
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [duration, setDuration] = useState("4");
  const [model, setModel] = useState("");
  const [mode, setMode] = useState<"text-to-video" | "image-to-video" | "reference-to-video">("text-to-video");
  const [seed, setSeed] = useState("");
  const [referenceAssetId, setReferenceAssetId] = useState("");
  const [estimate, setEstimate] = useState<VideoGenerationEstimate | null>(null);
  const [pending, setPending] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [originalPrompt, setOriginalPrompt] = useState<string | null>(null);

  // Dialog states
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [stylePickerOpen, setStylePickerOpen] = useState(false);
  const [transitionPickerOpen, setTransitionPickerOpen] = useState(false);
  const [error, setError] = useState("");

  // Image Generation States
  const [variantsCount, setVariantsCount] = useState<number>(2);
  const [imageJobs, setImageJobs] = useState<ImageGenerationJob[]>([]);

  // Storyboard States
  const [storyline, setStoryline] = useState("");
  const [sceneCount, setSceneCount] = useState<number>(4);
  const [storyboardJob, setStoryboardJob] = useState<StoryboardJob | null>(null);

  const imported = useRef(new Set<string>());
  const onImportedRef = useRef(onImported);
  useEffect(() => { onImportedRef.current = onImported; }, [onImported]);

  const refresh = useCallback(async () => {
    const [nextConfig, nextJobs] = await Promise.all([
      api.editorTool<VideoGenerationConfig>(projectId, { tool: "video.generation.config" }),
      api.editorTool<VideoGeneration[]>(projectId, { tool: "video.generations", refresh: true }),
    ]);
    setConfig(nextConfig);
    setJobs(nextJobs);
    const landed = nextJobs.filter(job => job.status === "ready" && job.outputMediaId && !imported.current.has(job.id));
    if (landed.length) {
      landed.forEach(job => imported.current.add(job.id));
      await onImportedRef.current();
    }
  }, [projectId]);

  useEffect(() => { void refresh().catch(e => setError(e.message)); }, [refresh]);
  const active = jobs.some(job => ACTIVE.has(job.status));
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => void refresh().catch(e => setError(e.message)), 4_000);
    return () => clearInterval(timer);
  }, [active, refresh]);

  const run = async (task: () => Promise<unknown>) => {
    if (pending) return;
    setPending(true); setError("");
    try { await task(); await refresh(); } catch (e) { setError((e as Error).message); }
    finally { setPending(false); }
  };

  const request = (estimateOnly = false) => ({
    tool: "video.generate", prompt: prompt.trim(), provider: "n8n", aspectRatio,
    durationSeconds: Number(duration || "4"), mode,
    ...(model.trim() ? { model: model.trim() } : {}),
    ...(seed ? { seed: Number(seed) } : {}),
    ...(referenceAssetId ? { referenceAssetIds: [referenceAssetId], ...(mode === "image-to-video" ? { startFrameAssetId: referenceAssetId } : {}) } : {}),
    enhancePrompt: true, estimateOnly, autoPlace: false,
  });

  const generate = () => run(() => api.editorTool(projectId, request(false)));

  const estimateRequest = async () => {
    if (pending || !prompt.trim()) return;
    setPending(true); setError("");
    try { setEstimate(await api.editorTool<VideoGenerationEstimate>(projectId, request(true))); }
    catch (e) { setError((e as Error).message); }
    finally { setPending(false); }
  };

  const handleGenerateImages = async () => {
    if (!prompt.trim() || pending) return;
    setPending(true);
    setError("");
    try {
      const res = await api.editorTool<ImageGenerationJob>(projectId, {
        tool: "image.generate",
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim() || undefined,
        aspectRatio,
        variantsCount,
        referenceAssetIds: referenceAssetId ? [referenceAssetId] : [],
      });
      setImageJobs((prev) => [res, ...prev]);
      await onImportedRef.current();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  };

  const handleGenerateStoryboard = async () => {
    if (!storyline.trim() || pending) return;
    setPending(true);
    setError("");
    try {
      const res = await api.editorTool<StoryboardJob>(projectId, {
        tool: "storyboard.generate",
        storyline: storyline.trim(),
        sceneCount,
        aspectRatio,
      });
      setStoryboardJob(res);
      await onImportedRef.current();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  };

  const handleRegenerateScene = async (sceneNumber: number) => {
    if (!storyboardJob || pending) return;
    setPending(true);
    try {
      const res = await api.editorTool<StoryboardJob>(projectId, {
        tool: "storyboard.regenerateScene",
        storyboardId: storyboardJob.id,
        sceneNumber,
      });
      setStoryboardJob(res);
      await onImportedRef.current();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm("Remove this asset from project?")) return;
    try {
      await api.editorTool(projectId, {
        tool: "assets.delete",
        id: assetId,
      });
      await onImportedRef.current();
      setImageJobs((prev) =>
        prev.map((j) => ({
          ...j,
          variants: j.variants.filter((v) => v.assetId !== assetId),
        }))
      );
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleApplyStyle = (style: StylePreset) => {
    const current = panelMode === "storyboard" ? storyline : prompt;
    const next = current.trim() ? `${current.trim()}, ${style.prompt}` : style.prompt;
    if (panelMode === "storyboard") setStoryline(next);
    else {
      setOriginalPrompt(prompt);
      setPrompt(next);
    }
  };

  const polish = async () => {
    const raw = prompt.trim();
    if (!raw || polishing) return;
    setPolishing(true);
    setError("");
    try {
      let polished = "";
      try {
        const res = await fetch("/api/video-generation/polish", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ prompt: raw, aspectRatio, durationSeconds: Number(duration || "4") }),
        });
        if (res.ok) {
          const data = await res.json();
          polished = data.polished;
        }
      } catch {}
      if (!polished) {
        polished = polishVideoPrompt(raw, { aspectRatio, durationSeconds: Number(duration || "4") });
      }
      if (polished && polished !== prompt) {
        setOriginalPrompt(prompt);
        setPrompt(polished);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPolishing(false);
    }
  };

  if (config && !config.configured && panelMode === "video") {
    return (
      <div className="space-y-3 pt-3 text-xs text-muted-foreground">
        <div className="rounded-2xl border border-dashed border-white/15 p-4">
          <p className="font-medium text-foreground">Connect your n8n video workflow</p>
          <p className="mt-1 leading-relaxed">
            Add the submit and status webhooks, output host, and bearer token under This machine. Agent Cut will send prompts to n8n and import completed videos here.
          </p>
          <Button className="mt-3" size="sm" variant="outline" nativeButton={false} render={<Link href="/settings/machine" />}>
            Open settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Unified Mode Selector */}
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-zinc-900/90 p-1 border border-white/10 text-xs">
        <button
          type="button"
          onClick={() => setPanelMode("video")}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition-colors ${
            panelMode === "video" ? "bg-amber-400 text-zinc-950 shadow-sm" : "text-muted-foreground hover:text-white"
          }`}
        >
          <Film className="size-3.5" />
          Video
        </button>
        <button
          type="button"
          onClick={() => setPanelMode("image")}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition-colors ${
            panelMode === "image" ? "bg-amber-400 text-zinc-950 shadow-sm" : "text-muted-foreground hover:text-white"
          }`}
        >
          <ImageIcon className="size-3.5" />
          Images
        </button>
        <button
          type="button"
          onClick={() => setPanelMode("storyboard")}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition-colors ${
            panelMode === "storyboard" ? "bg-amber-400 text-zinc-950 shadow-sm" : "text-muted-foreground hover:text-white"
          }`}
        >
          <BookOpen className="size-3.5" />
          Storyboard
        </button>
      </div>

      {/* Global Quick Action Bar: Style Library & Transitions */}
      <div className="flex items-center justify-between gap-1 border-b border-white/10 pb-2">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="h-6 gap-1 px-2 text-[11px] font-medium text-amber-300 hover:text-amber-200 hover:bg-amber-400/10 border border-amber-400/20"
            onClick={() => setStylePickerOpen(true)}
            title="Browse 129 styles (including unlocked 18+)"
          >
            <Palette className="size-3 text-amber-400" />
            Style Library
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="h-6 gap-1 px-2 text-[11px] font-medium text-indigo-300 hover:text-indigo-200 hover:bg-indigo-400/10 border border-indigo-400/20"
            onClick={() => setTransitionPickerOpen(true)}
            title="Browse & import transitions (.prfpset)"
          >
            <Blend className="size-3 text-indigo-400" />
            Transitions
          </Button>
        </div>
        {panelMode !== "storyboard" && (
          <div className="flex items-center gap-1">
            {originalPrompt && originalPrompt !== prompt && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="h-6 gap-1 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setPrompt(originalPrompt);
                  setOriginalPrompt(null);
                }}
              >
                <Undo2 className="size-3" />
                Undo
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="h-6 gap-1 px-2 text-[11px] font-medium text-amber-300 hover:text-amber-200 hover:bg-amber-400/10 border border-amber-400/20"
              disabled={disabled || pending}
              onClick={() => setInspectorOpen(true)}
            >
              <Eye className="size-3 text-amber-400" />
              Inspect image
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="h-6 gap-1 px-2 text-[11px] font-medium text-amber-300 hover:text-amber-200 hover:bg-amber-400/10 border border-amber-400/20"
              disabled={disabled || pending || polishing || !prompt.trim()}
              onClick={() => void polish()}
            >
              {polishing ? <Loader2 className="size-3 motion-safe:animate-spin" /> : <Wand2 className="size-3 text-amber-400" />}
              Polish
            </Button>
          </div>
        )}
      </div>

      {/* MODE 1: VIDEO GENERATION */}
      {panelMode === "video" && (
        <form className="space-y-3" onSubmit={e => { e.preventDefault(); if (prompt.trim()) void generate(); }}>
          <div className="space-y-1.5">
            <Label htmlFor="generation-prompt">Describe the shot</Label>
            <Textarea
              id="generation-prompt"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              maxLength={4000}
              rows={4}
              placeholder="A cinematic tracking shot through…"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Shape</Label>
              <Select value={aspectRatio} onValueChange={v => setAspectRatio(String(v) as typeof aspectRatio)}>
                <SelectTrigger aria-label="Video shape"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">Landscape 16:9</SelectItem>
                  <SelectItem value="9:16">Vertical 9:16</SelectItem>
                  <SelectItem value="1:1">Square 1:1</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="generation-duration">Seconds</Label>
              <Input id="generation-duration" type="number" min={1} max={60} value={duration} onChange={e => setDuration(e.target.value)} placeholder="4" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Mode</Label>
              <Select value={mode} onValueChange={value => setMode(String(value) as typeof mode)}>
                <SelectTrigger aria-label="Generation mode"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text-to-video">Text to video</SelectItem>
                  <SelectItem value="image-to-video">Image to video</SelectItem>
                  <SelectItem value="reference-to-video">Reference guided</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="generation-model">Model</Label>
              <Input id="generation-model" value={model} onChange={event => setModel(event.target.value)} placeholder="Workflow default" maxLength={200} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1.5 text-xs">
              <span>Reference image</span>
              <select
                aria-label="Reference image"
                value={referenceAssetId}
                onChange={event => setReferenceAssetId(event.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-background px-2 text-xs"
              >
                <option value="">None</option>
                {assets.filter(asset => asset.kind === "image").map(asset => (
                  <option key={asset.id} value={asset.id}>{asset.name}</option>
                ))}
              </select>
            </label>
            <div className="space-y-1.5">
              <Label htmlFor="generation-seed">Seed</Label>
              <Input id="generation-seed" type="number" min={0} max={2147483647} value={seed} onChange={event => setSeed(event.target.value)} placeholder="Random" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" disabled={disabled || pending || !prompt.trim()} onClick={() => void estimateRequest()}>
              <CircleDollarSign />Estimate
            </Button>
            <Button type="submit" disabled={disabled || pending || !prompt.trim()}>
              {pending ? <Loader2 className="motion-safe:animate-spin" /> : <Sparkles />}Generate video
            </Button>
          </div>
          {estimate && (
            <p className="text-[11px] text-muted-foreground">
              Estimated cost: {estimate.estimatedCostUsd === null ? "not configured" : `$${estimate.estimatedCostUsd.toFixed(2)}`} · {estimate.provider}
            </p>
          )}
        </form>
      )}

      {/* MODE 2: IMAGE GENERATION */}
      {panelMode === "image" && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="image-prompt">Image Prompt</Label>
            <Textarea
              id="image-prompt"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              maxLength={4000}
              rows={4}
              placeholder="Describe the image in detail, lighting, subject, atmosphere..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="image-neg-prompt" className="text-muted-foreground text-[11px]">Negative Prompt (Optional)</Label>
            <Input
              id="image-neg-prompt"
              value={negativePrompt}
              onChange={e => setNegativePrompt(e.target.value)}
              placeholder="blurry, distorted, oversaturated, text, watermark..."
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Variants Count</Label>
              <div className="flex rounded-lg border border-border p-1 gap-1 bg-zinc-900">
                {[1, 2, 3, 4].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setVariantsCount(n)}
                    className={`flex-1 py-1 rounded text-xs font-semibold ${
                      variantsCount === n ? "bg-amber-400 text-black" : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Aspect Ratio</Label>
              <Select value={aspectRatio} onValueChange={v => setAspectRatio(String(v) as typeof aspectRatio)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">Landscape 16:9</SelectItem>
                  <SelectItem value="9:16">Vertical 9:16</SelectItem>
                  <SelectItem value="1:1">Square 1:1</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            type="button"
            className="w-full"
            disabled={disabled || pending || !prompt.trim()}
            onClick={() => void handleGenerateImages()}
          >
            {pending ? <Loader2 className="motion-safe:animate-spin" /> : <Sparkles />}
            Generate {variantsCount} Image Variant{variantsCount > 1 ? "s" : ""}
          </Button>

          {/* Generated Images Gallery */}
          {imageJobs.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-medium">Generated Image Gallery</p>
              <div className="grid grid-cols-2 gap-2">
                {imageJobs.flatMap(j => j.variants).map((variant) => (
                  <div key={variant.id} className="group relative rounded-xl border border-white/10 bg-black/40 p-2 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={variant.url} alt={variant.prompt} className="w-full rounded-lg object-cover aspect-video bg-zinc-900" />
                    <p className="mt-1 text-[10px] text-muted-foreground line-clamp-1">{variant.prompt}</p>
                    <div className="mt-2 flex items-center justify-between gap-1">
                      {variant.assetId && (
                        <Button size="xs" variant="outline" className="text-[10px] h-6 flex-1" onClick={() => onUse(variant.assetId!)}>
                          Add to video
                        </Button>
                      )}
                      {variant.assetId && (
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          className="h-6 w-6 text-destructive hover:bg-destructive/20"
                          onClick={() => void handleDeleteAsset(variant.assetId!)}
                          title="Remove this asset"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 3: STORYBOARD / SEQUENTIAL GENERATION */}
      {panelMode === "storyboard" && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="storyline-input">Narrative Storyline Prompt</Label>
            <Textarea
              id="storyline-input"
              value={storyline}
              onChange={e => setStoryline(e.target.value)}
              rows={5}
              placeholder="Enter your complete storyline (e.g. A detective walks through an abandoned city at night, discovers a mysterious building, enters the building, and finds an ancient artifact.)"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Scene Count</Label>
              <Select value={String(sceneCount)} onValueChange={v => setSceneCount(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Scenes</SelectItem>
                  <SelectItem value="4">4 Scenes (Standard)</SelectItem>
                  <SelectItem value="5">5 Scenes</SelectItem>
                  <SelectItem value="6">6 Scenes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Shape</Label>
              <Select value={aspectRatio} onValueChange={v => setAspectRatio(String(v) as typeof aspectRatio)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">Landscape 16:9</SelectItem>
                  <SelectItem value="9:16">Vertical 9:16</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            type="button"
            className="w-full"
            disabled={disabled || pending || !storyline.trim()}
            onClick={() => void handleGenerateStoryboard()}
          >
            {pending ? <Loader2 className="motion-safe:animate-spin" /> : <BookOpen />}
            Decompose &amp; Generate {sceneCount} Storyboard Scenes
          </Button>

          {/* Storyboard Scenes List */}
          {storyboardJob && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-medium">Storyboard Scenes ({storyboardJob.scenes.length})</p>
              <div className="space-y-2">
                {storyboardJob.scenes.map((scene) => (
                  <div key={scene.sceneNumber} className="rounded-xl border border-white/10 bg-zinc-900/60 p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-amber-300">Scene {scene.sceneNumber}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{scene.cameraAngle}</span>
                    </div>
                    {scene.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={scene.imageUrl} alt={scene.title} className="w-full rounded-lg object-cover aspect-video bg-zinc-950" />
                    )}
                    <p className="text-[11px] text-zinc-300">{scene.description}</p>
                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-white/5">
                      <div className="flex items-center gap-1">
                        <Button
                          size="xs"
                          variant="outline"
                          disabled={pending}
                          onClick={() => void handleRegenerateScene(scene.sceneNumber)}
                          className="text-[10px] h-6"
                        >
                          <RefreshCw className="size-2.5 mr-1" />
                          Regen scene
                        </Button>
                        {scene.assetId && (
                          <Button size="xs" className="text-[10px] h-6" onClick={() => onUse(scene.assetId!)}>
                            Add to video
                          </Button>
                        )}
                      </div>
                      {scene.assetId && (
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          className="h-6 w-6 text-destructive hover:bg-destructive/20"
                          onClick={() => void handleDeleteAsset(scene.assetId!)}
                          title="Remove scene asset"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Video Generation Requests List */}
      {panelMode === "video" && (
        <>
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs font-medium">Video Requests</p>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Refresh requests" onClick={() => void refresh()}>
              <RefreshCw />
            </Button>
          </div>
          <ul className="space-y-2">
            {jobs.map(job => (
              <li key={job.id} className="space-y-2 rounded-2xl border border-white/10 bg-black/15 p-3">
                <div className="flex items-start gap-2">
                  {job.status === "ready" ? (
                    <Check className="mt-0.5 size-4 text-emerald-400" />
                  ) : job.status === "failed" ? (
                    <TriangleAlert className="mt-0.5 size-4 text-destructive" />
                  ) : ACTIVE.has(job.status) ? (
                    <Loader2 className="mt-0.5 size-4 motion-safe:animate-spin" />
                  ) : (
                    <Square className="mt-0.5 size-4" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs text-foreground">{job.request.prompt}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{job.stage}</p>
                  </div>
                </div>
                {ACTIVE.has(job.status) && (
                  <div className="h-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full bg-primary transition-[width]" style={{ width: `${Math.max(4, job.progress * 100)}%` }} />
                  </div>
                )}
                {job.error && <p className="text-[11px] text-destructive">{job.error}</p>}
                <p className="text-[10px] text-muted-foreground">
                  {job.provider}{job.model ? ` / ${job.model}` : ""}{job.provenance.seed === null ? "" : ` · seed ${job.provenance.seed}`}
                </p>
                <div className="flex flex-wrap gap-1">
                  {job.status === "ready" && job.outputMediaId && (
                    <Button size="xs" onClick={() => onUse(job.outputMediaId!)}>Add to video</Button>
                  )}
                  {(job.status === "failed" || job.status === "cancelled") && (
                    <Button size="xs" variant="outline" disabled={pending} onClick={() => void run(() => api.editorTool(projectId, { tool: "video.generation.retry", id: job.id }))}>
                      Retry
                    </Button>
                  )}
                  {ACTIVE.has(job.status) && (
                    <Button size="xs" variant="ghost" disabled={pending} onClick={() => void run(() => api.editorTool(projectId, { tool: "video.generation.cancel", id: job.id }))}>
                      Cancel
                    </Button>
                  )}
                </div>
              </li>
            ))}
            {!jobs.length && <li className="text-xs text-muted-foreground">Your generated videos will appear here.</li>}
          </ul>
        </>
      )}

      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}

      {/* Dialogs */}
      <ImageInspectorDialog
        open={inspectorOpen}
        projectId={projectId}
        assets={assets}
        initialAssetId={referenceAssetId}
        onClose={() => setInspectorOpen(false)}
        onApplyPrompt={(newPrompt) => {
          setOriginalPrompt(prompt);
          setPrompt(newPrompt);
        }}
      />

      <StylePickerDialog
        open={stylePickerOpen}
        projectId={projectId}
        onClose={() => setStylePickerOpen(false)}
        onSelectStyle={handleApplyStyle}
      />

      <TransitionPickerDialog
        open={transitionPickerOpen}
        projectId={projectId}
        onClose={() => setTransitionPickerOpen(false)}
      />
    </div>
  );
}
