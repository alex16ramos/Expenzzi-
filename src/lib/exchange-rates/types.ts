export type Currency = 'ARS' | 'USD' | 'UYU';

export interface ProviderRates {
  usdars: number;
  usdarsOficial?: number;
  usduyu: number;
}

export interface ExchangeRates {
  usdars: number;
  usdarsOficial: number;
  usduyu: number;
  arsusd: number;
  arsuyu: number;
  uyuusd: number;
  uyuars: number;
}

export const DEFAULT_RATES: ExchangeRates = {
  usdars: 1380,
  usdarsOficial: 1120,
  usduyu: 40.5,
  arsusd: 1 / 1380,
  arsuyu: 40.5 / 1380,
  uyuusd: 1 / 40.5,
  uyuars: 1380 / 40.5,
};
