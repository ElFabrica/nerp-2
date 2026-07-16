// Layout livre de capa/página final do Book — array de elementos
// posicionáveis (texto, imagem, divisor) num canvas fixo 16:9, editado no
// canvas Konva e renderizado de volta no PDF (react-pdf) via posição
// absoluta. Compartilhado entre client (editor) e server (geração do PDF).

export type CoverElementType = "text" | "image" | "divider";

interface CoverElementBase {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface CoverTextElement extends CoverElementBase {
  type: "text";
  text: string;
  fontSize: number;
  color: string;
  fontWeight: "normal" | "bold";
  align: "left" | "center" | "right";
  uppercase: boolean;
}

export interface CoverImageElement extends CoverElementBase {
  type: "image";
  imageKey: string;
  objectFit: "contain" | "cover";
}

export interface CoverDividerElement extends CoverElementBase {
  type: "divider";
  color: string;
}

export type CoverElement =
  | CoverTextElement
  | CoverImageElement
  | CoverDividerElement;

export const COVER_CANVAS_WIDTH = 960;
export const COVER_CANVAS_HEIGHT = 540;

export interface CoverBackground {
  color: string;
  opacity: number; // 0-1
  // Key R2 da imagem de fundo (opcional). Quando presente, a imagem cobre o
  // canvas inteiro (cover) e a cor/opacidade acima funcionam como um tint
  // por cima dela — útil pra manter contraste com texto sobreposto.
  imageKey?: string | null;
}

export const DEFAULT_COVER_BACKGROUND: CoverBackground = {
  color: "#ffffff",
  opacity: 1,
  imageKey: null,
};

const ACCENT = "#c1121f";
const INK = "#1a1a1a";
const MUTED = "#6b7280";

let seed = 0;
function nextId(prefix: string): string {
  seed += 1;
  return `${prefix}-${Date.now()}-${seed}`;
}

// Replica visualmente o layout fixo legado de book-document.tsx — serve de
// ponto de partida pra quem nunca personalizou a capa.
export function buildDefaultCoverLayout(): CoverElement[] {
  return [
    {
      id: nextId("logo"),
      type: "image",
      x: 380,
      y: 60,
      width: 200,
      height: 90,
      rotation: 0,
      imageKey: "",
      objectFit: "contain",
    },
    {
      id: nextId("title"),
      type: "text",
      x: 80,
      y: 220,
      width: 800,
      height: 50,
      rotation: 0,
      text: "Nome do Book",
      fontSize: 34,
      color: INK,
      fontWeight: "bold",
      align: "center",
      uppercase: false,
    },
    {
      id: nextId("divider"),
      type: "divider",
      x: 435,
      y: 288,
      width: 90,
      height: 4,
      rotation: 0,
      color: ACCENT,
    },
    {
      id: nextId("period"),
      type: "text",
      x: 80,
      y: 310,
      width: 800,
      height: 30,
      rotation: 0,
      text: "MAIO / 2026",
      fontSize: 18,
      color: ACCENT,
      fontWeight: "bold",
      align: "center",
      uppercase: true,
    },
    {
      id: nextId("industry-logo"),
      type: "image",
      x: 420,
      y: 380,
      width: 120,
      height: 60,
      rotation: 0,
      imageKey: "",
      objectFit: "contain",
    },
  ];
}

export function buildDefaultClosingLayout(): CoverElement[] {
  return [
    {
      id: nextId("closing-logo"),
      type: "image",
      x: 380,
      y: 200,
      width: 200,
      height: 90,
      rotation: 0,
      imageKey: "",
      objectFit: "contain",
    },
    {
      id: nextId("closing-text"),
      type: "text",
      x: 80,
      y: 320,
      width: 800,
      height: 50,
      rotation: 0,
      text: "Obrigado!",
      fontSize: 30,
      color: ACCENT,
      fontWeight: "bold",
      align: "center",
      uppercase: false,
    },
  ];
}

export function createTextElement(overrides?: Partial<CoverTextElement>): CoverTextElement {
  return {
    id: nextId("text"),
    type: "text",
    x: 100,
    y: 100,
    width: 400,
    height: 40,
    rotation: 0,
    text: "Novo texto",
    fontSize: 20,
    color: INK,
    fontWeight: "normal",
    align: "left",
    uppercase: false,
    ...overrides,
  };
}

export function createImageElement(
  imageKey: string,
  overrides?: Partial<CoverImageElement>,
): CoverImageElement {
  return {
    id: nextId("image"),
    type: "image",
    x: 100,
    y: 100,
    width: 160,
    height: 90,
    rotation: 0,
    imageKey,
    objectFit: "contain",
    ...overrides,
  };
}

export { MUTED as COVER_MUTED_COLOR };

// "#rrggbb" + opacidade (0-1) -> "rgba(r,g,b,a)" — usado no PDF (react-pdf
// não tem prop `opacity` separada pra View de fundo cobrindo a página).
export function coverBackgroundToRgba(background: CoverBackground): string {
  const hex = background.color.replace("#", "");
  const bigint = Number.parseInt(hex.length === 3 ? hex.replace(/./g, (c) => c + c) : hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${background.opacity})`;
}
