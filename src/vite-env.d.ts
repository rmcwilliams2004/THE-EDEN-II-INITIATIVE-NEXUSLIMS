/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WEATHER_STREAM_URL?: string;
  readonly VITE_NOAA_AUDIO_STREAM_URL?: string;
  readonly GEMINI_API_KEY?: string;
  readonly APP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
