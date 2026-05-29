/**
 * @file `<PhotoWall>` — shared photo grid for one trip group. Accepts
 * multiple files at once, reads each as a base64 data URL with
 * `FileReader`, and pushes them into the Zustand store via `addPhoto`.
 * Rendered in a "bento" layout where every 5th and 7th cell is
 * oversized for visual rhythm.
 *
 * (TH) คอมโพเนนต์ photo wall ของกลุ่มทริปหนึ่ง อัปโหลดได้หลายไฟล์พร้อมกัน
 * อ่านแต่ละไฟล์เป็น base64 ผ่าน `FileReader` แล้วเก็บเข้า store ด้วย
 * `addPhoto` เรียงเป็นกริด bento ที่ทุกใบที่ 5 และ 7 จะใหญ่กว่าปกติเพื่อ
 * จังหวะตา
 */

"use client";

import * as React from "react";
import { ImagePlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVibeStore } from "@/lib/store";

/** Props — just the group id; the store is queried internally. */
/** (TH) Props มีแค่ groupId; store จะถูก query ภายใน */
interface PhotoWallProps {
  groupId: string;
}

/**
 * Render the photo wall for one group. The store selector returns the
 * full `photos` array (stable reference); the per-group filter happens
 * inside a `useMemo` to avoid tripping React's external-store loop guard.
 *
 * (TH) แสดง photo wall ของกลุ่มเดียว — selector ดึง `photos` ทั้งหมด
 * (เสถียร) แล้วใช้ useMemo กรองตาม groupId เพื่อกัน warning ของ
 * useSyncExternalStore
 */
export function PhotoWall({ groupId }: PhotoWallProps) {
  // Pull the full photos array (stable reference between renders).
  // ดึง array รูปทั้งหมด (reference เสถียร)
  const allPhotos = useVibeStore((s) => s.photos);
  const addPhoto = useVibeStore((s) => s.addPhoto);
  // Filter to just this group's photos.
  // กรองเฉพาะรูปของกลุ่มนี้
  const photos = React.useMemo(
    () => allPhotos.filter((p) => p.groupId === groupId),
    [allPhotos, groupId]
  );
  // Hidden file input — triggered by the visible "Add photo" button.
  // input ไฟล์ที่ซ่อนไว้ — trigger จากปุ่ม "Add photo"
  const inputRef = React.useRef<HTMLInputElement>(null);
  // Optional caption to attach to the next upload batch.
  // caption (ถ้ามี) ที่จะแนบกับรูปชุดถัดไป
  const [pendingCaption, setPendingCaption] = React.useState("");

  /**
   * Read each chosen file as a base64 data URL and push it into the
   * store. Caption is applied to every file in the batch, then cleared.
   *
   * (TH) อ่านไฟล์ที่เลือกทีละไฟล์เป็น base64 แล้วเพิ่มเข้า store — caption
   * จะถูกแนบทุกไฟล์ในชุดเดียวกัน แล้วล้างค่า
   */
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
    // Card wrapper.
    // ตัวห่อการ์ด
    <Card>
      {/* Card header — title + photo count. */}
      {/* header — ชื่อ + จำนวนรูป */}
      <CardHeader className="pb-3">
        {/* Header row. */}
        {/* แถวหัว */}
        <div className="flex items-center justify-between">
          {/* Title with icon. */}
          {/* ชื่อพร้อมไอคอน */}
          <CardTitle className="flex items-center gap-2 text-base">
            {/* ImagePlus icon. */}
            {/* ไอคอน ImagePlus */}
            <ImagePlus className="h-4 w-4 text-accent" /> Trip memory wall
          </CardTitle>
          {/* Photo count caption. */}
          {/* คำว่า "{n} pinned" */}
          <span className="text-xs text-muted-foreground">
            {photos.length} pinned
          </span>
        </div>
      </CardHeader>
      {/* Card body — upload row + photo grid. */}
      {/* body — แถวอัปโหลด + กริดรูป */}
      <CardContent className="space-y-3">
        {/* Upload row — caption input + Add photo button + hidden file input. */}
        {/* แถวอัปโหลด — caption + ปุ่ม Add + input ไฟล์ที่ซ่อน */}
        <div className="flex flex-col gap-2 sm:flex-row">
          {/* Caption text input (not validated). */}
          {/* ช่อง caption (ไม่ต้อง validate) */}
          <input
            type="text"
            value={pendingCaption}
            onChange={(e) => setPendingCaption(e.target.value)}
            placeholder="Caption (optional)"
            className="h-10 flex-1 rounded-2xl border border-input bg-background/50 px-3 text-sm"
          />
          {/* Visible "Add photo" button that proxies to the hidden file input. */}
          {/* ปุ่ม "Add photo" ที่ proxy ไปยัง input ไฟล์ที่ซ่อน */}
          <Button variant="accent" onClick={() => inputRef.current?.click()}>
            <ImagePlus className="h-4 w-4" /> Add photo
          </Button>
          {/* Hidden file input — accepts multiple images. */}
          {/* input ไฟล์ที่ซ่อน — รับหลายภาพได้ */}
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
          /* Empty state — dashed-border panel with hint copy. */
          /* state ว่าง — panel เส้นประพร้อมคำแนะนำ */
          <div className="grid place-items-center rounded-2xl border border-dashed border-border/60 bg-secondary/20 py-10 text-center">
            {/* Placeholder icon. */}
            {/* ไอคอน placeholder */}
            <ImagePlus className="h-6 w-6 text-muted-foreground" />
            {/* Helper copy. */}
            {/* ข้อความช่วยเหลือ */}
            <p className="mt-2 text-sm text-muted-foreground">
              Drop in your favorite trip moments after the journey ends.
            </p>
          </div>
        ) : (
          /* Bento photo grid — 2 cols on mobile, 4 cols on md+. */
          /* กริดรูปแบบ bento — 2 คอลัมน์บนมือถือ, 4 คอลัมน์บน md ขึ้นไป */
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {photos.map((p, i) => (
              /* One photo cell with optional caption overlay. */
              /* เซลล์รูปหนึ่ง พร้อม overlay caption (ถ้ามี) */
              <figure
                key={p.id}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md",
                  // Every 5th cell — 2x2 hero.
                  // ทุกใบที่ 5 — ขยาย 2x2
                  i % 5 === 0 && "col-span-2 row-span-2",
                  // Every 7th cell (that isn't already 5n) — tall.
                  // ทุกใบที่ 7 (ที่ไม่ใช่ 5n) — สูง 2 แถว
                  i % 7 === 0 && i % 5 !== 0 && "row-span-2"
                )}
              >
                {/* The photo itself. */}
                {/* ตัวรูป */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imageDataUrl}
                  alt={p.caption || "Trip memory"}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  style={{ minHeight: 120 }}
                />
                {p.caption && (
                  /* Caption overlay at the bottom — gradient fade for legibility. */
                  /* overlay caption ด้านล่าง — ไล่สีดำเพื่อความอ่านง่าย */
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
