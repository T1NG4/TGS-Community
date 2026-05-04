import { describe, it, expect } from 'vitest';
import { detectFileType } from '../metaParser.js';

describe('detectFileType', () => {
  it('detects .yft files as model', () => {
    expect(detectFileType('modelo.yft')).toBe('model');
  });

  it('detects _hi.yft files as model_hd', () => {
    expect(detectFileType('modelo_hi.yft')).toBe('model_hd');
  });

  it('detects .ytd files as textures', () => {
    expect(detectFileType('texturas.ytd')).toBe('textures');
  });

  it('detects wheel .ydr files as wheels', () => {
    expect(detectFileType('roda_wheel.ydr')).toBe('wheels');
  });

  it('detects handling.meta as meta_handling', () => {
    expect(detectFileType('handling.meta')).toBe('meta_handling');
  });

  it('detects vehicles.meta as meta_vehicles', () => {
    expect(detectFileType('vehicles.meta')).toBe('meta_vehicles');
  });

  it('returns unknown for unrecognized files', () => {
    expect(detectFileType('unknown.txt')).toBe('unknown');
  });
});
