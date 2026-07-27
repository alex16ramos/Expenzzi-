import React from 'react';
import { ArrowUpCircle, ArrowDownCircle, PiggyBank, ChartColumn } from 'lucide-react';

export interface NavItem {
  label: string;
  icon: React.ElementType;
}

export const itemsNav: NavItem[] = [
  { label: 'Gastos', icon: ArrowUpCircle },
  { label: 'Ingresos', icon: ArrowDownCircle },
  { label: 'Ahorros', icon: PiggyBank },
  { label: 'Resúmenes', icon: ChartColumn },
];