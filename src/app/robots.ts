import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/profile/',
          '/settings/',
          '/_next/',
          '/static/',
        ],
      },
    ],
    sitemap: 'https://www.meditrouve.fr/sitemap.xml',
  };
}
