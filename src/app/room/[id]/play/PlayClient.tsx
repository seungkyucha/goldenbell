"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getGame } from "@/lib/games";
import GameRunner from "@/components/games/GameRunner";
import { AppBar } from "@/components/ui";
import {
  fetchRoom,
  submitScoreApi,
  getNickname,
  setNickname,
  type RoomResponse,
} from "@/lib/client";

type Phase = "loading" | "name" | "play" | "result";

export default function PlayClient({
  id,
  encoded,
}: {
  id: string;
  encoded?: string;
}) {
  const [data, setData] = useState<RoomResponse | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [err, setErr] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [lastScore, setLastScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [round, setRound] = useState(0);
  const encRef = useRef(encoded);

  const roomHref = `/room/${id}?d=${encoded ?? ""}`;

  const load = useCallback(async () => {
    try {
      const r = await fetchRoom(id, encRef.current);
      setData(r);
      setPhase(getNickname() ? "play" : "name");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "방을 불러오지 못했어요");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFinish = useCallback(
    async (score: number) => {
      setSubmitting(true);
      setLastScore(score);
      try {
        const r = await submitScoreApi(id, score, encRef.current);
        setData(r);
        setPhase("result");
      } catch (e) {
        setErr(e instanceof Error ? e.message : "점수 등록 실패");
      } finally {
        setSubmitting(false);
      }
    },
    [id]
  );

  if (err)
    return (
      <main className="flex flex-1 flex-col">
        <AppBar title="골든벨" backHref={roomHref} />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <span className="text-5xl">😢</span>
          <p className="font-bold">{err}</p>
          <Link href={roomHref} className="text-sm text-kakao-blue underline">
            방으로 돌아가기
          </Link>
        </div>
      </main>
    );

  if (!data || phase === "loading")
    return (
      <main className="flex flex-1 items-center justify-center">
        <div className="animate-pulse text-kakao-sub">불러오는 중…</div>
      </main>
    );

  const game = getGame(data.room.gameId);
  const remaining = data.credits.remaining;
  const noCredit = remaining <= 0 && phase !== "result";

  // 닉네임 입력
  if (phase === "name")
    return (
      <main className="flex flex-1 flex-col">
        <AppBar title={game.name} backHref={roomHref} />
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
          <span className="text-5xl">{game.emoji}</span>
          <div>
            <h2 className="text-xl font-extrabold">닉네임을 정해주세요</h2>
            <p className="mt-1 text-sm text-kakao-sub">
              순위표에 표시될 이름이에요
            </p>
          </div>
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="예: 게임왕"
            maxLength={16}
            className="w-full max-w-xs rounded-2xl bg-white px-4 py-3.5 text-center text-lg font-bold shadow-sm outline-none focus:ring-2 focus:ring-kakao-yellow"
          />
          <button
            disabled={!nameInput.trim()}
            onClick={() => {
              setNickname(nameInput.trim());
              setPhase(remaining > 0 ? "play" : "name");
            }}
            className="btn-press w-full max-w-xs rounded-2xl bg-kakao-yellow py-4 text-base font-bold text-kakao-brown shadow-md disabled:opacity-40"
          >
            시작하기
          </button>
        </div>
      </main>
    );

  // 플레이권 없음
  if (noCredit)
    return (
      <main className="flex flex-1 flex-col">
        <AppBar title={game.name} backHref={roomHref} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <span className="text-5xl">🪙</span>
          <p className="text-lg font-bold">남은 플레이가 없어요</p>
          <p className="text-sm text-kakao-sub">
            방에서 공유·광고·충전으로 횟수를 늘릴 수 있어요.
          </p>
          <Link
            href={roomHref}
            className="btn-press w-full max-w-xs rounded-2xl bg-kakao-yellow py-4 text-base font-bold text-kakao-brown shadow-md"
          >
            방으로 가서 충전하기
          </Link>
        </div>
      </main>
    );

  return (
    <main className="flex flex-1 flex-col">
      <AppBar title={game.name} backHref={roomHref} />

      {phase === "play" && (
        <GameRunner key={round} gameId={data.room.gameId} onFinish={handleFinish} />
      )}

      {submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="rounded-2xl bg-white px-6 py-4 font-bold shadow-lg">
            점수 등록 중…
          </div>
        </div>
      )}

      {phase === "result" && (
        <ResultOverlay
          score={lastScore}
          unit={game.unit}
          rank={data.myRank ?? 0}
          isWinner={(data.myRank ?? 999) <= data.room.prize.winners}
          prizeEmoji={data.room.prize.emoji}
          prizeName={data.room.prize.name}
          remaining={remaining}
          roomHref={roomHref}
          onReplay={() => {
            setRound((r) => r + 1);
            setPhase("play");
          }}
        />
      )}
    </main>
  );
}

function ResultOverlay({
  score,
  unit,
  rank,
  isWinner,
  prizeEmoji,
  prizeName,
  remaining,
  roomHref,
  onReplay,
}: {
  score: number;
  unit: string;
  rank: number;
  isWinner: boolean;
  prizeEmoji: string;
  prizeName: string;
  remaining: number;
  roomHref: string;
  onReplay: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      {isWinner && <Confetti />}
      <div className="animate-sheet w-full max-w-[480px] rounded-t-3xl bg-white px-6 pb-8 pt-6 text-center">
        <p className="text-sm font-bold text-kakao-sub">
          {isWinner ? "🎉 현재 당첨권!" : "기록 완료"}
        </p>
        <div className="my-3">
          <p className="text-6xl font-black text-kakao-brown">{score}</p>
          <p className="text-sm font-bold text-kakao-sub">{unit}</p>
        </div>
        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-kakao-bg px-4 py-2 text-sm font-bold">
          현재 순위 <span className="text-kakao-blue">{rank}위</span>
          {isWinner && (
            <span className="text-kakao-sub">
              · {prizeEmoji} {prizeName} 사정권!
            </span>
          )}
        </div>

        <div className="space-y-2">
          {remaining > 0 ? (
            <button
              onClick={onReplay}
              className="btn-press w-full rounded-2xl bg-kakao-yellow py-4 text-base font-bold text-kakao-brown shadow-md"
            >
              🔁 다시하기 (남은 {remaining}회)
            </button>
          ) : (
            <Link
              href={roomHref}
              className="btn-press block w-full rounded-2xl bg-kakao-brown py-4 text-base font-bold text-white"
            >
              충전하러 가기
            </Link>
          )}
          <Link
            href={roomHref}
            className="btn-press block w-full rounded-2xl border border-kakao-line bg-white py-4 text-base font-bold text-kakao-label"
          >
            🏆 순위표 보기
          </Link>
        </div>
      </div>
    </div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 40 });
  const colors = ["#fee500", "#ff5d5d", "#4b7bec", "#2dc26b", "#ff9f43"];
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {pieces.map((_, i) => {
        const left = (i * 97) % 100;
        const delay = (i % 10) * 0.12;
        const dur = 2 + (i % 5) * 0.4;
        const color = colors[i % colors.length];
        return (
          <span
            key={i}
            style={{
              left: `${left}%`,
              background: color,
              animation: `confetti-fall ${dur}s linear ${delay}s infinite`,
            }}
            className="absolute top-0 h-2.5 w-2.5 rounded-sm"
          />
        );
      })}
    </div>
  );
}
