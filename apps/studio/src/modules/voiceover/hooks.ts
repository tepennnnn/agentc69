"use client";

import { useEffect, useState } from "react";
import { api } from "@agentcut/core/common/api/client";
import type { VoiceoverInput, VoiceoverResult, VoiceoverSettings, VoiceoverStatus } from "@agentcut/core/modules/voiceover/types";

export function useVoiceover(projectId: string, onGenerated: () => Promise<void>) {
  const [status, setStatus] = useState<VoiceoverStatus | null>(null);
  const [settings, setSettings] = useState<VoiceoverSettings | null>(null);
  const [result, setResult] = useState<VoiceoverResult | null>(null);
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [statusRequest, setStatusRequest] = useState(0);

  useEffect(() => {
    let live = true;
    setStatus(null); setSettings(null); setResult(null); setError("");
    void api.editorTool<VoiceoverStatus>(projectId, { tool: "voiceover.status" })
      .then(next => { if (live) { setStatus(next); setSettings(next.settings); } })
      .catch((err: Error) => { if (live) setError(err.message); });
    return () => { live = false; };
  }, [projectId, statusRequest]);

  const configure = async () => {
    if (!settings || pending) return;
    setPending("configure"); setError(""); setNotice("");
    try {
      const next = await api.editorTool<VoiceoverStatus>(projectId, { tool: "voiceover.configure", settings });
      setStatus(next); setSettings(next.settings); setNotice(next.message);
    } catch (err) { setError((err as Error).message); }
    finally { setPending(""); }
  };

  const generate = async (input: VoiceoverInput) => {
    if (pending) return;
    setPending("generate"); setError(""); setNotice(""); setResult(null);
    try {
      const next = await api.editorTool<VoiceoverResult>(projectId, { tool: input.referenceAssetId ? "voiceover.clone" : "voiceover.generate", ...input });
      setResult(next);
      setNotice(input.referenceAssetId ? "Cloned narration is ready. Listen, then add it at the playhead." : "Narration is ready. Listen, then add it at the playhead.");
      await onGenerated();
    } catch (err) { setError((err as Error).message); }
    finally { setPending(""); }
  };

  return { status, settings, setSettings, result, pending, error, notice, configure, generate, refreshStatus: () => setStatusRequest(current => current + 1) };
}
