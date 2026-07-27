import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { TMoneda } from '@prisma/client';

export const dynamic = 'force-dynamic';

const getArsEquivalent = (importe: number, curr: string) => {
  if (curr === 'USD') return importe * 1100;
  if (curr === 'UYU') return importe * 28;
  return importe;
};

const MONTH_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

async function getUserIdFromSession(): Promise<string | null> {
  try {
    const session = await auth.getSession();
    const sessObj = session as unknown as Record<string, unknown>;
    const dataObj = sessObj?.data as Record<string, unknown> | undefined;
    const userObj = (dataObj?.user || sessObj?.user) as Record<string, unknown> | undefined;
    return ((userObj?.id || userObj?.idusuario || userObj?.userId) as string) || null;
  } catch {
    return null;
  }
}

/**
 * GET /api/interfaces/[id]/reportes
 * Statistical & comparative analytics endpoint for RF13 & RF14.
 *
 * Query Params:
 *  - year: Selected target year (default: current year)
 *  - compareYear: Comparative year (default: target year - 1)
 *  - categoryId: Optional category ID filter
 *  - moneda: Optional currency filter ('ARS' | 'USD' | 'UYU' | 'ALL')
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

    const { searchParams } = new URL(req.url);
    const currentYearNum = new Date().getFullYear();
    const year = parseInt(searchParams.get('year') || String(currentYearNum), 10);
    const compareYear = parseInt(searchParams.get('compareYear') || String(year - 1), 10);
    const categoryId = searchParams.get('categoryId');
    const moneda = searchParams.get('moneda');

    // Base filter clause for active expenses in this interface
    const baseWhere: Record<string, unknown> = {
      estado: true,
      OR: [
        { categoria: { idinterfazoperacion: interfaceId } },
        { submetodopago: { idinterfazoperacion: interfaceId } },
      ],
    };

    const andConditions: Record<string, unknown>[] = [];

    if (categoryId && categoryId !== 'all') {
      andConditions.push({ idcategoria: BigInt(categoryId) });
    }

    if (moneda && ['ARS', 'USD', 'UYU'].includes(moneda)) {
      andConditions.push({ moneda: moneda as TMoneda });
    }

    if (andConditions.length > 0) {
      baseWhere.AND = andConditions;
    }

    // Fetch expenses for both target year and comparative year
    const startDate = new Date(Math.min(year, compareYear), 0, 1);
    const endDate = new Date(Math.max(year, compareYear), 11, 31, 23, 59, 59);

    const gastos = await prisma.gasto.findMany({
      where: {
        ...baseWhere,
        fecha: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        categoria: true,
      },
      orderBy: { fecha: 'asc' },
    });

    const monthlyDataTarget = Array(12).fill(0);
    const monthlyDataCompare = Array(12).fill(0);
    const categoryTotalsMap: Record<string, { id: string; name: string; total: number; count: number }> = {};

    let totalTarget = 0;
    let totalCompare = 0;
    let recordCountTarget = 0;

    gastos.forEach((g) => {
      const gDate = new Date(g.fecha);
      const gYear = gDate.getFullYear();
      const gMonth = gDate.getMonth();
      const rawImporte = Number(g.importe || 0);
      const amount = (moneda && moneda !== 'ALL') ? rawImporte : getArsEquivalent(rawImporte, g.moneda);

      if (gYear === year) {
        monthlyDataTarget[gMonth] += amount;
        totalTarget += amount;
        recordCountTarget += 1;

        // Category breakdown for selected target year
        const catId = g.idcategoria ? String(g.idcategoria) : 'sin_cat';
        const catName = g.categoria?.nombre || 'Sin categoría';

        if (!categoryTotalsMap[catId]) {
          categoryTotalsMap[catId] = {
            id: catId,
            name: catName,
            total: 0,
            count: 0,
          };
        }
        categoryTotalsMap[catId].total += amount;
        categoryTotalsMap[catId].count += 1;
      } else if (gYear === compareYear) {
        monthlyDataCompare[gMonth] += amount;
        totalCompare += amount;
      }
    });

    // Format monthly comparative payload
    const monthlyEvolution = MONTH_NAMES.map((name, idx) => ({
      monthIndex: idx,
      monthName: name,
      targetAmount: Math.round(monthlyDataTarget[idx] * 100) / 100,
      compareAmount: Math.round(monthlyDataCompare[idx] * 100) / 100,
      diffAmount: Math.round((monthlyDataTarget[idx] - monthlyDataCompare[idx]) * 100) / 100,
      diffPercent:
        monthlyDataCompare[idx] > 0
          ? Math.round(((monthlyDataTarget[idx] - monthlyDataCompare[idx]) / monthlyDataCompare[idx]) * 1000) / 10
          : monthlyDataTarget[idx] > 0 ? 100 : 0,
    }));

    // Find peak month for target year
    let maxMonthName = '-';
    let maxMonthAmount = 0;
    monthlyEvolution.forEach((item) => {
      if (item.targetAmount > maxMonthAmount) {
        maxMonthAmount = item.targetAmount;
        maxMonthName = item.monthName;
      }
    });

    // Calculate interannual total variation
    const yearVariationPercent =
      totalCompare > 0
        ? Math.round(((totalTarget - totalCompare) / totalCompare) * 1000) / 10
        : totalTarget > 0 ? 100 : 0;

    const monthlyAverage = Math.round((totalTarget / 12) * 100) / 100;

    // Convert category map to sorted array
    const categoryBreakdown = Object.values(categoryTotalsMap)
      .map((cat) => ({
        ...cat,
        total: Math.round(cat.total * 100) / 100,
        percentage: totalTarget > 0 ? Math.round((cat.total / totalTarget) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({
      success: true,
      params: {
        year,
        compareYear,
        categoryId: categoryId || 'all',
        moneda: moneda || 'ALL',
      },
      summary: {
        totalTarget: Math.round(totalTarget * 100) / 100,
        totalCompare: Math.round(totalCompare * 100) / 100,
        monthlyAverage,
        peakMonthName: maxMonthName,
        peakMonthAmount: Math.round(maxMonthAmount * 100) / 100,
        yearVariationPercent,
        recordCountTarget,
      },
      monthlyEvolution,
      categoryBreakdown,
    });
  } catch (err: unknown) {
    console.error('[API /api/interfaces/[id]/reportes GET Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
