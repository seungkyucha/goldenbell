"use client";

import { getGame } from "@/lib/games";
import { CanvasGame, type CanvasGameDef } from "./CanvasGame";

const meta = getGame("suika");

const RADII = [12, 16, 21, 26, 32, 38, 45, 52, 60, 68, 78];
const FRUITS = ["🍒", "🍓", "🍇", "🍊", "🍎", "🍐", "🍑", "🥝", "🍈", "🍍", "🍉"];
const COLORS = [
  "#e23b3b", "#ff5d7a", "#7b3fb5", "#ff9f1c", "#e63946",
  "#a8d84f", "#ffb4a2", "#88c057", "#c7e26b", "#e9c46a", "#2a9d4a",
];
const MAX = RADII.length - 1;
const SPAWN_LEVELS = [0, 0, 1, 1, 2, 3];
const MERGE_SCORE = [0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 66];
const GRAV = 2200;

interface Fruit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  level: number;
}
interface State {
  fruits: Fruit[];
  curX: number;
  curLevel: number;
  dropTimer: number;
  dangerY: number;
  overTimer: number;
  score: number;
  over: boolean;
  W: number;
}

function nextLevel(): number {
  return SPAWN_LEVELS[Math.floor(Math.random() * SPAWN_LEVELS.length)];
}

function clampWalls(f: Fruit, W: number, H: number) {
  const r = RADII[f.level];
  if (f.x - r < 0) {
    f.x = r;
    if (f.vx < 0) f.vx *= -0.3;
  }
  if (f.x + r > W) {
    f.x = W - r;
    if (f.vx > 0) f.vx *= -0.3;
  }
  if (f.y + r > H) {
    f.y = H - r;
    if (f.vy > 0) f.vy *= -0.2;
    f.vx *= 0.94;
  }
}

const def: CanvasGameDef<State> = {
  unit: "점",
  bgClass: "bg-gradient-to-b from-amber-50 to-orange-100",
  init: (W) => ({
    fruits: [],
    curX: W / 2,
    curLevel: nextLevel(),
    dropTimer: 0,
    dangerY: 0,
    overTimer: 0,
    score: 0,
    over: false,
    W,
  }),
  onPointer: (s, x, _y, kind, W) => {
    s.curX = Math.max(RADII[s.curLevel], Math.min(W - RADII[s.curLevel], x));
    if ((kind === "up" || kind === "down") && s.dropTimer <= 0 && !s.over) {
      if (kind === "up") {
        s.fruits.push({
          x: s.curX,
          y: RADII[s.curLevel] + 6,
          vx: 0,
          vy: 0,
          level: s.curLevel,
        });
        s.curLevel = nextLevel();
        s.dropTimer = 0.45;
      }
    }
  },
  step: (s, dt, _now, W, H) => {
    s.dangerY = H * 0.16;
    if (s.dropTimer > 0) s.dropTimer -= dt;
    const h = Math.min(dt, 0.032);

    // 적분
    for (const f of s.fruits) {
      f.vy += GRAV * h;
      f.x += f.vx * h;
      f.y += f.vy * h;
      clampWalls(f, W, H);
    }

    // 병합
    const consumed = new Set<number>();
    const born: Fruit[] = [];
    for (let i = 0; i < s.fruits.length; i++) {
      if (consumed.has(i)) continue;
      for (let j = i + 1; j < s.fruits.length; j++) {
        if (consumed.has(j)) continue;
        const a = s.fruits[i];
        const b = s.fruits[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.01;
        if (d < RADII[a.level] + RADII[b.level]) {
          if (a.level === b.level && a.level < MAX) {
            consumed.add(i);
            consumed.add(j);
            const nl = a.level + 1;
            born.push({
              x: (a.x + b.x) / 2,
              y: (a.y + b.y) / 2,
              vx: 0,
              vy: -40,
              level: nl,
            });
            s.score += MERGE_SCORE[nl];
            break;
          }
        }
      }
    }
    if (consumed.size) {
      s.fruits = s.fruits.filter((_, i) => !consumed.has(i)).concat(born);
    }

    // 분리(겹침 해소) — 2회 반복
    for (let iter = 0; iter < 2; iter++) {
      for (let i = 0; i < s.fruits.length; i++) {
        for (let j = i + 1; j < s.fruits.length; j++) {
          const a = s.fruits[i];
          const b = s.fruits[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy) || 0.01;
          const min = RADII[a.level] + RADII[b.level];
          if (d < min) {
            const overlap = min - d;
            const nx = dx / d;
            const ny = dy / d;
            const push = overlap / 2;
            a.x -= nx * push;
            a.y -= ny * push;
            b.x += nx * push;
            b.y += ny * push;
            const rvn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (rvn < 0) {
              const imp = -rvn * 0.4;
              a.vx -= imp * nx;
              a.vy -= imp * ny;
              b.vx += imp * nx;
              b.vy += imp * ny;
            }
            clampWalls(a, W, H);
            clampWalls(b, W, H);
          }
        }
      }
    }

    // 게임 오버: 위험선 위로 넘친 과일이 정지 상태로 일정 시간 유지되면
    let above = false;
    for (const f of s.fruits) {
      if (f.y - RADII[f.level] < s.dangerY && Math.abs(f.vy) < 28) above = true;
    }
    s.overTimer = above ? s.overTimer + dt : 0;
    if (s.overTimer > 1.6) s.over = true;
    return s.over;
  },
  score: (s) => s.score,
  draw: (ctx, s, W, H) => {
    ctx.clearRect(0, 0, W, H);
    // 위험선
    ctx.strokeStyle = "rgba(230,80,80,0.55)";
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, s.dangerY);
    ctx.lineTo(W, s.dangerY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const drawFruit = (f: { x: number; y: number; level: number }, alpha = 1) => {
      const r = RADII[f.level];
      ctx.globalAlpha = alpha;
      ctx.fillStyle = COLORS[f.level];
      ctx.beginPath();
      ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `${r * 1.3}px serif`;
      ctx.fillText(FRUITS[f.level], f.x, f.y + 1);
      ctx.globalAlpha = 1;
    };
    for (const f of s.fruits) drawFruit(f);

    // 현재(대기) 과일 + 가이드선
    if (!s.over) {
      const r = RADII[s.curLevel];
      ctx.strokeStyle = "rgba(0,0,0,0.12)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(s.curX, r * 2 + 8);
      ctx.lineTo(s.curX, H);
      ctx.stroke();
      drawFruit({ x: s.curX, y: r + 6, level: s.curLevel }, 0.92);
    }
  },
};

export default function Suika({
  onFinish,
}: {
  onFinish: (n: number) => void;
}) {
  return <CanvasGame meta={meta} def={def} onFinish={onFinish} />;
}
