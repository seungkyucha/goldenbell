"use client";

import { getGame } from "@/lib/games";
import { CanvasGame, type CanvasGameDef } from "./CanvasGame";

const meta = getGame("dino");

interface Obs {
  x: number;
  w: number;
  h: number;
}
interface State {
  groundY: number;
  dy: number; // 점프 높이(지면 위로의 오프셋, 양수)
  vy: number;
  onGround: boolean;
  obs: Obs[];
  spawn: number;
  speed: number;
  dist: number;
  over: boolean;
}

const GRAV = 2600;
const JUMP = -780;
const DINO_X = 56;
const DINO_W = 40;
const DINO_H = 44;

const def: CanvasGameDef<State> = {
  unit: "점",
  bgClass: "bg-gradient-to-b from-slate-100 to-slate-300",
  init: (_W, H) => ({
    groundY: H - 28,
    dy: 0,
    vy: 0,
    onGround: true,
    obs: [],
    spawn: 0.8,
    speed: 320,
    dist: 0,
    over: false,
  }),
  onPointer: (s, _x, _y, kind) => {
    if (kind === "down" && s.onGround) {
      s.vy = JUMP;
      s.onGround = false;
    }
  },
  onKey: (s, key) => {
    if ((key === " " || key === "ArrowUp") && s.onGround) {
      s.vy = JUMP;
      s.onGround = false;
    }
  },
  step: (s, dt, _now, W) => {
    s.dist += s.speed * dt;
    s.speed = Math.min(620, s.speed + dt * 12);

    // 점프 물리 (dy = 지면 위 높이)
    s.vy += GRAV * dt;
    s.dy -= s.vy * dt;
    if (s.dy <= 0) {
      s.dy = 0;
      s.vy = 0;
      s.onGround = true;
    }

    s.spawn -= dt;
    if (s.spawn <= 0) {
      s.spawn = 0.7 + Math.random() * 0.7;
      const big = Math.random() < 0.4;
      s.obs.push({ x: W + 20, w: big ? 26 : 18, h: big ? 46 : 32 });
    }
    for (const o of s.obs) o.x -= s.speed * dt;
    s.obs = s.obs.filter((o) => o.x + o.w > -10);

    // 충돌 (여유 패딩)
    const dinoLeft = DINO_X + 6;
    const dinoRight = DINO_X + DINO_W - 6;
    const dinoTop = s.groundY - DINO_H - s.dy + 6;
    for (const o of s.obs) {
      const oTop = s.groundY - o.h;
      if (
        dinoRight > o.x + 3 &&
        dinoLeft < o.x + o.w - 3 &&
        s.groundY - 2 > oTop &&
        dinoTop < s.groundY
      ) {
        s.over = true;
      }
    }
    return s.over;
  },
  score: (s) => Math.floor(s.dist / 40),
  draw: (ctx, s, W, H) => {
    ctx.clearRect(0, 0, W, H);
    // ground
    ctx.strokeStyle = "#6b7280";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, s.groundY);
    ctx.lineTo(W, s.groundY);
    ctx.stroke();
    // obstacles (cactus)
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    for (const o of s.obs) {
      ctx.font = `${o.h}px serif`;
      ctx.fillText("🌵", o.x + o.w / 2, s.groundY + 2);
    }
    // dino
    ctx.font = `${DINO_H}px serif`;
    ctx.textBaseline = "alphabetic";
    ctx.fillText("🦖", DINO_X + DINO_W / 2, s.groundY + 2 - s.dy);
  },
};

export default function Dino({ onFinish }: { onFinish: (n: number) => void }) {
  return <CanvasGame meta={meta} def={def} onFinish={onFinish} />;
}
