import './globals.css'
import { League_Spartan } from 'next/font/google'
import { Providers } from './providers'

const leagueSpartan = League_Spartan({ subsets: ['latin'] })

export const metadata = {
  title: 'Pic2Nav - AI-Powered Location Discovery',
  description: 'Transform any photo into detailed location insights with our advanced AI. Discover places, extract GPS data, and explore nearby attractions instantly.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
  icons: {
    icon: '/pic2nav.png',
    apple: '/pic2nav.png',
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' }
  ],
  openGraph: {
    title: 'Pic2Nav - AI-Powered Location Discovery',
    description: 'Transform any photo into detailed location insights with our advanced AI. Discover places, extract GPS data, and explore nearby attractions instantly.',
    images: ['/pic2nav.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pic2Nav - AI-Powered Location Discovery',
    description: 'Transform any photo into detailed location insights with our advanced AI. Discover places, extract GPS data, and explore nearby attractions instantly.',
    images: ['/pic2nav.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className={`${leagueSpartan.className} overflow-x-hidden`} suppressHydrationWarning={true}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}