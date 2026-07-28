import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import Theme from '../../theme/Theme';
import FirestoreService from '../../services/FirestoreService';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import { ChevronLeft, ShieldCheck, RefreshCw } from 'lucide-react-native';

type VerifyOtpScreenProps = NativeStackScreenProps<AuthStackParamList, 'VerifyOtp'>;

export default function VerifyOtpScreen({ route, navigation }: VerifyOtpScreenProps) {
  const { confirmation, phoneNumber, contactId, memberName, formData, isSignUp } = route.params;
  const { member, setMember } = useAuth();
  const { churchId: activeChurchId } = useChurch();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit code sent to your phone.');
      return;
    }

    setLoading(true);
    setStatus('Verifying your code...');
    
    try {
      const result = await confirmation.confirm(code);
      const { firestore, FieldValue } = require('../../services/firebaseConfig');

      if (result?.user && isSignUp && formData && activeChurchId) {
        setStatus('Creating your member profile...');
        
        // Global users collection is no longer used. Members are strictly stored in the church.

        // 2. Create nested member profile
        const createResult = await FirestoreService.createMember(activeChurchId, { 
          ...formData, 
          id: result.user.uid, 
          userType: 'Member', 
          joinDate: new Date().toISOString() 
        }, result.user.uid);
        
        if (createResult.success) {
          try {
            await result.user.updateProfile({ displayName: formData.firstName });
          } catch (profileErr) {
            console.warn('Profile name sync failed:', profileErr);
          }

          // Force update AuthContext so it doesn't get stuck on old cached data
          const updatedMember = {
            ...(member || {}),
            ...formData,
            id: result.user.uid,
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            phone: formData.phone,
            churchId: activeChurchId,
            primaryChurchId: activeChurchId,
            userType: 'Member'
          };
          setMember(updatedMember as any);
          
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.setItem('@cached_member', JSON.stringify(updatedMember));

          navigation.replace('RegistrationSuccess');
          return; // Stop execution, we are done
        }
      }

      if (result?.user && contactId && !isSignUp) {
        setStatus('Linking church profile...');
        try {
          await FirestoreService.syncMember(activeChurchId || '', contactId, result.user.uid);

          // Global users collection is no longer used.
        } catch (syncError) {
          console.error('❌ Sync failed:', syncError);
        }
      }

      // After OTP confirmed: if user has no primaryChurchId yet
      if (result?.user) {
        const globalUser = await FirestoreService.getGlobalUser(result.user.uid);
        
        if (!globalUser?.primaryChurchId) {
          if (activeChurchId) {
            navigation.replace('SignUp');
          } else {
            navigation.replace('CreateChurch');
          }
        }
        // If primaryChurchId exists, AuthContext will detect the signed-in user and navigate to Main automatically
      }
    } catch (error: any) {
      console.error('❌ Error:', error.code);
      Alert.alert('Verification Failed', 'The code entered is incorrect or expired.');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />
        
      {/* ── Page Header ── */}
      <View style={styles.pageHeader}>
        <SafeAreaView style={{ flexDirection: 'row', alignItems: 'center', width: '100%', paddingTop: Platform.OS === 'ios' ? 10 : 30, paddingBottom: 24, paddingHorizontal: 22, justifyContent: 'space-between' }}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={20} color="#aac4e8" />
            <Text style={styles.backBtnTxt}>Change Number</Text>
          </TouchableOpacity>
          <View style={styles.titleCol}>
            <Text style={styles.pageTitle}>OTP Verification</Text>
            <Text style={styles.pageSub}>ధృవీకరణ</Text>
          </View>
          <View style={{ width: 60 }} />
        </SafeAreaView>
      </View>

      <SafeAreaView style={styles.safeArea}>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
            <View style={styles.infoSection}>
              <View style={styles.iconCircle}>
                <ShieldCheck size={32} color="#1a2d5a" />
              </View>
              <Text style={styles.authTitle}>Verify your phone</Text>
              <Text style={styles.authSub}>We sent a 6-digit code to</Text>
              <Text style={styles.phoneTxt}>{phoneNumber}</Text>

              {memberName ? (
                <View style={styles.memberBanner}>
                  <Text style={styles.memberBannerTxt}>Welcome, {memberName} 🙏</Text>
                  <Text style={styles.memberBannerSub}>Please verify your identity.</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>ENTER 6-DIGIT CODE</Text>
              <View style={styles.codeContainer}>
                <TextInput
                  style={styles.codeInput}
                  placeholder="000 000"
                  placeholderTextColor="#D1D5DB"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={code}
                  onChangeText={setCode}
                  autoFocus
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleVerify}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnTxt}>Verify & Sign In</Text>
              )}
            </TouchableOpacity>

            {status ? <Text style={styles.statusTxt}>{status}</Text> : null}

            <TouchableOpacity style={styles.resendBtn} disabled={loading}>
              <RefreshCw size={16} color="#6B7280" />
              <Text style={styles.resendTxt}>Resend Code</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  safeArea: { flex: 1 },
  
  // Header
  pageHeader: {
    backgroundColor: '#1a2d5a',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
    marginBottom: 10,
    zIndex: 10,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 60 },
  backBtnTxt: { color: '#aac4e8', fontSize: 12, fontWeight: '500' },
  titleCol: { flex: 1, alignItems: 'center' },
  pageTitle: { color: '#fff', fontSize: 20, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontWeight: '600', letterSpacing: -0.5 },
  pageSub: { color: '#aac4e8', fontSize: 11, marginTop: 2, fontWeight: '500' },

  content: { width: '100%', paddingHorizontal: 25, paddingTop: 40, alignItems: 'center', paddingBottom: 40 },
  scrollContent: { flexGrow: 1 },
  
  infoSection: { alignItems: 'center', marginBottom: 40 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f0f2f7', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  authTitle: { fontSize: 24, fontWeight: '800', color: '#1a2d5a', marginBottom: 8 },
  authSub: { fontSize: 14, color: '#6B7280' },
  phoneTxt: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 4 },

  inputSection: { width: '100%', marginBottom: 30 },
  inputLabel: { fontSize: 10, fontWeight: '800', color: '#1a2d5a', letterSpacing: 1, marginBottom: 12, textAlign: 'center' },
  codeContainer: { 
    backgroundColor: '#f9fafb', borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb',
    height: 70, justifyContent: 'center', alignItems: 'center'
  },
  codeInput: { fontSize: 32, fontWeight: '700', color: '#111827', letterSpacing: 10, textAlign: 'center', width: '100%' },

  submitBtn: { backgroundColor: '#1a2d5a', width: '100%', borderRadius: 16, paddingVertical: 18, alignItems: 'center', elevation: 2 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },

  statusTxt: { fontSize: 12, color: '#1a2d5a', fontWeight: '600', marginTop: 15 },

  resendBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 30 },
  resendTxt: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  
  memberBanner: { 
    backgroundColor: '#f8fafc', 
    padding: 18, 
    borderRadius: 16, 
    marginTop: 25, 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
    borderLeftColor: '#c0392b',
    width: '100%'
  },
  memberBannerTxt: { color: '#1a2d5a', fontSize: 16, fontWeight: '800' },
  memberBannerSub: { color: '#64748b', fontSize: 12, marginTop: 4 },
});
