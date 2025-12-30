"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Phone,
  Clock,
  Navigation,
  Search,
  Pill,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ThumbsUp,
  Plus,
  Filter
} from "lucide-react";

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone?: string;
  distance?: number;
  isOnDuty: boolean;
  availability?: {
    status: "AVAILABLE" | "UNAVAILABLE" | "LIMITED";
    reportedAt: string;
    verifiedBy: number;
  };
}

interface MedicationSearch {
  id: string;
  name: string;
}

export default function PharmaciesPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const medicationId = searchParams.get("medication");

  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedMedication, setSelectedMedication] = useState<MedicationSearch | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showOnDutyOnly, setShowOnDutyOnly] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  useEffect(() => {
    // Demander la géolocalisation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Erreur géolocalisation:", error);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (medicationId) {
      fetchMedicationInfo(medicationId);
    }
  }, [medicationId]);

  useEffect(() => {
    if (userLocation) {
      fetchNearbyPharmacies();
    }
  }, [userLocation, showOnDutyOnly]);

  const fetchMedicationInfo = async (id: string) => {
    try {
      const res = await fetch(`/api/medications/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedMedication({ id: data.id, name: data.name });
      }
    } catch (error) {
      console.error("Erreur chargement médicament:", error);
    }
  };

  const fetchNearbyPharmacies = async () => {
    if (!userLocation) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        lat: userLocation.lat.toString(),
        lng: userLocation.lng.toString(),
        ...(showOnDutyOnly && { onDuty: "true" }),
        ...(selectedMedication && { medicationId: selectedMedication.id }),
      });

      const res = await fetch(`/api/pharmacies/nearby?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPharmacies(data);
      }
    } catch (error) {
      console.error("Erreur chargement pharmacies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/pharmacies/search?q=${encodeURIComponent(searchQuery)}`
      );
      if (res.ok) {
        const data = await res.json();
        setPharmacies(data);
      }
    } catch (error) {
      console.error("Erreur recherche:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async (pharmacyId: string, status: "AVAILABLE" | "UNAVAILABLE" | "LIMITED") => {
    if (!selectedMedication) return;
    try {
      const res = await fetch("/api/pharmacies/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pharmacyId,
          medicationId: selectedMedication.id,
          status,
        }),
      });
      if (res.ok) {
        fetchNearbyPharmacies();
        setShowReportModal(false);
        setSelectedPharmacy(null);
      }
    } catch (error) {
      console.error("Erreur signalement:", error);
    }
  };

  const handleVerify = async (pharmacyId: string) => {
    if (!selectedMedication) return;
    try {
      await fetch("/api/pharmacies/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pharmacyId,
          medicationId: selectedMedication.id,
        }),
      });
      fetchNearbyPharmacies();
    } catch (error) {
      console.error("Erreur vérification:", error);
    }
  };

  const openInMaps = (pharmacy: Pharmacy) => {
    const query = encodeURIComponent(
      `${pharmacy.name} ${pharmacy.address} ${pharmacy.postalCode} ${pharmacy.city}`
    );
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  const formatDistance = (meters?: number) => {
    if (!meters) return "";
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const getAvailabilityBadge = (availability?: Pharmacy["availability"]) => {
    if (!availability) return null;
    switch (availability.status) {
      case "AVAILABLE":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Disponible
          </Badge>
        );
      case "UNAVAILABLE":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Indisponible
          </Badge>
        );
      case "LIMITED":
        return (
          <Badge className="bg-orange-100 text-orange-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Stock limité
          </Badge>
        );
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
        <h1 className="text-3xl font-bold text-gray-900">Pharmacies</h1>
        <p className="text-gray-600 mt-1">
          Trouvez les pharmacies près de chez vous et vérifiez la disponibilité
        </p>
      </div>

      {/* Médicament sélectionné */}
      {selectedMedication && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Pill className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600">Recherche de disponibilité pour</p>
                  <p className="font-semibold text-blue-900">{selectedMedication.name}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMedication(null)}
              >
                Changer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recherche et filtres */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une pharmacie ou une ville..."
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={loading}>
              Rechercher
            </Button>
          </form>

          <div className="flex gap-2">
            <Button
              variant={showOnDutyOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOnDutyOnly(!showOnDutyOnly)}
            >
              <Clock className="h-4 w-4 mr-2" />
              Pharmacies de garde
            </Button>
            {userLocation && (
              <Button variant="outline" size="sm" onClick={fetchNearbyPharmacies}>
                <MapPin className="h-4 w-4 mr-2" />
                Près de moi
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Demande de géoloc */}
      {!userLocation && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-amber-600" />
              <div className="flex-1">
                <p className="font-medium text-amber-800">
                  Activez la géolocalisation
                </p>
                <p className="text-sm text-amber-700">
                  Pour trouver les pharmacies les plus proches de vous
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
                  );
                }}
              >
                Activer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des pharmacies */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : pharmacies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">
              Aucune pharmacie trouvée. Activez la géolocalisation ou effectuez une recherche.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pharmacies.map((pharmacy) => (
            <Card
              key={pharmacy.id}
              className={
                pharmacy.availability?.status === "AVAILABLE"
                  ? "border-green-200"
                  : ""
              }
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{pharmacy.name}</h3>
                      {pharmacy.isOnDuty && (
                        <Badge className="bg-purple-100 text-purple-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Garde
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {pharmacy.address}, {pharmacy.postalCode} {pharmacy.city}
                    </p>
                    {pharmacy.phone && (
                      <p className="text-sm text-gray-500 mt-1">
                        <Phone className="h-3 w-3 inline mr-1" />
                        {pharmacy.phone}
                      </p>
                    )}

                    {/* Signalements */}
                    {pharmacy.availability && (
                      <div className="mt-3 flex items-center gap-2">
                        {getAvailabilityBadge(pharmacy.availability)}
                        <span className="text-xs text-gray-500">
                          Signalé il y a{" "}
                          {Math.round(
                            (Date.now() - new Date(pharmacy.availability.reportedAt).getTime()) /
                              60000
                          )}{" "}
                          min
                        </span>
                        {pharmacy.availability.verifiedBy > 0 && (
                          <span className="text-xs text-green-600">
                            <ThumbsUp className="h-3 w-3 inline mr-1" />
                            {pharmacy.availability.verifiedBy} confirmation(s)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 ml-4">
                    {pharmacy.distance && (
                      <Badge variant="outline">{formatDistance(pharmacy.distance)}</Badge>
                    )}
                    <div className="flex gap-1">
                      {pharmacy.availability && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleVerify(pharmacy.id)}
                          title="Confirmer"
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                      )}
                      {selectedMedication && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedPharmacy(pharmacy);
                            setShowReportModal(true);
                          }}
                          title="Signaler disponibilité"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openInMaps(pharmacy)}
                      >
                        <Navigation className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de signalement */}
      {showReportModal && selectedPharmacy && selectedMedication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Signaler la disponibilité</CardTitle>
              <CardDescription>
                {selectedMedication.name} chez {selectedPharmacy.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start text-green-600 hover:bg-green-50"
                  onClick={() => handleReport(selectedPharmacy.id, "AVAILABLE")}
                >
                  <CheckCircle className="h-5 w-5 mr-3" />
                  Disponible en stock
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-orange-600 hover:bg-orange-50"
                  onClick={() => handleReport(selectedPharmacy.id, "LIMITED")}
                >
                  <AlertCircle className="h-5 w-5 mr-3" />
                  Stock limité
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:bg-red-50"
                  onClick={() => handleReport(selectedPharmacy.id, "UNAVAILABLE")}
                >
                  <XCircle className="h-5 w-5 mr-3" />
                  Indisponible
                </Button>
              </div>
              <Button
                variant="ghost"
                className="w-full mt-4"
                onClick={() => {
                  setShowReportModal(false);
                  setSelectedPharmacy(null);
                }}
              >
                Annuler
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Explication crowdsourcing */}
      <Card className="mt-8 bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader>
          <CardTitle className="text-lg">Comment ça marche ?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <h4 className="font-medium mb-1">1. Localisez</h4>
              <p className="text-sm text-gray-600">
                Trouvez les pharmacies près de chez vous
              </p>
            </div>
            <div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Plus className="h-5 w-5 text-green-600" />
              </div>
              <h4 className="font-medium mb-1">2. Signalez</h4>
              <p className="text-sm text-gray-600">
                Indiquez si le médicament est disponible
              </p>
            </div>
            <div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ThumbsUp className="h-5 w-5 text-purple-600" />
              </div>
              <h4 className="font-medium mb-1">3. Confirmez</h4>
              <p className="text-sm text-gray-600">
                Validez les signalements d'autres utilisateurs
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
