import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  LayoutDashboard,
  Building2,
  Users,
  Calendar,
  ClipboardCheck,
  Plus,
  Heart,
  Megaphone,
  Home,
} from 'lucide-react-native';
import { AdminTabContext } from '../../../context/AdminTabContext';
import { useAuth } from '../../../context/AuthContext';
import CareCellService from '../../../services/CareCellService';
import { useAdminTheme, createAdminThemedStyles } from '../../../utils/adminThemeHelper';
import CareCellsOverviewTab from './tabs/CareCellsOverviewTab';
import CareCellsManageTab from './tabs/CareCellsManageTab';
import CareCellMembersTab from './tabs/CareCellMembersTab';
import CareCellMeetingsTab from './tabs/CareCellMeetingsTab';
import CareCellAttendanceTab from './tabs/CareCellAttendanceTab';
import CareCellVisitsTab from './tabs/CareCellVisitsTab';
import CareCellFollowupsTab from './tabs/CareCellFollowupsTab';
import CareCellAnnouncePrayerTab from './tabs/CareCellAnnouncePrayerTab';
import CareCellFormModal from './components/CareCellFormModal';
import MeetingFormModal from './components/MeetingFormModal';
import { CareCell, CareCellMeeting } from '../../../types/CareCellTypes';

const { width } = Dimensions.get('window');

type SubTabKey = 'overview' | 'manage' | 'members' | 'meetings' | 'attendance' | 'visits' | 'followups' | 'announcements';

const SUB_TABS = [
  { key: 'overview' as SubTabKey, label: 'Overview', icon: LayoutDashboard },
  { key: 'manage' as SubTabKey, label: 'Care Cells', icon: Building2 },
  { key: 'members' as SubTabKey, label: 'Members', icon: Users },
  { key: 'meetings' as SubTabKey, label: 'Meetings', icon: Calendar },
  { key: 'attendance' as SubTabKey, label: 'Attendance', icon: ClipboardCheck },
  { key: 'visits' as SubTabKey, label: 'Visits', icon: Home },
  { key: 'followups' as SubTabKey, label: 'Follow-ups', icon: Heart },
  { key: 'announcements' as SubTabKey, label: 'Notices & Prayer', icon: Megaphone },
];

export default function AdminCareCellsHub() {
  const { isDark, screenBg, cardSurface, primaryText, secondaryText, borderColor } = useAdminTheme();
  const primaryBtnBg = isDark ? '#FFFFFF' : '#0F172A';
  const primaryBtnText = isDark ? '#000000' : '#FFFFFF';
  const inactivePillBg = isDark ? '#18181B' : '#FFFFFF';
  const inactivePillBorder = isDark ? '#27272A' : '#CBD5E1';

  const insets = useSafeAreaInsets();
  const { goBack, setTabByName } = useContext(AdminTabContext);
  const { user, member, isPlatformSuperAdmin } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<SubTabKey>('overview');
  const [cells, setCells] = useState<CareCell[]>([]);
  const [loadingCells, setLoadingCells] = useState(true);

  // Selected cell context shared across tabs
  const [selectedCellId, setSelectedCellId] = useState<string>('');
  const [selectedMeetingForAttendance, setSelectedMeetingForAttendance] = useState<CareCellMeeting | null>(null);

  // Modals
  const [createCellModalVisible, setCreateCellModalVisible] = useState(false);
  const [editingCell, setEditingCell] = useState<CareCell | null>(null);

  const [createMeetingModalVisible, setCreateMeetingModalVisible] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<CareCellMeeting | null>(null);

  const loadAllCells = useCallback(async () => {
    try {
      const churchId = await CareCellService.getChurchId();
      const list = await CareCellService.getCareCells(churchId);
      const filtered = isPlatformSuperAdmin
        ? list
        : list.filter(
            (c) =>
              (Array.isArray(c.assignedAdminIds) && !!user?.uid && c.assignedAdminIds.includes(user.uid)) ||
              c.leaderId === member?.id ||
              c.leaderId === user?.uid ||
              c.assistantLeaderId === member?.id ||
              c.assistantLeaderId === user?.uid
          );
      setCells(filtered);
      if (filtered.length > 0 && !selectedCellId) {
        setSelectedCellId(filtered[0].id);
      }
    } catch (e) {
      console.error('Error loading Care Cells in AdminCareCellsHub:', e);
    } finally {
      setLoadingCells(false);
    }
  }, [selectedCellId, isPlatformSuperAdmin, user?.uid, member?.id]);

  useEffect(() => {
    loadAllCells();
  }, [loadAllCells]);

  const handleBack = () => {
    if (goBack) {
      goBack();
    } else if (setTabByName) {
      setTabByName('Dashboard');
    }
  };

  const activeCellsCount = cells.filter((c) => c.status === 'Active').length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={screenBg} />

      {/* Hero Header (Transparent with Standard Circular Back Button) */}
      <View style={styles.heroHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={handleBack}
            style={[styles.circularBackBtn, { backgroundColor: cardSurface, borderColor }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={primaryText} strokeWidth={2.2} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Care Cells</Text>
            <Text style={styles.headerSubtitle}>
              {activeCellsCount} active fellowship {activeCellsCount === 1 ? 'group' : 'groups'}
            </Text>
          </View>
        </View>

        {/* Quick Add Button (Super Admin Only) */}
        {isPlatformSuperAdmin && (
          <TouchableOpacity
            style={[styles.quickAddHeaderBtn, { backgroundColor: primaryBtnBg }]}
            onPress={() => {
              setEditingCell(null);
              setCreateCellModalVisible(true);
            }}
            activeOpacity={0.85}
          >
            <Plus size={16} color={primaryBtnText} strokeWidth={2.5} style={{ marginRight: 5 }} />
            <Text style={[styles.quickAddHeaderBtnTxt, { color: primaryBtnText }]}>New Cell</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Segmented Subtab Navigation Bar */}
      <View style={styles.tabBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarScroll}>
          {SUB_TABS.map((tab) => {
            const isActive = activeSubTab === tab.key;
            const Icon = tab.icon;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tabPill,
                  {
                    backgroundColor: isActive ? primaryBtnBg : inactivePillBg,
                    borderColor: isActive ? primaryBtnBg : inactivePillBorder,
                  },
                ]}
                onPress={() => setActiveSubTab(tab.key)}
                activeOpacity={0.85}
              >
                <Icon
                  size={14}
                  color={isActive ? primaryBtnText : secondaryText}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <Text
                  style={[
                    styles.tabPillTxt,
                    { color: isActive ? primaryBtnText : secondaryText },
                    isActive && styles.tabPillTxtActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tab Views */}
      <View style={styles.tabContentArea}>
        {activeSubTab === 'overview' && (
          <CareCellsOverviewTab
            cells={cells}
            onNavigateTab={(idx) => {
              const target = SUB_TABS[idx]?.key || 'overview';
              setActiveSubTab(target);
            }}
            onOpenCreateCell={() => {
              setEditingCell(null);
              setCreateCellModalVisible(true);
            }}
            onOpenCreateMeeting={() => {
              setEditingMeeting(null);
              setCreateMeetingModalVisible(true);
            }}
          />
        )}

        {activeSubTab === 'manage' && (
          <CareCellsManageTab
            cells={cells}
            onRefreshCells={loadAllCells}
            onOpenCreateCell={() => {
              setEditingCell(null);
              setCreateCellModalVisible(true);
            }}
            onEditCell={(cell) => {
              setEditingCell(cell);
              setCreateCellModalVisible(true);
            }}
            onManageMembers={(cell) => {
              setSelectedCellId(cell.id);
              setActiveSubTab('members');
            }}
            onViewMeetings={(cell) => {
              setSelectedCellId(cell.id);
              setActiveSubTab('meetings');
            }}
          />
        )}

        {activeSubTab === 'members' && (
          <CareCellMembersTab
            cells={cells}
            selectedCellId={selectedCellId}
            onSelectCellId={setSelectedCellId}
          />
        )}

        {activeSubTab === 'meetings' && (
          <CareCellMeetingsTab
            cells={cells}
            selectedCellId={selectedCellId}
            onSelectCellId={setSelectedCellId}
            onOpenCreateMeeting={() => {
              setEditingMeeting(null);
              setCreateMeetingModalVisible(true);
            }}
            onEditMeeting={(meeting) => {
              setEditingMeeting(meeting);
              setCreateMeetingModalVisible(true);
            }}
            onMarkAttendance={(meeting) => {
              setSelectedMeetingForAttendance(meeting);
              setActiveSubTab('attendance');
            }}
          />
        )}

        {activeSubTab === 'attendance' && (
          <CareCellAttendanceTab
            cells={cells}
            selectedMeeting={selectedMeetingForAttendance}
            onClearSelectedMeeting={() => setSelectedMeetingForAttendance(null)}
          />
        )}

        {activeSubTab === 'visits' && (
          <CareCellVisitsTab
            cells={cells}
            selectedCellId={selectedCellId}
            onSelectCellId={setSelectedCellId}
          />
        )}

        {activeSubTab === 'followups' && (
          <CareCellFollowupsTab
            selectedCellId={selectedCellId}
            onSelectCell={setSelectedCellId}
          />
        )}

        {activeSubTab === 'announcements' && (
          <CareCellAnnouncePrayerTab />
        )}
      </View>

      {/* Create / Edit Care Cell Modal */}
      <CareCellFormModal
        visible={createCellModalVisible}
        cellToEdit={editingCell}
        onClose={() => {
          setCreateCellModalVisible(false);
          setEditingCell(null);
        }}
        onSaved={loadAllCells}
      />

      {/* Create / Edit Meeting Modal */}
      <MeetingFormModal
        visible={createMeetingModalVisible}
        cells={cells}
        defaultCellId={selectedCellId}
        meetingToEdit={editingMeeting}
        onClose={() => {
          setCreateMeetingModalVisible(false);
          setEditingMeeting(null);
        }}
        onSaved={loadAllCells}
      />
    </SafeAreaView>
  );
}

const styles = createAdminThemedStyles({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circularBackBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitleWrap: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  quickAddHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  quickAddHeaderBtnTxt: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tabBarContainer: {
    marginBottom: 8,
  },
  tabBarScroll: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  tabPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  tabPillTxt: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  tabPillTxtActive: {
    fontWeight: '800',
  },
  tabContentArea: {
    flex: 1,
  },
});

