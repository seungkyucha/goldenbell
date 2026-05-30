import type { GameId } from "./types";

export interface GameMeta {
  id: GameId;
  name: string;
  emoji: string;
  tagline: string;
  /** 한 줄 규칙 */
  rule: string;
  /** 점수 단위 (예: 점, 개) */
  unit: string;
  /** 카드/테마 색 */
  color: string;
  durationSec: number;
}

export const GAMES: GameMeta[] = [
  {
    id: "tap-rush",
    name: "빠른 손",
    emoji: "⚡",
    tagline: "10초 동안 미친듯이 탭!",
    rule: "제한시간 동안 버튼을 최대한 많이 누르세요.",
    unit: "탭",
    color: "#ffcf3f",
    durationSec: 10,
  },
  {
    id: "whack-mole",
    name: "두더지 잡기",
    emoji: "🐹",
    tagline: "튀어나오는 두더지를 정확히!",
    rule: "두더지는 +1점, 폭탄은 -2점. 30초 안에 최대 점수!",
    unit: "점",
    color: "#7ed957",
    durationSec: 30,
  },
  {
    id: "star-catch",
    name: "별 받기",
    emoji: "⭐",
    tagline: "떨어지는 별을 바구니로!",
    rule: "별은 +1점, 폭탄은 피하세요. 폭탄 3번이면 끝!",
    unit: "점",
    color: "#5aa9ff",
    durationSec: 0,
  },
];

export function getGame(id: GameId): GameMeta {
  return GAMES.find((g) => g.id === id) ?? GAMES[0];
}

export function isGameId(v: unknown): v is GameId {
  return GAMES.some((g) => g.id === v);
}
