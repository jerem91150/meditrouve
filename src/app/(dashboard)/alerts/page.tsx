"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, AlertTriangle, Clock, CheckCircle, Pill, Trash2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Alert {
  id: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  medication: {
    id: string;
    name: string;
    status: string;
    laboratory?: string;
    activeIngredient?: string;
  };
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAlert = async (alertId: string) => {
    if (!confirm("Supprimer cette alerte ?")) return;

    try {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAlerts(alerts.filter(a => a.id !== alertId));
      }
    } catch (error) {
      console.error("Error deleting alert:", error);
    }
  };

  const toggleAlert = async (alertId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (res.ok) {
        setAlerts(alerts.map(a =>
          a.id === alertId ? { ...a, isActive: !isActive } : a
        ));
      }
    } catch (error) {
      console.error("Error toggling alert:", error);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "RUPTURE":
        return {
          label: "En rupture",
          icon: AlertTriangle,
          bg: "bg-rose-50",
          text: "text-rose-700",
          border: "border-rose-200",
          iconBg: "bg-rose-100"
        };
      case "TENSION":
        return {
          label: "En tension",
          icon: Clock,
          bg: "bg-amber-50",
          text: "text-amber-700",
          border: "border-amber-200",
          iconBg: "bg-amber-100"
        };
      case "AVAILABLE":
        return {
          label: "Disponible",
          icon: CheckCircle,
          bg: "bg-emerald-50",
          text: "text-emerald-700",
          border: "border-emerald-200",
          iconBg: "bg-emerald-100"
        };
      default:
        return {
          label: "Inconnu",
          icon: Pill,
          bg: "bg-gray-50",
          text: "text-gray-700",
          border: "border-gray-200",
          iconBg: "bg-gray-100"
        };
    }
  };

  const filteredAlerts = filter === "all"
    ? alerts
    : alerts.filter(a => a.medication.status === filter);

  const filters = [
    { value: "all", label: "Toutes" },
    { value: "RUPTURE", label: "En rupture", color: "bg-rose-500" },
    { value: "TENSION", label: "En tension", color: "bg-amber-500" },
    { value: "AVAILABLE", label: "Disponibles", color: "bg-emerald-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Mes alertes</h1>
          <p className="text-gray-600 mt-1">
            Gerez vos alertes pour les medicaments suivis
          </p>
        </div>
        <Link
          href="/medications"
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transition-all"
        >
          <Plus className="h-5 w-5" />
          Nouvelle alerte
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === f.value
                ? f.value === "RUPTURE"
                  ? "bg-rose-500 text-white"
                  : f.value === "TENSION"
                  ? "bg-amber-500 text-white"
                  : f.value === "AVAILABLE"
                  ? "bg-emerald-500 text-white"
                  : "bg-gradient-to-r from-teal-500 to-cyan-600 text-white"
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

      {/* Alerts List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin mb-4"></div>
          <p className="text-gray-500">Chargement des alertes...</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Bell className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune alerte</h3>
          <p className="text-gray-500 mb-6">
            {filter !== "all"
              ? "Aucune alerte pour ce filtre"
              : "Commencez par rechercher un medicament"}
          </p>
          <Link
            href="/medications"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transition-all"
          >
            <Search className="h-5 w-5" />
            Rechercher un medicament
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const config = getStatusConfig(alert.medication.status);
            const Icon = config.icon;
            return (
              <div
                key={alert.id}
                className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 border-l-4 ${
                  alert.medication.status === "RUPTURE" ? "border-l-rose-500" :
                  alert.medication.status === "TENSION" ? "border-l-amber-500" :
                  alert.medication.status === "AVAILABLE" ? "border-l-emerald-500" :
                  "border-l-gray-400"
                } ${!alert.isActive ? "opacity-60" : ""}`}
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${config.iconBg}`}>
                      <Icon className={`h-6 w-6 ${config.text}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-bold text-gray-900">{alert.medication.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text} border ${config.border}`}>
                          {config.label}
                        </span>
                        {!alert.isActive && (
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-500 border border-gray-200">
                            Desactivee
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 flex-wrap">
                        {alert.medication.laboratory && (
                          <span>{alert.medication.laboratory}</span>
                        )}
                        {alert.medication.activeIngredient && (
                          <>
                            <span className="text-gray-300">&bull;</span>
                            <span>{alert.medication.activeIngredient}</span>
                          </>
                        )}
                        <span className="text-gray-300">&bull;</span>
                        <span>Creee le {new Date(alert.createdAt).toLocaleDateString("fr-FR")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAlert(alert.id, alert.isActive)}
                      className="rounded-xl"
                    >
                      {alert.isActive ? "Desactiver" : "Activer"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteAlert(alert.id)}
                      className="rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
