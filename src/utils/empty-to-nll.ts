export function emptyToNull(value?: string | null) {
  if (value === undefined || value === null) return null;

  const trimmed = value.trim();

  return trimmed === "" ? null : trimmed;
}
