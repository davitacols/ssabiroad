import './globals.css'
import { League_Spartan } from 'next/font/google'
import { Providers } from './providers'

const leagueSpartan = League_Spartan({ subsets: ['latin'] })

export const metadata = {
  metadataBase: new URL('https://pic2nav.com'),
  title: {
    default: 'Pic2Nav - AI-Powered Location Discovery from Photos',
    template: '%s | Pic2Nav'
  },
  description: 'Find locations from photos worldwide using AI. Extract GPS coordinates, identify buildings & landmarks globally. Report crimes in Nigeria to Nigerian Police Force. Free photo location finder.',
  keywords: ['find location from photo', 'identify building from picture', 'gps location from image', 'reverse image location search', 'photo location finder', 'AI image recognition', 'landmark identification', 'architectural style detector', 'building analysis tool', 'report crime online nigeria', 'nigerian police force crime report', 'anonymous crime reporting nigeria', 'abuja location finder', 'lagos photo location'],
  authors: [{ name: 'Pic2Nav Team' }],
  creator: 'Pic2Nav',
  publisher: 'Pic2Nav',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/pic2nav.png',
    apple: '/pic2nav.png',
    shortcut: '/pic2nav.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://pic2nav.com',
    siteName: 'Pic2Nav',
    title: 'Pic2Nav - AI-Powered Location Discovery from Photos',
    description: 'Transform any photo into detailed location insights with our advanced AI. Discover places, extract GPS data, and explore nearby attractions instantly.',
    images: [{
      url: '/pic2nav.png',
      width: 1200,
      height: 630,
      alt: 'Pic2Nav - AI Photo Location Discovery'
    }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@pic2nav',
    creator: '@pic2nav',
    title: 'Pic2Nav - AI-Powered Location Discovery from Photos',
    description: 'Transform any photo into detailed location insights with our advanced AI. Discover places, extract GPS data, and explore nearby attractions instantly.',
    images: ['/pic2nav.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    bing: 'your-bing-verification-code',
  },
  category: 'technology',
  classification: 'AI Photo Analysis Tool',
  referrer: 'strict-origin-when-cross-origin',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' }
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            
            // Initialize consent mode
            gtag('consent', 'default', {
              'analytics_storage': 'denied',
              'ad_storage': 'denied',
              'wait_for_update': 500
            });
            
            gtag('js', new Date());
          `
        }} />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-JWTQJ8XY8Z"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            gtag('config', 'G-JWTQJ8XY8Z', {
              'anonymize_ip': true,
              'allow_google_signals': false,
              'allow_ad_personalization_signals': false
            });
          `
        }} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className={`${leagueSpartan.className} overflow-x-hidden`} suppressHydrationWarning={true}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}