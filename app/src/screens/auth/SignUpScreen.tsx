import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  StatusBar
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  AlertTriangle,
  Calendar
} from 'lucide-react-native';
import FirestoreService from '../../services/FirestoreService';
import auth from '@react-native-firebase/auth';

import { useChurch } from '../../context/ChurchContext';

export default function SignUpScreen({ navigation }: any) {
  const { churchId, activeChurch } = useChurch();
  const [loading, setLoading] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [datePickerField, setDatePickerField] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    phone: '',
    email: '',
    gender: 'Male',
    maritalStatus: 'Single',
    anniversaryDate: '',
    numberOfChildren: '',
    baptized: 'No',
    baptismDate: '',
    baptismChurch: '',
    churchName: '',
    street: '',
    mandal: '',
    city: '',
    district: '',
    state: '',
    zip: '',
    nationality: 'Indian',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const showDatePicker = (field: string) => {
    setDatePickerField(field);
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date: Date) => {
    const formattedDate = date.toISOString().split('T')[0];
    handleInputChange(datePickerField, formattedDate);
    hideDatePicker();
  };

  const handleSignUp = async () => {
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      Alert.alert('Required Fields', 'Please fill in your name and phone number.');
      return;
    }

    if (formData.baptized === 'Yes' && (!formData.baptismDate || !formData.baptismChurch)) {
      Alert.alert('Baptism Details', 'Please provide the Date and Church of your baptism.');
      return;
    }

    if (formData.maritalStatus !== 'Single' && (!formData.anniversaryDate || !formData.numberOfChildren)) {
      Alert.alert('Marital Details', 'Please provide your Anniversary Date and Number of Children.');
      return;
    }

    setLoading(true);
    try {
      const checkResult = await FirestoreService.checkContactExists(formData.phone);
      
      if (checkResult?.error) {
        Alert.alert('Database Error', 'Unable to verify phone number. Please try again later.');
        setLoading(false);
        return;
      }
      
      if (checkResult?.exists) {
        setShowDuplicateModal(true);
        setLoading(false);
        return;
      }

      // Format phone number for Firebase
      let cleanNum = formData.phone.replace(/[^0-9+]/g, '');
      if (cleanNum.length === 10 && !cleanNum.startsWith('+')) {
        cleanNum = `+91${cleanNum}`;
      }
      
      if (!cleanNum.startsWith('+') || cleanNum.length < 12) {
        Alert.alert('Invalid Number', 'Please enter a valid 10-digit phone number.');
        setLoading(false);
        return;
      }

      // Send OTP
      auth().settings.appVerificationDisabledForTesting = true;
      const confirmation = await auth().signInWithPhoneNumber(cleanNum);
      
      // Navigate to OTP screen and pass the formData so it can be saved after verification
      navigation.navigate('VerifyOtp', { 
        confirmation, 
        phoneNumber: cleanNum,
        formData: formData, // Pass all form data to save after OTP
        isSignUp: true      // Flag to indicate this is a new registration
      });

    } catch (error: any) {
      if (error?.message?.includes('failed-precondition') || error?.message?.includes('index')) {
        Alert.alert('System Updating', 'The database is currently updating its indexes. Please try registering again in 1-2 minutes.');
      } else {
        Alert.alert('Registration Error', error.message || 'Unable to send SMS. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1128" />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.headerContainer}>
              <View style={styles.topRow}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                  <ChevronLeft size={20} color="#6B7B9A" />
                </TouchableOpacity>
                <View style={styles.titleWrapper}>
                  <Text style={styles.scriptTitle}>Sign Up</Text>
                </View>
                <View style={{ width: 40 }} />
              </View>
              <Text style={styles.subtitle}>Join our community of faith, worship and{'\n'}fellowship.</Text>
            </View>
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>FIRST NAME</Text>
                <TextInput style={styles.input} value={formData.firstName} onChangeText={(v) => handleInputChange('firstName', v)} placeholder="John" placeholderTextColor="#4B5670" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>LAST NAME</Text>
                <TextInput style={styles.input} value={formData.lastName} onChangeText={(v) => handleInputChange('lastName', v)} placeholder="Mathew" placeholderTextColor="#4B5670" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
                <TextInput style={styles.input} value={formData.phone} onChangeText={(v) => handleInputChange('phone', v)} placeholder="9876543210" placeholderTextColor="#4B5670" keyboardType="phone-pad" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>VILLAGE NAME</Text>
                <TextInput style={styles.input} value={formData.city} onChangeText={(v) => handleInputChange('city', v)} placeholder="Enter your village" placeholderTextColor="#4B5670" />
              </View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                  <Text style={styles.inputLabel}>DATE OF BIRTH</Text>
                  <TouchableOpacity onPress={() => showDatePicker('dob')} activeOpacity={0.8}>
                    <View style={[styles.input, styles.dateInputContainer]}>
                      <Text style={formData.dob ? styles.inputValue : styles.inputPlaceholder}>{formData.dob ? formData.dob.split('-').reverse().join('-') : 'DD-MM-YYYY'}</Text>
                      <Calendar size={18} color="#F4D389" />
                    </View>
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>GENDER</Text>
                  <View style={styles.genderRow}>
                    <TouchableOpacity style={[styles.genderBtn, formData.gender === 'Male' && styles.genderBtnActive]} onPress={() => handleInputChange('gender', 'Male')}>
                      <Text style={[styles.genderTxt, formData.gender === 'Male' && styles.genderTxtActive]}>Male</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.genderBtn, formData.gender === 'Female' && styles.genderBtnActive]} onPress={() => handleInputChange('gender', 'Female')}>
                      <Text style={[styles.genderTxt, formData.gender === 'Female' && styles.genderTxtActive]}>Female</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={handleSignUp} disabled={loading}>
                {loading ? <ActivityIndicator color="#0A1128" /> : <Text style={styles.submitBtnTxt}>Create Account</Text>}
              </TouchableOpacity>
            </View>
            <View style={styles.footer}>
              <Text style={styles.footerTxt}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login', { showPhoneInput: true })}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
        <Modal animationType="fade" transparent={true} visible={showDuplicateModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.alertCard}>
              <View style={styles.alertIcon}><AlertTriangle size={32} color="#c0392b" /></View>
              <Text style={styles.alertTitle}>Already a Member</Text>
              <Text style={styles.alertSub}>This phone number is already registered in our system. Please sign in instead.</Text>
              <TouchableOpacity style={styles.modalBtn} onPress={() => { setShowDuplicateModal(false); navigation.navigate('Login'); }}>
                <Text style={styles.modalBtnTxt}>Go to Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSecBtn} onPress={() => setShowDuplicateModal(false)}>
                <Text style={styles.modalSecBtnTxt}>Change Number</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <DateTimePickerModal isVisible={isDatePickerVisible} mode="date" onConfirm={handleConfirm} onCancel={hideDatePicker} maximumDate={new Date()} />
      </SafeAreaView>
    </View>
  );
}

const FONTS = {
  serif: Platform.OS === 'ios' ? 'Georgia' : 'serif',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1128' },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1C2A4A',
    justifyContent: 'center',
    alignItems: 'center',
  },

  scroll: { paddingBottom: 40 },

  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 30,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  scriptTitle: {
    fontFamily: FONTS.serif,
    fontSize: 42,
    color: '#F4D389',
    fontStyle: 'italic',
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    color: '#8A99B8',
    textAlign: 'center',
    lineHeight: 20,
  },

  formCard: {
    backgroundColor: '#0F1730',
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1C2A4A',
  },

  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E2E8F0',
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1C2A4A',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#FFFFFF',
  },
  dateInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputPlaceholder: {
    color: '#4B5670',
    fontSize: 15,
  },
  inputValue: {
    color: '#FFFFFF',
    fontSize: 15,
  },

  row: {
    flexDirection: 'row',
  },

  genderRow: {
    flexDirection: 'row',
    backgroundColor: '#1C2A4A',
    borderRadius: 14,
    padding: 4,
    height: 52,
  },
  genderBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  genderBtnActive: {
    backgroundColor: '#405B85',
  },
  genderTxt: {
    color: '#8A99B8',
    fontSize: 14,
    fontWeight: '600',
  },
  genderTxtActive: {
    color: '#FFFFFF',
  },

  submitBtn: {
    backgroundColor: '#F4D389',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#F4D389',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  submitBtnTxt: {
    color: '#0A1128',
    fontSize: 16,
    fontWeight: '700',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  footerTxt: {
    color: '#8A99B8',
    fontSize: 14,
  },
  footerLink: {
    color: '#F4D389',
    fontSize: 14,
    fontWeight: '700',
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  alertCard: { backgroundColor: '#fff', borderRadius: 24, padding: 30, width: '100%', alignItems: 'center' },
  alertIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  alertTitle: { fontSize: 20, fontWeight: '800', color: '#1a2d5a', marginBottom: 10 },
  alertSub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 25 },
  modalBtn: { backgroundColor: '#1a2d5a', paddingVertical: 15, width: '100%', borderRadius: 12, alignItems: 'center' },
  modalBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  modalSecBtn: { marginTop: 15 },
  modalSecBtnTxt: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
});
