import { NextResponse } from "next/server";
import { createRoom } from "@/lib/store";
import { encodeRoomConfig, genRoomId } from "@/lib/roomCode";
import { isGameId } from "@/lib/games";
import type { RoomConfig } from "@/lib/types";
import { clampInt } from "@/lib/util";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new NextResponse("잘못된 요청입니다", { status: 400 });
  }

  const gameId = body.gameId;
  if (!isGameId(gameId)) {
    return new NextResponse("게임을 선택해주세요", { status: 400 });
  }

  const type = body.type === "commerce" ? "commerce" : "personal";
  const prizeRaw = (body.prize ?? {}) as Record<string, unknown>;

  const cfg: RoomConfig = {
    id: genRoomId(),
    title: String(body.title ?? "").slice(0, 40) || "골든벨 한판!",
    gameId,
    hostName: String(body.hostName ?? "").slice(0, 16) || "호스트",
    type,
    prize: {
      name: String(prizeRaw.name ?? "").slice(0, 30) || "상품",
      emoji: String(prizeRaw.emoji ?? "🎁").slice(0, 4) || "🎁",
      value: clampInt(Number(prizeRaw.value), 0, 100_000_000),
      winners: clampInt(Number(prizeRaw.winners), 1, 100),
    },
    createdAt: Date.now(),
  };

  if (type === "commerce" && body.banner) {
    const b = body.banner as Record<string, unknown>;
    cfg.banner = {
      sponsor: String(b.sponsor ?? "").slice(0, 24) || "스폰서",
      text: String(b.text ?? "").slice(0, 60) || "지금 확인하기",
      url: sanitizeUrl(String(b.url ?? "")),
      image: b.image ? sanitizeUrl(String(b.image)) : undefined,
    };
  }

  createRoom(cfg);
  return NextResponse.json({ id: cfg.id, encoded: encodeRoomConfig(cfg) });
}

function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "#";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return "https://" + trimmed;
}
