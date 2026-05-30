import type {
  Room,
  RoomConfig,
  Player,
  Credits,
  CreditReason,
  LeaderboardEntry,
} from "./types";
import { CREDIT_RULES } from "./types";

/**
 * 프로토타입용 인메모리 스토어.
 * - dev 의 HMR / 서버리스 warm instance 동안 globalThis 에 유지된다.
 * - 콜드스타트로 방이 사라져도, 공유 링크에 인코딩된 RoomConfig 로 재수화(hydrate)한다.
 * - 추후 KV/DB 로 교체하기 쉽도록 단일 모듈로 캡슐화.
 */
const g = globalThis as unknown as { __GB_ROOMS?: Map<string, Room> };
const rooms: Map<string, Room> = (g.__GB_ROOMS ??= new Map<string, Room>());

export function createRoom(cfg: RoomConfig): Room {
  const room: Room = {
    ...cfg,
    players: {},
    credits: {},
    views: 0,
  };
  rooms.set(room.id, room);
  return room;
}

/** 방을 가져오되, 없으면 config 로 재수화한다. */
export function getOrHydrate(id: string, cfg?: RoomConfig | null): Room | null {
  const existing = rooms.get(id);
  if (existing) return existing;
  if (cfg && cfg.id === id) return createRoom(cfg);
  return null;
}

export function getRoom(id: string): Room | null {
  return rooms.get(id) ?? null;
}

export function touchView(id: string): void {
  const room = rooms.get(id);
  if (room) room.views += 1;
}

// ===== 플레이권 =====

function ensureCredits(room: Room, userId: string): Credits {
  let c = room.credits[userId];
  if (!c) {
    c = {
      remaining: CREDIT_RULES.base,
      sharedCount: 0,
      adCount: 0,
      purchasedCount: 0,
    };
    room.credits[userId] = c;
  }
  return c;
}

export function getCredits(room: Room, userId: string): Credits {
  return ensureCredits(room, userId);
}

export interface GrantResult {
  ok: boolean;
  credits: Credits;
  reason?: string;
}

export function grantCredit(
  room: Room,
  userId: string,
  reason: CreditReason
): GrantResult {
  const c = ensureCredits(room, userId);
  if (reason === "share") {
    if (c.sharedCount >= CREDIT_RULES.shareMax) {
      return { ok: false, credits: c, reason: "공유 보너스를 모두 받았어요" };
    }
    c.sharedCount += 1;
    c.remaining += 1;
  } else if (reason === "ad") {
    if (c.adCount >= CREDIT_RULES.adMax) {
      return { ok: false, credits: c, reason: "광고 보너스를 모두 받았어요" };
    }
    c.adCount += 1;
    c.remaining += 1;
  } else if (reason === "pay") {
    c.purchasedCount += 1;
    c.remaining += CREDIT_RULES.payPackQty;
  }
  return { ok: true, credits: c };
}

/** 플레이 1회 소모. 점수 제출 시 호출. */
export function consumeCredit(room: Room, userId: string): boolean {
  const c = ensureCredits(room, userId);
  if (c.remaining <= 0) return false;
  c.remaining -= 1;
  return true;
}

// ===== 점수 / 리더보드 =====

export function submitScore(
  room: Room,
  userId: string,
  name: string,
  score: number
): Player {
  const prev = room.players[userId];
  // 최고 점수만 기록
  const best = prev ? Math.max(prev.score, score) : score;
  const player: Player = {
    userId,
    name: name.slice(0, 16) || "익명",
    score: best,
    updatedAt: Date.now(),
  };
  room.players[userId] = player;
  return player;
}

export function getLeaderboard(room: Room): LeaderboardEntry[] {
  const sorted = Object.values(room.players).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.updatedAt - b.updatedAt; // 동점이면 먼저 달성한 사람 우선
  });
  const winners = room.prize.winners;
  return sorted.map((p, i) => ({
    ...p,
    rank: i + 1,
    isWinner: i < winners,
  }));
}
