import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/.next/', '/admin/', '/settings/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/.next/', '/admin/', '/settings/'],
      }
    ],
    sitemap: 'https://ssabiroad.vercel.app/sitemap.xml',
    host: 'https://ssabiroad.vercel.app'
  }
}