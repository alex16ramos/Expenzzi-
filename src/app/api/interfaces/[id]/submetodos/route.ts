import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { TMetodoDePago } from '@prisma/client';

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
 * GET /api/interfaces/[id]/submetodos
 * List active submethods of payment for interface (RF25-RF28)
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

    const submethods = await prisma.subMetodoPago.findMany({
      where: {
        idinterfazoperacion: interfaceId,
        estado: true,
      },
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json({
      data: submethods.map((s) => ({
        id: String(s.idsubmetodopago),
        nombre: s.nombre,
        metodo: s.metodo,
        estado: s.estado,
      })),
    });
  } catch (err: unknown) {
    console.error('[API /api/interfaces/[id]/submetodos GET Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

/**
 * POST /api/interfaces/[id]/submetodos
 * Create a submethod of payment assigned to base method (Credito, Debito, Efectivo) (RF25-RF28)
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

    const { nombre, metodo } = body;

    if (!nombre || !String(nombre).trim()) {
      return NextResponse.json({ error: 'El nombre del submétodo es obligatorio' }, { status: 400 });
    }

    if (!metodo || !['Efectivo', 'Credito', 'Debito'].includes(metodo)) {
      return NextResponse.json({ error: 'El método base (Efectivo, Credito, Debito) es obligatorio' }, { status: 400 });
    }

    const newSubmethod = await prisma.subMetodoPago.create({
      data: {
        nombre: String(nombre).trim(),
        metodo: metodo as TMetodoDePago,
        idinterfazoperacion: interfaceId,
        estado: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: String(newSubmethod.idsubmetodopago),
        nombre: newSubmethod.nombre,
        metodo: newSubmethod.metodo,
        estado: newSubmethod.estado,
      },
    });
  } catch (err: unknown) {
    console.error('[API /api/interfaces/[id]/submetodos POST Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

/**
 * PUT /api/interfaces/[id]/submetodos
 * Update a submethod of payment
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
    const { idsubmetodopago, nombre, metodo } = body;

    if (!idsubmetodopago) {
      return NextResponse.json({ error: 'idsubmetodopago es requerido' }, { status: 400 });
    }

    if (metodo && !['Efectivo', 'Credito', 'Debito'].includes(metodo)) {
      return NextResponse.json({ error: 'El método base debe ser Efectivo, Credito o Debito' }, { status: 400 });
    }

    const updated = await prisma.subMetodoPago.update({
      where: { idsubmetodopago: BigInt(idsubmetodopago) },
      data: {
        ...(nombre && { nombre: String(nombre).trim() }),
        ...(metodo && { metodo: metodo as TMetodoDePago }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: String(updated.idsubmetodopago),
        nombre: updated.nombre,
        metodo: updated.metodo,
        estado: updated.estado,
      },
    });
  } catch (err: unknown) {
    console.error('[API /api/interfaces/[id]/submetodos PUT Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

/**
 * DELETE /api/interfaces/[id]/submetodos
 * Soft delete submethod by setting `estado = false`
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
    const idsubmetodopago = searchParams.get('idsubmetodopago');

    if (!idsubmetodopago) {
      return NextResponse.json({ error: 'idsubmetodopago es requerido' }, { status: 400 });
    }

    await prisma.subMetodoPago.update({
      where: { idsubmetodopago: BigInt(idsubmetodopago) },
      data: { estado: false },
    });

    return NextResponse.json({ success: true, message: 'Submétodo de pago desactivado correctamente' });
  } catch (err: unknown) {
    console.error('[API /api/interfaces/[id]/submetodos DELETE Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
