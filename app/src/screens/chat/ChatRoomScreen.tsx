import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
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
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Copy,
  CornerUpLeft,
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
import { ChatMessage, ChatPresence, ChatReplyPreview, ChatThread } from '../../types/chat';

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

  const [thread, setThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatReplyPreview | null>(null);
  const [selectedMsg, setSelectedMsg] = useState<ChatMessage | null>(null);
  const [peerPresence, setPeerPresence] = useState<ChatPresence>({ online: false, lastSeen: null });
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

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

  useEffect(() => {
    if (!churchId || !chatId) {
      setLoading(false);
      return;
    }

    const unsubThread = ChatService.subscribeToChatThread(churchId, chatId, (data) => {
      setThread(data);
    });

    const unsubMsgs = ChatService.subscribeToMessages(churchId, chatId, 60, (list) => {
      setMessages(list);
      setLoading(false);
    });

    const unsubTyping = ChatService.subscribeToTypingUsers(churchId, chatId, myIds, setTypingUsers);

    return () => {
      unsubThread();
      unsubMsgs();
      unsubTyping();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (canonicalId) {
        ChatService.setTypingStatus(churchId, chatId, canonicalId, myName, false);
      }
    };
  }, [churchId, chatId, myIds.join('|'), canonicalId, myName]);

  // Peer online/last-seen subscription for 1-to-1 chats
  useEffect(() => {
    if (!churchId || isGroupChat || !resolvedPeerId) return;
    const unsub = ChatService.subscribeToMemberPresence(churchId, resolvedPeerId, setPeerPresence);
    return () => unsub();
  }, [churchId, isGroupChat, resolvedPeerId]);

  // Mark messages read whenever messages arrive on screen
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
    if (!churchId || !chatId || !canonicalId) return;

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
    if (!clean || !churchId || !chatId || !canonicalId || sending) return;

    const replySnapshot = replyingTo;
    setInputText('');
    setReplyingTo(null);
    isTypingRef.current = false;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    ChatService.setTypingStatus(churchId, chatId, canonicalId, myName, false);

    try {
      setSending(true);
      await ChatService.sendTextMessage(
        churchId,
        chatId,
        {
          memberId: canonicalId,
          uid: user?.uid || canonicalId,
          name: myName,
          photoUrl: myPhoto,
          phone: member?.phone || user?.phoneNumber || null,
          userType: member?.userType || 'Member',
        },
        clean,
        {
          replyTo: replySnapshot,
          participantIds: thread?.participantIds,
        }
      );
    } catch (err: any) {
      setInputText(clean);
      setReplyingTo(replySnapshot);
      Alert.alert('Message Not Sent', err?.message || 'Please check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  const handleCopySelected = async () => {
    if (!selectedMsg) return;
    await Clipboard.setStringAsync(selectedMsg.text || '');
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
      return count > 0 ? `${count} participants` : 'Church Group';
    }
    if (peerPresence.online) return 'online';
    return formatLastSeen(peerPresence.lastSeen);
  }, [typingUsers, isGroupChat, thread?.participantIds, peerPresence]);

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isMine = myIds.includes(item.senderId);
    const isDeleted = Boolean(item.deletedForEveryone);
    const readByOthers = (item.readBy || []).some((id) => !myIds.includes(id));
    const deliveredToOthers = (item.deliveredTo || []).some((id) => !myIds.includes(id));

    return (
      <View
        style={[
          styles.msgRow,
          isMine ? styles.msgRowRight : styles.msgRowLeft,
        ]}
      >
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
              { color: peerPresence.online || typingUsers.length > 0 ? '#86EFAC' : '#BFDBFE' },
            ]}
            numberOfLines={1}
          >
            {headerSubtitle}
          </Text>
        </View>
      </LinearGradient>

      {/* ── Chat Timeline & Composer ── */}
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

        {/* Message Composer */}
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

          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.85}
            style={[
              styles.sendBtn,
              { opacity: inputText.trim() && !sending ? 1 : 0.45 },
            ]}
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
        </View>
      </KeyboardAvoidingView>

      {/* ── Long-press Message Action Modal ── */}
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
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                if (selectedMsg) {
                  setReplyingTo({
                    messageId: selectedMsg.id,
                    senderId: selectedMsg.senderId,
                    senderName: selectedMsg.senderName,
                    textPreview: selectedMsg.text,
                    type: selectedMsg.type,
                  });
                }
                setSelectedMsg(null);
              }}
            >
              <CornerUpLeft size={18} color={accentColor} />
              <Text style={[styles.actionTxt, { color: primaryText }]}>Reply</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionRow} onPress={handleCopySelected}>
              <Copy size={18} color={accentColor} />
              <Text style={[styles.actionTxt, { color: primaryText }]}>Copy Message</Text>
            </TouchableOpacity>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  msgRow: {
    marginBottom: 8,
    flexDirection: 'row',
  },
  msgRowRight: {
    justifyContent: 'flex-end',
  },
  msgRowLeft: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  bubbleRight: {
    borderBottomRightRadius: 4,
  },
  bubbleLeft: {
    borderBottomLeftRadius: 4,
  },
  senderLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 3,
  },
  replyBox: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderLeftWidth: 3,
    marginBottom: 5,
  },
  replySender: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  replyPreview: {
    fontSize: 12,
    marginTop: 1,
  },
  msgText: {
    fontSize: 15,
    lineHeight: 20.5,
  },
  msgMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  msgTimeTxt: {
    fontSize: 10.5,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 10,
  },
  replyBannerBar: {
    width: 3,
    height: 30,
    borderRadius: 2,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  composerInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
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
  actionSheet: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 8,
    elevation: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  actionTxt: {
    fontSize: 15,
    fontWeight: '600',
  },
});

