"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Pill,
  Search,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Info,
  FileText,
  ExternalLink,
  Loader2
} from "lucide-react";

interface Alternative {
  id: string;
  name: string;
  type: "generic" | "equivalent";
  laboratory: string;
  activeIngredient: string;
  status: "AVAILABLE" | "TENSION" | "RUPTURE" | "UNKNOWN";
  differences: string[];
  recommendation: string;
}

interface MedicationDetails {
  id: string;
  name: string;
  activeIngredient: string;
  laboratory: string;
  status: "AVAILABLE" | "TENSION" | "RUPTURE" | "UNKNOWN";
  alternatives: Alternative[];
  aiRecommendation?: string;
}

export default function AlternativesPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const medicationId = searchParams.get("id");

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [medication, setMedication] = useState<MedicationDetails | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  useEffect(() => {
    if (medicationId) {
      fetchMedicationAlternatives(medicationId);
    }
  }, [medicationId]);

  const fetchMedicationAlternatives = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/medications/${id}/alternatives`);
      if (res.ok) {
        const data = await res.json();
        setMedication(data);
      }
    } catch (error) {
      console.error("Erreur chargement alternatives:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      // Rechercher le médicament
      const searchRes = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}`
      );
      if (searchRes.ok) {
        const results = await searchRes.json();
        if (results.length > 0) {
          await fetchMedicationAlternatives(results[0].id);
        }
      }
    } catch (error) {
      console.error("Erreur recherche:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAiRecommendation = async () => {
    if (!medication) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/alternatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicationId: medication.id,
          medicationName: medication.name,
          activeIngredient: medication.activeIngredient,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMedication({
          ...medication,
          aiRecommendation: data.recommendation,
        });
      }
    } catch (error) {
      console.error("Erreur IA:", error);
    } finally {
      setAiLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-100 text-green-800 border-green-300";
      case "TENSION":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "RUPTURE":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusText = (status: string) => {
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

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Alternatives IA</h1>
        <p className="text-gray-600 mt-1">
          Trouvez des alternatives disponibles pour vos médicaments en rupture
        </p>
      </div>

      {/* Recherche */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un médicament..."
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Rechercher"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Résultats */}
      {loading && !medication && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {medication && (
        <div className="space-y-6">
          {/* Médicament original */}
          <Card className={medication.status === "RUPTURE" ? "border-red-300" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    {medication.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {medication.activeIngredient} • {medication.laboratory}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(medication.status)}>
                  {medication.status === "RUPTURE" && (
                    <AlertTriangle className="h-3 w-3 mr-1" />
                  )}
                  {getStatusText(medication.status)}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Recommandation IA */}
          {medication.status !== "AVAILABLE" && (
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Recommandation IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                {medication.aiRecommendation ? (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700">{medication.aiRecommendation}</p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-4">
                      Obtenez une analyse personnalisée des alternatives par notre IA
                    </p>
                    <Button
                      onClick={getAiRecommendation}
                      disabled={aiLoading}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {aiLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      Analyser les alternatives
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Liste des alternatives */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Alternatives disponibles ({medication.alternatives.length})
            </h2>

            {medication.alternatives.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Info className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">
                    Aucune alternative trouvée pour ce médicament
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Consultez votre pharmacien pour plus d'options
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {medication.alternatives.map((alt) => (
                  <Card
                    key={alt.id}
                    className={
                      alt.status === "AVAILABLE" ? "border-green-200" : ""
                    }
                  >
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{alt.name}</h3>
                            <Badge
                              variant="outline"
                              className={
                                alt.type === "generic"
                                  ? "text-blue-600 border-blue-300"
                                  : "text-purple-600 border-purple-300"
                              }
                            >
                              {alt.type === "generic"
                                ? "Générique"
                                : "Équivalent"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {alt.activeIngredient} • {alt.laboratory}
                          </p>

                          {alt.differences.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-gray-700 mb-1">
                                Différences :
                              </p>
                              <ul className="text-sm text-gray-600 list-disc list-inside">
                                {alt.differences.map((diff, i) => (
                                  <li key={i}>{diff}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {alt.recommendation && (
                            <p className="text-sm text-gray-600 mt-2 italic">
                              "{alt.recommendation}"
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2 ml-4">
                          <Badge className={getStatusColor(alt.status)}>
                            {alt.status === "AVAILABLE" && (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            )}
                            {getStatusText(alt.status)}
                          </Badge>
                          <Button size="sm" variant="outline">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="py-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Avertissement important
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    Ces informations sont fournies à titre indicatif. Consultez
                    toujours votre pharmacien ou médecin avant de changer de
                    médicament. Seul un professionnel de santé peut valider une
                    substitution.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1">
              <FileText className="h-4 w-4 mr-2" />
              Exporter en PDF
            </Button>
            <Button variant="outline" className="flex-1">
              <ExternalLink className="h-4 w-4 mr-2" />
              Voir sur ANSM
            </Button>
          </div>
        </div>
      )}

      {/* État vide */}
      {!medication && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-purple-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Trouvez des alternatives
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Recherchez un médicament en rupture ou tension pour découvrir les
              alternatives disponibles suggérées par notre IA.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
