import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics }    from '@vercel/analytics/next'
import { TopHeader }    from '@/components/top-header'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'TradeLeague - One trade a week. Real rivals.',
  description: 'Composez votre portefeuille chaque semaine et affrontez vos rivaux sur les vrais marchés.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="font-sans antialiased">
        {/* Conteneur centré sur desktop, plein écran sur mobile */}
        <div className="mx-auto w-full max-w-xl min-h-svh relative bg-background shadow-[0_0_40px_rgba(0,0,0,0.15)]">
          <TopHeader />
          {children}
        </div>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
