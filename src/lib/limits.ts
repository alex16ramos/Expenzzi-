import { prisma } from '@/lib/db';

/**
 * Calculates current period expense consumption for categories in an interface that have limits.
 * Handles Semanal, Mensual, Trimestral, and Anual periods, converting expense currencies
 * to category limit currencies using the latest available exchange rates.
 */
export async function getCategoryLimitUsageMap(interfaceId: bigint): Promise<Map<string, number>> {
  const map = new Map<string, number>();

  try {
    const categoriesWithLimits = await prisma.categoria.findMany({
      where: {
        idinterfazoperacion: interfaceId,
        estado: true,
        estadolimite: true,
      },
    });

    if (categoriesWithLimits.length === 0) {
      return map;
    }

    const catIds = categoriesWithLimits.map((c) => c.idcategoria);

    const expenses = await prisma.gasto.findMany({
      where: {
        idcategoria: { in: catIds },
        estado: true,
      },
      include: {
        categoria: true,
      },
    });

    const latestCambio = await prisma.cambio.findFirst({
      orderBy: { idcambio: 'desc' },
    });

    const now = new Date();

    for (const g of expenses) {
      if (!g.idcategoria || !g.categoria) continue;
      const catId = String(g.idcategoria);
      const limitMoneda = g.categoria.moneda || 'ARS';
      const period = g.categoria.periodoaplicacion || 'Mensual';

      const gDate = new Date(g.fecha);
      let inPeriod = false;

      if (period === 'Semanal') {
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        inPeriod = gDate >= startOfWeek;
      } else if (period === 'Mensual') {
        inPeriod = gDate.getFullYear() === now.getFullYear() && gDate.getMonth() === now.getMonth();
      } else if (period === 'Trimestral') {
        const currentQ = Math.floor(now.getMonth() / 3);
        const gQ = Math.floor(gDate.getMonth() / 3);
        inPeriod = gDate.getFullYear() === now.getFullYear() && gQ === currentQ;
      } else if (period === 'Anual') {
        inPeriod = gDate.getFullYear() === now.getFullYear();
      }

      if (inPeriod) {
        let val = Number(g.importe);
        if (g.moneda !== limitMoneda) {
          if (latestCambio) {
            const usdArs = Number(latestCambio.cambiousdars) || 1000;
            const usdUyu = Number(latestCambio.cambiousduyu) || 40;
            const uyuArs = Number(latestCambio.cambiouyuars) || 25;

            if (g.moneda === 'USD' && limitMoneda === 'ARS') val *= usdArs;
            else if (g.moneda === 'ARS' && limitMoneda === 'USD') val /= usdArs;
            else if (g.moneda === 'UYU' && limitMoneda === 'ARS') val *= uyuArs;
            else if (g.moneda === 'ARS' && limitMoneda === 'UYU') val /= uyuArs;
            else if (g.moneda === 'USD' && limitMoneda === 'UYU') val *= usdUyu;
            else if (g.moneda === 'UYU' && limitMoneda === 'USD') val /= usdUyu;
          } else {
            if (g.moneda === 'USD' && limitMoneda === 'ARS') val *= 1000;
            else if (g.moneda === 'ARS' && limitMoneda === 'USD') val /= 1000;
            else if (g.moneda === 'UYU' && limitMoneda === 'ARS') val *= 25;
            else if (g.moneda === 'ARS' && limitMoneda === 'UYU') val /= 25;
            else if (g.moneda === 'USD' && limitMoneda === 'UYU') val *= 40;
            else if (g.moneda === 'UYU' && limitMoneda === 'USD') val /= 40;
          }
        }
        map.set(catId, (map.get(catId) || 0) + val);
      }
    }
  } catch (err) {
    console.error('Error calculating category limit usage:', err);
  }

  return map;
}

