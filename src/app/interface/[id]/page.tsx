'use client';

import React, { useState, use } from 'react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function InterfaceDetails({ params }: PageProps) {
  const resolvedParams = use(params);
  const interfaceId = resolvedParams.id;

  // Mock initial state representing the data from the services
  const [balance, setBalance] = useState({ ARS: 125000.00, USD: 1540.50, UYU: 48900.00 });
  const [limitStatus, setLimitStatus] = useState({
    categoria: 'Alimentación',
    limite: 50000.00,
    moneda: 'ARS',
    utilizado: 42000.00,
    periodo: 'Mensual'
  });

  const [gastos, setGastos] = useState([
    { id: '1', fecha: '2026-07-20', responsable: 'Felipe Ramos', moneda: 'ARS', importe: 12000.00, comentario: 'Supermercado semanal', categoria: 'Alimentación', submetodo: 'Débito' },
    { id: '2', fecha: '2026-07-18', responsable: 'Mauricio Salto', moneda: 'USD', importe: 45.00, comentario: 'Suscripción streaming', categoria: 'Entretenimiento', submetodo: 'Crédito' },
    { id: '3', fecha: '2026-07-15', responsable: 'Santiago Alloud', moneda: 'UYU', importe: 1200.00, comentario: 'Nafta coche', categoria: 'Transporte', submetodo: 'Efectivo' }
  ]);

  const [ingresos, setIngresos] = useState([
    { id: '1', fecha: '2026-07-10', responsable: 'Felipe Ramos', moneda: 'USD', importe: 1200.00, comentario: 'Sueldo mensual', categoria: 'Sueldo' },
    { id: '2', fecha: '2026-07-05', responsable: 'Santiago Alloud', moneda: 'ARS', importe: 80000.00, comentario: 'Venta artículo usado', categoria: 'Varios' }
  ]);

  const [ahorros, setAhorros] = useState([
    { id: '1', fechadesde: '2026-01-01', fechahasta: '2026-12-31', moneda: 'USD', importe: 500.00, comentario: 'Fondo de emergencia', periodo: 'Mensual' }
  ]);

  const [historial, setHistorial] = useState([
    { id: '1', fecha: '2026-07-20', responsable: 'Felipe Ramos', tipo: 'Gasto Modificado', detalle: 'Gasto #1: Importe cambió de $10000.00 a $12000.00 ARS', comentario: 'Corrección ticket' }
  ]);

  // Form states
  const [showGastoModal, setShowGastoModal] = useState(false);
  const [showIngresoModal, setShowIngresoModal] = useState(false);
  const [showLimiteModal, setShowLimiteModal] = useState(false);

  // Gasto Form fields
  const [gImporte, setGImporte] = useState('');
  const [gMoneda, setGMoneda] = useState('ARS');
  const [gCategoria, setGCategoria] = useState('Alimentación');
  const [gResponsable, setGResponsable] = useState('Felipe Ramos');
  const [gComentario, setGComentario] = useState('');
  const [gSubmetodo, setGSubmetodo] = useState('Débito');

  // Ingreso Form fields
  const [iImporte, setIImporte] = useState('');
  const [iMoneda, setIMoneda] = useState('ARS');
  const [iResponsable, setIResponsable] = useState('Felipe Ramos');
  const [iComentario, setIComentario] = useState('');

  // Limite Form fields
  const [lImporte, setLImporte] = useState('');
  const [lMoneda, setLMoneda] = useState('ARS');
  const [lPeriodo, setLPeriodo] = useState('Mensual');

  const [limitWarning, setLimitWarning] = useState<string | null>(null);

  const handleAddGasto = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(gImporte);
    if (isNaN(val)) return;

    // Check limit excede warning logic
    if (gCategoria === limitStatus.categoria && gMoneda === limitStatus.moneda) {
      const newTotal = limitStatus.utilizado + val;
      if (newTotal > limitStatus.limite) {
        setLimitWarning(`⚠️ ¡Alerta de Límite Excedido! Has superado el límite de ${limitStatus.limite} ${limitStatus.moneda} en la categoría ${limitStatus.categoria}. Exceso: ${(newTotal - limitStatus.limite).toFixed(2)} ${limitStatus.moneda}`);
      }
    }

    const newGasto = {
      id: String(gastos.length + 1),
      fecha: new Date().toISOString().split('T')[0],
      responsable: gResponsable,
      moneda: gMoneda,
      importe: val,
      comentario: gComentario,
      categoria: gCategoria,
      submetodo: gSubmetodo
    };

    setGastos([newGasto, ...gastos]);
    // update balance simulation
    const balanceKey = gMoneda as 'ARS' | 'USD' | 'UYU';
    setBalance({ ...balance, [balanceKey]: balance[balanceKey] - val });
    
    // Log history
    setHistorial([
      {
        id: String(historial.length + 1),
        fecha: new Date().toISOString().split('T')[0],
        responsable: gResponsable,
        tipo: 'Nuevo Gasto',
        detalle: `Gasto registrado por ${val} ${gMoneda} en ${gCategoria}`,
        comentario: gComentario
      },
      ...historial
    ]);

    setGImporte('');
    setGComentario('');
    setShowGastoModal(false);
  };

  const handleAddIngreso = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(iImporte);
    if (isNaN(val)) return;

    const newIngreso = {
      id: String(ingresos.length + 1),
      fecha: new Date().toISOString().split('T')[0],
      responsable: iResponsable,
      moneda: iMoneda,
      importe: val,
      comentario: iComentario,
      categoria: 'Sueldo'
    };

    setIngresos([newIngreso, ...ingresos]);
    const balanceKey = iMoneda as 'ARS' | 'USD' | 'UYU';
    setBalance({ ...balance, [balanceKey]: balance[balanceKey] + val });

    // Log history
    setHistorial([
      {
        id: String(historial.length + 1),
        fecha: new Date().toISOString().split('T')[0],
        responsable: iResponsable,
        tipo: 'Nuevo Ingreso',
        detalle: `Ingreso registrado por ${val} ${iMoneda}`,
        comentario: iComentario
      },
      ...historial
    ]);

    setIImporte('');
    setIComentario('');
    setShowIngresoModal(false);
  };

  const handleSetLimite = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(lImporte);
    if (isNaN(val)) return;

    setLimitStatus({
      ...limitStatus,
      limite: val,
      moneda: lMoneda,
      periodo: lPeriodo
    });

    setLimitWarning(null);
    setShowLimiteModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-16 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10" />

      {/* Navbar */}
      <nav className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="text-slate-400 hover:text-white mr-2 text-sm"
            >
              &larr; Volver
            </button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="font-bold text-white text-sm">E</span>
            </div>
            <span className="font-bold tracking-tight text-lg">Expenzzi</span>
          </div>
          <span className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
            ID Interfaz: {interfaceId}
          </span>
        </div>
      </nav>

      {/* Alert Warning */}
      {limitWarning && (
        <div className="max-w-7xl mx-auto px-6 mt-6">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between text-amber-400 text-sm">
            <span>{limitWarning}</span>
            <button onClick={() => setLimitWarning(null)} className="font-bold text-lg hover:text-white transition-colors">&times;</button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">

        {/* Dynamic Balance general */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-400">Balance General de la Interfaz</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-gradient-to-tr from-indigo-600/30 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl" />
              <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">ARS - Pesos Argentinos</p>
              <h3 className="text-3xl font-extrabold mt-3">${balance.ARS.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="bg-gradient-to-tr from-purple-600/30 to-slate-900 border border-purple-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full blur-xl" />
              <p className="text-xs text-purple-400 font-bold uppercase tracking-wider">USD - Dólares</p>
              <h3 className="text-3xl font-extrabold mt-3">US${balance.USD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="bg-gradient-to-tr from-pink-600/30 to-slate-900 border border-pink-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-pink-500/10 rounded-full blur-xl" />
              <p className="text-xs text-pink-400 font-bold uppercase tracking-wider">UYU - Pesos Uruguayos</p>
              <h3 className="text-3xl font-extrabold mt-3">${balance.UYU.toLocaleString('es-UY', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>
        </section>

        {/* Limit Status & Actions */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Category Limit Card */}
          <div className="lg:col-span-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-400">Límite Activo</h3>
                <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full font-medium">{limitStatus.periodo}</span>
              </div>
              <h4 className="text-xl font-bold">{limitStatus.categoria}</h4>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Progreso del gasto</span>
                <span>${limitStatus.utilizado} / ${limitStatus.limite} {limitStatus.moneda}</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800/80">
                <div 
                  className={`h-full rounded-full transition-all ${
                    (limitStatus.utilizado / limitStatus.limite) > 0.9 ? 'bg-rose-500' : 'bg-indigo-500'
                  }`} 
                  style={{ width: `${Math.min((limitStatus.utilizado / limitStatus.limite) * 100, 100)}%` }} 
                />
              </div>
            </div>

            <button 
              onClick={() => setShowLimiteModal(true)}
              className="w-full py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold rounded-xl transition-colors"
            >
              Configurar Límite
            </button>
          </div>

          {/* Quick Transaction Actions */}
          <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-400">Acciones de Operación</h3>
              <p className="text-xs text-slate-400">Registra transacciones de forma manual y visualiza cotizaciones.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <button 
                onClick={() => setShowGastoModal(true)}
                className="py-4 rounded-xl bg-rose-600/10 border border-rose-500/20 hover:bg-rose-600/20 text-rose-400 text-sm font-bold transition-all flex flex-col items-center justify-center gap-1"
              >
                <span>💸</span>
                <span>Registrar Gasto</span>
              </button>
              <button 
                onClick={() => setShowIngresoModal(true)}
                className="py-4 rounded-xl bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600/20 text-emerald-400 text-sm font-bold transition-all flex flex-col items-center justify-center gap-1"
              >
                <span>💰</span>
                <span>Registrar Ingreso</span>
              </button>
            </div>
          </div>
        </section>

        {/* Transactions Table & Logs */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Gastos / Ingresos List */}
          <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-6">
            <h3 className="text-lg font-bold">Últimos Movimientos</h3>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {/* Combine Gastos and Ingresos in a list for mobile/responsive layout */}
              {gastos.map((item) => (
                <div key={`g-${item.id}`} className="flex justify-between items-center p-3 rounded-xl bg-slate-950/60 border border-slate-900 hover:border-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 text-lg">
                      &darr;
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">{item.comentario || 'Gasto'}</h4>
                      <p className="text-xs text-slate-500">{item.fecha} &bull; {item.categoria} &bull; {item.responsable}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-rose-400">-${item.importe} {item.moneda}</span>
                    <p className="text-[10px] text-slate-500">{item.submetodo}</p>
                  </div>
                </div>
              ))}

              {ingresos.map((item) => (
                <div key={`i-${item.id}`} className="flex justify-between items-center p-3 rounded-xl bg-slate-950/60 border border-slate-900 hover:border-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-lg">
                      &uarr;
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">{item.comentario || 'Ingreso'}</h4>
                      <p className="text-xs text-slate-500">{item.fecha} &bull; {item.responsable}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-emerald-400">+${item.importe} {item.moneda}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Logs History */}
          <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-6">
            <h3 className="text-lg font-bold">Historial de Cambios</h3>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {historial.map((log) => (
                <div key={log.id} className="space-y-2 p-3 rounded-xl bg-slate-950/40 border border-slate-900 text-xs">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{log.fecha}</span>
                    <span>{log.responsable}</span>
                  </div>
                  <h4 className="font-bold text-indigo-400">{log.tipo}</h4>
                  <p className="text-slate-400 leading-relaxed">{log.detalle}</p>
                  {log.comentario && <p className="text-[10px] text-slate-500 italic">Comentario: {log.comentario}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* Gasto Modal */}
      {showGastoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold">Registrar Gasto</h3>
              <p className="text-xs text-slate-400">Registra un nuevo egreso de dinero en la interfaz.</p>
            </div>
            <form onSubmit={handleAddGasto} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs text-slate-400">Importe</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={gImporte}
                    onChange={(e) => setGImporte(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div className="col-span-1 space-y-1">
                  <label className="text-xs text-slate-400">Moneda</label>
                  <select
                    value={gMoneda}
                    onChange={(e) => setGMoneda(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-500"
                  >
                    <option value="ARS">ARS</option>
                    <option value="USD">USD</option>
                    <option value="UYU">UYU</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Categoría</label>
                <select
                  value={gCategoria}
                  onChange={(e) => setGCategoria(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-500"
                >
                  <option value="Alimentación">Alimentación</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Entretenimiento">Entretenimiento</option>
                  <option value="Servicios">Servicios</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Submétodo de Pago</label>
                <select
                  value={gSubmetodo}
                  onChange={(e) => setGSubmetodo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-rose-500"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Débito">Débito</option>
                  <option value="Crédito">Crédito</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Comentario</label>
                <input
                  type="text"
                  value={gComentario}
                  onChange={(e) => setGComentario(e.target.value)}
                  placeholder="Detalle sobre el gasto..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowGastoModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-500"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ingreso Modal */}
      {showIngresoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold">Registrar Ingreso</h3>
              <p className="text-xs text-slate-400">Registra un nuevo ingreso de dinero en la interfaz.</p>
            </div>
            <form onSubmit={handleAddIngreso} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs text-slate-400">Importe</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={iImporte}
                    onChange={(e) => setIImporte(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="col-span-1 space-y-1">
                  <label className="text-xs text-slate-400">Moneda</label>
                  <select
                    value={iMoneda}
                    onChange={(e) => setIMoneda(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ARS">ARS</option>
                    <option value="USD">USD</option>
                    <option value="UYU">UYU</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Comentario</label>
                <input
                  type="text"
                  value={iComentario}
                  onChange={(e) => setIComentario(e.target.value)}
                  placeholder="Detalle sobre el ingreso..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowIngresoModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Limite Modal */}
      {showLimiteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold">Establecer Límite de Gasto</h3>
              <p className="text-xs text-slate-400">Establece un tope de gastos para la categoría seleccionada.</p>
            </div>
            <form onSubmit={handleSetLimite} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs text-slate-400">Importe Límite</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={lImporte}
                    onChange={(e) => setLImporte(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="col-span-1 space-y-1">
                  <label className="text-xs text-slate-400">Moneda</label>
                  <select
                    value={lMoneda}
                    onChange={(e) => setLMoneda(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ARS">ARS</option>
                    <option value="USD">USD</option>
                    <option value="UYU">UYU</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Periodo de Aplicación</label>
                <select
                  value={lPeriodo}
                  onChange={(e) => setLPeriodo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="Semanal">Semanal</option>
                  <option value="Mensual">Mensual</option>
                  <option value="Trimestral">Trimestral</option>
                  <option value="Anual">Anual</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLimiteModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500"
                >
                  Establecer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
