"use client";

import { useEffect, useRef, useState } from "react";
import { getGame } from "@/lib/games";
import { Countdown, Hud, ReadyCard, type GamePhase } from "./parts";

const meta = getGame("star-catch");
const START_LIVES = 3;
const HARD_CAP_MS = 45000;

interface Entity {
  x: number;
  y: number;
  vy: number;
  type: "star" | "bomb";
  r: number;
  id: number;
}

export default function StarCatch({
  onFinish,
}: {
  onFinish: (score: number) => void;
}) {
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(START_LIVES);

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef(0);
  const livesRef = useRef(START_LIVES);

  useEffect(() => {
    if (phase !== "play") return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const entities: Entity[] = [];
    let nextId = 0;
    let basketX = W / 2;
    let targetX = W / 2;
    let lastSpawn = 0;
    let last = performance.now();
    const started = last;
    let raf = 0;
    let ended = false;

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetX = e.clientX - rect.left;
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onMove);

    const finish = () => {
      if (ended) return;
      ended = true;
      setPhase("done");
    };

    const loop = (now: number) => {
      const dt = Math.min(48, now - last) / 1000;
      last = now;
      const elapsed = now - started;
      const progress = Math.min(1, elapsed / HARD_CAP_MS);

      // 스폰
      const spawnGap = 720 - progress * 280;
      if (now - lastSpawn > spawnGap) {
        lastSpawn = now;
        const bombChance = 0.2 + progress * 0.25;
        const type = Math.random() < bombChance ? "bomb" : "star";
        const r = 18;
        entities.push({
          x: r + Math.random() * (W - 2 * r),
          y: -r,
          vy: 150 + progress * 230 + Math.random() * 60,
          type,
          r,
          id: nextId++,
        });
      }

      // 바구니 이동 (부드럽게)
      basketX += (targetX - basketX) * Math.min(1, dt * 14);
      const basketHalf = 38;
      basketX = Math.max(basketHalf, Math.min(W - basketHalf, basketX));
      const basketY = H - 46;

      // 이동 & 충돌
      for (let i = entities.length - 1; i >= 0; i--) {
        const en = entities[i];
        en.y += en.vy * dt;
        const caught =
          en.y + en.r >= basketY &&
          en.y - en.r <= basketY + 30 &&
          Math.abs(en.x - basketX) < basketHalf + en.r * 0.6;
        if (caught) {
          entities.splice(i, 1);
          if (en.type === "star") {
            scoreRef.current += 1;
            setScore(scoreRef.current);
          } else {
            livesRef.current -= 1;
            setLives(livesRef.current);
            if (livesRef.current <= 0) {
              draw(ctx, W, H, entities, basketX, basketY);
              finish();
              return;
            }
          }
        } else if (en.y - en.r > H) {
          entities.splice(i, 1);
        }
      }

      draw(ctx, W, H, entities, basketX, basketY);

      if (elapsed >= HARD_CAP_MS) {
        finish();
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onMove);
    };
  }, [phase]);

  useEffect(() => {
    if (phase === "done") {
      const t = setTimeout(() => onFinish(scoreRef.current), 350);
      return () => clearTimeout(t);
    }
  }, [phase, onFinish]);

  if (phase === "ready")
    return <ReadyCard meta={meta} onStart={() => setPhase("count")} />;

  return (
    <div className="flex flex-1 flex-col">
      <Hud score={score} unit="점" lives={lives} />
      {phase === "count" ? (
        <Countdown onDone={() => setPhase("play")} />
      ) : (
        <div
          ref={wrapRef}
          className="relative m-4 flex-1 touch-none overflow-hidden rounded-3xl bg-gradient-to-b from-sky-200 to-sky-400"
        >
          <canvas ref={canvasRef} className="h-full w-full" />
        </div>
      )}
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  entities: Entity[],
  basketX: number,
  basketY: number
) {
  ctx.clearRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const en of entities) {
    ctx.font = `${en.r * 2}px serif`;
    ctx.fillText(en.type === "star" ? "⭐" : "💣", en.x, en.y);
  }
  ctx.font = "52px serif";
  ctx.fillText("🧺", basketX, basketY + 14);
}
