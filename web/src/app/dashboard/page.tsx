"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import Link from 'next/link';

export default function DashboardPage() {
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
      const todayStr = new Date().toISOString().split('T')[0];
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

      // Fetch upcoming events
      const eventsRef = collection(db, 'churches', cid, 'events');
      const eQuery = query(eventsRef, where('date', '>=', todayStr), orderBy('date', 'asc'), limit(3));
      const eSnap = await getDocs(eQuery);
      setEvents(eSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching dashboard data", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-8 shadow-sm text-white">
        <h1 className="text-3xl font-bold font-serif mb-2">
          Welcome back, {userData?.name || 'Friend'}!
        </h1>
        <p className="text-blue-100 opacity-90 max-w-2xl text-sm leading-relaxed">
          "This is the day that the LORD has made; let us rejoice and be glad in it." - Psalm 118:24
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Daily Promise */}
          {dailyPromise && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-48 bg-gray-100 relative">
                {dailyPromise.imageUrl ? (
                  <img src={dailyPromise.imageUrl} alt="Daily Promise" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
                    <span className="text-4xl">🌅</span>
                  </div>
                )}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Promise of the Day
                </div>
              </div>
              <div className="p-6 md:p-8">
                <h3 className="text-2xl font-bold text-gray-900 font-serif leading-snug text-center mb-4">
                  "{dailyPromise.verse}"
                </h3>
                {dailyPromise.verseTe && (
                  <p className="text-lg text-gray-600 font-serif text-center italic mb-6">
                    {dailyPromise.verseTe}
                  </p>
                )}
                <div className="text-center">
                  <span className="inline-block bg-blue-50 text-blue-800 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide">
                    {dailyPromise.reference}
                  </span>
                </div>
                {dailyPromise.devotionalNote && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-gray-600 text-sm leading-relaxed text-center">
                      {dailyPromise.devotionalNote}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link href="/dashboard/bible" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
              </div>
              <span className="font-bold text-gray-900 text-sm">Read Bible</span>
            </Link>

            <Link href="/dashboard/prayer" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
              </div>
              <span className="font-bold text-gray-900 text-sm">Prayer Wall</span>
            </Link>

            <Link href="/dashboard/giving" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <span className="font-bold text-gray-900 text-sm">Give</span>
            </Link>

            <Link href="/dashboard/events" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <span className="font-bold text-gray-900 text-sm">Events</span>
            </Link>
          </div>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
          
          {/* Upcoming Events */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900">Upcoming Events</h3>
              <Link href="/dashboard/events" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
                View All
              </Link>
            </div>
            
            <div className="space-y-4">
              {events.length > 0 ? (
                events.map(event => {
                  const dateParts = event.date.split('-');
                  const monthName = new Date(event.date).toLocaleDateString('en-US', { month: 'short' });
                  return (
                    <div key={event.id} className="flex gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                      <div className="bg-blue-50 text-blue-700 w-12 h-12 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold uppercase">{monthName}</span>
                        <span className="text-lg font-bold leading-none">{dateParts[2]}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{event.title}</h4>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          {event.startTime ? event.startTime.substring(0, 5) : 'All Day'}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-gray-500 text-sm">
                  No upcoming events this week.
                </div>
              )}
            </div>
          </div>

          {/* Contact Church */}
          <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
            <h3 className="font-bold text-amber-900 mb-2">Need Support?</h3>
            <p className="text-sm text-amber-700 mb-4">
              If you have any questions or need pastoral care, please reach out.
            </p>
            <Link href="/dashboard/prayer" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg text-sm text-center block transition-colors">
              Request Prayer
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
