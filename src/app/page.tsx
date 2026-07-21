'use client';

import React, { useState } from 'react';

import { authClient } from '@/lib/auth-client';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (activeTab === 'login') {
        const res = await authClient.signIn.email({
          email,
          password,
        });

        console.log('[DEBUG AUTH] signIn response:', res);

        if (res?.error) {
          const detail = res.error.message || JSON.stringify(res.error);
          setMessage(`Error (${res.error.status || 400}): ${detail}`);
        } else if (res?.data) {
          setMessage('Inicio de sesión exitoso. Redirigiendo...');
          window.location.href = '/dashboard';
        } else {
          setMessage('Error: Sin respuesta de Neon Auth. Revisa la variable NEON_AUTH_BASE_URL en .env');
        }
      } else {
        const res = await authClient.signUp.email({
          email,
          password,
          name,
        });

        console.log('[DEBUG AUTH] signUp response:', res);

        if (res?.error) {
          const detail = res.error.message || JSON.stringify(res.error);
          setMessage(`Error (${res.error.status || 400}): ${detail}`);
        } else if (res?.data) {
          setActiveTab('login');
          setMessage('¡Registro exitoso! Por favor inicia sesión con tus credenciales.');
        } else {
          setMessage('Error: Sin respuesta de Neon Auth. Revisa la variable NEON_AUTH_BASE_URL en .env');
        }
      }
    } catch (error: unknown) {
      console.error('[DEBUG AUTH] Catch exception:', error);
      const err = error as { status?: number; message?: string; error_description?: string };
      const status = err?.status ? ` (${err.status})` : '';
      const msg = err?.message || err?.error_description || 'Ocurrió un error al procesar la solicitud';
      setMessage(`Error${status}: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Radial Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="font-extrabold text-xl tracking-tight text-white">E</span>
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Expenzzi
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-sm text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Características</a>
          <a href="#docs" className="hover:text-white transition-colors">Documentación</a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center justify-center gap-12 py-12 z-10">
        
        {/* Left Side: Pitch and Branding */}
        <div className="flex-1 text-center lg:text-left space-y-6 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-indigo-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            Integración Nativa con Neon Data API
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Control de Finanzas Inteligente y{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
              Colaborativo
            </span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Expenzzi es la plataforma moderna diseñada para gestionar tus gastos, ingresos y ahorros compartidos. Soporta múltiples monedas (ARS, USD, UYU) con conversión automática integrada y seguridad a nivel de filas (RLS) en tiempo real.
          </p>
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-slate-500 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-indigo-400 font-bold">✓</span> RLS Activo
            </div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-400 font-bold">✓</span> Neon Auth
            </div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-400 font-bold">✓</span> Conversión Auto
            </div>
          </div>
        </div>

        {/* Right Side: Auth Glassmorphic Form Card */}
        <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative">
          <div className="absolute top-0 right-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -z-10" />

          {/* Form Tabs */}
          <div className="flex p-1 bg-slate-950/80 rounded-xl mb-8 border border-slate-800/50">
            <button
              onClick={() => { setActiveTab('login'); setMessage(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'login' 
                  ? 'bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => { setActiveTab('signup'); setMessage(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'signup' 
                  ? 'bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {activeTab === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Correo Electrónico</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700/50 font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all text-sm mt-6 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : activeTab === 'login' ? (
                'Entrar a la Aplicación'
              ) : (
                'Crear Cuenta'
              )}
            </button>
          </form>

          {message && (
            <div className={`mt-6 p-4 rounded-xl text-center text-sm border ${
              message.includes('Error') 
                ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              {message}
            </div>
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-slate-900 text-center text-xs text-slate-600 z-10">
        <p>&copy; {new Date().getFullYear()} Expenzzi. Seminario Integrador Habilitación Profesional 2025.</p>
      </footer>
    </div>
  );
}
