import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Alert, Platform, Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CheckCircle, XCircle, Clock, Calendar, Users, Send, ChevronLeft, Plus, History, Trash2, AlarmClock, Edit2 } from 'lucide-react-native';
import { CustomAlert } from '../../components/CustomAlert';
import FirestoreService from '../../services/FirestoreService';
import { useChurch } from '../../context/ChurchContext';
import { AdminTabContext } from '../../context/AdminTabContext';

const COLORS = {
  ink: '#1a2d5a',
  paper: '#FFFCF5',
  gold: '#C9A84C',
  rule: '#DED0AC',
  bg: '#EDE8DC',
  inkSoft: '#6B7593',
  green: '#15803D',
};

const EVENT_TYPES = [
  { label: 'Sunday Service', value: 'Sunday Service' },
  { label: 'Bible Study', value: 'Bible Study' },
  { label: "Women's Fasting Prayer", value: "Women's Fasting Prayer" },
  { label: 'Prayer Meeting', value: 'Prayer Meeting' },
  { label: 'Youth Event', value: 'Youth Event' },
  { label: "Women's Ministry", value: "Women's Ministry" },
  { label: 'Fasting Prayer', value: 'Fasting Prayer' },
  { label: 'Special Service', value: 'Special Service' },
  { label: 'Conference', value: 'Conference' },
  { label: 'Outreach', value: 'Outreach' },
  { label: 'Other', value: 'Other' },
];

const formatTime = (date: Date) => {
  let h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
};

export default function AdminAttendance() {
  const { setActiveTab } = useContext(AdminTabContext);
  const { activeChurch } = useChurch();

  const [loading, setLoading] = useState(true);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'info' | 'error' | 'warning';
    buttons?: any[];
  }>({ visible: false, title: '', message: '', type: 'info' });

  // Form
  const [showNewForm, setShowNewForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Time Pickers
  const defaultStart = () => { const d = new Date(); return d; };
  const defaultEnd = () => { const d = new Date(); d.setHours(d.getHours() + 2, 0, 0, 0); return d; };
  const [startTime, setStartTime] = useState<Date>(defaultStart());
  const [endTime, setEndTime] = useState<Date>(defaultEnd());
  const [date, setDate] = useState<Date>(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);

  // Tick every minute to re-evaluate active/expired
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let unsubActive: any = null;
    let unsubResponses: any = null;

    const setupListeners = async () => {
      setLoading(true);
      try {
        const members = await FirestoreService.searchMembers('');
        setAllMembers(members);

        unsubActive = await FirestoreService.listenActiveAttendanceRequest(async (request) => {
          setActiveRequest(request);
          if (request) {
            if (unsubResponses) unsubResponses();
            unsubResponses = await FirestoreService.listenAttendanceResponses(request.id, (resps) => {
              setResponses(resps);
            });
          } else {
            setResponses([]);
          }
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    setupListeners();
    loadHistory();

    return () => {
      if (typeof unsubActive === 'function') unsubActive();
      if (typeof unsubResponses === 'function') unsubResponses();
    };
  }, [activeChurch]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const all = await FirestoreService.getAttendanceRequests();
      const historyWithStats = await Promise.all(all.map(async (req) => {
        const resps = await FirestoreService.getAttendanceResponses(req.id);
        const yesCount = resps.filter((r: any) => r.response === 'Yes').length;
        const noCount = resps.filter((r: any) => r.response === 'No').length;
        return { ...req, yesCount, noCount, responses: resps };
      }));
      setHistory(historyWithStats);
    } catch (e) {
      console.error('History load error:', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please select an event type.');
      return;
    }
    if (endTime <= startTime) {
      Alert.alert('Invalid Time', 'End time must be after start time.');
      return;
    }

    setIsSubmitting(true);
    try {
      const dateStr = date.toISOString().split('T')[0];
      const data = {
        title: title.trim(),
        description: description.trim(),
        date: dateStr,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      };

      if (editingRequestId) {
        await FirestoreService.updateAttendanceRequest(editingRequestId, data);
        setAlertConfig({
          visible: true,
          title: 'Updated',
          message: 'Event details updated successfully.',
          type: 'success'
        });
      } else {
        await FirestoreService.createAttendanceRequest(data);
        
        await FirestoreService.createNotificationBroadcast({
          title: 'Attendance Request',
          content: `Are you attending ${title.trim()} today? (Open until ${formatTime(endTime)})`,
          date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          type: 'attendance',
          targetUrl: 'AttendanceScreen',
        });

        setAlertConfig({
          visible: true,
          title: 'Success',
          message: `Attendance request sent! Members can respond from ${formatTime(startTime)} to ${formatTime(endTime)}.`,
          type: 'success'
        });
      }
      setShowNewForm(false);
      setEditingRequestId(null);
    } catch (e) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Failed to process request. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
      loadHistory();
    }
  };

  const handleEditRequest = () => {
    if (liveActiveRequest) {
      setTitle(liveActiveRequest.title);
      setDescription(liveActiveRequest.description || '');
      setStartTime(liveActiveRequest.startTime ? new Date(liveActiveRequest.startTime) : defaultStart());
      setEndTime(liveActiveRequest.endTime ? new Date(liveActiveRequest.endTime) : defaultEnd());
      setDate(liveActiveRequest.date ? new Date(liveActiveRequest.date) : new Date());
      setEditingRequestId(liveActiveRequest.id);
      setShowNewForm(true);
    }
  };

  const handleNewRequest = () => {
    setTitle('');
    setDescription('');
    setStartTime(defaultStart());
    setEndTime(defaultEnd());
    setDate(new Date());
    setEditingRequestId(null);
    setShowNewForm(true);
  };

  const handleDeleteRequest = (id: string, title: string) => {
    setAlertConfig({
      visible: true,
      title: 'Delete Request',
      message: `Are you sure you want to delete "${title}"? This cannot be undone.`,
      type: 'warning',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await FirestoreService.deleteAttendanceRequest(id);
              loadHistory();
              setAlertConfig({
                visible: true,
                title: 'Deleted',
                message: 'Attendance request deleted successfully.',
                type: 'success'
              });
            } catch (e) {
              setAlertConfig({
                visible: true,
                title: 'Error',
                message: 'Failed to delete request.',
                type: 'error'
              });
            }
          }
        }
      ]
    });
  };

  // Determine if the active request window is still open
  const isWindowOpen = (req: any) => {
    if (!req) return false;
    const end = req.endTime ? new Date(req.endTime).getTime() : null;
    const start = req.startTime ? new Date(req.startTime).getTime() : 0;
    if (!end) return true; // legacy: no endTime, treat as open
    return now >= start && now < end;
  };

  const isWindowExpired = (req: any) => {
    if (!req || !req.endTime) return false;
    return now >= new Date(req.endTime).getTime();
  };

  // Active request from realtime listener, but only show as "Active" if within window
  const liveActiveRequest = activeRequest && !isWindowExpired(activeRequest) ? activeRequest : null;

  const yesCount = responses.filter(r => r.response === 'Yes').length;
  const noCount = responses.filter(r => r.response === 'No').length;
  const noResponses = responses.filter(r => r.response === 'No');
  const yesResponses = responses.filter(r => r.response === 'Yes');
  const pendingMembers = allMembers.filter(m => !responses.find(r => r.memberId === m.id));

  const getTimeWindowLabel = (req: any) => {
    if (!req.startTime || !req.endTime) return null;
    return `${formatTime(new Date(req.startTime))} – ${formatTime(new Date(req.endTime))}`;
  };

  const getHistoryStatus = (req: any) => {
    if (!req.endTime) return req.status === 'Active' ? 'Active' : 'Closed';
    const end = new Date(req.endTime).getTime();
    if (Date.now() < end) return 'Active';
    return 'Closed';
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.ink} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Hero ── */}
      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <TouchableOpacity onPress={() => setActiveTab(0)} style={styles.heroBackBtn}>
            <ChevronLeft size={20} color="#fff" />
            <Text style={styles.heroBackTxt}>Back</Text>
          </TouchableOpacity>
          <View style={styles.heroDivider} />
          <View>
            <Text style={styles.heroTitle}>Attendance</Text>
            <Text style={styles.heroSub}>
              {liveActiveRequest ? `${responses.length} responses · ${pendingMembers.length} pending` : 'Manage attendance requests'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── New Request Form ── */}
        {(!liveActiveRequest || showNewForm) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Calendar color={COLORS.ink} size={22} />
              <Text style={styles.cardTitle}>{editingRequestId ? 'Edit Active Event' : 'New Attendance Request'}</Text>
            </View>

            <Text style={styles.inputLabel}>Select Event Type *</Text>
            <View style={styles.typeChipsRow}>
              {EVENT_TYPES.map(type => (
                <TouchableOpacity
                  key={type.value}
                  style={[styles.typeChip, title === type.value && styles.typeChipActive]}
                  onPress={() => setTitle(type.value)}
                >
                  <Text style={[styles.typeChipTxt, title === type.value && styles.typeChipTxtActive]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { marginTop: 8 }]}>Description (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Special guest speaker today..."
              placeholderTextColor={COLORS.inkSoft}
              value={description}
              onChangeText={setDescription}
              multiline
            />

            {/* ── Date Picker ── */}
            <Text style={styles.inputLabel}>Event Date *</Text>
            <TouchableOpacity style={[styles.timePicker, { marginBottom: 20 }]} onPress={() => setShowDatePicker(true)}>
              <Calendar size={16} color={COLORS.ink} />
              <Text style={styles.timePickerTxt}>{date.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</Text>
            </TouchableOpacity>

            {/* ── Time Window ── */}
            <Text style={styles.inputLabel}>Attendance Time Window *</Text>
            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Text style={styles.timeFieldLabel}>Start Time</Text>
                <TouchableOpacity style={styles.timePicker} onPress={() => setShowStartPicker(true)}>
                  <AlarmClock size={16} color={COLORS.gold} />
                  <Text style={styles.timePickerTxt}>{formatTime(startTime)}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.timeSeparator}>
                <Text style={styles.timeSeparatorTxt}>to</Text>
              </View>
              <View style={styles.timeField}>
                <Text style={styles.timeFieldLabel}>End Time</Text>
                <TouchableOpacity style={styles.timePicker} onPress={() => setShowEndPicker(true)}>
                  <AlarmClock size={16} color="#ef4444" />
                  <Text style={styles.timePickerTxt}>{formatTime(endTime)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Native TimePickers */}
            {showStartPicker && (
              <DateTimePicker
                value={startTime}
                mode="time"
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
                onChange={(_, selected) => {
                  setShowStartPicker(Platform.OS === 'ios');
                  if (selected) setStartTime(selected);
                }}
              />
            )}
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, selected) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selected) setDate(selected);
                }}
              />
            )}
            {showEndPicker && (
              <DateTimePicker
                value={endTime}
                mode="time"
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
                onChange={(_, selected) => {
                  setShowEndPicker(Platform.OS === 'ios');
                  if (selected) setEndTime(selected);
                }}
              />
            )}

            <View style={styles.formActions}>
              {liveActiveRequest && (
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowNewForm(false)}>
                  <Text style={styles.cancelBtnTxt}>Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.sendBtn, { opacity: (isSubmitting || !title) ? 0.6 : 1 }]}
                onPress={handleCreateRequest}
                disabled={isSubmitting || !title}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Send color="#fff" size={15} />
                    <Text style={styles.sendBtnTxt}>{editingRequestId ? 'Update Request' : 'Send Request'}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Active Request Dashboard ── */}
        {liveActiveRequest && !showNewForm && (
          <>
            <LinearGradient
              colors={['#1a2d5a', '#2c478a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.activeHeader, { flexDirection: 'column', alignItems: 'stretch' }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                <View style={styles.activeHeaderIconWrap}>
                  <Calendar color="#FCD34D" size={24} />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.activeHeaderLabel}>ACTIVE EVENT</Text>
                  <Text style={styles.activeTitle}>{liveActiveRequest.title}</Text>
                  {getTimeWindowLabel(liveActiveRequest) ? (
                    <View style={styles.timeWindowBadge}>
                      <Clock size={11} color="#FCD34D" />
                      <Text style={styles.timeWindowTxt}>{getTimeWindowLabel(liveActiveRequest)}</Text>
                    </View>
                  ) : (
                    <Text style={styles.activeDate}>
                      {new Date(liveActiveRequest.createdAt?.toDate?.() || Date.now())
                        .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </Text>
                  )}
                </View>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 10, marginTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 16, width: '100%' }}>
                <TouchableOpacity 
                  style={[styles.newBtnSolid, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', elevation: 0, shadowOpacity: 0 }]} 
                  onPress={handleEditRequest}
                >
                  <Edit2 size={14} color="#fff" />
                  <Text style={[styles.newBtnSolidTxt, { color: '#fff' }]}>Edit Event</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.newBtnSolid} onPress={handleNewRequest}>
                  <Plus size={14} color={COLORS.ink} />
                  <Text style={styles.newBtnSolidTxt}>New Event</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { borderColor: '#a7f3d0' }]}>
                <CheckCircle color="#10b981" size={22} />
                <Text style={[styles.statNum, { color: '#10b981' }]}>{yesCount}</Text>
                <Text style={styles.statLbl}>Attending</Text>
              </View>
              <View style={[styles.statCard, { borderColor: '#fecaca' }]}>
                <XCircle color="#ef4444" size={22} />
                <Text style={[styles.statNum, { color: '#ef4444' }]}>{noCount}</Text>
                <Text style={styles.statLbl}>Not Attending</Text>
              </View>
              <View style={[styles.statCard, { borderColor: '#fde68a' }]}>
                <Clock color="#f59e0b" size={22} />
                <Text style={[styles.statNum, { color: '#f59e0b' }]}>{pendingMembers.length}</Text>
                <Text style={styles.statLbl}>Pending</Text>
              </View>
            </View>

            {/* Attending */}
            {yesResponses.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Attending ({yesResponses.length})</Text>
                <View style={styles.listCard}>
                  {yesResponses.map((r, i) => (
                    <View key={r.memberId} style={[styles.listItem, i < yesResponses.length - 1 && styles.listItemBorder]}>
                      <View style={[styles.avatar, { backgroundColor: '#dbeafe' }]}>
                        <Text style={[styles.avatarTxt, { color: COLORS.ink }]}>{r.memberName?.charAt(0) || 'U'}</Text>
                      </View>
                      <Text style={styles.listName}>{r.memberName}</Text>
                      <CheckCircle size={16} color="#10b981" />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Not Attending */}
            {noResponses.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Not Attending ({noResponses.length})</Text>
                <View style={styles.listCard}>
                  {noResponses.map((r, i) => (
                    <View key={r.memberId} style={[styles.listItem, i < noResponses.length - 1 && styles.listItemBorder]}>
                      <View style={[styles.avatar, { backgroundColor: '#fee2e2' }]}>
                        <Text style={[styles.avatarTxt, { color: '#dc2626' }]}>{r.memberName?.charAt(0) || 'U'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.listName}>{r.memberName}</Text>
                        {r.reason ? <Text style={styles.reasonTxt}>"{r.reason}"</Text> : null}
                      </View>
                      <XCircle size={16} color="#ef4444" />
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {/* ── Attendance History ── */}
        {!showNewForm && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <History size={18} color={COLORS.ink} />
              <Text style={[styles.sectionTitle, { marginLeft: 8, marginBottom: 0 }]}>Attendance History</Text>
            </View>
            <Text style={styles.sectionSub}>All previously created attendance requests</Text>

            {historyLoading ? (
              <ActivityIndicator color={COLORS.ink} style={{ marginTop: 16 }} />
            ) : history.length === 0 ? (
              <View style={[styles.listCard, { padding: 24, alignItems: 'center' }]}>
                <Calendar size={36} color={COLORS.inkSoft} style={{ marginBottom: 8 }} />
                <Text style={{ color: COLORS.inkSoft, fontSize: 14, textAlign: 'center' }}>
                  No attendance requests yet. Create your first one above!
                </Text>
              </View>
            ) : (
              history.map((req) => {
                const pendingCount = allMembers.filter(m => !req.responses?.find((r: any) => r.memberId === m.id)).length;
                const totalResp = (req.yesCount || 0) + (req.noCount || 0);
                const date = req.date
                  ? new Date(req.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'N/A';
                const status = getHistoryStatus(req);
                const isActive = status === 'Active';
                const timeWindow = getTimeWindowLabel(req);

                return (
                  <View key={req.id} style={styles.historyCard}>
                    <View style={styles.historyCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.historyTitle}>{req.title}</Text>
                        <Text style={styles.historyDate}>{date}</Text>
                        {timeWindow && (
                          <View style={styles.historyTimeRow}>
                            <Clock size={11} color={COLORS.inkSoft} />
                            <Text style={styles.historyTimeTxt}>{timeWindow}</Text>
                          </View>
                        )}
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: isActive ? '#dcfce7' : '#f1f5f9' }]}>
                        <Text style={[styles.statusBadgeTxt, { color: isActive ? '#15803d' : COLORS.inkSoft }]}>
                          {isActive ? 'Active' : 'Closed'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteRequest(req.id, req.title)}
                        style={{ padding: 4, marginLeft: 8 }}
                      >
                        <Trash2 size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>

                    {/* Stats row */}
                    <View style={styles.historyStatsRow}>
                      <View style={styles.historyStatChip}>
                        <Text style={styles.historyStatChipNum}>{totalResp}</Text>
                        <Text style={styles.historyStatChipLbl}>Total</Text>
                      </View>
                      <View style={[styles.historyStatChip, { backgroundColor: '#f0fdf4' }]}>
                        <Text style={[styles.historyStatChipNum, { color: '#15803d' }]}>{req.yesCount || 0}</Text>
                        <Text style={styles.historyStatChipLbl}>Yes</Text>
                      </View>
                      <View style={[styles.historyStatChip, { backgroundColor: '#fef2f2' }]}>
                        <Text style={[styles.historyStatChipNum, { color: '#dc2626' }]}>{req.noCount || 0}</Text>
                        <Text style={styles.historyStatChipLbl}>No</Text>
                      </View>
                      <View style={[styles.historyStatChip, { backgroundColor: '#fffbeb' }]}>
                        <Text style={[styles.historyStatChipNum, { color: '#d97706' }]}>{pendingCount}</Text>
                        <Text style={styles.historyStatChipLbl}>Pending</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        <View style={{ height: 50 }} />
      </ScrollView>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { paddingBottom: 40 },

  // ── Hero ──
  hero: {
    backgroundColor: COLORS.ink,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 8,
    shadowColor: COLORS.ink, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12,
    marginBottom: 4,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroBackBtn: { flexDirection: 'row', alignItems: 'center' },
  heroBackTxt: { color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 2 },
  heroDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 14 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', letterSpacing: -0.3 },
  heroSub: { color: '#AEB8D4', fontSize: 12, marginTop: 2 },

  // ── Cards ──
  card: {
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: COLORS.paper, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.rule,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 20, gap: 10 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: COLORS.ink, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  // ── Form ──
  inputLabel: { fontSize: 12, fontWeight: '700', color: COLORS.ink, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  typeChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: '#F3EAD9' },
  typeChipActive: { backgroundColor: COLORS.ink },
  typeChipTxt: { fontSize: 13, fontWeight: '600', color: COLORS.ink },
  typeChipTxtActive: { color: COLORS.gold },
  input: {
    borderWidth: 1, borderColor: COLORS.rule, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
    color: COLORS.ink, height: 80, textAlignVertical: 'top',
    backgroundColor: '#F9F5ED', marginBottom: 20,
  },

  // Time Picker
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 20, gap: 8 },
  timeField: { flex: 1 },
  timeFieldLabel: { fontSize: 11, color: COLORS.inkSoft, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  timePicker: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8,
    backgroundColor: '#F9F5ED', borderRadius: 12, borderWidth: 1, borderColor: COLORS.rule,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  timePickerTxt: { fontSize: 15, fontWeight: '700', color: COLORS.ink },
  timeSeparator: { paddingTop: 20, alignItems: 'center' },
  timeSeparatorTxt: { fontSize: 13, color: COLORS.inkSoft, fontWeight: '600' },

  formActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelBtnTxt: { color: COLORS.inkSoft, fontSize: 14, fontWeight: '600' },
  sendBtn: {
    backgroundColor: COLORS.green, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  sendBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // ── Active Dashboard ──
  activeHeader: {
    marginHorizontal: 16, marginTop: 16, flexDirection: 'row', alignItems: 'center',
    padding: 20, borderRadius: 20, marginBottom: 18,
    elevation: 6, shadowColor: COLORS.ink, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  activeHeaderIconWrap: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center'
  },
  activeHeaderLabel: { fontSize: 10, fontWeight: '800', color: COLORS.gold, letterSpacing: 1, marginBottom: 4 },
  activeTitle: { fontSize: 20, fontWeight: '800', color: '#fff', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  activeDate: { fontSize: 13, color: '#aac4e8', marginTop: 2 },
  timeWindowBadge: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginTop: 4 },
  timeWindowTxt: { fontSize: 12, color: '#FCD34D', fontWeight: '600' },
  newBtnSolid: {
    backgroundColor: COLORS.gold, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, gap: 4,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  newBtnSolidTxt: { color: COLORS.ink, fontWeight: '800', fontSize: 13 },

  statsRow: { marginHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20, gap: 10 },
  statCard: {
    flex: 1, backgroundColor: COLORS.paper, borderRadius: 14, borderWidth: 1,
    padding: 14, alignItems: 'center', elevation: 1,
  },
  statNum: { fontSize: 22, fontWeight: '800', marginVertical: 6 },
  statLbl: { fontSize: 11, fontWeight: '600', color: COLORS.inkSoft, textAlign: 'center' },

  section: { marginHorizontal: 16, marginBottom: 24, marginTop: 8 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.ink, marginBottom: 12 },
  sectionSub: { fontSize: 12, color: COLORS.inkSoft, marginBottom: 14 },
  listCard: { backgroundColor: COLORS.paper, borderRadius: 14, borderWidth: 1, borderColor: COLORS.rule, overflow: 'hidden' },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  listItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.rule },
  avatar: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarTxt: { fontWeight: '700', fontSize: 15 },
  listName: { fontSize: 15, fontWeight: '600', color: COLORS.ink, flex: 1 },
  reasonTxt: { fontSize: 12, color: COLORS.inkSoft, marginTop: 2, fontStyle: 'italic' },

  // ── History Cards ──
  historyCard: {
    backgroundColor: COLORS.paper, borderRadius: 16, borderWidth: 1, borderColor: COLORS.rule,
    padding: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  historyCardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  historyTitle: { fontSize: 15, fontWeight: '700', color: COLORS.ink, marginBottom: 2, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  historyDate: { fontSize: 12, color: COLORS.inkSoft },
  historyTimeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginTop: 4 },
  historyTimeTxt: { fontSize: 11, color: COLORS.inkSoft, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginLeft: 8 },
  statusBadgeTxt: { fontSize: 11, fontWeight: '700' },

  // Stat chips in history card
  historyStatsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  historyStatChip: {
    flex: 1, backgroundColor: '#f8f4ec', borderRadius: 10,
    paddingVertical: 8, alignItems: 'center',
  },
  historyStatChipNum: { fontSize: 18, fontWeight: '800', color: COLORS.ink },
  historyStatChipLbl: { fontSize: 10, fontWeight: '600', color: COLORS.inkSoft, marginTop: 2 },
});
