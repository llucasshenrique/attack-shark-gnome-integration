import { Rate } from 'attack-shark-x11-driver/src';

export const parsePollingRate = (input: string): typeof Rate[keyof typeof Rate] | null => {
  const value = Number.parseInt(input, 10);

  if (value === 125) return Rate.powerSaving;
  if (value === 250) return Rate.office;
  if (value === 500) return Rate.gaming;
  if (value === 1000) return Rate.eSports;

  return null;
};
