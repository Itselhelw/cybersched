import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Only runs on client, after hydration — safe to read localStorage
    try {
      const item = window.localStorage.getItem(key);
      if (item) setStoredValue(JSON.parse(item) as T);
    } catch {
      console.warn(`Failed to read "${key}" from localStorage`);
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return; // Don't write until we've read first
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      console.warn(`Failed to save "${key}" to localStorage`);
    }
  }, [key, storedValue, hydrated]);

  return [storedValue, setStoredValue] as const;
}
