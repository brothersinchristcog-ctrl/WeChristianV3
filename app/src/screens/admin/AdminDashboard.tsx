import React, { useEffect, useState, useContext } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  useWindowDimensions,
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
  Video,
  Headset,
  Wand2
} from 'lucide-react-native';
import { useChurch } from '../../context/ChurchContext';
import HexagonDate from '../../components/HexagonDate';
import { AdminTabContext } from '../../context/AdminTabContext';
import { useAuth } from '../../context/AuthContext';


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
  'Gallery': require('../../../assets/admin_cards/gallery.png'),
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
  'Support Team': require('../../../assets/support_bg.png'),
  'Church Settings': require('../../../assets/admin_cards/church_settings.png'),
  'Church Branches': require('../../../assets/admin_cards/church_branches.jpg'),
  'Attendance': require('../../../assets/admin_cards/attendance.png'),
  'Online Meetings': require('../../../assets/admin_cards/online_meetings.jpg'),
  'New Online Meeting': require('../../../assets/admin_cards/new_online_meeting.png'),
  'App Admin': require('../../../assets/admin_cards/app_admin.png'),
  'AI Sermon Assistant': require('../../../assets/admin_cards/ai_sermon.jpg'),
  'AI Sermon': require('../../../assets/admin_cards/ai_sermon.jpg'),
  'AI Thumbnail Creation': require('../../../assets/admin_cards/ai_content.jpg'),
  'AI Content Creator': require('../../../assets/admin_cards/ai_content.jpg'),
};

const CATEGORIES = [
  {
    title: 'Content Management',
    icon: BookOpen,
    color: '#0F766E', // Teal
    keywords: ['Promise', 'Sermons', 'New Sermon', 'Song']
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
    title: 'AI Ministry Tools',
    icon: Wand2,
    color: '#6D28D9', // Deep violet for AI
    keywords: ['AI Sermon', 'AI Content', 'AI Thumbnail']
  },
  {
    title: 'Communication',
    icon: Bell,
    color: '#78350F', // Rich Deep Bronze/Chocolate for excellent warm contrast
    keywords: ['Notification', 'WhatsApp']
  },
  {
    title: 'Church Ledger',
    icon: DollarSign,
    color: '#206A5D', // Deep green
    keywords: ['Expense', 'Donation', 'Subscription']
  },
  {
    title: 'Online Meeting Management',
    icon: Video,
    color: '#4F46E5', // Indigo for a professional look
    keywords: ['Online Meeting', 'Gallery']
  },
  {
    title: 'Administration',
    icon: Settings,
    color: '#1E3A8A', // Deep Navy for maximum contrast
    keywords: ['Church Setting', 'Church Branch', 'App Admin', 'About', 'Contact', 'Schedule']
  },
  {
    title: 'Support',
    icon: Headset,
    color: '#0284C7', // Sky blue for trust
    keywords: ['Support']
  },
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

  const hour = new Date().getHours();
  let timeGreeting = 'Good evening,';
  if (hour < 12) timeGreeting = 'Good morning,';
  else if (hour < 17) timeGreeting = 'Good afternoon,';

  // Responsive device measurements
  const { width: windowWidth } = useWindowDimensions();
  const isSmallDevice = windowWidth < 375;
  const isMediumDevice = windowWidth >= 375 && windowWidth < 415;

  const horizontalPadding = isSmallDevice ? 14 : isMediumDevice ? 16 : 18;
  const cardGap = isSmallDevice ? 10 : 12;
  const availableGridWidth = windowWidth - (horizontalPadding * 2);
  const halfCardWidth = Math.floor((availableGridWidth - cardGap) / 2);
  const halfCardHeight = isSmallDevice ? 106 : isMediumDevice ? 116 : 122;
  const fullCardHeight = isSmallDevice ? 142 : isMediumDevice ? 154 : 164;
  const cardPadding = isSmallDevice ? 10 : 12;
  const cardBorderRadius = isSmallDevice ? 18 : 20;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F0EA" />
      <ScrollView 
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scroll}
      >
        {/* Responsive Admin Dashboard Top Hero Card */}
        <View style={{ zIndex: 10, backgroundColor: '#F4F0EA', paddingHorizontal: horizontalPadding, paddingTop: 10, paddingBottom: 10 }}>
          <View style={[styles.heroSection, { borderColor: '#000000', borderWidth: 1, paddingHorizontal: 0, paddingVertical: 0, overflow: 'hidden', backgroundColor: '#FDFBF7' }]}>
            <Image 
              source={require('../../../assets/admin_hero_church_2.png')} 
              style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%' }]} 
              resizeMode="cover" 
            />
            
            <View style={{ 
              paddingHorizontal: isSmallDevice ? 16 : 22, 
              paddingVertical: isSmallDevice ? 24 : 34, 
              width: isSmallDevice ? '72%' : isMediumDevice ? '68%' : '64%', 
              minHeight: isSmallDevice ? 155 : 175, 
              justifyContent: 'center' 
            }}>
              {/* Top row: Logo, Info */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: isSmallDevice ? 12 : 16 }}>
                <View style={{ 
                  width: isSmallDevice ? 38 : 44, 
                  height: isSmallDevice ? 38 : 44, 
                  borderRadius: isSmallDevice ? 19 : 22, 
                  backgroundColor: '#ffffff', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  overflow: 'hidden', 
                  borderWidth: 1, 
                  borderColor: '#e2e8f0', 
                  elevation: 2, 
                  shadowColor: '#000', 
                  shadowOpacity: 0.1, 
                  shadowRadius: 4 
                }}>
                  <Image 
                    source={activeChurch?.theme?.logoUrl ? { uri: activeChurch.theme.logoUrl } : require('../../../assets/logo.png')} 
                    style={{ width: '100%', height: '100%' }} 
                    resizeMode="cover" 
                  />
                </View>
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text 
                    style={{ 
                      color: '#1a2d5a', 
                      fontSize: isSmallDevice ? 15 : 17, 
                      fontWeight: '800' 
                    }}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    {activeChurch?.name || 'Your Church'}
                  </Text>
                </View>
              </View>

              {/* Title */}
              <Text 
                style={{ 
                  color: '#b45309', 
                  fontSize: isSmallDevice ? 21 : 25, 
                  fontWeight: '600', 
                  marginBottom: 6, 
                  fontFamily: FONTS.serif, 
                  fontStyle: 'italic' 
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                Admin Dashboard
              </Text>
              
              {/* Short Separator */}
              <View style={{ height: 2, width: 40, backgroundColor: '#b45309', marginBottom: 4 }} />
            </View>
          </View>
        </View>
        
        <View style={[styles.content, { paddingHorizontal: horizontalPadding, paddingTop: isSmallDevice ? 20 : 26 }]}>
          {CATEGORIES.map((category, catIdx) => {
            const tabsInCategory = categorizedTabs[category.title];
            if (!tabsInCategory || tabsInCategory.length === 0) return null;

            return (
              <View key={catIdx} style={[styles.categoryBlock, { marginBottom: isSmallDevice ? 22 : 28 }]}>
                
                {/* Elegant Category Header */}
                <View style={[styles.categoryHeader, { marginBottom: isSmallDevice ? 14 : 18 }]}>
                  <View style={[styles.categoryIconBg, { backgroundColor: `${category.color}20`, width: isSmallDevice ? 24 : 26, height: isSmallDevice ? 24 : 26 }]}>
                    <category.icon size={isSmallDevice ? 15 : 17} color={category.color} strokeWidth={2.5} />
                  </View>
                  <Text 
                    style={[
                      styles.categoryTitle, 
                      { 
                        color: category.color,
                        fontSize: isSmallDevice ? 16 : 17.5,
                        flexShrink: 1,
                      }
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.88}
                  >
                    {category.title}
                  </Text>
                  <View style={[styles.categoryLine, { backgroundColor: `${category.color}40`, marginLeft: isSmallDevice ? 10 : 14 }]} />
                </View>

                {/* Hybrid Responsive Grid of Modules */}
                <View style={[styles.grid, { gap: cardGap }]}>
                  {tabsInCategory.map((tab) => {
                    const isFullWidth = FULL_WIDTH_MODULES.includes(tab.name);
                    
                    return (
                        <TouchableOpacity 
                          key={tab.index} 
                          style={[
                            styles.moduleCard, 
                            isFullWidth && styles.moduleCardFull,
                            {
                              width: isFullWidth ? '100%' : halfCardWidth,
                              height: isFullWidth ? fullCardHeight : halfCardHeight,
                              borderRadius: cardBorderRadius,
                              shadowColor: category.color,
                              borderColor: `${category.color}25`,
                              overflow: CARD_BACKGROUNDS[tab.name] ? 'hidden' : 'visible',
                              padding: CARD_BACKGROUNDS[tab.name] ? 0 : cardPadding,
                              backgroundColor: tab.name === 'Subscription' ? '#F2EAE0' : (tab.name === 'Church Settings' ? 'rgb(202, 221, 236)' : (tab.name === 'Members' ? 'rgb(244, 224, 217)' : (tab.name === 'Promises' ? '#000000' : '#ffffff'))),
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
                              <Text 
                                style={{
                                  position: 'absolute',
                                  bottom: isSmallDevice ? 12 : 16,
                                  left: isSmallDevice ? 12 : 16,
                                  right: isSmallDevice ? 12 : 16,
                                  color: '#ffffff',
                                  fontSize: isSmallDevice ? 19 : isMediumDevice ? 21 : 23,
                                  fontWeight: '800',
                                  fontFamily: FONTS.sans,
                                  textShadowColor: 'rgba(0,0,0,0.85)',
                                  textShadowOffset: { width: 0, height: 1 },
                                  textShadowRadius: 4,
                                }}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.85}
                              >
                                {tab.name}
                              </Text>
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
                                  <View style={[styles.moduleIconWrapperFull, { backgroundColor: `${category.color}15`, width: isSmallDevice ? 36 : 40, height: isSmallDevice ? 36 : 40, borderRadius: isSmallDevice ? 18 : 20 }]}>
                                    <tab.icon size={isSmallDevice ? 19 : 22} color={category.color} strokeWidth={2.5} />
                                  </View>
                                )}
                                <Text 
                                  style={[
                                    styles.moduleTitleFull,
                                    { fontSize: isSmallDevice ? 14 : 15 },
                                    CARD_BACKGROUNDS[tab.name] && { color: '#ffffff', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4, fontSize: isSmallDevice ? 19 : 23, marginLeft: CARD_BACKGROUNDS[tab.name] ? 0 : undefined }
                                  ]}
                                  numberOfLines={1}
                                  adjustsFontSizeToFit
                                  minimumFontScale={0.85}
                                >
                                  {tab.name}
                                </Text>
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
                              { width: '100%', height: '100%' },
                              CARD_BACKGROUNDS[tab.name] && { padding: cardPadding, justifyContent: 'flex-end' }
                            ]}>
                              {!CARD_BACKGROUNDS[tab.name] && (
                                <View style={[styles.moduleIconWrapper, { backgroundColor: `${category.color}15`, width: isSmallDevice ? 34 : 38, height: isSmallDevice ? 34 : 38, borderRadius: isSmallDevice ? 17 : 19 }]}>
                                  <tab.icon size={isSmallDevice ? 18 : 20} color={category.color} strokeWidth={2.5} />
                                </View>
                              )}
                              <Text 
                                style={[
                                  styles.moduleTitle,
                                  {
                                    width: '100%',
                                    fontSize: isSmallDevice ? 13 : isMediumDevice ? 14 : 14.5,
                                    lineHeight: isSmallDevice ? 16 : isMediumDevice ? 17.5 : 18,
                                  },
                                  CARD_BACKGROUNDS[tab.name] && { color: '#ffffff', textShadowColor: 'rgba(0,0,0,0.85)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }
                                ]} 
                                numberOfLines={2}
                                adjustsFontSizeToFit
                                minimumFontScale={0.80}
                              >
                                {tab.name === 'About Us' 
                                  ? 'About\u00A0Us' 
                                  : (tab.name === 'AI Sermon Assistant' || tab.name === 'AI Sermon') 
                                  ? 'AI Sermon\nAssistant' 
                                  : (tab.name === 'AI Content Creator' || tab.name === 'AI Thumbnail Creation') 
                                  ? 'AI Thumbnail\nCreation' 
                                  : tab.name}
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
        
        {/* Actions Container at the bottom of the ScrollView */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: horizontalPadding,
          paddingTop: 10,
          paddingBottom: isSmallDevice ? 28 : 36,
          gap: 12,
        }}>
          <TouchableOpacity
            onPress={signOut}
            style={{
              flex: 1,
              backgroundColor: '#9C4325', // Terracotta Rust
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: isSmallDevice ? 12 : 13,
              borderRadius: 30,
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              gap: 7,
            }}
            activeOpacity={0.8}
          >
            <LogOut size={isSmallDevice ? 16 : 18} color="#fff" />
            <Text 
              style={{ color: '#fff', fontSize: isSmallDevice ? 12.5 : 13.5, fontWeight: '800', letterSpacing: 0.4 }}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              Sign Out
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setViewMode('member')}
            style={{
              flex: 1,
              backgroundColor: '#1a2d5a', // solid navy
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: isSmallDevice ? 12 : 13,
              borderRadius: 30,
              borderWidth: 1,
              borderColor: 'rgba(252, 211, 77, 0.5)', // golden border
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              gap: 7,
            }}
            activeOpacity={0.8}
          >
            <Smartphone size={isSmallDevice ? 16 : 18} color="#FCD34D" />
            <Text 
              style={{ color: '#fff', fontSize: isSmallDevice ? 12.5 : 13.5, fontWeight: '800', letterSpacing: 0.4 }}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              Member View
            </Text>
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
    paddingBottom: 30,
  },
  
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  // CATEGORIES
  categoryBlock: {
    marginBottom: 30,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    fontSize: 17.5,
    fontWeight: '700',
    color: '#1e293b',
    fontFamily: FONTS.serif,
    letterSpacing: 0.3,
  },
  categoryLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
    marginLeft: 14,
  },

  // HYBRID MODULE GRID
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  moduleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20, 
    elevation: 5,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
  },
  moduleCardFull: {
    width: '100%', 
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
