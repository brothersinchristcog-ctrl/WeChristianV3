import React, { useState } from 'react';
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
  Platform,
  Modal,
  FlatList,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useChurch } from '../../context/ChurchContext';
import { useAuth } from '../../context/AuthContext';
import { firestore, FieldValue } from '../../services/firebaseConfig';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { ChevronLeft, Building2, Palette, Phone, Mail, Globe, Check, Image as ImageIcon, ChevronDown, MapPin, Briefcase, Home } from 'lucide-react-native';
import { State, City } from 'country-state-city';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'CreateChurch'>;
};

const PRESET_COLORS = [
  '#1a2d5a', '#c0392b', '#16a34a', '#7c3aed',
  '#b45309', '#0891b2', '#be185d', '#334155',
];

function generateChurchCode(name: string): string {
  // Take first letters of each word, max 6 chars
  const initials = name
    .replace(/[^a-zA-Z\s]/g, '')
    .split(' ')
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .join('');
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return (initials + random).substring(0, 8);
}

export default function CreateChurchScreen({ navigation }: Props) {
  const { setChurchId } = useChurch();
  const { member, setMember, setViewMode } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    contactEmail: '',
    contactPhone: '',
    houseNo: '',
    street: '',
    state: '',
    stateIsoCode: '',
    city: '',
    pincode: '',
    website: '',
    tagline: '',
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#1a2d5a');
  const [secondaryColor, setSecondaryColor] = useState('#c0392b');

  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [confirmation, setConfirmation] = useState<any>(null);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Automatically trigger verification when 6 digits are detected
  React.useEffect(() => {
    if (otpCode.length === 6 && !verifyingOtp && otpModalVisible) {
      verifyOtpAndCreate();
    }
  }, [otpCode]);

  // Picker State
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState<'state' | 'city'>('state');
  
  const indianStates = State.getStatesOfCountry('IN');
  const availableCities = form.stateIsoCode ? City.getCitiesOfState('IN', form.stateIsoCode) : [];

  const updateForm = (key: string, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const requestOtp = async () => {
    if (!form.name.trim()) {
      Alert.alert('Required', 'Please enter your church name.');
      return;
    }
    if (!form.contactEmail.trim()) {
      Alert.alert('Required', 'Please enter a contact email.');
      return;
    }
    if (!form.contactPhone.trim()) {
      Alert.alert('Required', 'Please enter a contact phone number to verify ownership.');
      return;
    }

    setLoading(true);
    try {
      let cleanNum = form.contactPhone.replace(/[^0-9+]/g, '');
      if (cleanNum.length === 10 && !cleanNum.startsWith('+')) {
        cleanNum = `+91${cleanNum}`;
      }
      if (!cleanNum.startsWith('+') || cleanNum.length < 12) {
        Alert.alert('Invalid Number', 'Please enter a valid 10-digit phone number.');
        setLoading(false);
        return;
      }

      const conf = await auth().signInWithPhoneNumber(cleanNum);
      setConfirmation(conf);
      setOtpModalVisible(true);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', 'Unable to send SMS. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

    const hasProcessedRef = React.useRef(false);

  React.useEffect(() => {
    let subscriber: any;
    if (otpModalVisible) {
      subscriber = auth().onAuthStateChanged(user => {
        if (user && !hasProcessedRef.current) {
          console.log('🤖 Auto-verified via Firebase SMS intercept in CreateChurch!');
          hasProcessedRef.current = true;
          setOtpModalVisible(false);
          performCreateChurch();
        }
      });
    } else {
      hasProcessedRef.current = false;
    }
    return () => {
      if (subscriber) subscriber();
    };
  }, [otpModalVisible]);

  const verifyOtpAndCreate = async () => {
    if (hasProcessedRef.current) return;
    if (!otpCode || otpCode.length < 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit OTP.');
      return;
    }
    setVerifyingOtp(true);
    try {
      const credential = auth.PhoneAuthProvider.credential(confirmation.verificationId, otpCode);
      await auth().signInWithCredential(credential);
      
      hasProcessedRef.current = true;
      setOtpModalVisible(false);
      await performCreateChurch();
    } catch (e: any) {
      Alert.alert('Error', 'Invalid OTP code. Please try again.');
      setVerifyingOtp(false);
    }
  };

  const performCreateChurch = async () => {
    setLoading(true);
    setUploading(true);
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error('Not authenticated');

      const churchCode = generateChurchCode(form.name);
      const churchData = {
        name: form.name.trim(),
        subdomain: churchCode.toLowerCase(),
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim(),
        address: `${form.houseNo ? form.houseNo + ', ' : ''}${form.street ? form.street + ', ' : ''}${form.city ? form.city + ', ' : ''}${form.state ? form.state + ' - ' : ''}${form.pincode}`,
        tagline: form.tagline.trim(),
        theme: {
          primaryColor,
          secondaryColor,
          backgroundColor: '',
          textColor: '',
          logoUrl: '',
          bannerUrl: '',
        },
        socialLinks: {
          website: form.website.trim(),
        },
        features: {
          hasSermons: true,
          hasDailyPromises: true,
          hasWorshipSongs: true,
          hasGiving: true,
        },
        createdBy: currentUser.uid,
        createdAt: FieldValue.serverTimestamp(),
        memberCount: 1,
        subscriptionTier: 'free',
        whatsappIntegrationEnabled: false,
      };

      const docRef = await firestore().collection('churches').add(churchData);

      if (currentUser) {
        // Global users collection is no longer used. We rely on the nested members collection to find the user's primary church.

        // Create Admin member profile nested in this new church
        await firestore().collection('churches').doc(docRef.id).collection('members').doc(currentUser.uid).set({
          id: currentUser.uid,
          name: member?.name || currentUser.displayName || 'Admin',
          phone: member?.phone || currentUser.phoneNumber || '',
          userType: 'Admin',
          joinDate: new Date().toISOString()
        });

        // Force update AuthContext so it doesn't get stuck on old cached data
        const updatedMember = {
          ...(member || {}),
          id: currentUser.uid,
          name: member?.name || currentUser.displayName || 'Admin',
          phone: member?.phone || currentUser.phoneNumber || '',
          churchId: docRef.id,
          primaryChurchId: docRef.id,
          userType: 'Admin'
        };
        
        // Fix Race Condition: Set the FirestoreService churchId directly BEFORE triggering app navigation
        await require('../../services/FirestoreService').default.setChurchId(docRef.id);
        
        setMember(updatedMember as any);
        setViewMode('admin');
        
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('@cached_member', JSON.stringify(updatedMember));
      }

      // Upload image if selected
      let downloadURL = '';
      if (selectedImage) {
        try {
          const ext = selectedImage.substring(selectedImage.lastIndexOf('.') + 1) || 'jpg';
          const storagePath = `churches/${docRef.id}/brand/logo_${Date.now()}.${ext}`;
          
          const reference = storage().ref(storagePath);
          await reference.putFile(selectedImage);
          downloadURL = await reference.getDownloadURL();

          await docRef.update({ 'theme.logoUrl': downloadURL });
        } catch (uploadErr: any) {
          console.error("Firebase Upload Error Details: ", uploadErr);
          Alert.alert('Upload Warning', `Church created, but logo failed to upload. Error: ${uploadErr.message || String(uploadErr)}`);
        }
      }

      await setChurchId(docRef.id);
      navigation.replace('Login');
    } catch (e: any) {
      console.error('Error creating church:', e);
      Alert.alert('Error', 'Failed to create church. Please try again.');
    } finally {
      setLoading(false);
      setUploading(false);
      setVerifyingOtp(false);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.topNav}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <ChevronLeft size={24} color="#f8fafc" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Register Church</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            
            <View style={styles.infoBanner}>
              <View style={styles.infoIconBox}>
                <Home size={18} color="#D9A05B" />
              </View>
              <Text style={styles.infoTxt}>
                Register your church to get started. You'll receive a unique Church Code to share with your members.
              </Text>
            </View>

            {/* Basic Details */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Briefcase size={14} color="#D9A05B" />
                <Text style={styles.sectionTitle}>CHURCH INFORMATION</Text>
              </View>

              <Text style={styles.fieldLabel}>Church Name <Text style={styles.asterisk}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Church of God, Bangalore"
                placeholderTextColor="#64748b"
                value={form.name}
                onChangeText={v => updateForm('name', v)}
              />

              <Text style={styles.fieldLabel}>Tagline / Motto</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. A Gateway to Heaven"
                placeholderTextColor="#64748b"
                value={form.tagline}
                onChangeText={v => updateForm('tagline', v)}
              />

              <Text style={styles.fieldLabel}>Church Logo</Text>
              <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
                {selectedImage ? (
                  <Image source={{ uri: selectedImage }} style={styles.selectedLogoPreview} />
                ) : (
                  <>
                    <ImageIcon size={24} color="#64748b" />
                    <Text style={styles.uploadTxt}>Tap to upload logo</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Contact Email <Text style={styles.asterisk}>*</Text></Text>
              <View style={styles.inputRow}>
                <Mail size={16} color="#64748b" />
                <TextInput
                  style={styles.inputFlex}
                  placeholder="pastor@church.com"
                  placeholderTextColor="#64748b"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={form.contactEmail}
                  onChangeText={v => updateForm('contactEmail', v)}
                />
              </View>

              <Text style={styles.fieldLabel}>Contact Phone</Text>
              <View style={styles.inputRow}>
                <Phone size={16} color="#64748b" />
                <TextInput
                  style={styles.inputFlex}
                  placeholder="+91 99887 76655"
                  placeholderTextColor="#64748b"
                  keyboardType="phone-pad"
                  value={form.contactPhone}
                  onChangeText={v => updateForm('contactPhone', v)}
                />
              </View>

              <View style={[styles.sectionTitleRow, { marginTop: 24, marginBottom: 8 }]}>
                <MapPin size={14} color="#D9A05B" />
                <Text style={styles.sectionTitle}>ADDRESS DETAILS</Text>
              </View>
              
              <View style={styles.grid}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>H.No / Door No</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 1-23/A"
                    placeholderTextColor="#64748b"
                    value={form.houseNo}
                    onChangeText={v => updateForm('houseNo', v)}
                  />
                </View>
                <View style={{ flex: 2 }}>
                  <Text style={styles.fieldLabel}>Street / Colony</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. MG Road"
                    placeholderTextColor="#64748b"
                    value={form.street}
                    onChangeText={v => updateForm('street', v)}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>State <Text style={styles.asterisk}>*</Text></Text>
              <TouchableOpacity 
                style={styles.pickerBtn} 
                onPress={() => { setPickerType('state'); setPickerVisible(true); }}
              >
                <Text style={[styles.pickerTxt, !form.state && { color: '#64748b' }]}>
                  {form.state || 'Select State'}
                </Text>
                <ChevronDown size={18} color="#94a3b8" />
              </TouchableOpacity>

              <View style={styles.grid}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.fieldLabel}>City / Town / Village <Text style={styles.asterisk}>*</Text></Text>
                  <TouchableOpacity 
                    style={styles.pickerBtn} 
                    onPress={() => {
                      if (!form.state) {
                        Alert.alert('Select State', 'Please select a state first.');
                        return;
                      }
                      setPickerType('city'); setPickerVisible(true); 
                    }}
                  >
                    <Text style={[styles.pickerTxt, !form.city && { color: '#64748b' }]}>
                      {form.city || 'Select City'}
                    </Text>
                    <ChevronDown size={18} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Pincode</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="500001"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    value={form.pincode}
                    onChangeText={v => updateForm('pincode', v)}
                  />
                </View>
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 24, color: '#cbd5e1', fontSize: 12, fontWeight: '600', marginBottom: 6 }]}>Website</Text>
              <View style={styles.inputRow}>
                <Globe size={16} color="#64748b" />
                <TextInput
                  style={styles.inputFlex}
                  placeholder="https://yourchurch.com"
                  placeholderTextColor="#64748b"
                  autoCapitalize="none"
                  keyboardType="url"
                  value={form.website}
                  onChangeText={v => updateForm('website', v)}
                />
              </View>
            </View>

            {/* Branding */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Palette size={14} color="#D9A05B" />
                <Text style={styles.sectionTitle}>CHURCH BRANDING</Text>
              </View>
              <Text style={styles.brandingNote}>
                Choose your church's primary and accent colors.
              </Text>

              <Text style={styles.fieldLabel}>Primary Color</Text>
              <View style={styles.colorGrid}>
                {PRESET_COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorSwatchWrapper, primaryColor === c && styles.colorSwatchWrapperSelected]}
                    onPress={() => setPrimaryColor(c)}
                  >
                    <View style={[styles.colorSwatch, { backgroundColor: c }]}>
                      {primaryColor === c && <Check size={14} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Accent Color</Text>
              <View style={styles.colorGrid}>
                {PRESET_COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorSwatchWrapper, secondaryColor === c && styles.colorSwatchWrapperSelected]}
                    onPress={() => setSecondaryColor(c)}
                  >
                    <View style={[styles.colorSwatch, { backgroundColor: c }]}>
                      {secondaryColor === c && <Check size={14} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Preview */}
              <View style={[styles.preview, { backgroundColor: primaryColor }]}>
                <View style={[styles.previewAccent, { backgroundColor: secondaryColor }]} />
                {selectedImage && (
                  <View style={styles.previewLogoContainer}>
                    <Image source={{ uri: selectedImage }} style={styles.previewLogo} />
                  </View>
                )}
                <Text style={styles.previewTxt}>{form.name || 'Your Church Name'}</Text>
                <Text style={styles.previewSub}>{form.tagline || 'Preview'}</Text>
              </View>
            </View>

            {/* Submit */}
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={requestOtp}
                disabled={loading || uploading}
              >
                {loading || uploading ? (
                  <ActivityIndicator color="#0f172a" />
                ) : (
                  <Text style={styles.primaryBtnTxt}>Register Church</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.footer}>
                By registering, you agree to WeChristian's terms of service. You will be set as the Admin of this church.
              </Text>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Modal Picker */}
        <Modal visible={pickerVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Select {pickerType === 'state' ? 'State' : 'City/Town'}
                </Text>
                <TouchableOpacity onPress={() => setPickerVisible(false)}>
                  <Text style={styles.modalClose}>Close</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={(pickerType === 'state' ? indianStates : availableCities) as any[]}
                keyExtractor={(item, index) => item.name + index}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.pickerItem}
                    onPress={() => {
                      if (pickerType === 'state') {
                        updateForm('state', item.name);
                        updateForm('stateIsoCode', (item as any).isoCode);
                        updateForm('city', ''); // Reset city
                      } else {
                        updateForm('city', item.name);
                      }
                      setPickerVisible(false);
                    }}
                  >
                    <Text style={styles.pickerItemTxt}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ padding: 16 }}
              />
            </View>
          </View>
        </Modal>

        {/* OTP Modal */}
        <Modal visible={otpModalVisible} animationType="fade" transparent={true}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 }}
          >
            <View style={{ backgroundColor: '#1e293b', padding: 28, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15 }}>
              <Text style={[styles.modalTitle, { fontSize: 20, textAlign: 'center', marginBottom: 8 }]}>Verify Phone</Text>
              <Text style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
                Enter the 6-digit code sent to{'\n'}<Text style={{ color: '#D9A05B', fontWeight: 'bold' }}>{form.contactPhone}</Text>
              </Text>
              <TextInput
                style={[styles.input, { fontSize: 28, textAlign: 'center', letterSpacing: 8, paddingVertical: 16, backgroundColor: '#151e32' }]}
                placeholder="000000"
                placeholderTextColor="#334155"
                keyboardType="number-pad"
                maxLength={6}
                value={otpCode}
                onChangeText={setOtpCode}
                autoFocus={true}
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
              />
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: '#D9A05B', marginTop: 28 }]}
                onPress={verifyOtpAndCreate}
                disabled={verifyingOtp}
              >
                {verifyingOtp ? (
                  <ActivityIndicator color="#0f172a" />
                ) : (
                  <Text style={styles.primaryBtnTxt}>Verify & Create</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setOtpModalVisible(false)} style={{ alignItems: 'center', marginTop: 8, padding: 10 }}>
                <Text style={{ color: '#64748b', fontSize: 14, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },

  topNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  backBtn: { padding: 8 },
  headerTitle: { color: '#f8fafc', fontSize: 20, fontWeight: '800', fontFamily: 'serif' },

  scroll: { flexGrow: 1, padding: 24, paddingBottom: 40 },

  infoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#151e32', borderRadius: 12, padding: 16,
    marginBottom: 28, borderLeftWidth: 3, borderLeftColor: '#D9A05B',
  },
  infoIconBox: {
    backgroundColor: '#1e293b', padding: 8, borderRadius: 8,
  },
  infoTxt: { flex: 1, color: '#64748b', fontSize: 13, lineHeight: 20 },

  section: { marginBottom: 28 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: {
    color: '#D9A05B', fontSize: 11, fontWeight: '800', letterSpacing: 1.5,
  },

  fieldLabel: { color: '#f8fafc', fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 14 },
  asterisk: { color: '#D9A05B' },

  input: {
    backgroundColor: '#151e32', borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 14, fontSize: 15, color: '#f8fafc',
    borderWidth: 1, borderColor: '#1e293b',
  },
  imageUpload: {
    backgroundColor: '#151e32', borderRadius: 12, borderWidth: 1, borderColor: '#334155', borderStyle: 'dashed',
    height: 100, justifyContent: 'center', alignItems: 'center', gap: 8, overflow: 'hidden'
  },
  selectedLogoPreview: {
    width: '100%', height: '100%', resizeMode: 'contain'
  },
  uploadTxt: { color: '#64748b', fontSize: 14, fontWeight: '500' },
  inputMulti: { height: 70, textAlignVertical: 'top' },

  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#151e32', borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, borderWidth: 1, borderColor: '#1e293b',
  },
  inputFlex: { flex: 1, fontSize: 14, color: '#f8fafc' },

  grid: { flexDirection: 'row', gap: 12 },

  pickerBtn: {
    backgroundColor: '#151e32', borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 14, borderWidth: 1, borderColor: '#1e293b',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
  },
  pickerTxt: { fontSize: 14, color: '#f8fafc' },

  brandingNote: { color: '#64748b', fontSize: 12, marginBottom: 12 },

  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  colorSwatchWrapper: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  colorSwatchWrapperSelected: {
    borderWidth: 2, borderColor: '#D9A05B',
  },
  colorSwatch: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },

  preview: {
    borderRadius: 14, padding: 20, marginTop: 16,
    alignItems: 'center', overflow: 'hidden', minHeight: 80,
  },
  previewAccent: {
    position: 'absolute', top: 0, right: 0, width: 60, height: 60,
    borderBottomLeftRadius: 60, opacity: 0.6,
  },
  previewLogoContainer: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center', marginBottom: 10, overflow: 'hidden'
  },
  previewLogo: { width: 40, height: 40, resizeMode: 'contain' },
  previewTxt: { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  previewSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4, textAlign: 'center', fontWeight: '500' },

  primaryBtn: {
    backgroundColor: '#D9A05B', borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: '#fff', marginTop: 12, marginBottom: 16,
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnTxt: { color: '#0f172a', fontSize: 16, fontWeight: '800' },

  submitBtn: {
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    marginBottom: 16, elevation: 4, backgroundColor: '#D9A05B'
  },
  submitBtnTxt: { color: '#0f172a', fontSize: 16, fontWeight: '800' },

  footer: { color: '#64748b', fontSize: 11, textAlign: 'center', lineHeight: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#334155' },
  modalTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '700' },
  modalClose: { color: '#38bdf8', fontSize: 14, fontWeight: '600' },
  pickerItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  pickerItemTxt: { color: '#cbd5e1', fontSize: 15 },
});
