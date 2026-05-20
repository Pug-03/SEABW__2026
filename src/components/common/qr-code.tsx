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
        "inline-flex flex-col items-center gap-2 rounded-3xl bg-white p-4 shadow-lg",
        className
      )}
    >
      <QRCodeCanvas
        value={value}
        size={size}
        level="H"
        marginSize={2}
        bgColor="#ffffff"
        fgColor="#0b0b0f"
      />
      {label && (
        <span className="text-xs font-medium text-neutral-700">{label}</span>
      )}
    </div>
  );
}
