"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [churchName, setChurchName] = useState<string>('Loading...');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            
            // Check global admin
            if (['admin', 'super_admin', 'Admin', 'Super Admin'].includes(data.userType)) {
              setIsAdmin(true);
            }

            if (data.primaryChurchId) {
              const churchId = data.primaryChurchId;
              const churchDoc = await getDoc(doc(db, 'churches', churchId));
              if (churchDoc.exists()) {
                setChurchName(churchDoc.data().name);
              }
              
              // Check church admin
              const memberDoc = await getDoc(doc(db, 'churches', churchId, 'members', currentUser.uid));
              if (memberDoc.exists()) {
                const mData = memberDoc.data();
                // If the user's name isn't set globally, try member doc
                if (!data.name && mData.name) {
                   setUserData((prev: any) => ({ ...prev, name: mData.name }));
                }
                if (['admin', 'super_admin', 'Admin', 'Super Admin'].includes(mData.userType) || ['admin', 'super_admin', 'Admin', 'Super Admin'].includes(mData.role)) {
                  setIsAdmin(true);
                }
              }
            }
          }
        } catch (error) {
          console.error("Error fetching user role", error);
        }
      } else {
        router.push('/');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  const memberLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { name: 'Events', href: '/dashboard/events', icon: '📅' },
    { name: 'Bible', href: '/dashboard/bible', icon: '📖' },
    { name: 'Sermons', href: '/dashboard/sermons', icon: '🎧' },
    { name: 'Songs', href: '/dashboard/songs', icon: '🎵' },
    { name: 'Prayer Wall', href: '/dashboard/prayer', icon: '🙏' },
    { name: 'Notes', href: '/dashboard/notes', icon: '📝' },
    { name: 'Giving', href: '/dashboard/giving', icon: '💝' },
    { name: 'About Us', href: '/dashboard/about', icon: '🏛️' },
    { name: 'Profile', href: '/dashboard/profile', icon: '👤' },
  ];

  const adminLinks = [
    { name: 'Sermons', href: '/dashboard/admin/sermons', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
    { name: 'Prayers', href: '/dashboard/admin/prayers', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
    { name: 'Notifications', href: '/dashboard/admin/notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { name: 'Finance', href: '/dashboard/admin/finance', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'Donations', href: '/dashboard/admin/donations', icon: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-3 4h6' },
    { name: 'Church Settings', href: '/dashboard/admin/settings', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white font-bold text-lg">W</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 truncate">{churchName}</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-4 space-y-1">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4 px-2">Member Portal</div>
            {memberLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href}
                className={`flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-colors ${
                  pathname === link.href ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {link.icon.length <= 4 ? (
                  <span className={`mr-4 text-xl ${pathname === link.href ? 'opacity-100' : 'opacity-50 grayscale'}`}>{link.icon}</span>
                ) : (
                  <svg className={`mr-4 h-6 w-6 ${pathname === link.href ? 'text-blue-700' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                  </svg>
                )}
                {link.name}
              </Link>
            ))}

            {isAdmin && (
              <>
                <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-8 px-2">Admin Portal</div>
                {adminLinks.map((link) => (
                  <Link 
                    key={link.name} 
                    href={link.href}
                    className={`flex items-center px-4 py-3 text-base font-medium rounded-xl transition-colors ${
                      pathname === link.href || pathname.startsWith(link.href + '/') ? 'bg-blue-900 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {link.icon.length <= 4 ? (
                      <span className={`mr-4 text-xl ${pathname === link.href || pathname.startsWith(link.href + '/') ? 'opacity-100' : 'opacity-50 grayscale'}`}>{link.icon}</span>
                    ) : (
                      <svg className={`mr-4 h-6 w-6 ${pathname === link.href || pathname.startsWith(link.href + '/') ? 'text-white' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                      </svg>
                    )}
                    {link.name}
                  </Link>
                ))}
              </>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <span className="text-blue-700 font-bold text-sm">
                {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-gray-900 truncate">
                {userData?.name || 'User'}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {user?.phoneNumber}
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-4">
          <div className="flex items-center">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900 truncate">{churchName}</h1>
          </div>
          <button className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
            <span className="sr-only">Open sidebar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
          {children}
        </div>
      </main>
    </div>
  );
}
