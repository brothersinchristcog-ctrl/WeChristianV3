"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, deleteDoc, setDoc } from 'firebase/firestore';

export default function AdminEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [churchId, setChurchId] = useState<string>('');
  
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [filterType, setFilterType] = useState<'Upcoming' | 'Past'>('Upcoming');
  
  const [message, setMessage] = useState('');

  // Form State
  const [titleEn, setTitleEn] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [venueEn, setVenueEn] = useState('');
  const [descEn, setDescEn] = useState('');
  const [bannerColor, setBannerColor] = useState('#1a2d5a');
  const [saving, setSaving] = useState(false);

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

        const eventsSnap = await getDocs(collection(db, 'churches', cid, 'events'));
        const eventsData = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setEvents(eventsData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ev: any) => {
    setEditingEvent(ev);
    if (ev) {
      setTitleEn(ev.name || ev.titleEn || '');
      setDate(ev.date || '');
      setStartTime(ev.startTime || '');
      setVenueEn(ev.location || ev.venueEn || '');
      setDescEn(ev.descEn || '');
      setBannerColor(ev.bannerColor || '#1a2d5a');
    } else {
      setTitleEn('');
      setDate('');
      setStartTime('');
      setVenueEn('');
      setDescEn('');
      setBannerColor('#1a2d5a');
    }
    setView('edit');
  };

  const handleDelete = async (id: string) => {
    if (!churchId) return;
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await deleteDoc(doc(db, 'churches', churchId, 'events', id));
      setEvents(prev => prev.filter(e => e.id !== id));
      setMessage('Event deleted successfully.');
    } catch (e) {
      console.error(e);
      setMessage('Failed to delete event.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchId) return;
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        name: titleEn,
        titleEn,
        date,
        startTime,
        location: venueEn,
        venueEn,
        descEn,
        bannerColor,
        updatedAt: new Date().toISOString()
      };

      if (editingEvent?.id) {
        await setDoc(doc(db, 'churches', churchId, 'events', editingEvent.id), payload, { merge: true });
      } else {
        const newRef = doc(collection(db, 'churches', churchId, 'events'));
        await setDoc(newRef, { ...payload, id: newRef.id, createdAt: new Date().toISOString() });
      }

      await fetchEvents();
      setView('list');
      setMessage('Event saved successfully.');
    } catch (e) {
      console.error(e);
      setMessage('Failed to save event.');
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const upcomingCount = events.filter(e => e.date >= today).length;
  const pastCount = events.filter(e => e.date < today).length;

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
              <h1 className="text-2xl font-bold text-gray-900">Events Management</h1>
              <p className="text-gray-500 text-sm mt-1">{events.length} total · {upcomingCount} upcoming</p>
            </div>
            <button onClick={() => handleEdit(null)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow-sm transition-colors flex items-center gap-2">
              <span>+</span> New Event
            </button>
          </div>

          <div className="flex gap-4">
            <button onClick={() => setFilterType('Upcoming')} className={`px-6 py-3 rounded-xl font-bold transition-all ${filterType === 'Upcoming' ? 'bg-blue-50 border-2 border-blue-600 text-blue-800' : 'bg-white border-2 border-transparent text-gray-500 hover:bg-gray-50'}`}>
              <div className="text-2xl">{upcomingCount}</div>
              <div className="text-xs uppercase tracking-wider">Upcoming</div>
            </button>
            <button onClick={() => setFilterType('Past')} className={`px-6 py-3 rounded-xl font-bold transition-all ${filterType === 'Past' ? 'bg-blue-50 border-2 border-blue-600 text-blue-800' : 'bg-white border-2 border-transparent text-gray-500 hover:bg-gray-50'}`}>
              <div className="text-2xl">{pastCount}</div>
              <div className="text-xs uppercase tracking-wider">Past Events</div>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events
              .filter(e => filterType === 'Upcoming' ? (e.date || '') >= today : (e.date || '') < today)
              .sort((a, b) => {
                 const tA = new Date(a.date || 0).getTime();
                 const tB = new Date(b.date || 0).getTime();
                 return filterType === 'Upcoming' ? tA - tB : tB - tA;
              })
              .map(event => (
                <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col transition-transform hover:-translate-y-1 hover:shadow-md">
                  <div className="h-24 relative flex items-center justify-center" style={{ backgroundColor: event.bannerColor || '#1a2d5a' }}>
                    {event.bannerUrl ? (
                      <img src={event.bannerUrl} alt="banner" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white/30 font-bold tracking-widest">NO IMAGE</span>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{event.name || 'Untitled'}</h3>
                    <div className="space-y-2 mt-auto text-sm font-medium text-gray-600">
                      <div className="flex items-center gap-2">
                        <span>📅</span> {event.date || 'No Date'}
                      </div>
                      <div className="flex items-center gap-2">
                        <span>⏰</span> {event.startTime || 'No Time'}
                      </div>
                      <div className="flex items-center gap-2">
                        <span>📍</span> {event.location || 'No Location'}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border-t border-gray-50 flex gap-2">
                    <button onClick={() => handleEdit(event)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg font-bold text-sm transition-colors">Edit</button>
                    <button onClick={() => handleDelete(event.id)} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg font-bold text-sm transition-colors">Delete</button>
                  </div>
                </div>
            ))}
            {events.filter(e => filterType === 'Upcoming' ? (e.date || '') >= today : (e.date || '') < today).length === 0 && (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-gray-100 text-gray-500 font-medium">
                No events found.
              </div>
            )}
          </div>
        </>
      ) : (
        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
          <div className="flex items-center justify-between mb-8 pb-4 border-b">
            <h2 className="text-2xl font-bold text-gray-900">{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
            <button type="button" onClick={() => setView('list')} className="text-gray-500 hover:text-gray-800 font-medium px-4 py-2 bg-gray-100 rounded-lg">Cancel</button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Event Title *</label>
              <input required type="text" value={titleEn} onChange={e => setTitleEn(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Sunday Service" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Date (YYYY-MM-DD)</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Start Time (e.g. 10:00 AM)</label>
                <input type="text" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="10:00 AM" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Venue / Location</label>
              <input type="text" value={venueEn} onChange={e => setVenueEn(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Main Auditorium" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
              <textarea rows={4} value={descEn} onChange={e => setDescEn(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Tell members about this event..."></textarea>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Banner Color</label>
              <div className="flex gap-4">
                {['#1a2d5a', '#c0392b', '#16a34a', '#7c3aed', '#d97706'].map(c => (
                  <button type="button" key={c} onClick={() => setBannerColor(c)} className={`w-10 h-10 rounded-full transition-transform ${bannerColor === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : 'opacity-80 hover:opacity-100'}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>

            <div className="pt-6 border-t mt-8 flex justify-end">
              <button disabled={saving} type="submit" className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-sm transition-colors">
                {saving ? 'Saving...' : (editingEvent ? 'Save Changes' : 'Create Event')}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
