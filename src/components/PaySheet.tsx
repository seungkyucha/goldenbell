"use client";

import { useState } from "react";
import { Sheet } from "./ui";
import { formatWon } from "@/lib/util";

export interface PayLine {
  label: string;
  amount: number;
  sub?: boolean;
}

/**
 * 카카오페이 스타일의 목(mock) 결제 시트.
 * 실제 PG/카카오 선물하기 연동 자리를 시뮬레이션한다.
 */
export function PaySheet({
  open,
  onClose,
  title,
  lines,
  cta,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  lines: PayLine[];
  cta?: string;
  onSuccess: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "paying" | "done">("idle");
  const total = lines.filter((l) => !l.sub).reduce((s, l) => s + l.amount, 0);

  function pay() {
    setStatus("paying");
    setTimeout(() => {
      setStatus("done");
      setTimeout(() => {
        onSuccess();
        setStatus("idle");
      }, 800);
    }, 1100);
  }

  function close() {
    if (status === "paying") return;
    setStatus("idle");
    onClose();
  }

  return (
    <Sheet open={open} onClose={close} title={title}>
      {status === "done" ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-kakao-green text-4xl text-white">
            ✓
          </div>
          <p className="text-lg font-bold">결제 완료!</p>
        </div>
      ) : (
        <>
          <div className="mb-4 rounded-2xl bg-kakao-bg p-4">
            {lines.map((l, i) => (
              <div
                key={i}
                className={`flex items-center justify-between py-1.5 ${
                  l.sub ? "text-sm text-kakao-sub" : "font-medium"
                }`}
              >
                <span>{l.label}</span>
                <span>{formatWon(l.amount)}</span>
              </div>
            ))}
            <div className="my-2 border-t border-kakao-line" />
            <div className="flex items-center justify-between text-lg font-extrabold">
              <span>총 결제금액</span>
              <span>{formatWon(total)}</span>
            </div>
          </div>

          <div className="mb-3 flex items-center gap-2 rounded-xl bg-[#FFEB00]/40 px-3 py-2 text-xs text-kakao-brown">
            <span className="rounded bg-[#391B1B] px-1.5 py-0.5 font-bold text-[#FFEB00]">
              pay
            </span>
            카카오페이 머니 · 데모 결제 (실제 청구되지 않아요)
          </div>

          <button
            onClick={pay}
            disabled={status === "paying"}
            className="btn-press w-full rounded-2xl bg-kakao-yellow py-4 text-base font-bold text-kakao-brown shadow-md disabled:opacity-60"
          >
            {status === "paying"
              ? "결제 중…"
              : (cta ?? `${formatWon(total)} 결제하기`)}
          </button>
        </>
      )}
    </Sheet>
  );
}
