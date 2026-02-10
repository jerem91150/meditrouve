'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

interface Contact {
  id: string;
  name: string;
  email: string;
  type: string;
  location: string | null;
  specialty: string | null;
  status: string;
  createdAt: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', search: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', type: 'OTHER', location: '', specialty: '', notes: '' });
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchContacts = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.type) params.set('type', filter.type);
    if (filter.search) params.set('search', filter.search);
    const res = await fetch(`/api/admin/outreach/contacts?${params}`);
    const data = await res.json();
    setContacts(data.contacts);
    setTotal(data.total);
    setLoading(false);
  };

  useEffect(() => { fetchContacts(); }, [filter.type]);

  const addContact = async () => {
    const res = await fetch('/api/admin/outreach/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowAdd(false);
      setForm({ name: '', email: '', type: 'OTHER', location: '', specialty: '', notes: '' });
      fetchContacts();
    }
  };

  const importCSV = async (file: File) => {
    setImporting(true);
    const text = await file.text();
    const res = await fetch('/api/admin/outreach/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: text,
    });
    const data = await res.json();
    alert(`Import: ${data.imported} ajoutés, ${data.skipped} ignorés sur ${data.total}`);
    setImporting(false);
    fetchContacts();
  };

  const deleteContact = async (id: string) => {
    if (!confirm('Supprimer ce contact ?')) return;
    await fetch('/api/admin/outreach/contacts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchContacts();
  };

  const typeEmoji: Record<string, string> = {
    PHARMACY: '🏥', ASSOCIATION: '🤝', PRESS: '📰', OTHER: '📋',
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin/outreach" className="text-blue-600 hover:underline text-sm">← Outreach</Link>
          </div>
          <h1 className="text-2xl font-bold">👥 Contacts ({total})</h1>
        </div>
        <div className="flex gap-3">
          <input type="file" ref={fileRef} accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && importCSV(e.target.files[0])} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            {importing ? '⏳ Import...' : '📥 Import CSV'}
          </button>
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            + Ajouter
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select value={filter.type} onChange={e => setFilter({ ...filter, type: e.target.value })} className="p-2 border rounded-lg">
          <option value="">Tous les types</option>
          <option value="PHARMACY">🏥 Pharmacies</option>
          <option value="ASSOCIATION">🤝 Associations</option>
          <option value="PRESS">📰 Presse</option>
          <option value="OTHER">📋 Autre</option>
        </select>
        <input
          placeholder="Rechercher..."
          value={filter.search}
          onChange={e => setFilter({ ...filter, search: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && fetchContacts()}
          className="p-2 border rounded-lg flex-1"
        />
        <button onClick={fetchContacts} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">🔍</button>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Ajouter un contact</h2>
            <div className="space-y-3">
              <input placeholder="Nom" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full p-3 border rounded-lg" />
              <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full p-3 border rounded-lg" />
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full p-3 border rounded-lg">
                <option value="PHARMACY">🏥 Pharmacie</option>
                <option value="ASSOCIATION">🤝 Association</option>
                <option value="PRESS">📰 Presse</option>
                <option value="OTHER">📋 Autre</option>
              </select>
              <input placeholder="Localisation (ville, département)" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full p-3 border rounded-lg" />
              <input placeholder="Spécialité / Pathologie" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} className="w-full p-3 border rounded-lg" />
              <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full p-3 border rounded-lg h-20" />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg hover:bg-gray-100">Annuler</button>
              <button onClick={addContact} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-gray-500">Type</th>
                <th className="text-left p-3 text-sm font-medium text-gray-500">Nom</th>
                <th className="text-left p-3 text-sm font-medium text-gray-500">Email</th>
                <th className="text-left p-3 text-sm font-medium text-gray-500">Localisation</th>
                <th className="text-left p-3 text-sm font-medium text-gray-500">Spécialité</th>
                <th className="text-left p-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map(c => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{typeEmoji[c.type] || '📋'}</td>
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 text-sm text-gray-500">{c.email}</td>
                  <td className="p-3 text-sm">{c.location || '—'}</td>
                  <td className="p-3 text-sm">{c.specialty || '—'}</td>
                  <td className="p-3">
                    <button onClick={() => deleteContact(c.id)} className="text-red-500 hover:text-red-700 text-sm">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
