import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { TMoneda } from '@prisma/client';
import { emitRealtimeEvent } from '@/lib/events';
import { getExchangeRatesForDate } from '@/lib/exchange-rate';
import { extractTimeFromItem, formatCommentWithTime, safeToISOString } from '@/lib/time-utils';

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
 * GET /api/interfaces/[id]/gastos
 * List gastos with advanced filters and pagination (RF29, CU12).
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
    const categoryId = searchParams.get('categoryId');
    const submethodId = searchParams.get('submethodId');
    const metodo = searchParams.get('metodo');
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
      OR: [
        { categoria: { idinterfazoperacion: interfaceId } },
        { submetodopago: { idinterfazoperacion: interfaceId } },
        {
          usuarioResponsable: {
            usuarioInterfaces: {
              some: { idinterfazoperacion: interfaceId, fechasalida: null },
            },
          },
        },
        {
          usuarioIngresador: {
            usuarioInterfaces: {
              some: { idinterfazoperacion: interfaceId, fechasalida: null },
            },
          },
        },
      ],
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

    if (categoryId) {
      const ids = categoryId.split(',').map((id) => BigInt(id.trim())).filter(Boolean);
      if (ids.length > 0) {
        andConditions.push({ idcategoria: { in: ids } });
      }
    }

    if (submethodId) {
      const ids = submethodId.split(',').map((id) => BigInt(id.trim())).filter(Boolean);
      if (ids.length > 0) {
        andConditions.push({ idsubmetodopago: { in: ids } });
      }
    }

    if (metodo) {
      const metodosList = metodo.split(',').map((m) => m.trim()).filter(Boolean);
      if (metodosList.length > 0) {
        andConditions.push({ submetodopago: { metodo: { in: metodosList } } });
      }
    }

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
          { categoria: { nombre: { contains: search, mode: 'insensitive' } } },
          { submetodopago: { nombre: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }

    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
    }

    const totalRecords = await prisma.gasto.count({ where: whereClause });

    const gastos = await prisma.gasto.findMany({
      where: whereClause,
      include: {
        usuarioResponsable: true,
        categoria: true,
        submetodopago: true,
        participantes: true,
      },
      orderBy: [{ fecha: 'desc' }, { idgasto: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      data: gastos.map((g) => {
        const iso = safeToISOString(g.fecha);
        const { cleanComment, time } = extractTimeFromItem(g.idgasto, g.comentario, iso);
        return {
          id: String(g.idgasto),
          fecha: iso.split('T')[0],
          fechaiso: iso,
          time,
          responsablegasto: g.responsablegasto,
          responsableNombre: g.usuarioResponsable?.nombreusuario || 'Usuario',
          responsableFotoPerfil: g.usuarioResponsable?.fotoperfil || null,
          moneda: g.moneda,
          importe: Number(g.importe),
          comentario: cleanComment,
          idcategoria: g.idcategoria ? String(g.idcategoria) : null,
          categoriaNombre: g.categoria?.nombre || 'Sin categoría',
          idsubmetodopago: g.idsubmetodopago ? String(g.idsubmetodopago) : null,
          submetodoNombre: g.submetodopago?.nombre || 'Sin método',
          metodoBase: g.submetodopago?.metodo || 'Efectivo',
          estado: g.estado,
          escompartido: g.participantes.length > 0,
          participantes: g.participantes.map((p) => p.idusuario),
        };
      }),
      pagination: {
        page,
        pageSize,
        totalRecords,
        totalPages: Math.ceil(totalRecords / pageSize),
      },
    });
  } catch (err: unknown) {
    console.error('[API /api/interfaces/[id]/gastos GET Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

/**
 * POST /api/interfaces/[id]/gastos
 * Create a new Gasto (CU12 / RF5, RF6, RF7)
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

    const { fecha, responsablegasto, moneda, importe, comentario, idcategoria, idsubmetodopago, escompartido, participantes } = body;

    if (!moneda || !importe || isNaN(Number(importe))) {
      return NextResponse.json(
        { error: 'Moneda e importe son requeridos' },
        { status: 400 }
      );
    }

    const respUser = responsablegasto || userId;

    // Ensure users exist in usuario table for FKs
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

    const gastoFecha = fecha ? new Date(fecha) : new Date();
    const rates = await getExchangeRatesForDate(gastoFecha);

    const newGasto = await prisma.gasto.create({
      data: {
        fecha: gastoFecha,
        responsablegasto: respUser,
        responsableingresargasto: userId,
        moneda: moneda as TMoneda,
        importe: Number(importe),
        tasacambio: rates.usdars,
        comentario: formatCommentWithTime(comentario, fecha),
        idcategoria: idcategoria ? BigInt(idcategoria) : null,
        idsubmetodopago: idsubmetodopago ? BigInt(idsubmetodopago) : null,
        estado: true,
      },
      include: {
        usuarioResponsable: true,
        categoria: true,
        submetodopago: true,
      },
    });

    let recordedParticipants: string[] = [];

    if (escompartido) {
      let pList: string[] = Array.isArray(participantes) && participantes.length > 0 ? participantes : [];
      if (pList.length === 0) {
        const members = await prisma.usuarioInterfaz.findMany({
          where: { idinterfazoperacion: interfaceId, fechasalida: null },
          select: { idusuario: true },
        });
        pList = members.map((m) => m.idusuario);
      }
      if (pList.length > 0) {
        for (const pId of pList) {
          await prisma.usuario.upsert({
            where: { idusuario: pId },
            update: {},
            create: { idusuario: pId, nombreusuario: 'Usuario', email: `${pId}@expenzzi.local` },
          });
        }
        await prisma.gastoParticipante.createMany({
          data: pList.map((pId) => ({
            idgasto: newGasto.idgasto,
            idusuario: pId,
          })),
          skipDuplicates: true,
        });
        recordedParticipants = pList;
      }
    }

    const [emisor, interfaz] = await Promise.all([
      prisma.usuario.findUnique({ where: { idusuario: userId } }),
      prisma.interfazOperacion.findUnique({ where: { idinterfazoperacion: interfaceId } }),
    ]);
    const emisorNombre = emisor?.nombreusuario || 'Un usuario';
    const interfazNombre = interfaz?.nombre || 'la interfaz';
    const formattedAmount = `${Number(importe).toLocaleString('es-AR')} ${moneda}`;

    const allMembers = await prisma.usuarioInterfaz.findMany({
      where: {
        idinterfazoperacion: interfaceId,
        idusuario: { not: userId },
      },
      select: { idusuario: true },
    });

    const notifiedUserIds = new Set<string>();
    const notificationsToCreate: {
      idreceptor: string;
      idemisor: string;
      tipo: string;
      titulo: string;
      mensaje: string;
      idinterfazoperacion: bigint;
      estado: string;
      leido: boolean;
    }[] = [];

    // 1. Target notification for assigned user
    if (respUser && respUser !== userId) {
      notificationsToCreate.push({
        idreceptor: respUser,
        idemisor: userId,
        tipo: 'GASTO_ASIGNADO',
        titulo: 'Gasto Asignado',
        mensaje: `${emisorNombre} te asignó un gasto de ${formattedAmount}${comentario ? ` ("${comentario}")` : ''} en "${interfazNombre}".`,
        idinterfazoperacion: interfaceId,
        estado: 'Informativa',
        leido: false,
      });
      notifiedUserIds.add(respUser);
    }

    // 2. Target notification for shared participants
    if (escompartido && recordedParticipants.length > 0) {
      for (const pId of recordedParticipants) {
        if (pId !== userId && !notifiedUserIds.has(pId)) {
          notificationsToCreate.push({
            idreceptor: pId,
            idemisor: userId,
            tipo: 'GASTO_COMPARTIDO',
            titulo: 'Gasto Compartido',
            mensaje: `${emisorNombre} incluyó tu participación en un gasto compartido de ${formattedAmount}${comentario ? ` ("${comentario}")` : ''} en "${interfazNombre}".`,
            idinterfazoperacion: interfaceId,
            estado: 'Informativa',
            leido: false,
          });
          notifiedUserIds.add(pId);
        }
      }
    }

    // 3. General notification for remaining members
    for (const m of allMembers) {
      if (!notifiedUserIds.has(m.idusuario)) {
        notificationsToCreate.push({
          idreceptor: m.idusuario,
          idemisor: userId,
          tipo: 'NUEVO_GASTO',
          titulo: 'Nuevo Gasto Registrado',
          mensaje: `${emisorNombre} registró un gasto de ${formattedAmount}${comentario ? ` ("${comentario}")` : ''} en "${interfazNombre}".`,
          idinterfazoperacion: interfaceId,
          estado: 'Informativa',
          leido: false,
        });
        notifiedUserIds.add(m.idusuario);
      }
    }

    if (notificationsToCreate.length > 0) {
      await prisma.notificacion.createMany({
        data: notificationsToCreate,
      });
    }

    emitRealtimeEvent(String(interfaceId), { type: 'MUTATION', entity: 'gasto', action: 'create' });

    return NextResponse.json({
      success: true,
      data: {
        id: String(newGasto.idgasto),
        fecha: newGasto.fecha.toISOString().split('T')[0],
        responsablegasto: newGasto.responsablegasto,
        responsableNombre: newGasto.usuarioResponsable?.nombreusuario || 'Usuario',
        moneda: newGasto.moneda,
        importe: Number(newGasto.importe),
        comentario: newGasto.comentario || '',
        idcategoria: newGasto.idcategoria ? String(newGasto.idcategoria) : null,
        categoriaNombre: newGasto.categoria?.nombre || 'Sin categoría',
        idsubmetodopago: newGasto.idsubmetodopago ? String(newGasto.idsubmetodopago) : null,
        submetodoNombre: newGasto.submetodopago?.nombre || 'Sin método',
        metodoBase: newGasto.submetodopago?.metodo || 'Efectivo',
        estado: newGasto.estado,
        escompartido: recordedParticipants.length > 0,
        participantes: recordedParticipants,
      },
    });
  } catch (err: unknown) {
    console.error('[API /api/interfaces/[id]/gastos POST Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

/**
 * PUT /api/interfaces/[id]/gastos
 * Update an existing Gasto
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
    const { idgasto, fecha, responsablegasto, moneda, importe, comentario, idcategoria, idsubmetodopago, estado, escompartido, participantes } = body;

    if (!idgasto) {
      return NextResponse.json({ error: 'idgasto es requerido' }, { status: 400 });
    }

    const updated = await prisma.gasto.update({
      where: { idgasto: BigInt(idgasto) },
      data: {
        ...(fecha && { fecha: new Date(fecha) }),
        ...(responsablegasto && { responsablegasto }),
        ...(moneda && { moneda: moneda as TMoneda }),
        ...(importe !== undefined && { importe: Number(importe) }),
        ...(comentario !== undefined && { comentario: formatCommentWithTime(comentario, fecha) }),
        ...(idcategoria !== undefined && { idcategoria: idcategoria ? BigInt(idcategoria) : null }),
        ...(idsubmetodopago !== undefined && { idsubmetodopago: idsubmetodopago ? BigInt(idsubmetodopago) : null }),
        ...(estado !== undefined && { estado: Boolean(estado) }),
      },
      include: {
        usuarioResponsable: true,
        categoria: true,
        submetodopago: true,
      },
    });

    let currentParticipants: string[] = [];

    if (escompartido !== undefined) {
      await prisma.gastoParticipante.deleteMany({ where: { idgasto: BigInt(idgasto) } });
      if (escompartido) {
        let pList: string[] = Array.isArray(participantes) && participantes.length > 0 ? participantes : [];
        if (pList.length === 0) {
          const members = await prisma.usuarioInterfaz.findMany({
            where: { idinterfazoperacion: interfaceId, fechasalida: null },
            select: { idusuario: true },
          });
          pList = members.map((m) => m.idusuario);
        }
        if (pList.length > 0) {
          for (const pId of pList) {
            await prisma.usuario.upsert({
              where: { idusuario: pId },
              update: {},
              create: { idusuario: pId, nombreusuario: 'Usuario', email: `${pId}@expenzzi.local` },
            });
          }
          await prisma.gastoParticipante.createMany({
            data: pList.map((pId) => ({
              idgasto: BigInt(idgasto),
              idusuario: pId,
            })),
            skipDuplicates: true,
          });
          currentParticipants = pList;
        }
      }
    } else {
      const existing = await prisma.gastoParticipante.findMany({
        where: { idgasto: BigInt(idgasto) },
      });
      currentParticipants = existing.map((p) => p.idusuario);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: String(updated.idgasto),
        fecha: updated.fecha.toISOString().split('T')[0],
        responsablegasto: updated.responsablegasto,
        responsableNombre: updated.usuarioResponsable?.nombreusuario || 'Usuario',
        moneda: updated.moneda,
        importe: Number(updated.importe),
        comentario: updated.comentario || '',
        idcategoria: updated.idcategoria ? String(updated.idcategoria) : null,
        categoriaNombre: updated.categoria?.nombre || 'Sin categoría',
        idsubmetodopago: updated.idsubmetodopago ? String(updated.idsubmetodopago) : null,
        submetodoNombre: updated.submetodopago?.nombre || 'Sin método',
        metodoBase: updated.submetodopago?.metodo || 'Efectivo',
        estado: updated.estado,
        escompartido: currentParticipants.length > 0,
        participantes: currentParticipants,
      },
    });
  } catch (err: unknown) {
    console.error('[API /api/interfaces/[id]/gastos PUT Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

/**
 * DELETE /api/interfaces/[id]/gastos
 * Soft delete Gasto by setting `estado = false` (RF5, RF6, RF7)
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
    const idgasto = searchParams.get('idgasto');

    if (!idgasto) {
      return NextResponse.json({ error: 'idgasto es requerido' }, { status: 400 });
    }

    await prisma.gasto.update({
      where: { idgasto: BigInt(idgasto) },
      data: { estado: false },
    });

    return NextResponse.json({ success: true, message: 'Gasto desactivado correctamente' });
  } catch (err: unknown) {
    console.error('[API /api/interfaces/[id]/gastos DELETE Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
