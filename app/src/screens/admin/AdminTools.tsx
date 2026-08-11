import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  Image,
  StatusBar,
  Platform
} from 'react-native';
import { 
  BookOpen, 
  Bell, 
  Settings, 
  ChevronRight, 
  ShieldCheck, 
  Layout, 
  PlusCircle, 
  FileText,
  Users,
  Database,
  ArrowRight
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function AdminTools() {
  const navigation = useNavigation<any>();

  const SECTIONS = [
    {
      id: 'promises',
      title: 'Daily Word Content',
      subtitle: 'దైవ వాక్యం',
      icon: <BookOpen size={18} color="#1a2d5a" />,
      items: [
        { name: 'Promise Archive', desc: 'View and manage all past verses', target: 'Promises' },
        { name: 'Publish New Word', desc: 'Create today\'s daily promise', target: 'New Promise' }
      ]
    },
    {
      id: 'system',
      title: 'System & Security',
      subtitle: 'వ్యవస్థ సెట్టింగులు',
      icon: <ShieldCheck size={18} color="#15803D" />,
      items: [
        { name: 'Online Meetings', desc: 'Schedule Zoom/Meet live sessions', target: 'Online Meetings' },
        { name: 'Force Metadata Sync', desc: 'Sync latest data from Salesforce', target: 'Dashboard' },
        { name: 'Access Audit Logs', desc: 'View recent administrative activity', target: 'Dashboard' }
      ]
    },
    {
      id: 'members',
      title: 'Member Engagement',
      subtitle: 'సభ్యుల నిర్వహణ',
      icon: <Users size={18} color="#c0392b" />,
      items: [
        { name: 'Push Hub', desc: 'Send alerts to all church members', target: 'Dashboard' },
        { name: 'App Preview', desc: 'Switch to member view experience', target: 'Dashboard' }
      ]
    }
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />
      
      {/* ── Admin Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>System Utilities</Text>
            <Text style={styles.headerSub}>Control Panel · Admin Portal</Text>
          </View>
          <View style={styles.logoBox}>
            <Image source={require('../../../assets/logo.png')} style={styles.logo} />
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {SECTIONS.map((section) => (
          <View key={section.id} style={styles.section}>
            <View style={styles.sectionHd}>
              <View style={styles.sectionIcon}>{section.icon}</View>
              <View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
              </View>
            </View>

            <View style={styles.cardContainer}>
              {section.items.map((item, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.toolRow, idx === section.items.length - 1 && { borderBottomWidth: 0 }]}
                  onPress={() => navigation.navigate(item.target)}
                >
                  <View style={styles.toolInfo}>
                    <Text style={styles.toolName}>{item.name}</Text>
                    <Text style={styles.toolDesc}>{item.desc}</Text>
                  </View>
                  <ChevronRight size={18} color="#D1D5DB" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.advancedBtn}>
          <Database size={16} color="#6B7280" />
          <Text style={styles.advancedTxt}>Advanced Developer Settings</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f7' },
  
  header: { backgroundColor: '#1a2d5a', paddingTop: Platform.OS === 'ios' ? 60 : 30, paddingHorizontal: 20, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSub: { color: '#aac4e8', fontSize: 11, fontWeight: '500' },
  logoBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  logo: { width: 30, height: 30 },

  scroll: { padding: 12, paddingBottom: 40 },

  section: { marginBottom: 25 },
  sectionHd: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 12, paddingHorizontal: 4 },
  sectionIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#1a2d5a', letterSpacing: 0.5 },
  sectionSubtitle: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },

  cardContainer: { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', borderWidth: 0.5, borderColor: '#e5e7eb', elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  toolRow: { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6' },
  toolInfo: { flex: 1 },
  toolName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  toolDesc: { fontSize: 12, color: '#6B7280', marginTop: 3 },

  advancedBtn: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 15 },
  advancedTxt: { fontSize: 12, color: '#6B7280', fontWeight: '600' }
});
