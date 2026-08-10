"use client";
import React, { useState } from 'react';

export default function Home() {
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Attempting login for ${phoneNumber}. Firebase Auth setup is required!`);
  };

  return (
    <main className="min-h-screen gradient-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Circles */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-400 opacity-20 rounded-full blur-3xl"></div>
      
      {/* Login Card */}
      <div className="glass-panel w-full max-w-md rounded-3xl p-10 z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-blue-900 mb-2 tracking-tight">WeChristian</h1>
          <p className="text-blue-800/80 font-medium text-lg">Church Administration Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
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
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex justify-center items-center gap-2"
          >
            <span>Secure Login</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </form>

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
