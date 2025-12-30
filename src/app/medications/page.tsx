"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pill, AlertTriangle, CheckCircle, Clock, ArrowLeft, Bell, Search, Filter, ChevronLeft, ChevronRight, RefreshCw, X, Check } from "lucide-react";

interface Medication {
  id: string;
  name: string;
  laboratory?: string;
  status: "AVAILABLE" | "TENSION" | "RUPTURE" | "UNKNOWN";
  activeIngredient?: string;
  lastChecked: string;
}

export default function MedicationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Alert creation state
  const [creatingAlert, setCreatingAlert] = useState<string | null>(null);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);
  const [alertError, setAlertError] = useState<string | null>(null);

  useEffect(() => {
    fetchMedications();
  }, [filter, page]);

  const fetchMedications = async () => {
    setLoading(true);
    try {
      const status = filter !== "all" ? `&status=${filter}` : "";
      const r = await fetch(`/api/medications?page=${page}&limit=20${status}`);
      const data = await r.json();
      setMedications(data.medications || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleCreateAlert = async (medication: Medication) => {
    if (!session) {
      router.push("/login");
      return;
    }

    setCreatingAlert(medication.id);
    setAlertError(null);

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicationId: medication.id,
          type: medication.status === "RUPTURE" ? "AVAILABLE" : "ANY_CHANGE"
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAlertError(data.error || "Erreur lors de la creation");
        setTimeout(() => setAlertError(null), 3000);
      } else {
        setAlertSuccess(medication.id);
        setTimeout(() => setAlertSuccess(null), 3000);
      }
    } catch (error) {
      console.error("Error creating alert:", error);
      setAlertError("Erreur lors de la creation");
      setTimeout(() => setAlertError(null), 3000);
    } finally {
      setCreatingAlert(null);
    }
  };

  const statusConfig = {
    AVAILABLE: {
      label: "Disponible",
      icon: CheckCircle,
      bg: "bg-emerald-50",
      border: "border-emerald-500",
      badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
      iconColor: "text-emerald-600"
    },
    TENSION: {
      label: "Tension",
      icon: Clock,
      bg: "bg-amber-50",
      border: "border-amber-500",
      badge: "bg-amber-100 text-amber-700 border-amber-200",
      iconColor: "text-amber-600"
    },
    RUPTURE: {
      label: "Rupture",
      icon: AlertTriangle,
      bg: "bg-rose-50",
      border: "border-rose-500",
      badge: "bg-rose-100 text-rose-700 border-rose-200",
      iconColor: "text-rose-600"
    },
    UNKNOWN: {
      label: "Inconnu",
      icon: Pill,
      bg: "bg-gray-50",
      border: "border-gray-400",
      badge: "bg-gray-100 text-gray-700 border-gray-200",
      iconColor: "text-gray-600"
    }
  };

  const filters = [
    { value: "all", label: "Tous les medicaments", count: total },
    { value: "RUPTURE", label: "En rupture", color: "bg-rose-500" },
    { value: "TENSION", label: "En tension", color: "bg-amber-500" },
    { value: "AVAILABLE", label: "Disponibles", color: "bg-emerald-500" }
  ];

  const filteredMedications = searchQuery
    ? medications.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.laboratory?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.activeIngredient?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : medications;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Alert notifications */}
      {alertError && (
        <div className="fixed top-4 right-4 z-[100] bg-rose-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-slide-up">
          <X className="h-5 w-5" />
          {alertError}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-teal-500 to-cyan-600 p-2 rounded-xl">
                  <Pill className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  AlerteMedicaments
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {session ? (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-colors"
                >
                  <Bell className="h-4 w-4" />
                  Mes alertes
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-colors"
                >
                  Connexion
                </Link>
              )}
              <button
                onClick={fetchMedications}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Liste des medicaments
          </h1>
          <p className="text-gray-600">
            Consultez la disponibilite de tous les medicaments suivis par l&apos;ANSM.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Filtrer par nom, laboratoire ou molecule..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-gray-500 mr-2">
              <Filter className="h-4 w-4" />
              Filtrer:
            </div>
            {filters.map(f => (
              <button
                key={f.value}
                onClick={() => { setFilter(f.value); setPage(1); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filter === f.value
                    ? f.value === "RUPTURE"
                      ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25"
                      : f.value === "TENSION"
                      ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
                      : f.value === "AVAILABLE"
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                      : "bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/25"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {f.color && filter !== f.value && (
                  <span className={`w-2 h-2 rounded-full ${f.color}`}></span>
                )}
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{filteredMedications.length}</span> medicament(s) affiche(s)
            {filter !== "all" && ` (filtre: ${filters.find(f => f.value === filter)?.label})`}
          </p>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin mb-4"></div>
            <p className="text-gray-500">Chargement des medicaments...</p>
          </div>
        ) : filteredMedications.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg border border-gray-100">
            <Pill className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun medicament trouve</h3>
            <p className="text-gray-500">Essayez de modifier vos filtres ou votre recherche.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMedications.map((med, index) => {
              const config = statusConfig[med.status];
              const Icon = config.icon;
              const isCreating = creatingAlert === med.id;
              const isSuccess = alertSuccess === med.id;
              return (
                <div
                  key={med.id}
                  className={`group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 border-l-4 ${config.border} hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{med.name}</h3>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${config.badge}`}>
                          <Icon className={`h-3.5 w-3.5 ${config.iconColor}`} />
                          {config.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                        {med.laboratory && (
                          <span className="flex items-center gap-1">
                            <span className="font-medium text-gray-700">{med.laboratory}</span>
                          </span>
                        )}
                        {med.activeIngredient && (
                          <>
                            <span className="text-gray-300">&bull;</span>
                            <span>{med.activeIngredient}</span>
                          </>
                        )}
                        <span className="text-gray-300">&bull;</span>
                        <span className="text-gray-400">
                          MAJ: {new Date(med.lastChecked).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCreateAlert(med)}
                      disabled={isCreating || isSuccess}
                      className={`flex items-center gap-2 px-5 py-2.5 font-semibold rounded-xl transition-all duration-200 ${
                        isSuccess
                          ? "bg-emerald-500 text-white"
                          : "bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:shadow-lg hover:shadow-teal-500/25 opacity-0 group-hover:opacity-100"
                      } ${isCreating ? "opacity-75" : ""}`}
                    >
                      {isCreating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Creation...
                        </>
                      ) : isSuccess ? (
                        <>
                          <Check className="h-4 w-4" />
                          Alerte creee
                        </>
                      ) : (
                        <>
                          <Bell className="h-4 w-4" />
                          Creer une alerte
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-12">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
              Precedent
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-xl font-medium transition-all ${
                      page === pageNum
                        ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/25"
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Page info */}
        {totalPages > 1 && (
          <p className="text-center text-sm text-gray-500 mt-4">
            Page {page} sur {totalPages}
          </p>
        )}
      </main>
    </div>
  );
}
