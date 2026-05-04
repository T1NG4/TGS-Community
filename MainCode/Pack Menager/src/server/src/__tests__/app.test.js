import { describe, it, expect } from 'vitest';
import path from 'path';

// Mock the safeJoin function (since it's in app.js)
function safeJoin(basePath, ...parts) {
  const resolved = path.resolve(basePath, ...parts);
  if (!resolved.startsWith(path.resolve(basePath))) {
    throw new Error('Tentativa de path traversal detectada');
  }
  return resolved;
}

describe('safeJoin', () => {
  const basePath = '/safe/base';

  it('joins paths normally', () => {
    expect(safeJoin(basePath, 'subdir', 'file.txt')).toBe(
      path.resolve(basePath, 'subdir', 'file.txt')
    );
  });

  it('prevents path traversal with ..', () => {
    expect(() => safeJoin(basePath, '..', 'outside.txt')).toThrow(
      'Tentativa de path traversal detectada'
    );
  });

  it('prevents path traversal with absolute paths', () => {
    expect(() => safeJoin(basePath, '/absolute/path')).toThrow(
      'Tentativa de path traversal detectada'
    );
  });
});
