import { IExchangeRateProvider } from '../ports/exchange-rate-provider.interface';
import { ProviderRates } from '../types';
import { ExchangeRateNetworkError, ExchangeRateInvalidResponseError } from '../errors';

export interface CurrencyLayerConfig {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
}

export class CurrencyLayerExchangeRateProvider implements IExchangeRateProvider {
  public readonly name = 'CurrencyLayer';
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(config: CurrencyLayerConfig = {}) {
    this.apiKey = config.apiKey || process.env.KEY_API_MONEDA_CAMBIO || '';
    this.baseUrl = config.baseUrl || 'http://apilayer.net/api';
    this.timeoutMs = config.timeoutMs || 5000;
  }

  async getRates(): Promise<ProviderRates> {
    if (!this.apiKey) {
      throw new ExchangeRateInvalidResponseError(this.name, 'API Key (KEY_API_MONEDA_CAMBIO) no configurada');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const url = `${this.baseUrl}/live?access_key=${encodeURIComponent(this.apiKey)}&currencies=USD,UYU,ARS&source=USD&format=1`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new ExchangeRateInvalidResponseError(this.name, `HTTP status ${res.status}`);
      }

      const data = await res.json();
      if (!data.success || !data.quotes) {
        throw new ExchangeRateInvalidResponseError(
          this.name,
          data.error?.info || 'Respuesta no exitosa de CurrencyLayer'
        );
      }

      const usdars = Number(data.quotes['USDARS']);
      const usduyu = Number(data.quotes['USDUYU']);

      if (isNaN(usdars) || isNaN(usduyu) || usdars <= 0 || usduyu <= 0) {
        throw new ExchangeRateInvalidResponseError(this.name, 'Cotizaciones incompletas o inválidas en respuesta');
      }

      return {
        usdars,
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
