import { parsePollingRate } from '../parsers/polling';
import { writeJson } from '../output/json';
import { EXIT_CODES } from '../output/exit-codes';
import type { CommandResult, CliContext } from '../types/cli';

export const runPollingCommand = async ({ driver, args, write }: CliContext): Promise<CommandResult> => {
  const rateInput = args[0];
  if (!rateInput) {
    writeJson({ error: 'Polling rate undefined. Usage: polling <125|250|500|1000>' }, write);
    return { code: EXIT_CODES.INVALID_ARGS };
  }

  const rate = parsePollingRate(rateInput);
  if (!rate) {
    writeJson({ error: 'Invalid rate. Must be 125, 250, 500, or 1000.' }, write);
    return { code: EXIT_CODES.INVALID_ARGS };
  }

  await driver.setPollingRate(rate);
  writeJson({ ok: true }, write);

  return { code: EXIT_CODES.SUCCESS };
};
