"use client";

import { useState, useEffect } from "react";
import { PROVINCES, LOCALITIES } from "@/lib/argentina-geo";

type Props = {
  locality?: string;
  province?: string;
  onLocalityChange?: (v: string) => void;
  onProvinceChange?: (v: string) => void;
  nameLocality?: string;
  nameProvince?: string;
  nameCountry?: string;
  inline?: boolean;
};

export function ArgentinaGeoSelect({
  locality: localityProp,
  province: provinceProp,
  onLocalityChange,
  onProvinceChange,
  nameLocality = "locality",
  nameProvince = "province",
  nameCountry = "country",
  inline = false,
}: Props) {
  const [province, setProvince] = useState(provinceProp ?? "");
  const [locality, setLocality] = useState(localityProp ?? "");

  useEffect(() => {
    setProvince(provinceProp ?? "");
  }, [provinceProp]);

  useEffect(() => {
    setLocality(localityProp ?? "");
  }, [localityProp]);

  const localities = province ? (LOCALITIES[province] ?? []) : [];

  function handleProvinceChange(v: string) {
    setProvince(v);
    setLocality("");
    onProvinceChange?.(v);
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
          name={nameProvince}
          value={province}
          onChange={(e) => handleProvinceChange(e.target.value)}
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
              disabled={!province}
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
            placeholder={province ? "Escribí la localidad" : "Primero seleccioná una provincia"}
            aria-label="Localidad"
            disabled={!province}
          />
        )}
      </div>
    </div>
  );
}
