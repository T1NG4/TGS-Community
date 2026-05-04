import { useMemo } from 'react';

/** Electron: backend na mesma origem; Vite dev: proxy ou porta 3791 no server */
export function useApiBase(): string {
  return useMemo(
    () =>
      typeof window !== 'undefined' && window.location.port === '5173'
        ? 'http://localhost:3791'
        : '',
    []
  );
}
