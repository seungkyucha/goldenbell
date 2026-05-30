"use client";

import type { GameId } from "@/lib/types";
import TapRush from "./TapRush";
import WhackMole from "./WhackMole";
import StarCatch from "./StarCatch";

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
    case "tap-rush":
    default:
      return <TapRush onFinish={onFinish} />;
  }
}
