import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Alert, SafeAreaView, Platform, Linking, TextInput } from 'react-native';
import { X, Shield, Calendar, Smartphone, Globe, Music, BookOpen, Heart, MessageCircle, Mail, Phone, Edit2, MapPin, Users, Trash2, Download } from 'lucide-react-native';
import auth from '@react-native-firebase/auth';
import { firestore } from '../../services/firebaseConfig';
import ChurchService, { ChurchDetails } from '../../services/ChurchService';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { documentDirectory, copyAsync } from 'expo-file-system/legacy';

interface Props {
  visible: boolean;
  onClose: () => void;
  churchId: string | null;
  onUpdated: () => void;
}

export default function SuperAdminChurchManager({ visible, onClose, churchId, onUpdated }: Props) {
  const [church, setChurch] = useState<ChurchDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isStartDatePickerVisible, setStartDatePickerVisibility] = useState(false);
  const [isEditDateModalVisible, setEditDateModalVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success' as 'success' | 'error'
  });
  const [availableTiers, setAvailableTiers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'members'>('details');
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [editForm, setEditForm] = useState({
    visible: false,
    tier: '',
    customTier: '',
    contactEmail: '',
    secondaryEmail: '',
    contactPhone: '',
    secondaryPhone: '',
  });
  const [memberEditForm, setMemberEditForm] = useState({
    visible: false,
    id: '',
    name: '',
    phone: '',
    email: '',
    userType: 'member',
  });
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  const showCustomAlert = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    setAlertConfig({ visible: true, title, message, type });
  };

  useEffect(() => {
    if (visible && churchId) {
      loadChurch();
      setActiveTab('details'); // Reset tab when reopening
      setMembers([]); // Clear members for new church
      setMemberSearchQuery(''); // Reset search
    }
  }, [visible, churchId]);

  useEffect(() => {
    if (activeTab === 'members' && churchId && members.length === 0) {
      loadMembers();
    }
  }, [activeTab, churchId]);

  const loadMembers = async () => {
    if (!churchId) return;
    setLoadingMembers(true);
    try {
      const snap = await firestore().collection('churches').doc(churchId).collection('members').get();
      const rawMembers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Deduplicate members by phone or email, preferring the one with app installed
      const uniqueMembersMap = new Map();
      rawMembers.forEach((m: any) => {
        const key = m.phone || m.email || (m.name + m.id); // fallback to unique key
        
        if (uniqueMembersMap.has(key)) {
          const existing = uniqueMembersMap.get(key);
          const existingIsInstalled = Boolean(existing.uid || existing.lastLogin || existing.lastAppOpened);
          const currentIsInstalled = Boolean(m.uid || m.lastLogin || m.lastAppOpened);
          
          if (currentIsInstalled && !existingIsInstalled) {
            uniqueMembersMap.set(key, m); // Replace with the installed one
          }
        } else {
          uniqueMembersMap.set(key, m);
        }
      });

      setMembers(Array.from(uniqueMembersMap.values()));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSaveMemberEdit = async () => {
    if (!churchId || !memberEditForm.id) return;
    setSaving(true);
    try {
      await firestore().collection('churches').doc(churchId).collection('members').doc(memberEditForm.id).update({
        name: memberEditForm.name,
        phone: memberEditForm.phone,
        email: memberEditForm.email,
        userType: memberEditForm.userType,
      });
      setMemberEditForm({ ...memberEditForm, visible: false });
      loadMembers();
      showCustomAlert('Success', 'Member updated successfully', 'success');
    } catch (e) {
      showCustomAlert('Error', 'Failed to update member', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = (mId: string, mName: string) => {
    Alert.alert(
      "Delete Member",
      `Are you sure you want to delete ${mName}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            if (!churchId) return;
            try {
              await firestore().collection('churches').doc(churchId).collection('members').doc(mId).delete();
              loadMembers();
              showCustomAlert('Success', 'Member deleted successfully', 'success');
            } catch (e) {
              showCustomAlert('Error', 'Failed to delete member', 'error');
            }
          }
        }
      ]
    );
  };

  const generateMemberReport = async () => {
    try {
      const installedMembers = members.filter(m => Boolean(m.uid || m.lastLogin || m.lastAppOpened));
      const notInstalledMembers = members.filter(m => !Boolean(m.uid || m.lastLogin || m.lastAppOpened));

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
              h1 { color: #1e3a8a; text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 30px; }
              h2 { color: #3b82f6; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e5e7eb; }
              th { background-color: #f3f4f6; font-weight: bold; color: #4b5563; }
              tr:nth-child(even) { background-color: #f9fafb; }
              .summary { display: flex; justify-content: space-around; background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px; font-weight: bold; }
              .installed { color: #10b981; }
              .not-installed { color: #ef4444; }
            </style>
          </head>
          <body>
            <h1>Church Members App Status Report</h1>
            <div class="summary">
              <div>Total Members: ${members.length}</div>
              <div class="installed">Installed & Logged In: ${installedMembers.length}</div>
              <div class="not-installed">Not Installed: ${notInstalledMembers.length}</div>
            </div>

            <h2>Installed & Logged In</h2>
            <table>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Role</th>
              </tr>
              ${installedMembers.length > 0 ? installedMembers.map(m => `
                <tr>
                  <td>${m.name || 'Unknown'}</td>
                  <td>${m.phone || m.email || 'N/A'}</td>
                  <td>${m.userType || 'Member'}</td>
                </tr>
              `).join('') : '<tr><td colspan="3" style="text-align:center;">No members in this category</td></tr>'}
            </table>

            <h2>Not Installed / Not Logged In</h2>
            <table>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Role</th>
              </tr>
              ${notInstalledMembers.length > 0 ? notInstalledMembers.map(m => `
                <tr>
                  <td>${m.name || 'Unknown'}</td>
                  <td>${m.phone || m.email || 'N/A'}</td>
                  <td>${m.userType || 'Member'}</td>
                </tr>
              `).join('') : '<tr><td colspan="3" style="text-align:center;">No members in this category</td></tr>'}
            </table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      const fileUri = `${documentDirectory}Church_Members_Report_${church?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Church'}.pdf`;
      await copyAsync({ from: uri, to: fileUri });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        showCustomAlert('Report Generated', 'Sharing is not available on this device.', 'error');
      }
    } catch (e) {
      console.error(e);
      showCustomAlert('Error', 'Failed to generate report', 'error');
    }
  };

  const loadChurch = async () => {
    if (!churchId) return;
    setLoading(true);
    const data = await ChurchService.getChurchDetails(churchId);
    setChurch(data);
    const tiers = await ChurchService.getAvailableTiers();
    setAvailableTiers(tiers);
    setLoading(false);
  };

  const openEditForm = () => {
    if (!church) return;
    setEditForm({
      visible: true,
      tier: (church.subscription as any)?.tier || church.subscriptionTier || '',
      customTier: '',
      contactEmail: church.contactEmail || '',
      secondaryEmail: (church as any).secondaryEmail || '',
      contactPhone: church.contactPhone || '',
      secondaryPhone: (church as any).secondaryPhone || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!church) return;
    setSaving(true);
    try {
      const finalTier = editForm.customTier.trim() !== '' ? editForm.customTier.trim().toLowerCase() : editForm.tier;
      await ChurchService.updateChurchSettings(church.id, { 
        contactEmail: editForm.contactEmail,
        secondaryEmail: editForm.secondaryEmail,
        contactPhone: editForm.contactPhone,
        secondaryPhone: editForm.secondaryPhone,
        subscriptionTier: finalTier,
        'subscription.tier': finalTier,
      });
      await loadChurch();
      onUpdated();
      showCustomAlert('Success', `Church details updated successfully`, 'success');
      setEditForm({ ...editForm, visible: false });
    } catch (e) {
      console.error(e);
      showCustomAlert('Error', 'Failed to update church details', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFeature = async (featureKey: string, currentValue: boolean) => {
    if (!church) return;
    setSaving(true);
    try {
      await ChurchService.updateChurchSettings(church.id, {
        [`features.${featureKey}`]: !currentValue
      });
      // Optimistic update
      setChurch({
        ...church,
        features: {
          ...church.features,
          [featureKey]: !currentValue
        } as any
      });
      onUpdated();
    } catch (e) {
      Alert.alert('Error', 'Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleWhatsApp = async (newValue: boolean) => {
    if (!church) return;
    setSaving(true);
    try {
      await ChurchService.updateChurchSettings(church.id, {
        whatsappIntegrationEnabled: newValue,
        automatedWhatsappWishesEnabled: newValue,
        'features.hasWhatsAppAutomation': newValue
      });
      setChurch({
        ...church,
        whatsappIntegrationEnabled: newValue,
        automatedWhatsappWishesEnabled: newValue,
        features: {
          ...(church.features || {}),
          hasWhatsAppAutomation: newValue
        } as any
      });
      showCustomAlert(
        `WhatsApp ${newValue ? 'Enabled' : 'Disabled'}`,
        `All WhatsApp integrations, automations, and WeCelebrations chat have been ${newValue ? 'activated' : 'deactivated'}.`,
        'success'
      );
    } catch (error) {
      console.error('Error toggling WhatsApp features:', error);
      showCustomAlert(
        'Update Failed',
        'Could not update WhatsApp features. Please try again.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleGlobal = async (field: string, newValue: boolean) => {
    if (!church) return;
    setSaving(true);
    try {
      await ChurchService.updateChurchSettings(church.id, {
        [field]: newValue
      });
      setChurch({
        ...church,
        [field as keyof ChurchDetails]: newValue as never
      });
      onUpdated();
    } catch (e) {
      console.error(e);
      const uid = auth().currentUser?.uid; showCustomAlert('Permission Denied', `Your UID (${uid}) lacks admin access for this church.`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExtendSub = async (years: number) => {
    if (!church) return;
    setSaving(true);
    try {
      await ChurchService.extendSubscription(church.id, years);
      await loadChurch();
      onUpdated();
      showCustomAlert('Success', `Subscription extended by ${years} year(s)`, 'success');
    } catch (e) {
      console.error(e);
      const uid = auth().currentUser?.uid; showCustomAlert('Permission Denied', `Your UID (${uid}) lacks admin access for this church.`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExtendDays = async (days: number) => {
    if (!church) return;
    const baseDate = church.subscription?.validUntil ? new Date(church.subscription.validUntil) : new Date();
    const newExpiry = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
    await handleCustomExpiry(newExpiry);
  };

  const handleExtendMonths = async (months: number) => {
    if (!church) return;
    const baseDate = church.subscription?.validUntil ? new Date(church.subscription.validUntil) : new Date();
    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + months);
    await handleCustomExpiry(newExpiry);
  };

  const handleCustomExpiry = async (date: Date) => {
    setDatePickerVisibility(false);
    if (!church) return;
    setSaving(true);
    try {
      await ChurchService.setSubscriptionExpiry(church.id, date);
      await loadChurch();
      onUpdated();
      showCustomAlert('Success', `Subscription expiry updated to ${formatDate(date)}`, 'success');
    } catch (e) {
      console.error(e);
      const uid = auth().currentUser?.uid; showCustomAlert('Permission Denied', `Your UID (${uid}) lacks admin access for this church.`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCustomStartDate = async (date: Date) => {
    setStartDatePickerVisibility(false);
    if (!church) return;
    setSaving(true);
    try {
      await ChurchService.updateChurchSettings(church.id, { createdAt: date });
      await loadChurch();
      onUpdated();
      showCustomAlert('Success', `Start Date updated to ${formatDate(date)}`, 'success');
    } catch (e) {
      console.error(e);
      const uid = auth().currentUser?.uid; showCustomAlert('Permission Denied', `Your UID (${uid}) lacks admin access for this church.`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (val: any) => {
    if (!val) return 'N/A';
    const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    if (val.toDate && typeof val.toDate === 'function') return val.toDate().toLocaleDateString('en-GB', opts);
    if (val.seconds) return new Date(val.seconds * 1000).toLocaleDateString('en-GB', opts);
    const d = new Date(val);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-GB', opts);
  };


  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <LinearGradient colors={['#101733', '#0a0f22']} style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Church Management</Text>
            <Text style={styles.headerSubtitle}>{church?.name || 'Loading...'}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={18} color="#94a1c4" />
          </TouchableOpacity>
        </LinearGradient>

        {loading || !church ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#FCD34D" />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {/* Tabs */}
            <View style={{ flexDirection: 'row', backgroundColor: '#101733', borderBottomWidth: 1, borderBottomColor: '#242e50' }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 16, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === 'details' ? '#3b82f6' : 'transparent' }}
                onPress={() => setActiveTab('details')}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: activeTab === 'details' ? '#3b82f6' : '#94a1c4' }}>Details</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 16, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === 'members' ? '#3b82f6' : 'transparent' }}
                onPress={() => setActiveTab('members')}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: activeTab === 'members' ? '#3b82f6' : '#94a1c4' }}>Church Members</Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'details' ? (
              <ScrollView contentContainerStyle={styles.content}>

                {/* Info Card */}
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>Church Details</Text>
                <TouchableOpacity onPress={openEditForm} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(59, 130, 246, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                  <Edit2 size={14} color="#3b82f6" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#3b82f6', fontSize: 12, fontWeight: '700' }}>Edit</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.cardRow}>
                <Globe size={20} color="#94a3b8" />
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardLabel}>Church Code</Text>
                  <Text style={styles.cardValue}>{church.subdomain || 'N/A'}</Text>
                </View>
              </View>
              <View style={styles.divider} />

              <View style={styles.cardRow}>
                <MapPin size={20} color="#94a3b8" />
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardLabel}>Location (City/Address)</Text>
                  <Text style={styles.cardValue}>{church.address || 'N/A'}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              
              <View style={styles.cardRow}>
                <Shield size={20} color="#94a3b8" />
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardLabel}>Tier</Text>
                  <Text style={[styles.cardValue, { color: '#8fb4ff', textTransform: 'capitalize' }]}>{(church.subscription as any)?.tier || church.subscriptionTier || 'N/A'}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              
              <View style={styles.cardRow}>
                <TouchableOpacity
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                  onPress={() => Linking.openURL(`mailto:${church.contactEmail || (church.subdomain ? `admin@${church.subdomain}.app` : 'admin@wechristian.app')}`)}
                >
                  <Mail size={20} color="#94a3b8" />
                  <View style={styles.cardTextContainer}>
                    <Text style={styles.cardLabel}>Primary Email</Text>
                    {church.contactEmail ? (
                      <Text style={[styles.cardValue, { color: '#8fb4ff' }]}>{church.contactEmail}</Text>
                    ) : (
                      <TouchableOpacity onPress={openEditForm} style={{ marginTop: 4 }}>
                        <Text style={{ color: '#3b82f6', fontSize: 13, fontWeight: '600' }}>+ Add Email</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
              <View style={styles.divider} />

              <View style={styles.cardRow}>
                <TouchableOpacity
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                  onPress={() => {
                    const email = (church as any).secondaryEmail;
                    if (email) Linking.openURL(`mailto:${email}`);
                  }}
                >
                  <Mail size={20} color="#94a3b8" />
                  <View style={styles.cardTextContainer}>
                    <Text style={styles.cardLabel}>Secondary Email</Text>
                    {(church as any).secondaryEmail ? (
                      <Text style={[styles.cardValue, { color: '#8fb4ff' }]}>{(church as any).secondaryEmail}</Text>
                    ) : (
                      <TouchableOpacity onPress={openEditForm} style={{ marginTop: 4 }}>
                        <Text style={{ color: '#3b82f6', fontSize: 13, fontWeight: '600' }}>+ Add Email</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
              <View style={styles.divider} />

              <View style={styles.cardRow}>
                <TouchableOpacity
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                  onPress={() => {
                    const phone = church.contactPhone;
                    if (phone) Linking.openURL(`tel:${phone}`);
                  }}
                >
                  <Phone size={20} color="#94a3b8" />
                  <View style={styles.cardTextContainer}>
                    <Text style={styles.cardLabel}>Primary Phone</Text>
                    {church.contactPhone ? (
                      <Text style={[styles.cardValue, { color: '#8fb4ff' }]}>{church.contactPhone}</Text>
                    ) : (
                      <TouchableOpacity onPress={openEditForm} style={{ marginTop: 4 }}>
                        <Text style={{ color: '#3b82f6', fontSize: 13, fontWeight: '600' }}>+ Add Phone</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
              <View style={styles.divider} />

              <View style={styles.cardRow}>
                <TouchableOpacity
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                  onPress={() => {
                    const phone = (church as any).secondaryPhone;
                    if (phone) Linking.openURL(`tel:${phone}`);
                  }}
                >
                  <Phone size={20} color="#94a3b8" />
                  <View style={styles.cardTextContainer}>
                    <Text style={styles.cardLabel}>Secondary Phone</Text>
                    {(church as any).secondaryPhone ? (
                      <Text style={[styles.cardValue, { color: '#8fb4ff' }]}>{(church as any).secondaryPhone}</Text>
                    ) : (
                      <TouchableOpacity onPress={openEditForm} style={{ marginTop: 4 }}>
                        <Text style={{ color: '#3b82f6', fontSize: 13, fontWeight: '600' }}>+ Add Phone</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Referral Section */}
            {(church as any).referredBy && (
              <>
                <Text style={styles.sectionTitle}>Referral Details</Text>
                <View style={styles.card}>
                  <View style={[styles.cardRow, { paddingVertical: 12 }]}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(139, 92, 246, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 16, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.3)' }}>
                      <Text style={{ color: '#c4b5fd', fontSize: 16, fontWeight: '800' }}>
                        {(church as any).referredBy.name?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                    <View style={styles.cardTextContainer}>
                      <Text style={[styles.cardLabel, { color: '#a78bfa' }]}>Referred By</Text>
                      <Text style={styles.cardValue}>{(church as any).referredBy.name}</Text>
                      <Text style={[styles.cardValue, { fontSize: 13, color: '#94a3b8', marginTop: 2 }]}>
                        Code: {(church as any).referredBy.code}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}

            {/* Subscription Section */}
            <Text style={styles.sectionTitle}>Subscription</Text>
            <View style={styles.card}>
              <View style={[styles.cardRow, { alignItems: 'flex-start' }]}>
                <Calendar size={20} color={church.subscription?.status === 'active' ? '#34d399' : '#f87171'} style={{ marginTop: 2 }} />
                <View style={[styles.cardTextContainer, { flex: 1 }]}>

                  {/* Badge & Edit Action Row */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    {(() => {
                      const rawStatus = church.subscription?.status;
                      const computedStatus = (!rawStatus || rawStatus.toLowerCase() === 'unknown') ? 'trialing' : rawStatus.toLowerCase();
                      return (
                        <View style={{ backgroundColor: computedStatus === 'active' ? 'rgba(52, 211, 153, 0.15)' : computedStatus === 'trialing' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(248, 113, 113, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: computedStatus === 'active' ? 'rgba(52, 211, 153, 0.3)' : computedStatus === 'trialing' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(248, 113, 113, 0.3)' }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: computedStatus === 'active' ? '#34d399' : computedStatus === 'trialing' ? '#60a5fa' : '#f87171', letterSpacing: 0.5 }}>
                            {computedStatus === 'trialing' ? 'FREE TRIAL' : (computedStatus.toUpperCase())}
                          </Text>
                        </View>
                      );
                    })()}

                    <TouchableOpacity
                      onPress={() => setEditDateModalVisible(true)}
                      style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(143, 180, 255, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(143, 180, 255, 0.2)' }}
                    >
                      <Edit2 size={12} color="#8fb4ff" style={{ marginRight: 6 }} />
                      <Text style={{ color: '#8fb4ff', fontSize: 12, fontWeight: '600' }}>Edit</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Dates Row */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardLabel}>Start Date</Text>
                      <Text style={[styles.cardValue, { marginTop: 4 }]}>
                        {formatDate((church as any).createdAt)}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      {(() => {
                        const rawStatus = church.subscription?.status;
                        const computedStatus = (!rawStatus || rawStatus.toLowerCase() === 'unknown') ? 'trialing' : rawStatus.toLowerCase();
                        let computedValidUntil = church.subscription?.validUntil;
                        if (!computedValidUntil && computedStatus === 'trialing' && (church as any).createdAt) {
                          const createdDate = (church as any).createdAt?.toDate ? (church as any).createdAt.toDate() : (church as any).createdAt?.seconds ? new Date((church as any).createdAt.seconds * 1000) : new Date((church as any).createdAt);
                          if (!isNaN(createdDate.getTime())) {
                            const trialEnd = new Date(createdDate);
                            trialEnd.setDate(trialEnd.getDate() + 60);
                            computedValidUntil = trialEnd.toISOString();
                          }
                        }

                        return (
                          <>
                            <Text style={styles.cardLabel}>{computedStatus === 'trialing' ? 'Trial Ends' : 'Expires'}</Text>
                            {computedValidUntil && new Date(computedValidUntil).getTime() < Date.now() ? (
                              <Text style={[styles.cardValue, { marginTop: 4, color: '#f87171', fontWeight: '800' }]}>
                                {computedStatus === 'trialing' ? 'Trial Expired' : 'Subscription Expired'}
                              </Text>
                            ) : computedStatus && computedStatus !== 'active' && computedStatus !== 'trialing' ? (
                              <Text style={[styles.cardValue, { marginTop: 4, color: '#f87171', fontWeight: '800' }]}>
                                Subscription Expired
                              </Text>
                            ) : (
                              <Text style={[styles.cardValue, { marginTop: 4 }]}>
                                {computedValidUntil ? formatDate(computedValidUntil) : 'N/A'}
                                {computedStatus === 'trialing' && computedValidUntil && (
                                  <Text style={{ color: '#60a5fa', fontSize: 12 }}>
                                    {` (${Math.max(0, Math.ceil((new Date(computedValidUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days left)`}
                                  </Text>
                                )}
                              </Text>
                            )}
                          </>
                        );
                      })()}
                    </View>
                  </View>

                </View>
              </View>

              <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#1e293b' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                  Extend Subscription
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: 'transparent', borderColor: 'rgba(52, 211, 153, 0.5)', borderWidth: 1, width: '48%', marginBottom: 12, flex: 0 }]}
                    onPress={() => handleExtendSub(1)}
                    disabled={saving}
                  >
                    <Text style={[styles.btnText, { color: '#34d399' }]}>+ 1 Year</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: 'transparent', borderColor: 'rgba(52, 211, 153, 0.5)', borderWidth: 1, width: '48%', marginBottom: 12, flex: 0 }]}
                    onPress={() => handleExtendMonths(1)}
                    disabled={saving}
                  >
                    <Text style={[styles.btnText, { color: '#34d399' }]}>+ 1 Month</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: 'transparent', borderColor: 'rgba(52, 211, 153, 0.5)', borderWidth: 1, width: '48%', flex: 0 }]}
                    onPress={() => handleExtendDays(15)}
                    disabled={saving}
                  >
                    <Text style={[styles.btnText, { color: '#34d399' }]}>+ 15 Days</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: 'transparent', borderColor: 'rgba(52, 211, 153, 0.5)', borderWidth: 1, width: '48%', flex: 0 }]}
                    onPress={() => setDatePickerVisibility(true)}
                    disabled={saving}
                  >
                    <Text style={[styles.btnText, { color: '#34d399' }]}>Custom Date</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Global Content */}
            <Text style={styles.sectionTitle}>Global Content</Text>
            <View style={styles.card}>
              {church.parentChurchId ? (
                <View style={[styles.cardRow, { paddingVertical: 12 }]}>
                  <Globe size={20} color="#8fb4ff" />
                  <View style={styles.cardTextContainer}>
                    <Text style={[styles.cardLabel, { color: '#8fb4ff' }]}>Branch Church</Text>
                    <Text style={styles.cardValue}>This is a branch of another church.</Text>
                    <Text style={[styles.cardValue, { fontSize: 13, color: '#94a3b8', marginTop: 4 }]}>The Parent Organization setting is not applicable here.</Text>
                  </View>
                </View>
              ) : (
                <SettingToggle
                  icon={<Shield size={20} color="#94a3b8" />}
                  title="Parent Organization"
                  description="Marks this church as a parent organization that can have branches."
                  value={(church as any).isParentOrganization || false}
                  onToggle={() => handleToggleGlobal('isParentOrganization', !(church as any).isParentOrganization)}
                  disabled={saving}
                />
              )}
              <View style={styles.divider} />
              <SettingToggle
                icon={<Music size={20} color="#94a3b8" />}
                title="Disable Global Master Songs"
                description="If checked, this church will only see their own custom songs, not the global platform songs."
                value={(church as any).disableMasterSongs || false}
                onToggle={() => handleToggleGlobal('disableMasterSongs', !(church as any).disableMasterSongs)}
                disabled={saving}
              />
            </View>

            {/* Integrations */}
            <Text style={styles.sectionTitle}>Integrations</Text>
            <View style={styles.card}>
              <SettingToggle
                icon={<MessageCircle size={20} color="#34d399" />}
                title="WhatsApp Integration & Automation"
                description="If you want automated WhatsApp messages, WeCelebrations tab, and chat features enabled for this church."
                value={church.whatsappIntegrationEnabled || false}
                onToggle={() => handleToggleWhatsApp(!(church.whatsappIntegrationEnabled || false))}
                disabled={saving}
              />
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
            ) : (
              <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <View style={{ marginBottom: 16, flexDirection: 'row', gap: 12 }}>
                  <TextInput
                    style={{ flex: 1, backgroundColor: '#141b30', color: '#f4f6fb', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#3b4b72', fontSize: 14 }}
                    placeholder="Search members by name, email, or phone..."
                    placeholderTextColor="#94a1c4"
                    value={memberSearchQuery}
                    onChangeText={setMemberSearchQuery}
                  />
                  <TouchableOpacity 
                    style={{ backgroundColor: '#3b82f6', padding: 12, borderRadius: 12, justifyContent: 'center', alignItems: 'center', width: 48 }}
                    onPress={generateMemberReport}
                  >
                    <Download size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
                {loadingMembers ? (
                  <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#FCD34D" />
                  </View>
                ) : (() => {
                  const query = memberSearchQuery.toLowerCase();
                  const filteredMembers = members.filter(m => 
                    (m.name || '').toLowerCase().includes(query) ||
                    (m.email || '').toLowerCase().includes(query) ||
                    (m.phone || '').toLowerCase().includes(query)
                  );
                  
                  if (filteredMembers.length === 0) {
                    return (
                      <View style={{ alignItems: 'center', padding: 40 }}>
                        <Users size={48} color="#3b4b72" style={{ marginBottom: 16 }} />
                        <Text style={{ fontSize: 16, color: '#94a1c4', fontWeight: '600' }}>
                          {members.length === 0 ? "No members found for this church." : "No members match your search."}
                        </Text>
                      </View>
                    );
                  }
                  
                  return filteredMembers.map(m => {
                    const isAppInstalled = Boolean(m.uid || m.lastLogin || m.lastAppOpened);
                    const statusColor = isAppInstalled ? '#3b82f6' : '#94a1c4';
                    const statusBg = isAppInstalled ? 'rgba(59, 130, 246, 0.15)' : 'rgba(148, 163, 184, 0.15)';
                    const statusBorder = isAppInstalled ? 'rgba(59, 130, 246, 0.3)' : 'rgba(148, 163, 184, 0.3)';
                    const statusText = isAppInstalled ? 'Installed & Logged In' : 'Not Installed / Not Logged In';

                    return (
                      <View key={m.id} style={[styles.card, { padding: 16, flexDirection: 'row', alignItems: 'center' }]}>
                        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(59, 130, 246, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                          <Text style={{ fontSize: 18, fontWeight: '700', color: '#3b82f6' }}>{m.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: '#f4f6fb' }}>{m.name || 'Unknown'}</Text>
                          <Text style={{ fontSize: 13, color: '#94a1c4', marginTop: 2 }}>{m.phone || m.email || 'No contact info'}</Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                            <View style={{ backgroundColor: 'rgba(52, 211, 153, 0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.3)' }}>
                              <Text style={{ fontSize: 10, fontWeight: '700', color: '#34d399', textTransform: 'uppercase' }}>{m.userType || 'Member'}</Text>
                            </View>
                            <View style={{ backgroundColor: statusBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: statusBorder }}>
                              <Text style={{ fontSize: 10, fontWeight: '700', color: statusColor, textTransform: 'uppercase' }}>{statusText}</Text>
                            </View>
                          </View>
                        </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <TouchableOpacity 
                          onPress={() => setMemberEditForm({
                            visible: true,
                            id: m.id,
                            name: m.name || '',
                            phone: m.phone || '',
                            email: m.email || '',
                            userType: m.userType || 'member'
                          })}
                          style={{ padding: 6, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 8 }}
                        >
                          <Edit2 size={16} color="#3b82f6" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => handleDeleteMember(m.id, m.name || 'Unknown')}
                          style={{ padding: 6, backgroundColor: 'rgba(248, 113, 113, 0.1)', borderRadius: 8 }}
                        >
                          <Trash2 size={16} color="#f87171" />
                        </TouchableOpacity>
                        </View>
                      </View>
                    );
                  });
                })()}
                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </View>
        )}
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleCustomExpiry}
          onCancel={() => setDatePickerVisibility(false)}
        />
        <DateTimePickerModal
          isVisible={isStartDatePickerVisible}
          mode="date"
          onConfirm={handleCustomStartDate}
          onCancel={() => setStartDatePickerVisibility(false)}
        />

        {/* Custom Beautiful Alert Modal */}
        <Modal visible={alertConfig.visible} transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{
              backgroundColor: '#1e293b',
              borderRadius: 24,
              width: '100%',
              maxWidth: 320,
              padding: 24,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: alertConfig.type === 'success' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(248, 113, 113, 0.3)',
              shadowColor: alertConfig.type === 'success' ? '#34d399' : '#f87171',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 10
            }}>
              <View style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: alertConfig.type === 'success' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 20
              }}>
                {alertConfig.type === 'success' ? <Shield size={32} color="#34d399" /> : <X size={32} color="#f87171" />}
              </View>
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 12, textAlign: 'center', letterSpacing: 0.5 }}>{alertConfig.title}</Text>
              <Text style={{ color: '#94a3b8', fontSize: 15, textAlign: 'center', marginBottom: 28, lineHeight: 22 }}>{alertConfig.message}</Text>

              <TouchableOpacity
                style={{
                  backgroundColor: alertConfig.type === 'success' ? '#34d399' : '#f87171',
                  paddingVertical: 14,
                  paddingHorizontal: 32,
                  borderRadius: 12,
                  width: '100%'
                }}
                onPress={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
              >
                <Text style={{ color: '#0f172a', fontSize: 16, fontWeight: '700', textAlign: 'center' }}>{alertConfig.type === 'success' ? 'Awesome' : 'Okay'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Beautiful Edit Date Selection Modal */}
        <Modal visible={isEditDateModalVisible} transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{
              backgroundColor: '#1e293b',
              borderRadius: 24,
              width: '100%',
              maxWidth: 320,
              padding: 24,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(148, 163, 184, 0.2)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.5,
              shadowRadius: 16,
              elevation: 10
            }}>
              <View style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: 'rgba(143, 180, 255, 0.15)',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 20
              }}>
                <Calendar size={32} color="#8fb4ff" />
              </View>
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center', letterSpacing: 0.5 }}>Edit Dates</Text>
              <Text style={{ color: '#94a3b8', fontSize: 15, textAlign: 'center', marginBottom: 28, lineHeight: 22 }}>Which date would you like to update?</Text>

              <TouchableOpacity
                style={{ backgroundColor: '#8fb4ff', paddingVertical: 14, borderRadius: 12, width: '100%', marginBottom: 12 }}
                onPress={() => {
                  setEditDateModalVisible(false);
                  setTimeout(() => setStartDatePickerVisibility(true), 300);
                }}
              >
                <Text style={{ color: '#0f172a', fontSize: 16, fontWeight: '700', textAlign: 'center' }}>Edit Start Date</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ backgroundColor: 'rgba(143, 180, 255, 0.1)', paddingVertical: 14, borderRadius: 12, width: '100%', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(143, 180, 255, 0.3)' }}
                onPress={() => {
                  setEditDateModalVisible(false);
                  setTimeout(() => setDatePickerVisibility(true), 300);
                }}
              >
                <Text style={{ color: '#8fb4ff', fontSize: 16, fontWeight: '700', textAlign: 'center' }}>Edit Expires Date</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ paddingVertical: 10, width: '100%' }}
                onPress={() => setEditDateModalVisible(false)}
              >
                <Text style={{ color: '#94a3b8', fontSize: 15, fontWeight: '600', textAlign: 'center' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Unified Edit Form Modal */}
        <Modal transparent visible={editForm.visible} animationType="fade" onRequestClose={() => setEditForm({ ...editForm, visible: false })}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ width: '100%', maxWidth: 400, maxHeight: '80%', backgroundColor: '#1e293b', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10, borderWidth: 1, borderColor: '#334155' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#f8fafc', marginBottom: 16 }}>Edit Church Details</Text>
              
              <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 20 }}>
                <Text style={{ color: '#94a1c4', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 }}>Subscription Tier</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {availableTiers.map(t => (
                    <TouchableOpacity 
                      key={t}
                      onPress={() => setEditForm({ ...editForm, tier: t, customTier: '' })}
                      style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: editForm.tier === t && !editForm.customTier ? '#3b82f6' : '#334155', borderWidth: 1, borderColor: editForm.tier === t && !editForm.customTier ? '#60a5fa' : '#475569' }}
                    >
                      <Text style={{ color: '#f8fafc', fontSize: 13, fontWeight: '600', textTransform: 'capitalize' }}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={{ backgroundColor: '#0f172a', color: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#334155', fontSize: 14, marginBottom: 16 }}
                  value={editForm.customTier}
                  onChangeText={(t: string) => setEditForm({ ...editForm, customTier: t, tier: t ? '' : editForm.tier })}
                  placeholder="Or enter custom tier..."
                  placeholderTextColor="#64748b"
                  autoCapitalize="none"
                />

                <Text style={{ color: '#94a1c4', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 }}>Contact Details</Text>
                
                <TextInput
                  style={{ backgroundColor: '#0f172a', color: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#334155', fontSize: 14, marginBottom: 12 }}
                  value={editForm.contactEmail}
                  onChangeText={(t: string) => setEditForm({ ...editForm, contactEmail: t })}
                  placeholder="Primary Email"
                  placeholderTextColor="#64748b"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                
                <TextInput
                  style={{ backgroundColor: '#0f172a', color: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#334155', fontSize: 14, marginBottom: 12 }}
                  value={editForm.secondaryEmail}
                  onChangeText={(t: string) => setEditForm({ ...editForm, secondaryEmail: t })}
                  placeholder="Secondary Email"
                  placeholderTextColor="#64748b"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <TextInput
                  style={{ backgroundColor: '#0f172a', color: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#334155', fontSize: 14, marginBottom: 12 }}
                  value={editForm.contactPhone}
                  onChangeText={(t: string) => setEditForm({ ...editForm, contactPhone: t })}
                  placeholder="Primary Phone"
                  placeholderTextColor="#64748b"
                  keyboardType="phone-pad"
                />

                <TextInput
                  style={{ backgroundColor: '#0f172a', color: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#334155', fontSize: 14, marginBottom: 12 }}
                  value={editForm.secondaryPhone}
                  onChangeText={(t: string) => setEditForm({ ...editForm, secondaryPhone: t })}
                  placeholder="Secondary Phone"
                  placeholderTextColor="#64748b"
                  keyboardType="phone-pad"
                />
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity onPress={() => setEditForm({ ...editForm, visible: false })} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#334155', alignItems: 'center' }}>
                  <Text style={{ color: '#f8fafc', fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveEdit} disabled={saving} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#3b82f6', alignItems: 'center', opacity: saving ? 0.7 : 1 }}>
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#ffffff', fontWeight: '700' }}>Save</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Member Edit Modal */}
        <Modal transparent visible={memberEditForm.visible} animationType="fade" onRequestClose={() => setMemberEditForm({ ...memberEditForm, visible: false })}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ width: '100%', maxWidth: 400, backgroundColor: '#1e293b', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10, borderWidth: 1, borderColor: '#334155' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#f8fafc', marginBottom: 16 }}>Edit Member Details</Text>
              
              <Text style={{ color: '#94a1c4', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 }}>Name</Text>
              <TextInput
                style={{ backgroundColor: '#0f172a', color: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#334155', fontSize: 14, marginBottom: 12 }}
                value={memberEditForm.name}
                onChangeText={(t: string) => setMemberEditForm({ ...memberEditForm, name: t })}
                placeholder="Full Name"
                placeholderTextColor="#64748b"
              />

              <Text style={{ color: '#94a1c4', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 }}>Role / Type</Text>
              <TextInput
                style={{ backgroundColor: '#0f172a', color: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#334155', fontSize: 14, marginBottom: 12 }}
                value={memberEditForm.userType}
                onChangeText={(t: string) => setMemberEditForm({ ...memberEditForm, userType: t })}
                placeholder="e.g., Member, Admin"
                placeholderTextColor="#64748b"
              />
              
              <Text style={{ color: '#94a1c4', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 }}>Contact</Text>
              <TextInput
                style={{ backgroundColor: '#0f172a', color: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#334155', fontSize: 14, marginBottom: 12 }}
                value={memberEditForm.phone}
                onChangeText={(t: string) => setMemberEditForm({ ...memberEditForm, phone: t })}
                placeholder="Phone Number"
                placeholderTextColor="#64748b"
                keyboardType="phone-pad"
              />
              <TextInput
                style={{ backgroundColor: '#0f172a', color: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#334155', fontSize: 14, marginBottom: 20 }}
                value={memberEditForm.email}
                onChangeText={(t: string) => setMemberEditForm({ ...memberEditForm, email: t })}
                placeholder="Email Address"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity onPress={() => setMemberEditForm({ ...memberEditForm, visible: false })} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#334155', alignItems: 'center' }}>
                  <Text style={{ color: '#f8fafc', fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveMemberEdit} disabled={saving} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#3b82f6', alignItems: 'center', opacity: saving ? 0.7 : 1 }}>
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#ffffff', fontWeight: '700' }}>Save</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </Modal>
  );
}

function SettingToggle({ icon, title, description, value, onToggle, disabled }: any) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleIcon}>{icon}</View>
      <View style={styles.toggleText}>
        <Text style={styles.toggleTitle}>{title}</Text>
        {description && <Text style={styles.toggleDesc}>{description}</Text>}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ color: value ? '#FCD34D' : '#94a3b8', marginRight: 8, fontSize: 13, fontWeight: '700' }}>
          {value ? 'YES' : 'NO'}
        </Text>
        <Switch
          value={value}
          onValueChange={onToggle}
          disabled={disabled}
          trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(252, 211, 77, 0.4)' }}
          thumbColor={value ? '#FCD34D' : '#94a3b8'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1e' },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#242e50'
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: '#94a1c4', marginTop: 2 },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#1b2340', justifyContent: 'center', alignItems: 'center' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#5c6890', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 16, marginBottom: 10, marginLeft: 2 },
  card: {
    backgroundColor: '#141b30',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#3b4b72',
    padding: 16,
    marginBottom: 18
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  cardTextContainer: { marginLeft: 12, flex: 1 },
  cardLabel: { fontSize: 11, color: '#94a1c4', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  cardValue: { fontSize: 14, color: '#f4f6fb', fontWeight: '600', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#242e50', marginVertical: 8 },
  actionButtons: { flexDirection: 'row', gap: 10, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#242e50' },
  btn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  btnText: { fontSize: 13, fontWeight: '700' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  toggleIcon: { width: 34, height: 34, borderRadius: 9, backgroundColor: '#1b2340', justifyContent: 'center', alignItems: 'center', marginRight: 13 },
  toggleText: { flex: 1, paddingRight: 12 },
  toggleTitle: { fontSize: 14, fontWeight: '600', color: '#f4f6fb' },
  toggleDesc: { fontSize: 11.5, color: '#94a1c4', marginTop: 3, lineHeight: 16 }
});
