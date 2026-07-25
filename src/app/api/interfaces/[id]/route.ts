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

    if (userInterfaz.rol !== 'Administrador') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden eliminar la interfaz' },
        { status: 403 }
      );
    }

    // Delete the interface (cascades related records according to schema or deletes manually)
    await prisma.interfazOperacion.delete({
      where: { idinterfazoperacion: interfaceId },
    });

    return NextResponse.json({
      success: true,
      message: 'Interfaz eliminada exitosamente',
    });
  } catch (err: unknown) {
    console.error('[API /api/interfaces/[id] DELETE Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor al eliminar la interfaz';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
