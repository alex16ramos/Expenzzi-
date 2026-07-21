import { NeonPostgrestClient } from '@neondatabase/postgrest-js';
import { auth } from './auth';

/**
 * Returns a Neon PostgREST client configured with the current user's JWT token
 * to enforce Row-Level Security (RLS) policies at the database level.
 */
export async function getDbClient() {
  const session = await auth.getSession();
  const token = (session as { token?: string } | null)?.token;

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return new NeonPostgrestClient({
    dataApiUrl: process.env.NEON_DATA_API_URL || '',
    options: {
      global: {
        fetch: fetch,
        headers,
      },
    },
  });
}

/**
 * Returns an unauthenticated or public Neon PostgREST client.
 */
export function getPublicDbClient() {
  return new NeonPostgrestClient({
    dataApiUrl: process.env.NEON_DATA_API_URL || '',
    options: {
      global: {
        fetch: fetch,
      },
    },
  });
}
