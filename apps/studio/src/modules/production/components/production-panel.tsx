"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, CircleDollarSign, ClipboardCheck, Loader2, PlayCircle, RefreshCw, ShieldCheck, X } from "lucide-react";
import { api } from "@agentcut/core/common/api/client";
import type { CapabilityProvider } from "@agentcut/core/modules/capabilities/types";
import type { ProductionRun } from "@agentcut/core/modules/production/types";
import { Button } from "@/common/ui/button";
import { Input } from "@/common/ui/input";
import { productionAction, productionPanelState } from "../lib/panel-state";

const LABELS: Record<string, string> = {
  proposal: "Proposal", reference: "Reference", storyboard: "Storyboard", assets: "Assets",
  edit: "Edit", render: "Render", qa: "Quality check", complete: "Complete", "not-started": "Not started",
};

export function ProductionPanel({ projectId, onChanged }: { projectId: string; onChanged?: (run: ProductionRun | null) => void }) {
  const [run, setRun] = useState<ProductionRun | null>(null);
  const [providers, setProviders] = useState<CapabilityProvider[]>([]);
  const [brief, setBrief] = useState("");
  const [target, setTarget] = useState("YouTube");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const [nextRun, nextProviders] = await Promise.all([
      api.editorTool<ProductionRun | null>(projectId, { tool: "production.read" }),
      api.editorTool<CapabilityProvider[]>(projectId, { tool: "capabilities.summary" }),
    ]);
    setRun(nextRun); setProviders(nextProviders); onChanged?.(nextRun);
  }, [projectId, onChanged]);
  useEffect(() => { void refresh().catch((e: Error) => setError(e.message)); }, [refresh]);

  const act = async (body: Record<string, unknown>) => {
    if (pending) return;
    setPending(true); setError("");
    try { await api.editorTool(projectId, body); await refresh(); }
    catch (e) { setError((e as Error).message); }
    finally { setPending(false); }
  };
  const state = productionPanelState(run);
  const configured = providers.filter((provider) => provider.configured).length;

  return <section className="space-y-3 rounded-2xl border border-white/10 bg-black/15 p-3" aria-label="Production workflow" aria-busy={pending}>
    <div className="flex items-center justify-between gap-2">
      <div><p className="text-xs font-semibold">Production workflow</p><p className="text-[10px] text-muted-foreground">{LABELS[state.stage]} · {configured}/{providers.length} providers ready</p></div>
      <div className="flex items-center gap-1">
        {run && <Button type="button" variant="ghost" size="icon-sm" aria-label="Clear production" title="Clear production workflow" onClick={() => void act({ tool: "production.clear" })}><X className="size-3.5 text-muted-foreground hover:text-destructive" /></Button>}
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Refresh production" onClick={() => void refresh()}><RefreshCw /></Button>
      </div>
    </div>

    {!run && <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); void act({ tool: "production.start", brief: brief.trim(), target: target.trim() }); }}>
      <Input aria-label="Production brief" value={brief} onChange={(event) => setBrief(event.target.value)} placeholder="What should this video achieve?" maxLength={4000} />
      <Input aria-label="Delivery target" value={target} onChange={(event) => setTarget(event.target.value)} placeholder="YouTube, Shorts, local…" maxLength={200} />
      <Button className="w-full" size="sm" type="submit" disabled={pending || !brief.trim() || !target.trim()}>{pending ? <Loader2 className="motion-safe:animate-spin" /> : <PlayCircle />}Start production</Button>
    </form>}

    {run && <>
      <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
        <span className="rounded-lg bg-white/5 px-2 py-1.5">Storyboard: {run.artifacts.storyboard?.scenes.length ?? 0} scenes</span>
        <span className="rounded-lg bg-white/5 px-2 py-1.5">Assets: {run.artifacts.assets?.assets.length ?? 0}</span>
      </div>
      <p className="text-[10px] text-muted-foreground">Resume: {state.resumeSummary}</p>
      {run.artifacts.proposal && <div className="space-y-1 rounded-xl bg-white/5 p-2 text-[11px]">
        <p className="font-medium">{run.artifacts.proposal.concept}</p>
        <p className="text-muted-foreground">{run.artifacts.proposal.provider}{run.artifacts.proposal.model ? ` · ${run.artifacts.proposal.model}` : ""} · {run.artifacts.proposal.durationSeconds}s · {run.artifacts.proposal.estimatedCostUsd === null ? "cost unknown" : `$${run.artifacts.proposal.estimatedCostUsd.toFixed(2)}`}</p>
      </div>}
      <div className="flex flex-wrap gap-1">
        <Button size="xs" variant="outline" disabled={!state.canApproveProposal || pending} onClick={() => run && void act(productionAction(run, "approve-proposal"))}><CircleDollarSign />{run.approvals.proposal ? "Proposal approved" : "Approve proposal"}</Button>
        <Button size="xs" variant="outline" disabled={!state.canApproveAssets || pending} onClick={() => run && void act(productionAction(run, "approve-assets"))}><ClipboardCheck />{run.approvals.assets ? "Assets approved" : "Approve assets"}</Button>
        <Button size="xs" variant="outline" disabled={!state.canRunQa || pending} onClick={() => run && void act(productionAction(run, "run-qa"))}><ShieldCheck />Run final QA</Button>
      </div>
      {run.stage === "complete" && <p className="flex items-center gap-1 text-[11px] text-emerald-400"><Check className="size-3" />Post-render QA passed.</p>}
      {run.artifacts.qa?.verdict === "failed" && <p className="text-[11px] text-destructive">QA blocked delivery: {run.artifacts.qa.findings.filter((item) => item.severity === "critical").map((item) => item.message).join("; ")}</p>}
    </>}
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
  </section>;
}
