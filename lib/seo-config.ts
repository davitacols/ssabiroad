export const seoConfig = {
  // Core SEO settings
  siteName: 'Pic2Nav',
  siteUrl: 'https://pic2nav.app',
  defaultTitle: 'Pic2Nav - AI-Powered Location Discovery from Photos',
  defaultDescription: 'Transform any photo into detailed location insights with our advanced AI. Discover places, extract GPS data, and explore nearby attractions instantly. Free photo location finder.',
  
  // Keywords for different pages
  keywords: {
    home: [
      'photo location finder',
      'AI image recognition', 
      'GPS extraction from photos',
      'location discovery app',
      'photo geolocation',
      'image analysis tool',
      'landmark recognition',
      'reverse image search location',
      'find photo location',
      'AI photo analyzer'
    ],
    camera: [
      'photo scanner app',
      'camera location finder',
      'real-time photo analysis',
      'instant location detection'
    ],
    api: [
      'location API',
      'photo analysis API',
      'GPS extraction API',
      'image recognition API'
    ]
  },

  // Structured data schemas
  organizationSchema: {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Pic2Nav",
    "url": "https://pic2nav.app",
    "logo": "https://pic2nav.app/pic2nav.png",
    "description": "AI-powered location discovery from photos",
    "foundingDate": "2024",
    "sameAs": [
      "https://twitter.com/pic2nav"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": "English"
    }
  },

  webApplicationSchema: {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Pic2Nav",
    "description": "AI-powered location discovery from photos. Extract GPS data and identify landmarks instantly.",
    "url": "https://pic2nav.app",
    "applicationCategory": "UtilityApplication",
    "operatingSystem": "Web Browser",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "creator": {
      "@type": "Organization",
      "name": "Pic2Nav"
    },
    "featureList": [
      "AI photo analysis",
      "GPS data extraction", 
      "Landmark recognition",
      "Location discovery",
      "Nearby places finder",
      "Real-time processing",
      "Free forever"
    ],
    "screenshot": "https://pic2nav.app/screenshots/screenshot1.png",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1250",
      "bestRating": "5",
      "worstRating": "1"
    }
  },

  // FAQ Schema for better SERP features
  faqSchema: {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How does Pic2Nav find locations from photos?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Pic2Nav uses advanced AI to analyze photos for GPS metadata, visual landmarks, and geographical features to determine the exact location where the photo was taken."
        }
      },
      {
        "@type": "Question", 
        "name": "Is Pic2Nav free to use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Pic2Nav is completely free to use with no hidden costs or subscription fees."
        }
      },
      {
        "@type": "Question",
        "name": "What types of photos work best?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Photos with GPS metadata, recognizable landmarks, or distinctive geographical features work best. The AI can analyze both indoor and outdoor locations."
        }
      }
    ]
  }
}

// Generate page-specific metadata
export function generatePageMetadata(page: string, customTitle?: string, customDescription?: string) {
  const baseKeywords = seoConfig.keywords.home
  const pageKeywords = seoConfig.keywords[page as keyof typeof seoConfig.keywords] || []
  
  return {
    title: customTitle || seoConfig.defaultTitle,
    description: customDescription || seoConfig.defaultDescription,
    keywords: [...baseKeywords, ...pageKeywords].join(', '),
    openGraph: {
      title: customTitle || seoConfig.defaultTitle,
      description: customDescription || seoConfig.defaultDescription,
      url: `${seoConfig.siteUrl}${page === 'home' ? '' : `/${page}`}`,
      siteName: seoConfig.siteName,
      type: 'website',
      images: [{
        url: `${seoConfig.siteUrl}/pic2nav.png`,
        width: 1200,
        height: 630,
        alt: 'Pic2Nav - AI Photo Location Discovery'
      }]
    },
    twitter: {
      card: 'summary_large_image',
      title: customTitle || seoConfig.defaultTitle,
      description: customDescription || seoConfig.defaultDescription,
      images: [`${seoConfig.siteUrl}/pic2nav.png`]
    },
    alternates: {
      canonical: `${seoConfig.siteUrl}${page === 'home' ? '' : `/${page}`}`
    }
  }
}