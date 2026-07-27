import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getExchangeRatesForDate, convertCurrency } from '@/lib/exchange-rate';

export const dynamic = 'force-dynamic';

/**
 * GET /api/interfaces
 * Retrieves all active interfaces accessible by the current authenticated user with calculated net balances.
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
        { error: 'Debe iniciar sesión para ver sus interfaces' },
        { status: 401 }
      );
    }

    const userInterfaces = await prisma.usuarioInterfaz.findMany({
      where: {
        idusuario: userId,
        fechasalida: null,
      },
      include: {
        interfazoperacion: true,
      },
    });

    const activeInterfaces = userInterfaces.filter((item) => item.interfazoperacion != null);

    // Calculate balances per interface for ARS, USD, UYU with historical date auto-conversion
    const interfaces = await Promise.all(
      activeInterfaces.map(async (item) => {
        const interfaceId = item.interfazoperacion.idinterfazoperacion;

        const [gastos, ingresos, ahorros] = await Promise.all([
          prisma.gasto.findMany({
            where: {
              estado: true,
              OR: [
                { categoria: { idinterfazoperacion: interfaceId } },
                { submetodopago: { idinterfazoperacion: interfaceId } },
              ],
            },
            select: { fecha: true, moneda: true, importe: true },
          }),
          prisma.ingreso.findMany({
            where: { idinterfazoperacion: interfaceId, estado: true },
            select: { fecha: true, moneda: true, importe: true },
          }),
          prisma.ahorro.findMany({
            where: { idinterfazoperacion: interfaceId, estado: true },
            select: { fechadesde: true, moneda: true, importe: true },
          }),
        ]);

        const calcNet = async (targetCurr: 'ARS' | 'USD' | 'UYU') => {
          let totalIngresos = 0;
          for (const i of ingresos) {
            const rates = await getExchangeRatesForDate(i.fecha);
            totalIngresos += convertCurrency(Number(i.importe || 0), i.moneda as 'ARS' | 'USD' | 'UYU', targetCurr, rates);
          }

          let totalGastos = 0;
          for (const g of gastos) {
            const rates = await getExchangeRatesForDate(g.fecha);
            totalGastos += convertCurrency(Number(g.importe || 0), g.moneda as 'ARS' | 'USD' | 'UYU', targetCurr, rates);
          }

          let totalAhorros = 0;
          for (const a of ahorros) {
            const rates = await getExchangeRatesForDate(a.fechadesde);
            totalAhorros += convertCurrency(Number(a.importe || 0), a.moneda as 'ARS' | 'USD' | 'UYU', targetCurr, rates);
          }

          return totalIngresos - totalGastos + totalAhorros;
        };

        const [balanceARS, balanceUSD, balanceUYU] = await Promise.all([
          calcNet('ARS'),
          calcNet('USD'),
          calcNet('UYU'),
        ]);

        return {
          id: String(item.interfazoperacion.idinterfazoperacion),
          nombre: item.interfazoperacion.nombre || 'Sin nombre',
          descripcion: item.interfazoperacion.descripcion || '',
          rol: item.rol || 'Visualizador',
          estado: item.interfazoperacion.estado ?? true,
          linkinvitado: item.interfazoperacion.linkinvitado || randomUUID(),
          linkvisualizador: item.interfazoperacion.linkvisualizador || randomUUID(),
          fechacreacion: item.interfazoperacion.fechacreacion ? item.interfazoperacion.fechacreacion.toISOString().split('T')[0] : '',
          fechaunion: item.fechaunion ? item.fechaunion.toISOString().split('T')[0] : '',
          balanceARS,
          balanceUSD,
          balanceUYU,
        };
      })
    );

    return NextResponse.json({ interfaces });
  } catch (err: unknown) {
    console.error('[API /api/interfaces GET Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

/**
 * POST /api/interfaces
 * Creates a new operation interface.
 */
export async function POST(req: Request) {
  try {
    const { nombre, descripcion } = await req.json();

    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      return NextResponse.json(
        { error: 'El nombre de la interfaz es obligatorio' },
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
        { error: 'Debe iniciar sesión para crear una interfaz' },
        { status: 401 }
      );
    }

    const userEmail = (userObj?.email as string) || '';
    const userName = (userObj?.name as string) || userEmail.split('@')[0] || 'Usuario';

    await prisma.usuario.upsert({
      where: { idusuario: userId },
      update: { nombreusuario: userName, email: userEmail },
      create: { idusuario: userId, nombreusuario: userName, email: userEmail },
    });

    const newInterfaz = await prisma.interfazOperacion.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        linkinvitado: randomUUID(),
        linkvisualizador: randomUUID(),
      },
    });

    await prisma.usuarioInterfaz.create({
      data: {
        idinterfazoperacion: newInterfaz.idinterfazoperacion,
        idusuario: userId,
        rol: 'Administrador',
        fechaunion: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Interfaz creada correctamente',
      data: {
        ...newInterfaz,
        idinterfazoperacion: String(newInterfaz.idinterfazoperacion),
      },
    });
  } catch (err: unknown) {
    console.error('[API /api/interfaces POST Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
