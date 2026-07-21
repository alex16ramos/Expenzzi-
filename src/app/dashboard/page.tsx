'use client';

import React, { useState } from 'react';
import { authClient } from '@/lib/auth-client';

export default function Dashboard() {
  const session = authClient.useSession();
  const user = session?.data?.user;

  const [interfaces, setInterfaces] = useState([
    {
      id: '1',
      nombre: 'Finanzas Hogar',
      descripcion: 'Gastos compartidos de la casa y comida diaria.',
      rol: 'Administrador',
      estado: true,
      linkinvitado: 'invitado-uuid-1',
      linkvisualizador: 'visualizador-uuid-1',
    },
    {
      id: '2',
      nombre: 'Viaje Brasil 2026',
      descripcion: 'Presupuesto y gastos del viaje grupal.',
      rol: 'Invitado',
      estado: true,
      linkinvitado: 'invitado-uuid-2',
      linkvisualizador: 'visualizador-uuid-2',
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [codigo, setCodigo] = useState('');

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
    } catch {
      // Ignore if already signed out
    } finally {
      window.location.href = '/';
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newInterface = {
      id: String(interfaces.length + 1),
      nombre,
      descripcion,
      rol: 'Administrador',
      estado: true,
      linkinvitado: 'new-invitado-uuid',
      linkvisualizador: 'new-visualizador-uuid',
    };
    setInterfaces([newInterface, ...interfaces]);
    setNombre('');
    setDescripcion('');
    setShowCreateModal(false);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate joining
    const joinedInterface = {
      id: String(interfaces.length + 1),
      nombre: 'Nueva Interfaz Compartida',
      descripcion: 'Interfaz a la que te has unido mediante código.',
      rol: 'Invitado',
      estado: true,
      linkinvitado: 'joined-invitado-uuid',
      linkvisualizador: 'joined-visualizador-uuid',
    };
    setInterfaces([joinedInterface, ...interfaces]);
    setCodigo('');
    setShowJoinModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans relative overflow-hidden">
      {/* Background Radial Gradients */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10" />

      {/* Navbar */}
      <nav className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="font-bold text-white text-sm">E</span>
            </div>
            <span className="font-bold tracking-tight text-lg">Expenzzi</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 hidden sm:inline">
              {user ? user.name || user.email : 'Cargando sesión...'}
            </span>
            <button 
              onClick={handleSignOut}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Mis Interfaces de Operación</h1>
            <p className="text-slate-400 text-sm">Selecciona o crea una interfaz para gestionar transacciones.</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={() => setShowJoinModal(true)}
              className="flex-1 sm:flex-initial px-4 py-2 text-sm font-semibold rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors"
            >
              Unirse con Código
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex-1 sm:flex-initial px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all"
            >
              Nueva Interfaz
            </button>
          </div>
        </div>

        {/* Interfaces List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {interfaces.map((item) => (
            <div 
              key={item.id} 
              className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 hover:border-indigo-500/35 transition-all flex flex-col justify-between group cursor-pointer"
              onClick={() => window.location.href = `/interface/${item.id}`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    item.rol === 'Administrador' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.rol}
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <h3 className="text-lg font-bold group-hover:text-indigo-400 transition-colors">{item.nombre}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{item.descripcion}</p>
              </div>

              <div className="pt-6 border-t border-slate-950 mt-6 flex justify-between items-center text-xs text-slate-500">
                <span>Código: {item.linkinvitado.slice(0, 8)}...</span>
                <span className="group-hover:text-white transition-colors">Entrar &rarr;</span>
              </div>
            </div>
          ))}
        </div>

      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold">Crear Nueva Interfaz</h3>
              <p className="text-xs text-slate-400">Completa los datos para iniciar un nuevo grupo de operaciones.</p>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Nombre de la Interfaz</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Gastos Compartidos Apt 302"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Descripción (Opcional)</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalles sobre las operaciones..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold">Unirse a Interfaz</h3>
              <p className="text-xs text-slate-400">Ingresa el código de invitación provisto por el administrador.</p>
            </div>
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Código de Invitación</label>
                <input
                  type="text"
                  required
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="Ingresa el código de invitación"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500"
                >
                  Unirse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
