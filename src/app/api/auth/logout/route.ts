import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const KNOWN_AUTH_COOKIES = [
  '__Secure-neon-auth.session_token',
  '__Secure-neon-auth.local.session_data',
  '__Secure-neon-auth.session_challange',
  'neon-auth.session_token',
  'neon-auth.local.session_data',
  'neon-auth.session_challange',
  'better-auth.session_token',
  '__Secure-better-auth.session_token',
  '__Host-better-auth.session_token',
  'better-auth.session_data',
  '__Secure-better-auth.session_data',
  '__Host-better-auth.session_data',
  'better-auth.dont_remember',
  '__Secure-better-auth.dont_remember',
  'better-auth.state',
  '__Secure-better-auth.state',
  'better-auth.pkce_code_verifier',
  '__Secure-better-auth.pkce_code_verifier',
  'neon_auth_session',
  '__Secure-neon_auth_session',
  'session_token',
  '__Secure-session_token',
  'auth_token',
  '__Secure-auth_token',
];

/**
 * POST /api/auth/logout
 * Deletes all authentication & session cookies on server, response and browser.
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    const response = NextResponse.json({
      success: true,
      message: 'Sesión cerrada correctamente',
    });

    const cookieNamesToClear = new Set<string>();
    for (const c of allCookies) {
      if (c.name) cookieNamesToClear.add(c.name);
    }
    for (const name of KNOWN_AUTH_COOKIES) {
      cookieNamesToClear.add(name);
    }

    const pastDate = 'Thu, 01 Jan 1970 00:00:00 GMT';

    for (const name of cookieNamesToClear) {
      try {
        cookieStore.delete(name);
      } catch {
        // Ignore
      }

      try {
        response.cookies.delete(name);
      } catch {
        // Ignore
      }

      const isSecureCookie = name.startsWith('__Secure-') || name.startsWith('__Host-') || process.env.NODE_ENV === 'production';

      if (isSecureCookie) {
        response.headers.append(
          'Set-Cookie',
          `${name}=; Path=/; Expires=${pastDate}; Max-Age=0; HttpOnly; Secure; SameSite=Lax`
        );
        response.headers.append(
          'Set-Cookie',
          `${name}=; Path=/; Expires=${pastDate}; Max-Age=0; Secure; SameSite=Lax`
        );
      } else {
        response.headers.append(
          'Set-Cookie',
          `${name}=; Path=/; Expires=${pastDate}; Max-Age=0; HttpOnly; SameSite=Lax`
        );
        response.headers.append(
          'Set-Cookie',
          `${name}=; Path=/; Expires=${pastDate}; Max-Age=0; SameSite=Lax`
        );
      }
    }

    return response;
  } catch (err: unknown) {
    console.error('[API /api/auth/logout Error]:', err);
    return NextResponse.json({ error: 'Error al cerrar sesión' }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
