/**
 * @file Group poll widgets — `<PollCard>` displays a poll and lets
 * members vote, and `<PollComposer>` is the inline editor used to
 * create a new poll. Both call into the Zustand store (`votePoll` is
 * subscribed inside the card; `onCreate` is delegated to the parent
 * because the composer doesn't know the author identity).
 *
 * (TH) วิดเจ็ตโพลของกลุ่ม — `<PollCard>` แสดงโพลและให้สมาชิกโหวต,
 * `<PollComposer>` คือ editor สำหรับสร้างโพลใหม่ การ์ดเชื่อม `votePoll`
 * จาก store เอง ส่วน composer ส่งต่อ `onCreate` ให้ parent (เพราะไม่รู้
 * ตัวตนผู้สร้าง)
 */

"use client";

import * as React from "react";
import { BarChart3, Check, Plus, Trash2, Vote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useVibeStore } from "@/lib/store";
import type { Poll } from "@/lib/types";

// ─── PollCard ───────────────────────────────────────────────────────────────

/** Props for the poll display card. */
/** (TH) Props ของการ์ดแสดงโพล */
interface PollCardProps {
  poll: Poll;
  userId: string;
}

/**
 * Display a poll with progress bars per option. Clicking an option
 * casts (or changes) the current user's vote.
 *
 * (TH) แสดงโพลพร้อมแถบ progress ของแต่ละตัวเลือก กดตัวเลือกเพื่อโหวต
 * หรือเปลี่ยนการโหวตของผู้ใช้ปัจจุบัน
 */
export function PollCard({ poll, userId }: PollCardProps) {
  const vote = useVibeStore((s) => s.votePoll);
  // Total votes across all options — used as the denominator for percentages.
  // ผลรวมการโหวตทุกตัวเลือก — ใช้เป็นตัวหารคำนวณ %
  const totalVotes = poll.options.reduce((s, o) => s + o.votes.length, 0);

  return (
    // Card with accent-tinted border.
    // การ์ดที่มีขอบสี accent
    <Card className="border-accent/30 bg-accent/5">
      {/* Body container. */}
      {/* container ของ body */}
      <CardContent className="space-y-3 p-4">
        {/* Header row — "Poll" badge + vote count. */}
        {/* แถวหัว — badge "Poll" + จำนวนโหวต */}
        <div className="flex items-center gap-2">
          {/* "Poll" badge with vote icon. */}
          {/* badge "Poll" พร้อมไอคอน */}
          <Badge variant="accent">
            <Vote className="h-3 w-3" /> Poll
          </Badge>
          {/* Vote count caption. */}
          {/* คำว่าจำนวนโหวต */}
          <span className="text-xs text-muted-foreground">
            {totalVotes} vote{totalVotes === 1 ? "" : "s"}
          </span>
        </div>
        {/* Question text. */}
        {/* ข้อความคำถาม */}
        <h4 className="text-sm font-semibold tracking-tight">
          {poll.question}
        </h4>
        {/* Option list. */}
        {/* รายการตัวเลือก */}
        <ul className="space-y-2">
          {poll.options.map((o) => {
            // Percentage filled — 0 when no votes yet.
            // เปอร์เซ็นต์ที่เติม — 0 เมื่อยังไม่มีโหวต
            const pct = totalVotes ? (o.votes.length / totalVotes) * 100 : 0;
            // Did the current user vote for this option?
            // ผู้ใช้ปัจจุบันโหวตตัวเลือกนี้หรือไม่?
            const userVoted = o.votes.includes(userId);
            return (
              <li key={o.id}>
                {/* Whole option row is a button. */}
                {/* ทั้งแถวเป็นปุ่ม */}
                <button
                  onClick={() => vote(poll.groupId, poll.id, o.id, userId)}
                  className={cn(
                    "group relative w-full overflow-hidden rounded-2xl border bg-background px-3 py-2.5 text-left text-sm transition-colors",
                    userVoted
                      ? "border-accent ring-1 ring-accent/40"
                      : "border-border hover:border-accent/40"
                  )}
                >
                  {/* Animated fill bar showing the option's share. */}
                  {/* แถบ fill ที่แสดงสัดส่วนของตัวเลือก */}
                  <span
                    className="absolute inset-y-0 left-0 -z-0 bg-accent/15 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                  {/* Foreground content — label on left, % on right. */}
                  {/* เนื้อหาด้านหน้า — label ซ้าย, % ขวา */}
                  <span className="relative z-10 flex items-center justify-between gap-2">
                    {/* Label cluster — optional check + text. */}
                    {/* กลุ่ม label — เครื่องหมายถูก (ถ้าโหวต) + ข้อความ */}
                    <span className="flex items-center gap-2">
                      {userVoted && <Check className="h-3.5 w-3.5 text-accent" />}
                      {o.label}
                    </span>
                    {/* Percentage value (tabular for alignment). */}
                    {/* ค่า % (tabular-nums เพื่อจัดแนว) */}
                    <span className="text-xs font-medium tabular-nums">
                      {Math.round(pct)}%
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

// ─── PollComposer ────────────────────────────────────────────────────────────

/** Props for the inline poll editor. */
/** (TH) Props ของ editor สร้างโพล */
interface PollComposerProps {
  groupId: string;
  onCreate: (question: string, options: string[]) => void;
  onCancel: () => void;
}

/**
 * Inline composer for creating a new poll. Starts with 2 empty options
 * and lets the user add more. The submit requires a question and at
 * least 2 non-empty options.
 *
 * (TH) ตัวสร้างโพล inline เริ่มที่ 2 ตัวเลือก เพิ่มได้เรื่อย ๆ — กดสร้าง
 * ได้ต้องมีคำถามและตัวเลือกที่ไม่ว่างอย่างน้อย 2 ข้อ
 */
export function PollComposer({ groupId: _groupId, onCreate, onCancel }: PollComposerProps) {
  // Question state.
  // state ของคำถาม
  const [question, setQuestion] = React.useState("");
  // Options array. Each entry is a string — empty entries get filtered out on submit.
  // array ของตัวเลือก ตัวว่างจะถูกตัดทิ้งตอน submit
  const [options, setOptions] = React.useState(["", ""]);

  /**
   * Validate and emit the poll up to the parent. Trim everything and
   * drop empty options.
   *
   * (TH) validate แล้วส่งโพลขึ้น parent — trim ทุกอย่างและตัดตัวเลือกว่างออก
   */
  const submit = () => {
    const trimmedQ = question.trim();
    const cleaned = options.map((o) => o.trim()).filter(Boolean);
    if (!trimmedQ || cleaned.length < 2) return;
    onCreate(trimmedQ, cleaned);
  };

  return (
    // Card with accent border.
    // การ์ดขอบ accent
    <Card className="border-accent/30">
      {/* Body. */}
      {/* body */}
      <CardContent className="space-y-3 p-4">
        {/* Header — icon + "New poll" label. */}
        {/* แถวหัว — icon + "New poll" */}
        <div className="flex items-center gap-2">
          {/* BarChart icon. */}
          {/* ไอคอน barchart */}
          <BarChart3 className="h-4 w-4 text-accent" />
          {/* Title. */}
          {/* ชื่อ */}
          <span className="text-sm font-medium">New poll</span>
        </div>
        {/* Question input. */}
        {/* input คำถาม */}
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Where should we go tonight?"
        />
        {/* Options list + "Add option". */}
        {/* รายการตัวเลือก + ปุ่ม "Add option" */}
        <div className="space-y-2">
          {options.map((opt, i) => (
            /* One option row — input + optional remove button. */
            /* แถวตัวเลือก — input + ปุ่มลบ (ถ้ามีมากกว่า 2) */
            <div key={i} className="flex items-center gap-2">
              {/* Option text input. */}
              {/* input ของตัวเลือก */}
              <Input
                value={opt}
                onChange={(e) =>
                  setOptions((arr) => arr.map((v, idx) => (idx === i ? e.target.value : v)))
                }
                placeholder={`Option ${i + 1}`}
              />
              {options.length > 2 && (
                /* Remove button — only when more than 2 options exist. */
                /* ปุ่มลบ — มีเฉพาะเมื่อมีตัวเลือกมากกว่า 2 */
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setOptions((arr) => arr.filter((_, idx) => idx !== i))
                  }
                  aria-label="Remove option"
                >
                  {/* Trash icon. */}
                  {/* ไอคอนถังขยะ */}
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {/* Add another option. */}
          {/* เพิ่มตัวเลือก */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOptions((arr) => [...arr, ""])}
          >
            <Plus className="h-3.5 w-3.5" /> Add option
          </Button>
        </div>
        {/* Footer — cancel + launch buttons, right-aligned. */}
        {/* footer — Cancel + Launch ชิดขวา */}
        <div className="flex justify-end gap-2">
          {/* Cancel button. */}
          {/* ปุ่ม Cancel */}
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          {/* Launch poll button. */}
          {/* ปุ่ม Launch */}
          <Button variant="accent" size="sm" onClick={submit}>
            Launch poll
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
