/**
 * TGS Community — public site configuration.
 * Live stats are fetched automatically — see js/live-stats.js
 */
window.TGS_SITE = {
  name: 'TGS Community',
  tagline: 'Premium FiveM scripts, mods & desktop tools',
  founded: '2023',
  copyrightYear: 2026,

  gaMeasurementId: 'G-DF8MNV3V66',
  gaAppName: 'tgs_community_website',

  /**
   * Master switch de anúncios (site + apps).
   * Fonte principal: config/monetization.json — este valor é fallback offline.
   * false = lançamento / sem ads · true = liga AdSense + gate do Pack Manager.
   */
  adsEnabled: false,

  /**
   * Google AdSense — detalhes quando adsEnabled for true.
   * ads.txt na raiz do site também é obrigatório (ver ads.txt).
   */
  adsense: {
    enabled: true,
    clientId: 'ca-pub-7315528866117152',
    /** true = anúncios automáticos até criar unidades Display com slot ID */
    autoAds: true,
    units: {
      afterHero: {
        slot: '',
        format: 'auto',
        fullWidthResponsive: true,
      },
      catalogMid: {
        slot: '',
        format: 'auto',
        fullWidthResponsive: true,
      },
      preFooter: {
        slot: '',
        format: 'auto',
        fullWidthResponsive: true,
      },
    },
  },

  links: {
    discord: 'https://discord.gg/cYv7W4XCXv',
    github: 'https://github.com/T1NG4',
    tebex: 'https://tgs-mods.tebex.io',
    launcherReleases: 'https://github.com/T1NG4/TGS-launcher-releases/releases/latest',
    launcherAssetName: 'TGS-Launcher-Setup.exe',
    launcherDownloadDirect:
      'https://github.com/T1NG4/TGS-launcher-releases/releases/latest/download/TGS-Launcher-Setup.exe',
    launcherDownload:
      'https://github.com/T1NG4/TGS-launcher-releases/releases/latest/download/TGS-Launcher-Setup.exe',
  },

  /**
   * Where products are actually obtained — site only redirects, no checkout here.
   * Override per product in products.js (purchase.url).
   */
  purchaseChannels: {
    tebex: {
      label: 'Get on Tebex',
      shortLabel: 'Tebex',
      icon: 'fas fa-store',
      url: 'https://tgs-mods.tebex.io',
      priceNote: 'Official TGS store · opens Tebex',
    },
    modManager: {
      label: 'Get in Mod Manager',
      shortLabel: 'Mod Manager',
      icon: 'fas fa-th-large',
      url: '#apps',
      priceNote: 'Catalog & install via TGS Mod Manager',
    },
    discord: {
      label: 'Ask on Discord',
      shortLabel: 'Discord',
      icon: 'fab fa-discord',
      url: 'https://discord.gg/cYv7W4XCXv',
      priceNote: 'Contact support for availability',
    },
  },

  /** Footer — all public community links */
  socialLinks: [
    {
      id: 'discord',
      label: 'Discord',
      url: 'https://discord.gg/cYv7W4XCXv',
      icon: 'fab fa-discord',
      external: true,
    },
    {
      id: 'github',
      label: 'GitHub',
      url: 'https://github.com/T1NG4',
      icon: 'fab fa-github',
      external: true,
    },
    {
      id: 'tebex',
      label: 'Tebex',
      url: 'https://tgs-mods.tebex.io',
      icon: 'fas fa-store',
      external: true,
    },
    {
      id: 'gta5mods',
      label: 'GTA5-Mods.com',
      url: 'https://www.gta5-mods.com/users/TGS%20Community',
      icon: 'fas fa-gamepad',
      external: true,
    },
    {
      id: 'cfx',
      label: 'CFX Forum',
      url: 'https://forum.cfx.re/u/tgs-community/summary',
      icon: 'fas fa-comments',
      external: true,
    },
    {
      id: 'email',
      label: 'tgs.storeoficial@gmail.com',
      url: 'mailto:tgs.storeoficial@gmail.com',
      icon: 'fas fa-envelope',
      external: false,
    },
  ],

  contact: {
    email: 'tgs.storeoficial@gmail.com',
    label: 'TGS Community Support',
  },

  /** Cache live stats in sessionStorage (minutes) */
  statsCacheMinutes: 20,

  /** Optional backup / override — can be updated by CI or manually */
  statsJsonUrl: 'assets/stats.json',

  /**
   * Public stats — values update automatically when possible.
   * source: github_downloads | catalog_products | published_apps | discord_members | github_stars | static
   */
  liveStats: [
    {
      id: 'downloads',
      label: 'Launcher Downloads',
      source: 'github_downloads',
      repo: 'T1NG4/TGS-launcher-releases',
      fallback: '—',
      live: true,
    },
    {
      id: 'products',
      label: 'Products Listed',
      source: 'catalog_products',
      fallback: '4',
      live: true,
    },
    {
      id: 'apps',
      label: 'Desktop Apps',
      source: 'published_apps',
      fallback: '3',
      live: true,
    },
    {
      id: 'members',
      label: 'Discord Members',
      source: 'discord_members',
      invite: 'cYv7W4XCXv',
      fallback: '500+',
      live: true,
    },
  ],

};
