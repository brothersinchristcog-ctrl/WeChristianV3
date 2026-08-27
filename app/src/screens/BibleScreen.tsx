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
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ChevronLeft, Search, BookOpen, Globe } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const BIBLE_DATA = {
  English: {
    OT: [
      'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 
      'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', 
      '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 
      'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 
      'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 
      'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 
      'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 
      'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
    ],
    NT: [
      'Matthew', 'Mark', 'Luke', 'John', 'Acts', 
      'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 
      'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', 
      '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', 
      '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 
      'Jude', 'Revelation'
    ]
  },
  Telugu: {
    OT: [
      'ఆదికాండము', 'నిర్గమకాండము', 'లేవీయకాండము', 'సంఖ్యాకాండము', 'ద్వితీయోపదేశకాండము',
      'యెహోషువ', 'న్యాయాధిపతులు', 'రూతు', '1 సమూయేలు', '2 సమూయేలు',
      '1 రాజులు', '2 రాజులు', '1 దినవృత్తాంతములు', '2 దినవృత్తాంతములు', 'ఎజ్రా',
      'నెహెమ్యా', 'ఎస్తేరు', 'యోబు', 'కీర్తనల గ్రంథము', 'సామెతలు',
      'ప్రసంగి', 'పరమగీతము', 'యెషయా', 'యిర్మియా', 'విలాపవాక్యములు',
      'యెహెజ్కేలు', 'దానియేలు', 'హోషేయ', 'యోవేలు', 'ఆమోసు',
      'ఓబద్యా', 'యోనా', 'మీకా', 'నహూము', 'హబక్కూకు',
      'జెఫన్యా', 'హగ్గయి', 'జెకర్యా', 'మలాకీ'
    ],
    NT: [
      'మత్తయి సువార్త', 'మార్కు సువార్త', 'లూకా సువార్త', 'యోహాను సువార్త', 'అపొస్తలుల కార్యములు',
      'రోమీయులకు వ్రాసిన పత్రిక', '1 కొరింథీయులకు', '2 కొరింథీయులకు', 'గలతీయులకు', 'ఎఫెసీయులకు',
      'ఫిలిప్పీయులకు', 'కొలొస్సయులకు', '1 థెస్సలొనీకయులకు', '2 థెస్సలొనీకయులకు', '1 తిమోతికి',
      '2 తిమోతికి', 'తీతుకు', 'ఫిలేమోనుకు', 'హెబ్రీయులకు', 'యాకోబు',
      '1 పేతురు', '2 పేతురు', '1 యోహాను', '2 యోహాను', '3 యోహాను',
      'యూదా', 'ప్రకటన గ్రంథము'
    ]
  }
};

// Define flat lists of all books for search utility
const ALL_BOOKS = {
  English: [...BIBLE_DATA.English.OT, ...BIBLE_DATA.English.NT],
  Telugu: [...BIBLE_DATA.Telugu.OT, ...BIBLE_DATA.Telugu.NT]
};

export default function BibleScreen({ navigation }: any) {
  const { isDark, toggleTheme } = useTheme();
  const [lang, setLang] = useState<'English' | 'Telugu'>('Telugu');
  const [testament, setTestament] = useState<'OT' | 'NT'>('NT');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const books = lang === 'English' ? BIBLE_DATA.English[testament] : BIBLE_DATA.Telugu[testament];

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery.trim() || lang !== 'Telugu') {
        setSuggestions([]);
        return;
      }
      
      const isEnglishQuery = /[a-zA-Z]/.test(searchQuery);
      if (isEnglishQuery) {
        try {
          const transResponse = await fetch(`https://inputtools.google.com/request?text=${encodeURIComponent(searchQuery)}&itc=te-t-i0-und&num=6`);
          if (transResponse.ok) {
            const transData = await transResponse.json();
            const suggestionsList: string[] = transData?.[1]?.[0]?.[1] || [];
            setSuggestions(suggestionsList.slice(0, 6));
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
  }, [searchQuery, lang]);

  // Helper mapping for English Abbreviations
  const abbrevMap: any = {
    'gen': 'Genesis', 'ex': 'Exodus', 'exo': 'Exodus', 'lev': 'Leviticus', 'num': 'Numbers', 'deut': 'Deuteronomy',
    'josh': 'Joshua', 'judg': 'Judges', 'jdg': 'Judges', 'rut': 'Ruth', '1sam': '1 Samuel', '2sam': '2 Samuel',
    '1ki': '1 Kings', '2ki': '2 Kings', '1chr': '1 Chronicles', '2chr': '2 Chronicles', 'ezr': 'Ezra',
    'neh': 'Nehemiah', 'est': 'Esther', 'ps': 'Psalms', 'psa': 'Psalms', 'prov': 'Proverbs', 'pr': 'Proverbs',
    'eccl': 'Ecclesiastes', 'song': 'Song of Solomon', 'isa': 'Isaiah', 'jer': 'Jeremiah', 'lam': 'Lamentations',
    'ezek': 'Ezekiel', 'dan': 'Daniel', 'hos': 'Hosea', 'joe': 'Joel', 'amo': 'Amos', 'ob': 'Obadiah',
    'jon': 'Jonah', 'mic': 'Micah', 'nah': 'Nahum', 'habakkuk': 'Habakkuk', 'hab': 'Habakkuk', 'zeph': 'Zephaniah',
    'hag': 'Haggai', 'zech': 'Zechariah', 'mal': 'Malachi',
    'matt': 'Matthew', 'mat': 'Matthew', 'mk': 'Mark', 'mar': 'Mark', 'lk': 'Luke', 'luk': 'Luke',
    'jn': 'John', 'joh': 'John', 'ac': 'Acts', 'act': 'Acts', 'rom': 'Romans', '1cor': '1 Corinthians',
    '2cor': '2 Corinthians', 'gal': 'Galatians', 'eph': 'Ephesians', 'phil': 'Philippians', 'php': 'Philippians',
    'col': 'Colossians', '1thess': '1 Thessalonians', '2thess': '2 Thessalonians', '1tim': '1 Timothy',
    '2tim': '2 Timothy', 'tit': 'Titus', 'philem': 'Philemon', 'phm': 'Philemon', 'heb': 'Hebrews',
    'jas': 'James', '1pet': '1 Peter', '2pet': '2 Peter', '1jn': '1 John', '2jn': '2 John',
    '3jn': '3 John', 'jude': 'Jude', 'rev': 'Revelation'
  };

  // Robust reference parser matching Book, Chapter, and optional Verse
  const parseReference = (text: string) => {
    if (!text) return null;
    const regex = /^([1-3]?\s*[a-zA-Z\u0C00-\u0C7F\s\.]+?)\s*(\d+)?(?:\s*:\s*(\d+))?$/;
    const match = text.trim().match(regex);
    if (!match) return null;

    const parsedBook = match[1].trim().toLowerCase();
    const parsedChapter = match[2] ? parseInt(match[2], 10) : null;
    const parsedVerse = match[3] ? parseInt(match[3], 10) : null;

    // Search in current language
    const currentLangBooks = ALL_BOOKS[lang];
    const otherLang = lang === 'English' ? 'Telugu' : 'English';
    const otherLangBooks = ALL_BOOKS[otherLang];

    let matchedBook = currentLangBooks.find(b => 
      b.toLowerCase().startsWith(parsedBook) || 
      b.toLowerCase().replace(/\s/g, '').startsWith(parsedBook.replace(/\s/g, ''))
    );

    let resolvedLang = lang;

    if (!matchedBook) {
      matchedBook = otherLangBooks.find(b => 
        b.toLowerCase().startsWith(parsedBook) || 
        b.toLowerCase().replace(/\s/g, '').startsWith(parsedBook.replace(/\s/g, ''))
      );
      if (matchedBook) {
        resolvedLang = otherLang;
      }
    }

    // Try abbreviation lookup
    if (!matchedBook) {
      const key = parsedBook.replace(/\s/g, '');
      if (abbrevMap[key]) {
        matchedBook = abbrevMap[key];
        resolvedLang = 'English';
      }
    }

    if (matchedBook) {
      return {
        bookName: matchedBook,
        chapter: parsedChapter,
        verse: parsedVerse,
        lang: resolvedLang
      };
    }
    return null;
  };

  const parsedRef = parseReference(searchQuery);

  const getFilteredBooks = () => {
    if (!searchQuery.trim()) {
      return books;
    }
    
    // If we matched a clean reference, keep the matched book
    if (parsedRef) {
      return [parsedRef.bookName];
    }

    const query = searchQuery.toLowerCase().trim();
    const currentLangBooks = ALL_BOOKS[lang];
    let matches = currentLangBooks.filter(b => 
      b.toLowerCase().includes(query) || 
      b.toLowerCase().replace(/\s/g, '').includes(query.replace(/\s/g, ''))
    );

    if (matches.length === 0) {
      const otherLang = lang === 'English' ? 'Telugu' : 'English';
      matches = ALL_BOOKS[otherLang].filter(b => 
        b.toLowerCase().includes(query) || 
        b.toLowerCase().replace(/\s/g, '').includes(query.replace(/\s/g, ''))
      );
    }
    return matches;
  };

  const filteredBooks = getFilteredBooks();

  const getBookLanguage = (book: string) => {
    return ALL_BOOKS.Telugu.includes(book) ? 'Telugu' : 'English';
  };

  const getBookTestament = (book: string) => {
    if (BIBLE_DATA.English.OT.includes(book) || BIBLE_DATA.Telugu.OT.includes(book)) {
      return 'OT';
    }
    return 'NT';
  };

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
            <Text style={styles.headerTitle}>Holy Bible</Text>
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
                  initialLang: lang
                });
              }
            }}
          >
            <Search size={20} color={isDark ? '#94a3b8' : '#64748b'} />
          </TouchableOpacity>
          <TextInput
            placeholder={lang === 'English' ? "Reference search (e.g. John 3:16)..." : "రెఫరెన్స్ వెతకండి (ఉదా: యోహాను 3:16)..."}
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
                  initialLang: lang
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

      {/* Language Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[styles.toggleBtn, lang === 'English' && styles.toggleBtnActive]}
          onPress={() => {
            setLang('English');
            setSearchQuery(''); 
          }}
        >
          <Globe size={16} color={lang === 'English' ? '#fff' : '#64748b'} />
          <Text style={[styles.toggleText, lang === 'English' && styles.toggleTextActive]}>English</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleBtn, lang === 'Telugu' && styles.toggleBtnActive]}
          onPress={() => {
            setLang('Telugu');
            setSearchQuery(''); 
          }}
        >
          <Globe size={16} color={lang === 'Telugu' ? '#fff' : '#64748b'} />
          <Text style={[styles.toggleText, lang === 'Telugu' && styles.toggleTextActive]}>తెలుగు</Text>
        </TouchableOpacity>
      </View>

      {/* Elegant Quick Jump Card */}
      {parsedRef && parsedRef.chapter && (
        <TouchableOpacity 
          style={styles.quickJumpCard}
          activeOpacity={0.8}
          onPress={() => {
            navigation.navigate('BibleReader', {
              bookName: parsedRef.bookName,
              chapter: parsedRef.chapter,
              lang: parsedRef.lang
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
                {lang === 'English' ? 'Jump to Chapter' : 'అధ్యాయానికి వెళ్ళండి'}
              </Text>
              <Text style={styles.quickJumpSub}>
                {parsedRef.bookName} {parsedRef.chapter}{parsedRef.verse ? `:${parsedRef.verse}` : ''} ({parsedRef.lang})
              </Text>
            </View>
          </View>
          <View style={styles.quickJumpRight}>
            <Text style={styles.quickJumpBtnTxt}>{lang === 'English' ? 'Read' : 'చదవండి'} →</Text>
          </View>
        </TouchableOpacity>
      )}

      {!searchQuery && (
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, testament === 'OT' && styles.tabActive]}
            onPress={() => setTestament('OT')}
          >
            <Text style={[styles.tabText, testament === 'OT' && styles.tabTextActive]}>
              {lang === 'English' ? 'Old Testament' : 'పాత నిబంధన'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, testament === 'NT' && styles.tabActive]}
            onPress={() => setTestament('NT')}
          >
            <Text style={[styles.tabText, testament === 'NT' && styles.tabTextActive]}>
              {lang === 'English' ? 'New Testament' : 'క్రొత్త నిబంధన'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Deep Verse Search Prompt (moved inside ScrollView) */}
        {searchQuery.length > 2 && !parsedRef?.chapter && (
          <TouchableOpacity 
            style={[styles.deepSearchCard, { marginTop: 10 }]}
            onPress={() => {
              navigation.navigate('BibleSearch', {
                initialQuery: searchQuery,
                initialLang: lang
              });
            }}
          >
            <View style={styles.deepSearchLeft}>
              <View style={styles.deepSearchIcon}>
                <Search size={18} color="#fff" />
              </View>
              <View>
                <Text style={styles.deepSearchTitle}>
                  {lang === 'English' ? 'Search all verses for' : 'అన్ని వచనాలలో వెతకండి'}
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
              {lang === 'English' ? 'No matching books found' : 'సరిపోలే పుస్తకాలు కనుగొనబడలేదు'}
            </Text>
            <Text style={styles.noResultsSubtitle}>
              {lang === 'English' 
                ? 'Try searching with correct names like "Genesis 3" or "Gen 3"' 
                : 'ఉదాహరణకు "ఆదికాండము 3" లేదా "ఆది 3" అని వెతకండి'}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredBooks.map((book, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.bookCard, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}
                onPress={() => {
                  const bookLang = getBookLanguage(book);
                  const bookTestament = getBookTestament(book);
                  navigation.navigate('BibleChapters', { 
                    bookName: book,
                    lang: bookLang,
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
                  {lang === 'English' ? 'Read now' : 'చదవండి'}
                </Text>
              </TouchableOpacity>
            ))}
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
  
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    marginHorizontal: 20,
    marginTop: 5,
    marginBottom: 15,
    borderRadius: 25,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 21,
    gap: 6
  },
  toggleBtnActive: { backgroundColor: '#1a2d5a' },
  toggleText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  toggleTextActive: { color: '#fff' },

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

  // New premium styles for reference search
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
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchBarIcon: {
    marginRight: 10,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 8,
  },
  searchBarClear: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarClearTxt: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 16,
    textAlign: 'center',
  },
  quickJumpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#c0392b',
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 16,
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#c0392b',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  quickJumpLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  quickJumpIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  quickJumpHeading: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '800',
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
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  quickJumpBtnTxt: {
    color: '#c0392b',
    fontSize: 12,
    fontWeight: '800'
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  noResultsTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  noResultsSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
  deepSearchHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 5,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  deepSearchTxt: {
    color: '#c0392b',
    fontWeight: '700',
    fontSize: 13,
  },
  suggestionTxt: { fontSize: 16, fontWeight: '600' },
  deepSearchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe'
  },
  deepSearchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  deepSearchIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a2d5a',
    alignItems: 'center',
    justifyContent: 'center'
  },
  deepSearchTitle: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  deepSearchQuery: {
    color: '#1a2d5a',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2
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
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
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
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
});
