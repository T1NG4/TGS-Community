/** Minimal Google IMA SDK types for client-side VAST ads */
declare namespace google.ima {
  enum ViewMode {
    NORMAL = 'normal',
    FULLSCREEN = 'fullscreen',
  }

  enum AdEvent {
    STARTED = 'start',
    COMPLETE = 'complete',
    ALL_ADS_COMPLETED = 'allAdsCompleted',
    AD_PROGRESS = 'adProgress',
    CONTENT_PAUSE_REQUESTED = 'contentPauseRequested',
    CONTENT_RESUME_REQUESTED = 'contentResumeRequested',
    LOADED = 'loaded',
  }

  enum AdErrorEvent {
    AD_ERROR = 'adError',
  }

  enum AdsManagerLoadedEvent {
    ADS_MANAGER_LOADED = 'adsManagerLoaded',
  }

  interface AdData {
    currentTime: number;
    duration: number;
  }

  interface Ad {
    getDuration(): number;
  }

  interface AdEventObject {
    type: string;
    getAd(): Ad;
    getAdData(): AdData;
  }

  interface AdError {
    getError(): { getMessage(): string; getErrorCode(): number };
  }

  interface AdErrorEventObject {
    type: string;
    getError(): AdError['getError'] extends () => infer R ? R : never;
  }

  interface AdsManagerLoadedEventObject {
    type: string;
    getAdsManager(contentVideo: HTMLVideoElement): AdsManager;
  }

  class AdDisplayContainer {
    constructor(adContainer: HTMLElement, contentVideo: HTMLVideoElement);
    initialize(): void;
    destroy(): void;
  }

  class AdsLoader {
    constructor(adDisplayContainer: AdDisplayContainer);
    addEventListener(
      type: string,
      listener: (event: AdsManagerLoadedEventObject | AdErrorEventObject) => void,
      useCapture?: boolean
    ): void;
    removeEventListener(
      type: string,
      listener: (event: AdsManagerLoadedEventObject | AdErrorEventObject) => void,
      useCapture?: boolean
    ): void;
    requestAds(adsRequest: AdsRequest): void;
    contentComplete(): void;
    destroy(): void;
  }

  class AdsRequest {
    adTagUrl: string;
    linearAdSlotWidth: number;
    linearAdSlotHeight: number;
  }

  class AdsManager {
    addEventListener(
      type: string,
      listener: (event: AdEventObject | AdErrorEventObject) => void,
      useCapture?: boolean
    ): void;
    removeEventListener(
      type: string,
      listener: (event: AdEventObject | AdErrorEventObject) => void,
      useCapture?: boolean
    ): void;
    init(width: number, height: number, viewMode: ViewMode): void;
    start(): void;
    destroy(): void;
    getRemainingTime(): number;
  }
}

interface Window {
  google?: {
    ima?: typeof google.ima;
  };
}
