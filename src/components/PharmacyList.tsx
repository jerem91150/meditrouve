"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  Navigation,
  Store,
  ThumbsUp,
  Plus,
  Locate,
  Search,
} from "lucide-react";
import CitySearch from "./CitySearch";

type LocationMode = "geolocation" | "city";

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  isOnDuty: boolean;
  distance: number | null;
  availability: {
    status: string;
    quantity: number | null;
    price: number | null;
    reportedAt: string;
    verifiedBy: number;
  } | null;
}

interface PharmacyListProps {
  medicationId: string;
  medicationName: string;
}

export default function PharmacyList({
  medicationId,
  medicationName,
}: PharmacyListProps) {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(
    null
  );
  const [locationMode, setLocationMode] = useState<LocationMode>("geolocation");
  const [cityLocation, setCityLocation] = useState<{
    lat: number;
    lng: number;
    name: string;
  } | null>(null);
  const [geoError, setGeoError] = useState(false);

  // Récupérer la géolocalisation
  useEffect(() => {
    if (locationMode === "geolocation" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setGeoError(false);
        },
        (err) => {
          console.log("Geolocation not available:", err);
          setGeoError(true);
        }
      );
    }
  }, [locationMode]);

  // Déterminer les coordonnées actives selon le mode
  const activeLocation =
    locationMode === "city" && cityLocation
      ? { lat: cityLocation.lat, lng: cityLocation.lng }
      : locationMode === "geolocation" && userLocation
        ? userLocation
        : null;

  // Charger les pharmacies
  useEffect(() => {
    async function fetchPharmacies() {
      setLoading(true);
      try {
        let url = `/api/pharmacies/nearby?medicationId=${medicationId}`;
        if (activeLocation) {
          url += `&lat=${activeLocation.lat}&lng=${activeLocation.lng}&radius=20`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.pharmacies) {
          setPharmacies(data.pharmacies);
        }
      } catch (err) {
        setError("Impossible de charger les pharmacies");
      } finally {
        setLoading(false);
      }
    }

    fetchPharmacies();
  }, [medicationId, activeLocation?.lat, activeLocation?.lng]);

  const handleReport = async (
    pharmacyId: string,
    status: "AVAILABLE" | "UNAVAILABLE" | "LIMITED"
  ) => {
    try {
      const response = await fetch("/api/pharmacies/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pharmacyId,
          medicationId,
          status,
        }),
      });

      if (response.ok) {
        // Rafraîchir la liste
        const url = `/api/pharmacies/nearby?medicationId=${medicationId}${
          activeLocation
            ? `&lat=${activeLocation.lat}&lng=${activeLocation.lng}&radius=20`
            : ""
        }`;
        const data = await fetch(url).then((r) => r.json());
        if (data.pharmacies) {
          setPharmacies(data.pharmacies);
        }
        setShowReportModal(false);
        setSelectedPharmacy(null);
      } else {
        const data = await response.json();
        alert(data.error || "Erreur lors du signalement");
      }
    } catch (err) {
      alert("Erreur lors du signalement");
    }
  };

  const handleVerify = async (reportId: string) => {
    try {
      await fetch("/api/pharmacies/report", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });
      // Rafraîchir
      const url = `/api/pharmacies/nearby?medicationId=${medicationId}${
        activeLocation
          ? `&lat=${activeLocation.lat}&lng=${activeLocation.lng}&radius=20`
          : ""
      }`;
      const data = await fetch(url).then((r) => r.json());
      if (data.pharmacies) {
        setPharmacies(data.pharmacies);
      }
    } catch (err) {
      console.error("Verify error:", err);
    }
  };

  const handleCitySelect = (city: { lat: number; lng: number; name: string }) => {
    setCityLocation(city);
  };

  const handleCityClear = () => {
    setCityLocation(null);
  };

  const openInMaps = (pharmacy: Pharmacy) => {
    const address = encodeURIComponent(
      `${pharmacy.address}, ${pharmacy.postalCode} ${pharmacy.city}`
    );
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Store className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-gray-900">
            Pharmacies avec disponibilité
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Store className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-gray-900">
            Pharmacies proches
          </h3>
        </div>
        {activeLocation && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            {locationMode === "geolocation" ? (
              <>
                <Navigation className="w-3 h-3" />
                Position activée
              </>
            ) : (
              <>
                <MapPin className="w-3 h-3" />
                {cityLocation?.name}
              </>
            )}
          </span>
        )}
      </div>

      {/* Toggle entre géolocalisation et recherche de ville */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setLocationMode("geolocation")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            locationMode === "geolocation"
              ? "bg-teal-100 text-teal-700 border border-teal-200"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Locate className="w-4 h-4" />
          Ma position
        </button>
        <button
          onClick={() => setLocationMode("city")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            locationMode === "city"
              ? "bg-teal-100 text-teal-700 border border-teal-200"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Search className="w-4 h-4" />
          Rechercher une ville
        </button>
      </div>

      {/* Recherche de ville si mode city */}
      {locationMode === "city" && (
        <div className="mb-4">
          <CitySearch
            onCitySelect={handleCitySelect}
            onClear={handleCityClear}
            placeholder="Entrez le nom d'une ville..."
          />
        </div>
      )}

      {/* Message si géolocalisation non disponible */}
      {locationMode === "geolocation" && geoError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800">
          <p>
            La géolocalisation n&apos;est pas disponible. Utilisez la recherche de ville pour trouver des pharmacies.
          </p>
        </div>
      )}

      {/* Message si aucune position sélectionnée */}
      {locationMode === "city" && !cityLocation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
          <p>
            Recherchez une ville pour voir les pharmacies proches.
          </p>
        </div>
      )}

      {pharmacies.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Store className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Aucune pharmacie trouvée dans votre zone</p>
          <p className="text-sm mt-1">
            Soyez le premier à signaler une disponibilité !
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pharmacies.slice(0, 5).map((pharmacy) => (
            <div
              key={pharmacy.id}
              className={`border rounded-xl p-4 transition-all ${
                pharmacy.availability
                  ? "border-emerald-200 bg-emerald-50/50"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">
                      {pharmacy.name}
                    </h4>
                    {pharmacy.isOnDuty && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                        De garde
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {pharmacy.address}, {pharmacy.postalCode} {pharmacy.city}
                  </p>
                  {pharmacy.distance !== null && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {pharmacy.distance} km
                    </p>
                  )}
                </div>

                {/* Statut de disponibilité */}
                <div className="flex flex-col items-end gap-2">
                  {pharmacy.availability ? (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700">
                        Disponible
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Non confirmé</span>
                  )}
                </div>
              </div>

              {/* Détails de disponibilité */}
              {pharmacy.availability && (
                <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Signalé{" "}
                      {new Date(
                        pharmacy.availability.reportedAt
                      ).toLocaleDateString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {pharmacy.availability.verifiedBy > 0 && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <ThumbsUp className="w-3 h-3" />
                        {pharmacy.availability.verifiedBy} confirmation
                        {pharmacy.availability.verifiedBy > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-3 flex items-center gap-2">
                {pharmacy.phone && (
                  <a
                    href={`tel:${pharmacy.phone}`}
                    className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                    Appeler
                  </a>
                )}
                <button
                  onClick={() => openInMaps(pharmacy)}
                  className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Navigation className="w-3 h-3" />
                  Itinéraire
                </button>
                <button
                  onClick={() => {
                    setSelectedPharmacy(pharmacy);
                    setShowReportModal(true);
                  }}
                  className="flex items-center gap-1.5 text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg transition-colors ml-auto"
                >
                  <Plus className="w-3 h-3" />
                  Signaler
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de signalement */}
      {showReportModal && selectedPharmacy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="font-semibold text-lg mb-2">
              Signaler la disponibilité
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-medium">{medicationName}</span> à{" "}
              <span className="font-medium">{selectedPharmacy.name}</span>
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleReport(selectedPharmacy.id, "AVAILABLE")}
                className="w-full flex items-center gap-3 p-3 border border-emerald-200 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div className="text-left">
                  <p className="font-medium text-emerald-800">Disponible</p>
                  <p className="text-xs text-emerald-600">
                    Le médicament est en stock
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleReport(selectedPharmacy.id, "LIMITED")}
                className="w-full flex items-center gap-3 p-3 border border-amber-200 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors"
              >
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <div className="text-left">
                  <p className="font-medium text-amber-800">Stock limité</p>
                  <p className="text-xs text-amber-600">
                    Quelques unités disponibles
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleReport(selectedPharmacy.id, "UNAVAILABLE")}
                className="w-full flex items-center gap-3 p-3 border border-red-200 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
              >
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div className="text-left">
                  <p className="font-medium text-red-800">Indisponible</p>
                  <p className="text-xs text-red-600">
                    Le médicament n'est pas en stock
                  </p>
                </div>
              </button>
            </div>

            <button
              onClick={() => {
                setShowReportModal(false);
                setSelectedPharmacy(null);
              }}
              className="w-full mt-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
