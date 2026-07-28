import React, { useEffect, useState, useContext } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  Image,
  StatusBar,
  Platform
} from 'react-native';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Plus, 
  TrendingUp, 
  Bell, 
  ChevronRight,
  ShieldCheck,
  Video,
  FileText,
  Activity,
  Heart,
  Settings,
  DollarSign
} from 'lucide-react-native';
import { AdminTabContext } from '../../context/AdminTabContext';

import FirestoreService from '../../services/FirestoreService';

const { width } = Dimensions.get('window');

export default function AdminDashboard() {
  const { setActiveTab, setEditingData } = useContext(AdminTabContext);
  const [stats, setStats] = useState({
    members: '1,240',
    promises: '28',
    events: '3',
    requests: '12'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const statData = await FirestoreService.getDashboardStats();
        setStats({
          members: statData.members.toString(),
          promises: statData.promises.toString(),
          events: '3',
          requests: '12'
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const QUICK_ACTIONS = [
    { id: 0, label: 'Promises', icon: <BookOpen size={20} color="#1a2d5a" />, desc: 'Update Daily Verse' },
    { id: 7, label: 'Events', icon: <Calendar size={20} color="#c0392b" />, desc: 'Manage Calendar' },
    { id: 3, label: 'Sermons', icon: <Video size={20} color="#15803D" />, desc: 'Post Teachings' },
    { id: 5, label: 'New Song', icon: <Plus size={20} color="#8B5CF6" />, desc: 'Post Song Lyrics' },
    { id: 6, label: 'Broadcast', icon: <Bell size={20} color="#EA580C" />, desc: 'Send Push Alerts' },
    { id: 10, label: 'Prayers', icon: <Heart size={20} color="#D97706" />, desc: 'Moderation' },
    { id: 16, label: 'Church Settings', icon: <Settings size={20} color="#1a2d5a" />, desc: 'Logo & Colors' }
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fbbf24" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />
      
      {/* ── Admin Header ── */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* ── Dashboard Stats ── */}
        <View style={styles.statsStripContainer}>
          <View style={styles.statsStrip}>
            <StatBox label="MEMBERS" val={stats.members} icon={<Users size={12} color="#1a2d5a" />} light />
            <View style={styles.sep} />
            <StatBox label="PROMISES" val={stats.promises} icon={<BookOpen size={12} color="#1a2d5a" />} light />
            <View style={styles.sep} />
            <StatBox label="REQUESTS" val={stats.requests} icon={<Bell size={12} color="#1a2d5a" />} light />
          </View>
        </View>
        
        {/* ── Status Banner ── */}
        <View style={styles.statusBanner}>
          <View style={styles.liveDot} />
          <Text style={styles.statusTxt}>System Live: Daily Promise is synced for all members.</Text>
        </View>

        {/* ── Management Grid ── */}
        <Text style={styles.secLbl}>QUICK MANAGEMENT</Text>
        <View style={styles.actionGrid}>
          {QUICK_ACTIONS.map(action => (
            <TouchableOpacity 
              key={action.id} 
              style={styles.actionCard}
              onPress={() => setActiveTab(action.id)}
            >
              <View style={styles.actionIcon}>{action.icon}</View>
              <Text style={styles.actionLabel}>{action.label}</Text>
              <Text style={styles.actionDesc}>{action.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Recent Activity ── */}
        <Text style={styles.secLbl}>SYSTEM SNAPSHOT</Text>
        <View style={styles.activityBox}>
          <ActivityRow icon={<Activity size={16} color="#1a2d5a" />} label="Database Health" val="Excellent" />
          <ActivityRow icon={<ShieldCheck size={16} color="#15803D" />} label="Salesforce Sync" val="Active" />
          <ActivityRow icon={<TrendingUp size={16} color="#D97706" />} label="Member Growth" val="+12% this week" isLast />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => {/* Handle Logout */}}>
          <Text style={styles.logoutTxt}>Sign Out of Admin Console</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

function StatBox({ label, val, icon, light }: any) {
  return (
    <View style={styles.statBox}>
      <View style={styles.statIconRow}>
        {icon}
        <Text style={[styles.statBoxLbl, light && { color: '#6B7280' }]}>{label}</Text>
      </View>
      <Text style={[styles.statBoxVal, light && { color: '#1a2d5a' }]}>{val}</Text>
    </View>
  );
}

function ActivityRow({ icon, label, val, isLast }: any) {
  return (
    <View style={[styles.activityRow, isLast && { borderBottomWidth: 0 }]}>
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowVal}>{val}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f7' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  adminHeader: { backgroundColor: '#1a2d5a', paddingTop: Platform.OS === 'ios' ? 60 : 30, paddingHorizontal: 20, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  adminTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  adminSub: { color: '#aac4e8', fontSize: 11, fontWeight: '500' },
  adminBadge: { backgroundColor: '#c0392b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  adminBadgeTxt: { color: '#fff', fontSize: 10, fontWeight: '800' },

  statsStripContainer: { padding: 12 },
  statsStrip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  statBox: { flex: 1, alignItems: 'center' },
  statIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  statBoxLbl: { color: '#aac4e8', fontSize: 9, fontWeight: '700' },
  statBoxVal: { color: '#fff', fontSize: 18, fontWeight: '800' },
  sep: { width: 1, height: 20, backgroundColor: '#e5e7eb' },

  scroll: { paddingBottom: 40 },

  statusBanner: { backgroundColor: '#fff', margin: 12, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#15803D' },
  statusTxt: { fontSize: 11, color: '#1a2d5a', fontWeight: '600' },

  secLbl: { fontSize: 10, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1, marginHorizontal: 16, marginBottom: 12, marginTop: 10 },
  
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10 },
  actionCard: { width: (width - 34) / 2, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: '#e5e7eb', elevation: 2 },
  actionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  actionLabel: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  actionDesc: { fontSize: 10, color: '#6B7280', fontWeight: '500' },

  activityBox: { backgroundColor: '#fff', marginHorizontal: 12, borderRadius: 16, overflow: 'hidden', borderWidth: 0.5, borderColor: '#e5e7eb' },
  activityRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6' },
  rowIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rowLabel: { flex: 1, fontSize: 12, color: '#111827', fontWeight: '600' },
  rowVal: { fontSize: 12, color: '#1a2d5a', fontWeight: '700' },

  logoutBtn: { marginTop: 40, alignItems: 'center' },
  logoutTxt: { fontSize: 13, color: '#c0392b', fontWeight: '700', textDecorationLine: 'underline' }
});
