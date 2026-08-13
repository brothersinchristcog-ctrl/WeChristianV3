import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, ActivityIndicator, StatusBar, Platform, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Calendar, Clock, User, BookOpen, Radio, ExternalLink, LogOut, Video } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useChurch } from '../context/ChurchContext';
import firestore from '@react-native-firebase/firestore';

const BRAND = '#1a2d5a';
const LIVE_COLOR = '#ef4444';
const SUCCESS = '#10b981';

export default function OnlineMeetingDetailScreen({ navigation, route }: any) {
  const { meeting } = route.params;
  const { isDark } = useTheme();
  const { user, member } = useAuth();
  const { activeChurch } = useChurch();

  const [hasJoined, setHasJoined] = useState(false);
  const [loading, setLoading] = useState(true);

  // Colors
  const bgColor = isDark ? '#0f172a' : '#f8fafc';
  const cardColor = isDark ? '#1e293b' : '#fff';
  const textColor = isDark ? '#fff' : '#1e293b';
  const mutedText = isDark ? '#94a3b8' : '#64748b';

  useEffect(() => {
    if (!activeChurch?.id || !meeting?.id || !member?.id) {
      setLoading(false);
      return;
    }

    const unsubscribe = firestore()
      .collection('churches')
      .doc(activeChurch.id)
      .collection('online_meetings')
      .doc(meeting.id)
      .collection('attendees')
      .doc(member.id)
      .onSnapshot((doc) => {
        setHasJoined(doc.exists);
        setLoading(false);
      }, (error) => {
        console.error("Attendance listener error:", error);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [activeChurch?.id, meeting?.id, member?.id]);

  const handleJoin = async () => {
    if (!activeChurch?.id || !meeting?.id || !member?.id) return;
    
    try {
      await firestore()
        .collection('churches')
        .doc(activeChurch.id)
        .collection('online_meetings')
        .doc(meeting.id)
        .collection('attendees')
        .doc(member.id)
        .set({
          name: member.name || user?.displayName || 'Unknown Member',
          profilePhoto: (member as any).profilePhoto || (member as any).photoURL || user?.photoURL || null,
          joinedAt: firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
      if (meeting.meetingLink) {
        Linking.openURL(meeting.meetingLink);
      } else {
        Alert.alert("No Link", "The meeting link is not available yet.");
      }
    } catch (e) {
      console.log('Attendance log error:', e);
      Alert.alert("Error", "Failed to join meeting.");
    }
  };

  const handleLeave = async () => {
    if (!activeChurch?.id || !meeting?.id || !member?.id) return;
    try {
      await firestore()
        .collection('churches')
        .doc(activeChurch.id)
        .collection('online_meetings')
        .doc(meeting.id)
        .collection('attendees')
        .doc(member.id)
        .delete();
    } catch (e) {
      console.log('Leave error:', e);
      Alert.alert("Error", "Failed to leave meeting.");
    }
  };

  const formattedDate = meeting.startTime 
    ? new Date(meeting.startTime.seconds * 1000).toLocaleDateString('en-GB').replace(/\//g, '-') 
    : 'TBA';
    
  const formattedTime = meeting.startTime 
    ? new Date(meeting.startTime.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    : 'TBA';

  const isCompleted = meeting.status === 'completed' || (meeting.endTime && new Date(meeting.endTime.seconds * 1000) < new Date());
  
  const isLive = meeting.status === 'live' || (
    meeting.startTime && meeting.endTime && 
    new Date(meeting.startTime.seconds * 1000) <= new Date() && 
    new Date(meeting.endTime.seconds * 1000) >= new Date()
  );

  const gradStart = isLive ? '#c0392b' : isCompleted ? '#374151' : '#1a2d5a';
  const gradEnd   = isLive ? '#991b1b' : isCompleted ? '#1f2937' : '#0f1e3d';


  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meeting Details</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.gradCard, { backgroundColor: gradStart }]}>
          {/* Decorative circle */}
          <View style={[styles.gradCircle, { backgroundColor: gradEnd }]} />

          {/* Title */}
          <Text style={styles.gradTitle} numberOfLines={3}>
            {meeting.title || 'Online Meeting'}
          </Text>

          {/* Subtitle / Topic */}
          {(meeting.subtitle || meeting.topic || meeting.bibleBook) ? (
            <Text style={styles.gradSubtitle} numberOfLines={2}>
              {meeting.subtitle || meeting.topic || meeting.bibleBook}
            </Text>
          ) : null}

          {/* Divider */}
          <View style={styles.gradDivider} />

          {/* Info rows */}
          <View style={styles.gradInfoRow}>
            <Calendar size={18} color="rgba(255,255,255,0.75)" />
            <Text style={styles.gradInfoText}>{formattedDate}</Text>
          </View>

          <View style={styles.gradInfoRow}>
            <Clock size={18} color="rgba(255,255,255,0.75)" />
            <Text style={styles.gradInfoText}>{formattedTime}</Text>
          </View>

          {meeting.teacher && (
            <View style={styles.gradInfoRow}>
              <User size={18} color="rgba(255,255,255,0.75)" />
              <Text style={styles.gradInfoText}>Host: {meeting.teacher}</Text>
            </View>
          )}
          
          {meeting.description && (
            <View style={[styles.gradInfoRow, { alignItems: 'flex-start', marginTop: 8 }]}>
              <BookOpen size={18} color="rgba(255,255,255,0.75)" style={{ marginTop: 2 }} />
              <Text style={[styles.gradInfoText, { lineHeight: 22, opacity: 0.9 }]}>{meeting.description}</Text>
            </View>
          )}

          {/* Action buttons */}
          {isCompleted ? (
            <View style={[styles.gradActions, { marginTop: 20, justifyContent: 'center' }]}>
              <View style={[styles.gradLeaveBtn, { borderWidth: 0, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 32 }]}>
                <Text style={[styles.gradLeaveText, { opacity: 0.9 }]}>Meeting Completed</Text>
              </View>
            </View>
          ) : (
            <View style={[styles.gradActions, { marginTop: 20 }]}>
              {loading ? (
                <ActivityIndicator size="small" color="#fff" style={{ marginVertical: 10 }} />
              ) : hasJoined ? (
                <>
                  {/* Joined / Open Link */}
                  <TouchableOpacity
                    style={[styles.gradJoinBtn, { backgroundColor: '#fff' }]}
                    onPress={() => meeting.meetingLink ? Linking.openURL(meeting.meetingLink) : Alert.alert('No Link', 'Meeting link is not available.')}
                  >
                    <Video size={16} color={gradStart} />
                    <Text style={[styles.gradJoinText, { color: gradStart }]}>Joined</Text>
                  </TouchableOpacity>

                  {/* Leave */}
                  <TouchableOpacity
                    style={styles.gradLeaveBtn}
                    onPress={handleLeave}
                  >
                    <Text style={styles.gradLeaveText}>Leave</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.gradJoinBtn}
                  onPress={handleJoin}
                >
                  <Video size={16} color={gradStart} />
                  <Text style={[styles.gradJoinText, { color: gradStart }]}>
                    {isLive ? 'Join Live' : 'Join'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    backgroundColor: BRAND,
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight ?? 24) + 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.2 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Gradient card (Matching OnlineMeetingsScreen)
  gradCard: {
    borderRadius: 24,
    padding: 24,
    marginTop: 8,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  gradCircle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -60,
    right: -50,
    opacity: 0.4,
  },
  gradTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.2,
    lineHeight: 34,
    marginBottom: 6,
  },
  gradSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 16,
    lineHeight: 22,
  },
  gradDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: 20,
  },
  gradInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  gradInfoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  gradActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  gradJoinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  gradJoinText: {
    fontSize: 15,
    fontWeight: '800',
  },
  gradLeaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  gradLeaveText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
