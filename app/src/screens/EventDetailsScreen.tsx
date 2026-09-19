import React, { useState, useEffect, useRef } from 'react';
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
  CheckCircle2,
  Navigation
} from 'lucide-react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as Clipboard from 'expo-clipboard';
import RNShare from 'react-native-share';
import ViewShot from 'react-native-view-shot';

import { findEventVideo } from '../services/YouTubeService';
import { useChurch } from '../context/ChurchContext';
import FirestoreService from '../services/FirestoreService';

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
  const dateParts = (event?.date || '').split('-');
  const eventYear = parseInt(dateParts[0]) || today.getFullYear();
  const eventMonth = parseInt(dateParts[1]) - 1 || 0;
  const eventDay = parseInt(dateParts[2]) || today.getDate();

  const parseTime = (timeStr: string) => {
    if (!timeStr) return null;
    const timePart = timeStr.includes('T') ? timeStr.split('T')[1] : timeStr;
    const [h, m, s] = timePart.split(':').map(Number);
    return new Date(eventYear, eventMonth, eventDay, h || 0, m || 0, s || 0);
  };

  const startDt = parseTime(event?.startTime);
  const endDt = parseTime(event?.endTime);

  if (!startDt) {
    const eventDate = new Date(eventYear, eventMonth, eventDay, 23, 59, 59);
    return today > eventDate ? 'completed' : 'upcoming';
  }

  if (today < startDt) return 'upcoming';
  if (endDt && today > endDt) return 'completed';
  return 'live';
}

export default function EventDetailsScreen({ route, navigation }: any) {
  const initialEvent = route?.params?.event || {};
  const [eventData, setEventData] = useState<any>(initialEvent);
  const { activeChurch } = useChurch();

  const [imageAspectRatio, setImageAspectRatio] = useState<number>(16 / 9);
  const [isSharing, setIsSharing] = useState(false);
  const captureEventRef = useRef<ViewShot>(null);

  // Sync with fresh server event record if available
  useEffect(() => {
    if (initialEvent.id) {
      FirestoreService.getEvents().then((events) => {
        const found = events.find(e => e.id === initialEvent.id);
        if (found) {
          setEventData((prev: any) => ({ ...prev, ...found }));
        }
      }).catch(() => {});
    }
  }, [initialEvent.id]);

  const event = eventData;
  const status = getEventStatus(event);
  const manualYoutubeId = event.youtubeId;
  const churchYoutubeHandle = activeChurch?.socialLinks?.youtube || ''; // e.g. @MyChurch

  const [autoYoutubeId, setAutoYoutubeId] = useState<string | null>(null);
  const [videoSearching, setVideoSearching] = useState(false);

  // Dynamically compute exact aspect ratio of the event flyer/image
  useEffect(() => {
    const uri = event.image || event.bannerUrl;
    if (uri && typeof uri === 'string' && uri.startsWith('http')) {
      Image.getSize(
        uri,
        (w, h) => {
          if (w > 0 && h > 0) {
            // Keep aspect ratio within practical mobile bounds [0.75 (tall portrait flyer) to 2.2 (wide banner)]
            const r = Math.max(0.75, Math.min(2.2, w / h));
            setImageAspectRatio(r);
          }
        },
        () => {}
      );
    }
  }, [event.image, event.bannerUrl]);

  useEffect(() => {
    // Auto-search YouTube if event is completed, no manual ID, and church has a YouTube handle
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
      if (dateStr.includes('-') && dateStr.split('-').length === 3) {
        const [y, m, d] = dateStr.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        return dt.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      }
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return dateStr; }
  };

  const formatTeluguDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      let d = new Date();
      if (dateStr.includes('-') && dateStr.split('-').length === 3) {
        const [year, month, day] = dateStr.split('-').map(Number);
        d = new Date(year, month - 1, day);
      } else {
        d = new Date(dateStr);
      }
      const monthsTe = ['జనవరి', 'ఫిబ్రవరి', 'మార్చి', 'ఏప్రిల్', 'మే', 'జూన్', 'జూలై', 'ఆగస్టు', 'సెప్టెంబర్', 'అక్టోబర్', 'నవంబర్', 'డిసెంబర్'];
      return `${monthsTe[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    } catch { return dateStr; }
  };

  const handleOpenMaps = () => {
    const locQuery = [event.location, event.address].filter(Boolean).join(', ') || 'Church';
    const encoded = encodeURIComponent(locQuery);
    const url = Platform.select({
      ios: `maps:0,0?q=${encoded}`,
      android: `geo:0,0?q=${encoded}`,
    }) || `https://www.google.com/maps/search/?api=1&query=${encoded}`;

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encoded}`);
      }
    }).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encoded}`);
    });
  };

  const onShare = async () => {
    setIsSharing(true);
    try {
      const title = event.title || event.name || 'Church Event';
      const titleTe = event.titleTelugu || event.titleTe || '';
      const churchName = activeChurch?.name ? `${activeChurch.name}` : '';
      const dateStr = formatDate(event.date);
      const timeStr = (event.startTime || event.endTime)
        ? `${formatTime(event.startTime)} – ${formatTime(event.endTime)}`
        : (event.time || '');
      const locStr = [event.location, event.address].filter(Boolean).join(' - ') || 'Church Main Hall';
      const descStr = (event.description || event.descEn || '').trim();

      let message = `📅 ${title}${titleTe ? ` · ${titleTe}` : ''}\n\n`;
      if (dateStr) message += `🗓️ Date: ${dateStr}\n`;
      if (timeStr) message += `⏰ Time: ${timeStr}\n`;
      if (locStr) message += `📍 Location: ${locStr}\n`;
      if (descStr) {
        message += `\n📝 Details:\n${descStr}\n`;
      }
      if (event.youtubeId) {
        message += `\n🎥 Watch / Stream: https://youtu.be/${event.youtubeId}\n`;
      }
      if (churchName) {
        message += `\n${churchName} 🙏`;
      }

      // Copy text to clipboard as safety backup for apps that drop caption
      try {
        await Clipboard.setStringAsync(message);
      } catch (_) {}

      // Target event image
      const imageUrl = event.image || event.bannerUrl;
      let localFileUri: string | null = null;
      let mimeType = 'image/jpeg';

      if (imageUrl && !imageUrl.includes('unsplash.com/photo-1438232992991-995b7058bbb3')) {
        try {
          if (imageUrl.startsWith('file://') || imageUrl.startsWith('content://') || imageUrl.startsWith('data:')) {
            localFileUri = imageUrl;
          } else {
            const isPng = imageUrl.toLowerCase().includes('.png');
            mimeType = isPng ? 'image/png' : 'image/jpeg';
            const ext = isPng ? 'png' : 'jpg';
            const filename = `event_share_${event.id || Date.now()}.${ext}`;
            const destination = `${FileSystem.cacheDirectory}${filename}`;
            const downloadRes = await FileSystem.downloadAsync(imageUrl, destination);
            localFileUri = downloadRes.uri;
          }
        } catch (dlErr) {
          console.warn('Could not download event image, trying capture fallback:', dlErr);
        }
      }

      // If no remote thumbnail or download failed, capture event card via ViewShot
      if (!localFileUri && captureEventRef.current?.capture) {
        try {
          const capturedUri = await captureEventRef.current.capture();
          localFileUri = capturedUri;
          mimeType = 'image/png';
        } catch (capErr) {
          console.warn('ViewShot event card capture failed:', capErr);
        }
      }

      // Clear loading indicator before presenting share sheet
      setIsSharing(false);

      if (localFileUri) {
        let fileUri = localFileUri;
        if (!fileUri.startsWith('file://') && !fileUri.startsWith('content://') && !fileUri.startsWith('data:')) {
          fileUri = `file://${fileUri}`;
        }

        // Attempt 1: Native Share with image and caption attached (react-native-share)
        try {
          await RNShare.open({
            title: `${title} · ${churchName || 'Event Details'}`,
            message,
            url: fileUri,
            type: mimeType,
            subject: `${title} · ${churchName || 'Event Details'}`,
          });
          return;
        } catch (shareOpenErr: any) {
          const errMsg = shareOpenErr?.message || String(shareOpenErr);
          if (errMsg.includes('User did not share') || errMsg.includes('dismiss') || errMsg.includes('cancel') || shareOpenErr?.code === 'CANCELLED') {
            return;
          }
          console.warn('RNShare.open failed, trying expo-sharing fallback:', shareOpenErr);
        }

        // Attempt 2: expo-sharing fallback with the image file
        try {
          const isSharingAvailable = await Sharing.isAvailableAsync();
          if (isSharingAvailable) {
            await Sharing.shareAsync(fileUri, {
              dialogTitle: `${title} · ${churchName || 'Event Details'}`,
              mimeType,
              UTI: mimeType === 'image/png' ? 'public.png' : 'public.jpeg',
            });
            return;
          }
        } catch (expoShareErr: any) {
          console.warn('Expo sharing failed:', expoShareErr);
        }
      }

      // Attempt 3: Built-in text sharing fallback
      await Share.share({ message });
    } catch (error) {
      console.error('Error sharing event:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleRSVP = () => {
    Alert.alert("Success · విజయం", "Thank you for your interest! We'll keep you updated.\nమీ ఆసక్తికి ధన్యవాదాలు! మేము మిమ్మల్ని అప్‌డేట్ చేస్తాము.");
  };

  // Status badge config
  const statusConfig = {
    upcoming: { label: 'UPCOMING', color: '#1a2d5a', bg: '#e0eaff', icon: <Clock size={12} color="#1a2d5a" /> },
    live:     { label: '● LIVE NOW', color: '#fff',    bg: '#dc2626', icon: <Radio size={12} color="#fff" /> },
    completed:{ label: 'COMPLETED',  color: '#16a34a', bg: '#dcfce7', icon: <CheckCircle2 size={12} color="#16a34a" /> },
  }[status];

  const heroImageUri = event.image || event.bannerUrl || 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=800';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Top Floating Action Bar */}
      <View style={styles.headerActions}>
        <TouchableOpacity 
          style={styles.circleBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.circleBtn}
          onPress={onShare}
          activeOpacity={0.8}
        >
          <Share2 size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* --- Hero Image Section (Full image displayed with dynamic aspect ratio, no cropping) --- */}
        <View style={styles.heroWrapper}>
          <View style={[styles.heroContainer, { aspectRatio: imageAspectRatio }]}>
            <Image 
              source={{ uri: heroImageUri }}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* --- Content Card --- */}
        <View style={styles.contentCard}>
          <View style={styles.indicator} />
          
          {/* Header Badges: Status + Category + Church */}
          <View style={styles.headerBadgeRow}>
            <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
              {statusConfig.icon}
              <Text style={[styles.statusPillText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
            </View>

            {event.category ? (
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{event.category.toUpperCase()}</Text>
              </View>
            ) : null}

            {activeChurch?.name ? (
              <View style={styles.churchPill}>
                <Text style={styles.churchPillText} numberOfLines={1}>{activeChurch.name}</Text>
              </View>
            ) : null}
          </View>

          {/* Title Area */}
          <View style={styles.titleSection}>
            <Text style={styles.titleEn}>{event.title || event.name}</Text>
            {(event.titleTelugu || event.titleTe) ? (
              <Text style={styles.titleTe}>{event.titleTelugu || event.titleTe}</Text>
            ) : null}
          </View>

          {/* Schedule Badges: Full English & Telugu Date + Start & End Time */}
          <View style={styles.badgeRow}>
            <View style={styles.dateBadge}>
              <View style={styles.badgeIconCircle}>
                <Calendar size={18} color="#1a2d5a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.badgeValue}>{formatDate(event.date)}</Text>
                <Text style={styles.badgeSubValue}>{formatTeluguDate(event.date)}</Text>
              </View>
            </View>

            <View style={styles.timeBadge}>
              <View style={[styles.badgeIconCircle, { backgroundColor: '#fee2e2' }]}>
                <Clock size={18} color="#dc2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.timeValue}>{formatTime(event.startTime)} – {formatTime(event.endTime)}</Text>
                <Text style={styles.badgeSubValue}>Event Duration · సమయం</Text>
              </View>
            </View>
          </View>

          {/* Location Section with Directions Button */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconCircle}>
                <MapPin size={18} color="#1a2d5a" />
              </View>
              <Text style={styles.sectionTitle}>LOCATION · స్థలం</Text>
            </View>
            <View style={styles.locCard}>
              <Text style={styles.locName}>{event.location || event.address || 'Church Main Hall'}</Text>
              {event.location && event.address && event.location !== event.address ? (
                <Text style={styles.locSub}>{event.address}</Text>
              ) : null}
              <TouchableOpacity style={styles.mapBtn} onPress={handleOpenMaps} activeOpacity={0.8}>
                <Navigation size={15} color="#1a2d5a" />
                <Text style={styles.mapBtnText}>Get Directions / Open in Maps</Text>
              </TouchableOpacity>
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

      {/* --- Bottom Action Bar with Dual Actions --- */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.shareActionBtn} onPress={onShare} activeOpacity={0.85}>
          <Share2 size={18} color="#1a2d5a" />
          <Text style={styles.shareActionBtnText}>Share</Text>
        </TouchableOpacity>

        {status === 'live' ? (
          <TouchableOpacity
            style={[styles.mainBtn, { backgroundColor: '#dc2626' }]}
            onPress={() => Linking.openURL(
              manualYoutubeId
                ? `https://www.youtube.com/watch?v=${manualYoutubeId}`
                : liveUrl || 'https://www.youtube.com'
            )}
            activeOpacity={0.85}
          >
            <Text style={styles.mainBtnText}>● JOIN LIVE STREAM</Text>
          </TouchableOpacity>
        ) : status === 'completed' ? (
          <TouchableOpacity
            style={[styles.mainBtn, { backgroundColor: '#16a34a' }]}
            onPress={onShare}
            activeOpacity={0.85}
          >
            <Text style={styles.mainBtnText}>SHARE EVENT DETAILS</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.mainBtn} onPress={handleRSVP} activeOpacity={0.85}>
            <Text style={styles.mainBtnText}>I AM INTERESTED</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sharing Overlay Spinner */}
      {isSharing && (
        <View style={StyleSheet.absoluteFillObject}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={{ color: '#ffffff', marginTop: 14, fontWeight: '700', fontSize: 15 }}>
              Preparing event to share...
            </Text>
          </View>
        </View>
      )}

      {/* Hidden capture view for fallback event card */}
      <View style={{ position: 'absolute', top: -10000, left: -10000 }}>
        <ViewShot ref={captureEventRef} options={{ format: 'png', quality: 1 }}>
          <View style={{ width, minHeight: width * 1.3, backgroundColor: '#0a1945' }} collapsable={false}>
            <LinearGradient
              colors={['#17357a', '#0a1945']}
              style={StyleSheet.absoluteFillObject}
            />
            {/* Decorative circles */}
            <View style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: 90, borderWidth: 1.5, borderColor: 'rgba(203, 213, 225, 0.15)' }} />
            <View style={{ position: 'absolute', bottom: -40, left: -20, width: 160, height: 160, borderRadius: 80, borderWidth: 1.5, borderColor: 'rgba(203, 213, 225, 0.1)' }} />

            <View style={{ flex: 1, padding: 26, justifyContent: 'space-between' }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#fbbf24', letterSpacing: 1.5 }}>
                    CHURCH EVENT · ప్రత్యేక కార్యక్రమం
                  </Text>
                  <View style={{ backgroundColor: statusConfig.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: statusConfig.color }}>{statusConfig.label}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#ffffff', lineHeight: 30 }}>
                  {event.title || event.name}
                </Text>
                {(event.titleTelugu || event.titleTe) ? (
                  <Text style={{ fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
                    {event.titleTelugu || event.titleTe}
                  </Text>
                ) : null}
              </View>

              <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 18, marginVertical: 18, gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Calendar size={18} color="#fbbf24" />
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#ffffff' }}>
                    {formatDate(event.date)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Clock size={18} color="#fbbf24" />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#ffffff' }}>
                    {formatTime(event.startTime)} – {formatTime(event.endTime)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <MapPin size={18} color="#fbbf24" />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#ffffff', flex: 1 }}>
                    {event.location || event.address || 'Church Main Hall'}
                  </Text>
                </View>
              </View>

              <View style={{ alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', paddingTop: 16 }}>
                <Text style={{ fontSize: 15, color: '#ffffff', fontWeight: '800', letterSpacing: 0.5 }}>
                  {activeChurch?.name || 'Church of GOD'} 🙏
                </Text>
              </View>
            </View>
          </View>
        </ViewShot>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1945' },
  heroWrapper: {
    width: '100%',
    backgroundColor: '#0a1945',
    paddingTop: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 24),
  },
  heroContainer: { 
    width: '100%', 
    backgroundColor: '#0a1945',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  },
  heroImage: { 
    width: '100%', 
    height: '100%' 
  },
  headerActions: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : (StatusBar.currentHeight || 24) + 12,
    left: 16, right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20
  },
  circleBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(10, 25, 69, 0.65)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6
  },

  contentCard: {
    flex: 1, backgroundColor: '#fff',
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: 22, minHeight: height * 0.65,
    marginTop: 10,
    elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10
  },
  indicator: {
    width: 40, height: 5, backgroundColor: '#f1f5f9', borderRadius: 3,
    alignSelf: 'center', marginBottom: 20
  },
  headerBadgeRow: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 16
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
  },
  statusPillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  categoryPill: {
    backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0'
  },
  categoryPillText: { fontSize: 11, fontWeight: '700', color: '#475569', letterSpacing: 0.5 },
  churchPill: {
    backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#dbeafe', maxWidth: 180
  },
  churchPillText: { fontSize: 11, fontWeight: '700', color: '#1d4ed8' },

  titleSection: { marginBottom: 20 },
  titleEn: { fontSize: 24, fontWeight: '900', color: '#1a2d5a', marginBottom: 6, letterSpacing: -0.5 },
  titleTe: { fontSize: 17, color: '#64748b', fontWeight: '600' },
  
  badgeRow: { gap: 10, marginBottom: 24 },
  dateBadge: { 
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fffbeb', padding: 14, borderRadius: 18,
    borderWidth: 1, borderColor: '#fef3c7', gap: 12
  },
  timeBadge: { 
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f8fafc', padding: 14, borderRadius: 18,
    borderWidth: 1, borderColor: '#f1f5f9', gap: 12
  },
  badgeIconCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#fef3c7', justifyContent: 'center', alignItems: 'center'
  },
  badgeValue: { fontSize: 15, fontWeight: '800', color: '#1a2d5a' },
  badgeSubValue: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginTop: 2 },
  timeValue: { fontSize: 14, fontWeight: '800', color: '#c0392b' },
  
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 15 },
  iconCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f0f9ff', justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#1a2d5a', letterSpacing: 1.5 },
  
  locCard: { backgroundColor: '#f8fafc', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#f1f5f9' },
  locName: { fontSize: 16, fontWeight: '700', color: '#1e293b', lineHeight: 22, marginBottom: 4 },
  locSub: { fontSize: 13, color: '#64748b', marginBottom: 8 },
  mapBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12, alignSelf: 'flex-start', marginTop: 6,
    borderWidth: 1, borderColor: '#dbeafe'
  },
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
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10,
    borderRadius: 16, overflow: 'hidden'
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
    paddingHorizontal: 20, paddingVertical: 14,
    paddingBottom: Platform.OS === 'ios' ? 36 : 18,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9',
    flexDirection: 'row', alignItems: 'center', gap: 12,
    elevation: 25, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15
  },
  shareActionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, paddingHorizontal: 20,
    borderRadius: 18, backgroundColor: '#f8fafc',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  shareActionBtnText: {
    fontSize: 14, fontWeight: '800', color: '#1a2d5a'
  },
  mainBtn: {
    flex: 1,
    backgroundColor: '#1a2d5a', borderRadius: 18, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: '#1a2d5a', shadowOpacity: 0.35, shadowRadius: 8
  },
  mainBtnText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 }
});
