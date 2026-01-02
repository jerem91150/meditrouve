"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeftRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronRight,
  Loader2,
  Pill,
  FlaskConical,
} from "lucide-react";

interface Alternative {
  id: string;
  cisCode: string;
  name: string;
  laboratory: string | null;
  activeIngredient: string | null;
  dosage: string | null;
  form: string | null;
  status: string;
  matchType: "generic" | "sameIngredient" | "similar";
}

interface AlternativesListProps {
  medicationId: string;
  medicationName: string;
  onSelectAlternative?: (alternative: Alternative) => void;
}

export default function AlternativesList({
  medicationId,
  medicationName,
  onSelectAlternative,
}: AlternativesListProps) {
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchAlternatives() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/medications/${medicationId}/alternatives`
        );
        const data = await response.json();

        if (data.alternatives) {
          setAlternatives(data.alternatives);
        }
      } catch (err) {
        setError("Impossible de charger les alternatives");
      } finally {
        setLoading(false);
      }
    }

    fetchAlternatives();
  }, [medicationId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "TENSION":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "RUPTURE":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Pill className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "Disponible";
      case "TENSION":
        return "Tension";
      case "RUPTURE":
        return "Rupture";
      default:
        return "Inconnu";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "TENSION":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "RUPTURE":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const getMatchTypeLabel = (matchType: Alternative["matchType"]) => {
    switch (matchType) {
      case "generic":
        return "Générique";
      case "sameIngredient":
        return "Même principe actif";
      case "similar":
        return "Similaire";
    }
  };

  const getMatchTypeColor = (matchType: Alternative["matchType"]) => {
    switch (matchType) {
      case "generic":
        return "bg-blue-100 text-blue-700";
      case "sameIngredient":
        return "bg-purple-100 text-purple-700";
      case "similar":
        return "bg-gray-100 text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <ArrowLeftRight className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Alternatives disponibles</h3>
        </div>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (alternatives.length === 0) {
    return null;
  }

  const displayedAlternatives = expanded ? alternatives : alternatives.slice(0, 3);
  const availableCount = alternatives.filter((a) => a.status === "AVAILABLE").length;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ArrowLeftRight className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Alternatives disponibles</h3>
            <p className="text-sm text-gray-600">
              {alternatives.length} alternative{alternatives.length > 1 ? "s" : ""} trouvée
              {alternatives.length > 1 ? "s" : ""}
              {availableCount > 0 && (
                <span className="text-emerald-600 font-medium">
                  {" "}- {availableCount} disponible{availableCount > 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {displayedAlternatives.map((alt) => (
          <div
            key={alt.id}
            className={`bg-white rounded-xl p-4 border transition-all cursor-pointer hover:shadow-md ${
              alt.status === "AVAILABLE"
                ? "border-emerald-200 hover:border-emerald-300"
                : "border-gray-100 hover:border-gray-200"
            }`}
            onClick={() => onSelectAlternative?.(alt)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium text-gray-900 truncate">{alt.name}</h4>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${getMatchTypeColor(
                      alt.matchType
                    )}`}
                  >
                    {getMatchTypeLabel(alt.matchType)}
                  </span>
                </div>

                {alt.laboratory && (
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                    <FlaskConical className="w-3 h-3" />
                    {alt.laboratory}
                  </p>
                )}

                {alt.activeIngredient && (
                  <p className="text-xs text-gray-400 mt-1">
                    {alt.activeIngredient}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-2">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1 ${getStatusColor(
                    alt.status
                  )}`}
                >
                  {getStatusIcon(alt.status)}
                  {getStatusLabel(alt.status)}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {alternatives.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-3 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          {expanded
            ? "Voir moins"
            : `Voir ${alternatives.length - 3} autre${
                alternatives.length - 3 > 1 ? "s" : ""
              } alternative${alternatives.length - 3 > 1 ? "s" : ""}`}
        </button>
      )}

      <p className="text-xs text-gray-500 mt-4 text-center">
        Consultez votre médecin ou pharmacien avant de changer de médicament
      </p>
    </div>
  );
}
