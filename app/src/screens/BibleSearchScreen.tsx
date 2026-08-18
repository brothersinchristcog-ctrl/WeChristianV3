import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList,
  Platform
} from 'react-native';
import { ChevronLeft, Search, BookOpen, CheckSquare, Square, BookMarked, Filter, ChevronDown, X } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_TELUGU_BIBLE: any = require('../../assets/telugu_bible.json');

const ENGLISH_NAMES = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
  '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
];

const TELUGU_NAMES = [
  'ఆదికాండము', 'నిర్గమకాండము', 'లేవీయకాండము', 'సంఖ్యాకాండము', 'ద్వితీయోపదేశకాండము',
  'యెహోషువ', 'న్యాయాధిపతులు', 'రూతు', '1 సమూయేలు', '2 సమూయేలు',
  '1 రాజులు', '2 రాజులు', '1 దినవృత్తాంతములు', '2 దినవృత్తాంతములు', 'ఎజ్రా',
  'నెహెమ్యా', 'ఎస్తేరు', 'యోబు', 'కీర్తనల గ్రంథము', 'సామెతలు',
  'ప్రసంగి', 'పరమగీతము', 'యెషయా', 'యిర్మియా', 'విలాపవాక్యములు',
  'యెహెజ్కేలు', 'దానియేలు', 'హోషేయ', 'యోవేలు', 'ఆమోసు',
  'ఓబద్యా', 'యోనా', 'మీకా', 'నహూము', 'హబక్కూకు',
  'జెఫన్యా', 'హగ్గయి', 'జెకర్యా', 'మలాకీ',
  'మత్తయి సువార్త', 'మార్కు సువార్త', 'లూకా సువార్త', 'యోహాను సువార్త', 'అపొస్తలుల కార్యములు',
  'రోమీయులకు వ్రాసిన పత్రిక', '1 కొరింథీయులకు', '2 కొరింథీయులకు', 'గలతీయులకు', 'ఎఫెసీయులకు',
  'ఫిలిప్పీయులకు', 'కొలొస్సయులకు', '1 థెస్సలొనీకయులకు', '2 థెస్సలొనీకయులకు', '1 తిమోతికి',
  '2 తిమోతికి', 'తీతుకు', 'ఫిలేమోనుకు', 'హెబ్రీయులకు', 'యాకోబు',
  '1 పేతురు', '2 పేతురు', '1 యోహాను', '2 యోహాను', '3 యోహాను',
  'యూదా', 'ప్రకటన గ్రంథము'
];

const HighlightText = ({ text, highlight, style, highlightStyle }: any) => {
  if (!highlight || !highlight.trim() || !text) return <Text style={style}>{text}</Text>;
  
  const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));
  
  return (
    <Text style={style}>
      {parts.map((part: string, i: number) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <Text key={i} style={highlightStyle}>{part}</Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </Text>
  );
};

export default function BibleSearchScreen({ route, navigation }: any) {
  const { initialQuery, initialLang } = route.params || {};
  const { isDark } = useTheme();
  
  const [query, setQuery] = useState(initialQuery || '');
  const [lang, setLang] = useState<'English' | 'Telugu'>(initialLang || 'Telugu');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedVerses, setSelectedVerses] = useState<Set<string>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);

  // Filters State
  const [filterTestament, setFilterTestament] = useState<'All' | 'Old' | 'New'>('All');
  const [filterBook, setFilterBook] = useState<number | null>(null);
  const [filterChapter, setFilterChapter] = useState<number | null>(null);
  const [filterVerse, setFilterVerse] = useState<number | null>(null);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'Testament' | 'Book' | 'Chapter' | 'Verse'>('Testament');

  const getModalOptions = () => {
    switch(modalType) {
      case 'Testament':
        return [
          { label: 'All', value: 'All' },
          { label: 'Old Testament (ఆదికాండము - మలాకీ)', value: 'Old' },
          { label: 'New Testament (మత్తయి - ప్రకటన)', value: 'New' }
        ];
      case 'Book': {
        let start = 0, end = 66;
        if (filterTestament === 'Old') end = 39;
        if (filterTestament === 'New') start = 39;
        
        const books: any[] = [{ label: 'All Books', value: null }];
        for(let i=start; i<end; i++) {
          books.push({ label: `${ENGLISH_NAMES[i]} · ${TELUGU_NAMES[i]}`, value: i });
        }
        return books;
      }
      case 'Chapter': {
        if (filterBook === null) return [{ label: 'Select a Book first', value: null }];
        const chapCount = LOCAL_TELUGU_BIBLE.Book[filterBook].Chapter.length;
        const chaps: any[] = [{ label: 'All Chapters', value: null }];
        for(let i=1; i<=chapCount; i++) chaps.push({ label: `Chapter ${i}`, value: i });
        return chaps;
      }
      case 'Verse': {
        if (filterBook === null || filterChapter === null) return [{ label: 'Select Book & Chapter first', value: null }];
        const verseCount = LOCAL_TELUGU_BIBLE.Book[filterBook].Chapter[filterChapter - 1].Verse.length;
        const verses: any[] = [{ label: 'All Verses', value: null }];
        for(let i=1; i<=verseCount; i++) verses.push({ label: `Verse ${i}`, value: i });
        return verses;
      }
      default: return [];
    }
  };

  const handleSelectFilter = (val: any) => {
    let t = filterTestament, b = filterBook, c = filterChapter, v = filterVerse;
    switch(modalType) {
      case 'Testament':
        setFilterTestament(val); t = val;
        setFilterBook(null); b = null;
        setFilterChapter(null); c = null;
        setFilterVerse(null); v = null;
        break;
      case 'Book':
        setFilterBook(val); b = val;
        setFilterChapter(null); c = null;
        setFilterVerse(null); v = null;
        break;
      case 'Chapter':
        setFilterChapter(val); c = val;
        setFilterVerse(null); v = null;
        break;
      case 'Verse':
        setFilterVerse(val); v = val;
        break;
    }
    setModalVisible(false);
    
    // Auto-search if there's a query
    if (query.trim().length > 0) {
      setTimeout(() => performSearch(query, { testament: t, book: b, chapter: c, verse: v }), 100);
    }
  };

  const toggleVerseSelection = (id: string) => {
    setSelectedVerses(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getSelectedVersesText = () => {
    return results
      .filter(r => selectedVerses.has(r.id))
      .map(r => {
        const ref = `${r.book} ${r.chapter}:${r.verse}`;
        const en = r.textEn ? `${r.textEn}` : '';
        const te = r.textTe ? `${r.textTe}` : '';
        return `📖 ${ref}\n${en}${en && te ? '\n' : ''}${te}`;
      })
      .join('\n\n');
  };

  const saveToSermonNotes = async () => {
    const content = getSelectedVersesText();
    if (!content) return;
    
    const dateStr = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    try {
      const timestampStr = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const newNote = {
        id: Date.now().toString(),
        title: dateStr,
        content: content,
        timestamp: timestampStr
      };

      const stored = await AsyncStorage.getItem('@SermonPersonalNotes');
      const existingNotes = stored ? JSON.parse(stored) : [];
      const updatedNotes = [newNote, ...existingNotes];
      await AsyncStorage.setItem('@SermonPersonalNotes', JSON.stringify(updatedNotes));

      setSelectedVerses(new Set()); // clear selection
      navigation.navigate('MemberNotes', { refreshId: Date.now() });
    } catch (error) {
      console.error('Error saving note directly:', error);
      // Fallback
      navigation.navigate('MemberNotes', { prefillTitle: dateStr, prefillContent: content });
    }
  };

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }
      
      const isEnglishQuery = /[a-zA-Z]/.test(query);
      if (isEnglishQuery) {
        // English → fetch Telugu transliteration suggestions from Google
        try {
          const transResponse = await fetch(`https://inputtools.google.com/request?text=${encodeURIComponent(query)}&itc=te-t-i0-und&num=6`);
          if (transResponse.ok) {
            const transData = await transResponse.json();
            const suggestionsList: string[] = transData?.[1]?.[0]?.[1] || [];
            setSuggestions(suggestionsList.slice(0, 6));
          }
        } catch (e) {
          // silently ignore suggestion fetch errors
        }
      } else {
        // Telugu → extract unique matching words from local Bible JSON
        try {
          const q = query.trim();
          const wordSet = new Set<string>();
          const books = LOCAL_TELUGU_BIBLE?.Book || [];
          outer: for (let b = 0; b < books.length; b++) {
            const chapters = books[b]?.Chapter || [];
            for (let c = 0; c < chapters.length; c++) {
              const verses = chapters[c]?.Verse || [];
              for (let v = 0; v < verses.length; v++) {
                const text: string = verses[v]?.Verse || '';
                if (text.includes(q)) {
                  // Extract words containing the query
                  const words = text.split(/[\s,;:.!?]+/);
                  words.forEach(word => {
                    if (word.includes(q) && word.length > q.length) {
                      wordSet.add(word);
                    }
                  });
                  if (wordSet.size >= 6) break outer;
                }
              }
            }
          }
          const teluguSuggestions = Array.from(wordSet).slice(0, 6);
          setSuggestions(teluguSuggestions.length > 0 ? teluguSuggestions : []);
        } catch (e) {
          setSuggestions([]);
        }
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const performSearch = async (searchStr: string, overrideFilters?: { testament: any, book: any, chapter: any, verse: any }) => {
    if (!searchStr.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    setError(null);
    setResults([]);
    setSelectedVerses(new Set());

    const activeTestament = overrideFilters ? overrideFilters.testament : filterTestament;
    const activeBook = overrideFilters ? overrideFilters.book : filterBook;
    const activeChapter = overrideFilters ? overrideFilters.chapter : filterChapter;
    const activeVerse = overrideFilters ? overrideFilters.verse : filterVerse;

    try {
      let mergedResults: any[] = [];
      const isEnglishQuery = /[a-zA-Z]/.test(searchStr);

      if (isEnglishQuery) {
        // 1. Fetch English Meaning Search (Bolls API)
        try {
          const response = await fetch(`https://bolls.life/search/KJV/?search=${encodeURIComponent(searchStr)}&match_case=false&match_whole=false`);
          if (response.ok) {
            const data = await response.json();
            const filteredData = data.filter((item: any) => {
              const bookIndex = item.book - 1;
              if (activeTestament === 'Old' && bookIndex > 38) return false;
              if (activeTestament === 'New' && bookIndex <= 38) return false;
              if (activeBook !== null && bookIndex !== activeBook) return false;
              if (activeChapter !== null && item.chapter !== activeChapter) return false;
              if (activeVerse !== null && item.verse !== activeVerse) return false;
              return true;
            });
            const mapped = filteredData.map((item: any) => {
              const bookIndex = item.book - 1;
              const chapterIndex = item.chapter - 1;
              const verseIndex = item.verse - 1;
              
              let teluguText = '';
              if (LOCAL_TELUGU_BIBLE?.Book?.[bookIndex]?.Chapter?.[chapterIndex]?.Verse?.[verseIndex]) {
                teluguText = LOCAL_TELUGU_BIBLE.Book[bookIndex].Chapter[chapterIndex].Verse[verseIndex].Verse;
              }

              const bookNameEn = ENGLISH_NAMES[bookIndex] || `Book ${item.book}`;
              const bookNameTe = TELUGU_NAMES[bookIndex] || `Book ${item.book}`;
              const cleanEnText = item.text
                ? item.text.replace(/<S>\d*<\/S>/gi, '').replace(/<[^>]+>/g, '').replace(/\s{2,}/g, ' ').trim() 
                : '';

              return {
                id: `en-${item.book}-${item.chapter}-${item.verse}`,
                book: bookNameEn,
                bookTe: bookNameTe,
                bookIndex: item.book,
                chapter: item.chapter,
                verse: item.verse,
                textEn: cleanEnText,
                textTe: teluguText,
                langMatched: 'English',
                highlightEn: searchStr,
                highlightTe: ''
              };
            });
            mergedResults = [...mergedResults, ...mapped];
          }
        } catch (e) {
          console.warn("English search failed", e);
        }

        // 2. Transliterate and Search Local Telugu (Handles 'devudu' -> 'దేవుడు')
        try {
          const transResponse = await fetch(`https://inputtools.google.com/request?text=${encodeURIComponent(searchStr)}&itc=te-t-i0-und&num=1`);
          if (transResponse.ok) {
            const transData = await transResponse.json();
            const transliteratedWord = transData?.[1]?.[0]?.[1]?.[0];
            
            if (transliteratedWord) {
              const localHits = searchLocalTelugu(transliteratedWord, { testament: activeTestament, book: activeBook, chapter: activeChapter, verse: activeVerse });
              // Merge but avoid duplicates
              localHits.forEach(hit => {
                if (!mergedResults.find(r => r.bookIndex === hit.bookIndex && r.chapter === hit.chapter && r.verse === hit.verse)) {
                  mergedResults.push(hit);
                }
              });
            }
          }
        } catch (e) {
          console.warn("Transliteration failed", e);
        }

        setResults(mergedResults);
      } else {
        // Search locally in Telugu directly
        setResults(searchLocalTelugu(searchStr, { testament: activeTestament, book: activeBook, chapter: activeChapter, verse: activeVerse }));
      }
    } catch (err: any) {
      setError('An error occurred while searching. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const searchLocalTelugu = (queryText: string, filters: { testament: any, book: any, chapter: any, verse: any }) => {
    const localResults: any[] = [];
    const limit = 100;
    
    let startBook = 0;
    let endBook = LOCAL_TELUGU_BIBLE.Book.length;
    
    if (filters.testament === 'Old') endBook = 39;
    else if (filters.testament === 'New') startBook = 39;
    
    if (filters.book !== null) {
      startBook = filters.book;
      endBook = filters.book + 1;
    }
    
    for (let b = startBook; b < endBook; b++) {
      const bookData = LOCAL_TELUGU_BIBLE.Book[b];
      if (!bookData) continue;
      
      let startChap = 0;
      let endChap = bookData.Chapter.length;
      if (filters.chapter !== null) {
        startChap = filters.chapter - 1;
        endChap = filters.chapter;
      }
      
      for (let c = startChap; c < endChap; c++) {
        const chapterData = bookData.Chapter[c];
        if (!chapterData) continue;
        
        let startVerse = 0;
        let endVerse = chapterData.Verse.length;
        if (filters.verse !== null) {
          startVerse = filters.verse - 1;
          endVerse = filters.verse;
        }

        for (let v = startVerse; v < endVerse; v++) {
          const verseData = chapterData.Verse[v];
          if (!verseData) continue;
          
          if (verseData.Verse.includes(queryText)) {
            localResults.push({
              id: `te-${b + 1}-${c + 1}-${v + 1}`,
              book: ENGLISH_NAMES[b] || `Book ${b + 1}`,
              bookTe: TELUGU_NAMES[b] || `Book ${b + 1}`,
              bookIndex: b + 1,
              chapter: c + 1,
              verse: v + 1,
              textEn: '', 
              textTe: verseData.Verse,
              langMatched: 'Telugu',
              highlightEn: '',
              highlightTe: queryText
            });
            if (localResults.length >= limit) return localResults;
          }
        }
      }
    }
    return localResults;
  };

  const handleVerseClick = (item: any) => {
    navigation.navigate('BibleReader', {
      bookName: item.book,
      chapter: item.chapter,
      lang: lang,
      targetVerse: item.verse
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => {
          if (hasSearched) {
            setHasSearched(false);
            setResults([]);
            setQuery('');
            setSuggestions([]);
          } else if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('Bible');
          }
        }}>
          <ChevronLeft color="#fff" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verse Search</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Input + Dropdown Suggestions wrapper - hide when results are shown */}
      {!hasSearched && (
        <View style={{ marginHorizontal: 20, zIndex: 100 }}>
          <View style={[styles.searchContainer, { backgroundColor: isDark ? '#1e293b' : '#fff', marginHorizontal: 0, marginTop: 16, marginBottom: 0 }]}>
            <TouchableOpacity onPress={() => performSearch(query)} style={{ padding: 4, marginRight: 6 }}>
              <Search size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>
            <TextInput
              style={[styles.searchInput, { color: isDark ? '#fff' : '#0f172a' }]}
              placeholder="Search words or phrases..."
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => performSearch(query)}
              returnKeyType="search"
              autoFocus={!initialQuery}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSuggestions([]); }} style={{ padding: 8 }}>
                <Text style={styles.clearBtn}>×</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Dropdown Suggestions */}
          {suggestions.length > 0 && (
            <View style={[styles.suggestionDropdown, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
              {suggestions.slice(0, 6).map((sugg, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.suggestionItem,
                    { borderBottomColor: isDark ? '#334155' : '#f1f5f9' },
                    idx === suggestions.slice(0, 6).length - 1 && { borderBottomWidth: 0 }
                  ]}
                  onPress={() => { setQuery(sugg); performSearch(sugg); setSuggestions([]); }}
                >
                  <Search size={14} color={isDark ? '#64748b' : '#94a3b8'} style={{ marginRight: 10 }} />
                  <Text style={[styles.suggestionItemTxt, { color: isDark ? '#f1f5f9' : '#0f172a' }]}>{sugg}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Filters Row - always shown so user can refine search */}
      <View style={styles.filtersRow}>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              { backgroundColor: filterTestament !== 'All' ? '#1a2d5a' : (isDark ? '#1e293b' : '#fff') }
            ]}
            onPress={() => { setModalType('Testament'); setModalVisible(true); }}
          >
            <Text style={[styles.filterBtnTxt, { color: filterTestament !== 'All' ? '#fff' : (isDark ? '#94a3b8' : '#64748b') }]}>
              {filterTestament === 'All' ? 'Testament' : filterTestament === 'Old' ? '📖 Old' : '✝️ New'}
            </Text>
            <ChevronDown size={12} color={filterTestament !== 'All' ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterBtn,
              { backgroundColor: filterBook !== null ? '#1a2d5a' : (isDark ? '#1e293b' : '#fff') }
            ]}
            onPress={() => { setModalType('Book'); setModalVisible(true); }}
          >
            <Text style={[styles.filterBtnTxt, { color: filterBook !== null ? '#fff' : (isDark ? '#94a3b8' : '#64748b') }]} numberOfLines={1}>
              {filterBook !== null ? `📚 ${ENGLISH_NAMES[filterBook]}` : 'Book'}
            </Text>
            <ChevronDown size={12} color={filterBook !== null ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterBtn,
              { backgroundColor: filterChapter !== null ? '#1a2d5a' : (isDark ? '#1e293b' : '#fff') }
            ]}
            onPress={() => { setModalType('Chapter'); setModalVisible(true); }}
          >
            <Text style={[styles.filterBtnTxt, { color: filterChapter !== null ? '#fff' : (isDark ? '#94a3b8' : '#64748b') }]}>
              {filterChapter !== null ? `Ch ${filterChapter}` : 'Chapter'}
            </Text>
            <ChevronDown size={12} color={filterChapter !== null ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterBtn,
              { backgroundColor: filterVerse !== null ? '#1a2d5a' : (isDark ? '#1e293b' : '#fff') }
            ]}
            onPress={() => { setModalType('Verse'); setModalVisible(true); }}
          >
            <Text style={[styles.filterBtnTxt, { color: filterVerse !== null ? '#fff' : (isDark ? '#94a3b8' : '#64748b') }]}>
              {filterVerse !== null ? `V ${filterVerse}` : 'Verse'}
            </Text>
            <ChevronDown size={12} color={filterVerse !== null ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} />
          </TouchableOpacity>
        </View>

      {/* Results */}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#1a2d5a" />
            <Text style={[styles.loadingText, { color: isDark ? '#94a3b8' : '#64748b' }]}>Searching scriptures...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : results.length > 0 ? (
          <View style={styles.resultsList}>
            {/* Results header with count + clear/filter buttons */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={[styles.resultsCount, { color: isDark ? '#94a3b8' : '#64748b', marginBottom: 0 }]}>
                Found {results.length} results
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(filterTestament !== 'All' || filterBook !== null || filterChapter !== null || filterVerse !== null) && (
                  <TouchableOpacity
                    style={{ backgroundColor: '#1a2d5a', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}
                    onPress={() => { setFilterTestament('All'); setFilterBook(null); setFilterChapter(null); setFilterVerse(null); setTimeout(() => performSearch(query, {testament: 'All', book: null, chapter: null, verse: null}), 100); }}
                  >
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Clear Filters ×</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            {results.map((item) => {
              const isSelected = selectedVerses.has(item.id);
              return (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.resultCard, { backgroundColor: isDark ? '#1e293b' : '#fff',
                  borderWidth: isSelected ? 2 : 0, borderColor: isSelected ? '#1a2d5a' : 'transparent' }]}
                onPress={() => handleVerseClick(item)}
                onLongPress={() => toggleVerseSelection(item.id)}
                delayLongPress={300}
              >
                {/* Selection Checkbox */}
                <TouchableOpacity
                  style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}
                  onPress={() => toggleVerseSelection(item.id)}
                >
                  {isSelected
                    ? <CheckSquare size={20} color="#1a2d5a" />
                    : <Square size={20} color="#cbd5e1" />}
                </TouchableOpacity>
                <View style={styles.referenceBadge}>
                  <BookOpen size={14} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.referenceText}>{item.book} {item.chapter}:{item.verse} · {item.bookTe} {item.chapter}:{item.verse}</Text>
                </View>
                
                {item.langMatched === 'English' && item.textEn ? (
                  <HighlightText 
                    text={item.textEn}
                    highlight={item.highlightEn}
                    style={[styles.verseTextEn, { color: isDark ? '#e2e8f0' : '#1e293b' }]}
                    highlightStyle={{ backgroundColor: 'rgba(250, 204, 21, 0.4)', color: isDark ? '#fde047' : '#854d0e', fontWeight: 'bold' }}
                  />
                ) : null}
                
                {item.textTe ? (
                  <HighlightText 
                    text={item.textTe}
                    highlight={item.highlightTe}
                    style={[styles.verseTextTe, { color: isDark ? '#cbd5e1' : '#475569', marginTop: item.langMatched === 'English' ? 8 : 0 }]}
                    highlightStyle={{ backgroundColor: 'rgba(250, 204, 21, 0.4)', color: isDark ? '#fde047' : '#854d0e', fontWeight: 'bold' }}
                  />
                ) : null}
              </TouchableOpacity>
              );
            })}
          </View>
        ) : query.length > 0 && !loading ? (
          <View style={styles.centerContainer}>
            <Text style={[styles.noResultsText, { color: isDark ? '#94a3b8' : '#64748b' }]}>No verses found.</Text>
          </View>
        ) : null}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Save to Sermon Notes Floating Button ── */}
      {selectedVerses.size > 0 && (
        <View style={styles.saveNotesBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.saveNotesCount}>{selectedVerses.size} verse{selectedVerses.size > 1 ? 's' : ''} selected</Text>
            <Text style={styles.saveNotesHint}>Tap to save to Sermon Notes</Text>
          </View>
          <TouchableOpacity style={styles.saveNotesBtn} onPress={saveToSermonNotes}>
            <BookMarked size={18} color="#fff" />
            <Text style={styles.saveNotesBtnTxt}>Save to Notes</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Bottom Sheet Modal for Filters ── */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#0f172a' }]}>Select {modalType}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={24} color={isDark ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={getModalOptions()}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.modalOption, { borderBottomColor: isDark ? '#334155' : '#f1f5f9' }]}
                  onPress={() => handleSelectFilter(item.value)}
                >
                  <Text style={[styles.modalOptionTxt, { color: isDark ? '#e2e8f0' : '#334155' }]}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight ?? 24) + 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: '#1a2d5a',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '600'
  },
  clearBtn: {
    fontSize: 20,
    color: '#94a3b8',
    paddingHorizontal: 5
  },
  emptySub: { fontSize: 13, color: '#94a3b8', marginTop: 8, textAlign: 'center' },
  suggestionTxt: { fontSize: 16, fontWeight: '600' },
  scroll: { flex: 1, paddingHorizontal: 20 },
  centerContainer: {
    marginTop: 50,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    marginTop: 15,
    fontSize: 14,
    fontWeight: '600'
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600'
  },
  noResultsText: {
    fontSize: 15,
    fontWeight: '600'
  },
  resultsList: {
    marginTop: 10,
    gap: 15
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 5
  },
  resultCard: {
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }
  },
  referenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#c0392b',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12
  },
  referenceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800'
  },
  verseTextEn: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500'
  },
  verseTextTe: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '600'
  },
  saveNotesBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2d5a',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  saveNotesCount: { color: '#fff', fontSize: 14, fontWeight: '800' },
  saveNotesHint: { color: '#aac4e8', fontSize: 11, marginTop: 2 },
  saveNotesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#c0392b',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  saveNotesBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },

  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  filterChipTxt: { fontSize: 12, fontWeight: '600', marginRight: 4 },

  filtersRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 12,
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  filterBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },

  suggestionDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 999,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  suggestionItemTxt: {
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', marginBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  closeBtn: { padding: 4 },
  modalOption: { paddingVertical: 16, borderBottomWidth: 1 },
  modalOptionTxt: { fontSize: 16, fontWeight: '500' }

});
