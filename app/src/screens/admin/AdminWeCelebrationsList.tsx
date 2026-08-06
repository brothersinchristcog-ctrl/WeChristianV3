import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, FlatList, Dimensions, Platform, Image } from 'react-native';
import { ChevronLeft, Search, CheckCircle2, SlidersHorizontal, Gift } from 'lucide-react-native';
import FirestoreService from '../../services/FirestoreService';
import Theme from '../../theme/Theme';

const { width } = Dimensions.get('window');



export default function AdminWeCelebrationsList({ category, activeTab, onSelectMember }: { category: string, activeTab: string, onSelectMember: (member: any) => void }) {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await FirestoreService.getAllCelebrations();
        
        const getValidPhotoUrl = (obj: any) => {
          const fields = ['ProfilePhoto', 'profilePhoto', 'Photo', 'photoUrl', 'photoURL', 'PhotoUrl', 'photo', 'profileImageUrl'];
          for (const f of fields) {
            if (obj[f] && typeof obj[f] === 'string' && obj[f].trim().startsWith('http')) return obj[f].trim();
          }
          return null;
        };

        let processed: any[] = [];
        let dateField = '';
        if (category === 'Birthday') dateField = 'Birthdate';
        else if (category === 'Wedding Anniversary') dateField = 'Anniversary_Date__c';
        else if (category === 'Baptism Anniversary') dateField = 'Baptism_Date__c';
        
        if (dateField) {
          processed = data.filter(d => !!d[dateField]).map(d => {
            const parts = d[dateField].split('-');
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10);
            const day = parseInt(parts[2], 10);
            
            const currentYear = new Date().getFullYear();
            const age = year > 1900 ? currentYear - year : 0;
            
            // Format date e.g. "Jul 15"
            const dateObj = new Date(currentYear, month - 1, day);
            const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            // Calculate initials safely
            const nameParts = (d.Name || 'Unknown').trim().split(/\s+/);
            const initials = nameParts.length > 1 
              ? (nameParts[0][0] || '') + (nameParts[nameParts.length - 1][0] || '') 
              : (nameParts[0][0] || '').substring(0, 2);

            return {
              ...d,
              id: d.Id || d.id,
              name: d.Name || 'Unknown',
              initials: initials.toUpperCase(),
              photoUrl: getValidPhotoUrl(d),
              dateStr,
              age,
              phone: d.MobilePhone || d.Phone || '',
              rawMonth: month,
              rawDay: day
            };
          });
        }
        
        setMembers(processed);
      } catch (err) {
        console.error("Error loading list:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [category]);

  const filteredMembers = members.filter(m => {
    if (searchQuery) {
      if (!m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    }
    
    if (activeTab === 'All') return true;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentDay = now.getDate();

    // Create a date object for this year's occurrence of the event
    const eventThisYear = new Date(currentYear, m.rawMonth - 1, m.rawDay);
    
    // Calculate difference in days from today to the event (ignoring time)
    const diffTime = eventThisYear.getTime() - new Date(currentYear, currentMonth - 1, currentDay).getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (activeTab === 'Today') {
      return diffDays === 0;
    } else if (activeTab === 'Upcoming') {
      return diffDays > 0;
    } else if (activeTab === 'Week') {
      return diffDays >= 0 && diffDays <= 7;
    } else if (activeTab === 'Month') {
      return m.rawMonth === currentMonth;
    } else if (activeTab === 'Past') {
      return diffDays < 0;
    }

    return true;
  });

  const getAvatarColor = (name: string) => {
    const colors = ['#734062', '#1A4F5B', '#42518E', '#D97736'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#BE9A3A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        <View style={[styles.searchRow, { marginRight: 0 }]}>
          <View style={[styles.searchBox, { marginRight: 0 }]}>
            <Search size={18} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Search by name..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <Text style={styles.foundText}>{filteredMembers.length} members found</Text>

        {/* List */}
        {filteredMembers.map((member, idx) => (
          <TouchableOpacity key={member.id || idx} style={styles.memberCard} onPress={() => onSelectMember(member)}>
            
            {/* Avatar */}
            <View style={[styles.avatar, { backgroundColor: getAvatarColor(member.name) }]}>
              {member.photoUrl && typeof member.photoUrl === 'string' && member.photoUrl.startsWith('http') ? (
                <Image source={{ uri: member.photoUrl }} style={{ width: 56, height: 56, borderRadius: 28 }} />
              ) : (
                <Text style={styles.avatarTxt}>{member.initials || (member.name ? member.name.substring(0, 2).toUpperCase() : 'U')}</Text>
              )}
            </View>
            
            {/* Info */}
            <View style={styles.memberInfo}>
              <Text style={styles.memberName} numberOfLines={1}>{member.name}</Text>
              <View style={styles.memberMetaRow}>
                <View style={styles.tag}>
                  <Text style={styles.tagTxt}>{category.toUpperCase()}</Text>
                </View>
                <Text style={styles.metaTxt}> · {member.dateStr} · {member.age} yrs</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F0',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FAF8F0',
    justifyContent: 'center',
    alignItems: 'center'
  },
    header: { 
    backgroundColor: '#1a2d5a', 
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
    zIndex: 10,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4, paddingHorizontal: 2 },
  backBtnTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },
  heroTitles: { flex: 1, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)', paddingLeft: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: '#F3EAD9', marginTop: 2 },
  
  content: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  sectionTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  tabsScroll: {
    marginBottom: 20,
  },
  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtnActive: {
    backgroundColor: '#162057',
    borderColor: '#162057',
  },
  tabTxt: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTxtActive: {
    color: '#FFFFFF',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4AF37', // Gold border as in screenshot
  },
  foundText: {
    color: '#64748B',
    fontSize: 14,
    marginBottom: 16,
  },
  memberCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarTxt: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  memberMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    backgroundColor: '#FDE68A', // Yellow/Gold
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagTxt: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metaTxt: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  actionCol: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: 56,
    marginLeft: 12,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
