import { AuthProvider } from '@/components/providers/AuthProvider';
import { I18nProvider } from '@/components/providers/I18nProvider';
import { Toaster } from '@/components/ui/sonner';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Bars - Système de Prise de Commande',
  description: 'PWA pour digitaliser la prise de commande en boîte de nuit',
  manifest: '/manifest.json',
  themeColor: '#6366f1',
  // colorScheme: 'dark',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Bars',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='fr'>
      <head>
        <link rel='manifest' href='/manifest.json' />
        {/* <meta name='theme-color' content='#6366f1' /> */}
        <meta name='color-scheme' content='dark' />
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-status-bar-style' content='default' />
        <meta name='apple-mobile-web-app-title' content='Bars' />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider>
          <AuthProvider>{children}</AuthProvider>
          <Toaster />
        </I18nProvider>
      </body>
    </html>
  );
}
