'use strict';

const fs = require('fs-extra');
const path = require('path');
const xml2js = require('xml2js');

const parser = new xml2js.Parser({ explicitArray: true, mergeAttrs: false });

async function findVehiclesPackDataDir(packDir) {
  if (!(await fs.pathExists(packDir))) return null;
  const entries = await fs.readdir(packDir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory() && e.name.endsWith('-VehiclesPack')) {
      const d = path.join(packDir, e.name, 'data');
      if (await fs.pathExists(d)) return d;
    }
  }
  return null;
}

function ensureArray(x) {
  if (x == null || x === '') return [];
  return Array.isArray(x) ? x : [x];
}

/** xml2js: filhos únicos podem vir como objeto ou como [objeto] */
function unwrap(prop) {
  if (prop == null) return null;
  return Array.isArray(prop) ? prop[0] : prop;
}

function xmlText(field) {
  if (field == null) return '';
  if (typeof field === 'string') return field.trim();
  if (typeof field === 'number') return String(field);
  if (Array.isArray(field)) return xmlText(field[0]);
  if (typeof field === 'object' && field !== null) {
    if (field._ !== undefined) return String(field._).trim();
    if (field.value !== undefined) return String(field.value).trim();
  }
  return String(field).trim();
}

async function validateXmlStructure(absPath, label) {
  const content = await fs.readFile(absPath, 'utf-8');
  try {
    await parser.parseStringPromise(content);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: `${label}: XML inválido — ${e.message}` };
  }
}

function validateRequiredFieldsForVehicles(parsed) {
  const warnings = [];
  const listRoot = unwrap(parsed?.CVehicleModelInfo__InitDataList);
  const init = unwrap(listRoot?.InitDatas);
  const items = ensureArray(init?.Item);
  items.forEach((item, i) => {
    const modelName = xmlText(item.modelName);
    const handlingId = xmlText(item.handlingId);
    const vehicleMakeName = xmlText(item.vehicleMakeName);
    if (!modelName) warnings.push(`vehicles.meta Item[${i}]: modelName ausente ou vazio`);
    if (!handlingId) warnings.push(`vehicles.meta Item[${i}]: handlingId ausente ou vazio`);
    if (!vehicleMakeName) warnings.push(`vehicles.meta Item[${i}]: vehicleMakeName ausente ou vazio`);
  });
  return warnings;
}

function collectModelNames(parsed) {
  const listRoot = unwrap(parsed?.CVehicleModelInfo__InitDataList);
  const init = unwrap(listRoot?.InitDatas);
  const items = ensureArray(init?.Item);
  return items.map((item) => xmlText(item.modelName).toLowerCase()).filter(Boolean);
}

function collectHandlingIdsFromVehicles(parsed) {
  const listRoot = unwrap(parsed?.CVehicleModelInfo__InitDataList);
  const init = unwrap(listRoot?.InitDatas);
  const items = ensureArray(init?.Item);
  return items.map((item) => xmlText(item.handlingId).toUpperCase()).filter(Boolean);
}

function collectHandlingNames(parsed) {
  const hRoot = unwrap(parsed?.CHandlingDataMgr);
  const hd = unwrap(hRoot?.HandlingData);
  const items = ensureArray(hd?.Item);
  return items.map((item) => xmlText(item.handlingName).toUpperCase()).filter(Boolean);
}

function validateUniqueIds(modelNamesLower) {
  const warnings = [];
  const seen = new Map();
  for (const m of modelNamesLower) {
    seen.set(m, (seen.get(m) || 0) + 1);
  }
  for (const [m, count] of seen.entries()) {
    if (count > 1) warnings.push(`modelName "${m}" duplicado (${count} ocorrências) em vehicles.meta`);
  }
  return warnings;
}

function validateCrossReferences(vehicleHandlingIds, handlingNamesSet) {
  const warnings = [];
  const set = handlingNamesSet instanceof Set ? handlingNamesSet : new Set(handlingNamesSet);
  for (const hid of vehicleHandlingIds) {
    if (!set.has(hid)) {
      warnings.push(`handlingId "${hid}" em vehicles.meta sem entrada correspondente em handling.meta (handlingName)`);
    }
  }
  return warnings;
}

async function validatePackIntegrity(packDir) {
  const warnings = [];
  const errors = [];

  const dataDir = await findVehiclesPackDataDir(packDir);
  if (!dataDir) {
    warnings.push('Pasta data do *-VehiclesPack não encontrada; validação de .meta omitida.');
    return { warnings, errors };
  }

  const candidates = ['handling.meta', 'vehicles.meta', 'carvariations.meta', 'carcols.meta', 'vehiclelayouts.meta'];
  for (const fname of candidates) {
    const fp = path.join(dataDir, fname);
    if (!(await fs.pathExists(fp))) continue;
    const r = await validateXmlStructure(fp, fname);
    if (!r.ok) errors.push(r.message);
  }

  const vehiclesPath = path.join(dataDir, 'vehicles.meta');
  const handlingPath = path.join(dataDir, 'handling.meta');

  let vehiclesParsed;
  let handlingParsed;

  if ((await fs.pathExists(vehiclesPath)) && errors.length === 0) {
    try {
      const raw = await fs.readFile(vehiclesPath, 'utf-8');
      vehiclesParsed = await parser.parseStringPromise(raw);
    } catch (e) {
      errors.push(`vehicles.meta: erro ao interpretar XML — ${e.message}`);
    }
  }

  if ((await fs.pathExists(handlingPath)) && errors.length === 0) {
    try {
      const raw = await fs.readFile(handlingPath, 'utf-8');
      handlingParsed = await parser.parseStringPromise(raw);
    } catch (e) {
      errors.push(`handling.meta: erro ao interpretar XML — ${e.message}`);
    }
  }

  if (errors.length) return { warnings, errors };

  if (vehiclesParsed) {
    warnings.push(...validateRequiredFieldsForVehicles(vehiclesParsed));
    const models = collectModelNames(vehiclesParsed);
    warnings.push(...validateUniqueIds(models));

    const vIds = collectHandlingIdsFromVehicles(vehiclesParsed);
    if (handlingParsed) {
      const hNames = collectHandlingNames(handlingParsed);
      warnings.push(...validateCrossReferences(vIds, new Set(hNames)));
    } else if (vIds.length) {
      warnings.push('vehicles.meta referencia handlingId mas handling.meta está ausente ou vazio.');
    }
  }

  return { warnings, errors };
}

module.exports = {
  validatePackIntegrity,
  validateXmlStructure,
  validateRequiredFields: validateRequiredFieldsForVehicles,
  validateRequiredFieldsForVehicles,
  validateCrossReferences,
  validateUniqueIds,
  findVehiclesPackDataDir,
};
