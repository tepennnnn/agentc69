import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { q } from "@agentcut/core/common/server/db";
import { toAbs } from "@agentcut/core/modules/media/server/assets";
import { unpackProductionKit } from "@agentcut/core/modules/media/server/archive";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const body = (await req.json().catch(() => ({}))) as { assetId?: string; file?: string };
    let archiveAbsPath: string | null = null;

    if (body.assetId) {
      const asset = q.getAsset(body.assetId);
      if (!asset) return NextResponse.json({ error: `Asset ${body.assetId} not found` }, { status: 404 });
      archiveAbsPath = toAbs(asset.path);
    } else if (body.file) {
      archiveAbsPath = path.resolve(body.file);
    }

    if (!archiveAbsPath) {
      return NextResponse.json({ error: "Missing assetId or file parameter" }, { status: 400 });
    }

    const manifest = await unpackProductionKit(archiveAbsPath, id);
    return NextResponse.json({ ok: true, manifest });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
