/**
 * Envia um arquivo para o R2 usando o fluxo de URL presignada (`/api/s3/upload`)
 * e retorna a chave do objeto. Uso client-side.
 */
export async function uploadToR2(file: File, isImage = true): Promise<string> {
  const presigned = await fetch("/api/s3/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      size: file.size,
      isImage,
    }),
  });
  if (!presigned.ok) throw new Error("Falha ao gerar URL de upload");
  const { presignedUrl, key } = await presigned.json();

  const put = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!put.ok) throw new Error("Falha ao enviar arquivo");

  return key;
}
