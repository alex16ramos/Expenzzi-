import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

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

    for (const c of allCookies) {
      cookieStore.delete(c.name);

      // Set cookie deletion headers with explicit attributes matching SameSite lax and strict
      response.cookies.set(c.name, '', {
        expires: new Date(0),
        maxAge: 0,
        path: '/',
        sameSite: 'lax',
        httpOnly: true,
      });
      response.cookies.set(c.name, '', {
        expires: new Date(0),
        maxAge: 0,
        path: '/',
        sameSite: 'lax',
        httpOnly: false,
      });
      response.cookies.set(c.name, '', {
        expires: new Date(0),
        maxAge: 0,
        path: '/',
      });
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
