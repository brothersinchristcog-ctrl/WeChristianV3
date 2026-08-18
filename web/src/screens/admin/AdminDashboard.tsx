"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [churchName, setChurchName] = useState<string>('Loading...');
  const [churchId, setChurchId] = useState<string>('');
  const [stats, setStats] = useState({
    members: 0,
    events: 0,
    sermons: 0,
    prayers: 0
  });

  useEffect(() => {
    const fetchAdminData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists() && userDoc.data().primaryChurchId) {
          const cid = userDoc.data().primaryChurchId;
          setChurchId(cid);

          const churchDoc = await getDoc(doc(db, 'churches', cid));
          if (churchDoc.exists()) {
            setChurchName(churchDoc.data().name);
          }

          // Fetch basic stats
          const membersSnap = await getDocs(collection(db, 'churches', cid, 'members'));
          const eventsSnap = await getDocs(collection(db, 'churches', cid, 'events'));
          const sermonsSnap = await getDocs(collection(db, 'churches', cid, 'sermons'));
          const prayersSnap = await getDocs(collection(db, 'churches', cid, 'prayerRequests'));

          setStats({
            members: membersSnap.size,
            events: eventsSnap.size,
            sermons: sermonsSnap.size,
            prayers: prayersSnap.size
          });
        }
      } catch (err) {
        console.error("Error fetching admin data:", err);
      }
    };

    fetchAdminData();
  }, []);

  const adminModules = [
    { name: 'Members', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', href: '/dashboard/admin/members', color: 'bg-purple-100 text-purple-700' },
    { name: 'Events', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', href: '/dashboard/admin/events', color: 'bg-pink-100 text-pink-700' },
    { name: 'Sermons', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', href: '/dashboard/admin/sermons', color: 'bg-teal-100 text-teal-700' },
    { name: 'Songs', icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3', href: '/dashboard/admin/songs', color: 'bg-blue-100 text-blue-700' },
    { name: 'Promises', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', href: '/dashboard/admin/promises', color: 'bg-amber-100 text-amber-700' },
    { name: 'Celebrations', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', href: '/dashboard/admin/celebrations', color: 'bg-rose-100 text-rose-700' },
    { name: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', href: '/dashboard/admin/notifications', color: 'bg-indigo-100 text-indigo-700' },
    { name: 'Church Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', href: '/dashboard/admin/settings', color: 'bg-gray-100 text-gray-700' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
        <div className="p-8 relative z-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-500 font-medium">Manage {churchName}</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-blue-600 mb-1">{stats.members}</span>
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Members</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-pink-600 mb-1">{stats.events}</span>
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Events</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-teal-600 mb-1">{stats.sermons}</span>
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Sermons</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-amber-600 mb-1">{stats.prayers}</span>
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Prayers</span>
        </div>
      </div>

      {/* Admin Modules Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {adminModules.map((module) => (
          <Link 
            href={module.href} 
            key={module.name}
            className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1 flex flex-col items-start"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${module.color}`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={module.icon} />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{module.name}</h3>
          </Link>
        ))}
      </div>
    </div>
  );
}
