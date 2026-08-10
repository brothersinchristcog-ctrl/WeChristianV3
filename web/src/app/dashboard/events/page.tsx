"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, orderBy, where } from 'firebase/firestore';

export default function MemberEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [churchId, setChurchId] = useState<string>('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && userDoc.data().primaryChurchId) {
        const cid = userDoc.data().primaryChurchId;
        setChurchId(cid);

        const eventsRef = collection(db, 'churches', cid, 'events');
        // Get all events from today onwards
        const todayStr = new Date().toISOString().split('T')[0];
        const q = query(eventsRef, where('date', '>=', todayStr), orderBy('date', 'asc'));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setEvents(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      const timePart = timeStr.includes('T') ? timeStr.split('T')[1].split('.')[0] : timeStr;
      const [hours, minutes] = timePart.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const formattedHours = h % 12 || 12;
      return `${formattedHours}:${minutes} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div></div>;
  }

  // Group events by month
  const groupedEvents = events.reduce((acc: any, event) => {
    const date = new Date(event.date);
    const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(event);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-gray-900 font-serif">Church Events</h1>
          <p className="text-gray-500 mt-2 text-sm max-w-lg leading-relaxed">
            Stay connected and participate in our upcoming services, meetings, and gatherings.
          </p>
        </div>
        <div className="relative z-10 bg-orange-100 text-orange-800 px-4 py-2 rounded-xl font-bold">
          {events.length} Upcoming
        </div>
      </div>

      {Object.keys(groupedEvents).length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500 shadow-sm">
          <div className="text-4xl mb-4">🗓️</div>
          <p className="font-medium text-lg">No upcoming events scheduled.</p>
          <p className="text-sm mt-2">Check back later for updates from your church.</p>
        </div>
      ) : (
        Object.entries(groupedEvents).map(([monthYear, monthEvents]: [string, any]) => (
          <div key={monthYear} className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b-2 border-orange-100 pb-2 inline-block">
              {monthYear}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {monthEvents.map((event: any) => {
                const dateParts = event.date.split('-');
                const monthName = new Date(event.date).toLocaleDateString('en-US', { month: 'short' });
                const dayName = new Date(event.date).toLocaleDateString('en-US', { weekday: 'short' });
                
                return (
                  <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex gap-5 hover:shadow-md transition-shadow group cursor-pointer">
                    
                    <div className="flex flex-col items-center justify-center w-16 h-16 bg-gradient-to-b from-orange-50 to-orange-100 text-orange-600 rounded-xl flex-shrink-0 border border-orange-200/50 group-hover:scale-105 transition-transform">
                      <span className="text-[10px] font-bold uppercase tracking-widest">{monthName}</span>
                      <span className="text-2xl font-black leading-none my-0.5">{dateParts[2]}</span>
                      <span className="text-[9px] font-bold uppercase text-orange-500/80">{dayName}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 text-base line-clamp-1 group-hover:text-orange-600 transition-colors">
                          {event.title}
                        </h3>
                      </div>
                      
                      {event.titleTelugu && (
                        <p className="text-xs text-gray-500 italic mb-2 line-clamp-1">{event.titleTelugu}</p>
                      )}
                      
                      <div className="flex flex-col gap-1.5 mt-2">
                        <div className="flex items-center text-xs font-medium text-gray-600">
                          <svg className="w-3.5 h-3.5 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          {formatTime(event.startTime)} {event.endTime ? `- ${formatTime(event.endTime)}` : ''}
                        </div>
                        
                        {event.location && (
                          <div className="flex items-center text-xs font-medium text-gray-600 line-clamp-1">
                            <svg className="w-3.5 h-3.5 mr-1.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
