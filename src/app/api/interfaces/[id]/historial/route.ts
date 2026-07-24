import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

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

export interface AuditRecord {
  id: string;
  tipo: 'gasto' | 'ingreso' | 'ahorro' | 'limite';
  fechacambio: string;
  entityId: string;
  responsableNombre?: string;
  antImporte: number | null;
  antMoneda: string | null;
  antComentario?: string | null;
  nuevoImporte: number | null;
  nuevoMoneda: string | null;
  nuevoComentario?: string | null;
  nombreItem?: string;
}

/**
 * GET /api/interfaces/[id]/historial
 * Returns audit change logs for historialgasto, historialingreso, historialahorro, and historiallimite
 * with previous values (ant.importe & ant.moneda) and current values.
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
    const interfaceIdNum = Number(resolvedParams.id);
    if (isNaN(interfaceIdNum)) {
      return NextResponse.json({ error: 'ID de interfaz inválido' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const tipoParam = searchParams.get('tipo') || 'todos'; // gasto | ingreso | ahorro | limite | todos
    const entityId = searchParams.get('entityId'); // Optional filter by specific item ID

    const results: AuditRecord[] = [];

    // 1. Historial Gasto
    if (tipoParam === 'todos' || tipoParam === 'gasto') {
      const gastoLogs = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
        `SELECT 
          h.idhistorialgasto::text AS id,
          'gasto' AS tipo,
          h.fechacambio::text AS fechacambio,
          h.idgasto::text AS "entityId",
          u.nombreusuario AS "responsableNombre",
          (h.ant).importe::float AS "antImporte",
          (h.ant).moneda::text AS "antMoneda",
          h.comentarioant AS "antComentario",
          g.importe::float AS "nuevoImporte",
          g.moneda::text AS "nuevoMoneda",
          g.comentario AS "nuevoComentario",
          COALESCE(c.nombre, smp.nombre, 'Gasto') AS "nombreItem"
        FROM public.historialgasto h
        JOIN public.gasto g ON h.idgasto = g.idgasto
        LEFT JOIN public.usuario u ON h.responsablecambio = u.idusuario
        LEFT JOIN public.categoria c ON g.idcategoria = c.idcategoria
        LEFT JOIN public.submetodopago smp ON g.idsubmetodopago = smp.idsubmetodopago
        WHERE (c.idinterfazoperacion = $1 OR smp.idinterfazoperacion = $1)
          ${entityId ? 'AND h.idgasto = $2' : ''}
        ORDER BY h.idhistorialgasto DESC`,
        ...[interfaceIdNum, ...(entityId ? [Number(entityId)] : [])]
      );

      for (const log of gastoLogs) {
        results.push({
          id: String(log.id),
          tipo: 'gasto',
          fechacambio: log.fechacambio ? String(log.fechacambio).split('T')[0] : '',
          entityId: String(log.entityId),
          responsableNombre: (log.responsableNombre as string) || 'Usuario',
          antImporte: log.antImporte !== null && log.antImporte !== undefined ? Number(log.antImporte) : null,
          antMoneda: log.antMoneda ? String(log.antMoneda) : null,
          antComentario: log.antComentario ? String(log.antComentario) : null,
          nuevoImporte: log.nuevoImporte !== null && log.nuevoImporte !== undefined ? Number(log.nuevoImporte) : null,
          nuevoMoneda: log.nuevoMoneda ? String(log.nuevoMoneda) : null,
          nuevoComentario: log.nuevoComentario ? String(log.nuevoComentario) : null,
          nombreItem: (log.nombreItem as string) || 'Gasto',
        });
      }
    }

    // 2. Historial Ingreso
    if (tipoParam === 'todos' || tipoParam === 'ingreso') {
      const ingresoLogs = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
        `SELECT 
          h.idhistorialingreso::text AS id,
          'ingreso' AS tipo,
          h.fechacambio::text AS fechacambio,
          h.idingreso::text AS "entityId",
          u.nombreusuario AS "responsableNombre",
          (h.ant).importe::float AS "antImporte",
          (h.ant).moneda::text AS "antMoneda",
          h.comentarioant AS "antComentario",
          i.importe::float AS "nuevoImporte",
          i.moneda::text AS "nuevoMoneda",
          i.comentario AS "nuevoComentario",
          'Ingreso' AS "nombreItem"
        FROM public.historialingreso h
        JOIN public.ingreso i ON h.idingreso = i.idingreso
        LEFT JOIN public.usuario u ON h.responsablecambio = u.idusuario
        WHERE i.idinterfazoperacion = $1
          ${entityId ? 'AND h.idingreso = $2' : ''}
        ORDER BY h.idhistorialingreso DESC`,
        ...[interfaceIdNum, ...(entityId ? [Number(entityId)] : [])]
      );

      for (const log of ingresoLogs) {
        results.push({
          id: String(log.id),
          tipo: 'ingreso',
          fechacambio: log.fechacambio ? String(log.fechacambio).split('T')[0] : '',
          entityId: String(log.entityId),
          responsableNombre: (log.responsableNombre as string) || 'Usuario',
          antImporte: log.antImporte !== null && log.antImporte !== undefined ? Number(log.antImporte) : null,
          antMoneda: log.antMoneda ? String(log.antMoneda) : null,
          antComentario: log.antComentario ? String(log.antComentario) : null,
          nuevoImporte: log.nuevoImporte !== null && log.nuevoImporte !== undefined ? Number(log.nuevoImporte) : null,
          nuevoMoneda: log.nuevoMoneda ? String(log.nuevoMoneda) : null,
          nuevoComentario: log.nuevoComentario ? String(log.nuevoComentario) : null,
          nombreItem: 'Ingreso',
        });
      }
    }

    // 3. Historial Ahorro
    if (tipoParam === 'todos' || tipoParam === 'ahorro') {
      const ahorroLogs = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
        `SELECT 
          h.idhistorialahorro::text AS id,
          'ahorro' AS tipo,
          h.fechacambio::text AS fechacambio,
          h.idahorro::text AS "entityId",
          'Administrador' AS "responsableNombre",
          (h.ant).importe::float AS "antImporte",
          (h.ant).moneda::text AS "antMoneda",
          h.comentarioant AS "antComentario",
          a.importe::float AS "nuevoImporte",
          a.moneda::text AS "nuevoMoneda",
          a.comentario AS "nuevoComentario",
          'Ahorro' AS "nombreItem"
        FROM public.historialahorro h
        JOIN public.ahorro a ON h.idahorro = a.idahorro
        WHERE a.idinterfazoperacion = $1
          ${entityId ? 'AND h.idahorro = $2' : ''}
        ORDER BY h.idhistorialahorro DESC`,
        ...[interfaceIdNum, ...(entityId ? [Number(entityId)] : [])]
      );

      for (const log of ahorroLogs) {
        results.push({
          id: String(log.id),
          tipo: 'ahorro',
          fechacambio: log.fechacambio ? String(log.fechacambio).split('T')[0] : '',
          entityId: String(log.entityId),
          responsableNombre: (log.responsableNombre as string) || 'Administrador',
          antImporte: log.antImporte !== null && log.antImporte !== undefined ? Number(log.antImporte) : null,
          antMoneda: log.antMoneda ? String(log.antMoneda) : null,
          antComentario: log.antComentario ? String(log.antComentario) : null,
          nuevoImporte: log.nuevoImporte !== null && log.nuevoImporte !== undefined ? Number(log.nuevoImporte) : null,
          nuevoMoneda: log.nuevoMoneda ? String(log.nuevoMoneda) : null,
          nuevoComentario: log.nuevoComentario ? String(log.nuevoComentario) : null,
          nombreItem: 'Ahorro',
        });
      }
    }

    // 4. Historial Limite
    if (tipoParam === 'todos' || tipoParam === 'limite') {
      const limiteLogs = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
        `SELECT 
          h.idlimitecategoria::text AS id,
          'limite' AS tipo,
          h.fechacreacionlimite::text AS fechacambio,
          h.idcategoria::text AS "entityId",
          'Administrador' AS "responsableNombre",
          (h.ant).importe::float AS "antImporte",
          (h.ant).moneda::text AS "antMoneda",
          COALESCE(h.periodoaplicacion::text, 'Límite') AS "antComentario",
          cat.importe::float AS "nuevoImporte",
          cat.moneda::text AS "nuevoMoneda",
          COALESCE(cat.periodoaplicacion::text, 'Límite') AS "nuevoComentario",
          COALESCE(cat.nombre, 'Categoría') AS "nombreItem"
        FROM public.historiallimite h
        JOIN public.categoria cat ON h.idcategoria = cat.idcategoria
        WHERE cat.idinterfazoperacion = $1
          ${entityId ? 'AND h.idcategoria = $2' : ''}
        ORDER BY h.idlimitecategoria DESC`,
        ...[interfaceIdNum, ...(entityId ? [Number(entityId)] : [])]
      );

      for (const log of limiteLogs) {
        results.push({
          id: String(log.id),
          tipo: 'limite',
          fechacambio: log.fechacambio ? String(log.fechacambio).split('T')[0] : '',
          entityId: String(log.entityId),
          responsableNombre: (log.responsableNombre as string) || 'Administrador',
          antImporte: log.antImporte !== null && log.antImporte !== undefined ? Number(log.antImporte) : null,
          antMoneda: log.antMoneda ? String(log.antMoneda) : null,
          antComentario: log.antComentario ? String(log.antComentario) : null,
          nuevoImporte: log.nuevoImporte !== null && log.nuevoImporte !== undefined ? Number(log.nuevoImporte) : null,
          nuevoMoneda: log.nuevoMoneda ? String(log.nuevoMoneda) : null,
          nuevoComentario: log.nuevoComentario ? String(log.nuevoComentario) : null,
          nombreItem: (log.nombreItem as string) || 'Categoría',
        });
      }
    }

    // Sort combined results by date descending (or ID descending)
    results.sort((a, b) => b.fechacambio.localeCompare(a.fechacambio));

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (err: unknown) {
    console.error('[API /api/interfaces/[id]/historial GET Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
