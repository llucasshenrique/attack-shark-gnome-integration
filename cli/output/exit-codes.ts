export const EXIT_CODES = {
  SUCCESS: 0,
  NO_COMMAND: 1,
  UNKNOWN_COMMAND: 1,
  DEVICE_NOT_CONNECTED: 2,
  DRIVER_OPEN_FAILED: 3,
  INVALID_ARGS: 4,
  TIMEOUT: 5,
  COMMAND_FAILED: 6,
} as const;

export type ExitCode = (typeof EXIT_CODES)[keyof typeof EXIT_CODES];
