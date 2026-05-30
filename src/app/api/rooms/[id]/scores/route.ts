import { NextResponse } from "next/server";
import { getOrHydrate, consumeCredit, submitScore } from "@/lib/store";
import { decodeRoomConfig } from "@/lib/roomCode";
import { buildRoomResponse } from "@/lib/respond";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new NextResponse("잘못된 요청입니다", { status: 400 });
  }

  const uid = String(body.uid ?? "");
  if (!uid) return new NextResponse("유저 식별 실패", { status: 400 });

  const cfg = body.d ? decodeRoomConfig(String(body.d)) : null;
  const room = getOrHydrate(id, cfg);
  if (!room) return new NextResponse("방을 찾을 수 없어요", { status: 404 });

  const score = Math.max(0, Math.round(Number(body.score) || 0));
  const name = String(body.name ?? "익명");

  // 플레이권 1회 소모
  const consumed = consumeCredit(room, uid);
  if (!consumed) {
    return new NextResponse("남은 플레이 횟수가 없어요", { status: 402 });
  }

  submitScore(room, uid, name, score);
  return NextResponse.json(buildRoomResponse(room, uid));
}
