import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomNav } from '@/components/interface/BottomNav';

describe('BottomNav Component - AAA Unit Tests', () => {
  it('debe renderizar todos los botones de navegación (Gastos, Ingresos, Ahorros, Resúmenes)', () => {
    // Arrange
    const onSectionChangeMock = vi.fn();

    // Act
    render(<BottomNav activeSection="Gastos" onSectionChange={onSectionChangeMock} />);

    // Assert
    expect(screen.getByText('Gastos')).toBeInTheDocument();
    expect(screen.getByText('Ingresos')).toBeInTheDocument();
    expect(screen.getByText('Ahorros')).toBeInTheDocument();
    expect(screen.getByText('Resúmenes')).toBeInTheDocument();
  });

  it('debe invocar onSectionChange con la nueva sección al hacer clic', () => {
    // Arrange
    const onSectionChangeMock = vi.fn();
    render(<BottomNav activeSection="Gastos" onSectionChange={onSectionChangeMock} />);

    // Act
    const ingresosBtn = screen.getByText('Ingresos');
    fireEvent.click(ingresosBtn);

    // Assert
    expect(onSectionChangeMock).toHaveBeenCalledWith('Ingresos');
  });
});
