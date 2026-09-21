export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? null;
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? null;
export const STRIPE_SERVER_ENABLED = Boolean(STRIPE_SECRET_KEY);
export const STRIPE_WEBHOOK_ENABLED = Boolean(STRIPE_WEBHOOK_SECRET);

export const LIVEKIT_URL = process.env.LIVEKIT_URL ?? null;
export const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY ?? null;
export const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET ?? null;
export const LIVEKIT_SERVER_ENABLED = Boolean(LIVEKIT_URL && LIVEKIT_API_KEY && LIVEKIT_API_SECRET);

export const REDIS_URL = process.env.REDIS_URL ?? null;
export const REDIS_ENABLED = Boolean(REDIS_URL);

export const NETLIFY_SITE_NAME = process.env.NETLIFY_SITE_NAME ?? null;
