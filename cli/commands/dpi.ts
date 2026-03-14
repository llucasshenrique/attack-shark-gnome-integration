import { DpiBuilder } from 'attack-shark-x11-driver/src';
import { parseDpiInputToStage } from '../parsers/dpi';
import { writeJson } from '../output/json';
import { EXIT_CODES } from '../output/exit-codes';
import type { CommandResult, CliContext } from '../types/cli';

export const runDpiCommand = async ({ driver, args, write }: CliContext): Promise<CommandResult> => {
  const dpiOrStage = args[0];
  if (!dpiOrStage) {
    writeJson({ error: 'DPI value/stage undefined. Usage: dpi <1..6|800|1600|2400|3200|5000|22000>' }, write);
    return { code: EXIT_CODES.INVALID_ARGS };
  }

  const stage = parseDpiInputToStage(dpiOrStage);
  if (stage === null) {
    writeJson({ error: 'Invalid DPI input. Use stage 1..6 or DPI 800/1600/2400/3200/5000/22000' }, write);
    return { code: EXIT_CODES.INVALID_ARGS };
  }

  const dpiBuilder = new DpiBuilder({ activeStage: stage });
  await driver.setDpi(dpiBuilder);
  writeJson({ ok: true }, write);

  return { code: EXIT_CODES.SUCCESS };
};
