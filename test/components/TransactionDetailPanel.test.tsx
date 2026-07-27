import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionDetailPanel } from '@/components/interface/TransactionDetailPanel';
import { Transaction } from '@/components/interface/transaction-utils';

describe('TransactionDetailPanel Component - AAA Unit Tests', () => {
  const activeTx: Transaction = {
    id: 'tx-100',
    date: '2026-07-27',
    user: 'Carlos Gómez',
    initials: 'CG',
    amount: 8500,
    currency: 'ARS',
    ars: '8.500,00',
    usd: '8.5',
    comment: 'Compra supermercado semanal',
    method: 'Tarjeta Débito',
    category: 'Supermercado',
    type: 'Gasto',
    estado: true,
  };

  const inactiveTx: Transaction = {
    ...activeTx,
    id: 'tx-101',
    estado: false,
  };

  it('debe renderizar el detalle del movimiento activo y mostrar botón de dar de baja', () => {
    // Arrange
    const onCloseMock = vi.fn();
    const onDeleteMock = vi.fn();

    // Act
    render(
      <TransactionDetailPanel
        transaction={activeTx}
        isOpen={true}
        onClose={onCloseMock}
        onDelete={onDeleteMock}
      />
    );

    // Assert
    const comments = screen.getAllByText('Compra supermercado semanal');
    expect(comments.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTitle('Dar de baja movimiento')).toBeInTheDocument();
  });

  it('debe mostrar la etiqueta Baja Lógica (Inactivo) y el botón Reactivar cuando estado es false', () => {
    // Arrange
    const onRestoreMock = vi.fn();

    // Act
    render(
      <TransactionDetailPanel
        transaction={inactiveTx}
        isOpen={true}
        onClose={vi.fn()}
        onRestore={onRestoreMock}
      />
    );

    // Assert
    expect(screen.getByText('Baja Lógica (Inactivo)')).toBeInTheDocument();
    expect(screen.getByTitle('Reactivar movimiento')).toBeInTheDocument();
  });

  it('debe invocar onRestore con la ID al hacer clic en Reactivar', () => {
    // Arrange
    const onRestoreMock = vi.fn();
    render(
      <TransactionDetailPanel
        transaction={inactiveTx}
        isOpen={true}
        onClose={vi.fn()}
        onRestore={onRestoreMock}
      />
    );

    // Act
    const restoreBtn = screen.getByTitle('Reactivar movimiento');
    fireEvent.click(restoreBtn);

    // Assert
    expect(onRestoreMock).toHaveBeenCalledWith('tx-101');
  });
});
