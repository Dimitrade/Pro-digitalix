import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const viewport: Viewport = {
  themeColor: '#1A6EFF',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: {
    default: 'PRO DIGITALIX — Analytics pour Chariow',
    template: '%s | PRO DIGITALIX',
  },
  description: 'Analysez • Optimisez • Développez. La plateforme SaaS pour vendeurs Chariow. Développé par ANABOK GROUP.',
  keywords: ['analytics', 'chariow', 'digital', 'ventes', 'afrique', 'saas', 'anabok'],
  authors: [{ name: 'ANABOK GROUP', url: 'https://anabokgroup.com' }],
  creator: 'ANABOK GROUP',
  publisher: 'ANABOK GROUP',
  robots: 'index, follow',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: '/icon-192.svg',
    shortcut: '/favicon.svg',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    title: 'PRO DIGITALIX — Analytics Chariow',
    description: 'Analysez • Optimisez • Développez. La plateforme SaaS d\'analyse pour les vendeurs Chariow.',
    siteName: 'PRO DIGITALIX by ANABOK GROUP',
  },
  twitter: {
    card: 'summary',
    title: 'PRO DIGITALIX',
    description: 'Analysez • Optimisez • Développez',
    creator: '@anabokgroup',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
      </head>
      <body className={`${inter.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
