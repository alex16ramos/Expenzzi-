import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { FabButton } from '@/components/interface/FabButton';
import { BalanceCards, GeneralBalances } from '@/components/interface/BalanceCards';

describe('FabButton Role Invariants', () => {
  it('no debe renderizar nada cuando el rol es Visualizador (solo lectura)', () => {
    const { container } = render(
      <FabButton
        onOpenGastoModal={vi.fn()}
        onOpenIngresoModal={vi.fn()}
        onOpenAhorroModal={vi.fn()}
        userRole="Visualizador"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('no debe mostrar la opción Nuevo Ahorro para un usuario con rol Invitado', () => {
    render(
      <FabButton
        onOpenGastoModal={vi.fn()}
        onOpenIngresoModal={vi.fn()}
        onOpenAhorroModal={vi.fn()}
        userRole="Invitado"
      />
    );

    const trigger = screen.getByTitle('Registrar Operación');
    fireEvent.click(trigger);

    expect(screen.getByText('Nuevo Gasto')).toBeInTheDocument();
    expect(screen.getByText('Nuevo Ingreso')).toBeInTheDocument();
    expect(screen.queryByText('Nuevo Ahorro')).not.toBeInTheDocument();
  });

  it('debe mostrar la opción Nuevo Ahorro para un Administrador', () => {
    render(
      <FabButton
        onOpenGastoModal={vi.fn()}
        onOpenIngresoModal={vi.fn()}
        onOpenAhorroModal={vi.fn()}
        userRole="Administrador"
      />
    );

    const trigger = screen.getByTitle('Registrar Operación');
    fireEvent.click(trigger);

    expect(screen.getByText('Nuevo Ahorro')).toBeInTheDocument();
    expect(screen.getByText('Nuevo Gasto')).toBeInTheDocument();
    expect(screen.getByText('Nuevo Ingreso')).toBeInTheDocument();
  });
});

describe('BalanceCards Privacy Mode Invariants', () => {
  const mockBalances: GeneralBalances = {
    ARS: { ingresos: 50000, gastos: 20000, ahorros: 10000, net: 20000 },
    USD: { ingresos: 1000, gastos: 200, ahorros: 300, net: 500 },
    UYU: { ingresos: 40000, gastos: 10000, ahorros: 5000, net: 25000 },
  };

  it('debe permitir ocultar y mostrar los saldos en pantalla', () => {
    render(
      <BalanceCards
        balances={mockBalances}
        selectedCurrency="ARS"
      />
    );

    // Initial state: visible
    expect(screen.getByText(/Balance Neto Consolidado/i)).toBeInTheDocument();

    const privacyButton = screen.getByLabelText(/Ocultar saldos|Mostrar saldos/i);
    // Click to hide
    fireEvent.click(privacyButton);

    // Must show masked bullets
    expect(screen.getAllByText(/••••••••/).length).toBeGreaterThan(0);

    // Click to show again
    fireEvent.click(privacyButton);
    expect(screen.queryByText(/••••••••/)).not.toBeInTheDocument();
  });
});
