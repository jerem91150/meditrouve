import { Metadata } from 'next';
import Link from 'next/link';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Blog Sante - Actualites medicaments et etudes',
  description: 'Articles sur les medicaments, ruptures de stock, avancees medicales, etudes scientifiques. Double version : grand public et professionnels de sante.',
  openGraph: {
    title: 'Blog Sante MediTrouve',
    description: 'Actualites medicaments, etudes scientifiques et avancees medicales avec double version.',
  },
};

const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  'rupture-stock': { bg: 'bg-red-100', text: 'text-red-700', label: 'Rupture de stock' },
  'alerte-sanitaire': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Alerte sanitaire' },
  'nouveau-medicament': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Nouveau medicament' },
  'reglementation': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Reglementation' },
  'prevention': { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Prevention' },
  'pharmacovigilance': { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Pharmacovigilance' },
  'etude-scientifique': { bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'Etude scientifique' },
  'avancee-medicale': { bg: 'bg-green-100', text: 'text-green-700', label: 'Avancee medicale' },
  'actualite-sante': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Actualite sante' },
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
      viewCountPublic: true,
      viewCountPro: true,
    },
  });

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Breadcrumbs */}
      <nav className="max-w-5xl mx-auto px-4 py-3 text-sm text-slate-500">
        <Link href="/" className="hover:text-blue-600">Accueil</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900 font-medium">Blog</span>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Blog Sante MediTrouve
          </h1>
          <p className="text-slate-600 text-lg">
            Actualites medicaments, etudes scientifiques et avancees medicales — chaque article disponible en{' '}
            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
              Grand Public
            </span>{' '}
            et{' '}
            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-medium px-2 py-0.5 rounded-full">
              Professionnels
            </span>
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="text-slate-500 text-center py-12">Aucun article pour le moment.</p>
        ) : (
          <div className="space-y-5">
            {posts.map((post) => {
              const catStyle = CATEGORY_STYLES[post.category] || { bg: 'bg-slate-100', text: 'text-slate-700', label: post.category };
              return (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="block bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-200"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs ${catStyle.bg} ${catStyle.text} px-2.5 py-0.5 rounded-full font-semibold`}>
                      {catStyle.label}
                    </span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                      2 versions
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600">
                    {post.title}
                  </h2>

                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                    {post.excerptPublic}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>
                      {new Date(post.publishedAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {post.readTimePublic} min
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      {post.viewCountPublic + post.viewCountPro} vues
                    </span>
                  </div>
                </Link>
              );
            })}
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
            name: 'Blog Sante MediTrouve',
            description: 'Actualites medicaments, etudes scientifiques et avancees medicales en France',
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
