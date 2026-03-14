export type CliCommand = 'battery' | 'dpi' | 'polling';

export type DriverHandle = {
  open: () => Promise<void>;
  close?: () => Promise<void> | void;
  getBatteryLevel?: (timeoutMs?: number) => Promise<number>;
  setDpi: (dpiBuilder: unknown) => Promise<void>;
  setPollingRate: (rate: unknown) => Promise<void>;
};

export type CliRuntime = {
  argv: string[];
  write: (line: string) => void;
};

export type CliContext = {
  driver: DriverHandle;
  args: string[];
  write: (line: string) => void;
};

export type CommandResult = {
  code: number;
};
