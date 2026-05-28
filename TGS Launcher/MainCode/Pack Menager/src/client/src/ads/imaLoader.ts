const IMA_SDK_URL = 'https://imasdk.googleapis.com/js/sdkloader/ima3.js';

let loadPromise: Promise<void> | null = null;

export function loadImaScript(): Promise<void> {
  if (typeof window !== 'undefined' && window.google?.ima) {
    return Promise.resolve();
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${IMA_SDK_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('IMA SDK load failed')));
      return;
    }

    const script = document.createElement('script');
    script.src = IMA_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('IMA SDK load failed'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

/** Google sample VAST tag for testing before Ad Manager approval */
export function buildGoogleSampleVastTag(): string {
  const correlator = Date.now();
  const descriptionUrl = encodeURIComponent('https://tgs-pack-manager.local');
  return (
    'https://pubads.g.doubleclick.net/gampad/ads?' +
    'iu=/21775744973/example&' +
    `description_url=${descriptionUrl}&` +
    'tfcd=0&npa=0&ad_type=video&' +
    'sz=640x480&min_ad_duration=0&max_ad_duration=30000&' +
    `gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=${correlator}`
  );
}
