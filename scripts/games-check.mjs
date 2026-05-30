const BASE = process.env.BASE || "http://localhost:3211";
const GAME_IDS = [
  "tap-rush", "whack-mole", "star-catch",
  "flappy", "dino", "stack", "snake", "2048", "suika",
];
let pass = 0, fail = 0;
for (const gameId of GAME_IDS) {
  const c = await (
    await fetch(BASE + "/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "테스트", gameId, hostName: "방장", type: "personal",
        prize: { name: "피자", emoji: "🍕", value: 25000, winners: 1 },
      }),
    })
  ).json();
  const ok1 = typeof c.id === "string";
  // 방 조회 + 게임 일치
  const room = await (await fetch(`${BASE}/api/rooms/${c.id}?uid=u&d=${c.encoded}`)).json();
  const ok2 = room.room.gameId === gameId;
  // 플레이 페이지 렌더(200)
  const play = await fetch(`${BASE}/room/${c.id}/play?d=${c.encoded}`);
  const ok3 = play.status === 200;
  const ok = ok1 && ok2 && ok3;
  if (ok) pass++; else fail++;
  console.log(`  ${ok ? "PASS" : "FAIL"} ${gameId.padEnd(11)} create=${ok1} match=${ok2} play=${ok3}`);
}
console.log(`\nRESULT: ${pass}/${GAME_IDS.length} games OK`);
process.exit(fail === 0 ? 0 : 1);
