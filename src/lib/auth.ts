import { createNeonAuth } from '@neondatabase/auth/next/server';

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL || 'https://unconfigured-neon-auth-url.neon.tech',
  logLevel: 'debug',
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET || 'a-very-long-secure-fallback-cookie-secret-key-32-chars-long',
  },
});
