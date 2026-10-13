import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DolarApiExchangeRateProvider } from '../adapters/dolar-api.adapter';
import { ExchangeRateInvalidResponseError, ExchangeRateNetworkError } from '../errors';

describe('DolarApiExchangeRateProvider Adapter Tests', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('debe transformar la respuesta de DolarApi a ProviderRates correctamente', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/dolares/blue')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ venta: 1380 }) } as Response);
      }
      if (url.includes('/dolares/oficial')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ venta: 1120 }) } as Response);
      }
      if (url.includes('/cotizaciones/uyu')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ venta: 40.5 }) } as Response);
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const provider = new DolarApiExchangeRateProvider();
    const rates = await provider.getRates();

    expect(rates.usdars).toBe(1380);
    expect(rates.usdarsOficial).toBe(1120);
    expect(rates.usduyu).toBe(40.5);
  });

  it('debe lanzar ExchangeRateInvalidResponseError si la respuesta HTTP es diferente de 200 OK', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const provider = new DolarApiExchangeRateProvider();
    await expect(provider.getRates()).rejects.toThrow(ExchangeRateInvalidResponseError);
  });

  it('debe lanzar ExchangeRateNetworkError en caso de falla de red o abort por timeout', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

    const provider = new DolarApiExchangeRateProvider();
    await expect(provider.getRates()).rejects.toThrow(ExchangeRateNetworkError);
  });
});
