'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

function JoinInterfaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    async function processJoin() {
      if (!code || !code.trim()) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage('Código de invitación no proporcionado.');
          toast.error('Código de invitación no proporcionado.');
          setTimeout(() => router.replace('/dashboard'), 2000);
        }
        return;
      }

      try {
        const res = await fetch('/api/interfaces/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codigo: code.trim() }),
        });

        const data = await res.json();

        if (!isMounted) return;

        if (res.ok && data.success) {
          setStatus('success');
          toast.success(data.message || '¡Te has unido exitosamente a la interfaz!');
          const targetInterfaceId = data.data?.idinterfazoperacion;
          setTimeout(() => {
            if (targetInterfaceId) {
              router.replace(`/interface/${targetInterfaceId}`);
            } else {
              router.replace('/dashboard');
            }
          }, 1000);
        } else {
          setStatus('error');
          const msg = data.error || 'Código de invitación inválido o la interfaz se encuentra inactiva.';
          setErrorMessage(msg);
          toast.error(msg);
          setTimeout(() => router.replace('/dashboard'), 2500);
        }
      } catch (err) {
        console.error('Error al procesar unión a interfaz:', err);
        if (isMounted) {
          setStatus('error');
          setErrorMessage('Error de conexión al procesar el código.');
          toast.error('Error de conexión al procesar el código.');
          setTimeout(() => router.replace('/dashboard'), 2500);
        }
      }
    }

    processJoin();

    return () => {
      isMounted = false;
    };
  }, [code, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Uniéndose a la interfaz...</h2>
              <p className="text-sm text-slate-400 mt-2">
                Verificando tu enlace de invitación, aguarda un momento.
              </p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-emerald-400">¡Unión Exitosa!</h2>
              <p className="text-sm text-slate-400 mt-2">
                Redirigiendo a la interfaz de operación...
              </p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-rose-400">No fue posible unirse</h2>
              <p className="text-sm text-slate-400 mt-2">
                {errorMessage || 'El enlace de invitación no es válido o ha expirado.'}
              </p>
              <p className="text-xs text-slate-500 mt-4">
                Redirigiendo al panel principal...
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function JoinInterfacePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      }
    >
      <JoinInterfaceContent />
    </Suspense>
  );
}
