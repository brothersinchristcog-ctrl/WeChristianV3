"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ChurchCodePage() {
  const router = useRouter();
  const [churchCode, setChurchCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerifyChurch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const trimmedCode = churchCode.trim().toLowerCase();

    if (trimmedCode.length < 4) {
      setError('Please enter a valid Church Code.');
      setLoading(false);
      return;
    }

    try {
      // Find church by subdomain
      const churchesRef = collection(db, 'churches');
      const q = query(churchesRef, where('subdomain', '==', trimmedCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('No church found with that code. Please check and try again.');
        setLoading(false);
        return;
      }

      // Found the church
      const churchDoc = querySnapshot.docs[0];
      const churchId = churchDoc.id;
      const churchName = churchDoc.data().name || 'Your Church';

      // Store church info in sessionStorage or pass via URL
      // Using URL params is cleaner for simple passing before auth
      router.push(`/login?churchId=${churchId}&churchName=${encodeURIComponent(churchName)}`);

    } catch (err: any) {
      console.error(err);
      setError('Something went wrong checking the network. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen gradient-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
      
      <div className="glass-panel w-full max-w-md rounded-3xl p-10 z-10 relative animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-blue-900 mb-2">WeChristian</h1>
          <p className="text-blue-800/80 font-medium">Enter your Church Code to continue</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-xl text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleVerifyChurch} className="space-y-6">
          <div>
            <label className="block text-sm font-bold tracking-wider text-blue-900 mb-2 uppercase">
              Church Code
            </label>
            <input 
              type="text"
              placeholder="e.g. COGBLR"
              className="w-full bg-white/60 border border-white/50 rounded-xl py-4 px-4 text-gray-800 font-bold uppercase placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
              value={churchCode}
              onChange={(e) => setChurchCode(e.target.value.toUpperCase())}
              disabled={loading}
              maxLength={12}
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading || churchCode.trim().length < 4}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex justify-center items-center gap-2"
          >
            <span>{loading ? 'Finding Church...' : 'Next'}</span>
            {!loading && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
