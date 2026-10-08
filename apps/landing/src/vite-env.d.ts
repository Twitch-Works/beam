/// <reference types="vite/client" />

declare module "*.png" {
  const src: string;
  export default src;
}
declare module "*.jpg" {
  const src: string;
  export default src;
}
declare module "*.svg" {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_PLAY_STORE_URL?: string;
  readonly VITE_APP_STORE_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
