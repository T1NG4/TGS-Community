export type AdProviderType = 'video' | 'vast';

export interface AdItem {
  id: string;
  type: AdProviderType;
  url: string;
  title?: string;
  clickUrl?: string;
  minWatchPercent?: number;
}

export interface AdConfig {
  version: number;
  enabled: boolean;
  configUrl?: string;
  ads: AdItem[];
  vastTagUrl?: string | null;
  analyticsUrl?: string | null;
}

export interface AdConfigState {
  config: AdConfig | null;
  selectedAd: AdItem | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export interface AdPlayerProps {
  ad: AdItem;
  onProgress: (percent: number) => void;
  onComplete: () => void;
  onError: (message: string) => void;
}

export interface ImaAdPlayerProps {
  vastTagUrl: string;
  loadingLabel: string;
  unavailableLabel: string;
  hintLabel: string;
  onProgress: (percent: number) => void;
  onComplete: () => void;
  onError: (message: string) => void;
}
