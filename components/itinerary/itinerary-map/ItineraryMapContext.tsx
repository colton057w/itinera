"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ItineraryMapPoint } from "@/lib/buildItineraryMapPoints";

type Ctx = {
  points: ItineraryMapPoint[];
  pointsById: Map<string, ItineraryMapPoint>;
  selectedEventId: string | null;
  focusEvent: (id: string) => void;
  setMapInstance: (map: google.maps.Map | null) => void;
};

const ItineraryMapContext = createContext<Ctx | null>(null);

export function ItineraryMapProvider({
  points,
  children,
}: {
  points: ItineraryMapPoint[];
  children: React.ReactNode;
}) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const pointsById = useMemo(() => new Map(points.map((p) => [p.id, p])), [points]);

  const setMapInstance = useCallback((m: google.maps.Map | null) => {
    mapRef.current = m;
  }, []);

  const focusEvent = useCallback(
    (id: string) => {
      setSelectedEventId(id);
      const p = pointsById.get(id);
      const map = mapRef.current;
      if (p && map) {
        map.panTo({ lat: p.lat, lng: p.lng });
        const z = map.getZoom() ?? 14;
        if (z < 15) map.setZoom(15);
      }
      queueMicrotask(() => {
        document.getElementById(`event-map-${id}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
    },
    [pointsById],
  );

  const value = useMemo(
    () => ({
      points,
      pointsById,
      selectedEventId,
      focusEvent,
      setMapInstance,
    }),
    [points, pointsById, selectedEventId, focusEvent, setMapInstance],
  );

  return (
    <ItineraryMapContext.Provider value={value}>{children}</ItineraryMapContext.Provider>
  );
}

export function useItineraryMap() {
  const ctx = useContext(ItineraryMapContext);
  if (!ctx) {
    throw new Error("useItineraryMap must be used within ItineraryMapProvider");
  }
  return ctx;
}
