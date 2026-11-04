import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractTimeFromItem } from '@/lib/time-utils';

vi.mock('@/lib/auth', () => ({
  auth: {
    getSession: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    amistad: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    notificacion: {
      deleteMany: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    usuario: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    interfazOperacion: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    usuarioInterfaz: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
    deudaSaldada: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    historialGasto: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    historialIngreso: {
      findMany: vi.fn(),
    },
    historialAhorro: {
      findMany: vi.fn(),
    },
    historialLimite: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    gasto: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    cambio: {
      findFirst: vi.fn(),
    },
    $queryRaw: vi.fn().mockResolvedValue([]),
    $executeRaw: vi.fn().mockResolvedValue(1),
  },
}));

import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { DELETE as deleteAmigo } from '@/app/api/amigos/route';
import { POST as joinInterface } from '@/app/api/interfaces/join/route';
import { POST as saldarDeuda } from '@/app/api/interfaces/[id]/gastos-compartidos/saldar/route';
import { GET as getHistorial } from '@/app/api/interfaces/[id]/historial/route';

describe('Correcciones de Bugs y Requerimientos (Sesión Actual)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Cancelar solicitud de amistad limpia notificaciones', () => {
    it('elimina las notificaciones de solicitud de amistad al cancelar', async () => {
      vi.mocked(auth.getSession).mockResolvedValue({
        user: { id: 'user-a' },
      } as unknown as never);

      vi.mocked(prisma.amistad.findUnique).mockResolvedValue({
        idamistad: BigInt(123),
        idremitente: 'user-a',
        iddestinatario: 'user-b',
        estado: 'Pendiente',
        fechacreacion: new Date(),
      } as unknown as never);

      vi.mocked(prisma.notificacion.deleteMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.amistad.delete).mockResolvedValue({} as unknown as never);

      const req = new Request('http://localhost:3000/api/amigos?idamistad=123', {
        method: 'DELETE',
      });

      const res = await deleteAmigo(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(prisma.notificacion.deleteMany).toHaveBeenCalledWith({
        where: {
          tipo: 'SOLICITUD_AMISTAD',
          OR: [
            { idreceptor: 'user-b', idemisor: 'user-a' },
            { idreceptor: 'user-a', idemisor: 'user-b' },
          ],
        },
      });
      expect(prisma.amistad.delete).toHaveBeenCalledWith({
        where: { idamistad: BigInt(123) },
      });
    });
  });

  describe('2. Unirse a interfaz: protección de roles y renovación de código', () => {
    it('rechaza unirse si el usuario ya es miembro activo de la interfaz y no altera su rol', async () => {
      vi.mocked(auth.getSession).mockResolvedValue({
        user: { id: 'admin-uuid', email: 'admin@test.com' },
      } as unknown as never);

      vi.mocked(prisma.interfazOperacion.findFirst).mockResolvedValue({
        idinterfazoperacion: BigInt(456),
        nombre: 'Mi Interfaz',
        linkinvitado: 'inv-uuid-1',
        linkvisualizador: 'vis-uuid-2',
      } as unknown as never);

      vi.mocked(prisma.usuarioInterfaz.findUnique).mockResolvedValue({
        idinterfazoperacion: BigInt(456),
        idusuario: 'admin-uuid',
        rol: 'Administrador',
        fechasalida: null,
      } as unknown as never);

      const req = new Request('http://localhost:3000/api/interfaces/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: 'http://localhost:3000/interface/join?code=inv-uuid-1' }),
      });

      const res = await joinInterface(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.alreadyMember).toBe(true);
      expect(json.error).toContain('Ya perteneces a esta interfaz con el rol de Administrador');
      expect(prisma.usuarioInterfaz.upsert).not.toHaveBeenCalled();
    });

    it('renueva el código de invitación cuando un nuevo usuario se une', async () => {
      vi.mocked(auth.getSession).mockResolvedValue({
        user: { id: 'new-user-uuid', email: 'nuevo@test.com' },
      } as unknown as never);

      vi.mocked(prisma.interfazOperacion.findFirst).mockResolvedValue({
        idinterfazoperacion: BigInt(456),
        nombre: 'Mi Interfaz',
        linkinvitado: 'inv-uuid-1',
        linkvisualizador: 'vis-uuid-2',
      } as unknown as never);

      vi.mocked(prisma.usuarioInterfaz.findUnique).mockResolvedValue(null);

      vi.mocked(prisma.usuarioInterfaz.upsert).mockResolvedValue({
        idinterfazoperacion: BigInt(456),
        idusuario: 'new-user-uuid',
        rol: 'Invitado',
      } as unknown as never);

      vi.mocked(prisma.interfazOperacion.update).mockResolvedValue({} as unknown as never);

      const req = new Request('http://localhost:3000/api/interfaces/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: 'inv-uuid-1' }),
      });

      const res = await joinInterface(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(prisma.interfazOperacion.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { idinterfazoperacion: BigInt(456) },
          data: expect.objectContaining({
            linkinvitado: expect.any(String),
          }),
        })
      );
    });
  });

  describe('3. Historial de auditoría sin error de columna h.ant', () => {
    it('obtiene el historial correctamente y parsea versiones previas', async () => {
      vi.mocked(auth.getSession).mockResolvedValue({
        user: { id: 'user-admin' },
      } as unknown as never);

      vi.mocked(prisma.usuarioInterfaz.findFirst).mockResolvedValue({
        idinterfazoperacion: BigInt(123),
        idusuario: 'user-admin',
        rol: 'Administrador',
      } as unknown as never);

      vi.mocked(prisma.historialGasto.findMany).mockResolvedValue([
        {
          idhistorialgasto: BigInt(1),
          fechacambio: new Date('2026-11-04'),
          idgasto: BigInt(10),
          comentarioant: JSON.stringify({
            importe: 5000,
            moneda: 'ARS',
            comentario: 'Supermercado anterior',
          }),
          usuarioResponsable: { nombreusuario: 'Alexander Ramos' },
          gasto: {
            importe: 6000,
            moneda: 'ARS',
            comentario: 'Supermercado nuevo',
            categoria: { nombre: 'Alimentación' },
            submetodopago: null,
          },
        },
      ] as unknown as never);

      vi.mocked(prisma.historialIngreso.findMany).mockResolvedValue([]);
      vi.mocked(prisma.historialAhorro.findMany).mockResolvedValue([]);
      vi.mocked(prisma.historialLimite.findMany).mockResolvedValue([]);

      const req = new Request('http://localhost:3000/api/interfaces/123/historial?tipo=gasto');
      const res = await getHistorial(req, { params: Promise.resolve({ id: '123' }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.length).toBe(1);
      expect(json.data[0].antImporte).toBe(5000);
      expect(json.data[0].nuevoImporte).toBe(6000);
      expect(json.data[0].antComentario).toBe('Supermercado anterior');
      expect(json.data[0].responsableNombre).toBe('Alexander Ramos');
    });
  });

  describe('4. Gastos compartidos: acreedor salda deuda directamente', () => {
    it('si el acreedor confirma el cobro, la deuda queda completamente saldada de inmediato', async () => {
      vi.mocked(auth.getSession).mockResolvedValue({
        user: { id: 'acreedor-uuid' },
      } as unknown as never);

      vi.mocked(prisma.usuarioInterfaz.findFirst).mockResolvedValue({
        idinterfazoperacion: BigInt(123),
        idusuario: 'acreedor-uuid',
        rol: 'Invitado',
        fechasalida: null,
      } as unknown as never);

      vi.mocked(prisma.deudaSaldada.findFirst).mockResolvedValue(null);

      vi.mocked(prisma.deudaSaldada.create).mockResolvedValue({
        iddeuda: BigInt(99),
        idinterfazoperacion: BigInt(123),
        iddeudor: 'deudor-uuid',
        idacreedor: 'acreedor-uuid',
        monto: 15000 as unknown as never,
        moneda: 'ARS',
        confirmadoDeudor: true,
        confirmadoAcreedor: true,
        fechasaldado: new Date(),
        deudor: { nombreusuario: 'Deudor' },
        acreedor: { nombreusuario: 'Acreedor' },
      } as unknown as never);

      const req = new Request('http://localhost:3000/api/interfaces/123/gastos-compartidos/saldar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          iddeudor: 'deudor-uuid',
          idacreedor: 'acreedor-uuid',
          monto: 15000,
          moneda: 'ARS',
          action: 'confirm_acreedor',
        }),
      });

      const res = await saldarDeuda(req, { params: Promise.resolve({ id: '123' }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(prisma.deudaSaldada.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            confirmadoAcreedor: true,
            confirmadoDeudor: true,
            fechasaldado: expect.any(Date),
          }),
        })
      );
    });
  });

  describe('5. Formato de hora estético sin etiqueta cruda [time:...]', () => {
    it('extrae limpiamente la hora y remueve el tag [time:HH:mm]', () => {
      const rawComment = 'Fernet [time:14:20]';
      const result = extractTimeFromItem('1', rawComment, '2026-11-04');

      expect(result.cleanComment).toBe('Fernet');
      expect(result.time).toBe('14:20');
    });
  });
});
