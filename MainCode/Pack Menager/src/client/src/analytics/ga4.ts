/**
 * Google Analytics 4 (gtag.js) — TGS Pack Manager
 * Configure VITE_GA_MEASUREMENT_ID no .env (ver .env.example).
 */

const APP_NAME = 'tgs_pack_manager';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let initialized = false;

export function getMeasurementId(): string {
  return (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim() || '';
}

export function isGaEnabled(): boolean {
  const id = getMeasurementId();
  if (!id) return false;
  if (import.meta.env.DEV && import.meta.env.VITE_GA_ENABLED !== 'true') return false;
  return true;
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

  try {
    await loadGtagScript(measurementId);
  } catch {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false,
    app_name: APP_NAME,
    app_version: appVersion || undefined,
    anonymize_ip: true,
  });

  initialized = true;
}

export function trackPageView(pagePath: string, pageTitle?: string): void {
  if (!initialized || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: pageTitle || pagePath,
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
