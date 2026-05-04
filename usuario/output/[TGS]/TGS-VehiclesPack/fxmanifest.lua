fx_version 'cerulean'
game 'gta5'
lua54 'on'

author 'FiveM Car Pack Manager'
description 'Custom FiveM vehicle pack'
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
