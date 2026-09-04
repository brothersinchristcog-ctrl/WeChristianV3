import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Platform,
  Alert,
  StatusBar,
  Dimensions,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ChevronLeft,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  X,
  Download,
  CreditCard,
  Gift,
  Clock
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useChurch } from '../context/ChurchContext';
import FirestoreService from '../services/FirestoreService';
import { formatDateDisplay } from '../utils/DateUtils';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';

const { width } = Dimensions.get('window');

export default function GivingHistoryScreen({ navigation }: any) {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { activeChurch } = useChurch();
  
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  
  const [selectedDonation, setSelectedDonation] = useState<any | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  
  // Custom Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const receiptRef = useRef<any>(null);

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    if (!user?.phoneNumber) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const history = await FirestoreService.getMemberDonations(user.phoneNumber);
      // Filter for successful or approved donations if necessary. 
      // For now, assuming successful donations have a status, or we show all and badge them.
      // Let's filter to only show 'success' or 'approved' or if status is not explicitly 'failed'
      const successful = history.filter(d => {
         const st = (d.status || '').toLowerCase();
         // If a donation lacks a status, we assume it's legacy and successful. 
         // But based on the prompt: "Only successful/confirmed donations should be included"
         return st === 'success' || st === 'approved' || st === 'paid' || st === 'confirmed' || !d.status;
      });
      setDonations(successful);
    } catch (error) {
      console.error('Error fetching giving history:', error);
      Alert.alert('Error', 'Could not load your giving history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  };

  const handleDownloadReceipt = async (donation: any) => {
    try {
      setDownloading(true);
      
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need permission to save the receipt to your gallery.');
        setDownloading(false);
        return;
      }

      // Briefly select the donation to render the receipt view if it's not already selected
      // But since they can only download from the modal where it IS selected, we just use the ref.
      
      // Wait a tick for rendering just in case
      await new Promise(resolve => setTimeout(resolve, 100));

      if (receiptRef.current) {
        const uri = await receiptRef.current.capture();
        await MediaLibrary.saveToLibraryAsync(uri);
        setSuccessMessage('Receipt saved to your gallery!');
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to save receipt.');
    } finally {
      setDownloading(false);
    }
  };

  const openDonationDetails = (donation: any) => {
    setSelectedDonation(donation);
    setShowDetailsModal(true);
  };

  const formatAmount = (amt: number) => {
    return '₹' + Number(amt).toLocaleString('en-IN');
  };

  const getDonationDate = (d: any) => {
    if (d.createdAt && d.createdAt.toDate) {
      return formatDateDisplay(d.createdAt.toDate().toISOString().split('T')[0]);
    }
    if (d.date) {
        return formatDateDisplay(d.date);
    }
    return 'Unknown Date';
  };

  const filteredDonations = donations.filter(d => {
    if (activeFilter === 'All') return true;
    const cat = (d.donationType || d.category || '').toLowerCase();
    return cat.includes(activeFilter.toLowerCase());
  });

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <StatusBar barStyle="light-content" />
      
      {/* ── Page Header ── */}
      <LinearGradient 
        colors={['#2b52a1', '#1a3673']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{top:10, bottom:10, left:10, right:10}}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Giving History</Text>
            <Text style={styles.headerSub}>View and download your past donations</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ── Summary Card ── */}
        <View style={{
            backgroundColor: isDark ? '#1e293b' : '#fff', 
            borderColor: isDark ? '#334155' : '#e2e8f0', 
            borderWidth: 1, 
            elevation: 4, 
            shadowColor: '#000', 
            shadowOffset: { width: 0, height: 4 }, 
            shadowOpacity: 0.05, 
            shadowRadius: 15, 
            borderRadius: 16, 
            padding: 20, 
            marginBottom: 20,
            marginTop: 10
        }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Total Given</Text>
                    <Text style={{ fontSize: 28, fontWeight: '800', color: isDark ? '#fff' : '#0f172a' }}>{formatAmount(calculateTotal())}</Text>
                </View>
                <View style={{ width: 1, height: '80%', backgroundColor: isDark ? '#334155' : '#e2e8f0' }} />
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Total Donations</Text>
                    <Text style={{ fontSize: 24, fontWeight: '800', color: isDark ? '#fff' : '#0f172a' }}>{donations.length}</Text>
                </View>
            </View>
        </View>

        {/* ── Categories Filter ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20, paddingBottom: 5 }} contentContainerStyle={{ gap: 10 }}>
          {['All', 'Tithe', 'Offering', 'Special', 'Building', 'Other'].map(cat => (
            <TouchableOpacity 
              key={cat}
              onPress={() => setActiveFilter(cat)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: activeFilter === cat ? '#1a2d5a' : (isDark ? '#1e293b' : '#fff'),
                borderWidth: 1,
                borderColor: activeFilter === cat ? '#1a2d5a' : (isDark ? '#334155' : '#e2e8f0')
              }}
            >
              <Text style={{ 
                color: activeFilter === cat ? '#fff' : (isDark ? '#94a3b8' : '#64748b'),
                fontWeight: activeFilter === cat ? '700' : '500',
                fontSize: 13
              }}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Donations List ── */}
        <View style={styles.listContainer}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#e2e8f0' : '#334155' }]}>Recent Transactions</Text>
          
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#1a2d5a" />
            </View>
          ) : filteredDonations.length === 0 ? (
            <View style={styles.emptyState}>
              <Gift size={48} color={isDark ? '#475569' : '#cbd5e1'} />
              <Text style={[styles.emptyText, { color: isDark ? '#94a3b8' : '#64748b' }]}>No giving history found.</Text>
            </View>
          ) : (
            filteredDonations.map((donation) => (
              <TouchableOpacity 
                key={donation.id} 
                style={[styles.donationCard, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}
                onPress={() => openDonationDetails(donation)}
              >
                <View style={styles.donationIconBox}>
                  <CreditCard size={20} color="#1a2d5a" />
                </View>
                <View style={styles.donationInfo}>
                  <Text style={[styles.donationType, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{donation.donationType || donation.category || 'Donation'}</Text>
                  <Text style={[styles.donationDate, { color: isDark ? '#94a3b8' : '#64748b' }]}>{getDonationDate(donation)}</Text>
                </View>
                <View style={styles.donationAmountBox}>
                  <Text style={[styles.donationAmount, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{formatAmount(donation.amount)}</Text>
                  
                  {(() => {
                    const status = (donation.status || 'success').toLowerCase();
                    if (status.includes('pending')) {
                      return (
                        <View style={[styles.statusBadge, { backgroundColor: '#fef3c7' }]}>
                          <Clock size={12} color="#d97706" />
                          <Text style={[styles.statusText, { color: '#d97706' }]}>Pending</Text>
                        </View>
                      );
                    } else if (status === 'failed' || status === 'rejected') {
                      return (
                        <View style={[styles.statusBadge, { backgroundColor: '#fee2e2' }]}>
                          <X size={12} color="#dc2626" />
                          <Text style={[styles.statusText, { color: '#dc2626' }]}>Failed</Text>
                        </View>
                      );
                    }
                    return (
                      <View style={styles.statusBadge}>
                        <CheckCircle2 size={12} color="#16a34a" />
                        <Text style={styles.statusText}>Success</Text>
                      </View>
                    );
                  })()}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* ── Donation Details Modal ── */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Transaction Details</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)} style={styles.closeBtn}>
                <X size={24} color={isDark ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            </View>

            {selectedDonation && (
              <ScrollView style={styles.modalBody}>
                {/* ── Receipt View for Downloading ── */}
                <ViewShot ref={receiptRef} options={{ format: 'png', quality: 1 }}>
                  <View style={styles.receiptContainer}>
                    <View style={styles.receiptHeader}>
                      {activeChurch?.theme?.logoUrl || (activeChurch as any)?.logoUrl || (activeChurch as any)?.profilePhoto ? (
                        <Image source={{ uri: activeChurch?.theme?.logoUrl || (activeChurch as any)?.logoUrl || (activeChurch as any)?.profilePhoto }} style={styles.receiptLogo} />
                      ) : (
                        <View style={styles.receiptLogoPlaceholder}>
                          <Text style={styles.receiptLogoText}>{(activeChurch?.name || 'W').charAt(0).toUpperCase()}</Text>
                        </View>
                      )}
                      <Text style={styles.receiptChurchName}>{activeChurch?.name || 'Church'}</Text>
                      <Text style={styles.receiptTitle}>Donation Receipt</Text>
                    </View>
                    
                    <View style={styles.receiptDivider} />
                    
                    <View style={styles.receiptDetailRow}>
                      <Text style={styles.receiptLabel}>Amount</Text>
                      <Text style={styles.receiptValueLarge}>{formatAmount(selectedDonation.amount)}</Text>
                    </View>
                    
                    <View style={styles.receiptDetailRow}>
                      <Text style={styles.receiptLabel}>Date</Text>
                      <Text style={styles.receiptValue}>{getDonationDate(selectedDonation)}</Text>
                    </View>
                    
                    <View style={styles.receiptDetailRow}>
                      <Text style={styles.receiptLabel}>Type</Text>
                      <Text style={styles.receiptValue}>{selectedDonation.donationType || selectedDonation.category || 'Donation'}</Text>
                    </View>

                    <View style={styles.receiptDetailRow}>
                      <Text style={styles.receiptLabel}>Reference ID</Text>
                      <Text style={styles.receiptValue}>{selectedDonation.id}</Text>
                    </View>
                    
                    <View style={styles.receiptDetailRow}>
                      <Text style={styles.receiptLabel}>Payment Status</Text>
                      <View style={styles.receiptStatusRow}>
                        {(() => {
                          const status = (selectedDonation.status || 'success').toLowerCase();
                          if (status.includes('pending')) {
                            return (
                              <>
                                <Clock size={16} color="#d97706" />
                                <Text style={[styles.receiptStatusText, { color: '#d97706' }]}>Pending Verification</Text>
                              </>
                            );
                          } else if (status === 'failed' || status === 'rejected') {
                            return (
                              <>
                                <X size={16} color="#dc2626" />
                                <Text style={[styles.receiptStatusText, { color: '#dc2626' }]}>Failed</Text>
                              </>
                            );
                          }
                          return (
                            <>
                              <CheckCircle2 size={16} color="#16a34a" />
                              <Text style={styles.receiptStatusText}>Successful</Text>
                            </>
                          );
                        })()}
                      </View>
                    </View>

                    <View style={styles.receiptDivider} />
                    
                    <View style={styles.receiptFooter}>
                      <Text style={styles.receiptFooterText}>Thank you for your generous giving!</Text>
                      <Text style={styles.receiptFooterText}>"God loves a cheerful giver." - 2 Cor 9:7</Text>
                    </View>
                  </View>
                </ViewShot>

                <TouchableOpacity 
                  style={[styles.downloadBtn, downloading && { opacity: 0.7 }]} 
                  onPress={() => handleDownloadReceipt(selectedDonation)}
                  disabled={downloading}
                >
                  {downloading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Download size={20} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.downloadBtnText}>Download Receipt</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Beautiful Success Modal */}
      <Modal visible={showSuccessModal} animationType="fade" transparent={true}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20, zIndex: 1000 }}>
          <View style={{ width: '100%', borderRadius: 20, padding: 24, paddingVertical: 40, alignItems: 'center', elevation: 10, backgroundColor: isDark ? '#1e293b' : '#fff' }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
              <CheckCircle2 size={36} color="#16a34a" />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '800', marginBottom: 8, color: isDark ? '#fff' : '#1e293b' }}>Success</Text>
            <Text style={{ fontSize: 15, textAlign: 'center', marginBottom: 20, lineHeight: 20, color: isDark ? '#94a3b8' : '#64748b' }}>
              {successMessage}
            </Text>
            
            <TouchableOpacity 
              style={{ paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#16a34a', width: '100%', marginTop: 10 }}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight ?? 24) + 12,
    paddingHorizontal: 20,
    paddingBottom: 30,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    minHeight: Platform.OS === 'ios' ? 140 : 120,
  },
  headerCenter: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 24 },
  backBtn: { zIndex: 10, padding: 5, marginLeft: -8, marginBottom: 8 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 2 },
  headerSub: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '500' },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 25,
    marginTop: -10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e2e8f0',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  listContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
  },
  donationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  donationIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  donationInfo: {
    flex: 1,
  },
  donationType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  donationDate: {
    fontSize: 13,
  },
  donationAmountBox: {
    alignItems: 'flex-end',
  },
  donationAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#16a34a',
    fontWeight: '600',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '70%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 5,
  },
  modalBody: {
    flex: 1,
  },
  receiptContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 25,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  receiptLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 10,
  },
  receiptLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1a2d5a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  receiptLogoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  receiptChurchName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
  },
  receiptTitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    borderStyle: 'dashed',
    marginVertical: 15,
  },
  receiptDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  receiptLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  receiptValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    maxWidth: '60%',
    textAlign: 'right',
  },
  receiptValueLarge: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a2d5a',
  },
  receiptStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiptStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
    marginLeft: 4,
  },
  receiptFooter: {
    alignItems: 'center',
    marginTop: 10,
  },
  receiptFooterText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  downloadBtn: {
    backgroundColor: '#1a2d5a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
  },
  downloadBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
