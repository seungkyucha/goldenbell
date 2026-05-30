"use client";

import { useEffect, useRef, useState } from "react";
import { getGame } from "@/lib/games";
import { Countdown, Hud, ReadyCard, type GamePhase } from "./parts";

const meta = getGame("tap-rush");
const DURATION = meta.durationSec;

interface Floater {
  id: number;
  x: number;
  y: number;
}

export default function TapRush({
  onFinish,
}: {
  onFinish: (score: number) => void;
}) {
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [taps, setTaps] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const floaterId = useRef(0);
  const endAt = useRef(0);

  useEffect(() => {
    if (phase !== "play") return;
    endAt.current = performance.now() + DURATION * 1000;
    let raf = 0;
    const tick = () => {
      const remain = (endAt.current - performance.now()) / 1000;
      if (remain <= 0) {
        setTimeLeft(0);
        setPhase("done");
        return;
      }
      setTimeLeft(remain);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  useEffect(() => {
    if (phase === "done") {
      const t = setTimeout(() => onFinish(taps), 350);
      return () => clearTimeout(t);
    }
  }, [phase, taps, onFinish]);

  function handleTap(e: React.PointerEvent) {
    if (phase !== "play") return;
    setTaps((t) => t + 1);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const id = floaterId.current++;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setFloaters((f) => [...f, { id, x, y }]);
    setTimeout(() => {
      setFloaters((f) => f.filter((fl) => fl.id !== id));
    }, 600);
  }

  if (phase === "ready")
    return <ReadyCard meta={meta} onStart={() => setPhase("count")} />;

  return (
    <div className="flex flex-1 flex-col">
      <Hud timeLeft={timeLeft} total={DURATION} score={taps} unit="탭" />
      {phase === "count" ? (
        <Countdown onDone={() => setPhase("play")} />
      ) : (
        <div
          onPointerDown={handleTap}
          className="relative m-4 flex flex-1 touch-none select-none items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-amber-200 to-amber-400 shadow-inner"
        >
          <div className="pointer-events-none text-center">
            <div className="text-8xl font-black text-kakao-brown drop-shadow">
              {taps}
            </div>
            <div className="mt-2 text-lg font-bold text-kakao-brown/70">
              {phase === "done" ? "끝!" : "탭! 탭! 탭!"}
            </div>
          </div>
          {floaters.map((f) => (
            <span
              key={f.id}
              className="animate-float-score pointer-events-none absolute text-2xl font-black text-white drop-shadow"
              style={{ left: f.x, top: f.y }}
            >
              +1
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
