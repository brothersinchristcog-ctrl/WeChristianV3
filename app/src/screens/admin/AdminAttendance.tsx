import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, XCircle, Clock, Calendar, Users, Send } from 'lucide-react-native';
import FirestoreService from '../../services/FirestoreService';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function AdminAttendance() {
  const { activeChurch } = useChurch();
  const { isDark } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  
  // New Request Form
  const [showNewForm, setShowNewForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeChurch]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const request = await FirestoreService.getActiveAttendanceRequest();
      setActiveRequest(request);
      
      const members = await FirestoreService.searchMembers('');
      setAllMembers(members);
      
      if (request) {
        const resps = await FirestoreService.getAttendanceResponses(request.id);
        setResponses(resps);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const requestId = await FirestoreService.createAttendanceRequest({
        title: title.trim(),
        description: description.trim(),
        date: todayStr
      });
      
      // Trigger Notification
      await FirestoreService.createNotificationBroadcast({
        title: 'Attendance Request',
        content: `Are you attending ${title.trim()} today?`,
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        type: 'attendance', 
        targetUrl: 'AttendanceScreen' // deep link hint
      });
      
      Alert.alert('Success', 'Attendance request created and notifications sent to all members.');
      setShowNewForm(false);
      setTitle('');
      setDescription('');
      fetchData();
    } catch (e) {
      Alert.alert('Error', 'Failed to create request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute counts
  const yesResponses = responses.filter(r => r.response === 'Yes');
  const noResponses = responses.filter(r => r.response === 'No');
  const pendingMembers = allMembers.filter(m => !responses.find(r => r.memberId === m.id));
  
  // Safe colors based on theme
  const bgColor = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1a2d5a" />
      </View>
    );
  }

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {!activeRequest || showNewForm ? (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.cardHeader}>
              <Calendar color="#1a2d5a" size={24} />
              <Text style={[styles.cardTitle, { color: textColor }]}>New Attendance Request</Text>
            </View>
            <Text style={[styles.cardDesc, { color: subTextColor }]}>
              Create a new request for today's service or event. This will notify all members in the church.
            </Text>
            
            <Text style={[styles.inputLabel, { color: textColor }]}>Event Title *</Text>
            <TextInput
              style={[styles.input, { color: textColor, borderColor }]}
              placeholder="e.g., Sunday Worship Service"
              placeholderTextColor={subTextColor}
              value={title}
              onChangeText={setTitle}
            />
            
            <Text style={[styles.inputLabel, { color: textColor }]}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, { color: textColor, borderColor, height: 80, textAlignVertical: 'top' }]}
              placeholder="e.g., Special guest speaker today..."
              placeholderTextColor={subTextColor}
              value={description}
              onChangeText={setDescription}
              multiline
            />
            
            <TouchableOpacity 
              style={[styles.btnPrimary, { opacity: isSubmitting ? 0.7 : 1 }]} 
              onPress={handleCreateRequest}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Send color="#fff" size={18} style={{ marginRight: 8 }} />
                  <Text style={styles.btnPrimaryText}>Send to All Members</Text>
                </>
              )}
            </TouchableOpacity>
            
            {activeRequest && (
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setShowNewForm(false)}>
                <Text style={[styles.btnSecondaryText, { color: subTextColor }]}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {/* Dashboard Header */}
            <View style={[styles.activeHeader, { backgroundColor: cardBg, borderColor }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.activeTitle, { color: textColor }]}>{activeRequest.title}</Text>
                <Text style={[styles.activeDate, { color: subTextColor }]}>
                  {new Date(activeRequest.createdAt?.toDate?.() || Date.now()).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
              </View>
              <TouchableOpacity style={styles.newBtn} onPress={() => setShowNewForm(true)}>
                <Text style={styles.newBtnText}>New</Text>
              </TouchableOpacity>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: cardBg, borderColor }]}>
                <CheckCircle color="#10b981" size={24} />
                <Text style={[styles.statNum, { color: '#10b981' }]}>{yesResponses.length}</Text>
                <Text style={[styles.statLbl, { color: subTextColor }]}>Attending</Text>
              </View>
              
              <View style={[styles.statCard, { backgroundColor: cardBg, borderColor }]}>
                <XCircle color="#ef4444" size={24} />
                <Text style={[styles.statNum, { color: '#ef4444' }]}>{noResponses.length}</Text>
                <Text style={[styles.statLbl, { color: subTextColor }]}>Not Attending</Text>
              </View>
              
              <View style={[styles.statCard, { backgroundColor: cardBg, borderColor }]}>
                <Clock color="#f59e0b" size={24} />
                <Text style={[styles.statNum, { color: '#f59e0b' }]}>{pendingMembers.length}</Text>
                <Text style={[styles.statLbl, { color: subTextColor }]}>Pending</Text>
              </View>
            </View>

            {/* Response Lists */}
            
            {/* YES */}
            {yesResponses.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Attending ({yesResponses.length})</Text>
                <View style={[styles.listCard, { backgroundColor: cardBg, borderColor }]}>
                  {yesResponses.map((r, i) => (
                    <View key={r.memberId} style={[styles.listItem, i < yesResponses.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor }]}>
                      <View style={styles.avatarMock}><Text style={styles.avatarTxt}>{r.memberName?.charAt(0) || 'U'}</Text></View>
                      <Text style={[styles.listItemName, { color: textColor }]}>{r.memberName}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* NO */}
            {noResponses.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Not Attending ({noResponses.length})</Text>
                <View style={[styles.listCard, { backgroundColor: cardBg, borderColor }]}>
                  {noResponses.map((r, i) => (
                    <View key={r.memberId} style={[styles.listItem, i < noResponses.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor }]}>
                      <View style={[styles.avatarMock, { backgroundColor: '#fee2e2' }]}><Text style={[styles.avatarTxt, { color: '#ef4444' }]}>{r.memberName?.charAt(0) || 'U'}</Text></View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.listItemName, { color: textColor }]}>{r.memberName}</Text>
                        {r.reason && <Text style={[styles.reasonTxt, { color: subTextColor }]}>Reason: {r.reason}</Text>}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* PENDING */}
            {pendingMembers.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Pending ({pendingMembers.length})</Text>
                <View style={[styles.listCard, { backgroundColor: cardBg, borderColor }]}>
                  {pendingMembers.map((m, i) => (
                    <View key={m.id} style={[styles.listItem, i < pendingMembers.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor }]}>
                      <View style={[styles.avatarMock, { backgroundColor: '#f3f4f6' }]}><Text style={[styles.avatarTxt, { color: '#64748b' }]}>{m.name?.charAt(0) || m.firstName?.charAt(0) || 'U'}</Text></View>
                      <Text style={[styles.listItemName, { color: textColor }]}>{m.name || m.firstName || 'Unknown Member'}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={{ height: 40 }} />
          </>
        )}
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 20, fontWeight: '700', marginLeft: 12 },
  cardDesc: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginLeft: 4 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 20 },
  
  btnPrimary: { backgroundColor: '#1a2d5a', borderRadius: 12, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnSecondary: { paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnSecondaryText: { fontSize: 15, fontWeight: '600' },

  activeHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  activeTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  activeDate: { fontSize: 13 },
  newBtn: { backgroundColor: '#1a2d5a', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  newBtnText: { color: '#FCD34D', fontWeight: '700', fontSize: 13 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, gap: 12 },
  statCard: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 16, alignItems: 'center', elevation: 1 },
  statNum: { fontSize: 24, fontWeight: '800', marginVertical: 8 },
  statLbl: { fontSize: 12, fontWeight: '500' },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, marginLeft: 4 },
  listCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatarMock: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarTxt: { color: '#1e3a8a', fontWeight: '700', fontSize: 16 },
  listItemName: { fontSize: 15, fontWeight: '600' },
  reasonTxt: { fontSize: 13, marginTop: 4, fontStyle: 'italic' }
});
