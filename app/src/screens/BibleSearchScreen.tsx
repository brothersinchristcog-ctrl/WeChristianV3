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
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Search, BookOpen, CheckSquare, Square, BookMarked, ChevronDown, X } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { BibleService } from '../services/BibleService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const { language, t } = useLanguage();
  
  const activeLang = initialLang || language;
  const [query, setQuery] = useState(initialQuery || '');
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
          { label: `${t('bible.oldTestament')} (Genesis - Malachi)`, value: 'Old' },
          { label: `${t('bible.newTestament')} (Matthew - Revelation)`, value: 'New' }
        ];
      case 'Book': {
        let start = 0, end = 66;
        if (filterTestament === 'Old') end = 39;
        if (filterTestament === 'New') start = 39;
        
        const books: any[] = [{ label: 'All Books', value: null }];
        for (let i = start; i < end; i++) {
          const localized = BibleService.getBookName(i, activeLang);
          const en = BibleService.getBookName(i, 'en');
          books.push({ 
            label: localized === en ? en : `${en} · ${localized}`, 
            value: i 
          });
        }
        return books;
      }
      case 'Chapter': {
        if (filterBook === null) return [{ label: 'Select a Book first', value: null }];
        const chapCount = BibleService.getChapterCount(filterBook);
        const chaps: any[] = [{ label: 'All Chapters', value: null }];
        for (let i = 1; i <= chapCount; i++) chaps.push({ label: `Chapter ${i}`, value: i });
        return chaps;
      }
      case 'Verse': {
        if (filterBook === null || filterChapter === null) return [{ label: 'Select Book & Chapter first', value: null }];
        const verses: any[] = [{ label: 'All Verses', value: null }];
        for (let i = 1; i <= 50; i++) verses.push({ label: `Verse ${i}`, value: i });
        return verses;
      }
      default: return [];
    }
  };

  const handleSelectFilter = (val: any) => {
    let tVal = filterTestament, b = filterBook, c = filterChapter, v = filterVerse;
    switch(modalType) {
      case 'Testament':
        setFilterTestament(val); tVal = val;
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
    
    if (query.trim().length > 0) {
      setTimeout(() => performSearch(query, { testament: tVal, book: b, chapter: c, verse: v }), 100);
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
        return `📖 ${ref}\n${r.text || ''}`;
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

      setSelectedVerses(new Set());
      navigation.navigate('MemberNotes', { refreshId: Date.now() });
    } catch (error) {
      console.error('Error saving note directly:', error);
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
      if (isEnglishQuery && activeLang !== 'en') {
        try {
          const inputCode = activeLang === 'te' ? 'te-t-i0-und' : activeLang === 'hi' ? 'hi-t-i0-und' : activeLang === 'ta' ? 'ta-t-i0-und' : null;
          if (inputCode) {
            const transResponse = await fetch(`https://inputtools.google.com/request?text=${encodeURIComponent(query)}&itc=${inputCode}&num=6`);
            if (transResponse.ok) {
              const transData = await transResponse.json();
              const suggestionsList: string[] = transData?.[1]?.[0]?.[1] || [];
              setSuggestions(suggestionsList.slice(0, 6));
            }
          }
        } catch (e) {
          // silently ignore
        }
      } else {
        setSuggestions([]);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, activeLang]);

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
      // 1. Check if search query matches a direct reference e.g. "John 3:16" or "యోహాను 3:16"
      const refRegex = /^([1-3]?\s*[\p{L}\s\.]+?)\s*(\d+)?(?:\s*:\s*(\d+))?$/u;
      const match = searchStr.trim().match(refRegex);
      if (match && match[2]) {
        const parsedBook = match[1].trim();
        const parsedChapter = parseInt(match[2], 10);
        const parsedVerse = match[3] ? parseInt(match[3], 10) : null;
        const bIdx = BibleService.getBookIndex(parsedBook);
        
        try {
          const chapterVerses = await BibleService.fetchChapterVerses(bIdx, parsedChapter, activeLang);
          const filteredVerses = parsedVerse
            ? chapterVerses.filter(v => v.verse === parsedVerse)
            : chapterVerses;
          
          if (filteredVerses.length > 0) {
            const mapped = filteredVerses.map(v => ({
              id: `${activeLang}-${bIdx + 1}-${parsedChapter}-${v.verse}`,
              bookIndex: bIdx,
              book: BibleService.getBookName(bIdx, activeLang),
              bookEn: BibleService.getBookName(bIdx, 'en'),
              chapter: parsedChapter,
              verse: v.verse,
              text: v.text,
              highlight: ''
            }));
            setResults(mapped);
            setLoading(false);
            return;
          }
        } catch (e) {
          // continue to general search
        }
      }

      // 2. Perform general search via BibleService
      const searchHits = await BibleService.searchBible(searchStr, activeLang, {
        testament: activeTestament,
        bookIndex: activeBook,
        chapter: activeChapter,
        verse: activeVerse
      });

      setResults(searchHits);
    } catch (err: any) {
      console.error('Bible Search Error:', err);
      setError('An error occurred while searching. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerseClick = (item: any) => {
    navigation.navigate('BibleReader', {
      bookIndex: item.bookIndex,
      bookName: item.book,
      chapter: item.chapter,
      lang: activeLang,
      targetVerse: item.verse
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />
      
      {/* Header */}
      <LinearGradient 
        colors={['#2b52a1', '#1a3673']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
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
        }} hitSlop={{top:10, bottom:10, left:10, right:10}}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 20 }}>
            <Text style={styles.headerTitle}>{t('bible.verseSearch')}</Text>
          </View>
        </View>

        <View style={{ width: 24 }} />
      </LinearGradient>

      {/* Search Input */}
      <View style={{ marginHorizontal: 20, zIndex: 100 }}>
        <View style={[styles.searchContainer, { backgroundColor: isDark ? '#1e293b' : '#fff', marginHorizontal: 0, marginTop: 16, marginBottom: 0 }]}>
          <TouchableOpacity onPress={() => performSearch(query)} style={{ padding: 4, flexShrink: 0 }}>
            <Search size={20} color={isDark ? '#94a3b8' : '#64748b'} />
          </TouchableOpacity>
          <TextInput
            style={[styles.searchInput, { color: isDark ? '#fff' : '#0f172a' }]}
            placeholder={t('bible.searchPlaceholder')}
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => performSearch(query)}
            returnKeyType="search"
            autoFocus={!initialQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSuggestions([]); setHasSearched(false); }} style={{ padding: 8, flexShrink: 0 }}>
              <X size={18} color={isDark ? '#64748b' : '#94a3b8'} />
            </TouchableOpacity>
          )}
        </View>

        {/* Dropdown Suggestions */}
        {!hasSearched && suggestions.length > 0 && (
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
                <Search size={14} color={isDark ? '#64748b' : '#64748b'} style={{ marginRight: 10 }} />
                <Text style={[styles.suggestionItemTxt, { color: isDark ? '#f1f5f9' : '#0f172a' }]}>{sugg}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Filters Row */}
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
            {filterBook !== null ? BibleService.getBookName(filterBook, activeLang) : 'Book'}
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

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#1a2d5a" />
            <Text style={[styles.loadingText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {t('bible.readNow')}...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : results.length > 0 ? (
          <View style={styles.resultsList}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={[styles.resultsCount, { color: isDark ? '#94a3b8' : '#64748b', marginBottom: 0 }]}>
                Found {results.length} results
              </Text>
              {(filterTestament !== 'All' || filterBook !== null || filterChapter !== null || filterVerse !== null) && (
                <TouchableOpacity
                  style={{ backgroundColor: '#1a2d5a', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}
                  onPress={() => {
                    setFilterTestament('All');
                    setFilterBook(null);
                    setFilterChapter(null);
                    setFilterVerse(null);
                    setTimeout(() => performSearch(query, { testament: 'All', book: null, chapter: null, verse: null }), 100);
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Clear Filters ×</Text>
                </TouchableOpacity>
              )}
            </View>

            {results.map((item) => {
              const isSelected = selectedVerses.has(item.id);
              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={[
                    styles.resultCard, 
                    { 
                      backgroundColor: isDark ? '#1e293b' : '#fff',
                      borderWidth: isSelected ? 2 : 0, 
                      borderColor: isSelected ? '#1a2d5a' : 'transparent' 
                    }
                  ]}
                  onPress={() => handleVerseClick(item)}
                  onLongPress={() => toggleVerseSelection(item.id)}
                  delayLongPress={300}
                >
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
                    <Text style={styles.referenceText}>
                      {item.book} {item.chapter}:{item.verse}
                      {item.bookEn && item.bookEn !== item.book ? ` · ${item.bookEn} ${item.chapter}:${item.verse}` : ''}
                    </Text>
                  </View>
                  
                  {item.text ? (
                    <HighlightText 
                      text={item.text}
                      highlight={item.highlight}
                      style={[styles.verseTextEn, { color: isDark ? '#e2e8f0' : '#1e293b' }]}
                      highlightStyle={{ backgroundColor: 'rgba(250, 204, 21, 0.4)', color: isDark ? '#fde047' : '#854d0e', fontWeight: 'bold' }}
                    />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : query.length > 0 && !loading ? (
          <View style={styles.centerContainer}>
            <Text style={[styles.noResultsText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {t('bible.noBooksFound')}
            </Text>
          </View>
        ) : null}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Floating Save to Notes Bar */}
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

      {/* Filter Options Modal */}
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
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, { borderBottomColor: isDark ? '#334155' : '#f1f5f9' }]}
                  onPress={() => handleSelectFilter(item.value)}
                >
                  <Text style={[styles.modalItemTxt, { color: isDark ? '#f8fafc' : '#1e293b' }]}>
                    {item.label}
                  </Text>
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
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight ?? 24) + 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: Platform.OS === 'ios' ? 120 : 100,
  },
  backBtn: { zIndex: 10, padding: 5 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  
  suggestionDropdown: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    borderRadius: 14,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden'
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1
  },
  suggestionItemTxt: {
    fontSize: 14,
    fontWeight: '600'
  },

  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  filterBtnTxt: {
    fontSize: 11,
    fontWeight: '700',
  },

  scroll: { flex: 1, paddingHorizontal: 20, marginTop: 8 },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#c0392b',
    fontSize: 14,
    fontWeight: '700',
  },
  noResultsText: {
    fontSize: 15,
    fontWeight: '600',
  },

  resultsList: {
    paddingBottom: 20,
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  resultCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  referenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#1a2d5a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  referenceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  verseTextEn: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },

  saveNotesBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#1a2d5a',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  saveNotesCount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  saveNotesHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '500',
  },
  saveNotesBtn: {
    backgroundColor: '#c0392b',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 6,
  },
  saveNotesBtnTxt: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  modalItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  modalItemTxt: {
    fontSize: 15,
    fontWeight: '600',
  }
});
