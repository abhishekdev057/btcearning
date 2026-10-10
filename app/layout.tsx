import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'CryptoBTC - Earn Bitcoin by Viewing Ads',
  description: 'Earn free Bitcoin by viewing websites. Advertise your site to Bitcoin users. Faucet, referral program, and instant withdrawals.',
  keywords: ['bitcoin', 'earn btc', 'free bitcoin', 'ptc', 'paid to click', 'crypto advertising'],
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/icon-light-32x32.png',
        sizes: '32x32',
        type: 'image/png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        sizes: '32x32',
        type: 'image/png',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    shortcut: '/icon.svg',
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#f7931a',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script src="https://offerwallapi.com/ads/banner.js?k=7d500cb04584d48d1b8cc24f&s=728x90" async />
        <script
          src="https://offerwallapi.com/ads/pop.js?k=667b21017345432463925432&f=1&t=1"
          data-freq="1"
          data-hours="1"
          async
        />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
