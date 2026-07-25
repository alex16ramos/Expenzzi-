import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Helper to serialize BigInt objects to string
function serializeAmistad(item: {
  idamistad: bigint;
  idremitente: string;
  iddestinatario: string;
  estado: string;
  fechacreacion: Date;
  remitente?: { idusuario: string; nombreusuario: string; email: string; fotoperfil: string | null; biografia: string | null };
  destinatario?: { idusuario: string; nombreusuario: string; email: string; fotoperfil: string | null; biografia: string | null };
}) {
  return {
    idamistad: String(item.idamistad),
    idremitente: item.idremitente,
    iddestinatario: item.iddestinatario,
    estado: item.estado,
    fechacreacion: item.fechacreacion.toISOString().split('T')[0],
    remitente: item.remitente ? {
      idusuario: item.remitente.idusuario,
      nombreusuario: item.remitente.nombreusuario,
      email: item.remitente.email,
      fotoperfil: item.remitente.fotoperfil,
      biografia: item.remitente.biografia,
    } : undefined,
    destinatario: item.destinatario ? {
      idusuario: item.destinatario.idusuario,
      nombreusuario: item.destinatario.nombreusuario,
      email: item.destinatario.email,
      fotoperfil: item.destinatario.fotoperfil,
      biografia: item.destinatario.biografia,
    } : undefined,
  };
}

/**
 * GET /api/amigos
 * Lists friends, received pending requests, and sent pending requests.
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
        { error: 'Debe iniciar sesión para ver sus amigos' },
        { status: 401 }
      );
    }

    // 1. Get accepted friendships
    const acceptedFriendships = await prisma.amistad.findMany({
      where: {
        estado: 'Aceptado',
        OR: [
          { idremitente: userId },
          { iddestinatario: userId },
        ],
      },
      include: {
        remitente: true,
        destinatario: true,
      },
    });

    const amigos = acceptedFriendships.map((item) => {
      const serialized = serializeAmistad(item);
      // The friend is the opposite user
      const amigoDetails = item.idremitente === userId ? item.destinatario : item.remitente;
      return {
        idamistad: serialized.idamistad,
        fechaamistad: serialized.fechacreacion,
        idusuario: amigoDetails.idusuario,
        nombreusuario: amigoDetails.nombreusuario,
        email: amigoDetails.email,
        fotoperfil: amigoDetails.fotoperfil,
        biografia: amigoDetails.biografia,
      };
    });

    // 2. Get received pending requests
    const receivedPending = await prisma.amistad.findMany({
      where: {
        estado: 'Pendiente',
        iddestinatario: userId,
      },
      include: {
        remitente: true,
      },
    });

    const solicitudesRecibidas = receivedPending.map((item) => {
      const serialized = serializeAmistad(item);
      return {
        idamistad: serialized.idamistad,
        fechacreacion: serialized.fechacreacion,
        remitente: serialized.remitente,
      };
    });

    // 3. Get sent pending requests
    const sentPending = await prisma.amistad.findMany({
      where: {
        estado: 'Pendiente',
        idremitente: userId,
      },
      include: {
        destinatario: true,
      },
    });

    const solicitudesEnviadas = sentPending.map((item) => {
      const serialized = serializeAmistad(item);
      return {
        idamistad: serialized.idamistad,
        fechacreacion: serialized.fechacreacion,
        destinatario: serialized.destinatario,
      };
    });

    return NextResponse.json({
      success: true,
      amigos,
      solicitudesRecibidas,
      solicitudesEnviadas,
    });
  } catch (err: unknown) {
    console.error('[API /api/amigos GET Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

/**
 * POST /api/amigos
 * Sends a new friend request.
 */
export async function POST(req: Request) {
  try {
    const { destinatarioId } = await req.json();

    if (!destinatarioId || typeof destinatarioId !== 'string') {
      return NextResponse.json(
        { error: 'El ID del destinatario es obligatorio' },
        { status: 400 }
      );
    }

    const session = await auth.getSession();
    const sessObj = session as unknown as Record<string, unknown>;
    const dataObj = sessObj?.data as Record<string, unknown> | undefined;
    const userObj = (dataObj?.user || sessObj?.user) as Record<string, unknown> | undefined;
    const userId = (userObj?.id || userObj?.idusuario || userObj?.userId) as string | undefined;

    if (!userId) {
      return NextResponse.json(
        { error: 'Debe iniciar sesión para enviar solicitudes de amistad' },
        { status: 401 }
      );
    }

    if (userId === destinatarioId) {
      return NextResponse.json(
        { error: 'No puedes enviarte una solicitud de amistad a ti mismo' },
        { status: 400 }
      );
    }

    // Verify destination user exists
    const destUser = await prisma.usuario.findUnique({
      where: { idusuario: destinatarioId },
    });

    if (!destUser) {
      return NextResponse.json(
        { error: 'El usuario de destino no existe' },
        { status: 404 }
      );
    }

    // Check if friendship relationship already exists
    const existing = await prisma.amistad.findFirst({
      where: {
        OR: [
          { idremitente: userId, iddestinatario: destinatarioId },
          { idremitente: destinatarioId, iddestinatario: userId },
        ],
      },
    });

    if (existing) {
      if (existing.estado === 'Aceptado') {
        return NextResponse.json(
          { error: 'Ya son amigos con este usuario' },
          { status: 400 }
        );
      }

      if (existing.estado === 'Pendiente') {
        if (existing.idremitente === userId) {
          return NextResponse.json(
            { error: 'Ya has enviado una solicitud a este usuario' },
            { status: 400 }
          );
        } else {
          // If the other user already sent a pending request to us, automatically accept it
          const updated = await prisma.amistad.update({
            where: { idamistad: existing.idamistad },
            data: { estado: 'Aceptado' },
          });
          return NextResponse.json({
            success: true,
            message: 'Solicitud aceptada automáticamente por coincidencia mutua',
            data: { idamistad: String(updated.idamistad), estado: updated.estado },
          });
        }
      }

      // If existing state is Rejected, reactivate it as Pending
      if (existing.estado === 'Rechazado') {
        const updated = await prisma.amistad.update({
          where: { idamistad: existing.idamistad },
          data: {
            idremitente: userId,
            iddestinatario: destinatarioId,
            estado: 'Pendiente',
            fechacreacion: new Date(),
          },
        });

        const emisor = await prisma.usuario.findUnique({
          where: { idusuario: userId },
        });
        const emisorNombre = emisor?.nombreusuario || 'Un usuario';

        await prisma.notificacion.create({
          data: {
            idreceptor: destinatarioId,
            idemisor: userId,
            tipo: 'SOLICITUD_AMISTAD',
            titulo: 'Solicitud de Amistad',
            mensaje: `${emisorNombre} te ha enviado una solicitud de amistad.`,
            estado: 'Pendiente',
            leido: false,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Solicitud de amistad enviada',
          data: { idamistad: String(updated.idamistad), estado: updated.estado },
        });
      }
    }

    // Create new friend request
    const newAmistad = await prisma.amistad.create({
      data: {
        idremitente: userId,
        iddestinatario: destinatarioId,
        estado: 'Pendiente',
      },
    });

    const emisor = await prisma.usuario.findUnique({
      where: { idusuario: userId },
    });
    const emisorNombre = emisor?.nombreusuario || 'Un usuario';

    await prisma.notificacion.create({
      data: {
        idreceptor: destinatarioId,
        idemisor: userId,
        tipo: 'SOLICITUD_AMISTAD',
        titulo: 'Solicitud de Amistad',
        mensaje: `${emisorNombre} te ha enviado una solicitud de amistad.`,
        estado: 'Pendiente',
        leido: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Solicitud de amistad enviada exitosamente',
      data: {
        idamistad: String(newAmistad.idamistad),
        estado: newAmistad.estado,
      },
    });
  } catch (err: unknown) {
    console.error('[API /api/amigos POST Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

/**
 * PUT /api/amigos
 * Accepts or rejects an incoming friend request.
 */
export async function PUT(req: Request) {
  try {
    const { idamistad, estado } = await req.json();

    if (!idamistad || !estado || (estado !== 'Aceptado' && estado !== 'Rechazado')) {
      return NextResponse.json(
        { error: 'Parámetros inválidos. Se requiere idamistad y estado ("Aceptado" o "Rechazado")' },
        { status: 400 }
      );
    }

    const session = await auth.getSession();
    const sessObj = session as unknown as Record<string, unknown>;
    const dataObj = sessObj?.data as Record<string, unknown> | undefined;
    const userObj = (dataObj?.user || sessObj?.user) as Record<string, unknown> | undefined;
    const userId = (userObj?.id || userObj?.idusuario || userObj?.userId) as string | undefined;

    if (!userId) {
      return NextResponse.json(
        { error: 'Debe iniciar sesión para responder solicitudes' },
        { status: 401 }
      );
    }

    const friendship = await prisma.amistad.findUnique({
      where: { idamistad: BigInt(idamistad) },
    });

    if (!friendship) {
      return NextResponse.json(
        { error: 'La solicitud de amistad no existe' },
        { status: 404 }
      );
    }

    // Only the recipient can accept or reject a request
    if (friendship.iddestinatario !== userId) {
      return NextResponse.json(
        { error: 'No tienes autorización para responder a esta solicitud' },
        { status: 403 }
      );
    }

    const updated = await prisma.amistad.update({
      where: { idamistad: BigInt(idamistad) },
      data: { estado },
    });

    return NextResponse.json({
      success: true,
      message: estado === 'Aceptado' ? 'Solicitud aceptada' : 'Solicitud rechazada',
      data: {
        idamistad: String(updated.idamistad),
        estado: updated.estado,
      },
    });
  } catch (err: unknown) {
    console.error('[API /api/amigos PUT Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

/**
 * DELETE /api/amigos
 * Removes a friend or cancels a pending request.
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idamistadStr = searchParams.get('idamistad');

    if (!idamistadStr) {
      return NextResponse.json(
        { error: 'El parámetro idamistad es obligatorio' },
        { status: 400 }
      );
    }

    const session = await auth.getSession();
    const sessObj = session as unknown as Record<string, unknown>;
    const dataObj = sessObj?.data as Record<string, unknown> | undefined;
    const userObj = (dataObj?.user || sessObj?.user) as Record<string, unknown> | undefined;
    const userId = (userObj?.id || userObj?.idusuario || userObj?.userId) as string | undefined;

    if (!userId) {
      return NextResponse.json(
        { error: 'Debe iniciar sesión para cancelar o eliminar relaciones de amistad' },
        { status: 401 }
      );
    }

    const friendship = await prisma.amistad.findUnique({
      where: { idamistad: BigInt(idamistadStr) },
    });

    if (!friendship) {
      return NextResponse.json(
        { error: 'La relación de amistad no existe' },
        { status: 404 }
      );
    }

    // Only the sender or recipient can delete/cancel it
    if (friendship.idremitente !== userId && friendship.iddestinatario !== userId) {
      return NextResponse.json(
        { error: 'No tienes autorización para eliminar esta relación' },
        { status: 403 }
      );
    }

    await prisma.amistad.delete({
      where: { idamistad: BigInt(idamistadStr) },
    });

    return NextResponse.json({
      success: true,
      message: 'Amistad/solicitud eliminada correctamente',
    });
  } catch (err: unknown) {
    console.error('[API /api/amigos DELETE Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
