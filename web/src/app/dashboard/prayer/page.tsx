"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, query, orderBy, serverTimestamp, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

interface PrayerRequest {
  id: string;
  name?: string;
  requestEn?: string;
  text?: string;
  category: string;
  isAnswered: boolean;
  likesCount?: number;
  prayedBy?: string[];
  createdAt?: any;
}

export default function PrayerWallPage() {
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [churchId, setChurchId] = useState<string>('');
  const [message, setMessage] = useState('');
  
  // Submit Form
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    content: '',
    category: 'General',
    isAnonymous: false
  });

  const categories = ['General', 'Healing', 'Family', 'Financial', 'Guidance', 'Thanksgiving'];

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

        if (!form.name) {
          setForm(prev => ({ 
            ...prev, 
            name: userDoc.data().name || ''
          }));
        }

        const prayersRef = collection(db, 'churches', cid, 'prayerRequests');
        const q = query(prayersRef, orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        
        // Filter client-side to avoid needing a composite index
        let data = snap.docs.map(d => ({ id: d.id, ...d.data() } as PrayerRequest));
        data = data.filter(p => p.isAnswered === true); // Only show approved/answered prayers
        
        setPrayers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchId || !form.content) return;
    setSubmitting(true);
    try {
      const newRef = doc(collection(db, 'churches', churchId, 'prayerRequests'));
      await setDoc(newRef, {
        id: newRef.id,
        name: form.isAnonymous ? 'Anonymous' : form.name,
        requestEn: form.content,
        text: form.content, // Fallback for old schema
        category: form.category,
        isAnonymous: form.isAnonymous,
        isAnswered: false, // Pending admin approval
        likesCount: 0,
        prayedBy: [],
        createdAt: serverTimestamp(),
        userId: auth.currentUser?.uid
      });
      setMessage('Your prayer request has been submitted and is pending review.');
      setShowSubmitModal(false);
      setForm({ ...form, content: '', isAnonymous: false, category: 'General' });
    } catch (error) {
      console.error(error);
      setMessage('Failed to submit prayer request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePray = async (prayerId: string) => {
    if (!churchId || !auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const pIndex = prayers.findIndex(p => p.id === prayerId);
    if (pIndex === -1) return;
    
    const prayer = prayers[pIndex];
    const hasPrayed = prayer.prayedBy?.includes(uid);
    
    const updatedPrayers = [...prayers];
    if (hasPrayed) {
      updatedPrayers[pIndex].prayedBy = updatedPrayers[pIndex].prayedBy?.filter(id => id !== uid) || [];
    } else {
      updatedPrayers[pIndex].prayedBy = [...(updatedPrayers[pIndex].prayedBy || []), uid];
    }
    updatedPrayers[pIndex].likesCount = updatedPrayers[pIndex].prayedBy.length;
    setPrayers(updatedPrayers);

    try {
      const docRef = doc(db, 'churches', churchId, 'prayerRequests', prayerId);
      await updateDoc(docRef, {
        prayedBy: hasPrayed ? arrayRemove(uid) : arrayUnion(uid),
        likesCount: updatedPrayers[pIndex].prayedBy.length
      });
    } catch (e) {
      console.error(e);
      fetchPrayers();
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      
      {message && (
        <div className="p-4 rounded-xl text-sm font-medium bg-purple-50 text-purple-700 border border-purple-200 flex justify-between items-center">
          {message}
          <button onClick={() => setMessage('')} className="text-purple-500 hover:text-purple-700">&times;</button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-purple-50 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-gray-900 font-serif">Prayer Wall</h1>
          <p className="text-gray-500 mt-2 text-sm max-w-lg leading-relaxed">
            "For where two or three gather in my name, there am I with them." - Matthew 18:20
          </p>
        </div>
        <button 
          onClick={() => setShowSubmitModal(true)}
          className="relative z-10 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm transition-colors"
        >
          Share Request
        </button>
      </div>

      {/* Grid of Prayers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {prayers.map(prayer => {
          const isPrayed = prayer.prayedBy?.includes(auth.currentUser?.uid || '');
          const dateStr = prayer.createdAt?.toDate ? new Date(prayer.createdAt.toDate()).toLocaleDateString() : 'Recent';
          
          return (
            <div key={prayer.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">{prayer.name || 'Anonymous'}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{dateStr}</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-gray-100 text-gray-600">
                  {prayer.category || 'General'}
                </span>
              </div>
              
              <p className="text-gray-700 text-sm leading-relaxed mb-6 flex-1 whitespace-pre-wrap">
                {prayer.requestEn || prayer.text || ''}
              </p>
              
              <div className="pt-4 border-t border-gray-100 flex justify-between items-center mt-auto">
                <span className="text-xs font-semibold text-gray-500">
                  {prayer.likesCount || 0} {(prayer.likesCount || 0) === 1 ? 'person is' : 'people are'} praying
                </span>
                <button 
                  onClick={() => handlePray(prayer.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                    isPrayed 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <svg className={`w-4 h-4 ${isPrayed ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                  {isPrayed ? 'Praying' : 'Pray'}
                </button>
              </div>
            </div>
          );
        })}
        {prayers.length === 0 && (
          <div className="md:col-span-2 text-center py-12 text-gray-500">
            No prayer requests right now. Be the first to share one!
          </div>
        )}
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">Share Prayer Request</h2>
              <button onClick={() => setShowSubmitModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Your Request</label>
                <textarea 
                  required 
                  rows={4}
                  value={form.content} 
                  onChange={e => setForm({...form, content: e.target.value})} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900" 
                  placeholder="How can we pray for you?"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                  <select 
                    value={form.category} 
                    onChange={e => setForm({...form, category: e.target.value})} 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={form.isAnonymous} 
                      onChange={e => setForm({...form, isAnonymous: e.target.checked})}
                      className="w-5 h-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                    />
                    <span className="text-sm font-bold text-gray-700">Post Anonymously</span>
                  </label>
                </div>
              </div>

              {!form.isAnonymous && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Name (Optional)</label>
                  <input 
                    type="text" 
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})} 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" 
                    placeholder="Your Name"
                  />
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowSubmitModal(false)} className="px-5 py-2.5 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                  Cancel
                </button>
                <button disabled={submitting} type="submit" className="px-5 py-2.5 font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
