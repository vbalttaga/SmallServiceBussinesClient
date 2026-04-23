/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_LOG_LEVEL: string;
  readonly VITE_BASE_DOMAIN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
