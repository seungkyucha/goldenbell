// ===== 가격/수수료 정책 & 포맷 (서버·클라이언트 공용) =====

export const PRICING = {
  /** 우승 상품 결제 수수료율 (플랫폼 수익) */
  platformFeeRate: 0.08,
  /** 커머스 프리미엄 구독 (월) */
  premiumPrice: 9900,
  /** 플레이권 충전 1팩 가격 */
  playPackPrice: 1000,
  /** 충전 1팩 제공 횟수 */
  playPackQty: 5,
} as const;

export function formatWon(n: number): string {
  return n.toLocaleString("ko-KR") + "원";
}

export interface PrizePreset {
  emoji: string;
  name: string;
  value: number;
}

export const PRIZE_PRESETS: PrizePreset[] = [
  { emoji: "🍕", name: "피자 1판", value: 25000 },
  { emoji: "🍗", name: "치킨 1마리", value: 20000 },
  { emoji: "☕", name: "아메리카노", value: 4500 },
  { emoji: "🍔", name: "햄버거 세트", value: 8000 },
  { emoji: "🧋", name: "버블티", value: 5500 },
  { emoji: "🍰", name: "조각케이크", value: 6500 },
  { emoji: "🎁", name: "기프티콘", value: 10000 },
  { emoji: "💰", name: "직접 입력", value: 0 },
];

/** 호스트가 결제할 총액과 플랫폼 수수료 계산 */
export function calcPrizeCost(value: number, winners: number) {
  const productTotal = Math.max(0, Math.round(value)) * Math.max(1, winners);
  const fee = Math.round(productTotal * PRICING.platformFeeRate);
  return { productTotal, fee, total: productTotal + fee };
}

export function clampInt(v: number, min: number, max: number): number {
  if (Number.isNaN(v)) return min;
  return Math.max(min, Math.min(max, Math.floor(v)));
}
