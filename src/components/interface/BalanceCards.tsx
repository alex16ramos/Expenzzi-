import React from 'react';
import { Wallet, PiggyBank, TrendingUp, TrendingDown } from 'lucide-react';

export interface CurrencyBalance {
  ingresos: number;
  gastos: number;
  ahorros: number;
  net: number;
}

export interface GeneralBalances {
  ARS: CurrencyBalance;
  USD: CurrencyBalance;
  UYU: CurrencyBalance;
}

interface BalanceCardsProps {
  balances?: GeneralBalances;
  isLoading?: boolean;
}

const DEFAULT_BALANCES: GeneralBalances = {
  ARS: { ingresos: 0, gastos: 0, ahorros: 0, net: 0 },
  USD: { ingresos: 0, gastos: 0, ahorros: 0, net: 0 },
  UYU: { ingresos: 0, gastos: 0, ahorros: 0, net: 0 },
};

export function BalanceCards({ balances = DEFAULT_BALANCES, isLoading = false }: BalanceCardsProps) {
  const currencyConfigs = [
    { code: 'ARS', label: 'Pesos Argentinos', symbol: '$', bgGradient: 'from-blue-600/20 via-indigo-600/10 to-slate-900', border: 'border-blue-500/30', accent: 'text-blue-400' },
    { code: 'USD', label: 'Dólares Estadounidenses', symbol: 'US$', bgGradient: 'from-emerald-600/20 via-teal-600/10 to-slate-900', border: 'border-emerald-500/30', accent: 'text-emerald-400' },
    { code: 'UYU', label: 'Pesos Uruguayos', symbol: '$U', bgGradient: 'from-amber-600/20 via-orange-600/10 to-slate-900', border: 'border-amber-500/30', accent: 'text-amber-400' },
  ] as const;

  const formatMoney = (val: number, symbol: string) => {
    return `${symbol} ${val.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-200 tracking-tight flex items-center gap-2">
          <Wallet className="w-4 h-4 text-violet-400" />
          Balance General Multimoneda (RF19)
        </h3>
        {isLoading && <span className="text-xs text-slate-400 animate-pulse">Actualizando...</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {currencyConfigs.map((cfg) => {
          const data = balances[cfg.code] || DEFAULT_BALANCES[cfg.code];
          const isPositive = data.net >= 0;

          return (
            <div
              key={cfg.code}
              className={`bg-gradient-to-br ${cfg.bgGradient} rounded-2xl p-4 border ${cfg.border} shadow-xl relative overflow-hidden backdrop-blur-md transition-all hover:border-slate-700`}
            >
              {/* Card Header */}
              <div className="flex justify-between items-center mb-2">
                <span className={`text-xs font-extrabold uppercase tracking-wider ${cfg.accent} bg-slate-950/60 px-2.5 py-0.5 rounded-lg border border-slate-800`}>
                  {cfg.code}
                </span>
                <span className="text-[11px] font-medium text-slate-400">{cfg.label}</span>
              </div>

              {/* Net Balance Large Display */}
              <div className="my-2">
                <p className="text-[11px] text-slate-400 font-medium">Balance Neto</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xl sm:text-2xl font-black ${isPositive ? 'text-white' : 'text-rose-400'}`}>
                    {formatMoney(data.net, cfg.symbol)}
                  </span>
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                  )}
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-[11px]">
                <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800/40">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Ingresos
                  </span>
                  <p className="font-bold text-slate-200 mt-0.5 truncate">
                    {formatMoney(data.ingresos, cfg.symbol)}
                  </p>
                </div>

                <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800/40">
                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" /> Egresos
                  </span>
                  <p className="font-bold text-slate-200 mt-0.5 truncate">
                    {formatMoney(data.gastos, cfg.symbol)}
                  </p>
                </div>

                <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800/40">
                  <span className="text-violet-400 font-semibold flex items-center gap-1">
                    <PiggyBank className="w-3 h-3" /> Ahorros
                  </span>
                  <p className="font-bold text-slate-200 mt-0.5 truncate">
                    {formatMoney(data.ahorros, cfg.symbol)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
