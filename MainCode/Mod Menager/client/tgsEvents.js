/**
 * Catálogo de eventos GA4 — TGS Mod Manager
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

  window.tgsModEvents = {
    trackOpen: function (appVersion) {
      trackScreen('home', { hub_mode: 'mod_manager' });
      track('tgs_mod_open', {
        tgs_category: 'lifecycle',
        tgs_action: 'app_open',
        app_version: appVersion,
      });
    },
    trackLoginSuccess: function (method) {
      track('tgs_mod_login_success', {
        tgs_category: 'auth',
        tgs_action: 'login_success',
        method: method || 'password',
      });
    },
    trackDashboardOpen: function (screen) {
      track('tgs_mod_dashboard_open', {
        tgs_category: 'navigation',
        tgs_action: 'dashboard_open',
        screen: screen || 'dashboard',
      });
    },
  };
})();
