"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";

export function AppBar({
  title,
  backHref,
  right,
}: {
  title: ReactNode;
  backHref?: string;
  right?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-kakao-yellow px-2 text-kakao-brown">
      <div className="flex w-12 justify-start">
        {backHref && (
          <Link
            href={backHref}
            aria-label="뒤로"
            className="btn-press flex h-10 w-10 items-center justify-center rounded-full text-2xl"
          >
            ‹
          </Link>
        )}
      </div>
      <h1 className="truncate text-base font-bold">{title}</h1>
      <div className="flex w-12 justify-end">{right}</div>
    </header>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn-press w-full rounded-2xl bg-kakao-yellow py-4 text-center text-base font-bold text-kakao-brown shadow-md disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`btn-press w-full rounded-2xl border border-kakao-line bg-white py-4 text-center text-base font-bold text-kakao-label shadow-sm disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl bg-white p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-center">
      <div
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute bottom-0 w-full max-w-[480px]">
        <div className="animate-sheet rounded-t-3xl bg-white px-5 pb-8 pt-4">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-kakao-line" />
          {title && (
            <h2 className="mb-3 text-center text-lg font-bold">{title}</h2>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
