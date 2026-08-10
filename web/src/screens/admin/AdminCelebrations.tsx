"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, orderBy } from 'firebase/firestore';

export default function AdminCelebrationsPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [churchId, setChurchId] = useState<string>('');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && userDoc.data().primaryChurchId) {
        const cid = userDoc.data().primaryChurchId;
        setChurchId(cid);

        const membersRef = collection(db, 'churches', cid, 'members');
        const q = query(membersRef);
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setMembers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div></div>;
  }

  // Filter out members with upcoming birthdays and anniversaries
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentDate = now.getDate();
  
  const upcomingCelebrations = members.filter(m => {
    let hasCelebration = false;
    
    if (m.Birthdate) {
      const parts = m.Birthdate.split('-');
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      if (month === currentMonth && day >= currentDate) hasCelebration = true;
      if (month > currentMonth) hasCelebration = true;
    }
    
    if (m.Anniversary_Date__c) {
      const parts = m.Anniversary_Date__c.split('-');
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      if (month === currentMonth && day >= currentDate) hasCelebration = true;
      if (month > currentMonth) hasCelebration = true;
    }
    
    return hasCelebration;
  }).sort((a, b) => {
    const getNextDate = (m: any) => {
      let nextDate = new Date(now.getFullYear() + 1, 0, 1);
      if (m.Birthdate) {
        const parts = m.Birthdate.split('-');
        let d = new Date(now.getFullYear(), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        if (d < now) d.setFullYear(d.getFullYear() + 1);
        if (d < nextDate) nextDate = d;
      }
      if (m.Anniversary_Date__c) {
        const parts = m.Anniversary_Date__c.split('-');
        let d = new Date(now.getFullYear(), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        if (d < now) d.setFullYear(d.getFullYear() + 1);
        if (d < nextDate) nextDate = d;
      }
      return nextDate;
    };
    return getNextDate(a).getTime() - getNextDate(b).getTime();
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-pink-50 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-gray-900 font-serif">WeCelebrations</h1>
          <p className="text-gray-500 mt-2 text-sm max-w-lg leading-relaxed">
            Track and manage upcoming birthdays and anniversaries in your congregation.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Member Name</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Upcoming Birthday</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Upcoming Anniversary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {upcomingCelebrations.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{member.name || member.Name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{member.role || 'Member'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                    {member.phoneNumber || member.Phone || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {member.Birthdate ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-50 text-pink-700 border border-pink-100">
                        🎉 {member.Birthdate}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {member.Anniversary_Date__c ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100">
                        💍 {member.Anniversary_Date__c}
                      </span>
                    ) : '-'}
                  </td>
                </tr>
              ))}
              {upcomingCelebrations.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 font-medium">
                    No upcoming celebrations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
