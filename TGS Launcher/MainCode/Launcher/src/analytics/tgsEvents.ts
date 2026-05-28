/**
 * Catálogo de eventos GA4 — TGS Launcher (hub)
 */
import { trackEvent, trackScreen } from './ga4';
import {
  TGS_EVENTS,
  TGS_PRODUCTS,
  normalizeTargetApp,
  truncateError,
} from '@tgs/analytics/tgsSchema';

function base(params?: Record<string, string | number | boolean | undefined>) {
  return { tgs_product: TGS_PRODUCTS.LAUNCHER, ...params };
}

function target(targetApp: string) {
  return normalizeTargetApp(targetApp);
}

export function trackHubScreen(screenName: string, hubMode?: string) {
  trackScreen(screenName, {
    tgs_category: 'navigation',
    hub_mode: hubMode || screenName,
  });
}

export function trackHubAppInstallStart(targetApp: string, versionTo: string) {
  trackEvent(TGS_EVENTS.HUB_APP_INSTALL_START, base({
    tgs_category: 'lifecycle',
    tgs_action: 'install_start',
    tgs_target_app: target(targetApp),
    version_to: versionTo,
  }));
}

export function trackHubAppInstallComplete(
  targetApp: string,
  version: string,
  durationMs?: number
) {
  trackEvent(TGS_EVENTS.HUB_APP_INSTALL_COMPLETE, base({
    tgs_category: 'lifecycle',
    tgs_action: 'install_complete',
    tgs_target_app: target(targetApp),
    app_version: version,
    ...(durationMs !== undefined ? { duration_ms: durationMs } : {}),
  }));
}

export function trackHubAppInstallFailed(targetApp: string, errorMessage: string) {
  trackEvent(TGS_EVENTS.HUB_APP_INSTALL_FAILED, base({
    tgs_category: 'lifecycle',
    tgs_action: 'install_failed',
    tgs_target_app: target(targetApp),
    error_message: truncateError(errorMessage),
  }));
}

export function trackHubInstallCancelled(targetApp: string) {
  trackEvent(TGS_EVENTS.HUB_APP_INSTALL_CANCELLED, base({
    tgs_category: 'lifecycle',
    tgs_action: 'install_cancelled',
    tgs_target_app: target(targetApp),
  }));
}

export function trackHubAppUpdateStart(
  targetApp: string,
  fromVersion: string,
  toVersion: string
) {
  trackEvent(TGS_EVENTS.HUB_APP_UPDATE_START, base({
    tgs_category: 'lifecycle',
    tgs_action: 'update_start',
    tgs_target_app: target(targetApp),
    version_from: fromVersion,
    version_to: toVersion,
  }));
}

export function trackHubAppUpdateComplete(targetApp: string, version: string) {
  trackEvent(TGS_EVENTS.HUB_APP_UPDATE_COMPLETE, base({
    tgs_category: 'lifecycle',
    tgs_action: 'update_complete',
    tgs_target_app: target(targetApp),
    app_version: version,
  }));
}

export function trackHubAppUpdateFailed(targetApp: string, errorMessage: string) {
  trackEvent(TGS_EVENTS.HUB_APP_UPDATE_FAILED, base({
    tgs_category: 'lifecycle',
    tgs_action: 'update_failed',
    tgs_target_app: target(targetApp),
    error_message: truncateError(errorMessage),
  }));
}

export function trackHubAppOpen(targetApp: string, installedVersion: string) {
  trackEvent(TGS_EVENTS.HUB_APP_OPEN, base({
    tgs_category: 'engagement',
    tgs_action: 'app_open',
    tgs_target_app: target(targetApp),
    app_version: installedVersion,
  }));
}

export function trackHubAppLaunchFailed(targetApp: string, errorMessage: string) {
  trackEvent(TGS_EVENTS.HUB_APP_LAUNCH_FAILED, base({
    tgs_category: 'error',
    tgs_action: 'launch_failed',
    tgs_target_app: target(targetApp),
    error_message: truncateError(errorMessage),
  }));
}

export function trackLauncherUpdateStart(fromVersion: string, toVersion: string) {
  trackEvent(TGS_EVENTS.LAUNCHER_SELF_UPDATE_START, base({
    tgs_category: 'lifecycle',
    tgs_action: 'launcher_update_start',
    version_from: fromVersion,
    version_to: toVersion,
  }));
}

export function trackLauncherUpdateComplete(version: string) {
  trackEvent(TGS_EVENTS.LAUNCHER_SELF_UPDATE_COMPLETE, base({
    tgs_category: 'lifecycle',
    tgs_action: 'launcher_update_complete',
    app_version: version,
  }));
}

export function trackLauncherUpdateFailed(errorMessage: string) {
  trackEvent(TGS_EVENTS.LAUNCHER_SELF_UPDATE_FAILED, base({
    tgs_category: 'error',
    tgs_action: 'launcher_update_failed',
    error_message: truncateError(errorMessage),
  }));
}
