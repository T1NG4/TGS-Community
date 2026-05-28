fx_version 'cerulean'
game 'gta5'
lua54 'on'

author 'FiveM Car Pack Manager'
description 'Custom FiveM sounds pack'
version '1.0.0'

dependency '/assetpacks'

files {
  'audioconfig/*.rel',
  'audioconfig/*.nametable',
  'sfx/**/*.awc',
}

data_file 'AUDIO_GAMEDATA' 'audioconfig/r35sound_game.dat'
data_file 'AUDIO_SOUNDDATA' 'audioconfig/r35sound_sounds.dat'
data_file 'AUDIO_WAVEPACK' 'sfx/dlc_r35sound'
-- add more sounds here
