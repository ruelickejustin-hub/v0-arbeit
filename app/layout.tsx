import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import { TrainingProvider } from '@/src/context/TrainingContext'
import './globals.css'

const geistSans = Geist({ 
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({ 
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'Unterweisungs-App | EHS Training',
  description: 'Digitale Unterweisungen für Arbeitssicherheit und Umweltschutz. Effiziente Dokumentation und Nachverfolgung von Sicherheitsunterweisungen.',
  keywords: ['Unterweisung', 'EHS', 'Arbeitssicherheit', 'Umweltschutz', 'Training', 'Dokumentation'],
  authors: [{ name: 'EHS Training Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'Unterweisungs-App | EHS Training',
    description: 'Digitale Unterweisungen für Arbeitssicherheit und Umweltschutz',
    type: 'website',
    locale: 'de_DE',
  },
}

export const viewport: Viewport = {
  themeColor: '#1E3246',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground">
        <TrainingProvider>
          {children}
        </TrainingProvider>
        <Toaster position="top-center" richColors />
        <Analytics />
      </body>
    </html>
  )
}
