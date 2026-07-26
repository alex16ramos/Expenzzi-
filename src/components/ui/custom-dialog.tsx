'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

export type DialogVariant = 'info' | 'success' | 'warning' | 'danger';

export interface CustomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string | React.ReactNode;
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export function CustomDialog({
  isOpen,
  onClose,
  title,
  description,
  variant = 'info',
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  onConfirm,
  isLoading = false,
  children,
}: CustomDialogProps) {
  const getIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircle2 className="w-7 h-7 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-7 h-7 text-amber-500" />;
      case 'danger':
        return <XCircle className="w-7 h-7 text-rose-500" />;
      default:
        return <Info className="w-7 h-7 text-blue-500" />;
    }
  };

  const getConfirmButtonStyles = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-10 overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header / Icon */}
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
                {getIcon()}
              </div>
              <div className="pr-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 leading-6">
                  {title}
                </h3>
                {description && (
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {description}
                  </div>
                )}
              </div>
            </div>

            {/* Custom Content */}
            {children && <div className="my-4">{children}</div>}

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              {onConfirm && cancelText && (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  {cancelText}
                </button>
              )}
              {onConfirm ? (
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center gap-2 ${getConfirmButtonStyles()} disabled:opacity-50`}
                >
                  {isLoading && (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {confirmText}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 rounded-xl transition-colors"
                >
                  {confirmText}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
