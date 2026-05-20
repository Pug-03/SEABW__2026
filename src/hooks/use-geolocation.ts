"use client";

import * as React from "react";
import type { GeoCoords } from "@/lib/types";

interface GeoState {
  coords: GeoCoords | null;
  error: string | null;
  status: "idle" | "loading" | "granted" | "denied" | "error";
}

export function useGeolocation(autoRequest: boolean = true) {
  const [state, setState] = React.useState<GeoState>({
    coords: null,
    error: null,
    status: "idle",
  });

  const request = React.useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setState({
        coords: null,
        error: "Geolocation not supported",
        status: "error",
      });
      return;
    }
    setState((s) => ({ ...s, status: "loading" }));
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setState({
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          error: null,
          status: "granted",
        }),
      (err) =>
        setState({
          coords: null,
          error: err.message,
          status: err.code === err.PERMISSION_DENIED ? "denied" : "error",
        }),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  React.useEffect(() => {
    if (autoRequest) request();
  }, [autoRequest, request]);

  return { ...state, request };
}
