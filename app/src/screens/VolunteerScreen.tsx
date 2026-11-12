import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  HeartHandshake,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Layers,
  Send,
  Phone,
  User,
  Check,
  AlertCircle,
  Calendar,
  MapPin,
  Plus,
  Trash2,
  X,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useChurch } from '../context/ChurchContext';
import { useTheme } from '../context/ThemeContext';
import VolunteerService from '../services/VolunteerService';
import {
  VolunteerApplication,
  VolunteerStatus,
  COMMON_MINISTRIES,
} from '../types/volunteer';
import { formatDateDisplay, formatDateMonthYear, formatTimeTo12Hour } from '../utils/DateUtils';
import { CustomAlert } from '../components/CustomAlert';

const { width } = Dimensions.get('window');

export const SKILL_CATEGORIES = [
  { id: 'worship', name: 'Worship', emoji: '🎵' },
  { id: 'media', name: 'Tech & Media', emoji: '🎥' },
  { id: 'operations', name: 'Hospitality', emoji: '🤝' },
  { id: 'ministry', name: 'Teaching & Care', emoji: '📖' },
];

export const SKILLS_BY_CATEGORY: Record<string, string[]> = {
  worship: [
    'Worship Leader',
    'Vocalist / Singer',
    'Acoustic Guitar',
    'Electric Guitar',
    'Keyboard / Piano',
    'Drums / Percussion',
    'Choir / Harmonies',
  ],
  media: [
    'Sound Engineer',
    'Live Stream Broadcast',
    'Video Camera Operator',
    'Media & Lyrics Projection',
    'Graphic Design & Media',
    'Video Editor',
    'Lighting Technician',
  ],
  operations: [
    'Usher & Welcome',
    'Food & Hospitality',
    'Stage Setup & Logistics',
    'Driver / Transportation',
    'First Aid / Medical Care',
    'Event Coordination',
  ],
  ministry: [
    'Sunday School Teacher',
    'Children Ministry Helper',
    'Youth Ministry Leader',
    'Intercessory Prayer Leader',
    'Outreach / Visitation',
    'Pastoral Care & Counseling',
  ],
};

const ALL_CATEGORY_SKILLS: string[] = Array.from(
  new Set(Object.values(SKILLS_BY_CATEGORY).flat())
);

const MINISTRY_METAS: Record<string, { emoji: string; short: string }> = {
  worship: { emoji: '🎵', short: 'Worship' },
  media_tech: { emoji: '🎥', short: 'Media & Tech' },
  ushers: { emoji: '🤝', short: 'Ushers' },
  children: { emoji: '👶', short: 'Kids' },
  hospitality: { emoji: '☕', short: 'Hospitality' },
  prayer: { emoji: '🙏', short: 'Prayer' },
  setup: { emoji: '🛠️', short: 'Setup' },
  transport: { emoji: '🚗', short: 'Transport' },
};

export default function VolunteerScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, member } = useAuth();
  const { activeChurch } = useChurch();
  const { isDark, colors } = useTheme();

  const churchId = activeChurch?.id || 'default';

  const [myApplications, setMyApplications] = useState<VolunteerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedMinistries, setSelectedMinistries] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedSkillCategory, setSelectedSkillCategory] = useState<string>('worship');
  const [customSkill, setCustomSkill] = useState('');
  const [availabilityNotes, setAvailabilityNotes] = useState('');

  // Active View Tab: 'apply' | 'my_status'
  const [activeTab, setActiveTab] = useState<'apply' | 'my_status'>('apply');

  // Filter skills by active category
  const displayedSkills = useMemo(() => {
    return SKILLS_BY_CATEGORY[selectedSkillCategory] || SKILLS_BY_CATEGORY.worship;
  }, [selectedSkillCategory]);

  // Custom Alert
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info';
  }>({ visible: false, title: '', message: '' });

  // Resubmission Rule: Check for active pending general application
  const pendingGeneralApp = useMemo(() => {
    return myApplications.find(
      (app) => app.volunteerType === 'general' && app.status === 'pending'
    );
  }, [myApplications]);

  // Latest general application (for status awareness)
  const latestGeneralApp = useMemo(() => {
    const list = myApplications.filter((app) => app.volunteerType === 'general');
    return list.length > 0 ? list[0] : null;
  }, [myApplications]);

  const fetchApplications = async () => {
    if (!user?.uid) return;
    try {
      const apps = await VolunteerService.getMyApplications(churchId, user.uid);
      setMyApplications(apps);
      // If user has existing applications, switch to status tab by default on initial load
      if (apps.length > 0 && loading) {
        setActiveTab('my_status');
      }
    } catch (err) {
      console.warn('Error fetching my volunteer applications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [churchId, user?.uid]);

  const notifyPendingUnderReview = () => {
    setAlertConfig({
      visible: true,
      title: 'Application Under Review',
      message:
        'Your previous volunteer application is currently under review. You can submit a new application once the review is completed.',
      type: 'info',
    });
  };

  const toggleMinistry = (label: string) => {
    if (pendingGeneralApp) {
      notifyPendingUnderReview();
      return;
    }
    setSelectedMinistries((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]
    );
  };

  const toggleSkill = (skill: string) => {
    if (pendingGeneralApp) {
      notifyPendingUnderReview();
      return;
    }
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleAddCustomSkill = () => {
    if (pendingGeneralApp) {
      notifyPendingUnderReview();
      return;
    }
    if (!customSkill.trim()) return;
    if (!selectedSkills.includes(customSkill.trim())) {
      setSelectedSkills((prev) => [...prev, customSkill.trim()]);
    }
    setCustomSkill('');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'V';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleSubmit = async () => {
    // Enforce Resubmission Rule: Block submission if a previous application is pending review
    if (pendingGeneralApp) {
      notifyPendingUnderReview();
      return;
    }

    if (selectedMinistries.length === 0) {
      setAlertConfig({
        visible: true,
        title: 'Select a Ministry',
        message: 'Please choose at least one ministry area you would like to serve in.',
        type: 'info',
      });
      return;
    }

    try {
      setSubmitting(true);
      const memberName =
        member?.name ||
        user?.displayName ||
        (member?.firstName ? `${member.firstName} ${member.lastName || ''}`.trim() : 'Faithful Member');
      const memberPhone = member?.phone || user?.phoneNumber || '';
      const memberEmail = member?.email || user?.email || '';

      await VolunteerService.submitGeneralApplication(
        churchId,
        {
          id: user?.uid || '',
          name: memberName,
          phone: memberPhone,
          email: memberEmail,
        },
        {
          preferredMinistries: selectedMinistries,
          skills: selectedSkills,
          availabilityNotes: availabilityNotes.trim(),
        }
      );

      // Reset form
      setSelectedMinistries([]);
      setSelectedSkills([]);
      setAvailabilityNotes('');

      // Refresh list & switch to status tab
      await fetchApplications();
      setActiveTab('my_status');

      setAlertConfig({
        visible: true,
        title: 'Application Submitted!',
        message:
          'Thank you for your willingness to serve! Your volunteer application has been submitted to church leadership. You will receive a push notification as soon as it is reviewed.',
        type: 'success',
      });
    } catch (err: any) {
      setAlertConfig({
        visible: true,
        title: 'Submission Failed',
        message: err.message || 'Could not submit your volunteer application. Please try again.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = (appId: string) => {
    Alert.alert(
      'Withdraw Application',
      'Are you sure you want to withdraw this volunteer application?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              if (user?.uid) {
                await VolunteerService.withdrawApplication(churchId, appId, user.uid);
                fetchApplications();
              }
            } catch (err) {
              console.warn('Withdraw error:', err);
            }
          },
        },
      ]
    );
  };

  const handleDeleteApplication = (appId: string) => {
    Alert.alert(
      'Delete Application',
      'Are you sure you want to permanently delete this volunteer application? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await VolunteerService.deleteApplication(churchId, appId);
              setMyApplications((prev) => prev.filter((item) => item.id !== appId));
              setAlertConfig({
                visible: true,
                title: 'Application Deleted',
                message: 'Your volunteer application has been removed.',
                type: 'info',
              });
              fetchApplications();
            } catch (err: any) {
              setAlertConfig({
                visible: true,
                title: 'Delete Failed',
                message: err?.message || 'Could not delete your application. Please try again.',
                type: 'error',
              });
            }
          },
        },
      ]
    );
  };

  const renderStatusBadge = (status: VolunteerStatus) => {
    switch (status) {
      case 'approved':
        return (
          <View style={[styles.badge, { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' }]}>
            <CheckCircle2 size={11} color="#15803D" style={{ marginRight: 3 }} />
            <Text style={[styles.badgeTxt, { color: '#15803D' }]}>APPROVED</Text>
          </View>
        );
      case 'rejected':
        return (
          <View style={[styles.badge, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
            <XCircle size={11} color="#B91C1C" style={{ marginRight: 3 }} />
            <Text style={[styles.badgeTxt, { color: '#B91C1C' }]}>NOT APPROVED</Text>
          </View>
        );
      case 'withdrawn':
        return (
          <View style={[styles.badge, { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }]}>
            <AlertCircle size={11} color="#64748B" style={{ marginRight: 3 }} />
            <Text style={[styles.badgeTxt, { color: '#64748B' }]}>WITHDRAWN</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.badge, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
            <Clock size={11} color="#B45309" style={{ marginRight: 3 }} />
            <Text style={[styles.badgeTxt, { color: '#B45309' }]}>UNDER REVIEW</Text>
          </View>
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />

      {/* ── Page Header Hero Card (Consistent with Events, Prayer, Updates, etc.) ── */}
      <LinearGradient
        colors={['#2b52a1', '#1a3673']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>

        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 20 }}>
            <Text style={styles.headerTitle}>Church Volunteering</Text>
            <Text style={styles.headerSub}>SERVE WITH JOY</Text>
          </View>
        </View>

        <View style={{ width: 24 }} />
      </LinearGradient>

      {/* ── Tabs - Signature pill badge matching Events / Prayer ── */}
      <View
        style={[
          styles.tabContainer,
          isDark ? styles.tabContainerDark : styles.tabContainerLight,
        ]}
      >
        {/* Tab 1: Apply to Serve */}
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'apply' && styles.tabBtnActive]}
          onPress={() => setActiveTab('apply')}
          activeOpacity={0.8}
        >
          {activeTab === 'apply' && (
            <View style={styles.activeTabGradientWrap} pointerEvents="none">
              <LinearGradient
                colors={['#059669', '#10B981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, zIndex: 2 }}>
            <Layers
              size={14}
              color={activeTab === 'apply' ? '#FFFFFF' : isDark ? '#A1A1AA' : '#64748B'}
            />
            <Text
              style={[
                styles.tabTxt,
                activeTab === 'apply'
                  ? styles.tabTxtActive
                  : isDark
                  ? styles.tabTxtInactiveDark
                  : styles.tabTxtInactiveLight,
              ]}
            >
              Apply to Serve
            </Text>
          </View>
        </TouchableOpacity>

        {/* Tab 2: My Applications */}
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'my_status' && styles.tabBtnActive]}
          onPress={() => setActiveTab('my_status')}
          activeOpacity={0.8}
        >
          {activeTab === 'my_status' && (
            <View style={styles.activeTabGradientWrap} pointerEvents="none">
              <LinearGradient
                colors={['#059669', '#10B981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, zIndex: 2 }}>
            <Clock
              size={14}
              color={activeTab === 'my_status' ? '#FFFFFF' : isDark ? '#A1A1AA' : '#64748B'}
            />
            <Text
              style={[
                styles.tabTxt,
                activeTab === 'my_status'
                  ? styles.tabTxtActive
                  : isDark
                  ? styles.tabTxtInactiveDark
                  : styles.tabTxtInactiveLight,
              ]}
            >
              My Applications
            </Text>
            {myApplications.length > 0 && (
              <View
                style={[
                  styles.tabBadge,
                  {
                    backgroundColor:
                      activeTab === 'my_status'
                        ? 'rgba(255, 255, 255, 0.25)'
                        : isDark
                        ? '#27272A'
                        : '#E2E8F0',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeTxt,
                    {
                      color:
                        activeTab === 'my_status'
                          ? '#FFFFFF'
                          : isDark
                          ? '#CBD5E1'
                          : '#475569',
                    },
                  ]}
                >
                  {myApplications.length}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchApplications();
            }}
            tintColor="#059669"
            colors={['#059669']}
          />
        }
      >
        {activeTab === 'apply' ? (
          <View>
            {/* INSPIRATION BANNER */}
            <View
              style={[
                styles.bannerCard,
                {
                  backgroundColor: isDark ? '#064E3B20' : '#ECFDF5',
                  borderColor: isDark ? '#065F46' : '#A7F3D0',
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} color="#059669" />
                <Text style={[styles.bannerTitle, { color: isDark ? '#6EE7B7' : '#047857' }]}>
                  Serve the Lord with Gladness
                </Text>
              </View>
              <Text
                style={[
                  styles.bannerQuote,
                  { color: isDark ? '#D1FAE5' : '#065F46' },
                ]}
              >
                "Each of you should use whatever gift you have received to serve others, as faithful stewards of God’s grace." — 1 Peter 4:10
              </Text>
            </View>

            {/* ── RESUBMISSION RULE NOTICE BANNER ── */}
            {pendingGeneralApp ? (
              <View
                style={[
                  styles.pendingNoticeBanner,
                  {
                    backgroundColor: isDark ? '#78350F25' : '#FFFBEB',
                    borderColor: '#F59E0B',
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                  <View style={styles.pendingClockWrap}>
                    <Clock size={20} color="#D97706" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <Text style={[styles.pendingNoticeTitle, { color: isDark ? '#FDE68A' : '#92400E' }]}>
                        Application Under Review
                      </Text>
                      <View style={styles.pendingNoticeBadge}>
                        <Text style={styles.pendingNoticeBadgeTxt}>PENDING</Text>
                      </View>
                    </View>
                    <Text style={[styles.pendingNoticeDesc, { color: isDark ? '#FEF3C7' : '#B45309' }]}>
                      Your previous volunteer application is currently under review. You can submit a new application once the review is completed.
                    </Text>
                    <View style={[styles.pendingMetaBox, { backgroundColor: isDark ? '#27272A' : '#FEF3C780' }]}>
                      <Text style={[styles.pendingMetaTxt, { color: isDark ? '#E4E4E7' : '#78350F' }]}>
                        📅 Submitted: {pendingGeneralApp.createdAt?.toDate ? formatDateDisplay(pendingGeneralApp.createdAt.toDate()) : 'Recently'}
                      </Text>
                      {Array.isArray(pendingGeneralApp.preferredMinistries) && pendingGeneralApp.preferredMinistries.length > 0 && (
                        <Text style={[styles.pendingMetaTxt, { color: isDark ? '#E4E4E7' : '#78350F', marginTop: 2 }]}>
                          📋 Ministries: {pendingGeneralApp.preferredMinistries.join(', ')}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.pendingViewBtn}
                      onPress={() => setActiveTab('my_status')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.pendingViewBtnTxt}>View Status in My Applications →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : latestGeneralApp?.status === 'approved' ? (
              <View
                style={[
                  styles.approvedStatusBanner,
                  {
                    backgroundColor: isDark ? '#064E3B20' : '#ECFDF5',
                    borderColor: '#A7F3D0',
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} color="#059669" />
                  <Text style={[styles.approvedStatusTitle, { color: '#047857' }]}>
                    Active Volunteer Approved
                  </Text>
                </View>
                <Text style={[styles.approvedStatusDesc, { color: isDark ? '#D1FAE5' : '#065F46' }]}>
                  You are currently an approved church volunteer. You may submit a new application below to update your ministry preferences or join additional teams.
                </Text>
              </View>
            ) : latestGeneralApp?.status === 'rejected' ? (
              <View
                style={[
                  styles.rejectedStatusBanner,
                  {
                    backgroundColor: isDark ? '#450A0A20' : '#FEF2F2',
                    borderColor: '#FECACA',
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={16} color="#DC2626" />
                  <Text style={[styles.rejectedStatusTitle, { color: '#B91C1C' }]}>
                    Ready for New Application
                  </Text>
                </View>
                <Text style={[styles.rejectedStatusDesc, { color: isDark ? '#FCA5A5' : '#991B1B' }]}>
                  Your previous volunteer application was reviewed. You are welcome to submit a new application below.
                </Text>
              </View>
            ) : null}

            {/* ── WHERE WOULD YOU LIKE TO SERVE (MODERN 2-COLUMN GRID) ── */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  marginTop: 14,
                },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Where Would You Like to Serve? *
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Select one or more ministry areas that match your heart and gifts:
              </Text>

              <View style={styles.ministryGrid}>
                {COMMON_MINISTRIES.map((min) => {
                  const isSelected = selectedMinistries.includes(min.label);
                  const meta = MINISTRY_METAS[min.id] || { emoji: '✨', short: 'Ministry' };
                  const parts = min.label.split('·');
                  const engTitle = parts[0]?.trim() || min.label;
                  const telTitle = parts[1]?.trim() || '';

                  return (
                    <TouchableOpacity
                      key={min.id}
                      activeOpacity={0.8}
                      style={[
                        styles.ministryCard,
                        {
                          backgroundColor: isSelected
                            ? (isDark ? 'rgba(5, 150, 105, 0.22)' : '#ECFDF5')
                            : (isDark ? '#1C1C20' : '#F8FAFC'),
                          borderColor: isSelected
                            ? '#059669'
                            : (isDark ? '#2E2E33' : '#E2E8F0'),
                        },
                      ]}
                      onPress={() => toggleMinistry(min.label)}
                    >
                      {/* Top Header of Card: Emoji Icon on left, Checkmark on right */}
                      <View style={styles.ministryCardTop}>
                        <View
                          style={[
                            styles.ministryEmojiWrap,
                            {
                              backgroundColor: isSelected
                                ? (isDark ? 'rgba(5, 150, 105, 0.35)' : '#D1FAE5')
                                : (isDark ? '#27272A' : '#EDEAE3'),
                            },
                          ]}
                        >
                          <Text style={{ fontSize: 18 }}>{meta.emoji}</Text>
                        </View>
                        <View
                          style={[
                            styles.ministryCheckCircle,
                            isSelected
                              ? { backgroundColor: '#059669', borderColor: '#059669' }
                              : {
                                  backgroundColor: 'transparent',
                                  borderColor: isDark ? '#3F3F46' : '#CBD5E1',
                                },
                          ]}
                        >
                          {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                        </View>
                      </View>

                      {/* Main Title & Translation Subtitle */}
                      <Text
                        style={[
                          styles.ministryEngTitle,
                          { color: isSelected ? (isDark ? '#6EE7B7' : '#047857') : colors.text },
                        ]}
                        numberOfLines={2}
                      >
                        {engTitle}
                      </Text>
                      {!!telTitle && (
                        <Text
                          style={[
                            styles.ministryTelTitle,
                            { color: isSelected ? (isDark ? '#A7F3D0' : '#059669') : colors.textSecondary },
                          ]}
                          numberOfLines={1}
                        >
                          {telTitle}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* ── YOUR SKILLS & TALENTS ── */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  marginTop: 14,
                },
              ]}
            >
              <View style={styles.skillsHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    Your Skills & Talents (Optional)
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: colors.textSecondary, marginBottom: 0, marginTop: 3 }]}>
                    Select any talents or abilities you would love to contribute:
                  </Text>
                </View>
              </View>

              {/* Selected Talents Summary Tray */}
              {selectedSkills.length > 0 && (
                <View
                  style={[
                    styles.selectedSkillsTray,
                    {
                      backgroundColor: isDark ? 'rgba(5, 150, 105, 0.14)' : '#ECFDF5',
                      borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
                    },
                  ]}
                >
                  <View style={styles.selectedSkillsTrayHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={13} color="#059669" />
                      <Text style={[styles.selectedSkillsTrayTitle, { color: isDark ? '#6EE7B7' : '#047857' }]}>
                        Selected Talents ({selectedSkills.length})
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setSelectedSkills([])}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B', fontWeight: '700' }}>
                        Clear all
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.selectedChipsWrap}>
                    {selectedSkills.map((sk, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.selectedPillBadge}
                        onPress={() => toggleSkill(sk)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.selectedPillBadgeTxt}>{sk}</Text>
                        <X size={11} color="#FFFFFF" strokeWidth={2.6} style={{ marginLeft: 4 }} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Category Filter Horizontal Pills */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.skillCatScroll}
                style={{ marginTop: 12, marginBottom: 12 }}
              >
                {SKILL_CATEGORIES.map((cat) => {
                  const isActive = selectedSkillCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.skillCatPill,
                        {
                          backgroundColor: isActive
                            ? (isDark ? 'rgba(5, 150, 105, 0.25)' : '#ECFDF5')
                            : (isDark ? '#27272A' : '#F1F5F9'),
                          borderColor: isActive
                            ? '#059669'
                            : (isDark ? '#3F3F46' : '#E2E8F0'),
                        },
                      ]}
                      onPress={() => setSelectedSkillCategory(cat.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={{ fontSize: 13, marginRight: 5 }}>{cat.emoji}</Text>
                      <Text
                        style={[
                          styles.skillCatPillTxt,
                          {
                            color: isActive
                              ? (isDark ? '#6EE7B7' : '#047857')
                              : (isDark ? '#D4D4D8' : '#475569'),
                            fontWeight: isActive ? '800' : '600',
                          },
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Category Skills 2-Column Balanced Grid */}
              <View style={styles.skillsGrid}>
                {displayedSkills.map((sk, idx) => {
                  const isSelected = selectedSkills.includes(sk);
                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.78}
                      style={[
                        styles.skillGridCard,
                        {
                          backgroundColor: isSelected
                            ? (isDark ? 'rgba(5, 150, 105, 0.22)' : '#ECFDF5')
                            : (isDark ? '#1C1C20' : '#F8FAFC'),
                          borderColor: isSelected
                            ? '#059669'
                            : (isDark ? '#2E2E33' : '#E2E8F0'),
                        },
                      ]}
                      onPress={() => toggleSkill(sk)}
                    >
                      <View
                        style={[
                          styles.skillCardCheck,
                          isSelected
                            ? { backgroundColor: '#059669', borderColor: '#059669' }
                            : { backgroundColor: 'transparent', borderColor: isDark ? '#3F3F46' : '#CBD5E1' },
                        ]}
                      >
                        {isSelected && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                      </View>
                      <Text
                        style={[
                          styles.skillGridCardTxt,
                          {
                            color: isSelected
                              ? (isDark ? '#6EE7B7' : '#047857')
                              : (isDark ? '#E4E4E7' : '#1E293B'),
                            fontWeight: isSelected ? '800' : '600',
                          },
                        ]}
                        numberOfLines={2}
                      >
                        {sk}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Clean Integrated Custom Skill Adder */}
              <View
                style={[
                  styles.customSkillRowClean,
                  {
                    backgroundColor: isDark ? '#1C1C20' : '#F8FAFC',
                    borderColor: isDark ? '#2E2E33' : '#E2E8F0',
                  },
                ]}
              >
                <TextInput
                  style={[
                    styles.customSkillInputClean,
                    { color: colors.text },
                  ]}
                  placeholder="Other skill or talent..."
                  placeholderTextColor={isDark ? '#71717A' : '#94A3B8'}
                  value={customSkill}
                  onChangeText={setCustomSkill}
                  onSubmitEditing={handleAddCustomSkill}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={[
                    styles.customSkillAddBtnClean,
                    { backgroundColor: '#059669' },
                    !customSkill.trim() && { opacity: 0.5 },
                  ]}
                  onPress={handleAddCustomSkill}
                  disabled={!customSkill.trim()}
                  activeOpacity={0.8}
                >
                  <Text style={styles.customSkillAddTxtClean}>+ Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── AVAILABILITY & NOTES ── */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  marginTop: 14,
                },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Availability & Notes (Optional)
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Share your schedule, service preferences, or any specific remarks:
              </Text>
              <TextInput
                style={[
                  styles.notesInput,
                  {
                    backgroundColor: isDark ? '#27272A' : '#FAF7F2',
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g. Available on Sunday mornings, or anytime during youth events and festivals."
                placeholderTextColor={isDark ? '#71717A' : '#94A3B8'}
                value={availabilityNotes}
                onChangeText={setAvailabilityNotes}
                multiline
              />
            </View>

            {/* ── SUBMIT BUTTON (ELEVATED GRADIENT PILL) ── */}
            <TouchableOpacity
              style={[
                styles.submitBtnWrap,
                Boolean(pendingGeneralApp) && styles.submitBtnDisabled,
                submitting && { opacity: 0.6 },
              ]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={
                  pendingGeneralApp
                    ? ['#6B7280', '#4B5563']
                    : ['#059669', '#10B981']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtnGradient}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : pendingGeneralApp ? (
                  <>
                    <Clock size={16} color="#FFFFFF" />
                    <Text style={styles.submitBtnTxt}>Application Currently Under Review</Text>
                  </>
                ) : (
                  <>
                    <Send size={16} color="#FFFFFF" />
                    <Text style={styles.submitBtnTxt}>Submit Volunteer Application</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          /* MY APPLICATIONS / STATUS TAB */
          <View>
            {loading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#059669" />
                <Text style={{ marginTop: 12, color: colors.textSecondary, fontSize: 13 }}>
                  Loading your applications...
                </Text>
              </View>
            ) : myApplications.length === 0 ? (
              <View
                style={[
                  styles.emptyCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.emptyIconWrap}>
                  <HeartHandshake size={36} color="#059669" />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  No Applications Yet
                </Text>
                <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                  You haven't submitted any volunteer applications yet. Switch to "Apply to Serve" to join our church ministries!
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={() => setActiveTab('apply')}
                  activeOpacity={0.8}
                >
                  <Layers size={14} color="#FFFFFF" />
                  <Text style={styles.emptyActionTxt}>Apply to Serve</Text>
                </TouchableOpacity>
              </View>
            ) : (
              myApplications.map((app) => {
                const isEvent = app.volunteerType === 'event';
                const isApproved = app.status === 'approved';
                const isPending = app.status === 'pending';
                const initials = getInitials(app.memberName || member?.name);

                return (
                  <View
                    key={app.id}
                    style={[
                      styles.appCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                      isApproved && styles.appCardApproved,
                    ]}
                  >
                    {/* CARD HEADER */}
                    <View style={styles.appCardHeader}>
                      <View style={styles.appCardAvatarCol}>
                        <View
                          style={[
                            styles.appAvatar,
                            { backgroundColor: isEvent ? '#0284C7' : '#059669' },
                          ]}
                        >
                          <Text style={styles.appAvatarTxt}>{initials}</Text>
                        </View>
                      </View>

                      <View style={styles.appCardMetaCol}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={[styles.appTypeTag, { color: isEvent ? '#0284C7' : '#059669' }]}>
                            {isEvent ? 'EVENT VOLUNTEER' : 'GENERAL CHURCH'}
                          </Text>
                          {renderStatusBadge(app.status)}
                        </View>
                        <Text style={[styles.appNameTxt, { color: colors.text }]} numberOfLines={1}>
                          {isEvent ? app.eventTitle || 'Church Event' : app.memberName || 'Volunteer'}
                        </Text>
                        <Text style={[styles.appDateTxt, { color: colors.textSecondary }]}>
                          Submitted: {app.createdAt?.toDate ? formatDateMonthYear(app.createdAt.toDate()) : 'Recently'}
                        </Text>
                      </View>
                    </View>

                    {/* EVENT DETAILS */}
                    {isEvent && (
                      <View style={[styles.eventDetailsBox, { backgroundColor: isDark ? '#27272A' : '#F8FAFC' }]}>
                        {!!app.eventDate && (
                          <View style={styles.eventMetaRow}>
                            <Calendar size={12} color="#059669" />
                            <Text style={[styles.eventMetaTxt, { color: colors.text }]}>
                              Date: <Text style={{ fontWeight: '700' }}>{formatDateMonthYear(app.eventDate)}</Text>
                            </Text>
                          </View>
                        )}
                        {!!app.eventTime && (
                          <View style={styles.eventMetaRow}>
                            <Clock size={12} color="#0284C7" />
                            <Text style={[styles.eventMetaTxt, { color: colors.text }]}>
                              Time: <Text style={{ fontWeight: '700' }}>{formatTimeTo12Hour(app.eventTime)}</Text>
                            </Text>
                          </View>
                        )}
                        {!!app.eventLocation && (
                          <View style={styles.eventMetaRow}>
                            <MapPin size={12} color="#DC2626" />
                            <Text style={[styles.eventMetaTxt, { color: colors.text }]}>
                              Venue: <Text style={{ fontWeight: '700' }}>{app.eventLocation}</Text>
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* GENERAL MINISTRIES */}
                    {!isEvent && Array.isArray(app.preferredMinistries) && app.preferredMinistries.length > 0 && (
                      <View style={{ marginTop: 10 }}>
                        <Text style={[styles.metaSectionLabel, { color: colors.textSecondary }]}>
                          SELECTED MINISTRIES
                        </Text>
                        <View style={styles.ministryTagRow}>
                          {app.preferredMinistries.map((m, idx) => (
                            <View
                              key={idx}
                              style={[
                                styles.ministryTag,
                                { backgroundColor: isDark ? '#27272A' : '#F1F5F9' },
                              ]}
                            >
                              <Text style={[styles.ministryTagTxt, { color: colors.text }]}>{m}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* ASSIGNMENT INFO (IF APPROVED) */}
                    {isApproved && (
                      <View style={[styles.approvedBanner, { backgroundColor: isDark ? '#064E3B20' : '#ECFDF5' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <CheckCircle2 size={15} color="#15803D" />
                          <Text style={styles.approvedRoleTxt}>
                            Assigned Role: {app.assignedRole || app.preferredRole || 'Church Volunteer'}
                          </Text>
                        </View>
                        {!!app.assignedTimeSlot && (
                          <Text style={styles.approvedMetaTxt}>
                            ⏰ Reporting Time: {formatTimeTo12Hour(app.assignedTimeSlot)}
                          </Text>
                        )}
                        {!!app.assignedLocation && (
                          <Text style={styles.approvedMetaTxt}>
                            📍 Duty Station: {app.assignedLocation}
                          </Text>
                        )}
                        {!!app.assignedResponsibility && (
                          <Text style={[styles.approvedMetaTxt, { fontStyle: 'italic', marginTop: 3 }]}>
                            Duties: {app.assignedResponsibility}
                          </Text>
                        )}
                      </View>
                    )}

                    {/* REJECTION REASON */}
                    {app.status === 'rejected' && !!app.rejectionReason && (
                      <View style={styles.rejectedBanner}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <AlertCircle size={13} color="#B91C1C" />
                          <Text style={styles.rejectedTitle}>Update from Leadership</Text>
                        </View>
                        <Text style={styles.rejectedTxt}>{app.rejectionReason}</Text>
                      </View>
                    )}

                    {/* PENDING STATUS EXPLANATORY NOTE */}
                    {isPending && (
                      <View style={[styles.pendingCardNote, { backgroundColor: isDark ? '#78350F20' : '#FFFBEB', borderColor: isDark ? '#B45309' : '#FDE68A' }]}>
                        <Clock size={13} color="#D97706" style={{ marginTop: 1 }} />
                        <Text style={[styles.pendingCardNoteTxt, { color: isDark ? '#FDE68A' : '#92400E' }]}>
                          Your previous volunteer application is currently under review. You can submit a new application once the review is completed.
                        </Text>
                      </View>
                    )}

                    {/* WITHDRAW & DELETE FOOTER */}
                    <View style={[styles.cardFooter, { borderTopColor: isDark ? '#27272A' : '#F1F5F9' }]}>
                      {isPending && (
                        <TouchableOpacity
                          onPress={() => handleWithdraw(app.id)}
                          style={styles.withdrawBtn}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.withdrawBtnTxt}>Withdraw</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() => handleDeleteApplication(app.id)}
                        style={[
                          styles.deleteBtn,
                          {
                            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.14)' : '#FEF2F2',
                            borderColor: isDark ? 'rgba(248, 113, 113, 0.3)' : '#FECACA',
                          },
                        ]}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={12} color={isDark ? '#F87171' : '#DC2626'} />
                        <Text style={[styles.deleteBtnTxt, { color: isDark ? '#F87171' : '#DC2626' }]}>
                          Delete Application
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#1a2d5a',
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight ?? 24) + 12,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: Platform.OS === 'ios' ? 120 : 100,
  },
  backBtn: {
    zIndex: 10,
    padding: 6,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerSub: {
    color: '#aac4e8',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 12,
    marginHorizontal: 16,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 28,
    borderWidth: 1,
    gap: 4,
    marginBottom: 6,
  },
  tabContainerDark: {
    backgroundColor: '#18181B',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  tabContainerLight: {
    backgroundColor: '#E9E9E9',
    borderColor: '#374151',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  tabBtnActive: {
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 4,
  },
  activeTabGradientWrap: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    overflow: 'hidden',
  },
  tabTxt: {
    fontSize: 13,
  },
  tabTxtActive: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  tabTxtInactiveDark: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tabTxtInactiveLight: {
    color: '#374151',
    fontWeight: '700',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  tabBadgeTxt: {
    fontSize: 10,
    fontWeight: '800',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 110,
  },
  bannerCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  bannerQuote: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  pendingNoticeBanner: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 14,
  },
  pendingClockWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingNoticeTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  pendingNoticeBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pendingNoticeBadgeTxt: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.3,
  },
  pendingNoticeDesc: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
    fontWeight: '500',
  },
  pendingMetaBox: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
  },
  pendingMetaTxt: {
    fontSize: 11,
    fontWeight: '600',
  },
  pendingViewBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  pendingViewBtnTxt: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#D97706',
  },
  approvedStatusBanner: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  approvedStatusTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  approvedStatusDesc: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },
  rejectedStatusBanner: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  rejectedStatusTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  rejectedStatusDesc: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },
  card: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 12,
  },
  profileBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  profileBadgeTxt: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  ministryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  ministryCard: {
    width: '48.5%',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  ministryCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ministryEmojiWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ministryCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ministryEngTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    lineHeight: 16,
  },
  ministryTelTitle: {
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 2,
  },
  skillsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  selectedSkillsTray: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    marginTop: 10,
    marginBottom: 4,
  },
  selectedSkillsTrayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedSkillsTrayTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  selectedChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  selectedPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingVertical: 4.5,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  selectedPillBadgeTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  skillCatScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  skillCatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.2,
  },
  skillCatPillTxt: {
    fontSize: 12,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  skillGridCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.2,
    minHeight: 46,
    gap: 8,
  },
  skillCardCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillGridCardTxt: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  customSkillRowClean: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    height: 44,
    marginTop: 14,
    paddingHorizontal: 6,
  },
  customSkillInputClean: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
    paddingHorizontal: 8,
  },
  customSkillAddBtnClean: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customSkillAddTxtClean: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    height: 85,
    textAlignVertical: 'top',
  },
  submitBtnWrap: {
    marginTop: 22,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#059669',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  submitBtnGradient: {
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
  },
  submitBtnDisabled: {
    shadowOpacity: 0.05,
    elevation: 1,
  },
  submitBtnTxt: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  emptyCard: {
    padding: 36,
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 20,
  },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  emptyActionBtn: {
    marginTop: 16,
    backgroundColor: '#059669',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emptyActionTxt: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  appCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  appCardApproved: {
    borderColor: '#A7F3D0',
    borderWidth: 1.5,
  },
  appCardHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  appCardAvatarCol: {},
  appAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appAvatarTxt: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  appCardMetaCol: {
    flex: 1,
    gap: 3,
  },
  appTypeTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  appNameTxt: {
    fontSize: 15,
    fontWeight: '800',
  },
  appDateTxt: {
    fontSize: 11,
  },
  eventDetailsBox: {
    marginTop: 10,
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventMetaTxt: {
    fontSize: 12,
  },
  metaSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  ministryTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  ministryTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ministryTagTxt: {
    fontSize: 11,
    fontWeight: '600',
  },
  approvedBanner: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  approvedRoleTxt: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
  approvedMetaTxt: {
    fontSize: 11,
    color: '#065F46',
    marginTop: 2,
  },
  rejectedBanner: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectedTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B91C1C',
  },
  rejectedTxt: {
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 16,
  },
  pendingCardNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  pendingCardNoteTxt: {
    fontSize: 11.5,
    lineHeight: 16,
    flex: 1,
    fontWeight: '500',
  },
  cardFooter: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },
  withdrawBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  withdrawBtnTxt: {
    fontSize: 11.5,
    color: '#D97706',
    fontWeight: '700',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 8,
    borderWidth: 1,
  },
  deleteBtnTxt: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeTxt: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
