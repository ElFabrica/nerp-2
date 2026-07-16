import type { MapObjectType } from "./types";

// Sigla de cada tipo no Digital Space ID (ex.: "GD" em WS-009-GD-002-PERF).
export const TYPE_SIGLA: Record<MapObjectType, string> = {
  GONDOLA: "GD",
  ISLAND: "IL",
  CHECKOUT: "CX",
  PIN: "PG", // Ponta de Gôndola no vocabulário do PDV
  SECTOR: "ST",
  AISLE: "CR",
  ENTRANCE: "EN",
  EXIT: "SA",
  DEPOSIT: "DP",
  RESTRICTED_AREA: "AR",
  WALL: "PR",
  TEXT: "TX",
};

const NON_ALNUM = /[^A-Z0-9]/g;

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// "Perfumaria" -> "PERF". Retorna null quando vazio para o formatSpaceCode
// simplesmente omitir o segmento.
export function categorySigla(category: string | null | undefined): string | null {
  if (!category) return null;
  const clean = stripAccents(category).toUpperCase().replace(NON_ALNUM, "");
  return clean.length > 0 ? clean.slice(0, 4) : null;
}

export interface SpaceCodeParts {
  orgSigla: string;
  storeCode: string;
  type: MapObjectType;
  seq: number;
  category: string | null;
}

// Junta só os segmentos não-nulos: WS-009-GD-002-PERF (com categoria) ou
// WS-009-GD-002 (sem). O sequencial vira 3 dígitos com zero à esquerda.
export function formatSpaceCode(parts: SpaceCodeParts): string {
  const segments = [
    parts.orgSigla.toUpperCase(),
    parts.storeCode.toUpperCase(),
    TYPE_SIGLA[parts.type],
    String(parts.seq).padStart(3, "0"),
    categorySigla(parts.category),
  ].filter((segment): segment is string => !!segment);
  return segments.join("-");
}
