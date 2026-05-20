"use client";

import { QRCodeCanvas } from "qrcode.react";
import { cn } from "@/lib/utils";

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
  label?: string;
}

export function QRCode({ value, size = 180, className, label }: QRCodeProps) {
  return (
    <div
      className={cn(
        "inline-flex flex-col items-center gap-2 rounded-3xl border border-border/60 bg-white p-4 text-neutral-950 shadow-lg",
        className
      )}
    >
      <QRCodeCanvas
        value={value}
        size={size}
        level="H"
        marginSize={2}
        bgColor="#ffffff"
        fgColor="#000000"
      />
      {label && (
        <span className="text-xs font-medium text-neutral-600">{label}</span>
      )}
    </div>
  );
}
