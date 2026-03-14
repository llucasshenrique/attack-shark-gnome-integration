import { mock, describe, test, expect, beforeEach, afterEach, vi, spyOn } from 'bun:test';
import { main as cliMain } from '../index';

// Mocks
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
  DpiBuilder: vi.fn((opts: any) => opts),
}));

describe('CLI', () => {
  let originalArgv: string[];
  let outputs: string[] = [];
  const mockStdout = (s: any) => outputs.push(String(s));

  beforeEach(() => {
    originalArgv = process.argv.slice();
    outputs = [];
    // override process.stdout.write
    const originalWrite = process.stdout.write.bind(process.stdout);
    (process.stdout as any).write = (chunk: any) => {
      mockStdout(chunk);
      return true;
    };
    (globalThis as any).__originalStdoutWrite = originalWrite;
    vi.resetAllMocks();
  });

  afterEach(() => {
    process.argv = originalArgv;
    // restore stdout
    if ((globalThis as any).__originalStdoutWrite) {
      (process.stdout as any).write = (globalThis as any).__originalStdoutWrite;
      delete (globalThis as any).__originalStdoutWrite;
    }
  });

  test('battery command prints level', async () => {
    process.argv = ['node', 'index.ts', 'battery'];
    (mockDriver.getBatteryLevel as any).mockResolvedValue(42);
    await cliMain();
    expect(outputs.some(o => o.includes('"level":42'))).toBeTruthy();
  });

  test('dpi invalid stage', async () => {
    process.argv = ['node', 'index.ts', 'dpi', 'abc'];
    await cliMain();
    expect(outputs.some(o => o.includes('DPI stage must be between'))).toBeTruthy();
  });

  test('polling sets rate', async () => {
    process.argv = ['node', 'index.ts', 'polling', '500'];
    await cliMain();
    expect((mockDriver.setPollingRate as any).mock.calls.length).toBe(1);
    expect(outputs.some(o => o.includes('"ok":true'))).toBeTruthy();
  });

  test('handles driver open permission error', async () => {
    process.argv = ['node', 'index.ts', 'battery'];
    (mockDriver.open as any).mockRejectedValue(new Error('LIBUSB_ERROR_ACCESS'));
    await cliMain();
    expect(outputs.some(o => o.includes('Permission denied'))).toBeTruthy();
  });
});
