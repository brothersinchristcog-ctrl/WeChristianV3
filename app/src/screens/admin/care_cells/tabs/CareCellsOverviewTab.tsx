import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Modal,
} from 'react-native';
import {
  Users,
  Building2,
  Calendar,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  PlusCircle,
  CalendarPlus,
  ClipboardCheck,
  CalendarDays,
  Check,
  X,
} from 'lucide-react-native';
import CareCellService from '../../../../services/CareCellService';
import { useAuth } from '../../../../context/AuthContext';
import { useAdminTheme, createAdminThemedStyles, formatCareCellLabel } from '../careCellTheme';
import { CareCell, CareCellOverviewStats } from '../../../../types/CareCellTypes';

const { width } = Dimensions.get('window');

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_QUARTERS = [
  [
    { num: 1, name: 'Jan' },
    { num: 2, name: 'Feb' },
    { num: 3, name: 'Mar' },
  ],
  [
    { num: 4, name: 'Apr' },
    { num: 5, name: 'May' },
    { num: 6, name: 'Jun' },
  ],
  [
    { num: 7, name: 'Jul' },
    { num: 8, name: 'Aug' },
    { num: 9, name: 'Sep' },
  ],
  [
    { num: 10, name: 'Oct' },
    { num: 11, name: 'Nov' },
    { num: 12, name: 'Dec' },
  ],
];

interface CareCellsOverviewTabProps {
  cells: CareCell[];
  onNavigateTab: (tabIndex: number) => void;
  onOpenCreateCell: () => void;
  onOpenCreateMeeting: () => void;
}

export default function CareCellsOverviewTab({
  cells,
  onNavigateTab,
  onOpenCreateCell,
  onOpenCreateMeeting,
}: CareCellsOverviewTabProps) {
  const { isDark, primaryText, secondaryText, cardSurface, secondarySurface, borderColor } = useAdminTheme();
  const primaryBtnBg = isDark ? '#FFFFFF' : '#0F172A';
  const primaryBtnText = isDark ? '#000000' : '#FFFFFF';
  const secondaryBtnBg = isDark ? '#27272A' : '#F8FAFC';
  const secondaryBtnBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1';
  const secondaryBtnText = isDark ? '#E4E4E7' : '#0F172A';

  const { isPlatformSuperAdmin } = useAuth();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [pickerYear, setPickerYear] = useState(now.getFullYear());
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);

  const [selectedCellId, setSelectedCellId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<CareCellOverviewStats>({
    totalCareCells: 0,
    activeCareCells: 0,
    inactiveCareCells: 0,
    totalCellLeaders: 0,
    totalAssignedMembers: 0,
    totalMeetingsThisMonth: 0,
    averageAttendanceRate: 0,
    membersRequiringFollowup: 0,
  });

  const loadStats = useCallback(async () => {
    try {
      const churchId = await CareCellService.getChurchId();
      const res = await CareCellService.getOverviewStats(churchId, {
        month: selectedMonth,
        year: selectedYear,
        cellId: selectedCellId,
        status: selectedStatus,
      });
      setStats(res);
    } catch (e) {
      console.error('Error loading Care Cell stats:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedMonth, selectedYear, selectedCellId, selectedStatus]);

  useEffect(() => {
    setLoading(true);
    loadStats();
  }, [loadStats]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const OVERVIEW_CARDS = [
    {
      id: 'cells',
      title: 'Total Care Cells',
      value: stats.totalCareCells,
      sub: `${stats.activeCareCells} active · ${stats.inactiveCareCells} inactive`,
      icon: Building2,
      color: '#2563EB',
      bgColor: '#EFF6FF',
      borderColor: '#DBEAFE',
      tabIndex: 1, // Manage Cells
    },
    {
      id: 'members',
      title: 'Assigned Members',
      value: stats.totalAssignedMembers,
      sub: 'Enrolled cell members',
      icon: Users,
      color: '#7C3AED',
      bgColor: '#F5F3FF',
      borderColor: '#EDE9FE',
      tabIndex: 2, // Cell Members
    },
    {
      id: 'leaders',
      title: 'Cell Leaders',
      value: stats.totalCellLeaders,
      sub: 'Leaders & Assistants',
      icon: UserCheck,
      color: '#059669',
      bgColor: '#ECFDF5',
      borderColor: '#D1FAE5',
      tabIndex: 2, // Cell Members
    },
    {
      id: 'attendance',
      title: 'Avg. Attendance',
      value: `${stats.averageAttendanceRate}%`,
      sub: 'Monthly participation rate',
      icon: TrendingUp,
      color: '#D97706',
      bgColor: '#FFFBEB',
      borderColor: '#FEF3C7',
      tabIndex: 4, // Attendance
    },
    {
      id: 'meetings',
      title: `Meetings in ${MONTH_NAMES[selectedMonth - 1].slice(0, 3)}`,
      value: stats.totalMeetingsThisMonth,
      sub: 'Fellowships conducted',
      icon: Calendar,
      color: '#0D9488',
      bgColor: '#F0FDFA',
      borderColor: '#CCFBF1',
      tabIndex: 3, // Meetings
    },
    {
      id: 'followups',
      title: 'Care Follow-ups',
      value: stats.membersRequiringFollowup,
      sub: 'Pending pastoral check-ins',
      icon: AlertCircle,
      color: stats.membersRequiringFollowup > 0 ? '#E11D48' : '#64748B',
      bgColor: stats.membersRequiringFollowup > 0 ? '#FFF1F2' : '#F8FAFC',
      borderColor: stats.membersRequiringFollowup > 0 ? '#FFE4E6' : '#E2E8F0',
      tabIndex: 5, // Follow-ups
      valueColor: stats.membersRequiringFollowup > 0 ? '#E11D48' : '#0F172A',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[primaryBtnBg]} />}
    >
      {/* ── Period Selector Bar ── */}
      <View style={styles.periodBar}>
        <TouchableOpacity
          style={styles.periodBtn}
          onPress={() => {
            setPickerYear(selectedYear);
            setShowDatePickerModal(true);
          }}
          activeOpacity={0.8}
        >
          <View style={[styles.calendarIconBadge, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}>
            <CalendarDays size={16} color={primaryText} strokeWidth={2.4} />
          </View>
          <View style={styles.periodTextGroup}>
            <Text style={styles.periodMiniLabel}>ANALYTICS PERIOD</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.periodValue}>
                {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </Text>
              <ChevronDown size={14} color={secondaryText} style={{ marginTop: 1 }} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Quick Month Navigation Steppers */}
        <View style={styles.periodStepperRow}>
          <TouchableOpacity
            style={[styles.stepperBtn, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
            onPress={() => {
              if (selectedMonth === 1) {
                setSelectedMonth(12);
                setSelectedYear((y) => y - 1);
              } else {
                setSelectedMonth((m) => m - 1);
              }
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <ChevronLeft size={16} color={primaryText} strokeWidth={2.4} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.stepperBtn, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
            onPress={() => {
              if (selectedMonth === 12) {
                setSelectedMonth(1);
                setSelectedYear((y) => y + 1);
              } else {
                setSelectedMonth((m) => m + 1);
              }
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <ChevronRight size={16} color={primaryText} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── All Cells Filter Chips Bar ── */}
      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={{ paddingRight: 16 }}
        >
          {/* All Cells Chip */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedCellId === 'ALL' && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg },
            ]}
            onPress={() => setSelectedCellId('ALL')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.filterChipTxt,
                selectedCellId === 'ALL' && { color: primaryBtnText, fontWeight: '800' },
              ]}
            >
              All Cells ({cells.length})
            </Text>
          </TouchableOpacity>

          {cells.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.filterChip,
                selectedCellId === c.id && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg },
              ]}
              onPress={() => setSelectedCellId(c.id)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterChipTxt,
                  selectedCellId === c.id && { color: primaryBtnText, fontWeight: '800' },
                ]}
              >
                {formatCareCellLabel(c.cellCode, c.name)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={primaryText} />
          <Text style={styles.loadingTxt}>Calculating Care Cell analytics...</Text>
        </View>
      ) : (
        <>
          {/* ── Redesigned Modern 6-Card KPI Grid ── */}
          <View style={styles.kpiGrid}>
            {OVERVIEW_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <TouchableOpacity
                  key={card.id}
                  style={styles.modernCard}
                  activeOpacity={0.75}
                  onPress={() => onNavigateTab(card.tabIndex)}
                >
                  <View style={styles.cardTopRow}>
                    <View
                      style={[
                        styles.cardIconWrap,
                        {
                          backgroundColor: isDark ? `${card.color}20` : card.bgColor,
                          borderColor: isDark ? `${card.color}40` : card.borderColor,
                        },
                      ]}
                    >
                      <Icon size={18} color={card.color} strokeWidth={2.2} />
                    </View>
                    <View style={styles.cardArrowWrap}>
                      <ChevronRight size={13} color="#94A3B8" strokeWidth={2.4} />
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.cardValue,
                      card.valueColor && card.valueColor !== '#0F172A' ? { color: card.valueColor } : null,
                    ]}
                  >
                    {card.value}
                  </Text>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {card.title}
                  </Text>
                  <Text style={styles.cardSub} numberOfLines={1}>
                    {card.sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Quick Leadership Actions */}
          <Text style={styles.sectionHeading}>DIRECT ACTIONS</Text>
          <View style={styles.actionsContainer}>
            {isPlatformSuperAdmin && (
              <TouchableOpacity
                style={[styles.actionBtnPrimaryFull, { backgroundColor: primaryBtnBg }]}
                onPress={onOpenCreateCell}
                activeOpacity={0.85}
              >
                <PlusCircle size={18} color={primaryBtnText} strokeWidth={2.4} style={{ marginRight: 8 }} />
                <Text style={[styles.actionBtnPrimaryTxt, { color: primaryBtnText }]} numberOfLines={1}>
                  New Care Cell
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.actionsSubRow}>
              <TouchableOpacity
                style={[
                  styles.actionBtnSecondaryHalf,
                  { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder },
                ]}
                onPress={onOpenCreateMeeting}
                activeOpacity={0.85}
              >
                <CalendarPlus size={17} color={secondaryBtnText} strokeWidth={2.2} style={{ marginRight: 7 }} />
                <Text style={[styles.actionBtnSecondaryTxt, { color: secondaryBtnText }]} numberOfLines={1}>
                  Schedule Meeting
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionBtnTertiaryHalf,
                  isDark && {
                    backgroundColor: 'rgba(5, 150, 105, 0.16)',
                    borderColor: 'rgba(16, 185, 129, 0.35)',
                  },
                ]}
                onPress={() => onNavigateTab(4)}
                activeOpacity={0.85}
              >
                <ClipboardCheck size={17} color={isDark ? '#34D399' : '#059669'} strokeWidth={2.2} style={{ marginRight: 7 }} />
                <Text
                  style={[styles.actionBtnTertiaryTxt, isDark && { color: '#34D399' }]}
                  numberOfLines={1}
                >
                  Mark Attendance
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Guidelines Banner */}
          <View style={styles.guidelineBanner}>
            <Sparkles size={18} color="#D97706" style={{ marginRight: 10, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.guidelineTitle}>Care Cell Ministry Philosophy</Text>
              <Text style={styles.guidelineBody}>
                Care Cells foster deep fellowship, pastoral warmth, and authentic Bible study. Cell leaders guide their members through prayer, regular follow-up visits, and active attendance roll-calls.
              </Text>
            </View>
          </View>
        </>
      )}

      {/* ── Clean User-Friendly Month & Year Selection Modal ── */}
      <Modal
        visible={showDatePickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePickerModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDatePickerModal(false)}
        >
          <TouchableOpacity
            style={styles.modalCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CalendarDays size={20} color={primaryText} />
                <Text style={styles.modalTitle}>Select Period</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowDatePickerModal(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={18} color={secondaryText} />
              </TouchableOpacity>
            </View>

            {/* Year Selector (Centered, Cohesive Stepper) */}
            <View style={styles.yearRow}>
              <TouchableOpacity
                style={[styles.yearNavBtn, { backgroundColor: cardSurface, borderColor: secondaryBtnBorder }]}
                onPress={() => setPickerYear((y) => y - 1)}
                activeOpacity={0.7}
              >
                <ChevronLeft size={18} color={primaryText} strokeWidth={2.4} />
              </TouchableOpacity>
              <View style={styles.yearDisplay}>
                <Text style={[styles.yearText, { color: primaryText }]}>{pickerYear}</Text>
              </View>
              <TouchableOpacity
                style={[styles.yearNavBtn, { backgroundColor: cardSurface, borderColor: secondaryBtnBorder }]}
                onPress={() => setPickerYear((y) => y + 1)}
                activeOpacity={0.7}
              >
                <ChevronRight size={18} color={primaryText} strokeWidth={2.4} />
              </TouchableOpacity>
            </View>

            {/* 12 Months Grid: Guaranteed 4 Quarters x 3 Columns */}
            <View style={styles.monthsGrid}>
              {MONTH_QUARTERS.map((quarter, qIdx) => (
                <View key={`quarter-${qIdx}`} style={styles.monthQuarterRow}>
                  {quarter.map((m) => {
                    const isSelected = selectedMonth === m.num && selectedYear === pickerYear;
                    const isCurrentCalendarMonth =
                      now.getMonth() + 1 === m.num && now.getFullYear() === pickerYear;

                    return (
                      <TouchableOpacity
                        key={m.num}
                        style={[
                          styles.monthItemBtn,
                          isSelected && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg },
                          !isSelected && isCurrentCalendarMonth && styles.monthItemBtnCurrent,
                        ]}
                        onPress={() => {
                          setSelectedMonth(m.num);
                          setSelectedYear(pickerYear);
                          setShowDatePickerModal(false);
                        }}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.monthItemTxt,
                            isSelected && { color: primaryBtnText, fontWeight: '800' },
                            !isSelected && isCurrentCalendarMonth && styles.monthItemTxtCurrent,
                          ]}
                        >
                          {m.name}
                        </Text>
                        {isSelected && (
                          <Check size={13} color={primaryBtnText} strokeWidth={3} style={{ marginLeft: 4 }} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Quick Actions Footer (Balanced Equal Width Buttons) */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.thisMonthBtn, { backgroundColor: secondaryBtnBg, borderColor: secondaryBtnBorder }]}
                onPress={() => {
                  setSelectedMonth(now.getMonth() + 1);
                  setSelectedYear(now.getFullYear());
                  setPickerYear(now.getFullYear());
                  setShowDatePickerModal(false);
                }}
                activeOpacity={0.75}
              >
                <Sparkles size={14} color={secondaryBtnText} style={{ marginRight: 6 }} />
                <Text style={[styles.thisMonthBtnTxt, { color: secondaryBtnText }]}>This Month</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.applyBtn, { backgroundColor: primaryBtnBg }]}
                onPress={() => {
                  setSelectedYear(pickerYear);
                  setShowDatePickerModal(false);
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.applyBtnTxt, { color: primaryBtnText }]}>Done</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = createAdminThemedStyles({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
  },
  periodBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  periodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  calendarIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodTextGroup: {
    flex: 1,
  },
  periodMiniLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  periodValue: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  periodStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  filterRow: {
    marginBottom: 14,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterChipTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  filterChipTxtActive: {
    color: '#FFFFFF',
  },
  loadingWrap: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTxt: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 8,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  modernCard: {
    width: (width - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1.5,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardArrowWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  cardTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 4,
  },
  cardSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },
  actionsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  actionBtnPrimaryFull: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnPrimaryTxt: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  actionsSubRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  actionBtnSecondaryHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
  },
  actionBtnSecondaryTxt: {
    color: '#0F172A',
    fontSize: 12.5,
    fontWeight: '800',
    flexShrink: 1,
  },
  actionBtnTertiaryHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1.2,
    borderColor: '#A7F3D0',
    overflow: 'hidden',
  },
  actionBtnTertiaryTxt: {
    color: '#059669',
    fontSize: 12.5,
    fontWeight: '800',
    flexShrink: 1,
  },
  guidelineBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
  },
  guidelineTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 4,
  },
  guidelineBody: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
    gap: 16,
  },
  yearNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  yearDisplay: {
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A2D5A',
    letterSpacing: 0.2,
  },
  monthsGrid: {
    marginBottom: 14,
  },
  monthQuarterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  monthItemBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthItemBtnSelected: {
    backgroundColor: '#1A2D5A',
    borderColor: '#1A2D5A',
    shadowColor: '#1A2D5A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2.5,
  },
  monthItemBtnCurrent: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  monthItemTxt: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#334155',
  },
  monthItemTxtSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  monthItemTxtCurrent: {
    color: '#2563EB',
    fontWeight: '800',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
    marginTop: 2,
  },
  thisMonthBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    gap: 6,
  },
  thisMonthBtnTxt: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  applyBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  applyBtnTxt: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
