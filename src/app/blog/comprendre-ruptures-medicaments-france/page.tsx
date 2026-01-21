import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, Pill, Share2, AlertTriangle, CheckCircle } from "lucide-react";
import { BreadcrumbSchema } from "@/components/StructuredData";

export const metadata: Metadata = {
  title: "Comprendre les ruptures de medicaments en France | MediTrouve",
  description:
    "Pourquoi les ruptures de stock de medicaments sont de plus en plus frequentes en France ? Decouvrez les causes, les consequences et les solutions pour les patients.",
  keywords: [
    "rupture medicaments France",
    "penurie medicaments",
    "causes rupture stock",
    "ANSM rupture",
    "medicaments indisponibles",
  ],
  openGraph: {
    title: "Comprendre les ruptures de medicaments en France",
    description: "Pourquoi les ruptures de stock sont de plus en plus frequentes ? Causes, consequences et solutions.",
    type: "article",
    publishedTime: "2025-01-15",
    authors: ["MediTrouve"],
  },
};

export default function ArticlePage() {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Comprendre les ruptures de medicaments en France",
    description: "Pourquoi les ruptures de stock de medicaments sont de plus en plus frequentes en France ?",
    datePublished: "2025-01-15",
    dateModified: "2025-01-15",
    author: {
      "@type": "Organization",
      name: "MediTrouve",
      url: "https://www.meditrouve.fr",
    },
    publisher: {
      "@type": "Organization",
      name: "MediTrouve",
      url: "https://www.meditrouve.fr",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": "https://www.meditrouve.fr/blog/comprendre-ruptures-medicaments-france",
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <BreadcrumbSchema
        items={[
          { name: "Accueil", url: "https://www.meditrouve.fr" },
          { name: "Blog", url: "https://www.meditrouve.fr/blog" },
          { name: "Comprendre les ruptures", url: "https://www.meditrouve.fr/blog/comprendre-ruptures-medicaments-france" },
        ]}
      />

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
              <Pill className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">MediTrouve</span>
          </Link>
        </div>
      </header>

      {/* Breadcrumb */}
      <nav className="max-w-4xl mx-auto px-4 py-4">
        <ol className="flex items-center gap-2 text-sm text-gray-500">
          <li>
            <Link href="/" className="hover:text-teal-600">Accueil</Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/blog" className="hover:text-teal-600">Blog</Link>
          </li>
          <li>/</li>
          <li className="text-gray-900">Comprendre les ruptures</li>
        </ol>
      </nav>

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au blog
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">
            Guide
          </span>
          <span className="flex items-center gap-1.5 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            15 janvier 2025
          </span>
          <span className="flex items-center gap-1.5 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            5 min de lecture
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          Comprendre les ruptures de medicaments en France
        </h1>

        {/* Hero image placeholder */}
        <div className="bg-gradient-to-br from-teal-100 to-cyan-100 rounded-2xl h-64 md:h-80 flex items-center justify-center mb-8">
          <AlertTriangle className="h-24 w-24 text-teal-300" />
        </div>

        {/* Content */}
        <div className="prose prose-lg prose-gray max-w-none">
          <p className="lead text-xl text-gray-600">
            Les ruptures de stock de medicaments sont devenues un probleme recurrent en France.
            En 2024, plus de 5000 signalements de ruptures ont ete enregistres par l'ANSM,
            soit une augmentation de 30% par rapport a 2020.
          </p>

          <h2>Qu'est-ce qu'une rupture de stock ?</h2>
          <p>
            Une <strong>rupture de stock</strong> survient lorsqu'un medicament n'est plus
            disponible dans les pharmacies pendant une periode donnee. L'ANSM distingue
            plusieurs niveaux de severite :
          </p>

          <ul>
            <li>
              <strong>Tension d'approvisionnement</strong> : difficultes a trouver le
              medicament, mais encore disponible dans certaines pharmacies
            </li>
            <li>
              <strong>Rupture de stock</strong> : medicament totalement indisponible
              au niveau national
            </li>
            <li>
              <strong>Arret de commercialisation</strong> : le laboratoire a decide
              de ne plus produire le medicament
            </li>
          </ul>

          <h2>Les principales causes des ruptures</h2>

          <h3>1. Mondialisation de la production</h3>
          <p>
            Plus de 80% des principes actifs des medicaments sont fabriques en Asie,
            principalement en Chine et en Inde. Cette dependance rend la chaine
            d'approvisionnement vulnerable aux :
          </p>
          <ul>
            <li>Problemes de qualite dans les usines</li>
            <li>Catastrophes naturelles</li>
            <li>Tensions geopolitiques</li>
            <li>Pandemies (comme le COVID-19)</li>
          </ul>

          <h3>2. Problemes de production</h3>
          <p>
            Les usines pharmaceutiques peuvent rencontrer des difficultes :
          </p>
          <ul>
            <li>Defauts de qualite necessitant un rappel de lots</li>
            <li>Maintenance des equipements</li>
            <li>Penurie de matieres premieres</li>
            <li>Capacite de production insuffisante</li>
          </ul>

          <h3>3. Raisons economiques</h3>
          <p>
            Certains medicaments anciens (generiques) ont des prix tres bas qui ne
            permettent plus une production rentable. Les laboratoires peuvent alors
            decider de reduire ou arreter leur production.
          </p>

          <h2>Quels medicaments sont les plus touches ?</h2>
          <p>
            Les categories les plus concernees par les ruptures sont :
          </p>
          <ul>
            <li>Les <strong>antibiotiques</strong> (amoxicilline, penicilline)</li>
            <li>Les <strong>medicaments pour le systeme nerveux</strong></li>
            <li>Les <strong>anticancereux</strong></li>
            <li>Les <strong>medicaments cardiovasculaires</strong></li>
            <li>Les <strong>vaccins</strong></li>
          </ul>

          <h2>Que faire en cas de rupture ?</h2>
          <div className="not-prose bg-teal-50 rounded-xl p-6 my-8">
            <h3 className="text-lg font-bold text-teal-900 mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-teal-600" />
              Les bons reflexes
            </h3>
            <ol className="space-y-3 text-teal-800">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <span><strong>Consultez votre medecin</strong> pour obtenir une alternative therapeutique</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <span><strong>Utilisez MediTrouve</strong> pour localiser les pharmacies qui ont encore du stock</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <span><strong>Creez une alerte</strong> pour etre notifie des que le medicament revient</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                <span><strong>Ne modifiez jamais</strong> votre traitement sans avis medical</span>
              </li>
            </ol>
          </div>

          <h2>Le role de l'ANSM</h2>
          <p>
            L'Agence nationale de securite du medicament (ANSM) est chargee de :
          </p>
          <ul>
            <li>Surveiller les tensions d'approvisionnement</li>
            <li>Publier la liste des ruptures et tensions en cours</li>
            <li>Coordonner les actions avec les laboratoires</li>
            <li>Autoriser des importations exceptionnelles si necessaire</li>
            <li>Informer les professionnels de sante</li>
          </ul>

          <h2>Conclusion</h2>
          <p>
            Les ruptures de medicaments sont un phenomene complexe lie a la mondialisation
            de la production pharmaceutique. Si vous etes concerne par une rupture,
            gardez votre calme et suivez les conseils ci-dessus. MediTrouve vous aide
            a rester informe et a trouver des solutions.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">
            Suivez vos medicaments facilement
          </h3>
          <p className="text-teal-100 mb-6">
            Creez une alerte gratuite pour etre prevenu des que votre medicament
            revient en stock.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-teal-600 font-semibold rounded-xl hover:bg-teal-50 transition-all"
          >
            Creer mon alerte gratuite
          </Link>
        </div>

        {/* Share */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <Link
              href="/blog"
              className="text-teal-600 hover:text-teal-700 font-medium"
            >
              ← Voir tous les articles
            </Link>
            <button className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
              <Share2 className="h-4 w-4" />
              Partager
            </button>
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200 bg-white mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500">
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
            <Link href="/blog" className="text-teal-600 hover:underline">
              Blog
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
