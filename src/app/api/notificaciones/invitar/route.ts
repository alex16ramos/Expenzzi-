import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { TRol } from '@prisma/client';

/**
 * POST /api/notificaciones/invitar
 * Sends a direct interface invitation to a recipient.
 */
export async function POST(req: Request) {
  try {
    const { idreceptor, idinterfazoperacion, rolPropuesto = 'Invitado' } = await req.json();

    const session = await auth.getSession();
    const sessObj = session as unknown as Record<string, unknown>;
    const dataObj = sessObj?.data as Record<string, unknown> | undefined;
    const userObj = (dataObj?.user || sessObj?.user) as Record<string, unknown> | undefined;
    const idemisor = (userObj?.id || userObj?.idusuario || userObj?.userId) as string | undefined;

    if (!idemisor) {
      return NextResponse.json(
        { error: 'Debe iniciar sesión para enviar invitaciones' },
        { status: 401 }
      );
    }

    if (!idreceptor || !idinterfazoperacion) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos (idreceptor, idinterfazoperacion)' },
        { status: 400 }
      );
    }

    if (idreceptor === idemisor) {
      return NextResponse.json(
        { error: 'No te puedes enviar una invitación a ti mismo' },
        { status: 400 }
      );
    }

    // Verify recipient exists
    const receptor = await prisma.usuario.findUnique({
      where: { idusuario: idreceptor },
    });

    if (!receptor) {
      return NextResponse.json({ error: 'El usuario destinatario no existe' }, { status: 404 });
    }

    const interfazIdBigInt = BigInt(idinterfazoperacion);

    // Verify interface exists
    const interfaz = await prisma.interfazOperacion.findUnique({
      where: { idinterfazoperacion: interfazIdBigInt },
    });

    if (!interfaz) {
      return NextResponse.json({ error: 'La interfaz especificada no existe' }, { status: 404 });
    }

    // Check if recipient is already a member of the interface
    const existingMembership = await prisma.usuarioInterfaz.findUnique({
      where: {
        idinterfazoperacion_idusuario: {
          idinterfazoperacion: interfazIdBigInt,
          idusuario: idreceptor,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: 'El usuario ya pertenece a esta interfaz de operación' },
        { status: 400 }
      );
    }

    // Check if there is already a pending invitation
    const existingNotif = await prisma.notificacion.findFirst({
      where: {
        idreceptor,
        idinterfazoperacion: interfazIdBigInt,
        estado: 'Pendiente',
      },
    });

    if (existingNotif) {
      return NextResponse.json(
        { error: 'Ya existe una invitación pendiente para este usuario en la interfaz' },
        { status: 400 }
      );
    }

    // Get emisor user info
    const emisor = await prisma.usuario.findUnique({
      where: { idusuario: idemisor },
    });

    const emisorNombre = emisor?.nombreusuario || 'Un usuario';
    const validRol: TRol = (['Administrador', 'Invitado', 'Visualizador'].includes(rolPropuesto)
      ? rolPropuesto
      : 'Invitado') as TRol;

    const notificacion = await prisma.notificacion.create({
      data: {
        idreceptor,
        idemisor,
        tipo: 'INVITACION_INTERFAZ',
        titulo: `Invitación a ${interfaz.nombre}`,
        mensaje: `${emisorNombre} te ha invitado a unirte a "${interfaz.nombre}" como ${validRol}.`,
        idinterfazoperacion: interfazIdBigInt,
        rolPropuesto: validRol,
        estado: 'Pendiente',
        leido: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Invitación enviada con éxito a ${receptor.nombreusuario}`,
      idnotificacion: notificacion.idnotificacion.toString(),
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al enviar la invitación' },
      { status: 500 }
    );
  }
}
