/**
 * Google Analytics 4 — TGS Mod Manager
 */
(function () {
  'use strict';

  var config = window.TGS_ANALYTICS_CONFIG || {};
  var measurementId = (config.measurementId || 'G-DF8MNV3V66').trim();
  var appName = config.appName || 'tgs_mod_manager';
  var appVersion = config.appVersion || '';
  var pageOrigin = 'https://tgs.gamer.gd';

  function isGaDebugMode() {
    try {
      return (
        localStorage.getItem('TGS_GA_DEBUG') === '1' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
      );
    } catch (e) {
      return false;
    }
  }

  function isEnabled() {
    if (!measurementId || measurementId.indexOf('XXXXXXXX') !== -1) return false;
    if (config.enabledInDev === false && window.location.protocol === 'file:') return false;
    return true;
  }

  function pageLocation(path) {
    var p = path.charAt(0) === '/' ? path : '/' + path;
    return pageOrigin + p;
  }

  var initialized = false;

  function setupGtagQueue() {
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag === 'function') return;
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
  }

  function loadGtagScript() {
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

  function currentPageSlug() {
    var pagePath = (window.location.pathname || '/mod-manager/login').split(/[/\\]/).pop() || 'login';
    return pagePath.replace('.html', '');
  }

  function init() {
    if (!isEnabled() || initialized) return Promise.resolve();

    setupGtagQueue();

    var slug = currentPageSlug();
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: false,
      app_name: appName,
      app_version: appVersion || undefined,
      anonymize_ip: true,
      debug_mode: isGaDebugMode(),
      page_location: pageLocation('/mod-manager/' + slug),
      page_title: 'TGS Mod Manager',
    });

    return loadGtagScript()
      .then(function () {
        initialized = true;
        trackPageView('/mod-manager/' + slug, document.title);
        console.info(
          '[TGS GA4] Ativo —',
          measurementId,
          isGaDebugMode() ? '(DebugView ON)' : '(TGS_GA_DEBUG=1 + reload para DebugView)'
        );
      })
      .catch(function () {
        console.warn('[TGS GA4] Falha ao carregar gtag.js — rede/firewall');
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

  function enableGaDebugMode() {
    try {
      localStorage.setItem('TGS_GA_DEBUG', '1');
    } catch (e) {
      /* ignore */
    }
    if (window.gtag) {
      window.gtag('config', measurementId, { debug_mode: true });
      console.info('[TGS GA4] debug_mode ligado');
    }
  }

  window.tgsAnalytics = {
    trackPageView: trackPageView,
    trackEvent: trackEvent,
    isEnabled: isEnabled,
    enableGaDebugMode: enableGaDebugMode,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init();
    });
  } else {
    init();
  }
})();
