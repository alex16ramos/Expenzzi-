'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, Eye, EyeOff, LogIn, UserPlus, KeyRound, ArrowRight } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type AuthTab = 'login' | 'register' | 'forgot';

const AUTH_TABS: { id: AuthTab; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'login', label: 'Iniciar Sesión', icon: <LogIn className="w-4 h-4" />, color: 'from-indigo-600 to-indigo-700' },
  { id: 'register', label: 'Registrarse', icon: <UserPlus className="w-4 h-4" />, color: 'from-purple-600 to-purple-700' },
  { id: 'forgot', label: 'Olvidé Clave', icon: <KeyRound className="w-4 h-4" />, color: 'from-amber-600 to-amber-700' },
];

export default function LandingAuthPage() {
  const session = authClient.useSession();
  const user = session?.data?.user;
  const isPending = session?.isPending;

  const [activeTab, setActiveTab] = useState<AuthTab>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isPending && user) {
      window.location.href = '/dashboard';
    }
  }, [user, isPending]);

  // Google OAuth handler
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const res = await authClient.signIn.social({
        provider: 'google',
        callbackURL: `${origin}/dashboard`,
      });

      if (res?.error) {
        toast.error(res.error.message || 'Error al conectar con Google OAuth');
        setLoading(false);
        return;
      }

      const targetUrl = res?.data?.url || (res as unknown as { url?: string })?.url;
      if (targetUrl) {
        window.location.href = targetUrl;
      }
    } catch (err) {
      console.error('Google Sign In Error:', err);
      toast.error('Error al conectar con Google OAuth');
      setLoading(false);
    }
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (activeTab === 'login') {
        const { error } = await authClient.signIn.email({
          email: email.trim(),
          password,
        });

        if (error) {
          toast.error(error.message || 'Correo electrónico o contraseña incorrectos');
        } else {
          toast.success('¡Bienvenido de nuevo!');
          window.location.href = '/dashboard';
        }
      } else if (activeTab === 'register') {
        if (!name.trim()) {
          toast.error('Por favor ingresa tu nombre');
          setLoading(false);
          return;
        }

        const { error } = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim(),
        });

        if (error) {
          toast.error(error.message || 'Error al registrar usuario');
        } else {
          toast.success('¡Cuenta creada con éxito!');
          window.location.href = '/dashboard';
        }
      } else if (activeTab === 'forgot') {
        toast.info('Si el correo existe en el sistema, recibirás las instrucciones de recuperación.');
        setEmail('');
        setActiveTab('login');
      }
    } catch (err) {
      console.error('Auth submit error:', err);
      toast.error('Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Content Body */}
      <main className="w-full max-w-md mx-auto my-auto z-10 space-y-6 py-8">
        <div className="text-center space-y-2">
          <h1 className="text-6xl font-extrabold text-white tracking-tight">
            Expenzzi
          </h1>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Control Financiero Grupal
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Gestiona tus ingresos, gastos y ahorros en tiempo real con interfaces compartidas.
          </p>
        </div>

        {/* FOLDER TABS CONTAINER (Matching BalanceCards.tsx Folder Index Behavior) */}
        <div className="relative pt-10">
          {/* Folder Index Tab Solapas Header Row */}
          <div className="absolute top-0 left-0 right-0 flex gap-1 z-20">
            {AUTH_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-t-2xl text-xs font-bold transition-colors duration-200 border-t border-x translate-y-1 ${isActive
                      ? 'bg-slate-900 text-white border-slate-800 z-30'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border-slate-800/30'
                    }`}
                >
                  {tab.icon}
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Folder Card Content Body */}
          <div className="relative bg-slate-900 border border-slate-800 rounded-b-3xl p-6 sm:p-8 shadow-2xl space-y-6 z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold py-3 px-4 rounded-2xl border border-slate-700 transition-colors shadow-sm group"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuar con Google</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-opacity" />
            </button>

            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">o con correo</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* AUTH FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'register' && (
                <div className="space-y-1.5">
                  <label htmlFor="auth-name" className="text-xs font-bold text-slate-300 block">Nombre Completo</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                      id="auth-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Juan Pérez"
                      className="pl-10 text-xs bg-slate-950/80 border-slate-800 rounded-xl h-11 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="auth-email" className="text-xs font-bold text-slate-300 block">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@expenzzi.local"
                    className="pl-10 text-xs bg-slate-950/80 border-slate-800 rounded-xl h-11 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              {activeTab !== 'forgot' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="auth-password" className="text-xs font-bold text-slate-300 block">Contraseña</label>
                    {activeTab === 'login' && (
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setActiveTab('forgot')}
                        className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 pr-10 text-xs bg-slate-950/80 border-slate-800 rounded-xl h-11 text-white placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className={`w-full h-11 mt-5 rounded-xl text-xs font-extrabold text-white shadow-lg cursor-pointer bg-gradient-to-r ${AUTH_TABS.find((t) => t.id === activeTab)?.color
                  } hover:brightness-110 transition-colors gap-2`}
              >
                {loading
                  ? 'Procesando...'
                  : activeTab === 'login'
                    ? 'Iniciar Sesión'
                    : activeTab === 'register'
                      ? 'Crear Cuenta'
                      : 'Enviar Instrucciones'}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
