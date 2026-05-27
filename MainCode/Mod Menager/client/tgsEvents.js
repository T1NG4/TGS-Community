/**
 * Catálogo de eventos GA4 — TGS Mod Manager
 * Sync com MainCode/shared/analytics/tgsSchema.ts
 */
(function () {
  'use strict';

  var PRODUCT = 'tgs_mod_manager';

  function base(params) {
    var out = { tgs_product: PRODUCT };
    if (params) {
      for (var k in params) {
        if (Object.prototype.hasOwnProperty.call(params, k) && params[k] !== undefined) {
          out[k] = params[k];
        }
      }
    }
    return out;
  }

  function truncate(msg, max) {
    max = max || 120;
    return msg && msg.length > max ? msg.slice(0, max) : msg || '';
  }

  function track(name, params) {
    if (window.tgsAnalytics && window.tgsAnalytics.trackEvent) {
      window.tgsAnalytics.trackEvent(name, base(params));
    }
  }

  function trackScreen(screenName, extra) {
    if (window.tgsAnalytics && window.tgsAnalytics.trackScreen) {
      window.tgsAnalytics.trackScreen(screenName, extra);
    }
  }

  var searchDebounceTimer = null;

  window.tgsModEvents = {
    trackOpen: function (version) {
      trackScreen('home', { hub_mode: 'mod_manager' });
      track('tgs_mod_open', {
        tgs_category: 'lifecycle',
        tgs_action: 'app_open',
        app_version: version,
      });
    },

    trackScreenView: function (pageSlug) {
      track('tgs_mod_screen_view', {
        tgs_category: 'navigation',
        tgs_action: 'screen_view',
        screen_name: pageSlug || 'unknown',
      });
    },

    trackLoginSuccess: function (method) {
      track('tgs_mod_login_success', {
        tgs_category: 'auth',
        tgs_action: 'login_success',
        method: method || 'password',
      });
      if (window.gtag) {
        window.gtag('event', 'login', { method: method || 'password' });
      }
    },

    trackLoginFailed: function (reason) {
      track('tgs_mod_login_failed', {
        tgs_category: 'auth',
        tgs_action: 'login_failed',
        error_message: truncate(reason),
      });
    },

    trackLogout: function () {
      track('tgs_mod_logout', {
        tgs_category: 'auth',
        tgs_action: 'logout',
      });
    },

    trackDashboardOpen: function (screen) {
      track('tgs_mod_dashboard_open', {
        tgs_category: 'navigation',
        tgs_action: 'dashboard_open',
        screen: screen || 'dashboard',
      });
    },

    trackModToggle: function (modId, enabled) {
      track('tgs_mod_mod_toggle', {
        tgs_category: 'engagement',
        tgs_action: enabled ? 'mod_enable' : 'mod_disable',
        mod_id: String(modId),
      });
    },

    trackModApplyAll: function (count) {
      track('tgs_mod_mod_apply_all', {
        tgs_category: 'engagement',
        tgs_action: 'mod_apply_all',
        mod_count: count,
      });
    },

    trackFivemLaunch: function () {
      track('tgs_mod_fivem_launch', {
        tgs_category: 'engagement',
        tgs_action: 'fivem_launch',
      });
    },

    trackSearch: function (query, resultCount) {
      if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(function () {
        searchDebounceTimer = null;
        var q = (query || '').trim();
        if (!q) return;
        track('tgs_mod_search', {
          tgs_category: 'engagement',
          tgs_action: 'search',
          search_term: truncate(q, 80),
          result_count: resultCount,
        });
      }, 2000);
    },
  };
})();
