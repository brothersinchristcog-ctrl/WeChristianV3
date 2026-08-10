"use client";
import React, { useState, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Home() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Setup reCAPTCHA when component mounts
  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {
          // reCAPTCHA solved
        }
      });
    }
  }, []);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Ensure number has country code. Assuming India for now based on UI (+91)
      let formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+91${formattedPhone.replace(/^0+/, '')}`; // default to +91 if none provided
      }

      const appVerifier = window.recaptchaVerifier;
      if (!appVerifier) throw new Error("reCAPTCHA not initialized");

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setIsCodeSent(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send verification code. Check Firebase console settings.');
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
      
      alert(`Success! Logged in as ${user.uid}`);
      // In a real app, you would redirect to the dashboard here
      // window.location.href = '/dashboard';

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen gradient-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Circles */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-400 opacity-20 rounded-full blur-3xl"></div>
      
      {/* reCAPTCHA Container */}
      <div id="recaptcha-container"></div>

      {/* Login Card */}
      <div className="glass-panel w-full max-w-md rounded-3xl p-10 z-10 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-3xl flex items-center justify-center z-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-blue-900 mb-2 tracking-tight">WeChristian</h1>
          <p className="text-blue-800/80 font-medium text-lg">Church Administration Portal</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        {!isCodeSent ? (
          <form onSubmit={handleSendCode} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-2">Phone Number</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">+91</span>
                <input 
                  type="tel"
                  placeholder="Enter your phone number"
                  className="w-full bg-white/60 border border-white/50 rounded-xl py-4 pl-14 pr-4 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
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
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-2">Verification Code</label>
              <p className="text-xs text-blue-800/60 mb-4 text-center">
                We sent a 6-digit code to {phoneNumber.startsWith('+') ? phoneNumber : `+91 ${phoneNumber}`}
              </p>
              <input 
                type="text"
                maxLength={6}
                placeholder="000000"
                className="w-full bg-white/60 border border-white/50 rounded-xl py-4 px-4 text-center text-2xl tracking-widest font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
                required
              />
            </div>

            <button 
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex justify-center items-center gap-2"
            >
              <span>{loading ? 'Verifying...' : 'Verify & Continue'}</span>
            </button>

            <button 
              type="button"
              onClick={() => {
                setIsCodeSent(false);
                setVerificationCode('');
                setError('');
              }}
              className="w-full text-blue-800/80 text-sm font-semibold hover:underline"
            >
              Use a different phone number
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-sm text-blue-800/70">
          <p>By logging in, you agree to the Terms of Service</p>
        </div>
      </div>
      
      {/* Footer Branding */}
      <div className="absolute bottom-6 text-white/50 text-sm font-medium tracking-wider">
        POWERED BY BROTHERS IN CHRIST
      </div>
    </main>
  );
}

// Global declaration for reCAPTCHA
declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}
