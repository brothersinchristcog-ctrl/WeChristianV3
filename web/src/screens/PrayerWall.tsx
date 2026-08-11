"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, query, orderBy, serverTimestamp, updateDoc, arrayUnion, arrayRemove, where } from 'firebase/firestore';

interface PrayerRequest {
  id: string;
  name?: string;
  requestEn?: string;
  text?: string;
  category: string;
  isAnswered: boolean;
  status?: string;
  likesCount?: number;
  prayedBy?: string[];
  createdAt?: any;
  date?: string;
  userId?: string;
}

const CATEGORIES = [
  { label: 'Pray for me', icon: '👤' },
  { label: 'Pray for my family', icon: '🏠' },
  { label: 'Pray for healing', icon: '🏥' },
  { label: 'Pray for peace and strength', icon: '🕊️' },
  { label: 'Other (if necessary)', icon: '✨' }
];

export default function PrayerWallPage() {
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [churchId, setChurchId] = useState<string>('');
  const [userData, setUserData] = useState<any>(null);
  
  // Submit Form
  const [prayerInput, setPrayerInput] = useState('');
  const [category, setCategory] = useState('Pray for me');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

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
        setUserData(userDoc.data());

        const prayersRef = collection(db, 'churches', cid, 'prayerRequests');
        const q = query(prayersRef, orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        
        let data = snap.docs.map(d => ({ id: d.id, ...d.data() } as PrayerRequest));
        // Filter out drafts/rejected if status field exists, else fallback to isAnswered or show all depending on what mobile did. 
        // Mobile just fetches all for the wall, assuming we only fetch published ones.
        data = data.filter(p => p.status !== 'Rejected');
        
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
    if (!churchId || !prayerInput.trim() || !userData) return;
    setIsSubmitting(true);
    try {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const newRef = doc(collection(db, 'churches', churchId, 'prayerRequests'));
      await setDoc(newRef, {
        id: newRef.id,
        name: userData.name || 'Anonymous',
        requestEn: prayerInput,
        text: prayerInput,
        category: category,
        status: 'Published',
        isAnswered: false,
        likesCount: 0,
        prayedBy: [],
        createdAt: serverTimestamp(),
        date: dateStr,
        userId: auth.currentUser?.uid
      });
      setAlertMsg('Your prayer request has been submitted to the community.');
      setPrayerInput('');
      setCategory('Pray for me');
      await fetchPrayers();
      setTimeout(() => setAlertMsg(''), 4000);
    } catch (error) {
      console.error(error);
      setAlertMsg('Failed to submit prayer request.');
      setTimeout(() => setAlertMsg(''), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePray = async (prayerId: string) => {
    if (!churchId || !auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const pIndex = prayers.findIndex(p => p.id === prayerId);
    if (pIndex === -1) return;
    
    const prayer = prayers[pIndex];
    const hasPrayed = prayer.prayedBy?.includes(uid);
    
    // Optimistic update
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
      fetchPrayers(); // Revert on failure
    }
  };

  const currentUserId = auth.currentUser?.uid;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full bg-gray-50 min-h-screen pb-12 shadow-2xl relative flex flex-col">
      {/* Header */}
      <div className="bg-ink p-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <h2 className="text-white font-bold text-lg">Prayer Wall</h2>
      </div>

      <div className="p-4 space-y-6">
        
        {alertMsg && (
          <div className="bg-[#15803d]/10 border border-[#15803d]/30 text-[#15803d] p-3 rounded-lg text-sm font-bold flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            {alertMsg}
          </div>
        )}

        {/* Compose Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-rule overflow-hidden">
          <div className="bg-ink px-4 py-3 flex items-center gap-2 border-b border-rule/20">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            <span className="text-white text-xs font-bold tracking-widest uppercase">SUBMIT PRAYER REQUEST</span>
          </div>
          
          <form onSubmit={handleSubmit} className="p-4">
            <label className="block text-xs font-bold text-ink-soft mb-2 uppercase">Select Category</label>
            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide mb-4">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => setCategory(cat.label)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors border ${
                    category === cat.label 
                      ? 'bg-parchment border-gold-bright text-ink' 
                      : 'bg-white border-rule text-ink-soft'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="text-xs font-bold">{cat.label}</span>
                </button>
              ))}
            </div>

            <label className="block text-xs font-bold text-ink-soft mb-2 uppercase">Detailed Prayer Request</label>
            <textarea
              className="w-full bg-gray-50 border border-rule rounded-xl p-3 text-sm text-ink placeholder-gray-400 focus:border-ink outline-none resize-none"
              rows={4}
              placeholder="Share your prayer request... తెలుగులో కూడా రాయవచ్చు…"
              value={prayerInput}
              onChange={(e) => setPrayerInput(e.target.value)}
              required
            ></textarea>
            
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                disabled={isSubmitting || !prayerInput.trim()}
                className={`bg-ink text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md flex items-center ${isSubmitting || !prayerInput.trim() ? 'opacity-70' : 'hover:bg-ink-light'}`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request 🙏'}
              </button>
            </div>
          </form>
        </div>

        {/* Section Header */}
        <div className="flex items-center py-2">
          <div className="flex-1 h-px bg-rule"></div>
          <span className="px-4 text-[10px] font-bold text-ink-soft tracking-widest uppercase">COMMUNITY PRAYERS</span>
          <div className="flex-1 h-px bg-rule"></div>
        </div>

        {/* Prayer List */}
        <div className="space-y-4">
          {prayers.map(prayer => {
            const isMine = prayer.userId === currentUserId;
            const hasPrayed = currentUserId && prayer.prayedBy?.includes(currentUserId);
            const prayedCount = prayer.prayedBy?.length || 0;

            const catConfig = CATEGORIES.find(c => c.label === prayer.category) || CATEGORIES[4];

            return (
              <div key={prayer.id} className="bg-white rounded-2xl p-4 shadow-sm border border-rule/50">
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-parchment flex items-center justify-center border border-rule text-ink font-bold text-lg font-serif">
                      {prayer.name ? prayer.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h3 className="font-bold text-ink text-sm flex items-center gap-2">
                        {prayer.name || 'Anonymous'}
                        {isMine && <span className="bg-gold-light text-gold-deep text-[10px] px-1.5 py-0.5 rounded font-bold">You</span>}
                      </h3>
                      <span className="text-xs text-ink-soft font-medium">{prayer.date || 'Recent'}</span>
                    </div>
                  </div>
                  {prayer.isAnswered && (
                    <div className="bg-[#15803d]/10 px-2 py-1 rounded flex items-center gap-1">
                      <svg className="w-3 h-3 text-[#15803d]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      <span className="text-[#15803d] text-[10px] font-bold uppercase tracking-wider">Answered</span>
                    </div>
                  )}
                </div>

                {/* Tag */}
                <div className="mb-3 flex">
                  <div className="bg-gray-100 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-rule/30">
                    <span className="text-xs">{catConfig.icon}</span>
                    <span className="text-gray-600 text-[10px] font-bold tracking-wide uppercase">{catConfig.label}</span>
                  </div>
                </div>

                {/* Content */}
                <p className="text-ink text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                  {prayer.requestEn || prayer.text}
                </p>

                {/* Footer Stats & Actions */}
                <div className="border-t border-rule pt-3">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-ink-soft font-medium flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      {prayedCount} {prayedCount === 1 ? 'member is' : 'members are'} praying
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handlePray(prayer.id)}
                      className={`flex-1 py-2.5 rounded-xl border flex justify-center items-center gap-2 transition-colors ${
                        hasPrayed 
                          ? 'bg-parchment border-gold-bright text-ink' 
                          : 'bg-white border-rule text-ink-soft hover:bg-gray-50'
                      }`}
                    >
                      <svg className={`w-5 h-5 ${hasPrayed ? 'text-gold-deep' : 'text-gray-400'}`} fill={hasPrayed ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      <span className="font-bold text-xs tracking-wider">{hasPrayed ? 'PRAYED' : 'PRAY'}</span>
                    </button>
                    
                    <button className="flex-1 py-2.5 rounded-xl border border-rule bg-white text-ink-soft hover:bg-gray-50 flex justify-center items-center gap-2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      <span className="font-bold text-xs tracking-wider">REPLY</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {prayers.length === 0 && (
            <div className="text-center py-12">
              <span className="text-4xl block mb-2">🙏</span>
              <p className="text-gray-500 font-medium">Be the first to share a prayer request.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
