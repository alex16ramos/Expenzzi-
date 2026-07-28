import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { checkUserInterfaceMembership } from '@/lib/membership-cache';
import { notifyInterfaceMembers } from '@/lib/notify-members';
import { emitRealtimeEvent } from '@/lib/events';
import { TMoneda } from '@prisma/client';

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
 * POST /api/interfaces/[id]/gastos-compartidos/saldar
 * Handles mutual payment confirmation (confirmadoDeudor / confirmadoAcreedor)
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

    const { hasAccess } = await checkUserInterfaceMembership(userId, interfaceId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await req.json();
    const { iddeuda, iddeudor, idacreedor, monto, moneda, action } = body;

    if (!iddeudor || !idacreedor || !monto || !moneda) {
      return NextResponse.json(
        { error: 'iddeudor, idacreedor, monto y moneda son requeridos' },
        { status: 400 }
      );
    }

    // Ensure users exist in db
    await prisma.usuario.upsert({
      where: { idusuario: iddeudor },
      update: {},
      create: { idusuario: iddeudor, nombreusuario: 'Usuario', email: `${iddeudor}@expenzzi.local` },
    });

    await prisma.usuario.upsert({
      where: { idusuario: idacreedor },
      update: {},
      create: { idusuario: idacreedor, nombreusuario: 'Usuario', email: `${idacreedor}@expenzzi.local` },
    });

    let existing = null;
    if (iddeuda) {
      existing = await prisma.deudaSaldada.findUnique({
        where: { iddeuda: BigInt(iddeuda) },
      });
    } else {
      existing = await prisma.deudaSaldada.findFirst({
        where: {
          idinterfazoperacion: interfaceId,
          iddeudor,
          idacreedor,
          moneda: moneda as TMoneda,
          estado: true,
          fechasaldado: null,
        },
      });
    }

    let newConfDeudor = existing ? existing.confirmadoDeudor : false;
    let newConfAcreedor = existing ? existing.confirmadoAcreedor : false;

    if (action === 'confirm_deudor' || (userId === iddeudor && action !== 'unconfirm_deudor')) {
      newConfDeudor = true;
    } else if (action === 'unconfirm_deudor') {
      newConfDeudor = false;
    }

    if (action === 'confirm_acreedor' || (userId === idacreedor && action !== 'unconfirm_acreedor')) {
      newConfAcreedor = true;
    } else if (action === 'unconfirm_acreedor') {
      newConfAcreedor = false;
    }

    const fullySettled = newConfDeudor && newConfAcreedor;

    let result;
    if (existing) {
      result = await prisma.deudaSaldada.update({
        where: { iddeuda: existing.iddeuda },
        data: {
          confirmadoDeudor: newConfDeudor,
          confirmadoAcreedor: newConfAcreedor,
          monto: Number(monto),
          fechasaldado: fullySettled ? new Date() : null,
        },
        include: { deudor: true, acreedor: true },
      });
    } else {
      result = await prisma.deudaSaldada.create({
        data: {
          idinterfazoperacion: interfaceId,
          iddeudor,
          idacreedor,
          monto: Number(monto),
          moneda: moneda as TMoneda,
          confirmadoDeudor: newConfDeudor,
          confirmadoAcreedor: newConfAcreedor,
          fechasaldado: fullySettled ? new Date() : null,
          estado: true,
        },
        include: { deudor: true, acreedor: true },
      });
    }

    const deudorNombre = result.deudor?.nombreusuario || 'El deudor';
    const acreedorNombre = result.acreedor?.nombreusuario || 'El acreedor';
    const formattedAmount = `${Number(monto).toLocaleString('es-AR')} ${moneda}`;

    if (fullySettled) {
      notifyInterfaceMembers({
        idinterfazoperacion: interfaceId,
        idemisor: userId,
        tipo: 'DEUDA_SALDADA',
        titulo: 'Deuda Saldada ✓',
        mensaje: `La deuda de ${formattedAmount} entre ${deudorNombre} y ${acreedorNombre} ha sido completamente saldada por confirmación mutua.`,
      });
    } else {
      const partyWaiting = !newConfDeudor ? deudorNombre : acreedorNombre;
      notifyInterfaceMembers({
        idinterfazoperacion: interfaceId,
        idemisor: userId,
        tipo: 'CONFIRMACION_PAGO_PENDIENTE',
        titulo: 'Confirmación de Pago Pendiente',
        mensaje: `Se ha registrado una confirmación de pago de ${formattedAmount}. Esperando confirmación de ${partyWaiting}.`,
      });
    }

    emitRealtimeEvent(String(interfaceId), { type: 'MUTATION', entity: 'deudasaldada', action: 'update' });

    return NextResponse.json({
      success: true,
      deuda: {
        iddeuda: String(result.iddeuda),
        iddeudor: result.iddeudor,
        deudorNombre: result.deudor?.nombreusuario || 'Usuario',
        idacreedor: result.idacreedor,
        acreedorNombre: result.acreedor?.nombreusuario || 'Usuario',
        monto: Number(result.monto),
        moneda: result.moneda,
        confirmadoDeudor: result.confirmadoDeudor,
        confirmadoAcreedor: result.confirmadoAcreedor,
        fullySettled,
        fechasaldado: result.fechasaldado ? result.fechasaldado.toISOString() : null,
      },
    });
  } catch (err: unknown) {
    console.error('[API /api/interfaces/[id]/gastos-compartidos/saldar POST Error]:', err);
    const errorMsg = (err as { message?: string })?.message || 'Error del servidor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
