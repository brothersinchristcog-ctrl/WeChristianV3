"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';

export default function AdminMembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [churchId, setChurchId] = useState<string>('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [message, setMessage] = useState('');

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

        const membersSnap = await getDocs(collection(db, 'churches', cid, 'members'));
        const membersData = membersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setMembers(membersData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const name = (m.name || m.firstName || '').toLowerCase();
      const phone = m.phone || '';
      const email = (m.email || '').toLowerCase();
      
      const matchesSearch = name.includes(searchQuery.toLowerCase()) || phone.includes(searchQuery) || email.includes(searchQuery.toLowerCase());
      
      const isActive = true; // Placeholder for status field
      const matchesStatus = statusFilter === 'All' || (statusFilter === 'Active' && isActive) || (statusFilter === 'Inactive' && !isActive);
      
      return matchesSearch && matchesStatus;
    });
  }, [members, searchQuery, statusFilter]);

  const handlePromoteAdmin = async (memberId: string) => {
    if (!churchId) return;
    try {
      await setDoc(doc(db, 'churches', churchId, 'members', memberId), { userType: 'Admin' }, { merge: true });
      await setDoc(doc(db, 'users', memberId), { userType: 'Admin' }, { merge: true });
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, userType: 'Admin' } : m));
      setMessage('Member promoted to Admin successfully.');
    } catch (e) {
      console.error(e);
      setMessage('Failed to promote member.');
    }
  };

  const handleRemoveAdmin = async (memberId: string) => {
    if (!churchId) return;
    try {
      await setDoc(doc(db, 'churches', churchId, 'members', memberId), { userType: 'Member' }, { merge: true });
      await setDoc(doc(db, 'users', memberId), { userType: 'Member' }, { merge: true });
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, userType: 'Member' } : m));
      setMessage('Admin role removed successfully.');
    } catch (e) {
      console.error(e);
      setMessage('Failed to remove admin role.');
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!churchId) return;
    if (!window.confirm("Are you sure you want to remove this member from the church?")) return;
    try {
      await deleteDoc(doc(db, 'churches', churchId, 'members', memberId));
      setMembers(prev => prev.filter(m => m.id !== memberId));
      setMessage('Member removed successfully.');
    } catch (e) {
      console.error(e);
      setMessage('Failed to remove member.');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members Directory</h1>
          <p className="text-gray-500 text-sm mt-1">{members.length} total members</p>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-xl text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 flex justify-between items-center">
          {message}
          <button onClick={() => setMessage('')} className="text-blue-500 hover:text-blue-700">&times;</button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
          <span className="text-3xl font-bold text-blue-900 mb-1">{members.length}</span>
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Members</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
          <span className="text-3xl font-bold text-green-600 mb-1">{members.length}</span>
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Active</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
          <span className="text-3xl font-bold text-red-600 mb-1">0</span>
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Inactive</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <input 
          type="text" 
          placeholder="Search by name, phone, or email..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full md:w-96 bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
        <div className="flex gap-2">
          {(['All', 'Active', 'Inactive'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${statusFilter === filter ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Member List */}
      <div className="space-y-4">
        {filteredMembers.map((member) => {
          const isExpanded = expandedId === member.id;
          const displayName = (`${member.firstName || ''} ${member.lastName || ''}`.trim()) || member.name || 'Unknown';
          const displayRole = member.userType || member.role || 'Member';
          const initials = displayName.substring(0, 2).toUpperCase();

          return (
            <div key={member.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
              <div 
                className="p-4 sm:p-6 cursor-pointer flex items-center justify-between"
                onClick={() => setExpandedId(isExpanded ? null : member.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg border border-blue-200">
                    {initials}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{displayName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${displayRole.toLowerCase() === 'admin' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                        {displayRole.toUpperCase()}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-green-100 text-green-700">ACTIVE</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-gray-400">
                  <div className="hidden sm:block text-right">
                    <div className="text-sm font-medium text-gray-900">{member.phone || 'No Phone'}</div>
                  </div>
                  <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50 p-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contact Details</h4>
                      <p className="text-sm font-medium text-gray-900 mb-1">📞 {member.phone || 'No Phone'}</p>
                      <p className="text-sm font-medium text-gray-900">✉️ {member.email || 'No Email'}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Location & Demographic</h4>
                      <p className="text-sm font-medium text-gray-900 mb-1">📍 {(member.city || member.village || 'Not specified')}</p>
                      <p className="text-sm font-medium text-gray-900">🎂 {member.dob || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                    {displayRole.toLowerCase() === 'admin' ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRemoveAdmin(member.id); }}
                        className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                      >
                        Remove Admin Role
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handlePromoteAdmin(member.id); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
                      >
                        Promote to Admin
                      </button>
                    )}
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteMember(member.id); }}
                      className="bg-gray-200 hover:bg-red-500 hover:text-white text-gray-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                    >
                      Remove from Church
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {filteredMembers.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-500 font-medium">No members found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
