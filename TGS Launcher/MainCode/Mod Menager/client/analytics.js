/**
 * Google Analytics 4 — TGS Mod Manager
 * Sync com MainCode/shared/analytics/ga4Core.ts (fila + init antecipado).
 */
(function () {
  'use strict';

  var config = window.TGS_ANALYTICS_CONFIG || {};
  var measurementId = (config.measurementId || 'G-DF8MNV3V66').trim();
  var appName = config.appName || 'tgs_mod_manager';
  var appVersion = config.appVersion || '';
  var pageOrigin = 'https://tgs.gamer.gd';
  var PREFIX = 'mod-manager';
  var QUEUE_WARN_MS = 5000;

  var initialized = false;
  var scriptLoaded = false;
  var queue = [];
  var queueWarnTimer = null;

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

  function setupGtagQueue() {
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag === 'function') return;
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
  }

  function buildParams(params) {
    var payload = { app_name: appName, tgs_product: appName };
    if (params) {
      for (var key in params) {
        if (Object.prototype.hasOwnProperty.call(params, key) && params[key] !== undefined) {
          payload[key] = params[key];
        }
      }
    }
    return payload;
  }

  function logGa(message) {
    if (isGaDebugMode()) {
      var args = Array.prototype.slice.call(arguments, 1);
      console.info.apply(console, ['[TGS GA4] ' + message].concat(args));
    }
  }

  function scheduleQueueWarn() {
    if (queueWarnTimer || !isGaDebugMode()) return;
    queueWarnTimer = setTimeout(function () {
      queueWarnTimer = null;
      if (queue.length > 0 && !scriptLoaded) {
        console.warn(
          '[TGS GA4] Eventos na fila há >5s — gtag.js pode estar bloqueado (firewall/DNS)'
        );
      }
    }, QUEUE_WARN_MS);
  }

  function dispatchItem(item) {
    if (!window.gtag) return;
    if (item.kind === 'page_view') {
      var path = item.path.charAt(0) === '/' ? item.path : '/' + item.path;
      var fullPath = path.indexOf('/' + PREFIX) === 0 ? path : '/' + PREFIX + path;
      window.gtag('event', 'page_view', {
        page_path: fullPath,
        page_title: item.title || item.path,
        page_location: pageLocation(fullPath),
        app_name: appName,
        tgs_product: appName,
      });
      return;
    }
    if (item.kind === 'screen') {
      var screenPath = '/' + PREFIX + '/screen/' + item.screenName;
      dispatchItem({
        kind: 'page_view',
        path: screenPath,
        title: (item.extra && item.extra.hub_mode) || item.screenName,
      });
      var screenParams = { screen_name: item.screenName, tgs_category: 'navigation' };
      if (item.extra) {
        for (var k in item.extra) {
          if (Object.prototype.hasOwnProperty.call(item.extra, k)) screenParams[k] = item.extra[k];
        }
      }
      window.gtag('event', 'tgs_screen_view', buildParams(screenParams));
      return;
    }
    if (item.kind === 'event') {
      var payload = buildParams(item.params);
      window.gtag('event', item.name, payload);
      logGa('evento →', item.name, payload);
    }
  }

  function flushQueue() {
    while (queue.length > 0) {
      dispatchItem(queue.shift());
    }
    if (queueWarnTimer) {
      clearTimeout(queueWarnTimer);
      queueWarnTimer = null;
    }
  }

  function enqueue(item) {
    if (!isEnabled()) return;
    if (initialized && window.gtag) {
      dispatchItem(item);
      return;
    }
    queue.push(item);
    scheduleQueueWarn();
  }

  function loadGtagScript() {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[data-tgs-ga="' + measurementId + '"]')) {
        scriptLoaded = true;
        resolve();
        return;
      }
      var script = document.createElement('script');
      script.async = true;
      script.src =
        'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
      script.dataset.tgsGa = measurementId;
      script.onload = function () {
        scriptLoaded = true;
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
    initialized = true;

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

    flushQueue();

    return loadGtagScript()
      .then(function () {
        flushQueue();
        if (window.tgsModEvents && window.tgsModEvents.trackOpen) {
          window.tgsModEvents.trackOpen(appVersion);
        } else {
          trackPageView('/mod-manager/' + slug, document.title);
        }
        window.tgsModEvents &&
          window.tgsModEvents.trackScreenView &&
          window.tgsModEvents.trackScreenView(slug);
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
    enqueue({ kind: 'page_view', path: pagePath, title: pageTitle });
  }

  function trackScreen(screenName, extra) {
    enqueue({ kind: 'screen', screenName: screenName, extra: extra });
  }

  function trackEvent(eventName, params) {
    if (!isEnabled()) return;
    if (!initialized) {
      init().then(function () {
        trackEvent(eventName, params);
      });
      return;
    }
    enqueue({ kind: 'event', name: eventName, params: params });
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
    init: init,
    trackPageView: trackPageView,
    trackScreen: trackScreen,
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
