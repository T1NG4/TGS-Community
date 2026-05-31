(function () {
  const cfg = window.TGS_SITE?.adsense;
  if (!cfg) return;

  const CLIENT_RE = /^ca-pub-\d+$/i;
  const SLOT_RE = /^\d+$/;

  let masterAdsEnabled = null;

  function isLocalDev() {
    const h = window.location.hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === '' || window.location.protocol === 'file:';
  }

  function resolveMasterAdsEnabled() {
    if (masterAdsEnabled !== null) return masterAdsEnabled;
    if (typeof window.TGS_SITE?.adsEnabled === 'boolean') {
      masterAdsEnabled = window.TGS_SITE.adsEnabled;
      return masterAdsEnabled;
    }
    masterAdsEnabled = cfg.enabled !== false;
    return masterAdsEnabled;
  }

  function isConfigured() {
    if (!resolveMasterAdsEnabled()) return false;
    if (!cfg.enabled) return false;
    if (!CLIENT_RE.test(String(cfg.clientId || '').trim())) return false;
    if (cfg.autoAds) return true;
    const units = cfg.units || {};
    return Object.values(units).some((u) => u && SLOT_RE.test(String(u.slot || '').trim()));
  }

  function hideAllSlots() {
    document.querySelectorAll('.tgs-ad-slot').forEach((el) => {
      el.hidden = true;
      el.classList.add('is-disabled');
    });
  }

  function ensureMetaVerification(clientId) {
    if (document.querySelector('meta[name="google-adsense-account"]')) return;
    const meta = document.createElement('meta');
    meta.name = 'google-adsense-account';
    meta.content = clientId;
    document.head.appendChild(meta);
  }

  function loadAdScript(clientId) {
    if (document.querySelector('script[data-tgs-adsense]')) return;
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
    script.crossOrigin = 'anonymous';
    script.dataset.tgsAdsense = clientId;
    document.head.appendChild(script);
  }

  function pushAd(ins) {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.warn('[TGS AdSense] push failed', err);
      ins.closest('.tgs-ad-slot')?.classList.add('is-error');
    }
  }

  function renderUnit(container, unitCfg, clientId) {
    const slot = String(unitCfg?.slot || '').trim();
    if (!SLOT_RE.test(slot)) {
      container.hidden = true;
      container.classList.add('is-disabled');
      return;
    }

    container.hidden = false;
    container.classList.remove('is-disabled');

    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', clientId);
    ins.setAttribute('data-ad-slot', slot);

    const format = unitCfg.format || 'auto';
    if (format) ins.setAttribute('data-ad-format', format);

    if (unitCfg.fullWidthResponsive !== false && format === 'auto') {
      ins.setAttribute('data-full-width-responsive', 'true');
    }

    if (unitCfg.layoutKey) ins.setAttribute('data-ad-layout-key', unitCfg.layoutKey);
    if (unitCfg.layout) ins.setAttribute('data-ad-layout', unitCfg.layout);

    container.appendChild(ins);
    pushAd(ins);
  }

  function renderPlacements(clientId) {
    document.querySelectorAll('[data-tgs-ad]').forEach((container) => {
      const key = container.getAttribute('data-tgs-ad');
      const unitCfg = cfg.units?.[key];
      if (!unitCfg) {
        container.hidden = true;
        return;
      }
      renderUnit(container, unitCfg, clientId);
    });
  }

  function applyRemoteMonetization(data) {
    if (!data || typeof data !== 'object') return;
    if (typeof data.adsEnabled === 'boolean') {
      masterAdsEnabled = data.adsEnabled;
      window.TGS_SITE.adsEnabled = data.adsEnabled;
    }
    const remoteAdsense = data.site?.adsense;
    if (remoteAdsense && typeof remoteAdsense === 'object') {
      Object.assign(cfg, remoteAdsense);
    }
  }

  async function loadMonetizationConfig() {
    try {
      const res = await fetch('config/monetization.json', { cache: 'no-store' });
      if (!res.ok) return;
      applyRemoteMonetization(await res.json());
    } catch {
      // fallback: site-config.js
    }
  }

  function initAds() {
    if (!isConfigured() || isLocalDev()) {
      hideAllSlots();
      return;
    }

    const clientId = cfg.clientId.trim();
    ensureMetaVerification(clientId);
    loadAdScript(clientId);

    if (cfg.autoAds) return;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => renderPlacements(clientId));
    } else {
      renderPlacements(clientId);
    }
  }

  async function init() {
    await loadMonetizationConfig();
    initAds();
  }

  window.tgsAdsense = { init, isConfigured, isLocalDev, resolveMasterAdsEnabled };
  init();
})();
