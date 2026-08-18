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
    { name: 'Promises', href: '/dashboard/admin/promises', icon: '🌅' },
    { name: 'Sermons', href: '/dashboard/admin/sermons', icon: '🎧' },
    { name: 'Songs', href: '/dashboard/admin/songs', icon: '🎵' },
    { name: 'Prayers', href: '/dashboard/admin/prayers', icon: '🙏' },
    { name: 'Attendance', href: '/dashboard/admin/attendance', icon: '📋' },
    { name: 'Members', href: '/dashboard/admin/members', icon: '👥' },
    { name: 'Events', href: '/dashboard/admin/events', icon: '📅' },
    { name: 'Pastor Events', href: '/dashboard/admin/pastor-events', icon: '✈️' },
    { name: 'Celebrations', href: '/dashboard/admin/celebrations', icon: '🎂' },
    { name: 'WeCelebrations', href: '/dashboard/admin/wecelebrations', icon: '🎉' },
    { name: 'Notifications', href: '/dashboard/admin/notifications', icon: '🔔' },
    { name: 'WhatsApp Inbox', href: '/dashboard/admin/whatsapp', icon: '💬' },
    { name: 'Finance', href: '/dashboard/admin/finance', icon: '📈' },
    { name: 'Donations', href: '/dashboard/admin/donations', icon: '💝' },
    { name: 'Subscriptions', href: '/dashboard/admin/subscriptions', icon: '💳' },
    { name: 'About Us', href: '/dashboard/admin/about-us', icon: '🏛️' },
    { name: 'Contact Us', href: '/dashboard/admin/contact-us', icon: '📞' },
    { name: 'Church Settings', href: '/dashboard/admin/settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-ink text-white flex-shrink-0 flex flex-col hidden md:flex border-r border-ink-2 shadow-sm">
        <div className="h-16 flex items-center px-6 border-b border-white/10 bg-ink-2">
          <div className="w-8 h-8 bg-gold-bright rounded flex items-center justify-center mr-3">
            <span className="text-ink font-bold text-lg">W</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight truncate">{churchName}</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-3 space-y-1">
            <div className="text-xs font-bold text-ink-soft uppercase tracking-wider mb-2 mt-4 px-3">Member Portal</div>
            {memberLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  pathname === link.href ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                {link.icon.length <= 4 ? (
                  <span className={`mr-3 text-lg ${pathname === link.href ? 'opacity-100' : 'opacity-60'}`}>{link.icon}</span>
                ) : (
                  <svg className={`mr-3 h-5 w-5 ${pathname === link.href ? 'text-white' : 'text-white/60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                  </svg>
                )}
                {link.name}
              </Link>
            ))}

            {isAdmin && (
              <>
                <div className="text-xs font-bold text-gold-bright uppercase tracking-wider mb-2 mt-8 px-3">Admin Portal</div>
                {adminLinks.map((link) => (
                  <Link 
                    key={link.name} 
                    href={link.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      pathname === link.href || pathname.startsWith(link.href + '/') ? 'bg-gold-bright text-ink font-bold' : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {link.icon.length <= 4 ? (
                      <span className={`mr-3 text-lg ${pathname === link.href || pathname.startsWith(link.href + '/') ? 'opacity-100' : 'opacity-60'}`}>{link.icon}</span>
                    ) : (
                      <svg className={`mr-3 h-5 w-5 ${pathname === link.href || pathname.startsWith(link.href + '/') ? 'text-ink' : 'text-white/60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

        <div className="p-4 border-t border-white/10 bg-ink-2">
          <div className="flex items-center mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3 border border-white/10">
              <span className="text-white font-bold text-sm">
                {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white truncate">
                {userData?.name || 'User'}
              </div>
              <div className="text-xs text-white/50 truncate">
                {user?.phoneNumber}
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 rounded-lg text-sm font-bold text-white bg-clay hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50">
        {/* Mobile Header */}
        <header className="md:hidden bg-ink shadow-sm border-b border-white/10 h-16 flex items-center justify-between px-4">
          <div className="flex items-center">
             <div className="w-8 h-8 bg-gold-bright rounded flex items-center justify-center mr-3 shadow-sm">
              <span className="text-ink font-bold text-lg">W</span>
            </div>
            <h1 className="text-lg font-bold text-white truncate">{churchName}</h1>
          </div>
          <button className="p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 focus:outline-none">
            <span className="sr-only">Open sidebar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
