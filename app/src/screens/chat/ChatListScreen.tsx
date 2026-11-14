import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Archive,
  ArrowLeft,
  Bell,
  BellOff,
  Info,
  MessageCircle,
  Search,
  UserPlus,
  Users,
  VolumeX,
  X,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import { useTheme } from '../../context/ThemeContext';
import ChatService, { canCreateChurchGroup } from '../../services/ChatService';
import { ChatMemberProfile, ChatThread } from '../../types/chat';

const formatChatTimestamp = (ts: any): string => {
  if (!ts) return '';
  try {
    const date =
      typeof ts.toDate === 'function'
        ? ts.toDate()
        : typeof ts.seconds === 'number'
        ? new Date(ts.seconds * 1000)
        : new Date(ts);
    if (Number.isNaN(date.getTime())) return '';

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
    if (isToday) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();
    if (isYesterday) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return '';
  }
};

export default function ChatListScreen({ navigation }: any) {
  const { isDark } = useTheme();
  const { user, member, isPlatformSuperAdmin } = useAuth();
  const { activeChurch } = useChurch();
  const insets = useSafeAreaInsets();
  const searchInputRef = useRef<TextInput | null>(null);

  const churchId = activeChurch?.id || member?.churchId || member?.primaryChurchId || '';
  const myIds = useMemo(
    () => ChatService.getMyIdentityIds(user, member),
    [user?.uid, member?.id, (member as any)?.uid]
  );
  const canonicalId = ChatService.getCanonicalId(user, member);
  const canCreateGroup = canCreateChurchGroup(member, isPlatformSuperAdmin);

  const [chats, setChats] = useState<ChatThread[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [memberResults, setMemberResults] = useState<ChatMemberProfile[]>([]);
  const [searchingMembers, setSearchingMembers] = useState(false);
  const [showDirectoryMode, setShowDirectoryMode] = useState(false);
  const [openingMemberId, setOpeningMemberId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'groups' | 'archived'>('all');
  const [actionChat, setActionChat] = useState<ChatThread | null>(null);

  const themeBg = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const subtleBg = isDark ? '#334155' : '#f1f5f9';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
  const primaryText = isDark ? '#f8fafc' : '#0f172a';
  const secondaryText = isDark ? '#94a3b8' : '#64748b';
  const accentColor = isDark ? '#3b82f6' : '#1a2d5a';

  useEffect(() => {
    if (!churchId || myIds.length === 0) {
      setChats([]);
      setLoadingChats(false);
      return;
    }

    setLoadingChats(true);
    const unsub = ChatService.subscribeToMyChats(
      churchId,
      myIds,
      (list) => {
        setChats(list);
        setLoadingChats(false);
      },
      () => {
        setLoadingChats(false);
      }
    );

    return () => unsub();
  }, [churchId, myIds.join('|')]);

  // Live same-church member search when typing or when directory mode is opened
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!churchId || (!trimmed && !showDirectoryMode)) {
      setMemberResults([]);
      setSearchingMembers(false);
      return;
    }

    let cancelled = false;
    setSearchingMembers(true);

    const timer = setTimeout(async () => {
      const results = await ChatService.searchChurchMembers(churchId, trimmed, {
        uid: user?.uid,
        memberId: member?.id,
        phone: user?.phoneNumber || member?.phone,
      });
      if (!cancelled) {
        setMemberResults(results);
        setSearchingMembers(false);
      }
    }, trimmed ? 180 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [churchId, searchQuery, showDirectoryMode, user?.uid, member?.id, member?.phone, user?.phoneNumber]);

  const getDirectPeer = (chat: ChatThread) => {
    const peerId = (chat.participantIds || []).find((id) => !myIds.includes(id));
    if (peerId && chat.participants?.[peerId]) {
      return { peerId, ...chat.participants[peerId] };
    }
    const entries = Object.values(chat.participants || {});
    const fallback = entries.find((p) => !myIds.includes(p.memberId) && !myIds.includes(p.uid || ''));
    return fallback
      ? { peerId: fallback.uid || fallback.memberId, ...fallback }
      : { peerId: peerId || '', name: 'Church Member', photoUrl: null };
  };

  const getUnreadForChat = (chat: ChatThread): number => {
    let total = 0;
    myIds.forEach((id) => {
      total += Number(chat.unreadCounts?.[id] || 0);
    });
    return total;
  };

  const archivedCount = useMemo(
    () => chats.filter((c) => (c.archivedBy || []).some((id) => myIds.includes(id))).length,
    [chats, myIds]
  );

  const filteredChats = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return chats.filter((chat) => {
      const isArchived = (chat.archivedBy || []).some((id) => myIds.includes(id));
      if (filterTab === 'archived') {
        if (!isArchived) return false;
      } else {
        if (isArchived) return false;
      }

      if (filterTab === 'groups' && chat.type !== 'group') return false;
      if (filterTab === 'unread' && getUnreadForChat(chat) <= 0) return false;

      if (!q) return true;
      if (chat.type === 'group') {
        return (chat.name || '').toLowerCase().includes(q);
      }
      const peer = getDirectPeer(chat);
      return (peer.name || '').toLowerCase().includes(q);
    });
  }, [chats, searchQuery, myIds, filterTab]);

  const handleSelectMember = async (target: ChatMemberProfile) => {
    if (!churchId || !canonicalId || openingMemberId) return;
    try {
      setOpeningMemberId(target.id);
      const thread = await ChatService.getOrCreateDirectChat(
        churchId,
        {
          memberId: canonicalId,
          uid: user?.uid || canonicalId,
          name: member?.name || user?.displayName || 'Member',
          photoUrl: (member as any)?.photoURL || (member as any)?.photoUrl || user?.photoURL || null,
          phone: member?.phone || user?.phoneNumber || null,
          userType: member?.userType || 'Member',
        },
        target
      );
      setSearchQuery('');
      setShowDirectoryMode(false);
      navigation.navigate('ChatRoom', {
        chatId: thread.id,
        churchId,
        title: target.name,
        photoUrl: target.photoUrl || null,
        chatType: 'direct',
        peerId: target.uid || target.id,
      });
    } catch (err: any) {
      Alert.alert('Unable to Open Chat', err?.message || 'Please try again.');
    } finally {
      setOpeningMemberId(null);
    }
  };

  const handleOpenChat = (chat: ChatThread) => {
    if (chat.type === 'group') {
      navigation.navigate('ChatRoom', {
        chatId: chat.id,
        churchId,
        title: chat.name || 'Church Group',
        photoUrl: chat.photoUrl || null,
        chatType: 'group',
      });
      return;
    }
    const peer = getDirectPeer(chat);
    navigation.navigate('ChatRoom', {
      chatId: chat.id,
      churchId,
      title: peer.name || 'Church Member',
      photoUrl: peer.photoUrl || null,
      chatType: 'direct',
      peerId: peer.peerId,
    });
  };

  const renderMemberRow = ({ item }: { item: ChatMemberProfile }) => {
    const initials = (item.name || 'M').trim().charAt(0).toUpperCase();
    const isOpening = openingMemberId === item.id;
    return (
      <TouchableOpacity
        activeOpacity={0.78}
        onPress={() => handleSelectMember(item)}
        disabled={Boolean(openingMemberId)}
        style={[
          styles.rowCard,
          { backgroundColor: cardBg, borderColor },
        ]}
      >
        {item.photoUrl ? (
          <Image source={{ uri: item.photoUrl }} style={styles.avatarImg} />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: subtleBg }]}>
            <Text style={[styles.avatarLetter, { color: accentColor }]}>{initials}</Text>
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text style={[styles.rowTitle, { color: primaryText }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.rowSubtitle, { color: secondaryText }]} numberOfLines={1}>
            {[item.ministry, item.userType].filter(Boolean).join(' • ') || 'Church Member'}
          </Text>
        </View>

        {isOpening ? (
          <ActivityIndicator size="small" color={accentColor} />
        ) : (
          <View style={[styles.startChip, { backgroundColor: accentColor + '16' }]}>
            <MessageCircle size={14} color={accentColor} />
            <Text style={[styles.startChipTxt, { color: accentColor }]}>Chat</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderChatRow = ({ item }: { item: ChatThread }) => {
    const isGroup = item.type === 'group';
    const peer = isGroup ? null : getDirectPeer(item);
    const title = isGroup ? item.name || 'Church Group' : peer?.name || 'Church Member';
    const avatarUrl = isGroup ? item.photoUrl : peer?.photoUrl;
    const initials = title.trim().charAt(0).toUpperCase() || 'C';
    const unread = getUnreadForChat(item);

    const lastMsg = item.lastMessage;
    const sentByMe = lastMsg?.senderId ? myIds.includes(lastMsg.senderId) : false;
    const previewPrefix = sentByMe ? 'You: ' : isGroup && lastMsg?.senderName ? `${lastMsg.senderName}: ` : '';
    const previewBody = lastMsg?.text
      ? `${previewPrefix}${lastMsg.text}`
      : 'Tap to start chatting';
    const timeLabel = formatChatTimestamp(lastMsg?.createdAt || item.updatedAt);
    const isMuted = myIds.some((id) => Boolean(item.mutedBy?.[id]));

    return (
      <TouchableOpacity
        activeOpacity={0.78}
        onPress={() => handleOpenChat(item)}
        onLongPress={() => setActionChat(item)}
        style={[
          styles.rowCard,
          { backgroundColor: cardBg, borderColor },
        ]}
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
        ) : (
          <View
            style={[
              styles.avatarFallback,
              { backgroundColor: isGroup ? '#1a2d5a' : subtleBg },
            ]}
          >
            {isGroup ? (
              <Users size={20} color="#FFFFFF" />
            ) : (
              <Text style={[styles.avatarLetter, { color: accentColor }]}>{initials}</Text>
            )}
          </View>
        )}

        <View style={{ flex: 1 }}>
          <View style={styles.rowTopLine}>
            <Text style={[styles.rowTitle, { color: primaryText }]} numberOfLines={1}>
              {title}
            </Text>
            {!!timeLabel && (
              <Text
                style={[
                  styles.timeText,
                  { color: unread > 0 ? '#16a34a' : secondaryText },
                ]}
              >
                {timeLabel}
              </Text>
            )}
          </View>

          <View style={styles.rowBottomLine}>
            <Text
              style={[
                styles.rowSubtitle,
                {
                  color: unread > 0 ? primaryText : secondaryText,
                  fontWeight: unread > 0 ? '600' : '400',
                },
              ]}
              numberOfLines={1}
            >
              {previewBody}
            </Text>
            {unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeTxt}>
                  {unread > 99 ? '99+' : unread}
                </Text>
              </View>
            )}
            {isMuted && <VolumeX size={14} color={secondaryText} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const isSearchingOrDirectory = Boolean(searchQuery.trim()) || showDirectoryMode;

  return (
    <View style={[styles.container, { backgroundColor: themeBg }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />

      {/* ── Curved Navy Hero Header ── */}
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
          style={styles.heroBackBtn}
          onPress={() => {
            if (showDirectoryMode && !searchQuery.trim()) {
              setShowDirectoryMode(false);
            } else {
              navigation.goBack();
            }
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.8}
        >
          <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2.4} />
        </TouchableOpacity>

        <View style={styles.heroCenter} pointerEvents="none">
          <Text style={styles.heroTitle} numberOfLines={1}>
            Church Chat
          </Text>
          <Text style={styles.heroSub} numberOfLines={1}>
            {(activeChurch?.name || 'PRIVATE CHURCH SPACE').toUpperCase()}
          </Text>
        </View>

        {canCreateGroup ? (
          <TouchableOpacity
            style={styles.heroGroupBtn}
            onPress={() => navigation.navigate('CreateGroup')}
            activeOpacity={0.8}
          >
            <Users size={15} color="#FFFFFF" />
            <Text style={styles.heroGroupBtnTxt}>Group</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.heroBackBtn}
            onPress={() => {
              setShowDirectoryMode(true);
              setTimeout(() => searchInputRef.current?.focus(), 80);
            }}
            activeOpacity={0.8}
          >
            <UserPlus size={19} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* ── Top Search Bar (Member Directory + Existing Conversations) ── */}
      <View style={styles.searchWrap}>
        <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor }]}>
          <Search size={18} color={secondaryText} />
          <TextInput
            ref={searchInputRef}
            style={[styles.searchInput, { color: primaryText }]}
            placeholder="Search church members by name..."
            placeholderTextColor={secondaryText}
            value={searchQuery}
            onChangeText={(txt) => {
              setSearchQuery(txt);
              if (!txt.trim() && !showDirectoryMode) {
                setMemberResults([]);
              }
            }}
            returnKeyType="search"
          />
          {(Boolean(searchQuery) || showDirectoryMode) && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setShowDirectoryMode(false);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color={secondaryText} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        {!isSearchingOrDirectory && (
          <View style={styles.filterRow}>
            {(
              [
                { key: 'all', label: 'All' },
                { key: 'unread', label: 'Unread' },
                { key: 'groups', label: 'Groups' },
                {
                  key: 'archived',
                  label: archivedCount > 0 ? `Archived (${archivedCount})` : 'Archived',
                },
              ] as const
            ).map((chip) => {
              const active = filterTab === chip.key;
              return (
                <TouchableOpacity
                  key={chip.key}
                  onPress={() => setFilterTab(chip.key)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: active ? accentColor : cardBg,
                      borderColor: active ? accentColor : borderColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipTxt,
                      { color: active ? '#FFFFFF' : secondaryText },
                    ]}
                  >
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* ── Content: Search Results / Directory OR Chat List / Empty State ── */}
      {isSearchingOrDirectory ? (
        <View style={{ flex: 1 }}>
          {filteredChats.length > 0 && Boolean(searchQuery.trim()) && (
            <View style={{ paddingHorizontal: 16, marginBottom: 6 }}>
              <Text style={[styles.sectionHeaderTxt, { color: secondaryText }]}>
                EXISTING CONVERSATIONS
              </Text>
              {filteredChats.slice(0, 4).map((c) => (
                <View key={c.id}>{renderChatRow({ item: c })}</View>
              ))}
            </View>
          )}

          <Text
            style={[
              styles.sectionHeaderTxt,
              { color: secondaryText, paddingHorizontal: 16, marginTop: 4 },
            ]}
          >
            {activeChurch?.name ? `${activeChurch.name.toUpperCase()} MEMBERS` : 'CHURCH MEMBERS'}
          </Text>

          {searchingMembers ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={accentColor} />
              <Text style={[styles.helperTxt, { color: secondaryText }]}>
                Searching church members...
              </Text>
            </View>
          ) : memberResults.length === 0 ? (
            <View style={styles.centerBox}>
              <Search size={42} color={secondaryText} />
              <Text style={[styles.emptyTitle, { color: primaryText, marginTop: 14 }]}>
                No Matching Members Found
              </Text>
              <Text style={[styles.emptySub, { color: secondaryText }]}>
                Only registered members of your church appear in this directory.
              </Text>
            </View>
          ) : (
            <FlatList
              data={memberResults}
              keyExtractor={(item) => item.id}
              renderItem={renderMemberRow}
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: Math.max(insets.bottom, 20) + 20 },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      ) : loadingChats ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={accentColor} />
          <Text style={[styles.helperTxt, { color: secondaryText }]}>
            Loading conversations...
          </Text>
        </View>
      ) : filteredChats.length === 0 ? (
        <View style={styles.centerBox}>
          <View style={[styles.emptyCircle, { backgroundColor: subtleBg, borderColor }]}>
            <MessageCircle size={38} color={accentColor} />
          </View>
          <Text style={[styles.emptyTitle, { color: primaryText }]}>
            No Conversations Yet
          </Text>
          <Text style={[styles.emptySub, { color: secondaryText }]}>
            Search for a member in {activeChurch?.name || 'your church'} above to start a private one-to-one chat.
          </Text>
          <TouchableOpacity
            style={styles.ctaBtn}
            activeOpacity={0.85}
            onPress={() => {
              setShowDirectoryMode(true);
              setTimeout(() => searchInputRef.current?.focus(), 80);
            }}
          >
            <LinearGradient
              colors={['#2b52a1', '#1a3673']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}
            >
              <UserPlus size={17} color="#FFFFFF" />
              <Text style={styles.ctaBtnTxt}>Find Church Member</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          renderItem={renderChatRow}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 20 },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── Long-press Conversation Actions Modal ── */}
      <Modal
        visible={Boolean(actionChat)}
        transparent
        animationType="fade"
        onRequestClose={() => setActionChat(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setActionChat(null)}
        >
          <View style={[styles.actionSheet, { backgroundColor: cardBg, borderColor }]}>
            {actionChat && (() => {
              const isMuted = myIds.some((id) => Boolean(actionChat.mutedBy?.[id]));
              const isArchived = (actionChat.archivedBy || []).some((id) => myIds.includes(id));
              return (
                <>
                  <TouchableOpacity
                    style={styles.actionRow}
                    onPress={async () => {
                      const target = actionChat;
                      setActionChat(null);
                      await ChatService.toggleMuteChat(churchId, target.id, myIds, !isMuted);
                    }}
                  >
                    {isMuted ? (
                      <Bell size={18} color={accentColor} />
                    ) : (
                      <BellOff size={18} color={accentColor} />
                    )}
                    <Text style={[styles.actionTxt, { color: primaryText }]}>
                      {isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionRow}
                    onPress={async () => {
                      const target = actionChat;
                      setActionChat(null);
                      await ChatService.toggleArchiveChat(churchId, target.id, myIds, !isArchived);
                    }}
                  >
                    <Archive size={18} color={accentColor} />
                    <Text style={[styles.actionTxt, { color: primaryText }]}>
                      {isArchived ? 'Unarchive Chat' : 'Archive Chat'}
                    </Text>
                  </TouchableOpacity>

                  {actionChat.type === 'group' && (
                    <TouchableOpacity
                      style={styles.actionRow}
                      onPress={() => {
                        const target = actionChat;
                        setActionChat(null);
                        navigation.navigate('GroupInfo', {
                          chatId: target.id,
                          churchId,
                        });
                      }}
                    >
                      <Info size={18} color={accentColor} />
                      <Text style={[styles.actionTxt, { color: primaryText }]}>Group Info</Text>
                    </TouchableOpacity>
                  )}
                </>
              );
            })()}
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
  },
  heroCenter: {
    flex: 1,
    alignItems: 'center',
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
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginTop: 2,
  },
  heroGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 18,
  },
  heroGroupBtnTxt: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    paddingVertical: 0,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipTxt: {
    fontSize: 12,
    fontWeight: '700',
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
  sectionHeaderTxt: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: '800',
  },
  rowTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
    gap: 8,
  },
  rowTitle: {
    flex: 1,
    fontSize: 15.5,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  rowBottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowSubtitle: {
    flex: 1,
    fontSize: 13,
  },
  unreadBadge: {
    minWidth: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeTxt: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  startChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  startChipTxt: {
    fontSize: 12,
    fontWeight: '700',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  helperTxt: {
    marginTop: 12,
    fontSize: 13.5,
  },
  emptyCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 22,
  },
  ctaBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 3,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  ctaBtnTxt: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
});

