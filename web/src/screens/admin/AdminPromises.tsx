"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, doc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';

export default function AdminPromisesPage() {
  const [promises, setPromises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [editingPromise, setEditingPromise] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [churchId, setChurchId] = useState<string>('');

  // Form State matching mobile app exactly
  const [form, setForm] = useState({
    date: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(),
    enRef: '',
    enVerse: '',
    enNote: '',
    teVerse: '',
    teRef: '',
    ytUrl: '',
    videoTitle: '',
    duration: '',
    pastor: '',
    status: 'Scheduled',
    theme: '#1a2d5a',
    imageUrl: ''
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPromises();
  }, []);

  const fetchPromises = async () => {
    setLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && userDoc.data().primaryChurchId) {
        const cid = userDoc.data().primaryChurchId;
        setChurchId(cid);

        const snap = await getDocs(collection(db, 'churches', cid, 'promises'));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        setPromises(data.sort((a: any, b: any) => (b.date || '').localeCompare(a.date || '')));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p: any) => {
    setEditingPromise(p);
    if (p) {
      setForm({
        date: p.date || (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(),
        enVerse: p.verse?.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").trim() || '',
        enRef: p.verseReferenceEn?.startsWith('DP-') ? '' : (p.verseReferenceEn || p.verseReference || ''),
        teVerse: p.verseTelugu?.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").trim() || '',
        teRef: p.verseReferenceTe || '',
        enNote: p.devotionalNote?.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").trim() || '',
        ytUrl: p.youtubeId || '',
        videoTitle: p.videoTitle || '',
        duration: p.duration || '',
        pastor: p.pastor || '',
        status: p.status || 'Scheduled',
        theme: p.theme || '#1a2d5a',
        imageUrl: p.imageUrl || ''
      });
    } else {
      setForm({
        date: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(),
        enRef: '', enVerse: '', enNote: '', teVerse: '', teRef: '', ytUrl: '',
        videoTitle: '', duration: '', pastor: '', status: 'Scheduled', theme: '#1a2d5a', imageUrl: ''
      });
    }
    setView('edit');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this Daily Promise?")) return;
    try {
      await deleteDoc(doc(db, 'churches', churchId, 'promises', id));
      setMessage('Promise deleted.');
      fetchPromises();
    } catch (e) {
      console.error(e);
      setMessage('Failed to delete promise.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        date: form.date,
        verse: `<p>${form.enVerse}</p>`,
        verseReference: form.enRef,
        verseReferenceEn: form.enRef,
        verseTelugu: `<p>${form.teVerse}</p>`,
        verseReferenceTe: form.teRef,
        devotionalNote: form.enNote ? `<p>${form.enNote}</p>` : '',
        youtubeId: form.ytUrl,
        videoTitle: form.videoTitle,
        duration: form.duration,
        pastor: form.pastor,
        status: form.status,
        theme: form.theme,
        imageUrl: form.imageUrl,
        updatedAt: new Date().toISOString(),
      };

      const docId = editingPromise?.id || form.date; 
      await setDoc(doc(db, 'churches', churchId, 'promises', docId), { ...payload, id: docId, createdAt: editingPromise?.createdAt || new Date().toISOString() }, { merge: true });

      setMessage('Promise saved successfully.');
      setView('list');
      fetchPromises();
    } catch (e) {
      console.error(e);
      setMessage('Failed to save promise.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && view === 'list') {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ink"></div></div>;
  }

  const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
  
  const todayPromise = promises.find(p => p.date === todayStr);
  const upcoming = promises.filter(p => p.date && p.date > todayStr).sort((a,b) => (a.date || '').localeCompare(b.date || ''));
  const past = promises.filter(p => p.date && p.date < todayStr).sort((a,b) => (b.date || '').localeCompare(a.date || ''));

  const renderCard = (item: any, type: 'today' | 'upcoming' | 'past') => {
    let displayDate = item.date;
    if (item.date) {
      const parts = item.date.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        displayDate = `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      }
    }

    const verseTextEn = item.verse?.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").trim();

    return (
      <div key={item.id} className="bg-paper rounded-2xl border border-rule shadow-sm overflow-hidden mb-4">
        {/* vcBand */}
        <div className="flex justify-between items-center bg-parchment px-4 py-3 border-b border-rule">
          <div className="font-serif text-gold-deep font-bold text-base">{displayDate}</div>
          <div className="w-7 h-7 rounded-full bg-paper border border-rule flex items-center justify-center">
            {type === 'upcoming' ? (
              <span className="text-ink text-sm font-bold">+</span>
            ) : (
              <svg className="w-4 h-4 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            )}
          </div>
        </div>

        {/* vcBody */}
        <div className="p-4">
          <div className="flex flex-wrap items-center mb-3">
            {(item.verseReferenceEn || item.verseReference) && (
              <div className="bg-parchment px-2 py-1 rounded-md mr-2 mb-1 border border-rule">
                <span className="text-ink text-xs font-bold">{item.verseReferenceEn || item.verseReference}</span>
              </div>
            )}
            {item.verseReferenceTe && (
              <div className="bg-parchment px-2 py-1 rounded-md mr-2 mb-1 border border-rule">
                <span className="text-ink text-xs font-bold italic">{item.verseReferenceTe}</span>
              </div>
            )}
          </div>
          
          <p className="font-serif text-lg leading-7 text-ink mb-3">"{verseTextEn}"</p>
          
          <div className="flex justify-end border-t border-rule/50 pt-3 mt-2 space-x-3">
            <button onClick={() => handleEdit(item)} className="text-sm font-bold text-ink hover:text-ink-2">Edit</button>
            <button onClick={() => handleDelete(item.id)} className="text-sm font-bold text-clay hover:text-red-700">Delete</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto pb-12 bg-gray-50 min-h-screen">
      {/* Header exactly like mobile */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-ink">Daily Promises</h1>
        <button onClick={() => handleEdit(null)} className="w-10 h-10 bg-parchment rounded-full flex items-center justify-center border border-rule">
          <span className="text-ink text-xl font-bold">+</span>
        </button>
      </div>

      {view === 'list' ? (
        <div className="p-4">
          {todayPromise && (
            <div className="mb-6">
              <h2 className="text-xs font-bold text-ink-soft uppercase tracking-wider mb-2 ml-1">Today's Promise</h2>
              {renderCard(todayPromise, 'today')}
            </div>
          )}

          {upcoming.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-bold text-ink-soft uppercase tracking-wider mb-2 ml-1">Upcoming ({upcoming.length})</h2>
              {upcoming.map(p => renderCard(p, 'upcoming'))}
            </div>
          )}

          {past.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-bold text-ink-soft uppercase tracking-wider mb-2 ml-1">Archive ({past.length})</h2>
              {past.map(p => renderCard(p, 'past'))}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSave} className="p-4 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h2 className="text-lg font-bold text-ink">{editingPromise?.id ? 'Edit Promise' : 'New Promise'}</h2>
              <button type="button" onClick={() => setView('list')} className="text-gray-400 font-bold hover:text-ink">X</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink uppercase mb-1">Date</label>
                <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-ink focus:border-ink outline-none" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-ink uppercase mb-1">English Reference</label>
                <input type="text" placeholder="John 3:16" value={form.enRef} onChange={e => setForm({...form, enRef: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-ink focus:border-ink outline-none" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-ink uppercase mb-1">English Verse</label>
                <textarea rows={3} value={form.enVerse} onChange={e => setForm({...form, enVerse: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-ink focus:border-ink outline-none resize-none"></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase mb-1">Telugu Reference</label>
                <input type="text" placeholder="యోహాను 3:16" value={form.teRef} onChange={e => setForm({...form, teRef: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-ink focus:border-ink outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase mb-1">Telugu Verse</label>
                <textarea rows={3} value={form.teVerse} onChange={e => setForm({...form, teVerse: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-ink focus:border-ink outline-none resize-none"></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-ink focus:border-ink outline-none">
                  <option value="Draft">Draft</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Published">Published</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={saving} className="w-full mt-6 bg-ink text-white font-bold py-4 rounded-xl shadow-sm">
              {saving ? 'Saving...' : 'Save Promise'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
