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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import {
  ChevronLeft,
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
import { useCareCellAdminTheme, createCareCellAdminStyles } from './careCellTheme';
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
  const { screenBg, secondaryText } = useCareCellAdminTheme();
  const primaryBtnBg = '#1a2d5a';
  const primaryBtnText = '#FFFFFF';
  const inactivePillBg = '#FFFFFF';
  const inactivePillBorder = 'rgba(26,45,90,0.08)';

  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const { goBack, setTabByName } = useContext(AdminTabContext);
  const { user, member, isPlatformSuperAdmin } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<SubTabKey>('overview');
  const cachedCellsInit = CareCellService.getCachedCareCells();
  const [cells, setCells] = useState<CareCell[]>(cachedCellsInit || []);
  const [loadingCells, setLoadingCells] = useState(!cachedCellsInit);

  // Selected cell context shared across tabs
  const [selectedCellId, setSelectedCellId] = useState<string>('');
  const [selectedMeetingForAttendance, setSelectedMeetingForAttendance] = useState<CareCellMeeting | null>(null);

  useEffect(() => {
    const requestedSubTab = route?.params?.careCellTab as SubTabKey | undefined;
    if (requestedSubTab && SUB_TABS.some((t) => t.key === requestedSubTab)) {
      setActiveSubTab(requestedSubTab);
    }
    if (route?.params?.cellId) {
      setSelectedCellId(String(route.params.cellId));
    }
  }, [route?.params?.careCellTab, route?.params?.cellId, route?.params?.timestamp]);

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
    <View style={[styles.safeArea, { backgroundColor: screenBg }]}>
      <StatusBar barStyle="light-content" />

      {/* Hero Header (Standardized Navy Hero matching other Admin tabs) */}
      <View style={styles.hero}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1, paddingRight: 4 }}>
            <TouchableOpacity
              onPress={handleBack}
              style={{ flexDirection: 'row', alignItems: 'center' }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronLeft size={20} color="#fff" style={{ marginLeft: -6, marginRight: 2 }} />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
            </TouchableOpacity>
            <Text style={[styles.heroTitle, { marginHorizontal: 8, opacity: 0.4 }]}>|</Text>
            <Text style={[styles.heroTitle, { flexShrink: 1 }]} numberOfLines={1}>Care Cells</Text>
          </View>

          {isPlatformSuperAdmin && (
            <TouchableOpacity
              style={styles.newBtn}
              onPress={() => {
                setEditingCell(null);
                setCreateCellModalVisible(true);
              }}
              activeOpacity={0.85}
            >
              <Plus size={15} color="#1a2d5a" strokeWidth={2.5} />
              <Text style={styles.newBtnTxt}>New Cell</Text>
            </TouchableOpacity>
          )}
        </View>
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
    </View>
  );
}

const styles = createCareCellAdminStyles({
  safeArea: {
    flex: 1,
    backgroundColor: '#EDE8DC',
  },
  hero: {
    backgroundColor: '#1a2d5a',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    marginBottom: 8,
    overflow: 'visible',
    position: 'relative',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 20,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  newBtn: {
    backgroundColor: '#C9A84C',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    shadowColor: '#C9A84C',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  newBtnTxt: {
    color: '#1a2d5a',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
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

