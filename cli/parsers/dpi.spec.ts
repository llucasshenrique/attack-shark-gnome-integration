import { describe, expect, test } from 'bun:test';
import { parseDpiInputToStage } from './dpi';

describe('parseDpiInputToStage', () => {
  test('accepts stage format 1..6', () => {
    expect(parseDpiInputToStage('1')).toBe(1);
    expect(parseDpiInputToStage('6')).toBe(6);
  });

  test('accepts legacy stage format 0..5', () => {
    expect(parseDpiInputToStage('0')).toBe(1);
    expect(parseDpiInputToStage('4')).toBe(4);
  });

  test('accepts extension DPI presets', () => {
    expect(parseDpiInputToStage('800')).toBe(1);
    expect(parseDpiInputToStage('1600')).toBe(2);
    expect(parseDpiInputToStage('2400')).toBe(3);
    expect(parseDpiInputToStage('3200')).toBe(4);
    expect(parseDpiInputToStage('5000')).toBe(5);
    expect(parseDpiInputToStage('22000')).toBe(6);
  });

  test('rejects unsupported inputs', () => {
    expect(parseDpiInputToStage('700')).toBeNull();
    expect(parseDpiInputToStage('9999')).toBeNull();
    expect(parseDpiInputToStage('abc')).toBeNull();
  });
});
