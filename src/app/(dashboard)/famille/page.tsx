"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Plus,
  UserPlus,
  Mail,
  Check,
  X,
  Trash2,
  Edit,
  Pill,
  AlertCircle,
  Heart,
  User,
  Baby,
  PersonStanding
} from "lucide-react";

interface Profile {
  id: string;
  name: string;
  relation: string;
  isPrimary: boolean;
  birthDate?: string;
  medicationsCount: number;
  alertsCount: number;
}

interface FamilyInvite {
  id: string;
  invitedEmail: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";
  role: string;
  createdAt: string;
}

const relationLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  self: { label: "Moi-même", icon: <User className="h-4 w-4" /> },
  parent: { label: "Parent", icon: <PersonStanding className="h-4 w-4" /> },
  child: { label: "Enfant", icon: <Baby className="h-4 w-4" /> },
  spouse: { label: "Conjoint(e)", icon: <Heart className="h-4 w-4" /> },
  other: { label: "Autre", icon: <Users className="h-4 w-4" /> },
};

export default function FamillePage() {
  const { data: session, status } = useSession();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [invites, setInvites] = useState<FamilyInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [newProfile, setNewProfile] = useState({ name: "", relation: "parent" });
  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  useEffect(() => {
    if (session) {
      fetchProfiles();
      fetchInvites();
    }
  }, [session]);

  const fetchProfiles = async () => {
    try {
      const res = await fetch("/api/profiles");
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
      }
    } catch (error) {
      console.error("Erreur chargement profils:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvites = async () => {
    try {
      const res = await fetch("/api/family/invites");
      if (res.ok) {
        const data = await res.json();
        setInvites(data);
      }
    } catch (error) {
      console.error("Erreur chargement invitations:", error);
    }
  };

  const handleAddProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProfile),
      });
      if (res.ok) {
        setNewProfile({ name: "", relation: "parent" });
        setShowAddProfile(false);
        fetchProfiles();
      }
    } catch (error) {
      console.error("Erreur création profil:", error);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/family/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      if (res.ok) {
        setInviteEmail("");
        setShowInvite(false);
        fetchInvites();
        alert("Invitation envoyée !");
      }
    } catch (error) {
      console.error("Erreur envoi invitation:", error);
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm("Supprimer ce profil et tous ses médicaments suivis ?")) return;
    try {
      const res = await fetch(`/api/profiles/${profileId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchProfiles();
      }
    } catch (error) {
      console.error("Erreur suppression profil:", error);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      const res = await fetch(`/api/family/invites/${inviteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchInvites();
      }
    } catch (error) {
      console.error("Erreur annulation invitation:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mode Famille</h1>
          <p className="text-gray-600 mt-1">
            Gérez les traitements de vos proches depuis un seul compte
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowInvite(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Inviter
          </Button>
          <Button onClick={() => setShowAddProfile(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un profil
          </Button>
        </div>
      </div>

      {/* Formulaire ajout profil */}
      {showAddProfile && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">Nouveau profil</CardTitle>
            <CardDescription>
              Créez un profil pour gérer les médicaments d'un proche
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddProfile} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Prénom</Label>
                  <Input
                    id="name"
                    value={newProfile.name}
                    onChange={(e) =>
                      setNewProfile({ ...newProfile, name: e.target.value })
                    }
                    placeholder="Ex: Maman, Papa, Marie..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="relation">Relation</Label>
                  <select
                    id="relation"
                    value={newProfile.relation}
                    onChange={(e) =>
                      setNewProfile({ ...newProfile, relation: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="parent">Parent</option>
                    <option value="child">Enfant</option>
                    <option value="spouse">Conjoint(e)</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Créer le profil</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddProfile(false)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Formulaire invitation */}
      {showInvite && (
        <Card className="mb-6 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-lg">Inviter un aidant</CardTitle>
            <CardDescription>
              Permettez à un proche de consulter et gérer les traitements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <Label htmlFor="email">Email de l'aidant</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="exemple@email.com"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer l'invitation
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowInvite(false)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Liste des profils */}
      <div className="grid gap-4">
        {profiles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-4">
                Aucun profil créé. Commencez par ajouter votre profil personnel.
              </p>
              <Button onClick={() => setShowAddProfile(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer mon profil
              </Button>
            </CardContent>
          </Card>
        ) : (
          profiles.map((profile) => (
            <Card
              key={profile.id}
              className={profile.isPrimary ? "border-blue-300" : ""}
            >
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      {relationLabels[profile.relation]?.icon || (
                        <User className="h-6 w-6 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{profile.name}</h3>
                        {profile.isPrimary && (
                          <Badge className="bg-blue-500">Principal</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {relationLabels[profile.relation]?.label || profile.relation}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Pill className="h-4 w-4" />
                        <span className="font-semibold">
                          {profile.medicationsCount}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Médicaments</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-orange-600">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-semibold">{profile.alertsCount}</span>
                      </div>
                      <p className="text-xs text-gray-500">Alertes</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!profile.isPrimary && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteProfile(profile.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Invitations en attente */}
      {invites.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Invitations envoyées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{invite.invitedEmail}</p>
                      <p className="text-sm text-gray-500">
                        Envoyée le{" "}
                        {new Date(invite.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {invite.status === "PENDING" && (
                      <>
                        <Badge variant="outline">En attente</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => handleCancelInvite(invite.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {invite.status === "ACCEPTED" && (
                      <Badge className="bg-green-500">
                        <Check className="h-3 w-3 mr-1" />
                        Acceptée
                      </Badge>
                    )}
                    {invite.status === "DECLINED" && (
                      <Badge variant="destructive">Refusée</Badge>
                    )}
                    {invite.status === "EXPIRED" && (
                      <Badge variant="secondary">Expirée</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Avantages du mode famille */}
      <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-lg">Avantages du mode Famille</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <h4 className="font-medium mb-1">Multi-profils</h4>
              <p className="text-sm text-gray-600">
                Gérez jusqu'à 5 profils (parents, enfants, conjoint)
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="h-5 w-5 text-purple-600" />
              </div>
              <h4 className="font-medium mb-1">Alertes partagées</h4>
              <p className="text-sm text-gray-600">
                Recevez les alertes de rupture pour tous vos proches
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <UserPlus className="h-5 w-5 text-green-600" />
              </div>
              <h4 className="font-medium mb-1">Invitez des aidants</h4>
              <p className="text-sm text-gray-600">
                Partagez la gestion avec d'autres membres de la famille
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
