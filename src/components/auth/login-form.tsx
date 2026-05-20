"use client";

import * as React from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface LoginFormProps {
  onSubmit: (identifier: string, password: string) => void;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim() || !password) {
      setError("Enter your email/phone and password");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setLoading(false);
    onSubmit(identifier.trim(), password);
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <Label className="mb-1.5 block">Email or phone</Label>
        <Input
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="you@vibetrip.app"
          autoComplete="username"
        />
      </div>
      <div>
        <Label className="mb-1.5 block">Password</Label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </div>
      {error && <div className="text-xs text-destructive">{error}</div>}
      <Button
        type="submit"
        variant="accent"
        size="lg"
        className="w-full"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Sign in <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Forgot password? <span className="text-accent">Reset</span>
      </p>
    </form>
  );
}
