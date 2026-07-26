'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, CloudUpload, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getPendingOfflineMutations,
  flushOfflineQueue,
  subscribeToSyncQueue,
} from '@/lib/offline-sync';

export function ConnectionStatusBanner() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });
  const [pendingCount, setPendingCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return getPendingOfflineMutations().length;
    }
    return 0;
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showRestored, setShowRestored] = useState<boolean>(false);

  useEffect(() => {
    // Subscribe to queue updates
    const unsubscribe = subscribeToSyncQueue((count) => {
      setPendingCount(count);
    });

    const handleOnline = async () => {
      setIsOnline(true);
      const queueLen = getPendingOfflineMutations().length;

      if (queueLen > 0) {
        setIsSyncing(true);
        const { remainingCount } = await flushOfflineQueue();
        setIsSyncing(false);
        setPendingCount(remainingCount);
      }

      setShowRestored(true);
      const timer = setTimeout(() => {
        setShowRestored(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
      setPendingCount(getPendingOfflineMutations().length);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    if (!navigator.onLine) {
      window.location.reload();
      return;
    }
    setIsSyncing(true);
    const { remainingCount } = await flushOfflineQueue();
    setIsSyncing(false);
    setPendingCount(remainingCount);
  };

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
          <span>
            Sin conexión a Internet — Modo sin conexión
            {pendingCount > 0 && ` (${pendingCount} ${pendingCount === 1 ? 'cambio guardado localmente' : 'cambios guardados localmente'})`}
          </span>
          <button
            type="button"
            onClick={handleManualSync}
            className="ml-2 p-1 hover:bg-amber-600/50 dark:hover:bg-amber-700/50 rounded transition-colors flex items-center gap-1 text-[11px] font-bold underline cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Reintentar
          </button>
        </motion.div>
      )}

      {isOnline && isSyncing && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-indigo-600/95 text-white py-2 px-4 shadow-md backdrop-blur-md flex items-center justify-center gap-2 text-xs font-semibold"
        >
          <CloudUpload className="w-4 h-4 animate-bounce" />
          <span>Sincronizando cambios guardados con la nube...</span>
        </motion.div>
      )}

      {isOnline && !isSyncing && showRestored && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-emerald-500/95 dark:bg-emerald-600/95 text-white py-2 px-4 shadow-md backdrop-blur-md flex items-center justify-center gap-2 text-xs font-semibold"
        >
          {pendingCount === 0 ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>¡Conexión restablecida! Todos los cambios se subieron a la nube.</span>
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4" />
              <span>¡Conexión restablecida con éxito!</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
