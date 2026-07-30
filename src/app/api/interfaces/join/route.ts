import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/interfaces/join
 * Joins an existing interface using an invitation UUID code (CU03 / RF30).
 * Matches code with linkinvitado or linkvisualizador and assigns 'Invitado' or 'Visualizador'.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawCode = (body?.codigo || body?.code || '') as string;

    if (!rawCode || typeof rawCode !== 'string' || !rawCode.trim()) {
      return NextResponse.json(
        { error: 'El código de invitación es obligatorio' },
        { status: 400 }
      );
    }

    const cleanCode = rawCode.trim();
    const session = await auth.getSession();
    const sessObj = session as unknown as Record<string, unknown>;
    const dataObj = sessObj?.data as Record<string, unknown> | undefined;
    const userObj = (dataObj?.user || sessObj?.user) as Record<string, unknown> | undefined;
    const userId = (userObj?.id || userObj?.idusuario || userObj?.userId) as string | undefined;

    if (!userId) {
      return NextResponse.json(
        { error: 'Debe iniciar sesión para unirse a una interfaz' },
        { status: 401 }
      );
    }

    const userEmail = (userObj?.email as string) || '';
    const userName = (userObj?.name as string) || userEmail.split('@')[0] || 'Usuario';

    // 1. Ensure user exists in custom 'usuario' table for foreign key constraint
    await prisma.usuario.upsert({
      where: { idusuario: userId },
      update: { nombreusuario: userName, email: userEmail },
      create: { idusuario: userId, nombreusuario: userName, email: userEmail },
    });

    // 2. Find matching interface by linkinvitado or linkvisualizador
    const matchedInterfaz = await prisma.interfazOperacion.findFirst({
      where: {
        estado: true,
        OR: [
          { linkinvitado: cleanCode },
          { linkvisualizador: cleanCode },
        ],
      },
    });

    if (!matchedInterfaz) {
      return NextResponse.json(
        { error: 'Código de invitación inválido o la interfaz se encuentra inactiva' },
        { status: 400 }
      );
    }

    const role = matchedInterfaz.linkinvitado === cleanCode ? 'Invitado' : 'Visualizador';

    // 3. Upsert relationship in usuariointerfaz
    const joinData = await prisma.usuarioInterfaz.upsert({
      where: {
        idinterfazoperacion_idusuario: {
          idinterfazoperacion: matchedInterfaz.idinterfazoperacion,
          idusuario: userId,
        },
      },
      update: {
        rol: role,
        fechasalida: null,
        fechaunion: new Date(),
      },
      create: {
        idinterfazoperacion: matchedInterfaz.idinterfazoperacion,
        idusuario: userId,
        rol: role,
        fechaunion: new Date(),
      },
    });

    const targetInterfaceId = String(matchedInterfaz.idinterfazoperacion);

    return NextResponse.json({
      success: true,
      message: `¡Te has unido exitosamente a "${matchedInterfaz.nombre}" como ${role}!`,
      interfaceId: targetInterfaceId,
      data: {
        ...joinData,
        idinterfazoperacion: targetInterfaceId,
      },
    });
  } catch (err: unknown) {
    console.error('[API /api/interfaces/join Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error al procesar la solicitud';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

