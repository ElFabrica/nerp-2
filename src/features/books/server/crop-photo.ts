import "server-only";

import sharp from "sharp";
import {
  computeCropRect,
  type PhotoAdjustment,
} from "../lib/photo-adjustment";

// Baixa a foto original e aplica o mesmo corte (pan/zoom) calculado no
// editor, pra render no PDF ficar idêntico ao que o admin ajustou na tela.
export async function cropPhotoForPdf(
  url: string,
  adjustment: PhotoAdjustment,
  targetAspectRatio: number,
): Promise<Buffer> {
  const response = await fetch(url);
  const original = Buffer.from(await response.arrayBuffer());

  // `.rotate()` sem argumentos = auto-orient pelo EXIF, igual ao que o
  // navegador já faz sozinho ao exibir a foto no editor — precisa vir antes
  // de ler width/height, senão o corte usa dimensões pré-rotação e erra.
  const metadata = await sharp(original).rotate().metadata();
  const naturalWidth = metadata.width ?? 1;
  const naturalHeight = metadata.height ?? 1;

  const rect = computeCropRect(
    adjustment,
    targetAspectRatio,
    1,
    naturalWidth,
    naturalHeight,
  );

  return sharp(original)
    .rotate()
    .extract(rect)
    .jpeg({ quality: 90 })
    .toBuffer();
}
