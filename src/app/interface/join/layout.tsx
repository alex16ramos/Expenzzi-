import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Unirse a Interfaz',
  description: 'Acepta una invitación para formar parte de una interfaz financiera compartida.',
};

export default function JoinInterfaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
