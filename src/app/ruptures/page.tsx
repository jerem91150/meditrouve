import { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  Search,
  Bell,
  ChevronRight,
  Calendar,
  Building,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { FAQSchema, BreadcrumbSchema } from "@/components/StructuredData";

export const metadata: Metadata = {
  title: "Medicaments en rupture de stock en France - Liste complete | MediTrouve",
  description:
    "Liste complete et mise a jour des medicaments en rupture de stock ou en tension d'approvisionnement en France. Trouvez des alternatives et localisez les pharmacies.",
  keywords: [
    "rupture",
    "medicament",
    "penurie",
    "stock",
    "pharmacie",
    "France",
    "liste",
    "tension",
  ],
};

export const revalidate = 3600; // Revalider toutes les heures
export const dynamic = 'force-dynamic'; // Ne pas pre-rendre au build

export default async function RupturesPage() {
  // Recuperer les medicaments en rupture et tension
  const medications = await prisma.medication.findMany({
    where: {
      status: { in: ["RUPTURE", "TENSION"] },
    },
    orderBy: [
      { status: "asc" }, // RUPTURE en premier
      { isMITM: "desc" }, // MITM en priorite
      { name: "asc" },
    ],
  });

  const ruptureCount = medications.filter((m) => m.status === "RUPTURE").length;
  const tensionCount = medications.filter((m) => m.status === "TENSION").length;

  // Grouper par lettre
  const groupedByLetter: Record<string, typeof medications> = {};
  medications.forEach((med) => {
    const letter = med.name.charAt(0).toUpperCase();
    if (!groupedByLetter[letter]) {
      groupedByLetter[letter] = [];
    }
    groupedByLetter[letter].push(med);
  });

  const letters = Object.keys(groupedByLetter).sort();

  const faqItems = [
    {
      question: "Qu'est-ce qu'une rupture de stock de medicament ?",
      answer: "Une rupture de stock survient lorsqu'un medicament n'est plus disponible dans les pharmacies, meme temporairement. Elle peut etre causee par des problemes de production, de distribution ou une demande exceptionnelle.",
    },
    {
      question: "Quelle est la difference entre rupture et tension d'approvisionnement ?",
      answer: "Une rupture signifie que le medicament est totalement indisponible au niveau national. Une tension signifie que le medicament est difficile a trouver mais encore disponible dans certaines pharmacies.",
    },
    {
      question: "Que faire si mon medicament est en rupture de stock ?",
      answer: "Consultez votre medecin pour une alternative, utilisez MediTrouve pour localiser les pharmacies avec stock, creez une alerte pour etre notifie du retour du medicament. Ne modifiez jamais votre traitement sans avis medical.",
    },
    {
      question: "D'ou proviennent les donnees de MediTrouve ?",
      answer: "Les donnees proviennent de l'ANSM (Agence nationale de securite du medicament et des produits de sante) et sont mises a jour quotidiennement.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Structured Data for SEO */}
      <FAQSchema items={faqItems} />
      <BreadcrumbSchema
        items={[
          { name: "Accueil", url: "https://www.meditrouve.fr" },
          { name: "Ruptures de stock", url: "https://www.meditrouve.fr/ruptures" },
        ]}
      />

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">MediTrouve</span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-r from-red-500 to-orange-500 py-12 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Medicaments en rupture de stock
          </h1>
          <p className="text-lg text-red-100 mb-6">
            Liste complete des medicaments en rupture ou tension
            d'approvisionnement en France, mise a jour quotidiennement.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/20 backdrop-blur rounded-xl px-6 py-3">
              <p className="text-3xl font-bold">{ruptureCount}</p>
              <p className="text-sm text-red-100">Ruptures</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-xl px-6 py-3">
              <p className="text-3xl font-bold">{tensionCount}</p>
              <p className="text-sm text-red-100">Tensions</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-xl px-6 py-3">
              <p className="text-3xl font-bold">{medications.length}</p>
              <p className="text-sm text-red-100">Total</p>
            </div>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="py-6 bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="search"
                placeholder="Rechercher un medicament..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <Link
              href="/inscription"
              className="flex items-center gap-2 px-6 py-3 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 transition-all whitespace-nowrap"
            >
              <Bell className="h-4 w-4" />
              Creer une alerte
            </Link>
          </div>

          {/* Alphabet navigation */}
          <div className="flex flex-wrap gap-1 mt-4">
            {letters.map((letter) => (
              <a
                key={letter}
                href={`#letter-${letter}`}
                className="w-8 h-8 flex items-center justify-center text-sm font-medium text-gray-600 hover:bg-teal-100 hover:text-teal-700 rounded-lg transition-all"
              >
                {letter}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* List */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {letters.map((letter) => (
          <div key={letter} id={`letter-${letter}`} className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 sticky top-[140px] bg-gray-50 py-2">
              {letter}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedByLetter[letter].map((med) => (
                <Link
                  key={med.id}
                  href={`/medicament/${med.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${med.cisCode}`}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-teal-300 transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          med.status === "RUPTURE"
                            ? "bg-red-100 text-red-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {med.status === "RUPTURE" ? "Rupture" : "Tension"}
                      </span>
                      {med.isMITM && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          MITM
                        </span>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-teal-500 transition-all" />
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-teal-600 transition-all mb-1">
                    {med.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                    {med.laboratory && (
                      <span className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {med.laboratory}
                      </span>
                    )}
                    {med.expectedReturn && (
                      <span className="flex items-center gap-1 text-orange-600">
                        <Calendar className="h-3 w-3" />
                        Retour: {new Date(med.expectedReturn).toLocaleDateString("fr-FR")}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {medications.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun medicament en rupture actuellement</p>
          </div>
        )}
      </main>

      {/* SEO Content */}
      <section className="bg-white py-12 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Comprendre les ruptures de stock de medicaments
          </h2>
          <div className="prose prose-gray max-w-none">
            <h3>Qu'est-ce qu'une rupture de stock ?</h3>
            <p>
              Une rupture de stock survient lorsqu'un medicament n'est plus
              disponible dans les pharmacies, meme temporairement. Elle peut etre
              causee par des problemes de production, de distribution ou une
              demande exceptionnelle.
            </p>

            <h3>Difference entre rupture et tension</h3>
            <p>
              <strong>Rupture</strong> : Le medicament est totalement indisponible
              au niveau national.
              <br />
              <strong>Tension</strong> : Le medicament est difficile a trouver mais
              encore disponible dans certaines pharmacies.
            </p>

            <h3>Que faire en cas de rupture ?</h3>
            <ul>
              <li>Consultez votre medecin pour une alternative</li>
              <li>Utilisez MediTrouve pour localiser les pharmacies avec stock</li>
              <li>Creez une alerte pour etre notifie du retour du medicament</li>
              <li>Ne modifiez jamais votre traitement sans avis medical</li>
            </ul>

            <h3>Sources officielles</h3>
            <p>
              Les donnees de cette page proviennent de l'ANSM (Agence nationale de
              securite du medicament) et sont mises a jour quotidiennement.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200 bg-gray-50">
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
            <Link href="/carte" className="text-teal-600 hover:underline">
              Carte des pharmacies
            </Link>
            {" | "}
            <Link href="/pour-pharmaciens" className="text-teal-600 hover:underline">
              Espace pharmaciens
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
