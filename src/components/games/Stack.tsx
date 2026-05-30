"use client";

import { getGame } from "@/lib/games";
import { CanvasGame, type CanvasGameDef, roundRect } from "./CanvasGame";

const meta = getGame("stack");

interface Block {
  x: number;
  w: number;
}
interface State {
  placed: Block[];
  curX: number;
  curW: number;
  dir: number;
  speed: number;
  score: number;
  over: boolean;
  blockH: number;
  rowY: number; // 현재 블록이 놓이는 화면 Y(상단)
}

const def: CanvasGameDef<State> = {
  unit: "층",
  bgClass: "bg-gradient-to-b from-indigo-400 to-indigo-700",
  init: (W, H) => {
    const baseW = W * 0.62;
    return {
      placed: [{ x: (W - baseW) / 2, w: baseW }],
      curX: 0,
      curW: baseW,
      dir: 1,
      speed: 200,
      score: 0,
      over: false,
      blockH: 30,
      rowY: H * 0.3,
    };
  },
  onPointer: (s, _x, _y, kind, W) => {
    if (kind !== "down" || s.over) return;
    drop(s, W);
  },
  onKey: (s, key, W) => {
    if (key === " ") drop(s, W);
  },
  step: (s, dt, _now, W) => {
    s.curX += s.dir * s.speed * dt;
    if (s.curX < 0) {
      s.curX = 0;
      s.dir = 1;
    }
    if (s.curX + s.curW > W) {
      s.curX = W - s.curW;
      s.dir = -1;
    }
    return s.over;
  },
  score: (s) => s.score,
  draw: (ctx, s, W, H) => {
    ctx.clearRect(0, 0, W, H);
    const n = s.placed.length;
    // placed blocks (현재 행을 rowY 에 고정, 아래로 쌓인 것처럼 스크롤)
    for (let i = 0; i < n; i++) {
      const top = s.rowY + (n - i) * s.blockH;
      if (top > H) continue;
      drawBlock(ctx, s.placed[i].x, top, s.placed[i].w, s.blockH, i);
    }
    // current moving block
    drawBlock(ctx, s.curX, s.rowY, s.curW, s.blockH, n);
  },
};

function drop(s: State, W: number) {
  const prev = s.placed[s.placed.length - 1];
  const L = Math.max(s.curX, prev.x);
  const R = Math.min(s.curX + s.curW, prev.x + prev.w);
  const w = R - L;
  if (w <= 2) {
    s.over = true;
    return;
  }
  s.placed.push({ x: L, w });
  s.curW = w;
  s.score += 1;
  s.speed = Math.min(420, 200 + s.score * 9);
  s.dir = s.score % 2 === 0 ? 1 : -1;
  s.curX = s.dir > 0 ? 0 : W - s.curW;
}

function drawBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  top: number,
  w: number,
  h: number,
  i: number
) {
  const hue = (i * 32) % 360;
  ctx.fillStyle = `hsl(${hue} 70% 62%)`;
  roundRect(ctx, x, top, w, h - 3, 5);
  ctx.fill();
  ctx.fillStyle = `hsl(${hue} 70% 72%)`;
  roundRect(ctx, x, top, w, 5, 3);
  ctx.fill();
}

export default function Stack({
  onFinish,
}: {
  onFinish: (n: number) => void;
}) {
  return <CanvasGame meta={meta} def={def} onFinish={onFinish} />;
}
