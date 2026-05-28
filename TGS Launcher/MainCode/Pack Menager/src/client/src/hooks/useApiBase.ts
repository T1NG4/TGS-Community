import { useMemo } from 'react';

/** Electron prod: mesma origem; Vite dev: API no Express :3791 */
export function useApiBase(): string {
  return useMemo(() => {
    if (typeof window === 'undefined') return '';
    if (import.meta.env.DEV) return 'http://localhost:3791';
    return '';
  }, []);
}
