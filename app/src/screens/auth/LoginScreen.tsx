import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import Theme from '../../theme/Theme';
import FirestoreService from '../../services/FirestoreService';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Phone, User, LogIn, ArrowRight } from 'lucide-react-native';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { signInAnonymously } = useAuth();
  const { activeChurch } = useChurch();
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyingStatus, setVerifyingStatus] = useState('');
  const [memberName, setMemberName] = useState('');
  const [contactId, setContactId] = useState<string | undefined>(undefined);
  const [isMember, setIsMember] = useState(false);

  const [isCreatingChurch, setIsCreatingChurch] = useState(false);

  // ── Auto-lookup member as user types ──
  useEffect(() => {
    const checkMembership = async () => {
      const cleanNum = phoneNumber.replace(/[^0-9]/g, '');
      if (cleanNum.length === 10) {
        setVerifyingStatus('Checking membership...');
        try {
          // Explicitly pass activeChurch?.id so the query knows which church to search in
          const result = await FirestoreService.checkContactExists(cleanNum, activeChurch?.id);

          if (result && result.exists) {
            setMemberName(result.member?.firstName || result.member?.name || '');
            setContactId(result.member?.id);
            setIsMember(true);
            setVerifyingStatus('');
          } else {
            setMemberName('');
            setContactId(undefined);
            setIsMember(false);
            if (result && result.error) {
              setVerifyingStatus('Number not found in church records.');
            } else {
              setVerifyingStatus('Number not found in church records.');
            }
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        setMemberName('');
        setContactId(undefined);
        setIsMember(false);
        setVerifyingStatus('');
      }
    };
    checkMembership();
  }, [phoneNumber]);

  const handleSendCode = async () => {
    let formattedNumber = phoneNumber.trim();
    if (formattedNumber.length === 10 && !formattedNumber.startsWith('+')) {
      formattedNumber = `+91${formattedNumber}`;
    }

    if (!formattedNumber.startsWith('+') || formattedNumber.length < 12) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);
    try {
      setVerifyingStatus('Sending OTP...');
      const confirmation = await auth().signInWithPhoneNumber(formattedNumber);
      navigation.navigate('VerifyOtp', { 
        confirmation, 
        phoneNumber: formattedNumber,
        contactId: contactId,
        memberName: memberName
      });
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', 'Unable to send SMS. Please check your connection.');
    } finally {
      setLoading(false);
      setVerifyingStatus('');
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      await require('@react-native-async-storage/async-storage').default.setItem('@guest_intent', 'true');
      await signInAnonymously();
    } catch (error: any) {
      Alert.alert('Login Error', 'Unable to enter as guest.');
    } finally {
      setLoading(false);
    }
  };

  if (!showPhoneInput) {
    return (
      <View style={styles.landingContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.landingTop}>
          <View style={styles.logoCircleLarge}>
            <Image 
              source={activeChurch?.theme?.logoUrl ? { uri: activeChurch.theme.logoUrl } : require('../../../assets/logo.png')} 
              style={styles.logoImageLarge}
            />
          </View>
          <Text 
            style={styles.churchTitleLarge}
            numberOfLines={2}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.6}
          >
            {activeChurch?.name || 'We Christian'}
          </Text>
          <Text style={styles.mottoTextLarge}>{activeChurch?.tagline || 'Connect with your community'}</Text>
        </View>

        <View style={styles.landingBottom}>
          <TouchableOpacity 
            style={styles.mainActionBtn}
            onPress={() => {
              setIsCreatingChurch(false);
              setShowPhoneInput(true);
            }}
          >
            <Text style={styles.mainActionBtnTxt}>Sign In</Text>
          </TouchableOpacity>

          {activeChurch && (
            <TouchableOpacity 
              style={styles.signUpBtn}
              onPress={() => navigation.navigate('SignUp')}
            >
              <Text style={styles.signUpBtnTxt}>Sign up</Text>
            </TouchableOpacity>
          )}

          {!activeChurch && (
            <TouchableOpacity 
              style={styles.signUpBtn}
              onPress={() => {
                setIsCreatingChurch(true);
                setShowPhoneInput(true);
              }}
            >
              <Text style={styles.signUpBtnTxt}>Register Church</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.guestLink}
            onPress={handleGuestLogin}
          >
            <Text style={styles.guestLinkTxt}>Guest mode — browse without login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.authContainer}
    >
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setShowPhoneInput(false)}
        >
          <ChevronLeft size={24} color="#1a2d5a" />
        </TouchableOpacity>

        <View style={styles.authContent}>
          <Text style={styles.authTitle}>
            {activeChurch ? 'Welcome Back' : (isCreatingChurch ? 'Register Church' : 'Sign In')}
          </Text>
          <Text style={styles.authSub}>
            {activeChurch ? 'Sign in to your member account' : (isCreatingChurch ? 'Verify your phone number to register a new church' : 'Verify your phone number to continue')}
          </Text>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>PHONE NUMBER</Text>
            <View style={[styles.inputWrapper, isMember && styles.inputWrapperSuccess]}>
              <Phone size={20} color={isMember ? "#15803D" : "#9CA3AF"} />
              <TextInput 
                style={styles.textInput}
                placeholder="99887 76655"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                maxLength={10}
              />
              {isMember && <User size={20} color="#15803D" />}
            </View>

            {verifyingStatus ? (
              <Text style={[styles.statusText, isMember && styles.statusTextSuccess]}>
                {verifyingStatus}
              </Text>
            ) : null}
          </View>

          {isMember && (
            <View style={styles.memberBanner}>
              <Text style={styles.memberBannerTxt}>Welcome, {memberName} 🙏</Text>
              <Text style={styles.memberBannerSub}>We found your church record.</Text>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSendCode}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnTxt}>Send Verification Code</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerInfo}>
            <Text style={styles.footerTxt}>Not a member yet? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.footerLink}>Register Here</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Landing Styles
  landingContainer: { flex: 1, backgroundColor: '#1a2d5a' },
  landingTop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  logoCircleLarge: { 
    width: 120, height: 120, borderRadius: 60, backgroundColor: '#fff', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 25,
    overflow: 'hidden',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
  },
  logoImageLarge: { width: 120, height: 120, resizeMode: 'cover' },
  churchTitleLarge: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 5, textAlign: 'center' },
  mottoTextLarge: { color: '#4fd1c5', fontSize: 16, fontWeight: '500', marginBottom: 10, textAlign: 'center' },
  teluguTaglineLarge: { color: '#aac4e8', fontSize: 10, fontWeight: '600', letterSpacing: 1, textAlign: 'center' },
  
  landingBottom: { padding: 40, paddingBottom: 60, gap: 16 },
  mainActionBtn: { 
    backgroundColor: '#c0392b', borderRadius: 30, paddingVertical: 18, 
    justifyContent: 'center', alignItems: 'center',
    elevation: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10
  },
  mainActionBtnTxt: { color: '#fff', fontSize: 18, fontWeight: '700' },
  
  signUpBtn: { 
    backgroundColor: '#1a2d5a', borderRadius: 30, paddingVertical: 18, 
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)'
  },
  signUpBtnTxt: { color: '#fff', fontSize: 18, fontWeight: '500' },

  guestLink: { marginTop: 10, alignItems: 'center' },
  guestLinkTxt: { color: '#6B7280', fontSize: 12, fontWeight: '500' },

  // Auth Styles
  authContainer: { flex: 1, backgroundColor: '#fff' },
  backButton: { padding: 20, paddingTop: Platform.OS === 'ios' ? 0 : 20 },
  authContent: { paddingHorizontal: 25, flex: 1 },
  authTitle: { fontSize: 28, fontWeight: '800', color: '#1a2d5a', marginBottom: 8 },
  authSub: { fontSize: 15, color: '#6B7280', marginBottom: 40 },

  inputSection: { marginBottom: 25 },
  inputLabel: { fontSize: 10, fontWeight: '800', color: '#1a2d5a', letterSpacing: 1, marginBottom: 10 },
  inputWrapper: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', 
    borderRadius: 14, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: '#e5e7eb' 
  },
  inputWrapperSuccess: { borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' },
  textInput: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '600', color: '#111827' },
  statusText: { fontSize: 11, color: '#c0392b', marginTop: 8, fontWeight: '500' },
  statusTextSuccess: { color: '#15803D' },

  memberBanner: { 
    backgroundColor: '#f8fafc', 
    padding: 18, 
    borderRadius: 16, 
    marginBottom: 25, 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
    borderLeftColor: '#c0392b' 
  },
  memberBannerTxt: { color: '#1a2d5a', fontSize: 16, fontWeight: '800' },
  memberBannerSub: { color: '#64748b', fontSize: 12, marginTop: 4 },

  submitBtn: { backgroundColor: '#1a2d5a', borderRadius: 14, paddingVertical: 18, alignItems: 'center', elevation: 2 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },

  footerInfo: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  footerTxt: { color: '#6B7280', fontSize: 14 },
  footerLink: { color: '#c0392b', fontSize: 14, fontWeight: '700' },
});
