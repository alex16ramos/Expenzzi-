import { ProviderRates } from '../types';

export interface IExchangeRateProvider {
  /**
   * Nombre identificador del proveedor (ej. 'DolarApi', 'CurrencyLayer', 'Fake')
   */
  readonly name: string;

  /**
   * Obtiene las cotizaciones más recientes en formato crudo del dominio (usdars, usdarsOficial, usduyu)
   */
  getRates(): Promise<ProviderRates>;
}
