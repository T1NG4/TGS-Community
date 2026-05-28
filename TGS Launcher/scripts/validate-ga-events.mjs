#!/usr/bin/env node
/**
 * Valida que cada evento em TGS_EVENTS (tgsSchema.ts) está referenciado nos catálogos.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const schemaPath = path.join(root, 'MainCode/shared/analytics/tgsSchema.ts');
const catalogFiles = [
  'MainCode/Launcher/src/analytics/tgsEvents.ts',
  'MainCode/Launcher/src/analytics/ga4.ts',
  'MainCode/Pack Menager/src/client/src/analytics/tgsEvents.ts',
  'MainCode/Mod Menager/client/tgsEvents.js',
];

const schema = fs.readFileSync(schemaPath, 'utf8');
const entries = [...schema.matchAll(/(\w+):\s*'(tgs_[^']+)'/g)];
const skipKeys = new Set(['SCREEN_VIEW', 'GA_PING']);

const allCatalog = catalogFiles
  .map((rel) => fs.readFileSync(path.join(root, rel), 'utf8'))
  .join('\n');

const missing = [];
for (const [, key, value] of entries) {
  if (skipKeys.has(key)) continue;
  const ref = allCatalog.includes(`'${value}'`) || allCatalog.includes(`TGS_EVENTS.${key}`);
  if (!ref) missing.push(`${key} (${value})`);
}

if (missing.length) {
  console.error('Eventos sem implementação nos catálogos:', missing.join(', '));
  process.exit(1);
}

console.log(`validate-ga-events: OK (${entries.length} entradas no schema)`);
