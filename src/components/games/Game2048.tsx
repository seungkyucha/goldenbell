"use client";

import { getGame } from "@/lib/games";
import { CanvasGame, type CanvasGameDef, roundRect } from "./CanvasGame";

const meta = getGame("2048");

type Dir = "L" | "R" | "U" | "D";
interface State {
  g: number[];
  score: number;
  over: boolean;
  sx: number;
  sy: number;
}

const idx = (r: number, c: number) => r * 4 + c;

function lineIndices(dir: Dir, i: number): number[] {
  switch (dir) {
    case "L":
      return [idx(i, 0), idx(i, 1), idx(i, 2), idx(i, 3)];
    case "R":
      return [idx(i, 3), idx(i, 2), idx(i, 1), idx(i, 0)];
    case "U":
      return [idx(0, i), idx(1, i), idx(2, i), idx(3, i)];
    case "D":
      return [idx(3, i), idx(2, i), idx(1, i), idx(0, i)];
  }
}

function move(g: number[], dir: Dir): { moved: boolean; gained: number } {
  let moved = false;
  let gained = 0;
  for (let i = 0; i < 4; i++) {
    const ids = lineIndices(dir, i);
    const vals = ids.map((k) => g[k]).filter((v) => v !== 0);
    const out: number[] = [];
    for (let j = 0; j < vals.length; j++) {
      if (j + 1 < vals.length && vals[j] === vals[j + 1]) {
        out.push(vals[j] * 2);
        gained += vals[j] * 2;
        j++;
      } else {
        out.push(vals[j]);
      }
    }
    while (out.length < 4) out.push(0);
    ids.forEach((k, n) => {
      if (g[k] !== out[n]) moved = true;
      g[k] = out[n];
    });
  }
  return { moved, gained };
}

function addRandom(g: number[]) {
  const empty: number[] = [];
  g.forEach((v, i) => {
    if (v === 0) empty.push(i);
  });
  if (!empty.length) return;
  const k = empty[Math.floor(Math.random() * empty.length)];
  g[k] = Math.random() < 0.9 ? 2 : 4;
}

function canMove(g: number[]): boolean {
  if (g.some((v) => v === 0)) return true;
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      if (c < 3 && g[idx(r, c)] === g[idx(r, c + 1)]) return true;
      if (r < 3 && g[idx(r, c)] === g[idx(r + 1, c)]) return true;
    }
  return false;
}

function doMove(s: State, dir: Dir) {
  if (s.over) return;
  const { moved, gained } = move(s.g, dir);
  if (!moved) return;
  s.score += gained;
  addRandom(s.g);
  if (!canMove(s.g)) s.over = true;
}

const COLORS: Record<number, string> = {
  2: "#eee4da",
  4: "#ede0c8",
  8: "#f2b179",
  16: "#f59563",
  32: "#f67c5f",
  64: "#f65e3b",
  128: "#edcf72",
  256: "#edcc61",
  512: "#edc850",
  1024: "#edc53f",
  2048: "#edc22e",
};

const def: CanvasGameDef<State> = {
  unit: "점",
  bgClass: "bg-[#bbada0]",
  init: () => {
    const g = new Array(16).fill(0);
    addRandom(g);
    addRandom(g);
    return { g, score: 0, over: false, sx: 0, sy: 0 };
  },
  onPointer: (s, x, y, kind) => {
    if (kind === "down") {
      s.sx = x;
      s.sy = y;
    } else if (kind === "up") {
      const dx = x - s.sx;
      const dy = y - s.sy;
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
      if (Math.abs(dx) > Math.abs(dy)) doMove(s, dx > 0 ? "R" : "L");
      else doMove(s, dy > 0 ? "D" : "U");
    }
  },
  onKey: (s, key) => {
    if (key === "ArrowLeft") doMove(s, "L");
    else if (key === "ArrowRight") doMove(s, "R");
    else if (key === "ArrowUp") doMove(s, "U");
    else if (key === "ArrowDown") doMove(s, "D");
  },
  step: (s) => s.over,
  score: (s) => s.score,
  draw: (ctx, s, W, H) => {
    ctx.clearRect(0, 0, W, H);
    const size = Math.min(W, H) * 0.94;
    const ox = (W - size) / 2;
    const oy = (H - size) / 2;
    const pad = size * 0.03;
    const cell = (size - pad * 5) / 4;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++) {
        const x = ox + pad + c * (cell + pad);
        const y = oy + pad + r * (cell + pad);
        const v = s.g[idx(r, c)];
        ctx.fillStyle = v ? COLORS[v] ?? "#3c3a32" : "rgba(238,228,218,0.35)";
        roundRect(ctx, x, y, cell, cell, 6);
        ctx.fill();
        if (v) {
          ctx.fillStyle = v <= 4 ? "#776e65" : "#f9f6f2";
          const digits = String(v).length;
          ctx.font = `bold ${cell * (digits >= 4 ? 0.32 : digits === 3 ? 0.4 : 0.46)}px sans-serif`;
          ctx.fillText(String(v), x + cell / 2, y + cell / 2 + 1);
        }
      }
  },
};

export default function Game2048({
  onFinish,
}: {
  onFinish: (n: number) => void;
}) {
  return <CanvasGame meta={meta} def={def} onFinish={onFinish} />;
}
