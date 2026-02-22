import { useLocalStorage } from './useLocalStorage';

export interface Settings {
  name: string;
  cigarettesPerDay: number;
  costPerPack: number;
  cigarettesPerPack: number;
  currency: string;
}

export const DEFAULT_SETTINGS: Settings = {
  name: 'Legend',
  cigarettesPerDay: 20,
  costPerPack: 10,
  cigarettesPerPack: 20,
  currency: '$',
};

export function useSettings() {
  return useLocalStorage<Settings>('cybersched-settings', DEFAULT_SETTINGS);
}
