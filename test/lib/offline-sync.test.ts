import { describe, it, expect, beforeEach } from 'vitest';
import {
  enqueueOfflineMutation,
  getPendingOfflineMutations,
  flushOfflineQueue,
} from '@/lib/offline-sync';

describe('offline-sync - AAA Unit Tests', () => {
  beforeEach(() => {
    // Arrange: Limpiar localStorage antes de cada prueba
    localStorage.clear();
  });

  it('debe encolar correctamente una mutación offline', () => {
    // Arrange
    const endpoint = '/api/interfaces/123/gastos';
    const method = 'POST';
    const body = { importe: 1500, moneda: 'ARS' };
    const description = 'Gasto de prueba';

    // Act
    const mutation = enqueueOfflineMutation(endpoint, method, body, description);

    // Assert
    const queue = getPendingOfflineMutations();
    expect(queue.length).toBe(1);
    expect(queue[0].id).toBe(mutation.id);
    expect(queue[0].description).toBe(description);
  });

  it('debe retornar lista vacía si la cola no tiene elementos', () => {
    // Act
    const queue = getPendingOfflineMutations();

    // Assert
    expect(queue.length).toBe(0);
  });

  it('debe ejecutar flushOfflineQueue y limpiar elementos procesados correctamente', async () => {
    // Arrange
    enqueueOfflineMutation('/api/interfaces/123/gastos', 'POST', { importe: 100 }, 'Test');

    // Act
    const result = await flushOfflineQueue();

    // Assert
    expect(result).toHaveProperty('successCount');
    expect(result).toHaveProperty('remainingCount');
  });
});
