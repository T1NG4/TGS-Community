/**
 * GA4 core — fila de eventos, init antecipado, flush após gtag.js.
 * Usado por Launcher e Pack (TypeScript). Mod espelha em analytics.js.
 */

import { TGS_EVENTS, type TgsEventParams } from './tgsSchema';

export type GtagFn = {
  (...args: unknown[]): void;
  (command: 'js', date: Date): void;
  (command: 'config', id: string, params?: Record<string, unknown>): void;
  (command: 'event', name: string, params?: Record<string, unknown>): void;
};

export interface Ga4CoreConfig {
  appName: string;
  /** Prefixo de URL virtual: launcher | pack-manager | mod-manager */
  appPathPrefix: string;
  pageOrigin?: string;
  getMeasurementId: () => string;
  isGaEnabled: () => boolean;
  isGaDebugMode: () => boolean;
  /** Chamado após config + fila pronta (ex.: session_start). */
  onReady?: (appVersion?: string) => void;
}

type QueuedItem =
  | { kind: 'event'; name: string; params?: TgsEventParams }
  | { kind: 'page_view'; path: string; title?: string }
  | { kind: 'screen'; screenName: string; extra?: TgsEventParams };

const QUEUE_WARN_MS = 5000;

export function createGa4Core(config: Ga4CoreConfig) {
  const PAGE_ORIGIN = config.pageOrigin ?? 'https://tgs.gamer.gd';
  const APP_NAME = config.appName;
  const PREFIX = config.appPathPrefix;

  let initialized = false;
  let scriptLoaded = false;
  let initPromise: Promise<void> | null = null;
  const queue: QueuedItem[] = [];
  let queueWarnTimer: ReturnType<typeof setTimeout> | null = null;

  function setupGtagQueue(): void {
    if (typeof window === 'undefined') return;
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag === 'function') return;
    window.gtag = function gtag() {
      window.dataLayer!.push(arguments);
    } as GtagFn;
  }

  function pageLocation(path: string): string {
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${PAGE_ORIGIN}${p}`;
  }

  function buildParams(params?: TgsEventParams): Record<string, string | number | boolean> {
    const clean: Record<string, string | number | boolean> = {
      app_name: APP_NAME,
      tgs_product: APP_NAME,
    };
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) clean[k] = v;
      }
    }
    return clean;
  }

  function logGa(message: string, ...args: unknown[]): void {
    if (config.isGaDebugMode()) {
      console.info(`[TGS GA4] ${message}`, ...args);
    }
  }

  function scheduleQueueWarn(): void {
    if (queueWarnTimer || !config.isGaDebugMode()) return;
    queueWarnTimer = setTimeout(() => {
      queueWarnTimer = null;
      if (queue.length > 0 && !scriptLoaded) {
        console.warn(
          '[TGS GA4] Eventos na fila há >5s — gtag.js pode estar bloqueado (firewall/DNS)'
        );
      }
    }, QUEUE_WARN_MS);
  }

  function dispatchItem(item: QueuedItem): void {
    if (!window.gtag) return;
    switch (item.kind) {
      case 'page_view': {
        const path = item.path.startsWith('/') ? item.path : `/${item.path}`;
        const fullPath = path.startsWith(`/${PREFIX}`) ? path : `/${PREFIX}${path}`;
        window.gtag('event', 'page_view', {
          page_path: fullPath,
          page_title: item.title || item.path,
          page_location: pageLocation(fullPath),
          app_name: APP_NAME,
          tgs_product: APP_NAME,
        });
        break;
      }
      case 'screen': {
        const screenPath = `/${PREFIX}/screen/${item.screenName}`;
        dispatchItem({
          kind: 'page_view',
          path: screenPath,
          title: String(item.extra?.hub_mode || item.screenName),
        });
        window.gtag('event', TGS_EVENTS.SCREEN_VIEW, {
          ...buildParams(item.extra),
          screen_name: item.screenName,
          tgs_category: item.extra?.tgs_category ?? 'navigation',
        });
        break;
      }
      case 'event': {
        const payload = buildParams(item.params);
        window.gtag('event', item.name, payload);
        logGa('evento →', item.name, payload);
        break;
      }
    }
  }

  function flushQueue(): void {
    while (queue.length > 0) {
      const item = queue.shift()!;
      dispatchItem(item);
    }
    if (queueWarnTimer) {
      clearTimeout(queueWarnTimer);
      queueWarnTimer = null;
    }
  }

  function enqueue(item: QueuedItem): void {
    if (!config.isGaEnabled()) return;
    if (initialized && window.gtag) {
      dispatchItem(item);
      if (config.isGaDebugMode() && !scriptLoaded && item.kind === 'event') {
        console.warn(
          '[TGS GA4] gtag.js ainda a carregar — evento enviado via fila/dataLayer'
        );
      }
      return;
    }
    queue.push(item);
    scheduleQueueWarn();
  }

  function loadGtagScript(measurementId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[data-tgs-ga="${measurementId}"]`)) {
        scriptLoaded = true;
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
      script.dataset.tgsGa = measurementId;
      script.onload = () => {
        scriptLoaded = true;
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load gtag.js'));
      document.head.appendChild(script);
    });
  }

  async function initGa4(appVersion?: string): Promise<void> {
    if (!config.isGaEnabled()) {
      console.warn('[TGS GA4] desativado — sem Measurement ID válido');
      return;
    }
    if (initialized && initPromise) return initPromise;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      const measurementId = config.getMeasurementId();
      setupGtagQueue();
      initialized = true;

      window.gtag!('js', new Date());
      window.gtag!('config', measurementId, {
        send_page_view: false,
        app_name: APP_NAME,
        app_version: appVersion || undefined,
        anonymize_ip: true,
        debug_mode: config.isGaDebugMode(),
        page_location: pageLocation(`/${PREFIX}`),
        page_title: APP_NAME,
      });

      flushQueue();

      void loadGtagScript(measurementId)
        .then(() => {
          logGa('gtag.js carregado — Network: filtre por "collect"');
          flushQueue();
        })
        .catch(() => {
          console.warn(
            '[TGS GA4] Falha ao carregar gtag.js — antivírus/firewall podem bloquear googletagmanager.com'
          );
        });

      console.info(
        '[TGS GA4] Ativo —',
        measurementId,
        config.isGaDebugMode()
          ? '(DebugView ON — localhost/dev/TGS_GA_DEBUG)'
          : '(DebugView: localStorage TGS_GA_DEBUG=1 + reload)'
      );

      config.onReady?.(appVersion);
    })();

    return initPromise;
  }

  function trackPageView(pagePath: string, pageTitle?: string): void {
    enqueue({ kind: 'page_view', path: pagePath, title: pageTitle });
  }

  function trackScreen(
    screenName: string,
    extra?: TgsEventParams
  ): void {
    enqueue({ kind: 'screen', screenName, extra });
  }

  function trackEvent(eventName: string, params?: TgsEventParams): void {
    if (!config.isGaEnabled()) return;
    if (!initialized) {
      void initGa4().then(() => trackEvent(eventName, params));
      return;
    }
    enqueue({ kind: 'event', name: eventName, params });
  }

  function enableGaDebugMode(): void {
    try {
      localStorage.setItem('TGS_GA_DEBUG', '1');
    } catch {
      /* ignore */
    }
    if (window.gtag) {
      window.gtag('config', config.getMeasurementId(), { debug_mode: true });
      console.info('[TGS GA4] debug_mode ligado — abra DebugView no GA4');
    }
  }

  function isGaInitialized(): boolean {
    return initialized;
  }

  function ping(): void {
    trackEvent(TGS_EVENTS.GA_PING, { tgs_category: 'debug', tgs_action: 'ping' });
  }

  return {
    initGa4,
    trackEvent,
    trackScreen,
    trackPageView,
    enableGaDebugMode,
    isGaInitialized,
    ping,
    buildParams,
    getMeasurementId: config.getMeasurementId,
    isGaEnabled: config.isGaEnabled,
    isGaDebugMode: config.isGaDebugMode,
  };
}

declare global {
  interface Window {
    dataLayer?: IArguments[] | unknown[];
    gtag?: GtagFn;
    tgsGaEnableDebug?: () => void;
    tgsGaPing?: () => void;
  }
}
