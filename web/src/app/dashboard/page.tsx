"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [churchName, setChurchName] = useState<string>('Loading...');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Load church data
        try {
          const userDoc = await getDoc(doc(db, 'global_users', currentUser.uid));
          if (userDoc.exists() && userDoc.data().primaryChurchId) {
            const churchId = userDoc.data().primaryChurchId;
            const churchDoc = await getDoc(doc(db, 'churches', churchId));
            if (churchDoc.exists()) {
              setChurchName(churchDoc.data().name);
            } else {
              setChurchName('Unknown Church');
            }
          } else {
            router.push('/join');
          }
        } catch (error) {
          console.error("Error fetching church data", error);
        }
      } else {
        router.push('/');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">W</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{churchName}</h1>
              <p className="text-sm text-gray-500">WeChristian Portal</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="text-sm font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center h-64 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to the Dashboard!</h2>
          <p className="text-gray-500">
            You are successfully logged in as {user.phoneNumber}. 
          </p>
          <p className="text-gray-500 mt-2">
            The admin tools will be built here next.
          </p>
        </div>
      </div>
    </main>
  );
}
