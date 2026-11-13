import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Camera,
  Check,
  Search,
  Users,
  X,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import { useTheme } from '../../context/ThemeContext';
import ChatService, { canCreateChurchGroup } from '../../services/ChatService';
import { ChatMemberProfile } from '../../types/chat';

const TEAM_CATEGORIES = [
  'Worship Team',
  'Songs Team',
  'Prayer Team',
  'Music Team',
  'Media Team',
  'Youth Team',
  'Church Volunteers',
  'Ministry Group',
];

export default function CreateGroupScreen({ navigation }: any) {
  const { isDark } = useTheme();
  const { user, member, isPlatformSuperAdmin } = useAuth();
  const { activeChurch } = useChurch();
  const insets = useSafeAreaInsets();

  const churchId = activeChurch?.id || member?.churchId || member?.primaryChurchId || '';
  const canonicalId = ChatService.getCanonicalId(user, member);
  const allowedToCreate = canCreateChurchGroup(member, isPlatformSuperAdmin);

  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [teamCategory, setTeamCategory] = useState<string>('Worship Team');
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [allMembers, setAllMembers] = useState<ChatMemberProfile[]>([]);
  const [selectedMap, setSelectedMap] = useState<Record<string, ChatMemberProfile>>({});
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [creating, setCreating] = useState(false);

  const themeBg = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const subtleBg = isDark ? '#334155' : '#f1f5f9';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
  const primaryText = isDark ? '#f8fafc' : '#0f172a';
  const secondaryText = isDark ? '#94a3b8' : '#64748b';
  const accentColor = isDark ? '#3b82f6' : '#1a2d5a';

  useEffect(() => {
    if (!allowedToCreate) {
      Alert.alert(
        'Permission Required',
        'Only Church Admins and Ministry Leaders can create groups.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }

    if (!churchId) {
      setLoadingMembers(false);
      return;
    }

    let mounted = true;
    ChatService.searchChurchMembers(churchId, '', {
      uid: user?.uid,
      memberId: member?.id,
      phone: user?.phoneNumber || member?.phone,
    }).then((list) => {
      if (mounted) {
        setAllMembers(list);
        setLoadingMembers(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [churchId, allowedToCreate]);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allMembers;
    return allMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.ministry || '').toLowerCase().includes(q) ||
        (m.userType || '').toLowerCase().includes(q)
    );
  }, [allMembers, searchQuery]);

  const selectedList = useMemo(() => Object.values(selectedMap), [selectedMap]);

  const toggleMember = (item: ChatMemberProfile) => {
    const key = item.uid || item.id;
    setSelectedMap((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = item;
      }
      return next;
    });
  };

  const handlePickPhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Needed', 'Please allow photo library access to set a group photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setLocalPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Could not pick group image.');
    }
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert('Group Name Needed', 'Please enter a name for this church team or group.');
      return;
    }
    if (selectedList.length === 0) {
      Alert.alert('Select Members', 'Please add at least one church member to the group.');
      return;
    }
    if (!churchId || !canonicalId || creating) return;

    try {
      setCreating(true);
      const created = await ChatService.createGroupChat(
        churchId,
        {
          memberId: canonicalId,
          uid: user?.uid || canonicalId,
          name: member?.name || user?.displayName || 'Admin',
          photoUrl: (member as any)?.photoURL || (member as any)?.photoUrl || user?.photoURL || null,
          phone: member?.phone || user?.phoneNumber || null,
          userType: member?.userType || 'Admin',
        },
        {
          name: groupName.trim(),
          description: description.trim(),
          teamCategory,
          localPhotoUri,
          members: selectedList,
        }
      );

      navigation.replace('ChatRoom', {
        chatId: created.id,
        churchId,
        title: created.name,
        photoUrl: created.photoUrl || null,
        chatType: 'group',
      });
    } catch (err: any) {
      Alert.alert('Group Creation Failed', err?.message || 'Please try again.');
    } finally {
      setCreating(false);
    }
  };

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
        <TouchableOpacity
          style={styles.heroBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={21} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.heroCenter}>
          <Text style={styles.heroTitle}>New Church Group</Text>
          <Text style={styles.heroSub}>
            {selectedList.length} {selectedList.length === 1 ? 'MEMBER' : 'MEMBERS'} SELECTED
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.createHeaderBtn, { opacity: creating ? 0.6 : 1 }]}
          onPress={handleCreate}
          disabled={creating}
          activeOpacity={0.85}
        >
          {creating ? (
            <ActivityIndicator size="small" color="#1a3673" />
          ) : (
            <Text style={styles.createHeaderTxt}>Create</Text>
          )}
        </TouchableOpacity>
      </LinearGradient>

      <FlatList
        data={filteredMembers}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 24 }}
        ListHeaderComponent={
          <View style={styles.formSection}>
            {/* Group Avatar + Name + Description */}
            <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor }]}>
              <TouchableOpacity
                onPress={handlePickPhoto}
                style={[styles.groupAvatarBtn, { backgroundColor: subtleBg, borderColor }]}
                activeOpacity={0.85}
              >
                {localPhotoUri ? (
                  <Image source={{ uri: localPhotoUri }} style={styles.groupAvatarImg} />
                ) : (
                  <Camera size={24} color={accentColor} />
                )}
              </TouchableOpacity>

              <View style={{ flex: 1, gap: 8 }}>
                <TextInput
                  style={[styles.inputField, { color: primaryText, borderBottomColor: borderColor }]}
                  placeholder="Group Name (e.g., Worship Team)"
                  placeholderTextColor={secondaryText}
                  value={groupName}
                  onChangeText={setGroupName}
                  maxLength={60}
                />
                <TextInput
                  style={[styles.descField, { color: primaryText }]}
                  placeholder="Optional description or purpose..."
                  placeholderTextColor={secondaryText}
                  value={description}
                  onChangeText={setDescription}
                  maxLength={180}
                />
              </View>
            </View>

            {/* Preset Team Category Chips */}
            <Text style={[styles.sectionLabel, { color: secondaryText }]}>TEAM / MINISTRY</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}
            >
              {TEAM_CATEGORIES.map((cat) => {
                const active = teamCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => {
                      setTeamCategory(cat);
                      if (!groupName.trim()) setGroupName(cat);
                    }}
                    style={[
                      styles.catChip,
                      {
                        backgroundColor: active ? accentColor : cardBg,
                        borderColor: active ? accentColor : borderColor,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.catChipTxt,
                        { color: active ? '#FFFFFF' : primaryText },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Selected Members Preview Strip */}
            {selectedList.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.selectedStrip}
              >
                {selectedList.map((m) => {
                  const key = m.uid || m.id;
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => toggleMember(m)}
                      style={[styles.selectedPill, { backgroundColor: cardBg, borderColor }]}
                    >
                      <Text style={[styles.selectedPillTxt, { color: primaryText }]} numberOfLines={1}>
                        {m.name}
                      </Text>
                      <X size={14} color={secondaryText} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Search Church Members */}
            <Text style={[styles.sectionLabel, { color: secondaryText, marginTop: 8 }]}>
              ADD CHURCH MEMBERS
            </Text>
            <View style={[styles.searchBar, { backgroundColor: cardBg, borderColor }]}>
              <Search size={17} color={secondaryText} />
              <TextInput
                style={[styles.searchInput, { color: primaryText }]}
                placeholder="Search church members..."
                placeholderTextColor={secondaryText}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {Boolean(searchQuery) && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={17} color={secondaryText} />
                </TouchableOpacity>
              )}
            </View>

            {loadingMembers && (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={accentColor} />
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const key = item.uid || item.id;
          const isSelected = Boolean(selectedMap[key]);
          const initials = (item.name || 'M').trim().charAt(0).toUpperCase();

          return (
            <TouchableOpacity
              activeOpacity={0.78}
              onPress={() => toggleMember(item)}
              style={[
                styles.memberRow,
                {
                  backgroundColor: cardBg,
                  borderColor: isSelected ? accentColor : borderColor,
                },
              ]}
            >
              {item.photoUrl ? (
                <Image source={{ uri: item.photoUrl }} style={styles.memberAvatar} />
              ) : (
                <View style={[styles.memberAvatarFallback, { backgroundColor: subtleBg }]}>
                  <Text style={[styles.memberAvatarLetter, { color: accentColor }]}>{initials}</Text>
                </View>
              )}

              <View style={{ flex: 1 }}>
                <Text style={[styles.memberName, { color: primaryText }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.memberMeta, { color: secondaryText }]} numberOfLines={1}>
                  {[item.ministry, item.userType].filter(Boolean).join(' • ') || 'Church Member'}
                </Text>
              </View>

              <View
                style={[
                  styles.checkCircle,
                  {
                    backgroundColor: isSelected ? accentColor : 'transparent',
                    borderColor: isSelected ? accentColor : borderColor,
                  },
                ]}
              >
                {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          !loadingMembers ? (
            <View style={{ padding: 32, alignItems: 'center' }}>
              <Users size={34} color={secondaryText} />
              <Text style={{ color: secondaryText, marginTop: 10, fontSize: 13.5 }}>
                No church members match "{searchQuery}"
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  heroCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 18.5,
    fontWeight: '800',
  },
  heroSub: {
    color: '#BFDBFE',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.9,
    marginTop: 2,
  },
  createHeaderBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 68,
    alignItems: 'center',
  },
  createHeaderTxt: {
    color: '#1a3673',
    fontSize: 13,
    fontWeight: '800',
  },
  formSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  groupAvatarBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  groupAvatarImg: {
    width: 60,
    height: 60,
  },
  inputField: {
    fontSize: 15.5,
    fontWeight: '700',
    paddingBottom: 6,
    borderBottomWidth: 1,
  },
  descField: {
    fontSize: 13.5,
    paddingVertical: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
    marginBottom: 8,
  },
  chipsScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  catChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  catChipTxt: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  selectedStrip: {
    gap: 8,
    paddingBottom: 10,
  },
  selectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    maxWidth: 160,
  },
  selectedPillTxt: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 13,
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  memberAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarLetter: {
    fontSize: 17,
    fontWeight: '800',
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
  },
  memberMeta: {
    fontSize: 12.5,
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

