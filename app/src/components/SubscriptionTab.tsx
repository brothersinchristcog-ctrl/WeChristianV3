import React, { useState, useRef, useMemo } from 'react';
import Svg, { Circle } from 'react-native-svg';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Linking,
  Modal,
  Image,
  Platform,
} from 'react-native';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  CreditCard,
  Building,
  Check,
  MenuSquare,
  ShieldCheck,
  Clock,
  Download,
  X,
  Trash2
} from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Buffer } from 'buffer';
import * as Crypto from 'expo-crypto';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import storage from '@react-native-firebase/storage';
import RazorpayCheckout from 'react-native-razorpay';
import { useAuth } from '../context/AuthContext';
import { useChurch } from '../context/ChurchContext';
import firestoreService, { SubscriptionPlan, GlobalUser } from '../services/FirestoreService';
import { firestore, functions } from '../services/firebaseConfig';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Colors from Stitch design system
const colors = {
  background: '#fbfaf0',
  onSurface: '#1b1c16',
  surface: '#fbfaf0',
  ink: '#1C2333',
  brass: '#B8912F',
  rule: '#D8D2BF',
  ruleStrong: '#B9B29A',
  paperRaised: '#F7F6EE',
  paper: '#EEEDE3',
  textSoft: '#5B6072',
  forest: '#2F5233',
  forestSoft: '#E4EBE1',
};

export default function SubscriptionTab({ member }: { member?: any }) {
  const { user } = useAuth();
  const { activeChurch } = useChurch();
  const navigation = useNavigation<any>();
  
  const receiptRef = useRef<View>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState('upi');

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [globalUser, setGlobalUser] = useState<GlobalUser | null>(null);
  const [viewReceiptModalVisible, setViewReceiptModalVisible] = useState(false);
  const [downloadSuccessModalVisible, setDownloadSuccessModalVisible] = useState(false);
  const [planSelectModalVisible, setPlanSelectModalVisible] = useState(false);
  const [selectedAdvancePlan, setSelectedAdvancePlan] = useState<'monthly' | 'annual'>('annual');
  const [receiptTxnId, setReceiptTxnId] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const fetchedPlans = await firestoreService.getSubscriptionPlans();
        setPlans(fetchedPlans);
        if (user?.uid) {
          const u = await firestoreService.getGlobalUser(user.uid);
          setGlobalUser(u);
          if (activeChurch?.id) {
            const hist = await firestoreService.getMemberSubscriptionHistory(activeChurch.id, user.uid);
            setSubscriptionHistory(hist);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.uid]);

  const twoMonthsFromNow = new Date();
  twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);
  const trialEndDateStr = twoMonthsFromNow.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const monthlyPlan = plans.find(p => p.billingCycle === 'monthly');
  const annualPlan = plans.find(p => p.billingCycle === 'annual');

  const activePlan = billingCycle === 'annual' ? annualPlan : monthlyPlan;
  const planPrice = billingCycle === 'annual' ? 120 : 10; // Enforce correct pricing
  const planFeatures = activePlan ? activePlan.features : ['Unlimited access to the Sacred Ledger', 'Personalized prayer notifications', 'Offline access for scripture study', 'Exclusive liturgical commentaries'];
  const planSavings = annualPlan?.savings || 'SAVE ₹89';

  const calculateDaysRemaining = () => {
    // If they have an explicit trial end date saved
    if (globalUser?.subscription?.trialEndsAt) {
      const endsAt = globalUser.subscription.trialEndsAt.toDate ? globalUser.subscription.trialEndsAt.toDate() : new Date(globalUser.subscription.trialEndsAt);
      const diffTime = Math.max(0, endsAt.getTime() - new Date().getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    // Otherwise, calculate 60 days from their registration date
    const dateToUse = globalUser?.createdAt || member?.joinDate;
    if (dateToUse) {
      const createdDate = (typeof dateToUse === 'object' && dateToUse.toDate) ? dateToUse.toDate() : new Date(dateToUse);
      const trialEnd = new Date(createdDate);
      trialEnd.setDate(trialEnd.getDate() + 60);
      const diffTime = trialEnd.getTime() - new Date().getTime();
      return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    // Default to 60 for brand new users if no data is found yet
    return 60;
  };

  const daysRemaining = calculateDaysRemaining();

  const nextStep = (step: number) => {
    setCurrentStep(step);
  };

  const cycleText = billingCycle === 'annual' ? '/ year' : '/ month';

  const handleRazorpayPayment = async (overrideCycle?: 'monthly' | 'annual') => {
    try {
      const actualCycle = overrideCycle || billingCycle;
      const actualPlan = actualCycle === 'annual' ? annualPlan : monthlyPlan;
      const amount = actualCycle === 'annual' ? 108 : 10;
      const receipt = `RCPT_${Date.now()}`;
      
      const createOrder = functions().httpsCallable('createRazorpayOrderV4');
      const res = await createOrder({ amount, receipt });
      const { orderId, keyId } = (res.data as any);

      const options = {
        description: 'Subscription',
        image: activeChurch?.theme?.logoUrl || 'https://cdn-icons-png.flaticon.com/512/8662/8662584.png',
        currency: 'INR',
        key: keyId,
        amount: amount * 100,
        name: activeChurch?.name || 'We Christian',
        order_id: orderId,
        prefill: {
          email: user?.email || '',
          contact: user?.phoneNumber || member?.phone || '',
          name: member?.firstName ? `${member.firstName} ${member.lastName || ''}` : ''
        },
        theme: { color: colors.brass }
      };

      RazorpayCheckout.open(options).then(async (data: any) => {
        const transactionId = data.razorpay_payment_id;
        setReceiptTxnId(transactionId);
        
        try {
          // --- SECURE BACKEND VERIFICATION FOR MEMBERS ---
          const verifyPayment = functions().httpsCallable('verifyRazorpaySubscription');
          await verifyPayment({
            razorpay_payment_id: transactionId,
            razorpay_order_id: data.razorpay_order_id,
            razorpay_signature: data.razorpay_signature,
            type: 'member',
            userId: user?.uid,
            churchId: activeChurch?.id,
            amount: amount,
            plan: actualCycle
          });
          
          // Refresh history and user
          if (activeChurch && user) {
            // Member history might not show up if we don't change how it fetches,
            // but the GlobalUser will be updated.
            const u = await firestoreService.getGlobalUser(user.uid);
            setGlobalUser(u);
            
            // To properly show history, we might need a backend call or fetch from platform_subscriptions.
            // For now, we will just fetch whatever was in the old collection so it doesn't break,
            // but ideally you'd fetch from platform_subscriptions.
            const hist = await firestoreService.getMemberSubscriptionHistory(activeChurch.id, user.uid);
            setSubscriptionHistory(hist);
          }
          
          nextStep(5);
        } catch (verificationError: any) {
          console.error('Subscription Verification Error:', verificationError);
          Alert.alert('Payment Successful, but Verification Failed', 'We could not securely verify your payment with our servers. Please contact support.');
        }
      }).catch((error: any) => {
        let errorMsg = error.description || 'Payment was cancelled or failed.';
        let isCancellation = false;

        if (error.code === 0 || error.code === 2) {
          if (typeof errorMsg === 'string') {
            if (errorMsg.toLowerCase().includes('cancel')) {
              isCancellation = true;
            } else if (errorMsg.includes('payment_error') && errorMsg.includes('payment_authentication')) {
              isCancellation = true; // User backed out of bank/UPI page
            }
          }
        }

        if (isCancellation) {
          if (activeChurch && user) {
            firestoreService.logCancelledSubscription(activeChurch.id, user.uid, amount, actualCycle).then(() => {
              firestoreService.getMemberSubscriptionHistory(activeChurch.id, user.uid).then(hist => {
                setSubscriptionHistory(hist);
              });
            });
          }
          return;
        }

        console.error('Razorpay Error:', error);

        try {
          if (typeof error.description === 'string' && error.description.startsWith('{')) {
            const parsed = JSON.parse(error.description);
            if (parsed.error?.description && parsed.error.description !== 'undefined') {
              errorMsg = parsed.error.description;
            } else {
              errorMsg = 'Payment could not be completed. Please try again.';
            }
          }
        } catch (e) {}

        Alert.alert('Payment Failed', errorMsg);
      });
    } catch (e: any) {
      console.error(e);
      Alert.alert('Initialization Error', e.message || 'Could not initialize payment.');
    }
  };

  const downloadReceipt = async () => {
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
    if (globalUser?.subscription?.validUntil) {
      nextDateStr = new Date(globalUser.subscription.validUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
    } else {
      const nextDate = new Date();
      if (billingCycle === 'annual') nextDate.setFullYear(nextDate.getFullYear() + 1);
      else nextDate.setMonth(nextDate.getMonth() + 1);
      nextDateStr = nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
    }
    return {
      transactionId: receiptTxnId || globalUser?.subscription?.lastPaymentId || `WC-${Math.floor(1000 + Math.random() * 9000)}-X91`,
      date,
      name: user?.displayName || member?.name || "Member",
      nextDateStr
    };
  }, [globalUser?.subscription?.validUntil, globalUser?.subscription?.lastPaymentId, billingCycle, user?.displayName, member?.name, receiptTxnId]);

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3, 4, 5].map((step) => (
        <View
          key={step}
          style={[
            styles.progressBar,
            { backgroundColor: step <= currentStep ? colors.brass : colors.rule }
          ]}
        />
      ))}
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F7F3E9' }} contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} bounces={false}>
      {!loading && globalUser?.subscription?.status !== 'active' && renderProgressBar()}

      {loading ? (
        <View style={[styles.stepContainer, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.title}>Loading...</Text>
        </View>
      ) : globalUser?.subscription?.status === 'active' ? (
        <View style={[{ minHeight: 600, backgroundColor: '#F7F3E9' }]}>
          {/* Hero */}
          <View style={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 4 }}>
            <Text style={{ fontSize: 11, letterSpacing: 1.4, color: '#C98A3E', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', textTransform: 'uppercase' }}>
              {activeChurch?.name || 'MEMBER ACCOUNT'}
            </Text>
            <Text style={{ color: '#1F3B3D', fontSize: 36, lineHeight: 40, marginTop: 8, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>
              Welcome, {member?.firstName || user?.displayName?.split(' ')[0] || 'Member'}
            </Text>
            <Text style={{ color: '#6B7A6C', fontSize: 14.5, marginTop: 4 }}>
              Your journey of faith continues.
            </Text>
          </View>

          {/* Dial section */}
          <View style={{ paddingHorizontal: 24, marginTop: 20 }}>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, borderColor: '#C98A3E', borderWidth: 1, paddingVertical: 20, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 110, height: 110, position: 'relative' }}>
                <Svg width="110" height="110" viewBox="0 0 128 128">
                  <Circle cx="64" cy="64" r={54} fill="none" stroke="#EFE9D8" strokeWidth="10" />
                  <Circle
                    cx="64"
                    cy="64"
                    r={54}
                    fill="none"
                    stroke="#C98A3E"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 54}
                    strokeDashoffset={(2 * Math.PI * 54) - ((2 * Math.PI * 54) * Math.max(0, Math.min(1, Math.round((new Date().getTime() - (globalUser?.subscription?.validUntil ? ((globalUser.subscription.validUntil as any).toDate ? (globalUser.subscription.validUntil as any).toDate().getTime() : new Date(globalUser.subscription.validUntil as any).getTime()) : new Date().getTime()) + 30 * 86400000) / 86400000) / 30)))}
                    transform="rotate(-90 64 64)"
                  />
                </Svg>
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: '#1F3B3D', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>
                    {Math.max(0, Math.ceil(((globalUser?.subscription?.validUntil ? ((globalUser.subscription.validUntil as any).toDate ? (globalUser.subscription.validUntil as any).toDate().getTime() : new Date(globalUser.subscription.validUntil as any).getTime()) : new Date().getTime()) - new Date().getTime()) / 86400000))}
                  </Text>
                  <Text style={{ fontSize: 9, letterSpacing: 0.8, color: '#9A8F72', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginTop: 0 }}>
                    DAYS LEFT
                  </Text>
                </View>
              </View>

              <View style={{ flex: 1, marginLeft: 16 }}>
                <View style={{ backgroundColor: '#EAF1EA', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: '#4F7A55', fontSize: 10, fontWeight: '700', letterSpacing: 0.2 }} numberOfLines={1} adjustsFontSizeToFit>
                    ACTIVE — {(globalUser.subscription.plan || '').toUpperCase()} TIER
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 10.5, letterSpacing: 0.8, color: '#9A8F72', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginRight: 6 }}>
                    NEXT RENEWAL
                  </Text>
                  <Text style={{ color: '#1F3B3D', fontSize: 15, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }} numberOfLines={1} adjustsFontSizeToFit>
                    {globalUser.subscription.validUntil ? ((globalUser.subscription.validUntil as any).toDate ? (globalUser.subscription.validUntil as any).toDate() : new Date(globalUser.subscription.validUntil as any)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity 
                style={{ flex: 1, backgroundColor: '#1F3B3D', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
                onPress={() => setPlanSelectModalVisible(true)}
              >
                <Text style={{ color: '#F7F3E9', fontSize: 14, fontWeight: '600' }}>Pay in Advance</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ flex: 1, backgroundColor: '#FFFFFF', borderColor: '#D9D0BC', borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                onPress={downloadReceipt}
              >
                <Download size={16} color="#1F3B3D" style={{ marginRight: 6 }} />
                <Text style={{ color: '#1F3B3D', fontSize: 14, fontWeight: '600' }}>Save Receipt</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Ledger */}
          <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#D9D0BC', paddingBottom: 8 }}>
              <Text style={{ color: '#1F3B3D', fontSize: 20, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>
                Payment History
              </Text>
              <Text style={{ fontSize: 10.5, color: '#9A8F72', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                {subscriptionHistory.length} ENTR{subscriptionHistory.length === 1 ? 'Y' : 'IES'}
              </Text>
            </View>
          </View>

          <View style={{ paddingHorizontal: 24, paddingBottom: 64, marginTop: 24 }}>
            {subscriptionHistory.map((h, i) => (
              <TouchableOpacity onPress={() => setSelectedInvoice(h)} key={h.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: i === subscriptionHistory.length - 1 ? 0 : 1, borderBottomColor: '#E4DDC8' }}>
                <Text style={{ color: '#C4B896', fontSize: 12, width: 22, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                  {String(subscriptionHistory.length - i).padStart(2, '0')}
                </Text>
                <View style={{ width: 36, height: 36, backgroundColor: '#F1EADA', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                  <CreditCard size={16} color="#C98A3E" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#1F3B3D', fontSize: 14.5, fontWeight: '500' }}>{h.plan} Plan</Text>
                  <Text style={{ color: '#9A8F72', fontSize: 11.5, marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                    {h.paidAt 
                      ? ((h.paidAt as any).toDate 
                          ? (h.paidAt as any).toDate() 
                          : ((h.paidAt as any).seconds 
                              ? new Date((h.paidAt as any).seconds * 1000) 
                              : new Date(h.paidAt as any))
                        ).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
                      : 'N/A'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: '#1F3B3D', fontSize: 14.5, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                    ₹{h.amount}
                  </Text>
                  <Text style={{ color: h.status === 'active' ? '#4F7A55' : (h.status === 'cancelled' ? '#ef4444' : '#C98A3E'), fontSize: 10.5, fontWeight: '600', letterSpacing: 0.3, marginTop: 4 }}>
                    {h.status.toUpperCase()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : currentStep === 1 ? (
        <View style={styles.stepContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome back, {member?.firstName || user?.displayName?.split(' ')[0] || 'Member'}</Text>
            <Text style={styles.subtitle}>Your journey of faith continues.</Text>
          </View>

          <View style={styles.circularProgressContainer}>
            <View style={styles.circularProgressInner}>
              <Text style={styles.daysText}>{daysRemaining}</Text>
              <Text style={styles.daysLabel}>{daysRemaining > 0 ? "DAYS REMAINING" : "TRIAL EXPIRED"}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              {daysRemaining > 0 
                ? `You are currently in a 2-month trial. Add a personal subscription now to ensure uninterrupted access to the Sacred Ledger features.`
                : `Your 2-month trial has concluded. Please add a personal subscription to restore uninterrupted access to all features.`
              }
            </Text>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={() => nextStep(2)}>
            <Text style={styles.primaryButtonText}>View Subscription Plans</Text>
            <ArrowRight size={18} color={colors.paper} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      ) : currentStep === 2 ? (
        <View style={styles.stepContainer}>
          <TouchableOpacity style={styles.backBtn} onPress={() => nextStep(1)}>
            <ArrowLeft size={24} color={colors.ink} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Choose Your Path</Text>
            <Text style={styles.subtitle}>Scholarly access tailored for personal devotion.</Text>
          </View>

          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleBtn, billingCycle === 'monthly' && styles.toggleBtnActive]}
              onPress={() => setBillingCycle('monthly')}
            >
              <Text style={[styles.toggleText, billingCycle === 'monthly' && styles.toggleTextActive]}>Monthly</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, billingCycle === 'annual' && styles.toggleBtnActive]}
              onPress={() => setBillingCycle('annual')}
            >
              <Text style={[styles.toggleText, billingCycle === 'annual' && styles.toggleTextActive]}>Annual</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.planCard, { borderColor: colors.brass, borderWidth: 2 }]}>
            {billingCycle === 'annual' && (
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>{planSavings}</Text>
              </View>
            )}

            <View style={styles.planHeader}>
              <View>
                <Text style={styles.planTitle}>Personal Access</Text>
                <Text style={styles.planSubtitle}>Full library & prayer tracking</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.planPrice}>₹{planPrice}</Text>
                <Text style={styles.planSubtitle}>{cycleText}</Text>
              </View>
            </View>

            <View style={styles.featureList}>
              {planFeatures.map((feat, idx) => (
                <View key={idx} style={styles.featureItem}>
                  <CheckCircle size={18} color={colors.forest} />
                  <Text style={styles.featureText}>{feat}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={() => nextStep(3)}>
            <Text style={styles.primaryButtonText}>Continue to Payment</Text>
          </TouchableOpacity>
        </View>
      ) : currentStep === 3 ? (
        <View style={styles.stepContainer}>
          <TouchableOpacity style={styles.backBtn} onPress={() => nextStep(2)}>
            <ArrowLeft size={24} color={colors.ink} />
          </TouchableOpacity>

          <View style={styles.headerLeft}>
            <Text style={styles.title}>Payment Method</Text>
            <Text style={styles.subtitle}>Safe and encrypted processing.</Text>
          </View>

          <View style={styles.paymentMethods}>
            {[
              { id: 'upi', label: 'UPI (GPay, PhonePe, etc.)', icon: <MenuSquare size={20} color={colors.textSoft} /> },
              { id: 'card', label: 'Credit / Debit Card', icon: <CreditCard size={20} color={colors.textSoft} /> },
              { id: 'netbanking', label: 'Net Banking', icon: <Building size={20} color={colors.textSoft} /> },
            ].map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethodCard,
                  paymentMethod === method.id && { borderColor: colors.brass }
                ]}
                onPress={() => setPaymentMethod(method.id)}
              >
                <View style={styles.radioOuter}>
                  {paymentMethod === method.id && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.paymentMethodLabel}>{method.label}</Text>
                {method.icon}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.secureContainer}>
            <View style={styles.secureLine} />
            <Text style={styles.secureText}>SECURED BY RAZORPAY</Text>
            <View style={styles.secureLine} />
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={() => nextStep(4)}>
            <Text style={styles.primaryButtonText}>Review Details</Text>
          </TouchableOpacity>
        </View>
      ) : currentStep === 4 ? (
        <View style={styles.stepContainer}>
          <TouchableOpacity style={styles.backBtn} onPress={() => nextStep(3)}>
            <ArrowLeft size={24} color={colors.ink} />
          </TouchableOpacity>

          <View style={styles.headerLeft}>
            <Text style={styles.title}>Confirm Devotion</Text>
            <Text style={styles.subtitle}>Verify your subscription details.</Text>
          </View>

          <View style={styles.reviewCard}>
            <View style={styles.trialBanner}>
              <Text style={styles.trialBannerText}>🎁 2 Months Free Trial</Text>
            </View>

            <View style={styles.reviewContent}>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>MEMBER</Text>
                <Text style={styles.reviewValue}>{member?.firstName ? `${member.firstName} ${member.lastName || ''}` : (user?.displayName || 'Member')}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>PLAN TYPE</Text>
                <Text style={styles.reviewValue}>Personal Access</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>BILLING CYCLE</Text>
                <Text style={styles.reviewValue}>{billingCycle === 'annual' ? 'Annual' : 'Monthly'}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>TRIAL ENDS ON</Text>
                <Text style={[styles.reviewValue, { color: colors.forest, fontWeight: '700' }]}>{trialEndDateStr}</Text>
              </View>

              <View style={styles.reviewFooter}>
                <View>
                  <Text style={styles.reviewLabel}>DUE TODAY</Text>
                  <Text style={styles.dueTodayPrice}>₹0</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.billedAfter}>Trial Activated Today</Text>
                  <Text style={{ fontSize: 11, color: colors.textSoft, marginTop: 2 }}>
                    Then ₹{planPrice}/{billingCycle === 'annual' ? 'yr' : 'mo'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.disclaimerCard}>
            <Text style={styles.disclaimerText}>
              Your first 2 months are completely free! If you do not subscribe after your trial ends on {trialEndDateStr}, your app access will be locked. By confirming, you authorize We Christian to begin your trial and securely save your payment method.
            </Text>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={() => handleRazorpayPayment()}>
            <Text style={styles.primaryButtonText}>Pay ₹{planPrice} via Razorpay</Text>
          </TouchableOpacity>
        </View>
      ) : currentStep === 5 ? (
        <View style={styles.stepContainer}>
          <View style={{ alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10 }}>
          <View style={styles.successIconWrapper}>
            <View style={styles.successIconInner}>
              <Check size={48} color="#fff" />
            </View>
          </View>
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successSubtitle}>
            Thank you for your generous heart. Your transaction has been verified securely.
          </Text>

          <View style={styles.receiptCard}>
            <View style={styles.receiptCardHeader}>
              <Text style={styles.receiptCardTitle}>TRANSACTION DETAILS</Text>
            </View>
            <View style={{ padding: 24 }}>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>TRANSACTION ID</Text>
                <Text style={styles.receiptValue}>{receiptData.transactionId}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>DATE</Text>
                <Text style={styles.receiptValue}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>AMOUNT PAID</Text>
                <Text style={styles.receiptValue}>₹{planPrice.toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.receiptCardFooter}>
              <CheckCircle size={16} color={colors.forest} style={{ marginRight: 6 }} />
              <Text style={styles.receiptCardFooterText}>Payment verified & processed</Text>
            </View>
          </View>

          <View style={styles.successActionsContainer}>
            <TouchableOpacity style={styles.primaryActionBtn} onPress={() => setViewReceiptModalVisible(true)}>
              <Text style={styles.primaryActionBtnText}>View Receipt</Text>
            </TouchableOpacity>
            
            <View style={styles.secondaryActionsRow}>
              <TouchableOpacity style={styles.secondaryActionBtn} onPress={downloadReceipt}>
                <Text style={styles.secondaryActionBtnText}>Save Image</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryActionBtn} onPress={() => nextStep(1)}>
                <Text style={styles.secondaryActionBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </View>
      ) : null}

      <Modal visible={viewReceiptModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.receiptModalContent}>
            <View style={styles.receiptHeader}>
              <Image source={{ uri: activeChurch?.theme?.logoUrl || 'https://cdn-icons-png.flaticon.com/512/8662/8662584.png' }} style={styles.receiptLogo} />
              <Text style={styles.receiptChurchName}>{activeChurch?.name || 'Bethesda Pentecostal Church'}</Text>
              <Text style={styles.receiptChurchDetails}>{activeChurch?.address || '123 Faith Avenue, Blessing City'} • {activeChurch?.contactEmail || 'contact@church.org'}</Text>
            </View>

            <Text style={styles.receiptTitle}>SUBSCRIPTION RECEIPT</Text>

            <View style={styles.receiptInfoRow}>
              <Text style={styles.receiptLabel}>MEMBER NAME</Text>
              <Text style={styles.receiptValueTxt}>{user?.displayName || member?.name || "Member"}</Text>
            </View>
            <View style={styles.receiptInfoRow}>
              <Text style={styles.receiptLabel}>TRANSACTION ID</Text>
              <Text style={styles.receiptValueTxt}>{receiptData.transactionId}</Text>
            </View>
            <View style={styles.receiptInfoRow}>
              <Text style={styles.receiptLabel}>DATE</Text>
              <Text style={styles.receiptValueTxt}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</Text>
            </View>
            <View style={styles.receiptInfoRow}>
              <Text style={styles.receiptLabel}>PLAN</Text>
              <Text style={styles.receiptValueTxt}>{activePlan?.name || billingCycle.toUpperCase()}</Text>
            </View>

            <View style={styles.receiptTotalRow}>
              <Text style={styles.receiptTotalLabel}>Amount Paid</Text>
              <Text style={styles.receiptTotalValue}>₹{planPrice.toFixed(2)}</Text>
            </View>

            <Text style={styles.receiptFooterText}>Thank you for your generous contribution.{'\n'}May God bless you abundantly!</Text>

            <TouchableOpacity style={styles.closeReceiptBtn} onPress={() => setViewReceiptModalVisible(false)}>
              <Text style={styles.closeReceiptBtnTxt}>Close Receipt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {downloadSuccessModalVisible && (
        <Modal transparent animationType="fade" visible={downloadSuccessModalVisible} onRequestClose={() => setDownloadSuccessModalVisible(false)}>
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
        </Modal>
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
            <Text style={{ fontSize: 14, color: '#64748b' }}>{activeChurch?.address || 'City'} • {activeChurch?.contactEmail || 'contact'}</Text>
          </View>
          
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 30, textAlign: 'center' }}>SUBSCRIPTION RECEIPT</Text>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10 }}>
            <Text style={{ fontSize: 14, color: '#64748b', fontWeight: 'bold' }}>MEMBER NAME</Text>
            <Text style={{ fontSize: 16, color: '#1e293b', fontWeight: '500' }}>{receiptData.name}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10 }}>
            <Text style={{ fontSize: 14, color: '#64748b', fontWeight: 'bold' }}>TRANSACTION ID</Text>
            <Text style={{ fontSize: 16, color: '#1e293b', fontWeight: '500' }}>{receiptData.transactionId}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10 }}>
            <Text style={{ fontSize: 14, color: '#64748b', fontWeight: 'bold' }}>DATE</Text>
            <Text style={{ fontSize: 16, color: '#1e293b', fontWeight: '500' }}>{receiptData.date}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10 }}>
            <Text style={{ fontSize: 14, color: '#64748b', fontWeight: 'bold' }}>SUBSCRIPTION PLAN</Text>
            <Text style={{ fontSize: 16, color: '#1e293b', fontWeight: '500' }}>{activePlan?.name || billingCycle.toUpperCase()}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10 }}>
            <Text style={{ fontSize: 14, color: '#64748b', fontWeight: 'bold' }}>NEXT SUBSCRIPTION DATE</Text>
            <Text style={{ fontSize: 16, color: '#1e293b', fontWeight: '500' }}>{receiptData.nextDateStr}</Text>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, paddingTop: 20, borderTopWidth: 2, borderTopColor: '#1e293b' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1e293b' }}>Amount Paid</Text>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#d97706' }}>₹{planPrice.toFixed(2)}</Text>
          </View>
          
          <View style={{ marginTop: 60, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center' }}>Thank you for subscribing to We Christian Platform.</Text>
            <Text style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center' }}>May God bless you abundantly!</Text>
          </View>
        </View>
      </View>

      {/* Plan Selection Modal */}
      <Modal visible={planSelectModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(31,59,61,0.35)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#F7F3E9', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 60 : 48, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontSize: 22, fontWeight: '700', color: '#1F3B3D', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>Pay in advance</Text>
              <TouchableOpacity onPress={() => setPlanSelectModalVisible(false)}>
                <X size={24} color="#9A8F72" />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 14.5, color: '#6B7A6C', lineHeight: 22, marginBottom: 20 }}>
              Charge ₹{selectedAdvancePlan === 'annual' ? 108 : 10} now to move your renewal date forward by one {selectedAdvancePlan === 'monthly' ? 'month' : 'year'}.
            </Text>

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
              <TouchableOpacity 
                style={{ flex: 1, backgroundColor: selectedAdvancePlan === 'monthly' ? '#FFFFFF' : 'transparent', borderWidth: 1, borderColor: selectedAdvancePlan === 'monthly' ? '#C98A3E' : '#D9D0BC', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
                onPress={() => setSelectedAdvancePlan('monthly')}
              >
                <Text style={{ color: selectedAdvancePlan === 'monthly' ? '#C98A3E' : '#6B7A6C', fontSize: 14, fontWeight: '600' }}>Monthly</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ flex: 1, backgroundColor: selectedAdvancePlan === 'annual' ? '#FFFFFF' : 'transparent', borderWidth: 1, borderColor: selectedAdvancePlan === 'annual' ? '#C98A3E' : '#D9D0BC', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
                onPress={() => setSelectedAdvancePlan('annual')}
              >
                <Text style={{ color: selectedAdvancePlan === 'annual' ? '#C98A3E' : '#6B7A6C', fontSize: 14, fontWeight: '600' }}>
                  Annual <Text style={{ color: '#059669', fontSize: 12, fontWeight: 'bold' }}>(-10%)</Text>
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#E4DDC8', paddingTop: 16, marginBottom: 24 }}>
              <Text style={{ fontSize: 11.5, color: '#9A8F72', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>
                New Renewal Date
              </Text>
              <Text style={{ fontSize: 14, color: '#C98A3E', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                {globalUser?.subscription?.validUntil ? new Date(((globalUser.subscription.validUntil as any).toDate ? (globalUser.subscription.validUntil as any).toDate() : new Date(globalUser.subscription.validUntil as any)).getTime() + (selectedAdvancePlan === 'annual' ? 365 : 30) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
              </Text>
            </View>

            <TouchableOpacity 
              style={{ backgroundColor: '#1F3B3D', paddingVertical: 16, borderRadius: 14, alignItems: 'center' }}
              onPress={() => {
                setPlanSelectModalVisible(false);
                handleRazorpayPayment(selectedAdvancePlan);
              }}
            >
              <Text style={{ color: '#F7F3E9', fontSize: 15, fontWeight: '700' }}>Confirm & pay ₹{selectedAdvancePlan === 'annual' ? 108 : 10}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Invoice Modal */}
      <Modal visible={!!selectedInvoice} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(31,59,61,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#F7F3E9', borderRadius: 20, padding: 0, overflow: 'hidden' }}>
            <View style={{ padding: 24, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E4DDC8', alignItems: 'center' }}>
              {activeChurch?.theme?.logoUrl ? (
                <Image source={{ uri: activeChurch.theme.logoUrl }} style={{ width: 64, height: 64, marginBottom: 16 }} resizeMode="contain" />
              ) : (
                <View style={{ width: 64, height: 64, backgroundColor: '#F1EADA', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Building size={32} color="#C98A3E" />
                </View>
              )}
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#1F3B3D', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>{activeChurch?.name || 'Church Name'}</Text>
              <Text style={{ fontSize: 13, color: '#9A8F72', marginTop: 4 }}>Subscription Receipt</Text>
            </View>
            
            <View style={{ padding: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={{ fontSize: 13, color: '#9A8F72' }}>MEMBER NAME</Text>
                <Text style={{ fontSize: 14, color: '#1F3B3D', fontWeight: '600' }}>{member?.firstName || user?.displayName?.split(' ')[0] || 'Member'}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={{ fontSize: 13, color: '#9A8F72' }}>PLAN</Text>
                <Text style={{ fontSize: 14, color: '#1F3B3D', fontWeight: '600', textTransform: 'capitalize' }}>{selectedInvoice?.plan || 'Monthly'} Plan</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={{ fontSize: 13, color: '#9A8F72' }}>DATE</Text>
                <Text style={{ fontSize: 14, color: '#1F3B3D', fontWeight: '600' }}>
                  {selectedInvoice?.paidAt ? ((selectedInvoice.paidAt as any).toDate ? (selectedInvoice.paidAt as any).toDate() : ((selectedInvoice.paidAt as any).seconds ? new Date((selectedInvoice.paidAt as any).seconds * 1000) : new Date(selectedInvoice.paidAt as any))).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={{ fontSize: 13, color: '#9A8F72' }}>TXN ID</Text>
                <Text style={{ fontSize: 14, color: '#1F3B3D', fontWeight: '600' }}>{selectedInvoice?.id?.slice(0,12) || 'N/A'}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={{ fontSize: 13, color: '#9A8F72' }}>STATUS</Text>
                <Text style={{ fontSize: 14, color: selectedInvoice?.status === 'active' ? '#4F7A55' : (selectedInvoice?.status === 'cancelled' ? '#ef4444' : '#C98A3E'), fontWeight: '700' }}>{selectedInvoice?.status?.toUpperCase() || 'N/A'}</Text>
              </View>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 20, borderTopWidth: 1, borderStyle: 'dashed', borderTopColor: '#D9D0BC' }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F3B3D' }}>Total Paid</Text>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#1F3B3D' }}>₹{selectedInvoice?.amount || '0'}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', backgroundColor: '#F1EADA' }}>
              <TouchableOpacity 
                style={{ flex: 1, padding: 16, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#E4DDC8', flexDirection: 'row', justifyContent: 'center' }}
                onPress={async () => {
                  if (activeChurch && user && selectedInvoice) {
                    await firestoreService.deleteSubscriptionHistory(activeChurch.id, user.uid, selectedInvoice.id);
                    setSubscriptionHistory(prev => prev.filter(h => h.id !== selectedInvoice.id));
                    setSelectedInvoice(null);
                  }
                }}
              >
                <Trash2 size={16} color="#ef4444" style={{ marginRight: 6 }} />
                <Text style={{ color: '#ef4444', fontSize: 15, fontWeight: '600' }}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ flex: 1, padding: 16, alignItems: 'center' }}
                onPress={() => setSelectedInvoice(null)}
              >
                <Text style={{ color: '#1F3B3D', fontSize: 15, fontWeight: '600' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 20,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  stepContainer: {
    paddingTop: 10,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSoft,
    marginTop: 4,
  },
  circularProgressContainer: {
    width: 224,
    height: 224,
    borderRadius: 112,
    borderWidth: 10,
    borderColor: colors.rule,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  circularProgressInner: {
    alignItems: 'center',
  },
  daysText: {
    fontSize: 26,
    fontWeight: '600',
    color: colors.ink,
  },
  daysLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: colors.textSoft,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.paperRaised,
    borderColor: colors.rule,
    borderWidth: 1,
    padding: 18,
    borderRadius: 12,
    marginBottom: 24,
  },
  cardText: {
    fontSize: 13,
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    width: '100%',
  },
  primaryButtonText: {
    color: colors.paper,
    fontSize: 14.5,
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    width: '100%',
  },
  secondaryButtonText: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: '500',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.paperRaised,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: 99,
    padding: 4,
    alignSelf: 'center',
    width: 240,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 99,
  },
  toggleBtnActive: {
    backgroundColor: colors.ink,
  },
  toggleText: {
    fontSize: 13,
    color: colors.textSoft,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: colors.paper,
  },
  planCard: {
    backgroundColor: colors.paperRaised,
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
    position: 'relative',
  },
  saveBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: colors.forest,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  saveBadgeText: {
    color: colors.paper,
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.ink,
  },
  planSubtitle: {
    fontSize: 12.5,
    color: colors.textSoft,
  },
  planPrice: {
    fontSize: 26,
    fontWeight: '600',
    color: colors.brass,
  },
  featureList: {
    borderTopWidth: 1,
    borderTopColor: colors.ruleStrong,
    borderStyle: 'dashed',
    paddingTop: 16,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    color: colors.ink,
  },
  paymentMethods: {
    gap: 12,
    marginBottom: 16,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperRaised,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: 12,
    padding: 18,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.rule,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brass,
  },
  paymentMethodLabel: {
    flex: 1,
    fontSize: 14.5,
    color: colors.ink,
    fontWeight: '600',
  },
  secureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 16,
  },
  secureLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.rule,
  },
  secureText: {
    fontSize: 9.5,
    color: colors.textSoft,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  reviewCard: {
    backgroundColor: colors.paperRaised,
    borderWidth: 1,
    borderColor: colors.forest, // Highlight the card with a green border
    borderRadius: 14,
    marginBottom: 24,
    overflow: 'hidden',
  },
  trialBanner: {
    backgroundColor: colors.forest,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trialBannerText: {
    color: colors.paper,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  reviewContent: {
    padding: 24,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
    paddingBottom: 8,
    marginBottom: 16,
  },
  reviewLabel: {
    fontSize: 9.5,
    color: colors.textSoft,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  reviewValue: {
    fontSize: 13,
    color: colors.ink,
    fontWeight: '500',
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderTopColor: colors.ruleStrong,
    paddingTop: 16,
    marginTop: 8,
  },
  dueTodayPrice: {
    fontSize: 26,
    color: colors.forest,
    fontWeight: '600',
  },
  billedAfter: {
    fontSize: 12.5,
    color: colors.textSoft,
    fontStyle: 'italic',
  },
  disclaimerCard: {
    backgroundColor: colors.forestSoft,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: 12,
    padding: 18,
    marginBottom: 24,
  },
  disclaimerText: {
    fontSize: 12.5,
    color: colors.forest,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  // Success Card Styles
  successIconWrapper: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#eefcf5', alignItems: 'center', justifyContent: 'center', marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8
  },
  successIconInner: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center', elevation: 4
  },
  successTitle: { fontSize: 26, fontWeight: '800', color: '#0f172a', marginBottom: 12, letterSpacing: -0.5 },
  successSubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 36, paddingHorizontal: 20, lineHeight: 22 },
  receiptCard: {
    width: '100%', backgroundColor: '#fff', borderRadius: 20, marginBottom: 32,
    elevation: 8, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16,
    borderWidth: 1, borderColor: '#f1f5f9'
  },
  receiptCardHeader: { backgroundColor: '#f8fafc', paddingVertical: 14, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center' },
  receiptCardTitle: { fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 1 },
  receiptCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', paddingVertical: 12, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  receiptCardFooterText: { fontSize: 12, color: colors.forest, fontWeight: '600' },
  successActionsContainer: { width: '100%', paddingHorizontal: 4 },
  primaryActionBtn: { backgroundColor: colors.forest, width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 14, elevation: 3 },
  primaryActionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  secondaryActionsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 12 },
  secondaryActionBtn: { flex: 1, backgroundColor: '#f1f5f9', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  secondaryActionBtnText: { color: '#475569', fontSize: 15, fontWeight: '700' },
  receiptContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.ruleStrong,
    borderStyle: 'dashed',
    paddingVertical: 24,
    gap: 16,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptValue: {
    fontSize: 13,
    color: colors.ink,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  // Receipt Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  receiptModalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, elevation: 5 },
  receiptHeader: { alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 20, marginBottom: 20 },
  receiptLogo: { width: 64, height: 64, marginBottom: 10 },
  receiptChurchName: { fontSize: 20, fontWeight: '800', color: '#1e293b', textAlign: 'center' },
  receiptChurchDetails: { fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 4 },
  receiptTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', textAlign: 'center', marginBottom: 20, letterSpacing: 1 },
  receiptInfoRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f8fafc', paddingBottom: 12, marginBottom: 12 },
  receiptLabel: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  receiptValueTxt: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  receiptTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 16, borderTopWidth: 2, borderTopColor: '#1e293b' },
  receiptTotalLabel: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  receiptTotalValue: { fontSize: 22, fontWeight: '800', color: '#d97706' },
  receiptFooterText: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 30, marginBottom: 30, lineHeight: 20 },
  closeReceiptBtn: { backgroundColor: colors.forest, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  closeReceiptBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' }
});


