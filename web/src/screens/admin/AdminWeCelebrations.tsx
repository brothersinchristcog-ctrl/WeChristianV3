"use client";
import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, deleteDoc, setDoc } from 'firebase/firestore';

export default function AdminWeCelebrationsPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [churchId, setChurchId] = useState<string>('');
  
  const [view, setView] = useState<'list' | 'personalize' | 'preview'>('list');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  
  // Greeting state
  const [greetingMessage, setGreetingMessage] = useState('');
  const [themeColor, setThemeColor] = useState('#1a2d5a');
  const [verseRef, setVerseRef] = useState('');
  const [verseText, setVerseText] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);

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

        const snap = await getDocs(collection(db, 'churches', cid, 'members'));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        
        // Filter to only those with DOB
        const withDob = data.filter(m => m.dateOfBirth);
        // Extremely simple sort by upcoming
        withDob.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        
        setMembers(withDob);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalize = (member: any) => {
    setSelectedMember(member);
    setGreetingMessage(`Dear ${member.name.split(' ')[0]}, wishing you a joy-filled birthday surrounded by God's love and grace. May this new year of life be your best yet!`);
    setVerseRef('Numbers 6:24-25');
    setVerseText('The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you.');
    setView('personalize');
  };

  const handlePreview = () => {
    setView('preview');
    setTimeout(drawCanvas, 100);
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background
    ctx.fillStyle = themeColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw pattern (simple lines)
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    for(let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 100, canvas.height);
      ctx.stroke();
    }

    // Draw white card area
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 20;
    ctx.fillRect(40, 100, canvas.width - 80, canvas.height - 140);
    ctx.shadowBlur = 0;

    // Draw text
    ctx.fillStyle = themeColor;
    ctx.font = 'bold 36px serif';
    ctx.textAlign = 'center';
    ctx.fillText('Happy Birthday', canvas.width / 2, 160);

    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(selectedMember?.name || 'Member', canvas.width / 2, 210);

    ctx.fillStyle = '#4B5563';
    ctx.font = '20px sans-serif';
    
    // Simple text wrap
    const words = greetingMessage.split(' ');
    let line = '';
    let y = 280;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > canvas.width - 160 && n > 0) {
        ctx.fillText(line, canvas.width / 2, y);
        line = words[n] + ' ';
        y += 30;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, canvas.width / 2, y);

    // Verse
    ctx.fillStyle = themeColor;
    ctx.font = 'italic 18px serif';
    ctx.fillText(`"${verseText}"`, canvas.width / 2, y + 60);
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`- ${verseRef}`, canvas.width / 2, y + 90);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/jpeg');
    const link = document.createElement('a');
    link.download = `Greeting_${selectedMember?.name}.jpg`;
    link.href = dataUrl;
    link.click();
  };

  const handleSendWhatsApp = () => {
    const text = `*Happy Birthday ${selectedMember?.name}!* 🎉\n\n${greetingMessage}\n\n_${verseText}_ - ${verseRef}\n\n- From your church family`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (loading && view === 'list') {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-600"></div></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
      {view === 'list' && (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">WeCelebrations</h1>
              <p className="text-gray-500 text-sm mt-1">Generate beautiful greeting cards for upcoming birthdays and anniversaries.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Member</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Date of Birth</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="p-4 font-bold text-gray-900">{m.name}</td>
                    <td className="p-4 text-gray-600">{m.dateOfBirth}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handlePersonalize(m)} className="px-4 py-1.5 bg-fuchsia-100 hover:bg-fuchsia-200 text-fuchsia-700 font-bold rounded-lg text-sm transition-colors">
                        Create Card
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {view === 'personalize' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Personalize Greeting</h2>
              <p className="text-gray-500 text-sm">For {selectedMember?.name}</p>
            </div>
            <button type="button" onClick={() => setView('list')} className="text-gray-500 hover:text-gray-700 text-sm font-semibold">Cancel</button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Greeting Message</label>
              <textarea value={greetingMessage} onChange={e => setGreetingMessage(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 outline-none h-32"></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Bible Verse Reference</label>
                <input type="text" value={verseRef} onChange={e => setVerseRef(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Theme Color</label>
                <div className="flex gap-2">
                  {['#1a2d5a', '#A24B34', '#3E6B52', '#A67C3D', '#D946EF'].map(color => (
                    <button key={color} type="button" onClick={() => setThemeColor(color)} className={`w-12 h-12 rounded-full border-4 ${themeColor === color ? 'border-gray-900 scale-110' : 'border-transparent'} transition-all`} style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Bible Verse Text</label>
              <textarea value={verseText} onChange={e => setVerseText(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 outline-none h-24"></textarea>
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button onClick={handlePreview} className="px-8 py-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold rounded-xl shadow-sm transition-colors">
              Generate Card Preview
            </button>
          </div>
        </div>
      )}

      {view === 'preview' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <button type="button" onClick={() => setView('personalize')} className="text-gray-500 hover:text-gray-900 font-semibold px-4 py-2">Back to Edit</button>
            <div className="flex gap-2">
              <button onClick={handleDownload} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition-colors">Download Image</button>
              <button onClick={handleSendWhatsApp} className="px-4 py-2 bg-[#25D366] hover:bg-[#1DA851] text-white font-bold rounded-lg transition-colors flex items-center gap-2">
                Share to WhatsApp
              </button>
            </div>
          </div>

          <div className="bg-gray-100 rounded-3xl p-8 flex justify-center items-center shadow-inner overflow-hidden">
            <canvas 
              ref={canvasRef} 
              width={600} 
              height={800} 
              className="max-w-full h-auto rounded-xl shadow-2xl"
              style={{ maxWidth: '100%', maxHeight: '70vh' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
