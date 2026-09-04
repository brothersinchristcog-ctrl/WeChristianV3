import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, Share, ActivityIndicator, ScrollView, ImageBackground, Image, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Share2, Sun, Sunset, Moon, BookOpen, Shield, Heart, Repeat, Calendar as CalendarIcon, Download } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VerseNotificationService, { DailyVerse } from '../services/VerseNotificationService';
import { useTheme } from '../context/ThemeContext';
import { useChurch } from '../context/ChurchContext';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

const { width } = Dimensions.get('window');

const THEMES: Record<string, any> = {
  Morning: {
    Icon: Sun,
    FooterIcon: BookOpen,
    color: '#fbbf24',
    textColor: '#ffffff',
    blurTint: 'dark',
    subtitle: "Start your day with God's Word\nand let His joy fill your heart.",
  },
  Afternoon: {
    Icon: Sun,
    FooterIcon: Heart,
    color: '#60a5fa',
    textColor: '#ffffff',
    blurTint: 'dark',
    subtitle: "May God's strength guide you\nand give you peace this afternoon.",
  },
  Evening: {
    Icon: Sunset,
    FooterIcon: Heart,
    color: '#d8b4fe',
    textColor: '#ffffff',
    blurTint: 'dark',
    subtitle: "Be a light of Christ in the evening\nand reflect His love to others.",
  },
  Night: {
    Icon: Moon,
    FooterIcon: Shield,
    color: '#93c5fd',
    textColor: '#ffffff',
    blurTint: 'dark',
    subtitle: "Thank God for today and\nrest in His loving care.",
  }
};

const periods = ['Morning', 'Afternoon', 'Evening', 'Night'];

// Generate beautiful dynamic gradients based on the date and time period.
// The Golden Angle (137.5) guarantees every consecutive day has a wildly different color.
const getDynamicGradient = (date: Date, period: string, periodIndex: number): readonly [string, string, ...string[]] => {
  const epoch = new Date('2024-01-01T00:00:00Z');
  const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const epochDate = new Date(epoch.getFullYear(), epoch.getMonth(), epoch.getDate());
  const daysSinceEpoch = Math.floor((localDate.getTime() - epochDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const hue1 = Math.floor(daysSinceEpoch * 137.5 + periodIndex * 67) % 360;
  const hue2 = (hue1 + 40) % 360; 

  let s = 85, l1 = 60, l2 = 40;
  if (period === 'Morning') { l1 = 70; l2 = 50; }
  else if (period === 'Afternoon') { l1 = 65; l2 = 45; }
  else if (period === 'Evening') { s = 75; l1 = 45; l2 = 25; }
  else if (period === 'Night') { s = 65; l1 = 25; l2 = 10; }

  return [`hsl(${hue1}, ${s}%, ${l1}%)`, `hsl(${hue2}, ${s}%, ${l2}%)`];
};

export default function VerseOfTheDayScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const [verseData, setVerseData] = useState<{ date: Date, verses: DailyVerse[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTelugu, setShowTelugu] = useState(true);
  
  const captureRef = useRef<ViewShot>(null);
  const [captureConfig, setCaptureConfig] = useState<{verse: DailyVerse, period: string, theme: any, periodIndex: number, date: Date} | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const { isDark, colors } = useTheme();
  const { activeChurch } = useChurch();
  
  // Still supporting initial verse routing if necessary (e.g. tracking "shown" state)
  const verseId = route.params?.verseId;

  const styles = getStyles(isDark, colors);

  // --- Auto-scroll carousel logic ---
  const todayCarouselRef = useRef<ScrollView>(null);
  const currentIndexRef = useRef(0);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (verseData.length > 0) {
      const hour = new Date().getHours();
      let initialIndex = 0;
      if (hour >= 12 && hour < 17) initialIndex = 1; // Afternoon
      else if (hour >= 17 && hour < 20) initialIndex = 2; // Evening
      else if (hour >= 20) initialIndex = 3; // Night

      currentIndexRef.current = initialIndex;

      // Ensure layout is ready before initial scroll
      setTimeout(() => {
        todayCarouselRef.current?.scrollTo({ x: initialIndex * width, animated: false });
      }, 200);

      // Start auto-scroll
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        currentIndexRef.current = (currentIndexRef.current + 1) % 4;
        todayCarouselRef.current?.scrollTo({ x: currentIndexRef.current * width, animated: true });
      }, 8000); // 8 seconds
    }
    return () => clearInterval(timerRef.current);
  }, [verseData.length]);

  const handleScrollEnd = (e: any) => {
    currentIndexRef.current = Math.round(e.nativeEvent.contentOffset.x / width);
    
    // Restart auto-scroll timer when user manually scrolls
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      currentIndexRef.current = (currentIndexRef.current + 1) % 4;
      todayCarouselRef.current?.scrollTo({ x: currentIndexRef.current * width, animated: true });
    }, 8000); // 8 seconds
  };
  // ----------------------------------

  useEffect(() => {
    const init = async () => {
      if (verseId) {
        VerseNotificationService.markVerseAsShown(verseId);
      }
      
      // Pass 1: Instantly load whatever we have in cache (this will at least have Today's verses)
      await loadVerses(false);
      
      // Pass 2: Silently refresh the past 5 days in the background to ensure data is perfectly synced
      loadVerses(true, true);
    };
    init();
  }, [verseId]);

  const loadVerses = async (forceRefresh = false, silent = false) => {
    if (forceRefresh) {
      if (!silent) setRefreshing(true);
    } else {
      if (!silent) setLoading(true);
    }
    
    // Fetch today + past 5 days = 6 days total
    const data = await VerseNotificationService.getRecentVerses(5, true, forceRefresh);
    setVerseData(data);
    
    if (!silent) {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDownload = async (verse: DailyVerse, period: string, theme: any, periodIndex: number, date: Date) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need permission to save images to your device.');
        return;
      }
      setCaptureConfig({ verse, period, theme, periodIndex, date });
      setIsCapturing(true);
      // Wait for hidden view to render and image to load
      setTimeout(async () => {
        try {
          if (captureRef.current?.capture) {
            const uri = await captureRef.current.capture();
            await MediaLibrary.saveToLibraryAsync(uri);
            
            // Show beautiful toast instead of native alert
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 3000);
          }
        } catch (e) {
          console.error(e);
          Alert.alert('Error', 'Failed to capture image.');
        } finally {
          setIsCapturing(false);
          setCaptureConfig(null);
        }
      }, 1500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleShareCard = async (verse: DailyVerse, period: string, theme: any, periodIndex: number, date: Date) => {
    try {
      setCaptureConfig({ verse, period, theme, periodIndex, date });
      setIsCapturing(true);
      // Wait for hidden view to render and image to load
      setTimeout(async () => {
        try {
          if (captureRef.current?.capture) {
            const uri = await captureRef.current.capture();
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
              await Sharing.shareAsync(uri, { dialogTitle: 'Share Daily Verse' });
            } else {
              Alert.alert('Error', 'Sharing is not available on this device');
            }
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsCapturing(false);
          setCaptureConfig(null);
        }
      }, 1500);
    } catch (error) {
      console.error('Error sharing verse:', error);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <View style={[styles.fallbackContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (verseData.length === 0) {
    return (
      <View style={[styles.fallbackContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.errorText}>No verses available.</Text>
        <TouchableOpacity style={styles.backBtnFallback} onPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('Tabs');
          }
        }}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* TOP NAVBAR */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Tabs');
            }
          }} style={styles.iconBtn}>
            <ArrowLeft color={colors.text} size={28} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Daily Verses</Text>
          <TouchableOpacity onPress={() => setShowTelugu(!showTelugu)} style={styles.toggleBtn}>
            <Repeat color={colors.text} size={16} />
            <Text style={styles.toggleBtnText}>
              {showTelugu ? 'English' : 'Telugu'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          style={styles.mainScroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadVerses(true)} tintColor={colors.primary} />
          }
        >
          {verseData.map((dayData, dayIndex) => {
            const isToday = dayIndex === 0;
            
            return (
              <View key={dayIndex} style={styles.daySection}>
                
                {/* SECTION HEADER */}
                {isToday ? (
                  <View style={styles.sectionHeader}>
                    <View style={styles.todayHeaderRow}>
                      <Sun color="#f59e0b" size={24} />
                      <Text style={styles.sectionTitle}>Today</Text>
                    </View>
                    <Text style={styles.dateText}>{formatDate(dayData.date)}</Text>
                  </View>
                ) : (
                  <View style={[styles.sectionHeader, { marginTop: dayIndex === 1 ? 20 : 10 }]}>
                    {dayIndex === 1 && (
                      <View style={styles.pastTitleRow}>
                        <CalendarIcon color="#64748b" size={20} />
                        <Text style={styles.pastTitle}>Past Daily Verses</Text>
                      </View>
                    )}
                    <Text style={styles.pastDateText}>{formatDate(dayData.date)}</Text>
                  </View>
                )}

                {/* HORIZONTAL CAROUSEL FOR THE DAY */}
                <ScrollView 
                  ref={isToday ? todayCarouselRef : null}
                  horizontal 
                  pagingEnabled 
                  showsHorizontalScrollIndicator={false}
                  bounces={false}
                  snapToInterval={width}
                  decelerationRate="fast"
                  style={styles.carousel}
                  onMomentumScrollEnd={isToday ? handleScrollEnd : undefined}
                >
                  {dayData.verses.map((verse, periodIndex) => {
                    const period = periods[periodIndex];
                    const theme = THEMES[period];
                    const Icon = theme.Icon;
                    const FooterIcon = theme.FooterIcon;
                    const dynamicColors = getDynamicGradient(dayData.date, period, periodIndex);

                    return (
                      <View key={periodIndex} style={[styles.cardWrapper, { width }]}>
                        {verse.backgroundUrl ? (
                          <ImageBackground 
                            source={{ uri: verse.backgroundUrl }} 
                            style={styles.cardGradient}
                            imageStyle={{ borderRadius: 24 }}
                          >
                            <LinearGradient 
                              colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)']} 
                              style={StyleSheet.absoluteFillObject} 
                            />
                            {renderCardContent(verse, period, theme, periodIndex, dayData.date)}
                          </ImageBackground>
                        ) : (
                          <LinearGradient colors={dynamicColors} style={styles.cardGradient}>
                            {renderCardContent(verse, period, theme, periodIndex, dayData.date)}
                          </LinearGradient>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
      {renderHiddenCaptureView()}
      
      {/* Show an overlay spinner if capturing */}
      {isCapturing && (
        <View style={StyleSheet.absoluteFillObject}>
           <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
             <ActivityIndicator size="large" color="#ffffff" />
             <Text style={{ color: '#ffffff', marginTop: 12, fontWeight: '600' }}>Preparing image...</Text>
           </View>
        </View>
      )}

      {/* Beautiful Success Popup */}
      {showSuccessToast && (
        <View style={styles.toastContainer}>
          <View style={styles.toastInner}>
            <View style={styles.toastIconCircle}>
              <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>✓</Text>
            </View>
            <Text style={styles.toastTitle}>Success!</Text>
            <Text style={styles.toastSubtitle}>Card saved to your gallery</Text>
          </View>
        </View>
      )}
    </View>
  );

  function renderCardContent(verse: DailyVerse, period: string, theme: any, periodIndex: number, date: Date) {
    const Icon = theme.Icon;
    
    return (
      <>
        <View style={styles.cardInner}>
          {/* HEADER (ICON & TITLE) */}
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: theme.color }]}>
              <Icon color="#fff" size={28} />
            </View>
            <View style={styles.titleWrapper}>
              <Text style={[styles.periodText, { color: theme.color }]}>GOOD {period.toUpperCase()}</Text>
            </View>
          </View>

          {/* MAIN VERSE */}
          <View style={styles.verseBlock}>
            <View style={[styles.verticalLine, { backgroundColor: theme.color }]} />
            <View style={styles.verseTextContainer}>
              <Text style={[styles.quoteMark, { color: theme.color }]}>“</Text>
              <Text style={[styles.verseText, { color: '#ffffff' }]}>
                {showTelugu ? verse.verseTe : verse.verseEn}
              </Text>
              <Text style={[styles.quoteMarkBottom, { color: theme.color }]}>”</Text>
            </View>
          </View>
          <Text style={[styles.referenceText, { color: theme.color }]}>
            {showTelugu ? verse.referenceTe : verse.referenceEn}
          </Text>
        </View>

        {/* PAGINATION DOTS */}
        <View style={styles.paginationContainer}>
          {periods.map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.dot, 
                periodIndex === i && styles.activeDot,
                periodIndex === i && { backgroundColor: '#ffffff' }
              ]} 
            />
          ))}
        </View>

        {/* SEMI-TRANSPARENT FOOTER */}
        <View style={[styles.footer, { backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 12, justifyContent: 'flex-end' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 16, gap: 16 }}>
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={() => handleDownload(verse, period, theme, periodIndex, date)}
              disabled={isCapturing}
            >
              <Download color="#ffffff" size={20} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={() => handleShareCard(verse, period, theme, periodIndex, date)}
              disabled={isCapturing}
            >
              <Share2 color="#ffffff" size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  // Render the hidden capture view at the root level
  function renderHiddenCaptureView() {
    if (!captureConfig) return null;
    const { verse, period, theme, periodIndex, date } = captureConfig;
    const Icon = theme.Icon;
    const dynamicColors = getDynamicGradient(date, period, periodIndex);

    const captureContent = (
      <>
        <View style={styles.cardInner}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: theme.color }]}>
              <Icon color="#fff" size={28} />
            </View>
            <View style={styles.titleWrapper}>
              <Text style={[styles.periodText, { color: theme.color }]}>GOOD {period.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.verseBlock}>
            <View style={[styles.verticalLine, { backgroundColor: theme.color }]} />
            <View style={styles.verseTextContainer}>
              <Text style={[styles.quoteMark, { color: theme.color }]}>“</Text>
              
              {/* BOTH TELUGU AND ENGLISH FOR CAPTURE */}
              <Text style={[styles.verseText, { color: '#ffffff', marginBottom: 12 }]}>
                {verse.verseTe}
              </Text>
              <Text style={[styles.verseText, { color: '#ffffff', fontSize: 18, opacity: 0.95 }]}>
                {verse.verseEn}
              </Text>
              
              <Text style={[styles.quoteMarkBottom, { color: theme.color }]}>”</Text>
            </View>
          </View>
          <Text style={[styles.referenceText, { color: theme.color, fontSize: 16 }]}>
            {verse.referenceTe} | {verse.referenceEn}
          </Text>
          {activeChurch?.name && (
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 12, fontWeight: '500', textAlign: 'center', letterSpacing: 0.5 }}>
              {activeChurch.name}
            </Text>
          )}
        </View>

        <View style={[styles.footer, { backgroundColor: 'rgba(0,0,0,0.5)', padding: 16, alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ fontSize: 14, color: '#ffffff', fontWeight: '600' }}>
            {formatDate(date)}
          </Text>
        </View>
      </>
    );

    return (
      <View style={{ position: 'absolute', top: -10000, left: -10000 }}>
        <ViewShot ref={captureRef} options={{ format: 'png', quality: 1 }}>
          <View style={[styles.cardWrapper, { width, height: width * 1.5 }]} collapsable={false}>
            {verse.backgroundUrl ? (
              <View style={[styles.cardGradient, { backgroundColor: '#111' }]} collapsable={false}>
                <Image 
                  source={{ uri: verse.backgroundUrl }} 
                  style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]} 
                  resizeMode="cover"
                />
                <LinearGradient 
                  colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']} 
                  style={StyleSheet.absoluteFillObject} 
                />
                {captureContent}
              </View>
            ) : (
              <LinearGradient colors={dynamicColors} style={styles.cardGradient}>
                {captureContent}
              </LinearGradient>
            )}
          </View>
        </ViewShot>
      </View>
    );
  }
}

const getStyles = (isDark: boolean, colors: any) => StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  fallbackContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  iconBtn: {
    padding: 8,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#334155' : '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  toggleBtnText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: colors.text,
  },
  mainScroll: {
    flex: 1,
  },
  daySection: {
    marginBottom: 24,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  todayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pastTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 16,
  },
  pastTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  pastDateText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  carousel: {
    flexGrow: 0,
  },
  cardWrapper: {
    paddingHorizontal: 16,
    minHeight: 480, 
  },
  cardGradient: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'space-between',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  cardInner: {
    padding: 24,
    flex: 1,
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    gap: 16,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  titleWrapper: {
    flex: 1,
  },
  periodText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  verseBlock: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  verticalLine: {
    width: 4,
    borderRadius: 2,
    marginRight: 16,
  },
  verseTextContainer: {
    flex: 1,
    position: 'relative',
    paddingVertical: 10,
  },
  quoteMark: {
    fontSize: 50,
    position: 'absolute',
    top: -15,
    left: -12,
    fontWeight: 'bold',
    opacity: 0.5,
  },
  quoteMarkBottom: {
    fontSize: 50,
    position: 'absolute',
    bottom: -15,
    right: 0,
    fontWeight: 'bold',
    opacity: 0.5,
  },
  verseText: {
    fontSize: 22,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '700',
    lineHeight: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  referenceText: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeDot: {
    width: 18,
    backgroundColor: '#ffffff',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  footerIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerSubtitle: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
    marginHorizontal: 12,
    lineHeight: 16,
  },
  shareCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  backBtnFallback: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  toastContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  toastInner: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingVertical: 32,
    paddingHorizontal: 40,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  toastIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  toastTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  toastSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  }
});
