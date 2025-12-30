"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Plus, AlertTriangle, Clock, CheckCircle, Pill, ArrowRight, Search } from "lucide-react";

interface Alert {
  id: string;
  type: string;
  isActive: boolean;
  medication: {
    id: string;
    name: string;
    status: string;
    laboratory?: string;
  };
}

interface Stats {
  totalAlerts: number;
  activeAlerts: number;
  ruptureCount: number;
  tensionCount: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<Stats>({ totalAlerts: 0, activeAlerts: 0, ruptureCount: 0, tensionCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);

        const activeAlerts = (data.alerts || []).filter((a: Alert) => a.isActive);
        const ruptureCount = (data.alerts || []).filter((a: Alert) => a.medication.status === "RUPTURE").length;
        const tensionCount = (data.alerts || []).filter((a: Alert) => a.medication.status === "TENSION").length;

        setStats({
          totalAlerts: (data.alerts || []).length,
          activeAlerts: activeAlerts.length,
          ruptureCount,
          tensionCount
        });
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Bonjour, {session?.user?.name || "Utilisateur"} !
        </h1>
        <p className="text-gray-600 mt-1">
          Voici le suivi de vos alertes medicaments
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-teal-100">
              <Bell className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAlerts}</p>
              <p className="text-sm text-gray-500">Alertes totales</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-100">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.activeAlerts}</p>
              <p className="text-sm text-gray-500">Alertes actives</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-rose-100">
              <AlertTriangle className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.ruptureCount}</p>
              <p className="text-sm text-gray-500">En rupture</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-100">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.tensionCount}</p>
              <p className="text-sm text-gray-500">En tension</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link
          href="/medications"
          className="group bg-gradient-to-r from-teal-500 to-cyan-600 rounded-2xl p-6 text-white hover:shadow-lg hover:shadow-teal-500/25 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/20">
                <Search className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Rechercher un medicament</h3>
                <p className="text-teal-100">Trouvez et suivez un nouveau medicament</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
        <Link
          href="/alerts"
          className="group bg-white rounded-2xl p-6 border border-gray-200 hover:border-teal-300 hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-teal-100">
                <Bell className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Gerer mes alertes</h3>
                <p className="text-gray-500">Voir et modifier vos alertes actives</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Mes alertes recentes</h2>
            <Link
              href="/alerts"
              className="text-sm text-teal-600 hover:text-teal-700 font-medium"
            >
              Voir tout
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin mx-auto"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune alerte</h3>
            <p className="text-gray-500 mb-6">
              Vous n&apos;avez pas encore cree d&apos;alerte pour un medicament
            </p>
            <Link
              href="/medications"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transition-all"
            >
              <Plus className="h-5 w-5" />
              Creer une alerte
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {alerts.slice(0, 5).map((alert) => {
              const config = getStatusConfig(alert.medication.status);
              const Icon = config.icon;
              return (
                <div
                  key={alert.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${config.iconBg}`}>
                        <Icon className={`h-5 w-5 ${config.text}`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{alert.medication.name}</h4>
                        {alert.medication.laboratory && (
                          <p className="text-sm text-gray-500">{alert.medication.laboratory}</p>
                        )}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text} border ${config.border}`}>
                      {config.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
