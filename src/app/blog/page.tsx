import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, Pill, AlertTriangle, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog - Actualites sur les ruptures de medicaments | MediTrouve",
  description:
    "Actualites, conseils et informations sur les ruptures de stock de medicaments en France. Restez informe sur les penuries et les solutions alternatives.",
  keywords: [
    "blog medicaments",
    "actualites rupture stock",
    "conseils sante",
    "penurie medicaments France",
    "alternatives medicaments",
  ],
};

const articles = [
  {
    slug: "comprendre-ruptures-medicaments-france",
    title: "Comprendre les ruptures de medicaments en France",
    excerpt:
      "Pourquoi les ruptures de stock sont de plus en plus frequentes ? Decouvrez les causes, les consequences et les solutions pour les patients.",
    date: "2025-01-15",
    readTime: "5 min",
    category: "Guide",
    image: "/blog/ruptures-france.jpg",
  },
  {
    slug: "que-faire-medicament-indisponible",
    title: "Que faire quand votre medicament est indisponible ?",
    excerpt:
      "Guide pratique pour les patients : les etapes a suivre quand votre traitement est en rupture de stock.",
    date: "2025-01-10",
    readTime: "4 min",
    category: "Conseils",
    image: "/blog/medicament-indisponible.jpg",
  },
  {
    slug: "medicaments-essentiels-mitm",
    title: "Les medicaments essentiels (MITM) : ce qu'il faut savoir",
    excerpt:
      "Qu'est-ce qu'un Medicament d'Interet Therapeutique Majeur ? Pourquoi sont-ils prioritaires en cas de penurie ?",
    date: "2025-01-05",
    readTime: "6 min",
    category: "Education",
    image: "/blog/mitm.jpg",
  },
  {
    slug: "role-ansm-approvisionnement",
    title: "Le role de l'ANSM dans la gestion des approvisionnements",
    excerpt:
      "Comment l'Agence nationale de securite du medicament gere-t-elle les ruptures et tensions d'approvisionnement ?",
    date: "2024-12-20",
    readTime: "5 min",
    category: "Institutions",
    image: "/blog/ansm.jpg",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
              <Pill className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">MediTrouve</span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-r from-teal-600 to-cyan-600 py-12 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-6 w-6" />
            <span className="text-teal-100 font-medium">Blog</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Actualites et conseils sante
          </h1>
          <p className="text-lg text-teal-100 max-w-2xl">
            Restez informe sur les ruptures de medicaments, les solutions
            alternatives et les actualites du secteur pharmaceutique en France.
          </p>
        </div>
      </section>

      {/* Articles Grid */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {articles.map((article, index) => (
            <article
              key={article.slug}
              className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-100 ${
                index === 0 ? "md:col-span-2" : ""
              }`}
            >
              <div className={`${index === 0 ? "md:flex" : ""}`}>
                {/* Image placeholder */}
                <div
                  className={`bg-gradient-to-br from-teal-100 to-cyan-100 ${
                    index === 0 ? "md:w-1/2 h-64 md:h-auto" : "h-48"
                  } flex items-center justify-center`}
                >
                  <AlertTriangle className="h-16 w-16 text-teal-300" />
                </div>

                {/* Content */}
                <div className={`p-6 ${index === 0 ? "md:w-1/2 md:p-8" : ""}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
                      {article.category}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(article.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <h2
                    className={`font-bold text-gray-900 mb-3 ${
                      index === 0 ? "text-2xl" : "text-xl"
                    }`}
                  >
                    {article.title}
                  </h2>

                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {article.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="h-3.5 w-3.5" />
                      {article.readTime} de lecture
                    </span>
                    <Link
                      href={`/blog/${article.slug}`}
                      className="flex items-center gap-1 text-teal-600 font-medium hover:text-teal-700 transition-colors"
                    >
                      Lire l&apos;article
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter CTA */}
        <section className="mt-16 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Restez informe des ruptures de medicaments
          </h2>
          <p className="text-teal-100 mb-6 max-w-xl mx-auto">
            Creez un compte gratuit pour recevoir des alertes personnalisees sur
            vos medicaments.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-teal-600 font-semibold rounded-xl hover:bg-teal-50 transition-all"
          >
            Creer mon compte
            <ArrowRight className="h-5 w-5" />
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          <p className="mb-2">
            Les informations fournies sont a titre indicatif. Consultez toujours
            votre medecin ou pharmacien.
          </p>
          <p>
            <Link href="/" className="text-teal-600 hover:underline">
              MediTrouve
            </Link>
            {" | "}
            <Link href="/ruptures" className="text-teal-600 hover:underline">
              Ruptures de stock
            </Link>
            {" | "}
            <Link href="/medications" className="text-teal-600 hover:underline">
              Tous les medicaments
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
