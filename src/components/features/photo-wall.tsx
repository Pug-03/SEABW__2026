"use client";

import * as React from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVibeStore } from "@/lib/store";

interface PhotoWallProps {
  groupId: string;
}

export function PhotoWall({ groupId }: PhotoWallProps) {
  // Select the raw array (stable reference) and derive the filtered list with
  // useMemo. A `.filter()` inside the selector would produce a new reference on
  // every call and trip React's useSyncExternalStore loop guard.
  const allPhotos = useVibeStore((s) => s.photos);
  const addPhoto = useVibeStore((s) => s.addPhoto);
  const photos = React.useMemo(
    () => allPhotos.filter((p) => p.groupId === groupId),
    [allPhotos, groupId]
  );
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [pendingCaption, setPendingCaption] = React.useState("");

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        addPhoto({
          groupId,
          imageDataUrl: reader.result as string,
          caption: pendingCaption || "",
        });
      };
      reader.readAsDataURL(f);
    });
    setPendingCaption("");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ImagePlus className="h-4 w-4 text-accent" /> Trip memory wall
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {photos.length} pinned
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={pendingCaption}
            onChange={(e) => setPendingCaption(e.target.value)}
            placeholder="Caption (optional)"
            className="h-10 flex-1 rounded-2xl border border-input bg-background/50 px-3 text-sm"
          />
          <Button variant="accent" onClick={() => inputRef.current?.click()}>
            <ImagePlus className="h-4 w-4" /> Add photo
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
        </div>

        {photos.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-border/60 bg-secondary/20 py-10 text-center">
            <ImagePlus className="h-6 w-6 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Drop in your favorite trip moments after the journey ends.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {photos.map((p, i) => (
              <figure
                key={p.id}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md",
                  i % 5 === 0 && "col-span-2 row-span-2",
                  i % 7 === 0 && i % 5 !== 0 && "row-span-2"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imageDataUrl}
                  alt={p.caption || "Trip memory"}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  style={{ minHeight: 120 }}
                />
                {p.caption && (
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-xs text-white">
                    {p.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
