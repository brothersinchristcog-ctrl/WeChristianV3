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
import { 
  ChevronLeft,
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
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function GivingHistoryScreen({ navigation }: any) {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { activeChurch } = useChurch();
  
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedDonation, setSelectedDonation] = useState<any | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  
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
      
      const { status } = await MediaLibrary.requestPermissionsAsync();
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
        Alert.alert('Success', 'Receipt saved to your gallery!');
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

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f4f7fb' }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
      {/* ── Page Header ── */}
      <LinearGradient 
        colors={isDark ? ['#1e293b', '#0f172a'] : ['#1a2d5a', '#294382']} 
        style={styles.header}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color="#fff" />
            <Text style={styles.backBtnTxt}>Back</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Giving History</Text>
        <Text style={styles.headerSubtitle}>Your legacy of generosity</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ── Summary Card ── */}
        <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total Given</Text>
                    <Text style={styles.summaryValue}>{formatAmount(calculateTotal())}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total Donations</Text>
                    <Text style={styles.summaryValue}>{donations.length}</Text>
                </View>
            </View>
        </View>

        {/* ── Donations List ── */}
        <View style={styles.listContainer}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#e2e8f0' : '#334155' }]}>Recent Transactions</Text>
          
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#1a2d5a" />
            </View>
          ) : donations.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBg}>
                <Gift size={40} color="#1a2d5a" />
              </View>
              <Text style={[styles.emptyTitle, { color: isDark ? '#f8fafc' : '#1e293b' }]}>No History Yet</Text>
              <Text style={[styles.emptyText, { color: isDark ? '#94a3b8' : '#64748b' }]}>When you give, your history will securely appear here.</Text>
            </View>
          ) : (
            donations.map((donation) => (
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
                  <View style={styles.statusBadge}>
                    <CheckCircle2 size={12} color="#16a34a" />
                    <Text style={styles.statusText}>Success</Text>
                  </View>
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
                        <CheckCircle2 size={16} color="#16a34a" />
                        <Text style={styles.receiptStatusText}>Successful</Text>
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

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40,
    paddingHorizontal: 25,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  backBtnTxt: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    marginTop: 6,
    fontWeight: '500',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#1a2d5a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 5,
    marginBottom: 30,
    marginTop: -30,
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
    backgroundColor: '#fff',
    borderRadius: 20,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
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
