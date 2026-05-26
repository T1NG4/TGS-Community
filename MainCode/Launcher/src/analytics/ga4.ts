/**
 * Google Analytics 4 (gtag.js) — TGS Launcher
 * Desktop/Electron: GA ignora file:// e localhost — usamos page_location do site TGS.
 */

const APP_NAME = 'tgs_launcher';
const DEFAULT_MEASUREMENT_ID = 'G-DF8MNV3V66';
const PAGE_ORIGIN = 'https://tgs.gamer.gd';

declare global {
  interface Window {
    dataLayer?: IArguments[] | unknown[];
    gtag?: GtagFn;
  }
}

/** Formato exigido pelo gtag.js oficial: dataLayer.push(arguments), não push([...args]). */
type GtagFn = {
  (...args: unknown[]): void;
  (command: 'js', date: Date): void;
  (command: 'config', id: string, params?: Record<string, unknown>): void;
  (command: 'event', name: string, params?: Record<string, unknown>): void;
};

function setupGtagQueue(): void {
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag === 'function') return;
  // Igual ao snippet do Google Tag
  window.gtag = function gtag() {
    window.dataLayer!.push(arguments);
  } as GtagFn;
}

let initialized = false;

/** Ativa DebugView no GA4: no console do app → localStorage.setItem('TGS_GA_DEBUG','1'); location.reload(); */
export function isGaDebugMode(): boolean {
  try {
    return import.meta.env.DEV || localStorage.getItem('TGS_GA_DEBUG') === '1';
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
    console.info('[TGS GA4] debug_mode ligado — abra DebugView no GA4');
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

function pageLocation(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${PAGE_ORIGIN}${p}`;
}

function loadGtagScript(measurementId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-tgs-ga="${measurementId}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    script.dataset.tgsGa = measurementId;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load gtag.js'));
    document.head.appendChild(script);
  });
}

export async function initGa4(appVersion?: string): Promise<void> {
  if (initialized || !isGaEnabled()) return;
  const measurementId = getMeasurementId();

  setupGtagQueue();

  window.gtag!('js', new Date());
  window.gtag!('config', measurementId, {
    send_page_view: false,
    app_name: APP_NAME,
    app_version: appVersion || undefined,
    anonymize_ip: true,
    debug_mode: isGaDebugMode(),
    page_location: pageLocation('/launcher'),
    page_title: 'TGS Launcher',
  });

  try {
    await loadGtagScript(measurementId);
  } catch {
    console.warn('[TGS GA4] Falha ao carregar gtag.js — verifique rede/firewall');
    return;
  }

  initialized = true;

  if (typeof window !== 'undefined') {
    (window as Window & { tgsGaEnableDebug?: () => void }).tgsGaEnableDebug = enableGaDebugMode;
  }

  console.info(
    '[TGS GA4] Ativo —',
    measurementId,
    isGaDebugMode() ? '(DebugView ON)' : '(DebugView: localStorage TGS_GA_DEBUG=1 + reload)'
  );
}

export function trackPageView(pagePath: string, pageTitle?: string): void {
  if (!initialized || !window.gtag) return;
  const path = pagePath.startsWith('/') ? pagePath : `/${pagePath}`;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: pageTitle || pagePath,
    page_location: pageLocation(`/launcher${path}`),
    app_name: APP_NAME,
  });
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean | undefined>
): void {
  if (!initialized || !window.gtag) return;
  const clean: Record<string, string | number | boolean> = { app_name: APP_NAME };
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) clean[k] = v;
    }
  }
  window.gtag('event', eventName, clean);
}
