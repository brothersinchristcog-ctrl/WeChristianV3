import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Linking,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
  Share
} from 'react-native';
import { 
  Lock, 
  Coins,
  CreditCard,
  Share2
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useChurch } from '../context/ChurchContext';
import FirestoreService, { AppMember } from '../services/FirestoreService';
import { functions } from '../services/firebaseConfig';
import * as WebBrowser from 'expo-web-browser';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'Tithe', label: 'Tithe', labelTe: 'దశమభాగం', icon: '🙏' },
  { id: 'Offering', label: 'Offering', labelTe: 'కానుక', icon: '🎁' },
  { id: 'Missions', label: 'Missions', labelTe: 'సేవా నిధి', icon: '🌍' },
  { id: 'Building', label: 'Building', labelTe: 'నిర్మాణ నిధి', icon: '🏛️' },
  { id: 'Special', label: 'Special', labelTe: 'ప్రత్యేక కానుక', icon: '✨' },
  { id: 'Sunday School', label: 'Sunday School', labelTe: 'ఆదివారం పాఠశాల', icon: '📖' }
];

const PRESETS = [100, 500, 1000, 5000];

export default function GivingScreen({ navigation }: any) {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { activeChurch } = useChurch();
  const [member, setMember] = useState<AppMember | null>(null);
  const [activeCat, setActiveCat] = useState('Tithe');
  const [amount, setAmount] = useState('500');
  const [loading, setLoading] = useState(false);

  // Pull giving details from the active church; fall back to defaults
  const giving = activeChurch?.givingDetails;
  const upiId = giving?.upiId || '8000504070@ybl';
  const phonepeNum = giving?.phonepeNumber || '8000504070';
  const payeeName = activeChurch?.name || 'Your Church';

  useEffect(() => {
    const fetchMember = async () => {
      if (user?.phoneNumber) {
        const result = await FirestoreService.checkContactExists(user.phoneNumber);
        if (result?.exists && result.member) {
          setMember(result.member);
        }
      }
    };
    fetchMember();
  }, [user]);

  const handlePayment = async () => {
    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    setLoading(true);
    try {
      await FirestoreService.createDonation({
        amount: numAmt,
        donationType: activeCat,
        contactId: member?.id || '',
        accountId: member?.accountId || '',
        phone: user?.phoneNumber || '',
        churchId: activeChurch?.id || ''
      });
      // 1. Call Cloud Function to initiate payment
      const startDonationFn = functions().httpsCallable('processDonationV1True');
      
      const response = await startDonationFn({
        amount: numAmt,
        churchId: activeChurch?.id || '',
        purpose: activeCat,
        memberId: member?.id || user?.uid || 'guest'
      });

      const { success, redirectUrl } = response.data as any;

      if (success && redirectUrl) {
        // 2. Open PhonePe Web Checkout
        const browserResult = await WebBrowser.openBrowserAsync(redirectUrl);
        // The deep link will handle the success/failure return 
        // which can be caught by PaymentResultScreen (to be implemented)
      } else {
        Alert.alert('Payment Failed', 'Could not initiate payment. Please try again later.');
      }
    } catch (error: any) {
      console.error('Payment Error:', error);
      Alert.alert('Payment Failed', error.message || 'An error occurred while initiating the payment.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      await Share.share({
        message: text,
      });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to share details.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />
      
      {/* ── Page Header (Navy) ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnTxt}>‹ Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
            <Text style={styles.themeToggleText}>{isDark ? '🌙 Dark' : '☀️ Light'}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.headerContent}>
          <View style={styles.iconCircle}>
            <Coins size={32} color="#FCD34D" />
          </View>
          <Text style={styles.headerTitle}>Give with Joy</Text>
          <Text style={styles.headerSubTe}>ఆనందంగా ఇవ్వండి</Text>
          <Text style={styles.headerQuote}>“God loves a cheerful giver” — 2 Cor 9:7</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.comingSoonCard, { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#f1f5f9' }]}>
          <Coins size={56} color={isDark ? '#475569' : '#94a3b8'} />
          <Text style={[styles.comingSoonTitle, { color: isDark ? '#fcd34d' : '#1a2d5a' }]}>Option Available Soon</Text>
          <Text style={[styles.comingSoonText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            We are currently working on integrating secure giving options. Please check back later!
          </Text>
        </View>

        {false && (
          <View>
            {/* ── Category Selection ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>SELECT GIVING CATEGORY</Text>
          <View style={styles.grid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity 
                key={cat.id} 
                style={[styles.gridItem, activeCat === cat.id && styles.gridItemActive]}
                onPress={() => setActiveCat(cat.id)}
              >
                <Text style={styles.catEmoji}>{cat.icon}</Text>
                <Text style={styles.catTitle}>{cat.label}</Text>
                <Text style={styles.catTitleTe}>{cat.labelTe}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Amount Selection ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>SELECT OR ENTER AMOUNT (₹)</Text>
          <View style={styles.presetRow}>
            {PRESETS.map(val => (
              <TouchableOpacity 
                key={val} 
                style={[styles.presetBtn, amount === val.toString() && styles.presetBtnActive]}
                onPress={() => setAmount(val.toString())}
              >
                <Text style={[styles.presetTxt, amount === val.toString() && styles.presetTxtActive]}>₹{val}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputWrapper}>
             <TextInput
               style={styles.amountInput}
               keyboardType="numeric"
               value={amount}
               onChangeText={setAmount}
               placeholder="Enter Amount"
             />
          </View>

          <TouchableOpacity 
            style={[styles.payBtn, loading && { opacity: 0.7 }]}
            onPress={handlePayment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View style={styles.payBtnInner}>
                <CreditCard size={20} color="#fff" />
                <Text style={styles.payBtnTxt}>Pay ₹{amount} via UPI / PhonePe</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* UPI Copy Box */}
          <View style={[styles.upiInfoCard, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
            <Text style={[styles.upiSectionTitle, { color: isDark ? '#fcd34d' : '#1a2d5a' }]}>Direct Transfer / PhonePe Details</Text>
            
            {phonepeNum && (
              <>
                <View style={styles.upiDetailRow}>
                  <View>
                    <Text style={styles.upiLabel}>PHONEPE NUMBER</Text>
                    <Text style={[styles.upiValue, { color: isDark ? '#fff' : '#1e293b' }]}>{phonepeNum}</Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.copyBtn, { backgroundColor: isDark ? '#334155' : '#eff6ff' }]} 
                    onPress={() => handleCopy(phonepeNum, 'PhonePe Number')}
                  >
                    <Share2 size={14} color={isDark ? '#fcd34d' : '#1a2d5a'} />
                    <Text style={[styles.copyBtnTxt, { color: isDark ? '#fcd34d' : '#1a2d5a' }]}>Copy</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.upiDivider, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]} />
              </>
            )}

            {upiId && (
              <View style={styles.upiDetailRow}>
                <View>
                  <Text style={styles.upiLabel}>UPI ID</Text>
                  <Text style={[styles.upiValue, { color: isDark ? '#fff' : '#1e293b' }]}>{upiId}</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.copyBtn, { backgroundColor: isDark ? '#334155' : '#eff6ff' }]} 
                  onPress={() => handleCopy(upiId, 'UPI ID')}
                >
                  <Share2 size={14} color={isDark ? '#fcd34d' : '#1a2d5a'} />
                  <Text style={[styles.copyBtnTxt, { color: isDark ? '#fcd34d' : '#1a2d5a' }]}>Copy</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Additional UPIs */}
            {giving?.upis?.map(upi => (
              <React.Fragment key={upi.id}>
                <View style={[styles.upiDivider, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]} />
                <View style={styles.upiDetailRow}>
                  <View>
                    <Text style={styles.upiLabel}>UPI: {upi.name || 'Additional'}</Text>
                    <Text style={[styles.upiValue, { color: isDark ? '#fff' : '#1e293b' }]}>{upi.upiId}</Text>
                    {upi.phonepeNumber ? <Text style={[styles.upiValue, { color: isDark ? '#cbd5e1' : '#475569', fontSize: 12, marginTop: 2 }]}>PhonePe: {upi.phonepeNumber}</Text> : null}
                  </View>
                  <TouchableOpacity 
                    style={[styles.copyBtn, { backgroundColor: isDark ? '#334155' : '#eff6ff' }]} 
                    onPress={() => handleCopy(upi.upiId, 'UPI ID')}
                  >
                    <Share2 size={14} color={isDark ? '#fcd34d' : '#1a2d5a'} />
                    <Text style={[styles.copyBtnTxt, { color: isDark ? '#fcd34d' : '#1a2d5a' }]}>Copy</Text>
                  </TouchableOpacity>
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* Bank Transfer Box */}
          {(giving?.accountNumber || giving?.banks?.length) ? (
            <View style={[styles.upiInfoCard, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
              <Text style={[styles.upiSectionTitle, { color: isDark ? '#fcd34d' : '#1a2d5a' }]}>Bank Transfer Details</Text>
              
              {giving?.accountNumber && (
                <View style={styles.bankSection}>
                  <Text style={styles.upiLabel}>PRIMARY BANK</Text>
                  <Text style={[styles.upiValue, { color: isDark ? '#fff' : '#1e293b' }]}>{giving?.bankName || 'Bank Name Not Set'}</Text>
                  <Text style={[styles.upiValue, { color: isDark ? '#cbd5e1' : '#475569', fontSize: 13, marginTop: 2 }]}>{giving?.accountName || 'Account Name Not Set'}</Text>
                  <Text style={[styles.upiValue, { color: isDark ? '#cbd5e1' : '#475569', fontSize: 13, marginTop: 2 }]}>A/c: {giving?.accountNumber}</Text>
                  <Text style={[styles.upiValue, { color: isDark ? '#cbd5e1' : '#475569', fontSize: 13, marginTop: 2 }]}>IFSC: {giving?.ifscCode}</Text>
                </View>
              )}

              {/* Additional Banks */}
              {giving?.banks?.map(bank => (
                <React.Fragment key={bank.id}>
                  {(giving?.accountNumber || bank.id !== giving?.banks?.[0]?.id) && <View style={[styles.upiDivider, { backgroundColor: isDark ? '#334155' : '#e2e8f0', marginVertical: 16 }]} />}
                  <View style={styles.bankSection}>
                    <Text style={styles.upiLabel}>{bank.name?.toUpperCase() || 'ADDITIONAL BANK'}</Text>
                    <Text style={[styles.upiValue, { color: isDark ? '#fff' : '#1e293b' }]}>{bank.bankName}</Text>
                    <Text style={[styles.upiValue, { color: isDark ? '#cbd5e1' : '#475569', fontSize: 13, marginTop: 2 }]}>{bank.accountName}</Text>
                    <Text style={[styles.upiValue, { color: isDark ? '#cbd5e1' : '#475569', fontSize: 13, marginTop: 2 }]}>A/c: {bank.accountNumber}</Text>
                    <Text style={[styles.upiValue, { color: isDark ? '#cbd5e1' : '#475569', fontSize: 13, marginTop: 2 }]}>IFSC: {bank.ifscCode}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          ) : null}

          <View style={styles.securityFooter}>
             <Lock size={12} color="#94a3b8" />
             <Text style={styles.securityText}>Secured by Razorpay · UPI · PhonePe · All major banks</Text>
          </View>
          </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    backgroundColor: '#1a2d5a', 
    paddingTop: Platform.OS === 'ios' ? 50 : 20, 
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, alignItems: 'center' },
  backBtn: { paddingVertical: 10 },
  backBtnTxt: { color: '#FCD34D', fontSize: 16, fontWeight: '700' },
  themeToggle: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  themeToggleText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  
  headerContent: { alignItems: 'center', marginTop: 10 },
  iconCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(252,211,77,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSubTe: { fontSize: 14, color: '#FCD34D', fontWeight: '500', marginTop: 2 },
  headerQuote: { fontSize: 11, color: '#aac4e8', marginTop: 10, fontStyle: 'italic' },

  scrollContent: { padding: 16, paddingBottom: 40 },
  comingSoonCard: {
    borderRadius: 20, 
    padding: 40, 
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
  },
  comingSoonTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 24,
    marginBottom: 12
  },
  comingSoonText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22
  },
  sectionCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.8, marginBottom: 15 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { 
    width: (width - 64 - 10) / 2, 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 15, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    marginBottom: 10
  },
  gridItemActive: { borderColor: '#1a2d5a', borderWidth: 2, backgroundColor: '#f0f4ff' },
  catEmoji: { fontSize: 24, marginBottom: 8 },
  catTitle: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  catTitleTe: { fontSize: 11, color: '#64748b', marginTop: 2 },

  presetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  presetBtn: { 
    width: (width - 64 - 30) / 4, 
    paddingVertical: 10, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    alignItems: 'center' 
  },
  presetBtnActive: { borderColor: '#1a2d5a', backgroundColor: '#f0f4ff', borderWidth: 2 },
  presetTxt: { fontSize: 12, fontWeight: '700', color: '#1e293b' },
  presetTxtActive: { color: '#1a2d5a' },

  inputWrapper: { 
    borderWidth: 2, 
    borderColor: '#1a2d5a', 
    borderRadius: 12, 
    paddingHorizontal: 15, 
    height: 54, 
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#fff'
  },
  amountInput: { fontSize: 18, fontWeight: '800', color: '#1e293b', textAlign: 'center' },

  payBtn: { backgroundColor: '#c0392b', borderRadius: 15, paddingVertical: 16, elevation: 4 },
  payBtnInner: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 10 },
  payBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },

  securityFooter: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 15 },
  securityText: { fontSize: 10, color: '#94a3b8', fontWeight: '500' },
  
  // UPI Card styles
  upiInfoCard: {
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
  },
  upiSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 12,
  },
  upiDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upiLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  upiValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  copyBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
  },
  upiDivider: {
    height: 1,
    marginVertical: 12,
  },
  bankSection: {
    marginTop: 4,
  }
});
