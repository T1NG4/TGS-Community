(function () {
  const cfg = window.TGS_SITE;
  if (!cfg?.links) return;

  const REPO = 'T1NG4/TGS-launcher-releases';
  const ASSET_NAME = cfg.links.launcherAssetName || 'TGS-Launcher-Setup.exe';
  const RELEASES_PAGE = cfg.links.launcherReleases || `https://github.com/${REPO}/releases/latest`;
  /** Sempre aponta para o .exe da release latest — funciona sem API (CORS/rate limit). */
  const DIRECT_EXE =
    cfg.links.launcherDownloadDirect ||
    `https://github.com/${REPO}/releases/latest/download/${ASSET_NAME}`;

  function pickSetupAsset(assets) {
    if (!Array.isArray(assets)) return null;
    const exes = assets.filter(
      (a) => /\.exe$/i.test(a.name) && !/blockmap/i.test(a.name)
    );
    return (
      exes.find((a) => /launcher.*setup/i.test(a.name)) ||
      exes.find((a) => a.name === ASSET_NAME) ||
      exes[0] ||
      null
    );
  }

  async function fetchLatestRelease() {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      cache: 'no-store',
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async function resolveLauncherExeUrl() {
    try {
      const data = await fetchLatestRelease();
      const exe = pickSetupAsset(data.assets);
      if (exe?.browser_download_url) return exe.browser_download_url;
    } catch {
      /* fallback abaixo */
    }
    return DIRECT_EXE;
  }

  async function resolveLauncherVersion() {
    try {
      const data = await fetchLatestRelease();
      const tag = String(data.tag_name || data.name || '').replace(/^v/i, '');
      return tag || null;
    } catch {
      return null;
    }
  }

  function applyLauncherUrl(url, version) {
    cfg.links.launcherDownload = url;

    document.querySelectorAll('[data-tgs-launcher-download]').forEach((el) => {
      el.href = url;
      if (version && el.dataset.tgsLauncherShowVersion !== 'false') {
        const label = el.dataset.tgsLauncherLabel || 'Download Launcher';
        el.innerHTML = `<i class="fas fa-download"></i> ${label} v${version}`;
      }
    });

    if (Array.isArray(window.TGS_APPS)) {
      window.TGS_APPS.forEach((app) => {
        if (app.ctaHref && app.ctaHref.includes('TGS-launcher-releases')) {
          app.ctaHref = url;
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', async function () {
    applyLauncherUrl(DIRECT_EXE);
    try {
      const [url, version] = await Promise.all([
        resolveLauncherExeUrl(),
        resolveLauncherVersion(),
      ]);
      applyLauncherUrl(url, version);
    } catch {
      applyLauncherUrl(DIRECT_EXE);
    }
  });

  window.tgsResolveLauncherDownload = resolveLauncherExeUrl;
  window.tgsResolveLauncherVersion = resolveLauncherVersion;
})();
