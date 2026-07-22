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
 * GET /api/interfaces/[id]/balance
 * Calculates and returns overall general balances in ARS, USD, UYU (RF19).
 * Dynamically aggregates active Ingresos, Gastos, and Ahorros per currency.
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

    // Verify membership
    const userInterfaz = await prisma.usuarioInterfaz.findFirst({
      where: {
        idinterfazoperacion: interfaceId,
        idusuario: userId,
        fechasalida: null,
      },
    });

    if (!userInterfaz) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // 1. Aggregate active Ingresos
    const ingresos = await prisma.ingreso.findMany({
      where: {
        idinterfazoperacion: interfaceId,
        estado: true,
      },
      select: {
        moneda: true,
        importe: true,
      },
    });

    // 2. Aggregate active Ahorros
    const ahorros = await prisma.ahorro.findMany({
      where: {
        idinterfazoperacion: interfaceId,
        estado: true,
      },
      select: {
        moneda: true,
        importe: true,
      },
    });

    // 3. Aggregate active Gastos (via Categoria or SubMetodoPago belonging to interface)
    const gastos = await prisma.gasto.findMany({
      where: {
        estado: true,
        OR: [
          { categoria: { idinterfazoperacion: interfaceId } },
          { submetodopago: { idinterfazoperacion: interfaceId } },
        ],
      },
      select: {
        moneda: true,
        importe: true,
      },
    });

    const currencies = ['ARS', 'USD', 'UYU'] as const;
    type CurrencyKey = (typeof currencies)[number];

    const balances = {
      ARS: { ingresos: 0, gastos: 0, ahorros: 0, net: 0 },
      USD: { ingresos: 0, gastos: 0, ahorros: 0, net: 0 },
      UYU: { ingresos: 0, gastos: 0, ahorros: 0, net: 0 },
    };

    ingresos.forEach((item) => {
      const c = item.moneda as CurrencyKey;
      if (balances[c]) {
        balances[c].ingresos += Number(item.importe);
      }
    });

    gastos.forEach((item) => {
      const c = item.moneda as CurrencyKey;
      if (balances[c]) {
        balances[c].gastos += Number(item.importe);
      }
    });

    ahorros.forEach((item) => {
      const c = item.moneda as CurrencyKey;
      if (balances[c]) {
        balances[c].ahorros += Number(item.importe);
      }
    });

    currencies.forEach((c) => {
      // Net balance = Ingresos - Gastos + Ahorros
      balances[c].net = balances[c].ingresos - balances[c].gastos + balances[c].ahorros;
    });

    return NextResponse.json({
      interfaceId: String(interfaceId),
      balances,
    });
  } catch (err: unknown) {
    console.error('[API /api/interfaces/[id]/balance GET Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
