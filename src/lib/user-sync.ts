import { prisma } from '@/lib/db';

export interface AuthSessionUser {
  id?: string;
  idusuario?: string;
  userId?: string;
  email?: string;
  name?: string;
  image?: string;
}

/**
 * Ensures a user authenticated via Neon Auth exists in the `public.usuario` table.
 * If not present, creates the user record so profile updates, password changes,
 * and interface operations never fail with "Usuario no encontrado" / P2025 errors.
 */
export async function ensureUserInDb(userObj: AuthSessionUser | undefined) {
  const userId = userObj?.id || userObj?.idusuario || userObj?.userId;
  const email = userObj?.email?.trim().toLowerCase();

  if (!userId || !email) return null;

  try {
    // 1. Check if user exists by idusuario
    let user = await prisma.usuario.findUnique({
      where: { idusuario: userId },
    });

    if (user) return user;

    // 2. Check if user exists by email
    user = await prisma.usuario.findUnique({
      where: { email },
    });

    if (user) {
      // If user exists with a mismatched id, attempt to update to match current Neon Auth session ID
      try {
        user = await prisma.usuario.update({
          where: { email },
          data: { idusuario: userId },
        });
      } catch {
        // If update fails due to foreign key constraints, return the existing user
      }
      return user;
    }

    // 3. User does not exist in public.usuario, auto-provision
    const userName = userObj.name?.trim() || email.split('@')[0] || 'Usuario';
    user = await prisma.usuario.create({
      data: {
        idusuario: userId,
        nombreusuario: userName,
        email,
        fotoperfil: userObj.image || null,
        contrasena: 'NEON_AUTH',
        temapreferido: 'dark',
      },
    });

    return user;
  } catch (err) {
    console.warn('[ensureUserInDb] Error syncing user to public.usuario:', err);
    return null;
  }
}
