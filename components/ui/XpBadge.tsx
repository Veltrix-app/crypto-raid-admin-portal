"use client";

import Image from "next/image";
import type { ReactNode } from "react";

const sizeStyles = {
  xs: { image: "h-4 w-4", sizes: "16px", text: "text-[9px]" },
  sm: { image: "h-5 w-5", sizes: "20px", text: "text-[10px]" },
  md: { image: "h-7 w-7", sizes: "28px", text: "text-[12px]" },
  lg: { image: "h-10 w-10", sizes: "40px", text: "text-[0.95rem]" },
} as const;

export function isXpDisplay(...parts: Array<string | number | null | undefined>) {
  return /\bXP\b/i.test(parts.map((part) => part ?? "").join(" "));
}

export function XpBadgeMark({
  size = "sm",
  className = "",
}: {
  size?: keyof typeof sizeStyles;
  className?: string;
}) {
  const styles = sizeStyles[size];

  return (
    <span className={`relative inline-flex shrink-0 ${styles.image} ${className}`}>
      <Image
        src="/brand/xp/xp-badge.webp"
        alt=""
        fill
        sizes={styles.sizes}
        className="object-contain brightness-110 saturate-125 drop-shadow-[0_0_9px_rgba(217,70,239,0.18)]"
      />
    </span>
  );
}

export function XpValue({
  children,
  size = "sm",
  className = "",
  textClassName = "text-fuchsia-100",
}: {
  children: ReactNode;
  size?: keyof typeof sizeStyles;
  className?: string;
  textClassName?: string;
}) {
  const styles = sizeStyles[size];

  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 ${className}`}>
      <XpBadgeMark size={size} />
      <span className={`truncate font-bold ${textClassName} ${styles.text}`}>{children}</span>
    </span>
  );
}
