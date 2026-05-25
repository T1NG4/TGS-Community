import React, { useCallback, useState } from 'react';
import { Download, ExternalLink, RefreshCw } from 'lucide-react';
import { AdVideoPlayer } from './AdVideoPlayer';
import { ImaAdPlayer } from './ImaAdPlayer';
import { trackAdEvent, useAdConfig } from './useAdConfig';

type TranslateFn = (key: string) => string;

interface AdGateModalProps {
  open: boolean;
  apiBase?: string;
  t: TranslateFn;
  onComplete: () => void;
  onCancel: () => void;
}

function openExternalUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export const AdGateModal: React.FC<AdGateModalProps> = ({
  open,
  apiBase = '',
  t,
  onComplete,
  onCancel,
}) => {
  const { config, selectedAd, loading, error, retry } = useAdConfig(open, apiBase);
  const [watchProgress, setWatchProgress] = useState(0);
  const [watchComplete, setWatchComplete] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  const handleProgress = useCallback((percent: number) => {
    setWatchProgress((prev) => Math.max(prev, percent));
  }, []);

  const handleWatchComplete = useCallback(() => {
    setWatchComplete(true);
    setWatchProgress(100);
    if (selectedAd && config) {
      trackAdEvent(config.analyticsUrl, {
        event: 'ad_complete',
        adId: selectedAd.id,
        completed: true,
        app: 'packManager',
      });
    }
  }, [config, selectedAd]);

  const handlePlayerError = useCallback(
    (message: string) => {
      setPlayerError(message);
      if (selectedAd && config) {
        trackAdEvent(config.analyticsUrl, {
          event: 'ad_error',
          adId: selectedAd.id,
          app: 'packManager',
        });
      }
    },
    [config, selectedAd]
  );

  React.useEffect(() => {
    if (!open) return;
    setWatchProgress(0);
    setWatchComplete(false);
    setPlayerError(null);
  }, [open, selectedAd?.id]);

  React.useEffect(() => {
    if (!open || !selectedAd || !config) return;
    trackAdEvent(config.analyticsUrl, {
      event: 'ad_impression',
      adId: selectedAd.id,
      app: 'packManager',
    });
  }, [open, selectedAd, config]);

  if (!open) return null;

  const adsDisabled = config && !config.enabled;
  const canExport = adsDisabled || watchComplete;
  const canCancel = Boolean(error || adsDisabled || watchComplete || loading);

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4">
      <div
        className="bg-zinc-900 w-full max-w-3xl rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-zinc-800">
          <div className="text-[10px] text-cyan-400 uppercase tracking-widest mb-1">
            {t('adSponsored')}
          </div>
          <h2 className="text-xl font-semibold text-white">{t('adGateTitle')}</h2>
          <p className="text-sm text-zinc-400 mt-1">{t('adGateDesc')}</p>
        </div>

        <div className="p-6">
          {loading && (
            <div className="aspect-video rounded-xl bg-black flex items-center justify-center text-zinc-400 text-sm">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              {t('adLoading')}
            </div>
          )}

          {!loading && error && (
            <div className="aspect-video rounded-xl bg-black/60 border border-red-500/30 flex flex-col items-center justify-center text-center p-6 gap-4">
              <p className="text-red-400 text-sm">{t('adLoadError')}</p>
              <p className="text-xs text-zinc-500 font-mono">{error}</p>
              <button
                type="button"
                onClick={retry}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {t('adRetry')}
              </button>
            </div>
          )}

          {!loading && !error && adsDisabled && (
            <div className="aspect-video rounded-xl bg-black/60 border border-zinc-700 flex items-center justify-center text-zinc-400 text-sm p-6 text-center">
              {t('adDisabled')}
            </div>
          )}

          {!loading && !error && selectedAd && !adsDisabled && (
            <>
              {selectedAd.title && (
                <div className="flex items-center justify-between mb-3 gap-3">
                  <p className="text-sm text-zinc-300">{selectedAd.title}</p>
                  {selectedAd.clickUrl && (
                    <button
                      type="button"
                      onClick={() => openExternalUrl(selectedAd.clickUrl!)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 shrink-0"
                    >
                      {t('adLearnMore')}
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              <div className="aspect-video rounded-xl overflow-hidden bg-black border border-zinc-800">
                {playerError ? (
                  <div className="h-full flex flex-col items-center justify-center text-red-400 text-sm p-6 text-center gap-3">
                    <p>{playerError}</p>
                    <p className="text-xs text-zinc-500">{t('adClickToPlay')}</p>
                  </div>
                ) : selectedAd.type === 'vast' ? (
                  <ImaAdPlayer
                    vastTagUrl={selectedAd.url}
                    loadingLabel={t('adNetworkLoading')}
                    unavailableLabel={t('adNetworkUnavailable')}
                    hintLabel={t('adNetworkHint')}
                    onProgress={handleProgress}
                    onComplete={handleWatchComplete}
                    onError={handlePlayerError}
                  />
                ) : (
                  <AdVideoPlayer
                    ad={selectedAd}
                    onProgress={handleProgress}
                    onComplete={handleWatchComplete}
                    onError={handlePlayerError}
                  />
                )}
              </div>

              <div className="mt-4">
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-zinc-400">{t('adProgress')}</span>
                  <span className="text-cyan-400 font-mono">{Math.round(watchProgress)}%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
                    style={{ width: `${watchProgress}%` }}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="bg-black p-6 flex gap-3 text-sm border-t border-zinc-800">
          <button
            type="button"
            onClick={onCancel}
            disabled={!canCancel}
            className="flex-1 py-4 rounded-2xl border border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('adCancel')}
          </button>
          <button
            type="button"
            onClick={onComplete}
            disabled={!canExport}
            className="flex-1 py-4 bg-gradient-to-r from-white to-slate-100 text-black font-semibold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {t('adExportContinue')}
          </button>
        </div>
      </div>
    </div>
  );
};
