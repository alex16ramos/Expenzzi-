import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function getUserIdFromSession(): Promise<string | null> {
  try {
    const session = await auth.getSession();
    const sessObj = session as unknown as Record<string, unknown>;
    const dataObj = sessObj?.data as Record<string, unknown> | undefined;
    const userObj = (dataObj?.user || sessObj?.user) as Record<string, unknown> | undefined;
    return (userObj?.id || userObj?.idusuario || userObj?.userId) as string || null;
  } catch {
    return null;
  }
}

/**
 * PUT /api/interfaces/[id]
 * Updates an operation interface name and description (Administrador only).
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const interfaceId = BigInt(resolvedParams.id);

    const userInterfaz = await prisma.usuarioInterfaz.findFirst({
      where: {
        idinterfazoperacion: interfaceId,
        idusuario: userId,
        fechasalida: null,
      },
    });

    if (!userInterfaz) {
      return NextResponse.json({ error: 'No tienes acceso a esta interfaz' }, { status: 403 });
    }

    if (userInterfaz.rol !== 'Administrador') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden modificar la interfaz' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { nombre, descripcion } = body;

    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      return NextResponse.json(
        { error: 'El nombre de la interfaz es obligatorio' },
        { status: 400 }
      );
    }

    if (nombre.trim().length > 50) {
      return NextResponse.json(
        { error: 'El nombre no puede exceder los 50 caracteres' },
        { status: 400 }
      );
    }

    const updated = await prisma.interfazOperacion.update({
      where: { idinterfazoperacion: interfaceId },
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion !== undefined ? (typeof descripcion === 'string' ? descripcion.trim() || null : null) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Interfaz actualizada exitosamente',
      data: {
        id: String(updated.idinterfazoperacion),
        nombre: updated.nombre,
        descripcion: updated.descripcion,
      },
    });
  } catch (err: unknown) {
    console.error('[API /api/interfaces/[id] PUT Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor al actualizar la interfaz';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

/**
 * DELETE /api/interfaces/[id]
 * Deletes an operation interface (Administrador only).
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const interfaceId = BigInt(resolvedParams.id);

    // Verify user role in interface
    const userInterfaz = await prisma.usuarioInterfaz.findFirst({
      where: {
        idinterfazoperacion: interfaceId,
        idusuario: userId,
        fechasalida: null,
      },
    });

    if (!userInterfaz) {
      return NextResponse.json({ error: 'No tienes acceso a esta interfaz' }, { status: 403 });
    }

    if (userInterfaz.rol === 'Administrador') {
      // Delete the interface (cascades related records according to schema)
      await prisma.interfazOperacion.delete({
        where: { idinterfazoperacion: interfaceId },
      });

      return NextResponse.json({
        success: true,
        message: 'Interfaz eliminada exitosamente',
      });
    } else {
      // Non-admin user leaving the interface
      await prisma.usuarioInterfaz.update({
        where: {
          idinterfazoperacion_idusuario: {
            idinterfazoperacion: interfaceId,
            idusuario: userId,
          },
        },
        data: {
          fechasalida: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Has salido de la interfaz exitosamente',
      });
    }
  } catch (err: unknown) {
    console.error('[API /api/interfaces/[id] DELETE Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor al eliminar la interfaz';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
