import React, { useState } from 'react';
import { PieChart, Users } from 'lucide-react';
import { Transaction } from './TransactionCard';

interface UserExpenseChartProps {
  transactions: Transaction[];
  title?: string;
}

const USER_COLORS = [
  { bg: 'bg-violet-500', hex: '#8b5cf6', text: 'text-violet-400', border: 'border-violet-500/30' },
  { bg: 'bg-emerald-500', hex: '#10b981', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  { bg: 'bg-amber-500', hex: '#f59e0b', text: 'text-amber-400', border: 'border-amber-500/30' },
  { bg: 'bg-rose-500', hex: '#f43f5e', text: 'text-rose-400', border: 'border-rose-500/30' },
  { bg: 'bg-cyan-500', hex: '#06b6d4', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  { bg: 'bg-fuchsia-500', hex: '#d946ef', text: 'text-fuchsia-400', border: 'border-fuchsia-500/30' },
];

export function UserExpenseChart({ transactions, title = 'Resumen por Usuario' }: UserExpenseChartProps) {
  const [activeUser, setActiveUser] = useState<string | null>(null);

  // Group amounts by user (converting everything into ARS equivalent for unified scale)
  const userMap: Record<string, { user: string; initials: string; totalArs: number; count: number }> = {};

  transactions.forEach((tx) => {
    // Parse ARS amount
    const cleanArs = parseFloat(tx.ars.replace(/\./g, '').replace(',', '.')) || tx.amount;
    if (!userMap[tx.user]) {
      userMap[tx.user] = {
        user: tx.user,
        initials: tx.initials,
        totalArs: 0,
        count: 0,
      };
    }
    userMap[tx.user].totalArs += cleanArs;
    userMap[tx.user].count += 1;
  });

  const userList = Object.values(userMap);
  const grandTotal = userList.reduce((acc, curr) => acc + curr.totalArs, 0);

  // Calculate SVG donut segments
  const size = 200;
  const strokeWidth = 32;
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  const segments = userList.map((item, index) => {
    const percent = grandTotal > 0 ? item.totalArs / grandTotal : 0;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativePercent * circumference;
    cumulativePercent += percent;
    const colorScheme = USER_COLORS[index % USER_COLORS.length];

    return {
      ...item,
      percent,
      percentageFormatted: (percent * 100).toFixed(1),
      strokeDasharray,
      strokeDashoffset,
      color: colorScheme,
    };
  });

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
            <p className="text-xs text-slate-400">Distribución de aportes/movimientos por integrante</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <Users className="w-3.5 h-3.5 text-violet-400" />
          <span>{userList.length} usuarios</span>
        </div>
      </div>

      {userList.length === 0 ? (
        <div className="text-center py-10 text-xs text-slate-500">
          No hay datos para generar el gráfico.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Donut Chart SVG */}
          <div className="md:col-span-5 flex flex-col items-center justify-center relative py-2">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg width={size} height={size} className="transform -rotate-90">
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke="#1e293b"
                  strokeWidth={strokeWidth}
                />
                {segments.map((seg) => {
                  const isHovered = activeUser === seg.user;
                  return (
                    <circle
                      key={seg.user}
                      cx={center}
                      cy={center}
                      r={radius}
                      fill="transparent"
                      stroke={seg.color.hex}
                      strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                      className="transition-all duration-300 cursor-pointer hover:opacity-90"
                      onMouseEnter={() => setActiveUser(seg.user)}
                      onMouseLeave={() => setActiveUser(null)}
                    />
                  );
                })}
              </svg>
              {/* Inner Donut Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Total Est.</span>
                <span className="text-lg font-extrabold text-white tracking-tight">
                  ${grandTotal.toLocaleString('es-AR')}
                </span>
                <span className="text-[10px] text-slate-400">ARS Equivalente</span>
              </div>
            </div>
          </div>

          {/* User Legends list */}
          <div className="md:col-span-7 space-y-2.5">
            {segments.map((seg) => {
              const isHovered = activeUser === seg.user;
              return (
                <div
                  key={seg.user}
                  onMouseEnter={() => setActiveUser(seg.user)}
                  onMouseLeave={() => setActiveUser(null)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isHovered
                      ? `${seg.color.border} bg-slate-800/80 shadow-md`
                      : 'border-slate-800/60 bg-slate-950/40 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${seg.color.bg} shrink-0`} />
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-200 text-xs font-bold flex items-center justify-center border border-slate-700">
                      {seg.initials}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{seg.user}</p>
                      <p className="text-[10px] text-slate-400">{seg.count} movimientos</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-100">
                      $ {seg.totalArs.toLocaleString('es-AR')}
                    </p>
                    <span className={`text-[10px] font-semibold ${seg.color.text}`}>
                      {seg.percentageFormatted}% del total
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
