import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Square,
  Radio,
  Tv,
  Music,
  Clock,
  Send,
  X,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  BookOpen,
  Volume2,
  Mic,
  Sliders,
  Bell,
} from 'lucide-react-native';
import { useChurch } from '../context/ChurchContext';
import { useAuth } from '../context/AuthContext';
import ServiceRosterService from '../services/ServiceRosterService';
import {
  ServicePlan,
  SetlistItem,
  LiveServiceState,
} from '../types/serviceRoster';

const { width } = Dimensions.get('window');

const PRESET_STAGE_CUES = [
  'Wrap up in 2 mins',
  'Wrap up in 5 mins',
  'Start Altar Call',
  'Check Mic 2',
  'Extend Worship (+1 song)',
  'Next Slide Ready',
  'Clear Stage for Sermon',
  'Offering Bags Ready',
];

export default function LiveStageHUD({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { activeChurch } = useChurch();
  const { member } = useAuth();

  const churchId = route?.params?.churchId || activeChurch?.id || '';
  const serviceId = route?.params?.serviceId || route?.params?.plan?.id;

  // View Mode: 'stage' (Confidence Monitor) | 'tech' (Tech Booth Director) | 'musician' (Setlist & Chords)
  const [hudMode, setHudMode] = useState<'stage' | 'tech' | 'musician'>('stage');

  // Service data & real-time live state
  const [servicePlan, setServicePlan] = useState<ServicePlan | null>(route?.params?.plan || null);
  const [loading, setLoading] = useState<boolean>(!route?.params?.plan);
  const [liveState, setLiveState] = useState<LiveServiceState | undefined>(
    route?.params?.plan?.liveState
  );

  // Wall clock time
  const [wallClock, setWallClock] = useState<string>('');

  // Local countdown tracking (in seconds remaining for current item)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [itemDurationSeconds, setItemDurationSeconds] = useState<number>(0);
  const [isOverrun, setIsOverrun] = useState<boolean>(false);

  // Stage cue broadcast input
  const [customCueText, setCustomCueText] = useState<string>('');
  const [sendingCue, setSendingCue] = useState<boolean>(false);

  // Lyrics & Chords Modal
  const [showLyricsModal, setShowLyricsModal] = useState<boolean>(false);
  const [selectedSongForLyrics, setSelectedSongForLyrics] = useState<SetlistItem | null>(null);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cueFlashAnim = useRef(new Animated.Value(0)).current;

  // ── Wall Clock Interval ──
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setWallClock(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Pulsing LIVE dot ──
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // ── Real-time Firestore Listener for Service Plan & Live State ──
  useEffect(() => {
    if (!churchId || !serviceId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = ServiceRosterService.listenLiveServicePlan(churchId, serviceId, (plan) => {
      if (plan) {
        setServicePlan(plan);
        setLiveState(plan.liveState);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [churchId, serviceId]);

  // ── Flashing Cue Animation when new cue arrives ──
  useEffect(() => {
    if (liveState?.activeCue) {
      Animated.sequence([
        Animated.timing(cueFlashAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(cueFlashAnim, { toValue: 0.3, duration: 250, useNativeDriver: true }),
        Animated.timing(cueFlashAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [liveState?.activeCue?.id, cueFlashAnim]);

  // ── Countdown Timer Engine ──
  const runSheet = servicePlan?.runSheet || [];
  const currentIdx = liveState?.currentActivityIndex ?? 0;
  const currentItem = runSheet[currentIdx];
  const nextItem = runSheet[currentIdx + 1];

  useEffect(() => {
    if (!currentItem) {
      setSecondsRemaining(0);
      setItemDurationSeconds(0);
      setIsOverrun(false);
      return;
    }

    const durationSec = (currentItem.durationMinutes || 5) * 60;
    setItemDurationSeconds(durationSec);

    const updateCountdown = () => {
      if (!liveState?.isLive || liveState?.status !== 'running') {
        return;
      }

      let startedMs = Date.now();
      if (liveState?.itemStartedAt) {
        if (typeof liveState.itemStartedAt.toMillis === 'function') {
          startedMs = liveState.itemStartedAt.toMillis();
        } else if (liveState.itemStartedAt instanceof Date) {
          startedMs = liveState.itemStartedAt.getTime();
        } else if (typeof liveState.itemStartedAt === 'number') {
          startedMs = liveState.itemStartedAt;
        }
      }

      const elapsedSec = Math.floor((Date.now() - startedMs) / 1000);
      const remainingSec = durationSec - elapsedSec;

      if (remainingSec <= 0) {
        setIsOverrun(true);
        setSecondsRemaining(Math.abs(remainingSec));
      } else {
        setIsOverrun(false);
        setSecondsRemaining(remainingSec);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [currentItem, liveState?.status, liveState?.isLive, liveState?.itemStartedAt]);

  // Format seconds into MM:SS
  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Determine countdown color badge
  const getTimerColor = () => {
    if (isOverrun) return '#EF4444';
    if (secondsRemaining <= 120) return '#FBBF24';
    return '#10B981';
  };

  // Find linked worship song in setlist if current item is a song
  const matchingSetlistSong = servicePlan?.setlist?.find(
    (s) =>
      s.title?.toLowerCase().includes(currentItem?.program?.toLowerCase() || '') ||
      (currentItem?.program || '').toLowerCase().includes(s.title?.toLowerCase() || '')
  );

  // ── Controller Handlers (Tech Booth & Stage) ──
  const handleStartService = async () => {
    if (!servicePlan || !churchId) return;
    try {
      await ServiceRosterService.startLiveService(churchId, servicePlan.id);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to start live service.');
    }
  };

  const handleAdvanceNext = async () => {
    if (!servicePlan || !churchId) return;
    const nextIdx = currentIdx + 1;
    if (nextIdx >= runSheet.length) {
      Alert.alert('End of Order of Service', 'You have reached the last program item.');
      return;
    }
    try {
      await ServiceRosterService.advanceLiveActivity(churchId, servicePlan.id, nextIdx, true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to advance activity.');
    }
  };

  const handleAdvancePrev = async () => {
    if (!servicePlan || !churchId) return;
    const prevIdx = currentIdx - 1;
    if (prevIdx < 0) return;
    try {
      await ServiceRosterService.advanceLiveActivity(churchId, servicePlan.id, prevIdx, false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to backtrack activity.');
    }
  };

  const handleJumpToItem = async (targetIndex: number) => {
    if (!servicePlan || !churchId) return;
    const target = runSheet[targetIndex];
    Alert.alert(
      'Jump to Program Item',
      `Advance stage display to "${target?.program}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Jump Now',
          style: 'default',
          onPress: async () => {
            try {
              await ServiceRosterService.advanceLiveActivity(
                churchId,
                servicePlan.id,
                targetIndex,
                true
              );
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to jump item.');
            }
          },
        },
      ]
    );
  };

  const handleTogglePause = async () => {
    if (!servicePlan || !liveState || !churchId) return;
    const isCurrentlyPaused = liveState.status === 'paused';
    try {
      await ServiceRosterService.setLiveTimerPaused(
        churchId,
        servicePlan.id,
        !isCurrentlyPaused
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to toggle pause.');
    }
  };

  const handleSendCue = async (cueText: string) => {
    if (!servicePlan || !cueText.trim() || !churchId) return;
    try {
      setSendingCue(true);
      const senderName = member?.name || 'Tech Director';
      await ServiceRosterService.sendStageCue(churchId, servicePlan.id, cueText.trim(), senderName);
      setCustomCueText('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to broadcast cue.');
    } finally {
      setSendingCue(false);
    }
  };

  const handleDismissCue = async () => {
    if (!servicePlan || !churchId) return;
    try {
      await ServiceRosterService.dismissStageCue(churchId, servicePlan.id);
    } catch (err: any) {
      console.error('Error dismissing cue:', err);
    }
  };

  const handleEndService = async () => {
    if (!servicePlan || !churchId) return;
    Alert.alert(
      'Conclude Live Service',
      `Are you sure you want to end "${servicePlan.serviceTitle}"? All items will be marked as completed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Conclude Service',
          style: 'destructive',
          onPress: async () => {
            try {
              await ServiceRosterService.endLiveService(churchId, servicePlan.id);
              Alert.alert('Service Completed', 'Live service concluded successfully.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to end service.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor="#1A2D5A" />
        <ActivityIndicator size="large" color="#FBBF24" />
        <Text style={styles.loadingTxt}>Connecting to Live Stage HUD...</Text>
      </View>
    );
  }

  const isLiveNow = liveState?.isLive && liveState?.status !== 'ended';
  const timerColor = getTimerColor();

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1A2D5A" />

      {/* ── TOP STAGE HEADER BAR (WeChristian2 Navy & Gold Console) ── */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={styles.titleColumn}>
            <View style={styles.statusRow}>
              {isLiveNow ? (
                <View style={styles.liveBadge}>
                  <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
                  <Text style={styles.liveBadgeTxt}>
                    {liveState?.status === 'paused' ? 'PAUSED' : 'LIVE STAGE'}
                  </Text>
                </View>
              ) : (
                <View style={styles.standbyBadge}>
                  <Text style={styles.standbyBadgeTxt}>STANDBY</Text>
                </View>
              )}
              <Text style={styles.wallClockTxt}>{wallClock}</Text>
            </View>
            <Text style={styles.serviceTitleTxt} numberOfLines={1}>
              {servicePlan?.serviceTitle ||
                (activeChurch?.name ? `${activeChurch.name} Worship Service` : 'Worship Service')}
            </Text>
          </View>
        </View>

        {/* HUD Mode Switcher Pills */}
        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[styles.modeTab, hudMode === 'stage' && styles.modeTabActive]}
            onPress={() => setHudMode('stage')}
            activeOpacity={0.8}
          >
            <Tv
              size={14}
              color={hudMode === 'stage' ? '#1A2D5A' : '#CBD5E1'}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.modeTabTxt, hudMode === 'stage' && styles.modeTabTxtActive]}>
              Stage HUD
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, hudMode === 'tech' && styles.modeTabActive]}
            onPress={() => setHudMode('tech')}
            activeOpacity={0.8}
          >
            <Sliders
              size={14}
              color={hudMode === 'tech' ? '#1A2D5A' : '#CBD5E1'}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.modeTabTxt, hudMode === 'tech' && styles.modeTabTxtActive]}>
              Tech Booth
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, hudMode === 'musician' && styles.modeTabActive]}
            onPress={() => setHudMode('musician')}
            activeOpacity={0.8}
          >
            <Music
              size={14}
              color={hudMode === 'musician' ? '#1A2D5A' : '#CBD5E1'}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.modeTabTxt, hudMode === 'musician' && styles.modeTabTxtActive]}>
              Setlist
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── BROADCAST ACTIVE STAGE CUE BANNER ── */}
      {liveState?.activeCue && (
        <Animated.View style={[styles.stageCueAlert, { opacity: cueFlashAnim }]}>
          <View style={styles.cueAlertContent}>
            <AlertTriangle size={22} color="#FEF08A" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cueAlertLabel}>
                STAGE CUE FROM {liveState.activeCue.sentBy?.toUpperCase() || 'TECH BOOTH'}
              </Text>
              <Text style={styles.cueAlertMsg}>"{liveState.activeCue.message}"</Text>
            </View>
            <TouchableOpacity
              style={styles.cueDismissBtn}
              onPress={handleDismissCue}
              activeOpacity={0.8}
            >
              <Text style={styles.cueDismissTxt}>Acknowledge</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* ── MAIN CONTENT BASED ON MODE ── */}
      {hudMode === 'stage' && (
        <ScrollView
          style={styles.stageScroll}
          contentContainerStyle={styles.stageScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* GIANT COUNTDOWN CLOCK */}
          <View style={[styles.timerCard, { borderColor: timerColor }]}>
            <View style={styles.timerTopMeta}>
              <Text style={styles.timerSegmentLabel}>
                {isOverrun ? 'OVERRUN TIME · సమయం మించిపోయింది' : 'TIME REMAINING · మిగిలిన సమయం'}
              </Text>
              <Text style={[styles.timerStatePill, { color: timerColor }]}>
                {currentItem
                  ? `${currentItem.durationMinutes}m Segment (${currentItem.startTime} - ${currentItem.endTime})`
                  : 'No Active Item'}
              </Text>
            </View>

            <Text
              style={[
                styles.timerHugeNumber,
                { color: timerColor, textShadowColor: timerColor, textShadowRadius: 10 },
              ]}
            >
              {isOverrun ? `+${formatTime(secondsRemaining)}` : formatTime(secondsRemaining)}
            </Text>

            {/* Segment Progress Bar */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: timerColor,
                    width: isOverrun
                      ? '100%'
                      : `${Math.min(
                          100,
                          Math.max(
                            0,
                            ((itemDurationSeconds - secondsRemaining) /
                              (itemDurationSeconds || 1)) *
                              100
                          )
                        )}%`,
                  },
                ]}
              />
            </View>
          </View>

          {/* CURRENT ACTIVE PROGRAM CARD */}
          <View style={styles.currentSegmentCard}>
            <View style={styles.currentTagRow}>
              <View style={styles.currentBadge}>
                <Radio size={14} color="#FBBF24" style={{ marginRight: 6 }} />
                <Text style={styles.currentBadgeTxt}>
                  CURRENT ACTIVITY · ప్రస్తుత కార్యక్రమం ({runSheet.length > 0 ? currentIdx + 1 : 0}/
                  {runSheet.length})
                </Text>
              </View>

              {matchingSetlistSong && (
                <TouchableOpacity
                  style={styles.quickLyricsPill}
                  onPress={() => {
                    setSelectedSongForLyrics(matchingSetlistSong);
                    setShowLyricsModal(true);
                  }}
                  activeOpacity={0.8}
                >
                  <BookOpen size={13} color="#FBBF24" style={{ marginRight: 4 }} />
                  <Text style={styles.quickLyricsPillTxt}>Song Sheet</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.currentProgramTitle}>
              {currentItem?.program || 'Worship Service Program'}
            </Text>

            {/* Minister & Team Row */}
            <View style={styles.ministerBox}>
              <View style={styles.ministerItem}>
                <Mic size={16} color="#FBBF24" style={{ marginRight: 6 }} />
                <Text style={styles.ministerLabel}>Leader / Preacher:</Text>
                <Text style={styles.ministerValue}>
                  {currentItem?.responsiblePerson || 'Assigned Minister'}
                </Text>
              </View>

              {currentItem?.supportingTeam && (
                <View style={[styles.ministerItem, { marginTop: 4 }]}>
                  <Volume2 size={15} color="#60A5FA" style={{ marginRight: 6 }} />
                  <Text style={styles.ministerLabel}>Supporting Team:</Text>
                  <Text style={styles.ministerValue}>{currentItem.supportingTeam}</Text>
                </View>
              )}
            </View>

            {/* Music Quick Reference */}
            {matchingSetlistSong && (
              <View style={styles.songRefGrid}>
                <View style={styles.songRefPill}>
                  <Text style={styles.songRefLabel}>KEY</Text>
                  <Text style={styles.songRefVal}>{matchingSetlistSong.key || 'G'}</Text>
                </View>
                <View style={styles.songRefPill}>
                  <Text style={styles.songRefLabel}>TEMPO</Text>
                  <Text style={styles.songRefVal}>
                    {matchingSetlistSong.tempo ? `${matchingSetlistSong.tempo} BPM` : '120 BPM'}
                  </Text>
                </View>
                <View style={styles.songRefPill}>
                  <Text style={styles.songRefLabel}>TIME SIG</Text>
                  <Text style={styles.songRefVal}>
                    {matchingSetlistSong.timeSignature || '4/4'}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* NEXT UP PREVIEW BANNER */}
          {nextItem ? (
            <View style={styles.nextUpCard}>
              <View style={styles.nextUpTagRow}>
                <Text style={styles.nextUpLabel}>NEXT UP · తరువాత కార్యక్రమం</Text>
                <Text style={styles.nextUpDuration}>{nextItem.durationMinutes} mins</Text>
              </View>
              <Text style={styles.nextUpTitle}>{nextItem.program}</Text>
              <Text style={styles.nextUpMinister}>
                {nextItem.responsiblePerson || 'Minister'} · Scheduled {nextItem.startTime}
              </Text>
            </View>
          ) : (
            <View style={styles.nextUpCard}>
              <Text style={styles.nextUpLabel}>FINAL PROGRAM SEGMENT</Text>
              <Text style={styles.nextUpTitle}>Closing & Benediction</Text>
            </View>
          )}

          {/* QUICK BOTTOM STAGE ACTION BAR */}
          <View style={styles.stageActionRow}>
            <TouchableOpacity
              style={[styles.stageActionBtn, styles.stageActionBtnSecondary]}
              onPress={handleAdvancePrev}
              disabled={currentIdx <= 0}
              activeOpacity={0.8}
            >
              <SkipBack size={18} color={currentIdx <= 0 ? '#475569' : '#FFFFFF'} />
              <Text
                style={[
                  styles.stageActionBtnTxt,
                  { color: currentIdx <= 0 ? '#475569' : '#FFFFFF', marginLeft: 4 },
                ]}
              >
                Previous
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.stageActionBtn, styles.stageActionBtnPause]}
              onPress={handleTogglePause}
              activeOpacity={0.8}
            >
              {liveState?.status === 'paused' ? (
                <>
                  <Play size={18} color="#FFFFFF" fill="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.stageActionBtnTxt}>Resume Timer</Text>
                </>
              ) : (
                <>
                  <Pause size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.stageActionBtnTxt}>Pause Timer</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.stageActionBtn, styles.stageActionBtnNext]}
              onPress={handleAdvanceNext}
              disabled={currentIdx >= runSheet.length - 1}
              activeOpacity={0.85}
            >
              <Text style={styles.stageActionBtnTxt}>Next Activity</Text>
              <SkipForward size={18} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {hudMode === 'tech' && (
        <ScrollView
          style={styles.techScroll}
          contentContainerStyle={styles.techScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* MASTER EXECUTION CONTROLLER CARD */}
          <View style={styles.masterControlCard}>
            <Text style={styles.sectionHeading}>DIRECTOR MASTER CONTROLS</Text>
            <View style={styles.masterButtonsRow}>
              {!isLiveNow ? (
                <TouchableOpacity
                  style={[styles.masterBtn, { backgroundColor: '#059669', flex: 1 }]}
                  onPress={handleStartService}
                  activeOpacity={0.85}
                >
                  <Play size={18} color="#FFFFFF" fill="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.masterBtnTxt}>START LIVE SERVICE</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.masterBtn, { backgroundColor: '#D97706', flex: 1 }]}
                    onPress={handleTogglePause}
                    activeOpacity={0.85}
                  >
                    {liveState?.status === 'paused' ? (
                      <>
                        <Play size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.masterBtnTxt}>Resume</Text>
                      </>
                    ) : (
                      <>
                        <Pause size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.masterBtnTxt}>Pause</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.masterBtn,
                      { backgroundColor: '#1A2D5A', borderWidth: 1, borderColor: '#3B82F6', flex: 1.2 },
                    ]}
                    onPress={handleAdvanceNext}
                    activeOpacity={0.85}
                  >
                    <SkipForward size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.masterBtnTxt}>Advance Stage</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.masterBtn, { backgroundColor: '#C0392B', flex: 0.9 }]}
                    onPress={handleEndService}
                    activeOpacity={0.85}
                  >
                    <Square size={14} color="#FFFFFF" fill="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.masterBtnTxt}>End Service</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          {/* STAGE CUE BROADCASTER SECTION */}
          <View style={styles.cueBroadcasterCard}>
            <View style={styles.cueBroadcasterHeader}>
              <Bell size={16} color="#FBBF24" style={{ marginRight: 6 }} />
              <Text style={styles.cueBroadcasterTitle}>BROADCAST CUE TO STAGE DISPLAY</Text>
            </View>
            <Text style={styles.cueBroadcasterSub}>
              Instantly sends a high-priority alert to the pulpit / stage monitor
            </Text>

            {/* Quick preset chips */}
            <View style={styles.cueChipsRow}>
              {PRESET_STAGE_CUES.map((cue, idx) => (
                <TouchableOpacity
                  key={`cue_${idx}`}
                  style={styles.cueChip}
                  onPress={() => handleSendCue(cue)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cueChipTxt}>{cue}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Cue Input */}
            <View style={styles.customCueRow}>
              <TextInput
                style={styles.customCueInput}
                placeholder="Type custom stage message..."
                placeholderTextColor="#64748B"
                value={customCueText}
                onChangeText={setCustomCueText}
              />
              <TouchableOpacity
                style={[
                  styles.sendCueBtn,
                  (!customCueText.trim() || sendingCue) && styles.sendCueBtnDisabled,
                ]}
                onPress={() => handleSendCue(customCueText)}
                disabled={!customCueText.trim() || sendingCue}
                activeOpacity={0.8}
              >
                {sendingCue ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Send size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.sendCueBtnTxt}>Send</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* RUN-SHEET TIMELINE */}
          <View style={styles.timelineCard}>
            <Text style={styles.sectionHeading}>
              ORDER OF SERVICE TIMELINE ({runSheet.length} ITEMS)
            </Text>

            {runSheet.map((item, idx) => {
              const isCurrent = idx === currentIdx;
              const isCompleted = item.completionStatus === 'completed' || idx < currentIdx;

              return (
                <TouchableOpacity
                  key={item.id || `act_${idx}`}
                  style={[
                    styles.timelineItem,
                    isCurrent && styles.timelineItemCurrent,
                    isCompleted && styles.timelineItemCompleted,
                  ]}
                  onPress={() => handleJumpToItem(idx)}
                  activeOpacity={0.8}
                >
                  <View style={styles.timelineIdxBox}>
                    {isCurrent ? (
                      <View style={styles.timelineLiveDot} />
                    ) : isCompleted ? (
                      <CheckCircle2 size={16} color="#10B981" />
                    ) : (
                      <Text style={styles.timelineIdxTxt}>{idx + 1}</Text>
                    )}
                  </View>

                  <View style={{ flex: 1, paddingHorizontal: 10 }}>
                    <View style={styles.timelineRowTop}>
                      <Text
                        style={[
                          styles.timelineProgTitle,
                          isCurrent && { color: '#FBBF24', fontWeight: '800' },
                        ]}
                        numberOfLines={1}
                      >
                        {item.program}
                      </Text>
                      {isCurrent && (
                        <View style={styles.timelineNowBadge}>
                          <Text style={styles.timelineNowBadgeTxt}>NOW ON STAGE</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.timelineMeta}>
                      {item.startTime} - {item.endTime} ({item.durationMinutes} min) ·{' '}
                      {item.responsiblePerson || 'Assigned'}
                    </Text>
                  </View>

                  <ChevronRight size={16} color={isCurrent ? '#FBBF24' : '#475569'} />
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      {hudMode === 'musician' && (
        <ScrollView
          style={styles.musicianScroll}
          contentContainerStyle={styles.musicianScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.setlistHeader}>
            <Text style={styles.sectionHeading}>
              WORSHIP SETLIST ({servicePlan?.setlist?.length || 0} SONGS)
            </Text>
            <Text style={styles.setlistSub}>
              Tap any song to view chords, regional and English lyrics for stage singing
            </Text>
          </View>

          {!servicePlan?.setlist || servicePlan.setlist.length === 0 ? (
            <View style={styles.emptySetlistCard}>
              <Music size={32} color="#64748B" style={{ marginBottom: 10 }} />
              <Text style={styles.emptySetlistTxt}>No songs added to this service setlist.</Text>
            </View>
          ) : (
            servicePlan.setlist.map((song, idx) => (
              <TouchableOpacity
                key={song.id || `song_${idx}`}
                style={styles.songCard}
                onPress={() => {
                  setSelectedSongForLyrics(song);
                  setShowLyricsModal(true);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.songTopRow}>
                  <View style={styles.songIndexCircle}>
                    <Text style={styles.songIndexTxt}>{idx + 1}</Text>
                  </View>

                  <View style={{ flex: 1, paddingHorizontal: 10 }}>
                    <Text style={styles.songTitleEn}>{song.title}</Text>
                    {song.titleTe && <Text style={styles.songTitleTe}>{song.titleTe}</Text>}
                  </View>

                  <View style={styles.songKeyBadge}>
                    <Text style={styles.songKeyBadgeTxt}>Key {song.key || 'G'}</Text>
                  </View>
                </View>

                <View style={styles.songFooterRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} color="#94A3B8" />
                    <Text style={styles.songFooterItem}>{song.durationMinutes || 6}m</Text>
                  </View>
                  <Text style={styles.songFooterItem}>
                    Tempo: {song.tempo ? `${song.tempo} BPM` : '120 BPM'}
                  </Text>
                  <Text style={styles.songFooterItem}>
                    Leader: {song.ledBy || 'Worship Leader'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* ── LYRICS & CHORDS STAGE MODAL ── */}
      <Modal
        visible={showLyricsModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowLyricsModal(false)}
      >
        <View style={[styles.lyricsModalRoot, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <StatusBar barStyle="light-content" backgroundColor="#1A2D5A" />

          {/* Modal Header */}
          <View style={styles.lyricsModalHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.modalKeyRow}>
                <View style={styles.modalKeyBadge}>
                  <Text style={styles.modalKeyBadgeTxt}>
                    KEY {selectedSongForLyrics?.key || 'G'}
                  </Text>
                </View>
                <View style={styles.modalBpmBadge}>
                  <Text style={styles.modalBpmBadgeTxt}>
                    {selectedSongForLyrics?.tempo
                      ? `${selectedSongForLyrics.tempo} BPM`
                      : '120 BPM'}
                  </Text>
                </View>
              </View>
              <Text style={styles.lyricsModalTitle}>{selectedSongForLyrics?.title}</Text>
              {selectedSongForLyrics?.titleTe && (
                <Text style={styles.lyricsModalTeluguTitle}>
                  {selectedSongForLyrics.titleTe}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.lyricsModalCloseBtn}
              onPress={() => setShowLyricsModal(false)}
              activeOpacity={0.8}
            >
              <X size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Lyrics Content */}
          <ScrollView
            style={styles.lyricsScroll}
            contentContainerStyle={styles.lyricsScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {selectedSongForLyrics?.lyricsTe ? (
              <View style={styles.lyricsBlock}>
                <Text style={styles.lyricsBlockHeading}>REGIONAL / TELUGU LYRICS · తెలుగు సాహిత్యం</Text>
                <Text style={styles.lyricsTeTxt}>{selectedSongForLyrics.lyricsTe}</Text>
              </View>
            ) : null}

            {selectedSongForLyrics?.lyricsEn ? (
              <View style={styles.lyricsBlock}>
                <Text style={styles.lyricsBlockHeading}>ENGLISH / TRANSLITERATION</Text>
                <Text style={styles.lyricsEnTxt}>{selectedSongForLyrics.lyricsEn}</Text>
              </View>
            ) : null}

            {!selectedSongForLyrics?.lyricsTe && !selectedSongForLyrics?.lyricsEn && (
              <View style={styles.noLyricsBox}>
                <BookOpen size={36} color="#64748B" style={{ marginBottom: 12 }} />
                <Text style={styles.noLyricsTitle}>No Lyrics Uploaded</Text>
                <Text style={styles.noLyricsSub}>
                  Lyrics and chord charts can be attached in the Service Planner setlist editor.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050B14',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#050B14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTxt: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 14,
  },

  // ── Header Bar ──
  topHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(251, 191, 36, 0.25)',
    backgroundColor: '#1A2D5A',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleColumn: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C0392B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 5,
  },
  liveBadgeTxt: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  standbyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  standbyBadgeTxt: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  wallClockTxt: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  serviceTitleTxt: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  // ── Mode Switcher ──
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(5, 11, 20, 0.5)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 3,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
  },
  modeTabActive: {
    backgroundColor: '#FBBF24',
  },
  modeTabTxt: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
  },
  modeTabTxtActive: {
    color: '#1A2D5A',
    fontWeight: '800',
  },

  // ── Stage Cue Alert ──
  stageCueAlert: {
    backgroundColor: '#78350F',
    borderBottomWidth: 2,
    borderBottomColor: '#FBBF24',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cueAlertContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cueAlertLabel: {
    color: '#FEF08A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cueAlertMsg: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 1,
  },
  cueDismissBtn: {
    backgroundColor: '#FBBF24',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 10,
  },
  cueDismissTxt: {
    color: '#1A2D5A',
    fontSize: 11,
    fontWeight: '800',
  },

  // ── Stage Confidence Monitor View ──
  stageScroll: {
    flex: 1,
  },
  stageScrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  timerCard: {
    backgroundColor: '#0B132B',
    borderRadius: 20,
    borderWidth: 2,
    paddingVertical: 20,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  timerTopMeta: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timerSegmentLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timerStatePill: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  timerHugeNumber: {
    fontSize: Math.min(72, width * 0.18),
    fontWeight: '900',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
    marginVertical: 4,
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Current Segment Card
  currentSegmentCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 16,
    marginBottom: 14,
  },
  currentTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2D5A',
    borderWidth: 1,
    borderColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 1,
  },
  currentBadgeTxt: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  quickLyricsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quickLyricsPillTxt: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '700',
  },
  currentProgramTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
    marginBottom: 10,
  },
  ministerBox: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 10,
  },
  ministerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ministerLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 6,
  },
  ministerValue: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '700',
  },
  songRefGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  songRefPill: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  songRefLabel: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  songRefVal: {
    color: '#FBBF24',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 1,
  },

  // Next Up Card
  nextUpCard: {
    backgroundColor: '#0B132B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 14,
    marginBottom: 20,
  },
  nextUpTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nextUpLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  nextUpDuration: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '700',
  },
  nextUpTitle: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  nextUpMinister: {
    color: '#94A3B8',
    fontSize: 12,
  },

  // Bottom Action Row
  stageActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stageActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  stageActionBtnSecondary: {
    backgroundColor: '#1E293B',
    flex: 0.9,
  },
  stageActionBtnPause: {
    backgroundColor: '#D97706',
    flex: 1.1,
  },
  stageActionBtnNext: {
    backgroundColor: '#1A2D5A',
    borderWidth: 1,
    borderColor: '#3B82F6',
    flex: 1.3,
  },
  stageActionBtnTxt: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // ── Tech Booth Console Mode ──
  techScroll: {
    flex: 1,
  },
  techScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeading: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  masterControlCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 14,
    marginBottom: 16,
  },
  masterButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  masterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  masterBtnTxt: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // Stage Cue Broadcaster
  cueBroadcasterCard: {
    backgroundColor: '#1E1B18',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#78350F',
    padding: 14,
    marginBottom: 16,
  },
  cueBroadcasterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cueBroadcasterTitle: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  cueBroadcasterSub: {
    color: '#A1A1AA',
    fontSize: 11,
    marginTop: 2,
    marginBottom: 10,
  },
  cueChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  cueChip: {
    backgroundColor: '#451A03',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#78350F',
  },
  cueChipTxt: {
    color: '#FEF08A',
    fontSize: 11,
    fontWeight: '700',
  },
  customCueRow: {
    flexDirection: 'row',
    gap: 8,
  },
  customCueInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 13,
  },
  sendCueBtn: {
    backgroundColor: '#D97706',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  sendCueBtnDisabled: {
    opacity: 0.5,
  },
  sendCueBtnTxt: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // Timeline
  timelineCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 14,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  timelineItemCurrent: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#FBBF24',
  },
  timelineItemCompleted: {
    opacity: 0.65,
  },
  timelineIdxBox: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLiveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FBBF24',
  },
  timelineIdxTxt: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  timelineRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineProgTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  timelineNowBadge: {
    backgroundColor: '#C0392B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  timelineNowBadgeTxt: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  timelineMeta: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },

  // ── Musician Mode ──
  musicianScroll: {
    flex: 1,
  },
  musicianScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  setlistHeader: {
    marginBottom: 14,
  },
  setlistSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 1,
  },
  emptySetlistCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySetlistTxt: {
    color: '#94A3B8',
    fontSize: 13,
  },
  songCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 14,
    marginBottom: 10,
  },
  songTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  songIndexCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1A2D5A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  songIndexTxt: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '800',
  },
  songTitleEn: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  songTitleTe: {
    color: '#94A3B8',
    fontSize: 12.5,
    marginTop: 1,
  },
  songKeyBadge: {
    backgroundColor: '#C0392B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  songKeyBadgeTxt: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  songFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  songFooterItem: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },

  // ── Lyrics Modal ──
  lyricsModalRoot: {
    flex: 1,
    backgroundColor: '#050B14',
  },
  lyricsModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 18,
    backgroundColor: '#1A2D5A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(251, 191, 36, 0.25)',
  },
  modalKeyRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  modalKeyBadge: {
    backgroundColor: '#C0392B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modalKeyBadgeTxt: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  modalBpmBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modalBpmBadgeTxt: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '800',
  },
  lyricsModalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  lyricsModalTeluguTitle: {
    color: '#CBD5E1',
    fontSize: 15,
    marginTop: 2,
  },
  lyricsModalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  lyricsScroll: {
    flex: 1,
  },
  lyricsScrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  lyricsBlock: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 18,
    marginBottom: 16,
  },
  lyricsBlockHeading: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  lyricsTeTxt: {
    color: '#F8FAFC',
    fontSize: 16,
    lineHeight: 28,
    fontWeight: '600',
  },
  lyricsEnTxt: {
    color: '#E2E8F0',
    fontSize: 15,
    lineHeight: 26,
    fontWeight: '500',
  },
  noLyricsBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noLyricsTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  noLyricsSub: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
  },
});
