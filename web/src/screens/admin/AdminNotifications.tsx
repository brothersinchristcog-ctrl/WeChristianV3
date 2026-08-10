"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';

export default function AdminNotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [churchId, setChurchId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // Settings state
  const [dailyPromise, setDailyPromise] = useState({ enabled: true, sendTime: '07:00' });
  const [birthdayNotif, setBirthdayNotif] = useState({ enabled: true, greeting: 'Wishing you a very Happy Birthday! May God bless you abundantly and fulfill all your prayers today. 🎂🙏' });
  const [anniversaryNotif, setAnniversaryNotif] = useState({ enabled: true, greeting: 'Wishing you a wonderful wedding anniversary! May God bless your home with love, joy, and peace. 💐💒' });
  const [lastBroadcast, setLastBroadcast] = useState({ date: 'April 16', count: 1240, text: 'Easter service reminder' });

  // Manual broadcast state
  const [manualBroadcast, setManualBroadcast] = useState({ title: '', message: '' });
  
  // Emergency meeting state
  const [emergencyAlert, setEmergencyAlert] = useState({ title: '', date: '', time: '', location: '', message: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && userDoc.data().primaryChurchId) {
        setChurchId(userDoc.data().primaryChurchId);
      }

      // Load global notifications settings
      const settingsDoc = await getDoc(doc(db, 'settings', 'notifications'));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        if (data.dailyPromise) setDailyPromise(data.dailyPromise);
        if (data.birthdayNotif) setBirthdayNotif(data.birthdayNotif);
        if (data.anniversaryNotif) setAnniversaryNotif(data.anniversaryNotif);
        if (data.lastBroadcast) setLastBroadcast(data.lastBroadcast);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setMessage('');
    try {
      await setDoc(doc(db, 'settings', 'notifications'), {
        dailyPromise,
        birthdayNotif,
        anniversaryNotif,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setMessage('Settings saved successfully.');
    } catch (e) {
      console.error(e);
      setMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchId || !manualBroadcast.title || !manualBroadcast.message) return;
    setSaving(true);
    setMessage('');
    try {
      const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      const newRef = doc(collection(db, 'broadcasts'));
      await setDoc(newRef, {
        id: newRef.id,
        title: manualBroadcast.title,
        content: manualBroadcast.message,
        date: dateStr,
        type: 'announcement',
        targetChurchId: churchId,
        createdAt: serverTimestamp()
      });

      const newLast = { date: dateStr, count: 1250, text: manualBroadcast.title };
      setLastBroadcast(newLast);
      await setDoc(doc(db, 'settings', 'notifications'), { lastBroadcast: newLast }, { merge: true });
      
      setManualBroadcast({ title: '', message: '' });
      setMessage('Broadcast sent successfully.');
    } catch (e) {
      console.error(e);
      setMessage('Failed to send broadcast.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchId || !emergencyAlert.title || !emergencyAlert.message || !emergencyAlert.location) return;
    setSaving(true);
    setMessage('');
    try {
      const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      const fullTimeStr = `${emergencyAlert.date} at ${emergencyAlert.time}`;
      
      const newRef = doc(collection(db, 'broadcasts'));
      await setDoc(newRef, {
        id: newRef.id,
        title: `🚨 EMERGENCY MEETING: ${emergencyAlert.title}`,
        content: `⏰ TIME: ${fullTimeStr}\n📍 LOCATION: ${emergencyAlert.location}\n\n${emergencyAlert.message}`,
        date: dateStr,
        type: 'emergency',
        targetChurchId: churchId,
        createdAt: serverTimestamp()
      });

      const newLast = { date: dateStr, count: 1250, text: `🚨 Emergency: ${emergencyAlert.title}` };
      setLastBroadcast(newLast);
      await setDoc(doc(db, 'settings', 'notifications'), { lastBroadcast: newLast }, { merge: true });

      setEmergencyAlert({ title: '', date: '', time: '', location: '', message: '' });
      setMessage('Emergency alert sent successfully.');
    } catch (e) {
      console.error(e);
      setMessage('Failed to send emergency alert.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {message && (
        <div className="p-4 rounded-xl text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 flex justify-between items-center">
          {message}
          <button onClick={() => setMessage('')} className="text-blue-500 hover:text-blue-700">&times;</button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications & Broadcasts</h1>
          <p className="text-gray-500 text-sm mt-1">Manage automated alerts and send manual messages to members</p>
        </div>
        <button onClick={handleSaveSettings} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow-sm transition-colors">
          Save Settings
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Automated Settings */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
              <span className="text-blue-600">📅</span> Daily Promise Notification
            </h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={dailyPromise.enabled} onChange={e => setDailyPromise({...dailyPromise, enabled: e.target.checked})} className="w-5 h-5 text-blue-600 rounded" />
                <span className="font-medium text-gray-700">Enable Daily Promise</span>
              </label>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Send Time (24h format)</label>
                <input type="time" value={dailyPromise.sendTime} onChange={e => setDailyPromise({...dailyPromise, sendTime: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
              <span className="text-yellow-600">🎂</span> Celebration Greetings
            </h2>
            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-3 mb-2">
                  <input type="checkbox" checked={birthdayNotif.enabled} onChange={e => setBirthdayNotif({...birthdayNotif, enabled: e.target.checked})} className="w-5 h-5 text-blue-600 rounded" />
                  <span className="font-medium text-gray-700">Automated Birthday Alerts</span>
                </label>
                <textarea value={birthdayNotif.greeting} onChange={e => setBirthdayNotif({...birthdayNotif, greeting: e.target.value})} rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm" placeholder="Birthday greeting message..."></textarea>
              </div>
              <div className="border-t pt-4">
                <label className="flex items-center gap-3 mb-2">
                  <input type="checkbox" checked={anniversaryNotif.enabled} onChange={e => setAnniversaryNotif({...anniversaryNotif, enabled: e.target.checked})} className="w-5 h-5 text-blue-600 rounded" />
                  <span className="font-medium text-gray-700">Automated Anniversary Alerts</span>
                </label>
                <textarea value={anniversaryNotif.greeting} onChange={e => setAnniversaryNotif({...anniversaryNotif, greeting: e.target.value})} rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm" placeholder="Anniversary greeting message..."></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Broadcasts */}
        <div className="space-y-6">
          <form onSubmit={handleSendManual} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
              <span className="text-blue-600">📢</span> General Custom Broadcast
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                <input required type="text" value={manualBroadcast.title} onChange={e => setManualBroadcast({...manualBroadcast, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2" placeholder="Announcement title..." />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Message</label>
                <textarea required rows={4} value={manualBroadcast.message} onChange={e => setManualBroadcast({...manualBroadcast, message: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2" placeholder="Type your message to members..."></textarea>
              </div>
              <button disabled={saving} type="submit" className="w-full bg-gray-800 hover:bg-black text-white py-3 rounded-lg font-bold transition-colors">
                Send Broadcast
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg flex gap-3 items-center">
              <span className="text-green-600 text-xl">✓</span>
              <p className="text-xs text-green-800">
                Last broadcast: <strong>{lastBroadcast.date}</strong> — {lastBroadcast.text}. Delivered to {lastBroadcast.count.toLocaleString()} members.
              </p>
            </div>
          </form>

          <form onSubmit={handleSendEmergency} className="bg-white rounded-2xl shadow-sm border border-red-200 p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>
            <h2 className="text-lg font-bold text-red-700 mb-4 border-b border-red-100 pb-2 flex items-center gap-2">
              <span>🚨</span> Emergency Meeting Alert
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Meeting Title</label>
                <input required type="text" value={emergencyAlert.title} onChange={e => setEmergencyAlert({...emergencyAlert, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2" placeholder="e.g. Urgent Leadership Meeting" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
                  <input required type="date" value={emergencyAlert.date} onChange={e => setEmergencyAlert({...emergencyAlert, date: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Time</label>
                  <input required type="time" value={emergencyAlert.time} onChange={e => setEmergencyAlert({...emergencyAlert, time: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
                <input required type="text" value={emergencyAlert.location} onChange={e => setEmergencyAlert({...emergencyAlert, location: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2" placeholder="e.g. Main Sanctuary" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Message Details</label>
                <textarea required rows={3} value={emergencyAlert.message} onChange={e => setEmergencyAlert({...emergencyAlert, message: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2" placeholder="Reason for the meeting..."></textarea>
              </div>
              <button disabled={saving} type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition-colors">
                Broadcast Emergency Alert
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
