'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
  Check,
  RefreshCw,
  Receipt,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';

interface Member {
  idusuario: string;
  nombreusuario: string;
  fotoperfil?: string | null;
  email?: string;
}

interface NetBalance {
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

interface SharedExpense {
  idgasto: string;
  fecha: string;
  responsableId: string;
  responsableNombre: string;
  moneda: string;
  importeTotal: number;
  comentario: string;
  participantes: { idusuario: string; nombreusuario: string }[];
  cuotaPorPersona: number;
}

interface Settlement {
  iddeuda: string;
  iddeudor: string;
  deudorNombre: string;
  idacreedor: string;
  acreedorNombre: string;
  monto: number;
  moneda: string;
  confirmadoDeudor: boolean;
  confirmadoAcreedor: boolean;
  fechacreacion: string;
  fechasaldado?: string | null;
  fullySettled: boolean;
}

interface GastosCompartidosSectionProps {
  interfaceId: string;
  members: Member[];
}

export function GastosCompartidosSection({
  interfaceId,
  members = [],
}: GastosCompartidosSectionProps) {
  const session = authClient.useSession();
  const currentUserId = session?.data?.user?.id || '';

  const [monedaFilter, setMonedaFilter] = useState<'ARS' | 'USD' | 'UYU'>('ARS');
  const [netBalances, setNetBalances] = useState<NetBalance[]>([]);
  const [sharedExpenses, setSharedExpenses] = useState<SharedExpense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  const fetchSharedData = useCallback(async () => {
    try {
      const res = await fetch(`/api/interfaces/${interfaceId}/gastos-compartidos`);
      if (!res.ok) throw new Error('Error al cargar gastos compartidos');
      const data = await res.json();
      setNetBalances(data.netBalances || []);
      setSharedExpenses(data.sharedExpenses || []);
      setSettlements(data.settlements || []);
    } catch (err) {
      console.error(err);
      toast.error('No se pudieron cargar los saldos compartidos');
    } finally {
      setIsLoading(false);
    }
  }, [interfaceId]);

  useEffect(() => {
    let ignore = false;
    async function initFetch() {
      try {
        const res = await fetch(`/api/interfaces/${interfaceId}/gastos-compartidos`);
        if (!res.ok) throw new Error('Error al cargar gastos compartidos');
        const data = await res.json();
        if (!ignore) {
          setNetBalances(data.netBalances || []);
          setSharedExpenses(data.sharedExpenses || []);
          setSettlements(data.settlements || []);
        }
      } catch (err) {
        console.error(err);
        if (!ignore) toast.error('No se pudieron cargar los saldos compartidos');
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    initFetch();
    return () => {
      ignore = true;
    };
  }, [interfaceId]);

  const handleSaldarAction = async (
    netItem: NetBalance,
    action: 'confirm_deudor' | 'confirm_acreedor' | 'unconfirm_deudor' | 'unconfirm_acreedor'
  ) => {
    const actionKey = `${netItem.iddeudor}-${netItem.idacreedor}-${action}`;
    setIsActionLoading(actionKey);
    try {
      const res = await fetch(`/api/interfaces/${interfaceId}/gastos-compartidos/saldar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          iddeuda: netItem.pendingSettlement?.iddeuda,
          iddeudor: netItem.iddeudor,
          idacreedor: netItem.idacreedor,
          monto: netItem.montoNeto,
          moneda: netItem.moneda,
          action,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al procesar la confirmación de pago');
      }

      if (data.deuda?.fullySettled) {
        toast.success(`¡Deuda de $${netItem.montoNeto} ${netItem.moneda} saldada mutuamente! 🎉`);
      } else {
        toast.success('Confirmación registrada. Esperando a la otra parte.');
      }

      await fetchSharedData();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Error al saldar deuda';
      toast.error(msg);
    } finally {
      setIsActionLoading(null);
    }
  };

  const filteredBalances = netBalances.filter((b) => b.moneda === monedaFilter && b.montoNeto > 0);
  const filteredExpenses = sharedExpenses.filter((e) => e.moneda === monedaFilter);
  const filteredSettlements = settlements.filter((s) => s.moneda === monedaFilter);

  // Split balances into "Mis Deudas" and "Me Deben" and "Otras Deudas" (excluding $0 balances)
  const myDebtsToPay = filteredBalances.filter((b) => b.iddeudor === currentUserId && b.montoNeto > 0);
  const myDebtsToCollect = filteredBalances.filter((b) => b.idacreedor === currentUserId && b.montoNeto > 0);
  const otherBalances = filteredBalances.filter(
    (b) => b.iddeudor !== currentUserId && b.idacreedor !== currentUserId && b.montoNeto > 0
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Currency Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 backdrop-blur-md text-slate-900 dark:text-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            Gastos Compartidos y Balances de Deudas
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cálculo equitativo entre {members.length} integrante(s) y confirmación mutua de pagos recibidos/enviados.
          </p>
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
          {(['ARS', 'USD', 'UYU'] as const).map((curr) => (
            <button
              key={curr}
              type="button"
              onClick={() => setMonedaFilter(curr)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                monedaFilter === curr
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-900'
              }`}
            >
              {curr}
            </button>
          ))}
          <button
            type="button"
            onClick={fetchSharedData}
            title="Actualizar saldos"
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-900 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Pending Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mis Deudas (Tengo que pagar) */}
        <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-4 border border-rose-500/30 dark:border-rose-500/20 space-y-3 shadow-xl text-slate-900 dark:text-slate-100">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <Send className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              Tus Deudas Pendientes (Debes Pagar)
            </h3>
            <span className="text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-300 px-2 py-0.5 rounded border border-rose-500/20">
              {myDebtsToPay.length} pendiente(s)
            </span>
          </div>

          {myDebtsToPay.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/40">
              No tienes deudas pendientes en {monedaFilter} 🎉
            </div>
          ) : (
            <div className="space-y-3">
              {myDebtsToPay.map((item) => {
                const pendingS = item.pendingSettlement;
                const deudorConf = pendingS?.confirmadoDeudor;
                const acreedorConf = pendingS?.confirmadoAcreedor;

                return (
                  <div
                    key={`${item.iddeudor}-${item.idacreedor}-${item.moneda}`}
                    className="p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-300 text-xs font-bold flex items-center justify-center border border-rose-500/30">
                          {item.acreedorNombre.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            Le debes a <span className="text-rose-600 dark:text-rose-300">{item.acreedorNombre}</span>
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            Monto exacto: ${item.montoNeto.toLocaleString('es-AR')} {item.moneda}
                          </p>
                        </div>
                      </div>

                      <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400">
                        ${item.montoNeto.toLocaleString('es-AR')} {item.moneda}
                      </span>
                    </div>

                    {/* Multi-step Mutual Confirmation Status */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        <span className={`px-2 py-0.5 rounded flex items-center gap-1 font-semibold ${deudorConf ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'}`}>
                          {deudorConf ? <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> : <Clock className="w-3 h-3 text-amber-500 dark:text-amber-400" />}
                          Tú: {deudorConf ? 'Enviado ✓' : 'Sin confirmar'}
                        </span>

                        <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-600" />

                        <span className={`px-2 py-0.5 rounded flex items-center gap-1 font-semibold ${acreedorConf ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                          {acreedorConf ? <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> : <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />}
                          {item.acreedorNombre}: {acreedorConf ? 'Recibido ✓' : 'Pendiente'}
                        </span>
                      </div>

                      {/* Deudor Action Button */}
                      {!deudorConf ? (
                        <Button
                          size="sm"
                          onClick={() => handleSaldarAction(item, 'confirm_deudor')}
                          disabled={isActionLoading === `${item.iddeudor}-${item.idacreedor}-confirm_deudor`}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-3 rounded-lg font-semibold gap-1 shrink-0"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Marcar &quot;Pago Enviado&quot;
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSaldarAction(item, 'unconfirm_deudor')}
                          disabled={isActionLoading === `${item.iddeudor}-${item.idacreedor}-unconfirm_deudor`}
                          className="text-[10px] h-7 px-2 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                        >
                          Desmarcar envío
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Me Deben (Tienen que pagarme) */}
        <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-4 border border-emerald-500/30 dark:border-emerald-500/20 space-y-3 shadow-xl text-slate-900 dark:text-slate-100">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Te Deben a Ti (Debes Cobrar)
            </h3>
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20">
              {myDebtsToCollect.length} por cobrar
            </span>
          </div>

          {myDebtsToCollect.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/40">
              Nadie te debe en {monedaFilter} por el momento 👍
            </div>
          ) : (
            <div className="space-y-3">
              {myDebtsToCollect.map((item) => {
                const pendingS = item.pendingSettlement;
                const deudorConf = pendingS?.confirmadoDeudor;
                const acreedorConf = pendingS?.confirmadoAcreedor;

                return (
                  <div
                    key={`${item.iddeudor}-${item.idacreedor}-${item.moneda}`}
                    className="p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center border border-emerald-500/30">
                          {item.deudorNombre.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            <span className="text-emerald-600 dark:text-emerald-300">{item.deudorNombre}</span> te debe
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            Monto exacto: ${item.montoNeto.toLocaleString('es-AR')} {item.moneda}
                          </p>
                        </div>
                      </div>

                      <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                        ${item.montoNeto.toLocaleString('es-AR')} {item.moneda}
                      </span>
                    </div>

                    {/* Multi-step Mutual Confirmation Status */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        <span className={`px-2 py-0.5 rounded flex items-center gap-1 font-semibold ${deudorConf ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'}`}>
                          {deudorConf ? <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> : <Clock className="w-3 h-3 text-amber-500 dark:text-amber-400" />}
                          {item.deudorNombre}: {deudorConf ? 'Enviado ✓' : 'Pendiente'}
                        </span>

                        <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-600" />

                        <span className={`px-2 py-0.5 rounded flex items-center gap-1 font-semibold ${acreedorConf ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                          {acreedorConf ? <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> : <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />}
                          Tú: {acreedorConf ? 'Recibido ✓' : 'Sin confirmar'}
                        </span>
                      </div>

                      {/* Acreedor Action Button */}
                      {!acreedorConf ? (
                        <Button
                          size="sm"
                          onClick={() => handleSaldarAction(item, 'confirm_acreedor')}
                          disabled={isActionLoading === `${item.iddeudor}-${item.idacreedor}-confirm_acreedor`}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-3 rounded-lg font-semibold gap-1 shrink-0"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Marcar &quot;Pago Recibido&quot;
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSaldarAction(item, 'unconfirm_acreedor')}
                          disabled={isActionLoading === `${item.iddeudor}-${item.idacreedor}-unconfirm_acreedor`}
                          className="text-[10px] h-7 px-2 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                        >
                          Desmarcar recepción
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Otras deudas en la interfaz (entre otros usuarios) */}
      {otherBalances.length > 0 && (
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            Saldos Cruzados entre Otros Miembros ({otherBalances.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {otherBalances.map((item) => (
              <div
                key={`${item.iddeudor}-${item.idacreedor}-${item.moneda}`}
                className="p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div className="truncate pr-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.deudorNombre}</span>
                  <span className="text-slate-500"> le debe a </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.acreedorNombre}</span>
                </div>
                <span className="font-bold text-indigo-600 dark:text-indigo-300 shrink-0">
                  ${item.montoNeto.toLocaleString('es-AR')} {item.moneda}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section: Shared Expenses Detail List */}
      <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl text-slate-900 dark:text-slate-100">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Receipt className="w-4 h-4 text-violet-500 dark:text-violet-400" />
            Detalle de Gastos Compartidos Registrados ({filteredExpenses.length})
          </h3>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            Moneda: <strong>{monedaFilter}</strong>
          </span>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No se han registrado gastos compartidos en {monedaFilter} en esta interfaz.
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {filteredExpenses.map((exp) => (
              <div
                key={exp.idgasto}
                className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {exp.comentario || 'Gasto Compartido sin comentario'}
                      </span>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                        {exp.fecha}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Pagado por: <strong className="text-slate-800 dark:text-slate-200">{exp.responsableNombre}</strong>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-extrabold text-violet-600 dark:text-violet-300">
                      ${exp.importeTotal.toLocaleString('es-AR')} {exp.moneda}
                    </span>
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      ${exp.cuotaPorPersona.toLocaleString('es-AR')} / persona
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-900 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 mr-1">Participantes:</span>
                  {exp.participantes.map((p) => (
                    <span
                      key={p.idusuario}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/40 font-medium"
                    >
                      {p.nombreusuario}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historial de Liquidaciones Mutuas (Saldadas) */}
      {filteredSettlements.length > 0 && (
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            Historial de Liquidaciones de Deudas ({filteredSettlements.length})
          </h3>
          <div className="space-y-2">
            {filteredSettlements.map((s) => (
              <div
                key={s.iddeuda}
                className={`p-2.5 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs ${
                  s.fullySettled
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200'
                    : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-200'
                }`}
              >
                <div>
                  <span className="font-bold">{s.deudorNombre}</span>
                  <span> saldó a </span>
                  <span className="font-bold">{s.acreedorNombre}</span>
                  <span className="font-bold ml-2">
                    ${s.monto.toLocaleString('es-AR')} {s.moneda}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px]">
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      s.fullySettled
                        ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {s.fullySettled ? 'Saldada Mutuamente ✓' : 'Pendiente Confirmación Mutua'}
                  </span>
                  <span className="text-slate-500">
                    {s.fechasaldado ? new Date(s.fechasaldado).toLocaleDateString('es-AR') : new Date(s.fechacreacion).toLocaleDateString('es-AR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
