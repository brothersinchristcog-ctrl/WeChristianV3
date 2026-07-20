import React, { useState } from 'react';
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
  MenuSquare
} from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Buffer } from 'buffer';
import * as Crypto from 'expo-crypto';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import storage from '@react-native-firebase/storage';
import { useAuth } from '../context/AuthContext';
import { useChurch } from '../context/ChurchContext';
import firestoreService, { SubscriptionPlan, GlobalUser } from '../services/FirestoreService';
import { firestore, functions } from '../services/firebaseConfig';

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

export default function SubscriptionTab() {
  const { member, user } = useAuth();
  const { activeChurch } = useChurch();
  const [currentStep, setCurrentStep] = useState(1);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState('upi');

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [globalUser, setGlobalUser] = useState<GlobalUser | null>(null);
  const [viewReceiptModalVisible, setViewReceiptModalVisible] = useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const fetchedPlans = await firestoreService.getSubscriptionPlans();
        setPlans(fetchedPlans);
        if (user?.uid) {
          const u = await firestoreService.getGlobalUser(user.uid);
          setGlobalUser(u);
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
  const planPrice = activePlan ? activePlan.price : (billingCycle === 'annual' ? 99 : 10);
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
    if (globalUser?.createdAt) {
      const createdDate = globalUser.createdAt.toDate ? globalUser.createdAt.toDate() : new Date(globalUser.createdAt);
      const trialEnd = new Date(createdDate);
      trialEnd.setDate(trialEnd.getDate() + 60);
      const diffTime = Math.max(0, trialEnd.getTime() - new Date().getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Default to 60 for brand new users if no data is found yet
    return 60;
  };

  const daysRemaining = calculateDaysRemaining();

  const nextStep = (step: number) => {
    setCurrentStep(step);
  };

  const cycleText = billingCycle === 'annual' ? '/ year' : '/ month';

  const handlePhonePePayment = async () => {
    try {
      // Bypassing Firebase function to avoid GCP lock issues and use test keys directly
      const amount = planPrice * 100;
      const transactionId = `T${Date.now()}`;
      
      const payload = {
        merchantId: 'PGTESTPAYUAT86',
        merchantTransactionId: transactionId,
        merchantUserId: user?.uid || member?.phone || 'U123456',
        amount: amount,
        redirectUrl: 'exp://localhost:8081/--/subscription-success', 
        redirectMode: 'REDIRECT',
        callbackUrl: 'https://us-central1-wechristian-67f07.cloudfunctions.net/phonePeCallback', 
        mobileNumber: user?.phoneNumber || member?.phone || "9999999999",
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

      if (response.data.success) {
        const redirectUrl = response.data.data.instrumentResponse.redirectInfo.url;
        
        // --- ADDED FIRESTORE WRITE FOR MEMBERS ---
        const nextDate = new Date();
        if (billingCycle === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        else nextDate.setFullYear(nextDate.getFullYear() + 1);

        if (user && activeChurch) {
          // 1. Create permanent record in 'subscriptions' subcollection under this member
          await firestore()
            .collection('churches')
            .doc(activeChurch.id)
            .collection('members')
            .doc(user.uid)
            .collection('subscriptions')
            .doc(transactionId)
            .set({
              status: 'active',
              plan: activePlan?.name || billingCycle,
              amount: planPrice,
              validUntil: nextDate.toISOString(),
              paymentId: transactionId,
              paidAt: new Date().toISOString()
            });

          // 2. Update the member's root document
          await firestore()
            .collection('churches')
            .doc(activeChurch.id)
            .collection('members')
            .doc(user.uid)
            .update({
              'subscription.status': 'active',
              'subscription.plan': activePlan?.name || billingCycle,
              'subscription.validUntil': nextDate.toISOString(),
              'subscription.lastPaymentId': transactionId
            });
        }
        // -----------------------------------------

        await Linking.openURL(redirectUrl);
        nextStep(5);
      } else {
        Alert.alert('Payment Error', 'Failed to generate PhonePe payment link.');
      }
    } catch (e: any) {
      console.error(e.response?.data || e.message);
      Alert.alert('Initialization Error', e.response?.data?.message || e.message || 'Could not initialize payment.');
    }
  };

  const downloadReceipt = async () => {
    try {
      const transactionId = `WC-${Math.floor(1000 + Math.random() * 9000)}-X91`;
      const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
      const name = user?.displayName || member?.name || "Member";
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
              .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
              .logo { width: 80px; height: 80px; margin-bottom: 10px; object-fit: contain; }
              .church-name { font-size: 28px; font-weight: bold; color: #1e293b; margin: 0; }
              .church-details { font-size: 14px; color: #64748b; margin-top: 5px; }
              .title { font-size: 24px; font-weight: bold; color: #1e293b; margin-bottom: 30px; text-align: center; }
              .info-row { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; }
              .label { font-size: 14px; color: #64748b; font-weight: bold; text-transform: uppercase; }
              .value { font-size: 16px; color: #1e293b; font-weight: 500; }
              .total-row { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 20px; border-top: 2px solid #1e293b; }
              .total-label { font-size: 20px; font-weight: bold; color: #1e293b; }
              .total-value { font-size: 24px; font-weight: bold; color: #d97706; }
              .footer { margin-top: 60px; text-align: center; font-size: 14px; color: #94a3b8; }
            </style>
          </head>
          <body>
            <div class="header">
              <img src="${activeChurch?.theme?.logoUrl || 'https://cdn-icons-png.flaticon.com/512/8662/8662584.png'}" class="logo" />
              <h1 class="church-name">${activeChurch?.name || 'Bethesda Pentecostal Church'}</h1>
              <p class="church-details">${activeChurch?.address || '123 Faith Avenue, Blessing City'} • ${activeChurch?.contactEmail || 'contact@church.org'}</p>
            </div>
            
            <div class="title">DONATION RECEIPT</div>
            
            <div class="info-row">
              <div class="label">Member Name</div>
              <div class="value">${name}</div>
            </div>
            <div class="info-row">
              <div class="label">Transaction ID</div>
              <div class="value">${transactionId}</div>
            </div>
            <div class="info-row">
              <div class="label">Date</div>
              <div class="value">${date}</div>
            </div>
            <div class="info-row">
              <div class="label">Subscription Plan</div>
              <div class="value">${activePlan?.name || billingCycle.toUpperCase()}</div>
            </div>
            
            <div class="total-row">
              <div class="total-label">Amount Paid</div>
              <div class="total-value">₹${planPrice.toFixed(2)}</div>
            </div>
            
            <div class="footer">
              Thank you for your generous contribution.<br>
              May God bless you abundantly!
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      // Upload to Firebase and open URL to bypass the Share Sheet
      const reference = storage().ref(`receipts/Donation_Receipt_${transactionId}.pdf`);
      await reference.putFile(uri, { 
        contentType: 'application/pdf',
        contentDisposition: `attachment; filename="Donation_Receipt_${transactionId}.pdf"`
      });
      const downloadUrl = await reference.getDownloadURL();

      Alert.alert(
        'Receipt Ready', 
        'Your receipt is ready to download. It will now open in your browser where you can save it directly.',
        [
          { text: 'OK', onPress: () => Linking.openURL(downloadUrl) }
        ]
      );
    } catch (e: any) {
      console.error('Receipt Error:', e);
      Alert.alert("Error", `Could not generate receipt: ${e.message}`);
    }
  };

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {!loading && globalUser?.subscription?.status !== 'active' && renderProgressBar()}

      {loading ? (
        <View style={[styles.stepContainer, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.title}>Loading...</Text>
        </View>
      ) : globalUser?.subscription?.status === 'active' ? (
        <View style={[styles.stepContainer, { paddingHorizontal: 20 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome back, {member?.firstName || 'David'}</Text>
            <Text style={styles.subtitle}>Your journey of faith continues.</Text>
          </View>
          
          <View style={[styles.card, { backgroundColor: '#ecfdf5', borderColor: '#34d399', borderWidth: 1, padding: 30, alignItems: 'center', marginTop: 40 }]}>
            <CheckCircle size={60} color="#10b981" style={{ marginBottom: 20 }} />
            <Text style={[styles.title, { color: '#047857', textAlign: 'center', fontSize: 24, marginBottom: 10 }]}>Active Subscription</Text>
            <Text style={[styles.subtitle, { color: '#065f46', textAlign: 'center', fontSize: 16 }]}>
              Thank you for subscribing to the {globalUser.subscription.plan} plan!
            </Text>
            {globalUser.subscription.validUntil && (
              <Text style={{ marginTop: 20, color: '#059669', fontSize: 14, fontWeight: 'bold' }}>
                Valid until: {new Date(globalUser.subscription.validUntil).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
      ) : currentStep === 1 ? (
        <View style={styles.stepContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome back, {member?.firstName || 'David'}</Text>
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
                <Text style={styles.reviewValue}>{member?.firstName ? `${member.firstName} ${member.lastName || ''}` : 'David Paul'}</Text>
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

          <TouchableOpacity style={styles.primaryButton} onPress={handlePhonePePayment}>
            <Text style={styles.primaryButtonText}>Pay ₹{planPrice} via PhonePe</Text>
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
                <Text style={styles.receiptValue}>WC-8923-X91</Text>
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
                <Text style={styles.secondaryActionBtnText}>Download PDF</Text>
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

            <Text style={styles.receiptTitle}>DONATION RECEIPT</Text>

            <View style={styles.receiptInfoRow}>
              <Text style={styles.receiptLabel}>MEMBER NAME</Text>
              <Text style={styles.receiptValueTxt}>{user?.displayName || member?.name || "Member"}</Text>
            </View>
            <View style={styles.receiptInfoRow}>
              <Text style={styles.receiptLabel}>TRANSACTION ID</Text>
              <Text style={styles.receiptValueTxt}>WC-8923-X91</Text>
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
