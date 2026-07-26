import { createNeonAuth } from '@neondatabase/auth/next/server';

const secret = process.env.NEON_AUTH_COOKIE_SECRET || (process.env.NODE_ENV === 'development' ? 'a-very-long-secure-fallback-cookie-secret-key-32-chars-long' : '');

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL || 'http://localhost:3000',
  logLevel: 'debug',
  cookies: {
    secret: secret || 'a-very-long-secure-fallback-cookie-secret-key-32-chars-long',
  },
});
