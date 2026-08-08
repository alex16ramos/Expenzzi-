import { IExchangeRateProvider } from './ports/exchange-rate-provider.interface';
import { DolarApiExchangeRateProvider } from './adapters/dolar-api.adapter';
import { CurrencyLayerExchangeRateProvider } from './adapters/currency-layer.adapter';
import { ExchangeRateService } from './exchange-rate.service';

/**
 * Retorna una instancia de IExchangeRateProvider según la configuración del entorno.
 * Soporta 'dolarapi' y 'currencylayer'. Por defecto utiliza 'dolarapi'.
 */
export function createExchangeRateProvider(providerType?: string): IExchangeRateProvider {
  const type = (providerType || process.env.EXCHANGE_RATE_PROVIDER || 'dolarapi').toLowerCase();

  switch (type) {
    case 'currencylayer':
      return new CurrencyLayerExchangeRateProvider();
    case 'dolarapi':
    default:
      return new DolarApiExchangeRateProvider();
  }
}

/**
 * Instancia singleton global por defecto del servicio ExchangeRateService.
 */
export const defaultExchangeRateService = new ExchangeRateService(createExchangeRateProvider());
