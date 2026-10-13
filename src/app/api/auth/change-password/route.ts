import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * POST /api/auth/change-password
 * Changes the authenticated user's password validating current and new password.
 */
export async function POST(req: Request) {
  try {
    const session = await auth.getSession();
    const sessObj = session as unknown as Record<string, unknown>;
    const dataObj = sessObj?.data as Record<string, unknown> | undefined;
    const userObj = (dataObj?.user || sessObj?.user) as Record<string, unknown> | undefined;
    const userId = (userObj?.id || userObj?.idusuario || userObj?.userId) as string | undefined;

    if (!userId) {
      return NextResponse.json(
        { error: 'Debe estar autenticado para cambiar la contraseña' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'La nueva contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    const user = await prisma.usuario.findUnique({
      where: { idusuario: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (user.contrasena) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Debe ingresar su contraseña actual' },
          { status: 400 }
        );
      }
      const hashedCurrent = hashPassword(currentPassword);
      if (user.contrasena !== hashedCurrent && user.contrasena !== currentPassword) {
        return NextResponse.json(
          { error: 'La contraseña actual ingresada es incorrecta' },
          { status: 400 }
        );
      }
    }

    const hashedPassword = hashPassword(newPassword);

    await prisma.usuario.update({
      where: { idusuario: userId },
      data: { contrasena: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada correctamente',
    });
  } catch (err: unknown) {
    console.error('[API Change Password Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error interno del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
