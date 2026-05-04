'use strict';

const xml2js = require('xml2js');

const parser = new xml2js.Parser({ explicitArray: true, mergeAttrs: false });

/**
 * Parse handling.meta XML → return array of handling entries (one per vehicle).
 */
async function parseHandlingMeta(xmlContent) {
  try {
    const result = await parser.parseStringPromise(xmlContent);
    const rawItems = result?.CHandlingDataMgr?.HandlingData?.[0]?.Item;
    if (!rawItems) return [];

    return rawItems.map((item) => ({
      handlingName: item.handlingName?.[0] ?? '',
      fMass: item.fMass?.[0]?.$.value ?? '1500.000000',
      fInitialDragCoeff: item.fInitialDragCoeff?.[0]?.$.value ?? '8.000000',
      fDriveBiasFront: item.fDriveBiasFront?.[0]?.$.value ?? '0.500000',
      nInitialDriveGears: item.nInitialDriveGears?.[0]?.$.value ?? '6',
      fInitialDriveForce: item.fInitialDriveForce?.[0]?.$.value ?? '0.300000',
      fDriveInertia: item.fDriveInertia?.[0]?.$.value ?? '1.000000',
      fInitialDriveMaxFlatVel: item.fInitialDriveMaxFlatVel?.[0]?.$.value ?? '160.000000',
      fBrakeForce: item.fBrakeForce?.[0]?.$.value ?? '0.800000',
      fBrakeBiasFront: item.fBrakeBiasFront?.[0]?.$.value ?? '0.520000',
      fHandBrakeForce: item.fHandBrakeForce?.[0]?.$.value ?? '0.600000',
      fSteeringLock: item.fSteeringLock?.[0]?.$.value ?? '40.000000',
      fTractionCurveMax: item.fTractionCurveMax?.[0]?.$.value ?? '2.200000',
      fTractionCurveMin: item.fTractionCurveMin?.[0]?.$.value ?? '2.000000',
      fCollisionDamageMult: item.fCollisionDamageMult?.[0]?.$.value ?? '1.000000',
      fEngineDamageMult: item.fEngineDamageMult?.[0]?.$.value ?? '1.500000',
      strModelFlags: item.strModelFlags?.[0] ?? '440010',
      strHandlingFlags: item.strHandlingFlags?.[0] ?? '0',
      AIHandling: item.AIHandling?.[0] ?? 'AVERAGE',
    }));
  } catch (err) {
    console.error('[metaParser] handleing.meta parse error:', err.message);
    return [];
  }
}

/**
 * Parse vehicles.meta XML → return array of vehicle entries.
 */
async function parseVehiclesMeta(xmlContent) {
  try {
    const result = await parser.parseStringPromise(xmlContent);
    const rawItems = result?.CVehicleModelInfo__InitDataList?.InitDatas?.[0]?.Item;
    if (!rawItems) return [];

    return rawItems.map((item) => ({
      modelName: item.modelName?.[0] ?? '',
      audioNameHash: item.audioNameHash?.[0] ?? 'NULL',
      layout: item.layout?.[0] ?? 'LAYOUT_LOW',
      gameName: item.gameName?.[0] ?? '',
      vehicleMakeName: item.vehicleMakeName?.[0] ?? '',
    }));
  } catch (err) {
    console.error('[metaParser] vehicles.meta parse error:', err.message);
    return [];
  }
}

/**
 * Classify a filename into one of our known categories.
 */
function detectFileType(filename) {
  const lower = filename.toLowerCase();
  const ext = lower.split('.').pop() || '';

  console.log('[detectFileType] filename:', filename, 'lower:', lower, 'ext:', ext);

  if (ext === 'yft') return lower.includes('_hi.yft') ? 'model_hd' : 'model';
  if (ext === 'ytd') return 'textures';
  if (ext === 'ydr') return lower.includes('wheel') ? 'wheels' : 'drawable';
  if (ext === 'ycd') return 'animations';
  if (ext === 'ysc') return 'script';
  if (ext === 'ydd') return 'drawable_dict';
  if (lower.includes('handling')) return 'meta_handling';
  if (lower.includes('vehicles') && ext === 'meta') return 'meta_vehicles';
  if (lower.includes('carcols')) return 'meta_carcols';
  if (lower.includes('carvariations')) return 'meta_carvariations';
  if (lower.includes('vehiclelayouts')) return 'meta_layouts';
  if (ext === 'meta') return 'meta_unknown';

  console.log('[detectFileType] returning unknown for:', filename);
  return 'unknown';
}

const FILE_TYPE_LABELS = {
  model: '🚗 Modelo Principal (.yft)',
  model_hd: '🚗 Modelo HD (_hi.yft)',
  textures: '🎨 Texturas (.ytd)',
  drawable: '📦 Drawable (.ydr)',
  wheels: '🛞 Rodas (.ydr)',
  animations: '🎬 Animações (.ycd)',
  script: '📄 Script (.ysc)',
  drawable_dict: '📦 Drawable Dict (.ydd)',
  meta_handling: '⚙️ Handling Meta',
  meta_vehicles: '🚙 Vehicles Meta',
  meta_carcols: '🎨 Carcols Meta',
  meta_carvariations: '🔧 CarVariations Meta',
  meta_layouts: '📐 VehicleLayouts Meta',
  meta_unknown: '📄 Meta (custom)',
  unknown: '❓ Arquivo desconhecido',
};

module.exports = { parseHandlingMeta, parseVehiclesMeta, detectFileType, FILE_TYPE_LABELS };
