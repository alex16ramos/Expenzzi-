import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * POST /api/auth/reset-password
 * Allows users to reset a forgotten password or change their password.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, currentPassword, newPassword } = body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'La nueva contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    if (action === 'forgot') {
      if (!email || typeof email !== 'string') {
        return NextResponse.json(
          { error: 'Por favor ingresa un correo electrónico válido' },
          { status: 400 }
        );
      }

      const targetEmail = email.trim().toLowerCase();

      // Find user by email
      const user = await prisma.usuario.findFirst({
        where: { email: { equals: targetEmail, mode: 'insensitive' } },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'No existe ninguna cuenta asociada a este correo electrónico' },
          { status: 444 }
        );
      }

      const hashedPassword = hashPassword(newPassword);

      await prisma.usuario.update({
        where: { idusuario: user.idusuario },
        data: { contrasena: hashedPassword },
      });

      return NextResponse.json({
        success: true,
        message: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión con tu nueva clave.',
      });
    } else if (action === 'change') {
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

      const user = await prisma.usuario.findUnique({
        where: { idusuario: userId },
      });

      if (!user) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
      }

      if (user.contrasena && currentPassword) {
        const hashedCurrent = hashPassword(currentPassword);
        if (user.contrasena !== hashedCurrent && user.contrasena !== currentPassword) {
          return NextResponse.json(
            { error: 'La contraseña actual introducida es incorrecta' },
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
        message: 'Contraseña cambiada exitosamente.',
      });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (err: unknown) {
    console.error('[API Reset Password Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error interno del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
