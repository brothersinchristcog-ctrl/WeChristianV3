import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  FlatList, 
  TextInput, 
  ActivityIndicator,
  Linking,
  Platform,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Contacts from 'expo-contacts';
import * as SMS from 'expo-sms';
import { X, Search, Check, MessageSquare, Share2, AlertCircle } from 'lucide-react-native';
import FirestoreService from '../services/FirestoreService';
import firestore from '@react-native-firebase/firestore';

interface InviteMembersModalProps {
  visible: boolean;
  onClose: () => void;
  churchName: string;
  churchCode: string;
  churchId?: string;
  onMembersAdded?: () => void;
  existingMembers?: any[];
}

interface ContactItem {
  id: string;
  name: string;
  phoneNumbers: Contacts.PhoneNumber[];
}

export default function InviteMembersModal({ visible, onClose, churchName, churchCode, churchId, onMembersAdded, existingMembers = [] }: InviteMembersModalProps) {
  const insets = useSafeAreaInsets();
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<ContactItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showWhatsAppWarning, setShowWhatsAppWarning] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');

  useEffect(() => {
    if (visible) {
      loadContacts();
    } else {
      // Reset state when closed
      setSearchQuery('');
      setSelectedIds(new Set());
    }
  }, [visible]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        setPermissionGranted(true);
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
        });

        // Filter contacts to only those with phone numbers
        const validContacts = data.filter(c => c.name && c.phoneNumbers && c.phoneNumbers.length > 0)
          .map(c => ({
            id: c.id,
            name: c.name,
            phoneNumbers: c.phoneNumbers || []
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        setContacts(validContacts);
        setFilteredContacts(validContacts);
      } else {
        setPermissionGranted(false);
      }
    } catch (err) {
      console.error('Error loading contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredContacts(contacts);
      return;
    }
    const lowerQuery = query.toLowerCase();
    const filtered = contacts.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) || 
      (c.phoneNumbers[0]?.number && c.phoneNumbers[0].number.includes(lowerQuery))
    );
    setFilteredContacts(filtered);
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    const newSelected = new Set<string>();
    filteredContacts.forEach(c => newSelected.add(c.id));
    setSelectedIds(newSelected);
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const getInviteMessage = () => {
    return `Join our church on We Christian\n\n${churchName} is using the We Christian app to stay connected.\n\nChurch Code: *${churchCode}*\n\nDownload the app:\nhttps://play.google.com/store/apps/details?id=com.wechristian.app`;
  };

  const getSelectedPhoneNumbers = () => {
    const numbers: string[] = [];
    selectedIds.forEach(id => {
      const contact = contacts.find(c => c.id === id);
      if (contact && contact.phoneNumbers[0]?.number) {
        numbers.push(contact.phoneNumbers[0].number);
      }
    });
    return numbers;
  };

  const processSelectedContacts = async () => {
    if (!churchId || selectedIds.size === 0) return true;

    setIsProcessing(true);
    let addedCount = 0;

    try {
      for (const id of Array.from(selectedIds)) {
        const contact = contacts.find(c => c.id === id);
        if (contact && contact.phoneNumbers[0]?.number) {
          const rawPhone = contact.phoneNumbers[0].number;
          // Clean non-digit characters except the leading '+'
          let cleanedPhone = rawPhone.replace(/[^\d+]/g, '');
          if (!cleanedPhone.startsWith('+')) {
            cleanedPhone = `+91${cleanedPhone}`;
          }

          // Duplicate check using local state to avoid Firestore index requirement
          const isDuplicate = existingMembers.some(member => {
            const mPhone = (member.phone || '').replace(/[^\d]/g, '');
            const cPhone = cleanedPhone.replace(/[^\d]/g, '');
            return mPhone === cPhone && mPhone.length > 5;
          });

          if (!isDuplicate) {
            await FirestoreService.adminAddMember(churchId, {
              name: contact.name,
              phone: cleanedPhone,
              userType: 'member',
              churchId: churchId
            });
            addedCount++;
          }
        }
      }
    } catch (e) {
      console.error('Error processing contacts to members:', e);
    } finally {
      setIsProcessing(false);
      if (addedCount > 0 && onMembersAdded) {
        onMembersAdded();
      }
    }
    return true;
  };

  const handleSendSMS = async () => {
    if (selectedIds.size === 0) return;
    
    await processSelectedContacts();

    const isAvailable = await SMS.isAvailableAsync();
    if (isAvailable) {
      const numbers = getSelectedPhoneNumbers();
      await SMS.sendSMSAsync(numbers, getInviteMessage());
      onClose();
    } else {
      Alert.alert('Error', 'SMS is not available on this device.');
    }
  };

  const executeWhatsAppShare = () => {
    setShowWhatsAppWarning(false);
    Linking.openURL(whatsappUrl)
      .then(() => onClose())
      .catch(() => {
        Alert.alert('Error', 'WhatsApp is not installed or could not be opened on this device.');
      });
  };

  const handleShareWhatsApp = async () => {
    if (selectedIds.size === 0) return;

    await processSelectedContacts();

    const message = encodeURIComponent(getInviteMessage());
    let url = `whatsapp://send?text=${message}`;
    
    // If only one contact is selected, we can try to route directly to them
    if (selectedIds.size === 1) {
      const numbers = getSelectedPhoneNumbers();
      if (numbers.length === 1) {
        let cleanPhone = numbers[0].replace(/[^\d]/g, ''); // strip '+' and spaces
        url = `whatsapp://send?phone=${cleanPhone}&text=${message}`;
      }
    }

    if (selectedIds.size > 1) {
      setWhatsappUrl(url);
      setShowWhatsAppWarning(true);
    } else {
      Linking.openURL(url)
        .then(() => onClose())
        .catch(() => {
          Alert.alert('Error', 'WhatsApp is not installed or could not be opened on this device.');
        });
    }
  };

  const renderItem = ({ item }: { item: ContactItem }) => {
    const isSelected = selectedIds.has(item.id);
    const phone = item.phoneNumbers[0]?.number || 'No number';

    return (
      <TouchableOpacity 
        style={styles.contactItem} 
        onPress={() => toggleSelect(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.contactInfo}>
          <Text style={styles.contactName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.contactPhone}>{phone}</Text>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Check size={14} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Processing Overlay */}
          {isProcessing && (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 10, justifyContent: 'center', alignItems: 'center', borderRadius: 24 }]}>
              <ActivityIndicator size="large" color="#1a2d5a" />
              <Text style={{ marginTop: 12, color: '#1a2d5a', fontWeight: '600' }}>Adding to members...</Text>
            </View>
          )}

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Invite from Contacts</Text>
              <Text style={styles.subtitle}>{selectedIds.size} Selected</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Search and Select All */}
          {!loading && permissionGranted && (
            <View style={styles.searchSection}>
              <View style={styles.searchBar}>
                <Search size={18} color="#94a3b8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChangeText={handleSearch}
                  placeholderTextColor="#94a3b8"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => handleSearch('')}>
                    <X size={16} color="#94a3b8" />
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.selectRow}>
                <TouchableOpacity onPress={selectAll} style={styles.selectBtn}>
                  <Text style={styles.selectBtnTxt}>Select All</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={deselectAll} style={styles.selectBtn}>
                  <Text style={styles.selectBtnTxt}>Deselect All</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Contact List */}
          <View style={styles.listContainer}>
            {loading ? (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color="#1a2d5a" />
                <Text style={styles.loadingText}>Loading contacts...</Text>
              </View>
            ) : !permissionGranted ? (
              <View style={styles.centerContent}>
                <Text style={styles.errorText}>Contact permission is required to invite members.</Text>
                <TouchableOpacity style={styles.permissionBtn} onPress={loadContacts}>
                  <Text style={styles.permissionBtnTxt}>Grant Permission</Text>
                </TouchableOpacity>
              </View>
            ) : filteredContacts.length === 0 ? (
              <View style={styles.centerContent}>
                <Text style={styles.emptyText}>No contacts found.</Text>
              </View>
            ) : (
              <FlatList
                data={filteredContacts}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.flatlistContent}
                initialNumToRender={20}
                maxToRenderPerBatch={20}
              />
            )}
          </View>

          {/* Footer Actions */}
          {permissionGranted && selectedIds.size > 0 && (
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 36 : 24) }]}>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.smsBtn]} 
                onPress={handleSendSMS}
              >
                <MessageSquare size={20} color="#fff" />
                <Text style={styles.actionBtnTxt}>Send SMS</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionBtn, styles.whatsappBtn]} 
                onPress={handleShareWhatsApp}
              >
                <Share2 size={20} color="#fff" />
                <Text style={styles.actionBtnTxt}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Beautiful WhatsApp Warning Modal */}
        <Modal
          visible={showWhatsAppWarning}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.warningOverlay}>
            <View style={styles.warningContent}>
              <View style={styles.warningIconContainer}>
                <AlertCircle size={32} color="#25D366" />
              </View>
              <Text style={styles.warningTitle}>Bulk WhatsApp Sharing</Text>
              <Text style={styles.warningDesc}>
                WhatsApp does not allow automatic bulk contact selection.
              </Text>
              <Text style={styles.warningDesc}>
                Once WhatsApp opens, you will need to manually tap the contacts you want to forward this message to.
              </Text>
              
              <View style={styles.warningActions}>
                <TouchableOpacity 
                  style={styles.warningCancelBtn}
                  onPress={() => setShowWhatsAppWarning(false)}
                >
                  <Text style={styles.warningCancelTxt}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.warningProceedBtn}
                  onPress={executeWhatsAppShare}
                >
                  <Text style={styles.warningProceedTxt}>Open WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
  },
  searchSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#0f172a',
    padding: 0,
  },
  selectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  selectBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  selectBtnTxt: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
  },
  flatlistContent: {
    paddingBottom: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  contactInfo: {
    flex: 1,
    paddingRight: 16,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 13,
    color: '#64748b',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#1a2d5a',
    borderColor: '#1a2d5a',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  errorText: {
    textAlign: 'center',
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  permissionBtn: {
    backgroundColor: '#1a2d5a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionBtnTxt: {
    color: '#fff',
    fontWeight: '700',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 15,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#fff',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  smsBtn: {
    backgroundColor: '#1a2d5a',
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
  },
  actionBtnTxt: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  warningOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  warningContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  warningIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e8f9ed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  warningDesc: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  warningActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    width: '100%',
  },
  warningCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  warningCancelTxt: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748b',
  },
  warningProceedBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#25D366',
    alignItems: 'center',
  },
  warningProceedTxt: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  }
});
