"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, Bell, Check, Save } from "lucide-react";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  notifyEmail: boolean;
  notifySMS: boolean;
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    phone: "",
    notifyEmail: true,
    notifySMS: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/auth/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (res.ok) {
        setSaved(true);
        update({ name: profile.name });
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Mon profil</h1>
        <p className="text-gray-600 mt-1">
          Gerez vos informations personnelles et preferences de notification
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-teal-100">
              <User className="h-5 w-5 text-teal-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Informations personnelles</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Votre nom"
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="vous@exemple.com"
                  className="h-12 pl-12 rounded-xl"
                  disabled
                />
              </div>
              <p className="text-xs text-gray-400">L&apos;email ne peut pas etre modifie</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telephone (optionnel)</Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="06 12 34 56 78"
                  className="h-12 pl-12 rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-teal-100">
              <Bell className="h-5 w-5 text-teal-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Preferences de notification</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-teal-300 cursor-pointer transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-gray-100">
                  <Mail className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Notifications par email</p>
                  <p className="text-sm text-gray-500">Recevez les alertes par email</p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={profile.notifyEmail}
                  onChange={(e) => setProfile({ ...profile, notifyEmail: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </div>
            </label>

            <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-teal-300 cursor-pointer transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-gray-100">
                  <Phone className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Notifications SMS</p>
                  <p className="text-sm text-gray-500">Recevez les alertes par SMS</p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={profile.notifySMS}
                  onChange={(e) => setProfile({ ...profile, notifySMS: e.target.checked })}
                  className="sr-only peer"
                  disabled={!profile.phone}
                />
                <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600 ${!profile.phone ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
              </div>
            </label>
            {!profile.phone && (
              <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl">
                Ajoutez votre numero de telephone pour activer les notifications SMS
              </p>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-4">
          {saved && (
            <span className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
              <Check className="h-4 w-4" />
              Modifications enregistrees
            </span>
          )}
          <Button
            type="submit"
            disabled={saving}
            className="px-6 py-3 h-auto rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold"
          >
            {saving ? (
              "Enregistrement..."
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
