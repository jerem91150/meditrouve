import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import BlogArticleContent from './BlogArticleContent';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    select: { title: true, seoTitle: true, seoDescription: true, excerptPublic: true, keywords: true },
  });

  if (!post) return { title: 'Article non trouvé' };

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerptPublic,
    keywords: post.keywords,
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerptPublic,
      type: 'article',
      url: `https://www.meditrouve.fr/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug, isPublished: true },
  });

  if (!post) notFound();

  const sources = (post.sources as Array<{ url: string; title: string; publisher: string; date: string }>) || [];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <nav className="max-w-3xl mx-auto px-4 py-3 text-sm text-gray-500">
        <Link href="/" className="hover:text-blue-600">Accueil</Link>
        <span className="mx-2">/</span>
        <Link href="/blog" className="hover:text-blue-600">Blog</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 truncate">{post.title}</span>
      </nav>

      <article className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
              {post.category}
            </span>
            {post.validationScore && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                ✅ Validé {post.validationScore}/100
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Par {post.author} · {new Date(post.publishedAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </header>

        {/* Client component avec toggle */}
        <BlogArticleContent
          slug={post.slug}
          publicTitle={post.title}
          publicContent={post.contentPublic}
          publicExcerpt={post.excerptPublic}
          publicReadTime={post.readTimePublic}
          proTitle={post.title}
          proContent={post.contentPro}
          proExcerpt={post.excerptPro}
          proReadTime={post.readTimePro}
          viewCountPublic={post.viewCountPublic}
          viewCountPro={post.viewCountPro}
        />

        {/* Sources - toujours visibles */}
        <section className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📚 Sources</h2>
          <ul className="space-y-2">
            {sources.map((source, i) => (
              <li key={i} className="text-sm">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {source.title}
                </a>
                <span className="text-gray-500 ml-1">
                  — {source.publisher}{source.date ? `, ${source.date}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          ⚠️ Cet article est fourni à titre informatif uniquement et ne remplace en aucun cas un avis médical professionnel.
          Consultez toujours votre médecin ou pharmacien pour toute question relative à votre santé.
        </div>
      </article>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.seoTitle || post.title,
            description: post.seoDescription || post.excerptPublic,
            datePublished: post.publishedAt.toISOString(),
            dateModified: post.updatedAt.toISOString(),
            author: { '@type': 'Organization', name: 'MediTrouve' },
            publisher: {
              '@type': 'Organization',
              name: 'MediTrouve',
              url: 'https://www.meditrouve.fr',
            },
            mainEntityOfPage: `https://www.meditrouve.fr/blog/${post.slug}`,
            keywords: post.keywords.join(', '),
          }),
        }}
      />
    </main>
  );
}
