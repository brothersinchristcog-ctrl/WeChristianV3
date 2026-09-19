import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar,
  Dimensions,
  Alert,
  Modal,
  Platform,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { ArrowLeft, ChevronLeft, Share2, BookMarked, Settings, Search, CheckCircle2, Copy, Play, Square, Volume2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { BibleService } from '../services/BibleService';

const { width } = Dimensions.get('window');

export default function BibleReaderScreen({ route, navigation }: any) {
  const { bookName, chapter, lang: paramLang, bookIndex: paramBookIndex, targetVerse } = route.params || {};
  const { isDark } = useTheme();
  const { language, t } = useLanguage();
  const activeLang = paramLang || language;

  const bookIndex = paramBookIndex !== undefined ? paramBookIndex : BibleService.getBookIndex(bookName);
  const localizedBookName = BibleService.getBookName(bookIndex, activeLang);
  const englishBookName = BibleService.getBookName(bookIndex, 'en');
  const totalChapters = BibleService.getChapterCount(bookIndex);

  const [verses, setVerses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalType, setSuccessModalType] = useState<'saved' | 'copied'>('saved');
  const [showVerseOptionsModal, setShowVerseOptionsModal] = useState(false);
  const [selectedVerseItem, setSelectedVerseItem] = useState<any>(null);

  // Multi-verse selection
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const [savedVerseCount, setSavedVerseCount] = useState(0);

  const [isChapterRead, setIsChapterRead] = useState(false);

  const scrollViewRef = React.useRef<ScrollView>(null);
  const [verseLayouts, setVerseLayouts] = useState<{ [key: number]: number }>({});

  // Audio state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingVerse, setSpeakingVerse] = useState<number | null>(null);
  const isSpeakingRef = React.useRef(false);
  const currentVerseIndexRef = React.useRef(0);
  
  // Voice selection state
  const [selectedVoice, setSelectedVoice] = useState<'male' | 'female'>('female');
  const selectedVoiceRef = React.useRef<'male' | 'female'>('female');
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  React.useEffect(() => {
    selectedVoiceRef.current = selectedVoice;
  }, [selectedVoice]);

  React.useEffect(() => {
    // Load voice preference
    AsyncStorage.getItem('@BibleVoicePref').then(stored => {
      if (stored) {
        setSelectedVoice(stored as any);
        selectedVoiceRef.current = stored as any;
      }
    });

    fetchVerses();
    setVerseLayouts({});
    // Exit selection mode when chapter changes
    setSelectionMode(false);
    setSelectedVerses(new Set());
    
    // Check read status
    const checkReadStatus = async () => {
      try {
        const stored = await AsyncStorage.getItem('@BibleReadProgress');
        if (stored) {
          const progress = JSON.parse(stored);
          const key = `${bookIndex}-${chapter}`;
          setIsChapterRead(progress.includes(key));
        } else {
          setIsChapterRead(false);
        }
      } catch (e) {
        console.error('Error checking read status', e);
      }
    };
    checkReadStatus();
    
    return () => {
      // Cleanup speech on unmount or chapter change
      isSpeakingRef.current = false;
      Speech.stop();
    };
  }, [bookName, chapter, activeLang, bookIndex]);

  React.useEffect(() => {
    if (targetVerse && verseLayouts[targetVerse] !== undefined) {
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, verseLayouts[targetVerse] - 20),
        animated: true
      });
    }
  }, [targetVerse, verseLayouts]);

  const fetchVerses = async () => {
    try {
      setLoading(true);
      setError(null);
      const storedVersion = await AsyncStorage.getItem('@BibleEnglishVersion');
      const prefEngVersion = storedVersion || 'KJV';
      const data = await BibleService.fetchChapterVerses(bookIndex, chapter, activeLang, prefEngVersion);
      setVerses(data);
    } catch (error: any) {
      console.error('❌ Bible Load Error:', error);
      setError(error.message || 'Failed to load verses.');
    } finally {
      setLoading(false);
    }
  };

  const startSpeech = async () => {
    isSpeakingRef.current = true;
    setIsSpeaking(true);
    currentVerseIndexRef.current = 0;
    speakVerse(0);
  };

  const speakVerse = (index: number) => {
    if (!isSpeakingRef.current || index >= verses.length) {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      setSpeakingVerse(null);
      return;
    }
    
    currentVerseIndexRef.current = index;
    const v = verses[index];
    setSpeakingVerse(v.verse);
    
    // Auto-scroll to the speaking verse
    if (verseLayouts[v.verse] !== undefined) {
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, verseLayouts[v.verse] - 20),
        animated: true
      });
    }

    const textToSpeak = v.text;
    const speechLang = BibleService.getTTSLanguageCode(activeLang);
    const currentVoice = selectedVoiceRef.current;
    
    // 0.55 pitch guarantees a deep, masculine sound
    const pitchValue = currentVoice === 'male' ? 0.55 : 1.1; 
    
    Speech.speak(textToSpeak, {
      language: speechLang,
      rate: currentVoice === 'male' ? 0.65 : 0.75, // Slower, more contemplative reading speed
      pitch: pitchValue,
      onDone: () => {
        if (isSpeakingRef.current) {
          speakVerse(index + 1);
        }
      },
      onError: (e) => {
        console.log('Speech error:', e);
        if (isSpeakingRef.current) {
          speakVerse(index + 1);
        }
      }
    });
  };

  const stopSpeech = async () => {
    isSpeakingRef.current = false;
    await Speech.stop();
    setIsSpeaking(false);
    setSpeakingVerse(null);
  };

  const handleVerseLongPress = (item: any) => {
    if (selectionMode) {
      // Already in selection mode — toggle this verse
      toggleVerseSelection(item.verse);
    } else {
      // Enter selection mode with this verse pre-selected
      setSelectedVerses(new Set([item.verse]));
      setSelectionMode(true);
    }
  };

  const toggleVerseSelection = (verseNum: number) => {
    setSelectedVerses(prev => {
      const next = new Set(prev);
      if (next.has(verseNum)) {
        next.delete(verseNum);
      } else {
        next.add(verseNum);
      }
      return next;
    });
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedVerses(new Set());
  };

  const saveMultipleVersesToNotes = async () => {
    if (selectedVerses.size === 0) return;
    try {
      const stored = await AsyncStorage.getItem('@SermonPersonalNotes');
      const notes = stored ? JSON.parse(stored) : [];

      const dateStr = new Date().toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

      // Sort selected verse numbers
      const sortedVerseNums = Array.from(selectedVerses).sort((a, b) => a - b);

      // Build combined content
      const content = sortedVerseNums
        .map(vNum => {
          const v = verses.find((v: any) => v.verse === vNum);
          return v ? `[${vNum}] ${v.text}` : '';
        })
        .filter(Boolean)
        .join('\n\n');

      // Build a smart title e.g. "Matthew 5:3-7" or "Matthew 5:3,6,9"
      const isContiguous = sortedVerseNums.every((v, i) => i === 0 || v === sortedVerseNums[i - 1] + 1);
      const rangeLabel = isContiguous && sortedVerseNums.length > 1
        ? `${sortedVerseNums[0]}-${sortedVerseNums[sortedVerseNums.length - 1]}`
        : sortedVerseNums.join(',');

      const newNote = {
        id: Date.now().toString(),
        title: `${englishBookName} ${chapter}:${rangeLabel}`,
        content,
        timestamp: dateStr
      };

      notes.unshift(newNote);
      await AsyncStorage.setItem('@SermonPersonalNotes', JSON.stringify(notes));

      setSavedVerseCount(sortedVerseNums.length);
      cancelSelection();
      setSuccessModalType('saved');
      setShowSuccessModal(true);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save verses.');
    }
  };

  const copyMultipleVerses = async () => {
    if (selectedVerses.size === 0) return;
    try {
      const sortedVerseNums = Array.from(selectedVerses).map(Number).sort((a, b) => a - b);
      const isContiguous = sortedVerseNums.every((v, i) => i === 0 || v === sortedVerseNums[i - 1] + 1);
      const rangeLabel = isContiguous && sortedVerseNums.length > 1
        ? `${sortedVerseNums[0]}-${sortedVerseNums[sortedVerseNums.length - 1]}`
        : sortedVerseNums.join(',');
      
      const content = sortedVerseNums
        .map(vNum => {
          const v = verses.find((v: any) => Number(v.verse) === vNum);
          return v ? `[${vNum}] ${v.text}` : '';
        })
        .filter(Boolean)
        .join('\n');

      const ref = `${englishBookName} ${chapter}:${rangeLabel}`;
      const textToCopy = `"${content}"\n- ${ref}`;
      
      await Clipboard.setStringAsync(textToCopy);
      setSavedVerseCount(sortedVerseNums.length);
      cancelSelection();
      setSuccessModalType('copied');
      setShowSuccessModal(true);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to copy verses.');
    }
  };

  const copyVerseToClipboard = async (item: any) => {
    setShowVerseOptionsModal(false);
    const ref = `${englishBookName} ${chapter}:${item.verse}`;
    const textToCopy = `"${item.text}" - ${ref}`;
    await Clipboard.setStringAsync(textToCopy);
    Alert.alert('✅ Copied!', `${ref} copied to clipboard.`);
  };

  const saveToSermonNotes = async (item: any) => {
    setShowVerseOptionsModal(false);
    try {
      const stored = await AsyncStorage.getItem('@SermonPersonalNotes');
      const notes = stored ? JSON.parse(stored) : [];
      
      const dateStr = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const newNote = {
        id: Date.now().toString(),
        title: `${englishBookName} ${chapter}:${item.verse}`,
        content: item.text,
        timestamp: dateStr
      };

      notes.unshift(newNote);
      await AsyncStorage.setItem('@SermonPersonalNotes', JSON.stringify(notes));
      setSavedVerseCount(1);
      setSuccessModalType('saved');
      setShowSuccessModal(true);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save verse.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#fff' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />
      
      {/* Navy Blue Header */}
      <LinearGradient 
        colors={['#2b52a1', '#1a3673']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{top:10, bottom:10, left:10, right:10}}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 12 }}>
            <Text style={styles.headerTitle}>
              {activeLang === 'en' ? englishBookName : `${englishBookName} · ${localizedBookName}`}
            </Text>
            <Text style={styles.headerSub}>
              {t('bible.chapters')} {chapter}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => setShowVoiceModal(true)} style={{ zIndex: 10, padding: 5 }}>
          <Volume2 color="#fff" size={24} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scroll} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.readerContent}>
          {loading ? (
            <View style={styles.loadingContainer}>
               <Text style={{ color: '#1a2d5a', fontWeight: '700' }}>
                 {t('bible.readNow')}...
               </Text>
            </View>
          ) : error ? (
            <View style={styles.loadingContainer}>
               <Text style={{ color: '#c0392b', fontWeight: '700', textAlign: 'center' }}>{error}</Text>
               <TouchableOpacity style={styles.retryBtn} onPress={fetchVerses}>
                 <Text style={styles.retryText}>Tap to Retry</Text>
               </TouchableOpacity>
            </View>
          ) : (
            verses.map((item: any, index: number) => {
              const isTarget = targetVerse === item.verse;
              const isSelected = selectedVerses.has(item.verse);

              // In selection mode — all verses are tappable checkboxes
              if (selectionMode) {
                return (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.7}
                    onPress={() => toggleVerseSelection(item.verse)}
                    onLongPress={() => toggleVerseSelection(item.verse)}
                    style={[
                      styles.verseRow,
                      isSelected && (isDark ? styles.selectedVerseDark : styles.selectedVerseLight)
                    ]}
                    onLayout={(e) => {
                      const y = e.nativeEvent.layout.y;
                      setVerseLayouts(prev => ({...prev, [item.verse]: y}));
                    }}
                  >
                    {/* Checkbox indicator */}
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <CheckCircle2 color="#fff" size={14} />}
                    </View>
                    <Text style={[styles.verseNumber, { color: isDark ? (isSelected ? '#bfdbfe' : '#94a3b8') : '#1a2d5a' }]}>{item.verse}</Text>
                    <Text style={[styles.verseText, { color: isDark ? (isSelected ? '#bfdbfe' : '#e2e8f0') : (isSelected ? '#1e3a8a' : '#1e293b') }]}>
                      {item.text}
                    </Text>
                  </TouchableOpacity>
                );
              }

              // Normal reading mode
              return isTarget ? (
                // ✨ Premium highlighted verse card (from search)
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.7}
                  onLongPress={() => handleVerseLongPress(item)}
                  style={[styles.highlightedCard, isDark ? styles.highlightedCardDark : styles.highlightedCardLight]}
                  onLayout={(e) => {
                    const y = e.nativeEvent.layout.y;
                    setVerseLayouts(prev => ({...prev, [item.verse]: y}));
                  }}
                >
                  <Text style={[styles.quoteDecor, { color: isDark ? 'rgba(253,224,71,0.35)' : 'rgba(217,119,6,0.2)' }]}>“</Text>
                  <View style={[styles.verseNumBadge, { backgroundColor: isDark ? '#fde047' : '#d97706' }]}>
                    <Text style={[styles.verseNumBadgeTxt, { color: isDark ? '#1a1a00' : '#fff' }]}>{item.verse}</Text>
                  </View>
                  <Text style={[styles.highlightedVerseText, { color: isDark ? '#fef9c3' : '#78350f' }]}>
                    {item.text}
                  </Text>
                  <View style={styles.verseRefTag}>
                    <Text style={[styles.verseRefTagTxt, { color: isDark ? '#fde047' : '#d97706' }]}>
                      {englishBookName} {chapter}:{item.verse}
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : (
                // Normal verse row
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.6}
                  onLongPress={() => handleVerseLongPress(item)}
                  style={[
                    styles.verseRow,
                    speakingVerse === item.verse && { backgroundColor: isDark ? 'rgba(250, 204, 21, 0.1)' : 'rgba(250, 204, 21, 0.15)', borderRadius: 8, marginHorizontal: -4, paddingHorizontal: 4, paddingVertical: 4 }
                  ]}
                  onLayout={(e) => {
                    const y = e.nativeEvent.layout.y;
                    setVerseLayouts(prev => ({...prev, [item.verse]: y}));
                  }}
                >
                  <Text style={[styles.verseNumber, { color: isDark ? '#94a3b8' : '#1a2d5a' }]}>{item.verse}</Text>
                  <Text style={[
                  styles.verseText,
                  // Default text color
                  { color: isDark ? '#f8fafc' : '#334155' },
                  // Highlighted text AND background color
                  speakingVerse === item.verse && { 
                    backgroundColor: isDark ? 'rgba(250, 204, 21, 0.25)' : 'rgba(250, 204, 21, 0.35)', 
                    color: isDark ? '#ffffff' : '#000000', // Change text color!
                    borderRadius: 8, 
                    marginHorizontal: -4, 
                    paddingHorizontal: 4, 
                    paddingVertical: 4,
                    fontWeight: '800' // Make it bold so it stands out even more
                  }
                ]}>
                    {item.text}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
          
          {!loading && verses.length > 0 && (
            <View style={styles.chapterEnd}>
              <View style={styles.divider} />
              <Text style={styles.endText}>End of Chapter {chapter}</Text>
              
              <TouchableOpacity 
                style={[
                  styles.markReadBtn, 
                  { backgroundColor: isChapterRead ? (isDark ? '#334155' : '#e2e8f0') : '#10b981', marginTop: 20 }
                ]}
                onPress={async () => {
                  try {
                    const stored = await AsyncStorage.getItem('@BibleReadProgress');
                    let progress = stored ? JSON.parse(stored) : [];
                    const key = `${bookIndex}-${chapter}`;
                    
                    if (isChapterRead) {
                      progress = progress.filter((item: string) => item !== key);
                      await AsyncStorage.setItem('@BibleReadProgress', JSON.stringify(progress));
                      setIsChapterRead(false);
                    } else {
                      if (!progress.includes(key)) {
                        progress.push(key);
                        await AsyncStorage.setItem('@BibleReadProgress', JSON.stringify(progress));
                      }
                      setIsChapterRead(true);
                      Alert.alert('Success', 'Chapter marked as read!');
                    }
                  } catch (e) {
                    console.error('Error saving read progress', e);
                  }
                }}
              >
                <CheckCircle2 color={isChapterRead ? (isDark ? '#94a3b8' : '#64748b') : '#fff'} size={18} />
                <Text style={{ 
                  color: isChapterRead ? (isDark ? '#94a3b8' : '#64748b') : '#fff', 
                  fontSize: 14, 
                  fontWeight: '700', 
                  marginLeft: 8 
                }}>
                  {isChapterRead ? 'Unmark as Read' : 'Mark as Read'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Audio Button */}
      {!selectionMode && !loading && verses.length > 0 && (
        <TouchableOpacity
          style={[styles.audioFab, isSpeaking && styles.audioFabActive]}
          onPress={isSpeaking ? stopSpeech : startSpeech}
        >
          {isSpeaking ? (
            <Square color="#fff" size={24} fill="#fff" />
          ) : (
            <Play color="#fff" size={24} fill="#fff" style={{ marginLeft: 3 }} />
          )}
        </TouchableOpacity>
      )}

      {/* Bottom Bar — switches between nav and selection action bar */}
      {selectionMode ? (
        <LinearGradient 
          colors={['#2b52a1', '#1a3673']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.selectionBar}
        >
          <TouchableOpacity style={styles.selectionCancelBtn} onPress={cancelSelection}>
            <Text style={[styles.selectionCancelTxt, { color: '#fff' }]}>Cancel</Text>
          </TouchableOpacity>
          <View style={styles.selectionCountBox}>
            <Text style={[styles.selectionCountTxt, { color: '#fff' }]}>
              {selectedVerses.size} verse{selectedVerses.size !== 1 ? 's' : ''} selected
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={[styles.selectionSaveBtn, { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 14, paddingVertical: 8 }, selectedVerses.size === 0 && { opacity: 0.4 }]}
              onPress={copyMultipleVerses}
              disabled={selectedVerses.size === 0}
            >
              <Copy color="#fff" size={18} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.selectionSaveBtn, selectedVerses.size === 0 && { opacity: 0.4 }]}
              onPress={saveMultipleVersesToNotes}
              disabled={selectedVerses.size === 0}
            >
              <BookMarked color="#fff" size={15} />
              <Text style={styles.selectionSaveTxt}>Save</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      ) : (
        <LinearGradient 
          colors={['#2b52a1', '#1a3673']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.bottomBar}
        >
          <TouchableOpacity 
            style={[styles.barAction, chapter <= 1 && { opacity: 0.3 }, { backgroundColor: 'transparent' }]} 
            onPress={() => chapter > 1 && navigation.push('BibleReader', { bookIndex, bookName: localizedBookName, chapter: chapter - 1, lang: activeLang })}
            disabled={chapter <= 1}
          >
            <ChevronLeft color="#fff" size={24} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.barMain}
            onPress={() => navigation.navigate('BibleChapters', { bookIndex, bookName: localizedBookName, lang: activeLang })}
          >
            <Text style={[styles.barMainTxt, { color: '#fff' }]}>
              {t('bible.chapters')} {chapter} / {totalChapters}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.barAction, chapter >= totalChapters && { opacity: 0.3 }, { backgroundColor: 'transparent' }]}
            onPress={() => chapter < totalChapters && navigation.push('BibleReader', { bookIndex, bookName: localizedBookName, chapter: chapter + 1, lang: activeLang })}
            disabled={chapter >= totalChapters}
          >
            <ChevronLeft color="#fff" size={24} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        </LinearGradient>
      )}

      {/* Verse Options Modal */}
      <Modal
        visible={showVerseOptionsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVerseOptionsModal(false)}
      >
        <TouchableOpacity 
          style={styles.optionsOverlay} 
          activeOpacity={1} 
          onPress={() => setShowVerseOptionsModal(false)}
        >
          <View style={[styles.optionsSheet, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
            {/* Handle bar */}
            <View style={styles.optionsHandle} />

            {/* Verse Reference Header */}
            <View style={styles.optionsHeader}>
              <View style={styles.optionsIconBox}>
                <BookMarked color="#1a2d5a" size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionsRefText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  {englishBookName} {chapter}:{selectedVerseItem?.verse}
                </Text>
                <Text style={[styles.optionsSubText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  Long-pressed verse
                </Text>
              </View>
            </View>

            {/* Verse Preview */}
            {selectedVerseItem && (
              <View style={[styles.optionsVersePreview, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
                <Text style={[styles.optionsVersePreviewText, { color: isDark ? '#cbd5e1' : '#334155' }]} numberOfLines={3}>
                  {selectedVerseItem.text}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <TouchableOpacity
              style={styles.optionsActionBtn}
              onPress={() => selectedVerseItem && copyVerseToClipboard(selectedVerseItem)}
            >
              <Copy color="#ffffff" size={18} />
              <Text style={styles.optionsActionBtnTxt}>Copy Verse</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionsActionBtn, { backgroundColor: isDark ? '#1e3a5f' : '#1a2d5a', marginTop: 10 }]}
              onPress={() => selectedVerseItem && saveToSermonNotes(selectedVerseItem)}
            >
              <BookMarked color="#ffffff" size={18} />
              <Text style={styles.optionsActionBtnTxt}>Add to Sermon Notes</Text>
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity
              style={styles.optionsCancelBtn}
              onPress={() => setShowVerseOptionsModal(false)}
            >
              <Text style={[styles.optionsCancelTxt, { color: isDark ? '#94a3b8' : '#64748b' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Voice Settings Modal */}
      <Modal visible={showVoiceModal} transparent={true} animationType="slide">
        <TouchableOpacity style={styles.optionsOverlay} activeOpacity={1} onPress={() => setShowVoiceModal(false)}>
          <View style={[styles.optionsSheet, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
            <View style={styles.optionsHandle} />
            <Text style={[styles.modalTitle, { color: isDark ? '#f8fafc' : '#0f172a', marginBottom: 20 }]}>Select Voice</Text>
            
            <View style={{ gap: 12 }}>
              <TouchableOpacity
                style={[styles.optionsActionBtn, selectedVoice === 'female' ? { backgroundColor: '#1a2d5a' } : { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
                onPress={() => {
                  setSelectedVoice('female');
                  AsyncStorage.setItem('@BibleVoicePref', 'female');
                  setShowVoiceModal(false);
                }}
              >
                <Image source={require('../../assets/voice_female.png')} style={{ width: 32, height: 32, borderRadius: 16 }} />
                <Text style={[styles.optionsActionBtnTxt, selectedVoice !== 'female' && { color: isDark ? '#f8fafc' : '#334155' }]}>Female Voice (Standard)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionsActionBtn, selectedVoice === 'male' ? { backgroundColor: '#1a2d5a' } : { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
                onPress={() => {
                  setSelectedVoice('male');
                  AsyncStorage.setItem('@BibleVoicePref', 'male');
                  setShowVoiceModal(false);
                }}
              >
                <Image source={require('../../assets/voice_male.png')} style={{ width: 32, height: 32, borderRadius: 16 }} />
                <Text style={[styles.optionsActionBtnTxt, selectedVoice !== 'male' && { color: isDark ? '#f8fafc' : '#334155' }]}>Male Voice (Deep)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Beautiful Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <View style={styles.modalIconContainer}>
              <CheckCircle2 color="#10b981" size={50} />
            </View>
            <Text style={[styles.modalTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
              {successModalType === 'copied' 
                ? (savedVerseCount > 1 ? `${savedVerseCount} Verses Copied!` : 'Verse Copied!')
                : (savedVerseCount > 1 ? `${savedVerseCount} Verses Saved!` : 'Verse Saved!')}
            </Text>
            <Text style={[styles.modalDesc, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {successModalType === 'copied'
                ? 'The selected verses have been copied to your clipboard.'
                : (savedVerseCount > 1
                  ? `${savedVerseCount} verses have been added to your Sermon Notes as one entry.`
                  : 'This verse has been successfully added to your Sermon Notes.')}
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, successModalType === 'copied' ? styles.modalBtnPrimary : styles.modalBtnSecondary]} 
                onPress={() => setShowSuccessModal(false)}
              >
                <Text style={successModalType === 'copied' ? styles.modalBtnPrimaryTxt : styles.modalBtnSecondaryTxt}>
                  {successModalType === 'copied' ? 'OK' : 'Continue Reading'}
                </Text>
              </TouchableOpacity>
              
              {successModalType === 'saved' && (
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.modalBtnPrimary]} 
                  onPress={() => {
                    setShowSuccessModal(false);
                    navigation.navigate('MemberNotes');
                  }}
                >
                  <Text style={styles.modalBtnPrimaryTxt}>View Notes</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight ?? 24) + 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    minHeight: Platform.OS === 'ios' ? 140 : 120,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { zIndex: 10, padding: 5 },
  titleInfo: { alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', marginTop: 2 },
  headerRight: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  headerIcon: { padding: 4 },

  scroll: { flex: 1 },
  readerContent: { padding: 20 },
  loadingContainer: { 
    height: 300, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  verseRow: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start'
  },
  verseNumber: {
    width: 28,
    fontSize: 14,
    fontWeight: '900',
    color: '#1a2d5a',
    marginTop: 4
  },
  verseText: {
    flex: 1,
    fontSize: 17,
    lineHeight: 28,
    fontWeight: '500'
  },
  // Highlighted verse card — gold/amber themed
  highlightedCard: {
    marginBottom: 20,
  },
  highlightedCardLight: {
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: -4,
    borderWidth: 1.5,
    borderColor: '#fcd34d',
    shadowColor: '#d97706',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6
  },
  highlightedCardDark: {
    backgroundColor: '#1c1a00',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: -4,
    borderWidth: 1.5,
    borderColor: 'rgba(253,224,71,0.4)',
    shadowColor: '#fde047',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6
  },
  quoteDecor: {
    fontSize: 80,
    lineHeight: 68,
    fontWeight: '900',
    marginBottom: -10,
    marginLeft: -4
  },
  verseNumBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 10
  },
  verseNumBadgeTxt: {
    fontSize: 12,
    fontWeight: '800'
  },
  highlightedVerseText: {
    fontSize: 19,
    lineHeight: 32,
    fontWeight: '700',
    marginBottom: 14
  },
  verseRefTag: {
    alignSelf: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(217,119,6,0.2)',
    paddingTop: 8,
    width: '100%',
    alignItems: 'flex-end'
  },
  verseRefTagTxt: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  
  // Multi-verse selection styles
  selectedVerseLight: {
    backgroundColor: 'rgba(26, 45, 90, 0.08)',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginHorizontal: -4,
    borderLeftWidth: 3,
    borderLeftColor: '#1a2d5a'
  },
  selectedVerseDark: {
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginHorizontal: -4,
    borderLeftWidth: 3,
    borderLeftColor: '#60a5fa'
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#94a3b8',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 3,
    flexShrink: 0
  },
  checkboxSelected: {
    backgroundColor: '#1a2d5a',
    borderColor: '#1a2d5a'
  },

  // Selection action bar
  selectionBar: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    elevation: 12,
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 }
  },
  selectionCancelBtn: {
    paddingHorizontal: 8
  },
  selectionCancelTxt: {
    fontSize: 14,
    fontWeight: '600'
  },
  selectionCountBox: {
    flex: 1,
    alignItems: 'center'
  },
  selectionCountTxt: {
    fontSize: 14,
    fontWeight: '800'
  },
  selectionSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1a2d5a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20
  },
  selectionSaveTxt: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800'
  },

  chapterEnd: { alignItems: 'center', marginTop: 40 },
  divider: { width: 50, height: 2, backgroundColor: '#e2e8f0', marginBottom: 10 },
  endText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 3,
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }
  },

  bottomBar: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }
  },
  barAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  barMain: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  barMainTxt: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1a2d5a'
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 }
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center'
  },
  modalDesc: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%'
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalBtnSecondary: {
    backgroundColor: '#f1f5f9'
  },
  modalBtnSecondaryTxt: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700'
  },
  modalBtnPrimary: {
    backgroundColor: '#1a2d5a'
  },
  modalBtnPrimaryTxt: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  },
  
  retryBtn: {
    marginTop: 20,
    backgroundColor: '#1a2d5a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14
  },

  // Verse Options Bottom Sheet
  optionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end'
  },
  optionsSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -5 }
  },
  optionsHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginBottom: 20
  },
  optionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16
  },
  optionsIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  optionsRefText: {
    fontSize: 18,
    fontWeight: '800'
  },
  optionsSubText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2
  },
  optionsVersePreview: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(100,116,139,0.12)'
  },
  optionsVersePreviewText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500'
  },
  optionsActionBtn: {
    backgroundColor: '#1a2d5a',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12
  },
  optionsActionBtnTxt: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800'
  },
  optionsCancelBtn: {
    paddingVertical: 12,
    alignItems: 'center'
  },
  optionsCancelTxt: {
    fontSize: 15,
    fontWeight: '600'
  },
  audioFab: {
    position: 'absolute',
    right: 24,
    bottom: 130, // Increased to float above the bottom navigation bar
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1a3673',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10, // Increased elevation for a stronger floating effect
    zIndex: 1000,
  },
  audioFabActive: {
    backgroundColor: '#ef4444',
  }
});
