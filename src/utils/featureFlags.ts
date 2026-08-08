export const VITE_STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? null;
export const STRIPE_CLIENT_ENABLED = Boolean(VITE_STRIPE_PUBLISHABLE_KEY);

export const VITE_LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL ?? null;
export const VITE_LIVEKIT_API_KEY = import.meta.env.VITE_LIVEKIT_API_KEY ?? null;
export const LIVEKIT_CLIENT_ENABLED = Boolean(VITE_LIVEKIT_URL && VITE_LIVEKIT_API_KEY);

export const VITE_NETLIFY_SITE_NAME = import.meta.env.VITE_NETLIFY_SITE_NAME ?? null;
export const NETLIFY_SITE_NAME_CLIENT = VITE_NETLIFY_SITE_NAME;

export const VITE_REDIS_URL = import.meta.env.VITE_REDIS_URL ?? null;
export const REDIS_CLIENT_ENABLED = Boolean(VITE_REDIS_URL);
