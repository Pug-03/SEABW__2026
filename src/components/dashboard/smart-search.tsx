/**
 * @file `<SmartSearch>` — the rounded "Where to next?" search bar at
 * the top of the dashboard. Shows a live dropdown of matching
 * destinations as the user types, and submits the query (or a picked
 * suggestion) via the `onSubmit` callback.
 *
 * (TH) ช่องค้นหา "Where to next?" บนหน้า dashboard มี dropdown แสดง
 * จุดหมายที่ตรงกับคำที่พิมพ์แบบ realtime และส่งคำค้นหา (หรือคำที่ถูกเลือก)
 * กลับผ่าน `onSubmit`
 */

"use client";

import * as React from "react";
import { Search, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DESTINATIONS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// Max suggestions shown in the dropdown — keeps the panel scannable.
// จำนวนคำแนะนำสูงสุดใน dropdown — เพื่อไม่ให้แผงยาวเกินไป
const MAX_SUGGESTIONS = 6;

// Delay before clearing focus on blur, in ms. Long enough for a
// suggestion click to register before the dropdown closes.
// ดีเลย์ก่อนปิด dropdown ตอน blur — เผื่อเวลาให้คลิกบนตัวเลือกถูกตรวจจับ
const BLUR_DELAY_MS = 200;

/**
 * Props for `<SmartSearch>`.
 *  - `initialQuery`     — controlled initial value when the parent
 *                          owns the query (e.g. /search page deep link).
 *  - `onSubmit`         — fired with the final query string on submit.
 *  - `onClear`          — fired when the X button is clicked.
 *  - `onPickSuggestion` — fired with a destination ID when a suggestion
 *                          row is clicked (lets the parent navigate).
 *
 * (TH) Props: initialQuery สำหรับค่าเริ่มต้นจาก parent, onSubmit ส่งคำค้น
 * ตอน submit, onClear ตอนกด X, onPickSuggestion ส่งกลับ id เมื่อเลือก
 * suggestion (เพื่อให้ parent ไปยังหน้าจุดหมาย)
 */
interface SmartSearchProps {
  initialQuery?: string;
  onSubmit: (query: string) => void;
  onClear?: () => void;
  onPickSuggestion?: (destinationId: string) => void;
}

/**
 * The smart search bar. Filters destinations client-side against
 * title/region/tags and shows up to 6 suggestions while focused.
 *
 * (TH) ช่องค้นหาอัจฉริยะ กรอง destination ฝั่ง client ด้วย title/region/tags
 * โชว์ suggestion ได้สูงสุด 6 รายการเมื่อ focus อยู่
 */
export function SmartSearch({
  initialQuery = "",
  onSubmit,
  onClear,
  onPickSuggestion,
}: SmartSearchProps) {
  // Local input value (so we don't push every keystroke up to the parent).
  // ค่า input ภายใน (ไม่ดันทุกคีย์กลับไปที่ parent)
  const [q, setQ] = React.useState(initialQuery);
  // Focus state controls whether the suggestion dropdown is shown.
  // state focus — คุมการแสดง dropdown
  const [focused, setFocused] = React.useState(false);

  // Re-sync from `initialQuery` if the parent updates it externally.
  // sync ค่ากลับเมื่อ parent อัปเดต initialQuery มา (เช่น deep link)
  React.useEffect(() => {
    setQ(initialQuery);
  }, [initialQuery]);

  /**
   * Compute filtered suggestions. Lowercase match against title,
   * region, or any tag. Capped at MAX_SUGGESTIONS.
   *
   * (TH) คำนวณ suggestion ที่ตรงกับคำค้น — เปรียบเทียบแบบ lowercase กับ
   * title, region, หรือ tag ใด ๆ จำกัดสูงสุดที่ MAX_SUGGESTIONS
   */
  const suggestions = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return DESTINATIONS.filter(
      (d) =>
        d.title.toLowerCase().includes(query) ||
        d.region.toLowerCase().includes(query) ||
        d.tags.some((t) => t.toLowerCase().includes(query))
    ).slice(0, MAX_SUGGESTIONS);
  }, [q]);

  /** Submit the current query, then close the dropdown. */
  /** (TH) submit คำค้นปัจจุบัน แล้วปิด dropdown */
  const submit = () => {
    onSubmit(q.trim());
    setFocused(false);
  };

  /** Clear the field and notify the parent. */
  /** (TH) ล้างคำค้น และแจ้ง parent */
  const clear = () => {
    setQ("");
    onClear?.();
  };

  return (
    // <form> wrapper — enables Enter-to-submit on the input.
    // <form> ห่อ — รองรับการกด Enter เพื่อ submit
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="relative mx-auto w-full max-w-2xl"
      role="search"
    >
      {/* Search bar capsule — icon, input, clear, "Smart" pill, submit. */}
      {/* แคปซูลของช่องค้นหา — icon, input, ปุ่มล้าง, ป้าย "Smart", ปุ่ม submit */}
      <div
        className={cn(
          "glass-strong flex items-center gap-3 rounded-full border px-5 py-3 shadow-lg transition-all",
          focused && "ring-2 ring-accent/40 shadow-2xl"
        )}
      >
        {/* Leading magnifier icon. */}
        {/* ไอคอนแว่นขยายด้านหน้า */}
        <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
        {/* The text input itself (transparent so the capsule's bg shows through). */}
        {/* input จริง พื้นใสเพื่อให้สีของแคปซูลโผล่ */}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          // Delay so a click on a suggestion can land before we close.
          // ดีเลย์เพื่อให้คลิก suggestion ทันก่อน dropdown ปิด
          onBlur={() => setTimeout(() => setFocused(false), BLUR_DELAY_MS)}
          placeholder="Where to next? Try Phuket, Kyoto, mountain trip…"
          aria-label="Search destinations"
          className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/70"
        />
        {q && (
          /* Clear (X) button — only when input has content. */
          /* ปุ่มล้าง (X) — แสดงเฉพาะเมื่อมีข้อความ */
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {/* "Smart" pill — desktop-only visual cue that AI is involved. */}
        {/* ป้าย "Smart" — แสดงเฉพาะจอใหญ่ บ่งบอกว่ามี AI ช่วย */}
        <div className="hidden items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent sm:flex">
          {/* Sparkle icon. */}
          {/* ไอคอนประกาย */}
          <Sparkles className="h-3 w-3" /> Smart
        </div>
        {/* Submit button — disabled when the field is empty. */}
        {/* ปุ่ม submit — disable ถ้ายังไม่ได้พิมพ์อะไร */}
        <Button
          type="submit"
          variant="accent"
          size="sm"
          className="hidden sm:inline-flex"
          disabled={!q.trim()}
        >
          Search
        </Button>
      </div>

      {focused && suggestions.length > 0 && (
        /* Floating suggestion dropdown — only when focused with hits. */
        /* dropdown suggestion ลอย — แสดงเมื่อ focus + มีผลลัพธ์ */
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-3xl border border-border/60 bg-card/95 shadow-xl backdrop-blur-2xl">
          {suggestions.map((d) => (
            /* One suggestion row — clicking picks it AND submits. */
            /* แถว suggestion หนึ่งรายการ — กดแล้ว pick + submit ทันที */
            <button
              key={d.id}
              type="button"
              // Prevent the blur from closing the dropdown before click fires.
              // กันไม่ให้ blur ปิด dropdown ก่อนเหตุการณ์ click ทำงาน
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setQ(d.title);
                onPickSuggestion?.(d.id);
                onSubmit(d.title);
                setFocused(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary"
            >
              {/* Thumbnail of the destination. */}
              {/* รูปย่อของจุดหมาย */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={d.imageUrl}
                alt={d.title}
                className="h-10 w-10 rounded-xl object-cover"
              />
              {/* Text block — title + "region · tags" subtitle. */}
              {/* ส่วนข้อความ — title + "region · tags" */}
              <div className="flex-1">
                {/* Destination title. */}
                {/* ชื่อจุดหมาย */}
                <div className="text-sm font-medium">{d.title}</div>
                {/* Region + tag list. */}
                {/* region + รายการ tag */}
                <div className="text-xs text-muted-foreground">
                  {d.region} · {d.tags.join(", ")}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
