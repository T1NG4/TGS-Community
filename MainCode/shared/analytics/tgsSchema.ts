/**
 * Catálogo e tipos GA4 — ecossistema TGS (single source of truth).
 */

export const TGS_PRODUCTS = {
  LAUNCHER: 'tgs_launcher',
  PACK: 'tgs_pack_manager',
  MOD: 'tgs_mod_manager',
} as const;

export type TgsProduct = (typeof TGS_PRODUCTS)[keyof typeof TGS_PRODUCTS];

export type TgsCategory =
  | 'lifecycle'
  | 'navigation'
  | 'export'
  | 'auth'
  | 'ads'
  | 'engagement'
  | 'error'
  | 'debug';

export type TgsTargetApp = 'pack' | 'mod' | 'code';

export type TgsEventParams = Record<string, string | number | boolean | undefined>;

/** Normaliza IDs do hub (packManager → pack). */
export function normalizeTargetApp(appType: string): TgsTargetApp | string {
  const map: Record<string, TgsTargetApp> = {
    packManager: 'pack',
    pack_manager: 'pack',
    pack: 'pack',
    modManager: 'mod',
    mod_manager: 'mod',
    mod: 'mod',
    codeManager: 'code',
    code_manager: 'code',
    code: 'code',
  };
  return map[appType] ?? appType;
}

export function truncateError(msg: string, max = 120): string {
  return msg.length > max ? msg.slice(0, max) : msg;
}

/** Nomes de eventos custom (prefixo tgs_). */
export const TGS_EVENTS = {
  // Shared / debug
  SCREEN_VIEW: 'tgs_screen_view',
  GA_PING: 'tgs_ga_ping',

  // Launcher
  LAUNCHER_SESSION_START: 'tgs_launcher_session_start',
  LAUNCHER_SELF_UPDATE_START: 'tgs_launcher_self_update_start',
  LAUNCHER_SELF_UPDATE_COMPLETE: 'tgs_launcher_self_update_complete',
  LAUNCHER_SELF_UPDATE_FAILED: 'tgs_launcher_self_update_failed',
  HUB_APP_INSTALL_START: 'tgs_hub_app_install_start',
  HUB_APP_INSTALL_COMPLETE: 'tgs_hub_app_install_complete',
  HUB_APP_INSTALL_FAILED: 'tgs_hub_app_install_failed',
  HUB_APP_INSTALL_CANCELLED: 'tgs_hub_install_cancelled',
  HUB_APP_UPDATE_START: 'tgs_hub_app_update_start',
  HUB_APP_UPDATE_COMPLETE: 'tgs_hub_app_update_complete',
  HUB_APP_UPDATE_FAILED: 'tgs_hub_app_update_failed',
  HUB_APP_OPEN: 'tgs_hub_app_open',
  HUB_APP_LAUNCH_FAILED: 'tgs_hub_app_launch_failed',

  // Pack
  PACK_OPEN: 'tgs_pack_open',
  PACK_EXPORT_START: 'tgs_pack_export_start',
  PACK_EXPORT_COMPLETE: 'tgs_pack_export_complete',
  PACK_EXPORT_FAILED: 'tgs_pack_export_failed',
  PACK_EXPORT_CANCELLED: 'tgs_pack_export_cancelled',
  PACK_AD_IMPRESSION: 'tgs_pack_ad_impression',
  PACK_AD_COMPLETE: 'tgs_pack_ad_complete',
  PACK_AD_ERROR: 'tgs_pack_ad_error',
  PACK_AD_SKIPPED: 'tgs_pack_ad_skipped',
  PACK_TAB_VIEW: 'tgs_pack_tab_view',

  // Mod
  MOD_OPEN: 'tgs_mod_open',
  MOD_SCREEN_VIEW: 'tgs_mod_screen_view',
  MOD_LOGIN_SUCCESS: 'tgs_mod_login_success',
  MOD_LOGIN_FAILED: 'tgs_mod_login_failed',
  MOD_LOGOUT: 'tgs_mod_logout',
  MOD_DASHBOARD_OPEN: 'tgs_mod_dashboard_open',
  MOD_MOD_TOGGLE: 'tgs_mod_mod_toggle',
  MOD_MOD_APPLY_ALL: 'tgs_mod_mod_apply_all',
  MOD_FIVEM_LAUNCH: 'tgs_mod_fivem_launch',
  MOD_SEARCH: 'tgs_mod_search',
} as const;

export type TgsEventName = (typeof TGS_EVENTS)[keyof typeof TGS_EVENTS];
