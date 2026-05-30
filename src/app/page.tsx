import Link from "next/link";
import { GAMES } from "@/lib/games";
import { PRICING, formatWon } from "@/lib/util";

const STEPS = [
  { emoji: "🎁", title: "상품을 건다", desc: "피자·치킨·기프티콘… 우승 상품을 결제해 방을 만들어요." },
  { emoji: "💬", title: "챗방에 공유", desc: "카톡으로 링크를 뿌리면 친구들이 바로 참가!" },
  { emoji: "🏆", title: "최고 점수 1등", desc: "하이퍼캐주얼 게임으로 점수 경쟁, 1등이 상품 획득!" },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col pb-28">
      {/* 브랜드 헤더 */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-center bg-kakao-yellow text-kakao-brown">
        <span className="text-lg font-extrabold tracking-tight">골든벨 🔔</span>
      </header>

      {/* 히어로 */}
      <section className="bg-kakao-yellow px-6 pb-8 pt-4 text-kakao-brown">
        <h2 className="text-[26px] font-black leading-tight">
          상품 걸고
          <br />
          친구랑 한판! 🔔
        </h2>
        <p className="mt-3 text-sm font-medium text-kakao-brown/70">
          내가 쏘는 오늘의 상품, 게임 점수로 1등을 가린다.
          <br />
          카톡으로 공유하고 다 같이 하하호호 경쟁!
        </p>
      </section>

      {/* 작동 방식 - 카톡 말풍선 느낌 */}
      <section className="space-y-3 px-5 py-6">
        <h3 className="px-1 text-sm font-bold text-kakao-sub">이렇게 즐겨요</h3>
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm">
              {s.emoji}
            </div>
            <div className="rounded-2xl rounded-tl-md bg-white px-4 py-3 shadow-sm">
              <p className="text-sm font-bold">
                {i + 1}. {s.title}
              </p>
              <p className="mt-0.5 text-xs text-kakao-sub">{s.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* 게임 소개 */}
      <section className="px-5 py-2">
        <h3 className="px-1 pb-3 text-sm font-bold text-kakao-sub">
          한판 게임 3종 · 단순 점수 경쟁
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {GAMES.map((g) => (
            <div
              key={g.id}
              className="flex flex-col items-center gap-1 rounded-2xl bg-white p-3 text-center shadow-sm"
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl"
                style={{ background: g.color }}
              >
                {g.emoji}
              </div>
              <p className="mt-1 text-sm font-bold">{g.name}</p>
              <p className="text-[11px] leading-tight text-kakao-sub">
                {g.tagline}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 유저 타입 */}
      <section className="space-y-3 px-5 py-6">
        <h3 className="px-1 text-sm font-bold text-kakao-sub">이런 분들이 써요</h3>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm font-extrabold">🙌 일반 유저</p>
          <p className="mt-1 text-xs text-kakao-sub">
            “추석 기념 오늘 내가 피자 한판 쏜다! 우승자 1명!”
            <br />
            친구·가족 챗방에 공유해 다 같이 경쟁.
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm font-extrabold">📣 커머스 유저</p>
          <p className="mt-1 text-xs text-kakao-sub">
            “치킨 100개 걸고 바이럴!” 상단 광고 배너로 브랜드를 노출하고,
            참가 수 = 광고 노출(UV). 광고 터치 시 +1회 보너스 제공.
          </p>
        </div>
      </section>

      {/* 푸터 / BM */}
      <section className="px-5 pb-4">
        <p className="text-center text-[11px] leading-relaxed text-kakao-sub">
          무료 1회 · 공유하면 +1회 · 광고 보면 +1회 · 더 하고 싶으면{" "}
          {formatWon(PRICING.playPackPrice)}에 {PRICING.playPackQty}회 충전
          <br />
          데모 서비스 — 실제 결제는 발생하지 않아요.
        </p>
      </section>

      {/* 하단 고정 CTA */}
      <div className="fixed bottom-0 z-40 w-full max-w-[480px] border-t border-kakao-line bg-white/95 p-4 backdrop-blur">
        <Link
          href="/create"
          className="btn-press block w-full rounded-2xl bg-kakao-yellow py-4 text-center text-base font-bold text-kakao-brown shadow-md"
        >
          🎁 방 만들기
        </Link>
      </div>
    </main>
  );
}
