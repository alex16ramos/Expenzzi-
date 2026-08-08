import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Interfaz Compartida',
  description: 'Gestión colaborativa de finanzas y transacciones compartidas.',
};

export default function InterfaceDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
