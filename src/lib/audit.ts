import { prisma } from '@/lib/db';
import { Prisma, TPeriodo } from '@prisma/client';

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

export interface RecordAuditParams {
  tipo: 'gasto' | 'ingreso' | 'ahorro' | 'limite';
  identidad: bigint | number | string;
  idinterfaz: bigint | number | string;
  responsable?: string | null;
  datosprevios: {
    importe?: number | null;
    moneda?: string | null;
    comentario?: string | null;
    nombreItem?: string | null;
    periodoaplicacion?: string | null;
    fechadesde?: string | null;
    fechahasta?: string | null;
    [key: string]: unknown;
  };
  datosnuevos: {
    importe?: number | null;
    moneda?: string | null;
    comentario?: string | null;
    nombreItem?: string | null;
    periodoaplicacion?: string | null;
    fechadesde?: string | null;
    fechahasta?: string | null;
    [key: string]: unknown;
  };
}

/**
 * Record an audit log entry.
 * Saves to public.auditoria_registro (safe from RLS restrictions)
 * and attempts to mirror to legacy historial tables with a graceful fallback.
 */
export async function recordAuditLog({
  tipo,
  identidad,
  idinterfaz,
  responsable,
  datosprevios,
  datosnuevos,
}: RecordAuditParams): Promise<void> {
  const ident = BigInt(identidad);
  const interf = BigInt(idinterfaz);
  const prevJson = JSON.stringify(datosprevios);
  const newJson = JSON.stringify(datosnuevos);

  // 1. Insert into public.auditoria_registro (owned by authenticator)
  try {
    if (responsable) {
      await prisma.$executeRaw`
        INSERT INTO public.auditoria_registro (tipo, identidad, idinterfaz, responsable, fechacambio, datosprevios, datosnuevos)
        VALUES (
          ${tipo},
          ${ident},
          ${interf},
          ${responsable}::uuid,
          NOW(),
          ${prevJson}::jsonb,
          ${newJson}::jsonb
        );
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO public.auditoria_registro (tipo, identidad, idinterfaz, fechacambio, datosprevios, datosnuevos)
        VALUES (
          ${tipo},
          ${ident},
          ${interf},
          NOW(),
          ${prevJson}::jsonb,
          ${newJson}::jsonb
        );
      `;
    }
  } catch (err) {
    console.warn('[Audit] Failed to insert into auditoria_registro:', err);
  }

  // 2. Best-effort mirror to legacy tables (safe try-catch against RLS)
  try {
    if (tipo === 'gasto' && responsable) {
      await prisma.historialGasto.create({
        data: {
          idgasto: ident,
          responsablecambio: responsable,
          fechacambio: new Date(),
          comentarioant: prevJson,
        },
      });
    } else if (tipo === 'ingreso' && responsable) {
      await prisma.historialIngreso.create({
        data: {
          idingreso: ident,
          responsablecambio: responsable,
          fechacambio: new Date(),
          comentarioant: prevJson,
        },
      });
    } else if (tipo === 'ahorro') {
      await prisma.historialAhorro.create({
        data: {
          idahorro: ident,
          fechacambio: new Date(),
          comentarioant: prevJson,
        },
      });
    } else if (tipo === 'limite' && datosprevios.periodoaplicacion) {
      await prisma.historialLimite.create({
        data: {
          idcategoria: ident,
          periodoaplicacion: datosprevios.periodoaplicacion as TPeriodo,
          importelimite: datosprevios.importe !== undefined && datosprevios.importe !== null ? Number(datosprevios.importe) : null,
          importeutilizado: typeof datosprevios.importeutilizado === 'number' ? datosprevios.importeutilizado : 0,
          fechacreacionlimite: new Date(),
        },
      });
    }
  } catch (legacyErr) {
    // Non-blocking: RLS on legacy tables without INSERT policy is expected
    console.debug('[Audit] Legacy table mirror skipped (RLS active):', (legacyErr as Error)?.message);
  }
}

/**
 * Fetch audit history combining records from public.auditoria_registro
 * and any legacy historial rows.
 */
export async function getAuditHistory({
  interfaceId,
  tipo = 'todos',
  entityId = null,
}: {
  interfaceId: bigint;
  tipo?: 'todos' | 'gasto' | 'ingreso' | 'ahorro' | 'limite';
  entityId?: string | null;
}): Promise<AuditRecord[]> {
  const results: AuditRecord[] = [];
  const seenIds = new Set<string>();

  // 1. Fetch from public.auditoria_registro
  try {
    const conditions: Prisma.Sql[] = [Prisma.sql`a.idinterfaz = ${interfaceId}`];
    if (tipo !== 'todos') {
      conditions.push(Prisma.sql`a.tipo = ${tipo}`);
    }
    if (entityId && /^\d+$/.test(entityId)) {
      conditions.push(Prisma.sql`a.identidad = ${BigInt(entityId)}`);
    }

    const whereSql = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

    const rawRecords = await prisma.$queryRaw<
      Array<{
        id: string;
        tipo: string;
        entityId: string;
        idinterfaz: string;
        responsable: string | null;
        responsableNombre: string;
        fechacambio: string;
        datosprevios: string | Record<string, unknown> | null;
        datosnuevos: string | Record<string, unknown> | null;
      }>
    >`
      SELECT 
        a.idauditoria::text as id,
        a.tipo::text as tipo,
        a.identidad::text as "entityId",
        a.idinterfaz::text as idinterfaz,
        a.responsable::text as responsable,
        COALESCE(u.nombreusuario, 'Usuario') as "responsableNombre",
        a.fechacambio::text as fechacambio,
        a.datosprevios::text as datosprevios,
        a.datosnuevos::text as datosnuevos
      FROM public.auditoria_registro a
      LEFT JOIN public.usuario u ON a.responsable = u.idusuario
      ${whereSql}
      ORDER BY a.idauditoria DESC
      LIMIT 200;
    `;

    for (const row of rawRecords) {
      let prev: Record<string, unknown> = {};
      let curr: Record<string, unknown> = {};
      try {
        prev = typeof row.datosprevios === 'string' ? JSON.parse(row.datosprevios) : (row.datosprevios || {});
      } catch {
        // ignore parse error
      }
      try {
        curr = typeof row.datosnuevos === 'string' ? JSON.parse(row.datosnuevos) : (row.datosnuevos || {});
      } catch {
        // ignore parse error
      }

      const isoDate = row.fechacambio ? row.fechacambio.split(' ')[0] : '';
      const auditRec: AuditRecord = {
        id: `reg-${row.id}`,
        tipo: row.tipo as AuditRecord['tipo'],
        fechacambio: isoDate,
        entityId: row.entityId,
        responsableNombre: row.responsableNombre || 'Usuario',
        antImporte: prev.importe !== undefined && prev.importe !== null ? Number(prev.importe) : null,
        antMoneda: (prev.moneda as string) || null,
        antComentario: (prev.comentario as string) || null,
        nuevoImporte: curr.importe !== undefined && curr.importe !== null ? Number(curr.importe) : null,
        nuevoMoneda: (curr.moneda as string) || null,
        nuevoComentario: (curr.comentario as string) || null,
        nombreItem: (curr.nombreItem as string) || (prev.nombreItem as string) || undefined,
      };

      results.push(auditRec);
      seenIds.add(`${auditRec.tipo}-${auditRec.entityId}-${auditRec.fechacambio}`);
    }
  } catch (err) {
    console.warn('[Audit] Error querying auditoria_registro:', err);
  }

  // 2. Fetch from legacy historial tables for backward compatibility
  try {
    if (tipo === 'todos' || tipo === 'gasto') {
      const gastoLogs = await prisma.historialGasto.findMany({
        where: {
          gasto: {
            OR: [
              { categoria: { idinterfazoperacion: interfaceId } },
              { submetodopago: { idinterfazoperacion: interfaceId } },
            ],
          },
          ...(entityId && /^\d+$/.test(entityId) ? { idgasto: BigInt(entityId) } : {}),
        },
        include: {
          usuarioResponsable: { select: { nombreusuario: true } },
          gasto: {
            include: {
              categoria: { select: { nombre: true } },
              submetodopago: { select: { nombre: true } },
            },
          },
        },
        orderBy: { idhistorialgasto: 'desc' },
        take: 50,
      });

      for (const log of gastoLogs) {
        let antImporte: number | null = null;
        let antMoneda: string | null = null;
        let antComentario: string | null = log.comentarioant;

        if (log.comentarioant) {
          try {
            const parsed = JSON.parse(log.comentarioant);
            if (parsed && typeof parsed === 'object') {
              antImporte = parsed.importe !== undefined ? Number(parsed.importe) : null;
              antMoneda = parsed.moneda || null;
              antComentario = parsed.comentario || null;
            }
          } catch {
            // fallback
          }
        }

        const dateStr = log.fechacambio ? log.fechacambio.toISOString().split('T')[0] : '';
        const dedupKey = `gasto-${String(log.idgasto)}-${dateStr}`;
        if (!seenIds.has(dedupKey)) {
          results.push({
            id: `gasto-${log.idhistorialgasto}`,
            tipo: 'gasto',
            fechacambio: dateStr,
            entityId: String(log.idgasto || ''),
            responsableNombre: log.usuarioResponsable?.nombreusuario || 'Usuario',
            antImporte,
            antMoneda,
            antComentario,
            nuevoImporte: log.gasto ? Number(log.gasto.importe) : null,
            nuevoMoneda: log.gasto?.moneda || null,
            nuevoComentario: log.gasto?.comentario || null,
            nombreItem: log.gasto?.categoria?.nombre || log.gasto?.submetodopago?.nombre || 'Gasto',
          });
        }
      }
    }

    if (tipo === 'todos' || tipo === 'ingreso') {
      const ingresoLogs = await prisma.historialIngreso.findMany({
        where: {
          ingreso: { idinterfazoperacion: interfaceId },
          ...(entityId && /^\d+$/.test(entityId) ? { idingreso: BigInt(entityId) } : {}),
        },
        include: {
          usuarioResponsable: { select: { nombreusuario: true } },
          ingreso: true,
        },
        orderBy: { idhistorialingreso: 'desc' },
        take: 50,
      });

      for (const log of ingresoLogs) {
        let antImporte: number | null = null;
        let antMoneda: string | null = null;
        let antComentario: string | null = log.comentarioant;

        if (log.comentarioant) {
          try {
            const parsed = JSON.parse(log.comentarioant);
            if (parsed && typeof parsed === 'object') {
              antImporte = parsed.importe !== undefined ? Number(parsed.importe) : null;
              antMoneda = parsed.moneda || null;
              antComentario = parsed.comentario || null;
            }
          } catch {
            // fallback
          }
        }

        const dateStr = log.fechacambio ? log.fechacambio.toISOString().split('T')[0] : '';
        const dedupKey = `ingreso-${String(log.idingreso)}-${dateStr}`;
        if (!seenIds.has(dedupKey)) {
          results.push({
            id: `ingreso-${log.idhistorialingreso}`,
            tipo: 'ingreso',
            fechacambio: dateStr,
            entityId: String(log.idingreso || ''),
            responsableNombre: log.usuarioResponsable?.nombreusuario || 'Usuario',
            antImporte,
            antMoneda,
            antComentario,
            nuevoImporte: log.ingreso ? Number(log.ingreso.importe) : null,
            nuevoMoneda: log.ingreso?.moneda || null,
            nuevoComentario: log.ingreso?.comentario || null,
            nombreItem: 'Ingreso',
          });
        }
      }
    }

    if (tipo === 'todos' || tipo === 'ahorro') {
      const ahorroLogs = await prisma.historialAhorro.findMany({
        where: {
          ahorro: { idinterfazoperacion: interfaceId },
          ...(entityId && /^\d+$/.test(entityId) ? { idahorro: BigInt(entityId) } : {}),
        },
        include: { ahorro: true },
        orderBy: { idhistorialahorro: 'desc' },
        take: 50,
      });

      for (const log of ahorroLogs) {
        let antImporte: number | null = null;
        let antMoneda: string | null = null;
        let antComentario: string | null = log.comentarioant;

        if (log.comentarioant) {
          try {
            const parsed = JSON.parse(log.comentarioant);
            if (parsed && typeof parsed === 'object') {
              antImporte = parsed.importe !== undefined ? Number(parsed.importe) : null;
              antMoneda = parsed.moneda || null;
              antComentario = parsed.comentario || null;
            }
          } catch {
            // fallback
          }
        }

        const dateStr = log.fechacambio ? log.fechacambio.toISOString().split('T')[0] : '';
        const dedupKey = `ahorro-${String(log.idahorro)}-${dateStr}`;
        if (!seenIds.has(dedupKey)) {
          results.push({
            id: `ahorro-${log.idhistorialahorro}`,
            tipo: 'ahorro',
            fechacambio: dateStr,
            entityId: String(log.idahorro || ''),
            responsableNombre: 'Administrador',
            antImporte,
            antMoneda,
            antComentario,
            nuevoImporte: log.ahorro ? Number(log.ahorro.importe) : null,
            nuevoMoneda: log.ahorro?.moneda || null,
            nuevoComentario: log.ahorro?.comentario || null,
            nombreItem: 'Ahorro',
          });
        }
      }
    }

    if (tipo === 'todos' || tipo === 'limite') {
      const limiteLogs = await prisma.historialLimite.findMany({
        where: {
          categoria: { idinterfazoperacion: interfaceId },
          ...(entityId && /^\d+$/.test(entityId) ? { idcategoria: BigInt(entityId) } : {}),
        },
        include: { categoria: true },
        orderBy: { idlimitecategoria: 'desc' },
        take: 50,
      });

      for (const log of limiteLogs) {
        const dateStr = log.fechacreacionlimite ? log.fechacreacionlimite.toISOString().split('T')[0] : '';
        const dedupKey = `limite-${String(log.idcategoria)}-${dateStr}`;
        if (!seenIds.has(dedupKey)) {
          results.push({
            id: `limite-${log.idlimitecategoria}`,
            tipo: 'limite',
            fechacambio: dateStr,
            entityId: String(log.idcategoria || ''),
            responsableNombre: 'Administrador',
            antImporte: log.importelimite !== null && log.importelimite !== undefined ? Number(log.importelimite) : null,
            antMoneda: log.categoria?.moneda || 'ARS',
            antComentario: log.periodoaplicacion ? `Límite ${log.periodoaplicacion}` : 'Límite',
            nuevoImporte:
              log.categoria?.importe !== null && log.categoria?.importe !== undefined ? Number(log.categoria.importe) : null,
            nuevoMoneda: log.categoria?.moneda || 'ARS',
            nuevoComentario: log.categoria?.periodoaplicacion ? `Límite ${log.categoria.periodoaplicacion}` : 'Límite',
            nombreItem: log.categoria?.nombre || 'Categoría',
          });
        }
      }
    }
  } catch (legacyErr) {
    console.warn('[Audit] Error querying legacy tables:', legacyErr);
  }

  // Sort by date descending
  results.sort((a, b) => (b.fechacambio || '').localeCompare(a.fechacambio || ''));

  return results;
}
