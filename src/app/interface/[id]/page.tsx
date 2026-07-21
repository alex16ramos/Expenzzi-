'use client';

import React, { useState, use } from 'react';
import { Signal, Wifi, BatteryFull } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { Header } from '@/components/interface/Header';
import { TransactionCard, Transaction } from '@/components/interface/TransactionCard';
import { TransactionTable } from '@/components/interface/TransactionTable';
import { Pagination } from '@/components/interface/Pagination';
import { FabButton } from '@/components/interface/FabButton';
import { BottomNav } from '@/components/interface/BottomNav';

interface PageProps {
  params: Promise<{ id: string }>;
}

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 1,
    date: '18/09/25',
    user: 'Ana López',
    initials: 'AL',
    amount: 19800,
    currency: 'ARS',
    ars: '19.800',
    usd: '18',
    comment: 'Supermercado semanal',
    method: 'Débito - Cuenta ARS',
  },
  {
    id: 2,
    date: '17/09/25',
    user: 'Bruno Díaz',
    initials: 'BD',
    amount: 11000,
    currency: 'ARS',
    ars: '11.000',
    usd: '10',
    comment: 'Nafta',
    method: 'Efectivo',
  },
  {
    id: 3,
    date: '17/09/25',
    user: 'Camila Ruiz',
    initials: 'CR',
    amount: 200,
    currency: 'USD',
    ars: '216.000',
    usd: '200',
    comment: 'Reserva hospedaje',
    method: 'Crédito - Visa',
  },
  {
    id: 4,
    date: '17/09/25',
    user: 'Bruno Díaz',
    initials: 'BD',
    amount: 300,
    currency: 'UYU',
    ars: '7.500',
    usd: '7',
    comment: 'Cena grupal',
    method: 'Débito - Prex UY',
  },
  {
    id: 5,
    date: '17/09/25',
    user: 'Diego Torres',
    initials: 'DT',
    amount: 80,
    currency: 'UYU',
    ars: '2.800',
    usd: '2',
    comment: 'Alfajor Juanito',
    method: 'Débito - Prex UY',
  },
];

export default function InterfaceDetailsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const interfaceId = resolvedParams.id;

  const session = authClient.useSession();
  const user = session?.data?.user;

  const [query, setQuery] = useState('');
  const [activeSection, setActiveSection] = useState('Ingresos');
  const [expandedId, setExpandedId] = useState<string | number | null>(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);

  // User initials
  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'SA';

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
    } catch {
      // Ignore
    } finally {
      window.location.href = '/';
    }
  };

  const handleAddTransaction = (data: {
    amount: number;
    currency: string;
    comment: string;
    method: string;
  }) => {
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(
      today.getMonth() + 1
    ).padStart(2, '0')}/${String(today.getFullYear()).slice(-2)}`;

    const newTx: Transaction = {
      id: Date.now(),
      date: dateStr,
      user: user?.name || 'Usuario Expenzzi',
      initials: userInitials,
      amount: data.amount,
      currency: data.currency,
      ars: (
        data.currency === 'USD'
          ? data.amount * 1100
          : data.currency === 'UYU'
          ? data.amount * 28
          : data.amount
      ).toLocaleString('es-AR'),
      usd: (
        data.currency === 'ARS'
          ? data.amount / 1100
          : data.currency === 'UYU'
          ? data.amount / 40
          : data.amount
      ).toFixed(1),
      comment: data.comment,
      method: data.method,
    };

    setTransactions([newTx, ...transactions]);
    setExpandedId(newTx.id);
  };

  const handleDeleteTransaction = (id: string | number) => {
    setTransactions(transactions.filter((tx) => tx.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const filtered = transactions.filter((tx) => {
    const q = query.toLowerCase();
    return (
      tx.user.toLowerCase().includes(q) ||
      tx.comment.toLowerCase().includes(q) ||
      tx.method.toLowerCase().includes(q) ||
      tx.currency.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col items-center gap-4 p-4 sm:p-8 font-sans">
      {/* Top Banner Navigation */}
      <div className="w-full max-w-4xl flex justify-between items-center bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (window.location.href = '/dashboard')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            &larr; Volver al Dashboard
          </button>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-600 font-medium">
            Interfaz #{interfaceId}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 hidden sm:inline">
            {user ? user.email : 'Sesión activa'}
          </span>
          <button
            onClick={handleSignOut}
            className="text-xs text-red-600 hover:text-red-700 font-semibold px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="text-center max-w-[400px]">
        <p className="text-[11px] font-semibold tracking-wide text-violet-600 uppercase">
          Prototipo · Expenzzi
        </p>
        <p className="text-sm text-slate-500 mt-0.5">
          Interfaz de {activeSection} — mobile-first & responsive
        </p>
      </div>

      {/* MOBILE-FIRST SMARTPHONE FRAME (Visión Móvil) */}
      <div className="w-full max-w-[380px] h-[760px] bg-white rounded-[2.25rem] border-[6px] border-slate-900 shadow-2xl overflow-hidden flex flex-col md:hidden">
        {/* Status bar simulada */}
        <div className="h-7 bg-slate-900 flex items-center justify-between px-5 shrink-0">
          <span className="text-white text-[11px] font-medium">12:30</span>
          <div className="flex items-center gap-1.5 text-white">
            <Signal className="w-3 h-3" />
            <Wifi className="w-3 h-3" />
            <BatteryFull className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Header */}
        <Header
          query={query}
          onQueryChange={setQuery}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          userInitials={userInitials}
          onMenuClick={() => (window.location.href = '/dashboard')}
        />

        {/* Lista Móvil */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-slate-50">
          {filtered.map((tx) => (
            <TransactionCard
              key={tx.id}
              transaction={tx}
              isOpen={expandedId === tx.id}
              onToggle={() =>
                setExpandedId(expandedId === tx.id ? null : tx.id)
              }
              onDelete={handleDeleteTransaction}
            />
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-10 text-sm text-slate-400">
              No encontramos movimientos con esa búsqueda.
            </div>
          )}
        </div>

        {/* Paginación */}
        <Pagination
          currentPage={currentPage}
          totalPages={1}
          pageSize={100}
          onPageChange={setCurrentPage}
        />

        {/* FAB Button */}
        <FabButton onAddTransaction={handleAddTransaction} />

        {/* Bottom Nav */}
        <BottomNav
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
      </div>

      {/* DESKTOP / TABLET RESPONSIVE VIEW (Pantallas md:) */}
      <div className="hidden md:flex flex-col w-full max-w-4xl bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-xl">
        <Header
          query={query}
          onQueryChange={setQuery}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          userInitials={userInitials}
          onMenuClick={() => (window.location.href = '/dashboard')}
        />

        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">
              Movimientos de {activeSection}
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Mostrando {filtered.length} registros
            </span>
          </div>

          {filtered.length > 0 ? (
            <TransactionTable
              transactions={filtered}
              expandedId={expandedId}
              onToggle={(id) =>
                setExpandedId(expandedId === id ? null : id)
              }
              onDelete={handleDeleteTransaction}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-400">
              No encontramos movimientos que coincidan con la búsqueda.
            </div>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={1}
          pageSize={100}
          onPageChange={setCurrentPage}
        />

        {/* Floating FAB on desktop */}
        <div className="fixed bottom-8 right-8 z-30">
          <FabButton onAddTransaction={handleAddTransaction} />
        </div>
      </div>

      <p className="text-xs text-slate-400 max-w-[400px] text-center leading-relaxed">
        Fondo claro + acento violeta de marca, fila expandible con acciones, FAB y bottom nav. En pantallas de escritorio (`md:`), la vista pasa automáticamente a una tabla adaptativa manteniendo la fila desplegable de detalles.
      </p>
    </div>
  );
}
