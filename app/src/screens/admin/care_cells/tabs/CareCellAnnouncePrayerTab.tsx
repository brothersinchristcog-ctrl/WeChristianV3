import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import {
  Megaphone,
  HeartHandshake,
  MessageCircle,
  Phone,
  Plus,
  CheckCircle2,
  Clock,
  Send,
  Archive,
  Globe,
  Users,
} from 'lucide-react-native';
import CareCellService from '../../../../services/CareCellService';
import { useAdminTheme, createAdminThemedStyles } from '../careCellTheme';
import {
  CareCell,
  CareCellPrayerRequest,
  CareCellAnnouncement,
  PrayerRequestStatus,
} from '../../../../types/CareCellTypes';
import CareCellAnnouncementModal from '../components/CareCellAnnouncementModal';
import CareCellPrayerModal from '../components/CareCellPrayerModal';

interface CareCellAnnouncePrayerTabProps {
  churchId?: string;
}

export default function CareCellAnnouncePrayerTab({ churchId }: CareCellAnnouncePrayerTabProps) {
  const { isDark, primaryText, secondaryText, cardSurface, secondarySurface, borderColor } = useAdminTheme();
  const primaryBtnBg = isDark ? '#FFFFFF' : '#0F172A';
  const primaryBtnText = isDark ? '#000000' : '#FFFFFF';
  const secondaryBtnBg = isDark ? '#27272A' : '#F8FAFC';
  const secondaryBtnBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1';
  const secondaryBtnText = isDark ? '#E4E4E7' : '#334155';

  const [section, setSection] = useState<'prayers' | 'announcements'>('prayers');
  const [cells, setCells] = useState<CareCell[]>([]);
  const [selectedCell, setSelectedCell] = useState<string>('ALL');

  // Prayers Data
  const [prayers, setPrayers] = useState<CareCellPrayerRequest[]>([]);
  const [editingPrayerId, setEditingPrayerId] = useState<string | null>(null);
  const [pastoralResponseText, setPastoralResponseText] = useState('');

  // Announcements Data
  const [announcements, setAnnouncements] = useState<CareCellAnnouncement[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [announceModalVisible, setAnnounceModalVisible] = useState(false);
  const [prayerModalVisible, setPrayerModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const activeChurchId = churchId || (await CareCellService.getChurchId());
      const [cellsList, prayerList, announceList] = await Promise.all([
        CareCellService.getCareCells(activeChurchId),
        CareCellService.getCellPrayerRequests(activeChurchId, selectedCell),
        CareCellService.getCellAnnouncements(activeChurchId, selectedCell),
      ]);

      setCells(cellsList);
      setPrayers(prayerList);
      setAnnouncements(announceList);
    } catch (e) {
      console.error('Error loading announce/prayer tab:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [churchId, selectedCell]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleUpdatePrayerStatus = async (prayerId: string, status: PrayerRequestStatus) => {
    try {
      const activeChurchId = churchId || (await CareCellService.getChurchId());
      await CareCellService.updatePrayerRequestStatus(activeChurchId, prayerId, status);
      setPrayers((prev) =>
        prev.map((p) => (p.id === prayerId ? { ...p, status } : p))
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to update prayer status.');
    }
  };

  const handleSavePastoralResponse = async (prayerId: string) => {
    if (!pastoralResponseText.trim()) return;
    try {
      const activeChurchId = churchId || (await CareCellService.getChurchId());
      await CareCellService.updatePrayerRequestStatus(
        activeChurchId,
        prayerId,
        'Praying',
        pastoralResponseText.trim(),
        'Admin'
      );
      setPrayers((prev) =>
        prev.map((p) =>
          p.id === prayerId
            ? { ...p, status: 'Praying', pastoralResponse: pastoralResponseText.trim() }
            : p
        )
      );
      setEditingPrayerId(null);
      setPastoralResponseText('');
      Alert.alert('Response Saved', 'Your pastoral encouragement has been recorded.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save pastoral response.');
    }
  };

  const handleArchiveAnnouncement = async (announcementId: string) => {
    Alert.alert('Archive Notice', 'Are you sure you want to archive this announcement?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          try {
            const activeChurchId = churchId || (await CareCellService.getChurchId());
            await CareCellService.archiveAnnouncement(activeChurchId, announcementId);
            setAnnouncements((prev) => prev.filter((a) => a.id !== announcementId));
          } catch (e) {
            Alert.alert('Error', 'Failed to archive announcement.');
          }
        },
      },
    ]);
  };

  const handleWhatsApp = (phone?: string, name?: string, prayerTitle?: string) => {
    if (!phone) {
      Alert.alert('No Phone', 'No phone number available for this member.');
      return;
    }
    const clean = phone.replace(/[^0-9]/g, '');
    const msg = `Praise the Lord ${name || 'Brother/Sister'}! Regarding your prayer request "${prayerTitle || 'need'}", the church and your Care Cell family are praying in agreement with you. May God grant peace and answers!`;
    Linking.openURL(`whatsapp://send?phone=${clean}&text=${encodeURIComponent(msg)}`).catch(() => {
      Alert.alert('WhatsApp Unavailable', 'Please ensure WhatsApp is installed.');
    });
  };

  const activeCellObj = cells.find((c) => c.id === selectedCell) || cells[0];

  return (
    <View style={styles.container}>
      {/* Segmented Top Switch */}
      <View style={styles.segmentWrap}>
        <View style={styles.segmentBar}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              section === 'prayers' && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg },
            ]}
            onPress={() => setSection('prayers')}
            activeOpacity={0.8}
          >
            <HeartHandshake
              size={15}
              color={section === 'prayers' ? primaryBtnText : secondaryText}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.segmentBtnTxt,
                section === 'prayers' && { color: primaryBtnText, fontWeight: '800' },
              ]}
            >
              Prayer Requests ({prayers.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              section === 'announcements' && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg },
            ]}
            onPress={() => setSection('announcements')}
            activeOpacity={0.8}
          >
            <Megaphone
              size={15}
              color={section === 'announcements' ? primaryBtnText : secondaryText}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.segmentBtnTxt,
                section === 'announcements' && { color: primaryBtnText, fontWeight: '800' },
              ]}
            >
              Announcements ({announcements.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cell Filter Bar */}
      <View style={styles.cellSelectorRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'ALL', cellCode: 'ALL CELLS', name: 'All Care Cells' }, ...cells]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isSelected = selectedCell === item.id;
            return (
              <TouchableOpacity
                style={[
                  styles.cellChip,
                  isSelected && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg },
                ]}
                onPress={() => setSelectedCell(item.id)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.cellChipTxt,
                    isSelected && { color: primaryBtnText, fontWeight: '800' },
                  ]}
                >
                  {item.cellCode || item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={primaryText} />
          <Text style={styles.loadingTxt}>Loading records...</Text>
        </View>
      ) : section === 'prayers' ? (
        /* ── Prayer Requests Tab ── */
        <FlatList
          data={prayers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[primaryBtnBg]} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <HeartHandshake size={44} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Prayer Requests</Text>
              <Text style={styles.emptySubtitle}>
                No requests currently submitted in this care cell group.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isAnswered = item.status === 'Answered';
            const isPraying = item.status === 'Praying';
            const isEditing = editingPrayerId === item.id;

            return (
              <View style={styles.prayerCard}>
                <View style={styles.prayerCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prayerTitle}>{item.title}</Text>
                    <Text style={styles.prayerMemberMeta}>
                      {item.memberName} · {item.cellCode || 'Cell'} · {item.privacy === 'Public' ? 'Public Wall' : 'Cell Only'}
                    </Text>
                  </View>
                  <View style={[styles.statusChip, isAnswered ? styles.chipAnswered : isPraying ? styles.chipPraying : styles.chipNew]}>
                    <Text style={[styles.statusChipTxt, isAnswered ? styles.chipAnsweredTxt : isPraying ? styles.chipPrayingTxt : styles.chipNewTxt]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.prayerDesc}>{item.description}</Text>

                {/* Pastoral Response Box */}
                {item.pastoralResponse ? (
                  <View style={styles.pastoralBox}>
                    <Text style={styles.pastoralLabel}>Pastoral Encouragement:</Text>
                    <Text style={styles.pastoralTxt}>"{item.pastoralResponse}"</Text>
                  </View>
                ) : null}

                {/* Inline Pastoral Response Input */}
                {isEditing ? (
                  <View style={styles.responseEditor}>
                    <TextInput
                      style={styles.responseInput}
                      placeholder="Write pastoral encouragement or prayer points..."
                      placeholderTextColor="#94A3B8"
                      value={pastoralResponseText}
                      onChangeText={setPastoralResponseText}
                      multiline
                    />
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                      <TouchableOpacity
                        style={[styles.cancelEditorBtn, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
                        onPress={() => {
                          setEditingPrayerId(null);
                          setPastoralResponseText('');
                        }}
                      >
                        <Text style={[styles.cancelEditorBtnTxt, { color: secondaryBtnText }]}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.saveEditorBtn, { backgroundColor: primaryBtnBg }]}
                        onPress={() => handleSavePastoralResponse(item.id)}
                      >
                        <Send size={12} color={primaryBtnText} style={{ marginRight: 5 }} />
                        <Text style={[styles.saveEditorBtnTxt, { color: primaryBtnText }]}>Send Guidance</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}

                {/* Card Action Row */}
                <View style={styles.prayerCardFooter}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={[styles.statusActionBtn, { backgroundColor: primaryBtnBg }]}
                      onPress={() => handleUpdatePrayerStatus(item.id, isPraying ? 'Answered' : 'Praying')}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.statusActionBtnTxt, { color: primaryBtnText }]}>
                        {isPraying ? '✓ Mark Answered' : '🙏 Mark Praying'}
                      </Text>
                    </TouchableOpacity>

                    {!isEditing && (
                      <TouchableOpacity
                        style={[styles.statusActionBtnOutline, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
                        onPress={() => {
                          setEditingPrayerId(item.id);
                          setPastoralResponseText(item.pastoralResponse || '');
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.statusActionBtnOutlineTxt, { color: secondaryBtnText }]}>Respond</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {item.memberPhone ? (
                    <TouchableOpacity
                      style={[
                        styles.whatsAppBtn,
                        isDark && { backgroundColor: 'rgba(22, 163, 74, 0.16)', borderColor: 'rgba(34, 197, 94, 0.35)' },
                      ]}
                      onPress={() => handleWhatsApp(item.memberPhone, item.memberName, item.title)}
                      activeOpacity={0.8}
                    >
                      <MessageCircle size={13} color={isDark ? '#4ADE80' : '#16A34A'} style={{ marginRight: 4 }} />
                      <Text style={[styles.whatsAppBtnTxt, isDark && { color: '#4ADE80' }]}>WhatsApp</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          }}
        />
      ) : (
        /* ── Announcements Tab ── */
        <FlatList
          data={announcements}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[primaryBtnBg]} />}
          ListHeaderComponent={
            <View style={{ marginBottom: 12 }}>
              <TouchableOpacity
                style={[styles.postAnnounceBtn, { backgroundColor: primaryBtnBg }]}
                onPress={() => setAnnounceModalVisible(true)}
                activeOpacity={0.85}
              >
                <Plus size={16} color={primaryBtnText} style={{ marginRight: 6 }} />
                <Text style={[styles.postAnnounceBtnTxt, { color: primaryBtnText }]}>Post New Announcement</Text>
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Megaphone size={44} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Announcements</Text>
              <Text style={styles.emptySubtitle}>
                No notices published yet. Tap 'Post New Announcement' to broadcast to cell members.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.announceCard}>
              <View style={styles.announceTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.announceTitle}>{item.title}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <View style={styles.announceScopeChip}>
                      {item.cellId === 'ALL' ? (
                        <Globe size={11} color="#1D4ED8" />
                      ) : (
                        <Users size={11} color="#059669" />
                      )}
                      <Text style={styles.announceScopeChipTxt}>
                        {item.cellId === 'ALL' ? 'Church-Wide' : item.cellCode || 'Cell'}
                      </Text>
                    </View>
                    <Text style={styles.announceAuthor}>By {item.createdByName || 'Admin'}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.archiveBtn}
                  onPress={() => handleArchiveAnnouncement(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Archive size={15} color="#DC2626" />
                </TouchableOpacity>
              </View>

              <Text style={styles.announceMsg}>{item.message}</Text>
            </View>
          )}
        />
      )}

      {/* Announcement Modal */}
      {announceModalVisible && (
        <CareCellAnnouncementModal
          visible={announceModalVisible}
          onClose={() => setAnnounceModalVisible(false)}
          cellId={activeCellObj?.id}
          cellCode={activeCellObj?.cellCode}
          cellName={activeCellObj?.name}
          createdBy="admin"
          createdByName="Admin"
          onSuccess={loadData}
        />
      )}

      {/* Prayer Modal */}
      {prayerModalVisible && (
        <CareCellPrayerModal
          visible={prayerModalVisible}
          onClose={() => setPrayerModalVisible(false)}
          cellId={activeCellObj?.id || ''}
          cellCode={activeCellObj?.cellCode}
          cellName={activeCellObj?.name}
          memberId="admin"
          memberName="Church Admin"
          onSuccess={loadData}
        />
      )}
    </View>
  );
}

const styles = createAdminThemedStyles({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  segmentWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  segmentBar: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  segmentBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  segmentBtnTxt: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  segmentBtnTxtActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  cellSelectorRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cellChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: 8,
  },
  cellChipSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  cellChipTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  cellChipTxtSelected: {
    color: '#FFFFFF',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  loadingTxt: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  prayerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  prayerCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  prayerTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  prayerMemberMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusChipTxt: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  chipNew: {
    backgroundColor: '#EFF6FF',
  },
  chipNewTxt: {
    color: '#1D4ED8',
  },
  chipPraying: {
    backgroundColor: '#FEF3C7',
  },
  chipPrayingTxt: {
    color: '#D97706',
  },
  chipAnswered: {
    backgroundColor: '#ECFDF5',
  },
  chipAnsweredTxt: {
    color: '#059669',
  },
  prayerDesc: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    marginTop: 8,
  },
  pastoralBox: {
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 3,
    borderLeftColor: '#1A2D5A',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  pastoralLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1A2D5A',
    textTransform: 'uppercase',
  },
  pastoralTxt: {
    fontSize: 12,
    color: '#334155',
    marginTop: 2,
    fontStyle: 'italic',
  },
  responseEditor: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  responseInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 8,
    fontSize: 12.5,
    color: '#0F172A',
    minHeight: 60,
  },
  cancelEditorBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  cancelEditorBtnTxt: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '700',
  },
  saveEditorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 6.5,
    borderRadius: 8,
  },
  saveEditorBtnTxt: {
    fontSize: 11.5,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  prayerCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statusActionBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  statusActionBtnTxt: {
    fontSize: 11.5,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  statusActionBtnOutline: {
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  statusActionBtnOutlineTxt: {
    fontSize: 11.5,
    color: '#334155',
    fontWeight: '700',
  },
  whatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.2,
    borderColor: '#BBF7D0',
    paddingHorizontal: 11,
    paddingVertical: 6.5,
    borderRadius: 8,
  },
  whatsAppBtnTxt: {
    fontSize: 11.5,
    color: '#16A34A',
    fontWeight: '700',
  },
  postAnnounceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 2,
  },
  postAnnounceBtnTxt: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  announceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  announceTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  announceTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  announceScopeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  announceScopeChipTxt: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#334155',
  },
  announceAuthor: {
    fontSize: 11,
    color: '#64748B',
  },
  archiveBtn: {
    padding: 4,
  },
  announceMsg: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    marginTop: 8,
  },
});

