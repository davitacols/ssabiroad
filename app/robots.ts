import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/.next/', '/admin/', '/login/', '/signup/', '/settings/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/.next/', '/admin/', '/login/', '/signup/', '/settings/'],
      }
    ],
    sitemap: 'https://pic2nav.app/sitemap.xml',
    host: 'https://pic2nav.app'
  }
}