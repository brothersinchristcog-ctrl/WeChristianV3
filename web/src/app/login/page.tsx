"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter, useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const churchId = searchParams.get('churchId');
  const churchName = searchParams.get('churchName') || 'Your Church';

  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (!churchId) {
      router.push('/');
    }
  }, [churchId, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'submit-button', {
        'size': 'invisible',
      });
    }

    // Cleanup for React 18 Strict Mode
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
    };
  }, []);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+91${formattedPhone.replace(/^0+/, '')}`;
      }

      // Try to find the user's name
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('phone', '==', formattedPhone));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const uData = querySnapshot.docs[0].data();
          if (uData.name) {
            setUserName(uData.name);
          }
        }
      } catch (e) {
        console.warn("Could not fetch user name", e);
      }

      const appVerifier = window.recaptchaVerifier;
      if (!appVerifier) throw new Error("reCAPTCHA not initialized");
      
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setIsCodeSent(true);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later or use a test phone number.');
      } else {
        setError(err.message || 'Failed to send verification code. Check Firebase console settings.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!confirmationResult) throw new Error("No confirmation result available.");
      
      const result = await confirmationResult.confirm(verificationCode);
      const user = result.user;
      
      if (!churchId) throw new Error("Church ID missing.");

      // Check if user exists in users collection (mobile app uses 'users')
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      let currentName = user.phoneNumber;

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          phone: user.phoneNumber,
          createdAt: new Date(),
          primaryChurchId: churchId,
          role: 'member'
        });
      } else {
        const userData = userDoc.data();
        if (userData.name) {
          currentName = userData.name;
        }
        if (userData.primaryChurchId !== churchId) {
           await setDoc(userDocRef, {
             primaryChurchId: churchId
           }, { merge: true });
        }
      }

      // Add to church members
      const churchMemberRef = doc(db, 'churches', churchId, 'members', user.uid);
      await setDoc(churchMemberRef, {
        id: user.uid,
        name: currentName, 
        phone: user.phoneNumber,
        role: 'member',
        status: 'active',
        createdAt: new Date()
      }, { merge: true });

      router.push('/dashboard');

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen gradient-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-400 opacity-20 rounded-full blur-3xl"></div>
      
      <div className="glass-panel w-full max-w-md rounded-3xl p-8 z-10 relative shadow-2xl border border-white/20 animate-fade-in">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight mb-2">WeChristian</h1>
          <p className="text-blue-800/80 font-medium">Join <span className="font-bold text-blue-900">{churchName}</span></p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-xl text-sm text-center font-medium shadow-sm animate-shake">
            {error}
          </div>
        )}

        {!isCodeSent ? (
          <form onSubmit={handleSendCode} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold tracking-wider text-blue-900 uppercase">
                Phone Number
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-gray-500 font-semibold border-r border-gray-300 pr-3 py-1">
                  +91
                </div>
                <input 
                  type="tel"
                  placeholder="Enter your phone number"
                  className="w-full bg-white/60 border border-white/50 rounded-xl py-4 pl-16 pr-4 text-gray-800 font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  disabled={loading}
                  maxLength={10}
                  required
                />
              </div>
            </div>

            <button 
              id="submit-button"
              type="submit"
              disabled={loading || phoneNumber.length < 10}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex justify-center items-center gap-2"
            >
              <span>{loading ? 'Sending Code...' : 'Secure Login'}</span>
              {!loading && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-6 animate-fade-in">
             <div className="space-y-2 text-center">
              {userName && (
                <div className="mb-4">
                  <span className="inline-block bg-blue-100 text-blue-800 text-sm font-bold px-4 py-1.5 rounded-full shadow-sm">
                    Welcome back, {userName}!
                  </span>
                </div>
              )}
              <label className="block text-sm font-bold tracking-wider text-blue-900 uppercase">
                Verification Code
              </label>
              <p className="text-xs text-blue-800/70 mb-4">
                We sent a 6-digit code to +91 {phoneNumber}
              </p>
              <input 
                type="text"
                placeholder="------"
                className="w-full bg-white/60 border border-white/50 rounded-xl py-4 px-4 text-center text-2xl tracking-widest text-gray-800 font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={loading}
                maxLength={6}
                required
              />
            </div>

            <button 
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex justify-center items-center gap-2"
            >
              <span>{loading ? 'Verifying...' : 'Confirm'}</span>
            </button>
            <div className="text-center mt-4">
              <button 
                type="button" 
                className="text-sm font-semibold text-blue-700 hover:text-blue-900 transition-colors"
                onClick={() => {
                  setIsCodeSent(false);
                  setVerificationCode('');
                  setError('');
                }}
              >
                Change Phone Number
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 text-center text-xs text-blue-800/60">
          By logging in, you agree to the Terms of Service
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen gradient-bg flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div></div>}>
      <LoginForm />
    </Suspense>
  );
}
