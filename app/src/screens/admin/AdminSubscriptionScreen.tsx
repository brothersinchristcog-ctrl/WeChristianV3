import React, { useState, useContext, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, Calendar, ChevronLeft, CheckCircle, Search, DollarSign, Receipt, LifeBuoy } from 'lucide-react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import { functions } from '../../services/firebaseConfig';
import { AdminTabContext } from '../../context/AdminTabContext';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import firestoreService from '../../services/FirestoreService';

export default function AdminSubscriptionScreen({ navigation }: any) {
  const { user } = useAuth();
  const { activeChurch } = useChurch();
  const { goBack } = useContext(AdminTabContext);
  const [loading, setLoading] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [downloadSuccessModalVisible, setDownloadSuccessModalVisible] = useState(false);
  const [receiptTxnId, setReceiptTxnId] = useState('');
  
  // Members List State
  const [subscribedMembers, setSubscribedMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  const receiptRef = useRef<View>(null);

  useEffect(() => {
    if (activeChurch?.id) {
      loadMembers(true);
    }
  }, [activeChurch?.id, searchQuery, statusFilter]);

  const loadMembers = async (isRefresh = false) => {
    if (!activeChurch?.id) return;
    if (loadingMembers) return;
    if (!isRefresh && !hasMore) return;

    setLoadingMembers(true);
    try {
      const result = await firestoreService.getSubscribedMembers(
        activeChurch.id, 
        5, 
        isRefresh ? null : lastDoc, 
        searchQuery,
        statusFilter
      );
      
      if (isRefresh) {
        setSubscribedMembers(result.members);
      } else {
        setSubscribedMembers(prev => [...prev, ...result.members]);
      }
      
      setLastDoc(result.lastDoc);
      if (!result.lastDoc) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMembers(false);
    }
  };

  const SUBSCRIPTION_AMOUNT = 99; // ₹99/year from screenshot

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

  const handleSubscriptionPayment = async (isAdvance = false) => {
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
        theme: { color: '#059669' }
      };

      RazorpayCheckout.open(options).then(async (data: any) => {
        const transactionId = data.razorpay_payment_id;
        
        try {
          const verifyPayment = functions().httpsCallable('verifyRazorpaySubscription');
          await verifyPayment({
            razorpay_payment_id: transactionId,
            razorpay_order_id: data.razorpay_order_id,
            razorpay_signature: data.razorpay_signature,
            type: 'admin',
            userId: user?.uid,
            churchId: activeChurch?.id,
            amount: SUBSCRIPTION_AMOUNT,
            plan: 'annual'
          });

          setReceiptTxnId(transactionId);
          setSuccessModalVisible(true);
        } catch (verificationError: any) {
          console.error('Subscription Verification Error:', verificationError);
          Alert.alert('Payment Successful, but Verification Failed', 'We could not securely verify your payment with our servers. Please contact support.');
        }
      }).catch((error: any) => {
        if (error.code === 0) {
          console.log('Payment was cancelled by the user.');
          setCancelModalVisible(true);
          return;
        }

        console.error('Payment Error:', error);

        let errorMsg = 'An unexpected error occurred during payment.';
        try {
          if (typeof error.description === 'string' && error.description.includes('{')) {
            const parsed = JSON.parse(error.description);
            errorMsg = parsed.error?.description || parsed.error?.reason || 'Payment failed.';
          } else if (error.description) {
            errorMsg = error.description;
          }
        } catch(e) {
          errorMsg = error.description || error.message || 'Payment failed.';
        }
        
        if (errorMsg === 'undefined') {
          errorMsg = 'Payment was interrupted or failed.';
        }

        Alert.alert('Payment Error', errorMsg);
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
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
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
          
          {/* Trial / Platform info */}
          {activeChurch?.subscription?.status !== 'active' && (
            <View style={styles.card}>
              <Text style={styles.infoTitle}>We Christian Platform</Text>
              <Text style={styles.infoDesc}>
                When a church registers, the administrator receives a <Text style={{fontWeight: 'bold', color: '#0f172a'}}>2-month free trial</Text> with full access to every feature.
              </Text>
              <Text style={[styles.infoDesc, { marginBottom: 0 }]}>
                Before it ends, the admin is notified that continuing requires the <Text style={{fontWeight: 'bold', color: '#0f172a'}}>Church Plan</Text> at <Text style={styles.feeChipText}> ₹{SUBSCRIPTION_AMOUNT} / year </Text>. Once active, the subscription is required, and payments are credited to the We Christian company account.
              </Text>
            </View>
          )}
          
          {/* Active subscription status OR Payment */}
          {(() => {
            const getValidUntilDate = () => {
              const val = activeChurch?.subscription?.validUntil;
              if (!val) return new Date(0);
              if (typeof val === 'string' || typeof val === 'number') return new Date(val);
              if ((val as any).toDate) return (val as any).toDate();
              if ((val as any)._seconds) return new Date((val as any)._seconds * 1000);
              if ((val as any).seconds) return new Date((val as any).seconds * 1000);
              return new Date(0);
            };
            const validUntilDate = getValidUntilDate();
            const isActive = activeChurch?.subscription?.status === 'active' && validUntilDate > new Date();
            
            if (isActive) {
              return (
            <View style={styles.statusCard}>
              <View style={styles.statusBanner}>
                <View style={styles.statusEyebrow}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusEyebrowText}>SUBSCRIPTION STATUS</Text>
                </View>
                <View style={styles.statusMain}>
                  <View style={styles.statusLeft}>
                    <View style={styles.statusIcon}>
                      <ShieldCheck size={28} color="#059669" />
                    </View>
                    <View style={styles.statusTextWrapper}>
                      <Text style={styles.statusLabel}>Active</Text>
                      <Text style={styles.statusDue}>
                        Valid until <Text style={{fontWeight: 'bold', color: '#059669'}}>
                          {validUntilDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Text>
                      </Text>
                      <Text style={[styles.statusDue, { fontSize: 13, marginTop: 4, fontStyle: 'italic' }]}>
                        Annual Church Subscription
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.statusActions}>
                <TouchableOpacity style={styles.btnPrimary} onPress={() => handleSubscriptionPayment(true)} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                    <>
                      <DollarSign size={18} color="#fff" />
                      <Text style={styles.btnPrimaryText}>Pay in Advance</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnOutline} onPress={() => downloadReceipt((activeChurch?.subscription as any)?.lastPaymentId || '')}>
                  <Receipt size={18} color="#059669" />
                  <Text style={styles.btnOutlineText}>Receipt</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
            } else {
              return (
                <View style={styles.statusCard}>
              <View style={[styles.statusBanner, { backgroundColor: '#fff', borderBottomWidth: 0, paddingBottom: 10 }]}>
                <View style={styles.planBox}>
                  <View style={styles.planRow}>
                    <Calendar size={20} color="#64748B" />
                    <Text style={styles.planText}>Annual Church Subscription</Text>
                  </View>
                  <Text style={styles.priceText}>₹{SUBSCRIPTION_AMOUNT} <Text style={styles.perYear}>/ year</Text></Text>
                </View>
              </View>
              <View style={styles.statusActions}>
                <TouchableOpacity 
                  style={[styles.btnPrimary, { width: '100%', paddingVertical: 16 }]} 
                  onPress={() => handleSubscriptionPayment(false)}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <DollarSign size={20} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.btnPrimaryText}>Pay ₹{SUBSCRIPTION_AMOUNT} Now</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
              );
            }
          })()}

          {/* Subscribed Members List */}
          <View style={styles.card}>
            <View style={styles.membersHead}>
              <Text style={styles.membersTitle}>Subscribed Members</Text>
            </View>
            
            <View style={styles.filterPillsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 20 }}>
                {['all', 'active', 'trial', 'inactive'].map(f => (
                  <TouchableOpacity 
                    key={f} 
                    style={[styles.filterPill, statusFilter === f && styles.filterPillActive]}
                    onPress={() => setStatusFilter(f)}
                  >
                    <Text style={[styles.filterPillText, statusFilter === f && styles.filterPillTextActive]}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.searchBox}>
              <Search size={20} color="#94a3b8" />
              <TextInput 
                style={styles.searchInput}
                placeholder="Search subscribed members..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            
            {loadingMembers && subscribedMembers.length === 0 ? (
              <ActivityIndicator color="#0ea5e9" style={{ marginTop: 20 }} />
            ) : subscribedMembers.length === 0 ? (
              <Text style={styles.emptyState}>No subscribed members found.</Text>
            ) : (
              subscribedMembers.map((member, index) => {
                const avatarColors = ["#ca8a04", "#059669", "#1e3a8a", "#d97706"];
                const color = avatarColors[index % avatarColors.length];
                const initials = (member.name || member.firstName || 'U').split(' ').map((w: string) => w[0]).slice(0,2).join('');
                
                const role = member.role || '';
                const status = member.subscription?.status || 'trial';
                
                return (
                  <View key={member.id || index} style={styles.memberRow}>
                    {member.photoUrl || member.photoURL || member.photo || member.profilePhoto || member.ProfilePhoto || member.profileImageUrl || member.image ? (
                      <Image 
                        source={{ uri: member.photoUrl || member.photoURL || member.photo || member.profilePhoto || member.ProfilePhoto || member.profileImageUrl || member.image }} 
                        style={styles.avatar} 
                      />
                    ) : (
                      <View style={[styles.avatar, { backgroundColor: color }]}>
                        <Text style={styles.avatarText}>{initials}</Text>
                      </View>
                    )}
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{member.name || member.firstName || 'Unknown'}</Text>
                      {!!role && <Text style={styles.memberRole}>{role}</Text>}
                    </View>
                    {status === 'trial' ? (
                      <View style={styles.badgeTrial}>
                        <Text style={styles.badgeTrialText}>Trial</Text>
                      </View>
                    ) : status === 'active' ? (
                      <View style={styles.badgeActive}>
                        <Text style={styles.badgeActiveText}>Active</Text>
                      </View>
                    ) : (
                      <View style={[styles.badgeActive, { backgroundColor: '#f1f5f9' }]}>
                        <Text style={[styles.badgeActiveText, { color: '#64748b' }]}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
            
            {hasMore && !loadingMembers && subscribedMembers.length > 0 && (
              <TouchableOpacity style={styles.btnGhost} onPress={() => loadMembers()}>
                <Text style={styles.btnGhostText}>Load More</Text>
              </TouchableOpacity>
            )}
            {loadingMembers && subscribedMembers.length > 0 && (
              <ActivityIndicator color="#059669" style={{ marginTop: 10 }} />
            )}
          </View>
        </ScrollView>

        {cancelModalVisible && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 100 }]}>
            <View style={{ backgroundColor: '#fff', width: '85%', borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <LifeBuoy size={40} color="#ca8a04" />
              </View>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 10, textAlign: 'center' }}>Payment Cancelled</Text>
              <Text style={{ fontSize: 15, color: '#475569', textAlign: 'center', marginBottom: 30, lineHeight: 22 }}>
                You have securely cancelled the payment process. No charges were made.
              </Text>
              
              <TouchableOpacity 
                style={[styles.btnPrimary, { width: '100%', backgroundColor: '#0f172a' }]}
                onPress={() => setCancelModalVisible(false)}
              >
                <Text style={styles.btnPrimaryText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {successModalVisible && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 100 }]}>
            <View style={{ backgroundColor: '#fff', width: '85%', borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <CheckCircle size={40} color="#059669" />
              </View>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 10, textAlign: 'center' }}>Subscription Active!</Text>
              <Text style={{ fontSize: 15, color: '#475569', textAlign: 'center', marginBottom: 30, lineHeight: 22 }}>
                Thank you for subscribing to the We Christian platform. Your church now has unlimited access to all features.
              </Text>
              
              <TouchableOpacity 
                style={[styles.btnPrimary, { width: '100%', marginBottom: 12 }]}
                onPress={() => downloadReceipt(receiptTxnId)}
              >
                <Text style={styles.btnPrimaryText}>Save Receipt Image</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.btnGhost}
                onPress={() => setSuccessModalVisible(false)}
              >
                <Text style={styles.btnGhostText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {downloadSuccessModalVisible && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 105 }]}>
            <View style={{ backgroundColor: '#fff', width: '85%', borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 4, borderColor: '#dcfce7' }}>
                <CheckCircle size={36} color="#16a34a" />
              </View>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 12, textAlign: 'center' }}>Success!</Text>
              <Text style={{ fontSize: 15, color: '#475569', textAlign: 'center', marginBottom: 30, lineHeight: 22 }}>
                Your receipt has been beautifully rendered and saved securely to your photo gallery.
              </Text>
              
              <TouchableOpacity style={{ width: '100%', height: 50, backgroundColor: '#16a34a', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 15 }} onPress={() => setDownloadSuccessModalVisible(false)}><Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>Done</Text></TouchableOpacity>
            </View>
          </View>
        )}

        {/* Hidden Receipt View for Snapshot */}
        <View style={{ position: 'absolute', top: -10000, left: 0, width: 600 }}>
          <View collapsable={false} ref={receiptRef} style={{ width: 600, backgroundColor: '#ffffff', padding: 40 }}>
            <View style={{ alignItems: 'center', marginBottom: 40, borderBottomWidth: 2, borderBottomColor: '#e2e8f0', paddingBottom: 20 }}>
              {activeChurch?.theme?.logoUrl ? (
                <Image source={{ uri: activeChurch!.theme!.logoUrl as string }} style={{ width: 80, height: 80, marginBottom: 10 }} resizeMode="contain" />
              ) : (
                <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/8662/8662584.png' }} style={{ width: 80, height: 80, marginBottom: 10 }} resizeMode="contain" />
              )}
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0f172a', marginBottom: 5 }}>{activeChurch?.name || 'We Christian'}</Text>
            </View>
            
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 30, textAlign: 'center' }}>CHURCH SUBSCRIPTION RECEIPT</Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10 }}>
              <Text style={{ fontSize: 14, color: '#64748b', fontWeight: 'bold' }}>ADMIN NAME</Text>
              <Text style={{ fontSize: 16, color: '#0f172a', fontWeight: '500' }}>{user?.displayName || 'Admin'}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10 }}>
              <Text style={{ fontSize: 14, color: '#64748b', fontWeight: 'bold' }}>TRANSACTION ID</Text>
              <Text style={{ fontSize: 16, color: '#0f172a', fontWeight: '500' }}>{receiptTxnId || (activeChurch?.subscription as any)?.lastPaymentId || 'N/A'}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10 }}>
              <Text style={{ fontSize: 14, color: '#64748b', fontWeight: 'bold' }}>DATE</Text>
              <Text style={{ fontSize: 16, color: '#0f172a', fontWeight: '500' }}>{receiptData.date}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10 }}>
              <Text style={{ fontSize: 14, color: '#64748b', fontWeight: 'bold' }}>SUBSCRIPTION PLAN</Text>
              <Text style={{ fontSize: 16, color: '#0f172a', fontWeight: '500' }}>ANNUAL CHURCH PLAN</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10 }}>
              <Text style={{ fontSize: 14, color: '#64748b', fontWeight: 'bold' }}>NEXT SUBSCRIPTION DATE</Text>
              <Text style={{ fontSize: 16, color: '#0f172a', fontWeight: '500' }}>{receiptData.nextDateStr}</Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, paddingTop: 20, borderTopWidth: 2, borderTopColor: '#0f172a' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a' }}>Amount Paid</Text>
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
  container: { flex: 1, backgroundColor: '#EDE8DC' },
  
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
  
  scroll: { flex: 1, marginTop: -16 },
  scrollContent: { padding: 20, paddingBottom: 60, gap: 16 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  
  /* Trial / Platform Info */
  rosetteWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#fde68a'
  },
  pentagonWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#ca8a04',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif'
  },
  infoDesc: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 16,
  },
  feeChipText: {
    backgroundColor: '#fef3c7',
    color: '#a16207',
    fontWeight: 'bold',
    fontSize: 13,
  },
  
  /* Active Status Card */
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statusBanner: {
    backgroundColor: '#ecfdf5',
    padding: 16,
  },
  statusEyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  statusEyebrowText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#059669',
  },
  statusMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  statusTextWrapper: { flex: 1 },
  statusLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif'
  },
  statusDue: {
    fontSize: 14,
    color: '#475569',
  },
  duePill: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  duePillD: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  duePillM: { fontSize: 10, fontWeight: '800', color: '#059669', marginTop: 2 },
  
  statusActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    backgroundColor: '#fff',
  },
  
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#23815c',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  btnOutline: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#73cfa8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnOutlineText: { color: '#059669', fontSize: 14, fontWeight: '700' },
  btnGhost: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  btnGhostText: { color: '#0f172a', fontSize: 15, fontWeight: '700' },
  
  /* Plans */
  planBox: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    padding: 20,
    alignItems: 'center',
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  planText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
    marginLeft: 8,
  },
  priceText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
  },
  perYear: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },

  /* Members Section */
  membersHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  membersTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif'
  },
  membersCountBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  membersCountText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#b45309',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f0e6',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 20,
  },
  filterPillsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterPillActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    color: '#0f172a',
    fontSize: 15,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  memberRole: {
    fontSize: 14,
    color: '#64748b',
  },
  badgeActive: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  badgeActiveText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  badgeTrial: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  badgeTrialText: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    textAlign: 'center',
    paddingVertical: 32,
    color: '#94a3b8',
    fontSize: 14,
  }
});

