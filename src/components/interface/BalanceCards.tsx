'use client';

import React, { useState } from 'react';
import { PiggyBank, TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

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
  selectedCurrency?: 'ARS' | 'USD' | 'UYU';
  onCurrencySelect?: (curr: 'ARS' | 'USD' | 'UYU') => void;
}

const DEFAULT_BALANCES: GeneralBalances = {
  ARS: { ingresos: 0, gastos: 0, ahorros: 0, net: 0 },
  USD: { ingresos: 0, gastos: 0, ahorros: 0, net: 0 },
  UYU: { ingresos: 0, gastos: 0, ahorros: 0, net: 0 },
};

export function BalanceCards({
  balances = DEFAULT_BALANCES,
  isLoading = false,
  selectedCurrency: externalSelectedCurrency,
  onCurrencySelect,
}: BalanceCardsProps) {
  const [internalCurrency, setInternalCurrency] = useState<'ARS' | 'USD' | 'UYU'>('ARS');
  const activeCurrency = externalSelectedCurrency || internalCurrency;

  const handleSelectCurrency = (curr: 'ARS' | 'USD' | 'UYU') => {
    setInternalCurrency(curr);
    if (onCurrencySelect) {
      onCurrencySelect(curr);
    }
  };

  const currencyConfigs = [
    {
      code: 'ARS' as const,
      label: 'Pesos Argentinos',
      symbol: '$',
      tabColor: 'bg-indigo-600 dark:bg-indigo-700 text-white',
      inactiveTabColor: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/60',
      bgGradient: 'from-indigo-600/10 via-blue-600/5 to-transparent',
      border: 'border-indigo-500/30 dark:border-indigo-500/40',
      accent: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      code: 'USD' as const,
      label: 'Dólares Estadounidenses',
      symbol: 'US$',
      tabColor: 'bg-emerald-600 dark:bg-emerald-700 text-white',
      inactiveTabColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60',
      bgGradient: 'from-emerald-600/10 via-teal-600/5 to-transparent',
      border: 'border-emerald-500/30 dark:border-emerald-500/40',
      accent: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      code: 'UYU' as const,
      label: 'Pesos Uruguayos',
      symbol: '$U',
      tabColor: 'bg-amber-600 dark:bg-amber-700 text-white',
      inactiveTabColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60',
      bgGradient: 'from-amber-600/10 via-orange-600/5 to-transparent',
      border: 'border-amber-500/30 dark:border-amber-500/40',
      accent: 'text-amber-600 dark:text-amber-400',
    },
  ];

  const formatMoney = (val: number, symbol: string) => {
    return `${symbol} ${val.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const activeConfig = currencyConfigs.find((c) => c.code === activeCurrency) || currencyConfigs[0];
  const activeData = balances[activeConfig.code] || DEFAULT_BALANCES[activeConfig.code];
  const isPositive = activeData.net >= 0;

  return (
    <div className="w-full space-y-3">

      {/* FOLDER TABS HEADER BAR */}
      <div className="relative pt-2">
        <div className="flex items-end gap-1.5 relative z-10 -mb-[2px]">
          {currencyConfigs.map((cfg) => {
            const isActive = activeCurrency === cfg.code;
            return (
              <button
                key={cfg.code}
                onClick={() => handleSelectCurrency(cfg.code)}
                className={`relative px-4 py-2 text-xs font-extrabold rounded-t-2xl transition-all duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? `bg-white dark:bg-slate-900 bg-gradient-to-t ${cfg.bgGradient} border-t border-x ${cfg.border} rounded-t-xl p-5 -translate-y-[0.7px] z-20`
                    : `${cfg.inactiveTabColor} opacity-85 hover:opacity-100 z-10 -translate-y-[1.5px] cursor-pointer`
                }`}
              >
                <span>{cfg.code}</span>
                <span className="text-[10px] font-normal opacity-80">({cfg.symbol})</span>
              </button>
            );
          })}
        </div>

        {/* ACTIVE FOLDER CONTENT CARD */}
        <AnimatePresence mode="popLayout" initial={false}>
          {isLoading ? (
            <div className="p-5 bg-white dark:bg-slate-900 rounded-b-3xl rounded-tr-3xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-md">
              <Skeleton className="h-5 w-24 rounded-md" />
              <Skeleton className="h-8 w-44 rounded-lg" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : (
            <motion.div
              key={activeConfig.code}
              initial={{ opacity: 0, x: 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.20, ease: 'easeInOut', type: 'tween' }}
              className={`bg-white dark:bg-slate-900 bg-gradient-to-br ${activeConfig.bgGradient} rounded-b-3xl rounded-tr-3xl p-5 border ${activeConfig.border} shadow-lg relative overflow-hidden transition-all`}
            >
              {/* Net Balance Display */}
              <div className="py-2">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Balance Neto Consolidado</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isPositive ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
                    {formatMoney(activeData.net, activeConfig.symbol)}
                  </span>
                  {isPositive ? (
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-rose-500" />
                  )}
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> Ingresos
                  </span>
                  <p className="font-extrabold text-slate-800 dark:text-slate-100 mt-1 truncate">
                    {formatMoney(activeData.ingresos, activeConfig.symbol)}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" /> Egresos
                  </span>
                  <p className="font-extrabold text-slate-800 dark:text-slate-100 mt-1 truncate">
                    {formatMoney(activeData.gastos, activeConfig.symbol)}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                    <PiggyBank className="w-3.5 h-3.5" /> Ahorros
                  </span>
                  <p className="font-extrabold text-slate-800 dark:text-slate-100 mt-1 truncate">
                    {formatMoney(activeData.ahorros, activeConfig.symbol)}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
