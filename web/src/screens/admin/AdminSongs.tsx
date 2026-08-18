"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, deleteDoc, setDoc } from 'firebase/firestore';

const CATEGORIES = [
  'Stuthi Songs', 'Aradhana Songs', 'Offering Songs', 'Christmas Songs',
  'Easter Songs', 'Youth Songs', 'Gospel Songs', 'Marriage Songs',
  'Thanksgiving Songs', 'Special Songs', 'Other', 'Theme Songs'
];

const KEYS = [
  'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'Abm', 'Am', 'Bbm', 'Bm'
];

export default function AdminSongsPage() {
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [churchId, setChurchId] = useState<string>('');
  
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [editingSong, setEditingSong] = useState<any>(null);
  
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // Form State
  const [form, setForm] = useState({
    titleEn: '', titleTe: '', artist: '', lyrics: '',
    status: 'Published', categories: ['Stuthi Songs'], youtubeId: '', key: 'C'
  });

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    setLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && userDoc.data().primaryChurchId) {
        const cid = userDoc.data().primaryChurchId;
        setChurchId(cid);

        const snap = await getDocs(collection(db, 'churches', cid, 'worshipSongs'));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setSongs(data.sort((a: any, b: any) => (a.title || '').localeCompare(b.title || '')));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ev: any) => {
    setEditingSong(ev);
    if (ev) {
      setForm({
        titleEn: ev.title || '',
        titleTe: ev.titleTe || '',
        artist: ev.artist || '',
        lyrics: ev.lyrics || '',
        status: ev.status || 'Published',
        youtubeId: ev.youtubeId || '',
        key: ev.key || 'C',
        categories: ev.category ? ev.category.split(';').filter(Boolean) : ['Stuthi Songs']
      });
    } else {
      setForm({
        titleEn: '', titleTe: '', artist: '', lyrics: '',
        status: 'Published', categories: ['Stuthi Songs'], youtubeId: '', key: 'C'
      });
    }
    setView('edit');
  };

  const toggleCategory = (cat: string) => {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.includes(cat) 
        ? prev.categories.filter(c => c !== cat) 
        : [...prev.categories, cat]
    }));
  };

  const handleDelete = async (id: string) => {
    if (!churchId) return;
    if (!window.confirm("Are you sure you want to delete this song?")) return;
    try {
      await deleteDoc(doc(db, 'churches', churchId, 'worshipSongs', id));
      setSongs(prev => prev.filter(e => e.id !== id));
      setMessage('Song deleted successfully.');
    } catch (e) {
      console.error(e);
      setMessage('Failed to delete song.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchId) return;
    if (!form.titleEn.trim()) { alert('Title is required'); return; }
    if (!form.lyrics.trim()) { alert('Lyrics are required'); return; }

    setSaving(true);
    setMessage('');
    try {
      const payload = {
        title: form.titleEn,
        titleTe: form.titleTe,
        artist: form.artist,
        lyrics: form.lyrics,
        status: form.status,
        category: form.categories.join(';') || 'Other',
        youtubeId: form.youtubeId,
        key: form.key,
        updatedAt: new Date().toISOString()
      };

      if (editingSong?.id) {
        await setDoc(doc(db, 'churches', churchId, 'worshipSongs', editingSong.id), payload, { merge: true });
      } else {
        const newRef = doc(collection(db, 'churches', churchId, 'worshipSongs'));
        await setDoc(newRef, { ...payload, id: newRef.id, createdAt: new Date().toISOString() });
      }

      await fetchSongs();
      setView('list');
      setMessage('Song saved successfully.');
    } catch (e) {
      console.error(e);
      setMessage('Failed to save song.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && view === 'list') {
    return <div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink"></div></div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {view === 'list' ? (
        <>
          {/* Hero Section */}
          <div className="bg-ink px-6 py-10 pb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Worship Songs</h1>
                <p className="text-ink-soft text-base mt-2">{songs.length} total songs</p>
              </div>
              <button onClick={() => handleEdit(null)} className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg">
                <span className="text-ink font-bold">+ New</span>
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {songs.map(song => (
              <div key={song.id} className="bg-white rounded-2xl shadow-sm border border-rule/50 p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-2">
                    {song.category?.split(';').map((cat: string) => (
                      <span key={cat} className="bg-parchment px-2 py-1 rounded text-ink text-xs font-bold uppercase">{cat}</span>
                    ))}
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${song.status === 'Published' ? 'bg-[#15803d]/10 text-[#15803d]' : 'bg-gray-100 text-gray-500'}`}>
                    {song.status || 'Draft'}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-ink mb-1">{song.title}</h3>
                {song.titleTe && <p className="text-sm font-medium text-ink-soft mb-2">{song.titleTe}</p>}
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  {song.artist && <span>🎤 {song.artist}</span>}
                  {song.key && <span className="bg-gray-100 px-2 py-0.5 rounded font-bold text-gray-700">Key: {song.key}</span>}
                </div>

                <div className="flex gap-2 border-t border-gray-100 pt-3">
                  <button onClick={() => handleEdit(song)} className="flex-1 py-2 bg-parchment hover:bg-gold-light text-ink rounded-lg font-bold text-sm transition-colors text-center">Edit</button>
                  <button onClick={() => handleDelete(song.id)} className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-clay rounded-lg font-bold text-sm transition-colors text-center">Delete</button>
                </div>
              </div>
            ))}
            {songs.length === 0 && (
              <div className="text-center py-12 text-gray-500 font-medium">No songs found.</div>
            )}
          </div>
        </>
      ) : (
        <form onSubmit={handleSave} className="flex flex-col min-h-screen bg-white">
          <div className="bg-ink p-4 flex justify-between items-center sticky top-0 z-10">
            <button type="button" onClick={() => setView('list')} className="text-white flex items-center">
              <span className="text-2xl mr-2">←</span> Back
            </button>
            <h2 className="text-lg font-bold text-white">{editingSong?.id ? 'Edit Song' : 'New Song'}</h2>
            <div className="w-16"></div>
          </div>

          <div className="p-4 space-y-6 flex-1 bg-gray-50">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="text-sm font-bold text-ink mb-4 border-b border-gray-100 pb-2">Song Info</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Title (English) *</label>
                  <input type="text" required value={form.titleEn} onChange={e => setForm({...form, titleEn: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg text-ink focus:border-ink outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Title (Telugu)</label>
                  <input type="text" value={form.titleTe} onChange={e => setForm({...form, titleTe: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg text-ink focus:border-ink outline-none" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Artist / Writer</label>
                    <input type="text" value={form.artist} onChange={e => setForm({...form, artist: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg text-ink focus:border-ink outline-none" />
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Key</label>
                    <select value={form.key} onChange={e => setForm({...form, key: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg text-ink focus:border-ink outline-none bg-white">
                      {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase mb-1">YouTube Link / ID</label>
                  <input type="text" value={form.youtubeId} onChange={e => setForm({...form, youtubeId: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg text-ink focus:border-ink outline-none" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="text-sm font-bold text-ink mb-4 border-b border-gray-100 pb-2">Lyrics *</h3>
              <textarea 
                required 
                rows={12} 
                value={form.lyrics} 
                onChange={e => setForm({...form, lyrics: e.target.value})} 
                className="w-full p-4 border border-gray-300 rounded-lg text-ink focus:border-ink outline-none font-sans text-sm resize-y whitespace-pre-wrap"
                placeholder="Enter song lyrics here..."
              ></textarea>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="text-sm font-bold text-ink mb-4 border-b border-gray-100 pb-2">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${form.categories.includes(cat) ? 'bg-ink text-white border-ink' : 'bg-white text-gray-600 border-gray-300'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="text-sm font-bold text-ink mb-4 border-b border-gray-100 pb-2">Publishing</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg text-ink focus:border-ink outline-none bg-white">
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border-t border-gray-200">
            <button type="submit" disabled={saving} className="w-full bg-ink text-white font-bold py-4 rounded-xl">
              {saving ? 'Saving...' : 'Save Song'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
