"use client";

import * as React from "react";
import {
  Bell,
  Eye,
  Fingerprint,
  Globe,
  KeyRound,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

interface ToggleRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  defaultChecked?: boolean;
}

function ToggleRow({ icon, title, description, defaultChecked }: ToggleRowProps) {
  const [v, setV] = React.useState(!!defaultChecked);
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-secondary/30 p-3">
      <div className="flex min-w-0 items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-background">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
      <Switch checked={v} onCheckedChange={setV} />
    </div>
  );
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [currentPw, setCurrentPw] = React.useState("");
  const [newPw, setNewPw] = React.useState("");
  const [pwMsg, setPwMsg] = React.useState<{ ok: boolean; text: string } | null>(null);

  const updateCredentials = () => {
    if (!currentPw || !newPw) {
      setPwMsg({ ok: false, text: "Both fields are required." });
      return;
    }
    if (newPw.length < 8) {
      setPwMsg({ ok: false, text: "New password must be at least 8 characters." });
      return;
    }
    setCurrentPw("");
    setNewPw("");
    setPwMsg({ ok: true, text: "Password updated!" });
    setTimeout(() => setPwMsg(null), 2500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Privacy permissions and security credentials.
          </DialogDescription>
        </DialogHeader>

        <section className="space-y-2">
          <div className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Privacy
          </div>
          <ToggleRow
            icon={<MapPin className="h-4 w-4 text-accent" />}
            title="Precise location"
            description="Used for nearby SOS, ETA & fuel estimates."
            defaultChecked
          />
          <ToggleRow
            icon={<Eye className="h-4 w-4 text-accent" />}
            title="Show online status"
            description="Group mates see when you are active."
            defaultChecked
          />
          <ToggleRow
            icon={<Bell className="h-4 w-4 text-accent" />}
            title="Push notifications"
            description="Polls, expenses, and trip updates."
            defaultChecked
          />
        </section>

        <section className="space-y-2">
          <div className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Security
          </div>
          <ToggleRow
            icon={<Fingerprint className="h-4 w-4 text-accent" />}
            title="Biometric unlock"
            description="Use Face ID / fingerprint to open the app."
          />
          <ToggleRow
            icon={<ShieldCheck className="h-4 w-4 text-accent" />}
            title="Two-factor authentication"
            description="Required for edits and high-value transfers."
            defaultChecked
          />
        </section>

        <section className="space-y-3 rounded-2xl border border-border/60 bg-secondary/30 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <KeyRound className="h-4 w-4" /> Change password
          </div>
          <div className="grid gap-2">
            <div>
              <Label className="text-xs">Current password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">New password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
              />
            </div>
            {pwMsg && (
              <p className={`text-xs ${pwMsg.ok ? "text-green-500" : "text-destructive"}`}>
                {pwMsg.text}
              </p>
            )}
            <Button variant="accent" size="sm" className="mt-1 w-full" onClick={updateCredentials}>
              Update credentials
            </Button>
          </div>
        </section>

        <section className="flex items-center justify-between rounded-2xl border border-border/60 bg-secondary/30 p-3">
          <div className="flex items-center gap-3">
            <Globe className="h-4 w-4" />
            <div>
              <div className="text-sm font-medium">Language</div>
              <div className="text-xs text-muted-foreground">Auto-detected</div>
            </div>
          </div>
          <select className="rounded-xl border border-input bg-background px-3 py-1.5 text-sm">
            <option>English</option>
            <option>ไทย</option>
            <option>日本語</option>
          </select>
        </section>
      </DialogContent>
    </Dialog>
  );
}
