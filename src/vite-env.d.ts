/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API root including `/api`. Local: `/api`. Production: `https://your-api.onrender.com/api` */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
