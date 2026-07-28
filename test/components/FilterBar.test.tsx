import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBar, MultiFilterState } from '@/components/interface/FilterBar';

describe('FilterBar Component - AAA Unit Tests', () => {
  const initialFilters: MultiFilterState = {
    search: '',
    categoryIds: [],
    submethodIds: [],
    metodos: [],
    monedas: [],
    fechaDesde: '',
    fechaHasta: '',
    minImporte: '',
    maxImporte: '',
    estadoFilter: 'activo',
  };

  it('debe renderizar las opciones de estado (Activos, Inactivos, Todos)', () => {
    // Arrange
    const onFilterChangeMock = vi.fn();
    const onResetMock = vi.fn();

    // Act
    render(
      <FilterBar
        filters={initialFilters}
        onFilterChange={onFilterChangeMock}
        categories={[]}
        submethods={[]}
        onReset={onResetMock}
      />
    );

    // Assert
    expect(screen.getByText('Activos')).toBeInTheDocument();
    expect(screen.getByText('Inactivos')).toBeInTheDocument();
    expect(screen.getByText('Todos')).toBeInTheDocument();
  });

  it('debe emitir nuevo filtro de estado al hacer clic en Inactivos', () => {
    // Arrange
    const onFilterChangeMock = vi.fn();
    render(
      <FilterBar
        filters={initialFilters}
        onFilterChange={onFilterChangeMock}
        categories={[]}
        submethods={[]}
        onReset={vi.fn()}
      />
    );

    // Act
    const inactivosBtn = screen.getByText('Inactivos');
    fireEvent.click(inactivosBtn);

    // Assert
    expect(onFilterChangeMock).toHaveBeenCalledWith(
      expect.objectContaining({ estadoFilter: 'inactivo' })
    );
  });

  it('debe desplegar el panel colapsable al presionar el botón Filtros', () => {
    // Arrange
    render(
      <FilterBar
        filters={initialFilters}
        onFilterChange={vi.fn()}
        categories={[{ id: 'cat-1', nombre: 'Comida' }]}
        submethods={[]}
        onReset={vi.fn()}
      />
    );

    // Act
    const toggleBtn = screen.getByText('Filtros');
    fireEvent.click(toggleBtn);

    // Assert
    expect(screen.getByText('Comida')).toBeInTheDocument();
  });
});
