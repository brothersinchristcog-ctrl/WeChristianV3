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
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import Theme from '../../theme/Theme';
import FirestoreService from '../../services/FirestoreService';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Phone, User, LogIn, ArrowRight } from 'lucide-react-native';
import StarBackground from '../../components/StarBackground';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
  route: RouteProp<AuthStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation, route }: LoginScreenProps) {
  const { signInAnonymously } = useAuth();
  const { activeChurch } = useChurch();
  const [showPhoneInput, setShowPhoneInput] = useState(route.params?.showPhoneInput || false);

  useEffect(() => {
    if (route.params?.showPhoneInput) {
      setShowPhoneInput(true);
    }
  }, [route.params?.showPhoneInput]);
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
          // Explicitly pass activeChurch?.id so the query knows which church to search in. 
          // Pass true to enable strictChurch mode so it doesn't fallback to a global search.
          const result = await FirestoreService.checkContactExists(cleanNum, activeChurch?.id, true);

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

    // 🔥 SECRET DEV BYPASS 🔥
    if (formattedNumber === '+919999999999') {
      Alert.alert('Dev Bypass', 'Logging you in automatically for testing!');
      setLoading(true);
      try {
        await require('@react-native-async-storage/async-storage').default.setItem('@guest_intent', 'true');
        await auth().signInAnonymously();
      } catch(e) {}
      setLoading(false);
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
      Alert.alert('Authentication Error', error.message || 'Unable to send SMS. Please check your connection.');
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
        <StarBackground />
        
        <View style={styles.landingTop}>
          <Text 
            style={styles.welcomePrefix}
          >
            Welcome to
          </Text>
          <Text 
            style={styles.churchTitleLarge}
            numberOfLines={2}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.6}
          >
            {activeChurch?.name || 'We Christian'}
          </Text>
          <Text style={[styles.bibleQuote, { marginTop: 40, marginBottom: 0, fontSize: 15, fontStyle: 'normal', opacity: 0.9, paddingHorizontal: 20 }]}>
            A place to connect, pray, and walk together in faith as one church family.
          </Text>
          <Text style={[styles.bibleQuote, { marginTop: 25 }]}>
            "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint."{'\n'}— Isaiah 40:31
          </Text>
        </View>

        <View style={styles.landingBottom}>
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.mainActionBtn, { flex: 1, marginRight: 8 }]}
              onPress={() => {
                setIsCreatingChurch(false);
                setShowPhoneInput(true);
              }}
            >
              <Text style={styles.mainActionBtnTxt}>Sign In</Text>
            </TouchableOpacity>

            {activeChurch && (
              <TouchableOpacity 
                style={[styles.signUpBtn, { flex: 1, marginLeft: 8 }]}
                onPress={() => navigation.navigate('SignUp')}
              >
                <Text style={styles.signUpBtnTxt}>Sign up</Text>
              </TouchableOpacity>
            )}

            {!activeChurch && (
              <TouchableOpacity 
                style={[styles.signUpBtn, { flex: 1, marginLeft: 8 }]}
                onPress={() => {
                  setIsCreatingChurch(true);
                  setShowPhoneInput(true);
                }}
              >
                <Text style={styles.signUpBtnTxt}>Register</Text>
              </TouchableOpacity>
            )}
          </View>

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
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />
      
      {/* ── Page Header ── */}
      <View style={styles.pageHeader}>
        <SafeAreaView style={{ flexDirection: 'row', alignItems: 'center', width: '100%', paddingTop: Platform.OS === 'ios' ? 10 : 30, paddingBottom: 24, paddingHorizontal: 22, justifyContent: 'space-between' }}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => setShowPhoneInput(false)}
          >
            <ChevronLeft size={20} color="#aac4e8" />
            <Text style={styles.backBtnTxt}>Back</Text>
          </TouchableOpacity>
          <View style={styles.titleCol}>
            <Text style={styles.pageTitle}>
              {activeChurch ? 'Welcome Back' : (isCreatingChurch ? 'Register Church' : 'Sign In')}
            </Text>
            <Text style={styles.pageSub}>
              {activeChurch ? 'Sign in to your member account' : (isCreatingChurch ? 'Verify number for new church' : 'Verify number to continue')}
            </Text>
          </View>
          <View style={{ width: 60 }} />
        </SafeAreaView>
      </View>

      <SafeAreaView style={{ flex: 1, paddingTop: 10 }}>
        <View style={styles.authContent}>

          <View style={[styles.cardContainer, isMember && styles.cardContainerSuccess]}>
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
                <ActivityIndicator color="#0A1128" />
              ) : (
                <Text style={styles.submitBtnTxt}>Send Verification Code</Text>
              )}
            </TouchableOpacity>
          </View>

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
  landingContainer: { flex: 1, backgroundColor: '#090a0f' },
  landingTop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  welcomePrefix: { 
    color: '#F4D389', 
    fontSize: 56, 
    fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'cursive', 
    fontStyle: 'italic', 
    fontWeight: '600', 
    marginBottom: 8, 
    textAlign: 'center',
    marginTop: -80 
  },
  churchTitleLarge: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 10, textAlign: 'center', letterSpacing: 1, textTransform: 'uppercase' },
  bibleQuote: { color: '#aac4e8', fontSize: 16, fontStyle: 'italic', fontWeight: '500', marginTop: 40, textAlign: 'center', lineHeight: 24 },
  
  landingBottom: { padding: 40, paddingBottom: 60, gap: 16 },
  actionRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 10 },
  mainActionBtn: { 
    backgroundColor: '#F4D389', borderRadius: 30, paddingVertical: 14, 
    justifyContent: 'center', alignItems: 'center',
    elevation: 5, shadowColor: '#F4D389', shadowOpacity: 0.2, shadowRadius: 10
  },
  mainActionBtnTxt: { color: '#0A1128', fontSize: 16, fontWeight: '700' },
  
  signUpBtn: { 
    backgroundColor: '#1a2d5a', borderRadius: 30, paddingVertical: 14, 
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)'
  },
  signUpBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '500' },

  guestLink: { marginTop: 10, alignItems: 'center' },
  guestLinkTxt: { color: '#6B7280', fontSize: 12, fontWeight: '500' },

  // Auth Styles
  authContainer: { flex: 1, backgroundColor: '#0A1128' },
  
  pageHeader: {
    marginBottom: 20,
    zIndex: 10,
    backgroundColor: 'transparent'
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 60 },
  backBtnTxt: { color: '#aac4e8', fontSize: 16, fontWeight: '500' },
  titleCol: { flex: 1, alignItems: 'center' },
  pageTitle: { 
    color: '#F4D389', 
    fontSize: 40, 
    fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'cursive', 
    fontStyle: 'italic',
    fontWeight: '600' 
  },
  pageSub: { color: '#aac4e8', fontSize: 14, marginTop: -5, fontStyle: 'italic' },

  authContent: { paddingHorizontal: 25, flex: 1, paddingTop: 10 },

  cardContainer: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardContainerSuccess: {
    borderColor: '#F4D389',
  },

  inputSection: { marginBottom: 25 },
  inputLabel: { fontSize: 10, fontWeight: '800', color: '#aac4e8', letterSpacing: 1, marginBottom: 10 },
  inputWrapper: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#090a0f', 
    borderRadius: 14, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: 'transparent' 
  },
  inputWrapperSuccess: { borderColor: '#BBF7D0', backgroundColor: '#0A1622' },
  textInput: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '600', color: '#fff' },
  statusText: { fontSize: 11, color: '#F87171', marginTop: 8, fontWeight: '500' },
  statusTextSuccess: { color: '#BBF7D0' },

  memberBanner: { 
    backgroundColor: '#1E293B', 
    padding: 18, 
    borderRadius: 16, 
    marginBottom: 25, 
    borderLeftWidth: 4,
    borderLeftColor: '#F4D389' 
  },
  memberBannerTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  memberBannerSub: { color: '#aac4e8', fontSize: 12, marginTop: 4 },

  submitBtn: { backgroundColor: '#F4D389', borderRadius: 30, paddingVertical: 16, alignItems: 'center', elevation: 2 },
  submitBtnDisabled: { opacity: 0.5, backgroundColor: '#9CA3AF' },
  submitBtnTxt: { color: '#0A1128', fontSize: 16, fontWeight: '800' },

  footerInfo: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  footerTxt: { color: '#aac4e8', fontSize: 14 },
  footerLink: { color: '#F4D389', fontSize: 14, fontWeight: '800' },
});
