"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function AdminContactUsEditorPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [churchId, setChurchId] = useState<string>('');
  const [message, setMessage] = useState('');

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [mapUrl, setMapUrl] = useState('');

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
          setEmail(data.email || '');
          setPhone(data.phone || '');
          setWebsite(data.website || '');
          setAddress(data.address || '');
          setMapUrl(data.mapUrl || '');
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
        email,
        phone,
        website,
        address,
        mapUrl,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setMessage('Contact Us information saved successfully.');
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
        <h1 className="text-2xl font-bold text-gray-900">Contact Us Editor</h1>
        <p className="text-gray-500 text-sm mt-1">Update your church's public contact details.</p>
      </div>

      {message && (
        <div className="p-4 rounded-xl text-sm font-medium bg-green-50 text-green-700 border border-green-200">
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none" />
          </div>
          <div className="col-span-full">
            <label className="block text-sm font-bold text-gray-700 mb-2">Website URL</label>
            <input type="url" value={website} onChange={e => setWebsite(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none" />
          </div>
          <div className="col-span-full">
            <label className="block text-sm font-bold text-gray-700 mb-2">Physical Address</label>
            <textarea value={address} onChange={e => setAddress(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none h-24"></textarea>
          </div>
          <div className="col-span-full">
            <label className="block text-sm font-bold text-gray-700 mb-2">Google Maps Embed URL (Optional)</label>
            <input type="text" value={mapUrl} onChange={e => setMapUrl(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none" />
          </div>
        </div>

        <div className="pt-6 flex justify-end border-t border-gray-100">
          <button type="submit" disabled={saving} className="px-8 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
