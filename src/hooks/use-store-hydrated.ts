"use client";

import * as React from "react";
import { useVibeStore } from "@/lib/store";

export function useStoreHydrated(): boolean {
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    if (useVibeStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = useVibeStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    return () => {
      unsub?.();
    };
  }, []);

  return hydrated;
}
