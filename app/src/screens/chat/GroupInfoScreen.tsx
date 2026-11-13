import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  Archive,
  ArrowLeft,
  Bell,
  BellOff,
  Camera,
  Check,
  Edit3,
  FileText,
  Image as ImageIcon,
  LogOut,
  MessageCircle,
  Search,
  Shield,
  ShieldAlert,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import { useTheme } from '../../context/ThemeContext';
import ChatService from '../../services/ChatService';
import {
  ChatMemberProfile,
  ChatMessage,
  ChatParticipantSummary,
  ChatThread,
} from '../../types/chat';

export default function GroupInfoScreen({ route, navigation }: any) {
  const { chatId, churchId: routeChurchId } = route?.params || {};
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

  const [thread, setThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [directoryMembers, setDirectoryMembers] = useState<ChatMemberProfile[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [addingSelected, setAddingSelected] = useState<Record<string, ChatMemberProfile>>({});
  const [addingBusy, setAddingBusy] = useState(false);

  const [selectedParticipant, setSelectedParticipant] = useState<ChatParticipantSummary | null>(null);
  const [deletingGroup, setDeletingGroup] = useState(false);

  const themeBg = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const subtleBg = isDark ? '#334155' : '#f1f5f9';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
  const primaryText = isDark ? '#f8fafc' : '#0f172a';
  const secondaryText = isDark ? '#94a3b8' : '#64748b';
  const accentColor = isDark ? '#3b82f6' : '#1a2d5a';

  useEffect(() => {
    if (!churchId || !chatId) {
      setLoading(false);
      return;
    }

    const unsubThread = ChatService.subscribeToChatThread(churchId, chatId, (data) => {
      setThread(data);
      setLoading(false);
    });

    const unsubMsgs = ChatService.subscribeToMessages(churchId, chatId, 100, (list) => {
      setMessages(list);
    });

    return () => {
      unsubThread();
      unsubMsgs();
    };
  }, [churchId, chatId]);

  const amIGroupAdmin = useMemo(
    () => (thread?.adminIds || []).some((id) => myIds.includes(id)),
    [thread?.adminIds, myIds]
  );

  const canDeleteGroup = useMemo(
    () =>
      amIGroupAdmin ||
      (Boolean(thread?.createdBy) && myIds.includes(thread!.createdBy!)) ||
      String(member?.userType || '').toLowerCase() === 'admin',
    [amIGroupAdmin, thread?.createdBy, myIds, member?.userType]
  );

  const canEditInfo = useMemo(() => {
    if (!thread) return false;
    if (amIGroupAdmin) return true;
    return thread.settings?.onlyAdminsCanEditInfo === false;
  }, [thread, amIGroupAdmin]);

  const canAddMembers = useMemo(() => {
    if (!thread) return false;
    if (amIGroupAdmin) return true;
    return thread.settings?.onlyAdminsCanAddMembers === false;
  }, [thread, amIGroupAdmin]);

  const isMuted = useMemo(
    () => myIds.some((id) => Boolean(thread?.mutedBy?.[id])),
    [thread?.mutedBy, myIds]
  );

  const isArchived = useMemo(
    () => (thread?.archivedBy || []).some((id) => myIds.includes(id)),
    [thread?.archivedBy, myIds]
  );

  const participantsList = useMemo(() => {
    if (!thread) return [];
    const adminSet = new Set(thread.adminIds || []);
    const list: ChatParticipantSummary[] = (thread.participantIds || []).map((id) => {
      const info = thread.participants?.[id];
      return (
        info || {
          memberId: id,
          uid: id,
          name: 'Church Member',
          photoUrl: null,
        }
      );
    });
    return list.sort((a, b) => {
      const aAdmin = adminSet.has(a.uid || a.memberId) || adminSet.has(a.memberId);
      const bAdmin = adminSet.has(b.uid || b.memberId) || adminSet.has(b.memberId);
      if (aAdmin !== bAdmin) return aAdmin ? -1 : 1;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [thread]);

  const sharedMedia = useMemo(
    () =>
      messages.filter(
        (m) =>
          !m.deletedForEveryone &&
          !(m.deletedFor || []).some((id) => myIds.includes(id)) &&
          (m.type === 'image' || m.type === 'video' || m.type === 'document' || m.type === 'audio') &&
          Boolean(m.media?.url)
      ),
    [messages, myIds]
  );

  const handleOpenEditInfo = () => {
    if (!thread || !canEditInfo) return;
    setEditName(thread.name || '');
    setEditDescription(thread.description || '');
    setEditCategory(thread.teamCategory || 'General');
    setEditModalVisible(true);
  };

  const handleSaveInfo = async () => {
    if (!churchId || !chatId || !editName.trim() || savingEdit) return;
    try {
      setSavingEdit(true);
      await ChatService.updateGroupInfo(churchId, chatId, {
        name: editName.trim(),
        description: editDescription.trim(),
        teamCategory: editCategory.trim() || 'General',
      });
      setEditModalVisible(false);
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Could not update group details.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleChangeGroupPhoto = async () => {
    if (!canEditInfo || !churchId || !chatId) return;
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Needed', 'Please allow photo access.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        await ChatService.updateGroupInfo(churchId, chatId, {
          localPhotoUri: res.assets[0].uri,
        });
      }
    } catch {
      Alert.alert('Error', 'Could not update group photo.');
    }
  };

  const handleOpenAddMembers = async () => {
    if (!churchId || !thread) return;
    setAddModalVisible(true);
    setAddingSelected({});
    setMemberSearch('');
    const members = await ChatService.searchChurchMembers(churchId, '', {
      uid: user?.uid,
      memberId: member?.id,
      phone: user?.phoneNumber || member?.phone,
    });
    const existingSet = new Set(thread.participantIds || []);
    setDirectoryMembers(
      members.filter((m) => !existingSet.has(m.uid || m.id) && !existingSet.has(m.id))
    );
  };

  const handleConfirmAddMembers = async () => {
    const chosen = Object.values(addingSelected);
    if (chosen.length === 0 || !churchId || !chatId || addingBusy) return;
    try {
      setAddingBusy(true);
      await ChatService.addGroupMembers(
        churchId,
        chatId,
        { id: canonicalId, name: myName },
        chosen
      );
      setAddModalVisible(false);
    } catch (err: any) {
      Alert.alert('Failed to Add', err?.message || 'Could not add selected members.');
    } finally {
      setAddingBusy(false);
    }
  };

  const handleToggleSetting = async (
    key: 'onlyAdminsCanMessage' | 'onlyAdminsCanEditInfo' | 'onlyAdminsCanAddMembers',
    val: boolean
  ) => {
    if (!amIGroupAdmin || !churchId || !chatId) return;
    await ChatService.updateGroupInfo(churchId, chatId, {
      settings: {
        ...(thread?.settings || {}),
        [key]: val,
      },
    });
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      'Leave Group',
      `Are you sure you want to leave "${thread?.name || 'this group'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await ChatService.leaveGroupChat(churchId, chatId, myIds, myName);
              navigation.popToTop();
              navigation.navigate('ChatList');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not leave group.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      'Delete Group',
      `Permanently delete "${thread?.name || 'this group'}" and all its messages for everyone? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Group',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingGroup(true);
              await ChatService.deleteGroupChat(churchId, chatId);
              navigation.popToTop();
              navigation.navigate('ChatList');
            } catch (err: any) {
              Alert.alert('Delete Failed', err?.message || 'Could not delete group.');
            } finally {
              setDeletingGroup(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.centerScreen, { backgroundColor: themeBg }]}>
        <ActivityIndicator size="large" color={accentColor} />
      </View>
    );
  }

  const adminSet = new Set(thread?.adminIds || []);
  const filteredAddCandidates = directoryMembers.filter((m) =>
    m.name.toLowerCase().includes(memberSearch.trim().toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: themeBg }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />

      <LinearGradient
        colors={['#2b52a1', '#1a3673']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.heroHeader,
          { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 48 : 16) + 8 },
        ]}
      >
        <TouchableOpacity style={styles.heroBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={21} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.heroTitle}>Group Info</Text>
        {canEditInfo ? (
          <TouchableOpacity style={styles.heroBtn} onPress={handleOpenEditInfo}>
            <Edit3 size={18} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: Math.max(insets.bottom, 24) + 24 }}
      >
        {/* Group Header Card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor, alignItems: 'center' }]}>
          <TouchableOpacity
            onPress={handleChangeGroupPhoto}
            disabled={!canEditInfo}
            activeOpacity={0.85}
            style={[styles.groupAvatarWrap, { backgroundColor: subtleBg, borderColor }]}
          >
            {thread?.photoUrl ? (
              <Image source={{ uri: thread.photoUrl }} style={styles.groupAvatar} />
            ) : (
              <Users size={36} color={accentColor} />
            )}
            {canEditInfo && (
              <View style={styles.camBadge}>
                <Camera size={12} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          <Text style={[styles.groupTitle, { color: primaryText }]}>
            {thread?.name || 'Church Group'}
          </Text>
          {Boolean(thread?.teamCategory) && (
            <View style={[styles.categoryPill, { backgroundColor: accentColor + '18' }]}>
              <Text style={[styles.categoryTxt, { color: accentColor }]}>
                {thread?.teamCategory}
              </Text>
            </View>
          )}
          {Boolean(thread?.description) && (
            <Text style={[styles.groupDesc, { color: secondaryText }]}>
              {thread?.description}
            </Text>
          )}
          <Text style={[styles.participantCountTxt, { color: secondaryText }]}>
            {participantsList.length} participants • {thread?.adminIds?.length || 0} admin(s)
          </Text>
        </View>

        {/* Mute & Archive Quick Controls */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.switchRow}>
            <View style={styles.switchLeft}>
              {isMuted ? (
                <BellOff size={18} color={secondaryText} />
              ) : (
                <Bell size={18} color={accentColor} />
              )}
              <Text style={[styles.switchTxt, { color: primaryText }]}>Mute Notifications</Text>
            </View>
            <Switch
              value={isMuted}
              onValueChange={(v) => ChatService.toggleMuteChat(churchId, chatId, myIds, v)}
              trackColor={{ true: accentColor }}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: borderColor }]} />

          <View style={styles.switchRow}>
            <View style={styles.switchLeft}>
              <Archive size={18} color={accentColor} />
              <Text style={[styles.switchTxt, { color: primaryText }]}>Archive Conversation</Text>
            </View>
            <Switch
              value={isArchived}
              onValueChange={(v) => ChatService.toggleArchiveChat(churchId, chatId, myIds, v)}
              trackColor={{ true: accentColor }}
            />
          </View>
        </View>

        {/* Group Permissions (Admins only) */}
        {amIGroupAdmin && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.cardHeading, { color: secondaryText }]}>GROUP PERMISSIONS</Text>

            <View style={styles.switchRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.switchTxt, { color: primaryText }]}>
                  Only Admins Can Send Messages
                </Text>
                <Text style={{ color: secondaryText, fontSize: 11.5 }}>
                  Announcement mode for official ministry updates
                </Text>
              </View>
              <Switch
                value={Boolean(thread?.settings?.onlyAdminsCanMessage)}
                onValueChange={(v) => handleToggleSetting('onlyAdminsCanMessage', v)}
                trackColor={{ true: accentColor }}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: borderColor }]} />

            <View style={styles.switchRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.switchTxt, { color: primaryText }]}>
                  Only Admins Can Edit Group Info
                </Text>
              </View>
              <Switch
                value={thread?.settings?.onlyAdminsCanEditInfo !== false}
                onValueChange={(v) => handleToggleSetting('onlyAdminsCanEditInfo', v)}
                trackColor={{ true: accentColor }}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: borderColor }]} />

            <View style={styles.switchRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.switchTxt, { color: primaryText }]}>
                  Only Admins Can Add Members
                </Text>
              </View>
              <Switch
                value={thread?.settings?.onlyAdminsCanAddMembers !== false}
                onValueChange={(v) => handleToggleSetting('onlyAdminsCanAddMembers', v)}
                trackColor={{ true: accentColor }}
              />
            </View>
          </View>
        )}

        {/* Shared Media & Documents */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.cardHeading, { color: secondaryText }]}>
            MEDIA & DOCUMENTS ({sharedMedia.length})
          </Text>
          {sharedMedia.length === 0 ? (
            <Text style={{ color: secondaryText, fontSize: 13 }}>
              No photos, videos, or documents shared in this group yet.
            </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {sharedMedia.slice(0, 20).map((m) => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => m.media?.url && Linking.openURL(m.media.url).catch(() => {})}
                  style={[styles.mediaTile, { backgroundColor: subtleBg, borderColor }]}
                >
                  {m.type === 'image' && m.media?.url ? (
                    <Image source={{ uri: m.media.url }} style={styles.mediaThumb} />
                  ) : m.type === 'document' ? (
                    <View style={styles.mediaIconBox}>
                      <FileText size={22} color={accentColor} />
                      <Text style={[styles.mediaLabel, { color: primaryText }]} numberOfLines={2}>
                        {m.media?.fileName || 'Document'}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.mediaIconBox}>
                      <ImageIcon size={22} color={accentColor} />
                      <Text style={[styles.mediaLabel, { color: primaryText }]}>
                        {m.type.toUpperCase()}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Participants List */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.participantsHeader}>
            <Text style={[styles.cardHeading, { color: secondaryText, marginBottom: 0 }]}>
              PARTICIPANTS ({participantsList.length})
            </Text>
            {canAddMembers && (
              <TouchableOpacity
                onPress={handleOpenAddMembers}
                style={[styles.addBtn, { backgroundColor: accentColor + '16' }]}
              >
                <UserPlus size={14} color={accentColor} />
                <Text style={{ color: accentColor, fontSize: 12, fontWeight: '700' }}>
                  Add Members
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {participantsList.map((p) => {
            const pId = p.uid || p.memberId;
            const isAdmin = adminSet.has(pId) || adminSet.has(p.memberId);
            const isMe = myIds.includes(pId) || myIds.includes(p.memberId);
            const initial = (p.name || 'M').trim().charAt(0).toUpperCase();

            return (
              <TouchableOpacity
                key={pId}
                activeOpacity={isMe ? 1 : 0.75}
                onPress={() => {
                  if (!isMe) setSelectedParticipant(p);
                }}
                style={styles.memberRow}
              >
                {p.photoUrl ? (
                  <Image source={{ uri: p.photoUrl }} style={styles.memberAvatar} />
                ) : (
                  <View style={[styles.memberAvatarFallback, { backgroundColor: subtleBg }]}>
                    <Text style={{ color: accentColor, fontWeight: '800', fontSize: 15 }}>
                      {initial}
                    </Text>
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <Text style={[styles.memberName, { color: primaryText }]} numberOfLines={1}>
                    {p.name}{isMe ? ' (You)' : ''}
                  </Text>
                  <Text style={{ color: secondaryText, fontSize: 12 }} numberOfLines={1}>
                    {p.userType || 'Church Member'}
                  </Text>
                </View>

                {isAdmin && (
                  <View style={styles.adminPill}>
                    <Shield size={11} color="#15803d" />
                    <Text style={styles.adminPillTxt}>Group Admin</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Leave Group */}
        <TouchableOpacity
          onPress={handleLeaveGroup}
          disabled={deletingGroup}
          style={[styles.leaveBtn, { backgroundColor: cardBg, borderColor: '#fecaca' }]}
        >
          <LogOut size={18} color="#dc2626" />
          <Text style={styles.leaveBtnTxt}>Leave Group</Text>
        </TouchableOpacity>

        {/* Delete Group (Group Admins / Creator / Church Admin) */}
        {canDeleteGroup && (
          <TouchableOpacity
            onPress={handleDeleteGroup}
            disabled={deletingGroup}
            style={[
              styles.leaveBtn,
              {
                marginTop: 10,
                backgroundColor: '#dc2626',
                borderColor: '#b91c1c',
                opacity: deletingGroup ? 0.7 : 1,
              },
            ]}
          >
            {deletingGroup ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Trash2 size={18} color="#FFFFFF" />
                <Text style={[styles.leaveBtnTxt, { color: '#FFFFFF' }]}>Delete Group</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Edit Group Info Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: primaryText }]}>Edit Group Info</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={20} color={secondaryText} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.modalInput, { color: primaryText, borderColor }]}
              placeholder="Group name"
              placeholderTextColor={secondaryText}
              value={editName}
              onChangeText={setEditName}
            />
            <TextInput
              style={[styles.modalInput, { color: primaryText, borderColor }]}
              placeholder="Team category (e.g., Worship Team)"
              placeholderTextColor={secondaryText}
              value={editCategory}
              onChangeText={setEditCategory}
            />
            <TextInput
              style={[styles.modalInput, { color: primaryText, borderColor, minHeight: 74 }]}
              placeholder="Group description"
              placeholderTextColor={secondaryText}
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
            />

            <TouchableOpacity
              onPress={handleSaveInfo}
              disabled={savingEdit}
              style={[styles.saveBtn, { backgroundColor: accentColor }]}
            >
              {savingEdit ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14.5 }}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Members Modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: cardBg, borderColor, maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: primaryText }]}>Add Members</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <X size={20} color={secondaryText} />
              </TouchableOpacity>
            </View>

            <View style={[styles.modalSearch, { borderColor }]}>
              <Search size={16} color={secondaryText} />
              <TextInput
                style={{ flex: 1, color: primaryText, fontSize: 14, paddingVertical: 0 }}
                placeholder="Search church members..."
                placeholderTextColor={secondaryText}
                value={memberSearch}
                onChangeText={setMemberSearch}
              />
            </View>

            <FlatList
              data={filteredAddCandidates}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => {
                const key = item.uid || item.id;
                const checked = Boolean(addingSelected[key]);
                return (
                  <TouchableOpacity
                    onPress={() =>
                      setAddingSelected((prev) => {
                        const next = { ...prev };
                        if (next[key]) delete next[key];
                        else next[key] = item;
                        return next;
                      })
                    }
                    style={styles.memberRow}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: primaryText, fontWeight: '700', fontSize: 14.5 }}>
                        {item.name}
                      </Text>
                      <Text style={{ color: secondaryText, fontSize: 12 }}>
                        {item.userType || 'Church Member'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.checkBox,
                        {
                          backgroundColor: checked ? accentColor : 'transparent',
                          borderColor: checked ? accentColor : borderColor,
                        },
                      ]}
                    >
                      {checked && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={{ color: secondaryText, textAlign: 'center', paddingVertical: 20 }}>
                  All matching church members are already in this group.
                </Text>
              }
            />

            <TouchableOpacity
              onPress={handleConfirmAddMembers}
              disabled={Object.keys(addingSelected).length === 0 || addingBusy}
              style={[
                styles.saveBtn,
                {
                  backgroundColor: accentColor,
                  opacity: Object.keys(addingSelected).length === 0 ? 0.5 : 1,
                },
              ]}
            >
              {addingBusy ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14.5 }}>
                  Add Selected ({Object.keys(addingSelected).length})
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Participant Action Modal */}
      <Modal
        visible={Boolean(selectedParticipant)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedParticipant(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setSelectedParticipant(null)}
        >
          <View style={[styles.actionCard, { backgroundColor: cardBg, borderColor }]}>
            {selectedParticipant && (() => {
              const targetId = selectedParticipant.uid || selectedParticipant.memberId;
              const targetIsAdmin =
                adminSet.has(targetId) || adminSet.has(selectedParticipant.memberId);

              return (
                <>
                  <Text style={[styles.actionHeaderTxt, { color: primaryText }]}>
                    {selectedParticipant.name}
                  </Text>

                  <TouchableOpacity
                    style={styles.actionRow}
                    onPress={async () => {
                      const target = selectedParticipant;
                      setSelectedParticipant(null);
                      const dm = await ChatService.getOrCreateDirectChat(
                        churchId,
                        {
                          memberId: canonicalId,
                          uid: user?.uid || canonicalId,
                          name: myName,
                          photoUrl:
                            (member as any)?.photoURL || (member as any)?.photoUrl || null,
                          phone: member?.phone || user?.phoneNumber || null,
                          userType: member?.userType || 'Member',
                        },
                        {
                          id: target.memberId,
                          uid: target.uid,
                          churchId,
                          name: target.name,
                          photoUrl: target.photoUrl,
                          phone: target.phone,
                          userType: target.userType,
                        }
                      );
                      navigation.navigate('ChatRoom', {
                        chatId: dm.id,
                        churchId,
                        title: target.name,
                        photoUrl: target.photoUrl || null,
                        chatType: 'direct',
                        peerId: target.uid || target.memberId,
                      });
                    }}
                  >
                    <MessageCircle size={18} color={accentColor} />
                    <Text style={[styles.actionTxt, { color: primaryText }]}>Message Privately</Text>
                  </TouchableOpacity>

                  {amIGroupAdmin && (
                    <>
                      <TouchableOpacity
                        style={styles.actionRow}
                        onPress={async () => {
                          const target = selectedParticipant;
                          setSelectedParticipant(null);
                          await ChatService.toggleGroupAdmin(
                            churchId,
                            chatId,
                            { id: canonicalId, name: myName },
                            targetId,
                            target.name,
                            !targetIsAdmin
                          );
                        }}
                      >
                        {targetIsAdmin ? (
                          <ShieldAlert size={18} color="#d97706" />
                        ) : (
                          <Shield size={18} color="#16a34a" />
                        )}
                        <Text style={[styles.actionTxt, { color: primaryText }]}>
                          {targetIsAdmin ? 'Dismiss as Group Admin' : 'Make Group Admin'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionRow}
                        onPress={() => {
                          const target = selectedParticipant;
                          setSelectedParticipant(null);
                          Alert.alert(
                            'Remove Member',
                            `Remove ${target.name} from this group?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Remove',
                                style: 'destructive',
                                onPress: () =>
                                  ChatService.removeGroupMember(
                                    churchId,
                                    chatId,
                                    { id: canonicalId, name: myName },
                                    targetId,
                                    target.name
                                  ),
                              },
                            ]
                          );
                        }}
                      >
                        <UserMinus size={18} color="#dc2626" />
                        <Text style={[styles.actionTxt, { color: '#dc2626' }]}>
                          Remove from Group
                        </Text>
                      </TouchableOpacity>
                    </>
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
  container: { flex: 1 },
  centerScreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroHeader: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 6,
  },
  heroBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 15,
    marginBottom: 14,
  },
  groupAvatarWrap: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  groupAvatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
  },
  camBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  groupTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  categoryPill: {
    marginTop: 6,
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryTxt: {
    fontSize: 12,
    fontWeight: '700',
  },
  groupDesc: {
    fontSize: 13.5,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
  },
  participantCountTxt: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  cardHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
    marginBottom: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  switchTxt: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  mediaTile: {
    width: 78,
    height: 78,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaThumb: {
    width: 78,
    height: 78,
  },
  mediaIconBox: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  mediaLabel: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  participantsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  memberAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  adminPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  adminPillTxt: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: '800',
  },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  leaveBtnTxt: {
    color: '#dc2626',
    fontSize: 15,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14.5,
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  modalSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 10,
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  actionCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 10,
  },
  actionHeaderTxt: {
    fontSize: 15.5,
    fontWeight: '800',
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  actionTxt: {
    fontSize: 14.5,
    fontWeight: '600',
  },
});

