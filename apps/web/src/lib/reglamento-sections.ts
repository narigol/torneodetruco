export const SECTION_ORDER = [
  "GENERAL",
  "FLOR",
  "ENVIDO",
  "TRUCO",
  "PUNTAJES",
  "ANEXO",
  "PENALIDADES",
  "JERARQUIA",
] as const;

export type ReglamentoSection = (typeof SECTION_ORDER)[number];

export const SECTION_LABEL: Record<ReglamentoSection, string> = {
  GENERAL: "General",
  FLOR: "Flor",
  ENVIDO: "Envido",
  TRUCO: "Truco",
  PUNTAJES: "Puntajes",
  ANEXO: "Anexo",
  PENALIDADES: "Penalidades",
  JERARQUIA: "Jerarquia",
};

const SECTION_RANK = new Map(SECTION_ORDER.map((section, index) => [section, index]));

export function compareSections(a: string, b: string): number {
  const rankA = SECTION_RANK.get(a as ReglamentoSection) ?? Number.MAX_SAFE_INTEGER;
  const rankB = SECTION_RANK.get(b as ReglamentoSection) ?? Number.MAX_SAFE_INTEGER;
  return rankA - rankB || a.localeCompare(b);
}

export function compareArticlesBySectionAndOrder<T extends { seccion: string; orden: number }>(
  a: T,
  b: T
): number {
  return compareSections(a.seccion, b.seccion) || a.orden - b.orden;
}

export function orderSections<T extends string>(sections: T[]): T[] {
  return [...sections].sort(compareSections);
}
