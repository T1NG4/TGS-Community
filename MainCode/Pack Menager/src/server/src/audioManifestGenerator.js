const path = require('path');

/**
 * Generate optimized fxmanifest.lua for audio configurations
 * Uses glob patterns instead of listing individual files
 */
function generateFxmanifest(audioConfigs) {
  let manifest = `fx_version 'cerulean'
game 'gta5'
lua54 'on'

author 'FiveM Car Pack Manager'
description 'Custom FiveM sounds pack'
version '1.0.0'

files {
	"audioconfig/*.dat151.rel",
	"audioconfig/*.dat54.rel",
	"audioconfig/*.dat10.rel",
	"sfx/**/*.awc"
}

`;

  // Add data_file entries for each audio config
  audioConfigs.forEach(audio => {
    const audioName = audio.name;
    
    // AUDIO_GAMEDATA
    if (audio.gameRel) {
      manifest += `data_file 'AUDIO_GAMEDATA' 'audioconfig/${audioName}_game.dat'\n`;
    }
    
    // AUDIO_SOUNDDATA
    if (audio.soundsRel) {
      manifest += `data_file 'AUDIO_SOUNDDATA' 'audioconfig/${audioName}_sounds.dat'\n`;
    }
    
    // AUDIO_SYNTHDATA (AMP)
    if (audio.ampRel) {
      manifest += `data_file 'AUDIO_SYNTHDATA' 'audioconfig/${audioName}_amp.dat'\n`;
    }
    
    // AUDIO_WAVEPACK
    manifest += `data_file 'AUDIO_WAVEPACK' 'sfx/dlc_${audioName}'\n`;
  });

  manifest += `\n--dependencies\ndependency '/assetpacks'\n`;

  return manifest;
}

/**
 * Generate optimized __resource.lua for audio configurations
 * Uses glob patterns instead of listing individual files
 */
function generateResourceManifest(audioConfigs) {
  let manifest = `resource_manifest_version "44febabe-d386-4d18-afbe-5e627f4af937"

files {
`;

  // Add audioconfig files using glob patterns
  manifest += `  'audioconfig/*.rel',
  'audioconfig/*.nametable',
`;

  // Add sfx files using glob patterns
  manifest += `  'sfx/**/*.awc',
`;

  manifest += `}

`;

  // Add data_file entries for each audio config
  audioConfigs.forEach(audio => {
    const audioName = audio.name;
    
    // AUDIO_GAMEDATA
    if (audio.gameRel) {
      manifest += `data_file 'AUDIO_GAMEDATA' 'audioconfig/${audioName}_game.dat'\n`;
    }
    
    // AUDIO_SOUNDDATA
    if (audio.soundsRel) {
      manifest += `data_file 'AUDIO_SOUNDDATA' 'audioconfig/${audioName}_sounds.dat'\n`;
    }
    
    // AUDIO_SYNTHDATA (AMP)
    if (audio.ampRel) {
      manifest += `data_file 'AUDIO_SYNTHDATA' 'audioconfig/${audioName}_amp.dat'\n`;
    }
    
    // AUDIO_WAVEPACK
    if (audio.awcFiles.length > 0) {
      manifest += `data_file 'AUDIO_WAVEPACK' 'sfx/dlc_${audioName}'\n`;
    }
  });

  return manifest;
}

/**
 * Generate .dat files from .rel files
 * This is a placeholder - in a real implementation, you would need
 * to use specialized tools to convert .rel to .dat format
 */
async function generateDatFiles(audioDir, audioName) {
  // Placeholder for .dat file generation
  // In a real implementation, this would use GTA V audio tools
  // For now, we'll just copy the .rel files and let the game handle it
  return true;
}

module.exports = {
  generateFxmanifest,
  generateResourceManifest,
  generateDatFiles,
};
