import type { AttackSharkX11 } from 'attack-shark-x11-driver/src';

export type CliCommand = 'battery' | 'dpi' | 'polling';

export type CliRuntime = {
  argv: string[];
  write: (line: string) => void;
};

export type CliContext = {
  driver: InstanceType<typeof AttackSharkX11>;
  args: string[];
  write: (line: string) => void;
};

export type CommandResult = {
  code: number;
};
