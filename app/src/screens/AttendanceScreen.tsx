import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, CalendarCheck, Check, X } from 'lucide-react-native';
import FirestoreService from '../services/FirestoreService';
import { useAuth } from '../context/AuthContext';
import { useChurch } from '../context/ChurchContext';
import { useTheme } from '../context/ThemeContext';

export default function AttendanceScreen({ navigation, route }: any) {
  const { member, user } = useAuth();
  const { isDark } = useTheme();
  const { activeChurch } = useChurch();
  
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<any>(null);
  
  const [response, setResponse] = useState<'Yes' | 'No' | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyResponded, setAlreadyResponded] = useState(false);

  useEffect(() => {
    fetchActiveRequest();
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
            setResponse(existing.response);
            setReason(existing.reason || '');
            setAlreadyResponded(true);
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

    setIsSubmitting(true);
    try {
      const memberId = member?.id || user?.uid;
      const memberName = member?.name || member?.firstName || user?.displayName || 'Unknown';
      if (!memberId || !request) return;

      await FirestoreService.submitAttendanceResponse(request.id, memberId, memberName, response, reason.trim());
      
      Alert.alert('Success', 'Your attendance response has been submitted successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Error', 'Failed to submit response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const bgColor = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1a2d5a" />
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: bgColor }]}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Attendance</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!request ? (
          <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor }]}>
            <CalendarCheck size={48} color={subTextColor} style={{ marginBottom: 16 }} />
            <Text style={[styles.emptyTitle, { color: textColor }]}>No Active Requests</Text>
            <Text style={[styles.emptySub, { color: subTextColor }]}>There are currently no active attendance requests from the church.</Text>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.reqHeader}>
              <Text style={[styles.reqTitle, { color: textColor }]}>{request.title}</Text>
              <Text style={[styles.reqDate, { color: subTextColor }]}>
                {new Date(request.createdAt?.toDate?.() || Date.now()).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
            </View>
            
            {request.description ? (
              <Text style={[styles.reqDesc, { color: textColor }]}>{request.description}</Text>
            ) : null}

            {alreadyResponded ? (
              <View style={[styles.successBanner, { backgroundColor: response === 'Yes' ? '#F3EAD9' : '#fff1f2', borderColor: response === 'Yes' ? '#DED0AC' : '#fecdd3' }]}>
                {response === 'Yes' ? <CalendarCheck color="#1a2d5a" size={28} /> : <X color="#be185d" size={28} />}
                <View style={{ marginLeft: 16, flex: 1 }}>
                  <Text style={[styles.successTitle, { color: response === 'Yes' ? '#1a2d5a' : '#9f1239' }]}>
                    Response Recorded
                  </Text>
                  <Text style={[styles.successSub, { color: response === 'Yes' ? '#334155' : '#be185d' }]}>
                    You selected <Text style={{fontWeight: '700'}}>{response || 'No'}</Text>. {reason ? `Reason: ${reason}` : ''}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.form}>
                <Text style={[styles.formLabel, { color: textColor }]}>Will you attend today's event?</Text>
                
                <View style={styles.radioGroup}>
                  <TouchableOpacity 
                    style={[styles.radioBtn, response === 'Yes' && styles.radioBtnYes]} 
                    onPress={() => setResponse('Yes')}
                  >
                    <Check color={response === 'Yes' ? '#fff' : subTextColor} size={20} />
                    <Text style={[styles.radioTxt, response === 'Yes' && { color: '#fff', fontWeight: '700' }, !response && { color: subTextColor }]}>Yes, I'm going</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.radioBtn, response === 'No' && styles.radioBtnNo]} 
                    onPress={() => setResponse('No')}
                  >
                    <X color={response === 'No' ? '#fff' : subTextColor} size={20} />
                    <Text style={[styles.radioTxt, response === 'No' && { color: '#fff', fontWeight: '700' }, !response && { color: subTextColor }]}>No, I can't</Text>
                  </TouchableOpacity>
                </View>

                {response === 'No' && (
                  <View style={styles.reasonBlock}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Reason for not attending *</Text>
                    <TextInput
                      style={[styles.input, { color: textColor, borderColor }]}
                      placeholder="Please let us know why..."
                      placeholderTextColor={subTextColor}
                      value={reason}
                      onChangeText={setReason}
                      multiline
                    />
                  </View>
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
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    backgroundColor: '#1a2d5a',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: '#1a2d5a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitleWrap: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#FCD34D', fontSize: 18, fontWeight: '700' },
  
  content: { padding: 16 },
  
  card: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12
  },
  reqHeader: { marginBottom: 16 },
  reqTitle: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  reqDate: { fontSize: 13, fontWeight: '500' },
  reqDesc: { fontSize: 15, lineHeight: 24, marginBottom: 24 },
  
  successBanner: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16, borderWidth: 1, marginTop: 10 },
  successTitle: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  successSub: { fontSize: 14, lineHeight: 20 },
  
  form: { marginTop: 16 },
  formLabel: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  radioGroup: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  radioBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0', gap: 8 },
  radioBtnYes: { backgroundColor: '#1a2d5a', borderColor: '#1a2d5a' },
  radioBtnNo: { backgroundColor: '#be185d', borderColor: '#be185d' },
  radioTxt: { marginLeft: 8, fontSize: 15, fontWeight: '600' },
  
  reasonBlock: { marginBottom: 24 },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, height: 100, textAlignVertical: 'top' },
  
  submitBtn: { backgroundColor: '#1a2d5a', borderRadius: 12, paddingVertical: 18, alignItems: 'center' },
  submitBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  
  successBanner: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, borderRadius: 12, borderWidth: 1, marginTop: 16 },
  successTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  successSub: { fontSize: 14, lineHeight: 20 },
  
  emptyCard: { borderRadius: 20, padding: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 }
});
