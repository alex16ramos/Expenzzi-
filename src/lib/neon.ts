import { headers, cookies } from 'next/headers';
import { NeonPostgrestClient } from '@neondatabase/postgrest-js';
import { auth } from './auth';

/**
 * Validates whether a given string is a correctly formatted JWT token.
 */
function isValidJwt(token: string | undefined): token is string {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  try {
    const headerStr = Buffer.from(parts[0], 'base64url').toString('utf8');
    const header = JSON.parse(headerStr);
    return typeof header === 'object' && header !== null && Boolean(header.alg || header.kid || header.typ === 'JWT');
  } catch {
    return false;
  }
}

/**
 * Returns a Neon PostgREST client configured with the current user's JWT token
 * to enforce Row-Level Security (RLS) policies at the database level.
 */
export async function getDbClient() {
  let token: string | undefined;

  try {
    const reqHeaders = await headers();
    
    // 1. Check if Authorization header was explicitly sent from client
    const authHeader = reqHeaders.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      const candidate = authHeader.substring(7).trim();
      if (isValidJwt(candidate)) {
        token = candidate;
      }
    }

    // 2. Query Neon Auth server session or access token
    if (!token) {
      const authObj = auth as unknown as Record<string, (...args: unknown[]) => unknown>;
      if (typeof authObj.getAccessToken === 'function') {
        try {
          const res = await authObj.getAccessToken();
          const resObj = res as Record<string, unknown> | undefined;
          const dataObj = resObj?.data as Record<string, unknown> | undefined;
          const candidate = (dataObj?.token || dataObj?.accessToken || resObj?.token) as string | undefined;
          if (isValidJwt(candidate)) {
            token = candidate;
          }
        } catch {
          // Ignore
        }
      }
    }

    // 3. Fallback to getSession and refreshToken
    if (!token) {
      let sessionRes = await auth.getSession();
      let sessObj = sessionRes as unknown as Record<string, unknown>;
      let dataObj = sessObj?.data as Record<string, unknown> | undefined;
      let sessionObj = dataObj?.session as Record<string, unknown> | undefined;

      // If session is unauthenticated or missing token, attempt to call refreshToken
      if (!sessionObj && !dataObj?.user) {
        const authObj = auth as unknown as Record<string, (...args: unknown[]) => unknown>;
        if (typeof authObj.refreshToken === 'function') {
          try {
            const refRes = await authObj.refreshToken();
            if (refRes) {
              sessionRes = await auth.getSession();
              sessObj = sessionRes as unknown as Record<string, unknown>;
              dataObj = sessObj?.data as Record<string, unknown> | undefined;
              sessionObj = dataObj?.session as Record<string, unknown> | undefined;
            }
          } catch {
            // Ignore
          }
        }
      }

      const candidates = [
        sessionObj?.token,
        sessionObj?.refreshToken,
        sessionObj?.sessionToken,
        dataObj?.token,
        dataObj?.refreshToken,
        dataObj?.sessionToken,
        sessObj?.token,
        sessObj?.refreshToken,
        sessObj?.jwt,
        sessObj?.rawToken,
        sessObj?.accessToken,
      ];

      for (const cand of candidates) {
        if (typeof cand === 'string' && isValidJwt(cand)) {
          token = cand;
          break;
        }
      }
    }

    // 4. Fallback: inspect request cookies for valid JWT tokens or refresh tokens
    if (!token) {
      const cookieStore = await cookies();
      const allCookies = cookieStore.getAll();
      for (const c of allCookies) {
        if (isValidJwt(c.value)) {
          token = c.value;
          break;
        }
      }
    }
  } catch (err) {
    console.error('[getDbClient auth.getSession Error]', err);
  }

  const clientHeaders: Record<string, string> = {};
  if (token) {
    clientHeaders['Authorization'] = `Bearer ${token}`;
  }

  return new NeonPostgrestClient({
    dataApiUrl: process.env.NEON_DATA_API_URL || '',
    options: {
      global: {
        fetch: globalThis.fetch,
        headers: clientHeaders,
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
  });
}


