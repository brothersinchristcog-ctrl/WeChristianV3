import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, ScrollView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, CalendarCheck, Check, X, Clock, Lock } from 'lucide-react-native';
import FirestoreService from '../services/FirestoreService';
import { useAuth } from '../context/AuthContext';
import { useChurch } from '../context/ChurchContext';

const COLORS = {
  ink: '#1a2d5a',
  gold: '#FCD34D',
  bg: '#EDE8DC',
  paper: '#FFFCF5',
  rule: '#DED0AC',
  inkSoft: '#6B7593',
  green: '#15803D',
  red: '#be185d',
};

export default function AttendanceScreen({ navigation }: any) {
  const { member, user } = useAuth();
  const { activeChurch } = useChurch();

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<any>(null);
  const [now, setNow] = useState(Date.now());

  const [response, setResponse] = useState<'Yes' | 'No' | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // showBanner = true only after the user actively submits
  const [showBanner, setShowBanner] = useState(false);
  const [previousResponse, setPreviousResponse] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveRequest();
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, [activeChurch]);

  const fetchActiveRequest = async () => {
    try {
      const activeReq = await FirestoreService.getActiveAttendanceRequest();
      if (activeReq) {
        setRequest(activeReq);
        const memberId = member?.id || user?.uid;
        if (memberId) {
          const existing: any = await FirestoreService.getMemberAttendanceResponse(activeReq.id, memberId);
          if (existing) {
            // Pre-fill the form with previous response but DON'T show banner yet
            setResponse(existing.response);
            setReason(existing.reason || '');
            setPreviousResponse(existing.response);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!response) {
      Alert.alert('Required', 'Please select Yes or No.');
      return;
    }
    if (response === 'No' && !reason.trim()) {
      Alert.alert('Required', 'Please provide a reason for not attending.');
      return;
    }
    if (!isWindowActive()) {
      Alert.alert('Window Closed', 'The attendance window for this event has closed.');
      return;
    }

    setIsSubmitting(true);
    try {
      const memberId = member?.id || user?.uid;
      const memberName = member?.name || member?.firstName || user?.displayName || 'Unknown';
      if (!memberId || !request) return;

      await FirestoreService.submitAttendanceResponse(request.id, memberId, memberName, response, reason.trim());
      setPreviousResponse(response);
      setShowBanner(true);
    } catch (e) {
      Alert.alert('Error', 'Failed to submit response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeResponse = () => {
    setShowBanner(false);
  };

  const isWindowActive = () => {
    if (!request) return false;
    if (!request.endTime) return true;
    const start = request.startTime ? new Date(request.startTime).getTime() : 0;
    const end = new Date(request.endTime).getTime();
    return now >= start && now < end;
  };

  const isExpired = () => !!(request?.endTime && now >= new Date(request.endTime).getTime());
  const isNotYetOpen = () => !!(request?.startTime && now < new Date(request.startTime).getTime());

  const formatTimeStr = (iso: string) => {
    const d = new Date(iso);
    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.ink} />
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: COLORS.bg }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color="#fff" />
          <Text style={styles.backTxt}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!request ? (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 48 }]}>
            <CalendarCheck size={52} color={COLORS.inkSoft} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>No Active Requests</Text>
            <Text style={styles.emptySub}>There are no active attendance requests from the church at this time.</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {/* Request Title */}
            <View style={styles.reqHeader}>
              <CalendarCheck size={22} color={COLORS.ink} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.reqTitle}>{request.title}</Text>
                <Text style={styles.reqDate}>
                  {new Date(request.createdAt?.toDate?.() || Date.now())
                    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
                {request.startTime && request.endTime && (
                  <View style={styles.timeWindowRow}>
                    <Clock size={12} color={isExpired() ? '#ef4444' : COLORS.gold} />
                    <Text style={[styles.timeWindowTxt, { color: isExpired() ? '#ef4444' : COLORS.inkSoft }]}>
                      {formatTimeStr(request.startTime)} – {formatTimeStr(request.endTime)}
                      {isExpired() ? '  (Closed)' : isNotYetOpen() ? '  (Not open yet)' : '  (Open)'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {request.description ? (
              <Text style={styles.reqDesc}>{request.description}</Text>
            ) : null}

            <View style={styles.divider} />

            {/* ── Window Closed State ── */}
            {isExpired() ? (
              <View style={styles.closedBanner}>
                <Lock size={32} color="#94a3b8" style={{ marginBottom: 12 }} />
                <Text style={styles.closedTitle}>Attendance Window Closed</Text>
                <Text style={styles.closedSub}>
                  The attendance window for this event closed at {formatTimeStr(request.endTime)}.
                  {previousResponse ? `\nYour recorded response was: ${previousResponse}.` : ' No response was recorded.'}
                </Text>
              </View>
            ) : isNotYetOpen() ? (
              <View style={styles.closedBanner}>
                <Clock size={32} color={COLORS.gold} style={{ marginBottom: 12 }} />
                <Text style={[styles.closedTitle, { color: COLORS.ink }]}>Not Open Yet</Text>
                <Text style={styles.closedSub}>
                  Attendance opens at {formatTimeStr(request.startTime)}. Please come back then.
                </Text>
              </View>
            ) : (
              /* ── Show banner only after active submission ── */
              showBanner ? (
              <View>
                <View style={[
                  styles.successBanner,
                  { backgroundColor: response === 'Yes' ? '#F3EAD9' : '#fff1f2', borderColor: response === 'Yes' ? COLORS.rule : '#fecdd3' }
                ]}>
                  {response === 'Yes'
                    ? <CalendarCheck color={COLORS.ink} size={28} />
                    : <X color={COLORS.red} size={28} />
                  }
                  <View style={{ marginLeft: 16, flex: 1 }}>
                    <Text style={[styles.successTitle, { color: response === 'Yes' ? COLORS.ink : '#9f1239' }]}>
                      Response Recorded ✓
                    </Text>
                    <Text style={[styles.successSub, { color: response === 'Yes' ? '#334155' : COLORS.red }]}>
                      You selected <Text style={{ fontWeight: '700' }}>{response}</Text>.
                      {reason ? `  Reason: ${reason}` : ''}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.changeBtn} onPress={handleChangeResponse}>
                  <Text style={styles.changeBtnTxt}>Change My Response</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // ── Response Form ──
              <View style={styles.form}>
                <Text style={styles.formLabel}>Will you attend this event?</Text>

                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={[styles.radioBtn, response === 'Yes' && styles.radioBtnYes]}
                    onPress={() => setResponse('Yes')}
                  >
                    <Check color={response === 'Yes' ? '#fff' : COLORS.inkSoft} size={20} />
                    <Text style={[styles.radioTxt, { color: response === 'Yes' ? '#fff' : COLORS.inkSoft }]}>
                      Yes, I'm going
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.radioBtn, response === 'No' && styles.radioBtnNo]}
                    onPress={() => setResponse('No')}
                  >
                    <X color={response === 'No' ? '#fff' : COLORS.inkSoft} size={20} />
                    <Text style={[styles.radioTxt, { color: response === 'No' ? '#fff' : COLORS.inkSoft }]}>
                      No, I can't
                    </Text>
                  </TouchableOpacity>
                </View>

                {response === 'No' && (
                  <View style={styles.reasonBlock}>
                    <Text style={styles.inputLabel}>Reason for not attending *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Please let us know why..."
                      placeholderTextColor={COLORS.inkSoft}
                      value={reason}
                      onChangeText={setReason}
                      multiline
                    />
                  </View>
                )}

                {previousResponse && (
                  <Text style={styles.previousHint}>
                    Previously responded: <Text style={{ fontWeight: '700' }}>{previousResponse}</Text>
                  </Text>
                )}

                <TouchableOpacity
                  style={[styles.submitBtn, { opacity: (isSubmitting || !response) ? 0.6 : 1 }]}
                  onPress={handleSubmit}
                  disabled={isSubmitting || !response}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitBtnTxt}>Submit Response</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    backgroundColor: COLORS.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: COLORS.ink, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', width: 70 },
  backTxt: { color: '#fff', fontSize: 15, fontWeight: '600', marginLeft: 2 },
  headerTitle: { color: COLORS.gold, fontSize: 18, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  content: { padding: 16 },

  card: {
    backgroundColor: COLORS.paper,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.rule,
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12,
  },
  reqHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  reqTitle: { fontSize: 20, fontWeight: '800', color: COLORS.ink, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  reqDate: { fontSize: 13, color: COLORS.inkSoft, marginTop: 2 },
  reqDesc: { fontSize: 15, lineHeight: 22, color: COLORS.inkSoft, marginBottom: 8 },
  divider: { height: 1, backgroundColor: COLORS.rule, marginVertical: 20 },

  form: {},
  formLabel: { fontSize: 17, fontWeight: '700', color: COLORS.ink, marginBottom: 16, textAlign: 'center' },
  radioGroup: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  radioBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 14, borderWidth: 2, borderColor: COLORS.rule,
    backgroundColor: '#F3EAD9', gap: 8
  },
  radioBtnYes: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
  radioBtnNo: { backgroundColor: COLORS.red, borderColor: COLORS.red },
  radioTxt: { fontSize: 15, fontWeight: '700' },

  reasonBlock: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: COLORS.ink, marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: COLORS.rule, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: COLORS.ink, height: 100,
    textAlignVertical: 'top', backgroundColor: '#F9F5ED'
  },

  previousHint: { fontSize: 12, color: COLORS.inkSoft, textAlign: 'center', marginBottom: 12, fontStyle: 'italic' },

  submitBtn: { backgroundColor: COLORS.green, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  submitBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  successBanner: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16, borderWidth: 1 },
  successTitle: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  successSub: { fontSize: 14, lineHeight: 20 },

  changeBtn: { marginTop: 14, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.ink, alignItems: 'center' },
  changeBtnTxt: { color: COLORS.ink, fontSize: 14, fontWeight: '700' },

  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.ink, marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 14, color: COLORS.inkSoft, textAlign: 'center', lineHeight: 22 },

  // Time window
  timeWindowRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  timeWindowTxt: { fontSize: 12, fontWeight: '600' },

  // Closed state
  closedBanner: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 16 },
  closedTitle: { fontSize: 18, fontWeight: '800', color: '#475569', marginBottom: 8, textAlign: 'center' },
  closedSub: { fontSize: 14, color: COLORS.inkSoft, textAlign: 'center', lineHeight: 22 },
});
