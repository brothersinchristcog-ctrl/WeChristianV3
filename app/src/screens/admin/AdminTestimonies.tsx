import React, { useState, useEffect, useMemo, useContext, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Linking,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Lock,
  Globe,
  Play,
  Pause,
  RotateCcw,
  FileText,
  Image as ImageIcon,
  Download,
  User,
  Phone,
  Calendar,
  Trash2,
  EyeOff,
  Send,
  ChevronLeft,
  X,
  BookOpen,
  Video as VideoIcon,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import { AdminTabContext } from '../../context/AdminTabContext';
import TestimonyService, { MemberSummary } from '../../services/TestimonyService';
import {
  Testimony,
  TestimonyAttachment,
  TestimonyStatus,
} from '../../types/testimony';
import InAppDocumentViewerModal, {
  InAppDocumentViewerDoc,
} from '../../components/InAppDocumentViewerModal';

const ADMIN_CATEGORIES: TestimonyStatus[] = [
  'Pending Review',
  'Private',
  'Approved',
  'Published',
  'Rejected',
];

const formatDate = (ts: any): string => {
  if (!ts) return '—';
  try {
    const date =
      typeof ts.toDate === 'function'
        ? ts.toDate()
        : typeof ts.seconds === 'number'
        ? new Date(ts.seconds * 1000)
        : new Date(ts);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

const formatFileSize = (bytes?: number | null): string => {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDuration = (ms?: number | null): string => {
  if (!ms || ms <= 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const getInitials = (name?: string): string => {
  if (!name) return 'M';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

export default function AdminTestimonies({ navigation, route, routeParams }: any) {
  const screenBg = '#EDE8DC';
  const cardSurface = '#FFFFFF';
  const secondarySurface = '#F1F5F9';
  const primaryText = '#0F172A';
  const secondaryText = '#64748B';
  const adminBorderColor = 'rgba(26,45,90,0.08)';
  const accentColor = '#1a2d5a';
  const accentBlue = '#2563EB';

  const { user, member, isPlatformSuperAdmin } = useAuth();
  const { activeChurch } = useChurch();
  const { setActiveTab, setTabByName } = useContext(AdminTabContext) || {};

  const activeChurchId =
    activeChurch?.id ||
    member?.churchId ||
    member?.primaryChurchId ||
    'default';

  const targetTestimonyId =
    routeParams?.testimonyId || route?.params?.testimonyId;

  const cachedAdminTestimonies = TestimonyService.getCachedAdminTestimonies(activeChurchId);
  const [testimonies, setTestimonies] = useState<Testimony[]>(cachedAdminTestimonies || []);
  const [loading, setLoading] = useState(!cachedAdminTestimonies);
  const [selectedCategory, setSelectedCategory] =
    useState<TestimonyStatus>('Pending Review');
  const [searchQuery, setSearchQuery] = useState('');

  // Inspection & Action Modal State
  const [selectedTestimony, setSelectedTestimony] = useState<Testimony | null>(
    null
  );
  const [memberSummary, setMemberSummary] = useState<MemberSummary | null>(null);
  const [processingAction, setProcessingAction] = useState(false);

  // Reject Reason Modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Video Playback inside Admin Modal
  const videoRef = useRef<Video | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);

  // Attachments & In-App Document Viewer state
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({});
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [downloadingAttachmentPath, setDownloadingAttachmentPath] = useState<string | null>(null);
  const [viewerDoc, setViewerDoc] = useState<InAppDocumentViewerDoc | null>(null);

  // Cached member records to resolve live profile photos for all testimonies
  const [memberProfilesMap, setMemberProfilesMap] = useState<
    Record<string, { photoURL: string; name: string }>
  >({});

  const isAuthorizedAdmin = Boolean(
    isPlatformSuperAdmin ||
      String(member?.userType || '').toLowerCase().includes('admin') ||
      String(member?.userType || '').toLowerCase().includes('pastor') ||
      String(member?.userType || '').toLowerCase().includes('super')
  );

  useEffect(() => {
    setLoading(true);
    const unsub = TestimonyService.subscribeToAdminTestimonies(
      activeChurchId,
      (items) => {
        setTestimonies(items);
        setLoading(false);

        // Keep open modal synced with live updates
        setSelectedTestimony((prev) => {
          if (!prev) return null;
          return items.find((i) => i.testimonyId === prev.testimonyId) || null;
        });
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [activeChurchId]);

  // Batch fetch member photos from the existing church member records
  useEffect(() => {
    if (!testimonies || testimonies.length === 0) return;
    const mIds = Array.from(new Set(testimonies.map((t) => t.memberId).filter(Boolean)));
    const phs = Array.from(
      new Set(testimonies.map((t) => t.memberPhone).filter(Boolean))
    ) as string[];

    TestimonyService.getChurchMemberPhotos(activeChurchId, mIds, phs)
      .then((map) => {
        setMemberProfilesMap((prev) => ({ ...prev, ...map }));
      })
      .catch((err) =>
        console.warn('⚠️ [AdminTestimonies] Error fetching member photos:', err)
      );
  }, [testimonies, activeChurchId]);

  // Resolves the member profile info, prioritizing the existing Member record
  const getMemberProfile = (item: Testimony) => {
    const profile =
      (item.memberId ? memberProfilesMap[item.memberId] : undefined) ||
      (item.memberPhone
        ? memberProfilesMap[item.memberPhone.replace(/\D/g, '').slice(-10)]
        : undefined) ||
      (item.memberPhone ? memberProfilesMap[item.memberPhone] : undefined);

    const photoURL =
      (profile && typeof profile === 'object' ? profile.photoURL : undefined) ||
      item.memberPhotoUrl ||
      null;
    const name =
      (profile && typeof profile === 'object' ? profile.name : undefined) ||
      item.memberName ||
      'Church Member';
    return { photoURL, name };
  };

  // Open deep-linked testimony from push notification immediately
  const lastOpenedTargetIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!targetTestimonyId || lastOpenedTargetIdRef.current === targetTestimonyId) {
      return;
    }

    let isCancelled = false;

    // Check in-memory list first
    const found = testimonies.find((t) => t.testimonyId === targetTestimonyId);
    if (found) {
      lastOpenedTargetIdRef.current = targetTestimonyId;
      if (found.privacy === 'Private') {
        setSelectedCategory('Private');
      } else {
        setSelectedCategory(found.status);
      }
      handleOpenReviewModal(found);
      return;
    }

    // Direct lookup fallback if not yet in snapshot or during initial load
    TestimonyService.getTestimonyById(activeChurchId, targetTestimonyId)
      .then((doc) => {
        if (!isCancelled && doc) {
          lastOpenedTargetIdRef.current = targetTestimonyId;
          if (doc.privacy === 'Private') {
            setSelectedCategory('Private');
          } else {
            setSelectedCategory(doc.status);
          }
          handleOpenReviewModal(doc);
        }
      })
      .catch((err) => {
        console.warn('⚠️ [AdminTestimonies] Direct lookup of deep-linked testimony failed:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [targetTestimonyId, testimonies, activeChurchId]);

  const countsByCategory = useMemo(() => {
    const counts: Record<TestimonyStatus, number> = {
      'Pending Review': 0,
      Private: 0,
      Approved: 0,
      Published: 0,
      Rejected: 0,
    };
    for (const item of testimonies) {
      if (item.privacy === 'Private' || item.status === 'Private') {
        counts.Private += 1;
      } else if (counts[item.status] !== undefined) {
        counts[item.status] += 1;
      }
    }
    return counts;
  }, [testimonies]);

  const filteredTestimonies = useMemo(() => {
    return testimonies.filter((item) => {
      // Category matching:
      // Any testimony with privacy === 'Private' belongs strictly in the 'Private' tab
      const effectiveCategory: TestimonyStatus =
        item.privacy === 'Private' ? 'Private' : item.status;

      if (effectiveCategory !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (item.title || '').toLowerCase().includes(q);
        const matchMember = (item.memberName || '').toLowerCase().includes(q);
        const matchDesc = (item.description || '').toLowerCase().includes(q);
        const matchCategory = (item.category || '').toLowerCase().includes(q);
        return matchTitle || matchMember || matchDesc || matchCategory;
      }

      return true;
    });
  }, [testimonies, selectedCategory, searchQuery]);

  const handleOpenReviewModal = async (item: Testimony) => {
    setSelectedTestimony(item);
    setMemberSummary(null);
    setVideoUrl(null);
    setVideoError(null);
    setIsPlaying(false);
    setPositionMs(0);
    setDurationMs(item.videoDurationMs || 0);
    setAttachmentUrls({});

    // Fetch live Member record from Rhema Church/{churchId}/members/{memberId}
    TestimonyService.getMemberSummary(
      item.churchId || activeChurchId,
      item.memberId,
      item.memberName,
      item.memberPhotoUrl,
      item.memberPhone
    )
      .then((summary) => {
        setMemberSummary(summary);
        if (summary?.photoURL) {
          setMemberProfilesMap((prev) => ({
            ...prev,
            [item.memberId]: { photoURL: summary.photoURL!, name: summary.name },
            ...(item.memberPhone
              ? { [item.memberPhone]: { photoURL: summary.photoURL!, name: summary.name } }
              : {}),
          }));
        }
      })
      .catch(() => {});

    // Resolve signed Video URL if present
    if (item.videoStoragePath) {
      setVideoLoading(true);
      const signed = await TestimonyService.getSignedMediaUrl(item.videoStoragePath);
      if (signed) {
        setVideoUrl(signed);
      } else {
        setVideoError('Could not load video stream. Tap Retry.');
      }
      setVideoLoading(false);
    }

    // Resolve signed attachment URLs
    if (item.attachmentStoragePaths && item.attachmentStoragePaths.length > 0) {
      const resolved: Record<string, string> = {};
      await Promise.all(
        item.attachmentStoragePaths.map(async (att) => {
          const u = await TestimonyService.getSignedMediaUrl(att.path);
          if (u) resolved[att.path] = u;
        })
      );
      setAttachmentUrls(resolved);
    }
  };

  const handleRetryVideo = async () => {
    if (!selectedTestimony?.videoStoragePath) return;
    setVideoLoading(true);
    setVideoError(null);
    const signed = await TestimonyService.getSignedMediaUrl(
      selectedTestimony.videoStoragePath
    );
    if (signed) {
      setVideoUrl(signed);
    } else {
      setVideoError('Video stream could not be loaded.');
    }
    setVideoLoading(false);
  };

  const handleTogglePlayPause = async () => {
    if (!videoRef.current) return;
    try {
      const status = await videoRef.current.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await videoRef.current.pauseAsync();
        } else {
          await videoRef.current.playAsync();
        }
      }
    } catch {}
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setIsPlaying(status.isPlaying);
    setPositionMs(status.positionMillis || 0);
    if (status.durationMillis && status.durationMillis > 0) {
      setDurationMs(status.durationMillis);
    }
  };

  const handleOpenAttachment = async (att: TestimonyAttachment) => {
    try {
      setDownloadingAttachmentPath(att.path);
      const url =
        attachmentUrls[att.path] ||
        (await TestimonyService.getSignedMediaUrl(att.path));
      setDownloadingAttachmentPath(null);

      if (!url) {
        Alert.alert('Attachment Unavailable', 'Unable to load attachment URL.');
        return;
      }

      // Open directly inside the Rhema Church app (no external browser or app redirects)
      setViewerDoc({
        url,
        name: att.name || 'Testimony Attachment',
        mimeType: att.mimeType,
      });
    } catch (err: any) {
      setDownloadingAttachmentPath(null);
      console.warn('Could not open attachment:', err);
      Alert.alert('Error', 'Could not open attachment: ' + (err?.message || 'Unknown error'));
    }
  };

  const handleDownloadAttachment = async (att: TestimonyAttachment) => {
    try {
      setDownloadingAttachmentPath(att.path);
      const url =
        attachmentUrls[att.path] ||
        (await TestimonyService.getSignedMediaUrl(att.path));
      if (!url) {
        setDownloadingAttachmentPath(null);
        Alert.alert('Attachment Unavailable', 'Unable to load attachment URL.');
        return;
      }
      const cleanName = (att.name || 'attachment').replace(/[^a-zA-Z0-9._-]/g, '_');
      const localUri = `${FileSystem.cacheDirectory}${Date.now()}_${cleanName}`;
      const downloadRes = await FileSystem.downloadAsync(url, localUri);
      setDownloadingAttachmentPath(null);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadRes.uri, {
          dialogTitle: `Save / Export ${att.name}`,
        });
      } else {
        Alert.alert('Downloaded', `Attachment saved successfully to ${downloadRes.uri}`);
      }
    } catch (err: any) {
      setDownloadingAttachmentPath(null);
      Alert.alert('Download Error', err?.message || 'Could not download attachment.');
    }
  };

  // --- Admin Workflow Actions ---
  const handleApprove = async (item: Testimony) => {
    if (!user?.uid || processingAction) return;
    if (item.privacy === 'Private') {
      Alert.alert(
        'Private Testimony',
        'A Private testimony must remain Private. It can only enter the Public approval workflow if the submitting Member explicitly changes its privacy to Public.'
      );
      return;
    }

    setProcessingAction(true);
    try {
      await TestimonyService.adminApproveTestimony(
        activeChurchId,
        item.testimonyId,
        user.uid,
        member?.name || user.displayName || 'Admin'
      );
      Alert.alert(
        'Testimony Approved',
        `"${item.title}" is now Approved. You can now click Publish to make it visible in the Member Testimonies feed and notify church members.`
      );
      setSelectedCategory('Approved');
    } catch (err: any) {
      Alert.alert('Approval Error', err?.message || 'Could not approve testimony.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handlePublish = async (item: Testimony) => {
    if (!user?.uid || processingAction) return;
    if (item.privacy === 'Private') {
      Alert.alert(
        'Action Blocked',
        'Private testimonies can never be published to the public feed.'
      );
      return;
    }

    Alert.alert(
      'Publish Testimony to Church Feed',
      `Are you sure you want to publish "${item.title}"?\n\nThis will make it visible in the public Member Testimonies feed and send a push notification to eligible church members.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish Now',
          onPress: async () => {
            setProcessingAction(true);
            try {
              // If still Pending Review, approve first then publish
              if (item.status === 'Pending Review') {
                await TestimonyService.adminApproveTestimony(
                  activeChurchId,
                  item.testimonyId,
                  user.uid,
                  member?.name || user.displayName || 'Admin'
                );
              }
              await TestimonyService.adminPublishTestimony(
                activeChurchId,
                item.testimonyId,
                user.uid,
                member?.name || user.displayName || 'Admin'
              );
              Alert.alert(
                'Published!',
                `"${item.title}" is now live in the Member Testimonies feed.`
              );
              setSelectedCategory('Published');
            } catch (err: any) {
              Alert.alert(
                'Publish Error',
                err?.message || 'Failed to publish testimony.'
              );
            } finally {
              setProcessingAction(false);
            }
          },
        },
      ]
    );
  };

  const handleConfirmReject = async () => {
    if (!selectedTestimony || !user?.uid || processingAction) return;
    setProcessingAction(true);
    try {
      await TestimonyService.adminRejectTestimony(
        activeChurchId,
        selectedTestimony.testimonyId,
        user.uid,
        rejectionReasonInput.trim() || null,
        member?.name || user.displayName || 'Admin'
      );
      setRejectModalVisible(false);
      setRejectionReasonInput('');
      setSelectedCategory('Rejected');
      Alert.alert(
        'Testimony Rejected',
        'The testimony has been moved to Rejected and the submitting Member will see your note in My Testimonies.'
      );
    } catch (err: any) {
      Alert.alert('Reject Error', err?.message || 'Failed to reject testimony.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleUnpublish = async (item: Testimony) => {
    if (!user?.uid || processingAction) return;
    Alert.alert(
      'Unpublish Testimony',
      `Remove "${item.title}" from the public Member Testimonies feed? It will be moved back to Approved status and old notification links will stop showing it to members.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unpublish',
          style: 'destructive',
          onPress: async () => {
            setProcessingAction(true);
            try {
              await TestimonyService.adminUnpublishTestimony(
                activeChurchId,
                item.testimonyId,
                user.uid,
                member?.name || user.displayName || 'Admin'
              );
              setSelectedCategory('Approved');
              Alert.alert(
                'Unpublished',
                'The testimony has been removed from the public feed.'
              );
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not unpublish testimony.');
            } finally {
              setProcessingAction(false);
            }
          },
        },
      ]
    );
  };

  const handleKeepPrivateReviewed = async (item: Testimony) => {
    if (!user?.uid || processingAction) return;
    setProcessingAction(true);
    try {
      await TestimonyService.adminAcknowledgePrivateTestimony(
        activeChurchId,
        item.testimonyId,
        user.uid,
        member?.name || user.displayName || 'Admin'
      );
      Alert.alert(
        'Marked as Reviewed (Private)',
        'This testimony has been marked as reviewed by Admin while remaining strictly Private.'
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update review timestamp.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDeleteTestimony = (item: Testimony) => {
    Alert.alert(
      'Delete Testimony Permanently',
      `Are you sure you want to permanently remove "${item.title}" and all its uploaded files?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setProcessingAction(true);
            try {
              await TestimonyService.deleteTestimony(
                activeChurchId,
                item.testimonyId
              );
              setSelectedTestimony(null);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete testimony.');
            } finally {
              setProcessingAction(false);
            }
          },
        },
      ]
    );
  };

  const getBadgeStyle = (status: TestimonyStatus, isPriv: boolean) => {
    if (isPriv || status === 'Private') {
      return { bg: 'rgba(139, 92, 246, 0.14)', text: '#8B5CF6', icon: Lock };
    }
    switch (status) {
      case 'Published':
        return { bg: 'rgba(16, 185, 129, 0.14)', text: '#10B981', icon: CheckCircle2 };
      case 'Approved':
        return { bg: 'rgba(59, 130, 246, 0.14)', text: '#3B82F6', icon: CheckCircle2 };
      case 'Pending Review':
        return { bg: 'rgba(245, 158, 11, 0.14)', text: '#F59E0B', icon: Clock };
      case 'Rejected':
      default:
        return { bg: 'rgba(239, 68, 68, 0.14)', text: '#EF4444', icon: XCircle };
    }
  };

  if (!isAuthorizedAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: screenBg }]}>
        <View style={styles.centerBox}>
          <Lock size={38} color="#EF4444" />
          <Text style={[styles.emptyTitle, { color: primaryText }]}>
            Authorized Admins Only
          </Text>
          <Text style={[styles.emptySubtitle, { color: secondaryText }]}>
            You do not have permission to manage church testimonies.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      <StatusBar barStyle="light-content" />

      {/* Hero Header (Standardized Navy Hero matching other Admin tabs) */}
      <View style={styles.hero}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1, paddingRight: 4 }}>
            <TouchableOpacity
              onPress={() => {
                if (setTabByName) {
                  setTabByName('Dashboard');
                } else if (setActiveTab) {
                  setActiveTab(0);
                } else if (navigation?.goBack) {
                  navigation.goBack();
                }
              }}
              style={{ flexDirection: 'row', alignItems: 'center' }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronLeft size={20} color="#fff" style={{ marginLeft: -6, marginRight: 2 }} />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
            </TouchableOpacity>
            <Text style={[styles.heroTitle, { marginHorizontal: 8, opacity: 0.4 }]}>|</Text>
            <Text style={[styles.heroTitle, { flexShrink: 1 }]} numberOfLines={1}>Testimony Management</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.topControlsWrap}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: cardSurface, borderColor: adminBorderColor },
          ]}
        >
          <Search size={17} color={secondaryText} />
          <TextInput
            style={[styles.searchInput, { color: primaryText }]}
            placeholder="Search by member name, title, or category..."
            placeholderTextColor={secondaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={secondaryText} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* 5 Required Category Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {ADMIN_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            const count = countsByCategory[cat] || 0;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.categoryTab,
                  {
                    backgroundColor: active ? accentColor : cardSurface,
                    borderColor: active ? accentColor : adminBorderColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    { color: active ? '#FFFFFF' : secondaryText },
                  ]}
                >
                  {cat}
                </Text>
                <View
                  style={[
                    styles.countBadge,
                    {
                      backgroundColor: active
                        ? 'rgba(255,255,255,0.22)'
                        : secondarySurface,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.countBadgeText,
                      { color: active ? '#FFFFFF' : primaryText },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Submissions List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={accentColor} />
        </View>
      ) : filteredTestimonies.length === 0 ? (
        <View style={styles.centerBox}>
          <Sparkles size={40} color={accentColor} />
          <Text style={[styles.emptyTitle, { color: primaryText }]}>
            No {selectedCategory} Testimonies
          </Text>
          <Text style={[styles.emptySubtitle, { color: secondaryText }]}>
            There are currently no submissions in the &ldquo;{selectedCategory}&rdquo; category.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTestimonies}
          keyExtractor={(item) => item.testimonyId}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isPriv = item.privacy === 'Private';
            const badge = getBadgeStyle(item.status, isPriv);
            const BadgeIcon = badge.icon;
            const { photoURL, name } = getMemberProfile(item);

            return (
              <TouchableOpacity
                activeOpacity={0.86}
                onPress={() => handleOpenReviewModal(item)}
                style={[
                  styles.submissionCard,
                  { backgroundColor: cardSurface, borderColor: adminBorderColor },
                ]}
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.memberMiniRow}>
                    {photoURL ? (
                      <Image
                        source={{ uri: photoURL }}
                        style={styles.memberAvatarCircle}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={[
                          styles.memberAvatarCircle,
                          { backgroundColor: accentColor },
                        ]}
                      >
                        <Text style={styles.memberAvatarInitials}>
                          {getInitials(name)}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.memberName, { color: primaryText }]}
                        numberOfLines={1}
                      >
                        {name}
                      </Text>
                      <Text
                        style={[styles.submissionDate, { color: secondaryText }]}
                      >
                        {formatDate(item.createdAt)}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.statusPill, { backgroundColor: badge.bg }]}>
                    <BadgeIcon size={12} color={badge.text} />
                    <Text style={[styles.statusPillText, { color: badge.text }]}>
                      {isPriv ? 'Private' : item.status}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[styles.submissionTitle, { color: primaryText }]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>

                <Text
                  style={[styles.submissionPreview, { color: secondaryText }]}
                  numberOfLines={2}
                >
                  {item.description || item.writtenContent || 'Tap to inspect submission'}
                </Text>

                {/* Media Badges Row */}
                <View
                  style={[
                    styles.cardFooterRow,
                    { borderTopColor: adminBorderColor },
                  ]}
                >
                  <View style={styles.mediaIndicatorsRow}>
                    {item.writtenContent ? (
                      <View style={styles.mediaIndicator}>
                        <BookOpen size={13} color="#64748B" />
                        <Text
                          style={[
                            styles.mediaIndicatorText,
                            { color: '#475569' },
                          ]}
                        >
                          Written
                        </Text>
                      </View>
                    ) : null}

                    {item.videoStoragePath ? (
                      <View style={styles.mediaIndicator}>
                        <VideoIcon size={13} color={accentBlue} />
                        <Text
                          style={[
                            styles.mediaIndicatorText,
                            { color: accentBlue },
                          ]}
                        >
                          Video
                        </Text>
                      </View>
                    ) : null}

                    {item.attachmentStoragePaths?.length > 0 ? (
                      <View style={styles.mediaIndicator}>
                        <FileText size={13} color="#64748B" />
                        <Text
                          style={[
                            styles.mediaIndicatorText,
                            { color: '#475569' },
                          ]}
                        >
                          {item.attachmentStoragePaths.length} Attachment
                          {item.attachmentStoragePaths.length > 1 ? 's' : ''}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <Text
                    style={[
                      styles.inspectActionText,
                      { color: accentBlue },
                    ]}
                  >
                    Review & Manage →
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* FULL SUBMISSION REVIEW & ACTIONS MODAL */}
      <Modal
        visible={Boolean(selectedTestimony)}
        animationType="slide"
        onRequestClose={() => setSelectedTestimony(null)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: screenBg }]} edges={['top', 'bottom']}>
          {selectedTestimony && (
            <>
              {/* Modal Header */}
              <View
                style={[
                  styles.modalHeader,
                  {
                    backgroundColor: cardSurface,
                    borderBottomColor: adminBorderColor,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => setSelectedTestimony(null)}
                  style={[styles.backBtn, { backgroundColor: secondarySurface }]}
                >
                  <X size={20} color={primaryText} />
                </TouchableOpacity>
                <Text
                  style={[styles.modalHeaderTitle, { color: primaryText }]}
                  numberOfLines={1}
                >
                  Review Submission
                </Text>
                <TouchableOpacity
                  onPress={() => handleDeleteTestimony(selectedTestimony)}
                  style={[
                    styles.backBtn,
                    { backgroundColor: 'rgba(239, 68, 68, 0.12)' },
                  ]}
                >
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Submitting Member Details Card */}
                <View
                  style={[
                    styles.sectionCard,
                    {
                      backgroundColor: cardSurface,
                      borderColor: adminBorderColor,
                    },
                  ]}
                >
                  <Text
                    style={[styles.sectionCardHeading, { color: secondaryText }]}
                  >
                    SUBMITTING MEMBER DETAILS
                  </Text>
                  <View style={styles.memberDetailRow}>
                    {(() => {
                      const profile = getMemberProfile(selectedTestimony);
                      const resolvedPhoto = memberSummary?.photoURL || profile.photoURL;
                      const resolvedName = memberSummary?.name || profile.name;

                      return (
                        <>
                          {resolvedPhoto ? (
                            <Image
                              source={{ uri: resolvedPhoto }}
                              style={styles.memberLargeAvatar}
                              resizeMode="cover"
                            />
                          ) : (
                            <View
                              style={[
                                styles.memberLargeAvatarFallback,
                                { backgroundColor: accentColor },
                              ]}
                            >
                              <Text style={styles.memberLargeAvatarInitials}>
                                {getInitials(resolvedName)}
                              </Text>
                            </View>
                          )}

                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.memberDetailName,
                                { color: primaryText },
                              ]}
                            >
                              {resolvedName}
                            </Text>
                            <View style={styles.memberMetaBadgesRow}>
                              <View
                                style={[
                                  styles.roleBadgeBox,
                                  {
                                    backgroundColor: 'rgba(37, 99, 235, 0.12)',
                                  },
                                ]}
                              >
                                <Text style={[styles.roleBadgeTxt, { color: accentBlue }]}>
                                  {memberSummary?.role || 'Member'}
                                </Text>
                              </View>
                              {(memberSummary as any)?.cellGroup ? (
                                <View
                                  style={[
                                    styles.roleBadgeBox,
                                    {
                                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                    },
                                  ]}
                                >
                                  <Text style={[styles.roleBadgeTxt, { color: '#059669' }]}>
                                    {(memberSummary as any).cellGroup}
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                            {(memberSummary?.phone || selectedTestimony.memberPhone) && (
                              <View style={styles.phoneRow}>
                                <Phone size={13} color={accentBlue} />
                                <Text
                                  style={[
                                    styles.phoneText,
                                    { color: primaryText },
                                  ]}
                                >
                                  {memberSummary?.phone || selectedTestimony.memberPhone}
                                </Text>
                              </View>
                            )}
                          </View>
                        </>
                      );
                    })()}
                  </View>

                  <View
                    style={[
                      styles.metadataGrid,
                      { borderTopColor: adminBorderColor },
                    ]}
                  >
                    <View style={styles.metaCol}>
                      <Text style={[styles.metaLabel, { color: secondaryText }]}>
                        Privacy
                      </Text>
                      <Text
                        style={[
                          styles.metaValue,
                          {
                            color:
                              selectedTestimony.privacy === 'Private'
                                ? '#7C3AED'
                                : '#059669',
                            fontWeight: '800',
                          },
                        ]}
                      >
                        {selectedTestimony.privacy}
                      </Text>
                    </View>
                    <View style={styles.metaCol}>
                      <Text style={[styles.metaLabel, { color: secondaryText }]}>
                        Current Status
                      </Text>
                      <Text style={[styles.metaValue, { color: primaryText, fontWeight: '800' }]}>
                        {selectedTestimony.status}
                      </Text>
                    </View>
                    <View style={styles.metaCol}>
                      <Text style={[styles.metaLabel, { color: secondaryText }]}>
                        Submitted
                      </Text>
                      <Text style={[styles.metaValue, { color: primaryText, fontWeight: '700' }]}>
                        {formatDate(selectedTestimony.createdAt)}
                      </Text>
                    </View>
                  </View>

                  {selectedTestimony.reviewedAt && (
                    <Text
                      style={[
                        styles.reviewedFootNote,
                        { color: secondaryText },
                      ]}
                    >
                      Last reviewed by{' '}
                      {selectedTestimony.reviewedByName || 'Admin'} on{' '}
                      {formatDate(selectedTestimony.reviewedAt)}
                    </Text>
                  )}
                </View>

                {/* Private Protection Warning Banner */}
                {selectedTestimony.privacy === 'Private' && (
                  <View style={styles.privateProtectionBanner}>
                    <Lock size={18} color="#8B5CF6" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.privateProtectionTitle}>
                        Strict Private Submission
                      </Text>
                      <Text style={styles.privateProtectionBody}>
                        This member submitted this testimony as Private. It can only be viewed by the member and authorized Admins, and cannot be published to the public feed unless the member explicitly changes privacy to Public.
                      </Text>
                    </View>
                  </View>
                )}

                {/* Title & Summary */}
                <View
                  style={[
                    styles.sectionCard,
                    {
                      backgroundColor: cardSurface,
                      borderColor: adminBorderColor,
                    },
                  ]}
                >
                  {selectedTestimony.category ? (
                    <Text
                      style={[
                        styles.categoryTagLabel,
                        { color: accentBlue, fontWeight: '800', letterSpacing: 0.8 },
                      ]}
                    >
                      CATEGORY: {selectedTestimony.category.toUpperCase()}
                    </Text>
                  ) : null}
                  <Text style={[styles.detailTitle, { color: primaryText }]}>
                    {selectedTestimony.title}
                  </Text>
                  {selectedTestimony.description ? (
                    <Text
                      style={[styles.detailSummary, { color: secondaryText }]}
                    >
                      {selectedTestimony.description}
                    </Text>
                  ) : null}
                </View>

                {/* Video Player Section */}
                {selectedTestimony.videoStoragePath ? (
                  <View
                    style={[
                      styles.sectionCard,
                      {
                        backgroundColor: cardSurface,
                        borderColor: adminBorderColor,
                      },
                    ]}
                  >
                    <View style={styles.sectionHeaderRow}>
                      <VideoIcon size={16} color={accentBlue} />
                      <Text
                        style={[styles.sectionHeaderTitle, { color: primaryText }]}
                      >
                        Uploaded Video Testimony
                      </Text>
                      {durationMs > 0 && (
                        <Text
                          style={[
                            styles.durationLabel,
                            { color: secondaryText },
                          ]}
                        >
                          {formatDuration(positionMs)} / {formatDuration(durationMs)}
                        </Text>
                      )}
                    </View>

                    <View style={styles.videoPlayerBox}>
                      {videoLoading ? (
                        <View style={styles.videoCenterState}>
                          <ActivityIndicator size="large" color="#FFFFFF" />
                          <Text style={styles.videoStateLabel}>
                            Loading video...
                          </Text>
                        </View>
                      ) : videoError ? (
                        <View style={styles.videoCenterState}>
                          <AlertCircle size={28} color="#EF4444" />
                          <Text style={styles.videoErrorLabel}>{videoError}</Text>
                          <TouchableOpacity
                            style={[
                              styles.retryBtn,
                              { backgroundColor: accentColor },
                            ]}
                            onPress={handleRetryVideo}
                          >
                            <RotateCcw size={14} color="#FFFFFF" />
                            <Text style={styles.retryBtnText}>Retry</Text>
                          </TouchableOpacity>
                        </View>
                      ) : videoUrl ? (
                        <Video
                          ref={videoRef}
                          source={{ uri: videoUrl }}
                          style={styles.videoElement}
                          useNativeControls
                          resizeMode={ResizeMode.CONTAIN}
                          shouldPlay={false}
                          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                          onError={() =>
                            setVideoError('Error playing video file.')
                          }
                        />
                      ) : null}
                    </View>

                    {videoUrl && !videoError && (
                      <TouchableOpacity
                        style={[
                          styles.playPauseBtn,
                          { backgroundColor: accentColor },
                        ]}
                        onPress={handleTogglePlayPause}
                      >
                        {isPlaying ? (
                          <>
                            <Pause size={15} color="#FFFFFF" />
                            <Text style={styles.playPauseBtnText}>Pause</Text>
                          </>
                        ) : (
                          <>
                            <Play size={15} color="#FFFFFF" />
                            <Text style={styles.playPauseBtnText}>Play Video</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                ) : null}

                {/* Complete Written Testimony */}
                {selectedTestimony.writtenContent ? (
                  <View
                    style={[
                      styles.sectionCard,
                      {
                        backgroundColor: cardSurface,
                        borderColor: adminBorderColor,
                      },
                    ]}
                  >
                    <View style={styles.sectionHeaderRow}>
                      <BookOpen size={16} color={accentBlue} />
                      <Text
                        style={[styles.sectionHeaderTitle, { color: primaryText }]}
                      >
                        Complete Written Testimony
                      </Text>
                    </View>
                    <Text style={[styles.writtenStoryText, { color: primaryText, fontSize: 14.5, lineHeight: 24 }]}>
                      {selectedTestimony.writtenContent}
                    </Text>
                  </View>
                ) : null}

                {/* Document Attachments */}
                {selectedTestimony.attachmentStoragePaths &&
                  selectedTestimony.attachmentStoragePaths.length > 0 && (
                    <View
                      style={[
                        styles.sectionCard,
                        {
                          backgroundColor: cardSurface,
                          borderColor: adminBorderColor,
                        },
                      ]}
                    >
                      <View style={styles.sectionHeaderRow}>
                        <FileText size={16} color={accentBlue} />
                        <Text
                          style={[
                            styles.sectionHeaderTitle,
                            { color: primaryText },
                          ]}
                        >
                          Supporting Attachments (
                          {selectedTestimony.attachmentStoragePaths.length})
                        </Text>
                      </View>

                      {selectedTestimony.attachmentStoragePaths.map((att, idx) => {
                        const isImg =
                          att.mimeType?.toLowerCase().includes('image') ||
                          /\.(jpg|jpeg|png)$/i.test(att.name || '');
                        const isDownloading = downloadingAttachmentPath === att.path;

                        return (
                          <View
                            key={`${att.path}_${idx}`}
                            style={[
                              styles.attachmentItem,
                              {
                                backgroundColor: secondarySurface,
                                borderColor: adminBorderColor,
                              },
                            ]}
                          >
                            <TouchableOpacity
                              style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}
                              onPress={() => handleOpenAttachment(att)}
                              activeOpacity={0.7}
                            >
                              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }}>
                                {isImg ? (
                                  <ImageIcon size={18} color={accentBlue} />
                                ) : (
                                  <FileText size={18} color={accentBlue} />
                                )}
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={[
                                    styles.attachmentItemName,
                                    { color: primaryText },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {att.name}
                                </Text>
                                <Text
                                  style={[
                                    styles.attachmentItemMeta,
                                    { color: secondaryText },
                                  ]}
                                >
                                  {formatFileSize(att.sizeBytes)} • Tap to {isImg ? 'view image' : 'open document'}
                                </Text>
                              </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => handleDownloadAttachment(att)}
                              disabled={isDownloading}
                              style={{ padding: 8, borderRadius: 8, backgroundColor: '#E2E8F0', marginLeft: 8 }}
                            >
                              {isDownloading ? (
                                <ActivityIndicator size="small" color={accentBlue} />
                              ) : (
                                <Download size={16} color={accentBlue} />
                              )}
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  )}

                {/* Rejection Reason if Rejected */}
                {selectedTestimony.status === 'Rejected' &&
                  selectedTestimony.rejectionReason && (
                    <View style={styles.rejectedReasonCard}>
                      <Text style={styles.rejectedReasonHeading}>
                        Rejection Reason Sent to Member:
                      </Text>
                      <Text style={styles.rejectedReasonBody}>
                        {selectedTestimony.rejectionReason}
                      </Text>
                    </View>
                  )}
              </ScrollView>

              {/* Admin Action Footer Bar */}
              <View
                style={[
                  styles.actionFooter,
                  {
                    backgroundColor: cardSurface,
                    borderTopColor: adminBorderColor,
                  },
                ]}
              >
                {selectedTestimony.privacy === 'Private' ? (
                  <TouchableOpacity
                    disabled={processingAction}
                    onPress={() => handleKeepPrivateReviewed(selectedTestimony)}
                    style={[
                      styles.actionBtnFull,
                      { backgroundColor: '#8B5CF6' },
                    ]}
                  >
                    <Lock size={16} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>
                      Keep Private & Mark Reviewed
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.publicActionsRow}>
                    {/* Approve Button (when Pending Review or Rejected) */}
                    {(selectedTestimony.status === 'Pending Review' ||
                      selectedTestimony.status === 'Rejected') && (
                      <TouchableOpacity
                        disabled={processingAction}
                        onPress={() => handleApprove(selectedTestimony)}
                        style={[
                          styles.actionBtnFlex,
                          { backgroundColor: '#3B82F6' },
                        ]}
                      >
                        <CheckCircle2 size={16} color="#FFFFFF" />
                        <Text style={styles.actionBtnText}>Approve</Text>
                      </TouchableOpacity>
                    )}

                    {/* Publish Button (when Pending Review or Approved) */}
                    {(selectedTestimony.status === 'Approved' ||
                      selectedTestimony.status === 'Pending Review') && (
                      <TouchableOpacity
                        disabled={processingAction}
                        onPress={() => handlePublish(selectedTestimony)}
                        style={[
                          styles.actionBtnFlex,
                          { backgroundColor: '#10B981' },
                        ]}
                      >
                        <Send size={15} color="#FFFFFF" />
                        <Text style={styles.actionBtnText}>Publish</Text>
                      </TouchableOpacity>
                    )}

                    {/* Unpublish Button (when Published) */}
                    {selectedTestimony.status === 'Published' && (
                      <TouchableOpacity
                        disabled={processingAction}
                        onPress={() => handleUnpublish(selectedTestimony)}
                        style={[
                          styles.actionBtnFlex,
                          { backgroundColor: '#F59E0B' },
                        ]}
                      >
                        <EyeOff size={16} color="#FFFFFF" />
                        <Text style={styles.actionBtnText}>Unpublish</Text>
                      </TouchableOpacity>
                    )}

                    {/* Reject Button */}
                    {selectedTestimony.status !== 'Rejected' && (
                      <TouchableOpacity
                        disabled={processingAction}
                        onPress={() => {
                          setRejectionReasonInput(
                            selectedTestimony.rejectionReason || ''
                          );
                          setRejectModalVisible(true);
                        }}
                        style={[
                          styles.actionBtnFlex,
                          { backgroundColor: '#EF4444' },
                        ]}
                      >
                        <XCircle size={16} color="#FFFFFF" />
                        <Text style={styles.actionBtnText}>Reject</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </>
          )}
        </SafeAreaView>
      </Modal>

      {/* Reject Reason Input Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.rejectModalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View
            style={[
              styles.rejectModalCard,
              { backgroundColor: cardSurface, borderColor: adminBorderColor },
            ]}
          >
            <Text style={[styles.rejectModalTitle, { color: primaryText }]}>
              Reject Testimony Submission
            </Text>
            <Text style={[styles.rejectModalSubtitle, { color: secondaryText }]}>
              Optionally provide a reason so the submitting Member knows what to revise.
            </Text>

            <TextInput
              style={[
                styles.rejectInput,
                {
                  backgroundColor: secondarySurface,
                  borderColor: adminBorderColor,
                  color: primaryText,
                },
              ]}
              placeholder="Optional rejection reason or feedback for member..."
              placeholderTextColor={secondaryText}
              value={rejectionReasonInput}
              onChangeText={setRejectionReasonInput}
              multiline
            />

            <View style={styles.rejectModalActions}>
              <TouchableOpacity
                onPress={() => setRejectModalVisible(false)}
                style={[
                  styles.rejectCancelBtn,
                  { backgroundColor: secondarySurface },
                ]}
              >
                <Text style={[styles.rejectCancelText, { color: primaryText }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={processingAction}
                onPress={handleConfirmReject}
                style={[styles.rejectConfirmBtn, { backgroundColor: '#EF4444' }]}
              >
                {processingAction ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.rejectConfirmText}>Confirm Reject</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Fullscreen Image Attachment Modal */}
      <Modal
        visible={Boolean(previewImageUri)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImageUri(null)}
      >
        <SafeAreaView style={styles.imagePreviewBackdrop} edges={['top', 'bottom']}>
          <View style={styles.imagePreviewTopBar}>
            <TouchableOpacity
              style={styles.imagePreviewActionBtn}
              onPress={() => setPreviewImageUri(null)}
            >
              <X size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.imagePreviewActionBtn, { flexDirection: 'row', gap: 6, paddingHorizontal: 14 }]}
              onPress={async () => {
                if (!previewImageUri) return;
                try {
                  const cleanName = `testimony_image_${Date.now()}.jpg`;
                  const localUri = `${FileSystem.cacheDirectory}${cleanName}`;
                  const dl = await FileSystem.downloadAsync(previewImageUri, localUri);
                  if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(dl.uri, { dialogTitle: 'Save Image' });
                  } else {
                    Alert.alert('Saved', 'Image downloaded successfully.');
                  }
                } catch (e: any) {
                  Alert.alert('Error', e?.message || 'Could not save image.');
                }
              }}
            >
              <Download size={18} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>Download</Text>
            </TouchableOpacity>
          </View>
          {previewImageUri ? (
            <Image
              source={{ uri: previewImageUri }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          ) : null}
        </SafeAreaView>
      </Modal>

      {/* ── IN-APP DOCUMENT VIEWER (PDFs & Documents with Zoom & Scroll) ── */}
      <InAppDocumentViewerModal
        visible={Boolean(viewerDoc)}
        doc={viewerDoc}
        onClose={() => setViewerDoc(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDE8DC',
  },
  hero: {
    backgroundColor: '#1a2d5a',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    marginBottom: 6,
    overflow: 'visible',
    position: 'relative',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 20,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topControlsWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  tabsScroll: {
    gap: 8,
    paddingBottom: 10,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    paddingBottom: 48,
  },
  submissionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  memberMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  memberAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  memberAvatarInitials: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
  },
  submissionDate: {
    fontSize: 11,
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  submissionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  submissionPreview: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  mediaIndicatorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mediaIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mediaIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inspectActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },
  modalScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  sectionCardHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  memberDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  memberLargeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  memberLargeAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberLargeAvatarInitials: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  memberDetailName: {
    fontSize: 16,
    fontWeight: '800',
  },
  memberMetaBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  roleBadgeBox: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  roleBadgeTxt: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  memberDetailSub: {
    fontSize: 12,
    marginTop: 2,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  phoneText: {
    fontSize: 13,
    fontWeight: '600',
  },
  metadataGrid: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  reviewedFootNote: {
    fontSize: 11,
    marginTop: 10,
    fontStyle: 'italic',
  },
  privateProtectionBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.35)',
    marginBottom: 14,
  },
  privateProtectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8B5CF6',
    marginBottom: 3,
  },
  privateProtectionBody: {
    fontSize: 12,
    lineHeight: 18,
    color: '#8B5CF6',
  },
  categoryTagLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 27,
    marginBottom: 6,
  },
  detailSummary: {
    fontSize: 14,
    lineHeight: 21,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  durationLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  videoPlayerBox: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: '#000000',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoElement: {
    width: '100%',
    height: '100%',
  },
  videoCenterState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoStateLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    marginTop: 8,
  },
  videoErrorLabel: {
    color: '#FCA5A5',
    fontSize: 13,
    marginTop: 6,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  playPauseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  playPauseBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  writtenStoryText: {
    fontSize: 15,
    lineHeight: 24,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  attachmentItemName: {
    fontSize: 13,
    fontWeight: '700',
  },
  attachmentItemMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  rejectedReasonCard: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    marginBottom: 14,
  },
  rejectedReasonHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EF4444',
    marginBottom: 4,
  },
  rejectedReasonBody: {
    fontSize: 13,
    color: '#EF4444',
    lineHeight: 19,
  },
  actionFooter: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  publicActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtnFlex: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  rejectModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  rejectModalCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  rejectModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  rejectModalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  rejectInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 90,
    textAlignVertical: 'top',
    fontSize: 14,
    marginBottom: 16,
  },
  rejectModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  rejectCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  rejectCancelText: {
    fontSize: 13,
    fontWeight: '700',
  },
  rejectConfirmBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  rejectConfirmText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  imagePreviewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreviewTopBar: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imagePreviewActionBtn: {
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  fullImage: {
    width: '94%',
    height: '78%',
  },
});
