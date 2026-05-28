fx_version 'cerulean'
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

data_file 'AUDIO_GAMEDATA' 'audioconfig/lg81hcredeye_game.dat'
data_file 'AUDIO_SOUNDDATA' 'audioconfig/lg81hcredeye_sounds.dat'
data_file 'AUDIO_WAVEPACK' 'sfx/dlc_lg81hcredeye'

--dependencies
dependency '/assetpacks'
