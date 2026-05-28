import type { AdConfig, AdItem } from './types';

/** Remote ads config (servidor faz proxy para evitar bloqueio de CSP no Electron) */
export const ADS_CONFIG_REMOTE_URL =
  'https://raw.githubusercontent.com/T1NG4/TGS-ads/main/pack-manager.json';

/** URL usada pelo cliente — sempre via API local */
export function getAdsConfigUrl(apiBase: string): string {
  const base = (apiBase || '').replace(/\/$/, '');
  return `${base}/api/ads/config`;
}

export const ADS_FETCH_TIMEOUT_MS = 10_000;
export const ADS_CACHE_KEY = 'tgs-pack-manager-ads-config';
export const ADS_CACHE_TTL_MS = 5 * 60 * 1000;

export function pickRandomAd(config: AdConfig) {
  if (!config.ads.length) return null;
  const index = Math.floor(Math.random() * config.ads.length);
  return config.ads[index];
}

export function isValidAdConfig(data: unknown): data is AdConfig {
  if (!data || typeof data !== 'object') return false;
  const cfg = data as AdConfig;
  const hasValidAds =
    Array.isArray(cfg.ads) &&
    cfg.ads.every(
      (ad) =>
        typeof ad.id === 'string' &&
        typeof ad.type === 'string' &&
        typeof ad.url === 'string'
    );
  const hasVast =
    typeof cfg.vastTagUrl === 'string' && cfg.vastTagUrl.trim().length > 0;

  return (
    typeof cfg.version === 'number' &&
    typeof cfg.enabled === 'boolean' &&
    hasValidAds &&
    (!cfg.enabled || cfg.ads.length > 0 || hasVast)
  );
}

export function resolveSelectedAd(config: AdConfig): AdItem | null {
  if (!config.enabled) return null;

  if (config.vastTagUrl?.trim()) {
    return {
      id: 'vast-network',
      type: 'vast',
      url: config.vastTagUrl.trim(),
      title: undefined,
      minWatchPercent: 100,
    };
  }

  return pickRandomAd(config);
}

export function readCachedConfig(): AdConfig | null {
  try {
    const raw = sessionStorage.getItem(ADS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { config: AdConfig; cachedAt: number };
    if (Date.now() - parsed.cachedAt > ADS_CACHE_TTL_MS) return null;
    return isValidAdConfig(parsed.config) ? parsed.config : null;
  } catch {
    return null;
  }
}

export function writeCachedConfig(config: AdConfig) {
  try {
    sessionStorage.setItem(
      ADS_CACHE_KEY,
      JSON.stringify({ config, cachedAt: Date.now() })
    );
  } catch {
    // ignore quota errors
  }
}
