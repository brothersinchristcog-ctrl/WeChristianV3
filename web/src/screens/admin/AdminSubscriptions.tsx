"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export default function AdminSubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [churchId, setChurchId] = useState<string>('');
  const [subscription, setSubscription] = useState<any>(null);
  const [message, setMessage] = useState('');

  const SUBSCRIPTION_AMOUNT = 99; // ₹99/year

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    setLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && userDoc.data().primaryChurchId) {
        const cid = userDoc.data().primaryChurchId;
        setChurchId(cid);

        const churchDoc = await getDoc(doc(db, 'churches', cid));
        if (churchDoc.exists()) {
          setSubscription(churchDoc.data().subscription || null);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!churchId) return;
    setPaying(true);
    setMessage('');
    
    // Mocking PhonePe integration for web MVP
    // In production, you would generate a payment link and redirect
    setTimeout(async () => {
      try {
        const transactionId = `C_${churchId}_${Date.now()}`;
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);

        // 1. Create a permanent record in the subscriptions subcollection
        await setDoc(doc(db, 'churches', churchId, 'subscriptions', transactionId), {
          status: 'active',
          tier: 'premium',
          amount: SUBSCRIPTION_AMOUNT,
          validUntil: nextYear.toISOString(),
          paymentId: transactionId,
          paidAt: new Date().toISOString(),
          platform: 'web'
        });

        // 2. Update the main church document
        await updateDoc(doc(db, 'churches', churchId), {
          'subscription.status': 'active',
          'subscription.tier': 'premium',
          'subscription.validUntil': nextYear.toISOString(),
          'subscription.lastPaymentId': transactionId
        });

        setSubscription({
          status: 'active',
          tier: 'premium',
          validUntil: nextYear.toISOString()
        });

        setMessage('Payment successful! Your subscription has been renewed.');
      } catch (error) {
        console.error('Payment Error:', error);
        setMessage('Payment failed. Please try again.');
      } finally {
        setPaying(false);
      }
    }, 1500);
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  const isActive = subscription?.status === 'active' && new Date(subscription.validUntil) > new Date();

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">WeChristian Platform</h1>
        <p className="text-gray-500">Premium Church Management Subscription</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium flex justify-between items-center ${message.includes('success') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'} border`}>
          {message}
          <button onClick={() => setMessage('')} className="opacity-70 hover:opacity-100">&times;</button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isActive ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
            {isActive ? (
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ) : (
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            )}
          </div>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {isActive ? 'Subscription Active' : 'Subscription Required'}
            </h2>
            {isActive ? (
              <p className="text-green-600 font-medium mt-1">
                Valid until {new Date(subscription.validUntil).toLocaleDateString()}
              </p>
            ) : (
              <p className="text-amber-600 font-medium mt-1">
                Your subscription has expired or is not active.
              </p>
            )}
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Premium Features Included</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-gray-700"><span className="text-indigo-600">✓</span> Unlimited Members & Groups</li>
            <li className="flex items-center gap-3 text-gray-700"><span className="text-indigo-600">✓</span> Advanced Analytics & Finance Tools</li>
            <li className="flex items-center gap-3 text-gray-700"><span className="text-indigo-600">✓</span> WhatsApp Integrations</li>
            <li className="flex items-center gap-3 text-gray-700"><span className="text-indigo-600">✓</span> WeCelebrations Generator</li>
            <li className="flex items-center gap-3 text-gray-700"><span className="text-indigo-600">✓</span> Priority Support</li>
          </ul>
        </div>

        <div className="flex flex-col items-center pt-4 border-t border-gray-100">
          <div className="text-3xl font-bold text-gray-900 mb-6">
            ₹{SUBSCRIPTION_AMOUNT} <span className="text-base font-normal text-gray-500">/ year</span>
          </div>

          <button 
            onClick={handlePayment} 
            disabled={paying}
            className="w-full md:w-auto px-12 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:scale-100 text-lg flex items-center justify-center gap-2"
          >
            {paying ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : isActive ? 'Renew Subscription' : 'Pay Now'}
          </button>
          
          <p className="text-xs text-gray-400 mt-4 text-center max-w-xs">
            Payments are securely processed via PhonePe. This is a recurring yearly subscription.
          </p>
        </div>
      </div>
    </div>
  );
}
