import React, { useState, useEffect, useRef } from 'react';
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
  Share,
  Modal
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
import RazorpayCheckout from 'react-native-razorpay';
import * as WebBrowser from 'expo-web-browser';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'Tithe', label: 'Tithe', labelTe: 'దశమభాగం', icon: '🙏' },
  { id: 'Offering', label: 'Offering', labelTe: 'కానుక', icon: '🎁' },
  { id: 'Missions', label: 'Missions', labelTe: 'సేవా నిధి', icon: '🌍' },
  { id: 'Building', label: 'Building', labelTe: 'నిర్మాణ నిధి', icon: '🏛️' },
  { id: 'Special', label: 'Special', labelTe: 'ప్రత్యేక కానుక', icon: '💎' },
  { id: 'Others', label: 'Others', labelTe: 'ఇతర', icon: '📝' }
];

const PRESETS = [50, 100, 500, 1000, 5000];

export default function GivingScreen({ navigation }: any) {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { activeChurch } = useChurch();
  const amountInputRef = useRef<TextInput>(null);
  const [member, setMember] = useState<AppMember | null>(null);
  const [activeCat, setActiveCat] = useState('Tithe');
  const [amount, setAmount] = useState('500');
  const [loading, setLoading] = useState(false);
  const [customEventName, setCustomEventName] = useState('');
  const [showEventModal, setShowEventModal] = useState(false);

  // Pull giving details from the active church; fall back to defaults
  const giving = activeChurch?.givingDetails;
  const upiId = giving?.upiId || '';
  const phonepeNum = giving?.phonepeNumber || '';
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
    if (isNaN(numAmt) || numAmt < 1) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount (Minimum ₹1).');
      return;
    }

    if (activeCat === 'Others' && !customEventName.trim()) {
      Alert.alert('Missing Info', 'Please enter the Event or Offering name.');
      return;
    }

    const finalPurpose = activeCat === 'Others' ? `Others: ${customEventName.trim()}` : activeCat;

    setLoading(true);
    try {
      const donationRef = await FirestoreService.createDonation({
        amount: numAmt,
        donationType: finalPurpose,
        contactId: member?.id || '',
        accountId: member?.accountId || '',
        phone: user?.phoneNumber || '',
        churchId: activeChurch?.id || '',
        status: 'pending'
      });
      
      // 2. Call Cloud Function to initiate Razorpay order
      const createOrderFn = functions().httpsCallable('createRazorpayDonationOrderV6');
      
      const response = await createOrderFn({
        amount: numAmt,
        churchId: activeChurch?.id || '',
        purpose: finalPurpose
      });

      const { success, orderId, keyId } = response.data as any;

      if (success && orderId && keyId) {
        // 3. Open Razorpay Checkout Modal
        const options = {
          description: `Donation: ${finalPurpose}`,
          image: activeChurch?.theme?.logoUrl || 'https://cdn-icons-png.flaticon.com/512/8662/8662584.png',
          currency: 'INR',
          key: keyId,
          amount: numAmt * 100,
          name: activeChurch?.name || 'Your Church',
          order_id: orderId,
          prefill: {
            email: user?.email || '',
            contact: user?.phoneNumber || member?.phone || '',
            name: member?.firstName ? `${member.firstName} ${member.lastName || ''}` : ''
          },
          theme: { color: activeChurch?.theme?.primaryColor || '#1a2d5a' }
        };

        RazorpayCheckout.open(options).then(async (data: any) => {
          // 4. Verify payment with backend
          try {
            const verifyFn = functions().httpsCallable('verifyRazorpayDonationV6');
            const verifyRes = await verifyFn({
              razorpay_payment_id: data.razorpay_payment_id,
              razorpay_order_id: data.razorpay_order_id,
              razorpay_signature: data.razorpay_signature,
              churchId: activeChurch?.id,
              donationId: donationRef
            });
            
            if ((verifyRes.data as any).success) {
              // Optionally update Firestore document directly here or let backend do it
              Alert.alert('Success', 'Your donation was successful. Thank you!');
              // navigation.navigate('PaymentResultScreen', { success: true });
            } else {
              Alert.alert('Verification Failed', 'Payment verification failed.');
            }
          } catch (verifyError: any) {
            console.error('Verify Error:', verifyError);
            Alert.alert('Error', 'Payment verification failed.');
          }
        }).catch((error: any) => {
          console.error('Razorpay Error:', error);
          Alert.alert('Payment Failed', `Code: ${error.code} | Description: ${error.description}`);
        });

      } else {
        Alert.alert('Error', 'Could not initiate payment. Please try again later.');
      }
    } catch (error: any) {
      console.error('Payment Error:', error);
      if (error.message?.includes('Giving is not configured for this church yet')) {
         Alert.alert('Not Configured', 'Giving is not configured for this church yet, please reach out to WeChristian team.');
      } else {
         Alert.alert('Payment Failed', error.message || 'An error occurred while initiating the payment.');
      }
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
          <Text style={styles.headerTitle}>Give with Joy</Text>
          <Text style={styles.headerSubTe}>ఆనందంగా ఇవ్వండి</Text>
          <Text style={styles.headerQuote}>“God loves a cheerful giver” — 2 Cor 9:7</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View>
            {/* ── Category Selection ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>SELECT GIVING CATEGORY</Text>
          <View style={styles.grid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity 
                key={cat.id} 
                style={[styles.gridItem, activeCat === cat.id && styles.gridItemActive]}
                onPress={() => {
                  setActiveCat(cat.id);
                  if (cat.id === 'Others') {
                    setShowEventModal(true);
                  }
                }}
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

          <TouchableOpacity activeOpacity={1} onPress={() => amountInputRef.current?.focus()} style={styles.inputWrapper}>
             <Text style={{ fontSize: 22, fontWeight: '800', color: '#1a2d5a', marginRight: 4 }}>₹</Text>
             <TextInput
               ref={amountInputRef}
               style={styles.amountInput}
               keyboardType="numeric"
               value={amount}
               onChangeText={setAmount}
               placeholder="0"
               placeholderTextColor="#94a3b8"
             />
          </TouchableOpacity>

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
                <Text style={styles.payBtnTxt}>Pay ₹{amount} Securely</Text>
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
      </ScrollView>

      {/* Others Event Name Modal */}
      <Modal visible={showEventModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#1e293b' }]}>Event / Offering Name</Text>
            <Text style={[styles.modalSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>Please enter the name of the special event or offering you are giving towards.</Text>
            
            <TextInput
              style={[styles.inputWrapper, { width: '100%', marginBottom: 20 }]}
              placeholder="e.g. Youth Camp 2026"
              placeholderTextColor="#94a3b8"
              value={customEventName}
              onChangeText={setCustomEventName}
            />
            
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
                onPress={() => {
                  setShowEventModal(false);
                  if (!customEventName.trim()) {
                    setActiveCat('Tithe'); // Revert if cancelled
                  }
                }}
              >
                <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: '#1a2d5a' }]}
                onPress={() => {
                  if (customEventName.trim()) {
                    setShowEventModal(false);
                  } else {
                    Alert.alert('Required', 'Please enter a name or tap Cancel.');
                  }
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    backgroundColor: '#1a2d5a', 
    paddingTop: Platform.OS === 'ios' ? 55 : (StatusBar.currentHeight ? StatusBar.currentHeight + 15 : 40), 
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, alignItems: 'center' },
  backBtn: { paddingVertical: 10 },
  backBtnTxt: { color: '#FCD34D', fontSize: 16, fontWeight: '700' },
  themeToggle: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  themeToggleText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  
  headerContent: { alignItems: 'center', marginTop: 0 },
  iconCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(252,211,77,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSubTe: { fontSize: 13, color: '#FCD34D', fontWeight: '500', marginTop: 2 },
  headerQuote: { fontSize: 11, color: '#aac4e8', marginTop: 6, fontStyle: 'italic' },

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
    width: (width - 64 - 20) / 3, // 3 column grid with 10 spacing between each (20 total)
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 10, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    marginBottom: 10
  },
  gridItemActive: { borderColor: '#1a2d5a', borderWidth: 2, backgroundColor: '#f0f4ff' },
  catEmoji: { fontSize: 20, marginBottom: 6 },
  catTitle: { fontSize: 11, fontWeight: '700', color: '#1e293b', textAlign: 'center' },
  catTitleTe: { fontSize: 9, color: '#64748b', marginTop: 2, textAlign: 'center' },
  label: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 8, marginLeft: 4 },

  presetRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, marginBottom: 15 },
  presetBtn: { 
    flex: 1, 
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#fff'
  },
  amountInput: { fontSize: 22, fontWeight: '800', color: '#1e293b', padding: 0, margin: 0, minWidth: 40 },

  payBtn: { backgroundColor: '#15803d', borderRadius: 30, paddingVertical: 16, elevation: 4 },
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
  },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', borderRadius: 20, padding: 24, alignItems: 'center', elevation: 10 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  modalSubtitle: { fontSize: 13, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }
});
