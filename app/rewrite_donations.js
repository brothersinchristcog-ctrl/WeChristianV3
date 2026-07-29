const fs = require('fs');
const path = require('path');

const targetPath = "c:\\Users\\yraje\\WeChristian2\\app\\src\\screens\\admin\\AdminDonationDashboard.tsx";

const code = `import React, { useState, useEffect, useContext } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  StatusBar,
  Dimensions,
  TextInput,
  Modal,
  Alert
} from 'react-native';
import { 
  Plus, 
  ChevronLeft,
  Calendar,
  Search,
  ChevronRight,
  Save,
  X,
  Pencil,
  Trash2,
  Gift
} from 'lucide-react-native';
import { AdminTabContext } from '../../context/AdminTabContext';
import FirestoreService, { ChurchDonation } from '../../services/FirestoreService';
import { useAuth } from '../../context/AuthContext';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { LinearGradient } from 'expo-linear-gradient';
import firestore from '@react-native-firebase/firestore';

const { width } = Dimensions.get('window');

type FilterPeriod = 'Today' | 'Week' | 'Month' | 'Year' | 'Custom Range';
type SubTab = 'dashboard' | 'donations';

export default function AdminDonationDashboard() {
  const { setActiveTab } = useContext(AdminTabContext);
  const { member } = useAuth();
  const [donations, setDonations] = useState<ChurchDonation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Local UI State
  const [currentSubTab, setCurrentSubTab] = useState<SubTab>('dashboard');
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('Today');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryView, setSelectedCategoryView] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [churchProfile, setChurchProfile] = useState<any>(null);

  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [showCustomStartPicker, setShowCustomStartPicker] = useState(false);
  const [showCustomEndPicker, setShowCustomEndPicker] = useState(false);

  // Categories State
  const [categories, setCategories] = useState([
    'Tithes', 'Offering', 'Building Fund', 'Missionary', 'Other'
  ]);

  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Add Donation Modal State
  const [showAddDonationModal, setShowAddDonationModal] = useState(false);
  const [addDonCategory, setAddDonCategory] = useState('Tithes');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  const [donationDonorName, setDonationDonorName] = useState('');
  const [donationDonorPhone, setDonationDonorPhone] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [donationDate, setDonationDate] = useState(new Date().toISOString().split('T')[0]);
  const [donationPaymentMethod, setDonationPaymentMethod] = useState('Cash');
  const [donationNotes, setDonationNotes] = useState('');
  const [editDonationId, setEditDonationId] = useState<string | null>(null);
  
  // Success Card State
  const [showSuccessCard, setShowSuccessCard] = useState(false);

  const displayToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const fetchData = async () => {
    try {
      const churchId = member?.churchId || member?.primaryChurchId;
      if (churchId) {
        const cDoc = await firestore().collection('churches').doc(churchId).get();
        const docData: any = typeof cDoc.data === 'function' ? cDoc.data() : cDoc.data;
        if (docData) {
          setChurchProfile(docData);
          if (docData.customDonationCategories && Array.isArray(docData.customDonationCategories)) {
            setCategories(prev => Array.from(new Set([...prev, ...docData.customDonationCategories])));
          }
        }
      }

      const donData = await FirestoreService.getDonations(500);
      setDonations(donData);
      
      const usedCategories = donData.map(e => e.category).filter(Boolean);
      setCategories(prev => Array.from(new Set([...prev, ...usedCategories])));
    } catch (err) {
      console.error(err);
      displayToast("Failed to load donations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [member]);

  const openAddDonation = () => {
    setEditDonationId(null);
    setAddDonCategory(categories.length > 0 ? categories[0] : 'Tithes');
    setShowCategoryDropdown(false);
    setDonationDonorName('');
    setDonationDonorPhone('');
    setDonationAmount('');
    setDonationDate(new Date().toISOString().split('T')[0]);
    setDonationPaymentMethod('Cash');
    setDonationNotes('');
    setShowAddDonationModal(true);
  };

  const openEditDonation = (don: ChurchDonation) => {
    setEditDonationId(don.id || null);
    setAddDonCategory(don.category || 'Tithes');
    setShowCategoryDropdown(false);
    
    setDonationDonorName(don.donorName || '');
    setDonationDonorPhone(don.donorPhone || '');
    setDonationAmount(String(don.amount || ''));
    setDonationDate(don.date || new Date().toISOString().split('T')[0]);
    setDonationPaymentMethod(don.paymentMethod || 'Cash');
    setDonationNotes(don.notes || '');
    setShowAddDonationModal(true);
  };

  const handleSaveDonation = async () => {
    if (!donationAmount || isNaN(parseFloat(donationAmount))) {
      Alert.alert('Validation Error', 'Please enter a valid amount.');
      return;
    }
    if (!donationDonorName.trim()) {
      Alert.alert('Validation Error', 'Please enter a donor name.');
      return;
    }

    try {
      const data: Partial<ChurchDonation> = {
        amount: parseFloat(donationAmount),
        category: addDonCategory,
        donorName: donationDonorName,
        donorPhone: donationDonorPhone,
        date: donationDate,
        paymentMethod: donationPaymentMethod,
        notes: donationNotes,
        addedBy: member?.name || member?.id
      };
      
      if (editDonationId) {
        data.id = editDonationId;
      }
      
      await FirestoreService.saveDonation(data);
      setShowAddDonationModal(false);
      setShowSuccessCard(true);
      setTimeout(() => setShowSuccessCard(false), 2000);
      fetchData();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save donation.');
    }
  };

  const handleDeleteDonation = async (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this donation record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await FirestoreService.deleteDonation(id);
          displayToast("Donation deleted");
          fetchData();
        } catch (e) {
          Alert.alert('Error', 'Failed to delete donation');
        }
      }}
    ]);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const churchId = member?.churchId || member?.primaryChurchId;
      if (!churchId) return;
      
      const newCats = Array.from(new Set([...categories, newCategoryName.trim()]));
      setCategories(newCats);
      await firestore().collection('churches').doc(churchId).update({
        customDonationCategories: newCats
      });
      setShowCategoryModal(false);
      setNewCategoryName('');
      displayToast("Category created successfully");
    } catch (e) {
      Alert.alert("Error", "Failed to create category");
    }
  };

  // ── Calculation & Grouping Logic ──
  const getStats = () => {
    let today = 0, thisWeek = 0, thisMonth = 0, thisYear = 0;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0,0,0,0);

    donations.forEach(d => {
      if (!d.date || !d.amount) return;
      const dDate = new Date(d.date);
      if (isNaN(dDate.getTime())) return;

      if (d.date === todayStr) today += d.amount;
      if (dDate >= startOfWeek) thisWeek += d.amount;
      if (dDate.getMonth() === currentMonth && dDate.getFullYear() === currentYear) thisMonth += d.amount;
      if (dDate.getFullYear() === currentYear) thisYear += d.amount;
    });

    return { today, thisWeek, thisMonth, thisYear };
  };

  const stats = getStats();

  // Filters for sub-tab
  const filterDonations = (data: ChurchDonation[]) => {
    let filtered = data;
    const now = new Date();
    
    if (filterPeriod === 'Today') {
      const todayStr = now.toISOString().split('T')[0];
      filtered = data.filter(e => e.date === todayStr);
    } else if (filterPeriod === 'Week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0,0,0,0);
      filtered = data.filter(e => new Date(e.date) >= startOfWeek);
    } else if (filterPeriod === 'Month') {
      filtered = data.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (filterPeriod === 'Year') {
      filtered = data.filter(e => new Date(e.date).getFullYear() === now.getFullYear());
    } else if (filterPeriod === 'Custom Range' && customStartDate && customEndDate) {
      filtered = data.filter(e => {
        const d = new Date(e.date);
        return d >= customStartDate && d <= customEndDate;
      });
    }
    
    if (searchQuery.trim()) {
      filtered = filtered.filter(e => e.category?.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return filtered;
  };

  const filteredDonations = filterDonations(donations);
  
  const groupedDonations = filteredDonations.reduce((groups, donation) => {
    const categoryName = donation.category || 'Tithes';
    if (!groups[categoryName]) {
      groups[categoryName] = { title: categoryName, date: donation.date, total: 0, items: [] };
    }
    if (donation.date > groups[categoryName].date) {
      groups[categoryName].date = donation.date;
    }
    groups[categoryName].items.push(donation);
    groups[categoryName].total += donation.amount;
    return groups;
  }, {} as Record<string, { title: string, date: string, total: number, items: ChurchDonation[] }>);
  
  const groupKeys = Object.keys(groupedDonations).sort((a,b) => groupedDonations[b].total - groupedDonations[a].total);

  // Global grouping for dashboard recent list
  const globalGroupedDonations = donations.reduce((groups, donation) => {
    const categoryName = donation.category || 'Tithes';
    if (!groups[categoryName]) {
      groups[categoryName] = { title: categoryName, date: donation.date, total: 0, items: [] };
    }
    if (donation.date > groups[categoryName].date) {
      groups[categoryName].date = donation.date;
    }
    groups[categoryName].items.push(donation);
    groups[categoryName].total += donation.amount;
    return groups;
  }, {} as Record<string, { title: string, date: string, total: number, items: ChurchDonation[] }>);
  
  const globalGroupKeys = Object.keys(globalGroupedDonations).sort((a,b) => {
      return new Date(globalGroupedDonations[b].date).getTime() - new Date(globalGroupedDonations[a].date).getTime();
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a2d5a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* ── Hero Section ── */}
      <View style={styles.hero}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <TouchableOpacity 
              onPress={() => {
                if (currentSubTab === 'donations' && selectedCategoryView) {
                  setSelectedCategoryView(null);
                } else if (currentSubTab === 'donations') {
                  setCurrentSubTab('dashboard');
                } else {
                  setActiveTab(0);
                }
              }} 
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}
            >
              <ChevronLeft size={20} color="#fff" style={{ marginLeft: -6, marginRight: 4 }} />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
            </TouchableOpacity>
            <Text style={[styles.heroTitle, { marginHorizontal: 12, opacity: 0.4 }]}>|</Text>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.heroTitle, currentSubTab === 'dashboard' && { color: '#FCD34D' }]} numberOfLines={1}>
                  {currentSubTab === 'dashboard' ? 'Dashboard' : 
                   (selectedCategoryView ? 'Donations' : 'Donations')}
                </Text>
                <TouchableOpacity 
                  style={{ backgroundColor: '#c9973f', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginLeft: 14 }}
                  onPress={openAddDonation}
                >
                  <Text style={{ color: '#141d33', fontSize: 11, fontWeight: '700' }}>+ New Donation</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.heroSub, { marginTop: 4 }]} numberOfLines={1}>
                {currentSubTab === 'dashboard' ? 'Every offering, accounted for' : 
                 (selectedCategoryView ? selectedCategoryView : 'Track every category, line by line')}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.mainScroll} showsVerticalScrollIndicator={false}>
        
        {/* ================= DASHBOARD ================= */}
        {currentSubTab === 'dashboard' && (
          <View>
            <View style={styles.summaryGrid}>
              <View style={styles.sumCard}>
                <Text style={styles.sumLabel}>Today</Text>
                <Text style={styles.sumValue}>₹{stats.today.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.sumCard}>
                <Text style={styles.sumLabel}>This Week</Text>
                <Text style={styles.sumValue}>₹{stats.thisWeek.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.sumCard}>
                <Text style={styles.sumLabel}>This Month</Text>
                <Text style={styles.sumValue}>₹{stats.thisMonth.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.sumCard}>
                <Text style={styles.sumLabel}>This Year</Text>
                <Text style={styles.sumValue}>₹{stats.thisYear.toLocaleString('en-IN')}</Text>
              </View>
            </View>

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionHeadingTxt}>Quick actions</Text>
            </View>
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.qaBtn} activeOpacity={0.8} onPress={() => setShowCategoryModal(true)}>
                <View style={styles.qaIcon}><Plus size={16} color="#c9973f" /></View>
                <Text style={styles.qaBtnTxt}>Create Category</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.qaBtn} activeOpacity={0.8} onPress={openAddDonation}>
                <View style={styles.qaIcon}><Gift size={16} color="#c9973f" /></View>
                <Text style={styles.qaBtnTxt}>Add Donation</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionHeadingTxt}>Recent donations</Text>
            </View>
            
            <View style={styles.catList}>
              {globalGroupKeys.slice(0, 3).map(key => {
                const group = globalGroupedDonations[key];
                return (
                  <TouchableOpacity 
                    key={key} 
                    style={styles.recentCatCard} 
                    activeOpacity={0.9} 
                    onPress={() => {
                      setCurrentSubTab('donations');
                      setSelectedCategoryView(key);
                    }}
                  >
                    <View style={styles.catBody}>
                      <View>
                        <Text style={styles.catName}>{group.title}</Text>
                        <Text style={styles.catMeta}>{group.items.length} items • {group.date}</Text>
                      </View>
                      <Text style={styles.catAmt}>₹{group.total.toLocaleString('en-IN')}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              {globalGroupKeys.length === 0 && (
                <Text style={styles.emptyNote}>No recent donations found.</Text>
              )}
            </View>

            {globalGroupKeys.length > 0 && (
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setCurrentSubTab('donations')}>
                <Text style={styles.btnSecondaryTxt}>View All Donations</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ================= DONATIONS LIST ================= */}
        {currentSubTab === 'donations' && (
          <View>
            {selectedCategoryView ? (
              <View style={{ paddingTop: 10 }}>
                <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}
                  onPress={() => setSelectedCategoryView(null)}
                >
                  <ChevronRight size={14} color="#e6c079" style={{ transform: [{ rotate: '180deg' }], marginRight: 4 }} />
                  <Text style={{ fontFamily: FONTS.sans, fontSize: 13, color: '#e6c079', fontWeight: '600' }}>Back to categories</Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <Text style={{ fontFamily: FONTS.serif, fontSize: 22, color: '#141d33', fontWeight: '700' }}>{selectedCategoryView}</Text>
                </View>

                {donations
                  .filter(e => e.category === selectedCategoryView)
                  .map((don, idx) => {
                    return (
                      <TouchableOpacity 
                        key={don.id || idx} 
                        style={{ 
                          backgroundColor: '#ffffff', 
                          borderRadius: 16, 
                          padding: 16, 
                          marginBottom: 14, 
                          flexDirection: 'row', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          borderWidth: 1, 
                          borderColor: '#e5ddd0',
                          shadowColor: '#1b2a4a',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.04,
                          shadowRadius: 8,
                          elevation: 2
                        }}
                        activeOpacity={1}
                      >
                        <View style={{ flexDirection: 'row', flex: 1, paddingRight: 10 }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: FONTS.sans, fontSize: 16, fontWeight: '700', color: '#1b2a4a', marginBottom: 4 }} numberOfLines={1}>
                              {don.donorName || \`\${don.category} Donation\`}
                            </Text>
                            <Text style={{ fontFamily: FONTS.sans, fontSize: 13, color: '#645d54', marginBottom: 8 }}>
                              {don.date} • {don.paymentMethod || 'Cash'}
                            </Text>
                          </View>
                        </View>
                        
                        <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', height: '100%', minHeight: 70 }}>
                          <Text style={{ fontFamily: FONTS.mono, fontSize: 18, fontWeight: '700', color: '#1b2a4a' }}>
                            ₹{don.amount?.toLocaleString('en-IN') || 0}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity 
                              onPress={() => openEditDonation(don)}
                              style={{ padding: 8, backgroundColor: '#f4efe6', borderRadius: 8, marginRight: 8 }}
                            >
                              <Pencil size={14} color="#1b2a4a" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              onPress={() => {
                                if (don.id) handleDeleteDonation(don.id);
                              }}
                              style={{ padding: 8, backgroundColor: '#fef2f2', borderRadius: 8 }}
                            >
                              <Trash2 size={14} color="#dc2626" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  
                {donations.filter(e => e.category === selectedCategoryView).length === 0 && (
                  <Text style={{ fontFamily: FONTS.sans, fontSize: 14, color: '#645d54', textAlign: 'center', marginTop: 20 }}>No records found.</Text>
                )}
                
                {donations.filter(e => e.category === selectedCategoryView).length > 0 && (
                  <View style={{ backgroundColor: '#f4efe6', borderRadius: 16, padding: 16, marginTop: 6, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#c9973f' }}>
                    <Text style={{ fontFamily: FONTS.serif, fontSize: 18, color: '#141d33', fontWeight: '700' }}>Category Total</Text>
                    <Text style={{ fontFamily: FONTS.mono, fontSize: 22, color: '#141d33', fontWeight: '700' }}>
                      ₹{donations.filter(e => e.category === selectedCategoryView).reduce((sum, e) => sum + e.amount, 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                )}

              </View>
            ) : (
              <View>
                {/* ── Filters ── */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingRight: 20, paddingBottom: 10 }}>
                  {(['Today', 'Week', 'Month', 'Year', 'Custom Range'] as FilterPeriod[]).map(fp => (
                    <TouchableOpacity 
                      key={fp} 
                      style={[styles.filterChip, filterPeriod === fp && styles.filterChipActive]}
                      onPress={() => setFilterPeriod(fp)}
                    >
                      <Text style={[styles.filterChipTxt, filterPeriod === fp && styles.filterChipTxtActive]}>
                        {fp}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {filterPeriod === 'Custom Range' && (
                  <View style={styles.customRangeRow}>
                    <TouchableOpacity style={styles.customRangeBtn} onPress={() => setShowCustomStartPicker(true)}>
                      <Calendar size={14} color="#a89f92" style={{ marginRight: 6 }} />
                      <Text style={styles.customRangeBtnTxt}>
                        {customStartDate ? customStartDate.toLocaleDateString() : 'Start Date'}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.customRangeTo}>to</Text>
                    <TouchableOpacity style={styles.customRangeBtn} onPress={() => setShowCustomEndPicker(true)}>
                      <Calendar size={14} color="#a89f92" style={{ marginRight: 6 }} />
                      <Text style={styles.customRangeBtnTxt}>
                        {customEndDate ? customEndDate.toLocaleDateString() : 'End Date'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.customRangeApply}
                      onPress={() => {
                        if (!customStartDate || !customEndDate) {
                          displayToast("Please select both dates");
                        }
                      }}
                    >
                      <Text style={styles.customRangeApplyTxt}>Apply</Text>
                    </TouchableOpacity>

                    <DateTimePickerModal
                      isVisible={showCustomStartPicker}
                      mode="date"
                      date={customStartDate || new Date()}
                      onConfirm={(d) => { setCustomStartDate(d); setShowCustomStartPicker(false); }}
                      onCancel={() => setShowCustomStartPicker(false)}
                    />
                    <DateTimePickerModal
                      isVisible={showCustomEndPicker}
                      mode="date"
                      date={customEndDate || new Date()}
                      onConfirm={(d) => { setCustomEndDate(d); setShowCustomEndPicker(false); }}
                      onCancel={() => setShowCustomEndPicker(false)}
                    />
                  </View>
                )}

                <View style={styles.searchBar}>
                  <Search size={18} color="#a89f92" />
                  <TextInput 
                    style={styles.searchInput}
                    placeholder="Search categories..."
                    placeholderTextColor="#a89f92"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>

                <View style={styles.sectionHeading}>
                  <Text style={styles.sectionHeadingTxt}>Donation categories</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity style={styles.chipMini} onPress={openAddDonation}>
                      <Plus size={12} color="#1a2d5a" />
                      <Text style={styles.chipMiniTxt}>New</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.catList}>
                  {groupKeys.map(cat => {
                    const group = groupedDonations[cat];
                    return (
                      <TouchableOpacity 
                        key={cat} 
                        style={styles.catCard}
                        activeOpacity={0.9}
                        onPress={() => setSelectedCategoryView(cat)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          <LinearGradient colors={['#141d33', '#c9973f']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.catArch} />
                          <View style={[styles.catBody, { flex: 1 }]}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                              <Text style={styles.catName} numberOfLines={1}>{cat}</Text>
                              <Text style={styles.catMeta}>{group.items.length} {group.items.length === 1 ? 'donation' : 'donations'} in range</Text>
                            </View>
                            <Text style={styles.catAmt}>₹{group.total.toLocaleString('en-IN')}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  {groupKeys.length === 0 && (
                    <Text style={{ fontFamily: FONTS.sans, fontSize: 14, color: '#645d54', textAlign: 'center', marginTop: 20 }}>No donation categories for this period.</Text>
                  )}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ================= MODALS ================= */}
      
      {/* ── Add Donation Modal ── */}
      <Modal visible={showAddDonationModal} animationType="slide" transparent>
        <View style={styles.modalOverlayFull}>
          <View style={styles.addExpModal}>
            <View style={styles.addExpHeader}>
              <Text style={styles.addExpTitle}>{editDonationId ? 'Edit Donation' : 'Add Donation'}</Text>
              <TouchableOpacity style={styles.addExpClose} onPress={() => setShowAddDonationModal(false)}>
                <X size={20} color="#645d54" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.addExpBody} showsVerticalScrollIndicator={false}>
              
              <Text style={styles.helperText}>Record a new donation entry.</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Donor Name</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="Enter donor name"
                  placeholderTextColor="#a89f92"
                  value={donationDonorName}
                  onChangeText={setDonationDonorName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone (Optional)</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="Enter phone number"
                  placeholderTextColor="#a89f92"
                  value={donationDonorPhone}
                  onChangeText={setDonationDonorPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Amount (₹)</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor="#a89f92"
                  value={donationAmount}
                  onChangeText={setDonationAmount}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category</Text>
                <TouchableOpacity 
                  style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                  onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                >
                  <Text style={{ fontFamily: FONTS.sans, fontSize: 14, color: '#241f1a' }}>{addDonCategory}</Text>
                  <ChevronRight size={16} color="#a89f92" style={{ transform: [{ rotate: showCategoryDropdown ? '-90deg' : '90deg' }] }} />
                </TouchableOpacity>
                {showCategoryDropdown && (
                  <View style={styles.dropdownMenu}>
                    {categories.map(cat => (
                      <TouchableOpacity 
                        key={cat} 
                        style={[styles.dropdownItem, addDonCategory === cat && styles.dropdownItemActive]}
                        onPress={() => { setAddDonCategory(cat); setShowCategoryDropdown(false); }}
                      >
                        <Text style={[styles.dropdownItemTxt, addDonCategory === cat && styles.dropdownItemTxtActive]}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity 
                      style={[styles.dropdownItem, { borderTopWidth: 1, borderTopColor: '#f4efe6' }]}
                      onPress={() => {
                        setShowCategoryDropdown(false);
                        setShowCategoryModal(true);
                      }}
                    >
                      <Text style={[styles.dropdownItemTxt, { color: '#c9973f', fontWeight: '600' }]}>+ Create new category</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Date</Text>
                  <TouchableOpacity style={styles.input} onPress={() => {}}>
                    <Text style={{ fontFamily: FONTS.sans, fontSize: 14, color: '#241f1a' }}>{donationDate}</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Payment Method</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity 
                      style={[styles.pmBtn, donationPaymentMethod === 'Cash' && styles.pmBtnActive]} 
                      onPress={() => setDonationPaymentMethod('Cash')}
                    >
                      <Text style={[styles.pmBtnTxt, donationPaymentMethod === 'Cash' && styles.pmBtnTxtActive]}>Cash</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.pmBtn, donationPaymentMethod === 'Online' && styles.pmBtnActive]} 
                      onPress={() => setDonationPaymentMethod('Online')}
                    >
                      <Text style={[styles.pmBtnTxt, donationPaymentMethod === 'Online' && styles.pmBtnTxtActive]}>Online</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notes (Optional)</Text>
                <TextInput 
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="Additional details..."
                  placeholderTextColor="#a89f92"
                  value={donationNotes}
                  onChangeText={setDonationNotes}
                  multiline
                />
              </View>
              
              <View style={{ height: 100 }} />
            </ScrollView>
            
            <View style={styles.addExpFooter}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveDonation}>
                <Save size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.saveBtnTxt}>Save Donation</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Create Category Modal ── */}
      <Modal visible={showCategoryModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.catModalCard}>
            <View style={styles.catModalHeader}>
              <Text style={styles.catModalTitle}>New Category</Text>
              <TouchableOpacity style={styles.catModalClose} onPress={() => setShowCategoryModal(false)}>
                <X size={18} color="#645d54" />
              </TouchableOpacity>
            </View>
            <Text style={styles.catModalLabel}>Category Name</Text>
            <TextInput 
              style={styles.catModalInput}
              placeholder="e.g. Special Offering"
              placeholderTextColor="#a89f92"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoFocus
            />
            <TouchableOpacity style={styles.catModalSaveBtn} onPress={handleCreateCategory}>
              <Text style={styles.catModalSaveBtnTxt}>Create Category</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Toast Notification */}
      {showToast && (
        <View style={{ position: 'absolute', bottom: 40, left: 20, right: 20, backgroundColor: '#141d33', padding: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 }}>
          <Text style={{ fontFamily: FONTS.sans, fontSize: 14, color: '#ffffff', fontWeight: '600' }}>{toastMessage}</Text>
        </View>
      )}

      {/* Success Card */}
      {showSuccessCard && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20, 29, 51, 0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
          <View style={{ backgroundColor: '#ffffff', borderRadius: 24, padding: 30, alignItems: 'center', width: '80%' }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <CheckCircle2 size={32} color="#15803d" />
            </View>
            <Text style={{ fontFamily: FONTS.serif, fontSize: 24, color: '#1b2a4a', fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>Success</Text>
            <Text style={{ fontFamily: FONTS.sans, fontSize: 14, color: '#645d54', textAlign: 'center' }}>Donation has been saved successfully.</Text>
          </View>
        </View>
      )}

    </View>
  );
}

const FONTS = {
  sans: 'Outfit-Regular',
  serif: 'PlayfairDisplay-Regular',
  mono: 'JetBrainsMono-Regular'
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4efe6' },
  loadingContainer: { flex: 1, backgroundColor: '#f4efe6', justifyContent: 'center', alignItems: 'center' },
  
  // Hero Section
  hero: { backgroundColor: '#141d33', paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: 20, paddingBottom: 35, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  heroTitle: { fontFamily: FONTS.serif, fontSize: 26, color: '#ffffff', fontWeight: '700', letterSpacing: 0.5 },
  heroSub: { fontFamily: FONTS.sans, fontSize: 12, color: '#a89f92', fontWeight: '500', letterSpacing: 0.5 },
  
  mainScroll: { padding: 20, paddingBottom: 100 },
  
  // Summary Grid
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 30, marginTop: 10 },
  sumCard: { width: '48%', backgroundColor: '#ffffff', borderRadius: 16, padding: 18, marginBottom: 15, borderWidth: 1, borderColor: '#e5ddd0', shadowColor: '#1b2a4a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.03, shadowRadius: 15, elevation: 2 },
  sumLabel: { fontFamily: FONTS.sans, fontSize: 12, fontWeight: '700', color: '#a89f92', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  sumValue: { fontFamily: FONTS.mono, fontSize: 20, color: '#1b2a4a', fontWeight: '700' },
  
  // Section Headings
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 10 },
  sectionHeadingTxt: { fontFamily: FONTS.serif, fontSize: 18, color: '#1b2a4a', fontWeight: '700' },
  
  // Quick Actions
  quickActions: { flexDirection: 'row', gap: 12, marginBottom: 35 },
  qaBtn: { flex: 1, backgroundColor: '#ffffff', borderRadius: 16, paddingVertical: 18, paddingHorizontal: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e5ddd0', shadowColor: '#1b2a4a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  qaIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fcfaf6', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#f4efe6' },
  qaBtnTxt: { fontFamily: FONTS.sans, fontSize: 13, fontWeight: '700', color: '#1b2a4a', textAlign: 'center' },
  
  // Buttons & Chips
  btnSecondary: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#c9973f', borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: 10, marginBottom: 20, shadowColor: '#c9973f', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 },
  btnSecondaryTxt: { fontFamily: FONTS.sans, fontSize: 14, fontWeight: '700', color: '#c9973f' },
  chipMini: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e7ebf3', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 },
  chipMiniTxt: { fontFamily: FONTS.sans, fontSize: 11, fontWeight: '700', color: '#1a2d5a' },
  
  // Filter Row
  filterScroll: { marginBottom: 15 },
  filterChip: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5ddd0', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, marginRight: 10 },
  filterChipActive: { backgroundColor: '#1b2a4a', borderColor: '#1b2a4a' },
  filterChipTxt: { fontFamily: FONTS.sans, fontSize: 13, color: '#645d54', fontWeight: '600' },
  filterChipTxtActive: { color: '#ffffff' },
  
  // Custom Range
  customRangeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, backgroundColor: '#ffffff', padding: 8, borderRadius: 12, borderWidth: 1, borderColor: '#e5ddd0' },
  customRangeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  customRangeBtnTxt: { fontFamily: FONTS.sans, fontSize: 12, color: '#241f1a', fontWeight: '600' },
  customRangeTo: { fontFamily: FONTS.sans, fontSize: 12, color: '#a89f92', paddingHorizontal: 10, fontWeight: '600' },
  customRangeApply: { backgroundColor: '#c9973f', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginLeft: 8 },
  customRangeApplyTxt: { fontFamily: FONTS.sans, fontSize: 12, color: '#ffffff', fontWeight: '700' },
  
  // Search
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5ddd0', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 25 },
  searchInput: { flex: 1, marginLeft: 12, fontFamily: FONTS.sans, fontSize: 15, color: '#241f1a' },
  
  // Category Cards
  catList: { gap: 14 },
  catCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#e5ddd0', shadowColor: '#1b2a4a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  recentCatCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#e5ddd0', shadowColor: '#1b2a4a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  catArch: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16, shadowColor: '#c9973f', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 },
  catBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catName: { fontFamily: FONTS.sans, fontSize: 16, color: '#1b2a4a', fontWeight: '700', marginBottom: 4 },
  catMeta: { fontFamily: FONTS.sans, fontSize: 12, color: '#a89f92', fontWeight: '500' },
  catAmt: { fontFamily: FONTS.mono, fontSize: 18, fontWeight: '700', color: '#1b2a4a' },
  emptyNote: { fontFamily: FONTS.sans, fontSize: 14, color: '#645d54', textAlign: 'center', marginTop: 10, marginBottom: 20 },
  
  // Create Category Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(20, 29, 51, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  catModalCard: { width: '100%', backgroundColor: '#fcfaf6', borderRadius: 24, padding: 24, shadowColor: '#141d33', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.2, shadowRadius: 35, elevation: 10 },
  catModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  catModalTitle: { fontFamily: FONTS.serif, fontSize: 22, color: '#1b2a4a', fontWeight: '700' },
  catModalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e7ebf3', alignItems: 'center', justifyContent: 'center' },
  catModalLabel: { fontFamily: FONTS.sans, fontSize: 11.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7, color: '#645d54', marginBottom: 8 },
  catModalInput: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5ddd0', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, fontSize: 15, fontFamily: FONTS.sans, color: '#241f1a', marginBottom: 20 },
  catModalSaveBtn: { backgroundColor: '#1b2a4a', borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  catModalSaveBtnTxt: { fontFamily: FONTS.sans, fontSize: 15, fontWeight: '700', color: '#ffffff' },

  // Add Donation Modal
  modalOverlayFull: { flex: 1, backgroundColor: 'rgba(20, 29, 51, 0.65)', justifyContent: 'flex-end' },
  addExpModal: { backgroundColor: '#faf7f1', borderTopLeftRadius: 24, borderTopRightRadius: 24, width: '100%', height: '90%' },
  addExpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 22, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#e5ddd0' },
  addExpTitle: { fontFamily: FONTS.serif, fontSize: 20, fontWeight: '700', color: '#1b2a4a' },
  addExpClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e7ebf3', alignItems: 'center', justifyContent: 'center' },
  addExpBody: { paddingHorizontal: 22, paddingTop: 15 },
  helperText: { textAlign: 'center', fontFamily: FONTS.sans, fontSize: 13, color: '#645d54', marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontFamily: FONTS.sans, fontSize: 12, fontWeight: '700', color: '#645d54', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5ddd0', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, fontSize: 14, fontFamily: FONTS.sans, color: '#241f1a' },
  row: { flexDirection: 'row', gap: 15 },
  pmBtn: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5ddd0', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14 },
  pmBtnActive: { backgroundColor: '#1b2a4a', borderColor: '#1b2a4a' },
  pmBtnTxt: { fontFamily: FONTS.sans, fontSize: 13, fontWeight: '600', color: '#645d54' },
  pmBtnTxtActive: { color: '#ffffff' },
  addExpFooter: { padding: 22, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e5ddd0' },
  saveBtn: { backgroundColor: '#c9973f', borderRadius: 12, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  saveBtnTxt: { fontFamily: FONTS.sans, fontSize: 15, fontWeight: '700', color: '#ffffff' },
  
  // Dropdown
  dropdownMenu: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5ddd0', borderRadius: 8, marginTop: 5, zIndex: 20 },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f4efe6' },
  dropdownItemActive: { backgroundColor: '#1967d2' },
  dropdownItemTxt: { fontFamily: FONTS.sans, fontSize: 14, color: '#241f1a' },
  dropdownItemTxtActive: { color: '#ffffff', fontWeight: '500' }
});
`;

fs.writeFileSync(targetPath, code);
console.log("Wrote fully updated AdminDonationDashboard.tsx");
