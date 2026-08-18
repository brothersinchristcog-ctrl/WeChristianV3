"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, deleteDoc, setDoc } from 'firebase/firestore';

export default function AdminPastorEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [churchId, setChurchId] = useState<string>('');
  
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [filterType, setFilterType] = useState<'Upcoming' | 'Past'>('Upcoming');
  
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // Exact Mobile App State Parity for Pastor Events
  const [form, setForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00 AM',
    endTime: '01:00 PM',
    venue: '',
    address: '',
    description: '',
    eventType: 'Preaching',
    isTravel: false,
    contactPerson: '',
    contactPhone: '',
    status: 'Confirmed'
  });

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

        const eventsSnap = await getDocs(collection(db, 'churches', cid, 'pastorEvents'));
        const eventsData = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setEvents(eventsData.sort((a: any, b: any) => (a.date || '').localeCompare(b.date || '')));
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
      setForm({
        title: ev.title || '',
        date: ev.date || new Date().toISOString().split('T')[0],
        startTime: ev.startTime || '09:00 AM',
        endTime: ev.endTime || '01:00 PM',
        venue: ev.venue || '',
        address: ev.address || '',
        description: ev.description || '',
        eventType: ev.eventType || 'Preaching',
        isTravel: ev.isTravel || false,
        contactPerson: ev.contactPerson || '',
        contactPhone: ev.contactPhone || '',
        status: ev.status || 'Confirmed'
      });
    } else {
      setForm({
        title: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00 AM',
        endTime: '01:00 PM',
        venue: '',
        address: '',
        description: '',
        eventType: 'Preaching',
        isTravel: false,
        contactPerson: '',
        contactPhone: '',
        status: 'Confirmed'
      });
    }
    setView('edit');
  };

  const handleDelete = async (id: string) => {
    if (!churchId) return;
    if (!window.confirm("Are you sure you want to delete this pastor event?")) return;
    try {
      await deleteDoc(doc(db, 'churches', churchId, 'pastorEvents', id));
      setEvents(prev => prev.filter(e => e.id !== id));
      setMessage('Pastor event deleted successfully.');
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
        ...form,
        updatedAt: new Date().toISOString()
      };

      if (editingEvent?.id) {
        await setDoc(doc(db, 'churches', churchId, 'pastorEvents', editingEvent.id), payload, { merge: true });
      } else {
        const newRef = doc(collection(db, 'churches', churchId, 'pastorEvents'));
        await setDoc(newRef, { ...payload, id: newRef.id, createdAt: new Date().toISOString() });
      }

      await fetchEvents();
      setView('list');
      setMessage('Pastor event saved successfully.');
    } catch (e) {
      console.error(e);
      setMessage('Failed to save event.');
    } finally {
      setSaving(false);
    }
  };

  const todayComp = new Date().toISOString().split('T')[0];
  const upcomingEvents = events.filter(e => (e.date || '') >= todayComp);
  const pastEvents = events.filter(e => (e.date || '') < todayComp);
  
  const displayEvents = filterType === 'Upcoming' ? upcomingEvents : pastEvents;

  if (loading && view === 'list') {
    return <div className="flex justify-center items-center min-h-screen bg-ink"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-bright"></div></div>;
  }

  return (
    <div className="bg-[#f0f2f7] min-h-screen">
      {view === 'list' ? (
        <>
          <div className="bg-ink px-6 py-10 pb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Pastor Schedule</h1>
                <p className="text-ink-soft text-base mt-2">{events.length} total • {upcomingEvents.length} upcoming</p>
              </div>
              <button onClick={() => handleEdit(null)} className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                <span className="text-white text-2xl font-bold">+</span>
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex bg-ink-2 p-1 rounded-xl mt-8">
              <button onClick={() => setFilterType('Upcoming')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${filterType === 'Upcoming' ? 'bg-white text-ink shadow-sm' : 'text-white/60 hover:text-white'}`}>
                Upcoming
              </button>
              <button onClick={() => setFilterType('Past')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${filterType === 'Past' ? 'bg-white text-ink shadow-sm' : 'text-white/60 hover:text-white'}`}>
                Past
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {displayEvents.map(ev => (
              <div key={ev.id} className="bg-white rounded-2xl p-4 shadow-sm border border-rule/50">
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-parchment px-2 py-1 rounded">
                    <span className="text-ink text-xs font-bold uppercase">{ev.eventType || 'Preaching'}</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${ev.status === 'Confirmed' ? 'bg-[#15803d]/10 text-[#15803d]' : 'bg-gold/10 text-gold-deep'}`}>
                    {ev.status || 'Draft'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-ink mb-2">{ev.title}</h3>
                
                <div className="flex flex-col gap-1 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">📅</span> {ev.date}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">⏰</span> {ev.startTime} - {ev.endTime}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">📍</span> {ev.venue}
                  </div>
                </div>

                <div className="flex gap-2 border-t border-gray-100 pt-3">
                  <button onClick={() => handleEdit(ev)} className="flex-1 py-2 bg-parchment hover:bg-gold-light text-ink rounded-lg font-bold text-sm transition-colors text-center">Edit</button>
                  <button onClick={() => handleDelete(ev.id)} className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-clay rounded-lg font-bold text-sm transition-colors text-center">Delete</button>
                </div>
              </div>
            ))}
            {displayEvents.length === 0 && (
              <div className="text-center py-12 text-gray-500 font-medium">No events found.</div>
            )}
          </div>
        </>
      ) : (
        <form onSubmit={handleSave} className="flex flex-col min-h-screen bg-white">
          <div className="bg-ink p-4 flex justify-between items-center sticky top-0 z-10">
            <button type="button" onClick={() => setView('list')} className="text-white flex items-center">
              <span className="text-2xl mr-2">←</span> Back
            </button>
            <h2 className="text-lg font-bold text-white">{editingEvent?.id ? 'Edit Event' : 'New Event'}</h2>
            <div className="w-16"></div>
          </div>

          <div className="p-4 space-y-6 flex-1 bg-gray-50">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="text-sm font-bold text-ink mb-4 border-b border-gray-100 pb-2">Engagement Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Event Title</label>
                  <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg text-ink focus:border-ink outline-none" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Type</label>
                  <select value={form.eventType} onChange={e => setForm({...form, eventType: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg text-ink focus:border-ink outline-none bg-white">
                    <option value="Preaching">Preaching</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Conference">Conference</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Travel">Travel</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Description</label>
                  <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg text-ink focus:border-ink outline-none resize-none"></textarea>
                </div>

                <div className="flex items-center gap-3">
                  <input type="checkbox" id="travel" checked={form.isTravel} onChange={e => setForm({...form, isTravel: e.target.checked})} className="w-5 h-5" />
                  <label htmlFor="travel" className="text-sm font-bold text-ink">Requires Travel / Out of Station</label>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="text-sm font-bold text-ink mb-4 border-b border-gray-100 pb-2">Scheduling & Location</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Date</label>
                  <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg text-ink focus:border-ink outline-none" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Start Time</label>
                    <input type="text" placeholder="09:00 AM" required value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg text-ink focus:border-ink outline-none" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-ink-soft uppercase mb-1">End Time</label>
                    <input type="text" placeholder="01:00 PM" required value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg text-ink focus:border-ink outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Venue / Host Church</label>
                  <input type="text" value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg text-ink focus:border-ink outline-none" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase mb-1">City / Address</label>
                  <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg text-ink focus:border-ink outline-none" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="text-sm font-bold text-ink mb-4 border-b border-gray-100 pb-2">Contact & Status</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Contact Person</label>
                    <input type="text" value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg text-ink focus:border-ink outline-none" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Phone</label>
                    <input type="text" value={form.contactPhone} onChange={e => setForm({...form, contactPhone: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg text-ink focus:border-ink outline-none" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg text-ink focus:border-ink outline-none bg-white">
                    <option value="Confirmed">Confirmed</option>
                    <option value="Tentative">Tentative</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border-t border-gray-200">
            <button type="submit" disabled={saving} className="w-full bg-ink text-white font-bold py-4 rounded-xl">
              {saving ? 'Saving...' : 'Save Pastor Event'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
