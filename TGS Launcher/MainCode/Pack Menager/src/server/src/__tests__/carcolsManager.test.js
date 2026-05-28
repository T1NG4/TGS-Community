import { describe, it, expect } from 'vitest';

const { createEmptyCarcolsMeta, addWheelToCarcolsMeta } = require('../carcolsManager');

describe('carcolsManager', () => {
  it('createEmptyCarcolsMeta returns XML with 11 Item entries', () => {
    const xml = createEmptyCarcolsMeta();
    // xml2js may emit self-closing tags like <Item/>; count occurrences of '<Item' prefix
    const count = (xml.match(/<Item\b/g) || []).length;
    expect(count).toBe(11);
  });

  it('addWheelToCarcolsMeta adds wheel entry at correct index', async () => {
    const empty = createEmptyCarcolsMeta();
    const updated = await addWheelToCarcolsMeta(empty, 'MY_WHEEL', 'VWT_SPORT', 0.25);
    expect(updated.includes('wheelName')).toBe(true);
    expect(updated.includes('MY_WHEEL')).toBe(true);

    // Ensure it's placed in first Item (VWT_SPORT)
    const firstItemMatch = updated.match(/<Item>([\s\S]*?)<\/Item>/);
    expect(firstItemMatch).toBeTruthy();
    const firstItemContent = firstItemMatch[1];
    expect(firstItemContent.includes('MY_WHEEL')).toBe(true);
  });

  it('throws on invalid wheel class', async () => {
    const empty = createEmptyCarcolsMeta();
    await expect(addWheelToCarcolsMeta(empty, 'W', 'INVALID_CLASS')).rejects.toThrow();
  });
});
