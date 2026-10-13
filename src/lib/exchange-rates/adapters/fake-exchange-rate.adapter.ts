import { IExchangeRateProvider } from '../ports/exchange-rate-provider.interface';
import { ProviderRates } from '../types';

export class FakeExchangeRateProvider implements IExchangeRateProvider {
  public readonly name = 'FakeProvider';
  private rates: ProviderRates;
  private shouldFail: boolean;

  constructor(
    initialRates: ProviderRates = { usdars: 1400, usdarsOficial: 1150, usduyu: 41.0 },
    shouldFail = false
  ) {
    this.rates = initialRates;
    this.shouldFail = shouldFail;
  }

  public setRates(rates: ProviderRates): void {
    this.rates = rates;
  }

  public setShouldFail(fail: boolean): void {
    this.shouldFail = fail;
  }

  async getRates(): Promise<ProviderRates> {
    if (this.shouldFail) {
      throw new Error('Fake provider simulated failure');
    }
    return { ...this.rates };
  }
}
