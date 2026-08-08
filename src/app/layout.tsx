import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { ConnectionStatusBanner } from "@/components/ui/ConnectionStatusBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: "Expenzzi — Control Financiero Grupal",
    template: "%s | Expenzzi",
  },
  description: "Plataforma moderna para gestionar gastos, ingresos y ahorros compartidos con soporte multimoneda en tiempo real.",
  keywords: ["gastos", "finanzas", "ahorros", "presupuesto", "multimoneda", "gastos compartidos", "expenzzi"],
  authors: [{ name: "Expenzzi Team" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Expenzzi",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "/",
    title: "Expenzzi — Control Financiero Grupal",
    description: "Gestiona tus finanzas personales y grupales sin esfuerzo en tiempo real.",
    siteName: "Expenzzi",
  },
  twitter: {
    card: "summary_large_image",
    title: "Expenzzi — Control Financiero Grupal",
    description: "Gestiona tus finanzas personales y grupales sin esfuerzo en tiempo real.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ConnectionStatusBanner />
          <ServiceWorkerRegister />
          {children}
          <Toaster position="bottom-right" richColors className="select-none"/>
        </ThemeProvider>
      </body>
    </html>
  );
}
