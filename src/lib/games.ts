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
  {
    id: "flappy",
    name: "플래피 버드",
    emoji: "🐤",
    tagline: "탭해서 파이프를 통과!",
    rule: "화면을 탭하면 새가 날아올라요. 파이프를 통과할수록 +1점, 부딪히면 끝!",
    unit: "점",
    color: "#73c2fb",
    durationSec: 0,
  },
  {
    id: "dino",
    name: "공룡 점프",
    emoji: "🦖",
    tagline: "선인장을 점프로 피해라!",
    rule: "탭하면 점프해요. 장애물을 피해 멀리 달릴수록 점수가 올라요!",
    unit: "점",
    color: "#9aa0a6",
    durationSec: 0,
  },
  {
    id: "stack",
    name: "스택 타워",
    emoji: "🧱",
    tagline: "블록을 정확히 쌓아올려!",
    rule: "움직이는 블록을 탭으로 떨어뜨려 쌓아요. 빗나간 부분은 잘려나가요!",
    unit: "층",
    color: "#9b8cff",
    durationSec: 0,
  },
  {
    id: "snake",
    name: "스네이크",
    emoji: "🐍",
    tagline: "사과 먹고 쑥쑥 자라기!",
    rule: "스와이프로 방향을 바꿔요. 사과는 +1점, 벽이나 몸에 닿으면 끝!",
    unit: "점",
    color: "#5fcf80",
    durationSec: 0,
  },
  {
    id: "2048",
    name: "2048",
    emoji: "🔢",
    tagline: "같은 숫자를 합쳐라!",
    rule: "스와이프로 타일을 밀어 같은 숫자끼리 합쳐요. 더 못 움직이면 끝!",
    unit: "점",
    color: "#edc22e",
    durationSec: 0,
  },
  {
    id: "suika",
    name: "수박 게임",
    emoji: "🍉",
    tagline: "과일을 합쳐 수박까지!",
    rule: "같은 과일이 닿으면 더 큰 과일로 합쳐져요. 통 밖으로 넘치면 끝!",
    unit: "점",
    color: "#ff7b7b",
    durationSec: 0,
  },
];

export function getGame(id: GameId): GameMeta {
  return GAMES.find((g) => g.id === id) ?? GAMES[0];
}

export function isGameId(v: unknown): v is GameId {
  return GAMES.some((g) => g.id === v);
}
