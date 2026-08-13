import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Platform,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  Image,
  Switch
} from 'react-native';
import { 
  ChevronRight, 
  LogOut, 
  User, 
  Bell, 
  Moon, 
  Heart, 
  CreditCard,
  Globe,
  Check,
  X,
  CheckCircle2,
  HelpCircle,
  MapPin,
  Crown,
  Award,
  Shield
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import FirestoreService, { AppMember } from '../services/FirestoreService';
import { useChurch } from '../context/ChurchContext';
import SecurityService from '../services/SecurityService';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { Lock } from 'lucide-react-native';
import storage from '@react-native-firebase/storage';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation }: any) {
  const { user, signOut, member: authMember, setViewMode, setMember: setGlobalMember } = useAuth();
  const { activeChurch } = useChurch();
  const { isDark, toggleTheme, colors } = useTheme();
  
  const [member, setMember] = useState<AppMember | null>(authMember as AppMember | null);
  const [loading, setLoading] = useState(!authMember);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [isNotifyModalVisible, setIsNotifyModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('Telugu');
  const [localPhotoUrl, setLocalPhotoUrl] = useState<string | null>(null);
  
  // Notification States
  const [dailyPromiseNotify, setDailyPromiseNotify] = useState(true);
  const [newSermonNotify, setNewSermonNotify] = useState(true);
  const [eventReminderNotify, setEventReminderNotify] = useState(true);
  const [prayerNotify, setPrayerNotify] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: authMember?.firstName || '',
    lastName: authMember?.lastName || '',
    email: authMember?.email || '',
    mailingCity: authMember?.mailingCity || '',
    mailingStreet: authMember?.mailingStreet || '',
    mailingState: authMember?.mailingState || ''
  });
  const [updating, setUpdating] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  
  // Custom Alert Modals
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{title: string, message: string, onConfirm: () => Promise<void>, isDestructive?: boolean}>({ title: '', message: '', onConfirm: async () => {}, isDestructive: false });

  const fetchProfileData = async () => {
    try {
      if (user?.phoneNumber) {
        const contactCheck = await FirestoreService.checkContactExists(user.phoneNumber);
        if (contactCheck?.exists && contactCheck.member) {
          setMember(contactCheck.member);
          if (setGlobalMember) {
            setGlobalMember(contactCheck.member);
          }
          setEditForm({
            firstName: contactCheck.member.firstName || '',
            lastName: contactCheck.member.lastName || '',
            email: contactCheck.member.email || '',
            mailingCity: contactCheck.member.mailingCity || '',
            mailingStreet: contactCheck.member.mailingStreet || '',
            mailingState: contactCheck.member.mailingState || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!member) return;
    setUpdating(true);
    try {
      const updatedDetails = {
        ...editForm,
        name: `${editForm.firstName || ''} ${editForm.lastName || ''}`.trim()
      };
      await FirestoreService.updateMemberProfile(member.churchId || activeChurch?.id || '', member.id, updatedDetails);
      if (user) {
        await user.updateProfile({ displayName: updatedDetails.name });
      }
      setIsEditModalVisible(false);
      setSuccessMessage('Your personal details (Name, Email, and Address) have been updated directly in your church record.');
      setTimeout(() => setSuccessModalVisible(true), 300);
      fetchProfileData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedUri = result.assets[0].uri;
      
      setConfirmConfig({
        title: 'Confirm Photo',
        message: 'Do you want to set this cropped image as your profile photo?',
        isDestructive: false,
        onConfirm: async () => {
          try {
            setUpdating(true);
            if (user) {
              // Upload to Firebase Storage
              const reference = storage().ref(`profile_photos/${user.uid}/profile_${Date.now()}.jpg`);
              await reference.putFile(selectedUri);
              const downloadUrl = await reference.getDownloadURL();

              setLocalPhotoUrl(downloadUrl);
              
              await user.updateProfile({
                photoURL: downloadUrl
              });
              
              // Sync the photo URL to the Firestore member document so admins can see it
              if (member && (member.churchId || activeChurch?.id)) {
                await FirestoreService.updateMemberProfile(member.churchId || activeChurch?.id || '', member.id, {
                  profilePhoto: downloadUrl,
                  photoRemoved: false
                });
              }

              setConfirmModalVisible(false);
              setSuccessMessage('Profile photo updated successfully!');
              setTimeout(() => setSuccessModalVisible(true), 300);
            }
          } catch (error: any) {
            Alert.alert('Error', 'Failed to update photo: ' + error.message);
          } finally {
            setUpdating(false);
          }
        }
      });
      setConfirmModalVisible(true);
    }
  };

  const handleRemovePhoto = async () => {
    setConfirmConfig({
      title: 'Remove Photo',
      message: 'Are you sure you want to remove your profile photo?',
      isDestructive: true,
      onConfirm: async () => {
        try {
          setUpdating(true);
          if (user) {
            setLocalPhotoUrl(null);
            await user.updateProfile({
              photoURL: null as any
            });

            // Sync the removal to the Firestore member document
            if (member && (member.churchId || activeChurch?.id)) {
              await FirestoreService.updateMemberProfile(member.churchId || activeChurch?.id || '', member.id, {
                profilePhoto: null,
                photoURL: null,
                photoUrl: null,
                profileImageUrl: null,
                PhotoUrl: null,
                Photo: null,
                photoRemoved: true
              });
            }

            setConfirmModalVisible(false);
            setSuccessMessage('Profile photo removed successfully.');
            setTimeout(() => setSuccessModalVisible(true), 300);
          }
        } catch (error: any) {
          Alert.alert('Error', 'Failed to remove photo: ' + error.message);
        } finally {
          setUpdating(false);
        }
      }
    });
    setConfirmModalVisible(true);
  };

    useEffect(() => {
      fetchProfileData();
      checkBiometrics();
    }, [user]);

    useEffect(() => {
      const m: any = member;
      let dbPhoto = null;
      if (m) {
        if (m.photoRemoved || m.profilePhoto === null) {
          dbPhoto = null;
        } else {
          dbPhoto = m.profilePhoto || m.photoURL || m.photoUrl || m.profileImageUrl || m.PhotoUrl || m.Photo;
        }
      }
      
      if (member) {
        setLocalPhotoUrl(dbPhoto || null);
      } else {
        setLocalPhotoUrl(user?.photoURL || null);
      }
    }, [user, member]);

  const checkBiometrics = async () => {
    const available = await SecurityService.isBiometricAvailable();
    const enabled = await SecurityService.isBiometricEnabled();
    setBiometricAvailable(available);
    setBiometricEnabled(enabled);
  };

  const toggleBiometrics = async (val: boolean) => {
    if (val) {
      const success = await SecurityService.authenticate(activeChurch?.name);
      if (success) {
        await SecurityService.setBiometricPreference(true);
        setBiometricEnabled(true);
      } else {
        setBiometricEnabled(false);
      }
    } else {
      await SecurityService.setBiometricPreference(false);
      setBiometricEnabled(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfileData();
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name[0].toUpperCase();
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: '#1a2d5a' }]}>
        <ActivityIndicator size="large" color="#FCD34D" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />
      
      {/* ── Hero Section (Navy) ── */}
      <View style={styles.heroSection}>
        <View style={styles.headerTop}>
          <View style={{ width: 40 }} />
          <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
             <Text style={styles.themeToggleText}>{isDark ? '🌙 Dark' : '☀️ Light'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.avatarContainer}>
          {localPhotoUrl ? (
            <Image source={{ uri: localPhotoUrl }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarCircle}>
               <User size={45} color="#fff" strokeWidth={1.5} />
            </View>
          )}
          <View style={styles.verifiedBadge}>
            <Text style={{ fontSize: 10 }}>✨</Text>
          </View>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{member?.firstName ? `${member.firstName} ${member.lastName || ''}` : member?.name || user?.displayName || 'Beloved Member'}</Text>
          <Text style={styles.userSub}>
            {activeChurch?.name || 'Church'}{member?.mailingCity ? `, ${member.mailingCity}` : ''}
          </Text>
          <Text style={[styles.userSub, { marginTop: 2, marginBottom: 8 }]}>
            Member since {member?.joinDate ? new Date(member.joinDate).getFullYear() : '2026'}
          </Text>
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#3b82f6' }]}>
                <Award size={14} color="#fff" strokeWidth={2.5} />
              </View>
              <View style={styles.statTextCol}>
                <Text style={styles.statLabel}>Membership</Text>
                <Text style={styles.statValue} numberOfLines={1}>Free Trial</Text>
              </View>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#10b981' }]}>
                <Globe size={14} color="#fff" strokeWidth={2.5} />
              </View>
              <View style={styles.statTextCol}>
                <Text style={styles.statLabel}>Language</Text>
                <Text style={styles.statValue} numberOfLines={1}>Telugu</Text>
              </View>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#8b5cf6' }]}>
                <Crown size={14} color="#fff" strokeWidth={2.5} />
              </View>
              <View style={styles.statTextCol}>
                <Text style={styles.statLabel}>Role</Text>
                <Text style={styles.statValue} numberOfLines={1}>
                  {(member?.userType || 'MEMBER').toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a2d5a" />}
      >
        {/* Stats removed for accuracy */}

        {/* ── Account Section ── */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.menuGroup}>
          {(String(member?.userType || '').toUpperCase().includes('ADMIN') || String(member?.userType || '').toUpperCase().includes('SUPER')) && (
            <MenuItem 
              icon={<Shield size={20} color="#1a2d5a" />} 
              iconBg="#e6f0fa"
              title="Admin Dashboard" 
              sub="Access church management tools" 
              onPress={() => setViewMode('admin')}
            />
          )}
          <MenuItem 
            icon={<User size={20} color="#1a2d5a" />} 
            iconBg="#eff6ff"
            title="My profile" 
            sub="Edit name, photo, address" 
            onPress={() => setIsEditModalVisible(true)}
          />
          <MenuItem 
            icon={<CreditCard size={20} color="#94a3b8" />} 
            iconBg="#f1f5f9"
            title="Giving history" 
            sub="Available Soon" 
            onPress={() => {
              setInfoMessage('Online donations via the app are coming soon. Please contact the church administration for offline donation options.');
              setInfoModalVisible(true);
            }}
          />
          <MenuItem 
            icon={<Heart size={20} color="#7c3aed" />} 
            iconBg="#f5f3ff"
            title="My prayer requests" 
            sub="View & manage your requests" 
            onPress={() => {
              navigation.navigate('PrayerWall');
            }}
          />
          <MenuItem 
            icon={<CreditCard size={20} color="#d97706" />} 
            iconBg="#fffbeb"
            title="Subscription" 
            sub="Manage your plan and billing" 
            isLast 
            onPress={() => {
              navigation.navigate('Subscription');
            }}
          />
        </View>

        {/* ── Settings Section ── */}
        <Text style={styles.sectionLabel}>SETTINGS</Text>
        <View style={styles.menuGroup}>
          <MenuItem 
            icon={<Bell size={20} color="#0891b2" />} 
            iconBg="#eff6ff"
            title="Notifications" 
            sub="Manage your preferences" 
            onPress={() => {
              setIsLanguageModalVisible(false);
              setIsNotifyModalVisible(true);
            }}
          />
          <MenuItem 
            icon={<Globe size={20} color="#166534" />} 
            iconBg="#f0fdf4"
            title="Language" 
            sub={`${selectedLanguage} (selected)`} 
            onPress={() => {
              setIsNotifyModalVisible(false); // Close other modal
              setIsLanguageModalVisible(true);
            }}
          />
          <MenuItem 
            icon={<Moon size={20} color="#d97706" />} 
            iconBg="#fffbeb"
            title="Dark mode" 
            sub={`Currently: ${isDark ? 'Dark' : 'Light'}`} 
            isLast 
            onPress={toggleTheme}
          />
        </View>

        {/* ── Security Section ── */}
        {biometricAvailable && (
          <>
            <Text style={styles.sectionLabel}>SECURITY</Text>
            <View style={styles.menuGroup}>
              <View style={[styles.menuItem, { borderBottomWidth: 0 }]}>
                <View style={[styles.iconBox, { backgroundColor: '#fdf2f2' }]}>
                  <Lock size={20} color="#c0392b" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Biometric Lock</Text>
                  <Text style={styles.menuSub}>Fingerprint / Face ID</Text>
                </View>
                <Switch 
                  value={biometricEnabled} 
                  onValueChange={toggleBiometrics}
                  trackColor={{ false: '#e2e8f0', true: '#1a2d5a' }}
                />
              </View>
            </View>
          </>
        )}

        {/* ── Support ── */}
        <Text style={styles.sectionLabel}>SUPPORT</Text>
        <View style={styles.menuGroup}>
          <MenuItem 
            icon={<LogOut size={20} color="#c0392b" />} 
            iconBg="#fff1f2"
            title="Sign out" 
            sub="Securely exit your account" 
            isLast 
            onPress={signOut}
          />
        </View>

        <Text style={styles.versionTxt}>Version {Constants.expoConfig?.version || '1.0.0'}</Text>
      </ScrollView>

      {/* ── Edit Profile Modal (Using View for better reliability) ── */}
      {isEditModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Text style={styles.closeText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              <View style={styles.photoEditSection}>
                <View style={styles.modalAvatarCircle}>
                   {localPhotoUrl ? (
                     <Image source={{ uri: localPhotoUrl }} style={styles.modalAvatarImg} />
                   ) : (
                     <User size={40} color="#fff" strokeWidth={1.5} />
                   )}
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
                  <TouchableOpacity style={styles.changePhotoBtn} onPress={pickImage}>
                    <Text style={styles.changePhotoText}>Change Photo</Text>
                  </TouchableOpacity>
                  {localPhotoUrl ? (
                    <TouchableOpacity style={styles.removePhotoBtn} onPress={handleRemovePhoto}>
                      <Text style={styles.removePhotoText}>Remove Photo</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput 
                  style={styles.input}
                  value={editForm.firstName}
                  onChangeText={(t) => setEditForm({...editForm, firstName: t})}
                  placeholder="First Name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput 
                  style={styles.input}
                  value={editForm.lastName}
                  onChangeText={(t) => setEditForm({...editForm, lastName: t})}
                  placeholder="Last Name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput 
                  style={styles.input}
                  value={editForm.email}
                  onChangeText={(t) => setEditForm({...editForm, email: t})}
                  placeholder="Email"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number (Managed by Auth)</Text>
                <TextInput 
                  style={[styles.input, { backgroundColor: '#f1f5f9', color: '#64748b' }]}
                  value={user?.phoneNumber || ''}
                  editable={false}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>City</Text>
                  <TextInput 
                    style={styles.input}
                    value={editForm.mailingCity}
                    onChangeText={(t) => setEditForm({...editForm, mailingCity: t})}
                    placeholder="City"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                  <Text style={styles.inputLabel}>State</Text>
                  <TextInput 
                    style={styles.input}
                    value={editForm.mailingState}
                    onChangeText={(t) => setEditForm({...editForm, mailingState: t})}
                    placeholder="State"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Street Address</Text>
                <TextInput 
                  style={styles.input}
                  value={editForm.mailingStreet}
                  onChangeText={(t) => setEditForm({...editForm, mailingStreet: t})}
                  placeholder="Street"
                  multiline
                />
              </View>

              <TouchableOpacity 
                style={[styles.saveBtn, updating && { opacity: 0.7 }]} 
                onPress={handleUpdateProfile}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Update My Profile</Text>
                )}
              </TouchableOpacity>
              
              <View style={{ height: 60 }} />
            </ScrollView>
          </View>
        </View>
      )}

      {/* ── Language Selection Modal ── */}
      {isLanguageModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheetContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity onPress={() => setIsLanguageModalVisible(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.langList}>
              {[
                { id: 'en', name: 'English', native: 'English' },
                { id: 'te', name: 'Telugu', native: 'తెలుగు' }
              ].map((lang) => (
                <TouchableOpacity 
                  key={lang.id}
                  style={[
                    styles.langItem, 
                    selectedLanguage === lang.name && styles.langItemActive
                  ]}
                  onPress={() => {
                    setSelectedLanguage(lang.name);
                    setTimeout(() => setIsLanguageModalVisible(false), 300);
                  }}
                >
                  <View>
                    <Text style={[
                      styles.langName,
                      selectedLanguage === lang.name && styles.langTextActive
                    ]}>{lang.name}</Text>
                    <Text style={styles.langNative}>{lang.native}</Text>
                  </View>
                  {selectedLanguage === lang.name && (
                    <Check size={20} color="#1a2d5a" />
                  )}
                </TouchableOpacity>
              ))}
              <View style={{ height: 20 }} />
            </View>
          </View>
        </View>
      )}

      {/* ── Notification Preferences Modal ── */}
      {isNotifyModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheetContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notification Preferences</Text>
              <TouchableOpacity onPress={() => setIsNotifyModalVisible(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.notifyList}>
              <View style={styles.notifyItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifyName}>Daily Promise</Text>
                  <Text style={styles.notifyDesc}>Receive a blessed verse every morning</Text>
                </View>
                <Switch 
                  value={dailyPromiseNotify} 
                  onValueChange={setDailyPromiseNotify}
                  trackColor={{ false: '#e2e8f0', true: '#1a2d5a' }}
                />
              </View>

              <View style={styles.notifyItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifyName}>New Sermons</Text>
                  <Text style={styles.notifyDesc}>Alert when a new video is uploaded</Text>
                </View>
                <Switch 
                  value={newSermonNotify} 
                  onValueChange={setNewSermonNotify}
                  trackColor={{ false: '#e2e8f0', true: '#1a2d5a' }}
                />
              </View>

              <View style={styles.notifyItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifyName}>Event Reminders</Text>
                  <Text style={styles.notifyDesc}>Notifications for upcoming events</Text>
                </View>
                <Switch 
                  value={eventReminderNotify} 
                  onValueChange={setEventReminderNotify}
                  trackColor={{ false: '#e2e8f0', true: '#1a2d5a' }}
                />
              </View>

              <View style={styles.notifyItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifyName}>Prayer Updates</Text>
                  <Text style={styles.notifyDesc}>Alerts when your prayer is answered (Do Not Disturb)</Text>
                </View>
                <Switch 
                  value={prayerNotify} 
                  onValueChange={setPrayerNotify}
                  trackColor={{ false: '#e2e8f0', true: '#1a2d5a' }}
                />
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Success Modal */}
      <Modal visible={successModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 32, width: '100%', alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <CheckCircle2 size={32} color="#16a34a" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 8 }}>Success!</Text>
            <Text style={{ fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
              {successMessage}
            </Text>
            <TouchableOpacity 
              style={{ backgroundColor: '#1a2d5a', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 24, width: '100%', alignItems: 'center' }}
              onPress={() => setSuccessModalVisible(false)}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Awesome</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Info / Coming Soon Modal */}
      <Modal visible={infoModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 32, width: '100%', alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <HelpCircle size={32} color="#0284c7" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 8 }}>Coming Soon!</Text>
            <Text style={{ fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
              {infoMessage}
            </Text>
            <TouchableOpacity 
              style={{ backgroundColor: '#0284c7', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 24, width: '100%', alignItems: 'center' }}
              onPress={() => setInfoModalVisible(false)}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Confirm Modal */}
      <Modal visible={confirmModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 32, width: '100%', alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: confirmConfig.isDestructive ? '#fee2e2' : '#e0e7ff', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <HelpCircle size={32} color={confirmConfig.isDestructive ? '#ef4444' : '#4f46e5'} />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 8 }}>{confirmConfig.title}</Text>
            <Text style={{ fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 28, lineHeight: 22 }}>
              {confirmConfig.message}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, width: '100%' }}>
              <TouchableOpacity 
                style={{ flex: 1, backgroundColor: '#f1f5f9', paddingVertical: 14, borderRadius: 24, alignItems: 'center' }}
                onPress={() => setConfirmModalVisible(false)}
                disabled={updating}
              >
                <Text style={{ color: '#64748b', fontSize: 15, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ flex: 1, backgroundColor: confirmConfig.isDestructive ? '#ef4444' : '#1a2d5a', paddingVertical: 14, borderRadius: 24, alignItems: 'center' }}
                onPress={() => confirmConfig.onConfirm()}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>{confirmConfig.isDestructive ? 'Remove' : 'Confirm'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MenuItem({ icon, iconBg, title, sub, isLast, onPress }: any) {
  return (
    <TouchableOpacity 
      style={[styles.menuItem, isLast && { borderBottomWidth: 0 }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSub}>{sub}</Text>
      </View>
      <ChevronRight size={16} color="#cbd5e1" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Hero Section
  heroSection: { 
    backgroundColor: '#1a2d5a', 
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 45), 
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center'
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, alignItems: 'center', alignSelf: 'stretch' },
  themeToggle: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  themeToggleText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  avatarContainer: { alignItems: 'center', marginTop: 10 },
  avatarCircle: { 
    width: 90, height: 90, borderRadius: 45, backgroundColor: '#c0392b', 
    justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#FCD34D' 
  },
  avatarImg: { width: 90, height: 90, borderRadius: 45, borderWidth: 4, borderColor: '#FCD34D' },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '800' },
  verifiedBadge: { 
    position: 'absolute', 
    bottom: 0, 
    right: -5, 
    backgroundColor: '#FCD34D', 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: '#1a2d5a',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3
  },

  userInfo: { alignItems: 'center', marginTop: 15 },
  userName: { fontSize: 22, fontWeight: '800', color: '#fff' },
  userSub: { fontSize: 12, color: '#aac4e8', marginTop: 4 },
  
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 15 },
  badge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeActive: { backgroundColor: 'rgba(252,211,77,0.2)' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 20,
    width: '100%'
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  statIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
  statTextCol: {
    justifyContent: 'center',
    flex: 1
  },
  statLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2
  },
  statValue: {
    color: '#cbd5e1',
    fontSize: 9,
    fontWeight: '500'
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 10
  },

  scrollContent: { paddingBottom: 150 },

  // Menu List
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.8, marginHorizontal: 25, marginTop: 25, marginBottom: 12 },
  menuGroup: { backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  iconBox: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  menuSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },

  // Modal
  modalOverlay: { 
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end', 
    zIndex: 1000 
  },
  modalContent: { 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    height: '85%',
    padding: 24, 
    zIndex: 1001,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10
  },
  bottomSheetContent: {
    backgroundColor: '#fff', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    padding: 24, 
    paddingBottom: 120, // Keep this high to clear the tab bar
    zIndex: 1001,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1a2d5a' },
  closeText: { color: '#ef4444', fontWeight: '700' },
  modalScroll: { flex: 1 },
  
  photoEditSection: { alignItems: 'center', marginBottom: 30, backgroundColor: '#f8fafc', padding: 20, borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1' },
  modalAvatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#c0392b', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  modalAvatarImg: { width: 80, height: 80, borderRadius: 40 },
  modalAvatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  changePhotoBtn: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#1a2d5a' },
  changePhotoText: { color: '#1a2d5a', fontSize: 12, fontWeight: '700' },
  removePhotoBtn: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ef4444' },
  removePhotoText: { color: '#ef4444', fontSize: 12, fontWeight: '700' },

  inputGroup: { marginBottom: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 8, marginLeft: 4 },
  input: { 
    backgroundColor: '#f8fafc', 
    borderWidth: 1.5, 
    borderColor: '#e2e8f0', 
    borderRadius: 15, 
    padding: 15, 
    fontSize: 15, 
    color: '#1e293b' 
  },
  saveBtn: { 
    backgroundColor: '#1a2d5a', 
    padding: 18, 
    borderRadius: 15, 
    alignItems: 'center', 
    marginTop: 10,
    marginBottom: 40,
    elevation: 4,
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  versionTxt: { textAlign: 'center', fontSize: 11, color: '#cbd5e1', marginTop: 40 },

  // Language Modal
  langList: { gap: 12 },
  langItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 18, 
    borderRadius: 15, 
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0'
  },
  langItemActive: { 
    backgroundColor: '#eff6ff', 
    borderColor: '#1a2d5a' 
  },
  langName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  langTextActive: { color: '#1a2d5a' },
  langNative: { fontSize: 12, color: '#64748b', marginTop: 2 },

  // Notification Modal
  notifyList: { gap: 16 },
  notifyItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 8 
  },
  notifyName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  notifyDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },
});
