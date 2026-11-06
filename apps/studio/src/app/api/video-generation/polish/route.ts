import { NextRequest } from "next/server";
import { z } from "zod";
import { polishVideoPrompt } from "@/modules/video-generation/lib/prompt-enhancer";

export const runtime = "nodejs";

const PolishRequest = z.object({
  prompt: z.string().min(1).max(4000),
  aspectRatio: z.enum(["16:9", "9:16", "1:1"]).optional(),
  durationSeconds: z.number().int().min(1).max(60).default(4),
});

export async function POST(req: NextRequest) {
  try {
    const body = PolishRequest.parse(await req.json());
    const polished = polishVideoPrompt(body.prompt, {
      aspectRatio: body.aspectRatio,
      durationSeconds: body.durationSeconds,
    });
    return Response.json({ polished });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
