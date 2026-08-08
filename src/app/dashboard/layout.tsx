import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Panel Principal',
  description: 'Visualiza tus gastos, ingresos, tarjetas de balance y actividades recientes.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
