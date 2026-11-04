import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as POSTInterface } from '@/app/api/interfaces/route';
import { GET as GETInterfaceDetails } from '@/app/api/interfaces/[id]/details/route';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { invalidateMembershipCache } from '@/lib/membership-cache';

vi.mock('@/lib/db', () => ({
  prisma: {
    usuario: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    interfazOperacion: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    usuarioInterfaz: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    categoria: {
      findMany: vi.fn(),
      count: vi.fn(),
      createMany: vi.fn(),
    },
    subMetodoPago: {
      findMany: vi.fn(),
      count: vi.fn(),
      createMany: vi.fn(),
    },
    cambio: {
      findFirst: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    getSession: vi.fn(),
  },
}));

describe('Interface Creation and Details Access Flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    invalidateMembershipCache();
  });

  it('debe crear una interfaz exitosamente y permitir el acceso inmediato a sus detalles', async () => {
    const mockSession = {
      data: {
        user: {
          id: 'auth-user-uuid-1',
          email: 'usuario@expenzzi.com',
          name: 'Usuario Test',
        },
      },
    };

    vi.mocked(auth.getSession).mockResolvedValue(mockSession as unknown as Awaited<ReturnType<typeof auth.getSession>>);

    // Mock ensureUserInDb: user exists in db with matching or synced ID
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      idusuario: 'auth-user-uuid-1',
      email: 'usuario@expenzzi.com',
      nombreusuario: 'Usuario Test',
      contrasena: 'NEON_AUTH',
      fotoperfil: null,
      biografia: null,
      telefono: null,
      temapreferido: 'dark',
    });

    const newInterfaceMock = {
      idinterfazoperacion: BigInt(42),
      nombre: 'Mi Nueva Interfaz',
      descripcion: 'Para gastos del mes',
      fechacreacion: new Date(),
      estado: true,
      linkinvitado: 'link-invitado-uuid',
      linkvisualizador: 'link-vis-uuid',
    };

    vi.mocked(prisma.interfazOperacion.create).mockResolvedValue(newInterfaceMock);
    vi.mocked(prisma.usuarioInterfaz.create).mockResolvedValue({
      idinterfazoperacion: BigInt(42),
      idusuario: 'auth-user-uuid-1',
      rol: 'Administrador',
      fechaunion: new Date(),
      fechasalida: null,
    });

    // 1. POST /api/interfaces (Crear interfaz)
    const createReq = new Request('http://localhost/api/interfaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Mi Nueva Interfaz', descripcion: 'Para gastos del mes' }),
    });

    const createRes = await POSTInterface(createReq);
    expect(createRes.status).toBe(200);
    const createData = await createRes.json();
    expect(createData.success).toBe(true);
    expect(createData.data.idinterfazoperacion).toBe('42');

    // 2. GET /api/interfaces/42/details (Acceder inmediatamente a la interfaz recién creada)
    vi.mocked(prisma.usuarioInterfaz.findFirst).mockResolvedValue({
      idinterfazoperacion: BigInt(42),
      idusuario: 'auth-user-uuid-1',
      rol: 'Administrador',
      fechaunion: new Date(),
      fechasalida: null,
      interfazoperacion: newInterfaceMock,
    } as unknown as Awaited<ReturnType<typeof prisma.usuarioInterfaz.findFirst>>);

    vi.mocked(prisma.categoria.findMany).mockResolvedValue([]);
    vi.mocked(prisma.subMetodoPago.findMany).mockResolvedValue([]);
    vi.mocked(prisma.usuarioInterfaz.findMany).mockResolvedValue([]);
    vi.mocked(prisma.cambio.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.$queryRaw).mockResolvedValue([]);

    const detailsReq = new Request('http://localhost/api/interfaces/42/details');
    const detailsRes = await GETInterfaceDetails(detailsReq, { params: Promise.resolve({ id: '42' }) });

    expect(detailsRes.status).toBe(200);
    const detailsData = await detailsRes.json();
    expect(detailsData.interface.id).toBe('42');
    expect(detailsData.interface.nombre).toBe('Mi Nueva Interfaz');
    expect(detailsData.role).toBe('Administrador');
  });

  it('debe permitir acceso incluso si idusuario en bd es diferente al id de sesion de Neon Auth', async () => {
    const mockSession = {
      data: {
        user: {
          id: 'neon-auth-user-different-id',
          email: 'usuario-mismatch@expenzzi.com',
          name: 'Usuario Mismatch',
        },
      },
    };

    vi.mocked(auth.getSession).mockResolvedValue(mockSession as unknown as Awaited<ReturnType<typeof auth.getSession>>);

    // User in public.usuario has existing legacy idusuario 'legacy-db-uuid'
    vi.mocked(prisma.usuario.findUnique)
      .mockResolvedValueOnce(null) // not found by neon id
      .mockResolvedValueOnce({
        idusuario: 'legacy-db-uuid',
        email: 'usuario-mismatch@expenzzi.com',
        nombreusuario: 'Usuario Mismatch',
        contrasena: 'NEON_AUTH',
        fotoperfil: null,
        biografia: null,
        telefono: null,
        temapreferido: 'dark',
      }); // found by email

    // usuarioInterfaz membership is under 'legacy-db-uuid'
    vi.mocked(prisma.usuarioInterfaz.findFirst).mockResolvedValue({
      idinterfazoperacion: BigInt(50),
      idusuario: 'legacy-db-uuid',
      rol: 'Administrador',
      fechaunion: new Date(),
      fechasalida: null,
      interfazoperacion: {
        idinterfazoperacion: BigInt(50),
        nombre: 'Interfaz Mismatch',
        descripcion: 'Test',
        fechacreacion: new Date(),
        estado: true,
        linkinvitado: 'link-inv',
        linkvisualizador: 'link-vis',
      },
    } as unknown as Awaited<ReturnType<typeof prisma.usuarioInterfaz.findFirst>>);

    vi.mocked(prisma.categoria.findMany).mockResolvedValue([]);
    vi.mocked(prisma.subMetodoPago.findMany).mockResolvedValue([]);
    vi.mocked(prisma.usuarioInterfaz.findMany).mockResolvedValue([]);
    vi.mocked(prisma.cambio.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.$queryRaw).mockResolvedValue([]);

    const detailsReq = new Request('http://localhost/api/interfaces/50/details');
    const detailsRes = await GETInterfaceDetails(detailsReq, { params: Promise.resolve({ id: '50' }) });

    expect(detailsRes.status).toBe(200);
    const detailsData = await detailsRes.json();
    expect(detailsData.interface.id).toBe('50');
    expect(detailsData.role).toBe('Administrador');
  });

  it('debe rechazar con 403 si el usuario no tiene membresía en la interfaz', async () => {
    const mockSession = {
      data: {
        user: {
          id: 'auth-user-unrelated',
          email: 'unrelated@expenzzi.com',
        },
      },
    };

    vi.mocked(auth.getSession).mockResolvedValue(mockSession as unknown as Awaited<ReturnType<typeof auth.getSession>>);
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
      idusuario: 'auth-user-unrelated',
      email: 'unrelated@expenzzi.com',
      nombreusuario: 'Unrelated',
      contrasena: 'NEON_AUTH',
      fotoperfil: null,
      biografia: null,
      telefono: null,
      temapreferido: 'dark',
    });

    vi.mocked(prisma.usuarioInterfaz.findFirst).mockResolvedValue(null);

    const detailsReq = new Request('http://localhost/api/interfaces/999/details');
    const detailsRes = await GETInterfaceDetails(detailsReq, { params: Promise.resolve({ id: '999' }) });

    expect(detailsRes.status).toBe(403);
    const detailsData = await detailsRes.json();
    expect(detailsData.error).toMatch(/no tiene acceso/i);
  });
});
