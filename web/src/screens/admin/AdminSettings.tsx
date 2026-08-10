"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [churchId, setChurchId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'info' | 'branding' | 'giving' | 'integrations'>('info');
  const [isEditing, setIsEditing] = useState(false);
  
  const [form, setForm] = useState<any>({});
  const [secrets, setSecrets] = useState<any>({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists() && userDoc.data().primaryChurchId) {
          const cid = userDoc.data().primaryChurchId;
          setChurchId(cid);

          const churchDoc = await getDoc(doc(db, 'churches', cid));
          if (churchDoc.exists()) setForm(churchDoc.data());

          const secretsDoc = await getDoc(doc(db, 'churches', cid, 'private', 'secrets'));
          if (secretsDoc.exists()) setSecrets(secretsDoc.data());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const updateField = (section: string, field: string, value: any) => {
    setForm((prev: any) => {
      const newForm = { ...prev };
      if (['name', 'tagline', 'contactEmail', 'contactPhone', 'address', 'aboutUs'].includes(section)) {
        newForm[section] = value;
      } else {
        newForm[section] = { ...(newForm[section] || {}), [field]: value };
      }
      return newForm;
    });
  };

  const updateSecret = (field: string, value: any) => {
    setSecrets((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!churchId) return;
    setSaving(true);
    setMessage('');
    try {
      await setDoc(doc(db, 'churches', churchId), form, { merge: true });
      await setDoc(doc(db, 'churches', churchId, 'private', 'secrets'), secrets, { merge: true });
      setMessage('Settings saved successfully!');
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      setMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  const primaryColor = form.theme?.primaryColor || '#1a2d5a';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Church Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage church info, branding & APIs</p>
        </div>
        {isEditing ? (
          <button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow-sm transition-colors flex items-center">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        ) : (
          <button onClick={() => setIsEditing(true)} className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-semibold shadow-sm transition-colors">
            Edit
          </button>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${message.includes('Success') || message.includes('successfully') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
        {['info', 'branding', 'giving', 'integrations'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === tab ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
        {!isEditing && <div className="bg-yellow-50 text-yellow-800 text-sm font-medium p-4 rounded-xl mb-8 border border-yellow-200 text-center">Click 'Edit' in the top right to make changes.</div>}
        
        {activeTab === 'info' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Church Name</label>
                <input type="text" value={form.name || ''} onChange={e => updateField('name', '', e.target.value)} disabled={!isEditing} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tagline</label>
                <input type="text" value={form.tagline || ''} onChange={e => updateField('tagline', '', e.target.value)} disabled={!isEditing} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Address</label>
              <textarea value={form.address || ''} onChange={e => updateField('address', '', e.target.value)} disabled={!isEditing} rows={2} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"></textarea>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">About Us</label>
              <textarea value={form.aboutUs || ''} onChange={e => updateField('aboutUs', '', e.target.value)} disabled={!isEditing} rows={4} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contact Phone</label>
                <input type="text" value={form.contactPhone || ''} onChange={e => updateField('contactPhone', '', e.target.value)} disabled={!isEditing} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contact Email</label>
                <input type="text" value={form.contactEmail || ''} onChange={e => updateField('contactEmail', '', e.target.value)} disabled={!isEditing} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70" />
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 pt-6">Social Links</h3>
            {['website', 'youtube', 'facebook', 'instagram'].map(platform => (
              <div key={platform} className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
                <span className="w-24 text-sm font-bold text-gray-500 capitalize">{platform}</span>
                <input type="text" value={form.socialLinks?.[platform] || ''} onChange={e => updateField('socialLinks', platform, e.target.value)} disabled={!isEditing} placeholder={`https://${platform}.com/...`} className="flex-1 bg-transparent border-none py-2 text-gray-900 font-semibold focus:outline-none disabled:opacity-70" />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'branding' && (
          <div className="space-y-8">
            <div>
               <label className="block text-sm font-bold text-gray-900 mb-4">Primary Brand Color</label>
               <div className="flex flex-wrap gap-4">
                 {['#1a2d5a', '#c0392b', '#16a34a', '#7c3aed', '#b45309', '#0891b2', '#be185d', '#334155'].map(c => (
                   <button
                     key={c}
                     disabled={!isEditing}
                     onClick={() => updateField('theme', 'primaryColor', c)}
                     className={`w-12 h-12 rounded-full shadow-sm transition-transform ${form.theme?.primaryColor === c ? 'ring-4 ring-blue-200 scale-110' : 'opacity-80 hover:opacity-100'} ${!isEditing ? 'cursor-not-allowed' : ''}`}
                     style={{ backgroundColor: c }}
                   />
                 ))}
               </div>
            </div>
            
            <div className="pt-6 border-t">
               <h3 className="text-lg font-bold text-gray-900 mb-2">Church Logo & Banner</h3>
               <p className="text-sm text-gray-500 mb-4">Web image uploading will be integrated soon. For now, please use the mobile app to upload images.</p>
            </div>
          </div>
        )}

        {activeTab === 'giving' && (
          <div className="space-y-6">
             <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Giving Settings</h3>
             <p className="text-sm text-gray-500">Giving settings and PhonePe configuration are available on the mobile app.</p>
          </div>
        )}
        
        {activeTab === 'integrations' && (
          <div className="space-y-6">
             <h3 className="text-lg font-bold text-gray-900 border-b pb-2">WhatsApp Integration</h3>
             <p className="text-sm text-gray-500">Manage Meta API keys on the mobile app.</p>
          </div>
        )}
      </div>
    </div>
  );
}
