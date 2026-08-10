"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';

interface ChurchExpense {
  id: string;
  title?: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: string;
  vendorName?: string;
  notes?: string;
  status: 'Paid' | 'Pending';
  addedBy?: string;
  createdAt?: any;
}

export default function AdminFinancePage() {
  const [expenses, setExpenses] = useState<ChurchExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [churchId, setChurchId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [view, setView] = useState<'list' | 'add'>('list');

  // Categories
  const EXPENSE_GROUPS = {
    'General': ['Water', 'Snacks', 'Tea', 'Flowers', 'Sound System', 'Décor', 'Transport', 'Printing', 'Electricity', 'Stationery', 'Cleaning Supplies', 'Musical Instruments', 'Honorarium'],
    'Vegetables': ['Tomato', 'Onion', 'Potato', 'Carrot', 'Cabbage', 'Chilli', 'Garlic', 'Ginger', 'Beans', 'Brinjal', 'Lemon', 'Coriander'],
    'Groceries': ['Rice', 'Sugar', 'Salt', 'Cooking Oil', 'Dal', 'Spices', 'Wheat/Atta', 'Milk', 'Tea Powder', 'Coffee Powder']
  };

  const paymentMethods = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card'];

  // Form State
  const [form, setForm] = useState({
    title: '',
    category: 'Water',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    vendorName: '',
    status: 'Paid' as 'Paid' | 'Pending',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && userDoc.data().primaryChurchId) {
        const cid = userDoc.data().primaryChurchId;
        setChurchId(cid);

        const expensesRef = collection(db, 'churches', cid, 'expenses');
        const q = query(expensesRef, orderBy('date', 'desc'));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChurchExpense));
        setExpenses(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchId || !form.amount || !form.category) return;
    setSaving(true);
    setMessage('');
    try {
      const newRef = doc(collection(db, 'churches', churchId, 'expenses'));
      await setDoc(newRef, {
        id: newRef.id,
        title: form.title || form.category,
        category: form.category,
        amount: Number(form.amount),
        date: form.date,
        paymentMethod: form.paymentMethod,
        vendorName: form.vendorName,
        status: form.status,
        notes: form.notes,
        addedBy: auth.currentUser?.uid,
        createdAt: serverTimestamp()
      });
      setMessage('Expense recorded successfully.');
      setForm({
        title: '',
        category: 'Water',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Cash',
        vendorName: '',
        status: 'Paid',
        notes: ''
      });
      setView('list');
      fetchExpenses();
    } catch (e) {
      console.error(e);
      setMessage('Failed to record expense.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!churchId) return;
    if (!window.confirm("Are you sure you want to delete this expense record? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, 'churches', churchId, 'expenses', id));
      setMessage('Expense deleted.');
      fetchExpenses();
    } catch (e) {
      console.error(e);
      setMessage('Failed to delete expense.');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  // Calculate totals
  const totalAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const pendingAmount = expenses.filter(e => e.status === 'Pending').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

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
          <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage church expenses and track spending</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { window.print(); }} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-lg font-semibold shadow-sm transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            Print Report
          </button>
          {view === 'list' ? (
            <button onClick={() => setView('add')} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold shadow-sm transition-colors flex items-center gap-2">
              <span>+</span> Record Expense
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
            <div className="bg-gradient-to-br from-red-600 to-rose-700 rounded-2xl p-6 text-white shadow-sm print:hidden">
              <div className="text-red-100 font-medium text-sm mb-1 uppercase tracking-wider">Total Expenses</div>
              <div className="text-3xl font-bold font-serif">₹{totalAmount.toLocaleString('en-IN')}</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm print:hidden">
              <div className="text-orange-500 font-medium text-sm mb-1 uppercase tracking-wider">Pending Approvals</div>
              <div className="text-3xl font-bold text-gray-900 font-serif">₹{pendingAmount.toLocaleString('en-IN')}</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm print:hidden">
              <div className="text-gray-500 font-medium text-sm mb-1 uppercase tracking-wider">Total Records</div>
              <div className="text-3xl font-bold text-gray-900 font-serif">{expenses.length}</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status & Payment</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider print:hidden">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium whitespace-nowrap">{exp.date}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{exp.title || exp.category}</div>
                        {exp.vendorName && <div className="text-xs text-gray-500 mt-0.5">{exp.vendorName}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                          {exp.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${exp.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                            {exp.status}
                          </span>
                          <span className="text-xs text-gray-500">{exp.paymentMethod}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900 font-serif">₹{Number(exp.amount).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-right print:hidden">
                        <button onClick={() => handleDelete(exp.id)} className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">
                        No expenses recorded yet.
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
          <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">Record New Expense</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Title (Optional)</label>
              <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3" placeholder="e.g. Sunday Lunch Supplies" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Vendor/Paid To (Optional)</label>
              <input type="text" value={form.vendorName} onChange={e => setForm({...form, vendorName: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3" placeholder="e.g. Fresh Market" />
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
                {Object.entries(EXPENSE_GROUPS).map(([groupName, items]) => (
                  <optgroup key={groupName} label={groupName}>
                    {items.map(item => <option key={item} value={item}>{item}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Payment Method</label>
                <select required value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  {paymentMethods.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                <select required value={form.status} onChange={e => setForm({...form, status: e.target.value as 'Paid' | 'Pending'})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Notes (Optional)</label>
              <textarea rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3" placeholder="Any additional information..."></textarea>
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <button disabled={saving} type="submit" className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-bold shadow-sm transition-colors">
              {saving ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
