"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GAMES, getGame } from "@/lib/games";
import {
  PRIZE_PRESETS,
  PRICING,
  calcPrizeCost,
  formatWon,
  clampInt,
} from "@/lib/util";
import type { GameId, RoomType } from "@/lib/types";
import { AppBar, Card } from "@/components/ui";
import { PaySheet, type PayLine } from "@/components/PaySheet";
import { createRoomApi, getNickname, setNickname } from "@/lib/client";

const QUICK_EMOJI = ["🎁", "💰", "🎮", "👟", "💄", "🍱", "🎟️", "📱"];

// 게임별 자동 방장 닉네임
const HOST_NICK: Record<GameId, string> = {
  "tap-rush": "빠른손 방장",
  "whack-mole": "두더지 방장",
  "star-catch": "별잡이 방장",
};

export default function CreatePage() {
  const router = useRouter();

  const [type, setType] = useState<RoomType>("personal");
  const [gameId, setGameId] = useState<GameId>("tap-rush");

  const [presetIdx, setPresetIdx] = useState(0);
  const [customName, setCustomName] = useState("");
  const [customEmoji, setCustomEmoji] = useState("🎁");
  const [customValue, setCustomValue] = useState(10000);
  const [winners, setWinners] = useState(1);

  const [title, setTitle] = useState("");
  const [hostName, setHostName] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [hostTouched, setHostTouched] = useState(false);

  const [sponsor, setSponsor] = useState("");
  const [bannerText, setBannerText] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  const [payOpen, setPayOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isCustom = PRIZE_PRESETS[presetIdx]?.value === 0;
  const prize = useMemo(() => {
    const p = PRIZE_PRESETS[presetIdx];
    if (isCustom) {
      return {
        name: customName.trim() || "상품",
        emoji: customEmoji,
        value: customValue,
      };
    }
    return { name: p.name, emoji: p.emoji, value: p.value };
  }, [presetIdx, isCustom, customName, customEmoji, customValue]);

  const cost = calcPrizeCost(prize.value, winners);
  const premium = type === "commerce" ? PRICING.premiumPrice : 0;
  const grandTotal = cost.total + premium;

  // 상품·게임 기반 자동 방 제목 / 닉네임 (사용자가 입력하면 그 값 우선)
  const game = getGame(gameId);
  const autoTitle = `${prize.emoji} ${prize.name} 걸고 ${game.name} 한판!`;
  const autoHost = HOST_NICK[gameId];
  const effectiveTitle = titleTouched && title.trim() ? title.trim() : autoTitle;
  const effectiveHost = hostTouched && hostName.trim() ? hostName.trim() : autoHost;

  // 이전에 정한 닉네임이 있으면 미리 채워줌
  useEffect(() => {
    const saved = getNickname();
    if (saved) {
      setHostName(saved);
      setHostTouched(true);
    }
  }, []);

  const valid =
    prize.value > 0 &&
    prize.name.length > 0 &&
    (type === "personal" || sponsor.trim().length > 0);

  const payLines: PayLine[] = [
    {
      label: `${prize.emoji} ${prize.name} × ${winners}명`,
      amount: cost.productTotal,
    },
    { label: "플랫폼 수수료 (8%)", amount: cost.fee, sub: true },
  ];
  if (premium)
    payLines.push({ label: "커머스 프리미엄 구독 (월)", amount: premium });

  async function handlePaid() {
    setSubmitting(true);
    setError("");
    try {
      setNickname(effectiveHost);
      const { id, encoded } = await createRoomApi({
        title: effectiveTitle,
        gameId,
        hostName: effectiveHost,
        type,
        prize: {
          name: prize.name,
          emoji: prize.emoji,
          value: prize.value,
          winners,
        },
        banner:
          type === "commerce"
            ? {
                sponsor: sponsor.trim(),
                text: bannerText.trim() || `${sponsor.trim()} 지금 만나보기`,
                url: bannerUrl.trim(),
              }
            : undefined,
      });
      router.push(`/room/${id}?d=${encoded}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "방 생성에 실패했어요");
      setSubmitting(false);
      setPayOpen(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col pb-28">
      <AppBar title="방 만들기" backHref="/" />

      <div className="space-y-5 p-5">
        {/* 방 유형 */}
        <section>
          <h3 className="mb-2 text-sm font-bold text-kakao-sub">방 유형</h3>
          <div className="grid grid-cols-2 gap-2">
            <TypeCard
              active={type === "personal"}
              onClick={() => setType("personal")}
              emoji="🙌"
              title="일반"
              desc="친구·가족과"
            />
            <TypeCard
              active={type === "commerce"}
              onClick={() => setType("commerce")}
              emoji="📣"
              title="커머스"
              desc="광고·바이럴"
            />
          </div>
        </section>

        {/* 게임 선택 */}
        <section>
          <h3 className="mb-2 text-sm font-bold text-kakao-sub">게임 선택</h3>
          <div className="grid grid-cols-3 gap-2">
            {GAMES.map((g) => (
              <button
                key={g.id}
                onClick={() => setGameId(g.id)}
                className={`btn-press flex flex-col items-center gap-1 rounded-2xl border-2 bg-white p-3 ${
                  gameId === g.id
                    ? "border-kakao-yellow"
                    : "border-transparent"
                }`}
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                  style={{ background: g.color }}
                >
                  {g.emoji}
                </span>
                <span className="text-xs font-bold">{g.name}</span>
              </button>
            ))}
          </div>
          <p className="mt-1.5 px-1 text-[11px] text-kakao-sub">
            {GAMES.find((g) => g.id === gameId)?.rule}
          </p>
        </section>

        {/* 상품 설정 */}
        <section>
          <h3 className="mb-2 text-sm font-bold text-kakao-sub">우승 상품</h3>
          <div className="grid grid-cols-4 gap-2">
            {PRIZE_PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => setPresetIdx(i)}
                className={`btn-press flex flex-col items-center gap-0.5 rounded-2xl border-2 bg-white py-2.5 ${
                  presetIdx === i ? "border-kakao-yellow" : "border-transparent"
                }`}
              >
                <span className="text-2xl">{p.emoji}</span>
                <span className="text-[10px] font-medium leading-tight">
                  {p.name}
                </span>
              </button>
            ))}
          </div>

          {isCustom && (
            <Card className="mt-3 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {QUICK_EMOJI.map((e) => (
                  <button
                    key={e}
                    onClick={() => setCustomEmoji(e)}
                    className={`h-9 w-9 rounded-lg text-xl ${
                      customEmoji === e ? "bg-kakao-yellow" : "bg-kakao-bg"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <Field label="상품명">
                <input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="예: 스타벅스 기프티콘"
                  maxLength={30}
                  className="input"
                />
              </Field>
              <Field label="상품 금액 (1명당)">
                <input
                  type="number"
                  value={customValue || ""}
                  onChange={(e) =>
                    setCustomValue(clampInt(Number(e.target.value), 0, 100_000_000))
                  }
                  placeholder="10000"
                  className="input"
                />
              </Field>
            </Card>
          )}

          <div className="mt-3 flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
            <span className="text-sm font-bold">우승자 수</span>
            <div className="flex items-center gap-3">
              <Stepper
                onMinus={() => setWinners((w) => Math.max(1, w - 1))}
                onPlus={() => setWinners((w) => Math.min(100, w + 1))}
                value={`${winners}명`}
              />
            </div>
          </div>
        </section>

        {/* 방 정보 */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-kakao-sub">방 정보</h3>
          <Field label="방 제목 (자동 입력됨 · 수정 가능)">
            <input
              value={titleTouched ? title : autoTitle}
              onChange={(e) => {
                setTitle(e.target.value);
                setTitleTouched(true);
              }}
              placeholder={autoTitle}
              maxLength={40}
              className="input"
            />
          </Field>
          <Field label="내 닉네임 (자동 입력됨 · 수정 가능)">
            <input
              value={hostTouched ? hostName : autoHost}
              onChange={(e) => {
                setHostName(e.target.value);
                setHostTouched(true);
              }}
              placeholder={autoHost}
              maxLength={16}
              className="input"
            />
          </Field>
        </section>

        {/* 커머스 배너 */}
        {type === "commerce" && (
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-kakao-sub">
              상단 광고 배너 (프리미엄)
            </h3>
            <Card className="space-y-3">
              <Field label="브랜드/스폰서명">
                <input
                  value={sponsor}
                  onChange={(e) => setSponsor(e.target.value)}
                  placeholder="예: 글로우 에이징 디바이스"
                  maxLength={24}
                  className="input"
                />
              </Field>
              <Field label="배너 문구">
                <input
                  value={bannerText}
                  onChange={(e) => setBannerText(e.target.value)}
                  placeholder="신제품 런칭 최대 40% 할인!"
                  maxLength={60}
                  className="input"
                />
              </Field>
              <Field label="이동 링크 (URL)">
                <input
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="brand.com/event"
                  className="input"
                />
              </Field>
              <p className="rounded-xl bg-kakao-bg px-3 py-2 text-[11px] text-kakao-sub">
                참가자가 배너를 터치하면 +1회 보너스를 받고, 브랜드 링크로
                이동해요. 참가 수 = 광고 노출(UV).
              </p>
            </Card>
          </section>
        )}
      </div>

      {/* 하단 결제 바 */}
      <div className="fixed bottom-0 z-40 w-full max-w-[480px] border-t border-kakao-line bg-white/95 p-4 backdrop-blur">
        {error && (
          <p className="mb-2 text-center text-xs text-kakao-red">{error}</p>
        )}
        <div className="mb-2 flex items-center justify-between px-1 text-sm">
          <span className="text-kakao-sub">결제 예정 금액</span>
          <span className="font-extrabold">{formatWon(grandTotal)}</span>
        </div>
        <button
          disabled={!valid}
          onClick={() => setPayOpen(true)}
          className="btn-press w-full rounded-2xl bg-kakao-yellow py-4 text-base font-bold text-kakao-brown shadow-md disabled:opacity-40"
        >
          결제하고 방 만들기
        </button>
      </div>

      <PaySheet
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="상품 결제"
        lines={payLines}
        cta={submitting ? "방 만드는 중…" : `${formatWon(grandTotal)} 결제하기`}
        onSuccess={handlePaid}
      />

      <style>{`.input{width:100%;border-radius:14px;background:#f7f7f8;padding:12px 14px;font-size:15px;outline:none;border:1px solid transparent}.input:focus{border-color:var(--color-kakao-yellow);background:#fff}`}</style>
    </main>
  );
}

function TypeCard({
  active,
  onClick,
  emoji,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  emoji: string;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`btn-press flex items-center gap-3 rounded-2xl border-2 bg-white p-3 text-left ${
        active ? "border-kakao-yellow" : "border-transparent"
      }`}
    >
      <span className="text-2xl">{emoji}</span>
      <span>
        <span className="block text-sm font-bold">{title}</span>
        <span className="block text-[11px] text-kakao-sub">{desc}</span>
      </span>
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block px-1 text-xs font-medium text-kakao-sub">
        {label}
      </span>
      {children}
    </label>
  );
}

function Stepper({
  onMinus,
  onPlus,
  value,
}: {
  onMinus: () => void;
  onPlus: () => void;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onMinus}
        className="btn-press flex h-8 w-8 items-center justify-center rounded-full bg-kakao-bg text-lg font-bold"
      >
        −
      </button>
      <span className="w-10 text-center text-sm font-bold">{value}</span>
      <button
        onClick={onPlus}
        className="btn-press flex h-8 w-8 items-center justify-center rounded-full bg-kakao-bg text-lg font-bold"
      >
        +
      </button>
    </div>
  );
}
