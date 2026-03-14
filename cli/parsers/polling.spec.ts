import { describe, expect, test } from 'bun:test';
import { parsePollingRate } from './polling';

describe('parsePollingRate', () => {
  test('accepts known polling rates', () => {
    expect(parsePollingRate('125')).toBeDefined();
    expect(parsePollingRate('250')).toBeDefined();
    expect(parsePollingRate('500')).toBeDefined();
    expect(parsePollingRate('1000')).toBeDefined();
  });

  test('rejects unsupported polling rates', () => {
    expect(parsePollingRate('333')).toBeNull();
    expect(parsePollingRate('abc')).toBeNull();
  });
});
