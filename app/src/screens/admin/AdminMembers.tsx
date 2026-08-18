import React, { useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Dimensions, 
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Share,
  KeyboardAvoidingView,
  Image,
  Linking
} from 'react-native';
import { Users, Phone, Mail, ChevronDown, ChevronUp, Clock, UserCheck, UserX, Shield, Plus, X, Trash2, Edit2, ChevronLeft, UserPlus, Search, MoreVertical } from 'lucide-react-native';
import FirestoreService from '../../services/FirestoreService';
import { useChurch } from '../../context/ChurchContext';
import { CustomAlert, AlertButton } from '../../components/CustomAlert';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { AdminTabContext } from '../../context/AdminTabContext';
import InviteMembersModal from '../../components/InviteMembersModal';

const { width } = Dimensions.get('window');

const MemberAvatar = ({ member, initials, styles }: any) => {
  const [imgError, setImgError] = React.useState(false);
  
  const possibleUrls = [
    member.profilePhoto,
    member.photoURL,
    member.photoUrl,
    member.profileImageUrl,
    member.PhotoUrl
  ];
  
  const validUrl = possibleUrls.find(
    (url: any) => typeof url === 'string' && url.trim() !== '' && url !== 'null' && url !== 'undefined'
  );

  if (validUrl && !imgError) {
    return (
      <Image 
        source={{ uri: validUrl }} 
        style={styles.avatar} 
        resizeMode="cover"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarTxt}>{initials}</Text>
    </View>
  );
};

export default function AdminMembers() {
  const { activeChurch } = useChurch();
  const { setActiveTab } = React.useContext(AdminTabContext);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [villageFilter, setVillageFilter] = useState<string>('All');
  const [villageDropdownVisible, setVillageDropdownVisible] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedHouseholdIds, setExpandedHouseholdIds] = useState<Record<string, boolean>>({});
  const [headerMenuVisible, setHeaderMenuVisible] = useState(false);

  // Add/Edit Member State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [editMemberId, setEditMemberId] = useState<string | null>(null);
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({
    name: '',
    phone: '',
    userType: 'member',
    dob: '',
    city: '',
    baptismDate: '',
    anniversaryDate: ''
  });
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [activeDateField, setActiveDateField] = useState<'dob' | 'baptismDate' | 'anniversaryDate'>('dob');

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'info' | 'error' | 'warning';
    buttons?: AlertButton[];
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info'
  });

  const fetchMembers = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await FirestoreService.getAllMembers();
      setMembers(data);
    } catch (err: any) {
      console.error('Error fetching members:', err);
      setError(err?.message || 'Failed to fetch members');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handlePromoteAdmin = async (memberId: string) => {
    // Optimistic UI Update
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, userType: 'Admin' } : m));
    
    setAlertConfig({
      visible: true,
      title: 'Promoted',
      message: 'Member has been promoted to Admin.',
      type: 'success',
      buttons: [{ text: 'OK', onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })) }]
    });

    try {
      const success = await FirestoreService.updateMemberRole(memberId, 'Admin');
      if (!success) {
        // Revert optimistic update on failure
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, userType: 'Member' } : m));
        setAlertConfig({
          visible: true,
          title: 'Error',
          message: 'Failed to promote member.',
          type: 'error',
          buttons: [{ text: 'OK', onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })) }]
        });
      }
    } catch (err) {
      console.error(err);
      // Revert optimistic update on failure
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, userType: 'Member' } : m));
    }
  };

  const handleRemoveAdmin = async (memberId: string, memberName: string) => {
    // Optimistic UI Update
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, userType: 'Member' } : m));
    
    setAlertConfig({
      visible: true,
      title: 'Access Removed',
      message: `${memberName} is now a regular member.`,
      type: 'success',
      buttons: [{ text: 'OK', onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })) }]
    });

    try {
      const success = await FirestoreService.updateMemberRole(memberId, 'Member');
      if (!success) {
        // Revert optimistic update on failure
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, userType: 'Admin' } : m));
        setAlertConfig({
          visible: true,
          title: 'Error',
          message: 'Failed to remove admin role.',
          type: 'error',
          buttons: [{ text: 'OK', onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })) }]
        });
      }
    } catch (err) {
      console.error(err);
      // Revert optimistic update on failure
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, userType: 'Admin' } : m));
    }
  };

  const handleDeleteMember = (memberId: string, memberName: string) => {
    setAlertConfig({
      visible: true,
      title: 'Remove Member',
      message: `Are you sure you want to remove ${memberName || 'this member'} from the church?`,
      type: 'warning',
      buttons: [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => setAlertConfig(prev => ({ ...prev, visible: false }))
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              setAlertConfig(prev => ({ ...prev, visible: false }));
              if (activeChurch?.id) {
                const success = await FirestoreService.adminRemoveMember(activeChurch.id, memberId);
                if (success.success) {
                  setMembers(prev => prev.filter(m => m.id !== memberId));
                  setTimeout(() => {
                    setAlertConfig({
                      visible: true,
                      title: 'Success!',
                      message: `${memberName} has been removed.`,
                      type: 'success',
                      buttons: [{ text: 'OK', onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })) }]
                    });
                  }, 500);
                } else {
                  setError('Failed to remove member');
                }
              }
            } catch (err) {
                console.error(err);
                setError('Failed to remove member');
            } finally {
                setLoading(false);
            }
          }
        }
      ]
    });
  };

  // Compute unique villages for dropdown
  const uniqueVillages = useMemo(() => {
    const villages = members.map(m => (m.city || m.village || '').trim()).filter(Boolean);
    const unique = Array.from(new Set(villages)).sort();
    return ['All', ...unique];
  }, [members]);

  // Village Filtered Members (used for stats based on the selected village)
  const villageFilteredMembers = useMemo(() => {
    return members.filter(m => villageFilter === 'All' || (m.city || m.village || '').trim() === villageFilter);
  }, [members, villageFilter]);

  // Stats calculation
  const totalMembers = villageFilteredMembers.length;
  const activeMembers = villageFilteredMembers.length; // Assuming all firebase members are active for now
  const inactiveMembers = 0;

  const handleAddMember = async () => {
    if (!newMemberForm.name.trim() || !newMemberForm.phone.trim()) {
      setAlertConfig({
        visible: true,
        title: 'Missing Info',
        message: 'Please provide both name and phone number.',
        type: 'warning',
        buttons: [{ text: 'OK', onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })) }]
      });
      return;
    }
    
    const digitsOnly = newMemberForm.phone.replace(/\D/g, '');
    const last10 = digitsOnly.slice(-10);
    const formattedPhone = `+91${last10}`;

    try {
      setAddMemberLoading(true);
      
      let res;
      if (editMemberId) {
        res = await FirestoreService.adminUpdateMember(activeChurch?.id || '', editMemberId, {
          name: newMemberForm.name,
          phone: formattedPhone,
          userType: newMemberForm.userType,
          dob: newMemberForm.dob,
          city: newMemberForm.city,
          baptismDate: newMemberForm.baptismDate,
          anniversaryDate: newMemberForm.anniversaryDate,
        });
      } else {
        const isDuplicate = members.some(member => {
          const mPhoneRaw = (member.phone || '').replace(/\D/g, '');
          const mPhone10 = mPhoneRaw.slice(-10);
          return mPhone10 === last10 && mPhone10.length === 10;
        });

        if (isDuplicate) {
          setAlertConfig({
            visible: true,
            title: 'Duplicate Member',
            message: 'A member with this phone number already exists in this church.',
            type: 'warning',
            buttons: [{ text: 'OK', onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })) }]
          });
          setAddMemberLoading(false);
          return;
        }

        res = await FirestoreService.adminAddMember(activeChurch?.id || '', {
          name: newMemberForm.name,
          phone: formattedPhone,
          userType: newMemberForm.userType,
          dob: newMemberForm.dob,
          churchId: activeChurch?.id,
          city: newMemberForm.city,
          baptismDate: newMemberForm.baptismDate,
          anniversaryDate: newMemberForm.anniversaryDate,
        });
      }

      if (res.success) {
        setAddModalVisible(false);
        setEditMemberId(null);
        setNewMemberForm({ name: '', phone: '', userType: 'member', dob: '', city: '', baptismDate: '', anniversaryDate: '' });
        fetchMembers();

        setTimeout(() => {
          setAlertConfig({
            visible: true,
            title: 'Success!',
            message: editMemberId ? 'Member updated successfully!' : 'Member added successfully!',
            type: 'success',
            buttons: [{ 
              text: 'OK', 
              onPress: () => {
                setAlertConfig(prev => ({ ...prev, visible: false }));
                if (!editMemberId) {
                  // Share functionality after OK for new members
                  const churchName = activeChurch?.name || 'WeChristian Church';
                  const churchCode = activeChurch?.subdomain?.toUpperCase() || (activeChurch as any)?.churchCode || '';
                  Share.share({
                    message: `Hello ${newMemberForm.name},\n\nYou have been added to "${churchName}" on We Christian!\n\nChurch Code: *${churchCode}*\n\nDownload the app:\nhttps://play.google.com/store/apps/details?id=com.wechristian.app`,
                    title: `Join ${churchName}`,
                  });
                }
              }
            }]
          });
        }, 500);

      } else {
        setAlertConfig({
          visible: true,
          title: 'Error',
          message: res.error || 'Failed to add member',
          type: 'error',
          buttons: [{ text: 'OK', onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })) }]
        });
      }
    } catch (e: any) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: e.message,
        type: 'error',
        buttons: [{ text: 'OK', onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })) }]
      });
    } finally {
      setAddMemberLoading(false);
    }
  };

  const handleToggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const formatLastAppOpened = (dateVal: any) => {
    if (!dateVal) return 'Never';
    try {
      let date: Date;
      // Handle Firestore Timestamp objects
      if (dateVal && typeof dateVal.toDate === 'function') {
        date = dateVal.toDate();
      } else if (dateVal && typeof dateVal._seconds === 'number') {
        date = new Date(dateVal._seconds * 1000);
      } else if (dateVal && typeof dateVal.seconds === 'number') {
        date = new Date(dateVal.seconds * 1000);
      } else {
        date = new Date(dateVal);
      }
      
      if (isNaN(date.getTime())) return String(dateVal);
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      
      return `${month} ${day}, ${year} ${hours}:${minutes} ${ampm}`;
    } catch (e) {
      return String(dateVal);
    }
  };

  const filteredMembers = villageFilteredMembers.filter(m => {
    // Map Firebase schema fields
    const nameStr = (m.name || m.firstName || '').toLowerCase();
    const emailStr = (m.email || '').toLowerCase();
    const phoneStr = m.phone || '';
    const villageStr = (m.city || m.village || '').toLowerCase();
    
    const matchesSearch = 
      nameStr.includes(searchQuery.toLowerCase()) ||
      emailStr.includes(searchQuery.toLowerCase()) ||
      villageStr.includes(searchQuery.toLowerCase()) ||
      phoneStr.includes(searchQuery);

    const isActive = true; // Assuming active by default in Firebase
    const matchesStatus = 
      statusFilter === 'All' || 
      (statusFilter === 'Active' && isActive) ||
      (statusFilter === 'Inactive' && !isActive);

    return matchesSearch && matchesStatus;
  });

  if (loading && members.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a2d5a" />
        <Text style={{ marginTop: 10, color: '#1a2d5a', fontWeight: '600' }}>Loading members...</Text>
      </View>
    );
  }

  if (error && members.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTxt}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchMembers()}>
          <Text style={styles.retryBtnTxt}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />

      {/* ── Hero Section ── */}
      <View style={styles.hero}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1, paddingRight: 4 }}>
            <TouchableOpacity onPress={() => setActiveTab(0)} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ChevronLeft size={20} color="#fff" style={{ marginLeft: -6, marginRight: 2 }} />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
            </TouchableOpacity>
            <Text style={[styles.heroTitle, { marginHorizontal: 8, opacity: 0.4 }]}>|</Text>
            <Text style={[styles.heroTitle, { flexShrink: 1 }]} numberOfLines={1}>Members</Text>
          </View>
          
          <TouchableOpacity 
            onPress={() => setHeaderMenuVisible(true)} 
            style={{ padding: 8, marginRight: -8 }}
          >
            <MoreVertical size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchMembers(true)}
            colors={['#1a2d5a']}
          />
        }
      >
        
        <View style={{ height: 4 }} />

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: '#1a2d5a' }]}>{totalMembers}</Text>
            <Text style={styles.statLbl}>Total Members</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: '#15803D' }]}>{activeMembers}</Text>
            <Text style={styles.statLbl}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: '#c0392b' }]}>{inactiveMembers}</Text>
            <Text style={styles.statLbl}>Inactive</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBarContainer, { marginBottom: 14 }]}>
          <Search size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search members..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Chips & Village Dropdown */}
        <View style={[styles.filterRow, { justifyContent: 'space-between', alignItems: 'center' }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }} style={{ flex: 1 }}>
            {(['All', 'Active', 'Inactive'] as const).map(filter => (
              <TouchableOpacity 
                key={filter} 
                style={[styles.filterChip, statusFilter === filter && styles.filterChipActive]}
                onPress={() => setStatusFilter(filter)}
              >
                <Text style={[styles.filterChipTxt, statusFilter === filter && styles.filterChipTxtActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity 
            style={[styles.filterChip, { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e2e8f0', marginLeft: 8, paddingHorizontal: 12 }]}
            onPress={() => setVillageDropdownVisible(true)}
          >
            <Text style={[styles.filterChipTxt, { marginRight: 4, maxWidth: 100 }]} numberOfLines={1}>
              {villageFilter === 'All' ? 'Village/City' : villageFilter}
            </Text>
            <ChevronDown size={14} color="#1a2d5a" />
          </TouchableOpacity>
        </View>

        {/* Member Cards List */}
        <View style={styles.membersList}>
          {filteredMembers.map((member, index) => {
            const isExpanded = expandedId === member.id;
            const associated = member.accountId
              ? members.filter(m => m.accountId === member.accountId && m.id !== member.id)
              : [];
            const isActive = true; // Placeholder for future active/inactive flag in Firebase
            const displayName = (`${member.firstName || ''} ${member.lastName || ''}`.trim()) || member.name || 'Unknown';
            const displayRole = member.userType || 'member';

            return (
              <View 
                key={`${member.id || 'admin-member'}-${index}`} 
                style={[styles.memberCard, isExpanded && styles.memberCardExpanded]}
              >
                <TouchableOpacity 
                  style={styles.cardHeader} 
                  activeOpacity={0.7}
                  onPress={() => handleToggleExpand(member.id)}
                >
                  <View style={styles.profileSection}>
                    <MemberAvatar member={member} initials={getInitials(displayName)} styles={styles} />
                    <View style={styles.nameSection}>
                      <Text style={styles.name}>{displayName}</Text>
                      {(member.city || member.village) && (
                        <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2, marginBottom: 4 }}>
                          📍 {(member.city || member.village).trim()}
                        </Text>
                      )}
                      <View style={badgeRowStyles(isActive).badgeRow}>
                        <View style={styles.roleBadge}>
                          <Text style={styles.roleTxt}>{displayRole.toUpperCase()}</Text>
                        </View>
                        <View style={[
                          styles.statusBadge, 
                          isActive ? styles.statusActive : styles.statusInactive
                        ]}>
                          <Text style={styles.statusTxt}>{isActive ? 'Active' : 'Inactive'}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
                    {isExpanded && (
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation();
                          setEditMemberId(member.id);
                          setNewMemberForm({
                            name: member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim(),
                            phone: member.phone || '',
                            userType: member.userType || 'member',
                            dob: member.dob || '',
                            city: member.city || member.village || '',
                            baptismDate: member.baptismDate || member.Baptism_Date__c || '',
                            anniversaryDate: member.anniversaryDate || member.Anniversary_Date__c || ''
                          });
                          setAddModalVisible(true);
                        }}
                        style={{ padding: 4 }}
                      >
                        <Edit2 size={18} color="#2563EB" />
                      </TouchableOpacity>
                    )}
                    <View style={styles.chevronWrap}>
                      {isExpanded ? (
                        <ChevronUp size={18} color="#6B7280" />
                      ) : (
                        <ChevronDown size={18} color="#6B7280" />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>

                <View style={styles.contactDetails}>
                  <TouchableOpacity 
                    style={styles.contactRow}
                    onPress={() => member.phone && Linking.openURL(`tel:${member.phone.replace(/[^0-9+]/g, '')}`)}
                  >
                    <Phone size={12} color="#6B7280" />
                    <Text style={styles.contactTxt}>{member.phone || 'No Phone'}</Text>
                  </TouchableOpacity>
                  <View style={styles.contactRow}>
                    <Mail size={12} color="#6B7280" />
                    <Text style={styles.contactTxt}>{member.email || 'No Email'}</Text>
                  </View>
                </View>

                {isExpanded && (
                  <View style={styles.expandedContent}>


                    {/* App Activity Stats */}
                    <View style={styles.statsSubGrid}>
                      <View style={styles.subStatBox}>
                        <View style={styles.subStatLabelRow}>
                          <Clock size={12} color="#c0392b" />
                          <Text style={styles.subStatLabel}>Last App Opened</Text>
                        </View>
                        <Text style={styles.subStatValue}>{formatLastAppOpened(member.lastLogin || member.lastAppOpened)}</Text>
                      </View>
                      <View style={styles.subStatBox}>
                        <View style={styles.subStatLabelRow}>
                          <UserCheck size={12} color="#15803D" />
                          <Text style={styles.subStatLabel}>Household Contacts</Text>
                        </View>
                        <Text style={styles.subStatValue}>
                          {associated.length} Associated
                        </Text>
                      </View>
                    </View>

                    {/* Admin Actions */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      <View style={{ flex: 1 }}>
                        {member.userType?.trim().toLowerCase() === 'super_admin' || member.userType?.trim().toLowerCase() === 'super admin' ? (
                          <View style={[styles.promoteBtn, { backgroundColor: '#7c3aed', opacity: 0.8 }]}>
                            <Shield size={14} color="#fff" />
                            <Text style={styles.promoteBtnTxt}>Super Admin</Text>
                          </View>
                        ) : displayRole.toLowerCase() === 'admin' ? (
                          <TouchableOpacity 
                            style={[styles.promoteBtn, { backgroundColor: '#dc2626' }]}
                            onPress={() => handleRemoveAdmin(member.id, displayName)}
                          >
                            <UserX size={14} color="#fff" />
                            <Text style={styles.promoteBtnTxt}>Remove Admin</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity 
                            style={styles.promoteBtn}
                            onPress={() => handlePromoteAdmin(member.id)}
                          >
                            <UserCheck size={14} color="#fff" />
                            <Text style={styles.promoteBtnTxt}>Promote Admin</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {member.userType?.trim().toLowerCase() !== 'super_admin' && member.userType?.trim().toLowerCase() !== 'super admin' && (
                        <View style={{ flex: 1 }}>
                          <TouchableOpacity 
                            style={[styles.promoteBtn, { backgroundColor: '#4b5563' }]}
                            onPress={() => handleDeleteMember(member.id, displayName)}
                          >
                            <Trash2 size={14} color="#fff" />
                            <Text style={styles.promoteBtnTxt}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>

                    {/* Household Members breakdown */}
                    <Text style={styles.householdHeader}>
                      HOUSEHOLD: {displayName.toUpperCase()}
                    </Text>

                    <View style={styles.householdList}>
                      {associated.length > 0 ? (
                        associated.map((assoc, idx) => (
                          <View key={`${assoc.id || 'assoc'}-${idx}`}>
                            <TouchableOpacity 
                              style={styles.householdItem}
                              onPress={() => {
                                const key = assoc.id || String(idx);
                                setExpandedHouseholdIds(prev => ({ ...prev, [key]: !prev[key] }));
                              }}
                            >
                              <View style={styles.hiLeft}>
                                <Text style={styles.hiName}>{(`${assoc.firstName || ''} ${assoc.lastName || ''}`.trim()) || assoc.name}</Text>
                                {(assoc.city || assoc.village) && (
                                  <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 1, marginBottom: 1 }}>
                                    📍 {(assoc.city || assoc.village).trim()}
                                  </Text>
                                )}
                                <Text style={styles.hiEmail}>{assoc.email || assoc.phone || 'No contact details'}</Text>
                              </View>
                              <View style={styles.hiRight}>
                                <Text style={styles.hiRelation}>{assoc.userType || 'Member'}</Text>
                                {expandedHouseholdIds[assoc.id || String(idx)] ? <ChevronUp size={16} color="#6B7280" style={{marginTop: 4}}/> : <ChevronDown size={16} color="#6B7280" style={{marginTop: 4}}/>}
                              </View>
                            </TouchableOpacity>
                            {expandedHouseholdIds[assoc.id || String(idx)] && (() => {
                              const details = assoc.id ? (members.find(m => m.id === assoc.id) || assoc) : assoc;
                              return (
                                <View style={{ padding: 12, backgroundColor: '#F9FAFB', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, marginBottom: 8, marginTop: -8, marginHorizontal: 2 }}>
                                  {details.phone ? (
                                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }} onPress={() => Linking.openURL(`tel:${details.phone.replace(/[^0-9+]/g, '')}`)}>
                                      <Phone size={14} color="#6B7280" style={{ marginRight: 8 }} />
                                      <Text style={{ color: '#007AFF', fontSize: 13 }}>{details.phone}</Text>
                                    </TouchableOpacity>
                                  ) : null}
                                  {details.email ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                      <Mail size={14} color="#6B7280" style={{ marginRight: 8 }} />
                                      <Text style={{ color: '#4B5563', fontSize: 13 }}>{details.email}</Text>
                                    </View>
                                  ) : null}
                                  {details.dob ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                      <Text style={{ fontSize: 14, marginRight: 8 }}>🎂</Text>
                                      <Text style={{ color: '#4B5563', fontSize: 13 }}>DOB: {details.dob}</Text>
                                    </View>
                                  ) : null}
                                  {details.gender ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                      <Text style={{ fontSize: 14, marginRight: 8 }}>👤</Text>
                                      <Text style={{ color: '#4B5563', fontSize: 13 }}>Gender: {details.gender}</Text>
                                    </View>
                                  ) : null}
                                </View>
                              );
                            })()}
                          </View>
                        ))
                      ) : (
                        <Text style={styles.emptyHouseholdTxt}>
                          No other household contacts registered.
                        </Text>
                      )}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <Text style={styles.footerBranding}>Church Admin · Member Activity Logs</Text>
        <View style={{ height: 100 }} />
      </ScrollView>

      <InviteMembersModal
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
        churchName={activeChurch?.name || 'Our Church'}
        churchCode={activeChurch?.subdomain?.toUpperCase() || ''}
        churchId={activeChurch?.id || ''}
        onMembersAdded={() => fetchMembers(true)}
        existingMembers={members}
      />

      {/* Add/Edit Member Modal */}
      <Modal visible={addModalVisible} transparent animationType="fade" onRequestClose={() => { setAddModalVisible(false); setEditMemberId(null); }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: 'rgba(26,45,90,0.6)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: width * 0.92, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, shadowColor: '#1a2d5a', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#1a2d5a', letterSpacing: -0.5 }}>
                {editMemberId ? 'Edit Member' : 'Add New Member'}
              </Text>
              <TouchableOpacity onPress={() => { setAddModalVisible(false); setEditMemberId(null); }} style={{ backgroundColor: '#F3F4F6', padding: 6, borderRadius: 20 }}>
                <X size={20} color="#1a2d5a" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 20, fontWeight: '500' }}>
              {editMemberId ? 'Update member details below.' : `They will receive a shareable link to join ${activeChurch?.name}`}
            </Text>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Full Name</Text>
              <TextInput
                style={{ borderWidth: 1.5, borderColor: 'rgba(26,45,90,0.1)', borderRadius: 12, padding: 14, backgroundColor: '#FFFFFF', color: '#1a2d5a', fontWeight: '600' }}
                placeholder="Enter member's name"
                placeholderTextColor="#9CA3AF"
                value={newMemberForm.name}
                onChangeText={(t) => setNewMemberForm({...newMemberForm, name: t})}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Phone Number</Text>
              <TextInput
                style={{ borderWidth: 1.5, borderColor: 'rgba(26,45,90,0.1)', borderRadius: 12, padding: 14, backgroundColor: '#FFFFFF', color: '#1a2d5a', fontWeight: '600' }}
                placeholder="e.g. 9876543210"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={newMemberForm.phone}
                onChangeText={(t) => setNewMemberForm({...newMemberForm, phone: t})}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>City / Village</Text>
              <TextInput
                style={{ borderWidth: 1.5, borderColor: 'rgba(26,45,90,0.1)', borderRadius: 12, padding: 14, backgroundColor: '#FFFFFF', color: '#1a2d5a', fontWeight: '600' }}
                placeholder="Enter city or village"
                placeholderTextColor="#9CA3AF"
                value={newMemberForm.city}
                onChangeText={(t) => setNewMemberForm({...newMemberForm, city: t})}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Date of Birth (DOB)</Text>
              <TouchableOpacity
                style={{ borderWidth: 1.5, borderColor: 'rgba(26,45,90,0.1)', borderRadius: 12, padding: 14, backgroundColor: '#FFFFFF' }}
                onPress={() => setDatePickerVisibility(true)}
              >
                <Text style={{ color: newMemberForm.dob ? '#1a2d5a' : '#9CA3AF', fontWeight: '600' }}>
                  {newMemberForm.dob || 'Select Date'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Baptism Date */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Baptism Date</Text>
              <TouchableOpacity
                style={{ borderWidth: 1.5, borderColor: 'rgba(26,45,90,0.1)', borderRadius: 12, padding: 14, backgroundColor: '#FFFFFF' }}
                onPress={() => { setActiveDateField('baptismDate'); setDatePickerVisibility(true); }}
              >
                <Text style={{ color: newMemberForm.baptismDate ? '#1a2d5a' : '#9CA3AF', fontWeight: '600' }}>
                  {newMemberForm.baptismDate || 'Select Date'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Anniversary Date */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Wedding Anniversary Date</Text>
              <TouchableOpacity
                style={{ borderWidth: 1.5, borderColor: 'rgba(26,45,90,0.1)', borderRadius: 12, padding: 14, backgroundColor: '#FFFFFF' }}
                onPress={() => { setActiveDateField('anniversaryDate'); setDatePickerVisibility(true); }}
              >
                <Text style={{ color: newMemberForm.anniversaryDate ? '#1a2d5a' : '#9CA3AF', fontWeight: '600' }}>
                  {newMemberForm.anniversaryDate || 'Select Date'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Role</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                <TouchableOpacity 
                  style={{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', borderColor: newMemberForm.userType.trim().toLowerCase() === 'member' ? '#1a2d5a' : 'rgba(26,45,90,0.1)', backgroundColor: newMemberForm.userType.trim().toLowerCase() === 'member' ? '#1a2d5a' : '#FFFFFF' }}
                  onPress={() => setNewMemberForm({...newMemberForm, userType: 'member'})}
                >
                  <Text style={{ fontWeight: '800', color: newMemberForm.userType.trim().toLowerCase() === 'member' ? '#FFFFFF' : '#6B7280' }}>Member</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', borderColor: newMemberForm.userType.trim().toLowerCase() === 'admin' ? '#1a2d5a' : 'rgba(26,45,90,0.1)', backgroundColor: newMemberForm.userType.trim().toLowerCase() === 'admin' ? '#1a2d5a' : '#FFFFFF' }}
                  onPress={() => setNewMemberForm({...newMemberForm, userType: 'admin'})}
                >
                  <Text style={{ fontWeight: '800', color: newMemberForm.userType.trim().toLowerCase() === 'admin' ? '#FFFFFF' : '#6B7280' }}>Admin</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={{ backgroundColor: '#1a2d5a', padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 4, shadowColor: '#1a2d5a', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}
              onPress={handleAddMember}
              disabled={addMemberLoading}
            >
              {addMemberLoading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800', letterSpacing: 0.5, fontSize: 14 }}>{editMemberId ? 'SAVE CHANGES' : 'ADD MEMBER'}</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={(date) => {
          setDatePickerVisibility(false);
          const formatted = date.toISOString().split('T')[0];
          setNewMemberForm(prev => ({ ...prev, [activeDateField]: formatted }));
        }}
        onCancel={() => setDatePickerVisibility(false)}
        maximumDate={new Date()}
      />

      {/* Village Dropdown Modal */}
      <Modal visible={villageDropdownVisible} transparent animationType="fade" onRequestClose={() => setVillageDropdownVisible(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }} activeOpacity={1} onPress={() => setVillageDropdownVisible(false)}>
          <View style={{ width: '80%', maxHeight: '60%', backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 5 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1a2d5a', marginBottom: 12 }}>Select Village/City</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {uniqueVillages.map((v) => (
                <TouchableOpacity 
                  key={v} 
                  style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between' }}
                  onPress={() => {
                    setVillageFilter(v);
                    setVillageDropdownVisible(false);
                  }}
                >
                  <Text style={{ fontSize: 15, color: villageFilter === v ? '#1a2d5a' : '#4b5563', fontWeight: villageFilter === v ? '600' : '400' }}>
                    {v}
                  </Text>
                  {villageFilter === v && <Plus size={16} color="#1a2d5a" style={{ transform: [{ rotate: '45deg' }] }} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Header Menu Modal */}
      <Modal
        visible={headerMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setHeaderMenuVisible(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }} 
          activeOpacity={1} 
          onPress={() => setHeaderMenuVisible(false)}
        >
          <View style={{ backgroundColor: '#fff', borderRadius: 16, width: '80%', padding: 20, elevation: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1a2d5a', marginBottom: 16, textAlign: 'center' }}>Member Options</Text>
            
            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#f1f5f9', borderRadius: 12, marginBottom: 12 }} 
              onPress={() => {
                setHeaderMenuVisible(false);
                setTimeout(() => setInviteModalVisible(true), 150);
              }}
            >
              <UserPlus size={20} color="#1a2d5a" />
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1a2d5a', marginLeft: 12 }}>Add From Contacts</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#f1f5f9', borderRadius: 12 }} 
              onPress={() => {
                setHeaderMenuVisible(false);
                setTimeout(() => setAddModalVisible(true), 150);
              }}
            >
              <Plus size={20} color="#1a2d5a" />
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1a2d5a', marginLeft: 12 }}>Add Member</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

// Separate function for dynamic badge styling to keep code clean
const badgeRowStyles = (isActive: boolean) => StyleSheet.create({
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDE8DC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EDE8DC', padding: 20 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EDE8DC', padding: 20 },
  errorTxt: { fontSize: 14, color: '#c0392b', textAlign: 'center', marginBottom: 15, fontWeight: '600' },
  retryBtn: { backgroundColor: '#1a2d5a', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 100 },

  hero: {
    backgroundColor: '#1a2d5a',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 24,
    overflow: 'visible',
    position: 'relative',
    marginBottom: 6,
  },
  heroTitle: { color: '#fff', fontSize: 24, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontWeight: '600', letterSpacing: -0.5 },
  heroSub: { color: '#AEB8D4', fontSize: 13 },
  
  newBtn: { 
    backgroundColor: '#C9A84C', 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 12,
    shadowColor: '#C9A84C',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4
  },
  newBtnTxt: { color: '#1a2d5a', fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statCard: { 
    flex: 1, 
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26,45,90,0.08)',
    borderTopWidth: 3,
    borderTopColor: '#1a2d5a',
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  statVal: { fontSize: 22, fontWeight: '800' },
  statLbl: { fontSize: 10, color: '#6B7280', marginTop: 2, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  searchBarContainer: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    height: 48, 
    borderWidth: 1.5, 
    borderColor: 'rgba(26,45,90,0.1)', 
    marginBottom: 14,
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1a2d5a', fontWeight: '500' },

  filterRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 },
  filterChip: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1.5, 
    borderColor: 'rgba(26,45,90,0.1)', 
    marginRight: 8,
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1
  },
  filterChipActive: { backgroundColor: '#1a2d5a', borderColor: '#1a2d5a' },
  filterChipTxt: { fontSize: 11, fontWeight: '700', color: '#1a2d5a' },
  filterChipTxtActive: { color: '#fff' },

  membersList: { gap: 12 },
  memberCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 14, 
    borderWidth: 1, 
    borderColor: 'rgba(26,45,90,0.08)', 
    padding: 14, 
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2 
  },
  memberCardExpanded: { borderColor: '#C9A84C', borderWidth: 1.5, shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start' 
  },
  profileSection: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 12 },
  avatar: { 
    width: 48, 
    height: 48, 
    borderRadius: 12, 
    backgroundColor: '#1a2d5a', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  avatarTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  nameSection: { flexDirection: 'column', gap: 4, marginTop: 2 },
  name: { fontSize: 15, fontWeight: '800', color: '#1a2d5a' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 4 },
  
  roleBadge: { backgroundColor: '#F9F6F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#E2DDD5' },
  roleTxt: { color: '#1a2d5a', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  
  statusBadge: { backgroundColor: '#F0EBE0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusActive: { backgroundColor: '#E8F5E9' },
  statusInactive: { backgroundColor: '#FEF2F2' },
  statusTxt: { color: '#1a2d5a', fontSize: 9, fontWeight: '700' },
  
  chevronWrap: { padding: 4, marginTop: 2 },

  contactDetails: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 12, 
    marginTop: 14, 
    alignItems: 'center' 
  },
  contactRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
  contactTxt: { fontSize: 11, color: '#6B7280', fontWeight: '600' },

  expandedContent: { 
    marginTop: 14, 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(26,45,90,0.08)', 
    paddingTop: 14 
  },
  statsSubGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  subStatBox: { 
    flex: 1,
    backgroundColor: '#F9F6F0', 
    borderRadius: 10, 
    padding: 12, 
    borderWidth: 1, 
    borderColor: '#E2DDD5' 
  },
  subStatLabelRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginBottom: 6 },
  subStatLabel: { fontSize: 9, textTransform: 'uppercase', color: '#6B7280', fontWeight: '800', letterSpacing: 0.5 },
  subStatValue: { fontSize: 14, fontWeight: '800', color: '#1a2d5a' },

  promoteBtn: {
    backgroundColor: '#1a2d5a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 14,
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3
  },
  promoteBtnTxt: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3
  },

  householdHeader: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: '#374151', 
    textTransform: 'uppercase', 
    letterSpacing: 0.8, 
    marginBottom: 10, 
    marginTop: 4,
    paddingLeft: 4
  },
  householdList: { gap: 8 },
  householdItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1, 
    borderColor: 'rgba(26,45,90,0.08)', 
    borderRadius: 10, 
    padding: 12 
  },
  hiLeft: { flex: 1, gap: 4 },
  hiName: { fontSize: 13, fontWeight: '800', color: '#1a2d5a' },
  hiEmail: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  hiRight: { 
    backgroundColor: '#F0EBE0', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6 
  },
  hiRelation: { fontSize: 9, color: '#1a2d5a', fontWeight: '700' },
  emptyHouseholdTxt: { fontSize: 11, color: '#9CA3AF', fontStyle: 'italic', paddingLeft: 4 },

  footerBranding: { fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginTop: 20 }
});
