"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function AboutPage() {
  const [churchInfo, setChurchInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChurchInfo();
  }, []);

  const fetchChurchInfo = async () => {
    setLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && userDoc.data().primaryChurchId) {
        const cid = userDoc.data().primaryChurchId;
        const churchDoc = await getDoc(doc(db, 'churches', cid));
        if (churchDoc.exists()) {
          setChurchInfo(churchDoc.data());
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      
      {/* About Us Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-50 opacity-50 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
            🏛️
          </div>
          <h1 className="text-4xl font-bold text-gray-900 font-serif mb-4">
            {churchInfo?.name || 'About Our Church'}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {churchInfo?.description || 'We are a community of believers dedicated to worship, fellowship, and serving others.'}
          </p>
        </div>
      </div>

      {/* Vision & Mission */}
      {(churchInfo?.vision || churchInfo?.mission) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {churchInfo?.vision && (
             <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Our Vision</h3>
                <p className="text-gray-600">{churchInfo.vision}</p>
             </div>
          )}
          {churchInfo?.mission && (
             <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Our Mission</h3>
                <p className="text-gray-600">{churchInfo.mission}</p>
             </div>
          )}
        </div>
      )}

      {/* Contact Us */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-slate-50 border-b border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-gray-900">Contact Us</h2>
        </div>
        
        <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          
          <div className="flex flex-col items-center text-center group">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Phone</h3>
            <p className="text-gray-600 font-medium">
              {churchInfo?.contactNumber || churchInfo?.phone || 'Not available'}
            </p>
          </div>

          <div className="flex flex-col items-center text-center group">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Email</h3>
            <p className="text-gray-600 font-medium break-all">
              {churchInfo?.email || 'Not available'}
            </p>
          </div>

          <div className="flex flex-col items-center text-center group">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Address</h3>
            <p className="text-gray-600 text-sm">
              {churchInfo?.address || 'Address not provided'}
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
