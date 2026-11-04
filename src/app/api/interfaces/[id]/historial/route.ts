import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkUserInterfaceMembership } from '@/lib/membership-cache';
import { getAuditHistory, AuditRecord } from '@/lib/audit';

export type { AuditRecord };

export const dynamic = 'force-dynamic';

async function getUserIdFromSession(): Promise<string | null> {
  try {
    const session = await auth.getSession();
    const sessObj = session as unknown as Record<string, unknown>;
    const dataObj = sessObj?.data as Record<string, unknown> | undefined;
    const userObj = (dataObj?.user || sessObj?.user) as Record<string, unknown> | undefined;
    return ((userObj?.id || userObj?.idusuario || userObj?.userId) as string) || null;
  } catch {
    return null;
  }
}

/**
 * GET /api/interfaces/[id]/historial
 * Returns audit change logs for historialgasto, historialingreso, historialahorro, and historiallimite
 * with previous values and current values (RF6).
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

    const interfaceIdBigInt = BigInt(interfaceIdNum);

    const { hasAccess } = await checkUserInterfaceMembership(userId, interfaceIdBigInt);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const tipoParam = searchParams.get('tipo') || 'todos'; // gasto | ingreso | ahorro | limite | todos
    const entityId = searchParams.get('entityId'); // Optional filter by specific item ID

    const validTipo = ['todos', 'gasto', 'ingreso', 'ahorro', 'limite'].includes(tipoParam)
      ? (tipoParam as 'todos' | 'gasto' | 'ingreso' | 'ahorro' | 'limite')
      : 'todos';

    const results = await getAuditHistory({
      interfaceId: interfaceIdBigInt,
      tipo: validTipo,
      entityId: entityId || null,
    });

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
