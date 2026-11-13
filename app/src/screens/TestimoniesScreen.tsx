import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  ArrowLeft,
  Sparkles,
  PlusCircle,
  BookOpen,
  Video as VideoIcon,
  FileText,
  Upload,
  Lock,
  Globe,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Play,
  Trash2,
  Edit3,
  RotateCcw,
  Search,
  User,
  Calendar,
  ChevronRight,
  CheckSquare,
  Square,
  X,
  MessageCircle,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useChurch } from '../context/ChurchContext';
import TestimonyService from '../services/TestimonyService';
import {
  Testimony,
  TestimonyAttachment,
  TestimonyPrivacy,
  TestimonyStatus,
  TestimonyType,
  TESTIMONY_CATEGORIES,
  LocalMediaSelection,
} from '../types/testimony';

type ActiveTab = 'feed' | 'share' | 'mine';

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

const formatDuration = (ms?: number | null): string => {
  if (!ms || ms <= 0) return '';
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export default function TestimoniesScreen({ route, navigation }: any) {
  const { colors, isDark } = useTheme();
  const { user, member } = useAuth();
  const { activeChurch } = useChurch();
  const initialTab: ActiveTab = route?.params?.initialTab || 'feed';

  const activeChurchId =
    activeChurch?.id || member?.churchId || member?.primaryChurchId || 'default';

  // Reusable theme tokens consistent with all other Member View tabs
  const themeBg = colors.background || (isDark ? '#121212' : '#FAF7F2');
  const cardBg = colors.surface || (isDark ? '#1E1E1E' : '#FFFFFF');
  const subtleBg = isDark ? '#27272A' : '#F8FAFC';
  const borderColor = colors.border || (isDark ? '#2E2E32' : '#E2E8F0');
  const accentColor = colors.accent || '#c0392b';
  const primaryTextColor = colors.text || (isDark ? '#F4F4F5' : '#111827');
  const secondaryTextColor = colors.textSecondary || (isDark ? '#A1A1AA' : '#64748B');

  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);

  const cachedPublicFeed = TestimonyService.getCachedPublicFeed(activeChurchId);
  const cachedMyTestimonies = user?.uid ? TestimonyService.getCachedMyTestimonies(activeChurchId, user.uid) : null;
  // Feed & My Testimonies lists
  const [publicFeed, setPublicFeed] = useState<Testimony[]>(cachedPublicFeed || []);
  const [myTestimonies, setMyTestimonies] = useState<Testimony[]>(cachedMyTestimonies || []);
  const [loadingFeed, setLoadingFeed] = useState(!cachedPublicFeed);
  const [loadingMine, setLoadingMine] = useState(!cachedMyTestimonies);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');

  // Share / Edit Form state
  const [editingTestimony, setEditingTestimony] = useState<Testimony | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<'Written' | 'Video' | 'Document'>('Written');
  const [writtenContent, setWrittenContent] = useState('');
  const [category, setCategory] = useState<string>('');
  const [privacy, setPrivacy] = useState<TestimonyPrivacy>('Public');
  const [publicConsentGranted, setPublicConsentGranted] = useState<boolean>(false);

  // Video upload state
  const [localVideo, setLocalVideo] = useState<LocalMediaSelection | null>(null);
  const [uploadedVideoPath, setUploadedVideoPath] = useState<string | null>(null);
  const [videoDurationWarning, setVideoDurationWarning] = useState<string | null>(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number>(0);
  const [videoUploading, setVideoUploading] = useState<boolean>(false);
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null);

  // Documents upload state
  const [existingAttachments, setExistingAttachments] = useState<TestimonyAttachment[]>([]);
  const [localDocuments, setLocalDocuments] = useState<
    Array<{
      file: LocalMediaSelection;
      uploadedPath?: string;
      uploading: boolean;
      progress: number;
      error?: string;
    }>
  >([]);

  // Track newly uploaded Storage paths in the current form session
  const sessionUploadedPathsRef = useRef<string[]>([]);
  const draftTestimonyIdRef = useRef<string>(
    TestimonyService.generateTestimonyId(activeChurchId)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [uploadConfig] = useState(() => TestimonyService.getUploadConfig());
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  useEffect(() => {
    if (!TestimonyService.getCachedPublicFeed(activeChurchId)) setLoadingFeed(true);
    const unsubFeed = TestimonyService.subscribeToPublicFeed(
      activeChurchId,
      (items) => {
        setPublicFeed(items);
        setLoadingFeed(false);
      },
      () => setLoadingFeed(false)
    );

    return () => unsubFeed();
  }, [activeChurchId]);

  useEffect(() => {
    if (!user?.uid) {
      setMyTestimonies([]);
      setLoadingMine(false);
      return;
    }
    if (!TestimonyService.getCachedMyTestimonies(activeChurchId, user.uid)) setLoadingMine(true);
    const unsubMine = TestimonyService.subscribeToMyTestimonies(
      activeChurchId,
      user.uid,
      (items) => {
        setMyTestimonies(items);
        setLoadingMine(false);
      },
      () => setLoadingMine(false)
    );

    return () => unsubMine();
  }, [activeChurchId, user?.uid]);

  // Helper to check whether a testimony belongs to the currently logged-in member
  const isMySubmission = (item: Testimony): boolean => {
    if (!item) return false;
    if (user?.uid && item.memberId === user.uid) return true;
    if (member?.id && item.memberId === member.id) return true;
    const cleanUserPhone = (user?.phoneNumber || member?.phone || '').replace(/\D/g, '').slice(-10);
    const cleanItemPhone = (item.memberPhone || '').replace(/\D/g, '').slice(-10);
    if (cleanUserPhone && cleanItemPhone && cleanUserPhone === cleanItemPhone) return true;
    return false;
  };

  // Filter public feed so members only see testimonies from other members (their own submissions are in My Testimonies)
  const otherMembersFeed = useMemo(() => {
    return publicFeed.filter((item) => !isMySubmission(item));
  }, [publicFeed, user?.uid, member?.id, user?.phoneNumber, member?.phone]);

  const filteredFeed = useMemo(() => {
    return otherMembersFeed.filter((item) => {
      if (item.privacy !== 'Public' || item.status !== 'Published') return false;

      if (
        selectedCategoryFilter !== 'All' &&
        item.category !== selectedCategoryFilter
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (item.title || '').toLowerCase().includes(q);
        const matchDesc = (item.description || '').toLowerCase().includes(q);
        const matchMember = (item.memberName || '').toLowerCase().includes(q);
        const matchCategory = (item.category || '').toLowerCase().includes(q);
        return matchTitle || matchDesc || matchMember || matchCategory;
      }
      return true;
    });
  }, [otherMembersFeed, selectedCategoryFilter, searchQuery]);

  const resetForm = async (cleanSessionUploads = false) => {
    if (cleanSessionUploads && sessionUploadedPathsRef.current.length > 0) {
      const toDelete = [...sessionUploadedPathsRef.current];
      sessionUploadedPathsRef.current = [];
      await TestimonyService.deleteStoragePaths(toDelete);
    } else {
      sessionUploadedPathsRef.current = [];
    }

    draftTestimonyIdRef.current = TestimonyService.generateTestimonyId(activeChurchId);
    setEditingTestimony(null);
    setTitle('');
    setDescription('');
    setSelectedFormat('Written');
    setWrittenContent('');
    setCategory('');
    setPrivacy('Public');
    setPublicConsentGranted(false);
    setLocalVideo(null);
    setUploadedVideoPath(null);
    setVideoDurationWarning(null);
    setVideoUploadProgress(0);
    setVideoUploading(false);
    setVideoUploadError(null);
    setExistingAttachments([]);
    setLocalDocuments([]);
  };

  const startEditTestimony = (item: Testimony, forcePublicSwitch = false) => {
    resetForm(false);
    draftTestimonyIdRef.current = item.testimonyId;
    setEditingTestimony(item);
    setTitle(item.title || '');
    setDescription(item.description || '');
    setWrittenContent(item.writtenContent || '');
    setCategory(item.category || '');

    if (item.videoStoragePath) {
      setSelectedFormat('Video');
      setUploadedVideoPath(item.videoStoragePath);
    } else if (item.attachmentStoragePaths && item.attachmentStoragePaths.length > 0 && !item.writtenContent) {
      setSelectedFormat('Document');
    } else {
      setSelectedFormat('Written');
    }

    setExistingAttachments(item.attachmentStoragePaths || []);

    if (forcePublicSwitch) {
      setPrivacy('Public');
      setPublicConsentGranted(false);
    } else {
      setPrivacy(item.privacy);
      setPublicConsentGranted(Boolean(item.publicConsentGranted));
    }

    setActiveTab('share');
  };

  // --- Video Selection & Upload ---
  const handlePickVideoFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow access to your media library to select a testimony video.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 0.7,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const fileName = asset.fileName || asset.uri.split('/').pop() || 'testimony_video.mp4';
      const mimeType = asset.mimeType || (fileName.toLowerCase().endsWith('.mov') ? 'video/quicktime' : 'video/mp4');

      const candidate: LocalMediaSelection = {
        uri: asset.uri,
        name: fileName,
        mimeType,
        sizeBytes: asset.fileSize || 0,
        durationMs: asset.duration ? (asset.duration < 1000 ? asset.duration * 1000 : asset.duration) : null,
      };

      const validation = await TestimonyService.validateVideoSelection(candidate);
      if (!validation.valid) {
        Alert.alert('Invalid Video', validation.error || 'Please choose a valid MP4 or MOV video under 100 MB.');
        return;
      }

      candidate.sizeBytes = validation.sizeBytes;
      setVideoDurationWarning(validation.warning || null);
      setLocalVideo(candidate);
      setVideoUploadError(null);
      setVideoUploadProgress(0);

      await uploadSelectedVideo(candidate);
    } catch (err: any) {
      console.error('⚠️ [TestimoniesScreen] Video pick error:', err);
      Alert.alert('Video Selection Error', err?.message || 'Could not select video.');
    }
  };

  const uploadSelectedVideo = async (videoToUpload?: LocalMediaSelection) => {
    const targetVideo = videoToUpload || localVideo;
    if (!targetVideo || !user?.uid) return null;

    setVideoUploading(true);
    setVideoUploadError(null);
    setVideoUploadProgress(0);

    try {
      const storagePath = TestimonyService.buildVideoStoragePath(
        activeChurchId,
        user.uid,
        draftTestimonyIdRef.current,
        targetVideo.name
      );

      await TestimonyService.uploadFileWithProgress(
        storagePath,
        targetVideo.uri,
        targetVideo.mimeType || 'video/mp4',
        (pct) => setVideoUploadProgress(pct)
      );

      sessionUploadedPathsRef.current.push(storagePath);
      setUploadedVideoPath(storagePath);
      setVideoUploading(false);
      return storagePath;
    } catch (err: any) {
      console.error('❌ [TestimoniesScreen] Video upload failed:', err);
      setVideoUploading(false);
      setVideoUploadError(
        err?.message || 'Video upload failed. Please check your connection and tap Retry.'
      );
      return null;
    }
  };

  const handleRemoveVideo = async () => {
    if (
      uploadedVideoPath &&
      sessionUploadedPathsRef.current.includes(uploadedVideoPath)
    ) {
      await TestimonyService.deleteStoragePaths([uploadedVideoPath]);
      sessionUploadedPathsRef.current = sessionUploadedPathsRef.current.filter(
        (p) => p !== uploadedVideoPath
      );
    }
    setLocalVideo(null);
    setUploadedVideoPath(null);
    setVideoDurationWarning(null);
    setVideoUploadProgress(0);
    setVideoUploadError(null);
  };

  // --- Document Selection & Upload ---
  const handlePickDocuments = async () => {
    try {
      const currentTotal = existingAttachments.length + localDocuments.length;
      if (currentTotal >= uploadConfig.maxDocumentsCount) {
        Alert.alert(
          'Attachment Limit Reached',
          `You can attach up to ${uploadConfig.maxDocumentsCount} supporting documents per testimony.`
        );
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const remainingSlots = uploadConfig.maxDocumentsCount - currentTotal;
      const assetsToProcess = result.assets.slice(0, remainingSlots);

      for (const asset of assetsToProcess) {
        const candidate: LocalMediaSelection = {
          uri: asset.uri,
          name: asset.name || 'attachment',
          mimeType: asset.mimeType || 'application/octet-stream',
          sizeBytes: asset.size || 0,
        };

        const validation = await TestimonyService.validateDocumentSelection(candidate);
        if (!validation.valid) {
          Alert.alert('Invalid Attachment', validation.error || 'Only PDF, JPG, and PNG files up to 10 MB are allowed.');
          continue;
        }

        candidate.sizeBytes = validation.sizeBytes;
        await uploadSingleDocument(candidate);
      }
    } catch (err: any) {
      console.error('⚠️ [TestimoniesScreen] Document pick error:', err);
      Alert.alert('Attachment Error', err?.message || 'Failed to pick document.');
    }
  };

  const uploadSingleDocument = async (docFile: LocalMediaSelection) => {
    if (!user?.uid) return;

    const entryIndex = Date.now() + Math.floor(Math.random() * 1000);
    setLocalDocuments((prev) => [
      ...prev,
      { file: docFile, uploading: true, progress: 0 },
    ]);

    try {
      const storagePath = TestimonyService.buildAttachmentStoragePath(
        activeChurchId,
        user.uid,
        draftTestimonyIdRef.current,
        docFile.name,
        entryIndex
      );

      await TestimonyService.uploadFileWithProgress(
        storagePath,
        docFile.uri,
        docFile.mimeType,
        (pct) => {
          setLocalDocuments((prev) =>
            prev.map((item) =>
              item.file.uri === docFile.uri ? { ...item, progress: pct } : item
            )
          );
        }
      );

      sessionUploadedPathsRef.current.push(storagePath);
      setLocalDocuments((prev) =>
        prev.map((item) =>
          item.file.uri === docFile.uri
            ? { ...item, uploading: false, progress: 100, uploadedPath: storagePath, error: undefined }
            : item
        )
      );
    } catch {
      setLocalDocuments((prev) =>
        prev.map((item) =>
          item.file.uri === docFile.uri
            ? { ...item, uploading: false, error: 'Upload failed. Tap Retry.' }
            : item
        )
      );
    }
  };

  const handleRetryDocumentUpload = async (docFile: LocalMediaSelection) => {
    if (!user?.uid) return;
    setLocalDocuments((prev) =>
      prev.map((item) =>
        item.file.uri === docFile.uri
          ? { ...item, uploading: true, progress: 0, error: undefined }
          : item
      )
    );

    try {
      const storagePath = TestimonyService.buildAttachmentStoragePath(
        activeChurchId,
        user.uid,
        draftTestimonyIdRef.current,
        docFile.name,
        Date.now()
      );
      await TestimonyService.uploadFileWithProgress(
        storagePath,
        docFile.uri,
        docFile.mimeType,
        (pct) => {
          setLocalDocuments((prev) =>
            prev.map((item) =>
              item.file.uri === docFile.uri ? { ...item, progress: pct } : item
            )
          );
        }
      );
      sessionUploadedPathsRef.current.push(storagePath);
      setLocalDocuments((prev) =>
        prev.map((item) =>
          item.file.uri === docFile.uri
            ? { ...item, uploading: false, progress: 100, uploadedPath: storagePath, error: undefined }
            : item
        )
      );
    } catch {
      setLocalDocuments((prev) =>
        prev.map((item) =>
          item.file.uri === docFile.uri
            ? { ...item, uploading: false, error: 'Retry failed. Please try again.' }
            : item
        )
      );
    }
  };

  const handleRemoveLocalDocument = async (uri: string) => {
    const found = localDocuments.find((d) => d.file.uri === uri);
    if (found?.uploadedPath && sessionUploadedPathsRef.current.includes(found.uploadedPath)) {
      await TestimonyService.deleteStoragePaths([found.uploadedPath]);
      sessionUploadedPathsRef.current = sessionUploadedPathsRef.current.filter(
        (p) => p !== found.uploadedPath
      );
    }
    setLocalDocuments((prev) => prev.filter((d) => d.file.uri !== uri));
  };

  const handleRemoveExistingAttachment = (path: string) => {
    setExistingAttachments((prev) => prev.filter((a) => a.path !== path));
  };

  // --- Submit Testimony ---
  const handleSubmitTestimony = async () => {
    if (isSubmitting) return;

    if (!user?.uid) {
      Alert.alert(
        'Sign In Required',
        'Please sign in with your member account to submit a testimony.'
      );
      return;
    }

    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your testimony.');
      return;
    }

    if (videoUploading || localDocuments.some((d) => d.uploading)) {
      Alert.alert(
        'Upload in Progress',
        'Please wait for your video or document uploads to finish before submitting.'
      );
      return;
    }

    if (videoUploadError || localDocuments.some((d) => Boolean(d.error))) {
      Alert.alert(
        'Upload Failed',
        'One or more files failed to upload. Please tap Retry or remove the failed file before submitting.'
      );
      return;
    }

    const hasWritten = Boolean(writtenContent.trim());
    const hasVideo = Boolean(uploadedVideoPath);
    const allAttachments: TestimonyAttachment[] = [
      ...existingAttachments,
      ...localDocuments
        .filter((d) => Boolean(d.uploadedPath))
        .map((d) => ({
          path: d.uploadedPath!,
          name: d.file.name,
          mimeType: d.file.mimeType,
          sizeBytes: d.file.sizeBytes,
        })),
    ];
    const hasDocs = allAttachments.length > 0;

    if (!hasWritten && !hasVideo && !hasDocs) {
      Alert.alert(
        'Content Required',
        'Please provide a written testimony, upload a video testimony, or attach a supporting document.'
      );
      return;
    }

    if (selectedFormat === 'Written' && !hasWritten && !hasVideo) {
      Alert.alert(
        'Written Testimony Required',
        'Please write your testimony story or switch to Video / Document upload.'
      );
      return;
    }

    if (selectedFormat === 'Video' && !hasVideo && !hasWritten) {
      Alert.alert(
        'Video Upload Required',
        'Please upload a video (MP4 or MOV up to 100 MB) for your video testimony.'
      );
      return;
    }

    if (privacy === 'Public' && !publicConsentGranted) {
      Alert.alert(
        'Public Sharing Consent Required',
        'Please check the consent box to confirm that your testimony may be shared publicly with church members after Admin approval.'
      );
      return;
    }

    const formatCount = [hasWritten, hasVideo, hasDocs].filter(Boolean).length;
    let resolvedType: TestimonyType = selectedFormat;
    if (formatCount > 1) {
      resolvedType = 'Mixed';
    } else if (hasVideo) {
      resolvedType = 'Video';
    } else if (hasDocs && !hasWritten) {
      resolvedType = 'Document';
    } else {
      resolvedType = 'Written';
    }

    setIsSubmitting(true);
    try {
      const effectiveDescription =
        description.trim() ||
        (writtenContent.trim()
          ? writtenContent.trim().slice(0, 180)
          : hasVideo
          ? 'Video Testimony'
          : 'Testimony');

      if (editingTestimony) {
        await TestimonyService.updateMemberTestimony(
          activeChurchId,
          editingTestimony.testimonyId,
          user.uid,
          {
            title: title.trim(),
            description: effectiveDescription,
            testimonyType: resolvedType,
            writtenContent: writtenContent.trim(),
            category: category || null,
            videoStoragePath: uploadedVideoPath || null,
            videoDurationMs:
              localVideo?.durationMs ?? editingTestimony.videoDurationMs ?? null,
            videoSizeBytes:
              localVideo?.sizeBytes ?? editingTestimony.videoSizeBytes ?? null,
            videoMimeType:
              localVideo?.mimeType ?? editingTestimony.videoMimeType ?? null,
            attachmentStoragePaths: allAttachments,
            privacy,
            publicConsentGranted: privacy === 'Public' ? publicConsentGranted : false,
          }
        );

        sessionUploadedPathsRef.current = [];
        await resetForm(false);
        if (privacy === 'Public') {
          setShowSuccessModal(true);
        } else {
          Alert.alert(
            'Private Testimony Saved',
            'Your testimony has been saved with Private status. Only you and authorized Church Admins can access it.'
          );
          setActiveTab('mine');
        }
      } else {
        const resolvedPhoto =
          (member as any)?.profilePhoto ||
          (member as any)?.photoURL ||
          (member as any)?.photoUrl ||
          (member as any)?.profileImage ||
          (member as any)?.profileImageUrl ||
          (member as any)?.avatar ||
          user.photoURL ||
          null;

        await TestimonyService.submitTestimony({
          testimonyId: draftTestimonyIdRef.current,
          churchId: activeChurchId,
          memberId: user.uid,
          memberName: member?.name || user.displayName || 'Church Member',
          memberPhotoUrl: resolvedPhoto,
          memberPhone: member?.phone || user.phoneNumber || null,
          title: title.trim(),
          description: effectiveDescription,
          testimonyType: resolvedType,
          writtenContent: writtenContent.trim(),
          category: category || null,
          videoStoragePath: uploadedVideoPath || null,
          videoDurationMs: localVideo?.durationMs ?? null,
          videoSizeBytes: localVideo?.sizeBytes ?? null,
          videoMimeType: localVideo?.mimeType ?? null,
          attachmentStoragePaths: allAttachments,
          privacy,
          publicConsentGranted: privacy === 'Public' ? publicConsentGranted : false,
        });

        sessionUploadedPathsRef.current = [];
        await resetForm(false);
        if (privacy === 'Public') {
          setShowSuccessModal(true);
        } else {
          Alert.alert(
            'Private Testimony Submitted',
            'Thank you for sharing! Your testimony is saved as Private and visible only to you and authorized Church Admins.'
          );
          setActiveTab('mine');
        }
      }
    } catch (err: any) {
      console.error('❌ [TestimoniesScreen] Submit error:', err);
      Alert.alert(
        'Submission Failed',
        err?.message || 'Unable to submit your testimony right now. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMyTestimony = (item: Testimony) => {
    Alert.alert(
      'Delete Testimony',
      `Are you sure you want to permanently delete "${item.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await TestimonyService.deleteTestimony(activeChurchId, item.testimonyId);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete testimony.');
            }
          },
        },
      ]
    );
  };

  const getStatusStyle = (status: TestimonyStatus) => {
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

  // --- Render Public Feed Card ---
  const renderFeedCard = ({ item }: { item: Testimony }) => {
    const hasVideo = Boolean(item.videoStoragePath);
    const previewText =
      item.description || item.writtenContent || 'Tap to view complete testimony';

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() =>
          navigation.navigate('TestimonyDetail', {
            testimonyId: item.testimonyId,
            churchId: item.churchId || activeChurchId,
          })
        }
        style={[
          styles.card,
          {
            backgroundColor: cardBg,
            borderColor,
          },
        ]}
      >
        {/* Author Header */}
        <View style={styles.cardHeaderRow}>
          {item.memberPhotoUrl ? (
            <Image source={{ uri: item.memberPhotoUrl }} style={styles.avatarImg} />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                { backgroundColor: subtleBg, borderColor },
              ]}
            >
              <User size={18} color={secondaryTextColor} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.memberNameText, { color: primaryTextColor }]} numberOfLines={1}>
              {item.memberName || 'Church Member'}
            </Text>
            <View style={styles.cardSubMetaRow}>
              <Calendar size={11} color={secondaryTextColor} />
              <Text style={[styles.dateText, { color: secondaryTextColor }]}>
                {formatDate(item.publishedAt || item.createdAt) || 'Published'}
              </Text>
            </View>
          </View>
          {item.category ? (
            <View
              style={[
                styles.categoryChip,
                { backgroundColor: subtleBg, borderColor },
              ]}
            >
              <Sparkles size={11} color={accentColor} />
              <Text style={[styles.categoryChipText, { color: primaryTextColor }]}>
                {item.category}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Title */}
        <Text style={[styles.cardTitle, { color: primaryTextColor }]} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Video Thumbnail Preview Banner */}
        {hasVideo ? (
          <View
            style={[
              styles.videoBannerPreview,
              { backgroundColor: subtleBg, borderColor },
            ]}
          >
            <View style={[styles.videoPlayCircle, { backgroundColor: accentColor }]}>
              <Play size={18} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.videoBannerTitle, { color: primaryTextColor }]}>
                Video Testimony
              </Text>
              <Text style={[styles.videoBannerSub, { color: secondaryTextColor }]} numberOfLines={1}>
                {item.videoDurationMs
                  ? `Duration ${formatDuration(item.videoDurationMs)} • Tap to watch in-app`
                  : 'Tap to watch video inside the app'}
              </Text>
            </View>
          </View>
        ) : null}

        <Text
          style={[styles.cardDescription, { color: secondaryTextColor }]}
          numberOfLines={hasVideo ? 2 : 3}
        >
          {previewText}
        </Text>

        {/* Footer Actions */}
        <View style={[styles.cardFooter, { borderTopColor: borderColor }]}>
          <View style={styles.formatPillRow}>
            {hasVideo && (
              <View style={styles.formatMiniPill}>
                <VideoIcon size={12} color={accentColor} />
                <Text style={[styles.formatMiniText, { color: accentColor }]}>
                  Video
                </Text>
              </View>
            )}
            {Boolean(item.writtenContent) && (
              <View style={styles.formatMiniPill}>
                <BookOpen size={12} color={secondaryTextColor} />
                <Text style={[styles.formatMiniText, { color: secondaryTextColor }]}>
                  Story
                </Text>
              </View>
            )}
            {item.attachmentStoragePaths?.length > 0 && (
              <View style={styles.formatMiniPill}>
                <FileText size={12} color={secondaryTextColor} />
                <Text style={[styles.formatMiniText, { color: secondaryTextColor }]}>
                  {item.attachmentStoragePaths.length} Doc
                  {item.attachmentStoragePaths.length > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.ctaActionRow}>
            <Text style={[styles.ctaActionText, { color: accentColor }]}>
              {hasVideo ? 'Watch Video' : 'Read More'}
            </Text>
            <ChevronRight size={15} color={accentColor} strokeWidth={2.4} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // --- Render My Testimony Card ---
  const renderMyTestimonyCard = ({ item }: { item: Testimony }) => {
    const statusBadge = getStatusStyle(item.status);
    const StatusIcon = statusBadge.icon;

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: cardBg,
            borderColor,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate('TestimonyDetail', {
              testimonyId: item.testimonyId,
              churchId: item.churchId || activeChurchId,
            })
          }
        >
          <View style={styles.myCardTopRow}>
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
                {item.status}
              </Text>
            </View>

            <View style={styles.privacyTag}>
              {item.privacy === 'Private' ? (
                <>
                  <Lock size={12} color={secondaryTextColor} />
                  <Text style={[styles.privacyTagText, { color: secondaryTextColor }]}>
                    Private
                  </Text>
                </>
              ) : (
                <>
                  <Globe size={12} color={accentColor} />
                  <Text style={[styles.privacyTagText, { color: accentColor }]}>
                    Public
                  </Text>
                </>
              )}
            </View>
          </View>

          <Text style={[styles.cardTitle, { color: primaryTextColor }]} numberOfLines={2}>
            {item.title}
          </Text>

          <Text
            style={[styles.cardDescription, { color: secondaryTextColor }]}
            numberOfLines={2}
          >
            {item.description || item.writtenContent || 'Tap to view testimony details'}
          </Text>

          {item.status === 'Rejected' && item.rejectionReason ? (
            <View
              style={[
                styles.rejectionAlertBox,
                {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEE2E2',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA',
                },
              ]}
            >
              <AlertCircle size={15} color="#DC2626" />
              <View style={{ flex: 1 }}>
                <Text style={styles.rejectionAlertTitle}>Admin Review Note:</Text>
                <Text style={styles.rejectionAlertBody}>{item.rejectionReason}</Text>
              </View>
            </View>
          ) : null}
        </TouchableOpacity>

        {/* Member Card Actions */}
        <View style={[styles.myCardActionRow, { borderTopColor: borderColor }]}>
          <TouchableOpacity
            style={[
              styles.secondaryActionBtn,
              { backgroundColor: subtleBg, borderColor },
            ]}
            onPress={() => startEditTestimony(item, false)}
            activeOpacity={0.8}
          >
            <Edit3 size={14} color={primaryTextColor} />
            <Text style={[styles.secondaryActionBtnTxt, { color: primaryTextColor }]}>
              {item.status === 'Published' ? 'Edit (Re-Reviews)' : 'Edit'}
            </Text>
          </TouchableOpacity>

          {item.privacy === 'Private' && (
            <TouchableOpacity
              style={[
                styles.secondaryActionBtn,
                {
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
                  borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#BBF7D0',
                },
              ]}
              onPress={() => startEditTestimony(item, true)}
              activeOpacity={0.8}
            >
              <Globe size={14} color={isDark ? '#34D399' : '#15803D'} />
              <Text
                style={[
                  styles.secondaryActionBtnTxt,
                  { color: isDark ? '#34D399' : '#15803D' },
                ]}
              >
                Make Public
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.deleteActionBtn,
              {
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEE2E2',
                borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA',
              },
            ]}
            onPress={() => handleDeleteMyTestimony(item)}
            activeOpacity={0.8}
          >
            <Trash2 size={15} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeBg }]} edges={['top']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={themeBg}
      />

      {/* ── Screen Header (Clean circular back button & title matching other Member tabs) ── */}
      <View style={[styles.headerRow, { borderBottomColor: borderColor }]}>
        <TouchableOpacity
          style={[styles.circularBackBtn, { backgroundColor: cardBg, borderColor }]}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color={primaryTextColor} strokeWidth={2.4} />
        </TouchableOpacity>

        <Text style={[styles.headerTitleText, { color: primaryTextColor }]} numberOfLines={1}>
          Testimonies
        </Text>

        <View style={styles.headerRightSpacer} />
      </View>

      {/* Reusable Segmented Tabs (Matches Prayer & Care Cell Tabs) */}
      <View
        style={[
          styles.tabsContainer,
          { backgroundColor: cardBg, borderColor },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === 'feed' && { backgroundColor: accentColor },
          ]}
          onPress={() => setActiveTab('feed')}
          activeOpacity={0.85}
        >
          <Sparkles
            size={14}
            color={activeTab === 'feed' ? '#FFFFFF' : secondaryTextColor}
          />
          <Text
            style={[
              styles.tabBtnText,
              { color: activeTab === 'feed' ? '#FFFFFF' : secondaryTextColor },
            ]}
          >
            Feed ({otherMembersFeed.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === 'share' && { backgroundColor: accentColor },
          ]}
          onPress={() => setActiveTab('share')}
          activeOpacity={0.85}
        >
          <PlusCircle
            size={14}
            color={activeTab === 'share' ? '#FFFFFF' : secondaryTextColor}
          />
          <Text
            style={[
              styles.tabBtnText,
              { color: activeTab === 'share' ? '#FFFFFF' : secondaryTextColor },
            ]}
          >
            {editingTestimony ? 'Edit' : 'Share'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === 'mine' && { backgroundColor: accentColor },
          ]}
          onPress={() => setActiveTab('mine')}
          activeOpacity={0.85}
        >
          <User
            size={14}
            color={activeTab === 'mine' ? '#FFFFFF' : secondaryTextColor}
          />
          <Text
            style={[
              styles.tabBtnText,
              { color: activeTab === 'mine' ? '#FFFFFF' : secondaryTextColor },
            ]}
          >
            My ({myTestimonies.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: PUBLIC TESTIMONIES FEED */}
      {activeTab === 'feed' && (
        <View style={{ flex: 1 }}>
          {/* Search Bar & Category Filters */}
          <View style={styles.filterSection}>
            <View
              style={[
                styles.searchBox,
                { backgroundColor: cardBg, borderColor },
              ]}
            >
              <Search size={16} color={secondaryTextColor} />
              <TextInput
                style={[styles.searchInput, { color: primaryTextColor }]}
                placeholder="Search testimonies..."
                placeholderTextColor={secondaryTextColor}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={15} color={secondaryTextColor} />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryFilterScroll}
            >
              {['All', ...TESTIMONY_CATEGORIES].map((cat) => {
                const selected = selectedCategoryFilter === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setSelectedCategoryFilter(cat)}
                    activeOpacity={0.8}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: selected ? accentColor : cardBg,
                        borderColor: selected ? accentColor : borderColor,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: selected ? '#FFFFFF' : secondaryTextColor },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {loadingFeed ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color={accentColor} />
            </View>
          ) : filteredFeed.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconBox, { backgroundColor: subtleBg, borderColor }]}>
                <MessageCircle size={44} color={secondaryTextColor} />
              </View>
              <Text style={[styles.emptyTitle, { color: primaryTextColor }]}>
                No Published Testimonies Yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: secondaryTextColor }]}>
                Be the first to glorify God by sharing your personal testimony with your church family!
              </Text>
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: accentColor }]}
                onPress={() => setActiveTab('share')}
                activeOpacity={0.85}
              >
                <PlusCircle size={16} color="#FFFFFF" />
                <Text style={styles.primaryActionBtnTxt}>Share Testimony</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredFeed}
              keyExtractor={(item) => item.testimonyId}
              renderItem={renderFeedCard}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}

      {/* TAB 2: SHARE / EDIT TESTIMONY FORM */}
      {activeTab === 'share' && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.formContainer}
            showsVerticalScrollIndicator={false}
          >
            {editingTestimony && (
              <View
                style={[
                  styles.editingBanner,
                  {
                    backgroundColor: subtleBg,
                    borderColor,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.editingBannerTitle, { color: primaryTextColor }]}>
                    Editing: {editingTestimony.title}
                  </Text>
                  <Text style={[styles.editingBannerSub, { color: secondaryTextColor }]}>
                    {editingTestimony.status === 'Published'
                      ? 'Saving edits will resubmit this testimony for Admin review.'
                      : 'Update your testimony details or sharing preferences.'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => resetForm(true)}
                  style={[styles.cancelBtn, { borderColor }]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.cancelBtnTxt, { color: primaryTextColor }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 1. Format Selection */}
            <Text style={[styles.fieldLabel, { color: primaryTextColor }]}>
              Testimony Type
            </Text>
            <View style={styles.formatRow}>
              {(
                [
                  { key: 'Written', label: 'Written Story', icon: BookOpen },
                  { key: 'Video', label: 'Video Upload', icon: VideoIcon },
                  { key: 'Document', label: 'Documents', icon: FileText },
                ] as const
              ).map((fmt) => {
                const IconComp = fmt.icon;
                const active = selectedFormat === fmt.key;
                return (
                  <TouchableOpacity
                    key={fmt.key}
                    onPress={() => setSelectedFormat(fmt.key)}
                    activeOpacity={0.8}
                    style={[
                      styles.formatCard,
                      {
                        backgroundColor: active ? subtleBg : cardBg,
                        borderColor: active ? accentColor : borderColor,
                      },
                    ]}
                  >
                    <IconComp
                      size={18}
                      color={active ? accentColor : secondaryTextColor}
                    />
                    <Text
                      style={[
                        styles.formatCardTxt,
                        { color: active ? accentColor : primaryTextColor },
                      ]}
                    >
                      {fmt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 2. Testimony Title */}
            <Text style={[styles.fieldLabel, { color: primaryTextColor }]}>
              Testimony Title *
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: cardBg,
                  borderColor,
                  color: primaryTextColor,
                },
              ]}
              placeholder="e.g. God's Miraculous Healing & Provision"
              placeholderTextColor={secondaryTextColor}
              value={title}
              onChangeText={setTitle}
              maxLength={120}
            />

            {/* 3. Short Summary */}
            <Text style={[styles.fieldLabel, { color: primaryTextColor }]}>
              Short Summary
            </Text>
            <TextInput
              style={[
                styles.textInput,
                styles.shortTextArea,
                {
                  backgroundColor: cardBg,
                  borderColor,
                  color: primaryTextColor,
                },
              ]}
              placeholder="Brief summary displayed in the public feed (1-2 sentences)"
              placeholderTextColor={secondaryTextColor}
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={300}
            />

            {/* 4. Category Selector */}
            <Text style={[styles.fieldLabel, { color: primaryTextColor }]}>
              Category (Optional)
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryPickerRow}
            >
              {TESTIMONY_CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(isSelected ? '' : cat)}
                    activeOpacity={0.8}
                    style={[
                      styles.categoryOptionChip,
                      {
                        backgroundColor: isSelected ? accentColor : cardBg,
                        borderColor: isSelected ? accentColor : borderColor,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryOptionTxt,
                        { color: isSelected ? '#FFFFFF' : secondaryTextColor },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 5. Written Content */}
            <Text style={[styles.fieldLabel, { color: primaryTextColor }]}>
              Written Testimony {selectedFormat === 'Written' ? '*' : '(Optional)'}
            </Text>
            <TextInput
              style={[
                styles.textInput,
                styles.longTextArea,
                {
                  backgroundColor: cardBg,
                  borderColor,
                  color: primaryTextColor,
                },
              ]}
              placeholder="Share what you were going through, how you prayed, and how God delivered you..."
              placeholderTextColor={secondaryTextColor}
              value={writtenContent}
              onChangeText={setWrittenContent}
              multiline
              textAlignVertical="top"
            />

            {/* 6. Video Upload Section */}
            <View
              style={[
                styles.sectionBox,
                { backgroundColor: cardBg, borderColor },
              ]}
            >
              <View style={styles.sectionBoxHeader}>
                <VideoIcon size={17} color={accentColor} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionBoxTitle, { color: primaryTextColor }]}>
                    Video Testimony {selectedFormat === 'Video' ? '*' : '(Optional)'}
                  </Text>
                  <Text style={[styles.sectionBoxSub, { color: secondaryTextColor }]}>
                    MP4 or MOV • Max {uploadConfig.maxVideoSizeMB} MB • Recommended up to 5 mins
                  </Text>
                </View>
              </View>

              {!localVideo && !uploadedVideoPath ? (
                <TouchableOpacity
                  style={[
                    styles.secondaryActionBtn,
                    { backgroundColor: subtleBg, borderColor, paddingVertical: 14 },
                  ]}
                  onPress={handlePickVideoFromGallery}
                  activeOpacity={0.85}
                >
                  <Upload size={16} color={primaryTextColor} />
                  <Text style={[styles.secondaryActionBtnTxt, { color: primaryTextColor }]}>
                    Choose Video (MP4 / MOV)
                  </Text>
                </TouchableOpacity>
              ) : (
                <View
                  style={[
                    styles.uploadedItemBox,
                    { backgroundColor: subtleBg, borderColor },
                  ]}
                >
                  <View style={styles.uploadedItemTopRow}>
                    <VideoIcon size={16} color={accentColor} />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.uploadedItemName, { color: primaryTextColor }]}
                        numberOfLines={1}
                      >
                        {localVideo?.name || 'Selected Video'}
                      </Text>
                      <Text style={[styles.uploadedItemMeta, { color: secondaryTextColor }]}>
                        {localVideo?.sizeBytes
                          ? formatFileSize(localVideo.sizeBytes)
                          : 'Storage ready'}
                        {localVideo?.durationMs
                          ? ` • ${formatDuration(localVideo.durationMs)}`
                          : ''}
                      </Text>
                    </View>
                    {!videoUploading && (
                      <TouchableOpacity
                        onPress={handleRemoveVideo}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={16} color="#DC2626" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {videoDurationWarning ? (
                    <Text style={styles.warningTxt}>{videoDurationWarning}</Text>
                  ) : null}

                  {videoUploading && (
                    <View style={styles.progressWrap}>
                      <View style={[styles.progressBarBg, { backgroundColor: borderColor }]}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${videoUploadProgress}%`,
                              backgroundColor: accentColor,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.progressTxt, { color: secondaryTextColor }]}>
                        Uploading video... {videoUploadProgress}%
                      </Text>
                    </View>
                  )}

                  {!videoUploading && uploadedVideoPath && !videoUploadError && (
                    <View style={styles.successRow}>
                      <CheckCircle2 size={14} color="#15803D" />
                      <Text style={styles.successTxt}>Video uploaded successfully</Text>
                    </View>
                  )}

                  {videoUploadError && (
                    <View style={styles.errorRow}>
                      <Text style={styles.errorTxt}>{videoUploadError}</Text>
                      <TouchableOpacity
                        style={[styles.retryBtn, { backgroundColor: accentColor }]}
                        onPress={() => uploadSelectedVideo()}
                      >
                        <RotateCcw size={12} color="#FFFFFF" />
                        <Text style={styles.retryBtnTxt}>Retry</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* 7. Documents Attachments */}
            <View
              style={[
                styles.sectionBox,
                { backgroundColor: cardBg, borderColor },
              ]}
            >
              <View style={styles.sectionBoxHeader}>
                <FileText size={17} color={accentColor} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionBoxTitle, { color: primaryTextColor }]}>
                    Supporting Documents {selectedFormat === 'Document' ? '*' : '(Optional)'}
                  </Text>
                  <Text style={[styles.sectionBoxSub, { color: secondaryTextColor }]}>
                    PDF, JPG, PNG • Max {uploadConfig.maxDocumentSizeMB} MB each (up to {uploadConfig.maxDocumentsCount} files)
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.secondaryActionBtn,
                  { backgroundColor: subtleBg, borderColor, paddingVertical: 14 },
                ]}
                onPress={handlePickDocuments}
                activeOpacity={0.85}
              >
                <Upload size={16} color={primaryTextColor} />
                <Text style={[styles.secondaryActionBtnTxt, { color: primaryTextColor }]}>
                  Add Document / Image Attachment
                </Text>
              </TouchableOpacity>

              {/* Existing Attachments */}
              {existingAttachments.map((att, idx) => (
                <View
                  key={`${att.path}_${idx}`}
                  style={[
                    styles.docRow,
                    { backgroundColor: subtleBg, borderColor },
                  ]}
                >
                  <FileText size={16} color={accentColor} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.uploadedItemName, { color: primaryTextColor }]}
                      numberOfLines={1}
                    >
                      {att.name}
                    </Text>
                    <Text style={[styles.uploadedItemMeta, { color: secondaryTextColor }]}>
                      {formatFileSize(att.sizeBytes)} • Uploaded
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveExistingAttachment(att.path)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ))}

              {/* New Local Documents */}
              {localDocuments.map((docEntry) => (
                <View
                  key={docEntry.file.uri}
                  style={[
                    styles.docRow,
                    { backgroundColor: subtleBg, borderColor },
                  ]}
                >
                  <FileText size={16} color={accentColor} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.uploadedItemName, { color: primaryTextColor }]}
                      numberOfLines={1}
                    >
                      {docEntry.file.name}
                    </Text>
                    {docEntry.uploading ? (
                      <Text style={{ fontSize: 11, color: accentColor, marginTop: 2 }}>
                        Uploading... {docEntry.progress}%
                      </Text>
                    ) : docEntry.error ? (
                      <Text style={{ fontSize: 11, color: '#DC2626', marginTop: 2 }}>
                        {docEntry.error}
                      </Text>
                    ) : (
                      <Text style={{ fontSize: 11, color: '#15803D', marginTop: 2 }}>
                        {formatFileSize(docEntry.file.sizeBytes)} • Ready
                      </Text>
                    )}
                  </View>

                  {docEntry.error && (
                    <TouchableOpacity
                      style={[styles.retryBtn, { backgroundColor: accentColor, marginRight: 8 }]}
                      onPress={() => handleRetryDocumentUpload(docEntry.file)}
                    >
                      <RotateCcw size={12} color="#FFFFFF" />
                      <Text style={styles.retryBtnTxt}>Retry</Text>
                    </TouchableOpacity>
                  )}

                  {!docEntry.uploading && (
                    <TouchableOpacity
                      onPress={() => handleRemoveLocalDocument(docEntry.file.uri)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={16} color="#DC2626" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {/* 8. Privacy Preference */}
            <Text style={[styles.fieldLabel, { color: primaryTextColor }]}>
              Privacy Option *
            </Text>
            <View style={styles.privacyStack}>
              {/* Public Choice */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setPrivacy('Public')}
                style={[
                  styles.privacyCard,
                  {
                    backgroundColor: cardBg,
                    borderColor: privacy === 'Public' ? accentColor : borderColor,
                    borderWidth: privacy === 'Public' ? 2 : 1,
                  },
                ]}
              >
                <View style={styles.privacyCardHeader}>
                  <Globe
                    size={17}
                    color={privacy === 'Public' ? accentColor : secondaryTextColor}
                  />
                  <Text
                    style={[
                      styles.privacyCardTitle,
                      { color: privacy === 'Public' ? primaryTextColor : secondaryTextColor },
                    ]}
                  >
                    Public (Church Testimonies Feed)
                  </Text>
                </View>
                <Text style={[styles.privacyCardDesc, { color: secondaryTextColor }]}>
                  Submitted as Pending Review. Once approved and published by a Church Admin, your testimony will appear in the Member Feed.
                </Text>
              </TouchableOpacity>

              {/* Private Choice */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  setPrivacy('Private');
                  setPublicConsentGranted(false);
                }}
                style={[
                  styles.privacyCard,
                  {
                    backgroundColor: cardBg,
                    borderColor: privacy === 'Private' ? accentColor : borderColor,
                    borderWidth: privacy === 'Private' ? 2 : 1,
                  },
                ]}
              >
                <View style={styles.privacyCardHeader}>
                  <Lock
                    size={17}
                    color={privacy === 'Private' ? accentColor : secondaryTextColor}
                  />
                  <Text
                    style={[
                      styles.privacyCardTitle,
                      { color: privacy === 'Private' ? primaryTextColor : secondaryTextColor },
                    ]}
                  >
                    Private (Pastor & Admins Only)
                  </Text>
                </View>
                <Text style={[styles.privacyCardDesc, { color: secondaryTextColor }]}>
                  Strictly visible only to you and authorized Church Admins. It will never be published to the public feed or sent to other members.
                </Text>
              </TouchableOpacity>
            </View>

            {/* Public Consent Checkbox */}
            {privacy === 'Public' && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setPublicConsentGranted(!publicConsentGranted)}
                style={[
                  styles.consentBox,
                  {
                    backgroundColor: cardBg,
                    borderColor: publicConsentGranted ? accentColor : borderColor,
                  },
                ]}
              >
                {publicConsentGranted ? (
                  <CheckSquare size={19} color={accentColor} />
                ) : (
                  <Square size={19} color={secondaryTextColor} />
                )}
                <Text style={[styles.consentTxt, { color: primaryTextColor }]}>
                  I consent to share this testimony publicly with church members after Admin review and approval.
                </Text>
              </TouchableOpacity>
            )}

            {/* Primary Submit Button */}
            <TouchableOpacity
              disabled={isSubmitting || videoUploading}
              onPress={handleSubmitTestimony}
              activeOpacity={0.85}
              style={[
                styles.primaryActionBtn,
                {
                  backgroundColor: accentColor,
                  opacity: isSubmitting || videoUploading ? 0.65 : 1,
                },
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Sparkles size={17} color="#FFFFFF" />
                  <Text style={styles.primaryActionBtnTxt}>
                    {editingTestimony
                      ? privacy === 'Private'
                        ? 'Save Private Testimony'
                        : 'Update & Submit for Review'
                      : privacy === 'Private'
                      ? 'Submit Private Testimony'
                      : 'Submit Public Testimony'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* TAB 3: MY TESTIMONIES */}
      {activeTab === 'mine' && (
        <View style={{ flex: 1 }}>
          {loadingMine ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color={accentColor} />
            </View>
          ) : myTestimonies.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconBox, { backgroundColor: subtleBg, borderColor }]}>
                <BookOpen size={44} color={secondaryTextColor} />
              </View>
              <Text style={[styles.emptyTitle, { color: primaryTextColor }]}>
                No Testimonies Submitted Yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: secondaryTextColor }]}>
                Share your personal testimony publicly with church members or privately for pastoral encouragement.
              </Text>
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: accentColor }]}
                onPress={() => setActiveTab('share')}
                activeOpacity={0.85}
              >
                <PlusCircle size={16} color="#FFFFFF" />
                <Text style={styles.primaryActionBtnTxt}>Share Testimony</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={myTestimonies}
              keyExtractor={(item) => item.testimonyId}
              renderItem={renderMyTestimonyCard}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}

      {/* ── Public Testimony Submission Success Modal ── */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowSuccessModal(false);
          setActiveTab('mine');
        }}
      >
        <View style={styles.successModalBackdrop}>
          <View
            style={[
              styles.successModalCard,
              { backgroundColor: cardBg, borderColor },
            ]}
          >
            {/* Glowing Success Celebration Icon */}
            <View style={styles.successIconWrapper}>
              <View
                style={[
                  styles.successIconOuterGlow,
                  { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.12)' },
                ]}
              >
                <View style={styles.successIconInnerCircle}>
                  <CheckCircle2 size={36} color="#FFFFFF" strokeWidth={2.6} />
                </View>
              </View>
            </View>

            {/* Clear Success Title */}
            <Text style={[styles.successModalTitle, { color: primaryTextColor }]}>
              Testimony Submitted Successfully!
            </Text>

            {/* Supporting message */}
            <Text style={[styles.successModalSubtitle, { color: secondaryTextColor }]}>
              Your testimony has been submitted to the Admin for review. You will be notified once it is published.
            </Text>

            {/* Done Button */}
            <TouchableOpacity
              style={[styles.successDoneBtn, { backgroundColor: accentColor }]}
              onPress={() => {
                setShowSuccessModal(false);
                setActiveTab('mine');
              }}
              activeOpacity={0.88}
            >
              <Text style={styles.successDoneBtnTxt}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header Row - Clean, consistent with Prayer & Song tabs (no hero bloat)
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  circularBackBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitleText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerRightSpacer: {
    width: 42,
    height: 42,
  },
  // Segmented Tabs Container (Matches Prayer & Care Cell Tabs)
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  // Filter Section
  filterSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  categoryFilterScroll: {
    paddingBottom: 6,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // List Container
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  // Reusable Card Style
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  memberNameText: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardSubMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dateText: {
    fontSize: 11,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 23,
    marginBottom: 8,
  },
  videoBannerPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  videoPlayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  videoBannerSub: {
    fontSize: 11,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  formatPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  formatMiniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  formatMiniText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ctaActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ctaActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  // Form Styles
  formContainer: {
    padding: 16,
    paddingBottom: 48,
  },
  editingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  editingBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  editingBannerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelBtnTxt: {
    fontSize: 12,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  formatCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  formatCardTxt: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  shortTextArea: {
    minHeight: 68,
    textAlignVertical: 'top',
  },
  longTextArea: {
    minHeight: 140,
    textAlignVertical: 'top',
  },
  categoryPickerRow: {
    gap: 8,
    paddingBottom: 16,
  },
  categoryOptionChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryOptionTxt: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  sectionBoxHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  sectionBoxTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  sectionBoxSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  uploadedItemBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  uploadedItemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  uploadedItemName: {
    fontSize: 13,
    fontWeight: '700',
  },
  uploadedItemMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  warningTxt: {
    fontSize: 11.5,
    color: '#B45309',
    marginTop: 8,
  },
  progressWrap: {
    marginTop: 10,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressTxt: {
    fontSize: 11,
    marginTop: 4,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  successTxt: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '600',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  errorTxt: {
    flex: 1,
    fontSize: 12,
    color: '#DC2626',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryBtnTxt: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  privacyStack: {
    gap: 10,
    marginBottom: 14,
  },
  privacyCard: {
    borderRadius: 14,
    padding: 14,
  },
  privacyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  privacyCardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  privacyCardDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  consentBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 18,
  },
  consentTxt: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  // Consistent Button Styles
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 3,
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
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  secondaryActionBtnTxt: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  deleteActionBtn: {
    marginLeft: 'auto',
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  // My Testimonies Card Elements
  myCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  privacyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  privacyTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rejectionAlertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  rejectionAlertTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B91C1C',
  },
  rejectionAlertBody: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 2,
  },
  myCardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  // Center / Empty State
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  // Public Submission Success Popup
  successModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successModalCard: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
    borderWidth: 1.2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 12,
  },
  successIconWrapper: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconOuterGlow: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconInnerCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  successModalTitle: {
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  successModalSubtitle: {
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  successDoneBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  successDoneBtnTxt: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
