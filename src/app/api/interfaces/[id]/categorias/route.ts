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

/**
 * GET /api/interfaces/[id]/categorias
 * List active categories for interface (RF21-RF24)
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
 * Create a category (RF21-RF24)
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
  req: Request
) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { idcategoria, nombre, estadolimite, importe, moneda, periodoaplicacion } = body;

    if (!idcategoria) {
      return NextResponse.json({ error: 'idcategoria es requerido' }, { status: 400 });
    }

    const updated = await prisma.categoria.update({
      where: { idcategoria: BigInt(idcategoria) },
      data: {
        ...(nombre && { nombre: String(nombre).trim() }),
        ...(estadolimite !== undefined && { estadolimite: Boolean(estadolimite) }),
        ...(importe !== undefined && { importe: importe ? Number(importe) : null }),
        ...(moneda !== undefined && { moneda: moneda ? (moneda as TMoneda) : null }),
        ...(periodoaplicacion !== undefined && { periodoaplicacion: periodoaplicacion ? (periodoaplicacion as TPeriodo) : null }),
      },
    });

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
