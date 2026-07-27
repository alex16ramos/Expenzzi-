'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Coins, RefreshCw, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RatesData {
  usdars: number;
  usdarsOficial?: number;
  usduyu: number;
  arsusd: number;
  arsuyu: number;
  uyuusd: number;
  uyuars: number;
}

export function ExchangeRateDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fecha, setFecha] = useState<string>('');
  const [rates, setRates] = useState<RatesData | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cotizaciones');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.rates) {
        setRates(data.rates);
        setFecha(data.fecha || new Date().toISOString().split('T')[0]);
      }
    } catch (err) {
      console.error('Error fetching rates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function loadRates() {
      try {
        const res = await fetch('/api/cotizaciones');
        if (!res.ok) return;
        const data = await res.json();
        if (!ignore && data.success && data.rates) {
          setRates(data.rates);
          setFecha(data.fecha || new Date().toISOString().split('T')[0]);
        }
      } catch (err) {
        console.error('Error fetching rates:', err);
      }
    }
    loadRates();
    return () => {
      ignore = true;
    };
  }, []);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const usdarsBlueFormatted = rates ? rates.usdars.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '1.380,00';
  const usdarsOficialFormatted = rates && rates.usdarsOficial ? rates.usdarsOficial.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '1.120,00';
  const usduyuFormatted = rates ? rates.usduyu.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '40,50';
  const arsuyuFormatted = rates ? rates.arsuyu.toFixed(3) : '0,029';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
        title="Cotizaciones en vivo (DolarHoy Blue, Oficial, UYU)"
        aria-label="Ver cotizaciones en vivo"
      >
        <Coins className="w-4 h-4 text-emerald-500" />
        <span className="text-[11px] font-extrabold hidden md:inline text-slate-700 dark:text-slate-300">
          Blue $ {usdarsBlueFormatted.split(',')[0]}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 overflow-hidden space-y-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Cotizaciones DolarHoy</h4>
                  <p className="text-[10px] text-slate-400">Mercado Blue y Oficial en tiempo real</p>
                </div>
              </div>
              <button
                type="button"
                onClick={fetchRates}
                disabled={loading}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Actualizar cotización"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
              </button>
            </div>

            {/* Rates Items */}
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🟦</span>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block leading-tight">Dólar Blue</span>
                    <span className="text-[9px] text-slate-400">DolarHoy (Mercado Libre)</span>
                  </div>
                </div>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                  $ {usdarsBlueFormatted}
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🏦</span>
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block leading-tight">Dólar Oficial</span>
                    <span className="text-[9px] text-slate-400">Banco Central (BCRA)</span>
                  </div>
                </div>
                <span className="font-extrabold text-slate-700 dark:text-slate-300">
                  $ {usdarsOficialFormatted}
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🇺🇾</span>
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block leading-tight">USD / UYU</span>
                    <span className="text-[9px] text-slate-400">Peso Uruguayo</span>
                  </div>
                </div>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                  $U {usduyuFormatted}
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🇦🇷</span>
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block leading-tight">ARS / UYU</span>
                    <span className="text-[9px] text-slate-400">Cruzo ARS a UYU</span>
                  </div>
                </div>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                  $U {arsuyuFormatted}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
              <span>Fuente: DolarApi (DolarHoy)</span>
              <span>{fecha || 'Hoy'}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
