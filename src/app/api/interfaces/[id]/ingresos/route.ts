import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { TMoneda } from '@prisma/client';
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

/**
 * GET /api/interfaces/[id]/ingresos
 * List ingresos with advanced filters and pagination (RF9, RF10, RF11).
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
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const minImporte = searchParams.get('minImporte');
    const maxImporte = searchParams.get('maxImporte');
    const search = searchParams.get('search');
    const estadoParam = searchParams.get('estado');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    const whereClause: Record<string, unknown> = {
      idinterfazoperacion: interfaceId,
    };

    if (estadoParam === 'inactivo' || estadoParam === 'false') {
      whereClause.estado = false;
    } else if (estadoParam === 'todos' || estadoParam === 'all') {
      // Sin filtro por estado
    } else {
      // Por defecto solo activos
      whereClause.estado = true;
    }

    const andConditions: Record<string, unknown>[] = [];

    if (moneda) {
      const monedasList = moneda.split(',').map((m) => m.trim()).filter((m) => ['ARS', 'USD', 'UYU'].includes(m));
      if (monedasList.length > 0) {
        andConditions.push({ moneda: { in: monedasList as TMoneda[] } });
      }
    }

    if (fechaDesde || fechaHasta) {
      const dateCond: Record<string, Date> = {};
      if (fechaDesde) dateCond.gte = new Date(fechaDesde);
      if (fechaHasta) dateCond.lte = new Date(fechaHasta);
      andConditions.push({ fecha: dateCond });
    }

    if (minImporte || maxImporte) {
      const amountCond: Record<string, number> = {};
      if (minImporte) amountCond.gte = parseFloat(minImporte);
      if (maxImporte) amountCond.lte = parseFloat(maxImporte);
      andConditions.push({ importe: amountCond });
    }

    if (search) {
      andConditions.push({
        OR: [
          { comentario: { contains: search, mode: 'insensitive' } },
          { usuarioResponsable: { nombreusuario: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }

    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
    }

    const totalRecords = await prisma.ingreso.count({ where: whereClause });

    const ingresos = await prisma.ingreso.findMany({
      where: whereClause,
      include: {
        usuarioResponsable: true,
      },
      orderBy: { fecha: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      data: ingresos.map((i) => ({
        id: String(i.idingreso),
        fecha: i.fecha.toISOString().split('T')[0],
        responsableingreso: i.responsableingreso,
        responsableNombre: i.usuarioResponsable?.nombreusuario || 'Usuario',
        responsableFotoPerfil: i.usuarioResponsable?.fotoperfil || null,
        moneda: i.moneda,
        importe: Number(i.importe),
        comentario: i.comentario || '',
        estado: i.estado,
      })),
      pagination: {
        page,
        pageSize,
        totalRecords,
        totalPages: Math.ceil(totalRecords / pageSize),
      },
    });
  } catch (err: unknown) {
    console.error('[API /api/interfaces/[id]/ingresos GET Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

/**
 * POST /api/interfaces/[id]/ingresos
 * Create a new Ingreso
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

    const { fecha, responsableingreso, moneda, importe, comentario } = body;

    if (!moneda || !importe || isNaN(Number(importe))) {
      return NextResponse.json(
        { error: 'Moneda e importe son requeridos' },
        { status: 400 }
      );
    }

    const respUser = responsableingreso || userId;

    await prisma.usuario.upsert({
      where: { idusuario: respUser },
      update: {},
      create: { idusuario: respUser, nombreusuario: 'Usuario', email: `${respUser}@expenzzi.local` },
    });

    if (respUser !== userId) {
      await prisma.usuario.upsert({
        where: { idusuario: userId },
        update: {},
        create: { idusuario: userId, nombreusuario: 'Usuario', email: `${userId}@expenzzi.local` },
      });
    }

    const newIngreso = await prisma.ingreso.create({
      data: {
        fecha: fecha ? new Date(fecha) : new Date(),
        responsableingreso: respUser,
        responsableingresaringreso: userId,
        moneda: moneda as TMoneda,
        importe: Number(importe),
        comentario: comentario ? String(comentario).trim() : null,
        idinterfazoperacion: interfaceId,
        estado: true,
      },
      include: {
        usuarioResponsable: true,
      },
    });

    const [emisor, interfaz] = await Promise.all([
      prisma.usuario.findUnique({ where: { idusuario: userId } }),
      prisma.interfazOperacion.findUnique({ where: { idinterfazoperacion: interfaceId } }),
    ]);
    const emisorNombre = emisor?.nombreusuario || 'Un usuario';
    const interfazNombre = interfaz?.nombre || 'la interfaz';
    const formattedAmount = `${Number(importe).toLocaleString('es-AR')} ${moneda}`;

    notifyInterfaceMembers({
      idinterfazoperacion: interfaceId,
      idemisor: userId,
      tipo: 'NUEVO_INGRESO',
      titulo: 'Nuevo Ingreso Registrado',
      mensaje: `${emisorNombre} registró un ingreso de ${formattedAmount}${comentario ? ` ("${comentario}")` : ''} en "${interfazNombre}".`,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: String(newIngreso.idingreso),
        fecha: newIngreso.fecha.toISOString().split('T')[0],
        responsableingreso: newIngreso.responsableingreso,
        responsableNombre: newIngreso.usuarioResponsable?.nombreusuario || 'Usuario',
        moneda: newIngreso.moneda,
        importe: Number(newIngreso.importe),
        comentario: newIngreso.comentario || '',
        estado: newIngreso.estado,
      },
    });
  } catch (err: unknown) {
    console.error('[API /api/interfaces/[id]/ingresos POST Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

/**
 * PUT /api/interfaces/[id]/ingresos
 * Update an existing Ingreso
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
    const { idingreso, fecha, responsableingreso, moneda, importe, comentario, estado } = body;

    if (!idingreso) {
      return NextResponse.json({ error: 'idingreso es requerido' }, { status: 400 });
    }

    const updated = await prisma.ingreso.update({
      where: { idingreso: BigInt(idingreso) },
      data: {
        ...(fecha && { fecha: new Date(fecha) }),
        ...(responsableingreso && { responsableingreso }),
        ...(moneda && { moneda: moneda as TMoneda }),
        ...(importe !== undefined && { importe: Number(importe) }),
        ...(comentario !== undefined && { comentario: String(comentario).trim() || null }),
        ...(estado !== undefined && { estado: Boolean(estado) }),
      },
      include: {
        usuarioResponsable: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: String(updated.idingreso),
        fecha: updated.fecha.toISOString().split('T')[0],
        responsableingreso: updated.responsableingreso,
        responsableNombre: updated.usuarioResponsable?.nombreusuario || 'Usuario',
        moneda: updated.moneda,
        importe: Number(updated.importe),
        comentario: updated.comentario || '',
        estado: updated.estado,
      },
    });
  } catch (err: unknown) {
    console.error('[API /api/interfaces/[id]/ingresos PUT Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

/**
 * DELETE /api/interfaces/[id]/ingresos
 * Soft delete Ingreso by setting `estado = false`
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
    const idingreso = searchParams.get('idingreso');

    if (!idingreso) {
      return NextResponse.json({ error: 'idingreso es requerido' }, { status: 400 });
    }

    await prisma.ingreso.update({
      where: { idingreso: BigInt(idingreso) },
      data: { estado: false },
    });

    return NextResponse.json({ success: true, message: 'Ingreso desactivado correctamente' });
  } catch (err: unknown) {
    console.error('[API /api/interfaces/[id]/ingresos DELETE Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
