import type { MapSpaceState } from "@/generated/prisma/enums";
import type { MapObjectStyle, MapObjectType, SceneObject } from "./types";

export type { MapSpaceState };

// Só espaços comerciais recebem cor de estado. Parede/entrada/depósito são
// cenário e mantêm a cor do tipo — "parede livre" não faz sentido no mapa.
export const NEGOTIABLE_TYPES: ReadonlySet<MapObjectType> = new Set<MapObjectType>([
  "GONDOLA",
  "ISLAND",
  "CHECKOUT",
  "PIN",
]);

export interface SpaceStateMeta {
  label: string;
  fill: string;
  stroke: string;
  dot: string;
}

export const SPACE_STATE_META: Record<MapSpaceState, SpaceStateMeta> = {
  LIVRE: { label: "Livre", fill: "#fef08a", stroke: "#ca8a04", dot: "🟡" },
  EXECUTADO: { label: "Executado", fill: "#bbf7d0", stroke: "#16a34a", dot: "🟢" },
  PENDENTE: { label: "Pendente", fill: "#fecaca", stroke: "#dc2626", dot: "🔴" },
};

export const SPACE_STATE_ORDER: MapSpaceState[] = [
  "LIVRE",
  "EXECUTADO",
  "PENDENTE",
];

// Fonte única da verdade da cor do elemento. Editor e viewer chamam isto no
// render (shape-node.tsx), então as duas telas concordam por construção. A cor
// é derivada, nunca gravada em `style` — o bulk-upsert continua inofensivo.
export function resolveObjectStyle(object: SceneObject): MapObjectStyle {
  if (!NEGOTIABLE_TYPES.has(object.type)) return object.style;
  const meta = SPACE_STATE_META[object.spaceState];
  return { ...object.style, fill: meta.fill, stroke: meta.stroke };
}
