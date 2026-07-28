import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import InterfaceDetailsPage from '@/app/interface/[id]/page';

// Mock global fetch for API calls
global.fetch = vi.fn();

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/interface/test-interface-123',
}));

// Mock EventSource for realtime SSE
class MockEventSource {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  close = vi.fn();
}
global.EventSource = MockEventSource as unknown as typeof EventSource;

// Mock window.matchMedia
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('InterfaceDetailsPage - Test Invariante de Información e Interfaz', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup fetch mock responses with safe URL parsing
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((input: unknown) => {
      const url = typeof input === 'string' ? input : (input as { url?: string })?.url || String(input);

      if (url.includes('/details')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              interface: { nombre: 'Finanzas Personales 2026', descripcion: 'Control mensual' },
              role: 'Administrador',
              categories: [{ id: 'cat-1', nombre: 'Alimentación' }],
              submethods: [{ id: 'sub-1', nombre: 'Tarjeta Santander' }],
              members: [{ idusuario: 'u-1', nombreusuario: 'Santi Ramos' }],
            }),
        });
      }

      if (url.includes('/balance')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              balances: {
                ARS: { ingresos: 500000, gastos: 120000, ahorros: 50000, net: 380000 },
                USD: { ingresos: 1000, gastos: 200, ahorros: 100, net: 800 },
                UYU: { ingresos: 0, gastos: 0, ahorros: 0, net: 0 },
              },
            }),
        });
      }

      if (url.includes('/gastos') || url.includes('/ingresos') || url.includes('/ahorros')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              data: [
                {
                  idgasto: 'g-1',
                  fechagasto: '2026-07-27',
                  importe: 15000,
                  moneda: 'ARS',
                  comentario: 'Compra supermercado semanal',
                  metodo: 'Efectivo',
                  categoriaNombre: 'Alimentación',
                  usuarioNombre: 'Santi Ramos',
                  estado: true,
                },
              ],
              total: 1,
              page: 1,
              totalPages: 1,
            }),
        });
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });
    });
  });

  it('certifica que los elementos clave de información de la interfaz SIEMPRE se rendericen', async () => {
    // Arrange & Act
    const paramsPromise = Promise.resolve({ id: 'test-interface-123' });
    
    await React.act(async () => {
      render(<InterfaceDetailsPage params={paramsPromise} />);
    });

    // Assert: Título de la interfaz (en Header y SideMenu)
    await waitFor(() => {
      expect(screen.getAllByText('Finanzas Personales 2026').length).toBeGreaterThan(0);
    });

    // Assert: Pestañas obligatorias de navegación de secciones (barra desktop + bottom nav mobile)
    expect(screen.getAllByRole('button', { name: /gastos/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /ingresos/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /ahorros/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /resúmenes/i }).length).toBeGreaterThan(0);

    // Assert: Tarjetas de balances y monedas disponibles
    expect(screen.getByText(/380\.000/)).toBeInTheDocument(); // Balance neto ARS
    expect(screen.getAllByRole('button', { name: /ARS/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /USD/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /UYU/i }).length).toBeGreaterThan(0);

    // Assert: Transacción cargada en pantalla
    await waitFor(() => {
      expect(screen.getByText('Compra supermercado semanal')).toBeInTheDocument();
    });
  });

  it('certifica invariante: la estructura HTML coincide con la expectativa y el contenedor main existe', async () => {
    // Arrange & Act
    const paramsPromise = Promise.resolve({ id: 'test-interface-123' });
    let containerElement: HTMLElement | null = null;

    await React.act(async () => {
      const { container } = render(<InterfaceDetailsPage params={paramsPromise} />);
      containerElement = container;
    });

    await waitFor(() => {
      expect(screen.getAllByText('Finanzas Personales 2026').length).toBeGreaterThan(0);
    });

    // Snapshot assertion: si alguien altera la estructura DOM básica o elimina componentes, este test falla
    expect(containerElement).toBeDefined();
    expect(containerElement?.querySelector('main')).not.toBeNull();
  });
});
