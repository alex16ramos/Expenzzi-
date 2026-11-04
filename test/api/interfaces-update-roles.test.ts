import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PUT } from '@/app/api/interfaces/[id]/route';
import { POST as POSTAhorro } from '@/app/api/interfaces/[id]/ahorros/route';
import { POST as POSTCategoria } from '@/app/api/interfaces/[id]/categorias/route';
import { POST as POSTSubmetodo } from '@/app/api/interfaces/[id]/submetodos/route';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { invalidateMembershipCache } from '@/lib/membership-cache';

vi.mock('@/lib/db', () => ({
  prisma: {
    usuarioInterfaz: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    interfazOperacion: {
      update: vi.fn(),
    },
    ahorro: {
      create: vi.fn(),
    },
    categoria: {
      create: vi.fn(),
    },
    submetodoPago: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    getSession: vi.fn(),
  },
}));

describe('Interfaces Update and Role Restrictions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    invalidateMembershipCache();
  });

  describe('PUT /api/interfaces/[id] (Modificar Interfaz)', () => {
    it('debe rechazar con 403 si el usuario no es Administrador', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({
        user: { id: 'user-guest' },
      } as unknown as never);

      vi.mocked(prisma.usuarioInterfaz.findFirst).mockResolvedValueOnce({
        rol: 'Invitado',
      } as unknown as never);

      const req = new Request('http://localhost/api/interfaces/123', {
        method: 'PUT',
        body: JSON.stringify({ nombre: 'Nuevo Nombre', descripcion: 'Nueva Desc' }),
      });

      const res = await PUT(req, { params: Promise.resolve({ id: '123' }) });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toMatch(/administradores/i);
    });

    it('debe rechazar con 400 si el nombre está vacío o supera 50 caracteres', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({
        user: { id: 'admin-user' },
      } as unknown as never);

      vi.mocked(prisma.usuarioInterfaz.findFirst).mockResolvedValueOnce({
        rol: 'Administrador',
      } as unknown as never);

      const longName = 'A'.repeat(51);
      const req = new Request('http://localhost/api/interfaces/123', {
        method: 'PUT',
        body: JSON.stringify({ nombre: longName, descripcion: 'Desc' }),
      });

      const res = await PUT(req, { params: Promise.resolve({ id: '123' }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/50 caracteres/i);
    });

    it('debe actualizar la interfaz exitosamente si el usuario es Administrador', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({
        user: { id: 'admin-user' },
      } as unknown as never);

      vi.mocked(prisma.usuarioInterfaz.findFirst).mockResolvedValueOnce({
        rol: 'Administrador',
      } as unknown as never);

      vi.mocked(prisma.interfazOperacion.update).mockResolvedValueOnce({
        idinterfazoperacion: BigInt(123),
        nombre: 'Viaje a Bariloche Actualizado',
        descripcion: 'Gastos del viaje compartido 2026',
      } as unknown as never);

      const req = new Request('http://localhost/api/interfaces/123', {
        method: 'PUT',
        body: JSON.stringify({ nombre: 'Viaje a Bariloche Actualizado', descripcion: 'Gastos del viaje compartido 2026' }),
      });

      const res = await PUT(req, { params: Promise.resolve({ id: '123' }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.nombre).toBe('Viaje a Bariloche Actualizado');
    });
  });

  describe('Restricción de roles sobre Ahorros, Categorías y Submétodos', () => {
    it('debe rechazar POST ahorros con 403 para usuarios con rol Invitado o Visualizador', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({
        user: { id: 'guest-user' },
      } as unknown as never);

      vi.mocked(prisma.usuarioInterfaz.findFirst).mockResolvedValueOnce({
        rol: 'Invitado',
      } as unknown as never);

      const req = new Request('http://localhost/api/interfaces/123/ahorros', {
        method: 'POST',
        body: JSON.stringify({
          fechadesde: '2026-01-01',
          fechahasta: '2026-02-01',
          moneda: 'USD',
          importe: 100,
          periodoaporte: 'Mensual',
        }),
      });

      const res = await POSTAhorro(req, { params: Promise.resolve({ id: '123' }) });
      expect(res.status).toBe(403);
    });

    it('debe rechazar POST categorias con 403 para rol no Administrador', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({
        user: { id: 'viewer-user' },
      } as unknown as never);

      vi.mocked(prisma.usuarioInterfaz.findFirst).mockResolvedValueOnce({
        rol: 'Visualizador',
      } as unknown as never);

      const req = new Request('http://localhost/api/interfaces/123/categorias', {
        method: 'POST',
        body: JSON.stringify({ nombre: 'Restaurantes' }),
      });

      const res = await POSTCategoria(req, { params: Promise.resolve({ id: '123' }) });
      expect(res.status).toBe(403);
    });

    it('debe rechazar POST submetodos con 403 para rol no Administrador', async () => {
      vi.mocked(auth.getSession).mockResolvedValueOnce({
        user: { id: 'guest-user' },
      } as unknown as never);

      vi.mocked(prisma.usuarioInterfaz.findFirst).mockResolvedValueOnce({
        rol: 'Invitado',
      } as unknown as never);

      const req = new Request('http://localhost/api/interfaces/123/submetodos', {
        method: 'POST',
        body: JSON.stringify({ nombre: 'Tarjeta Visa', metodo: 'Credito' }),
      });

      const res = await POSTSubmetodo(req, { params: Promise.resolve({ id: '123' }) });
      expect(res.status).toBe(403);
    });
  });
});
