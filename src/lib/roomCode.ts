import type { RoomConfig } from "./types";
import { isGameId } from "./games";

// ===== URL-safe base64 (UTF-8 / 한글 안전) =====

function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 =
    typeof btoa !== "undefined"
      ? btoa(bin)
      : Buffer.from(bin, "binary").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin =
    typeof atob !== "undefined"
      ? atob(b64)
      : Buffer.from(b64, "base64").toString("binary");
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

// ===== 방 ID 생성 =====

const ID_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789"; // 헷갈리는 0,o,1,l 제외

export function genRoomId(len = 6): string {
  const cryptoObj: Crypto | undefined = (globalThis as { crypto?: Crypto })
    .crypto;
  const out: string[] = [];
  if (cryptoObj?.getRandomValues) {
    const buf = new Uint32Array(len);
    cryptoObj.getRandomValues(buf);
    for (let i = 0; i < len; i++) {
      out.push(ID_ALPHABET[buf[i] % ID_ALPHABET.length]);
    }
  } else {
    for (let i = 0; i < len; i++) {
      out.push(ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)]);
    }
  }
  return out.join("");
}

// ===== 방 설정 인코딩/디코딩 (공유 링크용) =====

export function encodeRoomConfig(cfg: RoomConfig): string {
  return toBase64Url(JSON.stringify(cfg));
}

export function decodeRoomConfig(token: string): RoomConfig | null {
  try {
    const obj = JSON.parse(fromBase64Url(token)) as unknown;
    if (!isValidConfig(obj)) return null;
    return obj;
  } catch {
    return null;
  }
}

function isValidConfig(obj: unknown): obj is RoomConfig {
  if (!obj || typeof obj !== "object") return false;
  const c = obj as Record<string, unknown>;
  if (typeof c.id !== "string" || typeof c.title !== "string") return false;
  if (!isGameId(c.gameId)) return false;
  if (typeof c.hostName !== "string") return false;
  if (c.type !== "personal" && c.type !== "commerce") return false;
  const p = c.prize as Record<string, unknown> | undefined;
  if (!p || typeof p.name !== "string" || typeof p.emoji !== "string")
    return false;
  if (typeof p.value !== "number" || typeof p.winners !== "number")
    return false;
  return true;
}
