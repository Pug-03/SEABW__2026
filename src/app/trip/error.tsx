"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, LayoutDashboard, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TripError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  React.useEffect(() => {
    // Surface the failure during development so we can fix the root cause.
    console.error("[/trip] runtime error:", error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card/70 p-8 text-center shadow-xl backdrop-blur-2xl">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-destructive/15 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          The trip hub hit a snag
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {error.message || "Something went wrong while loading your trips."}
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="accent" onClick={reset}>
            <RotateCw className="h-4 w-4" /> Try again
          </Button>
          <Button variant="glass" onClick={() => router.push("/dashboard")}>
            <LayoutDashboard className="h-4 w-4" /> Back to dashboard
          </Button>
        </div>
      </div>
    </main>
  );
}
