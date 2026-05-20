"use client";

import * as React from "react";
import { Minus, Plus, QrCode, Receipt, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { QRCode } from "@/components/common/qr-code";
import { formatCurrency } from "@/lib/utils";

function buildPromptPayQrString(amount: number): string {
  // PromptPay static QR format (simplified mock — replace with real number)
  return `promptpay:0000000000:${amount.toFixed(2)}`;
}

export function BillSplitter() {
  const [amount, setAmount] = React.useState("");
  const [people, setPeople] = React.useState(2);
  const [showQr, setShowQr] = React.useState(false);

  const total = parseFloat(amount) || 0;
  const perPerson = people > 0 && total > 0 ? total / people : 0;
  const qrValue = buildPromptPayQrString(perPerson);

  const clampPeople = (n: number) => setPeople(Math.max(2, Math.min(20, n)));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4 text-accent" /> Bill Splitter
          </CardTitle>
          <Badge variant="secondary">
            <Users className="h-3 w-3" /> {people} people
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-muted-foreground">Total bill (฿)</label>
            <Input
              type="number"
              min="0"
              step="1"
              placeholder="e.g. 1500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-base"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">People</label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={() => clampPeople(people - 1)}
                disabled={people <= 2}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center text-lg font-semibold">{people}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={() => clampPeople(people + 1)}
                disabled={people >= 20}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {perPerson > 0 && (
          <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4 text-center">
            <div className="text-xs text-muted-foreground">Each person pays</div>
            <div className="mt-1 text-3xl font-semibold tracking-tight text-accent">
              {formatCurrency(perPerson)}
            </div>
            {total > 0 && (
              <div className="mt-1 text-xs text-muted-foreground">
                Total {formatCurrency(total)} ÷ {people} people
              </div>
            )}
          </div>
        )}

        {perPerson > 0 && (
          <div className="flex flex-col items-center gap-3">
            <Button
              variant="glass"
              className="w-full"
              onClick={() => setShowQr((v) => !v)}
            >
              <QrCode className="h-4 w-4" />
              {showQr ? "Hide QR" : "Generate PromptPay QR"}
            </Button>
            {showQr && (
              <QRCode
                value={qrValue}
                size={160}
                label={`Scan to pay ${formatCurrency(perPerson)}`}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
