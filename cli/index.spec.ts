import { mock, describe, test, expect, beforeEach, vi } from 'bun:test';
import { runCli } from './index';

const mockDriver = {
  open: vi.fn(),
  close: vi.fn(),
  getBatteryLevel: vi.fn(),
  setDpi: vi.fn(),
  setPollingRate: vi.fn(),
};

mock.module('attack-shark-x11-driver/src', () => ({
  AttackSharkX11: vi.fn(() => mockDriver),
  ConnectionMode: { Adapter: 'adapter', Wired: 'wired' },
  Rate: { powerSaving: 'ps', office: 'office', gaming: 'gaming', eSports: 'esports' },
  DpiBuilder: vi.fn((opts: unknown) => opts),
}));

describe('CLI', () => {
  let outputs: string[] = [];
  const captureWrite = (line: string) => outputs.push(line);

  beforeEach(() => {
    outputs = [];
    vi.resetAllMocks();
  });

  test('battery command prints level', async () => {
    (mockDriver.getBatteryLevel as any).mockResolvedValue(42);
    const code = await runCli(['battery'], { write: captureWrite });
    expect(code).toBe(0);
    expect(outputs.some((o) => o.includes('"level":42'))).toBeTruthy();
  });

  test('dpi invalid input', async () => {
    const code = await runCli(['dpi', 'abc'], { write: captureWrite });
    expect(code).toBe(4);
    expect(outputs.some((o) => o.includes('Invalid DPI input'))).toBeTruthy();
  });

  test('dpi accepts direct dpi value and maps to stage', async () => {
    const code = await runCli(['dpi', '1600'], { write: captureWrite });
    expect(code).toBe(0);
    expect((mockDriver.setDpi as any).mock.calls.length).toBe(1);
    expect(outputs.some((o) => o.includes('"ok":true'))).toBeTruthy();
  });

  test('dpi accepts highest configured value', async () => {
    const code = await runCli(['dpi', '22000'], { write: captureWrite });
    expect(code).toBe(0);
    expect((mockDriver.setDpi as any).mock.calls.length).toBe(1);
    expect(outputs.some((o) => o.includes('"ok":true'))).toBeTruthy();
  });

  test('polling sets rate', async () => {
    const code = await runCli(['polling', '500'], { write: captureWrite });
    expect(code).toBe(0);
    expect((mockDriver.setPollingRate as any).mock.calls.length).toBe(1);
    expect(outputs.some((o) => o.includes('"ok":true'))).toBeTruthy();
  });

  test('polling accepts 250hz', async () => {
    const code = await runCli(['polling', '250'], { write: captureWrite });
    expect(code).toBe(0);
    expect((mockDriver.setPollingRate as any).mock.calls.length).toBe(1);
    expect(outputs.some((o) => o.includes('"ok":true'))).toBeTruthy();
  });

  test('handles driver open permission error', async () => {
    (mockDriver.open as any).mockRejectedValue(new Error('LIBUSB_ERROR_ACCESS'));
    const code = await runCli(['battery'], { write: captureWrite });
    expect(code).toBe(3);
    expect(outputs.some((o) => o.includes('Permission denied'))).toBeTruthy();
  });
});
