import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { checkUserInterfaceMembership } from '@/lib/membership-cache';

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

    const { hasAccess } = await checkUserInterfaceMembership(userId, interfaceId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Fetch members of interface
    const membersData = await prisma.usuarioInterfaz.findMany({
      where: { idinterfazoperacion: interfaceId, fechasalida: null },
      include: { usuario: true },
    });

    const members = membersData.map((m) => ({
      idusuario: m.idusuario,
      nombreusuario: m.usuario?.nombreusuario || 'Usuario',
      fotoperfil: m.usuario?.fotoperfil || null,
      email: m.usuario?.email || '',
    }));

    // Fetch all active gastos with participants belonging to this interface
    const gastosData = await prisma.gasto.findMany({
      where: {
        estado: true,
        OR: [
          { categoria: { idinterfazoperacion: interfaceId } },
          { submetodopago: { idinterfazoperacion: interfaceId } },
        ],
        participantes: { some: {} },
      },
      include: {
        usuarioResponsable: true,
        participantes: {
          include: { usuario: true },
        },
      },
      orderBy: { fecha: 'desc' },
    });

    // Fetch all active debt settlements for this interface
    const settlementsData = await prisma.deudaSaldada.findMany({
      where: { idinterfazoperacion: interfaceId, estado: true },
      include: {
        deudor: true,
        acreedor: true,
      },
      orderBy: { fechacreacion: 'desc' },
    });

    // Pairwise debt calculation map: rawDebts[moneda][deudorId][acreedorId] = amount
    const rawDebts: Record<string, Record<string, Record<string, number>>> = {
      ARS: {},
      USD: {},
      UYU: {},
    };

    const addRawDebt = (currency: string, deudor: string, acreedor: string, amt: number) => {
      if (deudor === acreedor || amt <= 0) return;
      if (!rawDebts[currency]) rawDebts[currency] = {};
      if (!rawDebts[currency][deudor]) rawDebts[currency][deudor] = {};
      rawDebts[currency][deudor][acreedor] = (rawDebts[currency][deudor][acreedor] || 0) + amt;
    };

    gastosData.forEach((g) => {
      const currency = g.moneda;
      const payerId = g.responsablegasto || g.responsableingresargasto;
      const totalAmt = Number(g.importe || 0);
      const participantIds = g.participantes.map((p) => p.idusuario);

      if (participantIds.length > 0 && totalAmt > 0) {
        const share = totalAmt / participantIds.length;
        participantIds.forEach((pId) => {
          if (pId !== payerId) {
            addRawDebt(currency, pId, payerId, share);
          }
        });
      }
    });

    // Process settlements: for fully confirmed settlements (confirmadoDeudor && confirmadoAcreedor), subtract from raw debts
    const settlements = settlementsData.map((s) => ({
      iddeuda: String(s.iddeuda),
      iddeudor: s.iddeudor,
      deudorNombre: s.deudor?.nombreusuario || 'Usuario',
      idacreedor: s.idacreedor,
      acreedorNombre: s.acreedor?.nombreusuario || 'Usuario',
      monto: Number(s.monto),
      moneda: s.moneda,
      confirmadoDeudor: s.confirmadoDeudor,
      confirmadoAcreedor: s.confirmadoAcreedor,
      fechacreacion: s.fechacreacion.toISOString(),
      fechasaldado: s.fechasaldado ? s.fechasaldado.toISOString() : null,
      estado: s.estado,
      fullySettled: s.confirmadoDeudor && s.confirmadoAcreedor,
    }));

    // Deduct fully settled amounts
    settlements.forEach((s) => {
      if (s.fullySettled && rawDebts[s.moneda]?.[s.iddeudor]?.[s.idacreedor]) {
        rawDebts[s.moneda][s.iddeudor][s.idacreedor] = Math.max(
          0,
          rawDebts[s.moneda][s.iddeudor][s.idacreedor] - s.monto
        );
      }
    });

    // Simplify net balances pairwise: for any pair (A, B) in currency C, net balance = Debts(A -> B) - Debts(B -> A)
    interface PairwiseNetBalance {
      moneda: string;
      iddeudor: string;
      deudorNombre: string;
      idacreedor: string;
      acreedorNombre: string;
      montoBruto: number;
      montoNeto: number;
      pendingSettlement?: {
        iddeuda: string;
        confirmadoDeudor: boolean;
        confirmadoAcreedor: boolean;
      } | null;
    }

    const netBalances: PairwiseNetBalance[] = [];
    const currencies = ['ARS', 'USD', 'UYU'];

    const memberMap = new Map(members.map((m) => [m.idusuario, m.nombreusuario]));

    currencies.forEach((curr) => {
      const currDebts = rawDebts[curr] || {};
      const processedPairs = new Set<string>();

      members.forEach((m1) => {
        members.forEach((m2) => {
          if (m1.idusuario >= m2.idusuario) return;
          const u1 = m1.idusuario;
          const u2 = m2.idusuario;
          const pairKey = `${curr}:${u1}:${u2}`;
          if (processedPairs.has(pairKey)) return;
          processedPairs.add(pairKey);

          const debt1to2 = currDebts[u1]?.[u2] || 0;
          const debt2to1 = currDebts[u2]?.[u1] || 0;

          if (debt1to2 > debt2to1) {
            const netAmount = debt1to2 - debt2to1;
            if (netAmount > 0.001) {
              const pendingS = settlements.find(
                (s) => s.moneda === curr && s.iddeudor === u1 && s.idacreedor === u2 && !s.fullySettled
              );

              netBalances.push({
                moneda: curr,
                iddeudor: u1,
                deudorNombre: memberMap.get(u1) || 'Usuario',
                idacreedor: u2,
                acreedorNombre: memberMap.get(u2) || 'Usuario',
                montoBruto: debt1to2,
                montoNeto: Math.round(netAmount * 100) / 100,
                pendingSettlement: pendingS
                  ? {
                      iddeuda: pendingS.iddeuda,
                      confirmadoDeudor: pendingS.confirmadoDeudor,
                      confirmadoAcreedor: pendingS.confirmadoAcreedor,
                    }
                  : null,
              });
            }
          } else if (debt2to1 > debt1to2) {
            const netAmount = debt2to1 - debt1to2;
            if (netAmount > 0.001) {
              const pendingS = settlements.find(
                (s) => s.moneda === curr && s.iddeudor === u2 && s.idacreedor === u1 && !s.fullySettled
              );

              netBalances.push({
                moneda: curr,
                iddeudor: u2,
                deudorNombre: memberMap.get(u2) || 'Usuario',
                idacreedor: u1,
                acreedorNombre: memberMap.get(u1) || 'Usuario',
                montoBruto: debt2to1,
                montoNeto: Math.round(netAmount * 100) / 100,
                pendingSettlement: pendingS
                  ? {
                      iddeuda: pendingS.iddeuda,
                      confirmadoDeudor: pendingS.confirmadoDeudor,
                      confirmadoAcreedor: pendingS.confirmadoAcreedor,
                    }
                  : null,
              });
            }
          }
        });
      });
    });

    const sharedExpenses = gastosData.map((g) => ({
      idgasto: String(g.idgasto),
      fecha: g.fecha.toISOString().split('T')[0],
      responsableId: g.responsablegasto || g.responsableingresargasto,
      responsableNombre: g.usuarioResponsable?.nombreusuario || 'Usuario',
      moneda: g.moneda,
      importeTotal: Number(g.importe),
      comentario: g.comentario || '',
      participantes: g.participantes.map((p) => ({
        idusuario: p.idusuario,
        nombreusuario: p.usuario?.nombreusuario || 'Usuario',
      })),
      cuotaPorPersona:
        g.participantes.length > 0
          ? Math.round((Number(g.importe) / g.participantes.length) * 100) / 100
          : 0,
    }));

    return NextResponse.json({
      members,
      sharedExpenses,
      netBalances,
      settlements,
    });
  } catch (err: unknown) {
    console.error('[API /api/interfaces/[id]/gastos-compartidos GET Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
