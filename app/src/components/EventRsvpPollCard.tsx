import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import {
  Check,
  Clock,
  Users,
  Vote,
  BarChart3,
  Info,
} from 'lucide-react-native';
import EventRsvpService, {
  EventRsvpStatus,
  EventRsvpStats,
  EventRsvpRecord,
} from '../services/EventRsvpService';

export interface EventRsvpPollCardProps {
  eventId: string;
  churchId?: string;
  eventTitle: string;
  eventDate?: string;
  rsvpDeadline?: string;
  rsvpEnabled?: boolean;
  isCompleted?: boolean;
  currentUser?: {
    id: string;
    name?: string;
    phone?: string;
    photo?: string;
  };
  isAdmin?: boolean;
  onViewAnalytics?: () => void;
  isDark?: boolean;
}

interface WhatsAppPollOptionConfig {
  key: EventRsvpStatus;
  label: string;
  emoji: string;
  accentColor: string;
  barFillLight: string;
  barFillDark: string;
  selectedBarFillLight: string;
  selectedBarFillDark: string;
  selectedBgLight: string;
  selectedBgDark: string;
  selectedBorderColor: string;
  trackBgLight: string;
  trackBgDark: string;
}

const WHATSAPP_POLL_OPTIONS: WhatsAppPollOptionConfig[] = [
  {
    key: 'Going',
    label: 'Yes',
    emoji: '',
    accentColor: '#059669', // Emerald / WhatsApp Green
    barFillLight: '#D1FAE5',
    barFillDark: 'rgba(16, 185, 129, 0.22)',
    selectedBarFillLight: '#A7F3D0',
    selectedBarFillDark: 'rgba(16, 185, 129, 0.35)',
    selectedBgLight: '#F0FDF4',
    selectedBgDark: 'rgba(5, 150, 105, 0.12)',
    selectedBorderColor: '#059669',
    trackBgLight: '#F8FAFC',
    trackBgDark: '#1E293B',
  },
  {
    key: 'Not Going',
    label: 'No',
    emoji: '',
    accentColor: '#DC2626', // Crimson
    barFillLight: '#FEE2E2',
    barFillDark: 'rgba(239, 68, 68, 0.20)',
    selectedBarFillLight: '#FECACA',
    selectedBarFillDark: 'rgba(239, 68, 68, 0.35)',
    selectedBgLight: '#FEF2F2',
    selectedBgDark: 'rgba(220, 38, 38, 0.12)',
    selectedBorderColor: '#DC2626',
    trackBgLight: '#F8FAFC',
    trackBgDark: '#1E293B',
  },
  {
    key: 'Not Interested',
    label: 'Not Interested',
    emoji: '',
    accentColor: '#D97706', // Amber
    barFillLight: '#FEF3C7',
    barFillDark: 'rgba(245, 158, 11, 0.20)',
    selectedBarFillLight: '#FDE68A',
    selectedBarFillDark: 'rgba(245, 158, 11, 0.35)',
    selectedBgLight: '#FFFBEB',
    selectedBgDark: 'rgba(217, 119, 6, 0.12)',
    selectedBorderColor: '#D97706',
    trackBgLight: '#F8FAFC',
    trackBgDark: '#1E293B',
  },
];

export const EventRsvpPollCard: React.FC<EventRsvpPollCardProps> = ({
  eventId,
  churchId,
  eventTitle,
  rsvpDeadline,
  rsvpEnabled = true,
  isCompleted = false,
  currentUser,
  isAdmin = false,
  onViewAnalytics,
  isDark = false,
}) => {
  // If RSVP is explicitly disabled or event is completed, do not render the poll
  if (rsvpEnabled === false || isCompleted) {
    return null;
  }

  const [selectedResponse, setSelectedResponse] = useState<EventRsvpStatus | null>(null);
  const [stats, setStats] = useState<EventRsvpStats>({
    goingCount: 0,
    interestedCount: 0,
    notGoingCount: 0,
    totalResponses: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [optimisticSelection, setOptimisticSelection] = useState<EventRsvpStatus | null>(null);

  // Check if RSVP deadline has expired
  const isDeadlinePassed = useMemo(() => {
    if (!rsvpDeadline) return false;
    try {
      let deadlineTimestamp: number | null = null;
      if (rsvpDeadline.includes('-') && rsvpDeadline.split('-')[0].length === 2) {
        // DD-MM-YYYY format
        const [d, m, y] = rsvpDeadline.split('-').map(Number);
        deadlineTimestamp = new Date(y, m - 1, d, 23, 59, 59).getTime();
      } else {
        deadlineTimestamp = new Date(rsvpDeadline).getTime();
      }
      if (deadlineTimestamp && !isNaN(deadlineTimestamp)) {
        return Date.now() > deadlineTimestamp;
      }
    } catch {
      return false;
    }
    return false;
  }, [rsvpDeadline]);

  // Listen to member's personal response in real-time
  useEffect(() => {
    if (!eventId || !currentUser?.id) return;
    const unsub = EventRsvpService.listenToMemberRsvp(
      churchId,
      eventId,
      currentUser.id,
      (record: EventRsvpRecord | null) => {
        if (record && record.status) {
          setSelectedResponse(record.status);
          setOptimisticSelection(record.status);
        } else {
          setSelectedResponse(null);
          setOptimisticSelection(null);
        }
      }
    );
    return () => unsub();
  }, [churchId, eventId, currentUser?.id]);

  // Listen to aggregate event RSVP stats in real-time
  useEffect(() => {
    if (!eventId) return;
    const unsub = EventRsvpService.listenToEventStats(
      churchId,
      eventId,
      (newStats) => {
        setStats(newStats);
      }
    );
    return () => unsub();
  }, [churchId, eventId]);

  const activeResponse = optimisticSelection ?? selectedResponse;

  const isOptionSelected = (optKey: EventRsvpStatus) => {
    if (!activeResponse) return false;
    if (activeResponse === optKey) return true;
    if (optKey === 'Not Interested' && activeResponse === 'Interested') return true;
    return false;
  };

  const getOptionVoteCount = (optKey: EventRsvpStatus): number => {
    if (optKey === 'Going') return stats.goingCount;
    if (optKey === 'Not Going') return stats.notGoingCount;
    if (optKey === 'Not Interested') return stats.interestedCount;
    return 0;
  };

  // Handle Response Selection (single choice, switchable, prevents duplicate votes)
  const handleSelectOption = async (option: EventRsvpStatus) => {
    if (isCompleted || isDeadlinePassed) {
      Alert.alert(
        'RSVP Closed',
        'This event has completed or the RSVP deadline has passed. Responses are now locked.'
      );
      return;
    }

    if (!currentUser?.id) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to submit your RSVP attendance response.'
      );
      return;
    }

    if (isOptionSelected(option)) {
      // Already selected this option
      return;
    }

    // Apply optimistic update immediately
    const prevSelection = activeResponse;
    setOptimisticSelection(option);
    setSubmitting(true);

    try {
      await EventRsvpService.submitRsvp(
        churchId,
        eventId,
        eventTitle,
        {
          id: currentUser.id,
          name: currentUser.name || 'Member',
          phone: currentUser.phone || '',
          photoURL: currentUser.photo || '',
        },
        option
      );
      setSelectedResponse(option);
    } catch (err: any) {
      console.error('[EventRsvpPollCard] Submit RSVP error:', err);
      // Revert optimistic selection on failure
      setOptimisticSelection(prevSelection);
      Alert.alert('RSVP Error', 'Could not save your response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const total = stats.totalResponses || 0;

  return (
    <View
      style={[
        styles.card,
        isDark ? styles.cardDark : styles.cardLight,
      ]}
    >
      {/* ── Top Bar: WhatsApp-style Poll Tag & Live Status ── */}
      <View style={styles.topHeaderRow}>
        <View style={styles.pollTag}>
          <Vote size={13} color="#059669" strokeWidth={2.5} style={{ marginRight: 5 }} />
          <Text style={styles.pollTagText}>EVENT POLL</Text>
        </View>

        {isDeadlinePassed ? (
          <View style={styles.closedBadge}>
            <Clock size={11} color="#B45309" style={{ marginRight: 4 }} />
            <Text style={styles.closedBadgeTxt}>CLOSED</Text>
          </View>
        ) : (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeTxt}>LIVE</Text>
          </View>
        )}
      </View>

      {/* ── Poll Question (WhatsApp Style) ── */}
      <View style={styles.questionSection}>
        <Text style={[styles.questionTitle, isDark ? styles.textDark : styles.textLight]}>
          Are you attending this event?
        </Text>
        <Text style={[styles.questionSubtitle, isDark ? styles.subDark : styles.subLight]}>
          మీరు ఈ కార్యక్రమంలో పాల్గొంటున్నారా? · Select one
        </Text>
      </View>

      {/* ── Three WhatsApp-Style Options with Horizontal Progress Bars ── */}
      <View style={styles.optionsList}>
        {WHATSAPP_POLL_OPTIONS.map((opt) => {
          const isSelected = isOptionSelected(opt.key);
          const count = getOptionVoteCount(opt.key);
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;

          return (
            <TouchableOpacity
              key={opt.key}
              onPress={() => handleSelectOption(opt.key)}
              disabled={isCompleted || isDeadlinePassed || submitting}
              activeOpacity={0.78}
              style={[
                styles.pollOptionTrack,
                isDark ? styles.pollOptionTrackDark : styles.pollOptionTrackLight,
                isSelected && {
                  borderColor: opt.selectedBorderColor,
                  borderWidth: 2,
                  backgroundColor: isDark ? opt.selectedBgDark : opt.selectedBgLight,
                },
                (isCompleted || isDeadlinePassed) && !isSelected && { opacity: 0.55 },
              ]}
            >
              {/* Horizontal Progress Bar Fill (Proportional to % of votes) */}
              {pct > 0 && (
                <View
                  style={[
                    styles.pollProgressFill,
                    {
                      width: `${pct}%`,
                      backgroundColor: isSelected
                        ? (isDark ? opt.selectedBarFillDark : opt.selectedBarFillLight)
                        : (isDark ? opt.barFillDark : opt.barFillLight),
                    },
                  ]}
                />
              )}

              {/* Foreground Content: Circular Selection Indicator + Option Label + Vote Stats */}
              <View style={styles.pollOptionContent}>
                {/* Circular Selection Indicator (WhatsApp style Radio/Check) */}
                <View
                  style={[
                    styles.circularIndicator,
                    isDark ? styles.circularIndicatorDark : styles.circularIndicatorLight,
                    isSelected && {
                      borderColor: opt.accentColor,
                      backgroundColor: opt.accentColor,
                    },
                  ]}
                >
                  {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3.5} />}
                </View>

                {/* Option Text (Label only: Yes, No, Not Interested) */}
                <View style={styles.optionLabelWrap}>
                  {!!opt.emoji && <Text style={styles.optionEmoji}>{opt.emoji}</Text>}
                  <Text
                    style={[
                      styles.optionLabelText,
                      isDark ? styles.textDark : styles.textLight,
                      isSelected && {
                        color: isDark ? '#FFFFFF' : '#0F172A',
                        fontWeight: '800',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {opt.label}
                  </Text>
                </View>

                {/* Vote Count & Percentage (WhatsApp-Style Right End) */}
                <View style={styles.voteStatsWrap}>
                  {isSelected && (
                    <View style={[styles.youVoteBadge, { backgroundColor: opt.accentColor }]}>
                      <Text style={styles.youVoteBadgeText}>YOU</Text>
                    </View>
                  )}
                  <Text
                    style={[
                      styles.voteStatsText,
                      isDark ? styles.subDark : styles.subLight,
                      isSelected && {
                        color: opt.accentColor,
                        fontWeight: '800',
                      },
                    ]}
                  >
                    {count} {count === 1 ? 'vote' : 'votes'} · {pct}%
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Submitting indicator */}
      {submitting && (
        <View style={styles.submittingRow}>
          <ActivityIndicator size="small" color="#059669" />
          <Text style={[styles.submittingTxt, isDark ? styles.subDark : styles.subLight]}>
            Saving your response in real time...
          </Text>
        </View>
      )}

      {/* ── Poll Bottom Info: Total Votes & Real-time Indicator ── */}
      <View style={styles.pollFooterRow}>
        <View style={styles.totalVotesWrap}>
          <Users size={14} color={isDark ? '#A7F3D0' : '#059669'} style={{ marginRight: 6 }} />
          <Text style={[styles.totalVotesText, isDark ? styles.textDark : styles.textLight]}>
            <Text style={{ fontWeight: '800' }}>{total}</Text> {total === 1 ? 'total vote' : 'total votes'}
          </Text>
        </View>

        <View style={styles.realtimeWrap}>
          <View style={styles.realtimeDot} />
          <Text style={[styles.realtimeText, isDark ? styles.subDark : styles.subLight]}>
            Real-time poll
          </Text>
        </View>
      </View>

      {/* WhatsApp Hint: Tap to change vote */}
      <View style={styles.hintRow}>
        <Info size={12} color={isDark ? '#94A3B8' : '#64748B'} style={{ marginRight: 5, marginTop: 1 }} />
        <Text style={[styles.hintText, isDark ? styles.subDark : styles.subLight]}>
          {isDeadlinePassed
            ? 'Voting has closed. Your final response is recorded above.'
            : 'Tap any option to vote. You can change your response anytime before the deadline.'}
        </Text>
      </View>

      {/* RSVP Deadline Banner if available */}
      {rsvpDeadline && (
        <View
          style={[
            styles.deadlineContainer,
            isDark ? styles.deadlineContainerDark : styles.deadlineContainerLight,
          ]}
        >
          <Clock size={13} color={isDeadlinePassed ? '#EF4444' : isDark ? '#A7F3D0' : '#059669'} />
          <Text
            style={[
              styles.deadlineTxt,
              {
                color: isDeadlinePassed
                  ? '#EF4444'
                  : isDark
                  ? '#D1FAE5'
                  : '#065F46',
              },
            ]}
          >
            {isDeadlinePassed
              ? `RSVP closed on ${rsvpDeadline}`
              : `RSVP Deadline: ${rsvpDeadline}`}
          </Text>
        </View>
      )}

      {/* ── Admin Action to View Detailed Participation Analytics ── */}
      {isAdmin && onViewAnalytics && (
        <TouchableOpacity
          style={[
            styles.adminAnalyticsBtn,
            isDark ? styles.adminAnalyticsBtnDark : styles.adminAnalyticsBtnLight,
          ]}
          onPress={onViewAnalytics}
          activeOpacity={0.85}
        >
          <BarChart3 size={15} color={isDark ? '#A7F3D0' : '#047857'} />
          <Text
            style={[
              styles.adminAnalyticsBtnTxt,
              { color: isDark ? '#A7F3D0' : '#047857' },
            ]}
          >
            Admin: View Detailed Participation & Member Roster
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default EventRsvpPollCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1.2,
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  textLight: {
    color: '#0F172A',
  },
  textDark: {
    color: '#F8FAFC',
  },
  subLight: {
    color: '#64748B',
  },
  subDark: {
    color: '#94A3B8',
  },

  /* Top Bar */
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pollTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  pollTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.6,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveBadgeTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
  },
  closedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  closedBadgeTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
  },

  /* Question */
  questionSection: {
    marginBottom: 14,
  },
  questionTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  questionSubtitle: {
    fontSize: 12,
    marginTop: 3,
    fontWeight: '500',
  },

  /* Options List (WhatsApp-style full-width rows with progress bars) */
  optionsList: {
    gap: 10,
  },
  pollOptionTrack: {
    height: 56,
    borderRadius: 14,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1.2,
    justifyContent: 'center',
  },
  pollOptionTrackLight: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  pollOptionTrackDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  pollProgressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 12,
  },
  pollOptionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    zIndex: 2,
  },

  /* Circular Selection Indicator (WhatsApp style Radio/Check) */
  circularIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },
  circularIndicatorLight: {
    borderColor: '#94A3B8',
    backgroundColor: 'transparent',
  },
  circularIndicatorDark: {
    borderColor: '#64748B',
    backgroundColor: 'transparent',
  },

  /* Option Text */
  optionLabelWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  optionEmoji: {
    fontSize: 15,
    marginRight: 7,
  },
  optionLabelText: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },

  /* Vote Count & % Stats */
  voteStatsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  youVoteBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  youVoteBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  voteStatsText: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* Submitting */
  submittingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  submittingTxt: {
    fontSize: 11.5,
    fontWeight: '600',
  },

  /* Footer */
  pollFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  totalVotesWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalVotesText: {
    fontSize: 12.5,
  },
  realtimeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  realtimeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  realtimeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* Hint */
  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  hintText: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },

  /* Deadline */
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    marginTop: 10,
  },
  deadlineContainerLight: {
    backgroundColor: '#ECFDF5',
  },
  deadlineContainerDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  deadlineTxt: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },

  /* Admin Action */
  adminAnalyticsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  adminAnalyticsBtnLight: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  adminAnalyticsBtnDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  adminAnalyticsBtnTxt: {
    fontSize: 12,
    fontWeight: '800',
  },
});
