'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[SW] ServiceWorker registered successfully:', reg.scope);
        })
        .catch((err) => {
          console.error('[SW] ServiceWorker registration failed:', err);
        });
    }
  }, []);

  return null;
}
