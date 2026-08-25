import React, { useState, useRef, useMemo } from 'react';
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
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
  Trash2,
  Crown
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
  const { activeChurch, setChurchId } = useChurch();
  const navigation = useNavigation<any>();
  
  const receiptRef = useRef<View>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
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
  const [timeLeft, setTimeLeft] = useState({ days: '00', hours: '00', minutes: '00', seconds: '00' });

  React.useEffect(() => {
    const calculateTimeLeft = () => {
      let endsAt = new Date();
      if (activeChurch?.subscription?.status === 'active' && activeChurch?.subscription?.validUntil) {
        endsAt = (activeChurch.subscription.validUntil as any).toDate ? (activeChurch.subscription.validUntil as any).toDate() : new Date(activeChurch.subscription.validUntil as any);
      } else if (activeChurch?.subscription?.trialEndsAt) {
        endsAt = (activeChurch.subscription.trialEndsAt as any).toDate ? (activeChurch.subscription.trialEndsAt as any).toDate() : new Date(activeChurch.subscription.trialEndsAt as any);
      } else if ((activeChurch as any)?.createdAt) {
        const created = ((activeChurch as any).createdAt.toDate ? (activeChurch as any).createdAt.toDate() : new Date((activeChurch as any).createdAt));
        endsAt = new Date(created.getTime() + 60 * 24 * 60 * 60 * 1000);
      }
      
      const diff = endsAt.getTime() - new Date().getTime();
      
      if (diff > 0) {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / 1000 / 60) % 60);
        const s = Math.floor((diff / 1000) % 60);
        
        setTimeLeft({
          days: d.toString().padStart(2, '0'),
          hours: h.toString().padStart(2, '0'),
          minutes: m.toString().padStart(2, '0'),
          seconds: s.toString().padStart(2, '0'),
        });
      } else {
        setTimeLeft({ days: '00', hours: '00', minutes: '00', seconds: '00' });
      }
    };
    
    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [activeChurch]);

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
  const planPrice = 1; // Church annual plan - ₹1 for testing (later 199)
  const planFeatures = ['Church-wide access for all members', 'Unlimited push notifications', 'Manage events and sermons', 'Pastoral and admin tools'];
  const planSavings = 'PREMIUM';

  const calculateDaysRemaining = () => {
    // Check if the subscription is actively paid
    if (activeChurch?.subscription?.status === 'active' && activeChurch?.subscription?.validUntil) {
      const endsAt = (activeChurch.subscription.validUntil as any).toDate ? (activeChurch.subscription.validUntil as any).toDate() : new Date(activeChurch.subscription.validUntil as any);
      const diffTime = Math.max(0, endsAt.getTime() - new Date().getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // If they have an explicit trial end date saved on the church
    if (activeChurch?.subscription?.trialEndsAt) {
      const endsAt = activeChurch.subscription.trialEndsAt.toDate ? activeChurch.subscription.trialEndsAt.toDate() : new Date(activeChurch.subscription.trialEndsAt);
      const diffTime = Math.max(0, endsAt.getTime() - new Date().getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    // Otherwise, calculate 60 days from church registration date
    const dateToUse = (activeChurch as any)?.createdAt;
    if (dateToUse) {
      const createdDate = (typeof dateToUse === 'object' && dateToUse.toDate) ? dateToUse.toDate() : new Date(dateToUse);
      const trialEnd = new Date(createdDate);
      trialEnd.setDate(trialEnd.getDate() + 60);
      const diffTime = trialEnd.getTime() - new Date().getTime();
      return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    return 60;
  };

  const daysRemaining = calculateDaysRemaining();

  const nextStep = (step: number) => {
    setCurrentStep(step);
  };

  const cycleText = billingCycle === 'annual' ? '/ year' : '/ month';

  const handleRazorpayPayment = async (overrideCycle?: 'monthly' | 'annual') => {
    try {
      const actualCycle = 'annual';
      const amount = planPrice;
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
          // --- SECURE BACKEND VERIFICATION FOR CHURCHES ---
          const verifyPayment = functions().httpsCallable('verifyRazorpaySubscriptionV3');
          await verifyPayment({
            razorpay_payment_id: transactionId,
            razorpay_order_id: data.razorpay_order_id,
            razorpay_signature: data.razorpay_signature,
            type: 'church',
            userId: user?.uid,
            churchId: activeChurch?.id,
            amount: amount,
            plan: actualCycle
          });
          
          // Refresh history, user, and church context
          if (activeChurch && user) {
            // Force ChurchContext to fetch latest data to unblock the app!
            await setChurchId(activeChurch.id);

            const u = await firestoreService.getGlobalUser(user.uid);
            setGlobalUser(u);
            
            // To properly show history, we might need a backend call or fetch from platform_subscriptions.
            // For now, we will just fetch whatever was in the old collection so it doesn't break,
            // but ideally you'd fetch from platform_subscriptions.
            const hist = await firestoreService.getMemberSubscriptionHistory(activeChurch.id, user.uid);
            setSubscriptionHistory(hist);
          }
          // The church context refresh above will automatically transition the UI
          // to the active dashboard. No need to go to a separate step 5.
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
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
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
    if (activeChurch?.subscription?.validUntil) {
      nextDateStr = new Date(activeChurch.subscription.validUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
    } else {
      const nextDate = new Date();
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      nextDateStr = nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
    }
    return {
      transactionId: receiptTxnId || (activeChurch?.subscription as any)?.lastPaymentId || `WC-${Math.floor(1000 + Math.random() * 9000)}-X91`,
      date,
      name: activeChurch?.name || "Church",
      nextDateStr
    };
  }, [activeChurch?.subscription?.validUntil, (activeChurch?.subscription as any)?.lastPaymentId, receiptTxnId, activeChurch?.name]);

  const daysLeft = useMemo(() => {
    if (activeChurch?.subscription?.validUntil) {
      const date = (activeChurch.subscription.validUntil as any).toDate 
        ? (activeChurch.subscription.validUntil as any).toDate() 
        : new Date(activeChurch.subscription.validUntil as any);
      return Math.max(0, Math.ceil((date.getTime() - new Date().getTime()) / 86400000));
    }
    return 0;
  }, [activeChurch?.subscription?.validUntil]);
  
  // Assume 30 days is a standard 100% circle (e.g., for monthly or a countdown window), 
  // unless they have more than 30 days left, then maxDays becomes their remaining days rounded up.
  // This ensures the progress circle is always visibly filled based on a 30-day window.
  const maxDays = Math.max(30, daysLeft);
  const progressRatio = Math.max(0, Math.min(1, daysLeft / maxDays));
  const dashOffset = (2 * Math.PI * 54) - ((2 * Math.PI * 54) * progressRatio);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#cbd5e1' }} contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} bounces={false}>

      {loading ? (
        <View style={[styles.stepContainer, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.title}>Loading...</Text>
        </View>
      ) : (activeChurch?.subscription?.status === 'active' && !planSelectModalVisible) ? (
        <View style={[{ minHeight: 600, backgroundColor: '#cbd5e1', paddingTop: 24 }]}>
          <View style={{ backgroundColor: '#171e2e', borderRadius: 20, padding: 20, paddingBottom: 16, marginBottom: 24, marginHorizontal: 16, alignItems: 'center' }}>
            <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 }}>TIME REMAINING</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', width: '100%' }}>
              <View style={{ alignItems: 'center', width: 60 }}>
                <Text style={{ color: '#f8fafc', fontSize: 28, fontWeight: '800' }}>{timeLeft.days}</Text>
                <Text style={{ color: '#94a3b8', fontSize: 10, marginTop: 4, fontWeight: '600' }}>DAYS</Text>
              </View>
              <Text style={{ color: '#64748b', fontSize: 24, fontWeight: '600', marginHorizontal: 4, marginTop: 2 }}>:</Text>
              <View style={{ alignItems: 'center', width: 60 }}>
                <Text style={{ color: '#f8fafc', fontSize: 28, fontWeight: '800' }}>{timeLeft.hours}</Text>
                <Text style={{ color: '#94a3b8', fontSize: 10, marginTop: 4, fontWeight: '600' }}>HRS</Text>
              </View>
              <Text style={{ color: '#64748b', fontSize: 24, fontWeight: '600', marginHorizontal: 4, marginTop: 2 }}>:</Text>
              <View style={{ alignItems: 'center', width: 60 }}>
                <Text style={{ color: '#f8fafc', fontSize: 28, fontWeight: '800' }}>{timeLeft.minutes}</Text>
                <Text style={{ color: '#94a3b8', fontSize: 10, marginTop: 4, fontWeight: '600' }}>MIN</Text>
              </View>
              <Text style={{ color: '#64748b', fontSize: 24, fontWeight: '600', marginHorizontal: 4, marginTop: 2 }}>:</Text>
              <View style={{ alignItems: 'center', width: 60 }}>
                <Text style={{ color: '#f8fafc', fontSize: 28, fontWeight: '800' }}>{timeLeft.seconds}</Text>
                <Text style={{ color: '#94a3b8', fontSize: 10, marginTop: 4, fontWeight: '600' }}>SEC</Text>
              </View>
            </View>
          </View>

          <View style={{ backgroundColor: '#171e2e', borderRadius: 24, borderWidth: 1.5, borderColor: '#10b981', padding: 16, paddingBottom: 20, marginHorizontal: 28, overflow: 'hidden' }}>
            <View style={{ position: 'absolute', top: 0, right: 0, width: 130, height: 75 }}>
              <Svg width="130" height="75" style={{ position: 'absolute', top: 0, right: 0 }}>
                <Defs>
                  <LinearGradient id="greenBadge" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor="#34d399" stopOpacity="1" />
                    <Stop offset="1" stopColor="#059669" stopOpacity="1" />
                  </LinearGradient>
                </Defs>
                <Path d="M 0 0 C 25 0, 20 45, 45 45 L 110 45 C 125 45, 130 60, 130 75 L 130 0 Z" fill="url(#greenBadge)" />
              </Svg>
              <View style={{ height: 45, justifyContent: 'center', alignItems: 'flex-end', paddingRight: 16 }}>
                <Text style={{ color: '#171e2e', fontWeight: '800', fontSize: 13 }}>Active Plan</Text>
              </View>
            </View>
            
            <Text style={{ color: '#f8fafc', fontSize: 20, fontWeight: '600', marginBottom: 24, marginTop: 8 }}>{activeChurch?.name || 'Church of GOD'}</Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#64748b', fontSize: 28, textDecorationLine: 'line-through', marginRight: 12 }}>₹108</Text>
              <Text style={{ color: '#10b981', fontSize: 42, fontWeight: '800', marginRight: 12 }}>₹1</Text>
              <View>
                <Text style={{ color: '#10b981', fontSize: 14, fontWeight: '500' }}>/ year (INR)</Text>
                <Text style={{ color: '#10b981', fontSize: 12, marginTop: 2 }}>₹1 billed yearly</Text>
              </View>
            </View>

            <Text style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 22, marginBottom: 24 }}>
              A comprehensive solution for spiritual growth, offering enhanced features to streamline your daily walk with God.
            </Text>

            <View style={{ height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 24, borderRadius: 1 }} />

            <View style={{ marginBottom: 32 }}>
              {['Bible', 'Sermons', 'Events', 'Songs', 'Bible plan', 'Online bible classes', 'Prayer wall', 'YouTube live'].map((feat, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#a3e635', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Check size={14} color="#171e2e" strokeWidth={3} />
                  </View>
                  <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: '500' }}>{feat}</Text>
                </View>
              ))}
            </View>

            <View style={{ backgroundColor: '#10b981', borderRadius: 12, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
              <Text style={{ color: '#171e2e', fontSize: 18, fontWeight: '700' }}>Current Plan</Text>
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
          {activeChurch?.subscription?.status === 'active' && (
            <TouchableOpacity style={styles.backBtn} onPress={() => setPlanSelectModalVisible(false)}>
              <ArrowLeft size={24} color={colors.ink} />
            </TouchableOpacity>
          )}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome back, {member?.firstName || user?.displayName?.split(' ')[0] || 'Member'}</Text>
            <Text style={styles.subtitle}>Your journey of faith continues.</Text>
          </View>

          <View style={[styles.circularProgressContainer, { borderWidth: 0, position: 'relative' }]}>
            <Svg width="224" height="224" style={{ position: 'absolute' }}>
              <Circle cx="112" cy="112" r="107" fill="none" stroke={colors.rule} strokeWidth="10" />
              <Circle
                cx="112"
                cy="112"
                r="107"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 107}
                strokeDashoffset={(2 * Math.PI * 107) - ((2 * Math.PI * 107) * Math.max(0, Math.min(1, daysRemaining / Math.max(60, daysRemaining))))}
                transform="rotate(-90 112 112)"
              />
            </Svg>
            <View style={styles.circularProgressInner}>
              <Text style={styles.daysText}>{daysRemaining}</Text>
              <Text style={styles.daysLabel}>{activeChurch?.subscription?.status === 'active' ? "DAYS REMAINING" : (daysRemaining > 0 ? "DAYS REMAINING" : "TRIAL EXPIRED")}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardText}>
              {activeChurch?.subscription?.status === 'active' 
                ? `Your church has an active subscription. Enjoy uninterrupted premium access for all your members.`
                : daysRemaining > 0 
                  ? `Your church is currently in a 2-month trial. Add a church subscription now to ensure uninterrupted access for all your members.`
                  : `Your church's 2-month trial has concluded. Please add a subscription to restore uninterrupted access for all your members.`
              }
            </Text>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={() => nextStep(2)}>
            <Text style={styles.primaryButtonText}>View Subscription Plans</Text>
            <ArrowRight size={18} color={colors.paper} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      ) : currentStep === 2 ? (
        <View style={[styles.stepContainer, { flex: 1, paddingHorizontal: 28 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, marginBottom: 8, position: 'relative' }}>
            <TouchableOpacity style={{ position: 'absolute', left: -8, padding: 8 }} onPress={() => nextStep(1)}>
              <ArrowLeft size={24} color={'#1F3B3D'} />
            </TouchableOpacity>
            <Text style={{ color: '#1F3B3D', fontSize: 22, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Pricing
            </Text>
          </View>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <View style={{ backgroundColor: '#171e2e', borderRadius: 24, borderWidth: 1.5, borderColor: '#f59e0b', padding: 16, paddingBottom: 20, overflow: 'hidden' }}>
            <View style={{ position: 'absolute', top: 0, right: 0, width: 130, height: 75 }}>
              <Svg width="130" height="75" style={{ position: 'absolute', top: 0, right: 0 }}>
                <Defs>
                  <LinearGradient id="goldBadge" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor="#f59e0b" stopOpacity="1" />
                    <Stop offset="1" stopColor="#d97706" stopOpacity="1" />
                  </LinearGradient>
                </Defs>
                <Path d="M 0 0 C 25 0, 20 45, 45 45 L 110 45 C 125 45, 130 60, 130 75 L 130 0 Z" fill="url(#goldBadge)" />
              </Svg>
              <View style={{ height: 45, justifyContent: 'center', alignItems: 'flex-end', paddingRight: 16 }}>
                <Text style={{ color: '#171e2e', fontWeight: '800', fontSize: 13 }}>Save 89% •</Text>
              </View>
            </View>
            
            <Text style={{ color: '#f8fafc', fontSize: 20, fontWeight: '600', marginBottom: 16, marginTop: 4 }}>{activeChurch?.name || 'Church of GOD'}</Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: '#64748b', fontSize: 28, textDecorationLine: 'line-through', marginRight: 12 }}>₹108</Text>
              <Text style={{ color: '#eab308', fontSize: 42, fontWeight: '800', marginRight: 12 }}>₹1</Text>
              <View>
                <Text style={{ color: '#eab308', fontSize: 14, fontWeight: '500' }}>/ year (INR)</Text>
                <Text style={{ color: '#eab308', fontSize: 12, marginTop: 2 }}>₹1 billed yearly</Text>
              </View>
            </View>

            <Text style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 20, marginBottom: 16 }}>
              A comprehensive solution for spiritual growth, offering enhanced features to streamline your daily walk with God.
            </Text>

            <View style={{ height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 16, borderRadius: 1 }} />

            <View style={{ marginBottom: 20 }}>
              {['Bible', 'Sermons', 'Events', 'Songs', 'Bible plan', 'Online bible classes', 'Prayer wall', 'YouTube live'].map((feat, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#a3e635', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Check size={14} color="#171e2e" strokeWidth={3} />
                  </View>
                  <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: '500' }}>{feat}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={{ backgroundColor: '#f59e0b', borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
              onPress={() => handleRazorpayPayment()}
            >
              <Crown size={20} color="#171e2e" style={{ marginRight: 8 }} />
              <Text style={{ color: '#171e2e', fontSize: 18, fontWeight: '700' }}>Upgrade now</Text>
            </TouchableOpacity>
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
              <Text style={styles.receiptLabel}>ADMIN NAME</Text>
              <Text style={styles.receiptValueTxt}>{user?.displayName || member?.name || "Admin"}</Text>
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
            <Text style={{ fontSize: 14, color: '#64748b', fontWeight: 'bold' }}>ADMIN NAME</Text>
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0', // Cleaner border
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  trialBanner: {
    backgroundColor: '#F0FDF4', // Light green
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#DCFCE7'
  },
  trialBannerText: {
    color: '#16A34A', // Dark green text
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  reviewLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  reviewValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 20,
    marginTop: 8,
  },
  dueTodayPrice: {
    fontSize: 32,
    color: '#16A34A',
    fontWeight: '800',
  },
  billedAfter: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
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


