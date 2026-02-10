'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Email {
  id: string;
  subject: string;
  body: string;
  status: string;
  sentAt: string | null;
  openedAt: string | null;
  contact: { name: string; email: string; type: string; location: string | null };
}

interface Stats {
  total: number;
  draft: number;
  approved: number;
  sent: number;
  opened: number;
  replied: number;
  openRate: string;
  replyRate: string;
}

interface Campaign {
  id: string;
  name: string;
  type: string;
  mode: string;
  status: string;
}

export default function CampaignDetail() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState<Email | null>(null);
  const [editBody, setEditBody] = useState('');
  const [editSubject, setEditSubject] = useState('');

  const fetchData = async () => {
    const [statsRes, emailsRes] = await Promise.all([
      fetch(`/api/admin/outreach/campaigns/${id}/stats`),
      fetch(`/api/admin/outreach/campaigns?id=${id}`),
    ]);
    const statsData = await statsRes.json();
    setCampaign(statsData.campaign);
    setStats(statsData.stats);

    // Fetch emails via a custom endpoint or inline
    const campaignsData = await emailsRes.json();
    // We need emails - let's fetch them separately
    const emailsFetch = await fetch(`/api/admin/outreach/campaigns/${id}/stats`);
    const ed = await emailsFetch.json();
    setCampaign(ed.campaign);
    setStats(ed.stats);
    setLoading(false);
  };

  const fetchEmails = async () => {
    // Use contacts endpoint with campaign filter - we'll add this
    const res = await fetch(`/api/admin/outreach/campaigns/${id}/emails`);
    if (res.ok) {
      const data = await res.json();
      setEmails(data);
    }
  };

  useEffect(() => {
    fetchData();
    fetchEmails();
  }, [id]);

  const generate = async () => {
    setGenerating(true);
    const res = await fetch(`/api/admin/outreach/campaigns/${id}/generate`, { method: 'POST' });
    const data = await res.json();
    alert(`${data.generated} emails générés par IA`);
    setGenerating(false);
    fetchEmails();
    fetchData();
  };

  const sendAll = async () => {
    if (!confirm('Envoyer tous les emails approuvés ?')) return;
    setSending(true);
    const res = await fetch(`/api/admin/outreach/campaigns/${id}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    alert(`${data.sent} envoyés, ${data.failed} échoués`);
    setSending(false);
    fetchEmails();
    fetchData();
  };

  const sendOne = async (emailId: string) => {
    const res = await fetch(`/api/admin/outreach/campaigns/${id}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailId }),
    });
    await res.json();
    fetchEmails();
    fetchData();
  };

  const approveEmail = async (emailId: string, action: 'approve' | 'reject') => {
    await fetch(`/api/admin/outreach/emails/${emailId}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    fetchEmails();
    fetchData();
  };

  const saveEdit = async (emailId: string) => {
    await fetch(`/api/admin/outreach/emails/${emailId}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'edit', subject: editSubject, body: editBody }),
    });
    setPreview(null);
    fetchEmails();
  };

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-600',
      APPROVED: 'bg-blue-100 text-blue-600',
      SENT: 'bg-green-100 text-green-600',
      OPENED: 'bg-emerald-100 text-emerald-600',
      REPLIED: 'bg-purple-100 text-purple-600',
      REJECTED: 'bg-red-100 text-red-600',
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[s] || ''}`}>{s}</span>;
  };

  if (loading) return <div className="text-center py-12">Chargement...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Link href="/admin/outreach" className="text-blue-600 hover:underline text-sm">← Campagnes</Link>

      <div className="flex items-center justify-between mt-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{campaign?.name}</h1>
          <p className="text-gray-500 text-sm">
            {campaign?.type} · {campaign?.mode === 'AUTO' ? '⚡ Auto' : '👁️ Semi-auto'} · {campaign?.status}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={generate}
            disabled={generating}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {generating ? '🤖 Génération IA...' : '🤖 Générer les emails'}
          </button>
          <button
            onClick={sendAll}
            disabled={sending}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {sending ? '📤 Envoi...' : '📤 Envoyer les approuvés'}
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
            <div className="text-xs text-gray-500">Brouillons</div>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.approved}</div>
            <div className="text-xs text-gray-500">Approuvés</div>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
            <div className="text-xs text-gray-500">Envoyés</div>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats.openRate}%</div>
            <div className="text-xs text-gray-500">Taux ouverture</div>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.replyRate}%</div>
            <div className="text-xs text-gray-500">Taux réponse</div>
          </div>
        </div>
      )}

      {/* Emails list */}
      <div className="space-y-3">
        {emails.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-xl text-gray-400">
            <p className="text-lg">Aucun email généré</p>
            <p className="text-sm mt-2">Cliquez sur &quot;Générer les emails&quot; pour commencer</p>
          </div>
        ) : (
          emails.map(e => (
            <div key={e.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{e.contact.name}</span>
                    <span className="text-gray-400 text-sm">{e.contact.email}</span>
                    {statusBadge(e.status)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">📧 {e.subject}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setPreview(e); setEditBody(e.body); setEditSubject(e.subject); }}
                    className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                  >
                    👁️ Preview
                  </button>
                  {e.status === 'DRAFT' && (
                    <>
                      <button onClick={() => approveEmail(e.id, 'approve')} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                        ✅ Approuver
                      </button>
                      <button onClick={() => approveEmail(e.id, 'reject')} className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200">
                        ❌ Rejeter
                      </button>
                    </>
                  )}
                  {e.status === 'APPROVED' && (
                    <button onClick={() => sendOne(e.id)} className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200">
                      📤 Envoyer
                    </button>
                  )}
                  {e.sentAt && <span className="text-xs text-gray-400">Envoyé {new Date(e.sentAt).toLocaleDateString('fr-FR')}</span>}
                  {e.openedAt && <span className="text-xs text-green-600">📬 Ouvert</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold">Preview: {preview.contact.name}</h3>
                <input
                  value={editSubject}
                  onChange={e => setEditSubject(e.target.value)}
                  className="mt-1 w-full p-2 border rounded text-sm"
                />
              </div>
              <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-4">
              <div className="border rounded-lg p-4 mb-4" dangerouslySetInnerHTML={{ __html: editBody }} />
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-gray-500">Modifier le HTML</summary>
                <textarea
                  value={editBody}
                  onChange={e => setEditBody(e.target.value)}
                  className="w-full h-64 p-3 border rounded-lg font-mono text-xs mt-2"
                />
              </details>
              <div className="flex justify-end gap-3">
                <button onClick={() => setPreview(null)} className="px-4 py-2 rounded-lg hover:bg-gray-100">Fermer</button>
                <button
                  onClick={() => saveEdit(preview.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  💾 Sauvegarder
                </button>
                <button
                  onClick={() => { saveEdit(preview.id).then(() => approveEmail(preview.id, 'approve')); }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  ✅ Sauvegarder & Approuver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
