/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DIRECTOR_PASSWORD?: string;
  readonly VITE_ACCOUNTANT_PASSWORD?: string;
  readonly VITE_PRODUCT_OFFICE_PASSWORD?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_MOCK?: string;
  readonly VITE_API_PROXY_TARGET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
