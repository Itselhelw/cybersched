import { useState, useEffect, useRef } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);
  const lastReadRef = useRef<string | null>(null);

  useEffect(() => {
    // Only runs on client, after hydration — safe to read localStorage
    try {
      const item = window.localStorage.getItem(key);
      lastReadRef.current = item;
      if (item) setStoredValue(JSON.parse(item) as T);
    } catch {
      console.warn(`Failed to read "${key}" from localStorage`);
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return; // Don't write until we've read first
    const serialized = JSON.stringify(storedValue);
    // Only write if the value actually changed from what we last read/wrote
    if (serialized === lastReadRef.current) return;
    try {
      window.localStorage.setItem(key, serialized);
      lastReadRef.current = serialized;
    } catch {
      console.warn(`Failed to save "${key}" to localStorage`);
    }
  }, [key, storedValue, hydrated]);

  return [storedValue, setStoredValue] as const;
}
