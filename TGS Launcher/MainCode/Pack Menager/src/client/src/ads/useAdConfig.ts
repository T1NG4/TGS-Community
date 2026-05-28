import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getAdsConfigUrl,
  ADS_FETCH_TIMEOUT_MS,
  isValidAdConfig,
  resolveSelectedAd,
  readCachedConfig,
  writeCachedConfig,
} from './config';
import type { AdConfig, AdConfigState, AdItem } from './types';

async function fetchAdConfig(apiBase: string, signal?: AbortSignal): Promise<AdConfig> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ADS_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(getAdsConfigUrl(apiBase), {
      signal: signal ?? controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data: unknown = await response.json();
    if (!isValidAdConfig(data)) {
      throw new Error('Invalid ads config format');
    }

    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function useAdConfig(enabled: boolean, apiBase = ''): AdConfigState {
  const [config, setConfig] = useState<AdConfig | null>(null);
  const [selectedAd, setSelectedAd] = useState<AdItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchIdRef = useRef(0);

  const load = useCallback(async () => {
    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    setError(null);

    try {
      let nextConfig: AdConfig | null = null;

      try {
        nextConfig = await fetchAdConfig(apiBase);
        writeCachedConfig(nextConfig);
      } catch {
        nextConfig = readCachedConfig();
        if (!nextConfig) {
          throw new Error('Failed to load ads config');
        }
      }

      if (fetchId !== fetchIdRef.current) return;

      if (!nextConfig.enabled) {
        setConfig(nextConfig);
        setSelectedAd(null);
        return;
      }

      const ad = resolveSelectedAd(nextConfig);
      if (!ad) {
        throw new Error('No ads available');
      }

      setConfig(nextConfig);
      setSelectedAd(ad);
    } catch (err) {
      if (fetchId !== fetchIdRef.current) return;
      setConfig(null);
      setSelectedAd(null);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      if (fetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [apiBase]);

  useEffect(() => {
    if (!enabled) return;
    load();
  }, [enabled, load]);

  return {
    config,
    selectedAd,
    loading,
    error,
    retry: load,
  };
}

export async function trackAdEvent(
  analyticsUrl: string | null | undefined,
  payload: {
    event: 'ad_impression' | 'ad_complete' | 'ad_error';
    adId: string;
    completed?: boolean;
    app: string;
  }
) {
  if (!analyticsUrl) return;

  try {
    await fetch(analyticsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, timestamp: new Date().toISOString() }),
    });
  } catch {
    // silent — analytics must not block export
  }
}
