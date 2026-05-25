import React, { useEffect, useRef, useState } from 'react';
import type { ImaAdPlayerProps } from './types';
import { loadImaScript } from './imaLoader';

const SLOT_WIDTH = 640;
const SLOT_HEIGHT = 360;

export const ImaAdPlayer: React.FC<ImaAdPlayerProps> = ({
  vastTagUrl,
  loadingLabel,
  unavailableLabel,
  hintLabel,
  onProgress,
  onComplete,
  onError,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const completedRef = useRef(false);
  const [status, setStatus] = useState<'loading' | 'playing' | 'error'>('loading');

  useEffect(() => {
    completedRef.current = false;
    setStatus('loading');

    let cancelled = false;
    let adsLoader: google.ima.AdsLoader | null = null;
    let adsManager: google.ima.AdsManager | null = null;
    let adDisplayContainer: google.ima.AdDisplayContainer | null = null;
    let progressTimer: ReturnType<typeof setInterval> | null = null;
    let adDuration = 0;

    const cleanup = () => {
      if (progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
      }
      try {
        adsManager?.destroy();
      } catch {
        // ignore
      }
      try {
        adsLoader?.contentComplete();
        adsLoader?.destroy();
      } catch {
        // ignore
      }
      try {
        adDisplayContainer?.destroy();
      } catch {
        // ignore
      }
      adsManager = null;
      adsLoader = null;
      adDisplayContainer = null;
    };

    const markComplete = () => {
      if (completedRef.current || cancelled) return;
      completedRef.current = true;
      onProgress(100);
      onComplete();
    };

    const reportProgress = (currentTime: number, duration: number) => {
      if (!duration || !Number.isFinite(duration)) return;
      onProgress(Math.min(100, (currentTime / duration) * 100));
    };

    const startProgressPolling = () => {
      if (progressTimer) clearInterval(progressTimer);
      progressTimer = setInterval(() => {
        if (!adsManager || !adDuration) return;
        const remaining = adsManager.getRemainingTime();
        reportProgress(Math.max(0, adDuration - remaining), adDuration);
      }, 250);
    };

    const onAdError = (message: string) => {
      if (cancelled) return;
      setStatus('error');
      onError(message);
    };

    const initIma = async () => {
      try {
        await loadImaScript();
        if (cancelled) return;

        const container = containerRef.current;
        const video = videoRef.current;
        if (!container || !video || !window.google?.ima) {
          throw new Error('IMA player elements unavailable');
        }

        adDisplayContainer = new google.ima.AdDisplayContainer(container, video);
        adDisplayContainer.initialize();

        adsLoader = new google.ima.AdsLoader(adDisplayContainer);

        const onAdsManagerLoaded = (event: google.ima.AdsManagerLoadedEventObject) => {
          if (cancelled) return;

          adsManager = event.getAdsManager(video);

          const onManagerAdError = (adErrorEvent: google.ima.AdErrorEventObject) => {
            const detail = adErrorEvent.getError();
            onAdError(detail?.getMessage?.() || 'Ad playback failed');
          };

          const onAdStarted = (adEvent: google.ima.AdEventObject) => {
            setStatus('playing');
            adDuration = adEvent.getAd()?.getDuration?.() || 0;
            startProgressPolling();
          };

          const onAdProgress = (adEvent: google.ima.AdEventObject) => {
            const adData = adEvent.getAdData();
            if (adData?.duration) adDuration = adData.duration;
            reportProgress(adData.currentTime, adData.duration);
          };

          const onAdComplete = () => {
            if (progressTimer) {
              clearInterval(progressTimer);
              progressTimer = null;
            }
            markComplete();
          };

          adsManager.addEventListener(google.ima.AdErrorEvent.AD_ERROR, onManagerAdError);
          adsManager.addEventListener(google.ima.AdEvent.STARTED, onAdStarted);
          adsManager.addEventListener(google.ima.AdEvent.AD_PROGRESS, onAdProgress);
          adsManager.addEventListener(google.ima.AdEvent.COMPLETE, onAdComplete);
          adsManager.addEventListener(google.ima.AdEvent.ALL_ADS_COMPLETED, onAdComplete);

          try {
            adsManager.init(SLOT_WIDTH, SLOT_HEIGHT, google.ima.ViewMode.NORMAL);
            adsManager.start();
          } catch {
            onAdError('Failed to start ad playback');
          }
        };

        const onLoaderAdError = (event: google.ima.AdErrorEventObject) => {
          const detail = event.getError();
          onAdError(detail?.getMessage?.() || 'No ad available');
        };

        adsLoader.addEventListener(
          google.ima.AdsManagerLoadedEvent.ADS_MANAGER_LOADED,
          onAdsManagerLoaded
        );
        adsLoader.addEventListener(google.ima.AdErrorEvent.AD_ERROR, onLoaderAdError);

        const adsRequest = new google.ima.AdsRequest();
        adsRequest.adTagUrl = vastTagUrl;
        adsRequest.linearAdSlotWidth = SLOT_WIDTH;
        adsRequest.linearAdSlotHeight = SLOT_HEIGHT;
        adsLoader.requestAds(adsRequest);
      } catch (err) {
        onAdError(err instanceof Error ? err.message : 'IMA SDK unavailable');
      }
    };

    initIma();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [onComplete, onError, onProgress, vastTagUrl]);

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-400 text-sm p-6 text-center gap-2">
        <p>{unavailableLabel}</p>
        <p className="text-xs text-zinc-500">{hintLabel}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[360px] bg-black">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-contain opacity-0 pointer-events-none"
        playsInline
        muted
      />
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <p className="text-zinc-400 text-sm">{loadingLabel}</p>
        </div>
      )}
    </div>
  );
};
