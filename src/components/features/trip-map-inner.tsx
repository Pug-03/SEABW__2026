"use client";

import * as React from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SOS_FACILITIES } from "@/lib/mock-data";
import type { Destination, GeoCoords } from "@/lib/types";

// Fix Leaflet default icon paths broken by webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)["_getIconUrl"];
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const makeIcon = (color: string) =>
  L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

const POI_COLORS: Record<string, string> = {
  Hospital: "#ef4444",
  Police: "#3b82f6",
  Gas: "#22c55e",
};
const ORIGIN_COLOR = "#8b5cf6";
const DEST_COLOR = "#f97316";

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  React.useEffect(() => {
    if (points.length >= 2) {
      map.fitBounds(points, { padding: [40, 40] });
    } else if (points.length === 1) {
      map.setView(points[0], 12);
    }
  }, [map, points]);
  return null;
}

export type PoiFilter = "all" | "Hospital" | "Police" | "Gas";

interface TripMapInnerProps {
  origin: GeoCoords | null;
  destination: Destination;
  poiFilter: PoiFilter;
}

export default function TripMapInner({ origin, destination, poiFilter }: TripMapInnerProps) {
  const destPos: [number, number] = [destination.coords.lat, destination.coords.lng];
  const originPos: [number, number] | null = origin
    ? [origin.lat, origin.lng]
    : null;

  const allPoints = React.useMemo<[number, number][]>(
    () => [...(originPos ? [originPos] : []), destPos],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [originPos?.[0], originPos?.[1], destPos[0], destPos[1]]
  );

  const visibleFacilities = SOS_FACILITIES.filter(
    (f) => poiFilter === "all" || f.type === poiFilter
  );

  // Offset POI markers near the destination for demo
  const poiMarkers = visibleFacilities.map((f, i) => {
    const angle = (i / visibleFacilities.length) * 2 * Math.PI;
    const r = 0.02 + (i % 3) * 0.008;
    return {
      ...f,
      pos: [
        destination.coords.lat + r * Math.sin(angle),
        destination.coords.lng + r * Math.cos(angle),
      ] as [number, number],
    };
  });

  return (
    <MapContainer
      center={destPos}
      zoom={11}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds points={allPoints} />

      {/* Origin marker */}
      {originPos && (
        <Marker position={originPos} icon={makeIcon(ORIGIN_COLOR)}>
          <Popup>📍 Your location</Popup>
        </Marker>
      )}

      {/* Destination marker */}
      <Marker position={destPos} icon={makeIcon(DEST_COLOR)}>
        <Popup>
          <strong>{destination.title}</strong>
          <br />
          {destination.region}
        </Popup>
      </Marker>

      {/* Route line */}
      {originPos && (
        <Polyline
          positions={[originPos, destPos]}
          pathOptions={{ color: "#8b5cf6", weight: 3, dashArray: "8 6", opacity: 0.8 }}
        />
      )}

      {/* POI markers */}
      {poiMarkers.map((f) => (
        <Marker key={`${f.type}-${f.name}`} position={f.pos} icon={makeIcon(POI_COLORS[f.type])}>
          <Popup>
            <strong>{f.name}</strong>
            <br />
            {f.type} · {f.distanceKm} km · <a href={`tel:${f.phone.replace(/\s/g, "")}`}>{f.phone}</a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
