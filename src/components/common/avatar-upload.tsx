"use client";

import * as React from "react";
import { Camera, ImageUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  size?: number;
  className?: string;
}

export function AvatarUpload({
  value,
  onChange,
  size = 112,
  className,
}: AvatarUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [loading, setLoading] = React.useState(false);

  const handleFile = (file: File) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result as string);
      setLoading(false);
    };
    reader.onerror = () => setLoading(false);
    reader.readAsDataURL(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={cn(
          "group relative grid place-items-center overflow-hidden rounded-full",
          "border-2 border-dashed border-border bg-secondary/40 transition-all",
          "hover:border-accent hover:bg-secondary/70 hover:scale-[1.02]"
        )}
        style={{ width: size, height: size }}
        aria-label="Upload profile picture"
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Avatar"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ImageUp className="h-6 w-6" />
            )}
            <span className="text-[10px] uppercase tracking-wider">
              Upload
            </span>
          </div>
        )}
        <div className="absolute inset-0 grid place-items-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="h-5 w-5 text-white" />
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <p className="text-xs text-muted-foreground">PNG or JPG, drag to drop</p>
    </div>
  );
}
