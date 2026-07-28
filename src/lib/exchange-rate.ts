import { prisma } from './db';

export interface ExchangeRates {
  usdars: number; // Dólar Blue (DolarHoy)
  usdarsOficial: number; // Dólar Oficial (BCRA)
  usduyu: number;
  arsusd: number;
  arsuyu: number;
  uyuusd: number;
  uyuars: number;
}

// Default fallback rates (DolarHoy Blue & Oficial) if external API or database is unreachable
const DEFAULT_RATES: ExchangeRates = {
  usdars: 1380,
  usdarsOficial: 1120,
  usduyu: 40.5,
  arsusd: 1 / 1380,
  arsuyu: 40.5 / 1380,
  uyuusd: 1 / 40.5,
  uyuars: 1380 / 40.5,
};

// In-memory cache for historical exchange rates by YYYY-MM-DD
const dateRatesCache = new Map<string, ExchangeRates>();

/**
 * Retrieves exchange rates for a specific historical date (or today).
 * Searches PostgreSQL `cambio` table first. If missing for today, fetches real-time DolarHoy rates.
 */
export async function getExchangeRatesForDate(targetDate?: Date | string | null): Promise<ExchangeRates> {
  try {
    const d = targetDate ? new Date(targetDate) : new Date();
    d.setHours(0, 0, 0, 0);
    const dateStr = d.toISOString().split('T')[0];

    // 1. Check in-memory cache
    if (dateRatesCache.has(dateStr)) {
      return dateRatesCache.get(dateStr)!;
    }

    // 2. Check database for exact or closest prior date
    const dbRecord = await prisma.cambio.findFirst({
      where: {
        fecha: {
          lte: d,
        },
      },
      orderBy: { fecha: 'desc' },
    });

    if (dbRecord) {
      const usdars = Number(dbRecord.cambiousdars || DEFAULT_RATES.usdars);
      const usduyu = Number(dbRecord.cambiousduyu || DEFAULT_RATES.usduyu);
      const rates: ExchangeRates = {
        usdars,
        usdarsOficial: DEFAULT_RATES.usdarsOficial,
        usduyu,
        arsusd: 1 / usdars,
        arsuyu: usduyu / usdars,
        uyuusd: 1 / usduyu,
        uyuars: usdars / usduyu,
      };
      if (dateRatesCache.size >= 100) {
        const firstKey = dateRatesCache.keys().next().value;
        if (firstKey) dateRatesCache.delete(firstKey);
      }
      dateRatesCache.set(dateStr, rates);
      return rates;
    }

    // 3. If today or future date and not in DB, fetch fresh from DolarApi.com
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateStr >= todayStr) {
      return await getTodayExchangeRates();
    }

    // Fallback for past dates without DB records
    if (dateRatesCache.size >= 100) {
      const firstKey = dateRatesCache.keys().next().value;
      if (firstKey) dateRatesCache.delete(firstKey);
    }
    dateRatesCache.set(dateStr, DEFAULT_RATES);
    return DEFAULT_RATES;
  } catch (err) {
    console.error('[getExchangeRatesForDate Error]:', err);
    return DEFAULT_RATES;
  }
}

/**
 * Retrieves today's exchange rates using DolarApi.com (DolarHoy real-time rates).
 * Checks PostgreSQL `cambio` table first (1 API fetch per day total).
 */
export async function getTodayExchangeRates(): Promise<ExchangeRates> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    if (dateRatesCache.has(todayStr)) {
      return dateRatesCache.get(todayStr)!;
    }

    // 1. Check database cache for today's rate
    const existingCambio = await prisma.cambio.findFirst({
      where: {
        fecha: {
          gte: today,
        },
      },
      orderBy: { idcambio: 'desc' },
    });

    if (existingCambio) {
      const usdars = Number(existingCambio.cambiousdars || DEFAULT_RATES.usdars);
      const usduyu = Number(existingCambio.cambiousduyu || DEFAULT_RATES.usduyu);
      const rates: ExchangeRates = {
        usdars,
        usdarsOficial: DEFAULT_RATES.usdarsOficial,
        usduyu,
        arsusd: 1 / usdars,
        arsuyu: usduyu / usdars,
        uyuusd: 1 / usduyu,
        uyuars: usdars / usduyu,
      };
      dateRatesCache.set(todayStr, rates);
      return rates;
    }

    // 2. Fetch real-time Dólar Blue & Dólar Oficial from DolarApi.com (DolarHoy)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    let usdars = DEFAULT_RATES.usdars;
    let usdarsOficial = DEFAULT_RATES.usdarsOficial;
    let usduyu = DEFAULT_RATES.usduyu;

    try {
      const [resBlue, resOficial, resUyu] = await Promise.all([
        fetch('https://dolarapi.com/v1/dolares/blue', {
          signal: controller.signal,
          headers: { 'User-Agent': 'Expenzzi-App/1.0' },
        }),
        fetch('https://dolarapi.com/v1/dolares/oficial', {
          signal: controller.signal,
          headers: { 'User-Agent': 'Expenzzi-App/1.0' },
        }),
        fetch('https://dolarapi.com/v1/cotizaciones/uyu', {
          signal: controller.signal,
          headers: { 'User-Agent': 'Expenzzi-App/1.0' },
        }),
      ]);

      clearTimeout(timeoutId);

      if (resBlue.ok) {
        const dataBlue = await resBlue.json();
        if (dataBlue && dataBlue.venta) {
          usdars = Number(dataBlue.venta);
        }
      }

      if (resOficial.ok) {
        const dataOficial = await resOficial.json();
        if (dataOficial && dataOficial.venta) {
          usdarsOficial = Number(dataOficial.venta);
        }
      }

      if (resUyu.ok) {
        const dataUyu = await resUyu.json();
        if (dataUyu && dataUyu.venta) {
          usduyu = Number(dataUyu.venta);
        }
      }
    } catch {
      clearTimeout(timeoutId);
    }

    // 3. Persist today's rates into PostgreSQL `cambio` table
    const created = await prisma.cambio.create({
      data: {
        fecha: today,
        cambiousdars: usdars,
        cambiousduyu: usduyu,
        cambioarsusd: 1 / usdars,
        cambiouyuusd: 1 / usduyu,
        cambioarsuyu: usduyu / usdars,
        cambiouyuars: usdars / usduyu,
      },
    });

    const finalUsdArs = Number(created.cambiousdars || usdars);
    const finalUsdUyu = Number(created.cambiousduyu || usduyu);

    const rates: ExchangeRates = {
      usdars: finalUsdArs,
      usdarsOficial,
      usduyu: finalUsdUyu,
      arsusd: 1 / finalUsdArs,
      arsuyu: finalUsdUyu / finalUsdArs,
      uyuusd: 1 / finalUsdUyu,
      uyuars: finalUsdArs / finalUsdUyu,
    };

    dateRatesCache.set(todayStr, rates);
    return rates;
  } catch (err) {
    console.error('[ExchangeRates Error]:', err);
    return DEFAULT_RATES;
  }
}

/**
 * Converts an amount from sourceCurrency to targetCurrency using current/given rates or a row snapshot rate.
 */
export function convertCurrency(
  amount: number,
  sourceCurrency: 'ARS' | 'USD' | 'UYU',
  targetCurrency: 'ARS' | 'USD' | 'UYU',
  rates: ExchangeRates,
  snapshotRate?: number | null
): number {
  if (sourceCurrency === targetCurrency) return amount;

  const usdarsRate = snapshotRate && snapshotRate > 0 ? Number(snapshotRate) : rates.usdars;
  const arsusdRate = 1 / usdarsRate;

  if (sourceCurrency === 'ARS') {
    if (targetCurrency === 'USD') return amount * arsusdRate;
    if (targetCurrency === 'UYU') return amount * (rates.usduyu / usdarsRate);
  }

  if (sourceCurrency === 'USD') {
    if (targetCurrency === 'ARS') return amount * usdarsRate;
    if (targetCurrency === 'UYU') return amount * rates.usduyu;
  }

  if (sourceCurrency === 'UYU') {
    if (targetCurrency === 'ARS') return amount * (usdarsRate / rates.usduyu);
    if (targetCurrency === 'USD') return amount * rates.uyuusd;
  }

  return amount;
}
