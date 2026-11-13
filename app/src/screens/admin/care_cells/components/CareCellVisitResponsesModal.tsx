import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Linking,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  MessageCircle,
  Calendar,
  Users,
  Home,
  Check,
} from 'lucide-react-native';
import CareCellService from '../../../../services/CareCellService';
import { formatDateDisplay } from '../../../../utils/DateUtils';
import {
  CareCellVisit,
  CareCellVisitMemberResponse,
  MemberVisitResponseStatus,
} from '../../../../types/CareCellTypes';
import { useAdminTheme, createAdminThemedStyles } from '../careCellTheme';

interface CareCellVisitResponsesModalProps {
  visible: boolean;
  onClose: () => void;
  visit: CareCellVisit | null;
  churchId?: string;
  onResponseUpdated?: () => void;
}

export default function CareCellVisitResponsesModal({
  visible,
  onClose,
  visit,
  churchId,
  onResponseUpdated,
}: CareCellVisitResponsesModalProps) {
  const { isDark, primaryText, secondaryText } = useAdminTheme();
  const primaryBtnBg = isDark ? '#FFFFFF' : '#0F172A';
  const primaryBtnText = isDark ? '#000000' : '#FFFFFF';
  const secondaryBtnBg = isDark ? '#27272A' : '#F8FAFC';
  const secondaryBtnBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1';
  const secondaryBtnText = isDark ? '#E4E4E7' : '#334155';

  const [filter, setFilter] = useState<'ALL' | 'Accepted' | 'Declined' | 'Pending'>('ALL');
  const [search, setSearch] = useState('');
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [editingPreferredMember, setEditingPreferredMember] = useState<CareCellVisitMemberResponse | null>(null);
  const [leaderCustomTime, setLeaderCustomTime] = useState('');

  if (!visit) return null;

  const responsesList: CareCellVisitMemberResponse[] = Object.values(visit.responses || {});

  // Counters
  const total = responsesList.length;
  const accepted = responsesList.filter((r) => r.response === 'Accepted').length;
  const declined = responsesList.filter((r) => r.response === 'Declined').length;
  const pending = responsesList.filter((r) => r.response === 'Pending' || !r.response).length;

  const filteredResponses = responsesList.filter((r) => {
    if (filter !== 'ALL' && (r.response || 'Pending') !== filter) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const name = (r.memberName || '').toLowerCase();
      const phone = (r.memberPhone || '').toLowerCase();
      return name.includes(q) || phone.includes(q);
    }
    return true;
  });

  const handleCall = (phone?: string) => {
    if (!phone) {
      Alert.alert('No Phone', 'No phone number available for this member.');
      return;
    }
    const clean = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${clean}`).catch(() => {
      Alert.alert('Call Failed', 'Unable to initiate phone call.');
    });
  };

  const handleWhatsApp = (r: CareCellVisitMemberResponse) => {
    if (!r.memberPhone) {
      Alert.alert('No Phone', 'No phone number available for this member.');
      return;
    }
    const clean = r.memberPhone.replace(/[^0-9]/g, '');
    const timeNote = r.preferredTime 
      ? ` We noted your preferred visit time as "${r.preferredTime}".` 
      : ` Scheduled visit time is ${visit.visitTime}.`;
    const msg = `Praise the Lord ${r.memberName}, greetings from ${visit.cellName}! We are following up regarding our upcoming visit scheduled for ${formatDateDisplay(visit.visitDate)}.${timeNote} Looking forward to fellowshipping with you and your family!`;
    const url = `whatsapp://send?phone=${clean}&text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('WhatsApp Unavailable', 'Please ensure WhatsApp is installed.');
    });
  };

  const handleManualToggle = async (
    memberId: string,
    memberName: string,
    newStatus: MemberVisitResponseStatus
  ) => {
    try {
      setUpdatingMemberId(memberId);
      const activeChurchId = churchId || (await CareCellService.getChurchId());
      await CareCellService.respondToVisit(
        activeChurchId,
        visit.id,
        memberId,
        newStatus,
        `Updated manually by leader for ${memberName}`
      );
      onResponseUpdated?.();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update response.');
    } finally {
      setUpdatingMemberId(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.visitTitle} numberOfLines={1}>
                {visit.title}
              </Text>
              <Text style={styles.visitSubtitle}>
                {visit.cellName} · {formatDateDisplay(visit.visitDate)} at {visit.visitTime}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* 4 Summary Cards */}
          <View style={styles.kpiRow}>
            <TouchableOpacity
              style={[
                styles.kpiCard,
                filter === 'ALL' && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg },
              ]}
              onPress={() => setFilter('ALL')}
            >
              <Text style={[styles.kpiValue, filter === 'ALL' && { color: primaryBtnText }]}>{total}</Text>
              <Text style={[styles.kpiLabel, filter === 'ALL' && { color: primaryBtnText }]}>Total</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.kpiCard, filter === 'Accepted' && styles.kpiCardActiveAccepted]}
              onPress={() => setFilter('Accepted')}
            >
              <View style={styles.kpiTop}>
                <CheckCircle2 size={13} color="#059669" />
                <Text style={[styles.kpiValue, { color: '#059669' }]}>{accepted}</Text>
              </View>
              <Text style={[styles.kpiLabel, { color: '#065F46' }]}>Accepted</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.kpiCard, filter === 'Declined' && styles.kpiCardActiveDeclined]}
              onPress={() => setFilter('Declined')}
            >
              <View style={styles.kpiTop}>
                <XCircle size={13} color="#E11D48" />
                <Text style={[styles.kpiValue, { color: '#E11D48' }]}>{declined}</Text>
              </View>
              <Text style={[styles.kpiLabel, { color: '#9F1239' }]}>Declined</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.kpiCard, filter === 'Pending' && styles.kpiCardActivePending]}
              onPress={() => setFilter('Pending')}
            >
              <View style={styles.kpiTop}>
                <Clock size={13} color="#D97706" />
                <Text style={[styles.kpiValue, { color: '#D97706' }]}>{pending}</Text>
              </View>
              <Text style={[styles.kpiLabel, { color: '#92400E' }]}>Pending</Text>
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchWrap}>
            <Search size={15} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search member name or phone..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <X size={14} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Member Responses List */}
          <FlatList
            data={filteredResponses}
            keyExtractor={(item) => item.memberId}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Users size={32} color="#CBD5E1" />
                <Text style={styles.emptyTxt}>No member responses match this filter.</Text>
              </View>
            }
            renderItem={({ item }) => {
              const resp = item.response || 'Pending';
              const isAccepted = resp === 'Accepted';
              const isDeclined = resp === 'Declined';
              const isUpdating = updatingMemberId === item.memberId;

              return (
                <View style={styles.memberCard}>
                  <View style={styles.memberLeft}>
                    {item.memberPhoto ? (
                      <Image source={{ uri: item.memberPhoto }} style={styles.avatarImg} />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarTxt}>{(item.memberName || 'M').charAt(0).toUpperCase()}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName}>{item.memberName}</Text>
                      {item.memberPhone ? (
                        <Text style={styles.memberPhone}>{item.memberPhone}</Text>
                      ) : null}

                      {/* Response Status Pill */}
                      <View style={styles.statusPillRow}>
                        {isAccepted && (
                          <View style={styles.acceptedPill}>
                            <CheckCircle2 size={12} color="#059669" style={{ marginRight: 4 }} />
                            <Text style={styles.acceptedPillTxt}>Available (Accepted)</Text>
                          </View>
                        )}
                        {isDeclined && (
                          <View style={styles.declinedPill}>
                            <XCircle size={12} color="#E11D48" style={{ marginRight: 4 }} />
                            <Text style={styles.declinedPillTxt}>Unavailable (Declined)</Text>
                          </View>
                        )}
                        {!isAccepted && !isDeclined && (
                          <View style={styles.pendingPill}>
                            <Clock size={12} color="#D97706" style={{ marginRight: 4 }} />
                            <Text style={styles.pendingPillTxt}>Awaiting Response</Text>
                          </View>
                        )}
                      </View>

                      {/* Preferred Visit Time Highlight for Leaders */}
                      {isAccepted && (
                        <View style={styles.leaderPreferredTimeRow}>
                          <Clock size={11} color="#047857" style={{ marginRight: 4 }} />
                          <Text style={styles.leaderPreferredTimeTxt}>
                            Preferred Time: <Text style={{ fontWeight: '800' }}>{item.preferredTime || `Scheduled (${visit.visitTime})`}</Text>
                          </Text>
                        </View>
                      )}

                      {item.notes ? (
                        <Text style={styles.memberResponseNotesTxt} numberOfLines={2}>
                          "{item.notes}"
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Actions Right (Call, WhatsApp, Toggle Status) */}
                  <View style={styles.memberActionsRight}>
                    {isUpdating ? (
                      <ActivityIndicator size="small" color={primaryText} />
                    ) : (
                      <>
                        {item.memberPhone ? (
                          <View style={styles.quickContactRow}>
                            <TouchableOpacity
                              onPress={() => handleCall(item.memberPhone)}
                              style={styles.iconBtnCall}
                              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            >
                              <Phone size={13} color="#059669" />
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => handleWhatsApp(item)}
                              style={styles.iconBtnWhatsApp}
                              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            >
                              <MessageCircle size={13} color="#25D366" />
                            </TouchableOpacity>
                          </View>
                        ) : null}

                        {/* Leader Quick Override (Accept / Decline) */}
                        <View style={styles.toggleRow}>
                          <TouchableOpacity
                            onPress={() => handleManualToggle(item.memberId, item.memberName, 'Accepted')}
                            style={[styles.smallStatusToggle, isAccepted && styles.smallStatusToggleActiveAccepted]}
                          >
                            <Check size={11} color={isAccepted ? '#FFFFFF' : '#059669'} />
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleManualToggle(item.memberId, item.memberName, 'Declined')}
                            style={[styles.smallStatusToggle, isDeclined && styles.smallStatusToggleActiveDeclined]}
                          >
                            <X size={11} color={isDeclined ? '#FFFFFF' : '#E11D48'} />
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => {
                              setEditingPreferredMember(item);
                              setLeaderCustomTime(item.preferredTime || '');
                            }}
                            style={[styles.smallTimeBtn, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Clock size={11} color={secondaryBtnText} />
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              );
            }}
          />
        </View>
      </View>

      {/* Leader Edit Preferred Visit Time Modal */}
      {editingPreferredMember && (
        <Modal
          visible={!!editingPreferredMember}
          transparent
          animationType="fade"
          onRequestClose={() => setEditingPreferredMember(null)}
        >
          <View style={styles.leaderEditOverlay}>
            <View style={styles.leaderEditCard}>
              <View style={styles.leaderEditHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.leaderEditTitle}>Preferred Visit Time</Text>
                  <Text style={styles.leaderEditSub}>For {editingPreferredMember.memberName}</Text>
                </View>
                <TouchableOpacity onPress={() => setEditingPreferredMember(null)} style={styles.leaderEditCloseBtn}>
                  <X size={16} color={secondaryText} />
                </TouchableOpacity>
              </View>

              <Text style={styles.leaderEditSectionLabel}>SELECT OR ENTER PREFERRED TIME</Text>
              <View style={styles.leaderTimePillsRow}>
                {[
                  `Scheduled (${visit.visitTime})`,
                  'Morning (10:00 AM – 12:00 PM)',
                  'Afternoon (2:00 PM – 4:00 PM)',
                  'Evening (5:00 PM – 7:00 PM)',
                  'Night (7:00 PM – 9:00 PM)',
                ].map((slot) => {
                  const isActive = leaderCustomTime === slot;
                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[
                        styles.leaderTimeSlotPill,
                        isActive && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg },
                      ]}
                      onPress={() => setLeaderCustomTime(slot)}
                    >
                      <Text style={[styles.leaderTimeSlotPillTxt, isActive && { color: primaryBtnText, fontWeight: '800' }]}>
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                style={styles.leaderTimeInput}
                placeholder="Or type custom time (e.g. 6:30 PM)"
                placeholderTextColor="#94A3B8"
                value={leaderCustomTime}
                onChangeText={setLeaderCustomTime}
              />

              <View style={styles.leaderEditActionsRow}>
                <TouchableOpacity
                  style={[styles.leaderEditCancelBtn, { backgroundColor: secondaryBtnBg, borderWidth: 1, borderColor: secondaryBtnBorder }]}
                  onPress={() => setEditingPreferredMember(null)}
                >
                  <Text style={[styles.leaderEditCancelBtnTxt, { color: secondaryBtnText }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.leaderEditSaveBtn, { backgroundColor: primaryBtnBg }]}
                  onPress={async () => {
                    if (!editingPreferredMember) return;
                    try {
                      setUpdatingMemberId(editingPreferredMember.memberId);
                      const activeChurchId = churchId || (await CareCellService.getChurchId());
                      await CareCellService.respondToVisit(
                        activeChurchId,
                        visit.id,
                        editingPreferredMember.memberId,
                        'Accepted',
                        editingPreferredMember.notes || 'Preferred time updated by leader',
                        leaderCustomTime.trim() || undefined
                      );
                      setEditingPreferredMember(null);
                      onResponseUpdated?.();
                    } catch (err: any) {
                      Alert.alert('Error', err.message || 'Failed to update preferred time.');
                    } finally {
                      setUpdatingMemberId(null);
                    }
                  }}
                >
                  <Text style={[styles.leaderEditSaveBtnTxt, { color: primaryBtnText }]}>Save Preferred Time</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
}

const styles = createAdminThemedStyles({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '88%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  visitTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  visitSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiCardActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  kpiCardActiveAccepted: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  kpiCardActiveDeclined: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  kpiCardActivePending: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  kpiTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 1,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#0F172A',
    padding: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  memberLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarTxt: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A2D5A',
  },
  memberName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  memberPhone: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  statusPillRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  acceptedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  acceptedPillTxt: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#065F46',
  },
  declinedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  declinedPillTxt: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#9F1239',
  },
  pendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingPillTxt: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#92400E',
  },
  memberActionsRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  quickContactRow: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtnCall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  iconBtnWhatsApp: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 4,
  },
  smallStatusToggle: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallStatusToggleActiveAccepted: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  smallStatusToggleActiveDeclined: {
    backgroundColor: '#E11D48',
    borderColor: '#E11D48',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTxt: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 8,
  },
  leaderPreferredTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginTop: 5,
    alignSelf: 'flex-start',
  },
  leaderPreferredTimeTxt: {
    fontSize: 11,
    color: '#065F46',
  },
  memberResponseNotesTxt: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#64748B',
    marginTop: 4,
  },
  smallTimeBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaderEditOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  leaderEditCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  leaderEditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  leaderEditTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A2D5A',
  },
  leaderEditSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  leaderEditCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderEditSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1A2D5A',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  leaderTimePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  leaderTimeSlotPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  leaderTimeSlotPillActive: {
    backgroundColor: '#1A2D5A',
    borderColor: '#1A2D5A',
  },
  leaderTimeSlotPillTxt: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  leaderTimeSlotPillTxtActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  leaderTimeInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1A2D5A',
    marginBottom: 16,
  },
  leaderEditActionsRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  leaderEditCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  leaderEditCancelBtnTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  leaderEditSaveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1A2D5A',
  },
  leaderEditSaveBtnTxt: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

