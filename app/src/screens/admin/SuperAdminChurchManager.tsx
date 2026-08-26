import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Alert, SafeAreaView, Platform, Linking } from 'react-native';
import { X, Shield, Calendar, Smartphone, Globe, Music, BookOpen, Heart, MessageCircle, Mail, Phone, Edit2 } from 'lucide-react-native';
import auth from '@react-native-firebase/auth';
import ChurchService, { ChurchDetails } from '../../services/ChurchService';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

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

  const showCustomAlert = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    setAlertConfig({ visible: true, title, message, type });
  };

  useEffect(() => {
    if (visible && churchId) {
      loadChurch();
    }
  }, [visible, churchId]);

  const loadChurch = async () => {
    if (!churchId) return;
    setLoading(true);
    const data = await ChurchService.getChurchDetails(churchId);
    setChurch(data);
    setLoading(false);
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

  const handleChangeTier = () => {
    Alert.alert('Change Tier', 'Select a new subscription tier', [
      { text: 'Free', onPress: () => updateTier('free') },
      { text: 'Standard', onPress: () => updateTier('standard') },
      { text: 'Premium', onPress: () => updateTier('premium') },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const updateTier = async (tier: string) => {
    if (!church) return;
    setSaving(true);
    try {
      await ChurchService.updateChurchSettings(church.id, { subscriptionTier: tier as any });
      await loadChurch();
      onUpdated();
      showCustomAlert('Success', `Tier updated to ${tier.toUpperCase()}`, 'success');
    } catch (e) {
      console.error(e);
      const uid = auth().currentUser?.uid; showCustomAlert('Permission Denied', `Your UID (${uid}) lacks admin access for this church.`, 'error');
    } finally {
      setSaving(false);
    }
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
          <ScrollView contentContainerStyle={styles.content}>
            
            {/* Info Card */}
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Globe size={20} color="#94a3b8" />
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardLabel}>Church Code</Text>
                  <Text style={styles.cardValue}>{church.subdomain || 'N/A'}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.cardRow} onPress={handleChangeTier}>
                <Shield size={20} color="#94a3b8" />
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardLabel}>Tier</Text>
                  <Text style={[styles.cardValue, { color: '#8fb4ff' }]}>{(church.subscription as any)?.tier || church.subscriptionTier || 'N/A'}</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity 
                style={styles.cardRow} 
                onPress={() => Linking.openURL(`mailto:${church.contactEmail || (church.subdomain ? `admin@${church.subdomain}.app` : 'admin@wechristian.app')}`)}
              >
                <Mail size={20} color="#94a3b8" />
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardLabel}>Email</Text>
                  <Text style={[styles.cardValue, { color: '#8fb4ff' }]}>{church.contactEmail || (church.subdomain ? `admin@${church.subdomain}.app` : 'admin@wechristian.app')}</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity 
                style={styles.cardRow} 
                onPress={() => {
                  const phone = church.contactPhone;
                  if (phone) Linking.openURL(`tel:${phone}`);
                }}
              >
                <Phone size={20} color="#94a3b8" />
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardLabel}>Phone</Text>
                  <Text style={[styles.cardValue, church.contactPhone ? { color: '#8fb4ff' } : {}]}>{church.contactPhone || 'No phone provided'}</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Subscription Section */}
            <Text style={styles.sectionTitle}>Subscription</Text>
            <View style={styles.card}>
              <View style={[styles.cardRow, { alignItems: 'flex-start' }]}>
                <Calendar size={20} color={church.subscription?.status === 'active' ? '#34d399' : '#f87171'} style={{ marginTop: 2 }} />
                <View style={[styles.cardTextContainer, { flex: 1 }]}>
                  
                  {/* Badge & Edit Action Row */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <View style={{ backgroundColor: church.subscription?.status === 'active' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: church.subscription?.status === 'active' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(248, 113, 113, 0.3)' }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: church.subscription?.status === 'active' ? '#34d399' : '#f87171', letterSpacing: 0.5 }}>
                        {church.subscription?.status?.toUpperCase() || 'UNKNOWN'}
                      </Text>
                    </View>
                    
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
                      <Text style={styles.cardLabel}>Expires</Text>
                      <Text style={[styles.cardValue, { marginTop: 4 }]}>
                        {formatDate(church.subscription?.validUntil)}
                      </Text>
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
