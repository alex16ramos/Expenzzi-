import { createNeonAuth } from '@neondatabase/auth/next/server';

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL || 'http://localhost:3000/api/auth',
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET || 'a-very-long-secure-fallback-cookie-secret-key-32-chars-long',
  },
});
