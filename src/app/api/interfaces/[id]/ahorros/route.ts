import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { TMoneda, TPeriodo } from '@prisma/client';
import { notifyInterfaceMembers } from '@/lib/notify-members';

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

async function checkAdminRole(interfaceId: bigint, userId: string): Promise<boolean> {
  const ui = await prisma.usuarioInterfaz.findFirst({
    where: {
      idinterfazoperacion: interfaceId,
      idusuario: userId,
      fechasalida: null,
    },
  });
  return ui?.rol === 'Administrador';
}

/**
 * GET /api/interfaces/[id]/ahorros
 * List active ahorros with filtering and pagination (RF15, RF16, RF17).
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

    const { searchParams } = new URL(req.url);
    const moneda = searchParams.get('moneda');
    const periodo = searchParams.get('periodoaporte');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    const whereClause: Record<string, unknown> = {
      idinterfazoperacion: interfaceId,
      estado: true,
    };

    const andConditions: Record<string, unknown>[] = [];

    if (moneda) {
      const monedasList = moneda.split(',').map((m) => m.trim()).filter((m) => ['ARS', 'USD', 'UYU'].includes(m));
      if (monedasList.length > 0) {
        andConditions.push({ moneda: { in: monedasList as TMoneda[] } });
      }
    }

    if (periodo && ['Semanal', 'Mensual', 'Trimestral', 'Anual'].includes(periodo)) {
      andConditions.push({ periodoaporte: periodo as TPeriodo });
    }

    if (search) {
      andConditions.push({
        comentario: { contains: search, mode: 'insensitive' },
      });
    }

    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
    }

    const totalRecords = await prisma.ahorro.count({ where: whereClause });

    const ahorros = await prisma.ahorro.findMany({
      where: whereClause,
      orderBy: { fechadesde: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      data: ahorros.map((a) => ({
        id: String(a.idahorro),
        fechadesde: a.fechadesde.toISOString().split('T')[0],
        fechahasta: a.fechahasta.toISOString().split('T')[0],
        responsableNombre: 'Ahorro',
        responsableFotoPerfil: null,
        moneda: a.moneda,
        importe: Number(a.importe),
        comentario: a.comentario || '',
        periodoaporte: a.periodoaporte || 'Mensual',
        estado: a.estado,
      })),
      pagination: {
        page,
        pageSize,
        totalRecords,
        totalPages: Math.ceil(totalRecords / pageSize),
      },
    });
  } catch (err: unknown) {
    console.error('[API /api/interfaces/[id]/ahorros GET Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

/**
 * POST /api/interfaces/[id]/ahorros
 * Create a new Ahorro (Administrador only, mandatory periodoaporte) (RF15, RF16, RF17)
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

    const isAdmin = await checkAdminRole(interfaceId, userId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Solo los usuarios con rol Administrador pueden registrar ahorros' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { fechadesde, fechahasta, moneda, importe, comentario, periodoaporte } = body;

    if (!moneda || !importe || isNaN(Number(importe))) {
      return NextResponse.json(
        { error: 'Moneda e importe son obligatorios' },
        { status: 400 }
      );
    }

    if (!periodoaporte || !['Semanal', 'Mensual', 'Trimestral', 'Anual'].includes(periodoaporte)) {
      return NextResponse.json(
        { error: 'La selección del periodo de aporte (Semanal, Mensual, Trimestral, Anual) es obligatoria' },
        { status: 400 }
      );
    }

    const newAhorro = await prisma.ahorro.create({
      data: {
        fechadesde: fechadesde ? new Date(fechadesde) : new Date(),
        fechahasta: fechahasta ? new Date(fechahasta) : new Date(),
        moneda: moneda as TMoneda,
        importe: Number(importe),
        comentario: comentario ? String(comentario).trim() : null,
        periodoaporte: periodoaporte as TPeriodo,
        idinterfazoperacion: interfaceId,
        estado: true,
      },
    });

    const emisor = await prisma.usuario.findUnique({ where: { idusuario: userId } });
    const interfaz = await prisma.interfazOperacion.findUnique({ where: { idinterfazoperacion: interfaceId } });
    const emisorNombre = emisor?.nombreusuario || 'Un usuario';
    const interfazNombre = interfaz?.nombre || 'la interfaz';
    const formattedAmount = `${Number(importe).toLocaleString('es-AR')} ${moneda}`;

    notifyInterfaceMembers({
      idinterfazoperacion: interfaceId,
      idemisor: userId,
      tipo: 'NUEVO_AHORRO',
      titulo: 'Nuevo Objetivo de Ahorro',
      mensaje: `${emisorNombre} registró una meta de ahorro de ${formattedAmount} (${periodoaporte})${comentario ? ` ("${comentario}")` : ''} en "${interfazNombre}".`,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: String(newAhorro.idahorro),
        fechadesde: newAhorro.fechadesde.toISOString().split('T')[0],
        fechahasta: newAhorro.fechahasta.toISOString().split('T')[0],
        moneda: newAhorro.moneda,
        importe: Number(newAhorro.importe),
        comentario: newAhorro.comentario || '',
        periodoaporte: newAhorro.periodoaporte,
        estado: newAhorro.estado,
      },
    });
  } catch (err: unknown) {
    console.error('[API /api/interfaces/[id]/ahorros POST Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

/**
 * PUT /api/interfaces/[id]/ahorros
 * Update an existing Ahorro (Administrador only)
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

    const isAdmin = await checkAdminRole(interfaceId, userId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Solo los usuarios con rol Administrador pueden modificar ahorros' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { idahorro, fechadesde, fechahasta, moneda, importe, comentario, periodoaporte } = body;

    if (!idahorro) {
      return NextResponse.json({ error: 'idahorro es requerido' }, { status: 400 });
    }

    if (periodoaporte && !['Semanal', 'Mensual', 'Trimestral', 'Anual'].includes(periodoaporte)) {
      return NextResponse.json({ error: 'Periodo de aporte no valido' }, { status: 400 });
    }

    const updated = await prisma.ahorro.update({
      where: { idahorro: BigInt(idahorro) },
      data: {
        ...(fechadesde && { fechadesde: new Date(fechadesde) }),
        ...(fechahasta && { fechahasta: new Date(fechahasta) }),
        ...(moneda && { moneda: moneda as TMoneda }),
        ...(importe !== undefined && { importe: Number(importe) }),
        ...(comentario !== undefined && { comentario: String(comentario).trim() || null }),
        ...(periodoaporte && { periodoaporte: periodoaporte as TPeriodo }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: String(updated.idahorro),
        fechadesde: updated.fechadesde.toISOString().split('T')[0],
        fechahasta: updated.fechahasta.toISOString().split('T')[0],
        moneda: updated.moneda,
        importe: Number(updated.importe),
        comentario: updated.comentario || '',
        periodoaporte: updated.periodoaporte,
        estado: updated.estado,
      },
    });
  } catch (err: unknown) {
    console.error('[API /api/interfaces/[id]/ahorros PUT Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

/**
 * DELETE /api/interfaces/[id]/ahorros
 * Soft delete Ahorro (setting `estado = false`) (Administrador only)
 */
export async function DELETE(
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

    const isAdmin = await checkAdminRole(interfaceId, userId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Solo los usuarios con rol Administrador pueden desactivar ahorros' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const idahorro = searchParams.get('idahorro');

    if (!idahorro) {
      return NextResponse.json({ error: 'idahorro es requerido' }, { status: 400 });
    }

    await prisma.ahorro.update({
      where: { idahorro: BigInt(idahorro) },
      data: { estado: false },
    });

    return NextResponse.json({ success: true, message: 'Ahorro desactivado correctamente' });
  } catch (err: unknown) {
    console.error('[API /api/interfaces/[id]/ahorros DELETE Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
