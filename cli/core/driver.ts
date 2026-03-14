import { AttackSharkX11, ConnectionMode } from 'attack-shark-x11-driver/src';
import { silentLogger } from '../logger';

export const createDriver = (): InstanceType<typeof AttackSharkX11> => {
  try {
    return new AttackSharkX11({ connectionMode: ConnectionMode.Adapter, logger: silentLogger });
  } catch {
    return new AttackSharkX11({ connectionMode: ConnectionMode.Wired, logger: silentLogger });
  }
};
