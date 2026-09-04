import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, Dimensions, Platform, Image, Modal } from 'react-native';
import { ChevronLeft, Search, CheckCircle2, SlidersHorizontal, Gift, Send, Info, CheckCircle, X } from 'lucide-react-native';
import FirestoreService from '../../services/FirestoreService';
import { useChurch } from '../../context/ChurchContext';
import Theme from '../../theme/Theme';

const { width } = Dimensions.get('window');

const MemberAvatar = ({ member, initials, styles, bgColor }: any) => {
  const [imgError, setImgError] = React.useState(false);
  const possibleUrls = [
    member.profilePhoto, member.photoURL, member.photoUrl, 
    member.ProfilePhoto, member.profileImage, member.Photo, 
    member.PhotoUrl, member.photo
  ];
  const validUrl = possibleUrls.find((url: any) => typeof url === 'string' && url.trim() !== '' && url !== 'null' && url !== 'undefined');

  if (validUrl && !imgError) {
    return (
      <Image 
        source={{ uri: validUrl.trim() }} 
        style={styles.avatar} 
        resizeMode="cover"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <View style={[styles.avatar, { backgroundColor: bgColor }]}>
      <Text style={styles.avatarTxt}>{initials}</Text>
    </View>
  );
};

export default function AdminCelebrationsList({ category, activeTab, onSelectMember }: { category: string, activeTab: string, onSelectMember: (member: any) => void }) {
  const { activeChurch } = useChurch();
  const [loading, setLoading] = useState(true);
  const [isSendingAll, setIsSendingAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await FirestoreService.getAllCelebrations();
        
        const getValidPhotoUrl = (obj: any) => {
          const fields = ['ProfilePhoto', 'profilePhoto', 'Photo', 'photoUrl', 'photoURL', 'PhotoUrl', 'photo', 'profileImageUrl'];
          for (const f of fields) {
            if (obj[f] && typeof obj[f] === 'string' && obj[f].trim() !== '' && obj[f] !== 'null' && obj[f] !== 'undefined') return obj[f].trim();
          }
          return null;
        };

        let processed: any[] = [];
        
        const processEvent = (d: any, dateField: string, type: string) => {
            if (!d[dateField]) return null;
            const parts = d[dateField].split('-');
            if (parts.length < 3) return null;
            
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
              id: (d.Id || d.id) + '_' + type, // Make ID unique per event type
              originalId: d.Id || d.id,
              name: d.Name || 'Unknown',
              initials: initials.toUpperCase(),
              photoUrl: getValidPhotoUrl(d),
              dateStr,
              age,
              phone: d.MobilePhone || d.Phone || '',
              rawMonth: month,
              rawDay: day,
              celebrationType: type // 'Birthday', 'Wedding Anniversary', 'Baptism Anniversary'
            };
        };

        if (category === 'All') {
            data.forEach((d: any) => {
                const bday = processEvent(d, 'dob', 'Birthday');
                const wedding = processEvent(d, 'anniversaryDate', 'Wedding Anniversary');
                const baptism = processEvent(d, 'baptismDate', 'Baptism Anniversary');
                
                if (bday) processed.push(bday);
                if (wedding) processed.push(wedding);
                if (baptism) processed.push(baptism);
            });
        } else {
            let dateField = '';
            if (category === 'Birthday') dateField = 'dob';
            else if (category === 'Wedding Anniversary') dateField = 'anniversaryDate';
            else if (category === 'Baptism Anniversary') dateField = 'baptismDate';
            
            if (dateField) {
                processed = data.filter((d: any) => !!d[dateField]).map((d: any) => processEvent(d, dateField, category)).filter(Boolean);
            }
        }
        
        // Sort processed list by closest date to today (upcoming)
        processed.sort((a, b) => {
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;
            const currentDay = now.getDate();
            const todayTime = new Date(currentYear, currentMonth - 1, currentDay).getTime();
            
            const aDate = new Date(currentYear, a.rawMonth - 1, a.rawDay).getTime();
            const bDate = new Date(currentYear, b.rawMonth - 1, b.rawDay).getTime();
            
            let aDiff = aDate - todayTime;
            let bDiff = bDate - todayTime;
            
            // Push past dates to end
            if (aDiff < 0) aDiff += 31536000000; // rough year in ms
            if (bDiff < 0) bDiff += 31536000000;
            
            return aDiff - bDiff;
        });
        
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

  const handleAutoSendAll = async () => {
    if (filteredMembers.length === 0) return;
    setShowConfirmModal(true);
  };

  const executeAutoSendAll = async () => {
    setShowConfirmModal(false);
    setIsSendingAll(true);
    try {
      for (const member of filteredMembers) {
        const memberCelebrationType = member.celebrationType || category;
        const title = `${memberCelebrationType === 'Birthday' ? '🎂 Happy Birthday' : memberCelebrationType === 'Wedding Anniversary' ? '💒 Happy Anniversary' : '🎉 Happy Baptism Anniversary'}, ${member.name}!`;
        let content = `Praise the Lord!\n\nDear ${member.name}, wishing you a very Happy ${memberCelebrationType}! May God bless you abundantly.\n\nWith Love ❤️\n${activeChurch?.name || 'Your Church'}`;
        
        await FirestoreService.createNotificationBroadcast({
          title,
          content,
          date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
          type: 'celebration',
          targetChurchId: activeChurch?.id || 'KhmBeNWxlrxwS1hGhuw',
          targetPhone: member.phone,
          silent: false,
        });
      }
      setSuccessMessage(`Automated wishes sent to ${filteredMembers.length} members!`);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error auto sending:', err);
      Alert.alert('Error', 'An error occurred while sending automated wishes.');
    } finally {
      setIsSendingAll(false);
    }
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

        <View style={styles.listHeaderRow}>
          <Text style={styles.foundText}>{filteredMembers.length} members found</Text>
          {activeTab === 'Today' && filteredMembers.length > 0 && (
            <TouchableOpacity style={styles.autoSendBtn} onPress={handleAutoSendAll} disabled={isSendingAll}>
              {isSendingAll ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Send size={14} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.autoSendBtnTxt}>Auto-Send All</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* List */}
        {filteredMembers.map((member, idx) => (
          <TouchableOpacity key={member.id || idx} style={styles.memberCard} onPress={() => onSelectMember(member)}>
            
            {/* Avatar */}
            <MemberAvatar 
              member={member} 
              initials={member.initials || (member.name ? member.name.substring(0, 2).toUpperCase() : 'U')} 
              styles={styles} 
              bgColor={getAvatarColor(member.name)} 
            />
            
            {/* Info */}
            <View style={styles.memberInfo}>
              <Text style={styles.memberName} numberOfLines={1}>{member.name}</Text>
              <View style={styles.memberMetaRow}>
                <View style={styles.tag}>
                  <Text style={styles.tagTxt} numberOfLines={1} adjustsFontSizeToFit>{member.celebrationType ? member.celebrationType.toUpperCase() : category.toUpperCase()}</Text>
                </View>
                <Text style={styles.metaTxt}>• {member.dateStr} {member.age ? `• ${member.age} yrs` : ''}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

      </ScrollView>

      {/* Confirm Auto-Send Modal */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalIconBox, { backgroundColor: '#E0E7FF' }]}>
              <Info size={32} color="#4338CA" />
            </View>
            <Text style={styles.modalTitle}>Confirm Auto-Send</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to automatically send push notifications to all {filteredMembers.length} members celebrating today?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowConfirmModal(false)}>
                <Text style={styles.modalCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={executeAutoSendAll}>
                <Text style={styles.modalConfirmTxt}>Send to All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowSuccessModal(false)}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
            <View style={[styles.modalIconBox, { backgroundColor: '#D1FAE5' }]}>
              <CheckCircle size={32} color="#10B981" />
            </View>
            <Text style={styles.modalTitle}>Success!</Text>
            <Text style={styles.modalMessage}>{successMessage}</Text>
            <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setShowSuccessModal(false)}>
              <Text style={styles.modalDoneTxt}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  backBtn: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 2, paddingVertical: 4, paddingHorizontal: 2 },
  backBtnTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },
  heroTitles: { flex: 1, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)', paddingLeft: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: '#F3EAD9', marginTop: 2 },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  autoSendBtn: {
    backgroundColor: '#37469B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  autoSendBtnTxt: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  
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
    borderColor: '#D4AF37',
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
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelTxt: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#37469B',
    alignItems: 'center',
  },
  modalConfirmTxt: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  modalDoneBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
  },
  modalDoneTxt: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  }
});
