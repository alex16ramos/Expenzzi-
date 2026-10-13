import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExchangeRateService } from '@/lib/exchange-rates/exchange-rate.service';
import { FakeExchangeRateProvider } from '@/lib/exchange-rates/adapters/fake-exchange-rate.adapter';
import { prisma } from '@/lib/db';

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    cambio: {
      findFirst: vi.fn(),
      create: vi.fn().mockImplementation((args) => Promise.resolve({
        cambiousdars: args.data.cambiousdars,
        cambiousduyu: args.data.cambiousduyu,
      })),
    },
  },
}));

describe('ExchangeRateService - Pruebas de Desacoplamiento y SOLID', () => {
  let fakeProvider: FakeExchangeRateProvider;
  let service: ExchangeRateService;

  beforeEach(() => {
    vi.mocked(prisma.cambio.findFirst).mockResolvedValue(null);
    fakeProvider = new FakeExchangeRateProvider({
      usdars: 1400,
      usdarsOficial: 1150,
      usduyu: 41.0,
    });
    service = new ExchangeRateService(fakeProvider);
  });

  it('debe utilizar el proveedor inyectado (FakeProvider) sin realizar peticiones HTTP reales', async () => {
    const rates = await service.getTodayExchangeRates();

    expect(service.getProvider().name).toBe('FakeProvider');
    expect(rates.usdars).toBe(1400);
    expect(rates.usdarsOficial).toBe(1150);
    expect(rates.usduyu).toBe(41.0);
    expect(rates.arsusd).toBeCloseTo(1 / 1400);
    expect(rates.arsuyu).toBeCloseTo(41.0 / 1400);
  });

  it('debe permitir cambiar de proveedor (DIP y OCP) sin modificar la lógica de negocio del servicio', async () => {
    const customProvider = new FakeExchangeRateProvider({
      usdars: 1500,
      usdarsOficial: 1200,
      usduyu: 42.0,
    });
    const customService = new ExchangeRateService(customProvider);

    const rates = await customService.getTodayExchangeRates();
    expect(rates.usdars).toBe(1500);
    expect(rates.usduyu).toBe(42.0);
  });

  it('debe realizar conversiones de divisas correctamente con las tasas calculadas', () => {
    const rates = {
      usdars: 1000,
      usdarsOficial: 900,
      usduyu: 40,
      arsusd: 1 / 1000,
      arsuyu: 40 / 1000,
      uyuusd: 1 / 40,
      uyuars: 1000 / 40,
    };

    // USD -> ARS
    expect(service.convertCurrency(10, 'USD', 'ARS', rates)).toBe(10000);
    // ARS -> USD
    expect(service.convertCurrency(10000, 'ARS', 'USD', rates)).toBe(10);
    // USD -> UYU
    expect(service.convertCurrency(10, 'USD', 'UYU', rates)).toBe(400);
    // UYU -> ARS
    expect(service.convertCurrency(40, 'UYU', 'ARS', rates)).toBe(1000);
  });

  it('debe manejar fallas del proveedor utilizando fallbacks de forma segura', async () => {
    fakeProvider.setShouldFail(true);
    const rates = await service.getTodayExchangeRates();

    expect(rates.usdars).toBeGreaterThan(0);
    expect(rates.usduyu).toBeGreaterThan(0);
  });
});
