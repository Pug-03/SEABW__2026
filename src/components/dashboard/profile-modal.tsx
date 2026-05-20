"use client";

import * as React from "react";
import {
  Copy,
  Edit3,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { QRCode } from "@/components/common/qr-code";
import type { InsuranceDetails, User } from "@/lib/types";
import { PREFERENCE_META } from "@/lib/mock-data";

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: User;
  onUpdate: (patch: Partial<User>) => void;
}

type Tab = "view" | "invite" | "edit";

export function ProfileModal({
  open,
  onOpenChange,
  user,
  onUpdate,
}: ProfileModalProps) {
  const [tab, setTab] = React.useState<Tab>("view");
  const [verified, setVerified] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [verifyError, setVerifyError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setTab("view");
      setVerified(false);
      setPassword("");
      setVerifyError(null);
    }
  }, [open]);

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/trip?invite=${user.id.slice(-6).toUpperCase()}`
      : `https://vibetrip.app/trip?invite=${user.id.slice(-6).toUpperCase()}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
          <DialogDescription>
            Manage your identity and share trip invites.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center text-center">
          <Avatar className="h-24 w-24 ring-4 ring-accent/30">
            {user.avatarDataUrl && (
              <AvatarImage src={user.avatarDataUrl} alt={user.firstName} />
            )}
            <AvatarFallback className="text-2xl">
              {user.firstName[0]}
              {user.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <h3 className="mt-3 text-xl font-semibold tracking-tight">
            {user.firstName} {user.lastName}
          </h3>
          <p className="text-xs text-muted-foreground">@{user.nickname}</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3 w-3" /> {user.email}
            </span>
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3 w-3" /> {user.phone}
            </span>
          </div>
          {user.preferences.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {user.preferences.map((p) => (
                <Badge key={p} variant="accent">
                  {PREFERENCE_META[p].label}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={tab === "invite" ? "accent" : "glass"}
            onClick={() => setTab("invite")}
          >
            <Users className="h-4 w-4" /> Invite friends
          </Button>
          <Button
            variant={tab === "edit" ? "accent" : "glass"}
            onClick={() => setTab("edit")}
          >
            <Edit3 className="h-4 w-4" /> Edit profile
          </Button>
        </div>

        {tab === "invite" && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-secondary/30 p-4">
            <QRCode
              value={inviteUrl}
              size={170}
              label={`Code: ${user.id.slice(-6).toUpperCase()}`}
            />
            <div className="flex w-full items-center gap-2 rounded-xl bg-background/60 px-3 py-2 text-xs">
              <span className="flex-1 truncate font-mono">{inviteUrl}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(inviteUrl)}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {tab === "edit" && (
          <>
            {!verified ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // Mock verification — accept any non-empty value for demo,
                  // in production this should hit a backend endpoint.
                  if (password.length < 4) {
                    setVerifyError(
                      "Please enter your password (min 4 characters for demo)."
                    );
                    return;
                  }
                  setVerified(true);
                  setVerifyError(null);
                }}
                className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4"
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="h-4 w-4 text-amber-600" />
                  Re-verify to edit your profile
                </div>
                <Label className="text-xs">Current password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                />
                {verifyError && (
                  <div className="text-xs text-destructive">{verifyError}</div>
                )}
                <Button type="submit" variant="accent" className="w-full">
                  <ShieldCheck className="h-4 w-4" /> Verify
                </Button>
              </form>
            ) : (
              <EditForm user={user} onSave={onUpdate} />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditForm({
  user,
  onSave,
}: {
  user: User;
  onSave: (patch: Partial<User>) => void;
}) {
  const [firstName, setFirstName] = React.useState(user.firstName);
  const [lastName, setLastName] = React.useState(user.lastName);
  const [nickname, setNickname] = React.useState(user.nickname);
  const [email, setEmail] = React.useState(user.email);
  const [phone, setPhone] = React.useState(user.phone);
  const [homeAddress, setHomeAddress] = React.useState(user.homeAddress);
  const [insurance, setInsurance] = React.useState<InsuranceDetails>(
    user.insurance ?? {
      provider: "",
      policyNumber: "",
      emergencyContact: "",
    }
  );
  const [saved, setSaved] = React.useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      firstName,
      lastName,
      nickname,
      email,
      phone,
      homeAddress,
      insurance: insurance.provider ? insurance : undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">First name</Label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Last name</Label>
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Nickname</Label>
          <Input value={nickname} onChange={(e) => setNickname(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Email</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Home address</Label>
          <Input value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)} />
        </div>
      </div>
      <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <ShieldCheck className="h-4 w-4 text-emerald-500" /> Travel insurance
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-xs">Provider</Label>
            <Input
              value={insurance.provider}
              onChange={(e) =>
                setInsurance({ ...insurance, provider: e.target.value })
              }
            />
          </div>
          <div>
            <Label className="text-xs">Policy number</Label>
            <Input
              value={insurance.policyNumber}
              onChange={(e) =>
                setInsurance({ ...insurance, policyNumber: e.target.value })
              }
            />
          </div>
          <div>
            <Label className="text-xs">Emergency contact</Label>
            <Input
              value={insurance.emergencyContact}
              onChange={(e) =>
                setInsurance({
                  ...insurance,
                  emergencyContact: e.target.value,
                })
              }
            />
          </div>
        </div>
      </div>
      <Button type="submit" variant="accent" className="w-full">
        {saved ? (
          <>
            <Sparkles className="h-4 w-4" /> Saved
          </>
        ) : (
          "Save changes"
        )}
      </Button>
    </form>
  );
}
