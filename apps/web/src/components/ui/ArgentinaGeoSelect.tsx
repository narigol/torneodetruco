"use client";

import { useState, useEffect } from "react";
import { PROVINCES, LOCALITIES } from "@/lib/argentina-geo";

type Props = {
  locality?: string;
  provincia?: string;
  onLocalityChange?: (v: string) => void;
  onProvinciaChange?: (v: string) => void;
  nameLocality?: string;
  nameProvincia?: string;
  nameCountry?: string;
  inline?: boolean;
};

export function ArgentinaGeoSelect({
  locality: localityProp,
  provincia: provinciaProp,
  onLocalityChange,
  onProvinciaChange,
  nameLocality = "locality",
  nameProvincia = "provincia",
  nameCountry = "country",
  inline = false,
}: Props) {
  const [provincia, setProvincia] = useState(provinciaProp ?? "");
  const [locality, setLocality] = useState(localityProp ?? "");

  useEffect(() => {
    setProvincia(provinciaProp ?? "");
  }, [provinciaProp]);

  useEffect(() => {
    setLocality(localityProp ?? "");
  }, [localityProp]);

  const localities = provincia ? (LOCALITIES[provincia] ?? []) : [];

  function handleProvinciaChange(v: string) {
    setProvincia(v);
    setLocality("");
    onProvinciaChange?.(v);
    onLocalityChange?.("");
  }

  function handleLocalityChange(v: string) {
    setLocality(v);
    onLocalityChange?.(v);
  }

  const inputClass =
    "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors";

  return (
    <div className={inline ? "grid gap-3 sm:grid-cols-2 items-end" : "space-y-3"}>
      <input type="hidden" name={nameCountry} value="Argentina" />

      <div>
        {!inline && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Provincia</label>
        )}
        <select
          name={nameProvincia}
          value={provincia}
          onChange={(e) => handleProvinciaChange(e.target.value)}
          className={inputClass}
        >
          <option value="">Seleccioná una provincia</option>
          {PROVINCES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div>
        {!inline && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Localidad</label>
        )}
        {localities.length > 0 ? (
          <>
            <input
              list="localities-list"
              name={nameLocality}
              value={locality}
              onChange={(e) => handleLocalityChange(e.target.value)}
              className={inputClass}
              placeholder="Escribí o seleccioná una localidad"
              aria-label="Localidad"
              disabled={!provincia}
            />
            <datalist id="localities-list">
              {localities.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </>
        ) : (
          <input
            name={nameLocality}
            value={locality}
            onChange={(e) => handleLocalityChange(e.target.value)}
            className={inputClass}
            placeholder={provincia ? "Escribí la localidad" : "Primero seleccioná una provincia"}
            aria-label="Localidad"
            disabled={!provincia}
          />
        )}
      </div>
    </div>
  );
}
