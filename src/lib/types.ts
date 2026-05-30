// ===== 골든벨 공용 타입 =====

export type GameId = "tap-rush" | "whack-mole" | "star-catch";

export type RoomType = "personal" | "commerce";

export interface PrizeInfo {
  /** 상품명 (예: 피자 1판) */
  name: string;
  /** 상품 이모지 (예: 🍕) */
  emoji: string;
  /** 상품 1개당 금액(원) */
  value: number;
  /** 우승자 수 */
  winners: number;
}

export interface CommerceBanner {
  /** 스폰서/브랜드명 */
  sponsor: string;
  /** 배너 문구 */
  text: string;
  /** 클릭 시 이동할 링크 */
  url: string;
  /** 배너 배경 이미지 URL (선택) */
  image?: string;
}

/** 공유 링크에 인코딩되는, 어디서든 방을 복원할 수 있는 최소 설정 */
export interface RoomConfig {
  id: string;
  title: string;
  gameId: GameId;
  hostName: string;
  type: RoomType;
  prize: PrizeInfo;
  banner?: CommerceBanner;
  createdAt: number;
}

export interface Player {
  userId: string;
  name: string;
  score: number;
  updatedAt: number;
}

/** 유저별 플레이권 현황 (방 단위) */
export interface Credits {
  remaining: number;
  sharedCount: number;
  adCount: number;
  purchasedCount: number;
}

export interface Room extends RoomConfig {
  players: Record<string, Player>;
  credits: Record<string, Credits>;
  views: number;
}

export interface LeaderboardEntry extends Player {
  rank: number;
  isWinner: boolean;
}

export type CreditReason = "share" | "ad" | "pay";

// 플레이권 규칙
export const CREDIT_RULES = {
  base: 1,
  shareMax: 2, // 공유로 최대 +2
  adMax: 3, // 광고로 최대 +3
  payPackQty: 5, // 1회 충전 시 +5
} as const;
