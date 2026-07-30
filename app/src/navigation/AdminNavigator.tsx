import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image, Dimensions, Alert } from 'react-native';
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
  Sliders
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
import { Shield } from 'lucide-react-native';

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

export default function AdminNavigator({ navigation }: any) {
  const { signOut, user, member, setViewMode } = useAuth();
  const { activeChurch } = useChurch();
  const [activeTab, setActiveTab] = useState(0);
  const [tabHistory, setTabHistory] = useState<number[]>([]);
  const [editingData, setEditingData] = useState(null);
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'info' | 'error' | 'warning';
  }>({ visible: false, title: '', message: '', type: 'info' });

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
      
      if (tabName === 'Donations') {
        setAlertConfig({
          visible: true,
          title: 'Donations Module Coming Soon',
          message: 'The donations module is currently under active development. This feature will be available in the next major update!',
          type: 'info'
        });
        return;
      }

      // Defer the heavy component unmount/mount to the next tick. 
      // This allows the tap animation to finish instantly, making the UI feel highly responsive.
      setTimeout(() => {
        setTabHistory(prev => [...prev, activeTab]);
        if ([1, 4, 5, 8].indexOf(index) === -1) setEditingData(null);
        setActiveTab(index);
      }, 0);
    }
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
    ...((member?.userType?.toLowerCase() === 'admin' || member?.userType?.toLowerCase() === 'super_admin') ? [{ name: 'WeCelebrations', icon: Sparkles, component: AdminWeCelebrations }] : []),
    ...((member?.userType?.toLowerCase() === 'admin' || member?.userType?.toLowerCase() === 'super_admin') ? [{ name: 'WhatsApp', icon: MessageCircle, component: AdminWhatsAppInbox }] : []),
    { name: 'About Us', icon: Building2, component: AdminAboutUsEditor },
    { name: 'Contact Us', icon: PhoneCall, component: AdminContactUsEditor },
    { name: 'Church Settings', icon: Sliders, component: AdminChurchSettings },
    { name: 'Expense', icon: Wallet, component: AdminFinanceDashboard },
    { name: 'Donations', icon: HeartHandshake, component: DonationsDashboard },
    { name: 'Subscription', icon: Crown, component: AdminSubscriptionScreen },
    ...(member?.userType === 'super_admin' ? [{ name: 'Super Admin', icon: Shield, component: SuperAdminDashboard }] : []),
  ];

  const ActiveComponent = tabs[activeTab].component;
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
    <AdminTabContext.Provider value={{ activeTab, setActiveTab: handleSetTab, editingData, setEditingData, goBack: handleBack }}>
      <View style={[styles.container, { backgroundColor: activeTab === 0 ? '#F4F0EA' : '#f0f2f7' }]}>
        <SafeAreaView edges={['top']} style={{ backgroundColor: activeTab === 0 ? '#1e2b4d' : '#1a2d5a' }} />
        <View style={[styles.header, { backgroundColor: activeTab === 0 ? '#1e2b4d' : '#1a2d5a' }]}>
          <View style={styles.headerTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => setMenuExpanded(true)} style={styles.hamburgerBtn}>
                <DotGridIcon color="#fff" size={20} />
              </TouchableOpacity>
              {activeTab === 0 && (
                <Text style={{ color: '#cbd5e1', fontSize: 20, marginLeft: 14, fontFamily: FONTS.serif, fontStyle: 'italic' }}>Welcome Back</Text>
              )}
            </View>
            
            {activeTab === 0 ? (
              <View style={styles.datePill}>
                <Text style={styles.datePillTxt}>{today}</Text>
              </View>
            ) : (
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Admin Dashboard</Text>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.content, { backgroundColor: activeTab === 0 ? '#F4F0EA' : '#f0f2f7' }]}>
          {activeTab === 0 ? (
            <AdminDashboard navigation={navigation} allTabs={tabs} />
          ) : (
            <ActiveComponent navigation={navigation} />
          )}
        </View>

        {/* Premium Floating Bottom Tab Bar */}
        {isMainTabActive && (
          <View style={styles.bottomTabBarWrapper}>
            <View style={[styles.bottomTabBar, { backgroundColor: barBgColor }]}>
              {/* HOME */}
              <TouchableOpacity 
                style={styles.bottomTabItem} 
                onPress={() => handleSetTab(0)}
              >
                <View style={activeTab === 0 ? styles.activeCircle : styles.inactiveCircle}>
                  <Home size={22} color={activeTab === 0 ? activeIconColor : inactiveIconColor} strokeWidth={activeTab === 0 ? 2.5 : 2} />
                </View>
                {activeTab !== 0 && <Text style={[styles.bottomTabLabel, { color: inactiveIconColor }]}>Home</Text>}
              </TouchableOpacity>

              {/* SERMONS */}
              <TouchableOpacity 
                style={styles.bottomTabItem} 
                onPress={() => {
                  const idx = tabs.findIndex(t => t.name === 'Sermons');
                  if (idx > -1) handleSetTab(idx);
                }}
              >
                <View style={tabs.findIndex(t => t.name === 'Sermons') === activeTab ? styles.activeCircle : styles.inactiveCircle}>
                  <Mic size={22} color={tabs.findIndex(t => t.name === 'Sermons') === activeTab ? activeIconColor : inactiveIconColor} strokeWidth={tabs.findIndex(t => t.name === 'Sermons') === activeTab ? 2.5 : 2} />
                </View>
                {tabs.findIndex(t => t.name === 'Sermons') !== activeTab && <Text style={[styles.bottomTabLabel, { color: inactiveIconColor }]}>Sermons</Text>}
              </TouchableOpacity>

              {/* PRAYERS */}
              <TouchableOpacity 
                style={styles.bottomTabItem} 
                onPress={() => {
                  const idx = tabs.findIndex(t => t.name === 'Prayers');
                  if (idx > -1) handleSetTab(idx);
                }}
              >
                <View style={tabs.findIndex(t => t.name === 'Prayers') === activeTab ? styles.activeCircle : styles.inactiveCircle}>
                  <Heart size={22} color={tabs.findIndex(t => t.name === 'Prayers') === activeTab ? activeIconColor : inactiveIconColor} strokeWidth={tabs.findIndex(t => t.name === 'Prayers') === activeTab ? 2.5 : 2} />
                </View>
                {tabs.findIndex(t => t.name === 'Prayers') !== activeTab && <Text style={[styles.bottomTabLabel, { color: inactiveIconColor }]}>Prayers</Text>}
              </TouchableOpacity>

              {/* EVENTS */}
              <TouchableOpacity 
                style={styles.bottomTabItem} 
                onPress={() => {
                  const idx = tabs.findIndex(t => t.name === 'Events');
                  if (idx > -1) handleSetTab(idx);
                }}
              >
                <View style={tabs.findIndex(t => t.name === 'Events') === activeTab ? styles.activeCircle : styles.inactiveCircle}>
                  <Calendar size={22} color={tabs.findIndex(t => t.name === 'Events') === activeTab ? activeIconColor : inactiveIconColor} strokeWidth={tabs.findIndex(t => t.name === 'Events') === activeTab ? 2.5 : 2} />
                </View>
                {tabs.findIndex(t => t.name === 'Events') !== activeTab && <Text style={[styles.bottomTabLabel, { color: inactiveIconColor }]}>Events</Text>}
              </TouchableOpacity>

              {/* CELEBRATIONS */}
              <TouchableOpacity 
                style={styles.bottomTabItem} 
                onPress={() => {
                  const idx = tabs.findIndex(t => t.name === 'Celebrations');
                  if (idx > -1) handleSetTab(idx);
                }}
              >
                <View style={tabs.findIndex(t => t.name === 'Celebrations') === activeTab ? styles.activeCircle : styles.inactiveCircle}>
                  <Gift size={22} color={tabs.findIndex(t => t.name === 'Celebrations') === activeTab ? activeIconColor : inactiveIconColor} strokeWidth={tabs.findIndex(t => t.name === 'Celebrations') === activeTab ? 2.5 : 2} />
                </View>
                {tabs.findIndex(t => t.name === 'Celebrations') !== activeTab && <Text style={[styles.bottomTabLabel, { color: inactiveIconColor }]}>Celebrations</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Full-Height Left Side Drawer Overlay */}
        {menuExpanded && (
          <View style={styles.drawerOverlay}>
            <TouchableOpacity 
              style={styles.drawerBackdrop} 
              activeOpacity={1} 
              onPress={() => setMenuExpanded(false)} 
            />
            <View style={styles.drawerContent}>
              
              {/* Profile Section */}
              <View style={styles.drawerProfileSection}>
                <View style={styles.drawerAvatar}>
                  <Image source={activeChurch?.theme?.logoUrl ? { uri: activeChurch.theme.logoUrl } : require('../../assets/logo.png')} style={{ width: 56, height: 56 }} resizeMode="cover" />
                </View>
                <View>
                  <Text style={styles.drawerName}>{activeChurch?.name || 'Your Church'}</Text>
                  <Text style={styles.drawerEmail}>{member?.name || user?.displayName || 'Admin Member'}</Text>
                </View>
              </View>

              <View style={styles.drawerDivider} />

              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                <View style={{ paddingVertical: 10 }}>
                  <Text style={styles.drawerSectionTitle}>ALL MODULES</Text>
                  {tabs.map((tab, index) => {
                    const isActive = activeTab === index;
                    return (
                      <TouchableOpacity 
                        key={index} 
                        style={[styles.drawerItem, isActive && styles.drawerItemActive]}
                        onPress={() => {
                          handleSetTab(index);
                          setMenuExpanded(false);
                        }}
                      >
                        <tab.icon 
                          size={20} 
                          color={isActive ? "#FCD34D" : "#fff"} 
                          strokeWidth={isActive ? 2.5 : 1.5}
                        />
                        <Text style={[styles.drawerItemText, isActive && styles.drawerItemTextActive]}>
                          {tab.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Footer Actions */}
              <View style={styles.drawerFooter}>
                <TouchableOpacity style={[styles.drawerSignOutBtn, { flexDirection: 'row', justifyContent: 'center', gap: 10 }]} onPress={signOut}>
                  <LogOut size={20} color="#fff" />
                  <Text style={styles.drawerSignOutTxt}>Sign out</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        )}

        {/* Floating Switch to Member View pill - ONLY on Dashboard */}
        {activeTab === 0 && (
          <TouchableOpacity
            onPress={() => setViewMode('member')}
            style={{
              position: 'absolute',
              bottom: Platform.OS === 'ios' ? 160 : 150,
              right: 20,
              backgroundColor: '#1a2d5a', // solid navy
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 30,
              borderWidth: 1,
              borderColor: 'rgba(252, 211, 77, 0.5)', // golden border
              gap: 8,
              elevation: 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              zIndex: 999
            }}
          >
            <Smartphone size={18} color="#FCD34D" />
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 }}>Member View</Text>
          </TouchableOpacity>
        )}

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
