import type { Room, RoomConfig } from "./types";
import { getCredits, getLeaderboard } from "./store";

export interface RoomResponseBody {
  room: RoomConfig & { views: number };
  leaderboard: ReturnType<typeof getLeaderboard>;
  credits: ReturnType<typeof getCredits>;
  myRank: number | null;
}

export function buildRoomResponse(room: Room, uid: string): RoomResponseBody {
  const leaderboard = getLeaderboard(room);
  const credits = getCredits(room, uid);
  const mine = leaderboard.find((e) => e.userId === uid);
  return {
    room: {
      id: room.id,
      title: room.title,
      gameId: room.gameId,
      hostName: room.hostName,
      type: room.type,
      prize: room.prize,
      banner: room.banner,
      createdAt: room.createdAt,
      views: room.views,
    },
    leaderboard,
    credits,
    myRank: mine?.rank ?? null,
  };
}
