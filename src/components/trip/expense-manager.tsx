/**
 * @file `<ExpenseManager>` — right-rail sheet on the `/trip` page.
 * Contains:
 *   - Budget summary card with progress bar + inline budget editor.
 *   - "Expenses" tab — list of past expenses + "Add expense" form.
 *   - "Split bill" tab — quick calculator + mock PromptPay QR.
 *
 * (TH) แผงด้านขวาของหน้า `/trip` ประกอบด้วย:
 *   - การ์ดสรุปงบประมาณ + แถบ progress + ฟอร์มแก้งบ
 *   - แท็บ "Expenses" — รายการรายจ่าย + ฟอร์มเพิ่ม
 *   - แท็บ "Split bill" — เครื่องคิดเลขแบ่งบิล + QR PromptPay (mock)
 */

"use client";

import * as React from "react";
import {
  Banknote,
  Calculator,
  Coins,
  Plus,
  Receipt,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { QRCode } from "@/components/common/qr-code";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useVibeStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import type { TripGroup, User } from "@/lib/types";

/** Props for the expense sheet. Parent controls open via `onClose`. */
/** (TH) Props ของแผงรายจ่าย — parent เป็นคนเปิด/ปิดผ่าน onClose */
interface ExpenseManagerProps {
  group: TripGroup;
  user: User;
  onClose: () => void;
}

/**
 * The expense rail. Pulls expense actions out of the store and renders
 * a budget summary + tabs (Expenses vs Split bill).
 *
 * (TH) แผงรายจ่าย — ดึง action จาก store แล้ว render สรุปงบ + แท็บ
 * (Expenses vs Split bill)
 */
export function ExpenseManager({ group, user, onClose }: ExpenseManagerProps) {
  // Store actions used by this sheet.
  // action ของ store ที่ใช้
  const setBudget = useVibeStore((s) => s.setGroupBudget);
  const addExpense = useVibeStore((s) => s.addExpense);
  const addMessage = useVibeStore((s) => s.addMessage);

  // Derived summary numbers.
  // ค่าสรุปที่คำนวณได้
  const totalSpent = group.expenses.reduce((s, e) => s + e.amount, 0);
  const remaining = Math.max(0, group.budget - totalSpent);
  // Cap at 100% so the progress bar can't overflow visually.
  // จำกัดที่ 100% เพื่อกัน progress bar ทะลุ
  const pct = group.budget ? Math.min(100, (totalSpent / group.budget) * 100) : 0;

  return (
    // <aside> with left border — sits beside the chat.
    // <aside> เส้นซ้ายมุม วางข้างแชท
    <aside className="flex h-full w-full max-w-md shrink-0 flex-col border-l border-border/60 bg-card/70 backdrop-blur-xl">
      {/* Sheet header — title cluster + close button. */}
      {/* header — กลุ่ม title + ปุ่มปิด */}
      <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        {/* Title cluster. */}
        {/* กลุ่ม title */}
        <div className="flex items-center gap-2">
          {/* Banknote icon. */}
          {/* ไอคอนแบงค์ */}
          <Banknote className="h-4 w-4 text-accent" />
          {/* Text block. */}
          {/* ส่วนข้อความ */}
          <div>
            {/* Title. */}
            {/* ชื่อ */}
            <div className="text-sm font-semibold">Expense Manager</div>
            {/* Subtitle. */}
            {/* คำอธิบาย */}
            <div className="text-[11px] text-muted-foreground">
              Track, split & settle
            </div>
          </div>
        </div>
        {/* Close icon button. */}
        {/* ปุ่มปิด */}
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
          <X className="h-4 w-4" />
        </Button>
      </header>

      {/* Body. */}
      {/* body */}
      <div className="space-y-4 p-4">
        {/* Budget card — total/spent/remaining with editor. */}
        {/* การ์ดงบประมาณ — รวม/ใช้/เหลือ + ตัวแก้งบ */}
        <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 p-4">
          {/* Top row — caption + usage badge. */}
          {/* แถวบน — caption + badge การใช้งาน */}
          <div className="flex items-center justify-between text-xs">
            {/* Total caption with target icon. */}
            {/* "Total trip budget" พร้อมไอคอน target */}
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Target className="h-3 w-3" /> Total trip budget
            </span>
            {/* Usage badge. */}
            {/* badge ใช้กี่ % */}
            <Badge variant="accent">
              <Sparkles className="h-3 w-3" />
              {group.budget ? `${Math.round(pct)}% used` : "Set budget"}
            </Badge>
          </div>
          {/* Total budget number. */}
          {/* ตัวเลขงบรวม */}
          <div className="mt-1 text-3xl font-semibold tracking-tighter">
            {formatCurrency(group.budget || 0)}
          </div>
          {/* Progress bar. */}
          {/* progress bar */}
          <Progress value={pct} className="mt-2" />
          {/* Spent / remaining row. */}
          {/* แถวสรุปใช้/เหลือ */}
          <div className="mt-2 flex items-center justify-between text-xs">
            {/* Spent. */}
            {/* ใช้ไป */}
            <span className="text-muted-foreground">
              Spent {formatCurrency(totalSpent)}
            </span>
            {/* Remaining (green). */}
            {/* เหลือ (เขียว) */}
            <span className="font-medium text-emerald-600 dark:text-emerald-300">
              {formatCurrency(remaining)} left
            </span>
          </div>
          {/* Inline budget editor. */}
          {/* ฟอร์มแก้งบ */}
          <BudgetEditor
            current={group.budget}
            onSave={(v) => setBudget(group.id, v)}
          />
        </div>

        {/* Tabs container — Expenses vs Split bill. */}
        {/* container แท็บ — Expenses vs Split bill */}
        <Tabs defaultValue="expenses">
          {/* Tab triggers. */}
          {/* trigger ของแต่ละแท็บ */}
          <TabsList className="w-full">
            <TabsTrigger value="expenses" className="flex-1">
              <Receipt className="h-3.5 w-3.5" /> Expenses
            </TabsTrigger>
            <TabsTrigger value="split" className="flex-1">
              <Calculator className="h-3.5 w-3.5" /> Split bill
            </TabsTrigger>
          </TabsList>

          {/* Expenses tab. */}
          {/* แท็บ Expenses */}
          <TabsContent value="expenses">
            {/* List of existing expenses. */}
            {/* รายการที่ log ไว้ */}
            <ExpenseList group={group} />
            {/* Add-expense form — also drops a system message into chat. */}
            {/* ฟอร์มเพิ่มรายจ่าย — ส่งข้อความ system เข้าแชทด้วย */}
            <AddExpense
              group={group}
              user={user}
              onAdd={(e) => {
                addExpense(group.id, e);
                addMessage(group.id, {
                  authorId: "system",
                  authorName: "VibeTrip",
                  content: `${e.paidByName} paid ${formatCurrency(e.amount)} for ${e.description}`,
                  kind: "system",
                });
              }}
            />
          </TabsContent>

          {/* Split bill tab. */}
          {/* แท็บ Split bill */}
          <TabsContent value="split">
            <SplitBill defaultPaidBy={`${user.firstName} ${user.lastName}`} />
          </TabsContent>
        </Tabs>
      </div>
    </aside>
  );
}

/**
 * Inline editor for the group budget. Renders a "Adjust budget" link
 * when the user already has a budget, or the input + Save button
 * when they don't (or they clicked the link).
 *
 * (TH) ตัวแก้งบกลุ่มแบบ inline — ถ้ามีงบแล้วจะโชว์ลิงก์ "Adjust budget"
 * เมื่อกดหรือยังไม่มีงบ จะโผล่ input + ปุ่ม Save
 */
function BudgetEditor({
  current,
  onSave,
}: {
  current: number;
  onSave: (v: number) => void;
}) {
  // Draft value (string so the user can clear/empty it).
  // ค่า draft (เป็น string เพื่อให้ผู้ใช้ลบได้)
  const [value, setValue] = React.useState<string>(current ? String(current) : "");
  // Whether the editor is shown. Auto-open when no current budget.
  // โหมดแก้งบเปิดอยู่หรือไม่ — เปิดเองถ้ายังไม่มีงบ
  const [editing, setEditing] = React.useState(!current);
  if (!editing) {
    /* Compact link state — flip to editing on click. */
    /* state แบบลิงก์ — กดเพื่อเข้าโหมดแก้ */
    return (
      <button
        onClick={() => setEditing(true)}
        className="mt-2 text-[11px] text-accent hover:underline"
      >
        Adjust budget
      </button>
    );
  }
  return (
    // Edit form row.
    // แถวฟอร์มแก้งบ
    <div className="mt-3 flex items-center gap-2">
      {/* Numeric input. */}
      {/* input ตัวเลข */}
      <Input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Total budget"
        className="h-9"
      />
      {/* Save button. */}
      {/* ปุ่ม Save */}
      <Button
        variant="accent"
        size="sm"
        onClick={() => {
          const n = Number(value);
          if (!Number.isNaN(n)) {
            onSave(n);
            setEditing(false);
          }
        }}
      >
        Save
      </Button>
    </div>
  );
}

/**
 * Render the expense list (reverse-chronological). Shows an empty
 * state when there are none.
 *
 * (TH) แสดงรายการรายจ่าย (เรียงจากใหม่ → เก่า) ถ้าไม่มีจะโชว์ state ว่าง
 */
function ExpenseList({ group }: { group: TripGroup }) {
  if (group.expenses.length === 0) {
    /* Empty state. */
    /* state ว่าง */
    return (
      <div className="rounded-2xl border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
        No expenses yet — add the first one below.
      </div>
    );
  }
  return (
    // Expense list.
    // รายการรายจ่าย
    <ul className="space-y-2">
      {group.expenses
        .slice()
        .reverse()
        .map((e) => (
          /* One expense row. */
          /* รายการรายจ่ายหนึ่งรายการ */
          <li
            key={e.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-secondary/30 p-3"
          >
            {/* Left cluster — avatar + description/paid-by. */}
            {/* กลุ่มซ้าย — avatar + คำอธิบาย/ผู้จ่าย */}
            <div className="flex min-w-0 items-center gap-3">
              {/* Avatar with initials of payer. */}
              {/* avatar อักษรย่อของผู้จ่าย */}
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-[10px]">
                  {e.paidByName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Description + payer name. */}
              {/* คำอธิบาย + ชื่อผู้จ่าย */}
              <div className="min-w-0">
                {/* Expense description. */}
                {/* คำอธิบายรายจ่าย */}
                <div className="truncate text-sm font-medium">
                  {e.description}
                </div>
                {/* Paid-by caption. */}
                {/* ผู้จ่าย */}
                <div className="text-[11px] text-muted-foreground">
                  Paid by {e.paidByName}
                </div>
              </div>
            </div>
            {/* Amount column. */}
            {/* คอลัมน์จำนวนเงิน */}
            <div className="font-semibold text-foreground">
              {formatCurrency(e.amount)}
            </div>
          </li>
        ))}
    </ul>
  );
}

/**
 * Add-expense form. Three controls (amount, paid-by select,
 * description) plus a submit button.
 *
 * (TH) ฟอร์มเพิ่มรายจ่าย — มี 3 ช่อง (จำนวนเงิน, ผู้จ่าย, คำอธิบาย) + ปุ่ม submit
 */
function AddExpense({
  group,
  user,
  onAdd,
}: {
  group: TripGroup;
  user: User;
  onAdd: (e: {
    amount: number;
    description: string;
    paidById: string;
    paidByName: string;
  }) => void;
}) {
  // Local form state.
  // state ของฟอร์ม
  const [amount, setAmount] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [paidById, setPaidById] = React.useState(user.id);

  // Fallback: when no members, allow the current user as the only option.
  // fallback: ถ้ายังไม่มีสมาชิก ให้ผู้ใช้ปัจจุบันเป็นตัวเลือกเดียว
  const members =
    group.members.length > 0
      ? group.members
      : [{ id: user.id, name: `${user.firstName} ${user.lastName}` }];

  /** Submit handler — validates, resolves payer, clears the form. */
  /** (TH) submit — validate, หาผู้จ่าย, แล้วล้างฟอร์ม */
  const submit = () => {
    const n = Number(amount);
    if (!n || !description.trim()) return;
    const member = members.find((m) => m.id === paidById) ?? members[0];
    onAdd({
      amount: n,
      description: description.trim(),
      paidById: member.id,
      paidByName: member.name,
    });
    setAmount("");
    setDescription("");
  };

  return (
    // Form card.
    // การ์ดฟอร์ม
    <div className="mt-3 rounded-2xl border border-border/60 bg-secondary/30 p-3">
      {/* Section heading. */}
      {/* หัวข้อ section */}
      <div className="mb-2 text-xs font-medium text-muted-foreground">
        Log an expense
      </div>
      {/* Fields grid (2 cols). */}
      {/* ตาราง field (2 คอลัมน์) */}
      <div className="grid grid-cols-2 gap-2">
        {/* Amount input. */}
        {/* input จำนวนเงิน */}
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          className="h-10"
        />
        {/* Payer select. */}
        {/* select ผู้จ่าย */}
        <select
          value={paidById}
          onChange={(e) => setPaidById(e.target.value)}
          className="h-10 rounded-2xl border border-input bg-background/50 px-3 text-sm"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        {/* Description (spans both columns). */}
        {/* คำอธิบาย (กินสองคอลัมน์) */}
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What for? e.g. Dinner"
          className="col-span-2"
        />
      </div>
      {/* Submit button. */}
      {/* ปุ่ม submit */}
      <Button
        variant="accent"
        size="sm"
        className="mt-2 w-full"
        onClick={submit}
        disabled={!amount || !description.trim()}
      >
        <Plus className="h-3.5 w-3.5" /> Add expense
      </Button>
    </div>
  );
}

/**
 * Split-bill calculator with a mock PromptPay QR. Real PromptPay
 * encoding (EMV TLV) is out of scope — we use a `PROMPTPAY|...`
 * pipe-delimited payload that's easy to inspect during demos.
 *
 * (TH) เครื่องคิดเลขแบ่งบิล + QR PromptPay (mock) — โค้ด PromptPay จริง
 * (EMV TLV) อยู่นอกขอบเขต ใช้ payload แบบ `PROMPTPAY|...` ที่ inspect
 * ง่ายใน demo
 */
function SplitBill({ defaultPaidBy }: { defaultPaidBy: string }) {
  // Form state — strings + numbers as appropriate.
  // state ของฟอร์ม
  const [amount, setAmount] = React.useState<string>("1200");
  const [people, setPeople] = React.useState<number>(4);
  const [reference, setReference] = React.useState(defaultPaidBy);

  // Derived per-person value.
  // ค่าต่อคน
  const n = Number(amount) || 0;
  const perPerson = people > 0 ? n / people : 0;

  // Mock PromptPay payload (pipe-delimited, human-readable for demos).
  // payload PromptPay แบบ mock (คั่นด้วย | อ่านง่ายใน demo)
  const payload = `PROMPTPAY|amount=${perPerson.toFixed(2)}|ref=${encodeURIComponent(
    reference
  )}|note=VibeTrip split`;

  return (
    // Form column.
    // คอลัมน์ฟอร์ม
    <div className="space-y-3">
      {/* Fields grid. */}
      {/* ตาราง field */}
      <div className="grid grid-cols-2 gap-2">
        {/* Total bill. */}
        {/* ยอดรวม */}
        <div>
          <Label className="text-xs">Total bill</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-10"
          />
        </div>
        {/* People count. */}
        {/* จำนวนคน */}
        <div>
          <Label className="text-xs">People</Label>
          <Input
            type="number"
            min={1}
            value={people}
            onChange={(e) =>
              setPeople(Math.max(1, Number(e.target.value) || 1))
            }
            className="h-10"
          />
        </div>
        {/* Reference (your name or PromptPay ID). */}
        {/* reference (ชื่อหรือเลข PromptPay) */}
        <div className="col-span-2">
          <Label className="text-xs">PromptPay reference</Label>
          <Input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Your name or PromptPay ID"
            className="h-10"
          />
        </div>
      </div>

      {/* Per-person result card. */}
      {/* การ์ดสรุปต่อคน */}
      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-secondary/30 p-3">
        {/* Text block. */}
        {/* ส่วนข้อความ */}
        <div>
          {/* Caption. */}
          {/* คำว่า "Each person pays" */}
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Each person pays
          </div>
          {/* Big number. */}
          {/* ตัวเลขใหญ่ */}
          <div className="text-2xl font-semibold tracking-tighter">
            {formatCurrency(perPerson)}
          </div>
        </div>
        {/* Coins icon. */}
        {/* ไอคอนเหรียญ */}
        <Coins className="h-7 w-7 text-accent" />
      </div>

      {/* QR card. */}
      {/* การ์ด QR */}
      <div className="flex items-center justify-center rounded-2xl border border-border/60 bg-secondary/30 p-3">
        <QRCode
          value={payload}
          size={170}
          label={`Scan to pay ${formatCurrency(perPerson)}`}
        />
      </div>
      {/* Footer note about the demo QR. */}
      {/* note ใต้ QR */}
      <p className="text-center text-[11px] text-muted-foreground">
        Demo PromptPay QR — pair with a real PromptPay merchant ID in
        production.
      </p>
    </div>
  );
}
