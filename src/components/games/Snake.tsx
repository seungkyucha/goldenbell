"use client";

import { getGame } from "@/lib/games";
import { CanvasGame, type CanvasGameDef, roundRect } from "./CanvasGame";

const meta = getGame("snake");

interface Cell {
  x: number;
  y: number;
}
interface State {
  cell: number;
  cols: number;
  rows: number;
  ox: number;
  oy: number;
  snake: Cell[];
  dir: Cell;
  nextDir: Cell;
  food: Cell;
  acc: number;
  score: number;
  over: boolean;
  sx: number;
  sy: number;
}

const COLS = 15;

function placeFood(s: State) {
  while (true) {
    const f = {
      x: Math.floor(Math.random() * s.cols),
      y: Math.floor(Math.random() * s.rows),
    };
    if (!s.snake.some((c) => c.x === f.x && c.y === f.y)) {
      s.food = f;
      return;
    }
  }
}

function setDir(s: State, x: number, y: number) {
  // 180도 반대 방향 금지
  if (s.dir.x === -x && s.dir.y === -y) return;
  if (x !== 0 && y !== 0) return;
  s.nextDir = { x, y };
}

const def: CanvasGameDef<State> = {
  unit: "점",
  bgClass: "bg-emerald-900",
  init: (W, H) => {
    const cell = Math.floor(W / COLS);
    const cols = COLS;
    const rows = Math.floor(H / cell);
    const ox = (W - cols * cell) / 2;
    const oy = (H - rows * cell) / 2;
    const cy = Math.floor(rows / 2);
    const s: State = {
      cell,
      cols,
      rows,
      ox,
      oy,
      snake: [
        { x: 5, y: cy },
        { x: 4, y: cy },
        { x: 3, y: cy },
      ],
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      food: { x: 10, y: cy },
      acc: 0,
      score: 0,
      over: false,
      sx: 0,
      sy: 0,
    };
    placeFood(s);
    return s;
  },
  onPointer: (s, x, y, kind) => {
    if (kind === "down") {
      s.sx = x;
      s.sy = y;
    } else if (kind === "up") {
      const dx = x - s.sx;
      const dy = y - s.sy;
      if (Math.abs(dx) < 14 && Math.abs(dy) < 14) return;
      if (Math.abs(dx) > Math.abs(dy)) setDir(s, dx > 0 ? 1 : -1, 0);
      else setDir(s, 0, dy > 0 ? 1 : -1);
    }
  },
  onKey: (s, key) => {
    if (key === "ArrowUp") setDir(s, 0, -1);
    else if (key === "ArrowDown") setDir(s, 0, 1);
    else if (key === "ArrowLeft") setDir(s, -1, 0);
    else if (key === "ArrowRight") setDir(s, 1, 0);
  },
  step: (s, dt) => {
    const interval = Math.max(0.07, 0.14 - s.score * 0.004);
    s.acc += dt;
    if (s.acc < interval) return false;
    s.acc -= interval;

    s.dir = s.nextDir;
    const head = s.snake[0];
    const nx = head.x + s.dir.x;
    const ny = head.y + s.dir.y;
    if (nx < 0 || ny < 0 || nx >= s.cols || ny >= s.rows) {
      s.over = true;
      return true;
    }
    if (s.snake.some((c, i) => i < s.snake.length - 1 && c.x === nx && c.y === ny)) {
      s.over = true;
      return true;
    }
    s.snake.unshift({ x: nx, y: ny });
    if (nx === s.food.x && ny === s.food.y) {
      s.score += 1;
      placeFood(s);
    } else {
      s.snake.pop();
    }
    return false;
  },
  score: (s) => s.score,
  draw: (ctx, s, W, H) => {
    ctx.clearRect(0, 0, W, H);
    const { cell, ox, oy } = s;
    // grid bg
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    for (let i = 0; i < s.cols; i++)
      for (let j = 0; j < s.rows; j++)
        if ((i + j) % 2 === 0)
          ctx.fillRect(ox + i * cell, oy + j * cell, cell, cell);
    // food
    ctx.font = `${cell * 0.9}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "🍎",
      ox + s.food.x * cell + cell / 2,
      oy + s.food.y * cell + cell / 2
    );
    // snake
    s.snake.forEach((c, i) => {
      ctx.fillStyle = i === 0 ? "#a7f3d0" : "#34d399";
      roundRect(ctx, ox + c.x * cell + 1, oy + c.y * cell + 1, cell - 2, cell - 2, 5);
      ctx.fill();
    });
  },
};

export default function Snake({
  onFinish,
}: {
  onFinish: (n: number) => void;
}) {
  return <CanvasGame meta={meta} def={def} onFinish={onFinish} />;
}
