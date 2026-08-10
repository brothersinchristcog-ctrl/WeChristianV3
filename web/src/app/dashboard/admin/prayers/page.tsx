"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';

export default function AdminPrayersPage() {
  const [prayers, setPrayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [churchId, setChurchId] = useState<string>('');
  
  const [message, setMessage] = useState('');
  const [view, setView] = useState<'pending' | 'processed' | 'new'>('pending');

  // Form State
  const [requestEn, setRequestEn] = useState('');
  const [requestTe, setRequestTe] = useState('');
  const [category, setCategory] = useState('Pray for me');
  const [postAs, setPostAs] = useState('Administrator');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPrayers();
  }, []);

  const fetchPrayers = async () => {
    setLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && userDoc.data().primaryChurchId) {
        const cid = userDoc.data().primaryChurchId;
        setChurchId(cid);

        // Optional: you can set postAs to user's name
        if (userDoc.data().name) {
          setPostAs(userDoc.data().name);
        }

        const prayersRef = collection(db, 'churches', cid, 'prayerRequests');
        const q = query(prayersRef, orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const pData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setPrayers(pData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!churchId) return;
    try {
      await setDoc(doc(db, 'churches', churchId, 'prayerRequests', id), { isAnswered: true, updatedAt: serverTimestamp() }, { merge: true });
      setMessage('Prayer request approved.');
      fetchPrayers();
    } catch (e) {
      console.error(e);
      setMessage('Failed to approve prayer request.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!churchId) return;
    if (!window.confirm("Are you sure you want to delete this prayer request?")) return;
    try {
      await deleteDoc(doc(db, 'churches', churchId, 'prayerRequests', id));
      setMessage('Prayer request deleted.');
      fetchPrayers();
    } catch (e) {
      console.error(e);
      setMessage('Failed to delete prayer request.');
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchId || !requestEn) return;
    setSaving(true);
    setMessage('');
    try {
      const newRef = doc(collection(db, 'churches', churchId, 'prayerRequests'));
      await setDoc(newRef, {
        id: newRef.id,
        name: postAs,
        requestEn,
        text: requestEn,
        requestTe,
        textTe: requestTe,
        category,
        isAnswered: true, // Automatically approved if posted by admin
        createdAt: serverTimestamp()
      });
      setMessage('Prayer request published successfully.');
      setRequestEn('');
      setRequestTe('');
      setView('processed');
      fetchPrayers();
    } catch (e) {
      console.error(e);
      setMessage('Failed to publish prayer request.');
    } finally {
      setSaving(false);
    }
  };

  const pendingPrayers = prayers.filter(p => !p.isAnswered);
  const processedPrayers = prayers.filter(p => p.isAnswered);

  const getTimeAgo = (rawDate: any) => {
    if (!rawDate) return 'Recently';
    const date = rawDate?.toDate ? rawDate.toDate() : new Date(rawDate);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
      {message && (
        <div className="p-4 rounded-xl text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 flex justify-between items-center">
          {message}
          <button onClick={() => setMessage('')} className="text-blue-500 hover:text-blue-700">&times;</button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prayer Wall Moderation</h1>
          <p className="text-gray-500 text-sm mt-1">{pendingPrayers.length} new requests · {processedPrayers.length} processed</p>
        </div>
        <button onClick={() => setView('new')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow-sm transition-colors flex items-center gap-2">
          <span>+</span> Post New Request
        </button>
      </div>

      <div className="flex gap-4">
        <button onClick={() => setView('pending')} className={`px-6 py-3 rounded-xl font-bold transition-all ${view === 'pending' ? 'bg-amber-50 border-2 border-amber-500 text-amber-800' : 'bg-white border-2 border-transparent text-gray-500 hover:bg-gray-50'}`}>
          <div className="text-2xl">{pendingPrayers.length}</div>
          <div className="text-xs uppercase tracking-wider">For Review</div>
        </button>
        <button onClick={() => setView('processed')} className={`px-6 py-3 rounded-xl font-bold transition-all ${view === 'processed' ? 'bg-green-50 border-2 border-green-600 text-green-800' : 'bg-white border-2 border-transparent text-gray-500 hover:bg-gray-50'}`}>
          <div className="text-2xl">{processedPrayers.length}</div>
          <div className="text-xs uppercase tracking-wider">Processed</div>
        </button>
      </div>

      {view === 'new' && (
        <form onSubmit={handlePublish} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6 border-b pb-4">
            <h2 className="text-xl font-bold text-gray-900">Post New Prayer Request</h2>
            <button type="button" onClick={() => setView('pending')} className="text-gray-500 hover:text-gray-700 font-medium px-4 py-2 bg-gray-100 rounded-lg">Cancel</button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Post as (Name)</label>
              <input required type="text" value={postAs} onChange={e => setPostAs(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <option>Pray for me</option>
                <option>Pray for my family</option>
                <option>Pray for healing</option>
                <option>Pray for peace and strength</option>
                <option>Other (if necessary)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Request text — English</label>
              <textarea required rows={4} value={requestEn} onChange={e => setRequestEn(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3" placeholder="Type the prayer request details..."></textarea>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Request text — Telugu (Optional)</label>
              <textarea rows={4} value={requestTe} onChange={e => setRequestTe(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3" placeholder="తెలుగులో ప్రార్థన విజ్ఞాపన..."></textarea>
            </div>
            <button disabled={saving} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold shadow-sm transition-colors mt-4">
              Submit Prayer Request
            </button>
          </div>
        </form>
      )}

      {view !== 'new' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(view === 'pending' ? pendingPrayers : processedPrayers).map(prayer => (
            <div key={prayer.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${prayer.isAnswered ? 'bg-green-600' : 'bg-purple-600'}`}>
                    {(prayer.name || 'A').charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      {prayer.name || 'Anonymous'}
                      {prayer.isAnswered && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Processed</span>}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      {getTimeAgo(prayer.createdAt)} {prayer.phone ? `· ${prayer.phone}` : ''}
                    </p>
                  </div>
                </div>
                {!prayer.isAnswered && (
                  <button onClick={() => handleDelete(prayer.id)} className="text-red-400 hover:text-red-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                )}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100 flex-1">
                <p className="text-gray-800 text-sm leading-relaxed">{prayer.text || prayer.requestEn}</p>
                {(prayer.textTe || prayer.requestTe) && (
                  <p className="text-gray-600 text-sm italic mt-3 pt-3 border-t border-gray-200">
                    {prayer.textTe || prayer.requestTe}
                  </p>
                )}
              </div>
              
              <div className="flex justify-between items-center mt-auto">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                  <span className="text-xs font-bold text-gray-500">{prayer.category || 'General'}</span>
                </div>
                {!prayer.isAnswered && (
                  <button onClick={() => handleApprove(prayer.id)} className="bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Approve
                  </button>
                )}
              </div>
            </div>
          ))}
          {(view === 'pending' ? pendingPrayers : processedPrayers).length === 0 && (
            <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-gray-100 text-gray-500 font-medium">
              No {view} prayer requests.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
