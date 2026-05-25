/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GA_MEASUREMENT_ID?: string;
  readonly VITE_GA_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
