'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

interface ExchangeRates {
  usdars: number;
  usdarsOficial?: number;
  usduyu: number;
  arsusd: number;
  arsuyu: number;
  uyuusd: number;
  uyuars: number;
}

interface ConsolidatedBalance {
  moneda: string;
  iddeudor: string;
  deudorNombre: string;
  idacreedor: string;
  acreedorNombre: string;
  montoNeto: number;
  desglose: {
    monedaOriginal: string;
    montoOriginal: number;
    montoConvertido: number;
  }[];
  pendingSettlement?: {
    iddeuda: string;
    confirmadoDeudor: boolean;
    confirmadoAcreedor: boolean;
  } | null;
}

interface GastosCompartidosSectionProps {
  interfaceId: string;
  members: Member[];
}

function convertCurrency(
  amount: number,
  sourceCurrency: string,
  targetCurrency: string,
  rates?: ExchangeRates | null
): number {
  if (!rates || sourceCurrency === targetCurrency) return amount;
  const usdars = rates.usdars || 1380;
  const usduyu = rates.usduyu || 40.5;

  if (sourceCurrency === 'ARS') {
    if (targetCurrency === 'USD') return amount / usdars;
    if (targetCurrency === 'UYU') return amount * (usduyu / usdars);
  }
  if (sourceCurrency === 'USD') {
    if (targetCurrency === 'ARS') return amount * usdars;
    if (targetCurrency === 'UYU') return amount * usduyu;
  }
  if (sourceCurrency === 'UYU') {
    if (targetCurrency === 'ARS') return amount * (usdars / usduyu);
    if (targetCurrency === 'USD') return amount / usduyu;
  }
  return amount;
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
  const [rates, setRates] = useState<ExchangeRates | null>(null);
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
      setRates(data.rates || null);
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
          setRates(data.rates || null);
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
    netItem: ConsolidatedBalance,
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
        toast.success(`¡Deuda de $${netItem.montoNeto.toLocaleString('es-AR')} ${netItem.moneda} saldada mutuamente! 🎉`);
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

  // Calculate pairwise consolidated balances in target `monedaFilter` across all currencies
  const consolidatedBalances = useMemo(() => {
    const memberMap = new Map(members.map((m) => [m.idusuario, m.nombreusuario]));
    const list: ConsolidatedBalance[] = [];
    const processedPairs = new Set<string>();

    members.forEach((m1) => {
      members.forEach((m2) => {
        if (m1.idusuario >= m2.idusuario) return;
        const u1 = m1.idusuario;
        const u2 = m2.idusuario;
        const pairKey = `${u1}:${u2}`;
        if (processedPairs.has(pairKey)) return;
        processedPairs.add(pairKey);

        const debts1to2 = netBalances.filter(
          (b) => b.iddeudor === u1 && b.idacreedor === u2 && b.montoNeto > 0
        );
        const debts2to1 = netBalances.filter(
          (b) => b.iddeudor === u2 && b.idacreedor === u1 && b.montoNeto > 0
        );

        let sum1to2Converted = 0;
        const desglose1to2: { monedaOriginal: string; montoOriginal: number; montoConvertido: number }[] = [];

        debts1to2.forEach((b) => {
          const conv = convertCurrency(b.montoNeto, b.moneda, monedaFilter, rates);
          sum1to2Converted += conv;
          desglose1to2.push({
            monedaOriginal: b.moneda,
            montoOriginal: b.montoNeto,
            montoConvertido: conv,
          });
        });

        let sum2to1Converted = 0;
        const desglose2to1: { monedaOriginal: string; montoOriginal: number; montoConvertido: number }[] = [];

        debts2to1.forEach((b) => {
          const conv = convertCurrency(b.montoNeto, b.moneda, monedaFilter, rates);
          sum2to1Converted += conv;
          desglose2to1.push({
            monedaOriginal: b.moneda,
            montoOriginal: b.montoNeto,
            montoConvertido: conv,
          });
        });

        if (sum1to2Converted > sum2to1Converted) {
          const netAmount = Math.round((sum1to2Converted - sum2to1Converted) * 100) / 100;
          if (netAmount > 0) {
            const pendingS = debts1to2.find((b) => b.pendingSettlement)?.pendingSettlement || null;

            list.push({
              moneda: monedaFilter,
              iddeudor: u1,
              deudorNombre: memberMap.get(u1) || 'Usuario',
              idacreedor: u2,
              acreedorNombre: memberMap.get(u2) || 'Usuario',
              montoNeto: netAmount,
              desglose: desglose1to2,
              pendingSettlement: pendingS,
            });
          }
        } else if (sum2to1Converted > sum1to2Converted) {
          const netAmount = Math.round((sum2to1Converted - sum1to2Converted) * 100) / 100;
          if (netAmount > 0) {
            const pendingS = debts2to1.find((b) => b.pendingSettlement)?.pendingSettlement || null;

            list.push({
              moneda: monedaFilter,
              iddeudor: u2,
              deudorNombre: memberMap.get(u2) || 'Usuario',
              idacreedor: u1,
              acreedorNombre: memberMap.get(u1) || 'Usuario',
              montoNeto: netAmount,
              desglose: desglose2to1,
              pendingSettlement: pendingS,
            });
          }
        }
      });
    });

    return list;
  }, [members, netBalances, monedaFilter, rates]);

  // Split consolidated balances into "Mis Deudas", "Me Deben", and "Otras Deudas"
  const myDebtsToPay = consolidatedBalances.filter((b) => b.iddeudor === currentUserId && b.montoNeto > 0);
  const myDebtsToCollect = consolidatedBalances.filter((b) => b.idacreedor === currentUserId && b.montoNeto > 0);
  const otherBalances = consolidatedBalances.filter(
    (b) => b.iddeudor !== currentUserId && b.idacreedor !== currentUserId && b.montoNeto > 0
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Currency Controls */}
      <div className="flex flex-col gap-3 bg-white dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 backdrop-blur-md text-slate-900 dark:text-slate-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
              Gastos Compartidos y Balances de Deudas Unificados
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cálculo equitativo entre {members.length} integrante(s) con conversión automática y confirmación mutua de pagos.
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
              title="Actualizar saldos y cotizaciones"
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-900 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Exchange Rates Banner */}
        {rates && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] bg-indigo-50/50 dark:bg-slate-950/60 p-2.5 px-3 rounded-xl border border-indigo-100 dark:border-slate-800/80 text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Cotizaciones de hoy:
            </span>
            <span>1 USD = <strong>${rates.usdars?.toLocaleString('es-AR')} ARS</strong></span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>1 USD = <strong>${rates.usduyu?.toLocaleString('es-AR')} UYU</strong></span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>1 UYU = <strong>${(rates.usdars / rates.usduyu).toLocaleString('es-AR', { maximumFractionDigits: 2 })} ARS</strong></span>
          </div>
        )}
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
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-300 text-xs font-bold flex items-center justify-center border border-rose-500/30 shrink-0 mt-0.5">
                          {item.acreedorNombre.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            Le debes a <span className="text-rose-600 dark:text-rose-300">{item.acreedorNombre}</span>
                          </p>
                          {/* Desglose de monedas de origen */}
                          <div className="flex flex-col gap-0.5 mt-1">
                            {item.desglose.map((d, idx) => (
                              <span key={idx} className="text-[10px] text-slate-500 dark:text-slate-400">
                                Monto original: <strong className="text-slate-700 dark:text-slate-200">${d.montoOriginal.toLocaleString('es-AR')} {d.monedaOriginal}</strong>
                                {d.monedaOriginal !== item.moneda && rates && (
                                  <span className="ml-1 text-[9.5px] font-semibold text-indigo-600 dark:text-indigo-400">
                                    (≈ ${d.montoConvertido.toLocaleString('es-AR', { maximumFractionDigits: 2 })} {item.moneda})
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400">
                          ${item.montoNeto.toLocaleString('es-AR', { maximumFractionDigits: 2 })} {item.moneda}
                        </span>
                        <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                          Total consolidado
                        </p>
                      </div>
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
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-3 rounded-lg font-semibold gap-1 shrink-0 cursor-pointer"
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
                          className="text-[10px] h-7 px-2 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 cursor-pointer"
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
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center border border-emerald-500/30 shrink-0 mt-0.5">
                          {item.deudorNombre.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            <span className="text-emerald-600 dark:text-emerald-300">{item.deudorNombre}</span> te debe
                          </p>
                          {/* Desglose de monedas de origen */}
                          <div className="flex flex-col gap-0.5 mt-1">
                            {item.desglose.map((d, idx) => (
                              <span key={idx} className="text-[10px] text-slate-500 dark:text-slate-400">
                                Monto original: <strong className="text-slate-700 dark:text-slate-200">${d.montoOriginal.toLocaleString('es-AR')} {d.monedaOriginal}</strong>
                                {d.monedaOriginal !== item.moneda && rates && (
                                  <span className="ml-1 text-[9.5px] font-semibold text-indigo-600 dark:text-indigo-400">
                                    (≈ ${d.montoConvertido.toLocaleString('es-AR', { maximumFractionDigits: 2 })} {item.moneda})
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                          ${item.montoNeto.toLocaleString('es-AR', { maximumFractionDigits: 2 })} {item.moneda}
                        </span>
                        <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                          Total consolidado
                        </p>
                      </div>
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
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-3 rounded-lg font-semibold gap-1 shrink-0 cursor-pointer"
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
                          className="text-[10px] h-7 px-2 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 cursor-pointer"
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
                  ${item.montoNeto.toLocaleString('es-AR', { maximumFractionDigits: 2 })} {item.moneda}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section: Shared Expenses Detail List (All Currencies) */}
      <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl text-slate-900 dark:text-slate-100">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Receipt className="w-4 h-4 text-violet-500 dark:text-violet-400" />
            Detalle de Gastos Compartidos Registrados ({sharedExpenses.length})
          </h3>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            Moneda de vista: <strong>{monedaFilter}</strong>
          </span>
        </div>

        {sharedExpenses.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No se han registrado gastos compartidos en esta interfaz.
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {sharedExpenses.map((exp) => {
              const convertedTotal = convertCurrency(exp.importeTotal, exp.moneda, monedaFilter, rates);
              const convertedCuota = convertCurrency(exp.cuotaPorPersona, exp.moneda, monedaFilter, rates);
              const isDifferentCurrency = exp.moneda !== monedaFilter;

              return (
                <div
                  key={exp.idgasto}
                  className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {exp.comentario || 'Gasto Compartido sin comentario'}
                        </span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                          {exp.fecha}
                        </span>
                        {isDifferentCurrency && rates && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            {exp.moneda} → {monedaFilter}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Pagado por: <strong className="text-slate-800 dark:text-slate-200">{exp.responsableNombre}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold text-violet-600 dark:text-violet-300 block">
                        ${exp.importeTotal.toLocaleString('es-AR')} {exp.moneda}
                      </span>
                      {isDifferentCurrency && rates && (
                        <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                          ≈ ${convertedTotal.toLocaleString('es-AR', { maximumFractionDigits: 2 })} {monedaFilter}
                        </p>
                      )}
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        ${exp.cuotaPorPersona.toLocaleString('es-AR')} {exp.moneda}
                        {isDifferentCurrency && rates && ` (≈ $${convertedCuota.toLocaleString('es-AR', { maximumFractionDigits: 2 })} ${monedaFilter})`} / persona
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
              );
            })}
          </div>
        )}
      </div>

      {/* Historial de Liquidaciones Mutuas (Saldadas) */}
      {settlements.length > 0 && (
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            Historial de Liquidaciones de Deudas ({settlements.length})
          </h3>
          <div className="space-y-2">
            {settlements.map((s) => {
              const convertedMonto = convertCurrency(s.monto, s.moneda, monedaFilter, rates);
              const isDifferentCurrency = s.moneda !== monedaFilter;

              return (
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
                    {isDifferentCurrency && rates && (
                      <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 ml-1.5">
                        (≈ ${convertedMonto.toLocaleString('es-AR', { maximumFractionDigits: 2 })} {monedaFilter})
                      </span>
                    )}
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
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
