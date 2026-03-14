import type { StageIndex } from 'attack-shark-x11-driver/src';

export const parseDpiInputToStage = (input: string): StageIndex | null => {
  const value = Number.parseInt(input, 10);
  if (Number.isNaN(value)) return null;

  if (value >= 1 && value <= 6) return value as StageIndex;
  if (value >= 0 && value <= 5) return (value + 1) as StageIndex;

  if (value === 800) return 1 as StageIndex;
  if (value === 1600) return 2 as StageIndex;
  if (value === 2400) return 3 as StageIndex;
  if (value === 3200) return 4 as StageIndex;
  if (value === 5000) return 5 as StageIndex;
  if (value === 22000) return 6 as StageIndex;

  return null;
};
