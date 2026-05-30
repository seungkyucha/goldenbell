"use client";

import { useEffect, useState } from "react";
import type { GameMeta } from "@/lib/games";

export type GamePhase = "ready" | "count" | "play" | "done";

export function ReadyCard({
  meta,
  onStart,
}: {
  meta: GameMeta;
  onStart: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
      <div
        className="flex h-24 w-24 items-center justify-center rounded-3xl text-6xl shadow-lg"
        style={{ background: meta.color }}
      >
        {meta.emoji}
      </div>
      <div>
        <h2 className="text-2xl font-extrabold">{meta.name}</h2>
        <p className="mt-1 text-kakao-sub">{meta.tagline}</p>
      </div>
      <p className="max-w-xs rounded-2xl bg-white px-4 py-3 text-sm text-kakao-label shadow-sm">
        {meta.rule}
      </p>
      <button
        onClick={onStart}
        className="btn-press mt-2 w-full max-w-xs rounded-2xl bg-kakao-yellow py-4 text-lg font-bold text-kakao-brown shadow-md"
      >
        시작하기
      </button>
    </div>
  );
}

export function Countdown({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(3);
  useEffect(() => {
    const t = setTimeout(
      () => {
        if (n === 0) onDone();
        else setN(n - 1);
      },
      n === 0 ? 450 : 700
    );
    return () => clearTimeout(t);
  }, [n, onDone]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <div
        key={n}
        className="animate-pop text-7xl font-black text-kakao-brown"
      >
        {n === 0 ? "시작!" : n}
      </div>
    </div>
  );
}

export function Hud({
  timeLeft,
  total,
  score,
  unit,
  lives,
}: {
  timeLeft?: number;
  total?: number;
  score: number;
  unit: string;
  lives?: number;
}) {
  const pct =
    timeLeft !== undefined && total
      ? Math.max(0, Math.min(100, (timeLeft / total) * 100))
      : null;
  return (
    <div className="px-4 pt-3">
      <div className="flex items-center justify-between text-sm font-bold">
        <span className="text-kakao-sub">
          {lives !== undefined
            ? "❤️".repeat(Math.max(0, lives)) || "💔"
            : pct !== null
              ? `⏱ ${Math.ceil(timeLeft!)}초`
              : ""}
        </span>
        <span className="text-lg">
          {score}
          <span className="ml-0.5 text-sm text-kakao-sub">{unit}</span>
        </span>
      </div>
      {pct !== null && (
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-kakao-line">
          <div
            className="h-full rounded-full bg-kakao-yellow transition-[width] duration-100 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
