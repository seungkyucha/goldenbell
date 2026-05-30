"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getGame } from "@/lib/games";
import { encodeRoomConfig } from "@/lib/roomCode";
import { PRICING, formatWon } from "@/lib/util";
import { CREDIT_RULES } from "@/lib/types";
import {
  fetchRoom,
  grantCreditApi,
  buildShareUrl,
  shareRoom,
  type RoomResponse,
} from "@/lib/client";
import { AppBar, Card, Sheet } from "@/components/ui";
import { PaySheet } from "@/components/PaySheet";

export default function RoomClient({
  id,
  encoded: encodedProp,
}: {
  id: string;
  encoded?: string;
}) {
  const [data, setData] = useState<RoomResponse | null>(null);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");
  const [adOpen, setAdOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const encoded = data?.room ? encodeRoomConfig(data.room) : encodedProp;
  const encodedRef = useRef(encodedProp);
  encodedRef.current = encoded;

  const showToast = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  }, []);

  const load = useCallback(async () => {
    try {
      const r = await fetchRoom(id, encodedRef.current);
      setData(r);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "방을 불러오지 못했어요");
    }
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  if (err)
    return (
      <main className="flex flex-1 flex-col">
        <AppBar title="골든벨" backHref="/" />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <span className="text-5xl">😢</span>
          <p className="font-bold">{err}</p>
          <Link href="/" className="text-sm text-kakao-blue underline">
            홈으로
          </Link>
        </div>
      </main>
    );

  if (!data)
    return (
      <main className="flex flex-1 items-center justify-center">
        <div className="animate-pulse text-kakao-sub">불러오는 중…</div>
      </main>
    );

  const { room, leaderboard, credits, myRank } = data;
  const game = getGame(room.gameId);
  const canPlay = credits.remaining > 0;
  const shareLeft = CREDIT_RULES.shareMax - credits.sharedCount;
  const adLeft = CREDIT_RULES.adMax - credits.adCount;

  async function applyGrant(reason: "share" | "ad" | "pay") {
    const r = await grantCreditApi(id, reason, encodedRef.current);
    setData(r);
    if (r.granted === false && r.message) showToast(r.message);
    else if (reason === "ad") showToast("🎉 +1회 충전 완료!");
    else if (reason === "pay")
      showToast(`🎉 +${PRICING.playPackQty}회 충전 완료!`);
  }

  async function doShare() {
    if (!data) return;
    const url = buildShareUrl(id, encodedRef.current ?? "");
    try {
      const result = await shareRoom(data.room, url);
      await applyGrant("share");
      if (result === "copied") showToast("📋 링크 복사됨! 챗방에 붙여넣기 →");
    } catch (e) {
      if (e instanceof Error && e.message === "cancelled") return;
      showToast("공유에 실패했어요");
    }
  }

  async function doAdReward() {
    setAdOpen(false);
    await applyGrant("ad");
    if (room.type === "commerce" && room.banner?.url) {
      window.open(room.banner.url, "_blank", "noopener");
    }
  }

  return (
    <main className="flex flex-1 flex-col pb-44">
      <AppBar title={room.title} backHref="/" />

      {/* 커머스 상단 광고 배너 */}
      {room.type === "commerce" && room.banner && (
        <button
          onClick={() => setAdOpen(true)}
          className="btn-press relative flex items-center gap-3 overflow-hidden bg-gradient-to-r from-kakao-brown to-[#5a3030] px-4 py-3 text-left text-white"
        >
          <span className="text-2xl">📣</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold">
              {room.banner.text}
            </span>
            <span className="block truncate text-[11px] opacity-70">
              {room.banner.sponsor} · 광고
            </span>
          </span>
          <span className="shrink-0 rounded-full bg-kakao-yellow px-2.5 py-1 text-xs font-bold text-kakao-brown">
            터치 +1회
          </span>
        </button>
      )}

      <div className="space-y-4 p-5">
        {/* 상품 히어로 */}
        <Card className="flex flex-col items-center gap-2 py-6 text-center">
          <span className="text-xs font-bold text-kakao-sub">
            🏆 우승 상품 · {room.prize.winners}명
          </span>
          <span className="text-6xl">{room.prize.emoji}</span>
          <span className="text-xl font-extrabold">{room.prize.name}</span>
          <span className="text-sm text-kakao-sub">
            {room.hostName}님이 쏩니다 🎉
          </span>
          <div className="mt-2 flex gap-4 text-xs text-kakao-sub">
            <span>🎮 {game.name}</span>
            <span>👥 참가 {leaderboard.length}명</span>
            <span>👁 {room.views}</span>
          </div>
        </Card>

        {/* 남은 플레이 */}
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-xs text-kakao-sub">내 남은 플레이</p>
            <p className="text-2xl font-extrabold">
              {credits.remaining}
              <span className="ml-1 text-sm font-bold text-kakao-sub">회</span>
            </p>
          </div>
          {canPlay ? (
            <Link
              href={`/room/${id}/play?d=${encodedRef.current ?? ""}`}
              className="btn-press rounded-2xl bg-kakao-yellow px-7 py-3.5 text-base font-bold text-kakao-brown shadow-md"
            >
              ▶ 플레이
            </Link>
          ) : (
            <button
              onClick={() => setPayOpen(true)}
              className="btn-press rounded-2xl bg-kakao-brown px-6 py-3.5 text-base font-bold text-white"
            >
              충전하고 플레이
            </button>
          )}
        </Card>

        {/* 횟수 늘리기 */}
        <div className="grid grid-cols-3 gap-2">
          <BonusButton
            emoji="🔗"
            label="공유 +1"
            sub={shareLeft > 0 ? `${shareLeft}회 남음` : "완료"}
            disabled={shareLeft <= 0}
            onClick={doShare}
          />
          <BonusButton
            emoji="📺"
            label="광고 +1"
            sub={adLeft > 0 ? `${adLeft}회 남음` : "완료"}
            disabled={adLeft <= 0}
            onClick={() => setAdOpen(true)}
          />
          <BonusButton
            emoji="💳"
            label="충전"
            sub={`+${PRICING.playPackQty}회`}
            onClick={() => setPayOpen(true)}
          />
        </div>

        {/* 리더보드 */}
        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-kakao-sub">🏆 실시간 순위</h3>
            {myRank && (
              <span className="text-xs font-bold text-kakao-blue">
                내 순위 {myRank}위
              </span>
            )}
          </div>
          {leaderboard.length === 0 ? (
            <Card className="py-8 text-center text-sm text-kakao-sub">
              아직 참가자가 없어요.
              <br />첫 도전자가 되어보세요! 🔥
            </Card>
          ) : (
            <div className="space-y-2">
              {leaderboard.slice(0, 30).map((e) => (
                <div
                  key={e.userId}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 shadow-sm ${
                    myRank === e.rank
                      ? "bg-kakao-yellow/30 ring-2 ring-kakao-yellow"
                      : "bg-white"
                  }`}
                >
                  <span className="w-7 text-center text-lg font-extrabold">
                    {medal(e.rank)}
                  </span>
                  <span className="flex-1 truncate font-bold">
                    {e.name}
                    {e.isWinner && (
                      <span className="ml-1.5 rounded-full bg-kakao-yellow px-2 py-0.5 text-[10px] font-bold text-kakao-brown">
                        당첨
                      </span>
                    )}
                  </span>
                  <span className="font-extrabold">
                    {e.score}
                    <span className="ml-0.5 text-xs text-kakao-sub">
                      {game.unit}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* 하단 공유 CTA */}
      <div className="fixed bottom-0 z-40 w-full max-w-[480px] border-t border-kakao-line bg-white/95 p-4 backdrop-blur">
        <button
          onClick={doShare}
          className="btn-press flex w-full items-center justify-center gap-2 rounded-2xl bg-kakao-yellow py-4 text-base font-bold text-kakao-brown shadow-md"
        >
          💬 챗방에 공유하기
          {shareLeft > 0 && (
            <span className="rounded-full bg-kakao-brown px-2 py-0.5 text-[11px] text-kakao-yellow">
              +1회
            </span>
          )}
        </button>
      </div>

      {/* 광고(offerwall) 시트 */}
      <AdSheet
        open={adOpen}
        onClose={() => setAdOpen(false)}
        sponsor={room.type === "commerce" ? room.banner?.sponsor : undefined}
        text={room.type === "commerce" ? room.banner?.text : undefined}
        onReward={doAdReward}
      />

      {/* 충전 결제 시트 */}
      <PaySheet
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="플레이 충전"
        lines={[
          {
            label: `플레이권 ${PRICING.playPackQty}회`,
            amount: PRICING.playPackPrice,
          },
        ]}
        cta={`${formatWon(PRICING.playPackPrice)} 결제하고 +${PRICING.playPackQty}회`}
        onSuccess={async () => {
          setPayOpen(false);
          setBusy(true);
          await applyGrant("pay");
          setBusy(false);
        }}
      />

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full bg-kakao-brown/90 px-5 py-2.5 text-sm font-bold text-white shadow-lg">
          {toast}
        </div>
      )}
      {busy && <div className="fixed inset-0 z-50" />}
    </main>
  );
}

function BonusButton({
  emoji,
  label,
  sub,
  disabled,
  onClick,
}: {
  emoji: string;
  label: string;
  sub: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="btn-press flex flex-col items-center gap-0.5 rounded-2xl bg-white py-3 shadow-sm disabled:opacity-40"
    >
      <span className="text-xl">{emoji}</span>
      <span className="text-xs font-bold">{label}</span>
      <span className="text-[10px] text-kakao-sub">{sub}</span>
    </button>
  );
}

function medal(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return String(rank);
}

function AdSheet({
  open,
  onClose,
  sponsor,
  text,
  onReward,
}: {
  open: boolean;
  onClose: () => void;
  sponsor?: string;
  text?: string;
  onReward: () => void;
}) {
  const [count, setCount] = useState(3);
  const [watching, setWatching] = useState(false);

  useEffect(() => {
    if (!open) {
      setCount(3);
      setWatching(false);
    }
  }, [open]);

  useEffect(() => {
    if (!watching) return;
    if (count <= 0) return;
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [watching, count]);

  return (
    <Sheet open={open} onClose={onClose} title="광고 보고 +1회">
      <div className="mb-4 flex flex-col items-center gap-3 rounded-2xl bg-kakao-bg p-6 text-center">
        <span className="text-5xl">{sponsor ? "📣" : "🎬"}</span>
        <p className="text-sm font-bold">
          {text ?? "스폰서 광고를 시청하고 보너스 플레이를 받으세요"}
        </p>
        {sponsor && <p className="text-xs text-kakao-sub">{sponsor} · 광고</p>}
      </div>
      {watching && count > 0 ? (
        <div className="w-full rounded-2xl bg-kakao-line py-4 text-center text-base font-bold text-kakao-sub">
          광고 시청 중… {count}
        </div>
      ) : watching ? (
        <button
          onClick={onReward}
          className="btn-press w-full rounded-2xl bg-kakao-green py-4 text-base font-bold text-white shadow-md"
        >
          🎁 +1회 보상 받기
        </button>
      ) : (
        <button
          onClick={() => setWatching(true)}
          className="btn-press w-full rounded-2xl bg-kakao-yellow py-4 text-base font-bold text-kakao-brown shadow-md"
        >
          광고 시청하기 (3초)
        </button>
      )}
    </Sheet>
  );
}
