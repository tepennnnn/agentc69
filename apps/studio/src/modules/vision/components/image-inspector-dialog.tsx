"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp, Copy, Eye, Loader2, Sparkles, Upload, Wand2, X } from "lucide-react";
import { api, type AssetSummary } from "@agentcut/core/common/api/client";
import type { ImageInspectResult } from "@agentcut/core/modules/vision/types";
import { DEFAULT_IMAGE_ANALYZER_PROMPT } from "@agentcut/core/modules/vision/lib/default-template";
import { Button } from "@/common/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/common/ui/dialog";
import { Label } from "@/common/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/ui/select";
import { Textarea } from "@/common/ui/textarea";

const TARGET_MODELS = [
  { id: "google-veo", label: "Google Veo / Flow" },
  { id: "kling-2.1", label: "Kling AI 2.1" },
  { id: "runway-gen3", label: "Runway Gen-3 / Gen-4" },
  { id: "wan2", label: "WAN 2.1 / 2.2" },
  { id: "sora-2", label: "Sora 2" },
  { id: "flux", label: "FLUX.1 (Dev / Schnell / Pro)" },
  { id: "midjourney", label: "Midjourney v6" },
  { id: "sdxl", label: "Stable Diffusion XL" },
];

export function ImageInspectorDialog({
  open,
  projectId,
  assets,
  initialAssetId,
  onClose,
  onApplyPrompt,
}: {
  open: boolean;
  projectId: string;
  assets: AssetSummary[];
  initialAssetId?: string;
  onClose: () => void;
  onApplyPrompt: (prompt: string) => void;
}) {
  const [selectedAssetId, setSelectedAssetId] = useState(initialAssetId || "");
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [harness, setHarness] = useState("antigravity");
  const [target, setTarget] = useState("google-veo");
  const [energy, setEnergy] = useState<"viral-hook" | "balanced" | "subtle">("viral-hook");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ImageInspectResult | null>(null);
  const [copiedPos, setCopiedPos] = useState(false);
  const [copiedNeg, setCopiedNeg] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [customTemplate, setCustomTemplate] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialAssetId) {
      setSelectedAssetId(initialAssetId);
      setUploadedBase64(null);
    }
  }, [initialAssetId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxSide = 2048;
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;
        if (width > maxSide || height > maxSide) {
          if (width >= height) {
            height = Math.round((height * maxSide) / width);
            width = maxSide;
          } else {
            width = Math.round((width * maxSide) / height);
            height = maxSide;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/png");
        setUploadedBase64(dataUrl);
        setSelectedAssetId("");
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleInspect = async () => {
    if (!uploadedBase64 && !selectedAssetId) {
      setError("Please select a project image or upload one to inspect.");
      return;
    }
    setAnalyzing(true);
    setError("");
    setCopiedPos(false);
    setCopiedNeg(false);

    try {
      const inspectRes = await api.editorTool<ImageInspectResult>(projectId, {
        tool: "image.inspect",
        ...(uploadedBase64 ? { base64: uploadedBase64 } : { assetId: selectedAssetId }),
        target,
        energy,
        harness,
        ...(customTemplate.trim() ? { customTemplate: customTemplate.trim() } : {}),
      });
      setResult(inspectRes);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAnalyzing(false);
    }
  };

  const copyToClipboard = async (text: string, isNegative = false) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      if (isNegative) {
        setCopiedNeg(true);
        setTimeout(() => setCopiedNeg(false), 2000);
      } else {
        setCopiedPos(true);
        setTimeout(() => setCopiedPos(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  const imageAssets = assets.filter((a) => a.kind === "image");

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-amber-400" />
            Image-to-Video Prompt Analyzer
          </DialogTitle>
          <DialogDescription className="text-xs">
            Analyze any reference image using AgentCut&apos;s AI agent to generate high-retention cinematic video prompts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Source Selection */}
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Project Image</Label>
              <select
                aria-label="Select project image"
                value={selectedAssetId}
                onChange={(e) => {
                  setSelectedAssetId(e.target.value);
                  setUploadedBase64(null);
                }}
                className="h-9 w-full rounded-xl border border-border bg-background px-2 text-xs"
              >
                <option value="">Choose an asset…</option>
                {imageAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Or Upload New Image</Label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="image-inspector-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-xs"
                  onClick={() => document.getElementById("image-inspector-upload")?.click()}
                >
                  <Upload className="size-3.5" />
                  {uploadedBase64 ? "Change Image" : "Upload Image"}
                </Button>
              </div>
            </div>
          </div>

          {/* Engine, Model, and Energy Controls */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">AI Vision Engine</Label>
              <Select value={harness} onValueChange={(val) => setHarness(String(val))}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="antigravity" className="text-xs">Antigravity (Gemini)</SelectItem>
                  <SelectItem value="claude" className="text-xs">Claude Code</SelectItem>
                  <SelectItem value="codex" className="text-xs">Codex</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Target Model</Label>
              <Select value={target} onValueChange={(val) => setTarget(String(val))}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-xs">
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Pacing / Energy</Label>
              <Select value={energy} onValueChange={(val) => setEnergy(val as typeof energy)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viral-hook" className="text-xs">Viral Hook (0-3s)</SelectItem>
                  <SelectItem value="balanced" className="text-xs">Balanced Action</SelectItem>
                  <SelectItem value="subtle" className="text-xs">Subtle Cinematic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Collapsible System Template Editor */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
            <button
              type="button"
              className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setShowTemplate(!showTemplate)}
            >
              <span>Customize Instruction Template</span>
              {showTemplate ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>
            {showTemplate && (
              <div className="mt-2.5 space-y-2">
                <Textarea
                  value={customTemplate || DEFAULT_IMAGE_ANALYZER_PROMPT}
                  onChange={(e) => setCustomTemplate(e.target.value)}
                  rows={8}
                  className="font-mono text-[11px] leading-relaxed"
                  placeholder="Custom instruction prompt…"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setCustomTemplate("")}
                  >
                    Reset to Default
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <Button
            type="button"
            className="w-full gap-2 text-xs font-semibold"
            disabled={analyzing || (!uploadedBase64 && !selectedAssetId)}
            onClick={handleInspect}
          >
            {analyzing ? (
              <>
                <Loader2 className="size-3.5 motion-safe:animate-spin" />
                Analyzing Image with AI Agent…
              </>
            ) : (
              <>
                <Eye className="size-3.5" />
                Analyze Reference Image
              </>
            )}
          </Button>

          {error && <p className="text-xs text-destructive">{error}</p>}

          {/* Results Area */}
          {result && (
            <div className="space-y-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.03] p-3">
              {/* Positive Prompt with Copy Button */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-amber-300">Positive Video Prompt</Label>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      className="h-6 gap-1 px-2 text-[11px]"
                      onClick={() => copyToClipboard(result.positivePrompt, false)}
                    >
                      {copiedPos ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                      {copiedPos ? "Copied!" : "Copy Prompt"}
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      className="h-6 gap-1 px-2 text-[11px] bg-amber-400 text-black hover:bg-amber-300 font-semibold"
                      onClick={() => {
                        onApplyPrompt(result.positivePrompt);
                        onClose();
                      }}
                    >
                      <Wand2 className="size-3" />
                      Use in Shot
                    </Button>
                  </div>
                </div>
                <Textarea
                  readOnly
                  value={result.positivePrompt}
                  rows={4}
                  className="bg-black/40 text-xs leading-relaxed"
                />
              </div>

              {/* Negative Prompt with Copy Button */}
              {result.negativePrompt && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Negative Prompt</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="h-5 gap-1 px-1.5 text-[10px]"
                      onClick={() => copyToClipboard(result.negativePrompt, true)}
                    >
                      {copiedNeg ? <Check className="size-2.5 text-emerald-400" /> : <Copy className="size-2.5" />}
                      {copiedNeg ? "Copied" : "Copy"}
                    </Button>
                  </div>
                  <Textarea
                    readOnly
                    value={result.negativePrompt}
                    rows={2}
                    className="bg-black/30 text-[11px] text-muted-foreground"
                  />
                </div>
              )}

              {/* Image Description Collapsible */}
              {result.imageDescription && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer font-medium hover:text-foreground">
                    View Visual Scene Breakdown
                  </summary>
                  <p className="mt-1.5 whitespace-pre-wrap rounded-lg bg-black/20 p-2 text-[11px] leading-relaxed">
                    {result.imageDescription}
                  </p>
                </details>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
