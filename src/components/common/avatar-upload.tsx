/**
 * @file `<AvatarUpload>` — circular drag-and-drop / click-to-upload
 * avatar picker. Reads the chosen image via `FileReader` and hands the
 * resulting base64 data URL back to the caller through `onChange`.
 *
 * Used by the registration flow and the profile-edit modal.
 *
 * (TH) คอมโพเนนต์เลือกรูปโปรไฟล์แบบกลม รองรับทั้งลากวางและคลิกเลือก
 * อ่านไฟล์ที่เลือกผ่าน `FileReader` แล้วส่งกลับเป็น base64 data URL ผ่าน
 * `onChange` ใช้ในขั้นตอนสมัครและในหน้าแก้โปรไฟล์
 */

"use client";

import * as React from "react";
import { Camera, ImageUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * Props for `<AvatarUpload>`.
 *  - `value`    — current base64 data URL (or undefined).
 *  - `onChange` — emits new data URL (or undefined to clear).
 *  - `size`     — circle diameter in px (default 112).
 *
 * (TH) Props: `value` คือ data URL ปัจจุบัน, `onChange` ส่งค่าใหม่กลับ
 * (หรือ undefined เพื่อล้างค่า), `size` คือเส้นผ่านศูนย์กลางวงกลม (default 112)
 */
interface AvatarUploadProps {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  size?: number;
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Circular avatar picker. The whole circle is a button: clicking opens
 * the hidden file input, dragging an image over it triggers a drop
 * handler with the same effect.
 *
 * (TH) ปุ่มเลือกรูปโปรไฟล์ทรงกลม — คลิกที่วงกลมจะเปิด file picker, หรือ
 * ลากรูปมาวางก็ได้ผลเหมือนกัน
 */
export function AvatarUpload({
  value,
  onChange,
  size = 112,
  className,
}: AvatarUploadProps) {
  // Ref to the hidden <input type="file"> so we can trigger it on click.
  // ref ของ <input type="file"> ที่ซ่อนไว้ ใช้สำหรับ trigger ตอนคลิก
  const inputRef = React.useRef<HTMLInputElement>(null);
  // True while a FileReader is decoding the chosen image.
  // เป็น true ระหว่าง FileReader กำลังอ่านไฟล์
  const [loading, setLoading] = React.useState(false);

  /**
   * Read a `File` as a base64 data URL and bubble it up.
   * Errors clear the loading state but otherwise stay silent —
   * upstream form code is responsible for surfacing UI errors.
   *
   * (TH) อ่านไฟล์เป็น base64 แล้วยิงกลับผ่าน `onChange`
   * ถ้า error จะแค่ปลด loading ไม่แสดง message — ปล่อยให้ฟอร์มข้างนอกจัดการ
   */
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

  /**
   * Drop handler — accepts the first dropped file if it's an image.
   * preventDefault is required to stop the browser from navigating to
   * the image (default drop behavior).
   *
   * (TH) handler ตอนวางไฟล์ — รับไฟล์แรกถ้าเป็นรูป
   * ต้องเรียก preventDefault ไม่งั้นบราวเซอร์จะเปิดรูปแทนการรับเข้า
   */
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  return (
    // Outer column wrapper — picker on top, helper text underneath.
    // คอลัมน์: ปุ่มเลือกรูปด้านบน + ข้อความช่วยเหลือด้านล่าง
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {/* The circular picker — also the drop zone. */}
      {/* ปุ่มกลม — เป็นทั้งตัวเลือกรูปและ drop zone */}
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
          /* Current avatar image (if a value has been chosen). */
          /* รูปโปรไฟล์ปัจจุบัน (ถ้ามีค่าแล้ว) */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Avatar"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          /* Empty state — icon + "Upload" caption (or spinner). */
          /* state ว่าง — แสดง icon + คำว่า "Upload" (หรือ spinner) */
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            {loading ? (
              // Spinner while FileReader is decoding.
              // spinner ระหว่าง FileReader กำลังอ่านไฟล์
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              // Idle icon shown when no image and not loading.
              // ไอคอนปกติเมื่อยังไม่มีรูปและไม่ได้กำลังโหลด
              <ImageUp className="h-6 w-6" />
            )}
            {/* Small "Upload" caption under the icon. */}
            {/* ข้อความ "Upload" เล็ก ๆ ใต้ icon */}
            <span className="text-[10px] uppercase tracking-wider">
              Upload
            </span>
          </div>
        )}
        {/* Hover overlay — dark scrim + camera icon, fades in on hover. */}
        {/* overlay ตอน hover — พื้นมืดทับ + ไอคอนกล้อง */}
        <div className="absolute inset-0 grid place-items-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          {/* Camera icon shown over the avatar on hover. */}
          {/* ไอคอนกล้องโชว์ทับ avatar ตอน hover */}
          <Camera className="h-5 w-5 text-white" />
        </div>
      </button>
      {/* Hidden file input — triggered by the button click above. */}
      {/* input ไฟล์ที่ซ่อนไว้ — trigger ตอนคลิกปุ่มข้างบน */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          // Process the first file chosen via the native picker.
          // ส่งไฟล์แรกที่เลือกจาก native picker เข้า handleFile
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      {/* Helper text under the picker. */}
      {/* ข้อความแนะนำใต้ปุ่ม */}
      <p className="text-xs text-muted-foreground">PNG or JPG, drag to drop</p>
    </div>
  );
}
