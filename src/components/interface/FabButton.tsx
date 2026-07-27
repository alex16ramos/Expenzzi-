'use client';

import React, { useState } from 'react';
import { Plus, ArrowUpCircle, ArrowDownCircle, PiggyBank } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FabButtonProps {
  onOpenGastoModal: () => void;
  onOpenIngresoModal: () => void;
  onOpenAhorroModal: () => void;
}

export function FabButton({
  onOpenGastoModal,
  onOpenIngresoModal,
  onOpenAhorroModal,
}: FabButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-20 lg:bottom-8 right-5 z-40 flex flex-col items-end gap-3 pointer-events-auto">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for closing when tapping outside */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30"
            />

            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9 }}
              className="flex flex-col items-end gap-2.5 z-40"
            >
              {/* Option Ahorro */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenAhorroModal();
                }}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-colors font-bold text-xs group cursor-pointer"
              >
                <span>Nuevo Ahorro</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PiggyBank className="w-4 h-4" />
                </div>
              </button>

              {/* Option Ingreso */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenIngresoModal();
                }}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-colors font-bold text-xs group cursor-pointer"
              >
                <span>Nuevo Ingreso</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowDownCircle className="w-4 h-4" />
                </div>
              </button>

              {/* Option Gasto */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenGastoModal();
                }}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xl border border-slate-200 dark:border-slate-800 hover:border-rose-500 transition-colors font-bold text-xs group cursor-pointer"
              >
                <span>Nuevo Gasto</span>
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowUpCircle className="w-4 h-4" />
                </div>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Trigger FAB */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-13 h-13 rounded-2xl text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center transition-colors z-40 cursor-pointer ${
          isOpen
            ? 'bg-slate-800 dark:bg-slate-700 rotate-45 scale-95 hover:bg-red-600/80 dark:hover:bg-red-500/80'
            : 'bg-indigo-600 hover:bg-indigo-500 hover:scale-105 active:scale-95'
        }`}
        aria-label="Registrar nueva operación"
        title="Registrar Operación"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>
    </div>
  );
}
