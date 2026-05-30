"use client";

import type {
  Room,
  Credits,
  LeaderboardEntry,
  CreditReason,
  RoomConfig,
} from "./types";

// ===== 익명 유저 식별 & 닉네임 (localStorage) =====

const UID_KEY = "gb_uid";
const NAME_KEY = "gb_name";

export function getUserId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(UID_KEY);
  if (!id) {
    const c = window.crypto;
    id = c?.randomUUID ? c.randomUUID() : "u_" + Math.random().toString(36).slice(2);
    localStorage.setItem(UID_KEY, id);
  }
  return id;
}

export function getNickname(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(NAME_KEY) ?? "";
}

export function setNickname(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NAME_KEY, name.slice(0, 16));
}

// ===== API 호출 =====

export interface RoomResponse {
  room: RoomConfig & { views: number };
  leaderboard: LeaderboardEntry[];
  credits: Credits;
  myRank: number | null;
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `요청 실패 (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function fetchRoom(id: string, encoded?: string): Promise<RoomResponse> {
  const uid = getUserId();
  const params = new URLSearchParams({ uid });
  if (encoded) params.set("d", encoded);
  return jsonFetch<RoomResponse>(`/api/rooms/${id}?${params.toString()}`);
}

export function createRoomApi(cfg: Omit<RoomConfig, "id" | "createdAt">) {
  return jsonFetch<{ id: string; encoded: string }>("/api/rooms", {
    method: "POST",
    body: JSON.stringify(cfg),
  });
}

export function submitScoreApi(
  id: string,
  score: number,
  encoded?: string
): Promise<RoomResponse> {
  return jsonFetch<RoomResponse>(`/api/rooms/${id}/scores`, {
    method: "POST",
    body: JSON.stringify({
      uid: getUserId(),
      name: getNickname() || "익명",
      score,
      d: encoded,
    }),
  });
}

export function grantCreditApi(
  id: string,
  reason: CreditReason,
  encoded?: string
): Promise<RoomResponse & { granted: boolean; message?: string }> {
  return jsonFetch(`/api/rooms/${id}/credits`, {
    method: "POST",
    body: JSON.stringify({ uid: getUserId(), reason, d: encoded }),
  });
}

// ===== 공유 =====

export function buildShareUrl(id: string, encoded: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/room/${id}?d=${encoded}`;
}

export async function shareRoom(
  room: Pick<Room, "title" | "prize" | "hostName">,
  url: string
): Promise<"shared" | "copied"> {
  const text = `🔔 ${room.title}\n${room.prize.emoji} ${room.prize.name} 걸고 1등 가리기! 지금 참가 👇`;
  if (navigator.share) {
    try {
      await navigator.share({ title: "골든벨", text, url });
      return "shared";
    } catch {
      // 사용자가 취소 → 복사로 폴백하지 않고 그대로 둠
      throw new Error("cancelled");
    }
  }
  await navigator.clipboard.writeText(`${text}\n${url}`);
  return "copied";
}
