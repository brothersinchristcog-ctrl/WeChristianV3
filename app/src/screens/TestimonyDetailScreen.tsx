import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  Linking,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  FileText,
  Image as ImageIcon,
  Download,
  Lock,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  User,
  Calendar,
  X,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useChurch } from '../context/ChurchContext';
import TestimonyService, { MemberSummary } from '../services/TestimonyService';
import InAppDocumentViewerModal, {
  InAppDocumentViewerDoc,
} from '../components/InAppDocumentViewerModal';
import { Testimony, TestimonyAttachment, TestimonyStatus } from '../types/testimony';

const formatDuration = (ms?: number | null): string => {
  if (!ms || ms <= 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const formatDate = (ts: any): string => {
  if (!ts) return '';
  try {
    const date =
      typeof ts.toDate === 'function'
        ? ts.toDate()
        : typeof ts.seconds === 'number'
        ? new Date(ts.seconds * 1000)
        : new Date(ts);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

const formatFileSize = (bytes?: number | null): string => {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function TestimonyDetailScreen({ route, navigation }: any) {
  const { testimonyId, churchId: routeChurchId } = route.params || {};
  const { isDark } = useTheme();
  const { user, member, isPlatformSuperAdmin } = useAuth();
  const { activeChurch } = useChurch();
  const insets = useSafeAreaInsets();

  const activeChurchId =
    routeChurchId || activeChurch?.id || member?.churchId || member?.primaryChurchId || 'default';

  // Reusable theme tokens consistent with all other Member View tabs
  const themeBg = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const subtleBg = isDark ? '#334155' : '#f1f5f9';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
  const accentColor = isDark ? '#3b82f6' : '#1a2d5a';
  const primaryTextColor = isDark ? '#f8fafc' : '#0f172a';
  const secondaryTextColor = isDark ? '#94a3b8' : '#64748b';

  const [loading, setLoading] = useState(true);
  const [testimony, setTestimony] = useState<Testimony | null>(null);
  const [memberInfo, setMemberInfo] = useState<MemberSummary | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  // Video Player state
  const videoRef = useRef<Video | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState<number>(0);

  // Attachments state
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({});
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [openingAttachmentPath, setOpeningAttachmentPath] = useState<string | null>(null);
  const [viewerDoc, setViewerDoc] = useState<InAppDocumentViewerDoc | null>(null);

  const isUserAdmin = Boolean(
    isPlatformSuperAdmin ||
      String(member?.userType || '').toLowerCase().includes('admin') ||
      String(member?.userType || '').toLowerCase().includes('pastor') ||
      String(member?.userType || '').toLowerCase().includes('super')
  );

  useEffect(() => {
    if (!testimonyId) {
      setLoading(false);
      setAccessDenied(true);
      return;
    }

    setLoading(true);
    const unsubscribe = TestimonyService.subscribeToTestimonyById(
      activeChurchId,
      testimonyId,
      async (item) => {
        if (!item) {
          setTestimony(null);
          setAccessDenied(true);
          setLoading(false);
          return;
        }

        const isOwner = Boolean(user?.uid && item.memberId === user.uid);
        const isPublicPublished =
          item.privacy === 'Public' && item.status === 'Published';

        // Strict access enforcement: only owner, church admin, or published public testimony
        if (!isOwner && !isUserAdmin && !isPublicPublished) {
          setTestimony(null);
          setVideoUrl(null);
          setAttachmentUrls({});
          setAccessDenied(true);
          setLoading(false);
          return;
        }

        setAccessDenied(false);
        setTestimony(item);
        if (item.videoDurationMs) {
          setDurationMs(item.videoDurationMs);
        }
        setLoading(false);

        // Resolve member profile
        TestimonyService.getMemberSummary(
          item.churchId || activeChurchId,
          item.memberId,
          item.memberName,
          item.memberPhotoUrl,
          item.memberPhone
        )
          .then((summary) => setMemberInfo(summary))
          .catch(() => {});

        // Resolve video URL if present
        if (item.videoStoragePath) {
          setVideoLoading(true);
          setVideoError(null);
          const signedUrl = await TestimonyService.getSignedMediaUrl(item.videoStoragePath);
          if (signedUrl) {
            setVideoUrl(signedUrl);
          } else {
            setVideoError('Unable to load video stream. Please tap Retry.');
          }
          setVideoLoading(false);
        } else {
          setVideoUrl(null);
        }

        // Resolve image attachment URLs
        if (item.attachmentStoragePaths && item.attachmentStoragePaths.length > 0) {
          const resolvedMap: Record<string, string> = {};
          await Promise.all(
            item.attachmentStoragePaths.map(async (att) => {
              const url = await TestimonyService.getSignedMediaUrl(att.path);
              if (url) resolvedMap[att.path] = url;
            })
          );
          setAttachmentUrls(resolvedMap);
        }
      },
      () => {
        setAccessDenied(true);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [testimonyId, activeChurchId, user?.uid, isUserAdmin]);

  const handleRetryVideo = async () => {
    if (!testimony?.videoStoragePath) return;
    setVideoLoading(true);
    setVideoError(null);
    const signedUrl = await TestimonyService.getSignedMediaUrl(testimony.videoStoragePath);
    if (signedUrl) {
      setVideoUrl(signedUrl);
      if (videoRef.current) {
        try {
          await videoRef.current.loadAsync({ uri: signedUrl }, { shouldPlay: true });
        } catch {
          // Handled by onError callback
        }
      }
    } else {
      setVideoError('Could not load video file. Please check your connection and try again.');
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
          if (
            status.durationMillis &&
            status.positionMillis >= status.durationMillis - 300
          ) {
            await videoRef.current.replayAsync();
          } else {
            await videoRef.current.playAsync();
          }
        }
      }
    } catch (err) {
      console.warn('⚠️ [TestimonyDetail] Playback toggle error:', err);
    }
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if ('error' in status && status.error) {
        setVideoError('Playback error occurred while streaming this video.');
        setIsPlaying(false);
      }
      return;
    }
    setIsPlaying(status.isPlaying);
    setPositionMs(status.positionMillis || 0);
    if (status.durationMillis && status.durationMillis > 0) {
      setDurationMs(status.durationMillis);
    }
  };

  const handleOpenAttachment = async (att: TestimonyAttachment) => {
    try {
      setOpeningAttachmentPath(att.path);
      const url =
        attachmentUrls[att.path] || (await TestimonyService.getSignedMediaUrl(att.path));
      if (!url) {
        Alert.alert('Unavailable', 'Could not load this attachment. Please try again.');
        return;
      }

      // Open directly inside the Rhema Church app via in-app document viewer modal!
      setViewerDoc({
        url,
        name: att.name || 'Testimony Attachment',
        mimeType: att.mimeType,
      });
    } catch (err: any) {
      console.warn('Could not open attachment:', err);
      Alert.alert('Error', 'Failed to open attachment: ' + (err?.message || 'Unknown error'));
    } finally {
      setOpeningAttachmentPath(null);
    }
  };

  const getStatusBadgeStyle = (status: TestimonyStatus) => {
    switch (status) {
      case 'Published':
        return {
          bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
          text: isDark ? '#34D399' : '#15803D',
          border: isDark ? 'rgba(16, 185, 129, 0.3)' : '#BBF7D0',
          icon: CheckCircle2,
        };
      case 'Approved':
        return {
          bg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#DBEAFE',
          text: isDark ? '#60A5FA' : '#1D4ED8',
          border: isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE',
          icon: CheckCircle2,
        };
      case 'Pending Review':
        return {
          bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
          text: isDark ? '#FBBF24' : '#B45309',
          border: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A',
          icon: Clock,
        };
      case 'Rejected':
        return {
          bg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
          text: isDark ? '#F87171' : '#B91C1C',
          border: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA',
          icon: XCircle,
        };
      case 'Private':
      default:
        return {
          bg: isDark ? 'rgba(148, 163, 184, 0.15)' : '#F1F5F9',
          text: isDark ? '#E2E8F0' : '#475569',
          border: isDark ? 'rgba(148, 163, 184, 0.3)' : '#CBD5E1',
          icon: Lock,
        };
    }
  };

  const renderHeroHeader = (titleText: string, subText?: string) => (
    <LinearGradient
      colors={['#2b52a1', '#1a3673']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.heroHeader,
        { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 48 : 16) + 8 },
      ]}
    >
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.heroBackBtn}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        activeOpacity={0.8}
      >
        <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2.4} />
      </TouchableOpacity>
      <View style={styles.heroCenter} pointerEvents="none">
        <Text style={styles.heroTitle} numberOfLines={1}>
          {titleText}
        </Text>
        {!!subText && <Text style={styles.heroSub}>{subText}</Text>}
      </View>
      <View style={{ width: 38 }} />
    </LinearGradient>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeBg }]}>
        <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />
        {renderHeroHeader('Testimony', 'STORIES OF GRACE & FAITH')}
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={accentColor} />
          <Text style={[styles.loadingTxt, { color: secondaryTextColor }]}>
            Loading testimony...
          </Text>
        </View>
      </View>
    );
  }

  if (accessDenied || !testimony) {
    return (
      <View style={[styles.container, { backgroundColor: themeBg }]}>
        <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />
        {renderHeroHeader('Testimony', 'STORIES OF GRACE & FAITH')}
        <View style={styles.centerLoading}>
          <View
            style={[
              styles.unavailableIconWrap,
              { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEE2E2', borderColor },
            ]}
          >
            <Lock size={36} color="#DC2626" />
          </View>
          <Text style={[styles.unavailableTitle, { color: primaryTextColor }]}>
            Testimony Unavailable
          </Text>
          <Text style={[styles.unavailableSubtitle, { color: secondaryTextColor }]}>
            This testimony may have been unpublished, removed, or set to Private by the member.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.primaryActionBtn, { backgroundColor: accentColor }]}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryActionBtnTxt}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const displayName = memberInfo?.name || testimony.memberName || 'Church Member';
  const displayPhoto = memberInfo?.photoURL || testimony.memberPhotoUrl || null;
  const isOwner = Boolean(user?.uid && testimony.memberId === user.uid);
  const statusBadge = getStatusBadgeStyle(testimony.status);
  const StatusIcon = statusBadge.icon;

  return (
    <View style={[styles.container, { backgroundColor: themeBg }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />

      {renderHeroHeader('Testimony Details', testimony.category ? testimony.category.toUpperCase() : 'STORIES OF GRACE')}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Author / Metadata Card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.authorRow}>
            {displayPhoto ? (
              <Image source={{ uri: displayPhoto }} style={styles.avatarImg} />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: subtleBg, borderColor },
                ]}
              >
                <User size={22} color={secondaryTextColor} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.authorName, { color: primaryTextColor }]}>
                {displayName}
              </Text>
              <View style={styles.metaRow}>
                <Calendar size={12} color={secondaryTextColor} />
                <Text style={[styles.metaDateText, { color: secondaryTextColor }]}>
                  {formatDate(testimony.publishedAt || testimony.createdAt) || 'Recently'}
                </Text>
                {testimony.category ? (
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: subtleBg, borderColor },
                    ]}
                  >
                    <Sparkles size={11} color={accentColor} />
                    <Text style={[styles.categoryBadgeText, { color: primaryTextColor }]}>
                      {testimony.category}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Status Pill for Owner / Admin */}
            {(isOwner || isUserAdmin) && (
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: statusBadge.bg,
                    borderColor: statusBadge.border,
                    borderWidth: 1,
                  },
                ]}
              >
                <StatusIcon size={12} color={statusBadge.text} />
                <Text style={[styles.statusBadgeText, { color: statusBadge.text }]}>
                  {testimony.status}
                </Text>
              </View>
            )}
          </View>

          {/* Rejection Note Alert */}
          {(isOwner || isUserAdmin) &&
            testimony.status === 'Rejected' &&
            testimony.rejectionReason && (
              <View
                style={[
                  styles.rejectionBox,
                  {
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEE2E2',
                    borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA',
                  },
                ]}
              >
                <AlertCircle size={15} color="#DC2626" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rejectionTitle}>Admin Review Note</Text>
                  <Text style={styles.rejectionReasonText}>
                    {testimony.rejectionReason}
                  </Text>
                </View>
              </View>
            )}

          {/* Private Notice */}
          {testimony.privacy === 'Private' && (
            <View
              style={[
                styles.privateNoticeBox,
                {
                  backgroundColor: subtleBg,
                  borderColor,
                },
              ]}
            >
              <Lock size={14} color={secondaryTextColor} />
              <Text style={[styles.privateNoticeText, { color: secondaryTextColor }]}>
                Private Testimony — Visible only to you and authorized Church Admins.
              </Text>
            </View>
          )}
        </View>

        {/* Title & Short Summary */}
        <Text style={[styles.testimonyTitle, { color: primaryTextColor }]}>
          {testimony.title}
        </Text>

        {testimony.description ? (
          <Text style={[styles.testimonySummary, { color: secondaryTextColor }]}>
            {testimony.description}
          </Text>
        ) : null}

        {/* In-App Video Testimony Player */}
        {testimony.videoStoragePath ? (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.sectionHeaderRow}>
              <Play size={16} color={accentColor} />
              <Text style={[styles.sectionHeaderTitle, { color: primaryTextColor }]}>
                Video Testimony
              </Text>
              {durationMs > 0 && (
                <View style={[styles.durationPill, { backgroundColor: subtleBg, borderColor }]}>
                  <Clock size={11} color={secondaryTextColor} />
                  <Text style={[styles.durationPillText, { color: secondaryTextColor }]}>
                    {formatDuration(positionMs)} / {formatDuration(durationMs)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.videoPlayerWrapper}>
              {videoLoading ? (
                <View style={styles.videoStateOverlay}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.videoStateText}>Loading video stream...</Text>
                </View>
              ) : videoError ? (
                <View style={styles.videoStateOverlay}>
                  <AlertCircle size={30} color="#EF4444" />
                  <Text style={styles.videoErrorText}>{videoError}</Text>
                  <TouchableOpacity
                    style={[styles.retryBtn, { backgroundColor: accentColor }]}
                    onPress={handleRetryVideo}
                  >
                    <RotateCcw size={14} color="#FFFFFF" />
                    <Text style={styles.retryBtnText}>Retry Video</Text>
                  </TouchableOpacity>
                </View>
              ) : videoUrl ? (
                <Video
                  ref={videoRef}
                  source={{ uri: videoUrl }}
                  style={styles.videoPlayer}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay={false}
                  onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                  onError={() =>
                    setVideoError('Unable to play this video format on your device. Please tap Retry.')
                  }
                />
              ) : null}
            </View>

            {videoUrl && !videoError && (
              <View style={styles.videoControlFooter}>
                <TouchableOpacity
                  style={[styles.playPauseButton, { backgroundColor: accentColor }]}
                  onPress={handleTogglePlayPause}
                  activeOpacity={0.85}
                >
                  {isPlaying ? (
                    <>
                      <Pause size={15} color="#FFFFFF" />
                      <Text style={styles.playPauseButtonText}>Pause Video</Text>
                    </>
                  ) : (
                    <>
                      <Play size={15} color="#FFFFFF" style={{ marginLeft: 2 }} />
                      <Text style={styles.playPauseButtonText}>Play Video</Text>
                    </>
                  )}
                </TouchableOpacity>

                {testimony.videoSizeBytes ? (
                  <Text style={[styles.videoMetaText, { color: secondaryTextColor }]}>
                    {formatFileSize(testimony.videoSizeBytes)}
                  </Text>
                ) : null}
              </View>
            )}
          </View>
        ) : null}

        {/* Written Story Card */}
        {testimony.writtenContent ? (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.sectionHeaderRow}>
              <FileText size={16} color={accentColor} />
              <Text style={[styles.sectionHeaderTitle, { color: primaryTextColor }]}>
                Written Testimony
              </Text>
            </View>
            <Text style={[styles.writtenBodyText, { color: primaryTextColor }]}>
              {testimony.writtenContent}
            </Text>
          </View>
        ) : null}

        {/* Supporting Attachments Card */}
        {testimony.attachmentStoragePaths &&
          testimony.attachmentStoragePaths.length > 0 && (
            <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.sectionHeaderRow}>
                <FileText size={16} color={accentColor} />
                <Text style={[styles.sectionHeaderTitle, { color: primaryTextColor }]}>
                  Supporting Documents ({testimony.attachmentStoragePaths.length})
                </Text>
              </View>

              {testimony.attachmentStoragePaths.map((att, idx) => {
                const isImg =
                  att.mimeType?.toLowerCase().includes('image') ||
                  /\.(jpg|jpeg|png)$/i.test(att.name || '');
                const resolvedImgUrl = attachmentUrls[att.path];
                const isOpening = openingAttachmentPath === att.path;

                return (
                  <View key={`${att.path}_${idx}`} style={styles.attachmentItemWrap}>
                    {isImg && resolvedImgUrl ? (
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => setPreviewImageUri(resolvedImgUrl)}
                        style={[styles.inlineImagePreviewWrap, { borderColor }]}
                      >
                        <Image
                          source={{ uri: resolvedImgUrl }}
                          style={styles.inlineImagePreview}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      style={[
                        styles.attachmentRow,
                        {
                          backgroundColor: subtleBg,
                          borderColor,
                        },
                      ]}
                      onPress={() => handleOpenAttachment(att)}
                      disabled={isOpening}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.attachmentIconBox, { backgroundColor: cardBg, borderColor }]}>
                        {isImg ? (
                          <ImageIcon size={18} color={accentColor} />
                        ) : (
                          <FileText size={18} color={accentColor} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.attachmentName, { color: primaryTextColor }]}
                          numberOfLines={1}
                        >
                          {att.name || `Attachment ${idx + 1}`}
                        </Text>
                        <Text style={[styles.attachmentMeta, { color: secondaryTextColor }]}>
                          {isImg ? 'Image' : 'PDF Document'}
                          {att.sizeBytes ? ` • ${formatFileSize(att.sizeBytes)}` : ''}
                        </Text>
                      </View>
                      {isOpening ? (
                        <ActivityIndicator size="small" color={accentColor} />
                      ) : (
                        <View style={[styles.openAttachmentChip, { backgroundColor: cardBg, borderColor }]}>
                          <Download size={13} color={primaryTextColor} />
                          <Text style={[styles.openAttachmentChipText, { color: primaryTextColor }]}>
                            {isImg ? 'View' : 'Open'}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
      </ScrollView>

      {/* Full-Screen Image Attachment Modal */}
      <Modal
        visible={Boolean(previewImageUri)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImageUri(null)}
      >
        <View style={styles.imageModalBackdrop}>
          <TouchableOpacity
            style={styles.imageModalCloseBtn}
            onPress={() => setPreviewImageUri(null)}
          >
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          {previewImageUri ? (
            <Image
              source={{ uri: previewImageUri }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          ) : null}
        </View>
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
  },
  heroHeader: {
    backgroundColor: '#1a2d5a',
    paddingHorizontal: 18,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 6,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  heroBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  heroCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  heroSub: {
    color: '#BFDBFE',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginTop: 2,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  loadingTxt: {
    marginTop: 12,
    fontSize: 13.5,
  },
  unavailableIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 16,
  },
  unavailableTitle: {
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  unavailableSubtitle: {
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryActionBtn: {
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryActionBtnTxt: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaDateText: {
    fontSize: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: 4,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  rejectionBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  rejectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 2,
  },
  rejectionReasonText: {
    fontSize: 13,
    color: '#DC2626',
    lineHeight: 18,
  },
  privateNoticeBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  privateNoticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  testimonyTitle: {
    fontSize: 21,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 8,
  },
  testimonySummary: {
    fontSize: 14.5,
    lineHeight: 22,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    flex: 1,
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  durationPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  videoPlayerWrapper: {
    width: '100%',
    height: 220,
    backgroundColor: '#000000',
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  videoStateOverlay: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoStateText: {
    color: '#E2E8F0',
    fontSize: 13,
    marginTop: 10,
  },
  videoErrorText: {
    color: '#FCA5A5',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 14,
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
  videoControlFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  playPauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  playPauseButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  videoMetaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  writtenBodyText: {
    fontSize: 14.5,
    lineHeight: 24,
  },
  attachmentItemWrap: {
    marginBottom: 10,
  },
  inlineImagePreviewWrap: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 1,
  },
  inlineImagePreview: {
    width: '100%',
    height: '100%',
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  attachmentIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentName: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  attachmentMeta: {
    fontSize: 11.5,
  },
  openAttachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  openAttachmentChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  imageModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseBtn: {
    position: 'absolute',
    top: 52,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenImage: {
    width: '94%',
    height: '80%',
  },
});
