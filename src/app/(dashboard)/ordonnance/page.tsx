"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  Upload,
  FileText,
  Pill,
  Check,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  ArrowRight
} from "lucide-react";

interface ExtractedMedication {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  matched?: boolean;
  medicationId?: string;
  status?: "AVAILABLE" | "TENSION" | "RUPTURE" | "UNKNOWN";
}

interface Ordonnance {
  id: string;
  imageUrl: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  extractedMedications: ExtractedMedication[];
  doctorName?: string;
  prescriptionDate?: string;
  createdAt: string;
}

export default function OrdonnancePage() {
  const { data: session, status } = useSession();
  const [ordonnances, setOrdonnances] = useState<Ordonnance[]>([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [currentOrdonnance, setCurrentOrdonnance] = useState<Ordonnance | null>(null);
  const [selectedMedications, setSelectedMedications] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (status === "unauthenticated") {
    redirect("/login");
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image");
      return;
    }

    setUploading(true);

    try {
      // Upload de l'image
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Erreur upload");
      }

      const { url } = await uploadRes.json();

      // Créer l'ordonnance et lancer l'OCR
      setProcessing(true);
      const ocrRes = await fetch("/api/ocr/ordonnance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      });

      if (!ocrRes.ok) {
        throw new Error("Erreur OCR");
      }

      const ordonnance = await ocrRes.json();
      setCurrentOrdonnance(ordonnance);
      setOrdonnances(prev => [ordonnance, ...prev]);
    } catch (error) {
      console.error("Erreur traitement ordonnance:", error);
      alert("Erreur lors du traitement de l'ordonnance");
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const toggleMedication = (name: string) => {
    const newSelected = new Set(selectedMedications);
    if (newSelected.has(name)) {
      newSelected.delete(name);
    } else {
      newSelected.add(name);
    }
    setSelectedMedications(newSelected);
  };

  const addSelectedMedications = async () => {
    if (!currentOrdonnance || selectedMedications.size === 0) return;

    try {
      const medicationsToAdd = currentOrdonnance.extractedMedications
        .filter(m => selectedMedications.has(m.name) && m.medicationId);

      const res = await fetch("/api/medications/bulk-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medications: medicationsToAdd.map(m => ({
            medicationId: m.medicationId,
            dosage: m.dosage,
            frequency: m.frequency,
          })),
        }),
      });

      if (res.ok) {
        alert(`${medicationsToAdd.length} médicament(s) ajouté(s) à votre suivi`);
        setSelectedMedications(new Set());
        setCurrentOrdonnance(null);
      }
    } catch (error) {
      console.error("Erreur ajout médicaments:", error);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-100 text-green-800";
      case "TENSION":
        return "bg-orange-100 text-orange-800";
      case "RUPTURE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status?: string) => {
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
        <h1 className="text-3xl font-bold text-gray-900">Scanner une ordonnance</h1>
        <p className="text-gray-600 mt-1">
          Prenez en photo votre ordonnance pour ajouter automatiquement vos médicaments
        </p>
      </div>

      {/* Zone d'upload */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!currentOrdonnance ? (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading || processing ? (
                <div className="space-y-4">
                  <Loader2 className="h-12 w-12 mx-auto text-blue-600 animate-spin" />
                  <p className="text-gray-600">
                    {uploading ? "Upload en cours..." : "Analyse de l'ordonnance..."}
                  </p>
                  <p className="text-sm text-gray-500">
                    L'IA extrait les médicaments de votre ordonnance
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center gap-4">
                    <div className="p-4 bg-blue-100 rounded-full">
                      <Camera className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="p-4 bg-purple-100 rounded-full">
                      <Upload className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Photographiez ou importez votre ordonnance
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Formats acceptés : JPG, PNG, HEIC
                    </p>
                  </div>
                  <Button className="mt-4">
                    <Camera className="h-4 w-4 mr-2" />
                    Prendre une photo
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Résultat OCR */}
              <div className="flex items-start gap-4">
                <div className="w-32 h-40 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={currentOrdonnance.imageUrl}
                    alt="Ordonnance"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold">Ordonnance analysée</h3>
                    <Badge className="bg-green-500">
                      <Check className="h-3 w-3 mr-1" />
                      Traitée
                    </Badge>
                  </div>
                  {currentOrdonnance.doctorName && (
                    <p className="text-sm text-gray-600">
                      Dr. {currentOrdonnance.doctorName}
                    </p>
                  )}
                  {currentOrdonnance.prescriptionDate && (
                    <p className="text-sm text-gray-500">
                      Prescrit le {new Date(currentOrdonnance.prescriptionDate).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mt-2">
                    {currentOrdonnance.extractedMedications.length} médicament(s) détecté(s)
                  </p>
                </div>
              </div>

              {/* Liste des médicaments extraits */}
              <div>
                <h4 className="font-medium mb-3">Médicaments détectés</h4>
                <div className="space-y-2">
                  {currentOrdonnance.extractedMedications.map((med, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedMedications.has(med.name)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => toggleMedication(med.name)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedMedications.has(med.name)
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                          }`}
                        >
                          {selectedMedications.has(med.name) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Pill className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{med.name}</span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {[med.dosage, med.frequency, med.duration]
                              .filter(Boolean)
                              .join(" • ")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {med.matched ? (
                          <Badge className={getStatusColor(med.status)}>
                            {getStatusText(med.status)}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Non trouvé
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={addSelectedMedications}
                  disabled={selectedMedications.size === 0}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter {selectedMedications.size} médicament(s)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentOrdonnance(null)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comment ça marche ?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Camera className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium mb-1">1. Photographiez</h4>
              <p className="text-sm text-gray-600">
                Prenez en photo votre ordonnance bien lisible
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-medium mb-1">2. Analyse IA</h4>
              <p className="text-sm text-gray-600">
                Notre IA extrait automatiquement les médicaments
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-medium mb-1">3. Ajoutez</h4>
              <p className="text-sm text-gray-600">
                Sélectionnez et ajoutez les médicaments à suivre
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historique des ordonnances */}
      {ordonnances.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Ordonnances récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ordonnances.slice(0, 5).map((ord) => (
                <div
                  key={ord.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                  onClick={() => setCurrentOrdonnance(ord)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-12 bg-gray-100 rounded overflow-hidden">
                      <img
                        src={ord.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium">
                        {ord.doctorName ? `Dr. ${ord.doctorName}` : "Ordonnance"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(ord.createdAt).toLocaleDateString("fr-FR")} • {ord.extractedMedications.length} médicament(s)
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
