/**
 * Google Analytics 4 — TGS Mod Manager (HTML estático)
 * Requer analytics-config.js antes deste script.
 */
(function () {
  'use strict';

  var config = window.TGS_ANALYTICS_CONFIG || {};
  var measurementId = (config.measurementId || '').trim();
  var appName = config.appName || 'tgs_mod_manager';
  var appVersion = config.appVersion || '';
  var isFile = window.location.protocol === 'file:';
  var isDev =
    isFile ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  function isEnabled() {
    if (!measurementId) return false;
    if (isDev && !config.enabledInDev) return false;
    return true;
  }

  var initialized = false;

  function loadGtag() {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[data-tgs-ga="' + measurementId + '"]')) {
        resolve();
        return;
      }
      var script = document.createElement('script');
      script.async = true;
      script.src =
        'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
      script.dataset.tgsGa = measurementId;
      script.onload = function () {
        resolve();
      };
      script.onerror = function () {
        reject(new Error('gtag load failed'));
      };
      document.head.appendChild(script);
    });
  }

  function init() {
    if (!isEnabled() || initialized) return Promise.resolve();
    return loadGtag()
      .then(function () {
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () {
          window.dataLayer.push(arguments);
        };
        window.gtag('js', new Date());
        window.gtag('config', measurementId, {
          send_page_view: false,
          app_name: appName,
          app_version: appVersion || undefined,
          anonymize_ip: true,
        });
        initialized = true;
        trackPageView(window.location.pathname || '/', document.title);
      })
      .catch(function () {
        /* analytics must not break the app */
      });
  }

  function trackPageView(pagePath, pageTitle) {
    if (!initialized || !window.gtag) return;
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle || pagePath,
      app_name: appName,
    });
  }

  function trackEvent(eventName, params) {
    if (!initialized || !window.gtag) return;
    var payload = { app_name: appName };
    if (params) {
      for (var key in params) {
        if (Object.prototype.hasOwnProperty.call(params, key) && params[key] !== undefined) {
          payload[key] = params[key];
        }
      }
    }
    window.gtag('event', eventName, payload);
  }

  window.tgsAnalytics = {
    trackPageView: trackPageView,
    trackEvent: trackEvent,
    isEnabled: isEnabled,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init();
    });
  } else {
    init();
  }
})();
