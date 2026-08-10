"use client";
import React, { useState, useEffect } from 'react';

const ENGLISH_NAMES = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
  '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
];

export default function BibleReaderPage() {
  const [selectedBook, setSelectedBook] = useState('Genesis');
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [verses, setVerses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lang, setLang] = useState('English');

  useEffect(() => {
    fetchVerses();
  }, [selectedBook, selectedChapter, lang]);

  const fetchVerses = async () => {
    setLoading(true);
    setError('');
    try {
      const bookId = ENGLISH_NAMES.indexOf(selectedBook) + 1;
      const version = lang === 'English' ? 'KJV' : 'TELBSI';
      const url = `https://bolls.life/get-text/${version}/${bookId}/${selectedChapter}/`;
      
      const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (response.ok) {
        const result = await response.json();
        if (result && Array.isArray(result)) {
          const cleaned = result.map((item: any) => ({
            ...item,
            text: item.text
              ? item.text.replace(/<S>\d*<\/S>/gi, '').replace(/<sup[^>]*>.*?<\/sup>/gi, '').replace(/<[^>]+>/g, '').trim()
              : item.text
          }));
          setVerses(cleaned);
        } else {
          setError('No verses found for this chapter.');
          setVerses([]);
        }
      } else {
        setError('Failed to fetch from Bible API.');
        setVerses([]);
      }
    } catch (e: any) {
      setError(e.message || 'Error fetching Bible text.');
      setVerses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNextChapter = () => {
    setSelectedChapter(prev => prev + 1);
  };

  const handlePrevChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter(prev => prev - 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12 h-[calc(100vh-100px)] flex flex-col">
      
      {/* Header Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <select 
            value={selectedBook} 
            onChange={e => { setSelectedBook(e.target.value); setSelectedChapter(1); }}
            className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ENGLISH_NAMES.map(book => <option key={book} value={book}>{book}</option>)}
          </select>
          
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium text-sm uppercase tracking-wider">Ch</span>
            <input 
              type="number" 
              min="1" 
              value={selectedChapter} 
              onChange={e => setSelectedChapter(parseInt(e.target.value) || 1)}
              className="w-16 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <select 
          value={lang} 
          onChange={e => setLang(e.target.value)}
          className="bg-blue-50 border border-blue-100 text-blue-700 rounded-lg px-4 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
        >
          <option value="English">English (KJV)</option>
          <option value="Telugu">Telugu (BSI)</option>
        </select>
      </div>

      {/* Reader Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col relative">
        <div className="bg-gray-50/80 border-b border-gray-100 p-4 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md">
          <button onClick={handlePrevChapter} disabled={selectedChapter === 1} className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 disabled:opacity-30 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <h2 className="text-xl font-bold font-serif text-gray-900">
            {selectedBook} {selectedChapter}
          </h2>
          <button onClick={handleNextChapter} className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-10 font-medium">{error}</div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {verses.map(v => (
                <div key={v.verse} className="flex group hover:bg-gray-50/50 rounded-lg p-2 transition-colors">
                  <span className="w-8 flex-shrink-0 text-right pr-3 text-xs font-bold text-gray-400 mt-1 select-none">
                    {v.verse}
                  </span>
                  <p className={`flex-1 text-lg leading-relaxed text-gray-800 ${lang === 'Telugu' ? 'font-serif' : 'font-serif'}`}>
                    {v.text}
                  </p>
                </div>
              ))}
              {verses.length === 0 && !loading && (
                <p className="text-center text-gray-500">No verses available.</p>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
