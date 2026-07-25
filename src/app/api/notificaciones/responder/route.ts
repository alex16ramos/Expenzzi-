import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

/**
 * POST /api/notificaciones/responder
 * Responds to an invitation (accept or reject).
 */
export async function POST(req: Request) {
  try {
    const { idnotificacion, aceptar } = await req.json();

    const session = await auth.getSession();
    const sessObj = session as unknown as Record<string, unknown>;
    const dataObj = sessObj?.data as Record<string, unknown> | undefined;
    const userObj = (dataObj?.user || sessObj?.user) as Record<string, unknown> | undefined;
    const userId = (userObj?.id || userObj?.idusuario || userObj?.userId) as string | undefined;

    if (!userId) {
      return NextResponse.json(
        { error: 'Debe iniciar sesión para responder notificaciones' },
        { status: 401 }
      );
    }

    if (!idnotificacion || typeof aceptar !== 'boolean') {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos (idnotificacion, aceptar)' },
        { status: 400 }
      );
    }

    const notifIdBigInt = BigInt(idnotificacion);

    const notif = await prisma.notificacion.findUnique({
      where: { idnotificacion: notifIdBigInt },
    });

    if (!notif) {
      return NextResponse.json({ error: 'La notificación especificada no existe' }, { status: 404 });
    }

    if (notif.idreceptor !== userId) {
      return NextResponse.json(
        { error: 'No tienes autorización para responder a esta notificación' },
        { status: 403 }
      );
    }

    if (aceptar) {
      if (notif.tipo === 'SOLICITUD_AMISTAD') {
        await prisma.amistad.updateMany({
          where: {
            OR: [
              { idremitente: notif.idemisor, iddestinatario: notif.idreceptor },
              { idremitente: notif.idreceptor, iddestinatario: notif.idemisor },
            ],
          },
          data: { estado: 'Aceptado' },
        });
      } else if (notif.idinterfazoperacion) {
        await prisma.usuarioInterfaz.upsert({
          where: {
            idinterfazoperacion_idusuario: {
              idinterfazoperacion: notif.idinterfazoperacion,
              idusuario: userId,
            },
          },
          create: {
            idinterfazoperacion: notif.idinterfazoperacion,
            idusuario: userId,
            rol: notif.rolPropuesto || 'Invitado',
            fechaunion: new Date(),
          },
          update: {
            rol: notif.rolPropuesto || 'Invitado',
            fechaunion: new Date(),
          },
        });
      }

      await prisma.notificacion.update({
        where: { idnotificacion: notifIdBigInt },
        data: {
          estado: 'Aceptada',
          leido: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: notif.tipo === 'SOLICITUD_AMISTAD' ? '¡Solicitud de amistad aceptada!' : '¡Invitación aceptada con éxito! Ya formas parte de la interfaz.',
        estado: 'Aceptada',
      });
    } else {
      if (notif.tipo === 'SOLICITUD_AMISTAD') {
        await prisma.amistad.updateMany({
          where: {
            OR: [
              { idremitente: notif.idemisor, iddestinatario: notif.idreceptor },
              { idremitente: notif.idreceptor, iddestinatario: notif.idemisor },
            ],
          },
          data: { estado: 'Rechazado' },
        });
      }

      await prisma.notificacion.update({
        where: { idnotificacion: notifIdBigInt },
        data: {
          estado: 'Rechazada',
          leido: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Notificación rechazada.',
        estado: 'Rechazada',
      });
    }
  } catch (error) {
    console.error('Error responding to notification:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al responder la notificación' },
      { status: 500 }
    );
  }
}
