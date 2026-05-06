"use client";

import { useEffect, useRef } from "react";
import { PROVINCES } from "@/lib/argentina-geo";

type Props = {
  location: string;
  onLocationChange?: (address: string) => void;
  onProvinciaChange?: (provincia: string) => void;
  onLocalityChange?: (locality: string) => void;
};

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS  = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function matchProvincia(state: string): string {
  const norm = normalize(state);
  return PROVINCES.find((p) => normalize(p) === norm) ?? "";
}

function loadLeaflet(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).L) { resolve((window as any).L); return; }

    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    if (document.querySelector(`script[src="${LEAFLET_JS}"]`)) {
      const wait = setInterval(() => {
        if ((window as any).L) { clearInterval(wait); resolve((window as any).L); }
      }, 50);
      return;
    }

    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.onload = () => resolve((window as any).L);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export function MapaPreview({ location, onLocationChange, onProvinciaChange, onLocalityChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const onChangeRef = useRef(onLocationChange);
  const onProvinciaRef = useRef(onProvinciaChange);
  const onLocalityRef = useRef(onLocalityChange);

  useEffect(() => { onChangeRef.current = onLocationChange; }, [onLocationChange]);
  useEffect(() => { onProvinciaRef.current = onProvinciaChange; }, [onProvinciaChange]);
  useEffect(() => { onLocalityRef.current = onLocalityChange; }, [onLocalityChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    loadLeaflet().then((L: any) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      delete L.Icon.Default.prototype._getIconUrl;
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
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
            { headers: { "Accept-Language": "es" } }
          );
          const data = await res.json();
          if (data.display_name) onChangeRef.current?.(data.display_name);
          if (data.address) {
            const addr = data.address;
            const provincia = matchProvincia(addr.state ?? "");
            const locality = addr.city ?? addr.town ?? addr.municipality ?? addr.village ?? addr.county ?? "";
            if (provincia) onProvinciaRef.current?.(provincia);
            if (locality) onLocalityRef.current?.(locality);
          }
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
    }).catch(() => {});

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const query = location.trim();
    if (!mapRef.current) return;
    if (!query) { markerRef.current?.remove(); return; }

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
    <div className="rounded-xl overflow-hidden border border-gray-100 h-48 mt-3">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
