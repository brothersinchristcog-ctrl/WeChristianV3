"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface ChurchProfile {
  name: string;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branch?: string;
  };
  upiDetails?: {
    upiId: string;
    merchantName?: string;
  };
}

export default function GivingPage() {
  const [church, setChurch] = useState<ChurchProfile | null>(null);
  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-gray-900 font-serif">Giving</h1>
          <p className="text-gray-500 mt-2 text-sm max-w-lg leading-relaxed">
            "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver." - 2 Corinthians 9:7
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Bank Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Bank Transfer</h2>
          </div>
          
          <div className="p-6 space-y-4">
            {church?.bankDetails ? (
              <>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Account Name</p>
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span className="font-bold text-gray-900">{church.bankDetails.accountName}</span>
                    <button onClick={() => handleCopy(church.bankDetails!.accountName, 'Name')} className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
                      {copiedText === 'Name' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Account Number</p>
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span className="font-bold text-gray-900 font-mono text-lg">{church.bankDetails.accountNumber}</span>
                    <button onClick={() => handleCopy(church.bankDetails!.accountNumber, 'Account')} className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
                      {copiedText === 'Account' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">IFSC Code</p>
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span className="font-bold text-gray-900 font-mono text-lg">{church.bankDetails.ifscCode}</span>
                    <button onClick={() => handleCopy(church.bankDetails!.ifscCode, 'IFSC')} className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
                      {copiedText === 'IFSC' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Bank Name</p>
                  <p className="font-medium text-gray-800">{church.bankDetails.bankName} {church.bankDetails.branch ? `- ${church.bankDetails.branch}` : ''}</p>
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-center py-6">Bank details are not currently available.</p>
            )}
          </div>
        </div>

        {/* UPI Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">UPI Transfer</h2>
          </div>
          
          <div className="p-6">
            {church?.upiDetails ? (
              <div className="flex flex-col items-center justify-center text-center space-y-6">
                
                {/* Simulated QR Code Box */}
                <div className="w-48 h-48 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <svg className="w-32 h-32 text-gray-900" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"></path></svg>
                  </div>
                  <p className="text-gray-400 font-medium text-sm">Scan with any<br/>UPI App</p>
                </div>
                
                <div className="w-full">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">UPI ID</p>
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span className="font-bold text-gray-900 text-lg">{church.upiDetails.upiId}</span>
                    <button onClick={() => handleCopy(church.upiDetails!.upiId, 'UPI')} className="text-green-600 hover:text-green-800 text-sm font-semibold">
                      {copiedText === 'UPI' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  {church.upiDetails.merchantName && (
                    <p className="text-sm font-medium text-gray-600 mt-2">
                      Name: {church.upiDetails.merchantName}
                    </p>
                  )}
                </div>

                <div className="flex gap-4 pt-4 w-full justify-center opacity-60">
                   <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-6" />
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-6">UPI details are not currently available.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
