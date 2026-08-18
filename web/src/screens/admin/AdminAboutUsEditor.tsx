"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function AdminAboutUsEditorPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [churchId, setChurchId] = useState<string>('');
  const [message, setMessage] = useState('');

  const [vision, setVision] = useState('');
  const [mission, setMission] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchInfo();
  }, []);

  const fetchInfo = async () => {
    setLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && userDoc.data().primaryChurchId) {
        const cid = userDoc.data().primaryChurchId;
        setChurchId(cid);

        const churchDoc = await getDoc(doc(db, 'churches', cid));
        if (churchDoc.exists()) {
          const data = churchDoc.data();
          setVision(data.vision || '');
          setMission(data.mission || '');
          setDescription(data.description || '');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchId) return;
    setSaving(true);
    setMessage('');
    try {
      await setDoc(doc(db, 'churches', churchId), {
        vision,
        mission,
        description,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setMessage('About Us information saved successfully.');
    } catch (e) {
      console.error(e);
      setMessage('Failed to save information.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900">About Us Editor</h1>
        <p className="text-gray-500 text-sm mt-1">Update your church's vision, mission, and description.</p>
      </div>

      {message && (
        <div className="p-4 rounded-xl text-sm font-medium bg-green-50 text-green-700 border border-green-200">
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Church Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none h-32"></textarea>
        </div>
        
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Our Vision</label>
          <textarea value={vision} onChange={e => setVision(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none h-24"></textarea>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Our Mission</label>
          <textarea value={mission} onChange={e => setMission(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none h-24"></textarea>
        </div>

        <div className="pt-6 flex justify-end">
          <button type="submit" disabled={saving} className="px-8 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
