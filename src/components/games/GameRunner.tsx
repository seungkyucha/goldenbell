"use client";

import type { GameId } from "@/lib/types";
import TapRush from "./TapRush";
import WhackMole from "./WhackMole";
import StarCatch from "./StarCatch";
import Flappy from "./Flappy";
import Dino from "./Dino";
import Stack from "./Stack";
import Snake from "./Snake";
import Game2048 from "./Game2048";
import Suika from "./Suika";

export default function GameRunner({
  gameId,
  onFinish,
}: {
  gameId: GameId;
  onFinish: (score: number) => void;
}) {
  switch (gameId) {
    case "whack-mole":
      return <WhackMole onFinish={onFinish} />;
    case "star-catch":
      return <StarCatch onFinish={onFinish} />;
    case "flappy":
      return <Flappy onFinish={onFinish} />;
    case "dino":
      return <Dino onFinish={onFinish} />;
    case "stack":
      return <Stack onFinish={onFinish} />;
    case "snake":
      return <Snake onFinish={onFinish} />;
    case "2048":
      return <Game2048 onFinish={onFinish} />;
    case "suika":
      return <Suika onFinish={onFinish} />;
    case "tap-rush":
    default:
      return <TapRush onFinish={onFinish} />;
  }
}
