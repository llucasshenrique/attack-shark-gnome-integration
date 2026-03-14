export type PollingRateInput = 125 | 250 | 500 | 1000;

export const parsePollingRate = (input: string): PollingRateInput | null => {
  const value = Number.parseInt(input, 10);

  if (value === 125 || value === 250 || value === 500 || value === 1000) {
    return value;
  }

  return null;
};
