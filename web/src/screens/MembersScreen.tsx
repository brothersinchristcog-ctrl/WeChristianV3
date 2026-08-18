"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where } from 'firebase/firestore';

const RELATION_OPTIONS = [
  'Husband', 'Wife', 'Father', 'Mother', 'Son', 'Daughter',
  'Son-in-Law', 'Daughter-in-Law', 'Brother', 'Sister',
  'Father-in-Law', 'Mother-in-Law', 'Brother-in-Law', 'Sister-in-Law',
  'Grandfather', 'Grandmother', 'Grandson', 'Granddaughter',
  'Uncle', 'Aunt', 'Nephew', 'Niece', 'Cousin', 'Guardian', 'Other'
];

export default function MembersScreen() {
  const [relatedContacts, setRelatedContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  const [newMember, setNewMember] = useState({
    firstName: '',
    lastName: '',
    relation: 'Husband',
    gender: 'Male',
    birthdate: '',
    anniversaryDate: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    fetchFamily();
  }, []);

  const fetchFamily = async () => {
    setLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && userDoc.data().primaryChurchId) {
        const m = { id: currentUser.uid, ...(userDoc.data() as any) };
        setMember(m);
        const cid = m.primaryChurchId;
        const targetAccountId = m.accountId || m.id;

        const membersRef = collection(db, 'churches', cid, 'members');
        const q = query(membersRef, where('accountId', '==', targetAccountId));
        const snap = await getDocs(q);
        
        let contacts: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        const selfExists = contacts.some((c: any) => c.id === m.id);
        if (!selfExists) {
          contacts.unshift({
            id: m.id,
            firstName: m.firstName,
            lastName: m.lastName,
            name: m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim(),
            phone: m.phone,
            email: m.email,
            userType: m.userType || 'Member',
            joinDate: m.joinDate || new Date().toISOString()
          });
        }
        
        setRelatedContacts(contacts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.firstName || !newMember.lastName) {
      alert('First name and Last name are required.');
      return;
    }
    
    setSubmitting(true);
    try {
      const cid = member?.primaryChurchId;
      const targetAccountId = member?.accountId || member?.id;

      if (!cid) throw new Error("Church ID missing");

      if (editingMemberId) {
        // Edit existing
        await updateDoc(doc(db, 'churches', cid, 'members', editingMemberId), newMember);
      } else {
        // Add new
        await addDoc(collection(db, 'churches', cid, 'members'), {
          ...newMember,
          accountId: targetAccountId,
          createdAt: new Date().toISOString()
        });
      }
      setShowAddModal(false);
      setEditingMemberId(null);
      setNewMember({
        firstName: '', lastName: '', relation: 'Husband', gender: 'Male', birthdate: '', anniversaryDate: '', email: '', phone: ''
      });
      fetchFamily();
    } catch (err: any) {
      alert(err.message || 'Failed to save family member.');
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'M';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name[0].toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink"></div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 text-center">
        <h2 className="text-xl font-bold text-ink mb-2">Sign In Required</h2>
        <p className="text-gray-500">Please sign in to view your household details.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6 pb-12 animate-fade-in relative">
      {/* Header */}
      <div className="bg-ink p-6 rounded-2xl flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gold-bright/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-gold-bright" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Household Directory</h2>
            <p className="text-white/60 text-sm font-medium">కుటుంబ సభ్యుల వివరాలు</p>
          </div>
        </div>
        <button 
          onClick={() => {
            setEditingMemberId(null);
            setNewMember({ firstName: '', lastName: '', relation: 'Husband', gender: 'Male', birthdate: '', anniversaryDate: '', email: '', phone: '' });
            setShowAddModal(true);
          }}
          className="bg-gold-bright text-ink px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-yellow-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Member
        </button>
      </div>

      {relatedContacts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-rule p-12 text-center shadow-sm">
          <p className="text-gray-500 font-medium">No household contacts found linked to your account.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {relatedContacts.map((c, index) => {
            const isCurrentUser = c.id === member.id;
            const contactName = (`${c.firstName || ''} ${c.lastName || ''}`.trim()) || c.name || 'Unknown';
            return (
              <div key={index} className={`bg-white rounded-2xl shadow-sm border ${isCurrentUser ? 'border-gold-bright border-2' : 'border-rule/50'} overflow-hidden`}>
                <div className="p-5 flex items-center justify-between border-b border-rule/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${isCurrentUser ? 'bg-gold-bright text-ink' : 'bg-ink/5 text-ink'}`}>
                      {getInitials(contactName)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-ink text-base">{contactName}</h3>
                        {isCurrentUser && (
                          <span className="bg-ink text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">You</span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-ink-soft uppercase tracking-wider">{c.userType || c.relation || 'Member'}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setEditingMemberId(c.id);
                      setNewMember({
                        firstName: c.firstName || '',
                        lastName: c.lastName || '',
                        email: c.email || '',
                        phone: c.phone || '',
                        relation: c.relation || 'Child',
                        gender: c.gender || 'Male',
                        birthdate: c.birthdate || '',
                        anniversaryDate: c.anniversaryDate || ''
                      });
                      setShowAddModal(true);
                    }}
                    className="p-2 text-gray-400 hover:text-ink transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                </div>
                
                <div className="p-5 space-y-3 bg-gray-50/50">
                  {c.phone && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Phone</p>
                        <p className="text-sm font-medium text-ink">{c.phone}</p>
                      </div>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Email</p>
                        <p className="text-sm font-medium text-ink">{c.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="bg-ink p-4 flex justify-between items-center">
              <h3 className="text-white font-bold text-lg">{editingMemberId ? 'Edit Member' : 'Add New Member'}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/60 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleAddMember} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1">First Name *</label>
                  <input required type="text" value={newMember.firstName} onChange={e => setNewMember({...newMember, firstName: e.target.value})} className="w-full bg-gray-50 border border-rule rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-gold-bright focus:ring-1 focus:ring-gold-bright transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1">Last Name *</label>
                  <input required type="text" value={newMember.lastName} onChange={e => setNewMember({...newMember, lastName: e.target.value})} className="w-full bg-gray-50 border border-rule rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-gold-bright focus:ring-1 focus:ring-gold-bright transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1">Relation</label>
                  <select value={newMember.relation} onChange={e => setNewMember({...newMember, relation: e.target.value})} className="w-full bg-gray-50 border border-rule rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-gold-bright focus:ring-1 focus:ring-gold-bright transition-all">
                    {RELATION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1">Gender</label>
                  <select value={newMember.gender} onChange={e => setNewMember({...newMember, gender: e.target.value})} className="w-full bg-gray-50 border border-rule rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-gold-bright focus:ring-1 focus:ring-gold-bright transition-all">
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1">Phone Number</label>
                <input type="tel" value={newMember.phone} onChange={e => setNewMember({...newMember, phone: e.target.value})} className="w-full bg-gray-50 border border-rule rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-gold-bright focus:ring-1 focus:ring-gold-bright transition-all" />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1">Email Address</label>
                <input type="email" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} className="w-full bg-gray-50 border border-rule rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-gold-bright focus:ring-1 focus:ring-gold-bright transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1">Birthdate</label>
                  <input type="date" value={newMember.birthdate} onChange={e => setNewMember({...newMember, birthdate: e.target.value})} className="w-full bg-gray-50 border border-rule rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-gold-bright focus:ring-1 focus:ring-gold-bright transition-all" />
                </div>
                {['Husband', 'Wife'].includes(newMember.relation) && (
                  <div>
                    <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1">Anniversary</label>
                    <input type="date" value={newMember.anniversaryDate} onChange={e => setNewMember({...newMember, anniversaryDate: e.target.value})} className="w-full bg-gray-50 border border-rule rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-gold-bright focus:ring-1 focus:ring-gold-bright transition-all" />
                  </div>
                )}
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full bg-ink text-white font-bold py-3 rounded-xl hover:bg-ink/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
