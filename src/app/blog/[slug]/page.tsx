import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import BlogArticleContent from './BlogArticleContent';

export const dynamic = 'force-dynamic';

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
  const isRupture = post.category?.includes('rupture');
  const publishDate = new Date(post.publishedAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex text-sm text-slate-500" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li><Link href="/" className="hover:text-blue-600 transition">Accueil</Link></li>
            <li><span className="mx-2">/</span></li>
            <li><Link href="/blog" className="hover:text-blue-600 transition">Blog</Link></li>
            <li><span className="mx-2">/</span></li>
            <li className="font-medium text-slate-900 truncate max-w-[200px]">{post.title.split(':')[0].trim()}</li>
          </ol>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Colonne Gauche : Contenu Principal */}
          <div className="lg:col-span-2 space-y-6">

            {/* En-tête Article */}
            <section className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    {isRupture ? (
                      <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full uppercase tracking-wider">
                        Rupture de stock
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
                        {post.category}
                      </span>
                    )}
                    {post.validationScore && (
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                        Qualité {post.validationScore}/100
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2 leading-tight">
                    {post.title}
                  </h1>
                  <p className="text-slate-500">
                    Par <span className="font-medium text-slate-700">{post.author}</span> · {publishDate}
                  </p>
                </div>
                {isRupture && (
                  <div className="flex items-center gap-3 bg-red-50 p-4 rounded-2xl border border-red-100 shrink-0">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <div className="text-sm">
                      <p className="font-bold text-red-700">Tension</p>
                      <p className="text-red-600 text-xs">Approvisionnement</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-100 pt-6">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold">Version publique</p>
                  <p className="font-medium text-slate-900">{post.readTimePublic} min de lecture</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold">Version pro</p>
                  <p className="font-medium text-slate-900">{post.readTimePro} min de lecture</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold">Vues</p>
                  <p className="font-medium text-slate-900">{post.viewCountPublic + post.viewCountPro}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold">Sources</p>
                  <p className="font-medium text-blue-600">{sources.length} référence{sources.length > 1 ? 's' : ''}</p>
                </div>
              </div>
            </section>

            {/* Contenu Article avec Toggle */}
            <section className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
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
            </section>

            {/* Sources */}
            {sources.length > 0 && (
              <section className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Sources et références
                </h2>
                <ul className="space-y-3">
                  {sources.map((source, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                        {i + 1}
                      </div>
                      <div>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-medium text-sm"
                        >
                          {source.title}
                        </a>
                        <p className="text-slate-500 text-xs mt-0.5">
                          {source.publisher}{source.date ? ` · ${source.date}` : ''}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Colonne Droite : Sidebar */}
          <div className="space-y-6">

            {/* Widget Alerte */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-6 text-white shadow-xl shadow-blue-200/50">
              <h3 className="text-lg font-bold mb-2">Restez informé</h3>
              <p className="text-blue-100 text-sm mb-5">Recevez une notification dès qu&apos;une mise à jour est publiée sur ce médicament.</p>
              <Link
                href="/"
                className="block w-full bg-white text-blue-700 font-bold py-3 rounded-xl hover:bg-blue-50 transition shadow-lg text-center text-sm"
              >
                Voir sur MediTrouve
              </Link>
              <p className="text-[10px] text-blue-200 mt-4 text-center">Service gratuit MediTrouve</p>
            </div>

            {/* Conseils Patients */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Que faire en cas de rupture ?</h3>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-xs font-bold">1</div>
                  <p className="text-sm text-slate-600">Contactez votre <strong>médecin traitant</strong> ou spécialiste pour évaluer les alternatives.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-xs font-bold">2</div>
                  <p className="text-sm text-slate-600">Ne modifiez <strong>jamais</strong> votre posologie sans avis médical.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-xs font-bold">3</div>
                  <p className="text-sm text-slate-600">Consultez le site de l&apos;<strong>ANSM</strong> pour les informations officielles.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-xs font-bold">4</div>
                  <p className="text-sm text-slate-600">Rapprochez-vous de votre <strong>pharmacien</strong> pour vérifier les disponibilités locales.</p>
                </li>
              </ul>
            </div>

            {/* Tags / Mots-clés */}
            {post.keywords.length > 0 && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Mots-clés</h3>
                <div className="flex flex-wrap gap-2">
                  {post.keywords.map((kw, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded-full font-medium">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6">
              <div className="flex gap-3">
                <svg className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="font-semibold text-amber-800 text-sm mb-1">Avertissement</p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Cet article est fourni à titre informatif et ne remplace en aucun cas un avis médical professionnel. Consultez toujours votre médecin ou pharmacien.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

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
