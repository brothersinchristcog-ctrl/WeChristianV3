import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio, ResizeMode, Video } from 'expo-av';
import {
  Archive,
  ArrowLeft,
  Ban,
  Bell,
  BellOff,
  Camera,
  Check,
  CheckCheck,
  Copy,
  CornerUpLeft,
  FileText,
  Film,
  Flag,
  Forward,
  Image as ImageIcon,
  Info,
  Mic,
  MoreVertical,
  Paperclip,
  Pause,
  Play,
  Send,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import { useTheme } from '../../context/ThemeContext';
import ChatService from '../../services/ChatService';
import {
  ChatMessage,
  ChatParticipantSummary,
  ChatPresence,
  ChatReplyPreview,
  ChatThread,
} from '../../types/chat';

const REACTION_EMOJIS = ['🙏', '❤️', '👍', '😂', '🔥', '🙌'];

const formatMsgTime = (ts: any): string => {
  if (!ts) return '';
  try {
    const date =
      typeof ts.toDate === 'function'
        ? ts.toDate()
        : typeof ts.seconds === 'number'
        ? new Date(ts.seconds * 1000)
        : new Date(ts);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
};

const formatDuration = (ms?: number): string => {
  const totalSec = Math.max(0, Math.round((ms || 0) / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
};

const formatLastSeen = (lastSeen?: number | null): string => {
  if (!lastSeen) return 'Church Member';
  const d = new Date(lastSeen);
  if (Number.isNaN(d.getTime())) return 'Church Member';
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  const timeStr = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return isToday
    ? `last seen today at ${timeStr}`
    : `last seen ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${timeStr}`;
};

export default function ChatRoomScreen({ route, navigation }: any) {
  const {
    chatId,
    churchId: routeChurchId,
    title: initialTitle,
    photoUrl: initialPhotoUrl,
    chatType: initialChatType,
    peerId: initialPeerId,
  } = route?.params || {};

  const { isDark } = useTheme();
  const { user, member } = useAuth();
  const { activeChurch } = useChurch();
  const insets = useSafeAreaInsets();

  const churchId =
    routeChurchId || activeChurch?.id || member?.churchId || member?.primaryChurchId || '';
  const myIds = useMemo(
    () => ChatService.getMyIdentityIds(user, member),
    [user?.uid, member?.id, (member as any)?.uid]
  );
  const canonicalId = ChatService.getCanonicalId(user, member);
  const myName = member?.name || user?.displayName || 'Member';
  const myPhoto = (member as any)?.photoURL || (member as any)?.photoUrl || user?.photoURL || null;

  const myParticipantSummary: ChatParticipantSummary = useMemo(
    () => ({
      memberId: canonicalId,
      uid: user?.uid || canonicalId,
      name: myName,
      photoUrl: myPhoto,
      phone: member?.phone || user?.phoneNumber || null,
      userType: member?.userType || 'Member',
    }),
    [canonicalId, user?.uid, myName, myPhoto, member?.phone, user?.phoneNumber, member?.userType]
  );

  const [thread, setThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [replyingTo, setReplyingTo] = useState<ChatReplyPreview | null>(null);
  const [selectedMsg, setSelectedMsg] = useState<ChatMessage | null>(null);
  const [peerPresence, setPeerPresence] = useState<ChatPresence>({ online: false, lastSeen: null });
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Media & voice states
  const [attachModalVisible, setAttachModalVisible] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);

  // Fullscreen image / video viewers
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  // Forward modal
  const [forwardMsg, setForwardMsg] = useState<ChatMessage | null>(null);
  const [myChatsList, setMyChatsList] = useState<ChatThread[]>([]);
  const [forwardTargets, setForwardTargets] = useState<Record<string, ChatThread>>({});
  const [forwarding, setForwarding] = useState(false);

  // Menu / Block / Report states
  const [dmOptionsVisible, setDmOptionsVisible] = useState(false);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [reportTarget, setReportTarget] = useState<{
    messageId?: string;
    messagePreview?: string;
    targetMemberId?: string;
    targetName?: string;
  } | null>(null);
  const [reportReason, setReportReason] = useState('');

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const themeBg = isDark ? '#0b141a' : '#efeae2';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const ownBubbleBg = isDark ? '#1a3673' : '#dbeafe';
  const otherBubbleBg = isDark ? '#1e293b' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
  const primaryText = isDark ? '#f8fafc' : '#0f172a';
  const secondaryText = isDark ? '#94a3b8' : '#64748b';
  const accentColor = isDark ? '#3b82f6' : '#1a2d5a';

  const resolvedPeerId = useMemo(() => {
    if (initialPeerId) return initialPeerId;
    if (thread?.type === 'direct') {
      return (thread.participantIds || []).find((id) => !myIds.includes(id)) || '';
    }
    return '';
  }, [initialPeerId, thread, myIds]);

  const resolvedTitle = useMemo(() => {
    if (thread?.type === 'group') return thread.name || initialTitle || 'Church Group';
    if (resolvedPeerId && thread?.participants?.[resolvedPeerId]?.name) {
      return thread.participants[resolvedPeerId].name;
    }
    return initialTitle || 'Church Chat';
  }, [thread, resolvedPeerId, initialTitle]);

  const resolvedPhoto = useMemo(() => {
    if (thread?.type === 'group') return thread.photoUrl || initialPhotoUrl || null;
    if (resolvedPeerId && thread?.participants?.[resolvedPeerId]?.photoUrl) {
      return thread.participants[resolvedPeerId].photoUrl;
    }
    return initialPhotoUrl || null;
  }, [thread, resolvedPeerId, initialPhotoUrl]);

  const isGroupChat = (thread?.type || initialChatType) === 'group';
  const amIGroupAdmin = useMemo(
    () => (thread?.adminIds || []).some((id) => myIds.includes(id)),
    [thread?.adminIds, myIds]
  );
  const isAnnouncementLocked = Boolean(
    isGroupChat && thread?.settings?.onlyAdminsCanMessage && !amIGroupAdmin
  );
  const isPeerBlocked = Boolean(!isGroupChat && resolvedPeerId && blockedIds.includes(resolvedPeerId));
  const isMuted = useMemo(
    () => myIds.some((id) => Boolean(thread?.mutedBy?.[id])),
    [thread?.mutedBy, myIds]
  );
  const isArchived = useMemo(
    () => (thread?.archivedBy || []).some((id) => myIds.includes(id)),
    [thread?.archivedBy, myIds]
  );

  useEffect(() => {
    if (!churchId || !chatId) {
      setLoading(false);
      return;
    }

    const unsubThread = ChatService.subscribeToChatThread(churchId, chatId, (data) => {
      setThread(data);
    });

    const unsubMsgs = ChatService.subscribeToMessages(churchId, chatId, 80, (list) => {
      setMessages(list);
      setLoading(false);
    });

    const unsubTyping = ChatService.subscribeToTypingUsers(churchId, chatId, myIds, setTypingUsers);
    const unsubBlocks = canonicalId
      ? ChatService.subscribeToBlockedMembers(churchId, canonicalId, setBlockedIds)
      : () => {};

    return () => {
      unsubThread();
      unsubMsgs();
      unsubTyping();
      unsubBlocks();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (canonicalId) {
        ChatService.setTypingStatus(churchId, chatId, canonicalId, myName, false);
      }
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, [churchId, chatId, myIds.join('|'), canonicalId, myName]);

  useEffect(() => {
    if (!churchId || isGroupChat || !resolvedPeerId) return;
    const unsub = ChatService.subscribeToMemberPresence(churchId, resolvedPeerId, setPeerPresence);
    return () => unsub();
  }, [churchId, isGroupChat, resolvedPeerId]);

  useEffect(() => {
    if (!churchId || !chatId || myIds.length === 0) return;
    const hasUnreadFromOthers = messages.some(
      (m) => !myIds.includes(m.senderId) && !(m.readBy || []).some((id) => myIds.includes(id))
    );
    const hasThreadUnread = myIds.some((id) => Number(thread?.unreadCounts?.[id] || 0) > 0);
    if (hasUnreadFromOthers || hasThreadUnread) {
      ChatService.markChatAsRead(churchId, chatId, myIds, messages);
    }
  }, [churchId, chatId, messages, thread?.unreadCounts, myIds]);

  const handleTextChange = (text: string) => {
    setInputText(text);
    if (!churchId || !chatId || !canonicalId || isPeerBlocked || isAnnouncementLocked) return;

    const hasContent = text.trim().length > 0;
    if (hasContent && !isTypingRef.current) {
      isTypingRef.current = true;
      ChatService.setTypingStatus(churchId, chatId, canonicalId, myName, true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (hasContent) {
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        ChatService.setTypingStatus(churchId, chatId, canonicalId, myName, false);
      }, 3500);
    } else if (isTypingRef.current) {
      isTypingRef.current = false;
      ChatService.setTypingStatus(churchId, chatId, canonicalId, myName, false);
    }
  };

  const handleSend = async () => {
    const clean = inputText.trim();
    if (!clean || !churchId || !chatId || !canonicalId || sending || isPeerBlocked || isAnnouncementLocked) {
      return;
    }

    const replySnapshot = replyingTo;
    setInputText('');
    setReplyingTo(null);
    isTypingRef.current = false;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    ChatService.setTypingStatus(churchId, chatId, canonicalId, myName, false);

    try {
      setSending(true);
      await ChatService.sendTextMessage(churchId, chatId, myParticipantSummary, clean, {
        replyTo: replySnapshot,
        participantIds: thread?.participantIds,
      });
    } catch (err: any) {
      setInputText(clean);
      setReplyingTo(replySnapshot);
      Alert.alert('Message Not Sent', err?.message || 'Please check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  // ── Media & Document Attachments ──
  const handlePickImageOrVideo = async (mediaType: 'images' | 'videos', fromCamera = false) => {
    setAttachModalVisible(false);
    if (!churchId || !chatId || isPeerBlocked || isAnnouncementLocked) return;

    // Allow inline sheet to unmount smoothly before launching native Android Activity
    await new Promise((r) => setTimeout(r, 120));

    try {
      if (fromCamera) {
        const camPerm = await ImagePicker.requestCameraPermissionsAsync();
        if (!camPerm.granted) {
          Alert.alert('Permission Needed', 'Please allow camera access.');
          return;
        }
      } else {
        const libPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!libPerm.granted) {
          Alert.alert('Permission Needed', 'Please allow media library access.');
          return;
        }
      }

      const res = fromCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 0.82,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: [mediaType],
            allowsEditing: false,
            quality: mediaType === 'videos' ? 0.7 : 0.82,
            videoMaxDuration: 90,
          });

      if (res.canceled || !res.assets?.[0]?.uri) return;
      const asset = res.assets[0];
      const msgType = mediaType === 'videos' ? 'video' : 'image';
      const fallbackExt = msgType === 'video' ? 'mp4' : 'jpg';
      const derivedName =
        asset.fileName ||
        asset.uri.split('/').pop()?.split('?')[0] ||
        `${msgType}_${Date.now()}.${fallbackExt}`;

      setUploadProgress(0);
      setUploadingMedia(true);
      await ChatService.sendMediaMessage(churchId, chatId, myParticipantSummary, {
        type: msgType,
        localUri: asset.uri,
        fileName: derivedName,
        mimeType:
          asset.mimeType ||
          (msgType === 'video'
            ? derivedName.toLowerCase().endsWith('.mov')
              ? 'video/quicktime'
              : 'video/mp4'
            : 'image/jpeg'),
        sizeBytes: asset.fileSize,
        durationMs: asset.duration
          ? asset.duration < 1000
            ? asset.duration * 1000
            : asset.duration
          : undefined,
        replyTo: replyingTo,
        participantIds: thread?.participantIds,
        onProgress: (pct) => setUploadProgress(pct),
      });
      setReplyingTo(null);
    } catch (err: any) {
      Alert.alert('Upload Failed', err?.message || 'Could not send media.');
    } finally {
      setUploadingMedia(false);
      setUploadProgress(0);
    }
  };

  const handlePickDocument = async () => {
    setAttachModalVisible(false);
    if (!churchId || !chatId || isPeerBlocked || isAnnouncementLocked) return;

    await new Promise((r) => setTimeout(r, 120));

    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (res.canceled || !res.assets?.[0]?.uri) return;
      const doc = res.assets[0];

      setUploadProgress(0);
      setUploadingMedia(true);
      await ChatService.sendMediaMessage(churchId, chatId, myParticipantSummary, {
        type: 'document',
        localUri: doc.uri,
        fileName: doc.name || `document_${Date.now()}`,
        mimeType: doc.mimeType || 'application/octet-stream',
        sizeBytes: doc.size,
        replyTo: replyingTo,
        participantIds: thread?.participantIds,
        onProgress: (pct) => setUploadProgress(pct),
      });
      setReplyingTo(null);
    } catch (err: any) {
      Alert.alert('Document Upload Failed', err?.message || 'Could not send document.');
    } finally {
      setUploadingMedia(false);
      setUploadProgress(0);
    }
  };

  // ── Voice Recording & Playback ──
  const startVoiceRecording = async () => {
    if (!churchId || !chatId || recording || isPeerBlocked || isAnnouncementLocked) return;
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Microphone Needed', 'Please allow microphone access to send voice notes.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch {
      Alert.alert('Voice Note Error', 'Could not start audio recording.');
    }
  };

  const stopVoiceRecording = async (shouldSend: boolean) => {
    if (!recording) return;
    const activeRec = recording;
    const durationMs = recordingSeconds * 1000;
    setRecording(null);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    try {
      await activeRec.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = activeRec.getURI();
      if (shouldSend && uri && churchId && chatId) {
        setUploadingMedia(true);
        await ChatService.sendMediaMessage(churchId, chatId, myParticipantSummary, {
          type: 'audio',
          localUri: uri,
          fileName: `voice_${Date.now()}.m4a`,
          mimeType: 'audio/m4a',
          durationMs,
          replyTo: replyingTo,
          participantIds: thread?.participantIds,
        });
        setReplyingTo(null);
      }
    } catch {
      if (shouldSend) Alert.alert('Send Failed', 'Could not upload voice note.');
    } finally {
      setUploadingMedia(false);
    }
  };

  const togglePlayAudio = async (msg: ChatMessage) => {
    const url = msg.media?.url;
    if (!url) return;

    try {
      if (playingMsgId === msg.id && soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setPlayingMsgId(null);
        return;
      }

      if (soundRef.current) {
        await soundRef.current.stopAsync().catch(() => {});
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlayingMsgId(null);
            sound.unloadAsync().catch(() => {});
            if (soundRef.current === sound) soundRef.current = null;
          }
        }
      );
      soundRef.current = sound;
      setPlayingMsgId(msg.id);
    } catch {
      setPlayingMsgId(null);
      Alert.alert('Playback Error', 'Could not play this voice message.');
    }
  };

  // ── Forward Flow ──
  const openForwardPicker = (msg: ChatMessage) => {
    setForwardMsg(msg);
    setForwardTargets({});
    if (!churchId || myIds.length === 0) return;
    const unsub = ChatService.subscribeToMyChats(churchId, myIds, (list) => {
      setMyChatsList(list.filter((c) => c.id !== chatId));
      unsub();
    });
  };

  const handleConfirmForward = async () => {
    const targets = Object.values(forwardTargets);
    if (!forwardMsg || targets.length === 0 || forwarding) return;
    try {
      setForwarding(true);
      await ChatService.forwardMessages(churchId, myParticipantSummary, targets, forwardMsg);
      setForwardMsg(null);
      Alert.alert('Forwarded', `Message forwarded to ${targets.length} chat(s).`);
    } catch {
      Alert.alert('Forward Failed', 'Could not forward message.');
    } finally {
      setForwarding(false);
    }
  };

  const handleCopySelected = async () => {
    if (!selectedMsg) return;
    const copyVal = selectedMsg.text || selectedMsg.media?.url || '';
    await Clipboard.setStringAsync(copyVal);
    setSelectedMsg(null);
  };

  const handleDeleteSelected = async (mode: 'me' | 'everyone') => {
    if (!selectedMsg || !churchId || !chatId || !canonicalId) return;
    const msgId = selectedMsg.id;
    setSelectedMsg(null);
    try {
      await ChatService.deleteMessage(churchId, chatId, msgId, canonicalId, mode);
    } catch (err: any) {
      Alert.alert('Delete Failed', err?.message || 'Could not delete message.');
    }
  };

  const handleSubmitReport = async () => {
    if (!reportTarget || !churchId || !canonicalId) return;
    const reason = reportReason.trim() || 'Inappropriate behavior or content';
    try {
      await ChatService.reportChatOrUser(churchId, {
        reporterId: canonicalId,
        reporterName: myName,
        chatId,
        targetMemberId: reportTarget.targetMemberId,
        targetName: reportTarget.targetName,
        messageId: reportTarget.messageId,
        messagePreview: reportTarget.messagePreview,
        reason,
      });
      setReportTarget(null);
      setReportReason('');
      Alert.alert('Report Submitted', 'Church administrators have been notified for review.');
    } catch {
      Alert.alert('Error', 'Could not submit report.');
    }
  };

  const visibleMessages = useMemo(
    () =>
      messages.filter(
        (m) => !(m.deletedFor || []).some((id) => myIds.includes(id))
      ),
    [messages, myIds]
  );

  const headerSubtitle = useMemo(() => {
    if (typingUsers.length > 0) {
      return isGroupChat ? `${typingUsers[0]} is typing...` : 'typing...';
    }
    if (isGroupChat) {
      const count = thread?.participantIds?.length || 0;
      return count > 0 ? `${count} participants • Tap for group info` : 'Tap for group info';
    }
    if (isPeerBlocked) return 'Blocked';
    if (peerPresence.online) return 'online';
    return formatLastSeen(peerPresence.lastSeen);
  }, [typingUsers, isGroupChat, thread?.participantIds, peerPresence, isPeerBlocked]);

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    if (item.type === 'system') {
      return (
        <View style={styles.systemEventRow}>
          <View style={[styles.systemEventPill, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.systemEventTxt, { color: secondaryText }]}>{item.text}</Text>
          </View>
        </View>
      );
    }

    const isMine = myIds.includes(item.senderId);
    const isDeleted = Boolean(item.deletedForEveryone);
    const readByOthers = (item.readBy || []).some((id) => !myIds.includes(id));
    const deliveredToOthers = (item.deliveredTo || []).some((id) => !myIds.includes(id));
    const reactionEntries = Object.entries(item.reactions || {});

    const groupedReactions = reactionEntries.reduce<Record<string, number>>((acc, [, emoji]) => {
      if (emoji) acc[emoji] = (acc[emoji] || 0) + 1;
      return acc;
    }, {});

    return (
      <View style={[styles.msgRow, isMine ? styles.msgRowRight : styles.msgRowLeft]}>
        <View style={{ maxWidth: '82%' }}>
          <TouchableOpacity
            activeOpacity={0.85}
            onLongPress={() => {
              if (!isDeleted) setSelectedMsg(item);
            }}
            style={[
              styles.bubble,
              {
                backgroundColor: isMine ? ownBubbleBg : otherBubbleBg,
                borderColor: isMine ? 'transparent' : borderColor,
                borderWidth: isMine ? 0 : 1,
              },
              isMine ? styles.bubbleRight : styles.bubbleLeft,
            ]}
          >
            {isGroupChat && !isMine && !isDeleted && (
              <Text style={[styles.senderLabel, { color: accentColor }]} numberOfLines={1}>
                {item.senderName}
              </Text>
            )}

            {item.forwardedFrom?.isForwarded && !isDeleted && (
              <Text style={[styles.forwardedTag, { color: secondaryText }]}>↪ Forwarded</Text>
            )}

            {item.replyTo && !isDeleted && (
              <View
                style={[
                  styles.replyBox,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
                    borderLeftColor: accentColor,
                  },
                ]}
              >
                <Text style={[styles.replySender, { color: accentColor }]} numberOfLines={1}>
                  {myIds.includes(item.replyTo.senderId) ? 'You' : item.replyTo.senderName}
                </Text>
                <Text style={[styles.replyPreview, { color: secondaryText }]} numberOfLines={2}>
                  {item.replyTo.textPreview}
                </Text>
              </View>
            )}

            {/* Media Payload Renderers */}
            {!isDeleted && item.type === 'image' && item.media?.url && (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setPreviewImageUrl(item.media!.url)}
                style={{ marginBottom: item.text ? 6 : 2 }}
              >
                <Image source={{ uri: item.media.url }} style={styles.msgImage} resizeMode="cover" />
              </TouchableOpacity>
            )}

            {!isDeleted && item.type === 'video' && item.media?.url && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setPreviewVideoUrl(item.media!.url)}
                style={[styles.videoCard, { backgroundColor: '#0f172a' }]}
              >
                <Play size={26} color="#FFFFFF" />
                <Text style={styles.videoCardTxt}>Tap to play video</Text>
              </TouchableOpacity>
            )}

            {!isDeleted && item.type === 'audio' && item.media?.url && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => togglePlayAudio(item)}
                style={[styles.audioRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)' }]}
              >
                <View style={[styles.audioPlayBtn, { backgroundColor: accentColor }]}>
                  {playingMsgId === item.id ? (
                    <Pause size={15} color="#FFFFFF" />
                  ) : (
                    <Play size={15} color="#FFFFFF" />
                  )}
                </View>
                <Text style={[styles.audioDurationTxt, { color: primaryText }]}>
                  Voice message • {formatDuration(item.media.durationMs)}
                </Text>
              </TouchableOpacity>
            )}

            {!isDeleted && item.type === 'document' && item.media?.url && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => Linking.openURL(item.media!.url).catch(() => {})}
                style={[styles.docCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)' }]}
              >
                <FileText size={20} color={accentColor} />
                <Text style={[styles.docFileName, { color: primaryText }]} numberOfLines={2}>
                  {item.media.fileName || 'Document'}
                </Text>
              </TouchableOpacity>
            )}

            {(Boolean(item.text) || isDeleted) && (
              <Text
                style={[
                  styles.msgText,
                  {
                    color: isDeleted ? secondaryText : primaryText,
                    fontStyle: isDeleted ? 'italic' : 'normal',
                  },
                ]}
              >
                {item.text}
              </Text>
            )}

            <View style={styles.msgMetaRow}>
              <Text style={[styles.msgTimeTxt, { color: secondaryText }]}>
                {formatMsgTime(item.createdAt) || 'Sending'}
              </Text>
              {isMine && !isDeleted && (
                readByOthers ? (
                  <CheckCheck size={14} color="#2563EB" />
                ) : deliveredToOthers ? (
                  <CheckCheck size={14} color={secondaryText} />
                ) : (
                  <Check size={14} color={secondaryText} />
                )
              )}
            </View>
          </TouchableOpacity>

          {/* Emoji Reaction Chips */}
          {!isDeleted && Object.keys(groupedReactions).length > 0 && (
            <View
              style={[
                styles.reactionsRow,
                { justifyContent: isMine ? 'flex-end' : 'flex-start' },
              ]}
            >
              {Object.entries(groupedReactions).map(([emoji, count]) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() =>
                    canonicalId &&
                    ChatService.toggleMessageReaction(churchId, chatId, item.id, canonicalId, emoji)
                  }
                  style={[styles.reactionChip, { backgroundColor: cardBg, borderColor }]}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                  {count > 1 && (
                    <Text style={[styles.reactionCount, { color: secondaryText }]}>{count}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeBg }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />

      {/* ── Top Navy Header ── */}
      <LinearGradient
        colors={['#2b52a1', '#1a3673']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 48 : 14) + 6 },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2.4} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            if (isGroupChat) {
              navigation.navigate('GroupInfo', { chatId, churchId });
            } else {
              setDmOptionsVisible(true);
            }
          }}
          style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}
        >
          {resolvedPhoto ? (
            <Image source={{ uri: resolvedPhoto }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarFallback}>
              {isGroupChat ? (
                <Users size={18} color="#FFFFFF" />
              ) : (
                <User size={18} color="#FFFFFF" />
              )}
            </View>
          )}

          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {resolvedTitle}
            </Text>
            <Text
              style={[
                styles.headerSub,
                {
                  color:
                    peerPresence.online || typingUsers.length > 0 ? '#86EFAC' : '#BFDBFE',
                },
              ]}
              numberOfLines={1}
            >
              {headerSubtitle}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (isGroupChat) {
              navigation.navigate('GroupInfo', { chatId, churchId });
            } else {
              setDmOptionsVisible(true);
            }
          }}
        >
          {isGroupChat ? (
            <Info size={19} color="#FFFFFF" />
          ) : (
            <MoreVertical size={19} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </LinearGradient>

      {/* ── Timeline & Composer ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={accentColor} />
          </View>
        ) : visibleMessages.length === 0 ? (
          <View style={styles.emptyTimeline}>
            <View style={[styles.emptyPill, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.emptyPillTxt, { color: secondaryText }]}>
                Say hello to {resolvedTitle}! Messages stay private within your church.
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={visibleMessages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            inverted
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Uploading Indicator */}
        {uploadingMedia && (
          <View style={[styles.uploadingBar, { backgroundColor: cardBg, borderTopColor: borderColor }]}>
            <ActivityIndicator size="small" color={accentColor} />
            <Text style={{ color: secondaryText, fontSize: 12.5, fontWeight: '600' }}>
              {uploadProgress > 0
                ? `Uploading attachment... ${uploadProgress}%`
                : 'Preparing attachment...'}
            </Text>
          </View>
        )}

        {/* Reply Banner */}
        {replyingTo && (
          <View
            style={[
              styles.replyBanner,
              { backgroundColor: cardBg, borderTopColor: borderColor },
            ]}
          >
            <View style={[styles.replyBannerBar, { backgroundColor: accentColor }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.replySender, { color: accentColor }]} numberOfLines={1}>
                Replying to {myIds.includes(replyingTo.senderId) ? 'yourself' : replyingTo.senderName}
              </Text>
              <Text style={[styles.replyPreview, { color: secondaryText }]} numberOfLines={1}>
                {replyingTo.textPreview}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <X size={18} color={secondaryText} />
            </TouchableOpacity>
          </View>
        )}

        {/* Composer / Locked Banners */}
        {isPeerBlocked ? (
          <View
            style={[
              styles.lockedBanner,
              { backgroundColor: cardBg, borderTopColor: borderColor, paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            <Text style={{ color: secondaryText, fontSize: 13 }}>
              You blocked {resolvedTitle}.
            </Text>
            <TouchableOpacity
              onPress={() =>
                ChatService.toggleBlockMember(churchId, canonicalId, resolvedPeerId, false)
              }
            >
              <Text style={{ color: accentColor, fontWeight: '800', fontSize: 13.5 }}>
                Unblock
              </Text>
            </TouchableOpacity>
          </View>
        ) : isAnnouncementLocked ? (
          <View
            style={[
              styles.lockedBanner,
              { backgroundColor: cardBg, borderTopColor: borderColor, paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            <Text style={{ color: secondaryText, fontSize: 13 }}>
              Only group admins can send messages in this group.
            </Text>
          </View>
        ) : recording ? (
          <View
            style={[
              styles.composerRow,
              {
                backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                borderTopColor: borderColor,
                paddingBottom: Math.max(insets.bottom, 10),
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => stopVoiceRecording(false)}
              style={[styles.iconComposerBtn, { backgroundColor: '#fee2e2' }]}
            >
              <Trash2 size={18} color="#dc2626" />
            </TouchableOpacity>
            <View style={[styles.recordingPill, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.recordingDot} />
              <Text style={{ color: primaryText, fontWeight: '700', fontSize: 14 }}>
                Recording voice note • {formatDuration(recordingSeconds * 1000)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => stopVoiceRecording(true)}
              style={styles.sendBtn}
            >
              <LinearGradient
                colors={['#2b52a1', '#1a3673']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendBtnGradient}
              >
                <Send size={18} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={[
              styles.composerRow,
              {
                backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                borderTopColor: borderColor,
                paddingBottom: Math.max(insets.bottom, 10),
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => setAttachModalVisible(true)}
              style={[styles.iconComposerBtn, { backgroundColor: cardBg, borderColor, borderWidth: 1 }]}
            >
              <Paperclip size={19} color={secondaryText} />
            </TouchableOpacity>

            <TextInput
              style={[
                styles.composerInput,
                { backgroundColor: cardBg, borderColor, color: primaryText },
              ]}
              placeholder="Type a message..."
              placeholderTextColor={secondaryText}
              value={inputText}
              onChangeText={handleTextChange}
              multiline
              maxLength={4000}
            />

            {inputText.trim() ? (
              <TouchableOpacity
                onPress={handleSend}
                disabled={sending}
                activeOpacity={0.85}
                style={[styles.sendBtn, { opacity: sending ? 0.5 : 1 }]}
              >
                <LinearGradient
                  colors={['#2b52a1', '#1a3673']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sendBtnGradient}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Send size={18} color="#FFFFFF" style={{ marginLeft: 1 }} />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={startVoiceRecording}
                disabled={uploadingMedia}
                activeOpacity={0.85}
                style={styles.sendBtn}
              >
                <LinearGradient
                  colors={['#2b52a1', '#1a3673']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sendBtnGradient}
                >
                  <Mic size={19} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ── Attachment Picker Sheet (Inline overlay avoids Android Modal vs Intent conflicts) ── */}
      {attachModalVisible && (
        <TouchableOpacity
          style={[StyleSheet.absoluteFillObject, styles.inlineSheetBackdrop]}
          activeOpacity={1}
          onPress={() => setAttachModalVisible(false)}
        >
          <View style={[styles.actionSheet, { backgroundColor: cardBg, borderColor }]}>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => handlePickImageOrVideo('images', false)}
            >
              <ImageIcon size={19} color="#2563eb" />
              <Text style={[styles.actionTxt, { color: primaryText }]}>Photo from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => handlePickImageOrVideo('images', true)}
            >
              <Camera size={19} color="#16a34a" />
              <Text style={[styles.actionTxt, { color: primaryText }]}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => handlePickImageOrVideo('videos', false)}
            >
              <Film size={19} color="#7c3aed" />
              <Text style={[styles.actionTxt, { color: primaryText }]}>Video</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionRow} onPress={handlePickDocument}>
              <FileText size={19} color="#d97706" />
              <Text style={[styles.actionTxt, { color: primaryText }]}>Document / File</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* ── Long-press Message Action & Emoji Reaction Modal ── */}
      <Modal
        visible={Boolean(selectedMsg)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMsg(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setSelectedMsg(null)}
        >
          <View style={[styles.actionSheet, { backgroundColor: cardBg, borderColor }]}>
            {/* Emoji Quick Reactions */}
            <View style={[styles.emojiPickerRow, { borderBottomColor: borderColor }]}>
              {REACTION_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={async () => {
                    const target = selectedMsg;
                    setSelectedMsg(null);
                    if (target && canonicalId) {
                      await ChatService.toggleMessageReaction(
                        churchId,
                        chatId,
                        target.id,
                        canonicalId,
                        emoji
                      );
                    }
                  }}
                  style={styles.emojiBtn}
                >
                  <Text style={{ fontSize: 22 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                if (selectedMsg) {
                  setReplyingTo({
                    messageId: selectedMsg.id,
                    senderId: selectedMsg.senderId,
                    senderName: selectedMsg.senderName,
                    textPreview:
                      selectedMsg.text ||
                      (selectedMsg.type === 'image'
                        ? '📷 Photo'
                        : selectedMsg.type === 'video'
                        ? '🎥 Video'
                        : selectedMsg.type === 'audio'
                        ? '🎤 Voice message'
                        : selectedMsg.media?.fileName || 'Document'),
                    type: selectedMsg.type,
                  });
                }
                setSelectedMsg(null);
              }}
            >
              <CornerUpLeft size={18} color={accentColor} />
              <Text style={[styles.actionTxt, { color: primaryText }]}>Reply</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                const target = selectedMsg;
                setSelectedMsg(null);
                if (target) openForwardPicker(target);
              }}
            >
              <Forward size={18} color={accentColor} />
              <Text style={[styles.actionTxt, { color: primaryText }]}>Forward</Text>
            </TouchableOpacity>

            {Boolean(selectedMsg?.text || selectedMsg?.media?.url) && (
              <TouchableOpacity style={styles.actionRow} onPress={handleCopySelected}>
                <Copy size={18} color={accentColor} />
                <Text style={[styles.actionTxt, { color: primaryText }]}>Copy</Text>
              </TouchableOpacity>
            )}

            {selectedMsg && !myIds.includes(selectedMsg.senderId) && (
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => {
                  const target = selectedMsg;
                  setSelectedMsg(null);
                  setReportTarget({
                    messageId: target.id,
                    messagePreview: target.text || target.type,
                    targetMemberId: target.senderId,
                    targetName: target.senderName,
                  });
                }}
              >
                <Flag size={18} color="#d97706" />
                <Text style={[styles.actionTxt, { color: '#d97706' }]}>Report Message</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => handleDeleteSelected('me')}
            >
              <Trash2 size={18} color="#ef4444" />
              <Text style={[styles.actionTxt, { color: '#ef4444' }]}>Delete for me</Text>
            </TouchableOpacity>

            {selectedMsg && myIds.includes(selectedMsg.senderId) && (
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => handleDeleteSelected('everyone')}
              >
                <Trash2 size={18} color="#dc2626" />
                <Text style={[styles.actionTxt, { color: '#dc2626', fontWeight: '700' }]}>
                  Delete for everyone
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Forward Target Picker Modal ── */}
      <Modal
        visible={Boolean(forwardMsg)}
        transparent
        animationType="slide"
        onRequestClose={() => setForwardMsg(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.actionSheet, { backgroundColor: cardBg, borderColor, maxWidth: 380, maxHeight: '75%', padding: 16 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: primaryText, fontSize: 16.5, fontWeight: '800' }}>
                Forward to...
              </Text>
              <TouchableOpacity onPress={() => setForwardMsg(null)}>
                <X size={20} color={secondaryText} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={myChatsList}
              keyExtractor={(c) => c.id}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => {
                const selected = Boolean(forwardTargets[item.id]);
                const peerId = (item.participantIds || []).find((id) => !myIds.includes(id));
                const label =
                  item.type === 'group'
                    ? item.name || 'Church Group'
                    : (peerId && item.participants?.[peerId]?.name) || 'Church Member';

                return (
                  <TouchableOpacity
                    onPress={() =>
                      setForwardTargets((prev) => {
                        const next = { ...prev };
                        if (next[item.id]) delete next[item.id];
                        else next[item.id] = item;
                        return next;
                      })
                    }
                    style={[styles.actionRow, { paddingHorizontal: 6, justifyContent: 'space-between' }]}
                  >
                    <Text style={{ color: primaryText, fontWeight: '600', fontSize: 14.5, flex: 1 }}>
                      {label}
                    </Text>
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 1.5,
                        borderColor: selected ? accentColor : borderColor,
                        backgroundColor: selected ? accentColor : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {selected && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={{ color: secondaryText, textAlign: 'center', paddingVertical: 20 }}>
                  No other conversations found in this church.
                </Text>
              }
            />

            <TouchableOpacity
              onPress={handleConfirmForward}
              disabled={Object.keys(forwardTargets).length === 0 || forwarding}
              style={{
                marginTop: 12,
                backgroundColor: accentColor,
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: 'center',
                opacity: Object.keys(forwardTargets).length === 0 ? 0.5 : 1,
              }}
            >
              {forwarding ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>
                  Forward ({Object.keys(forwardTargets).length})
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── DM Options Modal (Mute, Archive, Block, Report) ── */}
      <Modal
        visible={dmOptionsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDmOptionsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setDmOptionsVisible(false)}
        >
          <View style={[styles.actionSheet, { backgroundColor: cardBg, borderColor }]}>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={async () => {
                setDmOptionsVisible(false);
                await ChatService.toggleMuteChat(churchId, chatId, myIds, !isMuted);
              }}
            >
              {isMuted ? <Bell size={18} color={accentColor} /> : <BellOff size={18} color={accentColor} />}
              <Text style={[styles.actionTxt, { color: primaryText }]}>
                {isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={async () => {
                setDmOptionsVisible(false);
                await ChatService.toggleArchiveChat(churchId, chatId, myIds, !isArchived);
              }}
            >
              <Archive size={18} color={accentColor} />
              <Text style={[styles.actionTxt, { color: primaryText }]}>
                {isArchived ? 'Unarchive Chat' : 'Archive Chat'}
              </Text>
            </TouchableOpacity>

            {Boolean(resolvedPeerId) && (
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => {
                  setDmOptionsVisible(false);
                  ChatService.toggleBlockMember(churchId, canonicalId, resolvedPeerId, !isPeerBlocked);
                }}
              >
                <Ban size={18} color="#dc2626" />
                <Text style={[styles.actionTxt, { color: '#dc2626' }]}>
                  {isPeerBlocked ? `Unblock ${resolvedTitle}` : `Block ${resolvedTitle}`}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                setDmOptionsVisible(false);
                setReportTarget({
                  targetMemberId: resolvedPeerId,
                  targetName: resolvedTitle,
                });
              }}
            >
              <Flag size={18} color="#d97706" />
              <Text style={[styles.actionTxt, { color: '#d97706' }]}>Report User</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Report Reason Modal ── */}
      <Modal
        visible={Boolean(reportTarget)}
        transparent
        animationType="fade"
        onRequestClose={() => setReportTarget(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.actionSheet, { backgroundColor: cardBg, borderColor, padding: 18 }]}>
            <Text style={{ color: primaryText, fontSize: 16.5, fontWeight: '800', marginBottom: 8 }}>
              Report {reportTarget?.targetName || 'Content'}
            </Text>
            <Text style={{ color: secondaryText, fontSize: 12.5, marginBottom: 12 }}>
              This report is reviewed by your church administrators.
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor,
                borderRadius: 12,
                padding: 12,
                minHeight: 80,
                color: primaryText,
                textAlignVertical: 'top',
                marginBottom: 14,
              }}
              placeholder="Describe the concern..."
              placeholderTextColor={secondaryText}
              value={reportReason}
              onChangeText={setReportReason}
              multiline
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => {
                  setReportTarget(null);
                  setReportReason('');
                }}
                style={{
                  flex: 1,
                  paddingVertical: 11,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: secondaryText, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmitReport}
                style={{
                  flex: 1,
                  paddingVertical: 11,
                  borderRadius: 10,
                  backgroundColor: '#dc2626',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Submit Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Fullscreen Image Viewer ── */}
      <Modal
        visible={Boolean(previewImageUrl)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImageUrl(null)}
      >
        <View style={styles.fullscreenMediaBackdrop}>
          <TouchableOpacity
            style={styles.fullscreenCloseBtn}
            onPress={() => setPreviewImageUrl(null)}
          >
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          {previewImageUrl && (
            <Image
              source={{ uri: previewImageUrl }}
              style={{ width: '100%', height: '80%' }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* ── Fullscreen Video Viewer ── */}
      <Modal
        visible={Boolean(previewVideoUrl)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewVideoUrl(null)}
      >
        <View style={styles.fullscreenMediaBackdrop}>
          <TouchableOpacity
            style={styles.fullscreenCloseBtn}
            onPress={() => setPreviewVideoUrl(null)}
          >
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          {previewVideoUrl && (
            <Video
              source={{ uri: previewVideoUrl }}
              style={{ width: '100%', height: 320 }}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    backgroundColor: '#1a2d5a',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  headerAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16.5,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 1,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTimeline: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  emptyPill: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  emptyPillTxt: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  messagesContent: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  systemEventRow: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemEventPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  systemEventTxt: {
    fontSize: 11.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  msgRow: {
    marginBottom: 8,
    flexDirection: 'row',
  },
  msgRowRight: { justifyContent: 'flex-end' },
  msgRowLeft: { justifyContent: 'flex-start' },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  bubbleRight: { borderBottomRightRadius: 4 },
  bubbleLeft: { borderBottomLeftRadius: 4 },
  senderLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 3,
  },
  forwardedTag: {
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  replyBox: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderLeftWidth: 3,
    marginBottom: 5,
  },
  replySender: { fontSize: 11.5, fontWeight: '700' },
  replyPreview: { fontSize: 12, marginTop: 1 },
  msgImage: {
    width: 220,
    height: 170,
    borderRadius: 10,
    backgroundColor: 'rgba(148,163,184,0.2)',
  },
  videoCard: {
    width: 210,
    height: 110,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 4,
  },
  videoCardTxt: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 190,
  },
  audioPlayBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioDurationTxt: {
    fontSize: 13,
    fontWeight: '600',
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 4,
  },
  docFileName: {
    fontSize: 13.5,
    fontWeight: '600',
    maxWidth: 190,
  },
  msgText: { fontSize: 15, lineHeight: 20.5 },
  msgMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  msgTimeTxt: { fontSize: 10.5 },
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 3,
  },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 11,
    borderWidth: 1,
  },
  reactionEmoji: { fontSize: 12 },
  reactionCount: { fontSize: 11, fontWeight: '700' },
  uploadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 10,
  },
  replyBannerBar: { width: 3, height: 30, borderRadius: 2 },
  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  iconComposerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    borderRadius: 21,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
  },
  recordingPill: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendBtnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  inlineSheetBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 50,
    elevation: 20,
  },
  actionSheet: {
    width: '100%',
    maxWidth: 330,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 8,
    elevation: 10,
  },
  emojiPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  emojiBtn: {
    padding: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  actionTxt: { fontSize: 15, fontWeight: '600' },
  fullscreenMediaBackdrop: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCloseBtn: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
