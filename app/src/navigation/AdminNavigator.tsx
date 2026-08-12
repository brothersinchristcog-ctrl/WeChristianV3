import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image, Dimensions, Alert, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  BookOpen, 
  BookPlus, 
  Calendar, 
  Mic, 
  PlusSquare, 
  Bell, 
  MapPin, 
  LogOut,
  Grid,
  Heart,
  Users,
  Gift,
  Smartphone,
  Info,
  Phone,
  Settings,
  CreditCard,
  MessageCircle,
  ClipboardCheck,
  Wallet,
  Home,
  MoreHorizontal,
  HeartHandshake,
  Sparkles,
  Video,
  Music,
  CalendarPlus,
  CalendarDays,
  Briefcase,
  Crown,
  CalendarClock,
  Building2,
  PhoneCall,
  Sliders,
  ChevronLeft
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useChurch } from '../context/ChurchContext';
import Theme from '../theme/Theme';
import { AdminTabContext } from '../context/AdminTabContext';
import { CustomAlert } from '../components/CustomAlert';

// Import Screens
import AdminPromiseList from '../screens/admin/AdminPromiseList';
import AdminPromiseEditor from '../screens/admin/AdminPromiseEditor';
import AdminPromiseCalendar from '../screens/admin/AdminPromiseCalendar';
import AdminSermonList from '../screens/admin/AdminSermonList';
import AdminSermonEditor from '../screens/admin/AdminSermonEditor';
import AdminNotificationBroadcast from '../screens/admin/AdminNotificationBroadcast';
import AdminEventList from '../screens/admin/AdminEventList';
import AdminEventEditor from '../screens/admin/AdminEventEditor';
import AdminPrayerModeration from '../screens/admin/AdminPrayerModeration';
import AdminSongEditor from '../screens/admin/AdminSongEditor';
import AdminMembers from '../screens/admin/AdminMembers';
import AdminCelebrations from '../screens/admin/AdminCelebrations';
import AdminAboutUsEditor from '../screens/admin/AdminAboutUsEditor';
import AdminContactUsEditor from '../screens/admin/AdminContactUsEditor';
import AdminChurchSettings from '../screens/admin/AdminChurchSettings';
import AdminAttendance from '../screens/admin/AdminAttendance';
import PastorEventDashboard from '../screens/admin/pastor_events/PastorEventDashboard';
import SuperAdminDashboard from '../screens/admin/SuperAdminDashboard';
import AdminSubscriptionScreen from '../screens/admin/AdminSubscriptionScreen';
import AdminWeCelebrations from '../screens/admin/AdminWeCelebrations';
import AdminWhatsAppInbox from '../screens/admin/AdminWhatsAppInbox';
import AdminFinanceDashboard from '../screens/admin/AdminFinanceDashboard';
// Force TS cache refresh
import DonationsDashboard from '../screens/admin/DonationsDashboard';
import AdminDashboard from '../screens/admin/AdminDashboard';
import AdminOnlineMeetings from '../screens/admin/AdminOnlineMeetings';
import AdminOnlineMeetingEditor from '../screens/admin/AdminOnlineMeetingEditor';
import { Shield, Video as VideoIcon } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const DotGridIcon = ({ color, size }: { color: string; size: number }) => {
  const dotSize = size * 0.22;
  return (
    <View style={{ width: size, height: size, justifyContent: 'space-between' }}>
      {[0, 1, 2].map(row => (
        <View key={row} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {[0, 1, 2].map(col => (
            <View key={col} style={{ 
              width: dotSize, 
              height: dotSize, 
              borderRadius: dotSize / 2, 
              backgroundColor: color 
            }} />
          ))}
        </View>
      ))}
    </View>
  );
};

export default function AdminNavigator({ navigation, route }: any) {
  const { signOut, user, member, setViewMode } = useAuth();
  const { activeChurch } = useChurch();
  const [activeTab, setActiveTab] = useState(0);
  const [tabHistory, setTabHistory] = useState<number[]>([]);
  const [editingData, setEditingData] = useState(null);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'info' | 'error' | 'warning';
  }>({ visible: false, title: '', message: '', type: 'info' });

  useEffect(() => {
    if (route?.params?.targetTab) {
      const idx = tabs.findIndex(t => t.name === route.params.targetTab);
      if (idx !== -1 && idx !== activeTab) {
        setTimeout(() => {
          setTabHistory(prev => [...prev, activeTab]);
          setActiveTab(idx);
        }, 0);
      }
    }
  }, [route?.params?.targetTab]);

  const handleSetTab = (index: number) => {
    if (index !== activeTab) {
      const tabName = tabs[index]?.name;
      
      if ((tabName === 'WhatsApp' || tabName === 'WeCelebrations') && !activeChurch?.whatsappIntegrationEnabled) {
        setAlertConfig({
          visible: true,
          title: 'WhatsApp Integration Not Enabled',
          message: 'WhatsApp Integration is not enabled for your church. Please contact the We Christian team to activate this feature. Once enabled, you will be able to use WhatsApp Integration from the We Celebration module and Church Settings.',
          type: 'info'
        });
        return;
      }
      

      // Defer the heavy component unmount/mount to the next tick. 
      // This allows the tap animation to finish instantly, making the UI feel highly responsive.
      setTimeout(() => {
        setTabHistory(prev => [...prev, activeTab]);
        const targetTabName = tabs[index]?.name || '';
        const safeTabNames = [
          'Promises', 'New Promise', 'Schedule', 'Promise Calendar', 'Add Promise',
          'Sermons', 'New Sermon', 
          'Events', 'New Event',
          'Online Meetings', 'New Online Meeting'
        ];
        if (!safeTabNames.includes(targetTabName)) {
          setEditingData(null);
        }
        setActiveTab(index);
      }, 0);
    }
  };

  const setTabByName = (name: string) => {
    const idx = tabs.findIndex(t => t.name === name);
    if (idx !== -1) handleSetTab(idx);
  };

  const handleBack = () => {
    if (tabHistory.length > 0) {
      const prevTab = tabHistory[tabHistory.length - 1];
      setTabHistory(prev => prev.slice(0, -1));
      setActiveTab(prevTab);
    } else {
      // Optional: Navigate to home/member view if history is empty?
      // setViewMode('member');
    }
  };

  useEffect(() => {
    const backAction = () => {
      if (tabHistory.length > 0) {
        handleBack();
        return true; // Prevent default behavior
      }
      return false; // Let default behavior happen (e.g., exit app)
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [tabHistory]);

  const tabs = [
    { name: 'Dashboard', icon: DotGridIcon, component: AdminDashboard },
    { name: 'Promises', icon: BookOpen, component: AdminPromiseList },
    { name: 'New Promise', icon: BookPlus, component: AdminPromiseEditor },
    { name: 'Schedule', icon: CalendarClock, component: AdminPromiseCalendar },
    { name: 'Sermons', icon: Mic, component: AdminSermonList },
    { name: 'New Sermon', icon: Video, component: AdminSermonEditor },
    { name: 'Songs', icon: Music, component: AdminSongEditor },
    { name: 'Notifications', icon: Bell, component: AdminNotificationBroadcast },
    { name: 'Events', icon: CalendarDays, component: AdminEventList },
    { name: 'New Event', icon: CalendarPlus, component: AdminEventEditor },
    { name: 'Pastor Event', icon: Briefcase, component: PastorEventDashboard },
    { name: 'Prayers', icon: Heart, component: AdminPrayerModeration },
    { name: 'Attendance', icon: ClipboardCheck, component: AdminAttendance },
    { name: 'Members', icon: Users, component: AdminMembers },
    { name: 'Celebrations', icon: Gift, component: AdminCelebrations },
    ...(String(member?.userType || '').toUpperCase().includes('ADMIN') || String(member?.userType || '').toUpperCase().includes('SUPER') ? [{ name: 'WeCelebrations', icon: Sparkles, component: AdminWeCelebrations }] : []),
    ...(String(member?.userType || '').toUpperCase().includes('ADMIN') || String(member?.userType || '').toUpperCase().includes('SUPER') ? [{ name: 'WhatsApp', icon: MessageCircle, component: AdminWhatsAppInbox }] : []),
    { name: 'About Us', icon: Building2, component: AdminAboutUsEditor },
    { name: 'Contact Us', icon: PhoneCall, component: AdminContactUsEditor },
    { name: 'Church Settings', icon: Sliders, component: AdminChurchSettings },
    { name: 'Expense', icon: Wallet, component: AdminFinanceDashboard },
    { name: 'Donations', icon: HeartHandshake, component: DonationsDashboard },
    { name: 'Subscription', icon: Crown, component: AdminSubscriptionScreen },
    { name: 'Online Meetings', icon: VideoIcon, component: AdminOnlineMeetings },
    { name: 'New Online Meeting', icon: VideoIcon, component: AdminOnlineMeetingEditor },
    ...(member?.userType === 'super_admin' ? [{ name: 'Super Admin', icon: Shield, component: SuperAdminDashboard }] : []),
  ];

  const ActiveComponent = tabs[activeTab].component as any;
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const isHomeActive = activeTab === 0;
  const isPromisesActive = tabs.findIndex(t => t.name === 'Promises') === activeTab;
  const isSermonsActive = tabs.findIndex(t => t.name === 'Sermons') === activeTab;
  const isPrayersActive = tabs.findIndex(t => t.name === 'Prayers') === activeTab;
  const isEventsActive = tabs.findIndex(t => t.name === 'Events') === activeTab;
  const isCelebrationsActive = tabs.findIndex(t => t.name === 'Celebrations') === activeTab;
  
  // Removed isPromisesActive from the list below per user request to hide the bottom tab bar on Promises
  const isMainTabActive = isHomeActive || isSermonsActive || isPrayersActive || isEventsActive || isCelebrationsActive;

  let barBgColor = '#1a2d5a';
  let activeIconColor = '#1e2b4d';
  let inactiveIconColor = '#a89f91';

  if (isHomeActive) {
    barBgColor = '#0F4C5C'; // Deep Premium Teal
    activeIconColor = '#0F4C5C';
    inactiveIconColor = 'rgba(255,255,255,0.7)';
  } else if (isSermonsActive) {
    barBgColor = '#382B5C'; // Royal Indigo
    activeIconColor = '#382B5C';
    inactiveIconColor = 'rgba(255,255,255,0.7)';
  } else if (isPrayersActive) {
    barBgColor = '#1F5F3B'; // Forest Green
    activeIconColor = '#1F5F3B';
    inactiveIconColor = 'rgba(255,255,255,0.7)';
  } else if (isEventsActive) {
    barBgColor = '#9C4325'; // Terracotta Rust
    activeIconColor = '#9C4325';
    inactiveIconColor = 'rgba(255,255,255,0.7)';
  } else if (isCelebrationsActive) {
    barBgColor = '#121212'; // Sleek Black
    activeIconColor = '#121212';
    inactiveIconColor = 'rgba(255,255,255,0.7)';
  }

  // We provide handleSetTab via setActiveTab so child components can push to history
  return (
    <AdminTabContext.Provider value={{ activeTab, setActiveTab: handleSetTab, editingData, setEditingData, goBack: handleBack, setTabByName }}>
      <View style={[styles.container, { backgroundColor: activeTab === 0 ? '#F4F0EA' : '#f0f2f7' }]}>
        <SafeAreaView edges={['top']} style={{ backgroundColor: activeTab === 0 ? '#F4F0EA' : '#1a2d5a' }} />
        {activeTab !== 0 && (
          <View style={[styles.header, { backgroundColor: '#1a2d5a' }]}>
            <View style={styles.headerTop}>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Admin Dashboard</Text>
              </View>
            </View>
          </View>
        )}

        <View style={[styles.content, { backgroundColor: activeTab === 0 ? '#F4F0EA' : '#f0f2f7' }]}>
          {activeTab === 0 ? (
            <AdminDashboard navigation={navigation} allTabs={tabs} />
          ) : (
            <ActiveComponent navigation={navigation} routeParams={route?.params} />
          )}
        </View>

        {/* Premium Floating Bottom Tab Bar Removed */}

        {/* Full-Height Left Side Drawer Overlay Removed */}
        <CustomAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
        />

      </View>
    </AdminTabContext.Provider>
  );
}

const FONTS = {
  serif: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  sans: Platform.OS === 'ios' ? 'System' : 'sans-serif',
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 }, 
  header: { },
  
  // Bottom Tab Bar
  bottomTabBarWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 56 : 48, // Pushed up further
    left: 16,
    right: 16,
    backgroundColor: 'transparent',
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff', // Default, gets overridden dynamically
    borderRadius: 36, 
    paddingHorizontal: 8,
    paddingVertical: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  activeCircle: {
    backgroundColor: '#ffffff', // Perfect white circle for active
    width: 50,
    height: 50,
    borderRadius: 25, // Half of width/height to make a perfect circle
    justifyContent: 'center',
    alignItems: 'center',
  },
  inactiveCircle: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomTabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },

  headerTop: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 12,
  },
  hamburgerBtn: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  datePill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  datePillTxt: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18, 
    backgroundColor: '#fff', 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5
  },
  logoImage: { 
    width: 26, 
    height: 26 
  },
  headerText: { flex: 1, marginLeft: 12, marginBottom: 4 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '600', fontFamily: FONTS.serif },
  headerSub: { color: '#aac4e8', fontSize: 11, marginTop: 1 },
  roleBadge: { 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12 
  },
  roleTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },

  content: { flex: 1, backgroundColor: '#EDE8DC' },

  // Classic Side Drawer Styles
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)', // Dim background
  },
  drawerContent: {
    width: width * 0.75,
    maxWidth: 340,
    backgroundColor: '#1a2d5a', // Original Navy Blue
    height: '100%',
    paddingTop: Platform.OS === 'ios' ? 50 : 30, // Safe area top padding
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 20,
  },
  drawerProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
    gap: 15,
  },
  drawerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden', // Forces the logo to be a perfect circle
  },
  drawerName: { color: '#fff', fontSize: 18, fontWeight: '700' },
  drawerEmail: { color: '#aac4e8', fontSize: 12, marginTop: 4 },
  drawerDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    marginBottom: 5,
  },
  drawerSectionTitle: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginLeft: 26,
    marginBottom: 10,
    marginTop: 10,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    borderRadius: 12,
    marginBottom: 4,
  },
  drawerItemActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  drawerItemText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 16,
  },
  drawerItemTextActive: {
    color: '#FCD34D',
    fontWeight: '800',
  },
  drawerFooter: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 50 : 45, // Pushed up to safely clear Android nav bar
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  drawerSignOutBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
  },
  drawerSignOutTxt: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: 15 
  }
});
