import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar,
  Platform,
  Dimensions,
  TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ChevronLeft, Search, BookOpen, Globe } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { BibleService, BIBLE_BOOKS, ALL_BOOKS_BY_LANG } from '../services/BibleService';

const { width } = Dimensions.get('window');

export default function BibleScreen({ navigation }: any) {
  const { isDark } = useTheme();
  const { language, setLanguage, t, languages } = useLanguage();
  const [testament, setTestament] = useState<'OT' | 'NT'>('NT');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [englishVersion, setEnglishVersion] = useState('KJV');

  const ENGLISH_VERSIONS = ['KJV', 'NKJV', 'ESV', 'NIRV', 'ASV', 'WEB', 'YLT', 'BBE'];

  useEffect(() => {
    AsyncStorage.getItem('@BibleEnglishVersion').then(v => {
      if (v) setEnglishVersion(v);
    });
  }, []);

  const handleVersionSelect = (ver: string) => {
    setEnglishVersion(ver);
    AsyncStorage.setItem('@BibleEnglishVersion', ver);
  };

  const currentBookMap = BIBLE_BOOKS[language] || BIBLE_BOOKS.en;
  const books = currentBookMap[testament] || currentBookMap.NT;

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        return;
      }
      
      const isEnglishQuery = /[a-zA-Z]/.test(searchQuery);
      if (isEnglishQuery && language !== 'en') {
        try {
          const inputCode = language === 'te' ? 'te-t-i0-und' : language === 'hi' ? 'hi-t-i0-und' : language === 'ta' ? 'ta-t-i0-und' : null;
          if (inputCode) {
            const transResponse = await fetch(`https://inputtools.google.com/request?text=${encodeURIComponent(searchQuery)}&itc=${inputCode}&num=6`);
            if (transResponse.ok) {
              const transData = await transResponse.json();
              const suggestionsList: string[] = transData?.[1]?.[0]?.[1] || [];
              setSuggestions(suggestionsList.slice(0, 6));
            }
          }
        } catch (e) {
          // silently ignore suggestion fetch errors
        }
      } else {
        setSuggestions([]);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, language]);

  // Robust reference parser matching Book, Chapter, and optional Verse
  const parseReference = (text: string) => {
    if (!text) return null;
    const regex = /^([1-3]?\s*[\p{L}\s\.]+?)\s*(\d+)?(?:\s*:\s*(\d+))?$/u;
    const match = text.trim().match(regex);
    if (!match) return null;

    const parsedBook = match[1].trim();
    const parsedChapter = match[2] ? parseInt(match[2], 10) : null;
    const parsedVerse = match[3] ? parseInt(match[3], 10) : null;

    const bookIndex = BibleService.getBookIndex(parsedBook);
    const bookName = BibleService.getBookName(bookIndex, language);

    return {
      bookIndex,
      bookName,
      chapter: parsedChapter,
      verse: parsedVerse,
      lang: language
    };
  };

  const parsedRef = parseReference(searchQuery);

  const getFilteredBooks = () => {
    if (!searchQuery.trim()) {
      return books;
    }
    
    if (parsedRef && parsedRef.chapter) {
      return [parsedRef.bookName];
    }

    const q = searchQuery.toLowerCase().trim().replace(/\s+/g, '');
    const currentLangBooks = ALL_BOOKS_BY_LANG[language] || ALL_BOOKS_BY_LANG.en;
    let matches = currentLangBooks.filter(b => 
      b.toLowerCase().replace(/\s+/g, '').includes(q)
    );

    if (matches.length === 0) {
      matches = ALL_BOOKS_BY_LANG.en.filter(b => 
        b.toLowerCase().replace(/\s+/g, '').includes(q)
      );
    }
    return matches;
  };

  const filteredBooks = getFilteredBooks();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient 
        colors={['#2b52a1', '#1a3673']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{top:10, bottom:10, left:10, right:10}}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 20 }}>
            <Text style={styles.headerTitle}>{t('bible.bibleTitle')}</Text>
          </View>
        </View>

        <View style={{ width: 24 }} />
      </LinearGradient>

      {/* Search Input + Dropdown Suggestions Wrapper */}
      <View style={{ marginHorizontal: 20, zIndex: 200 }}>
        <View style={[styles.searchBarContainer, { backgroundColor: isDark ? '#1e293b' : '#fff', marginHorizontal: 0 }]}>
          <TouchableOpacity 
            style={{ padding: 4, marginRight: 6 }}
            onPress={() => {
              if (searchQuery.length > 2 && !parsedRef?.chapter) {
                navigation.navigate('BibleSearch', {
                  initialQuery: searchQuery,
                  initialLang: language
                });
              }
            }}
          >
            <Search size={20} color={isDark ? '#94a3b8' : '#64748b'} />
          </TouchableOpacity>
          <TextInput
            placeholder={t('bible.searchPlaceholder')}
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            style={[styles.searchBarInput, { color: isDark ? '#fff' : '#0f172a' }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={() => {
              if (searchQuery.length > 2 && !parsedRef?.chapter) {
                navigation.navigate('BibleSearch', {
                  initialQuery: searchQuery,
                  initialLang: language
                });
              }
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSuggestions([]); }} style={[styles.searchBarClear, { padding: 4 }]}>
              <Text style={styles.searchBarClearTxt}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Dropdown Suggestions */}
        {suggestions.length > 0 && (
          <View style={[styles.suggestionDropdown, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            {suggestions.map((sugg, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.suggestionItem,
                  { borderBottomColor: isDark ? '#334155' : '#f1f5f9' },
                  idx === suggestions.length - 1 && { borderBottomWidth: 0 }
                ]}
                onPress={() => { setSearchQuery(sugg); setSuggestions([]); }}
              >
                <Search size={14} color={isDark ? '#64748b' : '#94a3b8'} style={{ marginRight: 10 }} />
                <Text style={[styles.suggestionItemTxt, { color: isDark ? '#f1f5f9' : '#0f172a' }]}>{sugg}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Multi-Language Selector Bar (All App Languages) */}
      <View style={styles.languageChipsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.languageChipsScroll}>
          {languages.map((l) => {
            const isSelected = language === l.code;
            return (
              <TouchableOpacity 
                key={l.code}
                style={[
                  styles.langChip, 
                  { backgroundColor: isSelected ? '#1a2d5a' : (isDark ? '#1e293b' : '#e2e8f0') }
                ]}
                onPress={() => {
                  setLanguage(l.code);
                  setSearchQuery('');
                  setSuggestions([]);
                }}
              >
                <Globe size={14} color={isSelected ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} style={{ marginRight: 6 }} />
                <Text style={[
                  styles.langChipText, 
                  { color: isSelected ? '#fff' : (isDark ? '#94a3b8' : '#475569') },
                  isSelected && styles.langChipTextActive
                ]}>
                  {l.nativeName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* English Version Selector (When English is active) */}
      {language === 'en' && !searchQuery && (
        <View style={{ marginHorizontal: 20, marginBottom: 15 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {ENGLISH_VERSIONS.map(ver => (
              <TouchableOpacity
                key={ver}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: englishVersion === ver ? '#1a2d5a' : (isDark ? '#1e293b' : '#e2e8f0'),
                  borderWidth: 1,
                  borderColor: englishVersion === ver ? '#1a2d5a' : (isDark ? '#334155' : '#cbd5e1')
                }}
                onPress={() => handleVersionSelect(ver)}
              >
                <Text style={{
                  color: englishVersion === ver ? '#fff' : (isDark ? '#94a3b8' : '#475569'),
                  fontWeight: englishVersion === ver ? '700' : '500',
                  fontSize: 13
                }}>
                  {ver}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Quick Jump Card */}
      {parsedRef && parsedRef.chapter && (
        <TouchableOpacity 
          style={styles.quickJumpCard}
          activeOpacity={0.8}
          onPress={() => {
            navigation.navigate('BibleReader', {
              bookIndex: parsedRef.bookIndex,
              bookName: parsedRef.bookName,
              chapter: parsedRef.chapter,
              lang: language
            });
            setSearchQuery('');
          }}
        >
          <View style={styles.quickJumpLeft}>
            <View style={styles.quickJumpIconWrapper}>
              <BookOpen size={20} color="#fff" />
            </View>
            <View>
              <Text style={styles.quickJumpHeading}>
                {t('bible.jumpToChapter')}
              </Text>
              <Text style={styles.quickJumpSub}>
                {parsedRef.bookName} {parsedRef.chapter}{parsedRef.verse ? `:${parsedRef.verse}` : ''}
              </Text>
            </View>
          </View>
          <View style={styles.quickJumpRight}>
            <Text style={styles.quickJumpBtnTxt}>{t('bible.readNow')} →</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Testament Tabs */}
      {!searchQuery && (
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, testament === 'OT' && styles.tabActive]}
            onPress={() => setTestament('OT')}
          >
            <Text style={[styles.tabText, testament === 'OT' && styles.tabTextActive]}>
              {t('bible.oldTestament')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, testament === 'NT' && styles.tabActive]}
            onPress={() => setTestament('NT')}
          >
            <Text style={[styles.tabText, testament === 'NT' && styles.tabTextActive]}>
              {t('bible.newTestament')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Deep Verse Search Prompt */}
        {searchQuery.length > 2 && !parsedRef?.chapter && (
          <TouchableOpacity 
            style={[styles.deepSearchCard, { marginTop: 10 }]}
            onPress={() => {
              navigation.navigate('BibleSearch', {
                initialQuery: searchQuery,
                initialLang: language
              });
            }}
          >
            <View style={styles.deepSearchLeft}>
              <View style={styles.deepSearchIcon}>
                <Search size={18} color="#fff" />
              </View>
              <View>
                <Text style={styles.deepSearchTitle}>
                  {t('bible.searchPlaceholder')}
                </Text>
                <Text style={styles.deepSearchQuery}>"{searchQuery}"</Text>
              </View>
            </View>
            <ChevronLeft color="#1a2d5a" size={20} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        )}

        {filteredBooks.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <Text style={[styles.noResultsTitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {t('bible.noBooksFound')}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredBooks.map((book, index) => {
              const bookIndex = BibleService.getBookIndex(book);
              const bookTestament = BibleService.getTestament(bookIndex);
              return (
                <TouchableOpacity 
                  key={`${bookIndex}-${index}`} 
                  style={[styles.bookCard, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}
                  onPress={() => {
                    navigation.navigate('BibleChapters', { 
                      bookIndex,
                      bookName: book,
                      lang: language,
                      testament: bookTestament
                    });
                  }}
                >
                  <View style={styles.bookIcon}>
                    <BookOpen size={20} color="#1a2d5a" />
                  </View>
                  <Text style={[styles.bookName, { color: isDark ? '#fff' : '#1e293b' }]} numberOfLines={1}>
                    {book}
                  </Text>
                  <Text style={styles.bookSub}>
                    {t('bible.readNow')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    backgroundColor: '#1a2d5a',
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
  
  languageChipsContainer: {
    marginHorizontal: 20,
    marginTop: 6,
    marginBottom: 14,
  },
  languageChipsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  langChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  langChipTextActive: {
    fontWeight: '800',
  },

  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
    gap: 12
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9'
  },
  tabActive: { backgroundColor: '#c0392b' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  tabTextActive: { color: '#fff' },

  scroll: { flex: 1, paddingHorizontal: 15 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12
  },
  bookCard: {
    width: (width - 42) / 2,
    padding: 16,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    alignItems: 'center'
  },
  bookIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  bookName: { fontSize: 13, fontWeight: '800', textAlign: 'center', marginBottom: 2 },
  bookSub: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },

  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 50,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 0
  },
  searchBarClear: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6
  },
  searchBarClearTxt: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: 'bold',
    marginTop: -2
  },

  suggestionDropdown: {
    position: 'absolute',
    top: 68,
    left: 0,
    right: 0,
    borderRadius: 14,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
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

  quickJumpCard: {
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: '#1a2d5a',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  quickJumpLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  quickJumpIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  quickJumpHeading: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  quickJumpSub: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2
  },
  quickJumpRight: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  quickJumpBtnTxt: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700'
  },

  deepSearchCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#1a2d5a'
  },
  deepSearchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  deepSearchIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a2d5a',
    alignItems: 'center',
    justifyContent: 'center'
  },
  deepSearchTitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600'
  },
  deepSearchQuery: {
    fontSize: 14,
    color: '#1a2d5a',
    fontWeight: '800'
  },

  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50
  },
  noResultsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6
  }
});
