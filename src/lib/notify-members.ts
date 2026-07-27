import { prisma } from '@/lib/db';

interface NotifyParams {
  idinterfazoperacion: bigint;
  idemisor: string;
  tipo: 'NUEVO_GASTO' | 'NUEVO_INGRESO' | 'NUEVO_AHORRO' | string;
  titulo: string;
  mensaje: string;
}

/**
 * Helper to create informative notifications for all other members of a shared interface.
 */
export async function notifyInterfaceMembers({
  idinterfazoperacion,
  idemisor,
  tipo,
  titulo,
  mensaje,
}: NotifyParams) {
  try {
    // Find all other members of the interface excluding the sender
    const members = await prisma.usuarioInterfaz.findMany({
      where: {
        idinterfazoperacion,
        idusuario: { not: idemisor },
      },
      select: { idusuario: true },
    });

    if (members.length === 0) return;

    // Create notification entries for each member
    await prisma.notificacion.createMany({
      data: members.map((m) => ({
        idreceptor: m.idusuario,
        idemisor,
        tipo,
        titulo,
        mensaje,
        idinterfazoperacion,
        estado: 'Informativa',
        leido: false,
      })),
    });
  } catch (err) {
    console.error('Error notifying interface members:', err);
  }
}
