"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';

export default function MemberNotesPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [currentNote, setCurrentNote] = useState({ id: '', title: '', content: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const notesRef = collection(db, 'users', currentUser.uid, 'notes');
      const q = query(notesRef, orderBy('updatedAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setNotes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUser = auth.currentUser;
    if (!currentUser || !currentNote.content) return;
    setSaving(true);
    try {
      const notesRef = collection(db, 'users', currentUser.uid, 'notes');
      const docRef = currentNote.id ? doc(notesRef, currentNote.id) : doc(notesRef);
      
      await setDoc(docRef, {
        id: docRef.id,
        title: currentNote.title || 'Untitled Note',
        content: currentNote.content,
        updatedAt: serverTimestamp(),
        createdAt: currentNote.id ? undefined : serverTimestamp()
      }, { merge: true });
      
      setMessage('Note saved successfully.');
      setView('list');
      fetchNotes();
    } catch (error) {
      console.error(error);
      setMessage('Failed to save note.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'notes', id));
      setMessage('Note deleted.');
      fetchNotes();
    } catch (e) {
      console.error(e);
      setMessage('Failed to delete note.');
    }
  };

  const openEditor = (note?: any) => {
    if (note) {
      setCurrentNote(note);
    } else {
      setCurrentNote({ id: '', title: '', content: '' });
    }
    setView('editor');
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12 h-full flex flex-col">
      
      {message && (
        <div className="p-4 rounded-xl text-sm font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 flex justify-between items-center">
          {message}
          <button onClick={() => setMessage('')} className="text-yellow-500 hover:text-yellow-700">&times;</button>
        </div>
      )}

      {view === 'list' && (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex justify-between items-center relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-yellow-50 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="relative z-10">
              <h1 className="text-3xl font-bold text-gray-900 font-serif">Sermon Notes</h1>
              <p className="text-gray-500 mt-1 text-sm">Your personal space for reflections and takeaways.</p>
            </div>
            <button 
              onClick={() => openEditor()}
              className="relative z-10 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm transition-colors"
            >
              + New Note
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notes.map(note => {
              const dateStr = note.updatedAt?.toDate ? new Date(note.updatedAt.toDate()).toLocaleDateString() : 'Just now';
              return (
                <div key={note.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col group hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEditor(note)}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 group-hover:text-yellow-600 transition-colors line-clamp-1">{note.title}</h3>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                  <p className="text-gray-500 text-sm line-clamp-3 mb-4 flex-1">{note.content}</p>
                  <p className="text-xs font-semibold text-gray-400 mt-auto pt-4 border-t border-gray-50">Last edited: {dateStr}</p>
                </div>
              );
            })}
          </div>
          {notes.length === 0 && (
             <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100 border-dashed">
               No notes yet. Click the button above to create one.
             </div>
          )}
        </>
      )}

      {view === 'editor' && (
        <form onSubmit={handleSave} className="flex flex-col flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
          <div className="bg-gray-50 border-b border-gray-100 p-4 flex justify-between items-center">
            <button type="button" onClick={() => setView('list')} className="text-gray-500 hover:text-gray-700 font-semibold flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
              Back
            </button>
            <button disabled={saving} type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-bold transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Note'}
            </button>
          </div>
          
          <div className="p-6 md:p-8 flex-1 flex flex-col gap-4">
            <input 
              type="text" 
              value={currentNote.title}
              onChange={e => setCurrentNote({...currentNote, title: e.target.value})}
              placeholder="Note Title"
              className="text-2xl font-bold font-serif text-gray-900 border-none focus:ring-0 placeholder-gray-300 w-full p-0 bg-transparent"
            />
            <hr className="border-gray-100" />
            <textarea
              value={currentNote.content}
              onChange={e => setCurrentNote({...currentNote, content: e.target.value})}
              placeholder="Start typing your notes here..."
              className="flex-1 resize-none border-none focus:ring-0 text-gray-700 leading-relaxed text-lg w-full p-0 bg-transparent"
              autoFocus
            ></textarea>
          </div>
        </form>
      )}

    </div>
  );
}
