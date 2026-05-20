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

interface ExpenseManagerProps {
  group: TripGroup;
  user: User;
  onClose: () => void;
}

export function ExpenseManager({ group, user, onClose }: ExpenseManagerProps) {
  const setBudget = useVibeStore((s) => s.setGroupBudget);
  const addExpense = useVibeStore((s) => s.addExpense);
  const addMessage = useVibeStore((s) => s.addMessage);

  const totalSpent = group.expenses.reduce((s, e) => s + e.amount, 0);
  const remaining = Math.max(0, group.budget - totalSpent);
  const pct = group.budget ? Math.min(100, (totalSpent / group.budget) * 100) : 0;

  return (
    <aside className="flex h-full w-full max-w-md shrink-0 flex-col border-l border-border/60 bg-card/70 backdrop-blur-xl">
      <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <Banknote className="h-4 w-4 text-accent" />
          <div>
            <div className="text-sm font-semibold">Expense Manager</div>
            <div className="text-[11px] text-muted-foreground">
              Track, split & settle
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
          <X className="h-4 w-4" />
        </Button>
      </header>

      <div className="space-y-4 p-4">
        <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Target className="h-3 w-3" /> Total trip budget
            </span>
            <Badge variant="accent">
              <Sparkles className="h-3 w-3" />
              {group.budget
                ? `${Math.round(pct)}% used`
                : "Set budget"}
            </Badge>
          </div>
          <div className="mt-1 text-3xl font-semibold tracking-tighter">
            {formatCurrency(group.budget || 0)}
          </div>
          <Progress value={pct} className="mt-2" />
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Spent {formatCurrency(totalSpent)}
            </span>
            <span className="font-medium text-emerald-600 dark:text-emerald-300">
              {formatCurrency(remaining)} left
            </span>
          </div>
          <BudgetEditor
            current={group.budget}
            onSave={(v) => setBudget(group.id, v)}
          />
        </div>

        <Tabs defaultValue="expenses">
          <TabsList className="w-full">
            <TabsTrigger value="expenses" className="flex-1">
              <Receipt className="h-3.5 w-3.5" /> Expenses
            </TabsTrigger>
            <TabsTrigger value="split" className="flex-1">
              <Calculator className="h-3.5 w-3.5" /> Split bill
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expenses">
            <ExpenseList group={group} />
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

          <TabsContent value="split">
            <SplitBill defaultPaidBy={`${user.firstName} ${user.lastName}`} />
          </TabsContent>
        </Tabs>
      </div>
    </aside>
  );
}

function BudgetEditor({
  current,
  onSave,
}: {
  current: number;
  onSave: (v: number) => void;
}) {
  const [value, setValue] = React.useState<string>(current ? String(current) : "");
  const [editing, setEditing] = React.useState(!current);
  if (!editing) {
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
    <div className="mt-3 flex items-center gap-2">
      <Input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Total budget"
        className="h-9"
      />
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

function ExpenseList({ group }: { group: TripGroup }) {
  if (group.expenses.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
        No expenses yet — add the first one below.
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {group.expenses
        .slice()
        .reverse()
        .map((e) => (
          <li
            key={e.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-secondary/30 p-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-[10px]">
                  {e.paidByName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  {e.description}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Paid by {e.paidByName}
                </div>
              </div>
            </div>
            <div className="font-semibold text-foreground">
              {formatCurrency(e.amount)}
            </div>
          </li>
        ))}
    </ul>
  );
}

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
  const [amount, setAmount] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [paidById, setPaidById] = React.useState(user.id);

  const members =
    group.members.length > 0
      ? group.members
      : [{ id: user.id, name: `${user.firstName} ${user.lastName}` }];

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
    <div className="mt-3 rounded-2xl border border-border/60 bg-secondary/30 p-3">
      <div className="mb-2 text-xs font-medium text-muted-foreground">
        Log an expense
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          className="h-10"
        />
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
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What for? e.g. Dinner"
          className="col-span-2"
        />
      </div>
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

function SplitBill({ defaultPaidBy }: { defaultPaidBy: string }) {
  const [amount, setAmount] = React.useState<string>("1200");
  const [people, setPeople] = React.useState<number>(4);
  const [reference, setReference] = React.useState(defaultPaidBy);

  const n = Number(amount) || 0;
  const perPerson = people > 0 ? n / people : 0;

  // PromptPay-style payload (mock): real spec uses EMV QR; we encode a
  // human-readable URI that hackathon judges can scan to confirm format.
  const payload = `PROMPTPAY|amount=${perPerson.toFixed(2)}|ref=${encodeURIComponent(
    reference
  )}|note=VibeTrip split`;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Total bill</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-10"
          />
        </div>
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

      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-secondary/30 p-3">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Each person pays
          </div>
          <div className="text-2xl font-semibold tracking-tighter">
            {formatCurrency(perPerson)}
          </div>
        </div>
        <Coins className="h-7 w-7 text-accent" />
      </div>

      <div className="flex items-center justify-center rounded-2xl border border-border/60 bg-secondary/30 p-3">
        <QRCode
          value={payload}
          size={170}
          label={`Scan to pay ${formatCurrency(perPerson)}`}
        />
      </div>
      <p className="text-center text-[11px] text-muted-foreground">
        Demo PromptPay QR — pair with a real PromptPay merchant ID in
        production.
      </p>
    </div>
  );
}
