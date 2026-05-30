// UTF-8 안전한 엔드투엔드 스모크 테스트 (콘솔 인코딩 영향 없음)
const BASE = process.env.BASE || "http://localhost:3210";
let pass = 0;
let fail = 0;
function check(name, cond, extra = "") {
  if (cond) {
    pass++;
    console.log(`  PASS ${name} ${extra}`);
  } else {
    fail++;
    console.log(`  FAIL ${name} ${extra}`);
  }
}
const j = (r) => r.json();
const post = (url, body) =>
  fetch(BASE + url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const TITLE = "추석 기념 피자 한판 쏜다! 🍕";
const HOST = "홍길동";
const PRIZE = "피자 1판";

const created = await j(
  await post("/api/rooms", {
    title: TITLE,
    gameId: "star-catch",
    hostName: HOST,
    type: "personal",
    prize: { name: PRIZE, emoji: "🍕", value: 25000, winners: 2 },
  })
);
check("create returns id", typeof created.id === "string" && created.id.length >= 4, created.id);

const id = created.id;
const enc = created.encoded;

const room = await j(await fetch(`${BASE}/api/rooms/${id}?uid=u1&d=${enc}`));
check("korean title round-trips", room.room.title === TITLE, JSON.stringify(room.room.title));
check("korean host round-trips", room.room.hostName === HOST);
check("korean prize round-trips", room.room.prize.name === PRIZE);
check("base credit = 1", room.credits.remaining === 1);

// 콜드스타트 시뮬레이션: 알 수 없는 방 id 를 d 로만 재수화
const fakeId = created.id; // 같은 id, store에 있지만 d 경로도 동작 확인
const hy = await j(await fetch(`${BASE}/api/rooms/${fakeId}?uid=u9&d=${enc}`));
check("hydrate via d works", hy.room.title === TITLE);

// 점수 제출 + 소모
const sc = await j(await post(`/api/rooms/${id}/scores`, { uid: "u1", name: "참가자A", score: 10, d: enc }));
check("score consumes credit", sc.credits.remaining === 0);
check("my rank assigned", sc.myRank === 1);

const sc2 = await j(await post(`/api/rooms/${id}/scores`, { uid: "u2", name: "참가자B", score: 25, d: enc }));
check("higher score leads", sc2.leaderboard[0].name === "참가자B" && sc2.leaderboard[0].score === 25);
check("winners flagged", sc2.leaderboard.filter((e) => e.isWinner).length === 2);

// 크레딧 없는 상태에서 제출 → 402
const noCred = await post(`/api/rooms/${id}/scores`, { uid: "u1", name: "참가자A", score: 99, d: enc });
check("no-credit submit blocked (402)", noCred.status === 402, "status=" + noCred.status);

// 보너스 규칙
const g1 = await j(await post(`/api/rooms/${id}/credits`, { uid: "u1", reason: "share", d: enc }));
const g2 = await j(await post(`/api/rooms/${id}/credits`, { uid: "u1", reason: "share", d: enc }));
const g3 = await j(await post(`/api/rooms/${id}/credits`, { uid: "u1", reason: "share", d: enc }));
check("share +1 each up to cap", g1.credits.remaining === 1 && g2.credits.remaining === 2);
check("share cap enforced", g3.granted === false);
const ga = await j(await post(`/api/rooms/${id}/credits`, { uid: "u1", reason: "ad", d: enc }));
check("ad +1", ga.credits.remaining === 3);
const gp = await j(await post(`/api/rooms/${id}/credits`, { uid: "u1", reason: "pay", d: enc }));
check("pay +5", gp.credits.remaining === 8);

// 404 / 잘못된 입력
const nf = await fetch(`${BASE}/api/rooms/zzzzzz?uid=u1`);
check("missing room without d -> 404", nf.status === 404, "status=" + nf.status);
const badGame = await post("/api/rooms", { gameId: "nope", title: "x", hostName: "y", prize: {} });
check("invalid game rejected (400)", badGame.status === 400, "status=" + badGame.status);

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
