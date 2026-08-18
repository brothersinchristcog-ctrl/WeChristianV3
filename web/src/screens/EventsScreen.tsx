"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, orderBy, where } from 'firebase/firestore';

export default function MemberEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

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
        const eventsRef = collection(db, 'churches', cid, 'events');
        const snap = await getDocs(query(eventsRef, orderBy('date', 'asc')));
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

  const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
  
  const upcomingEvents = events.filter(e => e.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date));
  const pastEvents = events.filter(e => e.date < todayStr).sort((a, b) => b.date.localeCompare(a.date));

  const displayEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

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
      <div className="bg-ink pt-4 pb-0 px-4 sticky top-0 z-10 shadow-sm">
        <h2 className="text-white font-bold text-lg mb-4">Church Events</h2>
        
        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button 
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'upcoming' ? 'border-gold-bright text-gold-bright' : 'border-transparent text-white/60 hover:text-white'}`}
          >
            Upcoming
          </button>
          <button 
            onClick={() => setActiveTab('past')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'past' ? 'border-gold-bright text-gold-bright' : 'border-transparent text-white/60 hover:text-white'}`}
          >
            Past Events
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {displayEvents.map((event: any) => {
          const dateParts = event.date.split('-');
          const monthName = new Date(event.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
          
          return (
            <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-rule/50 p-4 flex gap-4">
              
              <div className="flex flex-col items-center justify-center w-14 h-14 bg-parchment text-ink rounded-xl border border-rule flex-shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-widest">{monthName}</span>
                <span className="text-xl font-black leading-none my-0.5">{dateParts[2]}</span>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-ink text-sm line-clamp-1 mb-0.5">
                  {event.titleEn || event.name || event.title}
                </h3>
                
                {(event.titleTe || (event.title !== event.titleEn && event.title)) && (
                  <p className="text-[10px] font-bold text-ink-soft mb-2 line-clamp-1">
                    {event.titleTe || event.title}
                  </p>
                )}
                
                <div className="flex flex-col gap-1.5 mt-2">
                  <div className="flex items-center text-xs font-medium text-gray-600">
                    <svg className="w-3.5 h-3.5 mr-1.5 text-gold-deep" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    {formatTime(event.startTime)} {event.endTime ? `- ${formatTime(event.endTime)}` : ''}
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center text-xs font-medium text-gray-600 line-clamp-1">
                      <svg className="w-3.5 h-3.5 mr-1.5 text-gold-deep flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {displayEvents.length === 0 && (
          <div className="text-center py-12">
            <span className="text-4xl block mb-2">🗓️</span>
            <p className="text-gray-500 font-medium text-sm">No {activeTab} events found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
