import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Dimensions,
  Platform,
  Share,
  Alert,
  Linking,
  ActivityIndicator
} from 'react-native';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ChevronLeft, 
  Share2, 
  Info,
  Play,
  Video,
  Radio,
  Lock,
  CheckCircle2
} from 'lucide-react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { findEventVideo } from '../services/YouTubeService';
import { useChurch } from '../context/ChurchContext';

const { width, height } = Dimensions.get('window');

/**
 * Determine event status:
 *  - 'upcoming' : event date+startTime is in the future
 *  - 'live'     : right now is between startTime and endTime on event date
 *  - 'completed': event date+endTime is in the past
 */
function getEventStatus(event: any): 'upcoming' | 'live' | 'completed' {
  const today = new Date();

  // Parse date string like "2026-06-10"
  const dateParts = (event.date || '').split('-');
  const eventYear = parseInt(dateParts[0]) || today.getFullYear();
  const eventMonth = parseInt(dateParts[1]) - 1 || 0;
  const eventDay = parseInt(dateParts[2]) || today.getDate();

  const parseTime = (timeStr: string) => {
    if (!timeStr) return null;
    // Handles ISO "2026-06-10T10:00:00.000+0000" or "10:00:00"
    const timePart = timeStr.includes('T') ? timeStr.split('T')[1] : timeStr;
    const [h, m, s] = timePart.split(':').map(Number);
    const d = new Date(eventYear, eventMonth, eventDay, h || 0, m || 0, s || 0);
    return d;
  };

  const startDt = parseTime(event.startTime);
  const endDt = parseTime(event.endTime);

  if (!startDt) {
    // No time info — use date only
    const eventDate = new Date(eventYear, eventMonth, eventDay, 23, 59, 59);
    return today > eventDate ? 'completed' : 'upcoming';
  }

  if (today < startDt) return 'upcoming';
  if (endDt && today > endDt) return 'completed';
  return 'live';
}

export default function EventDetailsScreen({ route, navigation }: any) {
  const { event } = route.params;
  const { activeChurch } = useChurch();

  const status = getEventStatus(event);
  const manualYoutubeId = event.youtubeId;
  
  const churchYoutubeHandle = activeChurch?.socialLinks?.youtube || ''; // e.g. @MyChurch

  const [autoYoutubeId, setAutoYoutubeId] = useState<string | null>(null);
  const [videoSearching, setVideoSearching] = useState(false);

  useEffect(() => {
    // Only auto-search YouTube if event is completed, no manual ID, and we have a handle
    if (status === 'completed' && !manualYoutubeId && churchYoutubeHandle) {
      setVideoSearching(true);
      findEventVideo(event.date, event.title || event.name || '', churchYoutubeHandle)
        .then(id => setAutoYoutubeId(id))
        .finally(() => setVideoSearching(false));
    }
  }, [event.id, status, manualYoutubeId, churchYoutubeHandle]);

  const youtubeId = manualYoutubeId || autoYoutubeId;
  const liveUrl = event.liveUrl || event.youtubeId
    ? `https://www.youtube.com/watch?v=${manualYoutubeId}`
    : churchYoutubeHandle ? `https://www.youtube.com/${churchYoutubeHandle}/streams` : '';

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '--:--';
    try {
      const timePart = timeStr.includes('T') ? timeStr.split('T')[1].split('.')[0] : timeStr;
      const [hours, minutes] = timePart.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 || 12;
      return `${displayH}:${minutes} ${ampm}`;
    } catch { return timeStr; }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return dateStr; }
  };

  const formatTeluguDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const monthsTe = ['జనవరి', 'ఫిబ్రవరి', 'మార్చి', 'ఏప్రిల్', 'మే', 'జూన్', 'జూలై', 'ఆగస్టు', 'సెప్టెంబర్', 'అక్టోబర్', 'నవంబర్', 'డిసెంబర్'];
      return `${monthsTe[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    } catch { return dateStr; }
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: `Join us for ${event.title || event.name} at ${event.address || event.location} on ${formatDate(event.date)}!`,
      });
    } catch (error) { console.log(error); }
  };

  const handleRSVP = () => {
    Alert.alert("Success · విజయం", "Thank you for your interest! We'll keep you updated.\nమీ ఆసక్తికి ధన్యవాదాలు! మేము మిమ్మల్ని అప్‌డేట్ చేస్తాము.");
  };

  // ── Status badge config ──
  const statusConfig = {
    upcoming: { label: 'UPCOMING', color: '#1a2d5a', bg: '#e0eaff', icon: <Clock size={12} color="#1a2d5a" /> },
    live:     { label: '● LIVE NOW', color: '#fff',    bg: '#dc2626', icon: <Radio size={12} color="#fff" /> },
    completed:{ label: 'COMPLETED',  color: '#16a34a', bg: '#dcfce7', icon: <CheckCircle2 size={12} color="#16a34a" /> },
  }[status];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* --- Hero Image Section --- */}
        <View style={styles.heroContainer}>
          <Image 
            source={{ uri: event.image || event.bannerUrl || 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=800' }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          {/* Gradient overlay */}
          <View style={styles.heroOverlay} />
          
          {/* Header Actions */}
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.circleBtn}
              onPress={() => navigation.goBack()}
            >
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.circleBtn}
              onPress={onShare}
            >
              <Share2 size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Status Badge on Hero */}
          <View style={[styles.heroBadge, { backgroundColor: statusConfig.bg }]}>
            {statusConfig.icon}
            <Text style={[styles.heroBadgeText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
          </View>
        </View>

        {/* --- Content Card --- */}
        <View style={styles.contentCard}>
          <View style={styles.indicator} />
          
          {/* Title Area */}
          <View style={styles.titleSection}>
            <Text style={styles.titleEn}>{event.title || event.name}</Text>
            <Text style={styles.titleTe}>{event.titleTelugu || event.titleTe || ''}</Text>
          </View>

          {/* Info Badges */}
          <View style={styles.badgeRow}>
            <View style={styles.dateBadge}>
              <Calendar size={16} color="#1a2d5a" />
              <View>
                <Text style={styles.badgeValue}>
                  {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
                <Text style={styles.badgeSubValue}>{formatTeluguDate(event.date)}</Text>
              </View>
            </View>

            <View style={styles.timeBadge}>
              <Clock size={14} color="#c0392b" />
              <View>
                <Text style={styles.timeValue}>{formatTime(event.startTime)} – {formatTime(event.endTime)}</Text>
                <Text style={styles.badgeSubValue}>Event Duration</Text>
              </View>
            </View>
          </View>

          {/* Location Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconCircle}>
                <MapPin size={18} color="#1a2d5a" />
              </View>
              <Text style={styles.sectionTitle}>LOCATION · స్థలం</Text>
            </View>
            <View style={styles.locCard}>
              <Text style={styles.locName}>{event.address || event.location || 'Church Main Hall'}</Text>
              {event.location && event.address && <Text style={styles.locSub}>{event.location}</Text>}
            </View>
          </View>

          {/* Description Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconCircle, { backgroundColor: '#f5f3ff' }]}>
                <Info size={18} color="#7C3AED" />
              </View>
              <Text style={styles.sectionTitle}>ABOUT EVENT · కార్యక్రమం గురించి</Text>
            </View>
            <View style={styles.descCard}>
              <Text style={styles.description}>
                {event.description || event.descEn || "Join us for a powerful time of prayer and fellowship. We invite all members to gather as we seek God's presence together.\n\n'For where two or three gather in my name, there am I with them.' - Matthew 18:20"}
              </Text>
            </View>
          </View>

          {/* ── VIDEO SECTION — shown based on status ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconCircle, { backgroundColor: '#fee2e2' }]}>
                <Video size={18} color="#dc2626" />
              </View>
              <Text style={styles.sectionTitle}>
                {status === 'upcoming' ? 'EVENT VIDEO · వీడియో' :
                 status === 'live'     ? 'LIVE NOW · లైవ్ ఇప్పుడు' :
                                        'EVENT RECORDING · కార్యక్రమం వీడియో'}
              </Text>
            </View>

            {/* UPCOMING — not started yet */}
            {status === 'upcoming' && (
              <View style={styles.lockedCard}>
                <View style={styles.lockedIconWrap}>
                  <Lock size={32} color="#94a3b8" />
                </View>
                <Text style={styles.lockedTitle}>Event Has Not Started Yet</Text>
                <Text style={styles.lockedTitleTe}>కార్యక్రమం ఇంకా ప్రారంభం కాలేదు</Text>
                <View style={styles.lockedDateRow}>
                  <Calendar size={14} color="#1a2d5a" />
                  <Text style={styles.lockedDate}>
                    Scheduled for {formatDate(event.date)}
                  </Text>
                </View>
                <View style={styles.lockedDateRow}>
                  <Clock size={14} color="#1a2d5a" />
                  <Text style={styles.lockedDate}>
                    {formatTime(event.startTime)} – {formatTime(event.endTime)}
                  </Text>
                </View>
                <Text style={styles.lockedSub}>
                  The recording will be available here after the event ends.
                  {'\n'}కార్యక్రమం ముగిసిన తర్వాత వీడియో ఇక్కడ అందుబాటులో ఉంటుంది.
                </Text>
              </View>
            )}

            {/* LIVE — show the live stream button */}
            {status === 'live' && (
              <View>
                <View style={styles.liveBanner}>
                  <Radio size={18} color="#fff" />
                  <Text style={styles.liveBannerText}>This event is happening RIGHT NOW!</Text>
                </View>
                <TouchableOpacity
                  style={styles.liveBtn}
                  onPress={() => Linking.openURL(
                    manualYoutubeId
                      ? `https://www.youtube.com/watch?v=${manualYoutubeId}`
                      : liveUrl || 'https://www.youtube.com'
                  )}
                >
                  <Radio size={22} color="#fff" />
                  <View>
                    <Text style={styles.liveBtnText}>Watch Live Stream</Text>
                    {churchYoutubeHandle ? <Text style={styles.liveBtnSub}>{churchYoutubeHandle}</Text> : null}
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* COMPLETED — show recording */}
            {status === 'completed' && (
              videoSearching ? (
                <View style={styles.videoSearching}>
                  <ActivityIndicator size="large" color="#dc2626" />
                  <Text style={styles.videoSearchingText}>Finding event recording...</Text>
                  <Text style={styles.videoSearchingSubText}>వీడియో శోధిస్తున్నాం...</Text>
                </View>
              ) : youtubeId ? (
                <View style={styles.videoContainer}>
                  <YoutubePlayer
                    key={youtubeId}
                    height={width * 0.55}
                    play={false}
                    videoId={youtubeId}
                  />
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.youtubeChannelBtn}
                  onPress={() => Linking.openURL(liveUrl || 'https://www.youtube.com')}
                >
                  <Play size={20} color="#fff" fill="#fff" />
                  <View>
                    <Text style={styles.youtubeChannelBtnText}>Watch Recording on YouTube</Text>
                    {churchYoutubeHandle ? <Text style={styles.youtubeChannelBtnSub}>{churchYoutubeHandle}</Text> : null}
                  </View>
                </TouchableOpacity>
              )
            )}
          </View>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* --- Bottom Action Bar --- */}
      {status !== 'completed' && (
        <View style={styles.bottomBar}>
          {status === 'live' ? (
            <TouchableOpacity
              style={[styles.mainBtn, { backgroundColor: '#dc2626' }]}
              onPress={() => Linking.openURL(
                manualYoutubeId
                  ? `https://www.youtube.com/watch?v=${manualYoutubeId}`
                  : liveUrl || 'https://www.youtube.com'
              )}
            >
              <Text style={styles.mainBtnText}>● JOIN LIVE STREAM · లైవ్‌లో చేరండి</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.mainBtn} onPress={handleRSVP}>
              <Text style={styles.mainBtnText}>I AM INTERESTED · నేను ఆసక్తిగా ఉన్నాను</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a2d5a' },
  heroContainer: { width: '100%', height: height * 0.3, backgroundColor: '#1a2d5a' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  headerActions: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20, right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  circleBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)'
  },
  heroBadge: {
    position: 'absolute',
    bottom: 20, left: 20,
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
  },
  heroBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  contentCard: {
    flex: 1, backgroundColor: '#fff',
    marginTop: -40,
    borderTopLeftRadius: 40, borderTopRightRadius: 40,
    padding: 24, minHeight: height * 0.65,
    elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10
  },
  indicator: {
    width: 40, height: 5, backgroundColor: '#f1f5f9', borderRadius: 3,
    alignSelf: 'center', marginBottom: 25
  },
  titleSection: { marginBottom: 24 },
  titleEn: { fontSize: 24, fontWeight: '900', color: '#1a2d5a', marginBottom: 6, letterSpacing: -0.5 },
  titleTe: { fontSize: 17, color: '#64748b', fontWeight: '600' },
  
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  dateBadge: { 
    flex: 1.2, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fffbeb', padding: 12, borderRadius: 18,
    borderWidth: 1, borderColor: '#fef3c7', gap: 12
  },
  timeBadge: { 
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f8fafc', padding: 12, borderRadius: 18,
    borderWidth: 1, borderColor: '#f1f5f9', gap: 12
  },
  badgeValue: { fontSize: 14, fontWeight: '800', color: '#1a2d5a' },
  badgeSubValue: { fontSize: 10, color: '#94a3b8', fontWeight: '600', marginTop: 2 },
  timeValue: { fontSize: 13, fontWeight: '800', color: '#c0392b' },
  
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 15 },
  iconCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f0f9ff', justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#1a2d5a', letterSpacing: 1.5 },
  
  locCard: { backgroundColor: '#f8fafc', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#f1f5f9' },
  locName: { fontSize: 16, fontWeight: '700', color: '#1e293b', lineHeight: 22, marginBottom: 6 },
  locSub: { fontSize: 13, color: '#64748b', marginBottom: 12 },
  mapBtn: { alignSelf: 'flex-start' },
  mapBtnText: { fontSize: 12, color: '#1a2d5a', fontWeight: '800' },

  descCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#f1f5f9' },
  description: { fontSize: 15, color: '#475569', lineHeight: 26, fontWeight: '400' },

  // ── UPCOMING — locked card ──
  lockedCard: {
    backgroundColor: '#f8fafc', borderRadius: 20, padding: 28,
    alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', gap: 8,
  },
  lockedIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  lockedTitle: { fontSize: 17, fontWeight: '800', color: '#1e293b', textAlign: 'center' },
  lockedTitleTe: { fontSize: 14, color: '#64748b', fontWeight: '600', textAlign: 'center' },
  lockedDateRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 4 },
  lockedDate: { fontSize: 13, color: '#1a2d5a', fontWeight: '700' },
  lockedSub: { fontSize: 12, color: '#94a3b8', textAlign: 'center', lineHeight: 20, marginTop: 12 },

  // ── LIVE ──
  liveBanner: {
    backgroundColor: '#dc2626', borderRadius: 12, padding: 14,
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 12,
  },
  liveBannerText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  liveBtn: {
    backgroundColor: '#dc2626', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', padding: 18, borderRadius: 16, gap: 14,
    elevation: 6, shadowColor: '#dc2626', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  liveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  liveBtnSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500', marginTop: 2 },

  // ── COMPLETED ──
  videoContainer: {
    backgroundColor: '#000', elevation: 5,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10
  },
  youtubeChannelBtn: {
    backgroundColor: '#dc2626', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', padding: 18, borderRadius: 16, gap: 14,
    elevation: 3, shadowColor: '#dc2626', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }
  },
  youtubeChannelBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  youtubeChannelBtnSub: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '500', marginTop: 2 },
  videoSearching: {
    backgroundColor: '#fff5f5', borderRadius: 16, padding: 28,
    alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#fee2e2'
  },
  videoSearchingText: { fontSize: 14, fontWeight: '700', color: '#dc2626', marginTop: 6 },
  videoSearchingSubText: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 45 : 25,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9',
    elevation: 25, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15
  },
  mainBtn: {
    backgroundColor: '#1a2d5a', borderRadius: 20, paddingVertical: 18,
    alignItems: 'center', justifyContent: 'center',
    elevation: 10, shadowColor: '#1a2d5a', shadowOpacity: 0.4, shadowRadius: 10
  },
  mainBtnText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 }
});
