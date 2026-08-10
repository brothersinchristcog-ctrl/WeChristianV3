import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreditCard, ShieldCheck, Calendar, ChevronLeft } from 'lucide-react-native';
import axios from 'axios';
import { Buffer } from 'buffer';
import * as Crypto from 'expo-crypto';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import { firestore } from '../../services/firebaseConfig';
import { AdminTabContext } from '../../context/AdminTabContext';

export default function AdminSubscriptionScreen({ navigation }: any) {
  const { user } = useAuth();
  const { activeChurch } = useChurch();
  const { goBack } = useContext(AdminTabContext);
  const [loading, setLoading] = useState(false);

  const SUBSCRIPTION_AMOUNT = 99; // ₹99/year

  const handleSubscriptionPayment = async () => {
    if (!activeChurch?.id) return;
    setLoading(true);

    try {
      const amount = SUBSCRIPTION_AMOUNT * 100; // in paise
      const transactionId = `C_${activeChurch.id}_${Date.now()}`;
      
      // Platform We Christian Credentials (Sandbox)
      const payload = {
        merchantId: 'PGTESTPAYUAT86',
        merchantTransactionId: transactionId,
        merchantUserId: user?.uid || 'ADMIN_USER',
        amount: amount,
        redirectUrl: 'exp://localhost:8081/--/church-subscription-success', 
        redirectMode: 'REDIRECT',
        callbackUrl: 'https://us-central1-wechristian-67f07.cloudfunctions.net/phonePeCallback', 
        mobileNumber: user?.phoneNumber || "9999999999",
        paymentInstrument: {
          type: 'PAY_PAGE'
        }
      };

      const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
      const apiEndPoint = "/pg/v1/pay";
      const saltKey = '96434309-7796-489d-8924-ab56988a6076';
      
      const stringToHash = base64Payload + apiEndPoint + saltKey;
      const sha256 = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        stringToHash
      );
      
      const checksum = sha256 + "###1";

      const response = await axios.post('https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay', {
        request: base64Payload
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum
        }
      });

      if (response.data?.success && response.data?.data?.instrumentResponse?.redirectInfo?.url) {
        const paymentUrl = response.data.data.instrumentResponse.redirectInfo.url;
        
        // Optimistically update church subscription in firestore before launching URL
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);

        // 1. Create a permanent record in the new 'subscriptions' subcollection
        await firestore()
          .collection('churches')
          .doc(activeChurch.id)
          .collection('subscriptions')
          .doc(transactionId) // use transaction ID as document ID for easy reference
          .set({
            status: 'active',
            tier: 'premium',
            amount: SUBSCRIPTION_AMOUNT,
            validUntil: nextYear.toISOString(),
            paymentId: transactionId,
            paidAt: new Date().toISOString()
          });

        // 2. Update the main church document so the app knows instantly
        await firestore().collection('churches').doc(activeChurch.id).update({
          'subscription.status': 'active',
          'subscription.tier': 'premium',
          'subscription.validUntil': nextYear.toISOString(),
          'subscription.lastPaymentId': transactionId
        });

        Alert.alert('Redirecting', 'Taking you to PhonePe to complete your church subscription securely.');
        Linking.openURL(paymentUrl);
      } else {
        throw new Error('Could not generate payment link');
      }
    } catch (error: any) {
      console.error('Payment Error:', error);
      Alert.alert('Payment Error', error.message || 'Something went wrong during payment initialization.');
    } finally {
      setLoading(false);
    }
  };

    return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        {/* ── Fixed Header ── */}
        <View style={styles.header}>
          {/* Left: Back Button */}
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            <TouchableOpacity onPress={goBack} style={styles.backBtn}>
              <ChevronLeft size={22} color="#fff" />
              <Text style={styles.backBtnTxt}>Back</Text>
            </TouchableOpacity>
          </View>
          
          {/* Center: Title */}
          <View style={[styles.heroTitles, { flex: 2, alignItems: 'center', justifyContent: 'center' }]}>
            <View style={{ borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)', paddingLeft: 16, paddingVertical: 2 }}>
              <Text style={[styles.headerTitle, { fontSize: 20, textAlign: 'center' }]} numberOfLines={1}>Subscription</Text>
              <Text style={[styles.headerSub, { textAlign: 'center' }]}>CHURCH COMPANION</Text>
            </View>
          </View>

          {/* Right: Empty */}
          <View style={{ flex: 1 }} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.iconWrapper}>
              <ShieldCheck size={48} color="#10b981" />
            </View>
            <Text style={styles.title}>We Christian Platform</Text>
            <Text style={styles.subtitle}>
              When a new church registers on the We Christian platform, the administrator will automatically receive a 2-month free trial with full access to all features. 
              {'\n\n'}
              Before the trial expires, the admin will be notified that, to continue using the platform, they must subscribe to the Church Plan for ₹99 per year. Once the trial ends, the church subscription becomes mandatory, and all subscription payments will be credited to the We Christian company account.
            </Text>

            {activeChurch?.subscription?.status === 'active' && activeChurch?.subscription?.validUntil && new Date(activeChurch.subscription.validUntil) > new Date() ? (
              <View style={styles.activeBox}>
                <View style={styles.activeRow}>
                  <ShieldCheck size={24} color="#10b981" />
                  <Text style={styles.activeText}>Active Subscription</Text>
                </View>
                <Text style={styles.validText}>
                  Valid until: {new Date(activeChurch.subscription.validUntil).toLocaleDateString()}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.planBox}>
                  <View style={styles.planRow}>
                    <Calendar size={20} color="#64748B" />
                    <Text style={styles.planText}>Annual Subscription</Text>
                  </View>
                  <Text style={styles.priceText}>₹{SUBSCRIPTION_AMOUNT} <Text style={styles.perYear}>/ year</Text></Text>
                </View>

                <TouchableOpacity 
                  style={[styles.payBtn, loading && { opacity: 0.7 }]} 
                  onPress={handleSubscriptionPayment}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#162057" />
                  ) : (
                    <>
                      <CreditCard size={20} color="#162057" style={{ marginRight: 10 }} />
                      <Text style={styles.payBtnText}>Pay ₹{SUBSCRIPTION_AMOUNT} Now</Text>
                    </>
                  )}
                </TouchableOpacity>
                
                <Text style={styles.footerText}>
                  Payment goes directly to We Christian Technology for platform access.
                </Text>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F0' },
  
  /* Header */
  header: { 
    backgroundColor: '#1a2d5a', 
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
    zIndex: 10,
  },
  backBtn: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 2, paddingVertical: 4, paddingHorizontal: 2 },
  backBtnTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },
  heroTitles: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: '#F3EAD9', marginTop: 2, letterSpacing: 1.5, fontWeight: '800' },
  
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#162057',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  planBox: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    padding: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  planText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 8,
  },
  priceText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#162057',
  },
  perYear: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  payBtn: {
    backgroundColor: '#BE9A3A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#BE9A3A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  payBtnText: {
    color: '#162057',
    fontSize: 16,
    fontWeight: '800',
  },
  footerText: {
    marginTop: 20,
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  activeBox: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#34d399',
    backgroundColor: '#ecfdf5',
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeText: {
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 10,
    color: '#047857',
  },
  validText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065f46',
  }
});
