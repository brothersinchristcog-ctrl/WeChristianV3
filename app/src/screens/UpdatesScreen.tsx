import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, StatusBar, Platform, ActivityIndicator, Modal, PanResponder, Animated, Dimensions, Linking, Alert, Image } from 'react-native';
import { ChevronLeft, ArrowLeft, Bell, Calendar, Info, MessageCircle, AlertTriangle, X, Gift, Heart, Sparkles, Trash2, Tv, BookOpen, Music, Mic , Video } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  getFirestore, 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot 
} from '@react-native-firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { formatDateDisplay } from '../utils/DateUtils';
import { useChurch } from '../context/ChurchContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;

function SwipeableRow({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  const translateX = React.useRef(new Animated.Value(0)).current;

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Claim the gesture if it's primarily horizontal and moving left-to-right
        const isHorizontal = Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10;
        return isHorizontal && gestureState.dx > 0;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        const isHorizontal = Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10;
        return isHorizontal && gestureState.dx > 0;
      },
      onPanResponderGrant: () => {
        // Swipe starts - lock scroll or capture gesture
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          translateX.setValue(gestureState.dx);
        } else {
          translateX.setValue(0);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          Animated.timing(translateX, {
            toValue: SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onDelete();
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            tension: 40,
            friction: 7,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: 0,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  const opacity = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0.3, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.swipeContainer}>
      <Animated.View style={[styles.swipeBackdrop, { opacity }]}>
        <View style={styles.swipeBackdropContent}>
          <Trash2 size={20} color="#fff" />
          <Text style={styles.swipeBackdropTxt}>Deleted</Text>
        </View>
      </Animated.View>

      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

// Strip HTML tags from rich-text fields (e.g., promise content stored as HTML)
function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, '')        // remove tags
    .replace(/&nbsp;/g, ' ')        // decode &nbsp;
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')     // collapse excessive newlines
    .trim();
}

export default function UpdatesScreen({ navigation, route }: any) {
  const { highlightId, highlightType } = route?.params || {};
    const [dynamicUpdates, setDynamicUpdates] = useState<any[]>([]);
  const [broadcastsList, setBroadcastsList] = useState<any[]>([]);
  const [meetingsList, setMeetingsList] = useState<any[]>([]);

  useEffect(() => {
    const combined = [...broadcastsList, ...meetingsList].sort((a, b) => (b.rawDate || 0) - (a.rawDate || 0));
    setDynamicUpdates(combined);
  }, [broadcastsList, meetingsList]);
  const [selectedUpdate, setSelectedUpdate] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const { user, member, viewMode } = useAuth();
  const { activeChurch } = useChurch();

  useEffect(() => {
    const loadDeletedIds = async () => {
      try {
        const stored = await AsyncStorage.getItem('@deleted_notification_ids');
        if (stored) {
          setDeletedIds(JSON.parse(stored));
        }
      } catch (e) {
        console.warn('Error loading deleted notification IDs:', e);
      }
    };
    loadDeletedIds();
  }, []);

  const handleDeleteUpdate = async (id: string) => {
    try {
      const updated = [...deletedIds, id];
      setDeletedIds(updated);
      await AsyncStorage.setItem('@deleted_notification_ids', JSON.stringify(updated));
    } catch (e) {
      console.error('Error persisting deleted notification ID:', e);
    }
  };

  useEffect(() => {
    const churchToQuery = activeChurch?.id || member?.churchId;
    if (!churchToQuery) {
      setLoading(false);
      return;
    }

    const db = getFirestore();
    const q = query(
      collection(db, 'churches', churchToQuery, 'broadcasts'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot) {
          const list = snapshot.docs.map(doc => {
            const data = doc.data();
            
            // SECURITY: If broadcast is targeted to a specific church, skip it if not for this user's church
            if (data.targetChurchId && churchToQuery && data.targetChurchId !== churchToQuery) {
              return null;
            }

            // SECURITY: If broadcast is targeted to a specific phone, skip it if not for this user
            const isTargeted = data.targetPhone && typeof data.targetPhone === 'string' && data.targetPhone.trim().length > 0;
            if (isTargeted) {
              const uPhone = user?.phoneNumber || '';
              const mPhone = member?.phone || '';
              const target = data.targetPhone.replace(/\D/g, ''); // strip non-digits for comparison
              
              const match1 = uPhone && uPhone.replace(/\D/g, '').endsWith(target);
              const match2 = mPhone && mPhone.replace(/\D/g, '').endsWith(target);
              const match3 = target.endsWith(uPhone.replace(/\D/g, '')) && uPhone.length > 5;
              const match4 = target.endsWith(mPhone.replace(/\D/g, '')) && mPhone.length > 5;
              
              if (!match1 && !match2 && !match3 && !match4) {
                return null; // Skip if not targeted to current user
              }
            }

            // Determine icon, color and type classification
            let icon = Bell;
            let color = '#3b82f6';
            let resolvedType = data.type || 'announcement';

            if (data.type === 'youtube_live' || data.type === 'live' || data.title?.includes('🎥')) {
              icon = Tv;
              color = '#ef4444';
              resolvedType = 'youtube_live';
            } else if (data.type === 'emergency' || data.title?.includes('🚨')) {
              icon = AlertTriangle;
              color = '#ef4444';
              resolvedType = 'emergency';
            } else if (data.type === 'event' || data.title?.includes('📅')) {
              icon = Calendar;
              color = '#10b981';
              resolvedType = 'event';
            } else if (data.title?.includes('🎂') || data.content?.includes('Birthday') || data.type === 'birthday') {
              icon = Gift;
              color = '#d97706';
              resolvedType = 'birthday';
            } else if (data.title?.includes('🎉') || data.title?.includes('🕊️') || data.content?.includes('Baptism') || data.title?.includes('Baptism') || data.type === 'baptism' || data.type === 'celebration') {
              icon = Sparkles;
              color = '#3b82f6';
              resolvedType = 'celebration';
            } else if (data.title?.includes('💐') || data.content?.includes('Anniversary') || data.title?.includes('Anniversary') || data.type === 'anniversary') {
              icon = Heart;
              color = '#be185d';
              resolvedType = 'anniversary';
            } else if (data.type === 'promise' || data.title?.includes('Promise') || data.title?.includes('వాగ్దానం')) {
              icon = BookOpen;
              color = '#8b5cf6';
              resolvedType = 'promise';
            } else if (data.type === 'song' || data.title?.includes('Song') || data.title?.includes('🎵')) {
              icon = Music;
              color = '#ec4899';
              resolvedType = 'song';
            } else if (data.type === 'sermon' || data.title?.includes('Sermon') || data.title?.includes('Message')) {
              icon = Mic;
              color = '#6366f1';
              resolvedType = 'sermon';
            }
            let dateStr = data.date || new Date().toISOString().split('T')[0];
            
            // Try to extract exact time if available
            if (data.createdAt && typeof data.createdAt.toDate === 'function') {
              const dt = data.createdAt.toDate();
              const timeStr = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
              dateStr = `${dateStr} • ${timeStr}`;
            } else if (typeof data.createdAt === 'number' || typeof data.createdAt === 'string') {
              const dt = new Date(data.createdAt);
              if (!isNaN(dt.getTime())) {
                const timeStr = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                dateStr = `${dateStr} • ${timeStr}`;
              }
            }

            return {
              id: doc.id,
              title: data.title || 'Announcement',
              content: stripHtml(data.content || ''),
              date: dateStr,
              type: resolvedType,
              icon: icon,
              color: color,
              url: data.url || '',
              imageUrl: data.imageUrl || null,
              relatedId: data.relatedId || null,
              rawDate: data.createdAt?.toMillis?.() || (typeof data.createdAt === 'number' ? data.createdAt : 0)
            };
          }).filter(item => item !== null);
          setBroadcastsList(list);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching broadcasts:', error);
        setLoading(false);
      }
    );

        const qMeetings = query(
      collection(db, 'churches', churchToQuery, 'online_meetings'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribeMeetings = onSnapshot(
      qMeetings,
      (snapshot) => {
        if (snapshot) {
          const list = snapshot.docs.map(doc => {
            const data = doc.data();
            let dateStr = new Date().toISOString().split('T')[0];
            if (data.startTime && typeof data.startTime.toDate === 'function') {
              const dt = data.startTime.toDate();
              dateStr = dt.toLocaleDateString() + ' • ' + dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            }
            
            return {
              id: doc.id,
              title: 'New Online Meeting',
              content: data.title + ' has been scheduled.',
              date: dateStr,
              type: 'online_meeting',
              icon: Video,
              color: '#3B82F6',
              url: data.meetingLink || '',
              rawDate: data.createdAt?.toMillis?.() || 0
            };
          });
          setMeetingsList(list);
        }
      },
      (error) => {
        console.error('Error fetching meetings:', error);
      }
    );

    return () => { unsubscribe(); unsubscribeMeetings(); };
  }, [activeChurch?.id, member?.churchId, user?.phoneNumber, member?.phone]);
  const allUpdates = dynamicUpdates;
  const visibleUpdates = allUpdates.filter(update => !deletedIds.includes(update.id));

  // Reset hasAutoOpened whenever route params change to allow new notification clicks to pop up
  useEffect(() => {
    setHasAutoOpened(false);
  }, [highlightId, highlightType]);

  // Route-triggered Auto Popup Highlights
  useEffect(() => {
    if (hasAutoOpened) return;
    if (!highlightType) return; // nothing to do

    // If we have a specific broadcast ID, try to find it in the loaded updates
    if (highlightId && allUpdates.length > 0) {
      const match = allUpdates.find(u => u.id === highlightId);
      if (match) {
        setSelectedUpdate(match);
        setHasAutoOpened(true);
        return;
      }
    }

    // Fallback: show a temp card based on type (handles the case where allUpdates not loaded yet,
    // or the broadcast was targeted to another user so it won't appear in list)
    if (!loading) {
      if (highlightType === 'birthday') {
        setSelectedUpdate({
          id: 'temp-bd',
          title: '🎂 Happy Birthday!',
          content: 'Wishing you a very Happy Birthday! May God bless you abundantly and fulfill all your prayers today. 🙏🎈',
          date: 'Today',
          type: 'birthday',
          color: '#d97706'
        });
        setHasAutoOpened(true);
      } else if (highlightType === 'anniversary') {
        setSelectedUpdate({
          id: 'temp-ann',
          title: '💐 Happy Wedding Anniversary!',
          content: 'Wishing you a wonderful wedding anniversary! May God bless your home with love, joy, and peace. 💒💖',
          date: 'Today',
          type: 'anniversary',
          color: '#be185d'
        });
        setHasAutoOpened(true);
      } else if (highlightType === 'baptism' || highlightType === 'celebration') {
        setSelectedUpdate({
          id: 'temp-cel',
          title: '🕊️ Happy Baptism Anniversary!',
          content: 'Happy Baptism Anniversary! May you continue to grow in faith and walk in His light. 🙏🕊️',
          date: 'Today',
          type: 'celebration',
          color: '#3b82f6'
        });
        setHasAutoOpened(true);
      }
    }
  }, [highlightId, highlightType, allUpdates, hasAutoOpened, loading]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />
      
      {/* ── Page Header Hero Card ── */}
      <LinearGradient 
        colors={['#2b52a1', '#1a3673']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{top:10, bottom:10, left:10, right:10}}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Church Updates</Text>
            <Text style={styles.headerSub}>Latest announcements & news from your church</Text>
          </View>
        </View>

        {visibleUpdates.length > 0 ? (
          <View style={styles.headerBadge}>
            <Bell size={18} color="#fff" />
            <View style={styles.badgeCircle}>
              <Text style={styles.headerBadgeTxt}>{visibleUpdates.length}</Text>
            </View>
          </View>
        ) : <View style={{ width: 40 }} />}
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {loading && visibleUpdates.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 100 }}>
              <ActivityIndicator size="large" color="#f0b429" />
              <Text style={{ marginTop: 16, fontSize: 14, color: '#94a3b8' }}>Loading updates...</Text>
            </View>
          ) : loading && visibleUpdates.length > 0 ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#1a2d5a" />
              <Text style={styles.loadingTxt}>Syncing live alerts...</Text>
            </View>
          ) : null}

          {visibleUpdates.map((update) => (
            <SwipeableRow key={update.id} onDelete={() => handleDeleteUpdate(update.id)}>
              <TouchableOpacity 
                style={styles.updateCard}
                activeOpacity={0.7}
                onPress={() => {
                  if (update.type === 'song') {
                    navigation.navigate('Songs', { songId: update.relatedId });
                  } else if (update.type === 'promise') {
                    if (viewMode === 'admin') {
                      if (navigation.canGoBack()) navigation.goBack();
                      else navigation.navigate('AdminRoot');
                    } else {
                      navigation.navigate('Tabs', { screen: 'Promise' });
                    }
                  } else if (update.type === 'sermon') {
                    navigation.navigate('Sermons');
                  } else if (update.type === 'event') {
                    navigation.navigate('Events');
                  } else if (update.type === 'attendance') {
                    navigation.navigate('AttendanceScreen');
                  } else {
                    setSelectedUpdate(update);
                  }
                }}
              >
                <View style={[styles.iconBox, { backgroundColor: update.color + '15' }]}>
                  <update.icon size={22} color={update.color} />
                </View>
                <View style={styles.updateInfo}>
                  <View style={styles.metaRow}>
                    <Text style={[styles.typeTag, { color: update.color }]}>{update.type.toUpperCase()}</Text>
                    <Text style={styles.dateTxt}>{formatDateDisplay(update.date)}</Text>
                  </View>
                  <Text style={styles.updateTitle}>{update.title}</Text>
                  <Text style={styles.updateContent} numberOfLines={2}>{update.content}</Text>
                </View>
              </TouchableOpacity>
            </SwipeableRow>
          ))}

          {visibleUpdates.length === 0 && !loading && (
            <View style={styles.emptyContainer}>
              <Bell size={48} color="#94a3b8" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>All caught up!</Text>
              <Text style={styles.emptySubText}>Swipe notifications from left to right to delete them.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Visual Celebration & Details Modal ── */}
      <Modal
        visible={selectedUpdate !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedUpdate(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setSelectedUpdate(null)}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            style={[
              styles.modalCard,
              selectedUpdate?.type === 'birthday' && styles.modalCardBirthday,
              selectedUpdate?.type === 'anniversary' && styles.modalCardAnniversary,
              selectedUpdate?.type === 'celebration' && styles.modalCardCelebration,
              (selectedUpdate?.type === 'emergency' || selectedUpdate?.title?.includes('🚨')) && styles.modalCardEmergency
            ]}
          >
            {/* Modal Close Button */}
            <TouchableOpacity 
              style={[
                styles.modalCloseBtn,
                (selectedUpdate?.type === 'birthday' || selectedUpdate?.type === 'anniversary') && styles.modalCloseBtnGold
              ]} 
              onPress={() => setSelectedUpdate(null)}
            >
              <X size={20} color={
                selectedUpdate?.type === 'birthday' ? '#b45309' :
                selectedUpdate?.type === 'anniversary' ? '#be185d' : '#475569'
              } />
            </TouchableOpacity>

            {/* Modal Content */}
            {selectedUpdate?.type === 'birthday' ? (
              // --- 🎂 PREMIUM BIRTHDAY UI ---
              <View style={styles.celebrationContainer}>
                <View style={styles.balloonRow}>
                  <Text style={styles.emojiDecor}>🎈</Text>
                  <Text style={[styles.emojiDecor, { fontSize: 44, marginTop: -15 }]}>🎂</Text>
                  <Text style={styles.emojiDecor}>🎈</Text>
                </View>
                <Sparkles size={32} color="#f59e0b" style={styles.sparkleIcon} />
                <Text style={styles.celebrationTitleEn}>Happy Birthday!</Text>
                <Text style={styles.celebrationTitleTe}>పుట్టినరోజు శుభాకాంక్షలు! 💐</Text>
                <View style={styles.dividerGold} />
                
                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  <Text style={styles.celebrationGreeting}>
                    {selectedUpdate?.content}
                  </Text>
                </ScrollView>

                <View style={styles.celebrationFooter}>
                  <Gift size={24} color="#b45309" />
                  <Text style={styles.footerBlessing}>"May the Lord bless you out of Zion..." - Psalm 128:5</Text>
                </View>
              </View>
            ) : selectedUpdate?.type === 'anniversary' ? (
              // --- 💐 PREMIUM ANNIVERSARY UI ---
              <View style={styles.celebrationContainer}>
                <View style={styles.balloonRow}>
                  <Text style={styles.emojiDecor}>💖</Text>
                  <Text style={[styles.emojiDecor, { fontSize: 44, marginTop: -15 }]}>💐</Text>
                  <Text style={styles.emojiDecor}>💖</Text>
                </View>
                <Sparkles size={32} color="#be185d" style={styles.sparkleIcon} />
                <Text style={[styles.celebrationTitleEn, { color: '#be185d' }]}>Happy Wedding Anniversary!</Text>
                <Text style={[styles.celebrationTitleTe, { color: '#be185d' }]}>వివాహ వార్షికోత్సవ శుభాకాంక్షలు! 💒</Text>
                <View style={styles.dividerPink} />

                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  <Text style={[styles.celebrationGreeting, { color: '#85144b' }]}>
                    {selectedUpdate?.content}
                  </Text>
                </ScrollView>

                <View style={styles.celebrationFooter}>
                  <Heart size={24} color="#be185d" strokeWidth={2} />
                  <Text style={[styles.footerBlessing, { color: '#be185d' }]}>"What therefore God hath joined together, let not man put asunder." - Mark 10:9</Text>
                </View>
              </View>
            ) : selectedUpdate?.type === 'celebration' ? (
              // --- 🎉 BAPTISM / CELEBRATION UI ---
              <View style={styles.celebrationContainer}>
                <View style={styles.balloonRow}>
                  <Text style={styles.emojiDecor}>🕊️</Text>
                  <Text style={[styles.emojiDecor, { fontSize: 44, marginTop: -15 }]}>🎉</Text>
                  <Text style={styles.emojiDecor}>🕊️</Text>
                </View>
                <Sparkles size={32} color="#3b82f6" style={styles.sparkleIcon} />
                <Text style={[styles.celebrationTitleEn, { color: '#3b82f6' }]}>{selectedUpdate?.title || 'Celebration!'}</Text>
                <View style={styles.dividerBlue} />

                <ScrollView style={[styles.modalScroll, { maxHeight: 400 }]} showsVerticalScrollIndicator={false}>
                  {selectedUpdate?.imageUrl && (
                    <Image source={{ uri: selectedUpdate.imageUrl }} style={styles.modalImage} resizeMode="cover" />
                  )}
                  <Text style={[styles.celebrationGreeting, { color: '#1e3a8a' }]}>
                    {selectedUpdate?.content}
                  </Text>
                </ScrollView>

                <View style={[styles.celebrationFooter, { borderTopColor: '#3b82f6' }]}>
                  <Text style={[styles.footerBlessing, { color: '#1e3a8a' }]}>"Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new." - 2 Cor 5:17</Text>
                </View>
              </View>
            ) : (
              // --- 🚨 STANDARD / EMERGENCY BROADCAST UI ---
              <View style={styles.standardModalContainer}>
                <View style={styles.standardModalHeader}>
                  <View style={[
                    styles.stdIconBox, 
                    (selectedUpdate?.type === 'emergency' || selectedUpdate?.title?.includes('🚨') || selectedUpdate?.type === 'youtube_live') && styles.stdIconBoxEmergency
                  ]}>
                    {selectedUpdate?.type === 'emergency' || selectedUpdate?.title?.includes('🚨') ? (
                      <AlertTriangle size={24} color="#ef4444" />
                    ) : selectedUpdate?.type === 'youtube_live' ? (
                      <Tv size={24} color="#ef4444" />
                    ) : (
                      <Bell size={24} color="#1a2d5a" />
                    )}
                  </View>
                  <View style={styles.stdHeaderMeta}>
                    <Text style={[
                      styles.stdTypeTag,
                      (selectedUpdate?.type === 'emergency' || selectedUpdate?.title?.includes('🚨') || selectedUpdate?.type === 'youtube_live') && { color: '#ef4444' }
                    ]}>
                      {selectedUpdate?.type?.toUpperCase() || 'ANNOUNCEMENT'}
                    </Text>
                    <Text style={styles.stdDateTxt}>{formatDateDisplay(selectedUpdate?.date)}</Text>
                  </View>
                </View>

                <Text style={[
                  styles.stdModalTitle,
                  (selectedUpdate?.type === 'emergency' || selectedUpdate?.title?.includes('🚨') || selectedUpdate?.type === 'youtube_live') && { color: '#b91c1c' }
                ]}>
                  {selectedUpdate?.title}
                </Text>

                <View style={styles.dividerStd} />

                <ScrollView style={[styles.modalScroll, { maxHeight: 400 }]} showsVerticalScrollIndicator={false}>
                  {selectedUpdate?.imageUrl && (
                    <Image source={{ uri: selectedUpdate.imageUrl }} style={styles.modalImage} resizeMode="cover" />
                  )}
                  <Text style={styles.stdModalContent}>
                    {selectedUpdate?.content}
                  </Text>
                </ScrollView>

                {selectedUpdate?.type === 'youtube_live' && (
                  <TouchableOpacity
                    style={styles.joinLiveBtn}
                    onPress={() => {
                    let liveUrl = selectedUpdate?.url || activeChurch?.socialLinks?.youtube;
                    if (liveUrl) {
                      let base = liveUrl.split('?')[0];
                      if (base.includes('@') && !base.includes('/live') && !base.includes('/streams')) {
                        base = base.endsWith('/') ? `${base}live` : `${base}/live`;
                      }
                      Linking.openURL(base).catch(err => console.error(err));
                    } else {
                      Alert.alert('Not Configured', 'The YouTube Live link has not been set up by the church admin yet.');
                    }
                    }}
                  >
                    <Text style={styles.joinLiveBtnTxt}>📺 Join Live Stream</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight ?? 24) + 12,
    paddingHorizontal: 20,
    paddingBottom: 30,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    minHeight: Platform.OS === 'ios' ? 140 : 120,
  },
  headerCenter: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 24 },
  headerBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeCircle: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: '#ef4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#1a3673',
  },
  headerBadgeTxt: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  backBtn: { zIndex: 10, padding: 5, marginLeft: -8, marginBottom: 8 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 2 },
  headerSub: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '500' },
  
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16 },
  
  loadingBox: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10 },
  loadingTxt: { fontSize: 12, color: '#475569', fontWeight: '500' },

  updateCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  updateInfo: { flex: 1 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  typeTag: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  dateTxt: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  updateTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  updateContent: { fontSize: 13, color: '#475569', lineHeight: 20 },

  // Interactive Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    maxHeight: '80%',
    padding: 24,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 15,
    position: 'relative'
  },
  modalCardBirthday: {
    backgroundColor: '#fffdf5',
    borderWidth: 1.5,
    borderColor: '#f59e0b',
  },
  modalCardAnniversary: {
    backgroundColor: '#fffbfd',
    borderWidth: 1.5,
    borderColor: '#fda4af',
  },
  modalCardCelebration: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1.5,
    borderColor: '#3b82f6',
  },
  modalCardEmergency: {
    borderLeftWidth: 6,
    borderLeftColor: '#ef4444',
  },
  modalCloseBtn: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  modalCloseBtnGold: {
    backgroundColor: '#fef3c7',
  },
  // Birthday & Anniversary Styles
  celebrationContainer: {
    alignItems: 'center',
    paddingTop: 10
  },
  balloonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 10
  },
  emojiDecor: {
    fontSize: 32,
  },
  sparkleIcon: {
    marginBottom: 8
  },
  celebrationTitleEn: {
    fontSize: 20,
    fontWeight: '800',
    color: '#b45309',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif'
  },
  celebrationTitleTe: {
    fontSize: 14,
    fontWeight: '600',
    color: '#b45309',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic'
  },
  dividerGold: {
    height: 2,
    backgroundColor: '#f59e0b',
    width: 80,
    marginVertical: 16,
    borderRadius: 1
  },
  dividerPink: {
    height: 2,
    backgroundColor: '#fda4af',
    width: 80,
    marginVertical: 16,
    borderRadius: 1
  },
  dividerBlue: {
    height: 2,
    backgroundColor: '#3b82f6',
    width: 80,
    marginVertical: 16,
    borderRadius: 1
  },
  modalScroll: {
    width: '100%',
    maxHeight: 400,
    marginVertical: 10
  },
  modalImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  celebrationGreeting: {
    fontSize: 14,
    color: '#78350f',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '600',
    paddingHorizontal: 8
  },
  celebrationFooter: {
    marginTop: 20,
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#f59e0b',
    paddingTop: 16,
    width: '100%'
  },
  footerBlessing: {
    fontSize: 11,
    color: '#78350f',
    fontWeight: '700',
    fontStyle: 'italic',
    textAlign: 'center'
  },
  // Standard Modal Styles
  standardModalContainer: {
    paddingTop: 8
  },
  standardModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16
  },
  stdIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  stdIconBoxEmergency: {
    backgroundColor: '#fee2e2',
  },
  stdHeaderMeta: {
    flex: 1
  },
  stdTypeTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1a2d5a',
    letterSpacing: 0.5
  },
  stdDateTxt: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  stdModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    lineHeight: 24,
    marginBottom: 12
  },
  dividerStd: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginBottom: 12
  },
  stdModalContent: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22
  },
  // Swipe to Delete Styles
  swipeContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ef4444'
  },
  swipeBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    paddingLeft: 24,
    borderRadius: 16
  },
  swipeBackdropContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  swipeBackdropTxt: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5
  },
  // Empty State Styles
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#334155',
    marginTop: 12,
    marginBottom: 6
  },
  emptySubText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 30,
    lineHeight: 18
  },
  // YouTube Live Join Button
  joinLiveBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16
  },
  joinLiveBtnTxt: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5
  }
});
