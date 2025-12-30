"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Bell, Pill, AlertTriangle, CheckCircle, Clock, ArrowRight, Shield, Zap, Users, Mail, ChevronRight, Activity, Heart, TrendingUp, Lock } from "lucide-react";

interface Medication {
  id: string;
  name: string;
  laboratory?: string;
  status: "AVAILABLE" | "TENSION" | "RUPTURE" | "UNKNOWN";
  activeIngredient?: string;
}

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.length < 2) return;
    setLoading(true);
    try {
      const r = await fetch("/api/search?q=" + encodeURIComponent(query));
      const data = await r.json();
      setResults(data.medications || []);
      setSearched(true);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const statusConfig = {
    AVAILABLE: { label: "Disponible", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", icon: CheckCircle, iconBg: "bg-emerald-500" },
    TENSION: { label: "Tension", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: Clock, iconBg: "bg-amber-500" },
    RUPTURE: { label: "Rupture", bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", icon: AlertTriangle, iconBg: "bg-rose-500" },
    UNKNOWN: { label: "Inconnu", bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700", icon: Pill, iconBg: "bg-gray-500" }
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

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl blur-lg opacity-50"></div>
                <div className="relative bg-gradient-to-r from-teal-500 to-cyan-600 p-2 rounded-xl">
                  <Pill className="h-6 w-6 text-white" />
                </div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">AlerteMedicaments</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Fonctionnalites</a>
              <Link href="/medications" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Medicaments</Link>
              <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Connexion</Link>
              <Link href="/register" className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full blur opacity-70 group-hover:opacity-100 transition duration-200"></div>
                <button className="relative px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold rounded-full hover:shadow-lg transition-all duration-200">
                  Creer une alerte
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 gradient-mesh opacity-70"></div>
        <div className="absolute top-20 left-10 w-72 h-72 blob-teal animate-float"></div>
        <div className="absolute top-40 right-10 w-96 h-96 blob-teal animate-float" style={{ animationDelay: "1s" }}></div>
        <div className="absolute bottom-20 left-1/4 w-64 h-64 blob-coral animate-float" style={{ animationDelay: "2s" }}></div>
        <div className="absolute inset-0 pattern-dots opacity-30"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full glass-teal mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <Activity className="h-4 w-4 text-teal-600" />
              <span className="text-sm font-semibold text-teal-700">Donnees ANSM en temps reel</span>
              <ChevronRight className="h-4 w-4 text-teal-600" />
            </div>

            {/* Title */}
            <h1 className={`text-5xl md:text-7xl font-bold tracking-tight mb-6 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <span className="text-gray-900">Suivez la</span>
              <br />
              <span className="gradient-text">disponibilite de vos</span>
              <br />
              <span className="gradient-text">medicaments</span>
            </h1>

            {/* Subtitle */}
            <p className={`text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              Recherchez un medicament, verifiez sa disponibilite et recevez une alerte des qu&apos;il est de nouveau en stock.
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className={`max-w-2xl mx-auto mb-8 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full blur opacity-20"></div>
                <div className="relative flex items-center bg-white rounded-full shadow-xl shadow-gray-200/50 border border-gray-100">
                  <Search className="absolute left-6 h-6 w-6 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un medicament (ex: Ozempic, Doliprane...)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full py-5 pl-16 pr-44 text-lg rounded-full border-0 focus:ring-0 focus:outline-none text-gray-900 placeholder-gray-400"
                  />
                  <button
                    type="submit"
                    disabled={loading || query.length < 2}
                    className="absolute right-2 px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold rounded-full hover:shadow-lg hover:shadow-teal-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        Rechercher
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Search Results */}
            {searched && (
              <div className={`max-w-2xl mx-auto text-left animate-slide-up`}>
                {results.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
                    <Pill className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Aucun medicament trouve pour &quot;{query}&quot;</p>
                    <p className="text-gray-400 text-sm mt-2">Essayez avec un autre nom ou molecule</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500 font-medium">{results.length} resultat(s) pour &quot;{query}&quot;</p>
                    {results.map((med, index) => {
                      const config = statusConfig[med.status];
                      const Icon = config.icon;
                      return (
                        <div
                          key={med.id}
                          className={`bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${med.status === "RUPTURE" ? "border-l-4 border-l-rose-500" : med.status === "TENSION" ? "border-l-4 border-l-amber-500" : "border-l-4 border-l-emerald-500"}`}
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 flex-wrap mb-2">
                                <h3 className="text-lg font-bold text-gray-900">{med.name}</h3>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.border} border ${config.text}`}>
                                  <Icon className="h-3.5 w-3.5" />
                                  {config.label}
                                </span>
                              </div>
                              <p className="text-gray-500">
                                {med.laboratory}
                                {med.activeIngredient && <span className="text-gray-400"> &bull; {med.activeIngredient}</span>}
                              </p>
                            </div>
                            <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transition-all duration-200">
                              <Bell className="h-4 w-4" />
                              Alerte
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Quick suggestions when not searched */}
            {!searched && (
              <div className={`flex flex-wrap justify-center gap-3 transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <span className="text-gray-500 text-sm">Recherches populaires:</span>
                {["Ozempic", "Doliprane", "Levothyrox", "Amoxicilline"].map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-4 py-1.5 bg-white rounded-full text-sm text-gray-600 hover:text-teal-600 hover:bg-teal-50 border border-gray-200 hover:border-teal-200 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Live Status Cards */}
          {!searched && (
            <div className={`mt-20 max-w-5xl mx-auto transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="text-center mb-8">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-500">
                  <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                  Ruptures et tensions en cours
                </span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {recentShortages.map((item, i) => (
                  <div
                    key={i}
                    className={`bg-white rounded-2xl p-5 shadow-lg border ${item.status === "RUPTURE" ? "border-l-4 border-l-rose-500" : "border-l-4 border-l-amber-500"} hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
                  >
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
            </div>
          )}
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
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 mb-4">
                  <stat.icon className="h-7 w-7 text-white" />
                </div>
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-100 text-teal-700 font-semibold text-sm mb-6">
              <Zap className="h-4 w-4" />
              Fonctionnalites
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Ne manquez plus jamais un medicament
            </h2>
            <p className="text-xl text-gray-600">
              Un service gratuit et fiable pour suivre la disponibilite de vos traitements essentiels.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group bg-white rounded-3xl p-8 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-teal-200/50 transition-all duration-300 hover:-translate-y-2 border border-gray-100"
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-100 text-teal-700 font-semibold text-sm mb-6">
              <TrendingUp className="h-4 w-4" />
              Comment ca marche
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Simple et efficace
            </h2>
            <p className="text-xl text-gray-600">
              Trois etapes pour ne plus jamais manquer votre traitement.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: "1", title: "Recherchez", desc: "Entrez le nom de votre medicament dans la barre de recherche", icon: Search, color: "from-teal-500 to-cyan-600" },
              { step: "2", title: "Activez l'alerte", desc: "Cliquez sur le bouton alerte pour etre notifie par email", icon: Bell, color: "from-amber-500 to-orange-600" },
              { step: "3", title: "Recevez la notification", desc: "Des que le medicament est disponible, vous etes prevenu", icon: Mail, color: "from-emerald-500 to-green-600" }
            ].map((item, i) => (
              <div key={i} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-gray-200 to-transparent z-0"></div>
                )}
                <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 relative z-10">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} mb-6 text-white font-bold text-xl`}>
                    {item.step}
                  </div>
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 font-medium text-sm mb-8 border border-white/20">
            <Heart className="h-4 w-4" />
            Service 100% gratuit
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Pret a suivre vos medicaments ?
          </h2>
          <p className="text-xl text-teal-100 mb-10">
            Rejoignez des milliers de patients qui ne manquent plus leurs traitements essentiels.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-teal-600 font-semibold rounded-2xl hover:bg-teal-50 transition-all hover:shadow-xl">
              Creer mon compte gratuit
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/medications" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-2xl hover:bg-white/20 transition-all border border-white/20">
              <Pill className="h-5 w-5" />
              Voir tous les medicaments
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-r from-teal-500 to-cyan-600 p-2 rounded-xl">
                  <Pill className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">AlerteMedicaments</span>
              </div>
              <p className="text-gray-500 leading-relaxed">
                Service gratuit de suivi des ruptures et tensions d&apos;approvisionnement de medicaments en France.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Navigation</h4>
              <ul className="space-y-3">
                <li><Link href="/medications" className="hover:text-white transition-colors">Medicaments</Link></li>
                <li><a href="#features" className="hover:text-white transition-colors">Fonctionnalites</a></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Connexion</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-white transition-colors">Mentions legales</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Confidentialite</a></li>
                <li><a href="#" className="hover:text-white transition-colors">CGU</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Source</h4>
              <p className="text-gray-500 text-sm leading-relaxed">
                Les donnees de disponibilite sont issues de l&apos;ANSM (Agence Nationale de Securite du Medicament).
              </p>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">&copy; 2024 AlerteMedicaments. Tous droits reserves.</p>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="text-sm">Donnees securisees</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
