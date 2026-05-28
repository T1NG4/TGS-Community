import type { Pack } from '../../types';

export type ExportPreviewLine = { label: string; detail?: string };

export function buildExportPreview(pack: Pack | null): ExportPreviewLine[] {
  if (!pack) return [];
  const bracket = `[${pack.name}]`;
  const vehicleCount = pack.brands.reduce((n, b) => n + b.vehicles.length, 0);
  const hasAudio = (pack.audioConfigs?.length ?? 0) > 0;
  const mayHaveWheels =
    (pack.sharedWheelsBrands?.length ?? 0) > 0 ||
    (pack.stagedWheels?.length ?? 0) > 0;

  const lines: ExportPreviewLine[] = [
    { label: bracket, detail: 'Pasta raiz do pack' },
    { label: `${bracket}/pack.content.json` },
    { label: `${bracket}/README.md` },
    {
      label: `${bracket}/${pack.name}-VehiclesPack`,
      detail: `data/*.meta + stream (${vehicleCount} veículo(s) no projeto)`,
    },
  ];

  if (hasAudio) {
    lines.push({
      label: `${bracket}/${pack.name}-SoundsPack`,
      detail: `${pack.audioConfigs?.length ?? 0} config(s) de áudio`,
    });
  } else {
    lines.push({
      label: `${pack.name}-SoundsPack`,
      detail: 'omitido (sem áudio no pack)',
    });
  }

  if (mayHaveWheels) {
    lines.push({
      label: `${bracket}/${pack.name}-WheelsPack`,
      detail: 'se existir staging de rodas no disco',
    });
  } else {
    lines.push({
      label: `${pack.name}-WheelsPack`,
      detail: 'omitido se não houver rodas em staging',
    });
  }

  return lines;
}
