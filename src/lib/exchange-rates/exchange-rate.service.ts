import { prisma } from '../db';
import { IExchangeRateProvider } from './ports/exchange-rate-provider.interface';
import { Currency, ExchangeRates, DEFAULT_RATES } from './types';

export class ExchangeRateService {
  private readonly dateRatesCache = new Map<string, ExchangeRates>();

  constructor(private readonly provider: IExchangeRateProvider) {}

  /**
   * Retorna el proveedor de cotizaciones inyectado en el servicio.
   */
  public getProvider(): IExchangeRateProvider {
    return this.provider;
  }

  /**
   * Obtiene cotizaciones para una fecha histórica específica (o el día de hoy si se omite).
   * 1. Consulta el caché en memoria.
   * 2. Consulta la base de datos PostgreSQL `cambio` por la fecha más cercana menor o igual.
   * 3. Si la fecha es de hoy/futuro y no está en BD, obtiene cotizaciones frescas del proveedor inyectado.
   */
  async getExchangeRatesForDate(targetDate?: Date | string | null): Promise<ExchangeRates> {
    try {
      let d = targetDate ? new Date(targetDate) : new Date();
      if (isNaN(d.getTime())) {
        d = new Date();
      }
      d.setHours(0, 0, 0, 0);
      const dateStr = d.toISOString().split('T')[0];

      // 1. Check in-memory cache
      if (this.dateRatesCache.has(dateStr)) {
        return this.dateRatesCache.get(dateStr)!;
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
        const rates: ExchangeRates = this.buildExchangeRates(usdars, DEFAULT_RATES.usdarsOficial, usduyu);
        this.cacheRate(dateStr, rates);
        return rates;
      }

      // 3. If today or future date and not in DB, fetch fresh
      const todayStr = new Date().toISOString().split('T')[0];
      if (dateStr >= todayStr) {
        return await this.getTodayExchangeRates();
      }

      // Fallback for past dates without DB records
      this.cacheRate(dateStr, DEFAULT_RATES);
      return DEFAULT_RATES;
    } catch (err) {
      console.error('[ExchangeRateService.getExchangeRatesForDate Error]:', err);
      return DEFAULT_RATES;
    }
  }

  /**
   * Obtiene las cotizaciones del día de hoy usando el IExchangeRateProvider inyectado.
   * Revisa la tabla `cambio` antes de consultar la API externa (1 fetch por día).
   */
  async getTodayExchangeRates(): Promise<ExchangeRates> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      if (this.dateRatesCache.has(todayStr)) {
        return this.dateRatesCache.get(todayStr)!;
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
        const rates = this.buildExchangeRates(usdars, DEFAULT_RATES.usdarsOficial, usduyu);
        this.dateRatesCache.set(todayStr, rates);
        return rates;
      }

      // 2. Fetch fresh rates from injected provider
      let usdars = DEFAULT_RATES.usdars;
      let usdarsOficial = DEFAULT_RATES.usdarsOficial;
      let usduyu = DEFAULT_RATES.usduyu;

      try {
        const providerRates = await this.provider.getRates();
        usdars = providerRates.usdars;
        if (providerRates.usdarsOficial) usdarsOficial = providerRates.usdarsOficial;
        usduyu = providerRates.usduyu;
      } catch (providerErr) {
        console.warn(`[ExchangeRateService] Falla al obtener tasas de ${this.provider.name}:`, providerErr);
      }

      // 3. Persist today's rates into PostgreSQL `cambio` table
      let finalUsdArs = usdars;
      let finalUsdUyu = usduyu;

      try {
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
        if (created.cambiousdars) finalUsdArs = Number(created.cambiousdars);
        if (created.cambiousduyu) finalUsdUyu = Number(created.cambiousduyu);
      } catch (dbErr) {
        console.warn('[ExchangeRateService] DB insert skipped due to policy or duplicate:', (dbErr as Error)?.message || dbErr);
      }

      const rates = this.buildExchangeRates(finalUsdArs, usdarsOficial, finalUsdUyu);
      this.dateRatesCache.set(todayStr, rates);
      return rates;
    } catch (err) {
      console.error('[ExchangeRateService.getTodayExchangeRates Error]:', err);
      return DEFAULT_RATES;
    }
  }

  /**
   * Convierte un monto entre dos monedas utilizando las tasas provistas.
   */
  convertCurrency(
    amount: number,
    sourceCurrency: Currency,
    targetCurrency: Currency,
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

  private buildExchangeRates(usdars: number, usdarsOficial: number, usduyu: number): ExchangeRates {
    return {
      usdars,
      usdarsOficial,
      usduyu,
      arsusd: 1 / usdars,
      arsuyu: usduyu / usdars,
      uyuusd: 1 / usduyu,
      uyuars: usdars / usduyu,
    };
  }

  private cacheRate(key: string, rates: ExchangeRates): void {
    if (this.dateRatesCache.size >= 100) {
      const firstKey = this.dateRatesCache.keys().next().value;
      if (firstKey) this.dateRatesCache.delete(firstKey);
    }
    this.dateRatesCache.set(key, rates);
  }
}
