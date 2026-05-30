import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "골든벨 🔔 — 상품 걸고 친구랑 한판!",
  description:
    "내가 상품을 걸고, 친구들을 챗방에 초대해, 게임 점수로 1등을 가린다. 하이퍼캐주얼 소셜 게임 골든벨.",
  applicationName: "골든벨",
  openGraph: {
    title: "골든벨 🔔 — 상품 걸고 친구랑 한판!",
    description: "게임 점수로 1등 가리고 상품 받자! 지금 참가하기 👇",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#fee500",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full bg-kakao-bg text-kakao-label antialiased">
        {/* React 19 가 stylesheet 링크를 <head> 로 호이스트한다 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        {/* Mobile-first phone frame, centered on desktop */}
        <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-kakao-bg shadow-xl shadow-black/5">
          {children}
        </div>
      </body>
    </html>
  );
}
