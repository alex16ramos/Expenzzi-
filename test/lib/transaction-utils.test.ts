import { describe, it, expect } from 'vitest';
import { getCategoryIconAndStyle } from '@/components/interface/transaction-utils';

describe('transaction-utils - AAA Unit Tests', () => {
  it('debe retornar estilo de Ingreso cuando el tipo es ingreso', () => {
    // Arrange
    const category = 'Venta';
    const type = 'Ingreso';

    // Act
    const result = getCategoryIconAndStyle(category, type);

    // Assert
    expect(result.sign).toBe('+');
    expect(result.text).toContain('text-emerald');
  });

  it('debe retornar estilo de Ahorro cuando el tipo es ahorro', () => {
    // Arrange
    const category = 'Meta 2026';
    const type = 'Ahorro';

    // Act
    const result = getCategoryIconAndStyle(category, type);

    // Assert
    expect(result.sign).toBe('');
    expect(result.text).toContain('text-amber');
  });

  it('debe identificar categorías de supermercado o alimentos', () => {
    // Arrange
    const category = 'Supermercado Coto';
    const type = 'Gasto';

    // Act
    const result = getCategoryIconAndStyle(category, type);

    // Assert
    expect(result.sign).toBe('-');
    expect(result.bg).toContain('bg-indigo');
  });

  it('debe identificar categorías de transporte o combustible', () => {
    // Arrange
    const category = 'Nafta YPF';

    // Act
    const result = getCategoryIconAndStyle(category, 'Gasto');

    // Assert
    expect(result.sign).toBe('-');
    expect(result.bg).toContain('bg-purple');
  });

  it('debe retornar icono por defecto de gasto para categorías genéricas', () => {
    // Arrange
    const category = 'Varios no especificado';

    // Act
    const result = getCategoryIconAndStyle(category, 'Gasto');

    // Assert
    expect(result.sign).toBe('-');
    expect(result.bg).toContain('bg-rose');
  });
});
