import React, { useState, useContext, useRef, useMemo } from 'react';
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
  StatusBar,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreditCard, ShieldCheck, Calendar, ChevronLeft, CheckCircle } from 'lucide-react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import { firestore, functions } from '../../services/firebaseConfig';
import { AdminTabContext } from '../../context/AdminTabContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';

export default function AdminSubscriptionScreen({ navigation }: any) {
  const { user } = useAuth();
  const { activeChurch } = useChurch();
  const { goBack } = useContext(AdminTabContext);
  const [loading, setLoading] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [downloadSuccessModalVisible, setDownloadSuccessModalVisible] = useState(false);
  const [receiptTxnId, setReceiptTxnId] = useState('');
  
  const receiptRef = useRef<View>(null);

  const SUBSCRIPTION_AMOUNT = 2; // ₹2/year for testing

  const downloadReceipt = async (txnId: string) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need photo gallery permissions to save the receipt.');
        return;
      }

      if (receiptRef.current) {
        setTimeout(async () => {
          try {
            const uri = await captureRef(receiptRef, { format: 'png', quality: 1 });
            await MediaLibrary.saveToLibraryAsync(uri);
            setDownloadSuccessModalVisible(true);
          } catch (e: any) {
            console.error('Capture Error:', e);
            Alert.alert('Error', 'Could not capture receipt image.');
          }
        }, 100);
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e.message || 'Could not save receipt.');
    }
  };

  const receiptData = useMemo(() => {
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
    let nextDateStr = 'N/A';
    if ((activeChurch?.subscription as any)?.validUntil) {
      nextDateStr = new Date((activeChurch?.subscription as any).validUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
    }
    return {
      date,
      nextDateStr
    };
  }, [(activeChurch?.subscription as any)?.validUntil]);

  const handleSubscriptionPayment = async () => {
    if (!activeChurch?.id) return;
    setLoading(true);

    try {
      const amount = SUBSCRIPTION_AMOUNT;
      const receipt = `CHURCH_${activeChurch.id}_${Date.now()}`;
      
      const createOrder = functions().httpsCallable('createRazorpayOrderV4');
      const res = await createOrder({ amount, receipt });
      const { orderId, keyId } = (res.data as any);

      const options = {
        description: 'Church Annual Subscription',
        image: activeChurch?.theme?.logoUrl || 'https://cdn-icons-png.flaticon.com/512/8662/8662584.png',
        currency: 'INR',
        key: keyId,
        amount: amount * 100,
        name: activeChurch?.name || 'We Christian',
        order_id: orderId,
        prefill: {
          email: user?.email || '',
          contact: user?.phoneNumber || "9999999999",
          name: user?.displayName || 'Admin'
        },
        theme: { color: '#BE9A3A' }
      };

      RazorpayCheckout.open(options).then(async (data: any) => {
        const transactionId = data.razorpay_payment_id;
        
        // Optimistically update church subscription in firestore
        const nextYear = new Date();
        nextYear.setDate(nextYear.getDate() + 1); // 1 day for testing

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
          'subscriptionTier': 'premium',
          'subscription.validUntil': nextYear.toISOString(),
          'subscription.lastPaymentId': transactionId
        });

        setReceiptTxnId(transactionId);
        setSuccessModalVisible(true);
      }).catch((error: any) => {
        console.error('Payment Error:', error);
        Alert.alert('Payment Error', `Failed to complete payment. ${error.description || ''}`);
      });
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
                <TouchableOpacity 
                  style={{ marginTop: 15, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#ecfdf5', borderRadius: 8, borderWidth: 1, borderColor: '#10b981', alignSelf: 'center' }}
                  onPress={() => downloadReceipt((activeChurch?.subscription as any)?.lastPaymentId || '')}
                >
                  <Text style={{ color: '#047857', fontWeight: 'bold' }}>Save Receipt Image</Text>
                </TouchableOpacity>
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

        {successModalVisible && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 100 }]}>
            <View style={{ backgroundColor: '#fff', width: '85%', borderRadius: 20, padding: 30, alignItems: 'center' }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <CheckCircle size={40} color="#059669" />
              </View>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 10, textAlign: 'center' }}>Subscription Active!</Text>
              <Text style={{ fontSize: 15, color: '#4b5563', textAlign: 'center', marginBottom: 30, lineHeight: 22 }}>
                Thank you for subscribing to the We Christian platform. Your church now has unlimited access to all features.
              </Text>
              
              <TouchableOpacity 
                style={{ backgroundColor: '#10b981', width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 }}
                onPress={() => downloadReceipt(receiptTxnId)}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Save Receipt Image</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={{ backgroundColor: '#f3f4f6', width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
                onPress={() => setSuccessModalVisible(false)}
              >
                <Text style={{ color: '#4b5563', fontSize: 16, fontWeight: '700' }}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {downloadSuccessModalVisible && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 105 }]}>
            <View style={{ backgroundColor: '#fff', width: '85%', borderRadius: 24, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 4, borderColor: '#dcfce7' }}>
                <CheckCircle size={36} color="#16a34a" />
              </View>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 12, textAlign: 'center' }}>Success!</Text>
              <Text style={{ fontSize: 15, color: '#475569', textAlign: 'center', marginBottom: 30, lineHeight: 22 }}>
                Your receipt has been beautifully rendered and saved securely to your photo gallery.
              </Text>
              
              <TouchableOpacity 
                style={{ backgroundColor: '#16a34a', width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center' }}
                onPress={() => setDownloadSuccessModalVisible(false)}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Great, thanks!</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Hidden Receipt View for Snapshot */}
        <View style={{ position: 'absolute', top: -10000, left: 0, width: 600 }}>
          <View collapsable={false} ref={receiptRef} style={{ width: 600, backgroundColor: '#ffffff', padding: 40 }}>
            <View style={{ alignItems: 'center', marginBottom: 40, borderBottomWidth: 2, borderBottomColor: '#e2e8f0', paddingBottom: 20 }}>
              {activeChurch?.theme?.logoUrl ? (
                <Image source={{ uri: activeChurch.theme.logoUrl }} style={{ width: 80, height: 80, marginBottom: 10 }} resizeMode="contain" />
              ) : (
                <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/8662/8662584.png' }} style={{ width: 80, height: 80, marginBottom: 10 }} resizeMode="contain" />
              )}
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#1e293b', marginBottom: 5 }}>{activeChurch?.name || 'We Christian'}</Text>
            </View>
            
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 30, textAlign: 'center' }}>CHURCH SUBSCRIPTION RECEIPT</Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10 }}>
              <Text style={{ fontSize: 14, color: '#64748b', fontWeight: 'bold' }}>ADMIN NAME</Text>
              <Text style={{ fontSize: 16, color: '#1e293b', fontWeight: '500' }}>{user?.displayName || 'Admin'}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10 }}>
              <Text style={{ fontSize: 14, color: '#64748b', fontWeight: 'bold' }}>TRANSACTION ID</Text>
              <Text style={{ fontSize: 16, color: '#1e293b', fontWeight: '500' }}>{receiptTxnId || (activeChurch?.subscription as any)?.lastPaymentId || 'N/A'}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10 }}>
              <Text style={{ fontSize: 14, color: '#64748b', fontWeight: 'bold' }}>DATE</Text>
              <Text style={{ fontSize: 16, color: '#1e293b', fontWeight: '500' }}>{receiptData.date}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10 }}>
              <Text style={{ fontSize: 14, color: '#64748b', fontWeight: 'bold' }}>SUBSCRIPTION PLAN</Text>
              <Text style={{ fontSize: 16, color: '#1e293b', fontWeight: '500' }}>ANNUAL CHURCH PLAN</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10 }}>
              <Text style={{ fontSize: 14, color: '#64748b', fontWeight: 'bold' }}>NEXT SUBSCRIPTION DATE</Text>
              <Text style={{ fontSize: 16, color: '#1e293b', fontWeight: '500' }}>{receiptData.nextDateStr}</Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, paddingTop: 20, borderTopWidth: 2, borderTopColor: '#1e293b' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1e293b' }}>Amount Paid</Text>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#d97706' }}>₹{SUBSCRIPTION_AMOUNT}.00</Text>
            </View>
            
            <View style={{ marginTop: 60, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center' }}>Thank you for subscribing to We Christian Platform.</Text>
              <Text style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center' }}>May God bless you abundantly!</Text>
            </View>
          </View>
        </View>
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
