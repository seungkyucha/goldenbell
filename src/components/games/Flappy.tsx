"use client";

import { getGame } from "@/lib/games";
import { CanvasGame, type CanvasGameDef } from "./CanvasGame";

const meta = getGame("flappy");

interface Pipe {
  x: number;
  gapY: number;
  passed: boolean;
}
interface State {
  bx: number;
  by: number;
  vy: number;
  pipes: Pipe[];
  spawn: number;
  score: number;
  over: boolean;
  gap: number;
  pipeW: number;
  speed: number;
  r: number;
}

const GRAV = 1700;
const FLAP = -460;

const def: CanvasGameDef<State> = {
  unit: "점",
  bgClass: "bg-gradient-to-b from-sky-300 to-sky-500",
  init: (W, H) => ({
    bx: W * 0.3,
    by: H / 2,
    vy: 0,
    pipes: [],
    spawn: 1.2,
    score: 0,
    over: false,
    gap: Math.max(150, H * 0.32),
    pipeW: 60,
    speed: 160,
    r: 16,
  }),
  onPointer: (s, _x, _y, kind) => {
    if (kind === "down") s.vy = FLAP;
  },
  onKey: (s, key) => {
    if (key === " " || key === "ArrowUp") s.vy = FLAP;
  },
  step: (s, dt, _now, W, H) => {
    s.vy += GRAV * dt;
    s.by += s.vy * dt;

    s.spawn -= dt;
    if (s.spawn <= 0) {
      s.spawn = 1.5;
      const m = s.gap / 2 + 24;
      s.pipes.push({
        x: W + s.pipeW,
        gapY: m + Math.random() * (H - 2 * m),
        passed: false,
      });
    }
    for (const p of s.pipes) p.x -= s.speed * dt;
    s.pipes = s.pipes.filter((p) => p.x + s.pipeW > -10);

    for (const p of s.pipes) {
      if (!p.passed && p.x + s.pipeW < s.bx) {
        p.passed = true;
        s.score += 1;
        s.speed = Math.min(280, s.speed + 4);
      }
    }

    if (s.by + s.r >= H || s.by - s.r <= 0) s.over = true;
    for (const p of s.pipes) {
      if (s.bx + s.r > p.x && s.bx - s.r < p.x + s.pipeW) {
        if (s.by - s.r < p.gapY - s.gap / 2 || s.by + s.r > p.gapY + s.gap / 2)
          s.over = true;
      }
    }
    return s.over;
  },
  draw: (ctx, s, W, H) => {
    ctx.clearRect(0, 0, W, H);
    // pipes
    ctx.fillStyle = "#5bbf3a";
    for (const p of s.pipes) {
      ctx.fillRect(p.x, 0, s.pipeW, p.gapY - s.gap / 2);
      ctx.fillRect(p.x, p.gapY + s.gap / 2, s.pipeW, H);
      ctx.fillStyle = "#4aa82f";
      ctx.fillRect(p.x - 3, p.gapY - s.gap / 2 - 14, s.pipeW + 6, 14);
      ctx.fillRect(p.x - 3, p.gapY + s.gap / 2, s.pipeW + 6, 14);
      ctx.fillStyle = "#5bbf3a";
    }
    // ground
    ctx.fillStyle = "#ded36b";
    ctx.fillRect(0, H - 8, W, 8);
    // bird
    ctx.save();
    ctx.translate(s.bx, s.by);
    ctx.rotate(Math.max(-0.5, Math.min(1, s.vy / 600)));
    ctx.font = `${s.r * 2.2}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🐤", 0, 0);
    ctx.restore();
  },
  score: (s) => s.score,
};

export default function Flappy({
  onFinish,
}: {
  onFinish: (n: number) => void;
}) {
  return <CanvasGame meta={meta} def={def} onFinish={onFinish} />;
}
