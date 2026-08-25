import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  PanResponder, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  ActivityIndicator,
  Image,
  RefreshControl,
  Alert,
  StatusBar,
  Platform,
  Share,
  Modal,
  Linking,
  Animated,
  Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDateDisplay } from '../utils/DateUtils';
import { 
  Bell, 
  Hexagon,
  Book, 
  Play, 
  ChevronRight, 
  Share2, 
  Mic, 
  Heart, 
  Calendar, 
  MapPin,
  CircleDollarSign as DollarSign,
  BookOpen,
  MessageSquare,
  Users,
  MoreHorizontal,
  CheckCircle,
  Sun,
  Moon,
  Award,
  Music,
  FileText,
  X,
  Phone,
  Mail,
  Info,
  Video,
  Image as LucideImage
} from 'lucide-react-native';

import firestore from '@react-native-firebase/firestore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import HexagonDate from '../components/HexagonDate';
import { useAuth } from '../context/AuthContext';
import { useChurch } from '../context/ChurchContext';
import { useTheme } from '../context/ThemeContext';
import Theme from '../theme/Theme';
import FirestoreService, { DailyPromise, ScheduleEvent, AppMember, Sermon } from '../services/FirestoreService';
import { CustomAlert } from '../components/CustomAlert';
import Svg, { Path, Circle, Rect, Polygon, Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText, Mask } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

const YoutubeIcon = ({ size = 26, color = '#fff' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.507 9.388.507 9.388.507s7.517 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837z" />
    <Polygon points="9.5 8.5 15.5 12 9.5 15.5" fill="#ef4444" />
  </Svg>
);

const { width, height } = Dimensions.get('window');

// Utility to strip HTML tags
const stripHtml = (html: string | undefined): string => {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, '').trim();
};

const EventMarquee = ({ events, onEventPress }: { events: any[], onEventPress: (event: any) => void }) => {
  const [contentWidth, setContentWidth] = useState(0);
  const scrollAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (contentWidth > 0) {
      scrollAnim.setValue(width);
      Animated.loop(
        Animated.timing(scrollAnim, {
          toValue: -contentWidth,
          duration: (contentWidth + width) * 35, // Faster scroll speed
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [contentWidth]);

  if (!events || events.length === 0) return null;

  const formatTimeStr = (timeStr: string, lang: 'en' | 'te' = 'en') => {
    if (!timeStr) return '';
    try {
      const timePart = timeStr.includes('T') ? timeStr.split('T')[1].split('.')[0] : timeStr;
      const [hours, minutes] = timePart.split(':');
      const h = parseInt(hours);
      if (isNaN(h)) return 'Time TBD';
      const ampmEn = h >= 12 ? 'PM' : 'AM';
      
      let ampmTe = '';
      if (h < 12) ampmTe = 'ఉదయం'; // Morning
      else if (h < 16) ampmTe = 'మధ్యాహ్నం'; // Afternoon
      else if (h < 20) ampmTe = 'సాయంత్రం'; // Evening
      else ampmTe = 'రాత్రి'; // Night

      const formattedHours = h % 12 || 12;
      
      if (lang === 'te') {
        return `${ampmTe} ${formattedHours}:${minutes}`;
      }
      return `${formattedHours}:${minutes} ${ampmEn}`;
    } catch (e) {
      return timeStr;
    }
  };

  const getEventStatus = (event: ScheduleEvent) => {
    const today = new Date();
    const dateParts = (event.date || '').split('-');
    const eventYear = parseInt(dateParts[0]) || today.getFullYear();
    const eventMonth = parseInt(dateParts[1]) - 1 || 0;
    const eventDay = parseInt(dateParts[2]) || today.getDate();

    const parseTime = (timeStr: string) => {
      if (!timeStr) return null;
      const timePart = timeStr.includes('T') ? timeStr.split('T')[1] : timeStr;
      const [h, m, s] = timePart.split(':').map(Number);
      return new Date(eventYear, eventMonth, eventDay, h || 0, m || 0, s || 0);
    };

    const startDt = parseTime(event.startTime);
    const endDt = parseTime(event.endTime);

    if (!startDt) {
      const eventDate = new Date(eventYear, eventMonth, eventDay, 23, 59, 59);
      return today > eventDate ? 'completed' : 'upcoming';
    }

    if (today < startDt) return 'upcoming';
    if (endDt && today > endDt) return 'completed';
    return 'live';
  };

  const hasLiveEvents = events.some(ev => getEventStatus(ev) === 'live');

  return (
    <View style={styles.marqueeWrapper}>
      {/* Header row */}
      <View style={styles.marqueeTitleRow}>
        <Text style={styles.marqueeTitleEmoji}>🎉</Text>
        <Text style={styles.marqueeTitleText}>TODAY'S EVENTS  •  నేటి కార్యక్రమాలు</Text>
      </View>
      {/* Scrolling ticker */}
      <View style={styles.marqueeTicker}>
        <View style={[styles.marqueeTickerBadge, hasLiveEvents && { backgroundColor: '#dc2626' }]}>
          <Text style={styles.marqueeTickerBadgeTxt}>{hasLiveEvents ? 'LIVE' : 'TODAY'}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEnabled={false} style={styles.marqueeContent}>
          <Animated.View
            style={{ flexDirection: 'row', alignItems: 'center', paddingRight: width, transform: [{ translateX: scrollAnim }] }}
            onLayout={(e) => setContentWidth(e.nativeEvent.layout.width)}
          >
            {events.map((ev, index) => {
              const status = getEventStatus(ev);
              const isLive = status === 'live';
              return (
              <TouchableOpacity
                key={`${ev.id || 'event'}-${index}`}
                style={styles.marqueeItem}
                onPress={() => {
                  if (isLive && ev.liveUrl) {
                    Linking.openURL(ev.liveUrl);
                  } else {
                    onEventPress(ev);
                  }
                }}
                activeOpacity={0.8}
              >
                {/* English block */}
                <View style={[styles.marqueeEventDot, isLive && { backgroundColor: '#dc2626' }]} />
                <Text style={styles.marqueeItemTitle}>{ev.title}</Text>
                <View style={styles.marqueeTimePill}>
                  <Text style={styles.marqueeItemTime}>
                    ⏰ {formatTimeStr(ev.startTime, 'en')}{ev.endTime ? ` - ${formatTimeStr(ev.endTime, 'en')}` : ''}
                  </Text>
                </View>

                {/* Telugu block — always shown, with fallbacks */}
                <Text style={styles.marqueeLangDivider}>  |  </Text>
                <View style={[styles.marqueeEventDotTe, isLive && { backgroundColor: '#dc2626' }]} />
                <Text style={styles.marqueeItemTitleTe}>{ev.titleTelugu || ev.title}</Text>
                <View style={styles.marqueeTimePillTe}>
                  <Text style={styles.marqueeItemTimeTe}>
                    ⏰ {formatTimeStr(ev.startTime, 'te')}{ev.endTime ? ` - ${formatTimeStr(ev.endTime, 'te')}` : ''}
                  </Text>
                </View>

                <Text style={styles.marqueeSeparator}>    ✦    </Text>
              </TouchableOpacity>
              );
            })}
          </Animated.View>
        </ScrollView>
      </View>
    </View>
  );
};

// --- Memory Cache for Instant Navigation ---
let cachedPromise: DailyPromise | null = null;
let cachedPromiseThumbnail: string | null = null;
let cachedTodayEvents: ScheduleEvent[] = [];
let cachedEvents: ScheduleEvent[] = [];
let cachedLatestSermon: Sermon | null = null;
let cachedLatestPrayer: any | null = null;
let cachedPrayerCount: number = 0;

const AnimatedParticle = ({ left, size, duration, delay, color, opacity }: any) => {
  const translateY = React.useRef(new Animated.Value(0)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(translateY, { toValue: 20, duration: 0, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 0, duration: 0, useNativeDriver: true })
        ]),
        Animated.parallel([
          Animated.timing(translateY, { toValue: -150, duration: duration, easing: Easing.linear, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(fadeAnim, { toValue: opacity, duration: duration * 0.3, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: opacity, duration: duration * 0.4, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 0, duration: duration * 0.3, useNativeDriver: true })
          ])
        ])
      ])
    );
    const timeout = setTimeout(() => {
      anim.start();
    }, delay || 0);
    return () => { clearTimeout(timeout); anim.stop(); };
  }, []);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          borderRadius: size / 2,
          left: left,
          width: size,
          height: size,
          backgroundColor: color || '#FCD34D',
          opacity: fadeAnim,
          transform: [{ translateY }],
          bottom: '0%'
        }
      ]}
    />
  );
};

let hasShownCelebrationThisSession = false; /* forced refresh */ // Reset by script

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user, signOut, member: authMember } = useAuth();
  const { activeChurch, isImpersonating, impersonatedBranchName, stopImpersonation } = useChurch();
  const { mode, isDark, toggleTheme, colors } = useTheme();
  const [member, setMember] = useState<AppMember | null>(authMember as AppMember | null);
  const [promise, setPromise] = useState<DailyPromise | null>(cachedPromise);
  const [todayEvents, setTodayEvents] = useState<ScheduleEvent[]>(cachedTodayEvents);
  const [events, setEvents] = useState<ScheduleEvent[]>(cachedEvents);
  const [latestSermon, setLatestSermon] = useState<Sermon | null>(cachedLatestSermon);
  const [latestPrayer, setLatestPrayer] = useState<any | null>(cachedLatestPrayer);
  const [prayerCount, setPrayerCount] = useState(cachedPrayerCount);
  const [loading, setLoading] = useState(false);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Floating Live Celebrations State
  const [liveCelebrations, setLiveCelebrations] = useState<any[]>([]);
  const [unreadLiveMsgs, setUnreadLiveMsgs] = useState(0);
  const pan = useRef(new Animated.ValueXY()).current;
  const emojiAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const curveLineAnim = useRef(new Animated.Value(0)).current;
  const [currentEmojiIdx, setCurrentEmojiIdx] = useState(0);

  const fetchLiveCelebrations = async () => {
    if (!activeChurch?.id) return;
    try {
      const FirestoreService = require('../services/FirestoreService').default;
      const allCelebs = await FirestoreService.getAllCelebrations(activeChurch.id);
      
      const today = new Date();
      const m = today.getMonth() + 1;
      const d = today.getDate();
      
      const todays = allCelebs.filter((c: any) => {
        let isCeleb = false;
        ['dob', 'anniversaryDate', 'baptismDate'].forEach(field => {
          if (c[field]) {
            const parts = c[field].split('-');
            let mm, dd;
            if (parts[0].length === 4) { mm = parseInt(parts[1], 10); dd = parseInt(parts[2], 10); } 
            else { dd = parseInt(parts[0], 10); mm = parseInt(parts[1], 10); }
            if (mm === m && dd === d) isCeleb = true;
          }
        });
        return isCeleb;
      });
      
      
      // Bulletproof check for the current user's own birthday
      const todayMonthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const isToday = (dateString?: string) => {
        if (!dateString) return false;
        const datePart = dateString.split('T')[0];
        const parts = datePart.split(/[-/]/);
        if (parts.length >= 3) {
          let mm, dd;
          if (parts[0].length === 4) {
            mm = parts[1].padStart(2, '0');
            dd = parts[2].padStart(2, '0');
          } else {
            dd = parts[0].padStart(2, '0');
            mm = parts[1].padStart(2, '0');
          }
          return `${mm}-${dd}` === todayMonthDay;
        }
        return false;
      };

      if (member) {
        const isSelfBirthday = isToday((member as any).dob);
        if (isSelfBirthday) {
          const alreadyInTodays = todays.some((t: any) => t.Id === (member as any).id || t.Phone === (member as any).phone);
          if (!alreadyInTodays) {
            todays.push({
              ...member,
              Id: (member as any).id || 'self',
              Name: (member as any).name || (member as any).firstName || 'Member',
              dob: (member as any).dob,
              isSelf: true
            });
          }
        }
      }

      setLiveCelebrations(todays);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLiveCelebrations();
  }, [activeChurch?.id, member]);

  useFocusEffect(
    React.useCallback(() => {
      if (liveCelebrations.length === 0 || !activeChurch?.id) return;

      const todayStr = new Date().toISOString().split('T')[0];
      const unsubscribe = firestore()
        .collection('churches')
        .doc(activeChurch.id)
        .collection('live_celebrations')
        .doc(todayStr)
        .collection('messages')
        .onSnapshot(async (snapshot) => {
          if (!snapshot) return;
          const lastRead = await AsyncStorage.getItem(`@lastReadCeleb_${todayStr}`);
          const lastReadTime = lastRead ? parseInt(lastRead, 10) : 0;
          
          let unread = 0;
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            const msgTime = data.createdAt?.toMillis?.() || (typeof data.createdAt === 'number' ? data.createdAt : 0);
            if (msgTime > lastReadTime) {
              unread++;
            }
          });
          setUnreadLiveMsgs(unread);
        });
        
      return () => unsubscribe();
    }, [liveCelebrations.length, activeChurch?.id])
  );
  
  // Load saved position (Commented out to reset position)
    /*
    AsyncStorage.getItem('@live_celebrations_pos').then(val => {
      if (val) {
        try {
          const { x, y } = JSON.parse(val);
          if (typeof x === 'number' && typeof y === 'number' && !isNaN(x) && !isNaN(y) && Math.abs(x) < 2000 && Math.abs(y) < 2000) {
            pan.setValue({ x, y });
          } else {
             AsyncStorage.removeItem('@live_celebrations_pos');
          }
        } catch (e) {}
      }
    });
    */
  useEffect(() => {
    if (liveCelebrations.length === 0) return;
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(emojiAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(emojiAnim, { toValue: 0, duration: 250, useNativeDriver: true })
      ]).start(() => {
        setCurrentEmojiIdx(prev => (prev + 1) % 4);
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [liveCelebrations.length]);

  useEffect(() => {
    if (liveCelebrations.length === 0) return;
    const wave = Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(waveAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        Animated.delay(1500)
      ])
    );
    wave.start();
    return () => wave.stop();
  }, [liveCelebrations.length]);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(curveLineAnim, {
        toValue: 1,
        duration: 12000, // Doubled to maintain speed since travel distance is much larger
        easing: Easing.linear, // Prevents jumping/stuttering from default ease-in-out
        useNativeDriver: false,
      })
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (e, gestureState) => Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (e, gesture) => {
        pan.flattenOffset();
        AsyncStorage.setItem('@live_celebrations_pos', JSON.stringify({ x: (pan.x as any)._value, y: (pan.y as any)._value }));
      }
    })
  ).current;

  const getEmoji = () => {
    const emojis = ['🎂', '💍', '💧', '🎉'];
    return emojis[currentEmojiIdx];
  };

  const [activeMeeting, setActiveMeeting] = useState<any | null>(null);
  const isGuest = user?.isAnonymous;

  const [promiseThumbnail, setPromiseThumbnail] = useState<string | null>(cachedPromiseThumbnail);
  const [carouselSlide, setCarouselSlide] = useState(0); // 0 = text, 1 = image
  const carouselScrollRef = useRef<ScrollView>(null);
  
  // -- Sticky Header Animation --
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerPadding = Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight ? StatusBar.currentHeight + 15 : 40);
  const HEADER_SCROLL_DISTANCE = 85;
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -HEADER_SCROLL_DISTANCE],
    extrapolate: 'clamp'
  });
  const topRowOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 1.5],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'info' | 'error' | 'warning';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info'
  });

  const fetchData = async () => {
    try {
      // 1. Try to load cached promise for instant rendering on cold boot
      if (!promise) {
        AsyncStorage.getItem('@cached_daily_promise').then(val => {
          if (val && !promise) {
            try {
              const cached = JSON.parse(val);
              const today = new Date();
              const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
              if (cached.date === todayStr) {
                setPromise(cached);
                if (cached.imageUrl) setPromiseThumbnail(cached.imageUrl);
              } else {
                AsyncStorage.removeItem('@cached_daily_promise');
              }
            } catch (e) {}
          }
        }).catch(() => {});
      }

      // 2. Fetch Member Details non-blocking
      if (user?.phoneNumber) {
        FirestoreService.checkContactExists(user.phoneNumber).then((res: any) => {
          if (res?.exists && res?.member) {
            setMember(res.member);
            const mId = res.member.id;
            FirestoreService.updateLastAppOpened(mId);
            // Fetch Latest Prayer async
            FirestoreService.getPrayerRequests({ contactId: mId }).then((prayers: any[]) => {
              if (prayers && prayers.length > 0) {
                cachedLatestPrayer = prayers[0];
                cachedPrayerCount = prayers.length;
                setLatestPrayer(cachedLatestPrayer);
                setPrayerCount(cachedPrayerCount);
              }
            }).catch(() => {});
          }
        }).catch(() => {});
      }

      // 3. Fetch Daily Promise non-blocking
      FirestoreService.getDailyPromise().then((prom: any) => {
        if (prom) {
          cachedPromise = prom;
          setPromise(prom);
          AsyncStorage.setItem('@cached_daily_promise', JSON.stringify(prom));
          if (prom.imageUrl) {
            cachedPromiseThumbnail = prom.imageUrl;
            setPromiseThumbnail(prom.imageUrl);
          } else {
            cachedPromiseThumbnail = null;
            setPromiseThumbnail(null);
          }
        } else {
          cachedPromise = null;
          setPromise(null);
          AsyncStorage.removeItem('@cached_daily_promise');
          cachedPromiseThumbnail = null;
          setPromiseThumbnail(null);
        }
      }).catch(() => {});

      // 4. Fetch Today's Events non-blocking
      FirestoreService.getTodayEvents().then((ev: any) => {
        cachedTodayEvents = ev || [];
        setTodayEvents(cachedTodayEvents);
      }).catch(() => {});

      // 5. Fetch Upcoming Events non-blocking
      FirestoreService.getUpcomingEvents(3).then((ev: any) => {
        cachedEvents = ev || [];
        setEvents(cachedEvents);
      }).catch(() => {});

      // 6. Fetch Latest Sermon non-blocking
      FirestoreService.getSermons(1).then((s: any) => {
        if (s?.length > 0) {
          cachedLatestSermon = s[0];
          setLatestSermon(cachedLatestSermon);
        }
      }).catch(() => {});

    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      // Unblock UI immediately so skeletons/cached UI can render while background fetches run
      setLoading(false);
      setInitialFetchDone(true);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Listen for Live/Upcoming Google Meets
  useEffect(() => {
    if (!activeChurch?.id) return;
    const unsubscribe = firestore()
      .collection('churches')
      .doc(activeChurch.id)
      .collection('online_meetings')
      .where('status', 'in', ['upcoming', 'live'])
      .onSnapshot((snapshot) => {
        if (!snapshot.empty) {
          const meetings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // Assuming the first returned is the active one, or sort by startTime
          setActiveMeeting(meetings[0]);
        } else {
          setActiveMeeting(null);
        }
      });
    return () => unsubscribe();
  }, [activeChurch?.id]);

  // Check for Celebrations
  useEffect(() => {
    if (!member) return;

    const checkCelebrations = async () => {
      try {
        const today = new Date();
        const todayMonthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        // Helper to check if a date string (YYYY-MM-DD) matches today's month and day
        const isToday = (dateString?: string) => {
          if (!dateString) return false;
          const parts = dateString.split('T')[0].split('-');
          if (parts.length >= 3) {
            return `${parts[1]}-${parts[2]}` === todayMonthDay;
          }
          return false;
        };

        const activeCelebrations: string[] = [];
        if (isToday((member as any).dob)) activeCelebrations.push('birthday');
        if (isToday((member as any).anniversaryDate)) activeCelebrations.push('wedding');
        if (isToday((member as any).baptismDate)) activeCelebrations.push('baptism');

        if (activeCelebrations.length > 0) {
          if (!(global as any).hasShownCelebration) {
            (global as any).hasShownCelebration = true;
            setTimeout(() => {
              navigation.navigate('Celebration', { 
                celebrations: activeCelebrations, 
                name: (member as any).name || (member as any).firstName || 'Member' 
              });
            }, 2000);
          }
        }
      } catch (error) {
        console.error('Error checking celebrations:', error);
      }
    };

    // Only run if not guest
    if (!isGuest) {
      checkCelebrations();
    }
  }, [member, isGuest]);

  // Carousel auto-slide logic
  useEffect(() => {
    if (!promiseThumbnail) return;
    setCarouselSlide(0);
    const interval = setInterval(() => {
      setCarouselSlide(prev => {
        const next = prev === 0 ? 1 : 0;
        carouselScrollRef.current?.scrollTo({ x: next * (width - 32), animated: true });
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [promiseThumbnail]);

  const goToSlide = (idx: number) => {
    setCarouselSlide(idx);
    carouselScrollRef.current?.scrollTo({ x: idx * (width - 32), animated: true });
  };

  const handleOpenMembers = () => {
    if (!member) {
      Alert.alert('Sign In Required', 'Please complete your profile configuration first.');
      return;
    }
    // Removed the !member.accountId check to allow members to add family members using their own ID
    navigation.navigate('Members');
  };

  const handleSharePromise = async () => {
    if (!promise) return;
    try {
      const verseEn = stripHtml(promise.verse);
      const verseTe = stripHtml(promise.verseTelugu);
      const message = `Today's Promise · ఈ రోజు వాగ్దానం\n\n"${verseEn}"\n— ${promise.verseReferenceEn || 'Scripture'}\n\n"${verseTe}"\n— ${promise.verseReferenceTe || 'వాగ్దానం'}\n\nWatch Devotional: https://youtu.be/${promise.youtubeId}\n\nBrothers in Christ Fellowship 🙏`;
      await Share.share({ message });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const onRefresh = async () => {
    (global as any).hasShownCelebration = false;
    setRefreshing(true);
    fetchData();
  };

  const handleGuestProtectedNavigation = (screenName: string, params?: any) => {
    if (isGuest) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to access this feature.',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Sign In', onPress: () => signOut() }
        ]
      );
    } else {
      navigation.navigate(screenName, params);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getTeluguDay = () => {
    const days = ['ఆదివారం', 'సోమవారం', 'మంగళవారం', 'బుధవారం', 'గురువారం', 'శుక్రవారం', 'శనివారం'];
    return days[new Date().getDay()];
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '--:--';
    try {
      const timePart = timeStr.includes('T') ? timeStr.split('T')[1].split('.')[0] : timeStr;
      const [hours, minutes] = timePart.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const formattedHours = h % 12 || 12;
      return `${formattedHours}:${minutes} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  const formatTeluguDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const monthsTe = ['జనవరి', 'ఫిబ్రవరి', 'మార్చి', 'ఏప్రిల్', 'మే', 'జూన్', 'జూలై', 'ఆగస్టు', 'సెప్టెంబర్', 'అక్టోబర్', 'నవంబర్', 'డిసెంబర్'];
      return `${monthsTe[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    } catch (e) {
      return dateStr;
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: '#1a2d5a' }]}>
        <ActivityIndicator size="large" color="#FCD34D" />
        <Text style={styles.screenLoadingText}>{activeChurch?.name || 'Welcome'} — {activeChurch?.tagline || 'Connect & Grow'}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.mainContainer, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />
      <CustomAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
      
      {/* Animated Header with Gradient Bleed for seamless status bar */}
      <Animated.View style={{ position: 'absolute', top: -200, left: 0, right: 0, zIndex: 10, transform: [{ translateY: headerTranslateY }] }}>
      <LinearGradient 
        colors={['#17357a', '#0a1945']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.appHeader, { paddingTop: headerPadding + 200 }]}
      >
        {/* Decorative Particles */}
        <View style={styles.particleLayer}>
          <AnimatedParticle left="10%" size={4} duration={4000} delay={0} opacity={0.7} />
          <AnimatedParticle left="25%" size={5} duration={6000} delay={2000} opacity={0.5} />
          <AnimatedParticle left="55%" size={7} duration={7500} delay={1000} opacity={0.4} />
          <AnimatedParticle left="80%" size={5} duration={5000} delay={3000} opacity={0.8} />
          <AnimatedParticle left="40%" size={6} duration={5500} delay={4000} opacity={0.6} />
          <AnimatedParticle left="90%" size={8} duration={7000} delay={500} opacity={0.5} />
          <AnimatedParticle left="70%" size={4} duration={4500} delay={2500} opacity={0.9} />
          <AnimatedParticle left="15%" size={6} duration={6500} delay={1500} opacity={0.5} />
        </View>

        <Animated.View style={{ opacity: topRowOpacity }}>
          <View style={styles.headerTopRow}>
          <View style={styles.headerLeft}>
            <View style={styles.logoCircle}>
              {activeChurch?.theme?.logoUrl ? (
                <Image 
                  source={{ uri: activeChurch.theme.logoUrl }} 
                  style={styles.logoImg}
                  resizeMode="cover"
                />
              ) : null}
            </View>
              <View style={styles.titleCol}>
                <Text style={styles.hdTitle}>{activeChurch?.name || ''}</Text>
                {!!activeChurch?.tagline && (
                  <Text style={styles.hdSub}>{activeChurch.tagline}</Text>
                )}
              </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.actionIconButton} onPress={() => navigation.navigate('Updates')}>
              <Bell color="#fff" size={22} />
              <View style={styles.notifBadge} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.avatarWrapper} onPress={() => {
              if (isImpersonating) return;
              handleGuestProtectedNavigation('Profile');
            }}>
              {(() => {
                if (isImpersonating) {
                  return (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarLetter}>AD</Text>
                    </View>
                  );
                }

                const m: any = member;
                let displayPhoto = null;
                if (m) {
                  if (m.photoRemoved || m.profilePhoto === null) {
                    displayPhoto = null;
                  } else {
                    displayPhoto = m.profilePhoto || m.photoURL || m.photoUrl || m.profileImageUrl || m.PhotoUrl || m.Photo || user?.photoURL;
                  }
                } else {
                  displayPhoto = user?.photoURL;
                }

                const getInitials = () => {
                  if (member?.firstName && member?.lastName) {
                    return (member.firstName.charAt(0) + member.lastName.charAt(0)).toUpperCase();
                  }
                  const fullName = member?.name || user?.displayName || 'User';
                  const parts = fullName.trim().split(/\s+/);
                  const first = parts[0]?.charAt(0) || 'U';
                  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
                  return (first + last).toUpperCase();
                };

                return displayPhoto ? (
                  <Image source={{ uri: displayPhoto }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarLetter}>{getInitials()}</Text>
                  </View>
                );
              })()}
            </TouchableOpacity>
          </View>
        </View>

        {/* --- Gold Divider --- */}
        <LinearGradient 
          colors={['transparent', 'rgba(252, 211, 77, 0.4)', 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.goldDivider}
        />
        </Animated.View>

        {/* --- Greeting Row --- */}
        <View style={styles.greetingSection}>
          <View style={styles.greetingLeft}>
            <Svg height="50" width="100%" style={{ marginBottom: 2 }}>
              <Defs>
                <SvgLinearGradient id="greetingGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor="#FCD34D" stopOpacity="1" />
                  <Stop offset="1" stopColor="#f97316" stopOpacity="1" />
                </SvgLinearGradient>
              </Defs>
              <SvgText
                fill="url(#greetingGrad)"
                fontSize="32"
                fontWeight="400"
                fontFamily={Platform.OS === 'ios' ? 'Georgia' : 'serif'}
                fontStyle="italic"
                x="0"
                y="36"
              >
                {getGreeting()},
              </SvgText>
            </Svg>
            {isImpersonating ? (
              <Text style={[styles.userNameCream, { fontSize: 22, marginTop: 4 }]} numberOfLines={1}>
                Branch Admin
              </Text>
            ) : (
              <Text style={styles.userNameCream} numberOfLines={1}>
                {(`${member?.firstName || ''} ${member?.lastName || ''}`.trim()) || member?.name || user?.displayName || 'Guest'}
              </Text>
            )}
          </View>
          
          <View style={{ position: 'absolute', right: 20, top: 5 }}>
            <HexagonDate />
          </View>
        </View>

        {/* Animated Curved Gradient Glow Line */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 30, overflow: 'hidden' }}>
          <Svg width={width} height={30} style={{ position: 'absolute', bottom: 0 }}>
            <Defs>
              <SvgLinearGradient id="borderGrad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0%" stopColor="rgba(29, 78, 216, 0.2)" />
                <Stop offset="35%" stopColor="rgba(29, 78, 216, 0.2)" />
                <Stop offset="45%" stopColor="rgba(96, 165, 250, 0.8)" />
                <Stop offset="50%" stopColor="rgba(255, 255, 255, 1)" />
                <Stop offset="55%" stopColor="rgba(96, 165, 250, 0.8)" />
                <Stop offset="65%" stopColor="rgba(29, 78, 216, 0.2)" />
                <Stop offset="100%" stopColor="rgba(29, 78, 216, 0.2)" />
              </SvgLinearGradient>

              <Mask id="lineMask">
                {/* Needle-like tapered shape: 4px thick at center, 0px at the tips */}
                <Path
                  d={`M 0 0 A 30 30 0 0 0 30 30 L ${width - 30} 30 A 30 30 0 0 0 ${width} 0 A 30 26 0 0 1 ${width - 30} 26 L 30 26 A 30 26 0 0 1 0 0 Z`}
                  fill="white"
                />
              </Mask>
            </Defs>

            <AnimatedRect
              x={curveLineAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-width * 2, 0]
              })}
              y="0"
              width={width * 3}
              height="30"
              fill="url(#borderGrad)"
              mask="url(#lineMask)"
            />
          </Svg>
        </View>

      </LinearGradient>
      </Animated.View>

      <Animated.ScrollView 
        style={styles.scroll} 
        contentContainerStyle={{ paddingTop: headerPadding + 195 }} // Padding to clear the absolute header
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a2d5a" progressViewOffset={headerPadding + 195} />
        }
      >
        <EventMarquee events={todayEvents} onEventPress={(event) => navigation.navigate('EventDetails', { event })} />
        <View style={styles.contentPad}>
          {/* ── Daily Promise Carousel ── */}
          <View style={styles.promiseHero}>
            {/* Slides */}
            <ScrollView
              ref={carouselScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onMomentumScrollEnd={(e) => {
                const slide = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
                setCarouselSlide(slide);
              }}
              style={{ borderRadius: 20 }}
            >
              {/* Slide 1 — Promise Text */}
              <TouchableOpacity 
                activeOpacity={0.8}
                style={styles.phSlide} 
                onPress={() => handleGuestProtectedNavigation('Promise')}
              >
                <LinearGradient
                  colors={['#17357a', '#0a1945']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.phInner, { overflow: 'hidden' }]}
                >
                  {/* Decorative Ash Colored Circle Lines */}
                  <View style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, borderWidth: 1.5, borderColor: 'rgba(203, 213, 225, 0.15)' }} />
                  <View style={{ position: 'absolute', top: -10, right: -10, width: 100, height: 100, borderRadius: 50, borderWidth: 1.5, borderColor: 'rgba(203, 213, 225, 0.1)' }} />
                  <View style={{ position: 'absolute', bottom: -50, left: -20, width: 140, height: 140, borderRadius: 70, borderWidth: 1.5, borderColor: 'rgba(203, 213, 225, 0.1)' }} />

                  <Text style={styles.phLabel}>TODAY'S PROMISE · ఈ రోజు వాగ్దానం</Text>
                  <Text style={styles.phEn}>{promise ? `"${stripHtml(promise.verse)}"` : ''}</Text>
                  <Text style={styles.phRefEn}>{promise ? `— ${promise.verseReferenceEn || promise.verseReference}` : ''}</Text>
                  <View style={styles.phDivider} />
                  <Text style={styles.phTe}>{promise?.verseTelugu ? `"${stripHtml(promise.verseTelugu)}"` : ''}</Text>
                  <Text style={styles.phRefTe}>{promise?.verseReferenceTe ? `— ${promise.verseReferenceTe}` : ''}</Text>
                  <View style={styles.phActions}>
                    <TouchableOpacity style={styles.phShareBtn} onPress={handleSharePromise}>
                      <Share2 size={18} color="#fff" />
                      <Text style={styles.phBtnTxt}>Share</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.phWatchBtn} 
                      onPress={() => {
                        handleGuestProtectedNavigation('DailyVideo', { 
                          youtubeId: promise?.youtubeId,
                          videoTitle: promise?.videoTitle,
                          pastor: promise?.pastor
                        });
                      }}
                    >
                      <Play size={18} color="#fff" fill="#fff" />
                      <Text style={styles.phBtnTxt}>Watch video</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Slide 2 — Thumbnail (only if image exists) */}
              {promiseThumbnail && (
                <View style={[styles.phSlide, styles.phThumbnailSlide, { elevation: isDark ? 0 : 8 }]}>
                  <LinearGradient
                    colors={['#17357a', '#0a1945']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1, paddingTop: 16, borderRadius: 20, overflow: 'hidden' }}
                  >
                    {/* Decorative Ash Colored Circle Lines */}
                    <View style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, borderWidth: 1.5, borderColor: 'rgba(203, 213, 225, 0.15)' }} />
                    <View style={{ position: 'absolute', top: -10, right: -10, width: 100, height: 100, borderRadius: 50, borderWidth: 1.5, borderColor: 'rgba(203, 213, 225, 0.1)' }} />
                    <View style={{ position: 'absolute', bottom: -50, left: -20, width: 140, height: 140, borderRadius: 70, borderWidth: 1.5, borderColor: 'rgba(203, 213, 225, 0.1)' }} />
                    <Text style={styles.phLabel}>TODAY'S PROMISE · ఈ రోజు వాగ్దానం</Text>
                    <Image
                      source={{ uri: promiseThumbnail }}
                      style={[styles.phThumbnailImg, { flex: 1 }]}
                      resizeMode="contain"
                    />
                  </LinearGradient>
                </View>
              )}
            </ScrollView>

            {/* Dot Indicators (only shown when thumbnail exists) */}
            {promiseThumbnail && (
              <View style={styles.dotRow}>
                {[0, 1].map(i => (
                  <TouchableOpacity key={i} onPress={() => goToSlide(i)} style={styles.dotHit}>
                    <View style={[styles.dot, carouselSlide === i && styles.dotActive]} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <Text style={[styles.secLbl, isDark && { color: '#e2e8f0' }]}>QUICK ACCESS</Text>
          <View style={styles.iconGrid}>
            <GridItem isDark={isDark} icon={<Mic size={26} color="#fff" />} label="Sermons" color="#1a2d5a" onPress={() => navigation.navigate('Sermons')} />
            <GridItem isDark={isDark} icon={<Heart size={26} color="#fff" />} label="Prayer Wall" color="#c0392b" onPress={() => handleGuestProtectedNavigation('Prayer')} />
            <GridItem isDark={isDark} icon={<Calendar size={26} color="#fff" />} label="Events" color="#0F766E" onPress={() => navigation.navigate('Events')} />
            <GridItem 
              isDark={isDark} 
              icon={<DollarSign size={26} color="#fff" />} 
              label="Give / Tithe" 
              color="#f0a500" 
              onPress={() => {
                if (!activeChurch?.features?.hasGiving) {
                  setAlertConfig({
                    visible: true,
                    title: 'Coming Soon',
                    message: 'Online donations via the app are coming soon. Please contact the church administration for offline donation options.',
                    type: 'info'
                  });
                } else {
                  handleGuestProtectedNavigation('Give');
                }
              }} 
            />
            
            <GridItem isDark={isDark} icon={<BookOpen size={26} color="#fff" />} label="Bible" color="#7C3AED" onPress={() => handleGuestProtectedNavigation('Bible')} />
            <GridItem isDark={isDark} icon={<Music size={26} color="#fff" />} label="Songs" color="#0369a1" onPress={() => handleGuestProtectedNavigation('Songs')} />
            <GridItem isDark={isDark} icon={<FileText size={26} color="#fff" />} label="Sermon Notes" color="#BE185D" onPress={() => handleGuestProtectedNavigation('MemberNotes')} />
            <GridItem isDark={isDark} icon={<Award size={26} color="#fff" />} label="Bible Plans" color="#374151" onPress={() => handleGuestProtectedNavigation('BiblePlans')} />


            <GridItem isDark={isDark} icon={<Bell size={26} color="#fff" />} label="Updates" color="#0284c7" onPress={() => navigation.navigate('Updates')} />
            <GridItem 
              isDark={isDark}
              icon={<YoutubeIcon size={26} color="#fff" />} 
              label="YouTube Live" 
              color="#ef4444" 
              onPress={() => {
                const yUrl = activeChurch?.socialLinks?.youtube?.trim();
                if (yUrl) {
                  Linking.openURL(yUrl);
                } else {
                  setAlertConfig({
                    visible: true,
                    title: 'Link Not Configured',
                    message: 'No YouTube Live link has been configured for this church. Please go to Church Settings and set the YouTube Live link.',
                    type: 'info'
                  });
                }
              }} 
            />
            <GridItem isDark={isDark} icon={<Users size={26} color="#fff" />} label="Members" color="#db2777" onPress={handleOpenMembers} />
            <GridItem isDark={isDark} icon={<Video size={26} color="#fff" />} label="Online Meetings" color="#3B82F6" onPress={() => navigation.navigate('OnlineMeetings')} />
          </View>

          {/* ── Arched Navigation Section ── */}
          <View style={{ marginTop: 0, marginBottom: 30, width: '100%', height: 160, alignItems: 'center' }}>
            <View style={{ position: 'absolute', top: 30, left: 0, right: 0, height: 100 }}>
              <Svg width={width} height={100}>
                <Path
                  d={`M -20 75 Q ${width/2} -25 ${width + 20} 75`}
                  stroke={isDark ? '#3b82f6' : '#60a5fa'}
                  strokeWidth={2}
                  strokeDasharray="8, 6"
                  fill="none"
                />
              </Svg>
            </View>

            <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', paddingHorizontal: 35, alignItems: 'flex-start', paddingTop: 10 }}>
              {/* About Us */}
              <TouchableOpacity 
                style={{ alignItems: 'center', marginTop: 65, width: 80 }}
                onPress={() => navigation.navigate('AboutUs')}
                activeOpacity={0.8}
              >
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderWidth: 4, borderColor: isDark ? '#334155' : '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                  <Users size={26} color="#ef4444" />
                </View>
                <Text style={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 'bold', fontSize: 13, textAlign: 'center' }}>About us</Text>
                <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 2, textAlign: 'center' }}>Our mission</Text>
              </TouchableOpacity>

              {/* Contact Us */}
              <TouchableOpacity 
                style={{ alignItems: 'center', marginTop: 15, width: 80 }}
                onPress={() => navigation.navigate('ContactUs')}
                activeOpacity={0.8}
              >
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderWidth: 4, borderColor: isDark ? '#334155' : '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                  <MessageSquare size={26} color="#a855f7" />
                </View>
                <Text style={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 'bold', fontSize: 13, textAlign: 'center' }}>Contact us</Text>
                <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 2, textAlign: 'center' }}>Get in touch</Text>
              </TouchableOpacity>

              {/* More */}
              <TouchableOpacity 
                style={{ alignItems: 'center', marginTop: 65, width: 80 }}
                onPress={() => setAlertConfig({ visible: true, title: 'More Features', message: 'Option Available Soon\n\nWe are currently working on integrating this feature.', type: 'info' })}
                activeOpacity={0.8}
              >
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderWidth: 4, borderColor: isDark ? '#334155' : '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                  <MoreHorizontal size={26} color="#10b981" />
                </View>
                <Text style={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 'bold', fontSize: 13, textAlign: 'center' }}>More</Text>
                <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 2, textAlign: 'center' }}>Explore features</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ─── Upcoming Events ─── */}
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Calendar size={16} color={isDark ? '#FCD34D' : '#1a2d5a'} />
              <Text style={[styles.sectionHeaderTxt, { color: isDark ? '#f1f5f9' : '#1a2d5a' }]}>Upcoming Events</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Events')}>
              <Text style={[styles.sectionSeeAll, { color: isDark ? '#FCD34D' : '#1a2d5a' }]}>See all →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.eventBanner}>
            <View style={styles.ebList}>
              {events.length > 0 ? (
                events.map((item: any, index: number) => (
                  <View key={`${item.id || 'evt'}-${index}`}>
                    <TouchableOpacity 
                      style={styles.ebItem} 
                      onPress={() => navigation.navigate('EventDetails', { event: item })}
                    >
                      <View style={styles.ebThumbnailContainer}>
                        <Image 
                          source={{ uri: item.image || item.bannerUrl || 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=400' }}
                          style={styles.ebThumbnail}
                          resizeMode="cover"
                        />
                      </View>
                      <View style={styles.ebInfo}>
                        <Text style={styles.ebTitle} numberOfLines={2}>
                          {item.title}
                        </Text>
                        
                        <View style={styles.highlightRow}>
                          <View style={styles.dateBadge}>
                            <Calendar size={11} color="#1a2d5a" />
                            <Text style={styles.badgeTextMain}>
                              {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </Text>
                          </View>
                        </View>
  
                        <View style={[styles.highlightRow, { marginTop: 4 }]}>
                          <View style={styles.timeBadge}>
                            <Play size={8} color="#c0392b" fill="#c0392b" style={{ transform: [{ rotate: '90deg' }] }} />
                            <Text style={styles.timeBadgeText}>{formatTime(item.startTime)} – {formatTime(item.endTime)}</Text>
                          </View>
                        </View>
  
                        <View style={[styles.ebMetaRow, { marginTop: 6, alignItems: 'flex-start' }]}>
                          <MapPin size={11} color="#64748b" style={{ marginTop: 2 }} />
                          <Text style={styles.ebMetaText}>{item.address || item.location || 'Church Main Hall'}</Text>
                        </View>
                        
                        <Text style={styles.ebDetailsLink}>Details →</Text>
                      </View>
                    </TouchableOpacity>
                    {index < events.length - 1 && <View style={styles.ebDivider} />}
                  </View>
                ))
              ) : (
                <View style={styles.emptyEvents}>
                  <Calendar size={32} color="#94a3b8" />
                  <Text style={styles.emptyEventsTxt}>No upcoming events scheduled</Text>
                  <Text style={styles.emptyEventsSub}>Check back soon for updates!</Text>
                </View>
              )}
            </View>
          </View>

          {/* ─── Latest Sermon ─── */}
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Mic size={16} color={isDark ? '#FCD34D' : '#1a2d5a'} />
              <Text style={[styles.sectionHeaderTxt, { color: isDark ? '#f1f5f9' : '#1a2d5a' }]}>Latest Sermon</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Sermons')}>
              <Text style={[styles.sectionSeeAll, { color: isDark ? '#FCD34D' : '#1a2d5a' }]}>See all →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sermonCard}>
            <TouchableOpacity style={styles.scBody} onPress={() => navigation.navigate('SermonVideo', { sermonData: latestSermon })}>
              <View style={styles.scThumb}>
                <View style={styles.playIconOverlay}>
                   <Play size={20} color="#fff" fill="#c0392b" />
                </View>
              </View>
              <View style={styles.scInfo}>
                <Text style={styles.scTitle} numberOfLines={1}>
                  {latestSermon?.title}
                </Text>
                <Text style={styles.scMeta} numberOfLines={1}>{latestSermon?.pastor || 'Pastor'} • {latestSermon?.date ? formatDateDisplay(latestSermon.date) : 'Apr 13'} • {latestSermon?.duration || '42 min'}</Text>
              </View>
              <View style={styles.playBtnCircle}>
                <Play size={18} color="#1a2d5a" />
              </View>
            </TouchableOpacity>
          </View>

          {/* ─── Prayer Wall ─── */}
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Heart size={16} color={isDark ? '#FCD34D' : '#1a2d5a'} fill={isDark ? 'rgba(252,211,77,0.2)' : 'rgba(26,45,90,0.15)'} />
              <Text style={[styles.sectionHeaderTxt, { color: isDark ? '#f1f5f9' : '#1a2d5a' }]}>Prayer Wall</Text>
            </View>
            <TouchableOpacity onPress={() => handleGuestProtectedNavigation('Prayer')}>
              <Text style={[styles.sectionSeeAll, { color: isDark ? '#FCD34D' : '#1a2d5a' }]}>See all →</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.prayerCard, { marginBottom: 40 }]}>
            <TouchableOpacity style={styles.pcBody} onPress={() => handleGuestProtectedNavigation('Prayer')}>
              <View style={styles.pcTextContainer}>
                <Text style={styles.pcText} numberOfLines={3}>
                  {latestPrayer ? `"${latestPrayer.text}" — ${latestPrayer.name}` : '"Please pray for our community and the growth of our church." — Faith Member'}
                </Text>
              </View>
              <View style={styles.pcFoot}>
                <TouchableOpacity style={styles.prayedBtn} onPress={() => Alert.alert('Prayed', 'Thank you for praying!')}>
                   <CheckCircle size={14} color="#1a2d5a" />
                   <Text style={styles.prayedBtnTxt}>I prayed</Text>
                </TouchableOpacity>
                <Text style={styles.pcSeeAll}>{prayerCount} requests</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.ScrollView>

      {liveCelebrations.length > 0 && (
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.floatingBtnContainer,
            { transform: [{ translateX: pan.x }, { translateY: pan.y }] }
          ]}
        >
          <Animated.View style={{ transform: [{ scale: waveAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }] }}>
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => navigation.navigate('LiveCelebrationsChat', { celebrations: liveCelebrations })}
              style={styles.floatingBtn}
            >
              <Animated.Text style={[styles.floatingEmoji, { opacity: emojiAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
                {getEmoji()}
              </Animated.Text>
              <View style={styles.floatingIndicator} />
              {unreadLiveMsgs > 0 && (
                <View style={{ position: 'absolute', top: -5, right: -5, backgroundColor: '#ef4444', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 2 }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>{unreadLiveMsgs}</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.floatingLabel}>Live Celebrations</Text>
        </Animated.View>
      )}

    </View>
  );
}

function GridItem({ icon, label, color, onPress, isDark }: { icon: any; label: string; color: string; onPress: () => void; isDark: boolean }) {
  return (
    <TouchableOpacity style={styles.iconItem} onPress={onPress}>
      <View style={[styles.iconBox, { backgroundColor: color }]}>
        {icon}
      </View>
      <Text style={[styles.iconLbl, { color: isDark ? '#e2e8f0' : '#475569' }]} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({

  floatingBtnContainer: {
    position: 'absolute',
    top: '45%', // middle of the right side
    right: 20,
    alignItems: 'center',
    zIndex: 999,
    elevation: 1000,
  },
  floatingBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.5)', // Gold border
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  floatingEmoji: {
    fontSize: 32,
  },
  floatingIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  floatingLabel: {
    color: '#d4af37',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    backgroundColor: '#1a2d5a',
    paddingHorizontal: 4,
    borderRadius: 4,
    overflow: 'hidden'
  },
  mainContainer: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a2d5a' },
  screenLoadingText: { color: '#FCD34D', marginTop: 15, fontSize: 14, fontWeight: '700' },
  
  scroll: { flex: 1 },
  contentPad: { paddingBottom: 140 },
  
  appHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  particleLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#FCD34D',
    borderRadius: 5,
  },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5, justifyContent: 'space-between', zIndex: 2 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 },
  logoCircle: { width: 44, height: 44, backgroundColor: 'transparent', borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  logoImg: { width: 44, height: 44, borderRadius: 22 },
  titleCol: { marginLeft: 10, flex: 1 },
  hdTitle: { color: '#F3EAD9', fontSize: 18, fontWeight: '800', letterSpacing: 0.2 },
  hdSub: { color: '#aac4e8', fontSize: 10, marginTop: 1, fontWeight: '500' },
  
  headerRight: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, zIndex: 2 },
  actionIconButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  notifBadge: { position: 'absolute', top: 8, right: 10, width: 6, height: 6, backgroundColor: '#ef4444', borderRadius: 3 },
  avatarWrapper: { width: 40, height: 40, borderRadius: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  avatarImg: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f59e0b', justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#fff', fontWeight: '800', fontSize: 18 },
  
  goldDivider: { height: 1, marginVertical: 18, width: '100%', opacity: 0.7, zIndex: 2 },
  
  greetingSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 2 },
  greetingLeft: { flex: 1 },
  greetingText: { color: '#FCD34D', fontSize: 32, fontWeight: '400', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontStyle: 'italic', marginBottom: 2, letterSpacing: 0.5, textShadowColor: 'rgba(252, 211, 77, 0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 },
  userNameCream: { color: '#F3EAD9', fontSize: 22, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', letterSpacing: 0.5 },
  
  greetingRight: { alignItems: 'center', justifyContent: 'center', marginLeft: 15 },
  calendarBadgeWrap: { width: 66, height: 66, justifyContent: 'center', alignItems: 'center' },
  calendarTextOverlay: { position: 'absolute', alignItems: 'center', justifyContent: 'center', paddingTop: 2 },
  calMonth: { color: '#F3EAD9', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  calDay: { color: '#fff', fontSize: 26, fontWeight: '900', marginTop: -4 },
  calWeekday: { color: '#aac4e8', fontSize: 13, fontWeight: '600', marginTop: 8 },

  promiseHero: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    // Removed background color and shadow from the wrapper so the image slide can be transparent
  },
  phSlide: {
    width: width - 32,
    borderRadius: 20,
  },
  phInner: {
    borderRadius: 20,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  phThumbnailSlide: {
    width: width - 32,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  phThumbnailImg: {
    width: '100%',
    borderRadius: 20,
  },
  // Dot indicators
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'transparent',
    gap: 8,
  },
  dotHit: { padding: 4 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  dotActive: {
    width: 22,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FCD34D',
  },
  phLabel: {
    color: '#FCD34D',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 16,
    textAlign: 'center',
  },
  phEn: { color: '#fff', fontSize: 15, fontWeight: '600', fontStyle: 'italic', lineHeight: 24, marginBottom: 4 },
  phRefEn: { color: '#FCD34D', fontSize: 12, fontWeight: '700', marginBottom: 15, textAlign: 'right' },
  phDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 15 },
  phTe: { color: '#fff', fontSize: 16, fontStyle: 'italic', lineHeight: 26, marginBottom: 4 },
  phRefTe: { color: '#FCD34D', fontSize: 13, fontWeight: '700', marginBottom: 20, textAlign: 'right' },
  phActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  phShareBtn: { flex: 1, backgroundColor: 'transparent', borderRadius: 25, paddingVertical: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#cbd5e1' },
  phWatchBtn: { flex: 1, backgroundColor: 'transparent', borderRadius: 25, paddingVertical: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#cbd5e1' },
  phBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },

  marqueeWrapper: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0f1e3d',
    borderWidth: 1,
    borderColor: 'rgba(252,211,77,0.2)',
  },
  marqueeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: '#1a2d5a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(252,211,77,0.25)',
    gap: 8,
  },
  marqueeTitleEmoji: { fontSize: 16 },
  marqueeTitleText: {
    color: '#FCD34D',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    flex: 1,
  },
  marqueeTicker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    overflow: 'hidden',
  },
  marqueeTickerBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 10,
    borderRadius: 5,
  },
  marqueeTickerBadgeTxt: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  marqueeContent: { flex: 1, overflow: 'hidden' },
  marqueeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 4,
  },
  marqueeEventDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FCD34D',
    marginRight: 8,
  },
  marqueeItemTitle: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
  },
  marqueeItemTitleTe: {
    color: '#FCD34D',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 2,
  },
  marqueeTimePill: {
    backgroundColor: 'rgba(252,211,77,0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: 'rgba(252,211,77,0.4)',
  },
  marqueeItemTime: { color: '#FCD34D', fontSize: 12, fontWeight: '800' },
  marqueeItemLoc: {
    color: '#94a3b8',
    fontSize: 11.5,
    fontWeight: '500',
    marginLeft: 8,
  },
  marqueeSeparator: { color: 'rgba(252,211,77,0.35)', fontSize: 12, marginHorizontal: 4 },
  marqueeLangDivider: { color: 'rgba(255,255,255,0.25)', fontSize: 14, fontWeight: '300', marginHorizontal: 6 },
  marqueeEventDotTe: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FCD34D',
    marginRight: 8,
  },
  marqueeTimePillTe: {
    backgroundColor: 'rgba(252,211,77,0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: 'rgba(252,211,77,0.4)',
  },
  marqueeItemTimeTe: { color: '#FCD34D', fontSize: 12, fontWeight: '800' },
  marqueeItemLocTe: { color: '#94a3b8', fontSize: 11.5, fontWeight: '500', marginLeft: 8 },

  // Section header (external to card)
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginTop: 12, marginBottom: 8 },
  sectionHeaderTxt: { fontSize: 16, fontWeight: '800', color: '#1a2d5a' },
  sectionSeeAll: { fontSize: 12, fontWeight: '700', color: '#1a2d5a' },

  // Event Banner (clean card, no header band)
  eventBanner: { marginHorizontal: 16, marginBottom: 4, backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, borderWidth: 1, borderColor: '#f1f5f9' },
  ebHd: { backgroundColor: '#1a2d5a', paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ebHdLbl: { fontSize: 12, color: '#fff', fontWeight: '700' },
  ebSeeAll: { fontSize: 11, color: '#aac4e8', fontWeight: '600' },
  ebList: { padding: 0 },
  ebItem: { flexDirection: 'row', padding: 15, alignItems: 'center' },
  ebDivider: { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 15 },
  ebThumbnailContainer: { width: 100, height: 56, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  ebThumbnail: { width: 100, height: 56, borderRadius: 8 },
  ebInfo: { flex: 1 },
  ebTitle: { fontSize: 13.5, fontWeight: '800', color: '#1a2d5a', marginBottom: 5 },
  ebDetailsLink: { fontSize: 10, fontWeight: '800', color: '#1a2d5a', marginTop: 8 },
  highlightRow: { flexDirection: 'row', alignItems: 'center' },
  dateBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fffbeb', 
    paddingHorizontal: 7, 
    paddingVertical: 3, 
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#fef3c7',
    gap: 4
  },
  timeBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f8fafc', 
    paddingHorizontal: 7, 
    paddingVertical: 3, 
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 4
  },
  badgeTextMain: { fontSize: 9.5, fontWeight: '700', color: '#1a2d5a' },
  badgeTextSub: { fontSize: 9.5, color: '#475569', fontWeight: '500' },
  timeBadgeText: { fontSize: 9, fontWeight: '700', color: '#c0392b' },
  ebMetaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 4 },
  
  emptyEvents: { padding: 30, alignItems: 'center', justifyContent: 'center' },
  emptyEventsTxt: { color: '#1a2d5a', fontSize: 13, fontWeight: '700', marginTop: 12 },
  emptyEventsSub: { color: '#94a3b8', fontSize: 11, marginTop: 4 },

  secLbl: { fontSize: 13, fontWeight: '800', color: '#1a2d5a', letterSpacing: 0.5, marginHorizontal: 24, marginBottom: 18, marginTop: 15 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, justifyContent: 'space-between' },
  iconItem: { width: (width - 60) / 4, alignItems: 'center', marginBottom: 20 },
  iconBox: { width: 62, height: 62, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  iconLbl: { fontSize: 11, color: '#475569', fontWeight: '600', textAlign: 'center' },

  // Sermon Card (clean card, no header band)
  sermonCard: { marginHorizontal: 16, marginBottom: 4, backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, borderWidth: 1, borderColor: '#f1f5f9' },
  scHd: { backgroundColor: '#1a2d5a', paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scHdLblRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  scHdLbl: { fontSize: 12, color: '#fff', fontWeight: '700' },
  scSee: { fontSize: 11, color: '#aac4e8', fontWeight: '600' },
  scBody: { padding: 16, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 15 },
  scThumb: { width: 80, height: 50, backgroundColor: '#0f172a', borderRadius: 10, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  playIconOverlay: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  scInfo: { flex: 1 },
  scTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  scTitleTe: { fontSize: 12, color: '#334155', marginBottom: 4 },
  scMeta: { fontSize: 10.5, color: '#64748b' },
  playBtnCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },

  // Prayer Card (clean card, no header band)
  prayerCard: { marginHorizontal: 16, marginBottom: 4, backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, borderWidth: 1, borderColor: '#f1f5f9' },
  pcHd: { backgroundColor: '#1a2d5a', paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pcHdLblRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  pcHdLbl: { fontSize: 12, color: '#fff', fontWeight: '700' },
  pcCount: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  pcBody: { padding: 16 },
  pcTextContainer: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 15 },
  pcText: { fontSize: 13, color: '#334155', lineHeight: 22, fontStyle: 'italic' },
  pcFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prayedBtn: { backgroundColor: '#eff6ff', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#bfdbfe' },
  prayedBtnTxt: { color: '#1a2d5a', fontSize: 12, fontWeight: '700' },
  pcSeeAll: { fontSize: 11.5, color: '#94a3b8', fontWeight: '600' },

  // Modal Styles for Household Members
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 1,
  },
  closeBtn: {
    padding: 8,
  },
  modalLoading: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLoadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  ebMetaText: {
    fontSize: 10, 
    color: '#64748b', 
    fontWeight: '500', 
    lineHeight: 14
  },
  modalScroll: {
    padding: 20,
  },
  noFamily: {
    padding: 40,
    alignItems: 'center',
  },
  noFamilyText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  contactCard: {
    paddingVertical: 16,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a2d5a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  roleBadgeText: {
    color: '#1e40af',
    fontSize: 10,
    fontWeight: '700',
  },
  contactDetails: {
    marginTop: 12,
    paddingLeft: 56,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardDark: {
    backgroundColor: '#1F2937',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
});
