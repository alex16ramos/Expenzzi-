import { defaultExchangeRateService } from './exchange-rates/provider.factory';
import { Currency, ExchangeRates, DEFAULT_RATES } from './exchange-rates/types';

export type { Currency, ExchangeRates };
export { DEFAULT_RATES };

/**
 * Fachada de retrocompatibilidad.
 * Obtiene cotizaciones para una fecha histórica específica (o hoy).
 */
export async function getExchangeRatesForDate(targetDate?: Date | string | null): Promise<ExchangeRates> {
  return defaultExchangeRateService.getExchangeRatesForDate(targetDate);
}

/**
 * Fachada de retrocompatibilidad.
 * Obtiene las cotizaciones del día de hoy.
 */
export async function getTodayExchangeRates(): Promise<ExchangeRates> {
  return defaultExchangeRateService.getTodayExchangeRates();
}

/**
 * Fachada de retrocompatibilidad.
 * Convierte un monto entre dos monedas.
 */
export function convertCurrency(
  amount: number,
  sourceCurrency: Currency,
  targetCurrency: Currency,
  rates: ExchangeRates,
  snapshotRate?: number | null
): number {
  return defaultExchangeRateService.convertCurrency(amount, sourceCurrency, targetCurrency, rates, snapshotRate);
}
