"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, orderBy } from 'firebase/firestore';

const ALL_CATEGORIES = [
  'All',
  'Bible Study',
  "Women's Fasting Prayer",
  'Second Saturday Prayer',
  'Sunday Service',
  'All-Night Prayer',
  'Youth Meeting',
  'Revival Meeting',
  'Special Messages',
  'Shorts',
  'Testimonies',
  'Uncategorized',
];

export default function MemberSermonsPage() {
  const [sermons, setSermons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [churchId, setChurchId] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSermons();
  }, []);

  const fetchSermons = async () => {
    setLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && userDoc.data().primaryChurchId) {
        const cid = userDoc.data().primaryChurchId;
        setChurchId(cid);

        const sermonsRef = collection(db, 'churches', cid, 'sermons');
        const q = query(sermonsRef, orderBy('date', 'desc'));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setSermons(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (cat: string) => {
    setCollapsedSections(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const buildSections = () => {
    const filtered = activeCategory === 'All' ? sermons : sermons.filter(s => {
      let catsArray: string[] = [];
      if (typeof s.categories === 'string' && s.categories.trim().length > 0) {
        catsArray = s.categories.split(';').map((c: string) => c.trim()).filter(Boolean);
      } else if (Array.isArray(s.categories)) {
        catsArray = s.categories;
      }
      
      if (activeCategory === 'Uncategorized') return catsArray.length === 0;
      return catsArray.includes(activeCategory);
    });

    if (activeCategory !== 'All') {
      return [{ title: activeCategory, data: filtered }];
    }

    const grouped: Record<string, any[]> = {};
    filtered.forEach(sermon => {
      let cats: string[] = [];
      if (typeof sermon.categories === 'string' && sermon.categories.trim().length > 0) {
        cats = sermon.categories.split(';').map((c: string) => c.trim()).filter(Boolean);
      } else if (Array.isArray(sermon.categories) && sermon.categories.length > 0) {
        cats = sermon.categories;
      }
      
      if (cats.length === 0) cats = ['Uncategorized'];

      cats.forEach((cat: string) => {
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(sermon);
      });
    });

    return ALL_CATEGORIES.filter(c => c !== 'All' && grouped[c]?.length > 0)
      .map(cat => ({ title: cat, data: grouped[cat] }));
  };

  const sections = buildSections();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full bg-gray-50 min-h-screen pb-12 shadow-2xl relative">
      {/* Mobile-like Header */}
      <div className="bg-ink p-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <h2 className="text-white font-bold text-lg">Sermons</h2>
      </div>

      <div className="bg-white border-b border-gray-200 sticky top-14 z-10 shadow-sm">
        <div className="flex overflow-x-auto p-3 gap-2 scrollbar-hide">
          {ALL_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-bold transition-colors ${
                activeCategory === cat ? 'bg-ink text-white' : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {sections.map(section => (
          <div key={section.title} className="mb-6">
            <button 
              onClick={() => toggleSection(section.title)}
              className="flex justify-between items-center w-full mb-3"
            >
              <h2 className="text-sm font-bold text-ink uppercase tracking-wider">{section.title}</h2>
              <svg className={`w-5 h-5 text-gray-400 transition-transform ${collapsedSections[section.title] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            
            {!collapsedSections[section.title] && (
              <div className="space-y-4">
                {section.data.map(item => (
                  <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="relative aspect-video bg-ink-2">
                      {item.youtubeId ? (
                        <img src={`https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`} alt="Thumbnail" className="w-full h-full object-cover opacity-80" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-12 h-12 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <a 
                          href={item.youtubeId ? `https://www.youtube.com/watch?v=${item.youtubeId}` : item.audioUrl || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-14 h-14 bg-clay/90 rounded-full flex items-center justify-center border-2 border-white/20 hover:scale-110 transition-transform shadow-lg"
                        >
                          <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        </a>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-bold text-ink text-base mb-1 leading-tight line-clamp-2">
                        {item.title}{item.titleTelugu ? ` · ${item.titleTelugu}` : ''}
                      </h3>
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        {item.pastor || 'Brother Y. Rajesh'} · {item.date || 'N/A'}{item.duration && item.duration !== 'N/A' ? ` · ${item.duration}` : ''}
                      </p>
                      
                      {item.scripture && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                          <div className="w-6 h-6 rounded-full bg-parchment flex items-center justify-center border border-rule">
                            <svg className="w-3 h-3 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                          </div>
                          <span className="text-xs font-bold text-ink">{item.scripture}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {sections.length === 0 && (
          <div className="text-center py-12 text-gray-500 font-medium text-sm">
            No sermons found for this category.
          </div>
        )}
      </div>
    </div>
  );
}
