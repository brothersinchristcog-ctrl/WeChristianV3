import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  Image,
  Share,
  Clipboard,
  KeyboardAvoidingView,
  Platform,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Save, Palette, Image as ImageIcon, Link, DollarSign, Building2, Plus, Trash2, Plug, Info, Edit2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import ChurchService, { ChurchDetails } from '../../services/ChurchService';
import { useChurch } from '../../context/ChurchContext';
import { useAuth } from '../../context/AuthContext';
import { AdminTabContext } from '../../context/AdminTabContext';
import storage from '@react-native-firebase/storage';
import { CustomAlert } from '../../components/CustomAlert';

const PRESET_COLORS = [
  '#1a2d5a', '#c0392b', '#16a34a', '#7c3aed',
  '#b45309', '#0891b2', '#be185d', '#334155',
];

export default function AdminChurchSettings({ navigation }: any) {
  const { member } = useAuth();
  const { churchId, activeChurch, setActiveChurch } = useChurch();
  const { goBack } = React.useContext(AdminTabContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<'logo' | 'banner' | null>(null);

  const [form, setForm] = useState<Partial<ChurchDetails>>({});
  const [secrets, setSecrets] = useState<{ phonePeMerchantId?: string; phonePeSaltKey?: string; phonePeSaltIndex?: string; whatsappAccessToken?: string; whatsappPhoneId?: string; useWeChristianWhatsApp?: boolean }>({});
  const [activeTab, setActiveTab] = useState<'info' | 'branding' | 'giving' | 'integrations'>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'info' | 'error' | 'warning';
  }>({ visible: false, title: '', message: '', type: 'info' });

  useEffect(() => {
    loadChurchData();
  }, [churchId]);

  const loadChurchData = async () => {
    if (!churchId) return;
    const data = await ChurchService.getChurchDetails(churchId);
    if (data) {
      setForm(data);
    }
    const churchSecrets = await ChurchService.getChurchSecrets(churchId);
    if (churchSecrets) {
      setSecrets(churchSecrets);
    }
    setLoading(false);
  };

  const updateSecret = (field: string, value: string | boolean) => {
    setSecrets(prev => ({ ...prev, [field]: value }));
  };

  const updateField = (section: keyof ChurchDetails, field: string, value: any) => {
    setForm(prev => {
      const newForm = { ...prev };
      if (section === 'name' || section === 'tagline' || section === 'contactEmail' || section === 'contactPhone' || section === 'address' || section === 'aboutUs') {
        (newForm as any)[section] = value;
      } else {
        newForm[section] = { ...(newForm[section] as any || {}), [field]: value } as any;
      }
      return newForm;
    });
  };

  const addUpi = () => {
    const upis = form.givingDetails?.upis || [];
    updateField('givingDetails', 'upis', [...upis, { id: Date.now().toString(), name: '', upiId: '', phonepeNumber: '' }]);
  };

  const updateUpi = (index: number, key: string, value: string) => {
    const upis = [...(form.givingDetails?.upis || [])];
    upis[index] = { ...upis[index], [key]: value };
    updateField('givingDetails', 'upis', upis);
  };

  const removeUpi = (index: number) => {
    const upis = [...(form.givingDetails?.upis || [])];
    upis.splice(index, 1);
    updateField('givingDetails', 'upis', upis);
  };

  const addBank = () => {
    const banks = form.givingDetails?.banks || [];
    updateField('givingDetails', 'banks', [...banks, { id: Date.now().toString(), name: '', accountName: '', bankName: '', accountNumber: '', ifscCode: '' }]);
  };

  const updateBank = (index: number, key: string, value: string) => {
    const banks = [...(form.givingDetails?.banks || [])];
    banks[index] = { ...banks[index], [key]: value };
    updateField('givingDetails', 'banks', banks);
  };

  const removeBank = (index: number) => {
    const banks = [...(form.givingDetails?.banks || [])];
    banks.splice(index, 1);
    updateField('givingDetails', 'banks', banks);
  };

  const pickImage = async (type: 'logo' | 'banner') => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'logo' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      uploadImage(result.assets[0].uri, type);
    }
  };

  const uploadImage = async (uri: string, type: 'logo' | 'banner') => {
    if (!churchId) return;
    setUploadingImage(type);
    try {
      const ext = uri.substring(uri.lastIndexOf('.') + 1) || 'jpg';
      const storagePath = `churches/${churchId}/brand/${type}_${Date.now()}.${ext}`;

      const reference = storage().ref(storagePath);
      await reference.putFile(uri);
      const downloadURL = await reference.getDownloadURL();

      updateField('theme', type === 'logo' ? 'logoUrl' : 'bannerUrl', downloadURL);
      setUploadingImage(null);
    } catch (e: any) {
      console.error(e);
      setAlertConfig({ visible: true, title: 'Error', message: 'Failed to prepare image for upload', type: 'error' });
      setUploadingImage(null);
    }
  };

  const handleSave = async () => {
    if (!churchId) return;
    setSaving(true);
    try {
      await ChurchService.updateChurch(churchId, form);
      await ChurchService.updateChurchSecrets(churchId, secrets);
      // Refresh the context so the app updates immediately
      const updated = await ChurchService.getChurchDetails(churchId);
      if (updated) setActiveChurch(updated);
      setAlertConfig({ visible: true, title: 'Success', message: 'Church settings updated successfully!', type: 'success' });
    } catch (e) {
      console.error(e);
      setAlertConfig({ visible: true, title: 'Error', message: 'Failed to save settings.', type: 'error' });
    } finally {
      setSaving(false);
      setIsEditing(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#fbbf24" />
      </View>
    );
  }

  const primaryColor = form.theme?.primaryColor || '#1a2d5a';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <CustomAlert 
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
        />
        {/* ── Hero Section ── */}
        <View style={styles.hero}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <TouchableOpacity onPress={goBack} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                <ChevronLeft size={20} color="#fff" style={{ marginLeft: -6, marginRight: 4 }} />
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
              </TouchableOpacity>
              <Text style={[styles.heroTitle, { marginHorizontal: 12, opacity: 0.4 }]}>|</Text>
              <View>
                <Text style={styles.heroTitle}>Settings</Text>
                <Text style={[styles.heroSub, { marginTop: 2 }]}>Church info, branding & APIs</Text>
              </View>
            </View>
            {isEditing ? (
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#1a2d5a" size="small" />
                ) : (
                  <>
                    <Save size={16} color="#1a2d5a" />
                    <Text style={styles.saveBtnTxt}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                <Edit2 size={16} color="#1a2d5a" />
                <Text style={styles.editBtnTxt}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && { borderBottomColor: primaryColor }]}
            onPress={() => setActiveTab('info')}
          >
            <Building2 size={18} color={activeTab === 'info' ? primaryColor : '#64748b'} />
            <Text style={[styles.tabTxt, activeTab === 'info' && { color: primaryColor, fontWeight: '700' }]}>Info</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'branding' && { borderBottomColor: primaryColor }]}
            onPress={() => setActiveTab('branding')}
          >
            <Palette size={18} color={activeTab === 'branding' ? primaryColor : '#64748b'} />
            <Text style={[styles.tabTxt, activeTab === 'branding' && { color: primaryColor, fontWeight: '700' }]}>Brand</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'giving' && { borderBottomColor: primaryColor }]}
            onPress={() => setAlertConfig({ visible: true, title: 'Giving Details', message: 'Option Available Soon\n\nWe are currently working on integrating this feature. Please check back later!', type: 'info' })}
          >
            <DollarSign size={18} color={activeTab === 'giving' ? primaryColor : '#64748b'} />
            <Text style={[styles.tabTxt, activeTab === 'giving' && { color: primaryColor, fontWeight: '700' }]}>Giving</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'integrations' && { borderBottomColor: primaryColor }]}
            onPress={() => {
              if (activeChurch?.whatsappIntegrationEnabled) {
                setActiveTab('integrations');
              } else {
                setAlertConfig({
                  visible: true,
                  title: 'WhatsApp Integration Not Enabled',
                  message: 'WhatsApp Integration is not enabled for your church. Please contact the We Christian team to activate this feature. Once enabled, you will be able to use WhatsApp Integration from the We Celebration module and Church Settings.',
                  type: 'info'
                });
              }
            }}
          >
            <Plug size={18} color={activeTab === 'integrations' ? primaryColor : '#64748b'} />
            <Text style={[styles.tabTxt, activeTab === 'integrations' && { color: primaryColor, fontWeight: '700' }]}>WhatsApp</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* INFO TAB */}
          {activeTab === 'info' && (
            <View>
              {!isEditing && <Text style={styles.viewModeHint}>Tap 'Edit' in the top right to make changes.</Text>}

              {/* Church Code Card */}
              {(form as any).churchCode || form.subdomain ? (
                <View style={styles.churchCodeCard}>
                  <Text style={styles.churchCodeLabel}>CHURCH JOIN CODE</Text>
                  <Text style={[styles.churchCodeValue, { color: primaryColor }]}>
                    {(form as any).churchCode || (form.subdomain || '').toUpperCase()}
                  </Text>
                  <Text style={styles.churchCodeHint}>Share this code with your congregation to let them join</Text>
                  <View style={styles.churchCodeActions}>
                    <TouchableOpacity
                      style={[styles.churchCodeBtn, { borderColor: primaryColor }]}
                      onPress={() => {
                        const code = (form as any).churchCode || (form.subdomain || '').toUpperCase();
                        Clipboard.setString(code);
                        setAlertConfig({ visible: true, title: 'Copied!', message: `Church code "${code}" copied to clipboard.`, type: 'success' });
                      }}
                    >
                      <Text style={[styles.churchCodeBtnTxt, { color: primaryColor }]}>📋 Copy Code</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.churchCodeBtn, { borderColor: primaryColor }]}
                      onPress={() => {
                        const code = (form as any).churchCode || (form.subdomain || '').toUpperCase();
                        Share.share({
                          message: `Join "${form.name}" on WeChristian! Use the church code: ${code}`,
                          title: `Join ${form.name} on WeChristian`,
                        });
                      }}
                    >
                      <Text style={[styles.churchCodeBtnTxt, { color: primaryColor }]}>📤 Share Code</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              <Text style={styles.sectionLabel}>Basic Information</Text>

              <Text style={styles.label}>Church Name</Text>
              <TextInput style={[styles.input, !isEditing && styles.inputDisabled]} value={form.name} onChangeText={v => updateField('name' as any, '', v)} editable={isEditing} />

              <Text style={styles.label}>Tagline / Motto</Text>
              <TextInput style={[styles.input, !isEditing && styles.inputDisabled]} value={form.tagline} onChangeText={v => updateField('tagline' as any, '', v)} placeholder="e.g. A Gateway to Heaven" placeholderTextColor="#64748b" editable={isEditing} />

              <Text style={styles.label}>About Us</Text>
              <TextInput style={[styles.input, styles.textArea, !isEditing && styles.inputDisabled]} multiline numberOfLines={4} value={form.aboutUs} onChangeText={v => updateField('aboutUs' as any, '', v)} placeholder="Describe your church..." placeholderTextColor="#64748b" editable={isEditing} />

              <Text style={styles.label}>Address</Text>
              <TextInput style={[styles.input, styles.textArea, !isEditing && styles.inputDisabled]} multiline numberOfLines={2} value={form.address} onChangeText={v => updateField('address' as any, '', v)} editable={isEditing} />

              <Text style={styles.label}>Contact Phone</Text>
              <TextInput style={[styles.input, !isEditing && styles.inputDisabled]} value={form.contactPhone} onChangeText={v => updateField('contactPhone' as any, '', v)} keyboardType="phone-pad" editable={isEditing} />

              <Text style={styles.label}>Contact Email</Text>
              <TextInput style={[styles.input, !isEditing && styles.inputDisabled]} value={form.contactEmail} onChangeText={v => updateField('contactEmail' as any, '', v)} keyboardType="email-address" autoCapitalize="none" editable={isEditing} />

              <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Social Links</Text>

              <View style={[styles.inputRow, !isEditing && styles.inputDisabled]}>
                <Link size={16} color="#64748b" />
                <TextInput style={styles.inputFlex} placeholder="Website URL" value={form.socialLinks?.website} onChangeText={v => updateField('socialLinks', 'website', v)} editable={isEditing} />
              </View>
              <View style={[styles.inputRow, !isEditing && styles.inputDisabled]}>
                <Text style={styles.socialPrefix}>YouTube</Text>
                <TextInput style={styles.inputFlex} placeholder="Channel or Live URL" value={form.socialLinks?.youtube} onChangeText={v => updateField('socialLinks', 'youtube', v)} editable={isEditing} />
              </View>
              <View style={[styles.inputRow, !isEditing && styles.inputDisabled]}>
                <Text style={styles.socialPrefix}>Facebook</Text>
                <TextInput style={styles.inputFlex} placeholder="Page URL" value={form.socialLinks?.facebook} onChangeText={v => updateField('socialLinks', 'facebook', v)} editable={isEditing} />
              </View>
              <View style={[styles.inputRow, !isEditing && styles.inputDisabled]}>
                <Text style={styles.socialPrefix}>Instagram</Text>
                <TextInput style={styles.inputFlex} placeholder="Profile URL" value={form.socialLinks?.instagram} onChangeText={v => updateField('socialLinks', 'instagram', v)} editable={isEditing} />
              </View>

              {member?.userType === 'super_admin' && (
                <>
                  <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Advanced Features</Text>
                  <View style={[styles.switchRow, !isEditing && styles.inputDisabled]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.switchLabel}>Enable WhatsApp Automation</Text>
                      <Text style={styles.switchHint}>Unlock the We Celebrations tab and WhatsApp integration settings.</Text>
                    </View>
                    <Switch
                      value={form.features?.hasWhatsAppAutomation || false}
                      onValueChange={v => {
                        const currentFeatures = form.features || { hasSermons: false, hasDailyPromises: false, hasWorshipSongs: false, hasGiving: false };
                        setForm({ ...form, features: { ...currentFeatures, hasWhatsAppAutomation: v } });
                      }}
                      disabled={!isEditing}
                      trackColor={{ false: '#cbd5e1', true: primaryColor }}
                    />
                  </View>
                </>
              )}
            </View>
          )}

          {/* BRANDING TAB */}
          {activeTab === 'branding' && (
            <View>
              {!isEditing && <Text style={styles.viewModeHint}>Tap 'Edit' in the top right to make changes.</Text>}
              <Text style={styles.sectionLabel}>Church Logo</Text>
              <TouchableOpacity style={[styles.imageUpload, !isEditing && styles.inputDisabled]} onPress={() => isEditing && pickImage('logo')} disabled={!isEditing}>
                {uploadingImage === 'logo' ? (
                  <ActivityIndicator color={primaryColor} />
                ) : form.theme?.logoUrl ? (
                  <Image source={{ uri: form.theme.logoUrl }} style={styles.logoPreview} />
                ) : (
                  <>
                    <ImageIcon size={32} color="#64748b" />
                    <Text style={styles.uploadTxt}>Tap to upload logo</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.sectionLabel}>Church Banner</Text>
              <TouchableOpacity style={[styles.imageUpload, styles.bannerUpload, !isEditing && styles.inputDisabled]} onPress={() => isEditing && pickImage('banner')} disabled={!isEditing}>
                {uploadingImage === 'banner' ? (
                  <ActivityIndicator color={primaryColor} />
                ) : form.theme?.bannerUrl ? (
                  <Image source={{ uri: form.theme.bannerUrl }} style={styles.bannerPreview} />
                ) : (
                  <>
                    <ImageIcon size={32} color="#64748b" />
                    <Text style={styles.uploadTxt}>Tap to upload banner (16:9)</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.sectionLabel}>Primary Color</Text>
              <View style={styles.colorGrid}>
                {PRESET_COLORS.map(c => (
                  <TouchableOpacity key={c} style={[styles.colorSwatch, { backgroundColor: c }, form.theme?.primaryColor === c && styles.colorSwatchSelected, !isEditing && styles.colorSwatchDisabled]} onPress={() => isEditing && updateField('theme', 'primaryColor', c)} disabled={!isEditing} />
                ))}
              </View>

              <Text style={styles.sectionLabel}>Accent Color</Text>
              <View style={styles.colorGrid}>
                {PRESET_COLORS.map(c => (
                  <TouchableOpacity key={c} style={[styles.colorSwatch, { backgroundColor: c }, form.theme?.secondaryColor === c && styles.colorSwatchSelected, !isEditing && styles.colorSwatchDisabled]} onPress={() => isEditing && updateField('theme', 'secondaryColor', c)} disabled={!isEditing} />
                ))}
              </View>
            </View>
          )}

          {/* GIVING TAB */}
          {activeTab === 'giving' && (
            <View>
              {!isEditing && <Text style={styles.viewModeHint}>Tap 'Edit' in the top right to make changes.</Text>}

              <Text style={styles.sectionLabel}>PhonePe Payment Gateway Config (Secrets)</Text>
              <Text style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
                These values are stored securely and never exposed to members. Used for automated web checkout.
              </Text>

              <Text style={styles.label}>Merchant ID</Text>
              <TextInput style={[styles.input, !isEditing && styles.inputDisabled]} value={secrets.phonePeMerchantId} onChangeText={v => updateSecret('phonePeMerchantId', v)} placeholder="e.g. M1234567890" placeholderTextColor="#64748b" editable={isEditing} />

              <Text style={styles.label}>Salt Key</Text>
              <TextInput style={[styles.input, !isEditing && styles.inputDisabled]} value={secrets.phonePeSaltKey} onChangeText={v => updateSecret('phonePeSaltKey', v)} placeholder="e.g. 099eb0cd-02cf-4e2a-8aca-3e6c6aff0399" placeholderTextColor="#64748b" secureTextEntry={!isEditing} editable={isEditing} />

              <Text style={styles.label}>Salt Index</Text>
              <TextInput style={[styles.input, !isEditing && styles.inputDisabled]} value={secrets.phonePeSaltIndex} onChangeText={v => updateSecret('phonePeSaltIndex', v)} placeholder="e.g. 1" placeholderTextColor="#64748b" keyboardType="numeric" editable={isEditing} />

              <Text style={[styles.sectionLabel, { marginTop: 12 }]}>Primary UPI & Mobile Payments</Text>

              <Text style={styles.label}>UPI ID</Text>
              <TextInput style={[styles.input, !isEditing && styles.inputDisabled]} value={form.givingDetails?.upiId} onChangeText={v => updateField('givingDetails', 'upiId', v)} placeholder="e.g. church@okicici" placeholderTextColor="#64748b" editable={isEditing} />

              <Text style={styles.label}>PhonePe Number</Text>
              <TextInput style={[styles.input, !isEditing && styles.inputDisabled]} value={form.givingDetails?.phonepeNumber} onChangeText={v => updateField('givingDetails', 'phonepeNumber', v)} placeholder="e.g. 9876543210" placeholderTextColor="#64748b" keyboardType="phone-pad" editable={isEditing} />

              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>Additional UPI Accounts</Text>
                {isEditing && (
                  <TouchableOpacity onPress={addUpi} style={styles.addBtn}>
                    <Plus size={16} color="#1a2d5a" />
                    <Text style={styles.addBtnTxt}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>

              {form.givingDetails?.upis?.map((upi, i) => (
                <View key={upi.id} style={[styles.cardItem, !isEditing && styles.inputDisabled]}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>UPI Account #{i + 1}</Text>
                    {isEditing && (
                      <TouchableOpacity onPress={() => removeUpi(i)}>
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.label}>Label (e.g. Building Fund)</Text>
                  <TextInput style={[styles.input, !isEditing && { backgroundColor: 'transparent', borderColor: 'transparent', paddingHorizontal: 0, height: 30 }]} value={upi.name} onChangeText={v => updateUpi(i, 'name', v)} placeholder="Fund Name" placeholderTextColor="#64748b" editable={isEditing} />
                  <Text style={styles.label}>UPI ID</Text>
                  <TextInput style={[styles.input, !isEditing && { backgroundColor: 'transparent', borderColor: 'transparent', paddingHorizontal: 0, height: 30 }]} value={upi.upiId} onChangeText={v => updateUpi(i, 'upiId', v)} placeholder="church@okicici" placeholderTextColor="#64748b" editable={isEditing} />
                  <Text style={styles.label}>PhonePe Number</Text>
                  <TextInput style={[styles.input, !isEditing && { backgroundColor: 'transparent', borderColor: 'transparent', paddingHorizontal: 0, height: 30 }]} value={upi.phonepeNumber} onChangeText={v => updateUpi(i, 'phonepeNumber', v)} placeholder="Optional" placeholderTextColor="#64748b" keyboardType="phone-pad" editable={isEditing} />
                </View>
              ))}

              <Text style={[styles.sectionLabel, { marginTop: 24 }]}>PhonePe Gateway Configuration</Text>

              <Text style={styles.label}>Merchant ID</Text>
              <TextInput style={[styles.input, !isEditing && styles.inputDisabled]} value={secrets.phonePeMerchantId} onChangeText={v => updateSecret('phonePeMerchantId', v)} placeholder="e.g. PGTESTPAYUAT" placeholderTextColor="#64748b" editable={isEditing} />

              <Text style={styles.label}>Salt Key</Text>
              <TextInput style={[styles.input, !isEditing && styles.inputDisabled]} value={secrets.phonePeSaltKey} onChangeText={v => updateSecret('phonePeSaltKey', v)} placeholder="e.g. 099eb0cd-02cf-4e2a-8aca-3e6c6aff0399" placeholderTextColor="#64748b" editable={isEditing} secureTextEntry={!isEditing} />

              <Text style={styles.label}>Salt Index</Text>
              <TextInput style={[styles.input, !isEditing && styles.inputDisabled]} value={secrets.phonePeSaltIndex} onChangeText={v => updateSecret('phonePeSaltIndex', v)} placeholder="1" placeholderTextColor="#64748b" editable={isEditing} keyboardType="numeric" />

              <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Primary Bank Transfer Details</Text>

              <Text style={styles.label}>Account Name</Text>
              <TextInput style={[styles.input, !isEditing && styles.inputDisabled]} value={form.givingDetails?.accountName} onChangeText={v => updateField('givingDetails', 'accountName', v)} placeholder="Brothers in Christ" placeholderTextColor="#64748b" editable={isEditing} />

              <Text style={styles.label}>Bank Name</Text>
              <TextInput style={[styles.input, !isEditing && styles.inputDisabled]} value={form.givingDetails?.bankName} onChangeText={v => updateField('givingDetails', 'bankName', v)} placeholder="HDFC Bank" placeholderTextColor="#64748b" editable={isEditing} />

              <Text style={styles.label}>Account Number</Text>
              <TextInput style={[styles.input, !isEditing && styles.inputDisabled]} value={form.givingDetails?.accountNumber} onChangeText={v => updateField('givingDetails', 'accountNumber', v)} placeholder="50100XXXXXXX" placeholderTextColor="#64748b" keyboardType="numeric" editable={isEditing} />

              <Text style={styles.label}>IFSC Code</Text>
              <TextInput style={[styles.input, !isEditing && styles.inputDisabled]} value={form.givingDetails?.ifscCode} onChangeText={v => updateField('givingDetails', 'ifscCode', v)} placeholder="HDFC0001234" placeholderTextColor="#64748b" autoCapitalize="characters" editable={isEditing} />

              <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
                <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>Additional Bank Accounts</Text>
                {isEditing && (
                  <TouchableOpacity onPress={addBank} style={styles.addBtn}>
                    <Plus size={16} color="#1a2d5a" />
                    <Text style={styles.addBtnTxt}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>

              {form.givingDetails?.banks?.map((bank, i) => (
                <View key={bank.id} style={[styles.cardItem, !isEditing && styles.inputDisabled]}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Bank Account #{i + 1}</Text>
                    {isEditing && (
                      <TouchableOpacity onPress={() => removeBank(i)}>
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.label}>Label (e.g. Charity Fund)</Text>
                  <TextInput style={[styles.input, !isEditing && { backgroundColor: 'transparent', borderColor: 'transparent', paddingHorizontal: 0, height: 30 }]} value={bank.name} onChangeText={v => updateBank(i, 'name', v)} placeholder="Fund Name" placeholderTextColor="#64748b" editable={isEditing} />
                  <Text style={styles.label}>Account Name</Text>
                  <TextInput style={[styles.input, !isEditing && { backgroundColor: 'transparent', borderColor: 'transparent', paddingHorizontal: 0, height: 30 }]} value={bank.accountName} onChangeText={v => updateBank(i, 'accountName', v)} placeholder="Brothers in Christ" placeholderTextColor="#64748b" editable={isEditing} />
                  <Text style={styles.label}>Bank Name</Text>
                  <TextInput style={[styles.input, !isEditing && { backgroundColor: 'transparent', borderColor: 'transparent', paddingHorizontal: 0, height: 30 }]} value={bank.bankName} onChangeText={v => updateBank(i, 'bankName', v)} placeholder="HDFC Bank" placeholderTextColor="#64748b" editable={isEditing} />
                  <Text style={styles.label}>Account Number</Text>
                  <TextInput style={[styles.input, !isEditing && { backgroundColor: 'transparent', borderColor: 'transparent', paddingHorizontal: 0, height: 30 }]} value={bank.accountNumber} onChangeText={v => updateBank(i, 'accountNumber', v)} placeholder="50100XXXXXXX" placeholderTextColor="#64748b" keyboardType="numeric" editable={isEditing} />
                  <Text style={styles.label}>IFSC Code</Text>
                  <TextInput style={[styles.input, !isEditing && { backgroundColor: 'transparent', borderColor: 'transparent', paddingHorizontal: 0, height: 30 }]} value={bank.ifscCode} onChangeText={v => updateBank(i, 'ifscCode', v)} placeholder="HDFC0001234" placeholderTextColor="#64748b" autoCapitalize="characters" editable={isEditing} />
                </View>
              ))}

            </View>
          )}

          {/* INTEGRATIONS TAB */}
          {activeTab === 'integrations' && (
            <View>
              {!isEditing && <Text style={styles.viewModeHint}>Tap 'Edit' in the top right to make changes.</Text>}

              <Text style={styles.sectionLabel}>WhatsApp Meta Graph API</Text>
              <Text style={{ fontSize: 11, color: '#64748b', marginBottom: 16 }}>
                Configure how this church sends automated WhatsApp messages (e.g. Birthdays, Events).
              </Text>

              <View style={styles.switchRow}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.switchLabel}>Use We Christian WhatsApp Account</Text>
                  <Text style={styles.switchHint}>If enabled, messages will be sent from the official platform number. If disabled, you must provide your own Meta credentials below.</Text>
                </View>
                <Switch
                  value={secrets.useWeChristianWhatsApp ?? false}
                  onValueChange={v => updateSecret('useWeChristianWhatsApp', v)}
                  disabled={!isEditing}
                  trackColor={{ false: '#cbd5e1', true: primaryColor }}
                />
              </View>
              
              {!(secrets.useWeChristianWhatsApp ?? false) && (
                <View style={{ marginTop: 16 }}>
                  <View style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe', borderWidth: 1, padding: 16, borderRadius: 12, marginBottom: 20, flexDirection: 'row', alignItems: 'flex-start' }}>
                    <Info size={20} color="#2563eb" style={{ marginTop: 2, marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#1e3a8a', marginBottom: 6 }}>Using your own WhatsApp Business Account?</Text>
                      <Text style={{ fontSize: 13, color: '#1e40af', lineHeight: 20 }}>Please contact the We Christian team. We'll assist you in setting up and verifying your Meta API credentials correctly.</Text>
                    </View>
                  </View>
                  
                  <View style={styles.cardItem}>
                    <Text style={styles.cardTitle}>Custom API Credentials</Text>
                    
                    <View style={{ height: 16 }} />
                    <Text style={styles.label}>Access Token (Permanent)</Text>
                    <TextInput style={[styles.input, !isEditing && styles.inputDisabled, { marginBottom: 16 }]} value={secrets.whatsappAccessToken} onChangeText={v => updateSecret('whatsappAccessToken', v)} placeholder="e.g. EAAH..." placeholderTextColor="#94a3b8" secureTextEntry={!isEditing} editable={isEditing} />
      
                    <Text style={styles.label}>Phone Number ID</Text>
                    <TextInput style={[styles.input, !isEditing && styles.inputDisabled, { marginBottom: 0 }]} value={secrets.whatsappPhoneId} onChangeText={v => updateSecret('whatsappPhoneId', v)} placeholder="e.g. 101452637283" placeholderTextColor="#94a3b8" keyboardType="numeric" editable={isEditing} />
                  </View>
                </View>
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDE8DC' },
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

  saveBtn: { 
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
  saveBtnTxt: { color: '#1a2d5a', fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },
  
  editBtn: { 
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
  editBtnTxt: { color: '#1a2d5a', fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },

  viewModeHint: { backgroundColor: '#F0EBE0', color: '#1a2d5a', padding: 12, borderRadius: 12, marginBottom: 16, fontSize: 13, fontWeight: '700', textAlign: 'center', borderWidth: 1, borderColor: '#E2DDD5' },

  tabs: {
    flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 0,
    shadowColor: '#1a2d5a', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4, zIndex: 10
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderBottomWidth: 3, borderBottomColor: 'transparent',
  },
  tabTxt: { fontSize: 13, color: '#64748b', fontWeight: '700' },

  content: { padding: 20, paddingBottom: 60 },
  sectionLabel: { fontSize: 14, fontWeight: '800', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16, marginTop: 8, paddingLeft: 4 },

  label: { fontSize: 11, fontWeight: '800', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: {
    backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: '#1a2d5a', fontWeight: '600', borderWidth: 1.5, borderColor: 'rgba(26,45,90,0.1)', marginBottom: 16,
  },
  textArea: { height: 100, textAlignVertical: 'top' },

  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1.5, borderColor: 'rgba(26,45,90,0.1)', marginBottom: 16,
  },
  socialPrefix: { fontSize: 13, color: '#6B7280', fontWeight: '700', width: 70 },
  inputFlex: { flex: 1, fontSize: 15, color: '#1a2d5a', fontWeight: '600' },

  inputDisabled: { backgroundColor: '#F9F6F0', borderColor: '#E2DDD5', color: '#6B7280', opacity: 0.9 },

  imageUpload: {
    backgroundColor: '#F9F6F0', borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(26,45,90,0.2)', borderStyle: 'dashed',
    height: 120, justifyContent: 'center', alignItems: 'center', marginBottom: 24, gap: 10,
    overflow: 'hidden',
  },
  bannerUpload: { height: 180 },
  logoPreview: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#fff' },
  bannerPreview: { width: '100%', height: '100%' },
  uploadTxt: { color: '#1a2d5a', fontSize: 13, fontWeight: '700' },

  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 24 },
  colorSwatch: { width: 48, height: 48, borderRadius: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  colorSwatchSelected: { borderWidth: 4, borderColor: '#fff', shadowColor: '#1a2d5a', shadowOpacity: 0.3, shadowRadius: 6 },
  colorSwatchDisabled: {
    opacity: 0.6,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(26,45,90,0.08)',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1a2d5a',
    marginBottom: 4,
  },
  switchHint: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    fontWeight: '500'
  },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 8 },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#C9A84C', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, shadowColor: '#C9A84C', shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  addBtnTxt: { fontSize: 12, fontWeight: '800', color: '#1a2d5a', marginLeft: 6, letterSpacing: 0.3 },
  cardItem: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(26,45,90,0.08)', marginBottom: 16, shadowColor: '#1a2d5a', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#1a2d5a' },

  churchCodeCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, marginBottom: 28,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(26,45,90,0.08)',
    shadowColor: '#1a2d5a', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6
  },
  churchCodeLabel: {
    fontSize: 11, fontWeight: '800', color: '#C9A84C', letterSpacing: 2, marginBottom: 10,
  },
  churchCodeValue: {
    fontSize: 36, fontWeight: '900', letterSpacing: 8, marginBottom: 8, color: '#1a2d5a'
  },
  churchCodeHint: {
    fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 20, fontWeight: '500'
  },
  churchCodeActions: {
    flexDirection: 'row', gap: 12, width: '100%'
  },
  churchCodeBtn: {
    borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, flex: 1, alignItems: 'center', backgroundColor: '#F9F6F0', borderColor: '#E2DDD5'
  },
  churchCodeBtnTxt: {
    fontSize: 13, fontWeight: '800', color: '#1a2d5a'
  },
});
