import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  BookOpen, 
  Edit3, 
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
  DollarSign
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
      setTabHistory(prev => [...prev, activeTab]);
      setActiveTab(index);
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
    { name: 'Promises', icon: BookOpen, component: AdminPromiseList },
    { name: 'New Promise', icon: Edit3, component: AdminPromiseEditor },
    { name: 'Schedule', icon: Calendar, component: AdminPromiseCalendar },
    { name: 'Sermons', icon: Mic, component: AdminSermonList },
    { name: 'New Sermon', icon: PlusSquare, component: AdminSermonEditor },
    { name: 'New Song', icon: PlusSquare, component: AdminSongEditor },
    { name: 'Notifications', icon: Bell, component: AdminNotificationBroadcast },
    { name: 'Events', icon: MapPin, component: AdminEventList },
    { name: 'New Event', icon: PlusSquare, component: AdminEventEditor },
    { name: 'Pastor Event', icon: MapPin, component: PastorEventDashboard },
    { name: 'Prayers', icon: Heart, component: AdminPrayerModeration },
    { name: 'Attendance', icon: ClipboardCheck, component: AdminAttendance },
    { name: 'Members', icon: Users, component: AdminMembers },
    { name: 'Celebrations', icon: Gift, component: AdminCelebrations },
    ...((member?.userType?.toLowerCase() === 'admin' || member?.userType?.toLowerCase() === 'super_admin') ? [{ name: 'WeCelebrations', icon: Gift, component: AdminWeCelebrations }] : []),
    ...((member?.userType?.toLowerCase() === 'admin' || member?.userType?.toLowerCase() === 'super_admin') ? [{ name: 'WhatsApp', icon: MessageCircle, component: AdminWhatsAppInbox }] : []),
    { name: 'About Us', icon: Info, component: AdminAboutUsEditor },
    { name: 'Contact Us', icon: Phone, component: AdminContactUsEditor },
    { name: 'Church Settings', icon: Settings, component: AdminChurchSettings },
    { name: 'Expense', icon: DollarSign, component: AdminFinanceDashboard },
    { name: 'Subscription', icon: CreditCard, component: AdminSubscriptionScreen },
    ...(member?.userType === 'super_admin' ? [{ name: 'Super Admin', icon: Shield, component: SuperAdminDashboard }] : []),
  ];

  const ActiveComponent = tabs[activeTab].component;

  // We provide handleSetTab via setActiveTab so child components can push to history
  return (
    <AdminTabContext.Provider value={{ activeTab, setActiveTab: handleSetTab, editingData, setEditingData, goBack: handleBack }}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => setMenuExpanded(true)} style={styles.hamburgerBtn}>
              <DotGridIcon color="#fff" size={24} />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Admin Dashboard</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <ActiveComponent navigation={navigation} />
        </View>

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
                  {tabs.map((tab, index) => {
                    const isActive = activeTab === index;
                    return (
                      <TouchableOpacity 
                        key={index} 
                        style={[styles.drawerItem, isActive && styles.drawerItemActive]}
                        onPress={() => {
                          if ((tab.name === 'WhatsApp' || tab.name === 'WeCelebrations') && !activeChurch?.whatsappIntegrationEnabled) {
                            setMenuExpanded(false);
                            setAlertConfig({
                              visible: true,
                              title: 'WhatsApp Integration Not Enabled',
                              message: 'WhatsApp Integration is not enabled for your church. Please contact the We Christian team to activate this feature. Once enabled, you will be able to use WhatsApp Integration from the We Celebration module and Church Settings.',
                              type: 'info'
                            });
                            return;
                          }
                          handleSetTab(index);
                          setMenuExpanded(false); // Hide remaining tabs
                          if ([1, 4, 5, 8].indexOf(index) === -1) setEditingData(null);
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
                <TouchableOpacity 
                  style={[styles.drawerSignOutBtn, { 
                    marginBottom: 16, 
                    backgroundColor: 'rgba(252, 211, 77, 0.15)', 
                    borderWidth: 1, 
                    borderColor: 'rgba(252, 211, 77, 0.5)',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 10
                  }]} 
                  onPress={() => setViewMode('member')}
                >
                  <Smartphone size={20} color="#FCD34D" />
                  <Text style={[styles.drawerSignOutTxt, { color: '#FCD34D', fontWeight: '800' }]}>Member View</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.drawerSignOutBtn, { flexDirection: 'row', justifyContent: 'center', gap: 10 }]} onPress={signOut}>
                  <LogOut size={20} color="#fff" />
                  <Text style={styles.drawerSignOutTxt}>Sign out</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        )}

        <CustomAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
        />

      </SafeAreaView>
    </AdminTabContext.Provider>
  );
}

const FONTS = {
  serif: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  sans: Platform.OS === 'ios' ? 'System' : 'sans-serif',
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1a2d5a' },
  container: { flex: 1, backgroundColor: '#f0f2f7' },
  header: { backgroundColor: '#1a2d5a' },
  headerTop: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 14, 
    paddingVertical: 12,
    gap: 12
  },
  hamburgerBtn: {
    padding: 4,
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
  headerText: { flex: 1, marginLeft: 6, marginBottom: 4 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '600', fontFamily: FONTS.serif },
  headerSub: { color: '#aac4e8', fontSize: 11, marginTop: 1 },
  roleBadge: { 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12 
  },
  roleTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },

  content: { flex: 1, backgroundColor: '#f0f2f7' },

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
