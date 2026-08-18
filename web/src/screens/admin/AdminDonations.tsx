"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';

interface ChurchDonation {
  id: string;
  donorName: string;
  donorPhone?: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: string;
  notes?: string;
  addedBy?: string;
  createdAt?: any;
}

export default function AdminDonationsPage() {
  const [donations, setDonations] = useState<ChurchDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [churchId, setChurchId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [view, setView] = useState<'list' | 'add'>('list');

  // Categories
  const categories = [
    'Tithes', 
    'Thanksgiving', 
    'Building Fund', 
    'Missionary', 
    'Poor Fund',
    'General Offering',
    'Other'
  ];
  
  const paymentMethods = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card'];

  // Form State
  const [form, setForm] = useState({
    donorName: '',
    donorPhone: '',
    category: 'Tithes',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    setLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && userDoc.data().primaryChurchId) {
        const cid = userDoc.data().primaryChurchId;
        setChurchId(cid);

        const donationsRef = collection(db, 'churches', cid, 'donations');
        const q = query(donationsRef, orderBy('date', 'desc'));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChurchDonation));
        setDonations(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchId || !form.donorName || !form.amount) return;
    setSaving(true);
    setMessage('');
    try {
      const newRef = doc(collection(db, 'churches', churchId, 'donations'));
      await setDoc(newRef, {
        id: newRef.id,
        donorName: form.donorName,
        donorPhone: form.donorPhone,
        category: form.category,
        amount: Number(form.amount),
        date: form.date,
        paymentMethod: form.paymentMethod,
        notes: form.notes,
        addedBy: auth.currentUser?.uid,
        createdAt: serverTimestamp()
      });
      setMessage('Donation recorded successfully.');
      setForm({
        donorName: '',
        donorPhone: '',
        category: 'Tithes',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Cash',
        notes: ''
      });
      setView('list');
      fetchDonations();
    } catch (e) {
      console.error(e);
      setMessage('Failed to record donation.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!churchId) return;
    if (!window.confirm("Are you sure you want to delete this donation record? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, 'churches', churchId, 'donations', id));
      setMessage('Donation deleted.');
      fetchDonations();
    } catch (e) {
      console.error(e);
      setMessage('Failed to delete donation.');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  // Calculate totals
  const totalAmount = donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      {message && (
        <div className="p-4 rounded-xl text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 flex justify-between items-center">
          {message}
          <button onClick={() => setMessage('')} className="text-blue-500 hover:text-blue-700">&times;</button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Donations Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage contributions and generate reports</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { window.print(); }} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-lg font-semibold shadow-sm transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            Print Report
          </button>
          {view === 'list' ? (
            <button onClick={() => setView('add')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow-sm transition-colors flex items-center gap-2">
              <span>+</span> Record Donation
            </button>
          ) : (
            <button onClick={() => setView('list')} className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2">
              Cancel
            </button>
          )}
        </div>
      </div>

      {view === 'list' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-sm print:hidden">
              <div className="text-blue-100 font-medium text-sm mb-1 uppercase tracking-wider">Total Donations Collected</div>
              <div className="text-3xl font-bold font-serif">₹{totalAmount.toLocaleString('en-IN')}</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm print:hidden">
              <div className="text-gray-500 font-medium text-sm mb-1 uppercase tracking-wider">Total Records</div>
              <div className="text-3xl font-bold text-gray-900 font-serif">{donations.length}</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Donor Details</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider print:hidden">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {donations.map((don) => (
                    <tr key={don.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium whitespace-nowrap">{don.date}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{don.donorName}</div>
                        {don.donorPhone && <div className="text-xs text-gray-500 mt-0.5">{don.donorPhone}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {don.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{don.paymentMethod}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900 font-serif">₹{Number(don.amount).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-right print:hidden">
                        <button onClick={() => handleDelete(don.id)} className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {donations.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">
                        No donations recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {view === 'add' && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">Record New Donation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Donor Name</label>
              <input required type="text" value={form.donorName} onChange={e => setForm({...form, donorName: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3" placeholder="e.g. John Doe" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Donor Phone (Optional)</label>
              <input type="tel" value={form.donorPhone} onChange={e => setForm({...form, donorPhone: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3" placeholder="+91..." />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Amount (₹)</label>
              <input required type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
              <input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
              <select required value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Payment Method</label>
              <select required value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                {paymentMethods.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Notes (Optional)</label>
              <textarea rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3" placeholder="Any additional information..."></textarea>
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <button disabled={saving} type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold shadow-sm transition-colors">
              {saving ? 'Saving...' : 'Save Donation'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
