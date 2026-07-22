import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { TMoneda, TPeriodo } from '@prisma/client';

export const dynamic = 'force-dynamic';

async function getUserIdFromSession(): Promise<string | null> {
  try {
    const session = await auth.getSession();
    const sessObj = session as unknown as Record<string, unknown>;
    const dataObj = sessObj?.data as Record<string, unknown> | undefined;
    const userObj = (dataObj?.user || sessObj?.user) as Record<string, unknown> | undefined;
    return (userObj?.id || userObj?.idusuario || userObj?.userId) as string || null;
  } catch {
    return null;
  }
}

async function getUserRole(userId: string, interfaceId: bigint): Promise<string | null> {
  const ui = await prisma.usuarioInterfaz.findFirst({
    where: { idusuario: userId, idinterfazoperacion: interfaceId, fechasalida: null }
  });
  return ui?.rol || null;
}

async function getCategoryLimitUsageMap(interfaceId: bigint): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  try {
    const rows = await prisma.$queryRaw<Array<{ idcategoria: bigint; importeutilizado: number | string | null }>>`
      SELECT idcategoria, importeutilizado 
      FROM vistalimitegastosperiodo 
      WHERE idinterfazoperacion = ${interfaceId}
    `;
    for (const r of rows) {
      map.set(String(r.idcategoria), Number(r.importeutilizado || 0));
    }
  } catch (e) {
    console.warn('[vistalimitegastosperiodo Raw Query Warning, falling back to manual calculation]:', e);
    const expenses = await prisma.gasto.findMany({
      where: {
        estado: true,
        categoria: {
          idinterfazoperacion: interfaceId,
          estadolimite: true,
          estado: true,
        },
      },
      include: { categoria: true },
    });
    for (const g of expenses) {
      if (!g.idcategoria || !g.categoria) continue;
      const catId = String(g.idcategoria);
      const limitMoneda = g.categoria.moneda || 'ARS';
      const period = g.categoria.periodoaplicacion || 'Mensual';
      
      const now = new Date();
      const gDate = new Date(g.fecha);
      let inPeriod = false;
      if (period === 'Semanal') {
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0,0,0,0);
        inPeriod = gDate >= startOfWeek;
      } else if (period === 'Mensual') {
        inPeriod = gDate.getFullYear() === now.getFullYear() && gDate.getMonth() === now.getMonth();
      } else if (period === 'Trimestral') {
        const currentQ = Math.floor(now.getMonth() / 3);
        const gQ = Math.floor(gDate.getMonth() / 3);
        inPeriod = gDate.getFullYear() === now.getFullYear() && gQ === currentQ;
      } else if (period === 'Anual') {
        inPeriod = gDate.getFullYear() === now.getFullYear();
      }

      if (inPeriod) {
        let val = Number(g.importe);
        if (g.moneda !== limitMoneda) {
          if (g.moneda === 'USD' && limitMoneda === 'ARS') val *= 1000;
          else if (g.moneda === 'ARS' && limitMoneda === 'USD') val /= 1000;
          else if (g.moneda === 'UYU' && limitMoneda === 'ARS') val *= 25;
          else if (g.moneda === 'ARS' && limitMoneda === 'UYU') val /= 25;
          else if (g.moneda === 'USD' && limitMoneda === 'UYU') val *= 40;
          else if (g.moneda === 'UYU' && limitMoneda === 'USD') val /= 40;
        }
        map.set(catId, (map.get(catId) || 0) + val);
      }
    }
  }
  return map;
}

/**
 * GET /api/interfaces/[id]/categorias
 * List active categories for interface (RF21-RF24, CU10)
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const interfaceId = BigInt(resolvedParams.id);

    const categories = await prisma.categoria.findMany({
      where: {
        idinterfazoperacion: interfaceId,
        estado: true,
      },
      orderBy: { nombre: 'asc' },
    });

    const usageMap = await getCategoryLimitUsageMap(interfaceId);

    return NextResponse.json({
      data: categories.map((c) => ({
        id: String(c.idcategoria),
        nombre: c.nombre,
        estadolimite: c.estadolimite ?? false,
        importe: c.importe ? Number(c.importe) : null,
        moneda: c.moneda,
        periodoaplicacion: c.periodoaplicacion,
        fechacreacionlimite: c.fechacreacionlimite ? c.fechacreacionlimite.toISOString().split('T')[0] : null,
        estado: c.estado,
        importeutilizado: usageMap.get(String(c.idcategoria)) || 0,
      })),
    });
  } catch (err: unknown) {
    console.error('[API /api/interfaces/[id]/categorias GET Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

/**
 * POST /api/interfaces/[id]/categorias
 * Create a category (RF21-RF24, RF20)
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const interfaceId = BigInt(resolvedParams.id);
    const body = await req.json();

    const { nombre, estadolimite, importe, moneda, periodoaplicacion } = body;

    if (!nombre || !String(nombre).trim()) {
      return NextResponse.json({ error: 'El nombre de la categoría es obligatorio' }, { status: 400 });
    }

    if (estadolimite) {
      const role = await getUserRole(userId, interfaceId);
      if (role !== 'Administrador') {
        return NextResponse.json(
          { error: 'Solo un Administrador puede establecer o modificar límites en categorías (RF20).' },
          { status: 403 }
        );
      }
    }

    const newCategory = await prisma.categoria.create({
      data: {
        nombre: String(nombre).trim(),
        estadolimite: Boolean(estadolimite),
        importe: importe ? Number(importe) : null,
        moneda: moneda ? (moneda as TMoneda) : null,
        periodoaplicacion: periodoaplicacion ? (periodoaplicacion as TPeriodo) : null,
        fechacreacionlimite: estadolimite ? new Date() : null,
        idinterfazoperacion: interfaceId,
        estado: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: String(newCategory.idcategoria),
        nombre: newCategory.nombre,
        estadolimite: newCategory.estadolimite ?? false,
        importe: newCategory.importe ? Number(newCategory.importe) : null,
        moneda: newCategory.moneda,
        periodoaplicacion: newCategory.periodoaplicacion,
        estado: newCategory.estado,
        importeutilizado: 0,
      },
    });
  } catch (err: unknown) {
    console.error('[API /api/interfaces/[id]/categorias POST Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

/**
 * PUT /api/interfaces/[id]/categorias
 * Update a category
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const interfaceId = BigInt(resolvedParams.id);
    const body = await req.json();
    const { idcategoria, nombre, estadolimite, importe, moneda, periodoaplicacion } = body;

    if (!idcategoria) {
      return NextResponse.json({ error: 'idcategoria es requerido' }, { status: 400 });
    }

    if (estadolimite !== undefined || importe !== undefined || moneda !== undefined || periodoaplicacion !== undefined) {
      const role = await getUserRole(userId, interfaceId);
      if (role !== 'Administrador') {
        return NextResponse.json(
          { error: 'Solo un Administrador puede configurar límites de categorías (RF20).' },
          { status: 403 }
        );
      }
    }

    const updated = await prisma.categoria.update({
      where: { idcategoria: BigInt(idcategoria) },
      data: {
        ...(nombre && { nombre: String(nombre).trim() }),
        ...(estadolimite !== undefined && { estadolimite: Boolean(estadolimite) }),
        ...(importe !== undefined && { importe: importe ? Number(importe) : null }),
        ...(moneda !== undefined && { moneda: moneda ? (moneda as TMoneda) : null }),
        ...(periodoaplicacion !== undefined && { periodoaplicacion: periodoaplicacion ? (periodoaplicacion as TPeriodo) : null }),
        ...(estadolimite && { fechacreacionlimite: new Date() }),
      },
    });

    const usageMap = await getCategoryLimitUsageMap(interfaceId);

    return NextResponse.json({
      success: true,
      data: {
        id: String(updated.idcategoria),
        nombre: updated.nombre,
        estadolimite: updated.estadolimite ?? false,
        importe: updated.importe ? Number(updated.importe) : null,
        moneda: updated.moneda,
        periodoaplicacion: updated.periodoaplicacion,
        estado: updated.estado,
        importeutilizado: usageMap.get(String(updated.idcategoria)) || 0,
      },
    });
  } catch (err: unknown) {
    console.error('[API /api/interfaces/[id]/categorias PUT Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

/**
 * DELETE /api/interfaces/[id]/categorias
 * Soft delete category by setting `estado = false`
 */
export async function DELETE(
  req: Request
) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const idcategoria = searchParams.get('idcategoria');

    if (!idcategoria) {
      return NextResponse.json({ error: 'idcategoria es requerido' }, { status: 400 });
    }

    await prisma.categoria.update({
      where: { idcategoria: BigInt(idcategoria) },
      data: { estado: false },
    });

    return NextResponse.json({ success: true, message: 'Categoría desactivada correctamente' });
  } catch (err: unknown) {
    console.error('[API /api/interfaces/[id]/categorias DELETE Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

