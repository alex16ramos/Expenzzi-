import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/change-password/route';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { createHash } from 'crypto';

vi.mock('@/lib/db', () => ({
  prisma: {
    usuario: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    getSession: vi.fn(),
  },
}));

describe('API Route /api/auth/change-password', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('debe retornar 401 si no hay sesión activa', async () => {
    vi.mocked(auth.getSession).mockResolvedValueOnce(null as any);

    const req = new Request('http://localhost/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: 'oldPass', newPassword: 'newPass123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/autenticado/i);
  });

  it('debe retornar 400 si la nueva contraseña tiene menos de 6 caracteres', async () => {
    vi.mocked(auth.getSession).mockResolvedValueOnce({
      user: { id: 'user-123' },
    } as any);

    const req = new Request('http://localhost/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: 'oldPassword123', newPassword: '123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/al menos 6 caracteres/i);
  });

  it('debe retornar 400 si la contraseña actual no coincide', async () => {
    vi.mocked(auth.getSession).mockResolvedValueOnce({
      user: { id: 'user-123' },
    } as any);

    const correctOldHash = createHash('sha256').update('correctOldPassword').digest('hex');
    vi.mocked(prisma.usuario.findUnique).mockResolvedValueOnce({
      idusuario: 'user-123',
      contrasena: correctOldHash,
    } as any);

    const req = new Request('http://localhost/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: 'wrongOldPassword', newPassword: 'newPassword123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/incorrecta/i);
  });

  it('debe actualizar la contraseña exitosamente cuando los datos son válidos', async () => {
    vi.mocked(auth.getSession).mockResolvedValueOnce({
      user: { id: 'user-123' },
    } as any);

    const correctOldHash = createHash('sha256').update('myOldPassword123').digest('hex');
    vi.mocked(prisma.usuario.findUnique).mockResolvedValueOnce({
      idusuario: 'user-123',
      contrasena: correctOldHash,
    } as any);

    vi.mocked(prisma.usuario.update).mockResolvedValueOnce({
      idusuario: 'user-123',
    } as any);

    const req = new Request('http://localhost/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: 'myOldPassword123', newPassword: 'brandNewPassword456' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    const expectedNewHash = createHash('sha256').update('brandNewPassword456').digest('hex');
    expect(prisma.usuario.update).toHaveBeenCalledWith({
      where: { idusuario: 'user-123' },
      data: { contrasena: expectedNewHash },
    });
  });
});
