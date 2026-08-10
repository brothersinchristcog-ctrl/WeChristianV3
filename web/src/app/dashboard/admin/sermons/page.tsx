"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, deleteDoc, setDoc } from 'firebase/firestore';

export default function AdminSermonsPage() {
  const [sermons, setSermons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [churchId, setChurchId] = useState<string>('');
  
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [editingSermon, setEditingSermon] = useState<any>(null);
  
  const [message, setMessage] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [pastor, setPastor] = useState('');
  const [date, setDate] = useState('');
  const [youtubeId, setYoutubeId] = useState('');
  const [series, setSeries] = useState('');
  const [status, setStatus] = useState('Published');
  const [saving, setSaving] = useState(false);

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

        const sermonsSnap = await getDocs(collection(db, 'churches', cid, 'sermons'));
        const sermonsData = sermonsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        
        // Sort by date descending
        sermonsData.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        setSermons(sermonsData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (sermon: any) => {
    setEditingSermon(sermon);
    if (sermon) {
      setTitle(sermon.title || '');
      setPastor(sermon.pastor || '');
      setDate(sermon.date || '');
      setYoutubeId(sermon.youtubeId || '');
      setSeries(sermon.series || '');
      setStatus(sermon.status || 'Published');
    } else {
      setTitle('');
      setPastor('');
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setYoutubeId('');
      setSeries('');
      setStatus('Published');
    }
    setView('edit');
  };

  const handleDelete = async (id: string) => {
    if (!churchId) return;
    if (!window.confirm("Are you sure you want to delete this sermon?")) return;
    try {
      await deleteDoc(doc(db, 'churches', churchId, 'sermons', id));
      setSermons(prev => prev.filter(s => s.id !== id));
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
        title,
        pastor,
        date,
        youtubeId,
        series,
        status,
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

  if (loading && view === 'list') {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      {message && (
        <div className="p-4 rounded-xl text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 flex justify-between items-center">
          {message}
          <button onClick={() => setMessage('')} className="text-blue-500 hover:text-blue-700">&times;</button>
        </div>
      )}

      {view === 'list' ? (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sermons Management</h1>
              <p className="text-gray-500 text-sm mt-1">{sermons.length} total sermons</p>
            </div>
            <button onClick={() => handleEdit(null)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow-sm transition-colors flex items-center gap-2">
              <span>+</span> New Sermon
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {sermons.map(sermon => (
              <div key={sermon.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col md:flex-row gap-4 items-center transition-all hover:shadow-md">
                <div className="w-full md:w-48 h-32 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 relative">
                  {sermon.youtubeId ? (
                    <img src={`https://img.youtube.com/vi/${sermon.youtubeId}/hqdefault.jpg`} alt="thumbnail" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 font-bold">NO VIDEO</div>
                  )}
                  {sermon.status === 'Draft' && (
                    <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">DRAFT</div>
                  )}
                </div>
                
                <div className="flex-1 w-full text-left">
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{sermon.title || 'Untitled Sermon'}</h3>
                  <div className="mt-2 space-y-1 text-sm font-medium text-gray-600">
                    <p>👤 {sermon.pastor || 'No Pastor'}</p>
                    <p>📅 {sermon.date || 'No Date'}</p>
                    {sermon.series && <p>📚 Series: <span className="font-bold text-gray-900">{sermon.series}</span></p>}
                  </div>
                </div>
                
                <div className="flex w-full md:w-auto md:flex-col gap-2 shrink-0">
                  <button onClick={() => handleEdit(sermon)} className="flex-1 md:flex-none px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-bold text-sm transition-colors">Edit</button>
                  <button onClick={() => handleDelete(sermon.id)} className="flex-1 md:flex-none px-6 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold text-sm transition-colors">Delete</button>
                </div>
              </div>
            ))}
            {sermons.length === 0 && (
              <div className="py-12 text-center bg-white rounded-2xl border border-gray-100 text-gray-500 font-medium">
                No sermons found.
              </div>
            )}
          </div>
        </>
      ) : (
        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
          <div className="flex items-center justify-between mb-8 pb-4 border-b">
            <h2 className="text-2xl font-bold text-gray-900">{editingSermon ? 'Edit Sermon' : 'Add New Sermon'}</h2>
            <button type="button" onClick={() => setView('list')} className="text-gray-500 hover:text-gray-800 font-medium px-4 py-2 bg-gray-100 rounded-lg">Cancel</button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Sermon Title *</label>
              <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. The Power of Faith" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Pastor / Speaker *</label>
                <input required type="text" value={pastor} onChange={e => setPastor(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Pastor John Doe" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Date * (YYYY-MM-DD)</label>
                <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Sermon Series (Optional)</label>
              <input type="text" value={series} onChange={e => setSeries(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Book of Romans" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">YouTube Video ID (Optional)</label>
              <div className="flex gap-2">
                <input type="text" value={youtubeId} onChange={e => setYoutubeId(e.target.value)} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. dQw4w9WgXcQ" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Enter the 11-character video ID from the YouTube URL (e.g. for https://youtube.com/watch?v=dQw4w9WgXcQ, the ID is dQw4w9WgXcQ).</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Published">Published (Visible to everyone)</option>
                <option value="Draft">Draft (Hidden)</option>
              </select>
            </div>

            <div className="pt-6 border-t mt-8 flex justify-end">
              <button disabled={saving} type="submit" className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-sm transition-colors">
                {saving ? 'Saving...' : (editingSermon ? 'Save Changes' : 'Publish Sermon')}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
