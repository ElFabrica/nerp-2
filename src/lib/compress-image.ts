// Reduz foto de celular antes do upload. O destino final é o PDF do book, que
// é 960x540pt — uma foto de 12MP subiria ~30x maior do que o necessário, e o
// promotor está em 4G dentro do supermercado.

interface CompressOptions {
  maxEdge?: number;
  quality?: number;
}

// Abaixo disso não compensa re-encodar: JPEG já comprimido só perde qualidade.
const MIN_BYTES_TO_COMPRESS = 500_000;

export async function compressImage(
  file: File,
  { maxEdge = 1600, quality = 0.82 }: CompressOptions = {},
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.size < MIN_BYTES_TO_COMPRESS) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const largestEdge = Math.max(bitmap.width, bitmap.height);
    // Nunca faz upscale — foto pequena sai no tamanho original.
    const scale = Math.min(1, maxEdge / largestEdge);
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch {
    // HEIC do iPhone é o caso concreto: createImageBitmap rejeita e o upload
    // não pode morrer junto. Sobe o original e deixa o limite do servidor decidir.
    return file;
  }
}
