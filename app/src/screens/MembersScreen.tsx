import React, { useEffect, useState, useMemo } from 'react';
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
  Edit3, 
  Trash2,
  Search
} from 'lucide-react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
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
const KID_RELATIONS = ['Son', 'Daughter', 'Grandson', 'Granddaughter', 'Nephew', 'Niece'];

export default function MembersScreen({ navigation }: any) {
  const { member } = useAuth();
  const { isDark } = useTheme();
  const { t, language } = useLanguage();
  const [relatedContacts, setRelatedContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newMember, setNewMember] = useState<any>({
    firstName: '',
    lastName: '',
    relation: 'Husband',
    gender: 'Male',
    dob: '',
    anniversaryDate: '',
    email: '',
    phone: '',
    referencePhone: '',
    isKidMember: false
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showRelationPicker, setShowRelationPicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<'birthdate' | 'anniversary' | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{ id: string, name: string } | null>(null);
  
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const getRelationLabel = (relation: string): string => {
    if (!relation) return '';
    const keyMap: Record<string, string> = {
      'husband': 'husband',
      'wife': 'wife',
      'father': 'father',
      'mother': 'mother',
      'son': 'son',
      'daughter': 'daughter',
      'son-in-law': 'sonInLaw',
      'daughter-in-law': 'daughterInLaw',
      'brother': 'brother',
      'sister': 'sister',
      'father-in-law': 'fatherInLaw',
      'mother-in-law': 'motherInLaw',
      'brother-in-law': 'brotherInLaw',
      'sister-in-law': 'sisterInLaw',
      'grandfather': 'grandfather',
      'grandmother': 'grandmother',
      'grandson': 'grandson',
      'granddaughter': 'granddaughter',
      'uncle': 'uncle',
      'aunt': 'aunt',
      'nephew': 'nephew',
      'niece': 'niece',
      'cousin': 'cousin',
      'guardian': 'guardian',
      'other': 'other',
      'parent': 'parent',
      'child': 'child',
    };
    const normalized = relation.toLowerCase().trim();
    const transKey = keyMap[normalized];
    if (transKey) {
      const res = t(`members.relations.${transKey}`);
      if (res && res !== `members.relations.${transKey}`) return res;
    }
    return relation;
  };

  const fetchFamily = async () => {
    if (!member) {
      setLoading(false);
      return;
    }
    
    const targetAccountId = member.accountId || member.id;
    
    try {
      const churchId = member.churchId || await FirestoreService.getChurchId();
      if (!churchId) {
        setLoading(false);
        return;
      }
      
      const contacts = await FirestoreService.getRelatedContacts(churchId, targetAccountId);
      
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
      Alert.alert(t('common.error'), t('members.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamily();
  }, [member]);

  const getParentPhones = () => {
    const parentRelations = ['Father', 'Mother', 'Husband', 'Wife', 'Guardian'];
    const parents = relatedContacts.filter((c: any) => {
      const rel = (c.relation || c.Relation || '');
      const phone = (c.phone || c.Phone || c.MobilePhone || '').replace(/\D/g, '');
      return (parentRelations.includes(rel) || c.id === member?.id) && phone.length >= 10;
    });
    return parents.map((c: any) => ({
      name: (`${c.FirstName || c.firstName || ''} ${c.LastName || c.lastName || ''}`.trim()) || c.Name || c.name || t('members.relations.parent'),
      relation: c.relation || c.Relation || t('members.relations.parent'),
      phone: (c.phone || c.Phone || c.MobilePhone || '').replace(/\D/g, '').slice(-10)
    }));
  };

  const handleAddMember = async () => {
    if (!newMember.firstName || !newMember.lastName) {
      Alert.alert(t('members.validation'), t('members.nameRequired'));
      return;
    }

    const isKid = KID_RELATIONS.includes(newMember.relation);

    if (newMember.phone) {
      const digitsOnly = newMember.phone.replace(/\D/g, '');
      if (digitsOnly.length >= 10) {
        const last10 = digitsOnly.slice(-10);
        const isDuplicateLocal = relatedContacts.some(c => {
          if (editingMemberId && (c.id === editingMemberId || c.Id === editingMemberId)) return false;
          const cPhone = (c.phone || c.Phone || c.MobilePhone || '').replace(/\D/g, '');
          return cPhone.length >= 10 && cPhone.slice(-10) === last10;
        });

        if (isDuplicateLocal) {
          setErrorMessage(t('members.duplicateMemberMsg'));
          setShowErrorModal(true);
          return;
        }
      }
    }

    if (isKid && !newMember.phone && !newMember.referencePhone) {
      const parents = getParentPhones();
      if (parents.length > 0) {
        newMember.referencePhone = parents[0].phone;
      }
    }
    
    setSubmitting(true);
    try {
      const churchId = member!.churchId || await FirestoreService.getChurchId();
      const targetAccountId = member!.accountId || member!.id;
      
      if (!member!.accountId && churchId) {
        await FirestoreService.updateMemberProfile(churchId, member!.id, { accountId: targetAccountId });
        member!.accountId = targetAccountId;
      }
      
      const isKidMember = KID_RELATIONS.includes(newMember.relation);
      const memberData = {
        ...newMember,
        isKidMember,
        phone: newMember.phone || ''
      };

      if (editingMemberId) {
        await FirestoreService.updateMemberProfile(churchId!, editingMemberId, memberData);
        setSuccessMessage(t('members.memberUpdatedSuccess'));
      } else {
        await FirestoreService.addFamilyMember(churchId!, targetAccountId, memberData);
        setSuccessMessage(t('members.memberAddedSuccess'));
      }
      setShowSuccess(true);
      setShowAddModal(false);
      setEditingMemberId(null);
      setNewMember({
        firstName: '', lastName: '', relation: 'Husband', gender: 'Male', dob: '', anniversaryDate: '', email: '', phone: '', referencePhone: '', isKidMember: false
      });
      fetchFamily();
    } catch (err: any) {
      if (err.message === 'DUPLICATE_MEMBER') {
        setErrorMessage(t('members.duplicateMemberMsg'));
        setShowErrorModal(true);
      } else {
        Alert.alert(t('common.error'), err.message || t('members.addError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = (memberId: string, memberName: string) => {
    setMemberToDelete({ id: memberId, name: memberName });
    setShowDeleteConfirm(true);
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;
    try {
      setLoading(true);
      setShowDeleteConfirm(false);
      const churchId = member?.churchId || await FirestoreService.getChurchId();
      if (churchId) {
        await FirestoreService.deleteMemberPermanent(churchId, memberToDelete.id);
        setSuccessMessage(t('members.memberDeletedSuccess'));
        setShowSuccess(true);
        fetchFamily();
      }
    } catch (err: any) {
      Alert.alert(t('common.error'), t('members.deleteError'));
      setLoading(false);
    } finally {
      setMemberToDelete(null);
    }
  };

  const handleMakeCall = (phoneNumber: string) => {
    if (!phoneNumber) return;
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert(t('common.error'), t('members.callError'));
    });
  };

  const handleSendEmail = (email: string) => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert(t('common.error'), t('members.mailError'));
    });
  };

  const getInitials = (name: string) => {
    if (!name) return 'M';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name[0].toUpperCase();
  };

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return relatedContacts;
    const q = searchQuery.toLowerCase().trim();
    return relatedContacts.filter(c => {
      const name = ((`${c.FirstName || c.firstName || ''} ${c.LastName || c.lastName || ''}`.trim()) || c.Name || c.name || '').toLowerCase();
      const rel = (c.relation || c.Relation || '').toLowerCase();
      const locRel = getRelationLabel(c.relation || c.Relation || '').toLowerCase();
      const phone = (c.phone || c.Phone || c.MobilePhone || '').replace(/\D/g, '');
      return name.includes(q) || rel.includes(q) || locRel.includes(q) || phone.includes(q);
    });
  }, [relatedContacts, searchQuery, language]);

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
            <Text style={styles.headerTitle}>{t('members.title')}</Text>
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

      {/* ── Optional Search Bar when multiple members exist ── */}
      {!loading && member && relatedContacts.length > 2 && (
        <View style={[styles.searchBarContainer, { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
          <Search size={18} color={isDark ? '#94a3b8' : '#64748b'} />
          <TextInput
            placeholder={t('members.searchPlaceholder')}
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            style={[styles.searchInput, { color: isDark ? '#fff' : '#0f172a' }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={16} color={isDark ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Main Body ── */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FCD34D" />
          <Text style={[styles.loadingText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            {t('members.loading')}
          </Text>
        </View>
      ) : !member ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: isDark ? '#fff' : '#1a2d5a' }]}>
            {t('members.signInRequired')}
          </Text>
          <Text style={styles.emptySubText}>
            {t('members.signInPrompt')}
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {relatedContacts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptySubText}>
                {t('members.noContactsFound')}
              </Text>
            </View>
          ) : filteredContacts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptySubText}>
                {t('members.noMembersFound')}
              </Text>
            </View>
          ) : (
            filteredContacts.map((c, index) => {
              const contactId = c.id || c.Id;
              const isCurrentUser = contactId === member.id;
              const contactPhone = c.Phone || c.MobilePhone || c.phone;
              const contactRefPhone = c.referencePhone || c.referenceNumber || null;
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
              const rawRole = (c.userType || c.User_Type__c || 'Member').toString();
              const displayRole = rawRole.toLowerCase() === 'member' ? t('members.memberRole') : (rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase());
              const displayRelation = getRelationLabel(c.relation || c.Relation || '');

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
                            <Text style={styles.selfBadgeTxt}>{t('members.you')}</Text>
                          </View>
                        )}
                      </View>

                      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 6 }}>
                        <View style={styles.roleBadge}>
                          <Text style={styles.roleBadgeTxt}>{displayRole}</Text>
                        </View>
                        {displayRelation ? (
                          <View style={[styles.roleBadge, { backgroundColor: isDark ? '#1e3a5f' : '#f0fdf4' }]}>
                            <Text style={[styles.roleBadgeTxt, { color: isDark ? '#60a5fa' : '#15803d' }]}>{displayRelation}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row' }}>
                      <TouchableOpacity 
                        style={{ padding: 8 }}
                        onPress={() => {
                          setEditingMemberId(contactId);
                          setNewMember({
                            firstName: c.FirstName || c.firstName || c.name?.split(' ')[0] || '',
                            lastName: c.LastName || c.lastName || c.name?.split(' ').slice(1).join(' ') || '',
                            email: contactEmail || '',
                            phone: contactPhone || '',
                            referencePhone: c.referencePhone || c.referenceNumber || '',
                            relation: c.relation || c.Relation || 'Child',
                            gender: c.gender || c.Gender || 'Male',
                            dob: c.dob || '',
                            anniversaryDate: c.anniversaryDate || c.AnniversaryDate || '',
                            isKidMember: KID_RELATIONS.includes(c.relation || c.Relation || '')
                          });
                          setShowAddModal(true);
                        }}
                      >
                        <Edit3 size={20} color={isDark ? '#cbd5e1' : '#64748b'} />
                      </TouchableOpacity>
                      {!isCurrentUser && (
                        <TouchableOpacity 
                          style={{ padding: 8, marginLeft: 4 }}
                          onPress={() => handleDeleteMember(contactId, contactName)}
                        >
                          <Trash2 size={20} color="#ef4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  <View style={[styles.cardDivider, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]} />

                  <View style={styles.cardDetails}>
                    {contactPhone ? (
                      <TouchableOpacity 
                        style={styles.detailRow} 
                        onPress={() => handleMakeCall(contactPhone)}
                      >
                        <View style={styles.iconBgPhone}>
                          <Phone size={14} color="#15803D" />
                        </View>
                        <View>
                          <Text style={styles.detailLabel}>{t('members.phoneNumber')}</Text>
                          <Text style={[styles.detailValue, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                            {contactPhone}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ) : contactRefPhone ? (
                      <TouchableOpacity 
                        style={styles.detailRow} 
                        onPress={() => handleMakeCall(contactRefPhone)}
                      >
                        <View style={[styles.iconBgPhone, { backgroundColor: '#fef3c7' }]}>
                          <Phone size={14} color="#b45309" />
                        </View>
                        <View>
                          <Text style={styles.detailLabel}>{t('members.parentReference')}</Text>
                          <Text style={[styles.detailValue, { color: isDark ? '#fbbf24' : '#b45309' }]}>
                            {contactRefPhone} {t('members.parentRefSuffix')}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ) : null}

                    {contactEmail && (
                      <TouchableOpacity 
                        style={styles.detailRow} 
                        onPress={() => handleSendEmail(contactEmail)}
                      >
                        <View style={styles.iconBgMail}>
                          <Mail size={14} color="#0369a1" />
                        </View>
                        <View>
                          <Text style={styles.detailLabel}>{t('members.emailAddress')}</Text>
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
                          <Text style={styles.detailLabel}>{t('members.registeredSince')}</Text>
                          <Text style={[styles.detailValue, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                            {contactDate.toLocaleDateString(language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : language === 'ta' ? 'ta-IN' : 'en-US', {
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
            <Text style={[styles.successTitle, { color: isDark ? '#fff' : '#1a2d5a' }]}>{t('common.success')}</Text>
            <Text style={styles.successSub}>{successMessage}</Text>
            <TouchableOpacity 
              style={styles.successBtn} 
              onPress={() => setShowSuccess(false)}
            >
              <Text style={styles.successBtnTxt}>{t('common.done')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Error Modal ── */}
      {showErrorModal && (
        <View style={styles.modalOverlayCen}>
          <View style={[styles.successModal, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <View style={[styles.successIconCircle, { backgroundColor: '#fee2e2' }]}>
              <X size={36} color="#ef4444" />
            </View>
            <Text style={[styles.successTitle, { color: isDark ? '#fff' : '#1a2d5a' }]}>{t('members.duplicateMemberTitle')}</Text>
            <Text style={styles.successSub}>{errorMessage}</Text>
            <TouchableOpacity 
              style={[styles.successBtn, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]} 
              onPress={() => setShowErrorModal(false)}
            >
              <Text style={[styles.successBtnTxt, { color: isDark ? '#fff' : '#334155' }]}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteConfirm && memberToDelete && (
        <View style={styles.modalOverlayCen}>
          <View style={[styles.successModal, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <View style={[styles.successIconCircle, { backgroundColor: '#fee2e2' }]}>
              <Trash2 size={36} color="#ef4444" />
            </View>
            <Text style={[styles.successTitle, { color: isDark ? '#fff' : '#1a2d5a' }]}>{t('members.deleteMemberTitle')}</Text>
            <Text style={styles.successSub}>{t('members.deleteMemberConfirm', { name: memberToDelete.name })}</Text>
            
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity 
                style={[styles.successBtn, { flex: 1, width: 'auto', paddingHorizontal: 0, backgroundColor: isDark ? '#334155' : '#f1f5f9' }]} 
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={[styles.successBtnTxt, { color: isDark ? '#fff' : '#334155' }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.successBtn, { flex: 1, width: 'auto', paddingHorizontal: 0, backgroundColor: '#ef4444' }]} 
                onPress={confirmDeleteMember}
              >
                <Text style={[styles.successBtnTxt, { color: '#fff' }]}>{t('common.delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ── Add Family Member Modal ── */}
      {showAddModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#1a2d5a' }]}>
                {editingMemberId ? t('members.editMember') : t('members.addNewMember')}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('members.firstName')}</Text>
                <TextInput 
                  style={[styles.input, { color: isDark ? '#fff' : '#000', borderColor: isDark ? '#334155' : '#e2e8f0', backgroundColor: isDark ? '#0f172a' : '#fff' }]}
                  placeholder={t('members.firstNamePlaceholder')}
                  placeholderTextColor="#94a3b8"
                  value={newMember.firstName}
                  onChangeText={(tVal) => setNewMember({...newMember, firstName: tVal})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('members.lastName')}</Text>
                <TextInput 
                  style={[styles.input, { color: isDark ? '#fff' : '#000', borderColor: isDark ? '#334155' : '#e2e8f0', backgroundColor: isDark ? '#0f172a' : '#fff' }]}
                  placeholder={t('members.lastNamePlaceholder')}
                  placeholderTextColor="#94a3b8"
                  value={newMember.lastName}
                  onChangeText={(tVal) => setNewMember({...newMember, lastName: tVal})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {KID_RELATIONS.includes(newMember.relation) ? t('members.mobileNumberKids') : t('members.mobileNumber')}
                </Text>
                <TextInput 
                  style={[styles.input, { color: isDark ? '#fff' : '#000', borderColor: isDark ? '#334155' : '#e2e8f0', backgroundColor: isDark ? '#0f172a' : '#fff' }]}
                  placeholder={KID_RELATIONS.includes(newMember.relation) ? t('members.phoneKidsPlaceholder') : t('members.phonePlaceholder')}
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  value={newMember.phone}
                  onChangeText={(tVal) => setNewMember({...newMember, phone: tVal})}
                />
              </View>

              {/* Reference Phone — shown for kid relations when phone is empty */}
              {KID_RELATIONS.includes(newMember.relation) && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('members.parentReferenceNumber')}</Text>
                  {getParentPhones().length > 0 ? (
                    <View>
                      {getParentPhones().map((p, i) => (
                        <TouchableOpacity
                          key={i}
                          style={[
                            styles.input,
                            { 
                              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
                              borderColor: newMember.referencePhone === p.phone ? '#1a2d5a' : (isDark ? '#334155' : '#e2e8f0'),
                              backgroundColor: newMember.referencePhone === p.phone ? (isDark ? '#1e3a5f' : '#EFF6FF') : (isDark ? '#0f172a' : '#fff')
                            }
                          ]}
                          onPress={() => setNewMember({...newMember, referencePhone: p.phone})}
                        >
                          <Text style={{ color: isDark ? '#cbd5e1' : '#334155', fontSize: 14, fontWeight: '600' }}>
                            {p.name} ({getRelationLabel(p.relation)}) — {p.phone}
                          </Text>
                          {newMember.referencePhone === p.phone && (
                            <Text style={{ color: '#1a2d5a', fontWeight: '800', fontSize: 12 }}>✓</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                      <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                        {t('members.birthdayWishesNote')}
                      </Text>
                    </View>
                  ) : (
                    <TextInput 
                      style={[styles.input, { color: isDark ? '#fff' : '#000', borderColor: isDark ? '#334155' : '#e2e8f0', backgroundColor: isDark ? '#0f172a' : '#fff' }]}
                      placeholder={t('members.parentPhonePlaceholder')}
                      placeholderTextColor="#94a3b8"
                      keyboardType="phone-pad"
                      value={newMember.referencePhone}
                      onChangeText={(tVal) => setNewMember({...newMember, referencePhone: tVal})}
                    />
                  )}
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('members.emailAddress')}</Text>
                <TextInput 
                  style={[styles.input, { color: isDark ? '#fff' : '#000', borderColor: isDark ? '#334155' : '#e2e8f0', backgroundColor: isDark ? '#0f172a' : '#fff' }]}
                  placeholder={t('members.emailPlaceholder')}
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={newMember.email}
                  onChangeText={(tVal) => setNewMember({...newMember, email: tVal})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('members.relation')}</Text>
                <TouchableOpacity
                  style={[styles.input, styles.dateInput, { borderColor: isDark ? '#334155' : '#e2e8f0', backgroundColor: isDark ? '#0f172a' : '#fff' }]}
                  onPress={() => setShowRelationPicker(true)}
                >
                  <Text style={{ color: isDark ? '#fff' : '#1a2d5a', fontSize: 16, fontWeight: '600' }}>
                    {getRelationLabel(newMember.relation) || t('members.selectRelation')}
                  </Text>
                  <ChevronDown size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('members.gender')}</Text>
                <View style={styles.pillContainer}>
                  {['Male', 'Female'].map(gen => (
                    <TouchableOpacity 
                      key={gen}
                      style={[styles.pill, newMember.gender === gen && styles.pillActive]}
                      onPress={() => setNewMember({...newMember, gender: gen})}
                    >
                      <Text style={[styles.pillText, newMember.gender === gen && styles.pillTextActive]}>
                        {gen === 'Male' ? t('members.male') : t('members.female')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('members.birthdate')}</Text>
                <TouchableOpacity 
                  style={[styles.input, styles.dateInput, { borderColor: isDark ? '#334155' : '#e2e8f0', backgroundColor: isDark ? '#0f172a' : '#fff' }]}
                  onPress={() => setDatePickerType('birthdate')}
                >
                  <Text style={{ color: newMember.dob ? (isDark ? '#fff' : '#000') : '#94a3b8' }}>
                    {newMember.dob || t('members.selectBirthdate')}
                  </Text>
                  <CalendarIcon size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {SPOUSE_RELATIONS.includes(newMember.relation) && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('members.anniversaryDate')}</Text>
                  <TouchableOpacity 
                    style={[styles.input, styles.dateInput, { borderColor: isDark ? '#334155' : '#e2e8f0', backgroundColor: isDark ? '#0f172a' : '#fff' }]}
                    onPress={() => setDatePickerType('anniversary')}
                  >
                    <Text style={{ color: newMember.anniversaryDate ? (isDark ? '#fff' : '#000') : '#94a3b8' }}>
                      {newMember.anniversaryDate || t('members.selectAnniversary')}
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
                  <Text style={styles.submitBtnTxt}>{editingMemberId ? t('members.saveChanges') : t('members.addMember')}</Text>
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
              <Text style={[styles.pickerTitle, { color: isDark ? '#fff' : '#1a2d5a' }]}>{t('members.selectRelation')}</Text>
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
                    {getRelationLabel(option)}
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

  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 46,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 6,
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
    borderRadius: 6
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
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999
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
