const fs = require('fs-extra');
const path = require('path');
const xml2js = require('xml2js');
const { generateFxmanifest } = require('./audioManifestGenerator');
const { validatePackIntegrity } = require('./validator');

const parser = new xml2js.Parser({ explicitArray: true });

async function generatePack(data, outputPath, baseTemplatePath, stagingPath) {
  const packNameWithBrackets = `[${data.name}]`;
  const packDir = path.join(outputPath, packNameWithBrackets);
  
  const vehiclesPackDir = path.join(packDir, `${data.name}-VehiclesPack`);
  const soundsPackDir = path.join(packDir, `${data.name}-SoundsPack`);
  const wheelsPackDir = path.join(packDir, `${data.name}-WheelsPack`);

  const metaOverrides = data.metaOverrides || { vehicles: {}, sharedWheels: {} };

  // Clean start
  if (await fs.pathExists(packDir)) {
    await fs.remove(packDir);
  }
  await fs.ensureDir(packDir);

  // 1. Create Resource Folders
  await fs.ensureDir(vehiclesPackDir);
  await fs.ensureDir(soundsPackDir);
  await fs.ensureDir(wheelsPackDir);

  // 2. Generate VehiclesPack
  await generateVehiclesPack(data, vehiclesPackDir, baseTemplatePath, stagingPath, metaOverrides);

  // 3. Generate SoundsPack (only if audios exist)
  const hasAudio = (data.audioConfigs && data.audioConfigs.length > 0);
  if (hasAudio) {
    await generateSoundsPack(data, soundsPackDir, baseTemplatePath, stagingPath);
  } else {
    await fs.remove(soundsPackDir);
  }

  // 4. Generate WheelsPack (only if wheels exist in staging)
  const wheelsStaged = await generateWheelsPack(data, wheelsPackDir, baseTemplatePath, stagingPath, metaOverrides);
  if (!wheelsStaged) {
    await fs.remove(wheelsPackDir);
  }

  // 5. Generate content manifest
  await fs.writeJson(path.join(packDir, 'pack.content.json'), data, { spaces: 2 });

  // 6. Generate README.md
  await generatePackReadme(data, packDir);

  const integrity = await validatePackIntegrity(packDir);
  if (integrity.errors.length > 0) {
    throw new Error(integrity.errors.join('\n'));
  }

  return { path: packDir, warnings: integrity.warnings };
}

async function generatePackReadme(data, packDir) {
  let content = `# ${data.name}\n\n`;
  content += `${data.description || 'Gerado por FiveM Car Pack Manager'}\n\n`;
  
  content += `## Recursos Incluídos\n`;
  content += `- **${data.name}-VehiclesPack**: Veículos e configurações (.meta)\n`;
  content += `- **${data.name}-SoundsPack**: Sons de motores customizados\n`;
  content += `- **${data.name}-WheelsPack**: Rodas customizadas e scripts de suporte\n\n`;
  
  content += `## Lista de Veículos\n`;
  for (const brand of data.brands || []) {
    content += `### ${brand.name.toUpperCase()}\n`;
    for (const v of brand.vehicles || []) {
      content += `- **${v.name}** (\`${v.model}\`)\n`;
    }
    content += '\n';
  }
  
  content += `\n---\n*Gerado automaticamente em ${new Date().toLocaleDateString()}*`;
  
  await fs.writeFile(path.join(packDir, 'README.md'), content);
}


// ─── Sub-Generators ──────────────────────────────────────────────────────────

async function generateVehiclesPack(data, packDir, baseTemplatePath, stagingPath, metaOverrides) {
  const dataDir = path.join(packDir, 'data');
  const streamDir = path.join(packDir, 'stream');
  await fs.ensureDir(dataDir);
  await fs.ensureDir(streamDir);

  // STEP 1: Copy template data directory first (base template is the source of truth)
  const templateDataDir = path.join(baseTemplatePath, 'TGS-VehiclesPack', 'data');
  console.log('[Generator] Template data dir:', templateDataDir);
  console.log('[Generator] Template exists:', await fs.pathExists(templateDataDir));
  if (await fs.pathExists(templateDataDir)) {
    await fs.copy(templateDataDir, dataDir, { overwrite: true });
    console.log('[Generator] Template copied to:', dataDir);
  } else {
    console.log('[Generator] Template data dir NOT FOUND, skipping copy');
  }

  // Generate fxmanifest.lua
  const manifestContent = generateVehiclesFxmanifest(data);
  await fs.writeFile(path.join(packDir, 'fxmanifest.lua'), manifestContent);

  // STEP 2: Consolidate Meta Files (merge on top of copied template)
  await consolidateAllMetaFiles(data, dataDir, stagingPath, metaOverrides);

  // Copy Stream Files
  for (const brand of data.brands || []) {
    const brandName = brand.name.toUpperCase();
    for (const vehicle of brand.vehicles) {
      const vehicleModel = vehicle.model.toLowerCase();
      const vehicleStreamDir = path.join(streamDir, brandName, vehicleModel);
      await fs.ensureDir(vehicleStreamDir);
      
      const packId = data.id || data.name;
      const vehicleStagingDir = path.join(stagingPath, packId, brandName, vehicleModel);
      
      if (await fs.pathExists(vehicleStagingDir)) {
        const items = await fs.readdir(vehicleStagingDir, { withFileTypes: true });
        for (const item of items) {
          if (item.isFile()) {
            await fs.copy(path.join(vehicleStagingDir, item.name), path.join(vehicleStreamDir, item.name.toLowerCase()));
          }
        }
        
        const tuningStaging = path.join(vehicleStagingDir, 'Tuning');
        if (await fs.pathExists(tuningStaging)) {
          const tuningDest = path.join(vehicleStreamDir, 'Tuning');
          await fs.ensureDir(tuningDest);
          const tuningItems = await fs.readdir(tuningStaging);
          for (const t of tuningItems) {
            await fs.copy(path.join(tuningStaging, t), path.join(tuningDest, t.toLowerCase()));
          }
        }
      }
    }
  }
}

async function generateSoundsPack(data, packDir, baseTemplatePath, stagingPath) {
  const audioConfigDir = path.join(packDir, 'audioconfig');
  const sfxDir = path.join(packDir, 'sfx');
  await fs.ensureDir(audioConfigDir);
  await fs.ensureDir(sfxDir);

  const packId = data.id || data.name;
  const sharedStagingDir = path.join(stagingPath, packId, 'shared');
  const audioStagingDir = path.join(sharedStagingDir, 'audio');

  if (await fs.pathExists(audioStagingDir)) {
    // Copy audioconfig directory
    const audioconfigStagingDir = path.join(audioStagingDir, 'audioconfig');
    if (await fs.pathExists(audioconfigStagingDir)) {
      await fs.copy(audioconfigStagingDir, audioConfigDir);
    }
    
    // Copy sfx directory
    const sfxStagingDir = path.join(audioStagingDir, 'sfx');
    if (await fs.pathExists(sfxStagingDir)) {
      await fs.copy(sfxStagingDir, sfxDir);
    }
  }

  // Generate fxmanifest
  const manifestContent = generateFxmanifest(data.audioConfigs || []);
  await fs.writeFile(path.join(packDir, 'fxmanifest.lua'), manifestContent);
}

function generateVehiclesFxmanifest(data) {
  return `fx_version 'cerulean'
game 'gta5'
lua54 'on'

author 'FiveM Car Pack Manager'
description '${data.description || 'Custom FiveM vehicle pack'}'
version '1.0.0'

files {
    '**.meta',
}

-- Vehicle metadata files
data_file 'HANDLING_FILE' '**/*handling.meta'
data_file 'VEHICLE_LAYOUTS_FILE' '**/*vehiclelayouts.meta'
data_file 'VEHICLE_METADATA_FILE' '**/*vehicles.meta'
data_file 'CARCOLS_FILE' 'data/**/**/*carcols.meta'
data_file 'VEHICLE_VARIATION_FILE' '**/*carvariations.meta'
data_file 'CARCONTENTUNLOCKS_FILE' '**/*contentunlocks.meta'
data_file 'WEAPONINFO_FILE' '**/*vehicleweapons.meta'
data_file 'WEAPONINFO_FLARE_FILE' '**/*vehicleweapons_flare.meta'
data_file 'EXPLOSION_INFO_FILE' '**/*explosion.meta'
data_file 'WEAPON_METADATA_FILE' '**/*weaponarchetypes.meta'
data_file 'AMBIENT_VEHICLE_MODEL_SET_FILE' '**/*vehiclemodelsets.meta'

--dependencies
dependency '/assetpacks'
`;
}

async function generateWheelsPack(data, packDir, baseTemplatePath, stagingPath, metaOverrides) {
  const dataDir = path.join(packDir, 'data');
  const streamDir = path.join(packDir, 'stream');
  const clientDir = path.join(packDir, 'client');
  await fs.ensureDir(dataDir);
  await fs.ensureDir(streamDir);
  await fs.ensureDir(clientDir);

  const packId = data.id || data.name;
  const sharedStagingDir = path.join(stagingPath, packId, 'shared');
  const wheelsStagingDir = path.join(sharedStagingDir, 'wheels');

  if (!(await fs.pathExists(wheelsStagingDir))) return false;

  // 1. Copy Wheel Files (flat structure in stream)
  const wheelsStreamStaging = path.join(wheelsStagingDir, 'stream');
  let hasWheels = false;
  if (await fs.pathExists(wheelsStreamStaging)) {
    const brandDirs = await fs.readdir(wheelsStreamStaging, { withFileTypes: true });
    for (const brandDir of brandDirs) {
      if (brandDir.isDirectory()) {
        const wheelFiles = await fs.readdir(path.join(wheelsStreamStaging, brandDir.name));
        for (const wheelFile of wheelFiles) {
          hasWheels = true;
          await fs.copy(
            path.join(wheelsStreamStaging, brandDir.name, wheelFile),
            path.join(streamDir, wheelFile.toLowerCase())
          );
        }
      }
    }
  }

  if (!hasWheels) return false;

  // 2. Generate carcols.meta for wheels
  const carcolsDestPath = path.join(dataDir, 'carcols.meta');
  if (metaOverrides.sharedWheels?.carcols) {
    await fs.writeFile(carcolsDestPath, metaOverrides.sharedWheels.carcols, 'utf-8');
  } else {
    await generateCarcolsMetaFromStaging(stagingPath, packId, carcolsDestPath);
  }

  // 3. Generate contentunlocks.meta
  const contentUnlocksContent = `<?xml version="1.0" encoding="UTF-8"?>\n<SContentUnlocks>\n  <listOfUnlocks />\n</SContentUnlocks>`;
  await fs.writeFile(path.join(dataDir, 'contentunlocks.meta'), contentUnlocksContent);

  // 4. Generate client/tuning.lua (AddTextEntry)
  const carcolsContent = await fs.readFile(carcolsDestPath, 'utf-8');
  await generateWheelsTuningLua(carcolsContent, path.join(clientDir, 'tuning.lua'));

  // 5. Generate fxmanifest.lua
  const manifestContent = generateWheelsFxmanifest(data);
  await fs.writeFile(path.join(packDir, 'fxmanifest.lua'), manifestContent);

  return true;
}

function generateWheelsFxmanifest(data) {
  return `fx_version 'cerulean'
game 'gta5'
lua54 'on'

author 'FiveM Car Pack Manager'
description 'Custom FiveM wheels pack'
version '1.0.0'

files {
    'data/carcols.meta',
    'data/contentunlocks.meta'
}

client_script 'client/tuning.lua'

data_file 'CARCOLS_FILE' 'data/carcols.meta'
data_file 'CONTENT_UNLOCKING_META_FILE' 'data/contentunlocks.meta'
`;
}

async function generateCarcolsMetaFromStaging(stagingPath, packId, destPath) {
  const carcolsStagingPath = path.join(stagingPath, packId, 'shared', 'wheels', 'data', 'carcols.meta');
  if (await fs.pathExists(carcolsStagingPath)) {
    await fs.copy(carcolsStagingPath, destPath);
  } else {
    try {
      const { createEmptyCarcolsMeta } = require('./carcolsManager');
      const template = createEmptyCarcolsMeta();
      await fs.writeFile(destPath, template, 'utf-8');
    } catch (err) {
      const template = `<?xml version="1.0" encoding="UTF-8"?>\n<CVehicleModelInfoVarGlobal>\n  <Wheels>\n${Array.from({ length: 11 }).map(() => '    <Item>\n    </Item>').join('\n')}\n  </Wheels>\n</CVehicleModelInfoVarGlobal>`;
      await fs.writeFile(destPath, template, 'utf-8');
    }
  }
}

async function generateWheelsTuningLua(carcolsContent, destPath) {
  try {
    const data = await parser.parseStringPromise(carcolsContent);
    let luaContent = 'Citizen.CreateThread(function()\n';
    
    const wheelsRoot = data?.CVehicleModelInfoVarGlobal?.Wheels?.[0];
    if (wheelsRoot && wheelsRoot.Item) {
      for (const classItem of wheelsRoot.Item) {
        if (classItem.Item) {
          for (const wheel of classItem.Item) {
            const wheelName = typeof wheel === 'string' ? null : wheel.wheelName?.[0];
            const label = typeof wheel === 'string' ? null : (wheel.modShopLabel?.[0] || wheelName);
            if (wheelName && label) {
              luaContent += `    AddTextEntry("${wheelName.toUpperCase()}", "${label}")\n`;
            }
          }
        }
      }
    }
    
    luaContent += 'end)\n';
    await fs.writeFile(destPath, luaContent);
  } catch (err) {
    console.error('[Generator] Error generating tuning.lua:', err.message);
    await fs.writeFile(destPath, '-- Error generating tuning labels\n');
  }
}

async function consolidateAllMetaFiles(data, dataDir, stagingPath, metaOverrides) {
  const packId = data.id || data.name;

  // Process meta files
  const metaJobs = [
    { filename: 'handling.meta', container: 'HandlingData' },
    { filename: 'vehicles.meta', container: 'InitDatas' },
    { filename: 'carvariations.meta', container: 'variationData' },
    { filename: 'vehiclelayouts.meta', container: 'layouts' },
    { filename: 'carcols.meta', container: 'Kits' },
  ];

  const brands = data.brands || [];

  for (const job of metaJobs) {
    const destPath = path.join(dataDir, job.filename);

    // Skip if the template doesn't have this file
    if (!(await fs.pathExists(destPath))) {
      continue;
    }

    // Start with the template content (already copied)
    let finalContent = await fs.readFile(destPath, 'utf-8');
    let hasStagingContent = false;

    const replaceMode = job.filename !== 'carcols.meta';
    const containerAccum = {};
    if (replaceMode) {
      containerAccum[job.container] = '';
      if (job.filename === 'vehicles.meta') {
        containerAccum.txdRelationships = '';
      }
    }

    for (const brand of brands) {
      const brandName = brand.name.toUpperCase();
      for (const vehicle of brand.vehicles) {
        const vehicleModel = vehicle.model.toLowerCase();
        const stagingFile = path.join(stagingPath, packId, brandName, vehicleModel, 'meta', job.filename);

        if (await fs.pathExists(stagingFile)) {
          const content = await fs.readFile(stagingFile, 'utf-8');
          hasStagingContent = true;

          console.log(`[Generator] Processing ${job.filename} for ${brandName}/${vehicleModel}`);

          // Merge staging content into the template base
          if (job.filename === 'carcols.meta') {
            finalContent = mergeTagContent(finalContent, content, 'Kits');
            finalContent = mergeTagContent(finalContent, content, 'Lights');
          } else if (replaceMode) {
            if (job.filename === 'vehicles.meta') {
              const initDatasItems = extractTagInnerXml(content, 'InitDatas');
              const txdItems = extractTagInnerXml(content, 'txdRelationships');
              if (initDatasItems) {
                containerAccum.InitDatas += (containerAccum.InitDatas ? '\n' : '') + initDatasItems;
                console.log(`[Generator] Added InitDatas for ${vehicleModel}`);
              }
              if (txdItems) {
                containerAccum.txdRelationships += (containerAccum.txdRelationships ? '\n' : '') + txdItems;
                console.log(`[Generator] Added txdRelationships for ${vehicleModel}`);
              }
            } else {
              const items = extractTagInnerXml(content, job.container);
              if (items) {
                containerAccum[job.container] += (containerAccum[job.container] ? '\n' : '') + items;
                console.log(`[Generator] Added ${job.container} items for ${vehicleModel}`);
              }
            }
          }
        }
      }
    }

    // Always write back if we had staging content to merge
    // OR if we have meta overrides that need to be applied
    const hasOverrides = metaOverrides?.vehicles?.[job.filename];
    if (hasStagingContent || hasOverrides) {
      if (replaceMode) {
        if (job.filename === 'vehicles.meta') {
          if (containerAccum.InitDatas) {
            finalContent = setTagInnerXml(finalContent, 'InitDatas', containerAccum.InitDatas);
            console.log(`[Generator] Updated InitDatas in ${job.filename}`);
          }
          if (containerAccum.txdRelationships) {
            finalContent = setTagInnerXml(finalContent, 'txdRelationships', containerAccum.txdRelationships);
            console.log(`[Generator] Updated txdRelationships in ${job.filename}`);
          }
        } else if (containerAccum[job.container]) {
          finalContent = setTagInnerXml(finalContent, job.container, containerAccum[job.container]);
          console.log(`[Generator] Updated ${job.container} in ${job.filename}`);
        }
      }

      // Apply meta overrides if present
      if (hasOverrides) {
        finalContent = metaOverrides.vehicles[job.filename];
        console.log(`[Generator] Applied meta override for ${job.filename}`);
      }

      // Clean up potential double line breaks from merging
      finalContent = finalContent.replace(/\n\s*\n\s*\n/g, '\n\n');
      await fs.writeFile(destPath, finalContent, 'utf-8');
      console.log(`[Generator] Successfully updated ${job.filename}`);
    } else {
      console.log(`[Generator] No staging content or overrides for ${job.filename}, keeping template`);
    }
  }
}

function mergeTagContent(baseXml, newXml, tagName) {
  // Regex to find the content inside the specified tag
  const tagRegex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const baseMatch = baseXml.match(tagRegex);
  const newMatch = newXml.match(tagRegex);

  if (baseMatch && newMatch) {
    const newItems = newMatch[1].trim();
    if (newItems) {
      // Find the last occurrence of the closing tag in baseXml to append inside it
      const closingTag = `</${tagName}>`;
      const lastIndex = baseXml.lastIndexOf(closingTag);
      if (lastIndex !== -1) {
        return baseXml.substring(0, lastIndex) + `\n    ${newItems}\n  ` + baseXml.substring(lastIndex);
      }
    }
  }
  return baseXml;
}

function extractTagInnerXml(xml, tagName) {
  const tagRegex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(tagRegex);
  if (!match) return '';
  return (match[1] || '').trim();
}

function setTagInnerXml(baseXml, tagName, innerXml) {
  const tagRegex = new RegExp(`(<${tagName}>)([\\s\\S]*?)(<\\/${tagName}>)`, 'i');
  const match = baseXml.match(tagRegex);
  if (!match) return baseXml;

  const opening = match[1];
  const closing = match[3];
  const replacement = `${opening}\n${innerXml}\n${closing}`;
  return baseXml.replace(tagRegex, replacement);
}

module.exports = { generatePack };
