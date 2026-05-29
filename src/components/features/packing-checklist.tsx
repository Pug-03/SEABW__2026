/**
 * @file `<PackingChecklist>` — multi-preference packing list. Renders
 * one tab per user preference (beach / mountain / etc.). Each tab has
 * a default item list (from `PACKING_LISTS`) plus the user's custom
 * additions, persisted only in component state for the demo.
 *
 * (TH) checklist สัมภาระ มีหนึ่งแท็บต่อหนึ่ง preference ของผู้ใช้ (beach,
 * mountain ฯลฯ) แต่ละแท็บมีรายการ default จาก `PACKING_LISTS` รวมกับ
 * รายการที่ผู้ใช้เพิ่มเอง (เก็บใน state ไม่ persist สำหรับ demo)
 */

"use client";

import * as React from "react";
import { Backpack, Check, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PACKING_LISTS, PREFERENCE_META } from "@/lib/mock-data";
import type { Preference } from "@/lib/types";

/** Props — user's preferences drive which tabs appear. */
/** (TH) Props — preferences ของผู้ใช้กำหนดแท็บที่จะแสดง */
interface PackingChecklistProps {
  preferences: Preference[];
}

/**
 * The checklist component. Holds per-tab checked state and per-tab
 * custom items in local React state.
 *
 * (TH) คอมโพเนนต์ checklist เก็บ state รายการที่ติ๊กและรายการที่ผู้ใช้
 * เพิ่มเองแยกตามแต่ละแท็บ
 */
export function PackingChecklist({ preferences }: PackingChecklistProps) {
  // Fall back to "beach" when the user has no preferences yet — keeps
  // the UI from rendering an empty shell.
  // ถ้าผู้ใช้ยังไม่มี preference เลย ใช้ "beach" เป็น default — กัน UI ว่าง
  const active = React.useMemo<Preference[]>(
    () => (preferences.length ? preferences : ["beach"]),
    [preferences]
  );
  // Currently visible tab.
  // แท็บที่แสดงอยู่
  const [tab, setTab] = React.useState<Preference>(active[0]);
  // Map of "<tab>:<item>" → checked. Single map for all tabs.
  // map ของ "<tab>:<item>" → ติ๊ก/ไม่ติ๊ก รวมทุกแท็บใน map เดียว
  const [checked, setChecked] = React.useState<Record<string, boolean>>({});
  // Per-tab user-added items.
  // รายการที่ผู้ใช้เพิ่มเอง แยกตามแท็บ
  const [customItems, setCustomItems] = React.useState<
    Partial<Record<Preference, string[]>>
  >({});
  // Draft string for the "add item" input.
  // ค่า draft ของช่อง "เพิ่มรายการ"
  const [draft, setDraft] = React.useState("");
  // Inline validation error for "add item".
  // ข้อความ error ของการเพิ่มรายการ
  const [error, setError] = React.useState<string | null>(null);

  // If the active set changes and the current tab is no longer valid,
  // jump back to the first available tab.
  // ถ้า active เปลี่ยนจน tab ปัจจุบันใช้ไม่ได้ ให้ย้อนไปแท็บแรก
  React.useEffect(() => {
    if (!active.includes(tab)) setTab(active[0]);
  }, [active, tab]);

  // Resolve the item lists for the current tab.
  // ดึงรายการ default + ที่ผู้ใช้เพิ่ม ของแท็บปัจจุบัน
  const defaultItems = React.useMemo(() => PACKING_LISTS[tab] ?? [], [tab]);
  const userItems = React.useMemo(
    () => customItems[tab] ?? [],
    [customItems, tab]
  );
  const items = React.useMemo(
    () => [...defaultItems, ...userItems],
    [defaultItems, userItems]
  );
  // How many items are checked in the current tab.
  // จำนวนรายการที่ติ๊กแล้วในแท็บปัจจุบัน
  const doneCount = items.filter((i) => checked[`${tab}:${i}`]).length;

  /**
   * Add a user-typed item to the current tab. Rejects empty strings
   * and case-insensitive duplicates.
   *
   * (TH) เพิ่มรายการที่ผู้ใช้พิมพ์เข้าสู่แท็บปัจจุบัน — ไม่รับค่าว่างและ
   * รายการที่ซ้ำ (case-insensitive)
   */
  const addItem = (event: React.FormEvent) => {
    event.preventDefault();
    const item = draft.trim();
    if (!item) {
      setError("Enter an item to add.");
      return;
    }
    const duplicate = items.some((i) => i.toLowerCase() === item.toLowerCase());
    if (duplicate) {
      setError("That item is already on the list.");
      return;
    }
    setCustomItems((current) => ({
      ...current,
      [tab]: [...(current[tab] ?? []), item],
    }));
    setDraft("");
    setError(null);
  };

  /**
   * Remove a user-added item. Also clears its checked entry so we
   * don't leave dangling map keys.
   *
   * (TH) ลบรายการที่ผู้ใช้เพิ่มเอง — ลบ key ใน checked ด้วยเพื่อไม่ให้มี
   * key ค้าง
   */
  const removeCustomItem = (item: string) => {
    setCustomItems((current) => ({
      ...current,
      [tab]: (current[tab] ?? []).filter((i) => i !== item),
    }));
    setChecked((current) => {
      const next = { ...current };
      delete next[`${tab}:${item}`];
      return next;
    });
  };

  return (
    // Card wrapper.
    // ตัวห่อการ์ด
    <Card>
      {/* Header — title + progress badge. */}
      {/* header — ชื่อ + badge ความคืบหน้า */}
      <CardHeader className="pb-3">
        {/* Header row. */}
        {/* แถวหัว */}
        <div className="flex items-center justify-between">
          {/* Title with backpack icon. */}
          {/* ชื่อพร้อมไอคอนเป้ */}
          <CardTitle className="flex items-center gap-2 text-base">
            {/* Backpack icon. */}
            {/* ไอคอนเป้ */}
            <Backpack className="h-4 w-4 text-accent" /> Packing checklist
          </CardTitle>
          {/* Progress badge "done/total". */}
          {/* badge "เสร็จ/ทั้งหมด" */}
          <Badge variant="secondary">
            {doneCount}/{items.length}
          </Badge>
        </div>
      </CardHeader>
      {/* Body — tab buttons + add-item form + checklist. */}
      {/* body — ปุ่มแท็บ + ฟอร์มเพิ่มรายการ + checklist */}
      <CardContent className="space-y-3">
        {/* Tab pills row — one per active preference. */}
        {/* แถว pill แท็บ — หนึ่งอันต่อหนึ่ง preference */}
        <div className="flex flex-wrap gap-1">
          {active.map((p) => (
            /* One tab pill. */
            /* pill แท็บหนึ่งอัน */
            <button
              key={p}
              onClick={() => setTab(p)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                tab === p
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-border bg-secondary text-muted-foreground hover:bg-secondary/70"
              )}
            >
              {PREFERENCE_META[p].label}
            </button>
          ))}
        </div>

        {/* Add-item form. */}
        {/* ฟอร์มเพิ่มรายการ */}
        <form onSubmit={addItem} className="space-y-1.5">
          {/* Row: input + add button. */}
          {/* แถว: input + ปุ่ม add */}
          <div className="flex gap-2">
            {/* Text input. */}
            {/* ช่องกรอก */}
            <Input
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                if (error) setError(null);
              }}
              placeholder="Add packing item"
              aria-label="Add packing item"
            />
            {/* Submit (icon) button. */}
            {/* ปุ่ม submit แบบ icon */}
            <Button type="submit" variant="accent" size="icon" aria-label="Add item">
              {/* Plus icon. */}
              {/* ไอคอน + */}
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </form>

        {/* Item list. */}
        {/* รายการของแท็บปัจจุบัน */}
        <ul className="space-y-1.5">
          {items.map((item) => {
            const key = `${tab}:${item}`;
            const isChecked = !!checked[key];
            const isCustom = userItems.includes(item);
            return (
              <li key={key}>
                {/* Row container. */}
                {/* container ของแต่ละแถว */}
                <div
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors",
                    "hover:bg-secondary/60",
                    isChecked && "text-muted-foreground line-through"
                  )}
                >
                  {/* Whole left portion is a button that toggles checked. */}
                  {/* ฝั่งซ้ายเป็นปุ่มสำหรับ toggle ติ๊ก */}
                  <button
                    type="button"
                    onClick={() =>
                      setChecked((c) => ({ ...c, [key]: !c[key] }))
                    }
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                  >
                    {/* Custom checkbox box. */}
                    {/* checkbox custom */}
                    <span
                      className={cn(
                        "grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors",
                        isChecked
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border bg-background"
                      )}
                    >
                      {isChecked && <Check className="h-3 w-3" />}
                    </span>
                    {/* Item label (truncated if long). */}
                    {/* ชื่อรายการ (ตัดท้ายถ้ายาว) */}
                    <span className="min-w-0 truncate">{item}</span>
                  </button>
                  {isCustom && (
                    /* Remove button — only for items the user added. */
                    /* ปุ่มลบ — มีเฉพาะรายการที่ผู้ใช้เพิ่มเอง */
                    <button
                      type="button"
                      onClick={() => removeCustomItem(item)}
                      aria-label={`Remove ${item}`}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      {/* Close (X) icon. */}
                      {/* ไอคอน X */}
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
