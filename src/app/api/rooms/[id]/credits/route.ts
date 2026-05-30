import { NextResponse } from "next/server";
import { getOrHydrate, grantCredit } from "@/lib/store";
import { decodeRoomConfig } from "@/lib/roomCode";
import { buildRoomResponse } from "@/lib/respond";
import type { CreditReason } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID: CreditReason[] = ["share", "ad", "pay"];

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

  const reason = body.reason as CreditReason;
  if (!VALID.includes(reason)) {
    return new NextResponse("잘못된 보너스 유형", { status: 400 });
  }

  const cfg = body.d ? decodeRoomConfig(String(body.d)) : null;
  const room = getOrHydrate(id, cfg);
  if (!room) return new NextResponse("방을 찾을 수 없어요", { status: 404 });

  const result = grantCredit(room, uid, reason);
  return NextResponse.json({
    ...buildRoomResponse(room, uid),
    granted: result.ok,
    message: result.reason,
  });
}
