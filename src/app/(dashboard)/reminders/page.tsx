"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Check,
  X,
  Bell,
  Plus,
  Calendar,
  Pill,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface Reminder {
  id: string;
  scheduledTime: string;
  status: "PENDING" | "SENT" | "TAKEN" | "SKIPPED" | "POSTPONED";
  medication: {
    id: string;
    name: string;
    dosage: string;
  };
  profile: {
    name: string;
  };
}

interface TodayStats {
  total: number;
  taken: number;
  pending: number;
  skipped: number;
}

export default function RemindersPage() {
  const { data: session, status } = useSession();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [todayStats, setTodayStats] = useState<TodayStats>({ total: 0, taken: 0, pending: 0, skipped: 0 });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  useEffect(() => {
    if (session) {
      fetchReminders();
    }
  }, [session, selectedDate]);

  const fetchReminders = async () => {
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const res = await fetch(`/api/reminders?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setReminders(data.reminders || []);
        setTodayStats(data.stats || { total: 0, taken: 0, pending: 0, skipped: 0 });
      }
    } catch (error) {
      console.error("Erreur chargement rappels:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReminderAction = async (reminderId: string, action: "take" | "skip" | "postpone") => {
    try {
      const res = await fetch(`/api/reminders/${reminderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        fetchReminders();
      }
    } catch (error) {
      console.error("Erreur action rappel:", error);
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusBadge = (status: Reminder["status"]) => {
    switch (status) {
      case "TAKEN":
        return <Badge className="bg-green-500">Pris</Badge>;
      case "SKIPPED":
        return <Badge className="bg-red-500">Ignoré</Badge>;
      case "POSTPONED":
        return <Badge className="bg-yellow-500">Reporté</Badge>;
      case "SENT":
        return <Badge className="bg-blue-500">Notifié</Badge>;
      default:
        return <Badge variant="outline">En attente</Badge>;
    }
  };

  const adherenceRate = todayStats.total > 0
    ? Math.round((todayStats.taken / todayStats.total) * 100)
    : 0;

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
          <h1 className="text-3xl font-bold text-gray-900">Rappels de prise</h1>
          <p className="text-gray-600 mt-1">Gérez vos prises de médicaments quotidiennes</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un rappel
        </Button>
      </div>

      {/* Navigation date */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center min-w-[200px]">
          <p className="font-semibold capitalize">{formatDate(selectedDate)}</p>
          {isToday && <Badge className="mt-1">Aujourd'hui</Badge>}
        </div>
        <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats du jour */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{todayStats.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{todayStats.taken}</p>
              <p className="text-sm text-gray-600">Pris</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{todayStats.pending}</p>
              <p className="text-sm text-gray-600">En attente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{adherenceRate}%</p>
              <p className="text-sm text-gray-600">Observance</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des rappels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Rappels du jour
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reminders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun rappel pour cette journée</p>
              <Button variant="link" className="mt-2">
                Configurer vos rappels
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    reminder.status === "TAKEN"
                      ? "bg-green-50 border-green-200"
                      : reminder.status === "SKIPPED"
                      ? "bg-red-50 border-red-200"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <Clock className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                      <p className="font-semibold">{formatTime(reminder.scheduledTime)}</p>
                    </div>
                    <div>
                      <p className="font-medium">{reminder.medication.name}</p>
                      <p className="text-sm text-gray-600">
                        {reminder.medication.dosage} • {reminder.profile.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(reminder.status)}
                    {(reminder.status === "PENDING" || reminder.status === "SENT") && (
                      <div className="flex gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:bg-green-50"
                          onClick={() => handleReminderAction(reminder.id, "take")}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleReminderAction(reminder.id, "skip")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReminderAction(reminder.id, "postpone")}
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historique d'observance */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Historique d'observance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center text-gray-500">
            <p>Graphique d'observance (7 derniers jours)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
