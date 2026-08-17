/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API root including `/api`. Production: `https://habify-zw0u.onrender.com/api` */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
