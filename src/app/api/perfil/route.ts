import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/perfil
 * Retrieves the current user's profile details.
 */
export async function GET() {
  try {
    const session = await auth.getSession();

    const sessObj = session as unknown as Record<string, unknown>;
    const dataObj = sessObj?.data as Record<string, unknown> | undefined;
    const userObj = (dataObj?.user || sessObj?.user) as Record<string, unknown> | undefined;
    const userId = (userObj?.id || userObj?.idusuario || userObj?.userId) as string | undefined;

    if (!userId) {
      return NextResponse.json(
        { error: 'Debe iniciar sesión para ver su perfil' },
        { status: 401 }
      );
    }

    const userEmail = (userObj?.email as string) || '';
    const userName = (userObj?.name as string) || userEmail.split('@')[0] || 'Usuario';

    // Retrieve user from public.usuario table
    const dbUser = await prisma.usuario.findUnique({
      where: { idusuario: userId },
    });

    const user = dbUser || {
      idusuario: userId,
      nombreusuario: userName,
      email: userEmail,
      fotoperfil: (userObj?.image as string) || null,
      biografia: null,
      telefono: null,
      temapreferido: 'dark',
    };

    return NextResponse.json({ success: true, user });
  } catch (err: unknown) {
    console.error('[API /api/perfil GET Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

/**
 * PUT /api/perfil
 * Updates the current user's profile details.
 */
export async function PUT(req: Request) {
  try {
    const { nombreusuario, fotoperfil, biografia, telefono, temapreferido } = await req.json();

    const session = await auth.getSession();

    const sessObj = session as unknown as Record<string, unknown>;
    const dataObj = sessObj?.data as Record<string, unknown> | undefined;
    const userObj = (dataObj?.user || sessObj?.user) as Record<string, unknown> | undefined;
    const userId = (userObj?.id || userObj?.idusuario || userObj?.userId) as string | undefined;

    if (!userId) {
      return NextResponse.json(
        { error: 'Debe iniciar sesión para actualizar su perfil' },
        { status: 401 }
      );
    }

    if (nombreusuario !== undefined && (typeof nombreusuario !== 'string' || !nombreusuario.trim())) {
      return NextResponse.json(
        { error: 'El nombre de usuario no puede estar vacío' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.usuario.update({
      where: { idusuario: userId },
      data: {
        nombreusuario: nombreusuario ? nombreusuario.trim() : undefined,
        fotoperfil: fotoperfil !== undefined ? fotoperfil : undefined,
        biografia: biografia !== undefined ? biografia : undefined,
        telefono: telefono !== undefined ? telefono : undefined,
        temapreferido: temapreferido !== undefined ? temapreferido : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Perfil actualizado correctamente',
      user: updatedUser,
    });
  } catch (err: unknown) {
    console.error('[API /api/perfil PUT Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
