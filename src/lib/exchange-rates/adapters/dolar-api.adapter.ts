import { IExchangeRateProvider } from '../ports/exchange-rate-provider.interface';
import { ProviderRates } from '../types';
import { ExchangeRateNetworkError, ExchangeRateInvalidResponseError } from '../errors';

export interface DolarApiConfig {
  baseUrl?: string;
  timeoutMs?: number;
}

export class DolarApiExchangeRateProvider implements IExchangeRateProvider {
  public readonly name = 'DolarApi';
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(config: DolarApiConfig = {}) {
    this.baseUrl = config.baseUrl || 'https://dolarapi.com/v1';
    this.timeoutMs = config.timeoutMs || 4000;
  }

  async getRates(): Promise<ProviderRates> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const [resBlue, resOficial, resUyu] = await Promise.all([
        fetch(`${this.baseUrl}/dolares/blue`, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Expenzzi-App/1.0' },
        }),
        fetch(`${this.baseUrl}/dolares/oficial`, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Expenzzi-App/1.0' },
        }),
        fetch(`${this.baseUrl}/cotizaciones/uyu`, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Expenzzi-App/1.0' },
        }),
      ]);

      clearTimeout(timeoutId);

      if (!resBlue.ok || !resOficial.ok || !resUyu.ok) {
        throw new ExchangeRateInvalidResponseError(
          this.name,
          `HTTP status: Blue=${resBlue.status}, Oficial=${resOficial.status}, Uyu=${resUyu.status}`
        );
      }

      const dataBlue = await resBlue.json();
      const dataOficial = await resOficial.json();
      const dataUyu = await resUyu.json();

      const usdars = Number(dataBlue?.venta);
      const usdarsOficial = Number(dataOficial?.venta);
      const usduyu = Number(dataUyu?.venta);

      if (isNaN(usdars) || isNaN(usduyu) || usdars <= 0 || usduyu <= 0) {
        throw new ExchangeRateInvalidResponseError(
          this.name,
          'Valores devueltos inválidos o menores o iguales a cero'
        );
      }

      return {
        usdars,
        usdarsOficial: isNaN(usdarsOficial) ? undefined : usdarsOficial,
        usduyu,
      };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof ExchangeRateInvalidResponseError) {
        throw err;
      }
      throw new ExchangeRateNetworkError(this.name, err);
    }
  }
}
