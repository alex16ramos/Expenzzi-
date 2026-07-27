import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/usuarios/buscar
 * Searches for users by email or username to send friend requests.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';

    const session = await auth.getSession();
    const sessObj = session as unknown as Record<string, unknown>;
    const dataObj = sessObj?.data as Record<string, unknown> | undefined;
    const userObj = (dataObj?.user || sessObj?.user) as Record<string, unknown> | undefined;
    const userId = (userObj?.id || userObj?.idusuario || userObj?.userId) as string | undefined;

    if (!userId) {
      return NextResponse.json(
        { error: 'Debe iniciar sesión para realizar búsquedas' },
        { status: 401 }
      );
    }

    if (q.trim().length < 2) {
      return NextResponse.json({ success: true, users: [] });
    }

    const searchQuery = q.trim();

    // Find users whose username or email matches the search query, excluding the current user.
    const users = await prisma.usuario.findMany({
      where: {
        idusuario: { not: userId },
        OR: [
          { nombreusuario: { contains: searchQuery, mode: 'insensitive' } },
          { email: { contains: searchQuery, mode: 'insensitive' } },
        ],
      },
      select: {
        idusuario: true,
        nombreusuario: true,
        email: true,
        fotoperfil: true,
        biografia: true,
      },
      take: 10,
    });

    return NextResponse.json({ success: true, users });
  } catch (err: unknown) {
    console.error('[API /api/usuarios/buscar GET Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
