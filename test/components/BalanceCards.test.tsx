import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BalanceCards, GeneralBalances } from '@/components/interface/BalanceCards';

describe('BalanceCards Component - AAA Unit Tests', () => {
  const mockBalances: GeneralBalances = {
    ARS: { net: 15000, gastos: 5000, ingresos: 20000, ahorros: 0 },
    USD: { net: 200, gastos: 50, ingresos: 250, ahorros: 0 },
    UYU: { net: 0, gastos: 0, ingresos: 0, ahorros: 0 },
  };

  it('debe renderizar el balance neto en ARS por defecto', () => {
    // Arrange
    const onCurrencySelectMock = vi.fn();

    // Act
    render(
      <BalanceCards
        balances={mockBalances}
        selectedCurrency="ARS"
        onCurrencySelect={onCurrencySelectMock}
      />
    );

    // Assert
    expect(screen.getByText(/15\.000/)).toBeInTheDocument();
  });

  it('debe invocar onCurrencySelect al hacer clic en otra solapa de moneda', () => {
    // Arrange
    const onCurrencySelectMock = vi.fn();
    render(
      <BalanceCards
        balances={mockBalances}
        selectedCurrency="ARS"
        onCurrencySelect={onCurrencySelectMock}
      />
    );

    // Act
    const usdButton = screen.getByRole('button', { name: /USD/i });
    fireEvent.click(usdButton);

    // Assert
    expect(onCurrencySelectMock).toHaveBeenCalledWith('USD');
  });
});
