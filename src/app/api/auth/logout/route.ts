import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const KNOWN_AUTH_COOKIES = [
  'better-auth.session_token',
  'better-auth.session_data',
  'better-auth.dont_remember',
  'better-auth.state',
  'better-auth.pkce_code_verifier',
  'neon_auth_session',
  'session_token',
  'auth_token',
  '__Secure-better-auth.session_token',
  '__Host-better-auth.session_token',
];

/**
 * POST /api/auth/logout
 * Deletes all authentication & session cookies on the server and response.
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
      cookieNamesToClear.add(c.name);
    }
    for (const name of KNOWN_AUTH_COOKIES) {
      cookieNamesToClear.add(name);
    }

    const pastDate = 'Thu, 01 Jan 1970 00:00:00 GMT';

    for (const name of cookieNamesToClear) {
      try {
        cookieStore.delete(name);
      } catch {
        // Ignore errors from deleting non-existent cookies in cookieStore
      }

      // Append multiple Set-Cookie headers directly to headers to avoid map overwriting
      response.headers.append(
        'Set-Cookie',
        `${name}=; Path=/; Expires=${pastDate}; Max-Age=0; HttpOnly; SameSite=Lax`
      );
      response.headers.append(
        'Set-Cookie',
        `${name}=; Path=/; Expires=${pastDate}; Max-Age=0; HttpOnly; Secure; SameSite=Lax`
      );
      response.headers.append(
        'Set-Cookie',
        `${name}=; Path=/; Expires=${pastDate}; Max-Age=0; SameSite=Lax`
      );
      response.headers.append(
        'Set-Cookie',
        `${name}=; Path=/; Expires=${pastDate}; Max-Age=0`
      );
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
