const writeStderr = (level: string, args: unknown[]): void => {
  Bun.stderr.write(`[${level}] ${args.map(String).join(' ')}\n`);
};

// Silent logger keeps stdout reserved for JSON responses.
export const silentLogger = {
  debug: (...args: unknown[]) => writeStderr('debug', args),
  info: (...args: unknown[]) => writeStderr('info', args),
  warn: (...args: unknown[]) => writeStderr('warn', args),
  error: (...args: unknown[]) => writeStderr('error', args),
};
