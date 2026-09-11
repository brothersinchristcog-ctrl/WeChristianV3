import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Home, Heart, BookOpen, HandCoins, User, ShieldCheck, Users as UsersSwitch } from 'lucide-react-native';
import { ActivityIndicator, View, Text, StyleSheet, Alert, Platform, TouchableOpacity, AppState, Image, Animated, PanResponder, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lock, AlertCircle, Crown, ShieldAlert, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { AuthProvider, useAuth } from '../context/AuthContext';
import { ChurchProvider, useChurch } from '../context/ChurchContext';
import { ThemeProvider } from '../context/ThemeContext';
import Theme from '../theme/Theme';
import AdminNavigator from './AdminNavigator'; 
import NotificationService from '../services/NotificationService';
import SecurityService from '../services/SecurityService';
import ChurchService from '../services/ChurchService';
import * as Notifications from 'expo-notifications';
import VerseOfTheDayScreen from '../screens/VerseOfTheDayScreen';
import VerseNotificationService from '../services/VerseNotificationService';

// Auth & Onboarding
import AuthNavigator from './AuthNavigator';
import SplashScreen from '../screens/auth/SplashScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';

// Member Screens
import CelebrationScreen from '../screens/CelebrationScreen';
import LiveCelebrationsChat from '../screens/LiveCelebrationsChat';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PromiseArchiveScreen from '../screens/PromiseArchiveScreen';
import DailyVideoScreen from '../screens/DailyVideoScreen';
import SermonVideoScreen from '../screens/SermonVideoScreen';
import EventsScreen from '../screens/EventsScreen';
import PrayerWallScreen from '../screens/PrayerWallScreen';
import GivingScreen from '../screens/GivingScreen';
import GivingHistoryScreen from '../screens/GivingHistoryScreen';
import SermonsScreen from '../screens/SermonsScreen';
import SongsScreen from '../screens/SongsScreen';
import EventDetailsScreen from '../screens/EventDetailsScreen';
import UpdatesScreen from '../screens/UpdatesScreen';
import BibleScreen from '../screens/BibleScreen';
import BibleChaptersScreen from '../screens/BibleChaptersScreen';
import BibleReaderScreen from '../screens/BibleReaderScreen';
import BiblePlansScreen from '../screens/BiblePlansScreen';
import MemberNotesScreen from '../screens/MemberNotesScreen';
import MembersScreen from '../screens/MembersScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import BibleSearchScreen from '../screens/BibleSearchScreen';
import AboutUsScreen from '../screens/AboutUsScreen';
import ContactUsScreen from '../screens/ContactUsScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import PastorEventDetail from '../screens/admin/pastor_events/PastorEventDetail';
import CreatePastorEvent from '../screens/admin/pastor_events/CreatePastorEvent';
import PastorEventRoutePlanner from '../screens/admin/pastor_events/PastorEventRoutePlanner';
import PastorEventMap from '../screens/admin/pastor_events/PastorEventMap';
import OnlineMeetingsScreen from '../screens/OnlineMeetingsScreen';
import OnlineMeetingDetailScreen from '../screens/OnlineMeetingDetailScreen';
import MemberGalleryNavigator from '../screens/gallery/MemberGalleryNavigator';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

import { Mic, Book, User as UserIcon } from 'lucide-react-native';

const CustomTabBarButton = ({ children, onPress }: any) => (
  <TouchableOpacity
    style={{
      top: -15,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 5,
    }}
    onPress={onPress}
  >
    <View style={{
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#c0392b',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      {children}
    </View>
  </TouchableOpacity>
);

  const TABS = [
    { key: 'Home',    label: 'Home',    Icon: Home,     bg: '#1a2d5a', fg: '#1a2d5a' },
    { key: 'Promise', label: 'Promise', Icon: BookOpen, bg: '#0F766E', fg: '#0F766E' },
    { key: 'Sermons', label: 'Sermons', Icon: Mic,      bg: '#D8632E', fg: '#D8632E' },
    { key: 'Prayer',  label: 'Prayer',  Icon: Heart,    bg: '#0284C7', fg: '#0284C7' },
    { key: 'Profile', label: 'Profile', Icon: UserIcon, bg: '#27272A', fg: '#27272A' },
  ] as const;

  const getTabConfig = (routeName: string, useDailyVerse: boolean = false) => {
    if (routeName === 'Promise') {
      return {
        key: 'Promise',
        label: useDailyVerse ? 'Daily Verse' : 'Promise',
        Icon: BookOpen,
        bg: '#0F766E',
        fg: '#0F766E',
      };
    }
    return TABS.find(t => t.key === routeName) || TABS[0];
  };

  function CustomTabBar({ state, descriptors, navigation }: any) {
    const { activeChurch } = useChurch();
    const useWeChristianDailyPromise = activeChurch?.useWeChristianDailyPromise !== false;
    const currentRoute = state.routes[state.index];
    const activeConfig = getTabConfig(currentRoute.name, useWeChristianDailyPromise);

    const [publicPrayerCount, setPublicPrayerCount] = useState(0);
    const [lastSeenPrayerCount, setLastSeenPrayerCount] = useState(0);
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    useEffect(() => {
      AsyncStorage.getItem('@LastSeenPrayerCount').then((val) => {
        if (val) {
          setLastSeenPrayerCount(parseInt(val, 10));
        }
      });
    }, []);

    useEffect(() => {
      if (!activeChurch?.id) return;
      const unsubscribe = firestore()
        .collection('churches')
        .doc(activeChurch.id)
        .collection('prayerRequests')
        .where('isPublic', '==', true)
        .where('isAnswered', '==', true)
        .onSnapshot((snapshot) => {
          if (snapshot) {
            setPublicPrayerCount(snapshot.docs.length);
          }
        }, (error) => {
          console.error("Prayer listener error", error);
        });
      return () => unsubscribe();
    }, [activeChurch?.id]);

    const unseenPrayers = Math.max(0, publicPrayerCount - lastSeenPrayerCount);
    const showPrayerBadge = unseenPrayers > 0;

    useEffect(() => {
      if (showPrayerBadge) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.5, duration: 1000, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
          ])
        ).start();
      } else {
        pulseAnim.stopAnimation();
        pulseAnim.setValue(1);
      }
    }, [showPrayerBadge]);

    return (
      <View style={[styles.tabBarContainer, { backgroundColor: activeConfig.bg }]}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const config = getTabConfig(route.name, useWeChristianDailyPromise);
          const IconComponent = config.Icon;

          const onPress = () => {
            if (config.key === 'Prayer' && showPrayerBadge) {
              setLastSeenPrayerCount(publicPrayerCount);
              AsyncStorage.setItem('@LastSeenPrayerCount', publicPrayerCount.toString());
            }

            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!event.defaultPrevented) {
              if (config.key === 'Prayer' && showPrayerBadge) {
                navigation.navigate(route.name, { tab: 'public_requests' });
              } else if (!isFocused) {
                navigation.navigate(route.name);
              }
            }
          };

          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.9}
            >
              {isFocused ? (
                <View style={styles.activeCircle}>
                  <View>
                    <IconComponent color={config.fg} size={20} strokeWidth={2.5} />
                    {config.key === 'Prayer' && showPrayerBadge && (
                      <View style={styles.badgeActive}>
                        <Text style={styles.badgeText}>{unseenPrayers}</Text>
                      </View>
                    )}
                  </View>
                  <Text 
                    style={[styles.activeLabel, { color: config.fg }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {config.label}
                  </Text>
                </View>
              ) : (
                <View style={styles.inactiveWrapper}>
                  <View>
                    {config.key === 'Prayer' && showPrayerBadge && (
                      <Animated.View style={[
                        styles.pulseRing, 
                        { transform: [{ scale: pulseAnim }], opacity: pulseAnim.interpolate({ inputRange: [1, 1.5], outputRange: [0.8, 0] }) }
                      ]} />
                    )}
                    <IconComponent color="rgba(255, 255, 255, 0.7)" size={22} strokeWidth={2} />
                    {config.key === 'Prayer' && showPrayerBadge && (
                      <View style={styles.badgeInactive}>
                        <Text style={styles.badgeText}>{unseenPrayers}</Text>
                      </View>
                    )}
                  </View>
                  <Text 
                    style={styles.inactiveLabel}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {config.label}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

const LockedFeatureScreen = ({ navigation }: any) => {
  const { member } = useAuth();
  const isAdmin = String(member?.userType || '').toUpperCase().includes('ADMIN') || String(member?.userType || '').toUpperCase().includes('SUPER');
  const [pulseAnim] = React.useState(new Animated.Value(1));

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
      ])
    ).start();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <LinearGradient colors={['#1e1b4b', '#0f172a']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        {/* Background glow effect */}
        <Animated.View style={{
          position: 'absolute',
          width: 300,
          height: 300,
          borderRadius: 150,
          backgroundColor: 'rgba(225, 29, 72, 0.1)',
          transform: [{ scale: pulseAnim }],
          top: '30%'
        }} />

        <View style={{
          backgroundColor: 'rgba(30, 41, 59, 0.85)',
          borderRadius: 32,
          padding: 32,
          paddingTop: 48,
          alignItems: 'center',
          width: '100%',
          maxWidth: 380,
          borderWidth: 1,
          borderColor: 'rgba(225, 29, 72, 0.4)',
          shadowColor: '#e11d48',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 10,
        }}>
          {/* Floating Icon */}
          <View style={{
            position: 'absolute',
            top: -40,
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#0f172a',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: '#e11d48',
            shadowColor: '#e11d48',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 15,
            elevation: 8,
          }}>
            <Lock size={36} color="#fb7185" />
          </View>

          <Text style={{
            color: '#f8fafc',
            fontSize: 28,
            fontWeight: '800',
            marginBottom: 12,
            textAlign: 'center',
            letterSpacing: -0.5
          }}>
            Subscription Expired
          </Text>

          <Text style={{
            color: '#94a3b8',
            fontSize: 16,
            textAlign: 'center',
            marginBottom: 40,
            lineHeight: 24,
            fontWeight: '500',
            paddingHorizontal: 4
          }}>
            {isAdmin 
              ? 'Your church\'s premium access has ended. Renew today to unlock Sermons, Daily Verses, Live Celebrations, and more!'
              : 'Your church\'s premium access has ended. Please reach out to your pastor or admin to restore these features.'}
          </Text>

          {isAdmin ? (
            <TouchableOpacity 
              activeOpacity={0.8}
              style={{ width: '100%', marginBottom: 16 }}
              onPress={() => navigation.navigate('Subscription')}
            >
              <LinearGradient 
                colors={['#10b981', '#059669']} 
                start={{x:0, y:0}} end={{x:1, y:1}}
                style={{
                  paddingVertical: 18,
                  borderRadius: 20,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center'
                }}
              >
                <Crown size={22} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 }}>Renew Subscription</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(148, 163, 184, 0.1)',
              padding: 16,
              borderRadius: 16,
              marginBottom: 32,
              width: '100%'
            }}>
              <AlertCircle size={20} color="#94a3b8" style={{ marginRight: 12 }} />
              <Text style={{ color: '#94a3b8', fontSize: 13, flex: 1, lineHeight: 18 }}>
                Only the church administrator can renew the subscription.
              </Text>
            </View>
          )}

          <TouchableOpacity 
            activeOpacity={0.6}
            style={{ paddingVertical: 12, paddingHorizontal: 24 }}
            onPress={() => {
              try {
                const state = navigation.getState();
                if (state && state.routes && state.routes.length > 1) {
                  navigation.goBack();
                } else {
                  navigation.navigate(isAdmin ? 'AdminRoot' : 'Tabs');
                }
              } catch (e) {
                navigation.navigate(isAdmin ? 'AdminRoot' : 'Tabs');
              }
            }}
          >
            <Text style={{ color: '#64748b', fontSize: 16, fontWeight: '700' }}>{isAdmin ? 'Maybe Later' : 'Go Back to Home'}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

function TabNavigator() {
  const { user, signOut, member, viewMode, setViewMode } = useAuth();
  const { activeChurch } = useChurch();
  const useWeChristianDailyPromise = activeChurch?.useWeChristianDailyPromise !== false;
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [globalUser, setGlobalUser] = useState<any>(null);

  useEffect(() => {
    if (user?.uid && !user.isAnonymous) {
      const unsubscribe = firestore()
        .collection('users')
        .doc(user.uid)
        .onSnapshot(
          (doc) => {
            if (doc.data()) {
              setGlobalUser(doc.data());
            }
          },
          (error) => {
            console.error('Error listening to globalUser:', error);
          }
        );
      return () => unsubscribe();
    }
  }, [user]);

  const isGuest = user?.isAnonymous;
  const isActualAdmin = String(member?.userType || '').toUpperCase().includes('ADMIN') || String(member?.userType || '').toUpperCase().includes('SUPER');

  const handleFeatureInteraction = (e: any) => {
    if (isGuest) {
      e.preventDefault();
      Alert.alert(
        'Sign In Required',
        'Please sign in to access the community features.',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Sign In', onPress: () => signOut() }
        ]
      );
      return;
    }

    if (ChurchService.isSubscriptionExpired(activeChurch)) {
      e.preventDefault();
      navigation.navigate('LockedFeature');
      return;
    }
  };

  return (
    <>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
      />
      <Tab.Screen 
        name="Promise" 
        component={useWeChristianDailyPromise ? VerseOfTheDayScreen : PromiseArchiveScreen} 
        listeners={{ tabPress: handleFeatureInteraction }}
      /> 
      <Tab.Screen 
        name="Sermons" 
        component={SermonsScreen} 
        listeners={{ tabPress: handleFeatureInteraction }}
      />
      <Tab.Screen 
        name="Prayer" 
        component={PrayerWallScreen} 
        listeners={{ tabPress: handleFeatureInteraction }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
      />
    </Tab.Navigator>

    {isActualAdmin && viewMode === 'member' && (
      <DraggableAdminPill onPress={() => setViewMode('admin')} />
    )}
    </>
  );
}

function Navigation() {
  const { user, member, loading, viewMode, setViewMode, signOut } = useAuth();
  const { activeChurch } = useChurch();
  const navigation = useNavigation();
  const [onboardingComplete, setOnboardingComplete] = React.useState<boolean | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const appState = React.useRef(AppState.currentState);

  const isAdmin = String(member?.userType || '').toUpperCase().includes('ADMIN') || String(member?.userType || '').toUpperCase().includes('SUPER');
  // Show admin UI only when userType is admin AND viewMode is admin
  const showAdminView = isAdmin && viewMode === 'admin';
  const navigationKey = showAdminView ? 'admin-root' : 'member-root';
  
  const [pendingNotification, setPendingNotification] = useState<any>(null);

  // 1. Initial Security Check & App State Listener
  useEffect(() => {
    const handleSecurity = async () => {
      // Only lock if user is a logged-in member (not guest)
      if (user && !user.isAnonymous) {
        const isEnabled = await SecurityService.isBiometricEnabled();
        const isAvailable = await SecurityService.isBiometricAvailable();
        
        if (isEnabled && isAvailable) {
          setIsLocked(true);
          const success = await SecurityService.authenticate(activeChurch?.name);
          if (success) setIsLocked(false);
        } else {
          setIsLocked(false);
        }
      }
    };

    handleSecurity();

    // Listen for background -> foreground to re-lock
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) && 
        nextAppState === 'active' && 
        user && !user.isAnonymous
      ) {
        const checkBiometrics = async () => {
          const isEnabled = await SecurityService.isBiometricEnabled();
          const isAvailable = await SecurityService.isBiometricAvailable();
          
          if (isEnabled && isAvailable) {
            setIsLocked(true);
            const success = await SecurityService.authenticate(activeChurch?.name);
            if (success) setIsLocked(false);
          }
        };
        checkBiometrics();
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [user]);

  // Handle Notifications
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.type === 'daily_verse' && data.verseId) {
        const { navigationRef } = require('../../App');
        if (navigationRef && navigationRef.isReady()) {
          navigationRef.navigate('VerseOfTheDay', { 
            verseId: data.verseId, 
            period: data.period 
          });
        }
      }
    });

    // 1. When app is in background and user clicks notification
    const unsubscribeOnOpen = NotificationService.messaging().onNotificationOpenedApp(remoteMessage => {
      setPendingNotification(remoteMessage);
    });

    // 2. When app is closed and user clicks notification
    NotificationService.messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        setPendingNotification(remoteMessage);
      }
    });

    // 3. When app is in foreground and notification arrives
    const unsubscribeForeground = NotificationService.setupForegroundListener(navigation);

    return () => {
      unsubscribeOnOpen();
      unsubscribeForeground();
      subscription.remove();
    };
  }, [navigation]);

  useEffect(() => {
    if (user && !loading && pendingNotification) {
      let retryCount = 0;
      const tryNavigate = () => {
        const { navigationRef } = require('../../App');
        if (navigationRef && navigationRef.isReady()) {
          const type = pendingNotification?.data?.type;
          
          if (type === 'invoice' && isAdmin && viewMode !== 'admin') {
            console.log('Switching to admin view to handle invoice notification');
            setViewMode('admin');
            return; // Exit early, the re-render will trigger this effect again
          }

          NotificationService.handleNotificationNavigation(pendingNotification, navigationRef);
          setPendingNotification(null);
        } else if (retryCount < 20) {
          retryCount++;
          setTimeout(tryNavigate, 200); // Retry every 200ms up to 20 times (4 seconds total)
        } else {
          console.warn('⚠️ Navigation took too long to become ready, dropping pending notification.');
          setPendingNotification(null);
        }
      };
      
      tryNavigate();
    }
  }, [user, loading, pendingNotification, viewMode]);

  useEffect(() => {
    if (user && !loading) {
      const initNotifications = async () => {
        const hasPermission = await NotificationService.requestUserPermission();
        if (hasPermission) {
          await NotificationService.getFcmToken();
        }
        
        // Initialize Daily Verses Background Sync & Local Notifications
        VerseNotificationService.initialize();

        // Proactive self-healing: Ensure user profile document has 'name' and 'phone' in Firestore
        if (!user.isAnonymous) {
          try {
            const firestore = require('@react-native-firebase/firestore').default;
            const doc = await firestore().collection('users').doc(user.uid).get();
            const data = doc.data();
            if (!data?.name || !data?.phone) {
              console.log('🩹 [Self-Healing] Missing user profile details in Firestore. Fetching from Salesforce...');
              const phoneClean = user.phoneNumber || '';
              if (phoneClean) {
                const FirestoreService = require('../services/FirestoreService').default;
                const result = await FirestoreService.checkContactExists(phoneClean);
                if (result && result.exists) {
                  await firestore().collection('users').doc(user.uid).set({
                    name: result.member?.name || '',
                    phone: phoneClean,
                    role: 'Member',
                    onboardingComplete: true
                  }, { merge: true });
                  console.log('🩹 [Self-Healing] Firestore user profile successfully repaired!');
                }
              }
            }
          } catch (err) {
            console.warn('⚠️ [Self-Healing] Profile recovery skipped:', err);
          }
        }
      };
      initNotifications();
    }
  }, [user, loading]);

  // Existing auth effect
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 7500);
    
    let unsub: any;

    const checkOnboarding = async () => {
      if (!user) {
        setOnboardingComplete(null);
        return;
      }

      // ── Member / Admin: Skip Onboarding ──
      if (!user.isAnonymous) {
        setOnboardingComplete(true);
        return;
      }

      // ── Guest Mode: Show Onboarding (Reactive via Firestore) ──
      unsub = firestore()
        .collection('users')
        .doc(user.uid)
        .onSnapshot((doc) => {
          if (doc.exists()) {
            setOnboardingComplete(doc.data()?.onboardingComplete === true);
          } else {
            setOnboardingComplete(false);
          }
        }, (err) => {
          console.log('Guest Onboarding Check Error:', err);
          setOnboardingComplete(false); 
        });
    };

    checkOnboarding();
    
    return () => {
      if (unsub) unsub();
      clearTimeout(timer);
    };
  }, [user]);

  if (showSplash || loading) {
    return <SplashScreen />;
  }

  // ── Lock Screen View ──
  if (isLocked && user && !user.isAnonymous) {
    return (
      <View style={lockStyles.container}>
        <View style={lockStyles.card}>
          <View style={lockStyles.iconContainer}>
            <Lock size={40} color="#DAA520" />
          </View>
          <Text style={lockStyles.title}>App Locked</Text>
          <Text style={lockStyles.subtitle}>Please verify your identity to continue</Text>
          <TouchableOpacity 
            style={lockStyles.button}
            onPress={async () => {
              const success = await SecurityService.performSecurityCheck(activeChurch?.name);
              if (success) setIsLocked(false);
            }}
          >
            <Text style={lockStyles.buttonText}>Unlock App</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Church Expiration Logic ──
  const isChurchExpired = ChurchService.isSubscriptionExpired(activeChurch);

  const renderPremium = (Component: any) => {
    return isChurchExpired ? LockedFeatureScreen : Component;
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
      {user ? (
        showAdminView ? (
          <>
            <Stack.Screen name="AdminRoot" component={AdminNavigator} />
            <Stack.Screen name="Subscription" component={SubscriptionScreen} />
            <Stack.Screen name="LockedFeature" component={LockedFeatureScreen} />
            <Stack.Screen name="EventDetail" component={renderPremium(PastorEventDetail)} />
            <Stack.Screen name="CreateEvent" component={renderPremium(CreatePastorEvent)} />
            <Stack.Screen name="RoutePlanner" component={renderPremium(PastorEventRoutePlanner)} />
            <Stack.Screen name="EventMap" component={renderPremium(PastorEventMap)} />
            <Stack.Screen name="Updates" component={renderPremium(UpdatesScreen)} />
            <Stack.Screen name="Celebration" component={renderPremium(CelebrationScreen)} />
            {/* Added for Push Notification Support in Admin View */}
            <Stack.Screen name="Sermons" component={renderPremium(SermonsScreen)} />
            <Stack.Screen name="Events" component={renderPremium(EventsScreen)} />
            <Stack.Screen name="AttendanceScreen" component={renderPremium(AttendanceScreen)} />
            <Stack.Screen name="LiveCelebrationsChat" component={renderPremium(LiveCelebrationsChat)} />
            <Stack.Screen name="VerseOfTheDay" component={renderPremium(VerseOfTheDayScreen)} />
          </>
        ) : onboardingComplete ? (
          <>
            <Stack.Screen name="Tabs" component={TabNavigator} />
            <Stack.Screen name="LockedFeature" component={LockedFeatureScreen} />
            <Stack.Screen name="Celebration" component={renderPremium(CelebrationScreen)} />
            <Stack.Screen name="AttendanceScreen" component={renderPremium(AttendanceScreen)} />
            <Stack.Screen name="DailyVideo" component={renderPremium(DailyVideoScreen)} />
            <Stack.Screen name="SermonVideo" component={renderPremium(SermonVideoScreen)} />
            <Stack.Screen name="Events" component={renderPremium(EventsScreen)} />
            <Stack.Screen name="Give" component={renderPremium(GivingScreen)} />
            <Stack.Screen name="GivingHistory" component={renderPremium(GivingHistoryScreen)} />
            <Stack.Screen name="Sermons" component={renderPremium(SermonsScreen)} />
            <Stack.Screen name="Songs" component={renderPremium(SongsScreen)} />
            <Stack.Screen name="EventDetails" component={renderPremium(EventDetailsScreen)} />
            <Stack.Screen name="Updates" component={renderPremium(UpdatesScreen)} />
            <Stack.Screen name="PrayerWall" component={renderPremium(PrayerWallScreen)} />
            <Stack.Screen name="Bible" component={renderPremium(BibleScreen)} />
            <Stack.Screen name="BibleChapters" component={renderPremium(BibleChaptersScreen)} />
            <Stack.Screen name="BibleReader" component={renderPremium(BibleReaderScreen)} />
            <Stack.Screen name="BiblePlans" component={renderPremium(BiblePlansScreen)} />
            <Stack.Screen name="BibleSearch" component={renderPremium(BibleSearchScreen)} />
            <Stack.Screen name="MemberNotes" component={renderPremium(MemberNotesScreen)} />
            <Stack.Screen name="Members" component={renderPremium(MembersScreen)} />
            <Stack.Screen name="AboutUs" component={AboutUsScreen} />
            <Stack.Screen name="ContactUs" component={ContactUsScreen} />
            <Stack.Screen name="Subscription" component={SubscriptionScreen} />
            <Stack.Screen name="OnlineMeetings" component={renderPremium(OnlineMeetingsScreen)} />
            <Stack.Screen name="OnlineMeetingDetail" component={renderPremium(OnlineMeetingDetailScreen)} />
            <Stack.Screen name="LiveCelebrationsChat" component={renderPremium(LiveCelebrationsChat)} />
            <Stack.Screen name="Gallery" component={renderPremium(MemberGalleryNavigator)} />
            <Stack.Screen name="VerseOfTheDay" component={renderPremium(VerseOfTheDayScreen)} />
          </>
        ) : (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        )
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <AuthProvider>
      <ChurchProvider>
        <ThemeProvider>
          <Navigation />
        </ThemeProvider>
      </ChurchProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    height: 65,
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 65 : 50,
    left: 20,
    right: 20,
    borderRadius: 40,
    elevation: 15,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 65,
  },
  activeCircle: {
    backgroundColor: '#ffffff',
    width: 55,
    height: 55,
    borderRadius: 27.5, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0,
    marginTop: 2,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  inactiveWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    marginTop: 4,
    opacity: 0.7,
  },
  pulseRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  badgeInactive: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeActive: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  }
});

const lockStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a192f',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 30,
    padding: 40,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: 'rgba(218, 165, 32, 0.2)',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(218, 165, 32, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20
  },
  button: {
    backgroundColor: '#DAA520',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 15,
    width: '100%',
    alignItems: 'center'
  },
  buttonText: {
    color: '#0a192f',
    fontSize: 16,
    fontWeight: '700'
  }
});

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function DraggableAdminPill({ onPress }: { onPress: () => void }) {
  const pan = React.useRef(new Animated.ValueXY({ 
    x: SCREEN_WIDTH - 150, 
    y: SCREEN_HEIGHT - (Platform.OS === 'ios' ? 240 : 230) 
  })).current;

  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        pan.extractOffset();
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      }
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        pan.getLayout(),
        {
          position: 'absolute',
          zIndex: 999,
        }
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={{
          backgroundColor: '#1a2d5a', 
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 30,
          borderWidth: 1,
          borderColor: 'rgba(252, 211, 77, 0.5)',
          gap: 8,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
        }}
      >
        <ShieldCheck size={18} color="#FCD34D" />
        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 }}>Admin View</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
