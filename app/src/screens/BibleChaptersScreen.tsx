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
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { BibleService } from '../services/BibleService';

const { width } = Dimensions.get('window');

export default function BibleChaptersScreen({ route, navigation }: any) {
  const { bookName, lang: paramLang, bookIndex: paramBookIndex } = route.params || {};
  const { isDark } = useTheme();
  const { language, t } = useLanguage();
  const [readChapters, setReadChapters] = useState<Set<number>>(new Set());

  const currentLang = paramLang || language;
  const resolvedBookIndex = paramBookIndex !== undefined 
    ? paramBookIndex 
    : BibleService.getBookIndex(bookName);
  
  const displayBookName = BibleService.getBookName(resolvedBookIndex, currentLang);
  const count = BibleService.getChapterCount(resolvedBookIndex);
  const chapters = Array.from({ length: count }, (_, i) => i + 1);

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
              if (parseInt(bIdx) === resolvedBookIndex) {
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
    }, [resolvedBookIndex])
  );

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
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{top:10, bottom:10, left:10, right:10}}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 24 }}>
            <Text style={styles.headerTitle}>{displayBookName}</Text>
            <Text style={styles.headerSub}>
              {t('bible.completedChapters', { completed: readChapters.size, total: count })}
            </Text>
          </View>
        </View>

        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.secTitle, { color: isDark ? '#fff' : '#1a2d5a' }]}>
          {t('bible.chapters')}
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
                  bookIndex: resolvedBookIndex,
                  bookName: displayBookName, 
                  chapter, 
                  lang: currentLang 
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight ?? 24) + 12,
    paddingHorizontal: 16,
    paddingBottom: 30,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    minHeight: Platform.OS === 'ios' ? 140 : 120,
  },
  backBtn: { zIndex: 10, padding: 5 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', marginTop: 2 },

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
