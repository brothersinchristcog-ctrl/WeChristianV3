import React, { useState, useEffect } from 'react';
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
  KeyboardAvoidingView
} from 'react-native';
import { Users, Phone, Mail, ChevronDown, ChevronUp, Clock, UserCheck, UserX, Shield, Plus, X, Trash2, Edit2 } from 'lucide-react-native';
import FirestoreService from '../../services/FirestoreService';
import { useChurch } from '../../context/ChurchContext';
import { CustomAlert, AlertButton } from '../../components/CustomAlert';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const { width } = Dimensions.get('window');

export default function AdminMembers() {
  const { activeChurch } = useChurch();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Add/Edit Member State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editMemberId, setEditMemberId] = useState<string | null>(null);
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({
    name: '',
    phone: '',
    userType: 'member',
    dob: ''
  });
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

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
    try {
      setLoading(true);
      const success = await FirestoreService.updateMemberRole(memberId, 'Admin');
      if (success) {
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, userType: 'Admin' } : m));
        setAlertConfig({
          visible: true,
          title: 'Promoted',
          message: 'Member has been promoted to Admin.',
          type: 'success',
          buttons: [{ text: 'OK', onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })) }]
        });
      } else {
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
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = (memberId: string, memberName: string) => {
    setAlertConfig({
      visible: true,
      title: 'Remove Admin Permission',
      message: `Are you sure you want to remove admin access from ${memberName}? They will be reverted to a regular member.`,
      type: 'warning',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })) },
        {
          text: 'Remove Admin',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              setAlertConfig(prev => ({ ...prev, visible: false }));
              const success = await FirestoreService.updateMemberRole(memberId, 'Member');
              if (success) {
                setMembers(prev => prev.map(m => m.id === memberId ? { ...m, userType: 'Member' } : m));
                setTimeout(() => {
                  setAlertConfig({
                    visible: true,
                    title: 'Access Removed',
                    message: `${memberName} is now a regular member.`,
                    type: 'success',
                    buttons: [{ text: 'OK', onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })) }]
                  });
                }, 500);
              } else {
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
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    });
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
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    });
  };

  // Stats calculation
  const totalMembers = members.length;
  const activeMembers = members.length; // Assuming all firebase members are active for now
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
    
    let formattedPhone = newMemberForm.phone.trim();
    if (!formattedPhone.startsWith('+')) {
       formattedPhone = `+91${formattedPhone}`;
    }

    try {
      setAddMemberLoading(true);
      
      let res;
      if (editMemberId) {
        res = await FirestoreService.adminUpdateMember(activeChurch?.id || '', editMemberId, {
          name: newMemberForm.name,
          phone: formattedPhone,
          userType: newMemberForm.userType,
          dob: newMemberForm.dob,
        });
      } else {
        res = await FirestoreService.adminAddMember(activeChurch?.id || '', {
          name: newMemberForm.name,
          phone: formattedPhone,
          userType: newMemberForm.userType,
          dob: newMemberForm.dob,
          churchId: activeChurch?.id,
        });
      }

      if (res.success) {
        setAddModalVisible(false);
        setEditMemberId(null);
        setNewMemberForm({ name: '', phone: '', userType: 'member', dob: '' });
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
                  const churchCode = (activeChurch as any)?.churchCode || '';
                  Share.share({
                    message: `Hello ${newMemberForm.name},\n\nYou have been added to "${churchName}" on WeChristian!\n\nPlease download the app here: https://play.google.com/store/apps/details?id=com.wechristian.app\n\nOnce downloaded, sign in with your phone number. If asked, use Church Code: ${churchCode}`,
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

  const filteredMembers = members.filter(m => {
    // Map Firebase schema fields
    const nameStr = (m.name || m.firstName || '').toLowerCase();
    const emailStr = (m.email || '').toLowerCase();
    const phoneStr = m.phone || '';
    
    const matchesSearch = 
      nameStr.includes(searchQuery.toLowerCase()) ||
      emailStr.includes(searchQuery.toLowerCase()) ||
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
        
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Church Members</Text>
            <Text style={styles.subtitle}>Directory & Status Tracking</Text>
          </View>
          <TouchableOpacity 
            style={[styles.headerIconCircle, { width: 'auto', paddingHorizontal: 16, flexDirection: 'row', gap: 6, borderRadius: 20 }]}
            onPress={() => setAddModalVisible(true)}
          >
            <Plus size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Add Member</Text>
          </TouchableOpacity>
        </View>

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
        <View style={styles.searchBarContainer}>
          <TextInput
            placeholder="Search by name, email, or phone..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
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
        </View>

        {/* Member Cards List */}
        <View style={styles.membersList}>
          {filteredMembers.map((member) => {
            const isExpanded = expandedId === member.id;
            const associated = member.accountId
              ? members.filter(m => m.accountId === member.accountId && m.id !== member.id)
              : [];
            const isActive = true; // Placeholder for future active/inactive flag in Firebase
            const displayName = (`${member.firstName || ''} ${member.lastName || ''}`.trim()) || member.name || 'Unknown';
            const displayRole = member.userType || 'member';

            return (
              <View 
                key={member.id} 
                style={[styles.memberCard, isExpanded && styles.memberCardExpanded]}
              >
                <TouchableOpacity 
                  style={styles.cardHeader} 
                  activeOpacity={0.7}
                  onPress={() => handleToggleExpand(member.id)}
                >
                  <View style={styles.profileSection}>
                    {member.profilePhoto ? (
                      <View style={styles.avatar}>
                        <Text style={styles.avatarTxt}>{getInitials(displayName)}</Text>
                        {/* Placeholder for actual image if needed */}
                      </View>
                    ) : (
                      <View style={styles.avatar}>
                        <Text style={styles.avatarTxt}>{getInitials(displayName)}</Text>
                      </View>
                    )}
                    <View style={styles.nameSection}>
                      <Text style={styles.name}>{displayName}</Text>
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    {isExpanded && (
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation();
                          setEditMemberId(member.id);
                          setNewMemberForm({
                            name: member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim(),
                            phone: member.phone || '',
                            userType: member.userType || 'member',
                            dob: member.dob || ''
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
                  <View style={styles.contactRow}>
                    <Phone size={12} color="#6B7280" />
                    <Text style={styles.contactTxt}>{member.phone || 'No Phone'}</Text>
                  </View>
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
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <View style={{ flex: 1 }}>
                        {member.userType?.toLowerCase() === 'super_admin' || member.userType?.toLowerCase() === 'super admin' ? (
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

                      {member.userType?.toLowerCase() !== 'super_admin' && member.userType?.toLowerCase() !== 'super admin' && (
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
                        associated.map((assoc) => (
                          <View key={assoc.id} style={styles.householdItem}>
                            <View style={styles.hiLeft}>
                              <Text style={styles.hiName}>{(`${assoc.firstName || ''} ${assoc.lastName || ''}`.trim()) || assoc.name}</Text>
                              <Text style={styles.hiEmail}>{assoc.email || assoc.phone || 'No contact details'}</Text>
                            </View>
                            <View style={styles.hiRight}>
                              <Text style={styles.hiRelation}>{assoc.userType || 'Member'}</Text>
                            </View>
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

      {/* Add/Edit Member Modal */}
      <Modal visible={addModalVisible} transparent animationType="fade" onRequestClose={() => { setAddModalVisible(false); setEditMemberId(null); }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: width * 0.9, backgroundColor: '#fff', borderRadius: 16, padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#1a2d5a' }}>
                {editMemberId ? 'Edit Member' : 'Add New Member'}
              </Text>
              <TouchableOpacity onPress={() => { setAddModalVisible(false); setEditMemberId(null); }}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>
              {editMemberId ? 'Update member details below.' : `They will receive a shareable link to join ${activeChurch?.name}`}
            </Text>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 }}>Full Name</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, backgroundColor: '#F9FAFB', color: '#111827' }}
                placeholder="Enter member's name"
                value={newMemberForm.name}
                onChangeText={(t) => setNewMemberForm({...newMemberForm, name: t})}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 }}>Phone Number</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, backgroundColor: '#F9FAFB', color: '#111827' }}
                placeholder="e.g. 9876543210"
                keyboardType="phone-pad"
                value={newMemberForm.phone}
                onChangeText={(t) => setNewMemberForm({...newMemberForm, phone: t})}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 }}>Date of Birth (DOB)</Text>
              <TouchableOpacity
                style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, backgroundColor: '#F9FAFB' }}
                onPress={() => setDatePickerVisibility(true)}
              >
                <Text style={{ color: newMemberForm.dob ? '#111827' : '#9CA3AF' }}>
                  {newMemberForm.dob || 'Select Date'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 }}>Role</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity 
                  style={{ flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center', borderColor: newMemberForm.userType.toLowerCase() === 'member' ? '#1a2d5a' : '#E5E7EB', backgroundColor: newMemberForm.userType.toLowerCase() === 'member' ? '#F0F9FF' : '#fff' }}
                  onPress={() => setNewMemberForm({...newMemberForm, userType: 'member'})}
                >
                  <Text style={{ fontWeight: '600', color: newMemberForm.userType.toLowerCase() === 'member' ? '#1a2d5a' : '#6B7280' }}>Member</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center', borderColor: newMemberForm.userType.toLowerCase() === 'admin' ? '#1a2d5a' : '#E5E7EB', backgroundColor: newMemberForm.userType.toLowerCase() === 'admin' ? '#F0F9FF' : '#fff' }}
                  onPress={() => setNewMemberForm({...newMemberForm, userType: 'admin'})}
                >
                  <Text style={{ fontWeight: '600', color: newMemberForm.userType.toLowerCase() === 'admin' ? '#1a2d5a' : '#6B7280' }}>Admin</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={{ backgroundColor: '#1a2d5a', padding: 14, borderRadius: 8, alignItems: 'center' }}
              onPress={handleAddMember}
              disabled={addMemberLoading}
            >
              {addMemberLoading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>{editMemberId ? 'Save Changes' : 'Add Member'}</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={(date) => {
          setDatePickerVisibility(false);
          setNewMemberForm({...newMemberForm, dob: date.toISOString().split('T')[0]});
        }}
        onCancel={() => setDatePickerVisibility(false)}
        maximumDate={new Date()}
      />

    </View>
  );
}

// Separate function for dynamic badge styling to keep code clean
const badgeRowStyles = (isActive: boolean) => StyleSheet.create({
  badgeRow: { flexDirection: 'row', gap: 6, alignItems: 'center' }
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f7' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f7', padding: 20 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f7', padding: 20 },
  errorTxt: { fontSize: 14, color: '#c0392b', textAlign: 'center', marginBottom: 15, fontWeight: '600' },
  retryBtn: { backgroundColor: '#1a2d5a', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
  scroll: { padding: 16 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#c0392b', 
    paddingBottom: 10 
  },
  title: { fontSize: 16, fontWeight: '700', color: '#1a2d5a' },
  subtitle: { fontSize: 10, color: '#9CA3AF' },
  headerIconCircle: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: '#1a2d5a', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  statCard: { 
    flex: 1, 
    backgroundColor: '#fff', 
    borderRadius: 8, 
    paddingVertical: 15, 
    alignItems: 'center', 
    borderWidth: 0.5, 
    borderColor: '#e5e7eb' 
  },
  statVal: { fontSize: 24, fontWeight: '700' },
  statLbl: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },

  searchBarContainer: { 
    backgroundColor: '#fff', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    height: 44, 
    justifyContent: 'center', 
    borderWidth: 0.5, 
    borderColor: '#d1d5db', 
    marginBottom: 12 
  },
  searchInput: { fontSize: 14, color: '#111827' },

  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 15 },
  filterChip: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: '#E5E7EB', 
    borderWidth: 0.5, 
    borderColor: '#D1D5DB' 
  },
  filterChipActive: { backgroundColor: '#1a2d5a', borderColor: '#1a2d5a' },
  filterChipTxt: { fontSize: 11, fontWeight: '600', color: '#374151' },
  filterChipTxtActive: { color: '#fff' },

  membersList: { gap: 10 },
  memberCard: { 
    backgroundColor: '#fff', 
    borderRadius: 10, 
    padding: 15, 
    borderWidth: 0.5, 
    borderColor: '#e5e7eb' 
  },
  memberCardExpanded: { borderColor: '#1a2d5a', borderWidth: 1 },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  profileSection: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#1a2d5a', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  avatarTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
  nameSection: { flexDirection: 'column', gap: 2 },
  name: { fontSize: 14, fontWeight: '700', color: '#111827' },
  badgeRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  roleBadge: { 
    backgroundColor: '#EFF6FF', 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 4 
  },
  roleTxt: { fontSize: 9, color: '#1a2d5a', fontWeight: '700' },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusActive: { backgroundColor: '#F0FDF4' },
  statusInactive: { backgroundColor: '#FEF2F2' },
  statusTxt: { fontSize: 9, fontWeight: '700', color: '#1a2d5a' },
  chevronWrap: { padding: 4 },

  contactDetails: { 
    marginTop: 10, 
    borderTopWidth: 0.5, 
    borderTopColor: '#f3f4f6', 
    paddingTop: 10, 
    gap: 6 
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contactTxt: { fontSize: 12, color: '#4B5563' },

  expandedContent: { 
    marginTop: 12, 
    borderTopWidth: 0.5, 
    borderTopColor: '#e5e7eb', 
    paddingTop: 12 
  },
  statsSubGrid: { gap: 10, marginBottom: 12 },
  subStatBox: { 
    backgroundColor: '#f8fafc', 
    borderRadius: 8, 
    padding: 10, 
    borderWidth: 0.5, 
    borderColor: '#e5e7eb' 
  },
  subStatLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  subStatLabel: { fontSize: 9, textTransform: 'uppercase', color: '#6B7280', fontWeight: '700' },
  subStatValue: { fontSize: 12, fontWeight: '700', color: '#1e293b' },

  promoteBtn: {
    backgroundColor: '#1a2d5a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  promoteBtnTxt: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700'
  },

  householdHeader: { 
    fontSize: 10, 
    fontWeight: '800', 
    color: '#1a2d5a', 
    textTransform: 'uppercase', 
    letterSpacing: 0.5, 
    marginBottom: 8, 
    marginTop: 4 
  },
  householdList: { gap: 6 },
  householdItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#f9fafb', 
    borderWidth: 0.5, 
    borderColor: '#e5e7eb', 
    borderRadius: 6, 
    padding: 8 
  },
  hiLeft: { flex: 1, gap: 2 },
  hiName: { fontSize: 12, fontWeight: '700', color: '#111827' },
  hiEmail: { fontSize: 10, color: '#6B7280' },
  hiRight: { 
    backgroundColor: '#E5E7EB', 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 4 
  },
  hiRelation: { fontSize: 9, color: '#374151', fontWeight: '600' },
  emptyHouseholdTxt: { fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' },

  footerBranding: { fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginTop: 20 }
});
