/**
 * Catálogo de eventos GA4 — TGS Pack Manager
 */
import { trackEvent, trackScreen } from './ga4';
import { TGS_EVENTS, TGS_PRODUCTS, truncateError } from '@tgs/analytics/tgsSchema';

function base(params?: Record<string, string | number | boolean | undefined>) {
  return { tgs_product: TGS_PRODUCTS.PACK, ...params };
}

export function trackPackOpen(appVersion: string) {
  trackScreen('home', { hub_mode: 'pack_manager' });
  trackEvent(TGS_EVENTS.PACK_OPEN, base({
    tgs_category: 'lifecycle',
    tgs_action: 'app_open',
    app_version: appVersion,
  }));
}

export function trackPackExportStart(packId: string, packName: string, vehicleCount?: number) {
  trackEvent(TGS_EVENTS.PACK_EXPORT_START, base({
    tgs_category: 'export',
    tgs_action: 'export_start',
    pack_id: packId,
    pack_name: packName,
    ...(vehicleCount !== undefined ? { vehicle_count: vehicleCount } : {}),
  }));
}

export function trackPackExportComplete(
  packId: string,
  packName: string,
  durationMs?: number,
  warningCount?: number
) {
  trackEvent(TGS_EVENTS.PACK_EXPORT_COMPLETE, base({
    tgs_category: 'export',
    tgs_action: 'export_complete',
    pack_id: packId,
    pack_name: packName,
    ...(durationMs !== undefined ? { duration_ms: durationMs } : {}),
    ...(warningCount !== undefined ? { warning_count: warningCount } : {}),
  }));
}

export function trackPackExportFailed(packId: string, packName: string, errorMessage: string) {
  trackEvent(TGS_EVENTS.PACK_EXPORT_FAILED, base({
    tgs_category: 'export',
    tgs_action: 'export_failed',
    pack_id: packId,
    pack_name: packName,
    error_message: truncateError(errorMessage),
  }));
}

export function trackPackExportCancelled(packId: string, packName: string) {
  trackEvent(TGS_EVENTS.PACK_EXPORT_CANCELLED, base({
    tgs_category: 'export',
    tgs_action: 'export_cancelled',
    pack_id: packId,
    pack_name: packName,
  }));
}

export function trackPackAdImpression(adId: string) {
  trackEvent(TGS_EVENTS.PACK_AD_IMPRESSION, base({
    tgs_category: 'ads',
    tgs_action: 'ad_impression',
    ad_id: adId,
  }));
}

export function trackPackAdComplete(adId: string) {
  trackEvent(TGS_EVENTS.PACK_AD_COMPLETE, base({
    tgs_category: 'ads',
    tgs_action: 'ad_complete',
    ad_id: adId,
  }));
}

export function trackPackAdError(adId: string, errorMessage?: string) {
  trackEvent(TGS_EVENTS.PACK_AD_ERROR, base({
    tgs_category: 'ads',
    tgs_action: 'ad_error',
    ad_id: adId,
    ...(errorMessage ? { error_message: truncateError(errorMessage) } : {}),
  }));
}

export function trackPackAdSkipped(reason: string) {
  trackEvent(TGS_EVENTS.PACK_AD_SKIPPED, base({
    tgs_category: 'ads',
    tgs_action: 'ad_skipped',
    skip_reason: reason,
  }));
}

export function trackPackTabView(tabName: string) {
  trackEvent(TGS_EVENTS.PACK_TAB_VIEW, base({
    tgs_category: 'navigation',
    tgs_action: 'tab_view',
    tab_name: tabName,
  }));
}
