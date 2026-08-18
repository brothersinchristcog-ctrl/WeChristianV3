import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Share, Platform, Modal } from 'react-native';
import { Building2, Users, Plus, ChevronRight, Settings, Share2, CheckCircle2, ChevronLeft, Edit2, Trash2, XCircle, HelpCircle } from 'lucide-react-native';
import { useChurch } from '../../context/ChurchContext';
import { useAuth } from '../../context/AuthContext';
import ChurchService, { ChurchDetails } from '../../services/ChurchService';
import FirestoreService from '../../services/FirestoreService';
import { AdminTabContext } from '../../context/AdminTabContext';

export default function AdminOrganization({ navigation }: any) {
  const { activeChurch, startImpersonation } = useChurch();
  const { setActiveTab, setDashboardScrollY } = useContext(AdminTabContext);
  const { member, user } = useAuth();
  const [branches, setBranches] = useState<ChurchDetails[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create / Edit Branch State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCode, setNewBranchCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  
  // New Admin State
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  
  // Custom Alert Modal State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'confirm' | 'danger';
    onConfirm?: () => void;
  }>({ visible: false, title: '', message: '', type: 'success' });

  // Auto-generate church code when name changes
  const [branchSuccess, setBranchSuccess] = useState<{ visible: boolean, name: string, code: string } | null>(null);

  const handleShare = async () => {
    if (!branchSuccess) return;
    try {
      await Share.share({
        message: `We've created a new branch: ${branchSuccess.name}!\nYou have been added to "${activeChurch?.name || 'our Church'}" on WeChristian!\n\nPlease download the app here: https://play.google.com/store/apps/details?id=com.wechristian.app\n\nOnce downloaded, sign in with your phone number. If asked, use Church Code: ${branchSuccess.code}`
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleShareBranch = async (branch: ChurchDetails) => {
    try {
      await Share.share({
        message: `We've created a new branch: ${branch.name}!\nYou have been added to "${activeChurch?.name || 'our Church'}" on WeChristian!\n\nPlease download the app here: https://play.google.com/store/apps/details?id=com.wechristian.app\n\nOnce downloaded, sign in with your phone number. If asked, use Church Code: ${branch.churchCode}`
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleNameChange = (text: string) => {
    setNewBranchName(text);
    if (text.length > 0 && !editingBranchId) {
      const baseCode = activeChurch?.churchCode 
        || (activeChurch?.name ? activeChurch.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase() : 'MAIN');
      
      const nextBranchNumber = branches.length + 1;
      const paddedNumber = String(nextBranchNumber).padStart(3, '0');
      setNewBranchCode(`${baseCode}${paddedNumber}`);
    } else {
      setNewBranchCode('');
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [activeChurch]);

  const fetchBranches = async () => {
    if (!activeChurch?.id) return;
    setLoading(true);
    try {
      const data = await ChurchService.getBranches(activeChurch.id);
      setBranches(data);
    } catch (e) {
      console.error('Error fetching branches', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!newBranchName || !newBranchCode || !activeChurch?.id) {
      setAlertConfig({ visible: true, title: 'Error', message: 'Please enter a branch name and code.', type: 'error' });
      return;
    }
    
    setCreating(true);
    try {
      if (editingBranchId) {
        // Update existing branch
        await ChurchService.updateChurch(editingBranchId, {
          name: newBranchName,
          churchCode: newBranchCode.toUpperCase().trim()
        });
        setNewBranchName('');
        setNewBranchCode('');
        setEditingBranchId(null);
        setShowCreateModal(false);
        setAlertConfig({
          visible: true,
          title: 'Success!',
          message: 'Branch details have been updated successfully.',
          type: 'success'
        });
        fetchBranches();
      } else {
        // Create new branch
        const newBranch: Omit<ChurchDetails, 'id' | 'parentChurchId'> = {
          name: newBranchName,
          churchCode: newBranchCode.toUpperCase().trim(),
          subdomain: newBranchCode.toLowerCase().trim().replace(/[^a-z0-9]/g, ''),
          contactEmail: activeChurch.contactEmail,
          theme: activeChurch.theme, // Inherit theme
          features: activeChurch.features,
          createdBy: user?.uid,
          isParentOrganization: false
        };

        const newBranchId = await ChurchService.createBranch(activeChurch.id, newBranch);
        
        if (newAdminName && newAdminPhone) {
          // Add the admin to the new branch
          const FirestoreService = require('../../services/FirestoreService').default;
          await FirestoreService.adminAddMember(newBranchId, {
            name: newAdminName,
            phone: newAdminPhone,
            userType: 'Admin'
          });
        }
        
        setNewBranchName('');
        setNewBranchCode('');
        setNewAdminName('');
        setNewAdminPhone('');
        setShowCreateModal(false);
        setBranchSuccess({ visible: true, name: newBranch.name, code: newBranch.churchCode });
        
        fetchBranches();
      }
    } catch (e) {
      console.error(e);
      setAlertConfig({ visible: true, title: 'Error', message: editingBranchId ? 'Failed to update branch.' : 'Failed to create branch. Please try again.', type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const handleEditBranch = (branch: ChurchDetails) => {
    setNewBranchName(branch.name);
    setNewBranchCode(branch.churchCode || '');
    setEditingBranchId(branch.id);
    setShowCreateModal(true);
  };

  const handleDeleteBranch = (branch: ChurchDetails) => {
    setAlertConfig({
      visible: true,
      title: 'Delete Branch',
      message: `Are you sure you want to permanently delete ${branch.name}?`,
      type: 'danger',
      onConfirm: async () => {
        try {
          // Optimistically update the UI to avoid flash of old data while indexes sync
          setBranches(prev => prev.filter(b => b.id !== branch.id));
          
          await ChurchService.deleteBranch(branch.id);
          // Removed `await fetchBranches()` because Firestore where() queries are eventually
          // consistent and will often return the deleted document for a few seconds.
          
          setAlertConfig({ visible: true, title: 'Success', message: 'Branch deleted successfully.', type: 'success' });
        } catch (e: any) {
          console.error(e);
          setAlertConfig({ visible: true, title: 'Error', message: e.message || 'Failed to delete branch.', type: 'error' });
          fetchBranches(); // Re-fetch to restore the optimistically deleted branch
        }
      }
    });
  };

  const handleImpersonate = async (branch: ChurchDetails) => {
    setAlertConfig({
      visible: true,
      title: 'View Dashboard',
      message: `Are you sure you want to view the dashboard as ${branch.name}?`,
      type: 'confirm',
      onConfirm: () => {
        if (setDashboardScrollY) setDashboardScrollY(0);
        setActiveTab(0);
        startImpersonation(branch.id, branch.name);
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a2d5a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      {/* ── Hero Section ── */}
      <View style={styles.hero}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1, paddingRight: 4 }}>
            <TouchableOpacity onPress={() => setActiveTab(0)} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ChevronLeft size={20} color="#fff" style={{ marginLeft: -6, marginRight: 2 }} />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
            </TouchableOpacity>
            <Text style={[styles.heroTitle, { marginHorizontal: 8, opacity: 0.4 }]}>|</Text>
            <Text style={[styles.heroTitle, { flexShrink: 1 }]} numberOfLines={1}>Church Branches</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Top Summary Card */}
        <View style={styles.premiumSummaryCard}>
          <View style={styles.summaryLeft}>
            <View style={styles.premiumIconCircle}>
              <Building2 size={24} color="#1a2d5a" />
            </View>
            <View style={styles.summaryTextGroup}>
              <Text style={styles.premiumSummaryTitle}>Network Overview</Text>
              <Text style={styles.premiumStatLbl}>Total Branches</Text>
            </View>
          </View>
          <View style={styles.summaryRight}>
            <Text style={styles.premiumStatVal}>{branches.length}</Text>
          </View>
        </View>

        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Church Branches</Text>
          <TouchableOpacity style={styles.premiumAddBtn} onPress={() => setShowCreateModal(true)}>
            <Plus size={18} color="#fff" />
            <Text style={styles.premiumAddBtnTxt}>New Branch</Text>
          </TouchableOpacity>
        </View>

        {branches.map(branch => (
          <View key={branch.id} style={styles.premiumBranchCard}>
            <View style={styles.branchCardHeader}>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={styles.premiumBranchName} numberOfLines={2}>{branch.name}</Text>
                <View style={styles.codeBadge}>
                  <Text style={styles.codeBadgeText}>Code: {branch.churchCode}</Text>
                </View>
              </View>
              <View style={styles.branchActions}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => handleShareBranch(branch)}>
                  <Share2 size={18} color="#10b981" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => handleEditBranch(branch)}>
                  <Edit2 size={18} color="#64748b" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteBranch(branch)}>
                  <Trash2 size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.branchCardFooter}>
              <View style={styles.memberCountBadge}>
                <Users size={14} color="#059669" style={{marginRight: 4}} />
                <Text style={styles.premiumMemberCount}>{branch.memberCount || 0} Members</Text>
              </View>
              <TouchableOpacity 
                style={styles.premiumViewDashboardBtn}
                onPress={() => handleImpersonate(branch)}
              >
                <Text style={styles.premiumViewDashboardBtnTxt}>View Dashboard</Text>
                <ChevronRight size={16} color="#fff" style={{marginLeft: 4}} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Create Branch Modal */}
      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingBranchId ? 'Edit Branch' : 'Create New Branch'}</Text>
            
            <Text style={styles.label}>Branch Name</Text>
            <TextInput 
              style={styles.input} 
              value={newBranchName} 
              onChangeText={handleNameChange} 
              placeholder="e.g. Jesus Loves Church" 
            />

            {!editingBranchId && (
              <>
                <Text style={styles.label}>Church Code</Text>
                <TextInput 
                  style={[styles.input, { backgroundColor: '#f8fafc', color: '#64748b' }]} 
                  value={newBranchCode} 
                  editable={false}
                  placeholder="Type a name to generate..." 
                />
                
                <Text style={styles.label}>Branch Admin Name (Optional)</Text>
                <TextInput 
                  style={styles.input} 
                  value={newAdminName} 
                  onChangeText={setNewAdminName} 
                  placeholder="e.g. Pastor John" 
                />

                <Text style={styles.label}>Branch Admin Phone (Optional)</Text>
                <TextInput 
                  style={styles.input} 
                  value={newAdminPhone} 
                  onChangeText={setNewAdminPhone} 
                  placeholder="e.g. +91 9876543210" 
                  keyboardType="phone-pad"
                />

                <Text style={styles.helpText}>This code is automatically generated. Members will use it to join this branch. If an admin phone is provided, they will immediately have admin access.</Text>
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowCreateModal(false); setNewBranchName(''); setNewBranchCode(''); setNewAdminName(''); setNewAdminPhone(''); setEditingBranchId(null); }}>
                <Text style={styles.cancelBtnTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createBtn} onPress={handleCreateBranch} disabled={creating}>
                {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnTxt}>{editingBranchId ? 'Save Changes' : 'Create Branch'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Alert Modal */}
      <Modal visible={alertConfig.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.alertContent}>
            <View style={[styles.alertIconBg, { backgroundColor: alertConfig.type === 'error' || alertConfig.type === 'danger' ? '#fee2e2' : alertConfig.type === 'confirm' ? '#e0e7ff' : '#dcfce7' }]}>
              {alertConfig.type === 'error' || alertConfig.type === 'danger' ? (
                <XCircle size={32} color="#ef4444" />
              ) : alertConfig.type === 'confirm' ? (
                <HelpCircle size={32} color="#4f46e5" />
              ) : (
                <CheckCircle2 size={32} color="#22c55e" />
              )}
            </View>
            <Text style={styles.alertTitle}>{alertConfig.title}</Text>
            <Text style={styles.alertMessage}>{alertConfig.message}</Text>
            
            <View style={styles.alertActions}>
              {(alertConfig.type === 'confirm' || alertConfig.type === 'danger') && (
                <TouchableOpacity style={styles.alertCancelBtn} onPress={() => setAlertConfig({...alertConfig, visible: false})}>
                  <Text style={styles.alertCancelBtnTxt}>Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.alertOkBtn, { backgroundColor: alertConfig.type === 'error' || alertConfig.type === 'danger' ? '#ef4444' : alertConfig.type === 'confirm' ? '#1a2d5a' : '#22c55e' }]} 
                onPress={() => {
                  setAlertConfig({...alertConfig, visible: false});
                  if (alertConfig.onConfirm) alertConfig.onConfirm();
                }}
              >
                <Text style={styles.alertOkBtnTxt}>{alertConfig.type === 'confirm' ? 'Yes, Continue' : alertConfig.type === 'danger' ? 'Yes, Delete' : 'Got it'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Branch Success & Share Modal */}
      <Modal visible={!!branchSuccess?.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successIconWrapper}>
              <CheckCircle2 size={48} color="#22c55e" />
            </View>
            <Text style={styles.successTitle}>Branch Created Successfully!</Text>
            <Text style={styles.successSubtext}>You can now share these details with your new branch administrators.</Text>
            
            <View style={styles.detailsCard}>
              <Text style={styles.detailsLabel}>Branch Name</Text>
              <Text style={styles.detailsValue}>{branchSuccess?.name}</Text>
              
              <View style={styles.detailsDivider} />
              
              <Text style={styles.detailsLabel}>Church Code</Text>
              <Text style={styles.detailsCode}>{branchSuccess?.code}</Text>
            </View>
            
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Share2 size={20} color="#fff" />
              <Text style={styles.shareBtnTxt}>Share Details</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.doneBtn} 
              onPress={() => setBranchSuccess(null)}
            >
              <Text style={styles.doneBtnTxt}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDE8DC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, paddingBottom: 100 },
  
  hero: {
    backgroundColor: '#1a2d5a',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 24,
    overflow: 'visible',
    position: 'relative',
    marginBottom: 6,
  },
  heroTitle: { color: '#fff', fontSize: 24, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontWeight: '600', letterSpacing: -0.5 },
  
  // Premium Summary Card
  premiumSummaryCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#1a2d5a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, borderLeftWidth: 4, borderLeftColor: '#1a2d5a' },
  summaryLeft: { flexDirection: 'row', alignItems: 'center' },
  premiumIconCircle: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  summaryTextGroup: { justifyContent: 'center' },
  premiumSummaryTitle: { fontSize: 16, fontWeight: '800', color: '#1a2d5a', marginBottom: 2 },
  premiumStatLbl: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  summaryRight: { paddingHorizontal: 8 },
  premiumStatVal: { fontSize: 32, fontWeight: '900', color: '#1a2d5a' },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  
  premiumAddBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a2d5a', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, shadowColor: '#1a2d5a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  premiumAddBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '700', marginLeft: 6 },

  // Premium Branch Cards
  premiumBranchCard: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, padding: 20, shadowColor: '#1a2d5a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#f1f5f9' },
  branchCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  branchActions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 8, marginLeft: 4, backgroundColor: '#f8fafc', borderRadius: 8 },
  premiumBranchName: { fontSize: 18, fontWeight: '800', color: '#1a2d5a', marginBottom: 8, lineHeight: 24 },
  codeBadge: { alignSelf: 'flex-start', backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  codeBadgeText: { fontSize: 12, fontWeight: '800', color: '#64748b', letterSpacing: 0.5 },
  branchCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 },
  memberCountBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  premiumMemberCount: { fontSize: 13, color: '#059669', fontWeight: '800' },
  
  premiumViewDashboardBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#C9A84C', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
  premiumViewDashboardBtnTxt: { color: '#1a2d5a', fontSize: 13, fontWeight: '800' },

  // Success Modal Styles
  successModalContent: { backgroundColor: '#fff', width: '92%', borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: '#1a2d5a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 10 },
  successIconWrapper: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#1a2d5a', textAlign: 'center', marginBottom: 8 },
  successSubtext: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 20, lineHeight: 20, paddingHorizontal: 10 },
  
  detailsCard: { width: '100%', backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#e2e8f0' },
  detailsLabel: { fontSize: 12, color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  detailsValue: { fontSize: 16, color: '#1a2d5a', fontWeight: '800' },
  detailsDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 12 },
  detailsCode: { fontSize: 22, color: '#C9A84C', fontWeight: '900', letterSpacing: 1.5 },
  
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a2d5a', width: '100%', paddingVertical: 14, borderRadius: 12, marginBottom: 8 },
  shareBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700', marginLeft: 8 },
  doneBtn: { width: '100%', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  doneBtnTxt: { color: '#64748b', fontSize: 15, fontWeight: '700' },

  emptyBox: { padding: 40, alignItems: 'center', backgroundColor: '#fff', borderRadius: 12 },
  emptyTxt: { color: '#64748b', fontSize: 15 },

  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modalContent: { backgroundColor: '#fff', width: '90%', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1a2d5a', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 },
  codeContainer: { backgroundColor: '#f1f5f9', padding: 16, borderRadius: 12, marginBottom: 8 },
  codeText: { color: '#1a2d5a', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  helpText: { fontSize: 12, color: '#64748b', marginBottom: 20, fontStyle: 'italic', textAlign: 'center' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  cancelBtn: { padding: 12, marginRight: 8 },
  cancelBtnTxt: { color: '#64748b', fontSize: 16, fontWeight: '600' },
  createBtn: { backgroundColor: '#1a2d5a', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  createBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  
  // Alert Modal Styles
  alertContent: { backgroundColor: '#fff', width: '85%', borderRadius: 16, padding: 24, alignItems: 'center' },
  alertIconBg: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  alertTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 8, textAlign: 'center' },
  alertMessage: { fontSize: 15, color: '#475569', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  alertActions: { flexDirection: 'row', width: '100%', justifyContent: 'center' },
  alertOkBtn: { paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12, minWidth: 120, alignItems: 'center' },
  alertOkBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  alertCancelBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, marginRight: 12, backgroundColor: '#f1f5f9' },
  alertCancelBtnTxt: { color: '#475569', fontSize: 16, fontWeight: '700' }
});
