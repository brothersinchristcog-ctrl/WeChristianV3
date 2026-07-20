import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking
} from 'react-native';
import { CreditCard, ShieldCheck, Calendar, ArrowLeft } from 'lucide-react-native';
import axios from 'axios';
import { Buffer } from 'buffer';
import * as Crypto from 'expo-crypto';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import { firestore } from '../../services/firebaseConfig';
import { useTheme } from '../../context/ThemeContext';
import { AdminTabContext } from '../../context/AdminTabContext';

export default function AdminSubscriptionScreen({ navigation }: any) {
  const { user } = useAuth();
  const { activeChurch } = useChurch();
  const { isDark } = useTheme();
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
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => goBack()}>
          <ArrowLeft size={24} color={isDark ? '#fff' : '#0f172a'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#0f172a' }]}>Platform Subscription</Text>
      </View>

      <View style={[styles.card, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
        <View style={styles.iconWrapper}>
          <ShieldCheck size={48} color="#10b981" />
        </View>
        <Text style={[styles.title, { color: isDark ? '#fff' : '#0f172a' }]}>We Christian Platform</Text>
        <Text style={[styles.subtitle, { color: isDark ? '#94a3b8' : '#64748b', textAlign: 'left' }]}>
          When a new church registers on the We Christian platform, the administrator will automatically receive a 2-month free trial with full access to all features. 
          {'\n\n'}
          Before the trial expires, the admin will be notified that, to continue using the platform, they must subscribe to the Church Plan for ₹99 per year. Once the trial ends, the church subscription becomes mandatory, and all subscription payments will be credited to the We Christian company account.
        </Text>

        {activeChurch?.subscription?.status === 'active' && activeChurch?.subscription?.validUntil && new Date(activeChurch.subscription.validUntil) > new Date() ? (
          <View style={[styles.activeBox, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5' }]}>
            <View style={styles.activeRow}>
              <ShieldCheck size={24} color="#10b981" />
              <Text style={[styles.activeText, { color: isDark ? '#34d399' : '#047857' }]}>Active Subscription</Text>
            </View>
            <Text style={[styles.validText, { color: isDark ? '#a7f3d0' : '#065f46' }]}>
              Valid until: {new Date(activeChurch.subscription.validUntil).toLocaleDateString()}
            </Text>
          </View>
        ) : (
          <>
            <View style={[styles.planBox, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}>
              <View style={styles.planRow}>
                <Calendar size={20} color={isDark ? '#cbd5e1' : '#475569'} />
                <Text style={[styles.planText, { color: isDark ? '#cbd5e1' : '#475569' }]}>Annual Subscription</Text>
              </View>
              <Text style={[styles.priceText, { color: isDark ? '#fff' : '#0f172a' }]}>₹{SUBSCRIPTION_AMOUNT} <Text style={styles.perYear}>/ year</Text></Text>
            </View>

            <TouchableOpacity 
              style={[styles.payBtn, loading && { opacity: 0.7 }]} 
              onPress={handleSubscriptionPayment}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <CreditCard size={20} color="#fff" style={{ marginRight: 10 }} />
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  card: {
    margin: 20,
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
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
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  planBox: {
    width: '100%',
    borderRadius: 16,
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
    fontWeight: '600',
    marginLeft: 8,
  },
  priceText: {
    fontSize: 32,
    fontWeight: '800',
  },
  perYear: {
    fontSize: 16,
    fontWeight: '500',
  },
  payBtn: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    elevation: 2,
  },
  payBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footerText: {
    marginTop: 20,
    fontSize: 12,
    color: '#94a3b8',
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
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeText: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
  validText: {
    fontSize: 14,
    fontWeight: '500',
  }
});
