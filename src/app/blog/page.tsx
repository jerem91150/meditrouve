import { Metadata } from 'next';
import Link from 'next/link';
import prisma from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Blog Santé - Actualités médicaments',
  description: 'Articles sur les médicaments, ruptures de stock, alertes sanitaires. Double version : grand public et professionnels de santé.',
  openGraph: {
    title: 'Blog Santé MediTrouve',
    description: 'Actualités médicaments avec double version : grand public et professionnels.',
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  'rupture-stock': '💊 Rupture de stock',
  'alerte-sanitaire': '⚠️ Alerte sanitaire',
  'nouveau-medicament': '🆕 Nouveau médicament',
  'reglementation': '📜 Réglementation',
  'prevention': '🛡️ Prévention',
  'pharmacovigilance': '🔬 Pharmacovigilance',
};

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: 'desc' },
    take: 20,
    select: {
      slug: true,
      title: true,
      category: true,
      excerptPublic: true,
      readTimePublic: true,
      readTimePro: true,
      publishedAt: true,
      keywords: true,
      validationScore: true,
      viewCountPublic: true,
      viewCountPro: true,
    },
  });

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <nav className="max-w-4xl mx-auto px-4 py-3 text-sm text-gray-500">
        <Link href="/" className="hover:text-blue-600">Accueil</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Blog</span>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📝 Blog Santé MediTrouve
          </h1>
          <p className="text-gray-600">
            Actualités médicaments et santé — chaque article disponible en{' '}
            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
              👥 Grand Public
            </span>{' '}
            et{' '}
            <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
              🩺 Professionnels
            </span>
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="text-gray-500 text-center py-12">Aucun article pour le moment.</p>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                    {CATEGORY_LABELS[post.category] || post.category}
                  </span>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                    2 versions
                  </span>
                  {post.validationScore && post.validationScore >= 90 && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                      ⭐ Qualité {post.validationScore}/100
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {post.title}
                </h2>

                <p className="text-gray-600 text-sm mb-3">
                  {post.excerptPublic}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>
                    📅 {new Date(post.publishedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <span>👥 {post.readTimePublic} min</span>
                  <span>🩺 {post.readTimePro} min</span>
                  <span>👁️ {post.viewCountPublic + post.viewCountPro} vues</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: 'Blog Santé MediTrouve',
            description: 'Actualités médicaments et santé en France',
            url: 'https://www.meditrouve.fr/blog',
            publisher: {
              '@type': 'Organization',
              name: 'MediTrouve',
              url: 'https://www.meditrouve.fr',
            },
          }),
        }}
      />
    </main>
  );
}
