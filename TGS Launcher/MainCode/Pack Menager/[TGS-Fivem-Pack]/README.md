# Template base do Pack Manager

Esta pasta **não** inclui modelos 3D, sons ou rodas de exemplo.

O utilizador final recebe apenas:

- `TGS-VehiclesPack/data/*.meta` — estrutura XML vazia para o gerador
- `fxmanifest.lua` de referência por sub-pack
- `TGS-WheelsPack` — meta + `client/tuning.lua` (sem `stream/`)

Veículos, `stream/` (`.yft`/`.ytd`), áudio e rodas entram no pack **exportado** via upload/staging na app, não via este template.
