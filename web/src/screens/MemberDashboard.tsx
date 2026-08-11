"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import Link from 'next/link';

export default function MemberDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [churchId, setChurchId] = useState<string>('');
  
  // Data State
  const [dailyPromise, setDailyPromise] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            
            if (data.primaryChurchId) {
              setChurchId(data.primaryChurchId);
              await fetchData(data.primaryChurchId);
            }
          }
        } catch (err) {
          console.error("Error fetching user data", err);
        }
      } else {
        router.push('/');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const fetchData = async (cid: string) => {
    try {
      // Fetch Daily Promise
      const promisesRef = collection(db, 'churches', cid, 'promises');
      const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
      
      const pQuery = query(promisesRef, where('date', '==', todayStr), limit(1));
      const pSnap = await getDocs(pQuery);
      if (!pSnap.empty) {
        setDailyPromise(pSnap.docs[0].data());
      } else {
        // Fallback to most recent
        const pQuery2 = query(promisesRef, orderBy('date', 'desc'), limit(1));
        const pSnap2 = await getDocs(pQuery2);
        if (!pSnap2.empty) setDailyPromise(pSnap2.docs[0].data());
      }

      // Fetch upcoming events for today
      const eventsRef = collection(db, 'churches', cid, 'events');
      const eQuery = query(eventsRef, where('date', '>=', todayStr), orderBy('date', 'asc'), limit(5));
      const eSnap = await getDocs(eQuery);
      setEvents(eSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching dashboard data", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink"></div>
      </div>
    );
  }

  // Format today's date
  let displayDate = dailyPromise?.date;
  if (displayDate) {
    const parts = displayDate.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      displayDate = `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    }
  }

  const verseTextEn = dailyPromise?.verse?.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").trim();
  const verseTextTe = dailyPromise?.verseTelugu?.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").trim();

  // Filter today events
  const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
  const todayEvents = events.filter(e => e.date === todayStr);

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6 pb-12 animate-fade-in">
      {/* Web-friendly Header */}
      <div className="bg-ink p-6 rounded-2xl flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border border-white/10 overflow-hidden">
            {userData?.photoUrl ? (
              <img src={userData.photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-xl">{userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}</span>
            )}
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Hello, {userData?.name || 'Friend'}</h2>
            <p className="text-white/60 text-sm">God bless you today</p>
          </div>
        </div>
        <button className="relative w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-ink"></div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
        {/* Today's Events Marquee Replica */}
        <div className="bg-ink rounded-xl overflow-hidden border border-rule/20 shadow-sm relative">
          <div className="bg-[#151C33] px-3 py-2 flex items-center border-b border-white/5">
            <span className="mr-2">🎉</span>
            <span className="text-[10px] font-bold text-white tracking-widest">TODAY'S EVENTS • నేటి కార్యక్రమాలు</span>
          </div>
          <div className="flex bg-ink p-2 items-center overflow-x-auto scrollbar-hide whitespace-nowrap min-h-[44px]">
            <div className="bg-red-600 px-2 py-0.5 rounded text-[10px] font-bold text-white mr-3 shrink-0">TODAY</div>
            {todayEvents.length > 0 ? (
              todayEvents.map((ev, i) => (
                <div key={i} className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-gold-bright mr-2"></div>
                  <span className="text-white font-bold text-sm mr-2">{ev.titleEn || ev.name}</span>
                  <div className="bg-white/10 px-2 py-0.5 rounded-full text-xs text-white mr-3">⏰ {ev.startTime}</div>
                  <span className="text-white/30 mx-2">|</span>
                  <div className="w-2 h-2 rounded-full bg-gold-bright mr-2"></div>
                  <span className="text-white font-bold text-sm mr-2">{ev.titleTe || ev.titleEn || ev.name}</span>
                  <div className="bg-white/10 px-2 py-0.5 rounded-full text-xs text-white mr-4">⏰ {ev.startTime}</div>
                  <span className="text-gold-bright mx-4">✦</span>
                </div>
              ))
            ) : (
              <span className="text-white/70 text-sm font-medium italic">No events scheduled for today.</span>
            )}
          </div>
        </div>

        {/* Daily Promise Card */}
        <div className="bg-paper rounded-2xl border border-rule shadow-sm overflow-hidden">
          {/* vcBand */}
          <div className="flex justify-between items-center bg-parchment px-4 py-3 border-b border-rule">
            <div className="font-serif text-gold-deep font-bold text-base">{displayDate || new Date().toLocaleDateString()}</div>
            <div className="w-7 h-7 rounded-full bg-paper border border-rule flex items-center justify-center">
              <svg className="w-4 h-4 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
          </div>

          {/* vcBody */}
          <div className="p-5">
            {dailyPromise ? (
              <>
                <div className="flex flex-wrap items-center mb-4">
                  {(dailyPromise.verseReferenceEn || dailyPromise.verseReference) && (
                    <div className="bg-parchment px-2 py-1 rounded mr-2 mb-1 border border-rule">
                      <span className="text-ink text-xs font-bold">{dailyPromise.verseReferenceEn || dailyPromise.verseReference}</span>
                    </div>
                  )}
                  {dailyPromise.verseReferenceTe && (
                    <div className="bg-parchment px-2 py-1 rounded mr-2 mb-1 border border-rule">
                      <span className="text-ink text-xs font-bold italic">{dailyPromise.verseReferenceTe}</span>
                    </div>
                  )}
                </div>
                
                {verseTextEn && <p className="font-serif text-lg leading-7 text-ink mb-4">"{verseTextEn}"</p>}
                {verseTextTe && <p className="font-serif text-lg leading-7 text-clay italic mb-4">"{verseTextTe}"</p>}
              </>
            ) : (
              <div className="py-8 text-center text-gray-400 font-medium italic">
                Daily promise not updated yet for today.
              </div>
            )}
            
            <div className="flex justify-end pt-3">
              <button className="flex items-center gap-2 bg-parchment px-4 py-2 rounded-lg border border-rule hover:bg-[#F3EAD9]/80 transition-colors">
                <svg className="w-4 h-4 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                <span className="text-ink font-bold text-xs">Share</span>
              </button>
            </div>
          </div>
        </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-rule/50">
          <h3 className="text-xs font-bold text-ink-soft uppercase tracking-wider mb-3 ml-1">Quick Actions</h3>
          <div className="grid grid-cols-4 gap-3">
            <Link href="/dashboard/sermons" className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-white rounded-2xl border border-rule shadow-sm flex items-center justify-center">
                <svg className="w-6 h-6 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <span className="text-[10px] font-bold text-ink text-center leading-tight">Sermons</span>
            </Link>
            
            <Link href="/dashboard/songs" className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-white rounded-2xl border border-rule shadow-sm flex items-center justify-center">
                <svg className="w-6 h-6 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
              </div>
              <span className="text-[10px] font-bold text-ink text-center leading-tight">Songs</span>
            </Link>
            
            <Link href="/dashboard/prayer" className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-white rounded-2xl border border-rule shadow-sm flex items-center justify-center">
                <svg className="w-6 h-6 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </div>
              <span className="text-[10px] font-bold text-ink text-center leading-tight">Prayer</span>
            </Link>
            
            <Link href="/dashboard/giving" className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-white rounded-2xl border border-rule shadow-sm flex items-center justify-center">
                <svg className="w-6 h-6 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <span className="text-[10px] font-bold text-ink text-center leading-tight">Giving</span>
            </Link>

            <Link href="/dashboard/bible" className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-white rounded-2xl border border-rule shadow-sm flex items-center justify-center">
                <svg className="w-6 h-6 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <span className="text-[10px] font-bold text-ink text-center leading-tight">Bible</span>
            </Link>

            <Link href="/dashboard/events" className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-white rounded-2xl border border-rule shadow-sm flex items-center justify-center">
                <svg className="w-6 h-6 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <span className="text-[10px] font-bold text-ink text-center leading-tight">Events</span>
            </Link>

            <Link href="/dashboard/notes" className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-white rounded-2xl border border-rule shadow-sm flex items-center justify-center">
                <svg className="w-6 h-6 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </div>
              <span className="text-[10px] font-bold text-ink text-center leading-tight">Notes</span>
            </Link>
            
            <Link href="/dashboard/members" className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-white rounded-2xl border border-rule shadow-sm flex items-center justify-center">
                <svg className="w-6 h-6 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <span className="text-[10px] font-bold text-ink text-center leading-tight">Members</span>
            </Link>

            <Link href="/dashboard/updates" className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-white rounded-2xl border border-rule shadow-sm flex items-center justify-center">
                <svg className="w-6 h-6 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              </div>
              <span className="text-[10px] font-bold text-ink text-center leading-tight">Updates</span>
            </Link>

            <Link href="/dashboard/youtube" className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-white rounded-2xl border border-rule shadow-sm flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
              </div>
              <span className="text-[10px] font-bold text-ink text-center leading-tight">YouTube</span>
            </Link>

            <Link href="/dashboard/profile" className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-white rounded-2xl border border-rule shadow-sm flex items-center justify-center">
                <svg className="w-6 h-6 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <span className="text-[10px] font-bold text-ink text-center leading-tight">Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
