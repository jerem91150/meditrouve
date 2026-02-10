'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Campaign {
  id: string;
  name: string;
  type: string;
  mode: string;
  status: string;
  createdAt: string;
  _count: { emails: number };
  stats: Record<string, number>;
}

export default function OutreachDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'PHARMACY', mode: 'SEMI_AUTO', subject: '', template: '' });

  useEffect(() => {
    fetch('/api/admin/outreach/campaigns')
      .then(r => r.json())
      .then(setCampaigns)
      .finally(() => setLoading(false));
  }, []);

  const createCampaign = async () => {
    const res = await fetch('/api/admin/outreach/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const c = await res.json();
      setCampaigns([c, ...campaigns]);
      setShowCreate(false);
      setForm({ name: '', type: 'PHARMACY', mode: 'SEMI_AUTO', subject: '', template: '' });
    }
  };

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    RUNNING: 'bg-blue-100 text-blue-700',
    PAUSED: 'bg-yellow-100 text-yellow-700',
    DONE: 'bg-green-100 text-green-700',
  };

  const typeEmoji: Record<string, string> = {
    PHARMACY: '🏥',
    ASSOCIATION: '🤝',
    PRESS: '📰',
    OTHER: '📋',
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">📧 Outreach</h1>
          <p className="text-gray-500 mt-1">Campagnes d&apos;emails personnalisés par IA</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/outreach/contacts"
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            👥 Contacts
          </Link>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + Nouvelle campagne
          </button>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Nouvelle campagne</h2>
            <div className="space-y-4">
              <input
                placeholder="Nom de la campagne"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full p-3 border rounded-lg"
              />
              <input
                placeholder="Objet du mail"
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                className="w-full p-3 border rounded-lg"
              />
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className="p-3 border rounded-lg"
                >
                  <option value="PHARMACY">🏥 Pharmacies</option>
                  <option value="ASSOCIATION">🤝 Associations</option>
                  <option value="PRESS">📰 Presse</option>
                  <option value="OTHER">📋 Autre</option>
                </select>
                <select
                  value={form.mode}
                  onChange={e => setForm({ ...form, mode: e.target.value })}
                  className="p-3 border rounded-lg"
                >
                  <option value="SEMI_AUTO">Semi-auto (revue manuelle)</option>
                  <option value="AUTO">Auto (envoi direct)</option>
                </select>
              </div>
              <textarea
                placeholder="Template de base (HTML ou Markdown)"
                value={form.template}
                onChange={e => setForm({ ...form, template: e.target.value })}
                className="w-full p-3 border rounded-lg h-48 font-mono text-sm"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg hover:bg-gray-100">
                Annuler
              </button>
              <button onClick={createCampaign} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns list */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl">
          <p className="text-gray-400 text-lg">Aucune campagne</p>
          <button onClick={() => setShowCreate(true)} className="mt-4 text-blue-600 hover:underline">
            Créer votre première campagne →
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map(c => (
            <Link
              key={c.id}
              href={`/admin/outreach/campaigns/${c.id}`}
              className="block border rounded-xl p-5 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{typeEmoji[c.type] || '📋'}</span>
                  <div>
                    <h3 className="font-semibold text-lg">{c.name}</h3>
                    <p className="text-sm text-gray-500">
                      {c.mode === 'AUTO' ? '⚡ Auto' : '👁️ Semi-auto'} · {c._count.emails} emails
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {c.stats.SENT && (
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">{c.stats.SENT}</span> envoyés
                    </div>
                  )}
                  {c.stats.OPENED && (
                    <div className="text-sm text-green-600">
                      <span className="font-medium">{c.stats.OPENED}</span> ouverts
                    </div>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[c.status]}`}>
                    {c.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
