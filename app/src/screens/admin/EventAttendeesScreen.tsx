import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  StatusBar,
  TextInput,
  Alert,
  Platform,
  Modal,
  ToastAndroid,
  Image
} from 'react-native';
import { 
  ArrowLeft,
  Search,
  Download,
  QrCode,
  X,
  Share2,
  Building2
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import AttendanceService, { AttendanceRecord } from '../../services/AttendanceService';
import { useChurch } from '../../context/ChurchContext';
import firestore from '@react-native-firebase/firestore';

const { width } = Dimensions.get('window');

type FilterType = 'All' | 'Present' | 'Absent';

interface UnifiedMember {
  id: string;
  name: string;
  status: 'Present' | 'Absent';
  timestamp?: any;
  profilePicture?: string;
}

export default function EventAttendeesScreen({ navigation, route }: any) {
  const { eventId, eventName, churchId: routeChurchId } = route.params || {};
  const { activeChurch } = useChurch();

  // Multi-church isolation: prioritize activeChurch id or route param
  const churchId = activeChurch?.id || routeChurchId || '';
  const churchName = activeChurch?.name || route.params?.churchName || 'Church';
  const churchCode = activeChurch?.churchCode || '';
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('Present');
  const [showQRModal, setShowQRModal] = useState(false);
  const qrRef = useRef<any>(null);
  
  const [allMembers, setAllMembers] = useState<UnifiedMember[]>([]);
  const [presentCount, setPresentCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);
  const [userPhotos, setUserPhotos] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();

    if (!churchId || !eventId) return;

    const unsub = firestore()
      .collection('churches')
      .doc(churchId)
      .collection('events')
      .doc(eventId)
      .collection('attendees')
      .onSnapshot(() => {
        fetchData();
      }, (err) => {
        console.warn('[EventAttendees] Realtime listener error:', err?.message);
      });

    return () => unsub();
  }, [eventId, churchId]);

  const fetchUserPhotos = async (): Promise<Record<string, string>> => {
    try {
      const snap = await firestore().collection('users').where('photoURL', '!=', null).limit(150).get();
      const photos: Record<string, string> = {};
      snap.forEach(doc => {
        const data = doc.data();
        if (data.photoURL) {
          if (data.phone) {
            const cleanPhone = data.phone.replace(/\D/g, '').slice(-10);
            photos[cleanPhone] = data.photoURL;
          }
          if (data.sfContactId) photos[data.sfContactId] = data.photoURL;
          photos[doc.id] = data.photoURL;
        }
      });
      setUserPhotos(photos);
      return photos;
    } catch (error) {
      console.log('[EventAttendees] Error fetching photos:', error);
      return {};
    }
  };

  const fetchData = async () => {
    if (!churchId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch photos and multi-church data in parallel
      const [photosMap, attendees, churchMembers] = await Promise.all([
        fetchUserPhotos(),
        AttendanceService.getEventAttendees(churchId, eventId),
        AttendanceService.getChurchMembers(churchId)
      ]);

      const attendedMap = new Map<string, any>();
      attendees.forEach(a => {
        const id = a.memberId || a.id;
        if (id) {
          attendedMap.set(id, a.timestamp);
        }
      });

      // Combine church members with event attendees
      const unifiedMap = new Map<string, UnifiedMember>();

      churchMembers.forEach((m: any) => {
        let photoUrl = m.photoURL || m.profilePicture || m.avatarUrl || undefined;
        const phoneToUse = m.MobilePhone || m.phone;
        if (!photoUrl && phoneToUse) {
          const cleanPhone = String(phoneToUse).replace(/\D/g, '').slice(-10);
          photoUrl = photosMap[cleanPhone];
        }
        
        const mId = m.id || m.Id;
        if (mId) {
          unifiedMap.set(mId, {
            id: mId,
            name: m.name || m.Name || 'Member',
            status: attendedMap.has(mId) ? 'Present' : 'Absent',
            timestamp: attendedMap.get(mId),
            profilePicture: photoUrl || photosMap[mId]
          });
        }
      });

      // Add attendees who might not be in the church member list (e.g. visitors, guests)
      attendees.forEach(a => {
        const mId = a.memberId || a.id;
        if (mId && !unifiedMap.has(mId)) {
          unifiedMap.set(mId, {
            id: mId,
            name: a.memberName || 'Unknown',
            status: 'Present',
            timestamp: a.timestamp,
            profilePicture: a.photoUrl || photosMap[mId]
          });
        }
      });

      const unifiedList = Array.from(unifiedMap.values());
      
      // Sort: Present first (sorted by time desc), then Absent (sorted by name)
      unifiedList.sort((a, b) => {
        if (a.status === 'Present' && b.status === 'Present') {
           const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp || 0).getTime();
           const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp || 0).getTime();
           return timeB - timeA;
        }
        if (a.status === 'Present') return -1;
        if (b.status === 'Present') return 1;
        return a.name.localeCompare(b.name);
      });

      setAllMembers(unifiedList);
      setPresentCount(unifiedList.filter(m => m.status === 'Present').length);
      setAbsentCount(unifiedList.filter(m => m.status === 'Absent').length);

    } catch (error) {
      console.error('[EventAttendees] Error fetching event data:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayList = useMemo(() => {
    let filtered = allMembers;
    
    if (activeFilter === 'Present') filtered = filtered.filter(m => m.status === 'Present');
    if (activeFilter === 'Absent') filtered = filtered.filter(m => m.status === 'Absent');
    
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(m => m.name.toLowerCase().includes(q));
    }
    
    return filtered;
  }, [allMembers, activeFilter, searchQuery]);

  const formatTime = (dateObj: any) => {
    if (!dateObj) return '';
    try {
      const date = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#dbeafe', '#fee2e2', '#dcfce7', '#fef3c7', '#f3e8ff', '#e0e7ff'];
    const textColors = ['#1e40af', '#991b1b', '#166534', '#92400e', '#6b21a8', '#3730a3'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const index = Math.abs(hash) % colors.length;
    return { bg: colors[index], text: textColors[index] };
  };

  const handleDownloadQR = async () => {
    if (qrRef.current) {
      qrRef.current.toDataURL(async (data: string) => {
        try {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant permission to save images to your gallery.');
            return;
          }

          const filename = `church-${(churchCode || 'qr').toLowerCase()}-attendance.png`;
          const filepath = FileSystem.documentDirectory + filename;
          await FileSystem.writeAsStringAsync(filepath, data, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          await MediaLibrary.saveToLibraryAsync(filepath);
          
          if (Platform.OS === 'android') {
            ToastAndroid.show('QR Code saved to gallery', ToastAndroid.SHORT);
          } else {
            Alert.alert('Success', 'QR Code saved to gallery');
          }
        } catch (error) {
          Alert.alert("Error", "Failed to save QR Code.");
        }
      });
    }
  };

  const handleShareQR = () => {
    if (qrRef.current) {
      qrRef.current.toDataURL(async (data: string) => {
        try {
          const filename = `church-${(churchCode || 'qr').toLowerCase()}-attendance.png`;
          const filepath = FileSystem.documentDirectory + filename;
          await FileSystem.writeAsStringAsync(filepath, data, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(filepath, {
              mimeType: 'image/png',
              dialogTitle: `${churchName} Attendance QR Code`,
            });
          } else {
            Alert.alert("Success", "QR Code has been generated.");
          }
        } catch (error) {
          Alert.alert("Error", "Failed to share QR Code.");
        }
      });
    }
  };

  // Dynamic Multi-Church QR Payload
  const qrCodeValue = useMemo(() => {
    return AttendanceService.generateAttendanceQRPayload(
      churchId,
      churchName,
      churchCode,
      eventId,
      eventName
    );
  }, [churchId, churchName, churchCode, eventId, eventName]);

  const renderItem = ({ item }: { item: UnifiedMember }) => {
    const avatar = getAvatarColor(item.name);
    const photoUrl = item.profilePicture || userPhotos[item.id];
    
    return (
      <View style={styles.attendeeCard}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: avatar.bg }]}>
            <Text style={[styles.avatarText, { color: avatar.text }]}>{getInitials(item.name)}</Text>
          </View>
        )}
        <View style={styles.attendeeInfo}>
          <Text style={styles.attendeeName}>{item.name}</Text>
          {item.status === 'Present' && (
            <Text style={styles.timeText}>{formatTime(item.timestamp)}</Text>
          )}
        </View>
        <View style={[
          styles.badge, 
          { backgroundColor: item.status === 'Present' ? '#dcfce7' : '#f1f5f9' }
        ]}>
          <Text style={[
            styles.badgeText, 
            { color: item.status === 'Present' ? '#16a34a' : '#64748b' }
          ]}>{item.status}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* ── Page Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>{eventName || 'Event Attendees'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <Building2 size={13} color="#64748b" />
              <Text style={styles.headerSub} numberOfLines={1}>{churchName}</Text>
              {churchCode ? (
                <View style={styles.churchCodeBadge}>
                  <Text style={styles.churchCodeBadgeTxt}>{churchCode}</Text>
                </View>
              ) : null}
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity 
              style={styles.iconBtn} 
              onPress={() => setShowQRModal(true)}
              accessibilityLabel="Show QR Code"
            >
              <QrCode size={26} color="#0f172a" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Multi-Church QR Code Modal ── */}
      <Modal visible={showQRModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.modalTitle}>Scan for Attendance</Text>
                <Text style={styles.modalSub} numberOfLines={1}>{churchName}</Text>
                {eventName ? (
                  <Text style={styles.modalEventSub} numberOfLines={1}>Event: {eventName}</Text>
                ) : null}
              </View>
              <TouchableOpacity style={styles.modalCloseIconBtn} onPress={() => setShowQRModal(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            {/* Branded QR Container */}
            <View style={styles.qrContainer}>
              <QRCode 
                getRef={(c) => (qrRef.current = c)}
                value={qrCodeValue}
                size={220}
                color="#0f172a"
                backgroundColor="#ffffff"
              />
            </View>

            <Text style={styles.qrInstructions}>
              Members scan this code with the WeChristian app to mark attendance for this church.
            </Text>
            
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
              <TouchableOpacity 
                style={styles.modalActionIconBtn} 
                onPress={handleDownloadQR}
                accessibilityLabel="Save QR to Gallery"
              >
                <Download size={24} color="#1e293b" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalActionIconBtn} 
                onPress={handleShareQR}
                accessibilityLabel="Share QR Code"
              >
                <Share2 size={24} color="#1e293b" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Search Bar ── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search members"
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* ── Filter Pills ── */}
      <View style={styles.pillContainer}>
        {(['All', 'Present', 'Absent'] as FilterType[]).map((f) => {
          let countStr = '';
          if (f === 'All') countStr = ` ${allMembers.length}`;
          if (f === 'Present') countStr = ` ${presentCount}`;
          if (f === 'Absent') countStr = ` ${absentCount}`;
          
          return (
            <TouchableOpacity 
              key={f} 
              style={[styles.pill, activeFilter === f && styles.pillActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.pillText, activeFilter === f && styles.pillTextActive]}>
                {f}{countStr}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* ── List ── */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#1a2d5a" />
        </View>
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 50,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 4
  },
  headerSub: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  churchCodeBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  churchCodeBadgeTxt: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#4338CA',
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    borderRadius: 12,
    backgroundColor: '#ffffff'
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 26,
    width: '100%',
    alignItems: 'center',
    maxWidth: 380,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
    alignItems: 'flex-start'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  modalSub: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  modalEventSub: {
    fontSize: 12.5,
    color: '#0284C7',
    fontWeight: '600',
    marginTop: 2,
  },
  modalCloseIconBtn: {
    padding: 4,
    marginLeft: 12,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 14,
  },
  qrInstructions: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  modalActionIconBtn: {
    backgroundColor: '#f1f5f9',
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
  },

  pillContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 12,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pillActive: {
    backgroundColor: '#1e293b',
    borderColor: '#1e293b',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  pillTextActive: {
    color: '#ffffff',
  },

  listContainer: { paddingBottom: 40, paddingHorizontal: 24 },
  
  attendeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#f1f5f9'
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700'
  },
  attendeeInfo: {
    flex: 1
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4
  },
  timeText: {
    fontSize: 13,
    color: '#64748b'
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600'
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60
  }
});
