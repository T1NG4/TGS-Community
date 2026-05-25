/**
 * Google Analytics 4 — TGS Mod Manager (HTML estático / file://)
 */
(function () {
  'use strict';

  var config = window.TGS_ANALYTICS_CONFIG || {};
  var measurementId = (config.measurementId || 'G-DF8MNV3V66').trim();
  var appName = config.appName || 'tgs_mod_manager';
  var appVersion = config.appVersion || '';
  var pageOrigin = 'https://tgs.gamer.gd';
  var isDev =
    window.location.protocol === 'file:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  function isEnabled() {
    if (!measurementId || measurementId.indexOf('XXXXXXXX') !== -1) return false;
    if (isDev && config.enabledInDev === false) return false;
    return true;
  }

  function pageLocation(path) {
    var p = path.charAt(0) === '/' ? path : '/' + path;
    return pageOrigin + p;
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
        var pagePath = (window.location.pathname || '/mod-manager').split(/[/\\]/).pop() || 'login';
        window.gtag('config', measurementId, {
          send_page_view: false,
          app_name: appName,
          app_version: appVersion || undefined,
          anonymize_ip: true,
          debug_mode: isDev,
          page_location: pageLocation('/mod-manager/' + pagePath.replace('.html', '')),
          page_title: 'TGS Mod Manager',
        });
        initialized = true;
        trackPageView('/mod-manager/' + pagePath.replace('.html', ''), document.title);
        if (isDev) {
          console.info('[TGS GA4] Ativo — use DebugView no GA4 em modo dev');
        }
      })
      .catch(function () {
        if (isDev) console.warn('[TGS GA4] Falha ao carregar gtag.js');
      });
  }

  function trackPageView(pagePath, pageTitle) {
    if (!initialized || !window.gtag) return;
    var path = pagePath.charAt(0) === '/' ? pagePath : '/' + pagePath;
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: pageTitle || pagePath,
      page_location: pageLocation(path),
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
