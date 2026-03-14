import { writeJson } from '../output/json';
import { EXIT_CODES } from '../output/exit-codes';
import type { CommandResult, CliContext } from '../types/cli';

export const runBatteryCommand = async ({ driver, write }: CliContext): Promise<CommandResult> => {
  const level = await driver.getBatteryLevel?.(3000);
  writeJson({ level }, write);

  return { code: EXIT_CODES.SUCCESS };
};
