"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [churchName, setChurchName] = useState<string>('Loading...');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
        setProfile({ ...data, email: currentUser.email, phoneNumber: currentUser.phoneNumber });
        
        if (data.primaryChurchId) {
          const churchDoc = await getDoc(doc(db, 'churches', data.primaryChurchId));
          if (churchDoc.exists()) {
             setChurchName(churchDoc.data().name || 'Your Church');
          } else {
             setChurchName('Unknown Church');
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div></div>;
  }

  if (!profile) {
    return <div className="p-12 text-center text-gray-500">Could not load profile.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative">
        {/* Header background */}
        <div className="h-32 bg-gradient-to-r from-red-500 to-red-600"></div>
        
        <div className="px-8 pb-8">
          {/* Avatar */}
          <div className="-mt-12 mb-4 flex justify-between items-end">
            <div className="w-24 h-24 bg-white rounded-2xl p-1 shadow-md">
              <div className="w-full h-full bg-red-50 rounded-xl flex items-center justify-center text-red-600 text-3xl font-bold uppercase">
                {profile.name ? profile.name.charAt(0) : '?'}
              </div>
            </div>
            
            <button onClick={handleLogout} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-sm transition-colors mb-2">
              Sign Out
            </button>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">{profile.name || 'No Name'}</h1>
            <p className="text-gray-500 font-medium mt-1">{profile.role || 'Member'}</p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email</p>
              <p className="font-semibold text-gray-900">{profile.email || 'Not provided'}</p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Phone</p>
              <p className="font-semibold text-gray-900">{profile.phoneNumber || profile.phone || 'Not provided'}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Church</p>
              <p className="font-semibold text-gray-900">{churchName}</p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
              <p className="font-semibold text-green-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                Active
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
