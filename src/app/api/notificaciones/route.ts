import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

/**
 * GET /api/notificaciones
 * Fetches all notifications for the current authenticated user.
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
        { error: 'Debe iniciar sesión para ver sus notificaciones' },
        { status: 401 }
      );
    }

    const notificacionesRaw = await prisma.notificacion.findMany({
      where: { idreceptor: userId },
      include: {
        emisor: {
          select: {
            idusuario: true,
            nombreusuario: true,
            email: true,
            fotoperfil: true,
          },
        },
        interfazoperacion: {
          select: {
            idinterfazoperacion: true,
            nombre: true,
          },
        },
      },
      orderBy: { fechacreacion: 'desc' },
      take: 50,
    });

    const notificaciones = notificacionesRaw.map((n) => ({
      idnotificacion: n.idnotificacion.toString(),
      idreceptor: n.idreceptor,
      idemisor: n.idemisor,
      tipo: n.tipo,
      titulo: n.titulo,
      mensaje: n.mensaje,
      idinterfazoperacion: n.idinterfazoperacion ? n.idinterfazoperacion.toString() : null,
      rolPropuesto: n.rolPropuesto,
      estado: n.estado,
      leido: n.leido,
      fechacreacion: n.fechacreacion.toISOString(),
      emisor: n.emisor,
      interfaz: n.interfazoperacion
        ? {
            id: n.interfazoperacion.idinterfazoperacion.toString(),
            nombre: n.interfazoperacion.nombre,
          }
        : null,
    }));

    const unreadCount = notificaciones.filter((n) => !n.leido).length;

    return NextResponse.json({
      success: true,
      unreadCount,
      notificaciones,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al consultar notificaciones' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notificaciones
 * Deletes an individual notification by ID.
 */
export async function DELETE(req: Request) {
  try {
    const session = await auth.getSession();
    const sessObj = session as unknown as Record<string, unknown>;
    const dataObj = sessObj?.data as Record<string, unknown> | undefined;
    const userObj = (dataObj?.user || sessObj?.user) as Record<string, unknown> | undefined;
    const userId = (userObj?.id || userObj?.idusuario || userObj?.userId) as string | undefined;

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const idnotificacion = searchParams.get('id');

    if (!idnotificacion) {
      return NextResponse.json({ error: 'ID de notificación es requerido' }, { status: 400 });
    }

    const notifId = BigInt(idnotificacion);

    await prisma.notificacion.deleteMany({
      where: {
        idnotificacion: notifId,
        idreceptor: userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Notificación eliminada exitosamente',
    });
  } catch (err: unknown) {
    console.error('Error deleting notification:', err);
    return NextResponse.json(
      { error: 'Error al eliminar la notificación' },
      { status: 500 }
    );
  }
}
