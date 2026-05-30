import type { Metadata } from "next";
import { decodeRoomConfig } from "@/lib/roomCode";
import RoomClient from "./RoomClient";

type SP = Promise<{ d?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SP;
}): Promise<Metadata> {
  const { d } = await searchParams;
  const cfg = d ? decodeRoomConfig(d) : null;
  if (!cfg) return { title: "골든벨 🔔" };
  const title = `${cfg.prize.emoji} ${cfg.title}`;
  const description = `${cfg.hostName}님이 ${cfg.prize.name}을(를) 걸었어요! 게임 점수로 1등 가리기 🏆 지금 참가하기 👇`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  };
}

export default async function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SP;
}) {
  const { id } = await params;
  const { d } = await searchParams;
  return <RoomClient id={id} encoded={d} />;
}
