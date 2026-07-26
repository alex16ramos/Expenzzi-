import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/usuarios?q=...
 * Search public user profiles by username or email.
 * Ensures session user exists in public.usuario.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || searchParams.get('query') || '';

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

    const userEmail = (userObj?.email as string) || `${userId}@expenzzi.local`;
    const userName = (userObj?.name as string) || userEmail.split('@')[0] || 'Usuario';

    // Ensure session user exists in public.usuario
    await prisma.usuario.upsert({
      where: { idusuario: userId },
      update: { nombreusuario: userName, email: userEmail },
      create: { idusuario: userId, nombreusuario: userName, email: userEmail },
    });

    if (!q.trim()) {
      return NextResponse.json({ success: true, usuarios: [] });
    }

    const searchQuery = q.trim();

    // Query public.usuario for matching users
    const usuarios = await prisma.usuario.findMany({
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
      take: 15,
    });

    return NextResponse.json({ success: true, usuarios });
  } catch (err: unknown) {
    console.error('[API /api/usuarios GET Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
