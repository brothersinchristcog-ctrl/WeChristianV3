"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, deleteDoc, setDoc } from 'firebase/firestore';

const SERMON_CATEGORIES = [
  'Bible Study', "Women's Fasting Prayer", 'Second Saturday Prayer', 
  'Sunday Service', 'All-Night Prayer', 'Youth Meeting', 
  'Revival Meeting', 'Special Messages', 'Shorts', 'Testimonies',
];

export default function AdminSermonsPage() {
  const [sermons, setSermons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [churchId, setChurchId] = useState<string>('');
  
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [editingSermon, setEditingSermon] = useState<any>(null);
  const [filter, setFilter] = useState('All');
  
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // Form State
  const [form, setForm] = useState({
    titleEn: '', titleTe: '', pastor: '',
    date: new Date().toISOString().split('T')[0],
    ref: '', duration: '45 mins', youtubeId: '', description: '',
    status: 'Published'
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchSermons();
  }, []);

  const fetchSermons = async () => {
    setLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && userDoc.data().primaryChurchId) {
        const cid = userDoc.data().primaryChurchId;
        setChurchId(cid);

        const snap = await getDocs(collection(db, 'churches', cid, 'sermons'));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setSermons(data.sort((a: any, b: any) => (b.date || '').localeCompare(a.date || '')));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ev: any) => {
    setEditingSermon(ev);
    if (ev) {
      setForm({
        titleEn: ev.titleEn || ev.title || '',
        titleTe: ev.titleTe || ev.titleTelugu || '',
        pastor: ev.pastor || '',
        date: ev.date || new Date().toISOString().split('T')[0],
        ref: ev.scripture || ev.ref || '',
        duration: ev.duration || '45 mins',
        youtubeId: ev.youtubeId || '',
        description: ev.description || '',
        status: ev.status || 'Published'
      });
      setSelectedCategories(
        typeof ev.categories === 'string'
          ? ev.categories.split(';').filter(Boolean)
          : (ev.categories || [])
      );
    } else {
      setForm({
        titleEn: '', titleTe: '', pastor: '',
        date: new Date().toISOString().split('T')[0],
        ref: '', duration: '45 mins', youtubeId: '', description: '',
        status: 'Published'
      });
      setSelectedCategories([]);
    }
    setView('edit');
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleDelete = async (id: string) => {
    if (!churchId) return;
    if (!window.confirm("Are you sure you want to delete this sermon?")) return;
    try {
      await deleteDoc(doc(db, 'churches', churchId, 'sermons', id));
      setSermons(prev => prev.filter(e => e.id !== id));
      setMessage('Sermon deleted successfully.');
    } catch (e) {
      console.error(e);
      setMessage('Failed to delete sermon.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchId) return;
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        title: form.titleEn,
        titleTelugu: form.titleTe,
        pastor: form.pastor,
        date: form.date,
        scripture: form.ref,
        duration: form.duration,
        youtubeId: form.youtubeId,
        description: form.description,
        status: form.status,
        categories: selectedCategories,
        series: selectedCategories[0] || '', // Using first category as series for simple parity
        updatedAt: new Date().toISOString()
      };

      if (editingSermon?.id) {
        await setDoc(doc(db, 'churches', churchId, 'sermons', editingSermon.id), payload, { merge: true });
      } else {
        const newRef = doc(collection(db, 'churches', churchId, 'sermons'));
        await setDoc(newRef, { ...payload, id: newRef.id, createdAt: new Date().toISOString() });
      }

      await fetchSermons();
      setView('list');
      setMessage('Sermon saved successfully.');
    } catch (e) {
      console.error(e);
      setMessage('Failed to save sermon.');
    } finally {
      setSaving(false);
    }
  };

  const stats = {
    published: sermons.filter(s => s.status === 'Published').length,
    drafts: sermons.filter(s => s.status === 'Draft').length,
    series: [...new Set(sermons.map(s => s.series).filter(Boolean))].length
  };

  const seriesList = ['All', ...Array.from(new Set(sermons.map(s => s.series).filter(Boolean)))];
  const filteredSermons = filter === 'All' ? sermons : sermons.filter(s => s.series === filter);

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
                <div className="flex items-center text-white/50 mb-2">
                  <span className="text-sm font-bold">Sermons</span>
                </div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Sermons</h1>
                <p className="text-ink-soft text-base mt-2">{sermons.length} total • {stats.series} series</p>
              </div>
              <button onClick={() => handleEdit(null)} className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg">
                <span className="text-ink font-bold">+ New</span>
              </button>
            </div>
          </div>

          <div className="p-4 space-y-6">
            {/* Stats Row */}
            <div className="flex gap-4">
              <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-rule/30">
                <div className="text-2xl font-bold text-[#2E6B4F]">{stats.published}</div>
                <div className="text-xs font-bold text-gray-500 mt-1 uppercase">Published</div>
              </div>
              <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-rule/30">
                <div className="text-2xl font-bold text-[#C9A84C]">{stats.drafts}</div>
                <div className="text-xs font-bold text-gray-500 mt-1 uppercase">Drafts</div>
              </div>
              <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-rule/30">
                <div className="text-2xl font-bold text-ink">{stats.series}</div>
                <div className="text-xs font-bold text-gray-500 mt-1 uppercase">Series</div>
              </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {seriesList.map((s: any) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-colors ${filter === s ? 'bg-ink text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Sermon List */}
            <div className="space-y-4">
              {filteredSermons.map(ev => (
                <div key={ev.id} className="bg-white rounded-2xl shadow-sm border border-rule/50 flex flex-col sm:flex-row overflow-hidden">
                  <div className="w-full sm:w-48 h-32 bg-gray-200 relative shrink-0">
                    {ev.youtubeId ? (
                      <img src={`https://img.youtube.com/vi/${ev.youtubeId}/hqdefault.jpg`} alt="Thumbnail" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Video</div>
                    )}
                    <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-[10px] text-white font-bold">
                      {ev.duration || '45 mins'}
                    </div>
                  </div>
                  
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-gold-deep uppercase">{ev.date}</span>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${ev.status === 'Published' ? 'bg-[#15803d]/10 text-[#15803d]' : 'bg-gray-100 text-gray-500'}`}>
                          {ev.status || 'Draft'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-ink leading-tight mb-1">{ev.title || 'Untitled'}</h3>
                      <p className="text-sm text-gray-500 font-medium">By {ev.pastor || 'Pastor'} • {ev.scripture}</p>
                    </div>

                    <div className="flex gap-2 pt-4 mt-2 border-t border-gray-100 justify-end">
                      <button onClick={() => handleEdit(ev)} className="px-4 py-1.5 bg-parchment hover:bg-gold-light text-ink rounded-lg font-bold text-sm transition-colors">Edit</button>
                      <button onClick={() => handleDelete(ev.id)} className="px-4 py-1.5 bg-red-50 hover:bg-red-100 text-clay rounded-lg font-bold text-sm transition-colors">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredSermons.length === 0 && (
                <div className="text-center py-12 text-gray-500 font-medium">No sermons found.</div>
              )}
            </div>
          </div>
        </>
      ) : (
        <form onSubmit={handleSave} className="flex flex-col min-h-screen bg-white">
          <div className="bg-ink p-4 flex justify-between items-center sticky top-0 z-10">
            <button type="button" onClick={() => setView('list')} className="text-white flex items-center">
              <span className="text-2xl mr-2">←</span> Back
            </button>
            <h2 className="text-lg font-bold text-white">{editingSermon?.id ? 'Edit Sermon' : 'New Sermon'}</h2>
            <div className="w-16"></div>
          </div>

          <div className="p-4 space-y-6 flex-1 bg-gray-50">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="text-sm font-bold text-ink mb-4 border-b border-gray-100 pb-2">Basic Info</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Title (English)</label>
                  <input type="text" required value={form.titleEn} onChange={e => setForm({...form, titleEn: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg text-ink focus:border-ink outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Title (Telugu)</label>
                  <input type="text" value={form.titleTe} onChange={e => setForm({...form, titleTe: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg text-ink focus:border-ink outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Speaker / Pastor</label>
                  <input type="text" value={form.pastor} onChange={e => setForm({...form, pastor: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg text-ink focus:border-ink outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Description</label>
                  <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg text-ink focus:border-ink outline-none resize-none"></textarea>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="text-sm font-bold text-ink mb-4 border-b border-gray-100 pb-2">Media & Date</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase mb-1">YouTube Video ID</label>
                  <input type="text" placeholder="e.g. dQw4w9WgXcQ" value={form.youtubeId} onChange={e => setForm({...form, youtubeId: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg text-ink focus:border-ink outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Date</label>
                  <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg text-ink focus:border-ink outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Scripture Reference</label>
                  <input type="text" value={form.ref} onChange={e => setForm({...form, ref: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg text-ink focus:border-ink outline-none" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="text-sm font-bold text-ink mb-4 border-b border-gray-100 pb-2">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {SERMON_CATEGORIES.map(cat => (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${selectedCategories.includes(cat) ? 'bg-ink text-white border-ink' : 'bg-white text-gray-600 border-gray-300'}`}
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
                    <option value="Scheduled">Scheduled</option>
                    <option value="Published">Published</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border-t border-gray-200">
            <button type="submit" disabled={saving} className="w-full bg-ink text-white font-bold py-4 rounded-xl">
              {saving ? 'Saving...' : 'Save Sermon'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
