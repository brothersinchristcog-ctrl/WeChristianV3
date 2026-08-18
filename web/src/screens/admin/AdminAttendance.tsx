"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, deleteDoc, setDoc, query, orderBy, onSnapshot } from 'firebase/firestore';

export default function AdminAttendancePage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [churchId, setChurchId] = useState<string>('');
  
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [editingSession, setEditingSession] = useState<any>(null);
  
  const [message, setMessage] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('Active');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && userDoc.data().primaryChurchId) {
        const cid = userDoc.data().primaryChurchId;
        setChurchId(cid);

        const q = query(collection(db, 'churches', cid, 'attendanceRequests'), orderBy('createdAt', 'desc'));
        onSnapshot(q, (snap) => {
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
          setSessions(data);
          setLoading(false);
        });
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleEdit = (session: any) => {
    setEditingSession(session);
    if (session) {
      setTitle(session.title || '');
      setDate(session.date || '');
      setStatus(session.status || 'Active');
    } else {
      setTitle('Sunday Service');
      setDate(new Date().toISOString().split('T')[0]);
      setStatus('Active');
    }
    setView('edit');
  };

  const handleDelete = async (id: string) => {
    if (!churchId) return;
    if (!window.confirm("Are you sure you want to delete this attendance session?")) return;
    try {
      await deleteDoc(doc(db, 'churches', churchId, 'attendanceRequests', id));
      setMessage('Session deleted successfully.');
    } catch (e) {
      console.error(e);
      setMessage('Failed to delete session.');
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
        date,
        status,
        updatedAt: new Date().toISOString()
      };

      if (editingSession?.id) {
        await setDoc(doc(db, 'churches', churchId, 'attendanceRequests', editingSession.id), payload, { merge: true });
      } else {
        const newRef = doc(collection(db, 'churches', churchId, 'attendanceRequests'));
        await setDoc(newRef, { ...payload, id: newRef.id, createdAt: new Date().toISOString() });
      }

      setView('list');
      setMessage('Attendance session saved successfully.');
    } catch (e) {
      console.error(e);
      setMessage('Failed to save session.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && view === 'list') {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      {message && (
        <div className="p-4 rounded-xl text-sm font-medium bg-green-50 text-green-700 border border-green-200 flex justify-between items-center">
          {message}
          <button onClick={() => setMessage('')} className="text-green-500 hover:text-green-700">&times;</button>
        </div>
      )}

      {view === 'list' ? (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Attendance Tracking</h1>
              <p className="text-gray-500 text-sm mt-1">Manage attendance requests and history</p>
            </div>
            <button onClick={() => handleEdit(null)} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold shadow-sm transition-colors flex items-center gap-2">
              <span>+</span> New Request
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Event Type</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Date</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.map(session => (
                  <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-gray-900">{session.title}</td>
                    <td className="p-4 text-gray-600">{session.date}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${session.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-3">
                      <button onClick={() => handleEdit(session)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
                      <button onClick={() => handleDelete(session.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                    </td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-gray-500">No attendance requests found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900">{editingSession?.id ? 'Edit Attendance Session' : 'New Attendance Request'}</h2>
            <button type="button" onClick={() => setView('list')} className="text-gray-500 hover:text-gray-700 text-sm font-semibold">Back to List</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Event Type</label>
              <select value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-white">
                <option value="Sunday Service">Sunday Service</option>
                <option value="Bible Study">Bible Study</option>
                <option value="Women's Fasting Prayer">Women's Fasting Prayer</option>
                <option value="Youth Event">Youth Event</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Date</label>
              <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-white">
                <option value="Active">Active (Accepting Check-ins)</option>
                <option value="Expired">Expired (Closed)</option>
              </select>
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3 border-t border-gray-100">
            <button type="button" onClick={() => setView('list')} className="px-6 py-2.5 text-gray-700 font-bold hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-8 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Session'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
