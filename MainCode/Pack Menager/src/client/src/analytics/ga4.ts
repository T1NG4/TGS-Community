/**
 * Google Analytics 4 — TGS Pack Manager (wrapper sobre ga4Core partilhado).
 */
import { createGa4Core } from '@tgs/analytics/ga4Core';
import { TGS_PRODUCTS } from '@tgs/analytics/tgsSchema';

const DEFAULT_MEASUREMENT_ID = 'G-DF8MNV3V66';

function isLocalHost(): boolean {
  try {
    const h = window.location.hostname;
    return h === 'localhost' || h === '127.0.0.1';
  } catch {
    return false;
  }
}

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

const ga4 = createGa4Core({
  appName: TGS_PRODUCTS.PACK,
  appPathPrefix: 'pack-manager',
  getMeasurementId,
  isGaEnabled,
  isGaDebugMode,
});

export const initGa4 = ga4.initGa4;
export const trackEvent = ga4.trackEvent;
export const trackScreen = ga4.trackScreen;
export const trackPageView = ga4.trackPageView;
export const enableGaDebugMode = ga4.enableGaDebugMode;
export const isGaInitialized = ga4.isGaInitialized;

if (typeof window !== 'undefined') {
  window.tgsGaEnableDebug = enableGaDebugMode;
  window.tgsGaPing = () => {
    ga4.ping();
    console.info('[TGS GA4] ping enviado — veja DebugView');
  };
}
