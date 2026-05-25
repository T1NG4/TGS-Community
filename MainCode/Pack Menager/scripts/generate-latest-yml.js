'use strict';

/**
 * Gera latest.yml para electron-updater (target portable no Windows).
 * O electron-builder não publica este ficheiro automaticamente com target "portable".
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const RELEASE_DIR = path.join(ROOT, 'release');
const ARTIFACT = 'TGS-Pack-Manager-Portable.exe';

function sha512Base64(filePath) {
  const hash = crypto.createHash('sha512');
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest('base64');
}

function main() {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const version = pkg.version;
  const exePath = path.join(RELEASE_DIR, ARTIFACT);

  if (!fs.existsSync(exePath)) {
    console.error(`[generate-latest-yml] Artefacto não encontrado: ${exePath}`);
    process.exit(1);
  }

  const stat = fs.statSync(exePath);
  const sha512 = sha512Base64(exePath);
  const releaseDate = new Date().toISOString();

  const yml = [
    `version: ${version}`,
    'files:',
    `  - url: ${ARTIFACT}`,
    `    sha512: ${sha512}`,
    `    size: ${stat.size}`,
    `path: ${ARTIFACT}`,
    `sha512: ${sha512}`,
    `releaseDate: '${releaseDate}'`,
    '',
  ].join('\n');

  const outPath = path.join(RELEASE_DIR, 'latest.yml');
  fs.writeFileSync(outPath, yml, 'utf8');
  console.log(`[generate-latest-yml] Escrito ${outPath} (v${version}, ${stat.size} bytes)`);
}

main();
