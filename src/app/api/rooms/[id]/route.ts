import { NextResponse } from "next/server";
import { getOrHydrate, touchView } from "@/lib/store";
import { decodeRoomConfig } from "@/lib/roomCode";
import { buildRoomResponse } from "@/lib/respond";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const uid = url.searchParams.get("uid") ?? "";
  const d = url.searchParams.get("d");
  const cfg = d ? decodeRoomConfig(d) : null;

  const room = getOrHydrate(id, cfg);
  if (!room) {
    return new NextResponse("방을 찾을 수 없어요", { status: 404 });
  }
  touchView(id);
  return NextResponse.json(buildRoomResponse(room, uid));
}
