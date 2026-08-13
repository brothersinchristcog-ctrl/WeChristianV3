import React, { useEffect, useState, useContext } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Platform,
  Animated,
  Easing,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Bell, 
  Settings,
  DollarSign,
  ChevronRight,
  LogOut,
  Smartphone,
  Moon,
  Video
} from 'lucide-react-native';
import { useChurch } from '../../context/ChurchContext';
import HexagonDate from '../../components/HexagonDate';
import { AdminTabContext } from '../../context/AdminTabContext';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const CARD_BACKGROUNDS: Record<string, any> = {
  'Promises': require('../../../assets/admin_cards/promise.png'),
  'New Promise': require('../../../assets/admin_cards/new_promise.jpg'),
  'Sermons': require('../../../assets/admin_cards/sermons.png'),
  'New Sermon': require('../../../assets/admin_cards/new_sermon.png'),
  'Songs': require('../../../assets/admin_cards/songs.png'),
  'Prayers': require('../../../assets/admin_cards/prayer.png'),
  'Members': require('../../../assets/admin_cards/members.png'),
  'Events': require('../../../assets/admin_cards/events.png'),
  'New Event': require('../../../assets/admin_cards/new_event.png'),
  'Pastor Event': require('../../../assets/admin_cards/pastor_event.png'),
  'Celebrations': require('../../../assets/admin_cards/celebrations.png'),
  'WeCelebrations': require('../../../assets/admin_cards/wecelebrations.png'),
  'Notifications': require('../../../assets/admin_cards/notification.png'),
  'WhatsApp': require('../../../assets/admin_cards/whatsapp.png'),
  'Expense': require('../../../assets/admin_cards/expense.png'),
  'Donations': require('../../../assets/admin_cards/donations.png'),
  'Subscription': require('../../../assets/admin_cards/subscription.png'),
  'Schedule': require('../../../assets/admin_cards/schedule.png'),
  'About Us': require('../../../assets/admin_cards/about_us.png'),
  'Contact Us': require('../../../assets/admin_cards/contact_us.png'),
  'Church Settings': require('../../../assets/admin_cards/church_settings.png'),
  'Attendance': require('../../../assets/admin_cards/attendance.png'),
  'Online Meetings': require('../../../assets/admin_cards/online_meetings.jpg'),
  'New Online Meeting': require('../../../assets/admin_cards/new_online_meeting.png'),
};

const CATEGORIES = [
  {
    title: 'Content Management',
    icon: BookOpen,
    color: '#0F766E', // Teal
    keywords: ['Promise', 'Sermon', 'Song']
  },
  {
    title: 'Community & Members',
    icon: Users,
    color: '#581C87', // Deep Royal Purple/Eggplant for excellent contrast
    keywords: ['Member', 'Attendance', 'Prayer']
  },
  {
    title: 'Events & Celebrations',
    icon: Calendar,
    color: '#831843', // Deep Ruby/Berry for a festive, elegant look with high contrast
    keywords: ['Event', 'Celebration']
  },
  {
    title: 'Communication',
    icon: Bell,
    color: '#78350F', // Rich Deep Bronze/Chocolate for excellent warm contrast
    keywords: ['Notification', 'WhatsApp']
  },
  {
    title: 'Finance & Subscriptions',
    icon: DollarSign,
    color: '#206A5D', // Deep green
    keywords: ['Expense', 'Donation', 'Subscription']
  },
  {
    title: 'Online Meeting Management',
    icon: Video,
    color: '#4F46E5', // Indigo for a professional look
    keywords: ['Online Meeting']
  },
  {
    title: 'Administration',
    icon: Settings,
    color: '#1E3A8A', // Deep Navy for maximum contrast
    keywords: ['Church Setting', 'Super Admin', 'About', 'Contact', 'Schedule']
  }
];

const FULL_WIDTH_MODULES = ['Songs', 'Members', 'Subscription', 'WeCelebrations'];

const FONTS = {
  serif: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  sans: Platform.OS === 'ios' ? 'System' : 'sans-serif',
};

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

export default function AdminDashboard({ navigation, allTabs = [] }: any) {
  const { setActiveTab, dashboardScrollY, setDashboardScrollY } = useContext(AdminTabContext);
  const { member, user, signOut, setViewMode } = useAuth();
  const { activeChurch } = useChurch();
  
  const scrollRef = React.useRef<ScrollView>(null);

  React.useLayoutEffect(() => {
    if (dashboardScrollY && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: dashboardScrollY, animated: false });
      }, 0);
    }
  }, []);

  const handleScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    if (setDashboardScrollY) setDashboardScrollY(y);
  };

  // Extract first name for greeting if possible
  const fullName = member?.name || user?.displayName || 'Administrator';
  const firstName = fullName.split(' ')[0];

  // Helper to figure out which category a tab belongs to
  const getCategoryForTab = (tabName: string) => {
    for (const category of CATEGORIES) {
      if (category.keywords.some(kw => tabName.includes(kw))) {
        return category;
      }
    }
    return CATEGORIES.find(c => c.title === 'Administration') || CATEGORIES[CATEGORIES.length - 1]; // Default to Administration
  };

  const categorizedTabs: Record<string, any[]> = {};
  CATEGORIES.forEach(cat => categorizedTabs[cat.title] = []);

  allTabs.forEach((tab: any, index: number) => {
    if (tab.name === 'Dashboard' || tab.name === 'New Online Meeting') return;
    const category = getCategoryForTab(tab.name);
    categorizedTabs[category.title].push({ ...tab, index });
  });

  // Dynamic time-based greeting
  const hour = new Date().getHours();
  let timeGreeting = 'Good evening,';
  if (hour < 12) timeGreeting = 'Good morning,';
  else if (hour < 17) timeGreeting = 'Good afternoon,';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e2b4d" />
      <ScrollView 
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scroll}
      >
        {/* New Admin Dashboard Top Card */}
        <View style={{ zIndex: 10, backgroundColor: '#F4F0EA', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 }}>
          <View style={[styles.heroSection, { borderColor: '#000000', borderWidth: 1, paddingHorizontal: 0, paddingVertical: 0, overflow: 'hidden', backgroundColor: '#FDFBF7' }]}>
            <Image 
              source={require('../../../assets/admin_hero_church_2.png')} 
              style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%' }]} 
              resizeMode="cover" 
            />
            
            <View style={{ paddingHorizontal: 24, paddingVertical: 40, width: '65%', minHeight: 180, justifyContent: 'center' }}>
              {/* Top row: Logo, Info */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 }}>
                  <Image 
                    source={activeChurch?.theme?.logoUrl ? { uri: activeChurch.theme.logoUrl } : require('../../../assets/icon.png')} 
                    style={{ width: '100%', height: '100%' }} 
                    resizeMode="cover" 
                  />
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{ color: '#1a2d5a', fontSize: 18, fontWeight: '800' }}>
                    {activeChurch?.name || 'Your Church'}
                  </Text>
                </View>
              </View>

              {/* Title */}
              <Text style={{ color: '#b45309', fontSize: 26, fontWeight: '600', marginBottom: 8, fontFamily: FONTS.serif, fontStyle: 'italic' }}>
                Admin Dashboard
              </Text>
              
              {/* Short Separator */}
              <View style={{ height: 2, width: 45, backgroundColor: '#b45309', marginBottom: 12 }} />


            </View>
          </View>
        </View>
        
        <View style={styles.content}>
          {CATEGORIES.map((category, catIdx) => {
            const tabsInCategory = categorizedTabs[category.title];
            if (!tabsInCategory || tabsInCategory.length === 0) return null;

            return (
              <View key={catIdx} style={styles.categoryBlock}>
                
                {/* Elegant Category Header */}
                <View style={styles.categoryHeader}>
                  <View style={[styles.categoryIconBg, { backgroundColor: `${category.color}20` }]}>
                    <category.icon size={18} color={category.color} strokeWidth={2.5} />
                  </View>
                  <Text style={[styles.categoryTitle, { color: category.color }]}>{category.title}</Text>
                  <View style={[styles.categoryLine, { backgroundColor: `${category.color}40` }]} />
                </View>

                {/* Hybrid Grid of Modules */}
                <View style={styles.grid}>
                  {tabsInCategory.map((tab) => {
                    const isFullWidth = FULL_WIDTH_MODULES.includes(tab.name);
                    
                    return (
                        <TouchableOpacity 
                          key={tab.index} 
                          style={[
                            styles.moduleCard, 
                            isFullWidth && styles.moduleCardFull,
                            {
                              shadowColor: category.color,
                              borderColor: `${category.color}25`,
                              overflow: CARD_BACKGROUNDS[tab.name] ? 'hidden' : 'visible',
                              padding: CARD_BACKGROUNDS[tab.name] ? 0 : 14,
                              backgroundColor: tab.name === 'Subscription' ? '#F2EAE0' : (tab.name === 'Church Settings' ? 'rgb(202, 221, 236)' : (tab.name === 'Members' ? 'rgb(244, 224, 217)' : (tab.name === 'Promises' ? '#000000' : '#ffffff'))),
                              minHeight: isFullWidth ? 160 : 100,
                            }
                          ]}
                          onPress={() => setActiveTab(tab.index)}
                          activeOpacity={0.7}
                        >
                          {CARD_BACKGROUNDS[tab.name] && (
                            <>
                              <Image 
                                source={CARD_BACKGROUNDS[tab.name]} 
                                style={[
                                  StyleSheet.absoluteFillObject, 
                                  { width: '100%', height: '100%' },
                                  tab.name === 'Promises' && { transform: [{ translateY: -15 }] },
                                  tab.name === 'Members' && { transform: [{ scale: 1.35 }, { translateY: 15 }] }
                                ]} 
                                resizeMode={(tab.name === 'Prayers' || tab.name === 'Members' || tab.name === 'Subscription' || tab.name === 'Church Settings') ? "contain" : "cover"}
                              />
                              <LinearGradient
                                colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
                                style={StyleSheet.absoluteFillObject}
                              />
                            </>
                          )}
                          {isFullWidth ? (
                            CARD_BACKGROUNDS[tab.name] ? (
                              <Text style={{
                                position: 'absolute',
                                bottom: 16,
                                left: 16,
                                color: '#ffffff',
                                fontSize: 24,
                                fontWeight: '800',
                                fontFamily: FONTS.sans,
                                textShadowColor: 'rgba(0,0,0,0.8)',
                                textShadowOffset: { width: 0, height: 1 },
                                textShadowRadius: 4,
                              }}>{tab.name}</Text>
                            ) : (
                            <View style={[
                              { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'space-between' },
                              CARD_BACKGROUNDS[tab.name] ? { 
                                padding: tab.name === 'Members' ? 0 : 16, 
                                paddingLeft: tab.name === 'Members' ? 12 : 16,
                                paddingBottom: tab.name === 'Members' ? 8 : 16,
                                height: '100%', 
                                alignItems: 'flex-end',
                                justifyContent: 'space-between'
                              } : { paddingVertical: 14, paddingHorizontal: 16 }
                            ]}>
                              <View style={[styles.moduleLeftRow, CARD_BACKGROUNDS[tab.name] && { alignItems: 'flex-end' }]}>
                                {!CARD_BACKGROUNDS[tab.name] && (
                                  <View style={[styles.moduleIconWrapperFull, { backgroundColor: `${category.color}15` }]}>
                                    <tab.icon size={22} color={category.color} strokeWidth={2.5} />
                                  </View>
                                )}
                                <Text style={[
                                  styles.moduleTitleFull,
                                  CARD_BACKGROUNDS[tab.name] && { color: '#ffffff', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4, fontSize: 24, marginLeft: CARD_BACKGROUNDS[tab.name] ? 0 : undefined }
                                ]}>{tab.name}</Text>
                              </View>
                              {!CARD_BACKGROUNDS[tab.name] && (
                                <View style={[styles.chevronWrapper, { backgroundColor: `${category.color}10` }]}>
                                  <ChevronRight size={18} color={category.color} />
                                </View>
                              )}
                            </View>
                            )
                          ) : (
                            <View style={[
                              styles.moduleColumn, 
                              CARD_BACKGROUNDS[tab.name] && { padding: 14, justifyContent: 'flex-end' }
                            ]}>
                              {!CARD_BACKGROUNDS[tab.name] && (
                                <View style={[styles.moduleIconWrapper, { backgroundColor: `${category.color}15` }]}>
                                  <tab.icon size={22} color={category.color} strokeWidth={2.5} />
                                </View>
                              )}
                              <Text 
                                style={[
                                  styles.moduleTitle,
                                  CARD_BACKGROUNDS[tab.name] && { color: '#ffffff', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }
                                ]} 
                                numberOfLines={2}
                              >
                                {tab.name === 'About Us' ? 'About\u00A0Us' : tab.name}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                    );
                  })}
                </View>
                
              </View>
            );
          })}
        </View>
        
        {/* Actions Container at the bottom of the ScrollView so it doesn't float over cards */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 24,
          paddingTop: 10,
          paddingBottom: 40,
        }}>
          <TouchableOpacity
            onPress={signOut}
            style={{
              backgroundColor: '#9C4325', // Terracotta Rust
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 30,
              elevation: 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              gap: 8,
            }}
          >
            <LogOut size={18} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 }}>Sign Out</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setViewMode('member')}
            style={{
              backgroundColor: '#1a2d5a', // solid navy
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 30,
              borderWidth: 1,
              borderColor: 'rgba(252, 211, 77, 0.5)', // golden border
              elevation: 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              gap: 8,
            }}
          >
            <Smartphone size={18} color="#FCD34D" />
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 }}>Member View</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F0EA' }, // Warm beige backdrop
  
  // HERO SECTION
  heroSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  heroContent: {
    paddingTop: Platform.OS === 'android' ? 10 : 0,
  },
  greetingText: {
    color: '#cbd5e1',
    fontSize: 20,
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  nameText: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
    fontFamily: FONTS.serif,
  },

  scroll: { 
    paddingBottom: 200, // Space for the bottom tab bar and floating Member View button
  },
  
  content: {
    paddingHorizontal: 24,
    paddingTop: 30,
  },

  // CATEGORIES
  categoryBlock: {
    marginBottom: 36,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryIconBg: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    fontFamily: FONTS.serif,
    letterSpacing: 0.5,
  },
  categoryLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
    marginLeft: 16,
  },

  // HYBRID MODULE GRID
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14, 
  },
  moduleCard: {
    width: (width - 62) / 2, 
    backgroundColor: '#ffffff',
    borderRadius: 22, 
    padding: 14,
    elevation: 6,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    borderWidth: 1,
    minHeight: 100,
  },
  moduleCardFull: {
    width: '100%', 
    minHeight: 160,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moduleColumn: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  moduleLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  moduleIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20, // Perfect circle
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10, 
  },
  moduleIconWrapperFull: {
    width: 40,
    height: 40,
    borderRadius: 20, // Perfect circle
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chevronWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
    fontFamily: FONTS.sans,
    lineHeight: 18,
  },
  moduleTitleFull: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
    fontFamily: FONTS.sans,
  }
});
