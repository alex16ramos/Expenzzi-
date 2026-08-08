import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Amigos y Grupos',
  description: 'Administra tu lista de amigos y grupos de gastos compartidos.',
};

export default function AmigosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
