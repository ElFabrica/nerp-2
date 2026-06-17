export function constructUrl(key: string): string {
  if (!key) return "";
  if (key.startsWith("http://") || key.startsWith("https://")) return key;
  return `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.t3.storage.dev/${key}`;
}

export function useConstructUrl(key: string): string {
  return constructUrl(key);
}
