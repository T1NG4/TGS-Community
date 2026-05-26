/**
 * Catálogo de eventos GA4 — TGS Launcher (hub)
 * Nomes prefixados com tgs_ para filtrar no painel "Principais eventos".
 */
import { trackEvent, trackScreen } from './ga4';

const PRODUCT = 'tgs_launcher';

function base(params?: Record<string, string | number | boolean | undefined>) {
  return { tgs_product: PRODUCT, ...params };
}

/** Troca de tela / modo no hub (Pack, Mod, Code). */
export function trackHubScreen(screenName: string, hubMode?: string) {
  trackScreen(screenName, {
    tgs_category: 'navigation',
    hub_mode: hubMode || screenName,
  });
}

/** Primeira instalação de um app pelo hub. */
export function trackHubAppInstallStart(targetApp: string, versionTo: string) {
  trackEvent(
    'tgs_hub_app_install_start',
    base({
      tgs_category: 'lifecycle',
      tgs_action: 'install_start',
      tgs_target_app: targetApp,
      version_to: versionTo,
    })
  );
}

export function trackHubAppInstallComplete(
  targetApp: string,
  version: string,
  durationMs?: number
) {
  trackEvent(
    'tgs_hub_app_install_complete',
    base({
      tgs_category: 'lifecycle',
      tgs_action: 'install_complete',
      tgs_target_app: targetApp,
      app_version: version,
      ...(durationMs !== undefined ? { duration_ms: durationMs } : {}),
    })
  );
}

export function trackHubAppInstallFailed(targetApp: string, errorMessage: string) {
  trackEvent(
    'tgs_hub_app_install_failed',
    base({
      tgs_category: 'lifecycle',
      tgs_action: 'install_failed',
      tgs_target_app: targetApp,
      error_message: errorMessage.slice(0, 120),
    })
  );
}

/** Atualização de app já instalado. */
export function trackHubAppUpdateStart(
  targetApp: string,
  fromVersion: string,
  toVersion: string
) {
  trackEvent(
    'tgs_hub_app_update_start',
    base({
      tgs_category: 'lifecycle',
      tgs_action: 'update_start',
      tgs_target_app: targetApp,
      version_from: fromVersion,
      version_to: toVersion,
    })
  );
}

export function trackHubAppUpdateComplete(targetApp: string, version: string) {
  trackEvent(
    'tgs_hub_app_update_complete',
    base({
      tgs_category: 'lifecycle',
      tgs_action: 'update_complete',
      tgs_target_app: targetApp,
      app_version: version,
    })
  );
}

export function trackHubAppUpdateFailed(targetApp: string, errorMessage: string) {
  trackEvent(
    'tgs_hub_app_update_failed',
    base({
      tgs_category: 'lifecycle',
      tgs_action: 'update_failed',
      tgs_target_app: targetApp,
      error_message: errorMessage.slice(0, 120),
    })
  );
}

/** Usuário abriu Pack / Mod pelo botão Executar. */
export function trackHubAppOpen(targetApp: string, installedVersion: string) {
  trackEvent(
    'tgs_hub_app_open',
    base({
      tgs_category: 'engagement',
      tgs_action: 'app_open',
      tgs_target_app: targetApp,
      app_version: installedVersion,
    })
  );
}

/** Auto-update do próprio Launcher. */
export function trackLauncherUpdateStart(fromVersion: string, toVersion: string) {
  trackEvent(
    'tgs_launcher_self_update_start',
    base({
      tgs_category: 'lifecycle',
      tgs_action: 'launcher_update_start',
      version_from: fromVersion,
      version_to: toVersion,
    })
  );
}

export function trackLauncherUpdateComplete(version: string) {
  trackEvent(
    'tgs_launcher_self_update_complete',
    base({
      tgs_category: 'lifecycle',
      tgs_action: 'launcher_update_complete',
      app_version: version,
    })
  );
}
