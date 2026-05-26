/**
 * Catálogo de eventos GA4 — TGS Pack Manager
 */
import { trackEvent, trackScreen } from './ga4';

const PRODUCT = 'tgs_pack_manager';

function base(params?: Record<string, string | number | boolean | undefined>) {
  return { tgs_product: PRODUCT, ...params };
}

/** Sessão / app aberto (standalone ou após instalar pelo hub). */
export function trackPackOpen(appVersion: string) {
  trackScreen('home', { hub_mode: 'pack_manager' });
  trackEvent(
    'tgs_pack_open',
    base({
      tgs_category: 'lifecycle',
      tgs_action: 'app_open',
      app_version: appVersion,
    })
  );
}

/** Utilizador confirmou export (após gate de anúncio). */
export function trackPackExportStart(packId: string, packName: string, vehicleCount?: number) {
  trackEvent(
    'tgs_pack_export_start',
    base({
      tgs_category: 'export',
      tgs_action: 'export_start',
      pack_id: packId,
      pack_name: packName,
      ...(vehicleCount !== undefined ? { vehicle_count: vehicleCount } : {}),
    })
  );
}

export function trackPackExportComplete(
  packId: string,
  packName: string,
  durationMs?: number,
  warningCount?: number
) {
  trackEvent(
    'tgs_pack_export_complete',
    base({
      tgs_category: 'export',
      tgs_action: 'export_complete',
      pack_id: packId,
      pack_name: packName,
      ...(durationMs !== undefined ? { duration_ms: durationMs } : {}),
      ...(warningCount !== undefined ? { warning_count: warningCount } : {}),
    })
  );
}

export function trackPackExportFailed(packId: string, packName: string, errorMessage: string) {
  trackEvent(
    'tgs_pack_export_failed',
    base({
      tgs_category: 'export',
      tgs_action: 'export_failed',
      pack_id: packId,
      pack_name: packName,
      error_message: errorMessage.slice(0, 120),
    })
  );
}
