import Constants from 'expo-constants';

// ---------------------------------------------------------------------------
// Environment Configuration
// ---------------------------------------------------------------------------
// Reads from EAS build env vars, with fallbacks for local development.
// ---------------------------------------------------------------------------

type AppEnvironment = 'development' | 'preview' | 'production';

interface EnvConfig {
  APP_ENV: AppEnvironment;
  API_URL: string;
  SOCKET_URL: string;
  GOOGLE_MAPS_API_KEY: string;
}

function getEnvConfig(): EnvConfig {
  const extra = Constants.expoConfig?.extra ?? {};
  const manifest = Constants.expoConfig ?? {};

  // EAS build env vars are injected at build time into process.env
  // For local dev, fall back to .env values via extra or hardcoded defaults
  const APP_ENV = (process.env.APP_ENV ||
    extra.APP_ENV ||
    'development') as AppEnvironment;

  const API_URL =
    process.env.API_URL ||
    extra.API_URL ||
    'http://localhost:3001/api/v1';

  const SOCKET_URL =
    process.env.SOCKET_URL ||
    extra.SOCKET_URL ||
    'http://localhost:3001';

  const GOOGLE_MAPS_API_KEY =
    process.env.GOOGLE_MAPS_API_KEY ||
    extra.GOOGLE_MAPS_API_KEY ||
    '';

  return {
    APP_ENV,
    API_URL,
    SOCKET_URL,
    GOOGLE_MAPS_API_KEY,
  };
}

export const env = getEnvConfig();

export const isDev = env.APP_ENV === 'development';
export const isProd = env.APP_ENV === 'production';
export const isPreview = env.APP_ENV === 'preview';
