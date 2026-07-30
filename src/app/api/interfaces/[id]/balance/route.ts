import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getTodayExchangeRates, getExchangeRatesForDate, convertCurrency } from '@/lib/exchange-rate';
import { checkUserInterfaceMembership } from '@/lib/membership-cache';

export const dynamic = 'force-dynamic';

const CURRENCIES = ['ARS', 'USD', 'UYU'] as const;
type CurrencyKey = (typeof CURRENCIES)[number];

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
 * GET /api/interfaces/[id]/balance
 * Calculates and returns overall general balances in ARS, USD, UYU (RF19).
 * Dynamically aggregates active Ingresos, Gastos, and Ahorros converting with historical date rates.
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

    // Fast-path membership check using 60s in-memory TTL cache
    const { hasAccess } = await checkUserInterfaceMembership(userId, interfaceId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Fetch active Ingresos, Ahorros, and Gastos concurrently with operation dates and rates snapshot
    const [ingresos, ahorros, gastos, todayRates] = await Promise.all([
      prisma.ingreso.findMany({
        where: { idinterfazoperacion: interfaceId, estado: true },
        select: { fecha: true, moneda: true, importe: true, tasacambio: true },
      }),
      prisma.ahorro.findMany({
        where: { idinterfazoperacion: interfaceId, estado: true },
        select: { fechadesde: true, moneda: true, importe: true, tasacambio: true },
      }),
      prisma.gasto.findMany({
        where: {
          estado: true,
          OR: [
            { categoria: { idinterfazoperacion: interfaceId } },
            { submetodopago: { idinterfazoperacion: interfaceId } },
            {
              usuarioResponsable: {
                usuarioInterfaces: {
                  some: { idinterfazoperacion: interfaceId, fechasalida: null },
                },
              },
            },
            {
              usuarioIngresador: {
                usuarioInterfaces: {
                  some: { idinterfazoperacion: interfaceId, fechasalida: null },
                },
              },
            },
          ],
        },
        select: { fecha: true, moneda: true, importe: true, tasacambio: true },
      }),
      getTodayExchangeRates(),
    ]);

    const balances = {
      ARS: { ingresos: 0, gastos: 0, ahorros: 0, net: 0 },
      USD: { ingresos: 0, gastos: 0, ahorros: 0, net: 0 },
      UYU: { ingresos: 0, gastos: 0, ahorros: 0, net: 0 },
    };

    // Process Ingresos with snapshot or historical date exchange rates
    await Promise.all(
      ingresos.map(async (item) => {
        const srcMoneda = item.moneda as CurrencyKey;
        const amt = Number(item.importe || 0);
        const itemRates = item.tasacambio ? todayRates : await getExchangeRatesForDate(item.fecha);
        CURRENCIES.forEach((targetMoneda) => {
          balances[targetMoneda].ingresos += convertCurrency(amt, srcMoneda, targetMoneda, itemRates, item.tasacambio ? Number(item.tasacambio) : null);
        });
      })
    );

    // Process Gastos with snapshot or historical date exchange rates
    await Promise.all(
      gastos.map(async (item) => {
        const srcMoneda = item.moneda as CurrencyKey;
        const amt = Number(item.importe || 0);
        const itemRates = item.tasacambio ? todayRates : await getExchangeRatesForDate(item.fecha);
        CURRENCIES.forEach((targetMoneda) => {
          balances[targetMoneda].gastos += convertCurrency(amt, srcMoneda, targetMoneda, itemRates, item.tasacambio ? Number(item.tasacambio) : null);
        });
      })
    );

    // Process Ahorros with snapshot or historical date exchange rates
    await Promise.all(
      ahorros.map(async (item) => {
        const srcMoneda = item.moneda as CurrencyKey;
        const amt = Number(item.importe || 0);
        const itemRates = item.tasacambio ? todayRates : await getExchangeRatesForDate(item.fechadesde);
        CURRENCIES.forEach((targetMoneda) => {
          balances[targetMoneda].ahorros += convertCurrency(amt, srcMoneda, targetMoneda, itemRates, item.tasacambio ? Number(item.tasacambio) : null);
        });
      })
    );

    CURRENCIES.forEach((c) => {
      // Net balance = Ingresos - Gastos + Ahorros
      balances[c].net = balances[c].ingresos - balances[c].gastos + balances[c].ahorros;
    });

    return NextResponse.json({
      interfaceId: String(interfaceId),
      balances,
      exchangeRates: todayRates,
    });
  } catch (err: unknown) {
    console.error('[API /api/interfaces/[id]/balance GET Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
