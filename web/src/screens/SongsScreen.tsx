"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, orderBy } from 'firebase/firestore';

export default function SongsPage() {
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [churchId, setChurchId] = useState<string>('');
  const [selectedSong, setSelectedSong] = useState<any>(null);

  useEffect(() => {
    fetchSongs();
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

        const songsRef = collection(db, 'churches', cid, 'songs');
        const q = query(songsRef, orderBy('title', 'asc'));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setSongs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getYoutubeVideoId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>;
  }

  if (selectedSong) {
    const videoId = getYoutubeVideoId(selectedSong.videoUrl || '');
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
        <button onClick={() => setSelectedSong(null)} className="flex items-center text-gray-600 hover:text-teal-600 font-semibold mb-4 transition-colors">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          Back to Songs
        </button>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10">
          <h1 className="text-3xl font-bold text-gray-900 font-serif mb-2">{selectedSong.title}</h1>
          {selectedSong.titleTelugu && <h2 className="text-xl text-gray-500 font-serif mb-6">{selectedSong.titleTelugu}</h2>}
          
          {videoId && (
            <div className="aspect-video w-full rounded-xl overflow-hidden mb-8 bg-gray-100">
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

          <div className="prose max-w-none">
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Lyrics</h3>
            <div className="whitespace-pre-wrap font-serif text-lg leading-loose text-gray-800">
              {selectedSong.lyrics || selectedSong.lyricsEn || selectedSong.lyricsTe || 'Lyrics not available.'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-teal-50 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-gray-900 font-serif">Worship Songs</h1>
          <p className="text-gray-500 mt-2 text-sm max-w-lg leading-relaxed">
            Access lyrics and worship videos for our church's songbook.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <ul className="divide-y divide-gray-100">
          {songs.map((song, index) => (
            <li key={song.id}>
              <button 
                onClick={() => setSelectedSong(song)}
                className="w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 text-gray-500 rounded-lg flex items-center justify-center font-bold font-serif group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 group-hover:text-teal-700 transition-colors">{song.title}</h3>
                    {song.titleTelugu && <p className="text-sm text-gray-500">{song.titleTelugu}</p>}
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-300 group-hover:text-teal-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </button>
            </li>
          ))}
          {songs.length === 0 && (
            <li className="p-12 text-center text-gray-500">No songs available yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
