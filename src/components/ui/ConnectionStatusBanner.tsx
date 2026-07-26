'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ConnectionStatusBanner() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [showRestored, setShowRestored] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowRestored(true);
        const timer = setTimeout(() => {
          setShowRestored(false);
          setWasOffline(false);
        }, 3500);
        return () => clearTimeout(timer);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowRestored(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-amber-500/95 dark:bg-amber-600/95 text-white py-2 px-4 shadow-md backdrop-blur-md flex items-center justify-center gap-2 text-xs font-semibold"
        >
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>Sin conexión a Internet — Trabajando en modo fuera de línea</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="ml-2 p-1 hover:bg-amber-600/50 dark:hover:bg-amber-700/50 rounded transition-colors flex items-center gap-1 text-[11px] font-bold underline"
          >
            <RefreshCw className="w-3 h-3" /> Reintentar
          </button>
        </motion.div>
      )}

      {isOnline && showRestored && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-emerald-500/95 dark:bg-emerald-600/95 text-white py-2 px-4 shadow-md backdrop-blur-md flex items-center justify-center gap-2 text-xs font-semibold"
        >
          <Wifi className="w-4 h-4" />
          <span>¡Conexión restablecida con éxito!</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
