import { Plane } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
        <Plane className="h-4 w-4" />
      </div>
      <span className="text-lg font-semibold tracking-tight">
        Vibe<span className="text-accent">Trip</span>
      </span>
    </div>
  );
}
