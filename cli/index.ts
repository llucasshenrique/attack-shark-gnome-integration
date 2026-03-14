import { type StageIndex, AttackSharkX11, ConnectionMode, Rate, DpiBuilder } from 'attack-shark-x11-driver/src';
import { fileURLToPath } from 'url';

const isBun = typeof (globalThis as any).Bun !== 'undefined' || !!process.env.BUN_ENV;

// Silent logger that writes to stderr for diagnostics so stdout remains clean JSON
const silentLogger = {
  debug: (...args: any[]) => console.error('[debug]', ...args),
  info: (...args: any[]) => console.error('[info]', ...args),
  warn: (...args: any[]) => console.error('[warn]', ...args),
  error: (...args: any[]) => console.error('[error]', ...args),
};

const writeJson = (obj: any) => {
  try {
    process.stdout.write(JSON.stringify(obj) + '\n');
  } catch (e) {
    process.stdout.write(JSON.stringify({ error: 'Internal serialization error' }) + '\n');
  }
};

export async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    writeJson({ error: 'No command specified. Usage: battery | dpi <stage> | polling <rate>' });
    process.exit(1);
  }

  let driver: any;

  try {
    try {
      driver = new AttackSharkX11({ connectionMode: ConnectionMode.Adapter, logger: silentLogger });
    } catch (_e) {
      driver = new AttackSharkX11({ connectionMode: ConnectionMode.Wired, logger: silentLogger });
    }
  } catch (err: any) {
    // Device not found
    writeJson({ error: 'Device not connected' });
    process.exit(2);
  }

  try {
    await driver.open();
  } catch (err: any) {
    const msg = String(err?.message ?? err).toLowerCase();
    if (msg.includes('claim') || msg.includes('libusb_error_access') || msg.includes('permission')) {
      writeJson({ error: 'Permission denied' });
    } else {
      writeJson({ error: String(err?.message ?? 'Failed to open device') });
    }
    process.exit(3);
  }

  try {
    switch (command) {
      case 'battery': {
        const level = await driver.getBatteryLevel?.(3000);
        writeJson({ level });
        break;
      }

      case 'dpi': {
        const stageStr = args[1];
        if (!stageStr) {
          writeJson({ error: 'DPI stage undefined. Usage: dpi <stage>' });
          process.exit(4);
        }
        const stage: StageIndex = parseInt(stageStr, 10) as StageIndex;
        if (isNaN(stage) || stage < 0 || stage > 5) {
          writeJson({ error: 'DPI stage must be between 0 and 5' });
          process.exit(4);
        }
        const dpiBuilder = new DpiBuilder({ activeStage: stage });
        await driver.setDpi(dpiBuilder);
        writeJson({ ok: true });
        break;
      }

      case 'polling': {
        const rateStr = args[1];
        if (!rateStr) {
          writeJson({ error: 'Polling rate undefined. Usage: polling <125|250|500|1000>' });
          process.exit(4);
        }
        const rateNum = parseInt(rateStr, 10);
        let rateEnum: any = null;
        if (rateNum === 125) rateEnum = Rate?.powerSaving;
        else if (rateNum === 250) rateEnum = Rate?.office;
        else if (rateNum === 500) rateEnum = Rate?.gaming;
        else if (rateNum === 1000) rateEnum = Rate?.eSports;
        if (!rateEnum) {
          writeJson({ error: 'Invalid rate. Must be 125, 250, 500, or 1000.' });
          process.exit(4);
        }
        await driver.setPollingRate(rateEnum);
        writeJson({ ok: true });
        break;
      }

      default:
        writeJson({ error: `Unknown command: ${command}` });
        process.exit(1);
    }
  } catch (err: any) {
    const name = err?.name;
    if (name === 'TimeoutError') {
      writeJson({ error: 'Timeout waiting for device response' });
      process.exit(5);
    }
    writeJson({ error: String(err?.message ?? 'Command execution failed') });
    process.exit(6);
  } finally {
    try {
      if (driver && driver.close) await driver.close();
    } catch (_e) {
      // ignore
    }
  }
}

// Execute when run directly
try {
  const entry = fileURLToPath(import.meta.url);
  const invoked = process.argv[1] || '';
  if (invoked === entry || invoked.endsWith('/index.ts') || invoked.endsWith('/index.js')) {
    main().catch(err => {
      writeJson({ error: String(err?.message ?? 'Unhandled exception') });
      process.exit(1);
    });
  }
} catch (e) {
  // ignore
}
