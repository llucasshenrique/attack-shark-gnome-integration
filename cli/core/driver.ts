import { silentLogger } from '../logger';
import type { DriverHandle } from '../types/cli';

export const createDriver = async (): Promise<DriverHandle> => {
  const { AttackSharkX11, ConnectionMode } = await import('attack-shark-x11-driver/src');

  try {
    return new AttackSharkX11({ connectionMode: ConnectionMode.Adapter, logger: silentLogger }) as DriverHandle;
  } catch {
    return new AttackSharkX11({ connectionMode: ConnectionMode.Wired, logger: silentLogger }) as DriverHandle;
  }
};
