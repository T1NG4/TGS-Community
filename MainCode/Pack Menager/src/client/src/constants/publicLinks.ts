/** URLs públicas — documentação e releases (abertas no navegador pelo footer) */
export const PACK_MANAGER_RELEASES_REPO_URL =
  'https://github.com/T1NG4/TGS-pack-manager-releases';

export const PACK_MANAGER_PUBLIC_DOCS_URL =
  'https://github.com/T1NG4/TGS-pack-manager-releases/blob/main/DOCUMENTACAO.md';

export function openExternalLink(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}
