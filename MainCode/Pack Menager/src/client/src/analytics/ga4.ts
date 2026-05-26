/**
 * Google Analytics 4 (gtag.js) — TGS Pack Manager
 * Desktop: page_location do site TGS (localhost/file não contam bem no GA4).
 */

const APP_NAME = 'tgs_pack_manager';
const DEFAULT_MEASUREMENT_ID = 'G-DF8MNV3V66';
const PAGE_ORIGIN = 'https://tgs.gamer.gd';

declare global {
  interface Window {
    dataLayer?: IArguments[] | unknown[];
    gtag?: GtagFn;
    tgsGaEnableDebug?: () => void;
    tgsGaPing?: () => void;
  }
}

type GtagFn = {
  (...args: unknown[]): void;
  (command: 'js', date: Date): void;
  (command: 'config', id: string, params?: Record<string, unknown>): void;
  (command: 'event', name: string, params?: Record<string, unknown>): void;
};

function setupGtagQueue(): void {
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag === 'function') return;
  window.gtag = function gtag() {
    window.dataLayer!.push(arguments);
  } as GtagFn;
}

let initialized = false;
let scriptLoaded = false;

function isLocalHost(): boolean {
  try {
    const h = window.location.hostname;
    return h === 'localhost' || h === '127.0.0.1';
  } catch {
    return false;
  }
}

/** DebugView: localStorage TGS_GA_DEBUG=1, npm run dev, ou app em localhost (portable). */
export function isGaDebugMode(): boolean {
  try {
    return (
      import.meta.env.DEV ||
      localStorage.getItem('TGS_GA_DEBUG') === '1' ||
      isLocalHost()
    );
  } catch {
    return import.meta.env.DEV;
  }
}

export function enableGaDebugMode(): void {
  try {
    localStorage.setItem('TGS_GA_DEBUG', '1');
  } catch {
    /* ignore */
  }
  if (window.gtag) {
    window.gtag('config', getMeasurementId(), { debug_mode: true });
    console.info('[TGS GA4] debug_mode ligado — eventos vão para DebugView');
  } else {
    console.info('[TGS GA4] debug_mode será aplicado no próximo arranque — faça reload');
  }
}

export function getMeasurementId(): string {
  const fromEnv = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim();
  return fromEnv || DEFAULT_MEASUREMENT_ID;
}

export function isGaEnabled(): boolean {
  const id = getMeasurementId();
  if (!id || id.includes('XXXXXXXX')) return false;
  if (import.meta.env.DEV && import.meta.env.VITE_GA_ENABLED === 'false') return false;
  return true;
}

export function isGaInitialized(): boolean {
  return initialized;
}

function pageLocation(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${PAGE_ORIGIN}${p}`;
}

function logGa(message: string, ...args: unknown[]): void {
  if (isGaDebugMode()) {
    console.info(`[TGS GA4] ${message}`, ...args);
  }
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

export async function initGa4(appVersion?: string): Promise<void> {
  if (!isGaEnabled()) {
    console.warn('[TGS GA4] desativado — sem Measurement ID válido');
    return;
  }
  if (initialized) return;

  const measurementId = getMeasurementId();
  setupGtagQueue();
  initialized = true;

  window.gtag!('js', new Date());
  window.gtag!('config', measurementId, {
    send_page_view: false,
    app_name: APP_NAME,
    app_version: appVersion || undefined,
    anonymize_ip: true,
    debug_mode: isGaDebugMode(),
    page_location: pageLocation('/pack-manager'),
    page_title: 'TGS Pack Manager',
  });

  void loadGtagScript(measurementId)
    .then(() => {
      logGa('gtag.js carregado — Network: filtre por "collect"');
    })
    .catch(() => {
      console.warn(
        '[TGS GA4] Falha ao carregar gtag.js — antivírus/firewall podem bloquear googletagmanager.com'
      );
    });

  window.tgsGaEnableDebug = enableGaDebugMode;
  window.tgsGaPing = () => {
    trackEvent('tgs_ga_ping', { tgs_category: 'debug', tgs_action: 'ping' });
    logGa('ping enviado — veja DebugView');
  };

  console.info(
    '[TGS GA4] Ativo —',
    measurementId,
    isGaDebugMode()
      ? '(DebugView ON — localhost/dev/TGS_GA_DEBUG)'
      : '(DebugView: localStorage TGS_GA_DEBUG=1 + reload, ou tgsGaEnableDebug())'
  );
}

export function trackPageView(pagePath: string, pageTitle?: string): void {
  if (!initialized || !window.gtag) return;
  const path = pagePath.startsWith('/') ? pagePath : `/${pagePath}`;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: pageTitle || pagePath,
    page_location: pageLocation(path.startsWith('/pack-manager') ? path : `/pack-manager${path}`),
    app_name: APP_NAME,
    tgs_product: APP_NAME,
  });
}

function buildParams(params?: Record<string, string | number | boolean | undefined>) {
  const clean: Record<string, string | number | boolean> = { app_name: APP_NAME, tgs_product: APP_NAME };
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) clean[k] = v;
    }
  }
  return clean;
}

export function trackScreen(
  screenName: string,
  extra?: Record<string, string | number | boolean | undefined>
): void {
  if (!initialized || !window.gtag) {
    logGa('trackScreen ignorado (GA ainda não pronto):', screenName);
    return;
  }
  const path = `/pack-manager/screen/${screenName}`;
  trackPageView(path, String(extra?.hub_mode || screenName));
  window.gtag('event', 'tgs_screen_view', {
    ...buildParams(extra),
    screen_name: screenName,
    tgs_category: 'navigation',
  });
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean | undefined>
): void {
  if (!isGaEnabled()) return;

  if (!initialized || !window.gtag) {
    logGa('evento descartado (init pendente):', eventName);
    void initGa4().then(() => trackEvent(eventName, params));
    return;
  }

  const payload = buildParams(params);
  window.gtag('event', eventName, payload);
  logGa('evento →', eventName, payload);

  if (isGaDebugMode() && !scriptLoaded) {
    console.warn(
      '[TGS GA4] gtag.js ainda a carregar — o evento ficou na fila; se não aparecer no DebugView, verifique firewall'
    );
  }
}
