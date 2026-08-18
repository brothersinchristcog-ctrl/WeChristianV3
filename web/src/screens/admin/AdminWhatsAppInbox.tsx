"use client";
import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, orderBy, onSnapshot, setDoc } from 'firebase/firestore';

export default function AdminWhatsAppInboxPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [churchId, setChurchId] = useState<string>('');
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedConvo) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedConvo?.messages]);

  const fetchInitialData = async () => {
    setLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && userDoc.data().primaryChurchId) {
        const cid = userDoc.data().primaryChurchId;
        setChurchId(cid);

        // Fetch members for mapping names to phone numbers
        const memSnap = await getDocs(collection(db, 'churches', cid, 'members'));
        const members = memSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

        // Listen to whatsappMessages
        const q = query(collection(db, 'churches', cid, 'whatsappMessages'), orderBy('timestamp', 'desc'));
        onSnapshot(q, (snapshot) => {
          const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
          
          // Group by phone
          const groups = new Map<string, any[]>();
          msgs.forEach(m => {
            const phone = m.from;
            if (!groups.has(phone)) groups.set(phone, []);
            groups.get(phone)!.push(m);
          });

          const newConvos: any[] = [];
          groups.forEach((groupMsgs, phone) => {
            const member = members.find(m => {
              if (!m.phone) return false;
              const cleanMeta = phone.replace(/\D/g, '');
              const cleanMem = m.phone.replace(/\D/g, '');
              return cleanMeta.endsWith(cleanMem.slice(-10));
            });

            const sorted = groupMsgs.sort((a, b) => {
              const t1 = a.timestamp ? (a.timestamp.toMillis ? a.timestamp.toMillis() : new Date(a.timestamp).getTime()) : 0;
              const t2 = b.timestamp ? (b.timestamp.toMillis ? b.timestamp.toMillis() : new Date(b.timestamp).getTime()) : 0;
              return t1 - t2;
            });

            newConvos.push({
              phone,
              member,
              messages: sorted,
              lastMessage: sorted[sorted.length - 1]
            });
          });

          newConvos.sort((a, b) => {
            const t1 = a.lastMessage?.timestamp ? (a.lastMessage.timestamp.toMillis ? a.lastMessage.timestamp.toMillis() : new Date(a.lastMessage.timestamp).getTime()) : 0;
            const t2 = b.lastMessage?.timestamp ? (b.lastMessage.timestamp.toMillis ? b.lastMessage.timestamp.toMillis() : new Date(b.lastMessage.timestamp).getTime()) : 0;
            return t2 - t1;
          });

          setConversations(newConvos);
          
          if (selectedConvo) {
            const updated = newConvos.find(c => c.phone === selectedConvo.phone);
            if (updated) setSelectedConvo(updated);
          }
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!replyText.trim() || !selectedConvo || !churchId) return;
    setSending(true);
    try {
      // In a real app, you would call a Firebase Function or API to send via WhatsApp Business API
      // Here we just record it locally for demo parity.
      const newMsgRef = doc(collection(db, 'churches', churchId, 'whatsappMessages'));
      await setDoc(newMsgRef, {
        from: selectedConvo.phone, // Associate with this convo
        text: replyText.trim(),
        direction: 'outbound',
        status: 'sent',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
      setReplyText('');
    } catch (e) {
      console.error(e);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12 h-[calc(100vh-100px)] flex flex-col">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Inbox</h1>
          <p className="text-gray-500 text-sm mt-1">Communicate directly with members via WhatsApp</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex overflow-hidden">
        {/* Sidebar */}
        <div className={`w-full md:w-1/3 border-r border-gray-100 flex flex-col ${selectedConvo ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100">
            <input type="text" placeholder="Search conversations..." className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map(c => (
              <button 
                key={c.phone} 
                onClick={() => setSelectedConvo(c)}
                className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selectedConvo?.phone === c.phone ? 'bg-emerald-50 hover:bg-emerald-50' : ''}`}
              >
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-gray-900 truncate pr-2">{c.member?.name || c.phone}</h3>
                  <span className="text-xs text-gray-400 shrink-0">
                    {c.lastMessage?.timestamp ? new Date(c.lastMessage.timestamp?.seconds ? c.lastMessage.timestamp.toDate() : c.lastMessage.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">{c.lastMessage?.text || 'Image/Media'}</p>
              </button>
            ))}
            {conversations.length === 0 && (
              <div className="p-8 text-center text-gray-400 text-sm">No messages found.</div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedConvo ? (
          <div className="flex-1 flex flex-col bg-gray-50">
            <div className="bg-white p-4 border-b border-gray-100 flex items-center gap-3 shrink-0">
              <button onClick={() => setSelectedConvo(null)} className="md:hidden text-gray-500 hover:text-gray-900 p-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold">
                {(selectedConvo.member?.name || selectedConvo.phone).charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{selectedConvo.member?.name || selectedConvo.phone}</h3>
                <p className="text-xs text-gray-500">{selectedConvo.phone}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedConvo.messages.map((m: any) => {
                const isOutbound = m.direction === 'outbound';
                return (
                  <div key={m.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isOutbound ? 'bg-emerald-600 text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'}`}>
                      <p className="text-sm whitespace-pre-wrap">{m.text}</p>
                      <div className={`text-[10px] mt-1 text-right ${isOutbound ? 'text-emerald-200' : 'text-gray-400'}`}>
                         {m.timestamp ? new Date(m.timestamp?.seconds ? m.timestamp.toDate() : m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-100 shrink-0">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Type a message..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                <button type="submit" disabled={!replyText.trim() || sending} className="w-10 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center disabled:opacity-50 transition-colors">
                  <svg className="w-5 h-5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50 text-gray-400 text-sm flex-col">
            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
