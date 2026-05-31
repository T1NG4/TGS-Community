/** Versão visível ao utilizador — só major.minor (ex.: 2.1.0 → 2.1). */
export function formatPublicVersion(version: string | null | undefined): string {
  if (!version) return '';
  const cleaned = String(version).trim().replace(/^v/i, '');
  const parts = cleaned.split(/[.-]/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]}.${parts[1]}`;
  return cleaned;
}
