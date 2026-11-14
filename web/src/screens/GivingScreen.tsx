"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const CATEGORIES = [
  { id: 'Tithe', label: 'Tithe', labelTe: 'దశమభాగం', icon: '🙏' },
  { id: 'Offering', label: 'Offering', labelTe: 'కానుక', icon: '🎁' },
  { id: 'Missions', label: 'Missions', labelTe: 'సేవా నిధి', icon: '🌍' },
  { id: 'Building', label: 'Building', labelTe: 'నిర్మాణ నిధి', icon: '🏛️' },
  { id: 'Special', label: 'Special', labelTe: 'ప్రత్యేక కానుక', icon: '✨' },
  { id: 'Sunday School', label: 'Sunday School', labelTe: 'ఆదివారం పాఠశాల', icon: '📖' }
];

const PRESETS = [100, 500, 1000, 5000];

interface ChurchProfile {
  name: string;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branch?: string;
  };
  givingDetails?: {
    upiId: string;
    razorpayLink?: string;
  };
}

export default function GivingPage() {
  const [church, setChurch] = useState<ChurchProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('Tithe');
  const [amount, setAmount] = useState('500');
  const [copiedText, setCopiedText] = useState('');

  useEffect(() => {
    fetchChurchDetails();
  }, []);

  const fetchChurchDetails = async () => {
    setLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && userDoc.data().primaryChurchId) {
        const cid = userDoc.data().primaryChurchId;
        const churchDoc = await getDoc(doc(db, 'churches', cid));
        if (churchDoc.exists()) {
          setChurch(churchDoc.data() as ChurchProfile);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(fieldName);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const handlePayment = () => {
    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    // Mobile handles Razorpay intent here. For Web, we can show an alert or a UPI QR code modal.
    alert('Payment integration is handled via the mobile app. Please use the bank transfer details below for web donations.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full bg-gray-50 min-h-screen shadow-2xl relative flex flex-col pb-12">
      
      {/* Header (Navy) */}
      <div className="bg-ink rounded-b-[40px] px-6 pt-8 pb-10 shadow-lg relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
        <div className="absolute -left-12 top-12 w-40 h-40 bg-gold-deep/10 rounded-full blur-2xl"></div>
        
        <div className="flex justify-between items-center mb-6 relative z-10">
          <button className="text-white font-bold text-sm">‹ Back</button>
        </div>
        
        <div className="flex flex-col items-center justify-center relative z-10 text-center">
          <div className="w-16 h-16 bg-gold-deep/20 rounded-full flex items-center justify-center mb-3 border border-gold-bright/30">
            <svg className="w-8 h-8 text-gold-bright" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h1 className="text-white text-3xl font-extrabold font-serif mb-1 tracking-tight">Give with Joy</h1>
          <h2 className="text-gold-bright text-lg font-bold font-serif mb-3">ఆనందంగా ఇవ్వండి</h2>
          <p className="text-white/80 italic text-sm font-serif">“God loves a cheerful giver” — 2 Cor 9:7</p>
        </div>
      </div>

      <div className="px-4 -mt-4 relative z-20 space-y-5">
        
        {/* Categories Box */}
        <div className="bg-white rounded-2xl shadow-sm border border-rule p-4">
          <p className="text-[10px] font-bold text-ink-soft uppercase tracking-wider mb-3">Select Giving Type</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => {
              const isActive = activeCat === cat.id;
              return (
                <button 
                  key={cat.id} 
                  onClick={() => setActiveCat(cat.id)}
                  className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl border flex-1 min-w-[30%] transition-colors ${
                    isActive ? 'bg-parchment border-gold-bright' : 'bg-gray-50 border-rule'
                  }`}
                >
                  <span className="text-xl mb-1">{cat.icon}</span>
                  <span className={`text-[10px] font-bold ${isActive ? 'text-ink' : 'text-gray-600'}`}>{cat.label}</span>
                  <span className={`text-[9px] ${isActive ? 'text-ink-soft' : 'text-gray-400'}`}>{cat.labelTe}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount Box */}
        <div className="bg-white rounded-2xl shadow-sm border border-rule p-5 text-center">
          <p className="text-[10px] font-bold text-ink-soft uppercase tracking-wider mb-4">Enter Amount (₹)</p>
          
          <div className="flex justify-center items-center mb-6">
            <span className="text-3xl font-bold text-gray-400 mr-2">₹</span>
            <input 
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-5xl font-extrabold text-ink w-40 text-center outline-none bg-transparent"
              placeholder="0"
            />
          </div>

          <div className="flex justify-center gap-3 mb-6">
            {PRESETS.map(preset => (
              <button 
                key={preset}
                onClick={() => setAmount(preset.toString())}
                className="bg-gray-50 border border-rule px-4 py-2 rounded-full text-sm font-bold text-gray-700 active:bg-gray-100 transition-colors"
              >
                ₹{preset}
              </button>
            ))}
          </div>

          <button 
            onClick={handlePayment}
            className="w-full bg-ink text-white font-bold py-4 rounded-xl shadow-md text-lg active:bg-ink-light flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Proceed to Give
          </button>
          
          <div className="flex items-center justify-center mt-4 text-xs font-bold text-gray-400 gap-1 uppercase">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            100% Secure & Encrypted
          </div>
        </div>

        {/* Bank Transfer Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-rule overflow-hidden">
          <div className="bg-gray-50 p-4 border-b border-rule flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white border border-rule flex items-center justify-center text-ink shadow-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
            </div>
            <span className="font-bold text-ink">Bank Transfer Details</span>
          </div>
          
          <div className="p-4 space-y-4">
            {church?.bankDetails ? (
              <>
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Account Name</p>
                    <p className="font-bold text-ink text-sm">{church.bankDetails.accountName}</p>
                  </div>
                  <button onClick={() => handleCopy(church.bankDetails!.accountName, 'Name')} className="text-gold-deep text-xs font-bold bg-gold-light px-3 py-1.5 rounded-lg">
                    {copiedText === 'Name' ? 'COPIED' : 'COPY'}
                  </button>
                </div>
                
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Account Number</p>
                    <p className="font-mono font-bold text-ink text-sm">{church.bankDetails.accountNumber}</p>
                  </div>
                  <button onClick={() => handleCopy(church.bankDetails!.accountNumber, 'Account')} className="text-gold-deep text-xs font-bold bg-gold-light px-3 py-1.5 rounded-lg">
                    {copiedText === 'Account' ? 'COPIED' : 'COPY'}
                  </button>
                </div>
                
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">IFSC Code</p>
                    <p className="font-mono font-bold text-ink text-sm">{church.bankDetails.ifscCode}</p>
                  </div>
                  <button onClick={() => handleCopy(church.bankDetails!.ifscCode, 'IFSC')} className="text-gold-deep text-xs font-bold bg-gold-light px-3 py-1.5 rounded-lg">
                    {copiedText === 'IFSC' ? 'COPIED' : 'COPY'}
                  </button>
                </div>
                
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Bank Name & Branch</p>
                  <p className="font-bold text-ink text-sm">{church.bankDetails.bankName} {church.bankDetails.branch ? `- ${church.bankDetails.branch}` : ''}</p>
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4 font-medium">Bank details are not currently available.</p>
            )}
          </div>
        </div>

        {/* Support Need */}
        <div className="flex items-center justify-center gap-2 pb-6">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="text-xs text-gray-500 font-medium">Need help with giving?</span>
          <button className="text-gold-deep text-xs font-bold hover:underline">Contact Support</button>
        </div>

      </div>
    </div>
  );
}
