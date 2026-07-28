import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionTable } from '@/components/interface/TransactionTable';
import { Transaction } from '@/components/interface/transaction-utils';

describe('TransactionTable Component - AAA Unit Tests', () => {
  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      date: '2026-07-27',
      user: 'Juan Pérez',
      initials: 'JP',
      amount: 1500,
      currency: 'ARS',
      ars: '1.500,00',
      usd: '1.5',
      comment: 'Supermercado Coto',
      method: 'Efectivo',
      category: 'Supermercado',
      type: 'Gasto',
      estado: true,
    },
    {
      id: 'tx-2',
      date: '2026-07-26',
      user: 'María López',
      initials: 'ML',
      amount: 50,
      currency: 'USD',
      ars: '55.000,00',
      usd: '50',
      comment: 'Honorarios diseño',
      method: 'Transferencia',
      type: 'Ingreso',
      estado: false,
    },
  ];

  it('debe renderizar los encabezados de tabla y todos los elementos pasados', () => {
    // Arrange
    const onSelectMock = vi.fn();

    // Act
    render(<TransactionTable transactions={mockTransactions} onSelect={onSelectMock} />);

    // Assert
    expect(screen.getByText('Supermercado Coto')).toBeInTheDocument();
    expect(screen.getByText('Honorarios diseño')).toBeInTheDocument();
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
  });

  it('debe invocar onSortChange cuando se hace clic en el encabezado de ordenamiento', () => {
    // Arrange
    const onSelectMock = vi.fn();
    const onSortChangeMock = vi.fn();
    render(
      <TransactionTable
        transactions={mockTransactions}
        onSelect={onSelectMock}
        onSortChange={onSortChangeMock}
      />
    );

    // Act
    const amountSortBtn = screen.getByText(/Importe/i);
    fireEvent.click(amountSortBtn);

    // Assert
    expect(onSortChangeMock).toHaveBeenCalledWith('amount');
  });

  it('debe invocar onSelect al hacer clic en una fila de la tabla', () => {
    // Arrange
    const onSelectMock = vi.fn();
    render(<TransactionTable transactions={mockTransactions} onSelect={onSelectMock} />);

    // Act
    const rowBtn = screen.getByText('Supermercado Coto').closest('button')!;
    fireEvent.click(rowBtn);

    // Assert
    expect(onSelectMock).toHaveBeenCalledWith(mockTransactions[0]);
  });
});
