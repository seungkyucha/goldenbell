"use client";

import { useEffect, useRef, useState } from "react";
import { getGame } from "@/lib/games";
import { Countdown, Hud, ReadyCard, type GamePhase } from "./parts";

const meta = getGame("whack-mole");
const DURATION = meta.durationSec;
const CELLS = 9;

interface Critter {
  cell: number;
  type: "mole" | "bomb";
  dieAt: number;
  id: number;
  hit?: boolean;
}

export default function WhackMole({
  onFinish,
}: {
  onFinish: (score: number) => void;
}) {
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [, force] = useState(0);

  const critters = useRef<Critter[]>([]);
  const nextId = useRef(0);
  const lastSpawn = useRef(0);
  const endAt = useRef(0);
  const scoreRef = useRef(0);

  const rerender = () => force((n) => n + 1);

  useEffect(() => {
    if (phase !== "play") return;
    endAt.current = performance.now() + DURATION * 1000;
    lastSpawn.current = 0;
    let raf = 0;

    const loop = (now: number) => {
      const remain = (endAt.current - now) / 1000;
      if (remain <= 0) {
        setTimeLeft(0);
        critters.current = [];
        setPhase("done");
        return;
      }
      setTimeLeft(remain);

      // 만료된 두더지 제거
      critters.current = critters.current.filter((c) => c.dieAt > now);

      // 난이도: 시간이 지날수록 빠르게
      const progress = 1 - remain / DURATION;
      const spawnGap = 820 - progress * 380; // 820ms → 440ms
      const maxActive = 3 + Math.floor(progress * 2); // 3 → 5

      if (
        now - lastSpawn.current > spawnGap &&
        critters.current.length < maxActive
      ) {
        const occupied = new Set(critters.current.map((c) => c.cell));
        const free: number[] = [];
        for (let i = 0; i < CELLS; i++) if (!occupied.has(i)) free.push(i);
        if (free.length) {
          const cell = free[Math.floor(Math.random() * free.length)];
          const isBomb = Math.random() < 0.22;
          const life = isBomb ? 1100 : 950 - progress * 350;
          critters.current.push({
            cell,
            type: isBomb ? "bomb" : "mole",
            dieAt: now + life,
            id: nextId.current++,
          });
          lastSpawn.current = now;
        }
      }

      rerender();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  useEffect(() => {
    if (phase === "done") {
      const t = setTimeout(() => onFinish(scoreRef.current), 350);
      return () => clearTimeout(t);
    }
  }, [phase, onFinish]);

  function whack(c: Critter) {
    if (phase !== "play" || c.hit) return;
    c.hit = true;
    const delta = c.type === "mole" ? 1 : -2;
    scoreRef.current = Math.max(0, scoreRef.current + delta);
    setScore(scoreRef.current);
    // 즉시 제거
    critters.current = critters.current.filter((x) => x.id !== c.id);
    rerender();
  }

  if (phase === "ready")
    return <ReadyCard meta={meta} onStart={() => setPhase("count")} />;

  const byCell = new Map<number, Critter>();
  critters.current.forEach((c) => byCell.set(c.cell, c));

  return (
    <div className="flex flex-1 flex-col">
      <Hud timeLeft={timeLeft} total={DURATION} score={score} unit="점" />
      {phase === "count" ? (
        <Countdown onDone={() => setPhase("play")} />
      ) : (
        <div className="grid flex-1 grid-cols-3 grid-rows-3 gap-3 p-4">
          {Array.from({ length: CELLS }).map((_, i) => {
            const c = byCell.get(i);
            return (
              <div
                key={i}
                className="relative flex touch-none items-center justify-center overflow-hidden rounded-2xl bg-amber-100 shadow-inner"
              >
                <div className="absolute bottom-0 h-2/3 w-full rounded-t-full bg-amber-800/15" />
                {c && (
                  <button
                    onPointerDown={() => whack(c)}
                    style={{ animation: "mole-up 0.18s ease-out both" }}
                    className="relative z-10 text-5xl"
                    aria-label={c.type === "mole" ? "두더지" : "폭탄"}
                  >
                    {c.type === "mole" ? "🐹" : "💣"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
