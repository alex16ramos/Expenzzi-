import { describe, it, expect, vi } from 'vitest';

// Mock DB module before importing exchange-rate
vi.mock('@/lib/db', () => ({
  prisma: {
    cambio: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { convertCurrency, ExchangeRates } from '@/lib/exchange-rate';

describe('exchange-rate - AAA Unit Tests', () => {
  const mockRates: ExchangeRates = {
    usdars: 1000,
    usdarsOficial: 900,
    usduyu: 40,
    arsusd: 1 / 1000,
    arsuyu: 40 / 1000,
    uyuusd: 1 / 40,
    uyuars: 1000 / 40,
  };

  it('debe retornar el mismo importe si la moneda origen y destino son iguales', () => {
    // Arrange
    const amount = 500;
    const currency = 'ARS';

    // Act
    const result = convertCurrency(amount, currency, currency, mockRates);

    // Assert
    expect(result).toBe(500);
  });

  it('debe convertir correctamente de ARS a USD', () => {
    // Arrange
    const amountInARS = 5000;

    // Act
    const resultInUSD = convertCurrency(amountInARS, 'ARS', 'USD', mockRates);

    // Assert
    expect(resultInUSD).toBe(5);
  });

  it('debe convertir correctamente de USD a ARS', () => {
    // Arrange
    const amountInUSD = 10;

    // Act
    const resultInARS = convertCurrency(amountInUSD, 'USD', 'ARS', mockRates);

    // Assert
    expect(resultInARS).toBe(10000);
  });

  it('debe convertir correctamente de USD a UYU', () => {
    // Arrange
    const amountInUSD = 2;

    // Act
    const resultInUYU = convertCurrency(amountInUSD, 'USD', 'UYU', mockRates);

    // Assert
    expect(resultInUYU).toBe(80);
  });

  it('debe priorizar snapshotRate si está presente al convertir de ARS a USD', () => {
    // Arrange
    const amountInARS = 2000;
    const snapshotRate = 2000;

    // Act
    const result = convertCurrency(amountInARS, 'ARS', 'USD', mockRates, snapshotRate);

    // Assert
    expect(result).toBe(1);
  });
});
