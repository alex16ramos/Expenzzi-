import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionCard } from '@/components/interface/TransactionCard';
import { Transaction } from '@/components/interface/transaction-utils';

describe('TransactionCard Component - AAA Unit Tests', () => {
  const mockTransaction: Transaction = {
    id: 'tx-1',
    date: '2026-07-27',
    user: 'Juan Pérez',
    initials: 'JP',
    amount: 2500,
    currency: 'ARS',
    ars: '2.500,00',
    usd: '2.5',
    comment: 'Almuerzo equipo',
    method: 'Efectivo',
    category: 'Comida',
    type: 'Gasto',
    estado: true,
  };

  it('debe renderizar el título, subtítulo e importe del movimiento activo', () => {
    // Arrange
    const onSelectMock = vi.fn();

    // Act
    render(<TransactionCard transaction={mockTransaction} onSelect={onSelectMock} />);

    // Assert
    expect(screen.getByText('Almuerzo equipo')).toBeInTheDocument();
    expect(screen.getByText(/2026-07-27/)).toBeInTheDocument();
    expect(screen.getByText(/2.500,00/)).toBeInTheDocument();
  });

  it('debe mostrar la etiqueta "Inactivo" cuando la transacción tiene baja lógica', () => {
    // Arrange
    const inactiveTx: Transaction = {
      ...mockTransaction,
      estado: false,
    };
    const onSelectMock = vi.fn();

    // Act
    render(<TransactionCard transaction={inactiveTx} onSelect={onSelectMock} />);

    // Assert
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
  });

  it('debe invocar onSelect al hacer clic en la tarjeta', () => {
    // Arrange
    const onSelectMock = vi.fn();
    render(<TransactionCard transaction={mockTransaction} onSelect={onSelectMock} />);

    // Act
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Assert
    expect(onSelectMock).toHaveBeenCalledTimes(1);
    expect(onSelectMock).toHaveBeenCalledWith(mockTransaction);
  });
});
