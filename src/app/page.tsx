import Link from "next/link";
import { Search, Bell, Pill, AlertTriangle, Clock, Shield, Zap, Users, Mail, ChevronRight, Activity, Heart, TrendingUp, Lock, ArrowRight } from "lucide-react";
import { OrganizationSchema, WebSiteSchema } from "@/components/StructuredData";
import HomeSearch from "@/components/home/HomeSearch";
import { FadeIn } from "@/components/home/AnimatedHero";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MediTrouve - Suivi des ruptures de médicaments en France",
  description: "Service gratuit de suivi des ruptures et tensions d'approvisionnement de médicaments en France. Données officielles ANSM. Recherchez, suivez et recevez des alertes.",
  openGraph: {
    title: "MediTrouve - Suivi des ruptures de médicaments",
    description: "Trouvez vos médicaments en rupture de stock, localisez les pharmacies qui les ont et recevez des alertes de disponibilité.",
    url: "https://www.meditrouve.fr",
  },
};

const features = [
  { icon: Search, title: "Recherche intelligente", description: "Trouvez instantanement n'importe quel medicament par nom, molecule ou laboratoire.", color: "from-teal-500 to-cyan-600" },
  { icon: Bell, title: "Alertes personnalisees", description: "Recevez une notification des que votre medicament redevient disponible.", color: "from-amber-500 to-orange-600" },
  { icon: Shield, title: "Source officielle ANSM", description: "Donnees fiables issues directement de l'Agence Nationale de Securite du Medicament.", color: "from-blue-500 to-indigo-600" },
  { icon: Zap, title: "Mise a jour quotidienne", description: "Les informations sont actualisees chaque jour pour une fiabilite maximale.", color: "from-emerald-500 to-green-600" }
];

const stats = [
  { value: "2 500+", label: "Medicaments suivis", icon: Pill },
  { value: "24h", label: "Frequence MAJ", icon: Clock },
  { value: "15K+", label: "Utilisateurs actifs", icon: Users },
  { value: "ANSM", label: "Source officielle", icon: Shield }
];

const recentShortages = [
  { name: "OZEMPIC 0,5 mg", status: "RUPTURE", lab: "NOVO NORDISK" },
  { name: "LEVOTHYROX 75 mcg", status: "RUPTURE", lab: "MERCK" },
  { name: "AMOXICILLINE 500 mg", status: "TENSION", lab: "BIOGARAN" },
  { name: "VENTOLINE 100 mcg", status: "TENSION", lab: "GSK" }
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <OrganizationSchema name="MediTrouve" url="https://www.meditrouve.fr" description="Service gratuit de suivi des ruptures et tensions d'approvisionnement de medicaments en France. Donnees officielles ANSM." sameAs={[]} />
      <WebSiteSchema name="MediTrouve" url="https://www.meditrouve.fr" description="Trouvez vos medicaments en rupture de stock, localisez les pharmacies qui les ont et recevez des alertes de disponibilite." searchUrl="https://www.meditrouve.fr/medications" />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl blur-lg opacity-50"></div>
                <div className="relative bg-gradient-to-r from-teal-500 to-cyan-600 p-2 rounded-xl"><Pill className="h-6 w-6 text-white" /></div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">MediTrouve</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Fonctionnalites</a>
              <Link href="/medications" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Medicaments</Link>
              <Link href="/blog" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Blog Sante</Link>
              <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Connexion</Link>
              <Link href="/register" className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full blur opacity-70 group-hover:opacity-100 transition duration-200"></div>
                <span className="relative px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold rounded-full hover:shadow-lg transition-all duration-200 inline-block">Creer une alerte</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-70"></div>
        <div className="absolute top-20 left-10 w-72 h-72 blob-teal animate-float"></div>
        <div className="absolute top-40 right-10 w-96 h-96 blob-teal animate-float" style={{ animationDelay: "1s" }}></div>
        <div className="absolute bottom-20 left-1/4 w-64 h-64 blob-coral animate-float" style={{ animationDelay: "2s" }}></div>
        <div className="absolute inset-0 pattern-dots opacity-30"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-teal mb-8">
                <Activity className="h-4 w-4 text-teal-600" />
                <span className="text-sm font-semibold text-teal-700">Donnees ANSM en temps reel</span>
                <ChevronRight className="h-4 w-4 text-teal-600" />
              </div>
            </FadeIn>

            <FadeIn delay={100}>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
                <span className="text-gray-900">Suivez la</span><br />
                <span className="gradient-text">disponibilite de vos</span><br />
                <span className="gradient-text">medicaments</span>
              </h1>
            </FadeIn>

            <FadeIn delay={200}>
              <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                Recherchez un medicament, verifiez sa disponibilite et recevez une alerte des qu&apos;il est de nouveau en stock.
              </p>
            </FadeIn>

            <FadeIn delay={300}>
              <HomeSearch />
            </FadeIn>
          </div>

          {/* Live Status Cards */}
          <FadeIn delay={500} className="mt-20 max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-500">
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                Ruptures et tensions en cours
              </span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentShortages.map((item, i) => (
                <div key={i} className={`bg-white rounded-2xl p-5 shadow-lg border ${item.status === "RUPTURE" ? "border-l-4 border-l-rose-500" : "border-l-4 border-l-amber-500"} hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
                  <div className="flex items-start justify-between mb-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${item.status === "RUPTURE" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                      {item.status === "RUPTURE" ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {item.status === "RUPTURE" ? "Rupture" : "Tension"}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">{item.name}</h4>
                  <p className="text-sm text-gray-500">{item.lab}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-teal-600 to-cyan-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 mb-4"><stat.icon className="h-7 w-7 text-white" /></div>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-teal-100 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 md:py-32 relative">
        <div className="absolute inset-0 pattern-dots opacity-30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-100 text-teal-700 font-semibold text-sm mb-6"><Zap className="h-4 w-4" />Fonctionnalites</div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Ne manquez plus jamais un medicament</h2>
            <p className="text-xl text-gray-600">Un service gratuit et fiable pour suivre la disponibilite de vos traitements essentiels.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="group bg-white rounded-3xl p-8 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-teal-200/50 transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} mb-6 group-hover:scale-110 transition-transform duration-300`}><feature.icon className="h-7 w-7 text-white" /></div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-teal-50/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-100 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-100 rounded-full blur-3xl opacity-30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-100 text-teal-700 font-semibold text-sm mb-6"><TrendingUp className="h-4 w-4" />Comment ca marche</div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Simple et efficace</h2>
            <p className="text-xl text-gray-600">Trois etapes pour ne plus jamais manquer votre traitement.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: "1", title: "Recherchez", desc: "Entrez le nom de votre medicament dans la barre de recherche", icon: Search, color: "from-teal-500 to-cyan-600" },
              { step: "2", title: "Activez l'alerte", desc: "Cliquez sur le bouton alerte pour etre notifie par email", icon: Bell, color: "from-amber-500 to-orange-600" },
              { step: "3", title: "Recevez la notification", desc: "Des que le medicament est disponible, vous etes prevenu", icon: Mail, color: "from-emerald-500 to-green-600" }
            ].map((item, i) => (
              <div key={i} className="relative">
                {i < 2 && <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-gray-200 to-transparent z-0"></div>}
                <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 relative z-10">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} mb-6 text-white font-bold text-xl`}>{item.step}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600 to-cyan-700"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-300 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 font-medium text-sm mb-8 border border-white/20"><Heart className="h-4 w-4" />Service 100% gratuit</div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Pret a suivre vos medicaments ?</h2>
          <p className="text-xl text-teal-100 mb-10">Rejoignez des milliers de patients qui ne manquent plus leurs traitements essentiels.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-teal-600 font-semibold rounded-2xl hover:bg-teal-50 transition-all hover:shadow-xl">Creer mon compte gratuit<ArrowRight className="h-5 w-5" /></Link>
            <Link href="/medications" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-2xl hover:bg-white/20 transition-all border border-white/20"><Pill className="h-5 w-5" />Voir tous les medicaments</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-r from-teal-500 to-cyan-600 p-2 rounded-xl"><Pill className="h-6 w-6 text-white" /></div>
                <span className="text-xl font-bold text-white">MediTrouve</span>
              </div>
              <p className="text-gray-500 leading-relaxed">Service gratuit de suivi des ruptures et tensions d&apos;approvisionnement de medicaments en France.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Navigation</h4>
              <ul className="space-y-3">
                <li><Link href="/medications" className="hover:text-white transition-colors">Medicaments</Link></li>
                <li><a href="#features" className="hover:text-white transition-colors">Fonctionnalites</a></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog Sante</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Connexion</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions legales</Link></li>
                <li><Link href="/confidentialite" className="hover:text-white transition-colors">Confidentialite</Link></li>
                <li><Link href="/cgu" className="hover:text-white transition-colors">CGU</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Source</h4>
              <p className="text-gray-500 text-sm leading-relaxed">Les donnees de disponibilite sont issues de l&apos;ANSM (Agence Nationale de Securite du Medicament).</p>
            </div>
          </div>
          <div className="py-6 border-t border-gray-800 mb-6">
            <p className="text-xs text-gray-500 text-center max-w-4xl mx-auto leading-relaxed">
              <strong className="text-gray-400">Information importante :</strong> MediTrouve est un service d&apos;information et ne constitue pas un dispositif medical. Les informations fournies ne remplacent en aucun cas l&apos;avis d&apos;un professionnel de sante. Consultez toujours votre medecin ou pharmacien pour toute question relative a votre traitement. En cas d&apos;urgence, contactez le 15 (SAMU) ou le 112.
            </p>
          </div>
          <div className="pt-6 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">&copy; 2025 MediTrouve. Tous droits reserves.</p>
            <div className="flex items-center gap-2"><Lock className="h-4 w-4" /><span className="text-sm">Donnees securisees</span></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
