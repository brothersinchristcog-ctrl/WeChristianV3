"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, orderBy } from 'firebase/firestore';

const CATEGORIES = [
  'All',
  'Stuthi Songs',
  'Aradhana Songs',
  'Offering Songs',
  'Special Songs',
  'Gospel Songs',
  'Youth Songs',
  'Christmas Songs',
  'Easter Songs',
  'Marriage Songs',
  'Thanksgiving Songs',
  'Other'
];

export default function SongsPage() {
  const [activeTab, setActiveTab] = useState<'browse' | 'songbook' | 'theme'>('browse');
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [churchId, setChurchId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [selectedSong, setSelectedSong] = useState<any>(null);

  useEffect(() => {
    fetchSongs();
    loadSavedIds();
  }, []);

  const fetchSongs = async () => {
    setLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && userDoc.data().primaryChurchId) {
        const cid = userDoc.data().primaryChurchId;
        setChurchId(cid);

        const songsRef = collection(db, 'churches', cid, 'worshipSongs');
        const snap = await getDocs(songsRef);
        const data = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        // Default sort logic
        data.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        setSongs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedIds = () => {
    try {
      const raw = localStorage.getItem('cog_my_songbook_ids');
      if (raw) setSavedIds(JSON.parse(raw));
    } catch (e) {}
  };

  const toggleSave = (song: any) => {
    const isAlreadySaved = savedIds.includes(song.id);
    let newIds: string[];
    if (isAlreadySaved) {
      newIds = savedIds.filter(id => id !== song.id);
    } else {
      newIds = [...savedIds, song.id];
    }
    setSavedIds(newIds);
    try {
      localStorage.setItem('cog_my_songbook_ids', JSON.stringify(newIds));
    } catch (e) {}
  };

  const getSongCategories = (song: any): string[] =>
    (song.category || 'Other').split(';').map((c: string) => c.trim()).filter(Boolean);

  const browseBaseList = songs.filter(s => {
    const cats = getSongCategories(s);
    if (cats.length === 1 && cats[0] === 'Theme Songs') return false;
    return selectedCategory === 'All' || cats.includes(selectedCategory);
  });

  const filteredBrowse = browseBaseList.map((s, idx) => ({ ...s, displayNumber: idx + 1 })).filter(s => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return s.displayNumber.toString() === q ||
      (s.title || '').toLowerCase().includes(q) ||
      (s.titleTe || '').toLowerCase().includes(q) ||
      (s.artist || '').toLowerCase().includes(q);
  });

  const filteredSongbook = songs.filter(s => savedIds.includes(s.id));
  const filteredTheme = songs.filter(s => getSongCategories(s).includes('Theme Songs'));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink"></div>
      </div>
    );
  }

  // Lyrics Modal View
  if (selectedSong) {
    const getYoutubeVideoId = (url: string) => {
      if (!url) return null;
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    };
    
    // Check if it's already a clean ID or full URL
    const videoId = selectedSong.youtubeId?.length === 11 ? selectedSong.youtubeId : getYoutubeVideoId(selectedSong.youtubeId || '');
    const isSaved = savedIds.includes(selectedSong.id);

    return (
      <div className="max-w-7xl mx-auto w-full bg-paper min-h-screen shadow-2xl relative flex flex-col">
        <div className="bg-ink p-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <button onClick={() => setSelectedSong(null)} className="text-white flex items-center gap-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex gap-4">
            <button onClick={() => toggleSave(selectedSong)} className="text-white">
              {isSaved ? (
                <svg className="w-6 h-6 text-gold-bright" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
              )}
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {videoId && (
            <div className="aspect-video w-full bg-black">
              <iframe 
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`}
                title={selectedSong.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          )}
          
          <div className="p-6">
            <h1 className="text-2xl font-bold text-ink mb-1 font-serif leading-tight">{selectedSong.title}</h1>
            {selectedSong.titleTe && <h2 className="text-xl text-ink-soft mb-2 font-serif">{selectedSong.titleTe}</h2>}
            
            <div className="flex flex-wrap gap-2 mb-6 mt-3">
              {getSongCategories(selectedSong).map(cat => (
                <span key={cat} className="bg-parchment text-ink px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-rule">{cat}</span>
              ))}
              {selectedSong.key && <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">Key: {selectedSong.key}</span>}
            </div>

            <div className="border-t border-rule pt-6 pb-12">
              <pre className="font-sans text-base leading-relaxed text-ink whitespace-pre-wrap">
                {selectedSong.lyrics || selectedSong.lyricsEn || selectedSong.lyricsTe || 'Lyrics not available.'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full bg-gray-50 min-h-screen pb-12 shadow-2xl relative flex flex-col">
      {/* Header */}
      <div className="bg-ink pt-4 pb-0 px-4 sticky top-0 z-10 shadow-sm">
        <h2 className="text-white font-bold text-lg mb-4">Worship Songs</h2>
        
        {/* Search */}
        <div className="relative mb-4">
          <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            placeholder="Search by number, title, or artist..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:bg-white/20 transition-colors text-sm font-medium"
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button 
            onClick={() => setActiveTab('browse')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'browse' ? 'border-gold-bright text-gold-bright' : 'border-transparent text-white/60 hover:text-white'}`}
          >
            Browse
          </button>
          <button 
            onClick={() => setActiveTab('songbook')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'songbook' ? 'border-gold-bright text-gold-bright' : 'border-transparent text-white/60 hover:text-white'}`}
          >
            My Songbook
          </button>
          <button 
            onClick={() => setActiveTab('theme')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'theme' ? 'border-gold-bright text-gold-bright' : 'border-transparent text-white/60 hover:text-white'}`}
          >
            Theme Songs
          </button>
        </div>
      </div>

      {activeTab === 'browse' && (
        <div className="bg-white border-b border-gray-200 sticky top-[138px] z-10 shadow-sm">
          <div className="flex overflow-x-auto p-3 gap-2 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full whitespace-nowrap text-xs font-bold transition-colors ${
                  selectedCategory === cat ? 'bg-ink text-white' : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 p-2">
        {activeTab === 'browse' && (
          <div className="space-y-1">
            {filteredBrowse.map((song) => (
              <button key={song.id} onClick={() => setSelectedSong(song)} className="w-full flex items-center bg-white p-3 rounded-xl border border-rule/50 shadow-sm active:bg-gray-50 text-left">
                <div className="w-10 h-10 bg-parchment rounded-lg flex items-center justify-center mr-3 border border-rule shrink-0">
                  <span className="text-ink font-bold text-sm">{song.displayNumber}</span>
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="font-bold text-ink text-sm truncate">{song.title}</h3>
                  {song.titleTe && <p className="text-xs text-ink-soft truncate font-medium">{song.titleTe}</p>}
                </div>
                {savedIds.includes(song.id) && (
                  <svg className="w-5 h-5 text-gold-deep mr-2 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                )}
                <svg className="w-5 h-5 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            ))}
            {filteredBrowse.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm font-medium">No songs found in this category.</div>
            )}
          </div>
        )}

        {activeTab === 'songbook' && (
          <div className="space-y-1 mt-2">
            {filteredSongbook.map((song, idx) => (
              <button key={song.id} onClick={() => setSelectedSong(song)} className="w-full flex items-center bg-white p-3 rounded-xl border border-rule/50 shadow-sm active:bg-gray-50 text-left">
                <div className="w-10 h-10 bg-parchment rounded-lg flex items-center justify-center mr-3 border border-rule shrink-0">
                  <span className="text-ink font-bold text-sm">{idx + 1}</span>
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="font-bold text-ink text-sm truncate">{song.title}</h3>
                  {song.titleTe && <p className="text-xs text-ink-soft truncate font-medium">{song.titleTe}</p>}
                </div>
                <button onClick={(e) => { e.stopPropagation(); toggleSave(song); }} className="p-2">
                  <svg className="w-5 h-5 text-gold-deep" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                </button>
              </button>
            ))}
            {filteredSongbook.length === 0 && (
              <div className="text-center py-16 px-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                </div>
                <h3 className="text-ink font-bold text-lg mb-2">Your Songbook is Empty</h3>
                <p className="text-gray-500 text-sm">Save your favorite songs here for quick access during worship.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'theme' && (
          <div className="space-y-1 mt-2">
            {filteredTheme.map((song, idx) => (
              <button key={song.id} onClick={() => setSelectedSong(song)} className="w-full flex items-center bg-white p-3 rounded-xl border border-rule/50 shadow-sm active:bg-gray-50 text-left">
                <div className="w-10 h-10 bg-gold-light rounded-lg flex items-center justify-center mr-3 border border-gold-deep/30 shrink-0">
                  <span className="text-gold-deep font-bold text-sm">{idx + 1}</span>
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="font-bold text-ink text-sm truncate">{song.title}</h3>
                  {song.titleTe && <p className="text-xs text-ink-soft truncate font-medium">{song.titleTe}</p>}
                </div>
                <svg className="w-5 h-5 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            ))}
            {filteredTheme.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm font-medium">No theme songs found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
