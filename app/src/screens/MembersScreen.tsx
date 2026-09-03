import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  StatusBar,
  Platform,
  Dimensions,
  Linking,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Users, 
  ArrowLeft,
  ChevronLeft,
  ChevronDown,
  Phone,
  Mail,
  Calendar,
  UserCheck,
  Plus,
  X,
  Calendar as CalendarIcon,
  Edit3
} from 'lucide-react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import FirestoreService from '../services/FirestoreService';

const { width } = Dimensions.get('window');

const RELATION_OPTIONS = [
  'Husband', 'Wife', 'Father', 'Mother', 'Son', 'Daughter',
  'Son-in-Law', 'Daughter-in-Law', 'Brother', 'Sister',
  'Father-in-Law', 'Mother-in-Law', 'Brother-in-Law', 'Sister-in-Law',
  'Grandfather', 'Grandmother', 'Grandson', 'Granddaughter',
  'Uncle', 'Aunt', 'Nephew', 'Niece', 'Cousin', 'Guardian', 'Other'
];

const SPOUSE_RELATIONS = ['Husband', 'Wife'];

export default function MembersScreen({ navigation }: any) {
  const { member } = useAuth();
  const { isDark } = useTheme();
  const [relatedContacts, setRelatedContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [newMember, setNewMember] = useState({
    firstName: '',
    lastName: '',
    relation: 'Husband', // picklist
    gender: 'Male',
    dob: '',
    anniversaryDate: '',
    email: '',
    phone: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [showRelationPicker, setShowRelationPicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<'birthdate' | 'anniversary' | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  const fetchFamily = async () => {
    if (!member) {
      setLoading(false);
      return;
    }
    
    // Default to the member's own ID as the household group ID if they don't have one
    const targetAccountId = member.accountId || member.id;
    
    try {
      const churchId = member.churchId || await FirestoreService.getChurchId();
      if (!churchId) {
        setLoading(false);
        return;
      }
      
      const contacts = await FirestoreService.getRelatedContacts(churchId, targetAccountId);
      
      // If the member isn't in the related contacts list because they don't have accountId set yet,
      // add them manually to the display list so they see themselves.
      const selfExists = contacts.some((c: any) => c.id === member.id || c.Id === member.id);
      if (!selfExists) {
        contacts.unshift({
          Id: member.id,
          id: member.id,
          Name: member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim(),
          Phone: member.phone,
          Email: member.email,
          User_Type__c: member.userType || 'Member',
          CreatedDate: member.joinDate ? new Date(member.joinDate).toISOString() : new Date().toISOString()
        });
      }
      
      setRelatedContacts(contacts);
    } catch (err) {
      console.error('Error fetching household members:', err);
      Alert.alert('Error', 'Failed to retrieve household members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamily();
  }, [member]);

  const handleAddMember = async () => {
    if (!newMember.firstName || !newMember.lastName) {
      Alert.alert('Validation', 'First name and Last name are required.');
      return;
    }
    
    setSubmitting(true);
    try {
      const churchId = member!.churchId || await FirestoreService.getChurchId();
      const targetAccountId = member!.accountId || member!.id;
      
      // If the member themselves doesn't have an accountId yet, update their profile
      if (!member!.accountId && churchId) {
        await FirestoreService.updateMemberProfile(churchId, member!.id, { accountId: targetAccountId });
        member!.accountId = targetAccountId; // Update local state tentatively
      }
      
      if (editingMemberId) {
        await FirestoreService.updateMemberProfile(churchId!, editingMemberId, newMember);
      } else {
        await FirestoreService.addFamilyMember(churchId!, targetAccountId, newMember);
      }
      setShowSuccess(true);
      setShowAddModal(false);
      setEditingMemberId(null);
      setNewMember({
        firstName: '', lastName: '', relation: 'Husband', gender: 'Male', dob: '', anniversaryDate: '', email: '', phone: ''
      });
      fetchFamily();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add family member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMakeCall = (phoneNumber: string) => {
    if (!phoneNumber) return;
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate phone call.');
    });
  };

  const handleSendEmail = (email: string) => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Error', 'Unable to open email client.');
    });
  };

  const getInitials = (name: string) => {
    if (!name) return 'M';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name[0].toUpperCase();
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />

      {/* ── Page Header (Navy) ── */}
      <LinearGradient 
        colors={['#2b52a1', '#1a3673']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{top:10, bottom:10, left:10, right:10}}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          <View style={styles.headerCenter} pointerEvents="box-none">
            <Text style={styles.headerTitle}>Household Directory</Text>
          </View>
        </View>

        {member && !loading ? (
          <TouchableOpacity 
            style={styles.headerAddBtn}
            onPress={() => {
              setEditingMemberId(null);
              setNewMember({ firstName: '', lastName: '', relation: 'Husband', gender: 'Male', dob: '', anniversaryDate: '', email: '', phone: '' });
              setShowAddModal(true);
            }}
          >
            <Plus size={20} color="#1a2d5a" />
          </TouchableOpacity>
        ) : <View style={{ width: 32 }} />}
      </LinearGradient>

      {/* ── Main Body ── */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FCD34D" />
          <Text style={[styles.loadingText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            Loading family directory...
          </Text>
        </View>
      ) : !member ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: isDark ? '#fff' : '#1a2d5a' }]}>
            Sign In Required
          </Text>
          <Text style={styles.emptySubText}>
            Please sign in to view your household details.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {relatedContacts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptySubText}>
                No household contacts found linked to your account.
              </Text>
            </View>
          ) : (
            relatedContacts.map((c, index) => {
              const contactId = c.id || c.Id;
              const isCurrentUser = contactId === member.id;
              const contactPhone = c.Phone || c.MobilePhone || c.phone;
              const contactEmail = c.Email || c.email;
              
              let contactDate = null;
              const rawDate = c.CreatedDate || c.joinDate || c.createdAt;
              if (rawDate) {
                if (typeof rawDate.toDate === 'function') {
                  contactDate = rawDate.toDate();
                } else if (typeof rawDate._seconds === 'number') {
                  contactDate = new Date(rawDate._seconds * 1000);
                } else if (typeof rawDate.seconds === 'number') {
                  contactDate = new Date(rawDate.seconds * 1000);
                } else {
                  contactDate = new Date(rawDate);
                }
              }
              
              const contactName = (`${c.FirstName || c.firstName || ''} ${c.LastName || c.lastName || ''}`.trim()) || c.Name || c.name || 'Unknown';
              return (
                <View 
                  key={`${contactId || 'member'}-${index}`} 
                  style={[
                    styles.memberCard, 
                    { 
                      backgroundColor: isDark ? '#1e293b' : '#fff',
                      borderColor: isCurrentUser ? '#FCD34D' : (isDark ? '#334155' : '#e2e8f0'),
                      borderWidth: isCurrentUser ? 2 : 1
                    }
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.avatarCircle, isCurrentUser && styles.avatarCircleActive]}>
                      <Text style={styles.avatarText}>{getInitials(contactName)}</Text>
                    </View>

                    <View style={styles.memberMeta}>
                      <View style={styles.nameRow}>
                        <Text style={[styles.memberName, { color: isDark ? '#fff' : '#1a2d5a' }]}>
                          {contactName}
                        </Text>
                        {isCurrentUser && (
                          <View style={styles.selfBadge}>
                            <Text style={styles.selfBadgeTxt}>You</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.roleBadge}>
                        <Text style={styles.roleBadgeTxt}>{(c.userType || c.User_Type__c || 'Member').toString().charAt(0).toUpperCase() + (c.userType || c.User_Type__c || 'Member').toString().slice(1).toLowerCase()}</Text>
                      </View>
                    </View>

                    <TouchableOpacity 
                      style={{ padding: 8 }}
                      onPress={() => {
                        setEditingMemberId(contactId);
                        setNewMember({
                          firstName: c.FirstName || c.firstName || c.name?.split(' ')[0] || '',
                          lastName: c.LastName || c.lastName || c.name?.split(' ').slice(1).join(' ') || '',
                          email: contactEmail || '',
                          phone: contactPhone || '',
                          relation: c.relation || c.Relation || 'Child',
                          gender: c.gender || c.Gender || 'Male',
                          dob: c.dob || '',
                          anniversaryDate: c.anniversaryDate || c.AnniversaryDate || ''
                        });
                        setShowAddModal(true);
                      }}
                    >
                      <Edit3 size={20} color={isDark ? '#cbd5e1' : '#64748b'} />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.cardDivider, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]} />

                  <View style={styles.cardDetails}>
                    {contactPhone && (
                      <TouchableOpacity 
                        style={styles.detailRow} 
                        onPress={() => handleMakeCall(contactPhone)}
                      >
                        <View style={styles.iconBgPhone}>
                          <Phone size={14} color="#15803D" />
                        </View>
                        <View>
                          <Text style={styles.detailLabel}>Phone Number</Text>
                          <Text style={[styles.detailValue, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                            {contactPhone}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}

                    {contactEmail && (
                      <TouchableOpacity 
                        style={styles.detailRow} 
                        onPress={() => handleSendEmail(contactEmail)}
                      >
                        <View style={styles.iconBgMail}>
                          <Mail size={14} color="#0369a1" />
                        </View>
                        <View>
                          <Text style={styles.detailLabel}>Email Address</Text>
                          <Text style={[styles.detailValue, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                            {contactEmail}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}

                    {contactDate && !isNaN(contactDate.getTime()) && (
                      <View style={styles.detailRow}>
                        <View style={styles.iconBgCal}>
                          <Calendar size={14} color="#b45309" />
                        </View>
                        <View>
                          <Text style={styles.detailLabel}>Registered Since</Text>
                          <Text style={[styles.detailValue, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                            {contactDate.toLocaleDateString('en-US', {
                              month: 'long',
                              year: 'numeric'
                            })}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ── Success Modal ── */}
      {showSuccess && (
        <View style={styles.modalOverlayCen}>
          <View style={[styles.successModal, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <View style={styles.successIconCircle}>
              <UserCheck size={36} color="#15803D" />
            </View>
            <Text style={[styles.successTitle, { color: isDark ? '#fff' : '#1a2d5a' }]}>Success!</Text>
            <Text style={styles.successSub}>Family member added successfully.</Text>
            <TouchableOpacity 
              style={styles.successBtn} 
              onPress={() => setShowSuccess(false)}
            >
              <Text style={styles.successBtnTxt}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Add Family Member Modal ── */}
      {showAddModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#1a2d5a' }]}>{editingMemberId ? 'Edit Member' : 'Add New Member'}</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput 
                  style={[styles.input, { color: isDark ? '#fff' : '#000', borderColor: isDark ? '#334155' : '#e2e8f0', backgroundColor: isDark ? '#0f172a' : '#fff' }]}
                  placeholder="e.g. John"
                  placeholderTextColor="#94a3b8"
                  value={newMember.firstName}
                  onChangeText={(t) => setNewMember({...newMember, firstName: t})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last Name *</Text>
                <TextInput 
                  style={[styles.input, { color: isDark ? '#fff' : '#000', borderColor: isDark ? '#334155' : '#e2e8f0', backgroundColor: isDark ? '#0f172a' : '#fff' }]}
                  placeholder="e.g. Doe"
                  placeholderTextColor="#94a3b8"
                  value={newMember.lastName}
                  onChangeText={(t) => setNewMember({...newMember, lastName: t})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Number</Text>
                <TextInput 
                  style={[styles.input, { color: isDark ? '#fff' : '#000', borderColor: isDark ? '#334155' : '#e2e8f0', backgroundColor: isDark ? '#0f172a' : '#fff' }]}
                  placeholder="e.g. 9988776655"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  value={newMember.phone}
                  onChangeText={(t) => setNewMember({...newMember, phone: t})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput 
                  style={[styles.input, { color: isDark ? '#fff' : '#000', borderColor: isDark ? '#334155' : '#e2e8f0', backgroundColor: isDark ? '#0f172a' : '#fff' }]}
                  placeholder="e.g. john@example.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={newMember.email}
                  onChangeText={(t) => setNewMember({...newMember, email: t})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Relation *</Text>
                <TouchableOpacity
                  style={[styles.input, styles.dateInput, { borderColor: isDark ? '#334155' : '#e2e8f0', backgroundColor: isDark ? '#0f172a' : '#fff' }]}
                  onPress={() => setShowRelationPicker(true)}
                >
                  <Text style={{ color: isDark ? '#fff' : '#1a2d5a', fontSize: 16, fontWeight: '600' }}>
                    {newMember.relation || 'Select Relation'}
                  </Text>
                  <ChevronDown size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Gender</Text>
                <View style={styles.pillContainer}>
                  {['Male', 'Female'].map(gen => (
                    <TouchableOpacity 
                      key={gen}
                      style={[styles.pill, newMember.gender === gen && styles.pillActive]}
                      onPress={() => setNewMember({...newMember, gender: gen})}
                    >
                      <Text style={[styles.pillText, newMember.gender === gen && styles.pillTextActive]}>{gen}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Birthdate</Text>
                <TouchableOpacity 
                  style={[styles.input, styles.dateInput, { borderColor: isDark ? '#334155' : '#e2e8f0', backgroundColor: isDark ? '#0f172a' : '#fff' }]}
                  onPress={() => setDatePickerType('birthdate')}
                >
                  <Text style={{ color: newMember.dob ? (isDark ? '#fff' : '#000') : '#94a3b8' }}>
                    {newMember.dob || 'Select Birthdate'}
                  </Text>
                  <CalendarIcon size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {SPOUSE_RELATIONS.includes(newMember.relation) && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Anniversary Date</Text>
                  <TouchableOpacity 
                    style={[styles.input, styles.dateInput, { borderColor: isDark ? '#334155' : '#e2e8f0', backgroundColor: isDark ? '#0f172a' : '#fff' }]}
                    onPress={() => setDatePickerType('anniversary')}
                  >
                    <Text style={{ color: newMember.anniversaryDate ? (isDark ? '#fff' : '#000') : '#94a3b8' }}>
                      {newMember.anniversaryDate || 'Select Anniversary'}
                    </Text>
                    <CalendarIcon size={18} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={handleAddMember}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#1a2d5a" />
                ) : (
                  <Text style={styles.submitBtnTxt}>{editingMemberId ? 'Save Changes' : 'Add Member'}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}

      {/* ── Relation Picker Modal ── */}
      <Modal
        visible={showRelationPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRelationPicker(false)}
      >
        <TouchableOpacity 
          style={styles.pickerOverlay} 
          activeOpacity={1} 
          onPress={() => setShowRelationPicker(false)}
        >
          <View style={[styles.pickerSheet, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: isDark ? '#fff' : '#1a2d5a' }]}>Select Relation</Text>
              <TouchableOpacity onPress={() => setShowRelationPicker(false)}>
                <X size={22} color={isDark ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {RELATION_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.pickerOption,
                    newMember.relation === option && styles.pickerOptionActive,
                    { borderColor: isDark ? '#334155' : '#f1f5f9' }
                  ]}
                  onPress={() => {
                    setNewMember({ ...newMember, relation: option });
                    setShowRelationPicker(false);
                  }}
                >
                  <Text style={[
                    styles.pickerOptionTxt,
                    newMember.relation === option && styles.pickerOptionTxtActive,
                    { color: isDark && newMember.relation !== option ? '#cbd5e1' : undefined }
                  ]}>
                    {option}
                  </Text>
                  {newMember.relation === option && (
                    <View style={styles.pickerCheck}>
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <DateTimePickerModal
        isVisible={datePickerType !== null}
        mode="date"
        onConfirm={(date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const formatted = `${year}-${month}-${day}`;
          if (datePickerType === 'birthdate') {
            setNewMember({ ...newMember, dob: formatted });
          } else {
            setNewMember({ ...newMember, anniversaryDate: formatted });
          }
          setDatePickerType(null);
        }}
        onCancel={() => setDatePickerType(null)}
      />
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
  headerCenter: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 28 },
  backBtn: { zIndex: 10, padding: 5, marginLeft: -8, marginBottom: 4 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FCD34D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { fontSize: 14, fontWeight: '600', marginTop: 12 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyText: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  emptySubText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },

  scroll: { padding: 16, paddingBottom: 40 },
  memberCard: { 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: '#64748b', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 16
  },
  avatarCircleActive: {
    backgroundColor: '#1a2d5a',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  memberMeta: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  memberName: { fontSize: 16, fontWeight: '800' },
  selfBadge: { 
    backgroundColor: '#FCD34D', 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 6, 
    marginLeft: 8 
  },
  selfBadgeTxt: { color: '#1a2d5a', fontSize: 10, fontWeight: '800' },
  roleBadge: { 
    alignSelf: 'flex-start', 
    backgroundColor: '#eff6ff', 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 6, 
    marginTop: 6 
  },
  roleBadgeTxt: { color: '#1e40af', fontSize: 11, fontWeight: '700' },
  
  cardDivider: { height: 1, marginVertical: 14 },
  
  cardDetails: { gap: 14 },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  iconBgPhone: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  iconBgMail: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#f0fdfa', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  iconBgCal: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#fffbeb', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  
  detailLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  
  addBtnFloating: {
    position: 'absolute',
    bottom: 30,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FCD34D',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  
  modalOverlay: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalOverlayCen: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  successModal: { backgroundColor: '#fff', borderRadius: 24, padding: 30, width: '80%', alignItems: 'center' },
  successIconCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successTitle: { fontSize: 24, fontWeight: '800', marginBottom: 10 },
  successSub: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 25 },
  successBtn: { backgroundColor: '#FCD34D', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 24, width: '100%', alignItems: 'center' },
  successBtnTxt: { color: '#1a2d5a', fontSize: 16, fontWeight: '800' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc'
  },
  pillActive: {
    backgroundColor: '#1a2d5a',
    borderColor: '#1a2d5a'
  },
  pillText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  pillTextActive: { color: '#FCD34D' },
  
  submitBtn: {
    backgroundColor: '#FCD34D',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20
  },
  submitBtnTxt: { color: '#1a2d5a', fontSize: 16, fontWeight: '800' },

  // Relation Picker
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  pickerSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%'
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  pickerTitle: { fontSize: 18, fontWeight: '800' },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
  },
  pickerOptionActive: {
    backgroundColor: '#1a2d5a',
    borderColor: '#1a2d5a'
  },
  pickerOptionTxt: { fontSize: 15, fontWeight: '600', color: '#334155' },
  pickerOptionTxtActive: { color: '#FCD34D', fontWeight: '700' },
  pickerCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FCD34D',
    justifyContent: 'center',
    alignItems: 'center'
  }
});
