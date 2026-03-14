import { runBatteryCommand } from './commands/battery';
import { runDpiCommand } from './commands/dpi';
import { runPollingCommand } from './commands/polling';
import { createDriver } from './core/driver';
import { normalizeCommandError, normalizeOpenDriverError } from './output/errors';
import { EXIT_CODES } from './output/exit-codes';
import { bunStdoutWriter, writeJson } from './output/json';
import type { CliRuntime } from './types/cli';

const USAGE = 'No command specified. Usage: battery | dpi <1..6|800|1600|2400|3200|5000|22000> | polling <125|250|500|1000>';

export async function runCli(args: string[], runtime: Pick<CliRuntime, 'write'> = { write: bunStdoutWriter }): Promise<number> {
  const command = args[0];

  if (!command) {
    writeJson({ error: USAGE }, runtime.write);
    return EXIT_CODES.NO_COMMAND;
  }

  let driver: ReturnType<typeof createDriver>;

  try {
    driver = createDriver();
  } catch {
    writeJson({ error: 'Device not connected' }, runtime.write);
    return EXIT_CODES.DEVICE_NOT_CONNECTED;
  }

  try {
    await driver.open();
  } catch (error) {
    writeJson({ error: normalizeOpenDriverError(error) }, runtime.write);
    return EXIT_CODES.DRIVER_OPEN_FAILED;
  }

  try {
    if (command === 'battery') {
      return (await runBatteryCommand({ driver, args: args.slice(1), write: runtime.write })).code;
    }

    if (command === 'dpi') {
      return (await runDpiCommand({ driver, args: args.slice(1), write: runtime.write })).code;
    }

    if (command === 'polling') {
      return (await runPollingCommand({ driver, args: args.slice(1), write: runtime.write })).code;
    }

    writeJson({ error: `Unknown command: ${command}` }, runtime.write);
    return EXIT_CODES.UNKNOWN_COMMAND;
  } catch (error) {
    const normalized = normalizeCommandError(error);
    writeJson({ error: normalized.message }, runtime.write);
    return normalized.isTimeout ? EXIT_CODES.TIMEOUT : EXIT_CODES.COMMAND_FAILED;
  } finally {
    try {
      await driver.close?.();
    } catch {
      // Ignore close errors because command result has already been emitted.
    }
  }
}

export async function main(runtime: CliRuntime = { argv: Bun.argv.slice(2), write: bunStdoutWriter }): Promise<number> {
  return runCli(runtime.argv, { write: runtime.write });
}

if (import.meta.main) {
  const code = await main();
  process.exit(code);
}
