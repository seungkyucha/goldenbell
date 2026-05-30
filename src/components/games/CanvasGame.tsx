"use client";

import { useEffect, useRef, useState } from "react";
import type { GameMeta } from "@/lib/games";
import { Countdown, Hud, ReadyCard, type GamePhase } from "./parts";

export type PointerKind = "down" | "move" | "up";

export interface CanvasGameDef<S> {
  /** 초기 게임 상태 생성 */
  init: (W: number, H: number) => S;
  /** 매 프레임 진행. true 를 반환하면 게임 오버 */
  step: (s: S, dt: number, now: number, W: number, H: number) => boolean;
  /** 캔버스 렌더 */
  draw: (ctx: CanvasRenderingContext2D, s: S, W: number, H: number) => void;
  /** 현재 점수 */
  score: (s: S) => number;
  onPointer?: (
    s: S,
    x: number,
    y: number,
    kind: PointerKind,
    W: number,
    H: number
  ) => void;
  onKey?: (s: S, key: string, W: number, H: number) => void;
  unit: string;
  bgClass?: string;
}

export function CanvasGame<S>({
  meta,
  def,
  onFinish,
}: {
  meta: GameMeta;
  def: CanvasGameDef<S>;
  onFinish: (score: number) => void;
}) {
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [score, setScore] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef(0);

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
      const r = wrap.getBoundingClientRect();
      W = r.width;
      H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const state = def.init(W, H);
    scoreRef.current = 0;
    let last = performance.now();
    let raf = 0;
    let ended = false;

    const finish = () => {
      if (ended) return;
      ended = true;
      setPhase("done");
    };

    const ptr = (e: PointerEvent, kind: PointerKind) => {
      if (!def.onPointer) return;
      const r = canvas.getBoundingClientRect();
      def.onPointer(state, e.clientX - r.left, e.clientY - r.top, kind, W, H);
    };
    const pd = (e: PointerEvent) => {
      e.preventDefault();
      ptr(e, "down");
    };
    const pm = (e: PointerEvent) => ptr(e, "move");
    const pu = (e: PointerEvent) => ptr(e, "up");
    canvas.addEventListener("pointerdown", pd);
    canvas.addEventListener("pointermove", pm);
    window.addEventListener("pointerup", pu);

    const kd = (e: KeyboardEvent) => {
      if (!def.onKey) return;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key))
        e.preventDefault();
      def.onKey(state, e.key, W, H);
    };
    if (def.onKey) window.addEventListener("keydown", kd);

    const loop = (now: number) => {
      const dt = Math.min(48, now - last) / 1000;
      last = now;
      const over = def.step(state, dt, now, W, H);
      const sc = def.score(state);
      if (sc !== scoreRef.current) {
        scoreRef.current = sc;
        setScore(sc);
      }
      def.draw(ctx, state, W, H);
      if (over) {
        finish();
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", pd);
      canvas.removeEventListener("pointermove", pm);
      window.removeEventListener("pointerup", pu);
      if (def.onKey) window.removeEventListener("keydown", kd);
    };
  }, [phase, def]);

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
      <Hud score={score} unit={def.unit} />
      {phase === "count" ? (
        <Countdown onDone={() => setPhase("play")} />
      ) : (
        <div
          ref={wrapRef}
          className={`relative m-4 flex-1 touch-none select-none overflow-hidden rounded-3xl ${
            def.bgClass ?? "bg-white"
          }`}
        >
          <canvas ref={canvasRef} className="h-full w-full" />
        </div>
      )}
    </div>
  );
}

// ===== 공용 그리기 헬퍼 =====

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
