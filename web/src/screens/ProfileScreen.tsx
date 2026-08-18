"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mailingStreet: '',
    mailingCity: '',
    mailingState: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfile({ ...data, authEmail: currentUser.email, phoneNumber: currentUser.phoneNumber });
        setForm({
          firstName: data.firstName || (data.name ? data.name.split(' ')[0] : ''),
          lastName: data.lastName || (data.name ? data.name.split(' ').slice(1).join(' ') : ''),
          email: data.email || currentUser.email || '',
          mailingStreet: data.mailingStreet || '',
          mailingCity: data.mailingCity || '',
          mailingState: data.mailingState || ''
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    try {
      const fullName = `${form.firstName} ${form.lastName}`.trim();
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        ...form,
        name: fullName
      });
      if (profile.primaryChurchId && profile.memberId) {
        await updateDoc(doc(db, 'churches', profile.primaryChurchId, 'members', profile.memberId), {
          ...form,
          name: fullName
        });
      }
      setProfile({ ...profile, ...form, name: fullName });
      setIsEditing(false);
      alert('Profile updated successfully');
    } catch (error) {
      console.error(error);
      alert('Failed to update profile');
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink"></div>
      </div>
    );
  }

  if (!profile) {
    return <div className="p-12 text-center text-gray-500">Could not load profile.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto w-full bg-gray-50 min-h-screen shadow-2xl relative flex flex-col pb-12">
      {/* Header */}
      <div className="bg-ink p-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <h2 className="text-white font-bold text-lg">My Profile</h2>
      </div>

      <div className="p-4 space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-rule flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-parchment flex items-center justify-center border-2 border-rule">
            <span className="text-2xl font-bold text-ink">{profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink mb-1">{profile.name || 'Unknown'}</h2>
            <p className="text-xs text-ink-soft mb-1 font-medium">{profile.phoneNumber || profile.phone || 'No phone number'}</p>
            <div className="flex gap-2 mt-1">
              <span className="bg-gold-light text-gold-deep px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-gold-deep/20">
                {profile.role || 'MEMBER'}
              </span>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-rule overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-rule flex justify-between items-center">
            <div className="flex items-center gap-2 text-ink">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              <span className="font-bold text-sm tracking-wide">Personal Info</span>
            </div>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="text-gold-deep text-xs font-bold uppercase tracking-wider bg-gold-light px-3 py-1 rounded-lg">Edit</button>
            ) : (
              <button onClick={() => setIsEditing(false)} className="text-gray-500 text-xs font-bold uppercase tracking-wider hover:text-gray-700">Cancel</button>
            )}
          </div>
          
          <div className="p-4">
            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">First Name</label>
                    <input type="text" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} className="w-full border border-rule rounded-lg p-2.5 text-sm text-ink outline-none focus:border-ink" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Last Name</label>
                    <input type="text" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} className="w-full border border-rule rounded-lg p-2.5 text-sm text-ink outline-none focus:border-ink" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border border-rule rounded-lg p-2.5 text-sm text-ink outline-none focus:border-ink" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Street Address</label>
                  <input type="text" value={form.mailingStreet} onChange={e => setForm({...form, mailingStreet: e.target.value})} className="w-full border border-rule rounded-lg p-2.5 text-sm text-ink outline-none focus:border-ink" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">City</label>
                    <input type="text" value={form.mailingCity} onChange={e => setForm({...form, mailingCity: e.target.value})} className="w-full border border-rule rounded-lg p-2.5 text-sm text-ink outline-none focus:border-ink" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">State</label>
                    <input type="text" value={form.mailingState} onChange={e => setForm({...form, mailingState: e.target.value})} className="w-full border border-rule rounded-lg p-2.5 text-sm text-ink outline-none focus:border-ink" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-ink text-white font-bold py-3 rounded-xl shadow-sm text-sm mt-2">Save Changes</button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">First Name</p>
                    <p className="font-semibold text-ink text-sm">{form.firstName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Last Name</p>
                    <p className="font-semibold text-ink text-sm">{form.lastName || '-'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Email</p>
                  <p className="font-semibold text-ink text-sm">{form.email || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Address</p>
                  <p className="font-semibold text-ink text-sm">{[form.mailingStreet, form.mailingCity, form.mailingState].filter(Boolean).join(', ') || '-'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-2xl shadow-sm border border-rule overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-rule flex items-center gap-2 text-ink">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="font-bold text-sm tracking-wide">Preferences</span>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <div>
                <p className="font-bold text-ink text-sm">App Language</p>
                <p className="text-[10px] text-gray-400">English</p>
              </div>
              <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <div>
                <p className="font-bold text-ink text-sm">Notifications</p>
                <p className="text-[10px] text-gray-400">Configure alerts</p>
              </div>
              <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-ink text-sm">Dark Mode</p>
                <p className="text-[10px] text-gray-400">Off</p>
              </div>
              <div className="w-10 h-6 bg-gray-200 rounded-full">
                <div className="w-5 h-5 bg-white rounded-full m-0.5 shadow-sm"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <button onClick={handleLogout} className="w-full bg-red-50 border border-red-100 text-red-600 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Sign Out
        </button>
      </div>
    </div>
  );
}
