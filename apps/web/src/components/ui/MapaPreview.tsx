"use client";

import { useEffect, useRef } from "react";

type Props = {
  location: string;
  onLocationChange?: (address: string) => void;
};

export function MapaPreview({ location, onLocationChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const onChangeRef = useRef(onLocationChange);

  useEffect(() => { onChangeRef.current = onLocationChange; }, [onLocationChange]);

  // Init Leaflet map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      // Fix default icon paths broken by webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!).setView([-34.6, -64.0], 5);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([0, 0], { draggable: true });
      markerRef.current = marker;

      const reverseGeocode = async (lat: number, lng: number) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { "Accept-Language": "es" } }
          );
          const data = await res.json();
          if (data.display_name) onChangeRef.current?.(data.display_name);
        } catch {}
      };

      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]).addTo(map);
        reverseGeocode(lat, lng);
      });

      marker.on("dragend", () => {
        const { lat, lng } = marker.getLatLng();
        reverseGeocode(lat, lng);
      });
    });

    return () => { cancelled = true; };
  }, []);

  // When location input changes, forward-geocode and move map (debounced)
  useEffect(() => {
    const query = location.trim();
    if (!mapRef.current) return;

    if (!query) {
      markerRef.current?.remove();
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
          { headers: { "Accept-Language": "es" } }
        );
        const data = await res.json();
        if (data[0]) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          mapRef.current.setView([lat, lng], 15);
          markerRef.current?.setLatLng([lat, lng]).addTo(mapRef.current);
        }
      } catch {}
    }, 700);

    return () => clearTimeout(timer);
  }, [location]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div className="rounded-xl overflow-hidden border border-gray-100 h-48 mt-3">
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </>
  );
}
