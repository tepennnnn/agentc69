"use client";

import { useId, useRef, useState } from "react";
import { AudioLines, CheckCircle2, CircleAlert, HardDrive, Loader2, Mic2, Plus, Settings2, Sparkles, Upload } from "lucide-react";
import { assetFileUrl, type AssetSummary } from "@agentcut/core/common/api/client";
import { ingestFiles } from "@agentcut/core/common/api/ingest";
import type { VoiceoverSettings } from "@agentcut/core/modules/voiceover/types";
import { Button } from "@/common/ui/button";
import { Disclosure } from "@/common/ui/disclosure";
import { Input } from "@/common/ui/input";
import { Textarea } from "@/common/ui/textarea";
import { useVoiceover } from "../hooks";

export function VoiceoverPanel({ projectId, assets, onGenerated, onPlace, canPlace }: {
  projectId: string;
  assets: AssetSummary[];
  onGenerated: () => Promise<void>;
  onPlace: (asset: AssetSummary, mode?: "music" | "sfx") => void;
  canPlace: boolean;
}) {
  const id = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voiceover = useVoiceover(projectId, onGenerated);
  const { status, settings, setSettings, result, pending, error, notice } = voiceover;
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [reference, setReference] = useState("");
  const [isCloning, setIsCloning] = useState(false);
  const [uploadingSample, setUploadingSample] = useState(false);
  const [placed, setPlaced] = useState(false);
  
  const references = assets.filter(asset => asset.kind === "audio" && (asset.duration_sec ?? 0) >= 5.1 && (asset.duration_sec ?? 0) <= 30);

  const handleUploadSample = async (files: File[]) => {
    if (!files.length) return;
    setUploadingSample(true);
    try {
      const imported = await ingestFiles(files, { projectId });
      await onGenerated();
      const audio = imported.find(a => a.kind === "audio" && a.asset);
      if (audio?.asset) {
        setIsCloning(true);
        setReference(audio.asset.id);
      }
    } catch (e) {
      console.error("Failed to upload voice sample:", e);
    } finally {
      setUploadingSample(false);
    }
  };

  return <section className="space-y-4 pt-2" aria-label="Chatterbox voice-over" aria-busy={!!pending}>
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Mic2 aria-hidden className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">Chatterbox voice-over & cloning</h3>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">Turn your script into narration or clone a custom voice offline on this computer.</p>
      <p role="status" className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
        {!status && !error && <Loader2 aria-hidden className="mt-0.5 size-3 shrink-0 motion-safe:animate-spin" />}
        {status?.ready && <CheckCircle2 aria-hidden className="mt-0.5 size-3 shrink-0 text-primary" />}
        {status && !status.ready && <CircleAlert aria-hidden className="mt-0.5 size-3 shrink-0" />}
        <span>{status?.message ?? (error ? "Local runtime could not be checked." : "Checking local speech runtime…")}</span>
      </p>
      {status?.ready && <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><HardDrive aria-hidden className="size-3" />Local {status.settings.model === "nano" ? "Nano" : "Turbo"} · {status.settings.device === "auto" ? (status.runtime?.cudaAvailable ? "GPU" : "CPU") : status.settings.device.toUpperCase()}</p>}
    </div>

    {/* Voice Mode Selector: Default Voice vs Voice Cloning */}
    <div className="flex gap-1 rounded-xl bg-white/5 p-1 text-xs">
      <Button
        type="button"
        variant={!isCloning ? "secondary" : "ghost"}
        size="xs"
        className="flex-1 text-xs"
        onClick={() => { setIsCloning(false); setReference(""); }}
      >
        <Mic2 className="size-3.5 mr-1" />
        Default Voice
      </Button>
      <Button
        type="button"
        variant={isCloning ? "secondary" : "ghost"}
        size="xs"
        className="flex-1 text-xs"
        onClick={() => {
          setIsCloning(true);
          if (!reference && references.length) setReference(references[0].id);
        }}
      >
        <AudioLines className="size-3.5 mr-1" />
        Voice Cloning
      </Button>
    </div>

    <input
      ref={fileInputRef}
      type="file"
      accept="audio/*,.wav,.mp3,.m4a,.flac,.ogg"
      className="hidden"
      onChange={e => {
        const files = Array.from(e.target.files ?? []);
        e.target.value = "";
        if (files.length) void handleUploadSample(files);
      }}
    />

    <form className="space-y-3" onSubmit={event => {
      event.preventDefault(); setPlaced(false);
      void voiceover.generate({ text: text.trim(), ...(name.trim() ? { name: name.trim() } : {}), ...(isCloning && reference ? { referenceAssetId: reference } : {}) });
    }}>
      <fieldset className="space-y-3" disabled={!!pending}>
        <label className="block space-y-1.5 text-xs" htmlFor={`${id}-name`}>
          <span>Narration name <span className="text-muted-foreground">(optional)</span></span>
          <Input id={`${id}-name`} maxLength={160} value={name} onChange={event => setName(event.target.value)} placeholder={isCloning ? "Cloned voice narration" : "Opening narration"} />
        </label>
        
        <div className="space-y-1.5">
          <label className="text-xs" htmlFor={`${id}-script`}>Script</label>
          <Textarea id={`${id}-script`} required maxLength={10000} value={text} onChange={event => setText(event.target.value)} rows={6} className="min-h-32 resize-y text-xs" placeholder="Write the words you want spoken…" aria-describedby={`${id}-script-help`} />
          <p id={`${id}-script-help`} className="text-[10px] text-muted-foreground">English · {text.length.toLocaleString()} / 10,000 characters</p>
        </div>

        {isCloning ? (
          <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-amber-400" />
                Voice Reference Sample
              </span>
              <Button
                type="button"
                variant="outline"
                size="xs"
                disabled={uploadingSample}
                onClick={() => fileInputRef.current?.click()}
                className="h-6 text-[10px]"
              >
                {uploadingSample ? <Loader2 className="size-3 motion-safe:animate-spin" /> : <Upload className="size-3 mr-1" />}
                Upload sample
              </Button>
            </div>

            <select
              id={`${id}-voice`}
              value={reference}
              onChange={event => setReference(event.target.value)}
              className="h-9 w-full min-w-0 rounded-xl border border-border bg-background px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {references.length === 0 ? (
                <option value="">No audio reference imported (5.1–30s required)</option>
              ) : (
                references.map(asset => (
                  <option value={asset.id} key={asset.id}>
                    {asset.name} ({asset.duration_sec?.toFixed(1)}s)
                  </option>
                ))
              )}
            </select>
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Provide 5.1–30 seconds of clean speech. Upload above or import into Assets.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/5 bg-white/3 px-3 py-2 text-xs text-muted-foreground">
            Using built-in Chatterbox voice. Switch to <strong>Voice Cloning</strong> above to use a custom speaker sample.
          </div>
        )}

        <Button
          className="w-full"
          type="submit"
          size="sm"
          disabled={!status?.ready || !text.trim() || !!pending || (isCloning && !reference)}
        >
          {pending === "generate" ? (
            <Loader2 aria-hidden className="size-3.5 motion-safe:animate-spin" />
          ) : (
            <Mic2 aria-hidden className="size-3.5" />
          )}
          {pending === "generate"
            ? (isCloning ? "Cloning voice…" : "Generating narration…")
            : (isCloning ? "Clone voice & generate" : "Generate narration")}
        </Button>
      </fieldset>
    </form>

    {pending === "generate" && <p role="status" className="text-xs leading-relaxed text-muted-foreground">Chatterbox is speaking your script. Longer scripts can take several minutes. Keep this editor open.</p>}
    {error && <p role="alert" className="break-words text-xs text-destructive">{error}</p>}
    {error && !status && <Button size="sm" variant="outline" type="button" onClick={voiceover.refreshStatus}>Check runtime again</Button>}
    {notice && <p role="status" className="text-xs leading-relaxed text-muted-foreground">{notice}</p>}
    {result && <div className="space-y-3 rounded-2xl border border-white/10 bg-black/15 p-3">
      <div className="space-y-1">
        <p className="break-words text-xs font-medium">{result.asset.name}</p>
        <p className="text-[10px] text-muted-foreground">{result.durationSec.toFixed(1)} seconds · Chatterbox {result.provenance.referenceAssetId ? "(Cloned)" : "(Built-in)"}</p>
      </div>
      <audio className="h-9 w-full" controls preload="none" src={assetFileUrl(result.asset.id)} aria-label={`Preview ${result.asset.name}`} />
      <Button size="sm" variant="outline" className="w-full" disabled={!!pending || !canPlace} onClick={() => { onPlace(result.asset, "music"); setPlaced(true); }}><Plus aria-hidden className="size-3.5" />{placed ? "Add another at playhead" : "Add at playhead"}</Button>
      {placed && <p role="status" className="text-[10px] text-muted-foreground">Added to the timeline. You can trim or move the narration there.</p>}
    </div>}

    {settings && <Disclosure variant="plain" summary={<span className="inline-flex items-center gap-1.5"><Settings2 aria-hidden className="size-3" />Local speech setup</span>}>
      <fieldset disabled={!!pending} className="space-y-3 pt-2">
        <p className="text-[11px] leading-relaxed text-muted-foreground">Choose an installed Chatterbox runtime and local model files. Saving checks the installation.</p>
        <label className="block space-y-1.5 text-xs" htmlFor={`${id}-python`}><span>Python interpreter</span><Input id={`${id}-python`} value={settings.pythonPath} onChange={event => setSettings({ ...settings, pythonPath: event.target.value })} placeholder="C:\\…\\Scripts\\python.exe" className="text-xs" spellCheck={false} /></label>
        <label className="block space-y-1.5 text-xs" htmlFor={`${id}-models`}><span>Model folder</span><Input id={`${id}-models`} value={settings.modelDir} onChange={event => setSettings({ ...settings, modelDir: event.target.value })} className="text-xs" spellCheck={false} /></label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block space-y-1.5 text-xs" htmlFor={`${id}-model`}><span>Model</span><select id={`${id}-model`} value={settings.model} onChange={event => setSettings({ ...settings, model: event.target.value as VoiceoverSettings["model"] })} className="h-9 w-full rounded-xl border border-border bg-background px-2 text-xs focus-visible:ring-2 focus-visible:ring-ring"><option value="nano">Nano</option><option value="turbo">Turbo</option></select></label>
          <label className="block space-y-1.5 text-xs" htmlFor={`${id}-device`}><span>Device</span><select id={`${id}-device`} value={settings.device} onChange={event => setSettings({ ...settings, device: event.target.value as VoiceoverSettings["device"] })} className="h-9 w-full rounded-xl border border-border bg-background px-2 text-xs focus-visible:ring-2 focus-visible:ring-ring"><option value="auto">Automatic</option><option value="cuda">NVIDIA GPU</option><option value="cpu">CPU</option></select></label>
        </div>
        <label className="block space-y-1.5 text-xs" htmlFor={`${id}-threads`}><span>CPU threads</span><Input id={`${id}-threads`} type="number" min={1} max={4} step={1} value={settings.threads} onChange={event => setSettings({ ...settings, threads: Number(event.target.value) })} /></label>
        <Button type="button" variant="outline" size="sm" className="w-full" disabled={!settings.pythonPath.trim() || !settings.modelDir.trim() || !!pending} onClick={() => void voiceover.configure()}>{pending === "configure" && <Loader2 aria-hidden className="size-3 motion-safe:animate-spin" />}Check and save local setup</Button>
      </fieldset>
    </Disclosure>}
  </section>;
}
