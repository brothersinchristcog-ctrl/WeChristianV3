import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  StatusBar,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Book, CheckCircle2 } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const CHAPTER_COUNTS: any = {
  // OT
  'Genesis': 50, 'Exodus': 40, 'Leviticus': 27, 'Numbers': 36, 'Deuteronomy': 34,
  'Joshua': 24, 'Judges': 21, 'Ruth': 4, '1 Samuel': 31, '2 Samuel': 24,
  '1 Kings': 22, '2 Kings': 25, '1 Chronicles': 29, '2 Chronicles': 36, 'Ezra': 10,
  'Nehemiah': 13, 'Esther': 10, 'Job': 42, 'Psalms': 150, 'Proverbs': 31,
  'Ecclesiastes': 12, 'Song of Solomon': 8, 'Isaiah': 66, 'Jeremiah': 52, 'Lamentations': 5,
  'Ezekiel': 48, 'Daniel': 12, 'Hosea': 14, 'Joel': 3, 'Amos': 9,
  'Obadiah': 1, 'Jonah': 4, 'Micah': 7, 'Nahum': 3, 'Habakkuk': 3,
  'Zephaniah': 3, 'Haggai': 2, 'Zechariah': 14, 'Malachi': 4,
  // NT
  'Matthew': 28, 'Mark': 16, 'Luke': 24, 'John': 21, 'Acts': 28,
  'Romans': 16, '1 Corinthians': 16, '2 Corinthians': 13, 'Galatians': 6, 'Ephesians': 6,
  'Philippians': 4, 'Colossians': 4, '1 Thessalonians': 5, '2 Thessalonians': 3, '1 Timothy': 6,
  '2 Timothy': 4, 'Titus': 3, 'Philemon': 1, 'Hebrews': 13, 'James': 5,
  '1 Peter': 5, '2 Peter': 3, '1 John': 5, '2 John': 1, '3 John': 1,
  'Jude': 1, 'Revelation': 22,
  // Telugu Mapping
  'ఆదికాండము': 50, 'నిర్గమకాండము': 40, 'లేవీయకాండము': 27, 'సంఖ్యాకాండము': 36, 'ద్వితీయోపదేశకాండము': 34,
  'యెహోషువ': 24, 'న్యాయాధిపతులు': 21, 'రూతు': 4, '1 సమూయేలు': 31, '2 సమూయేలు': 24,
  '1 రాజులు': 22, '2 రాజులు': 25, '1 దినవృత్తాంతములు': 29, '2 దినవృత్తాంతములు': 36, 'ఎజ్రా': 10,
  'నెహెమ్యా': 13, 'ఎస్తేరు': 10, 'యోబు': 42, 'కీర్తనల గ్రంథము': 150, 'సామెతలు': 31,
  'ప్రసంగి': 12, 'పరమగీతము': 8, 'యెషయా': 66, 'యిర్మియా': 52, 'విలాపవాక్యములు': 5,
  'యెహెజ్కేలు': 48, 'దానియేలు': 12, 'హోషేయ': 14, 'యోవేలు': 3, 'ఆమోసు': 9,
  'ఓబద్యా': 1, 'యోనా': 4, 'మీకా': 7, 'నహూము': 3, 'హబక్కూకు': 3,
  'జెఫన్యా': 3, 'హగ్గయి': 2, 'జెకర్యా': 14, 'మలాకీ': 4,
  'మత్తయి సువార్త': 28, 'మార్కు సువార్త': 16, 'లూకా సువార్త': 24, 'యోహాను సువార్త': 21, 'అపొస్తలుల కార్యములు': 28,
  'రోమీయులకు వ్రాసిన పత్రిక': 16, '1 కొరింథీయులకు': 16, '2 కొరింథీయులకు': 13, 'గలతీయులకు': 6, 'ఎఫెసీయులకు': 6,
  'ఫిలిప్పీయులకు': 4, 'కొలొస్సయులకు': 4, '1 థెస్సలొనీకయులకు': 5, '2 థెస్సలొనీకయులకు': 3, '1 తిమోతికి': 6,
  '2 తిమోతికి': 4, 'తీతుకు': 3, 'ఫిలేమోనుకు': 1, 'హెబ్రీయులకు': 13, 'యాకోబు': 5,
  '1 పేతురు': 5, '2 పేతురు': 3, '1 యోహాను': 5, '2 యోహాను': 1, '3 యోహాను': 1,
  'యూదా': 1, 'ప్రకటన గ్రంథము': 22,
};

const BOOK_MAP: any = {
  // OT
  'Genesis': 1, 'Exodus': 2, 'Leviticus': 3, 'Numbers': 4, 'Deuteronomy': 5,
  'Joshua': 6, 'Judges': 7, 'Ruth': 8, '1 Samuel': 9, '2 Samuel': 10,
  '1 Kings': 11, '2 Kings': 12, '1 Chronicles': 13, '2 Chronicles': 14, 'Ezra': 15,
  'Nehemiah': 16, 'Esther': 17, 'Job': 18, 'Psalms': 19, 'Proverbs': 20,
  'Ecclesiastes': 21, 'Song of Solomon': 22, 'Isaiah': 23, 'Jeremiah': 24, 'Lamentations': 25,
  'Ezekiel': 26, 'Daniel': 27, 'Hosea': 28, 'Joel': 29, 'Amos': 30,
  'Obadiah': 31, 'Jonah': 32, 'Micah': 33, 'Nahum': 34, 'Habakkuk': 35,
  'Zephaniah': 36, 'Haggai': 37, 'Zechariah': 38, 'Malachi': 39,
  // NT
  'Matthew': 40, 'Mark': 41, 'Luke': 42, 'John': 43, 'Acts': 44,
  'Romans': 45, '1 Corinthians': 46, '2 Corinthians': 47, 'Galatians': 48, 'Ephesians': 49,
  'Philippians': 50, 'Colossians': 51, '1 Thessalonians': 52, '2 Thessalonians': 53, '1 Timothy': 54,
  '2 Timothy': 55, 'Titus': 56, 'Philemon': 57, 'Hebrews': 58, 'James': 59,
  '1 Peter': 60, '2 Peter': 61, '1 John': 62, '2 John': 63, '3 John': 64,
  'Jude': 65, 'Revelation': 66,
  // Telugu
  'ఆదికాండము': 1, 'నిర్గమకాండము': 2, 'లేవీయకాండము': 3, 'సంఖ్యాకాండము': 4, 'ద్వితీయోపదేశకాండము': 5,
  'యెహోషువ': 6, 'న్యాయాధిపతులు': 7, 'రూతు': 8, '1 సమూయేలు': 9, '2 సమూయేలు': 10,
  '1 రాజులు': 11, '2 రాజులు': 12, '1 దినవృత్తాంతములు': 13, '2 దినవృత్తాంతములు': 14, 'ఎజ్రా': 15,
  'నెహెమ్యా': 16, 'ఎస్తేరు': 17, 'యోబు': 18, 'కీర్తనల గ్రంథము': 19, 'సామెతలు': 20,
  'ప్రసంగి': 21, 'పరమగీతము': 22, 'యెషయా': 23, 'యిర్మియా': 24, 'విలాపవాక్యములు': 25,
  'యెహెజ్కేలు': 26, 'దానియేలు': 27, 'హోషేయ': 28, 'యోవేలు': 29, 'ఆమోసు': 30,
  'ఓబద్యా': 31, 'యోనా': 32, 'మీకా': 33, 'నహూము': 34, 'హబక్కూకు': 35,
  'జెఫన్యా': 36, 'హగ్గయి': 37, 'జెకర్యా': 38, 'మలాకీ': 39,
  'మత్తయి సువార్త': 40, 'మార్కు సువార్త': 41, 'లూకా సువార్త': 42, 'యోహాను సువార్త': 43, 'అపొస్తలుల కార్యములు': 44,
  'రోమీయులకు వ్రాసిన పత్రిక': 45, '1 కొరింథీయులకు': 46, '2 కొరింథీయులకు': 47, 'గలతీయులకు': 48, 'ఎఫెసీయులకు': 49,
  'ఫిలిప్పీయులకు': 50, 'కొలొస్సయులకు': 51, '1 థెస్సలొనీకయులకు': 52, '2 థెస్సలొనీకయులకు': 53, '1 తిమోతికి': 54,
  '2 తిమోతికి': 55, 'తీతుకు': 56, 'ఫిలేమోనుకు': 57, 'హెబ్రీయులకు': 58, 'యాకోబు': 59,
  '1 పేతురు': 60, '2 పేతురు': 61, '1 యోహాను': 62, '2 యోహాను': 63, '3 యోహాను': 64,
  'యూదా': 65, 'ప్రకటన గ్రంథము': 66
};

export default function BibleChaptersScreen({ route, navigation }: any) {
  const { bookName, lang } = route.params;
  const { isDark } = useTheme();
  const [readChapters, setReadChapters] = useState<Set<number>>(new Set());

  const count = CHAPTER_COUNTS[bookName] || 20;
  const chapters = Array.from({ length: count }, (_, i) => i + 1);
  const bookIndex = (BOOK_MAP[bookName] || 1) - 1;

  useFocusEffect(
    useCallback(() => {
      const loadProgress = async () => {
        try {
          const stored = await AsyncStorage.getItem('@BibleReadProgress');
          if (stored) {
            const progress = JSON.parse(stored);
            const read = new Set<number>();
            progress.forEach((key: string) => {
              const [bIdx, c] = key.split('-');
              if (parseInt(bIdx) === bookIndex) {
                read.add(parseInt(c));
              }
            });
            setReadChapters(read);
          }
        } catch (e) {
          console.log('Error loading progress:', e);
        }
      };
      loadProgress();
    }, [bookIndex])
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color="#fff" size={28} />
        </TouchableOpacity>
        <View style={styles.titleInfo}>
          <Text style={styles.headerTitle}>{bookName}</Text>
          <Text style={styles.headerSub}>Completed {readChapters.size} of {count} Chapters</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.secTitle, { color: isDark ? '#fff' : '#1a2d5a' }]}>
          Chapters · అధ్యాయాలు
        </Text>
        <View style={styles.grid}>
          {chapters.map((chapter) => {
            const isRead = readChapters.has(chapter);
            return (
              <TouchableOpacity 
                key={chapter} 
                style={[
                  styles.chapterBox, 
                  { backgroundColor: isDark ? '#1e293b' : '#fff' },
                  isRead && { backgroundColor: isDark ? '#064e3b' : '#d1fae5', borderColor: '#10b981', borderWidth: 1 }
                ]}
                onPress={() => navigation.navigate('BibleReader', { 
                  bookName, 
                  chapter, 
                  lang 
                })}
              >
                <Text style={[styles.chapterNum, { color: isDark ? '#fff' : '#1a2d5a' }, isRead && { color: isDark ? '#34d399' : '#047857' }]}>
                  {chapter}
                </Text>
                {isRead && (
                  <View style={{ position: 'absolute', top: 4, right: 4 }}>
                    <CheckCircle2 color="#10b981" size={12} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    backgroundColor: '#1a2d5a',
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: { padding: 4 },
  titleInfo: { alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },

  scroll: { flex: 1, padding: 20 },
  secTitle: { fontSize: 16, fontWeight: '800', marginBottom: 20 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start'
  },
  chapterBox: {
    width: (width - 76) / 5,
    height: (width - 76) / 5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    position: 'relative'
  },
  chapterNum: { fontSize: 16, fontWeight: '800' }
});
