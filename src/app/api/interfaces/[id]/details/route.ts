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
 * GET /api/interfaces/[id]/details
 * Retrieves details for a specific interface, including current user's role,
 * active categories, submethods, members, and latest exchange rate.
 */
export async function GET(
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

    // Check user association and role in interface
    const userInterfaz = await prisma.usuarioInterfaz.findFirst({
      where: {
        idinterfazoperacion: interfaceId,
        idusuario: userId,
        fechasalida: null,
      },
      include: {
        interfazoperacion: true,
      },
    });

    if (!userInterfaz || !userInterfaz.interfazoperacion) {
      return NextResponse.json(
        { error: 'No tiene acceso a esta interfaz u operacion no encontrada' },
        { status: 403 }
      );
    }

    // Auto-seed example data (Categories, Submethods, Gastos, Ingresos, Ahorros) if empty
    const { ensureDemoDataForInterface } = await import('@/lib/demo-seed');
    await ensureDemoDataForInterface(interfaceId, userId);

    // Fetch active categories for this interface
    const categories = await prisma.categoria.findMany({
      where: {
        idinterfazoperacion: interfaceId,
        estado: true,
      },
      orderBy: { nombre: 'asc' },
    });

    // Calculate category limit usage map
    const categoryUsageMap = new Map<string, number>();
    try {
      const rows = await prisma.$queryRaw<Array<{ idcategoria: bigint; importeutilizado: number | string | null }>>`
        SELECT idcategoria, importeutilizado 
        FROM vistalimitegastosperiodo 
        WHERE idinterfazoperacion = ${interfaceId}
      `;
      for (const r of rows) {
        categoryUsageMap.set(String(r.idcategoria), Number(r.importeutilizado || 0));
      }
    } catch {
      // Fallback ignore if raw query unavailable
    }

    // Fetch active submethods for this interface
    const submethods = await prisma.subMetodoPago.findMany({
      where: {
        idinterfazoperacion: interfaceId,
        estado: true,
      },
      orderBy: { nombre: 'asc' },
    });

    // Fetch members of this interface
    const members = await prisma.usuarioInterfaz.findMany({
      where: {
        idinterfazoperacion: interfaceId,
        fechasalida: null,
      },
      include: {
        usuario: true,
      },
    });

    // Fetch latest exchange rate
    const latestCambio = await prisma.cambio.findFirst({
      orderBy: [{ fecha: 'desc' }, { idcambio: 'desc' }],
    });

    return NextResponse.json({
      interface: {
        id: String(userInterfaz.interfazoperacion.idinterfazoperacion),
        nombre: userInterfaz.interfazoperacion.nombre,
        descripcion: userInterfaz.interfazoperacion.descripcion,
        estado: userInterfaz.interfazoperacion.estado,
        linkinvitado: userInterfaz.interfazoperacion.linkinvitado,
        linkvisualizador: userInterfaz.interfazoperacion.linkvisualizador,
      },
      role: userInterfaz.rol || 'Visualizador',
      categories: categories.map((c) => ({
        id: String(c.idcategoria),
        nombre: c.nombre,
        estadolimite: c.estadolimite ?? false,
        importe: c.importe ? Number(c.importe) : null,
        moneda: c.moneda,
        periodoaplicacion: c.periodoaplicacion,
        importeutilizado: categoryUsageMap.get(String(c.idcategoria)) || 0,
      })),
      submethods: submethods.map((s) => ({
        id: String(s.idsubmetodopago),
        nombre: s.nombre,
        metodo: s.metodo,
      })),
      members: members.map((m) => ({
        idusuario: m.idusuario,
        nombreusuario: m.usuario?.nombreusuario || 'Usuario',
        email: m.usuario?.email || '',
        rol: m.rol,
      })),
      cambio: latestCambio
        ? {
            id: String(latestCambio.idcambio),
            fecha: latestCambio.fecha.toISOString().split('T')[0],
            cambiouyuusd: latestCambio.cambiouyuusd ? Number(latestCambio.cambiouyuusd) : null,
            cambiouyuars: latestCambio.cambiouyuars ? Number(latestCambio.cambiouyuars) : null,
            cambiousduyu: latestCambio.cambiousduyu ? Number(latestCambio.cambiousduyu) : null,
            cambiousdars: latestCambio.cambiousdars ? Number(latestCambio.cambiousdars) : null,
            cambioarsuyu: latestCambio.cambioarsuyu ? Number(latestCambio.cambioarsuyu) : null,
            cambioarsusd: latestCambio.cambioarsusd ? Number(latestCambio.cambioarsusd) : null,
          }
        : null,
    });
  } catch (err: unknown) {
    console.error('[API /api/interfaces/[id]/details GET Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
