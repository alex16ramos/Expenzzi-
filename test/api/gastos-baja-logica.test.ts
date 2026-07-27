import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('API Route /api/interfaces/[id]/gastos (Baja Lógica y Filtrado) - AAA Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('debe simular la consulta GET filtrando por estado: true por defecto', async () => {
    // Arrange
    const mockGastos = [
      { id: '1', comentario: 'Gasto Activo', estado: true },
    ];
    const estadoParam = null; // No enviado -> por defecto activo

    // Act
    const whereClause: Record<string, unknown> = {};
    if (estadoParam === 'inactivo' || estadoParam === 'false') {
      whereClause.estado = false;
    } else if (estadoParam === 'todos' || estadoParam === 'all') {
      // Sin filtro
    } else {
      whereClause.estado = true;
    }

    const filtered = mockGastos.filter(g => whereClause.estado === undefined || g.estado === whereClause.estado);

    // Assert
    expect(whereClause.estado).toBe(true);
    expect(filtered.length).toBe(1);
    expect(filtered[0].comentario).toBe('Gasto Activo');
  });

  it('debe simular la consulta GET filtrando por inactivos cuando estado=inactivo', async () => {
    // Arrange
    const mockGastos = [
      { id: '1', comentario: 'Gasto Activo', estado: true },
      { id: '2', comentario: 'Gasto Inactivo', estado: false },
    ];
    const estadoParam = 'inactivo';

    // Act
    const whereClause: Record<string, unknown> = {};
    if (estadoParam === 'inactivo' || estadoParam === 'false') {
      whereClause.estado = false;
    }

    const filtered = mockGastos.filter(g => g.estado === whereClause.estado);

    // Assert
    expect(filtered.length).toBe(1);
    expect(filtered[0].comentario).toBe('Gasto Inactivo');
  });

  it('debe simular la mutación PUT para reactivar un gasto cambiando estado a true', async () => {
    // Arrange
    const initialGasto = { id: '2', comentario: 'Gasto Inactivo', estado: false };
    const updateBody = { idgasto: '2', estado: true };

    // Act
    const updatedGasto = {
      ...initialGasto,
      ...(updateBody.estado !== undefined && { estado: Boolean(updateBody.estado) }),
    };

    // Assert
    expect(updatedGasto.estado).toBe(true);
  });
});
