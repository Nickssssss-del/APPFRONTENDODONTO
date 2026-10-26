/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** "true" solo cuando android/app/google-services.json exista (Firebase Cloud Messaging). */
  readonly VITE_PUSH_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
