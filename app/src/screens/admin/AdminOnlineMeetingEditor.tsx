import React, { useState, useContext, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  Dimensions,
  StatusBar,
  Animated,
  Switch
} from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { 
  Search, 
  ChevronDown, 
  ChevronLeft,
  FileText,
  Calendar as CalendarIcon,
  Video,
  Clock,
  Type,
  CheckCircle2,
  AlertCircle,
  Save,
  Link as LinkIcon,
  Key,
  X,
  Radio,
  Tv,
  Globe,
  Lock,
  EyeOff
} from 'lucide-react-native';
import { AdminTabContext } from '../../context/AdminTabContext';
import { useAuth } from '../../context/AuthContext';
import { useChurch } from '../../context/ChurchContext';
import firestore from '@react-native-firebase/firestore';
import { functions } from '../../services/firebaseConfig';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { createZoomMeeting } from '../../services/ZoomService';
import { YouTubeLiveService } from '../../services/YouTubeLiveService';

const { width } = Dimensions.get('window');

// Feature flag: set to true in future when church upgrades Zoom to Pro
const SHOW_YOUTUBE_LIVE = false;



export default function AdminOnlineMeetingEditor() {
  const { setActiveTab, editingData, setEditingData, setTabByName } = useContext(AdminTabContext);
  const { member } = useAuth();
  const { activeChurch } = useChurch();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState({ title: '', sub: '' });
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [generatingMeet, setGeneratingMeet] = useState(false);
  const [ytStatus, setYtStatus] = useState<any>(null);
  const [ytLoading, setYtLoading] = useState(false);
  const toastAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (!activeChurch?.id) return;
    const unsub = firestore()
      .collection('churches')
      .doc(activeChurch.id)
      .collection('settings')
      .doc('youtube_channel')
      .onSnapshot(doc => {
        const exists = typeof (doc as any).exists === 'function' ? (doc as any).exists() : Boolean((doc as any).exists);
        if (doc && exists) {
          const data = doc.data();
          setYtStatus({
            isConnected: Boolean(data?.isConnected),
            channelId: data?.channelId,
            channelTitle: data?.channelTitle,
          });
        } else {
          setYtStatus({ isConnected: false });
        }
      });
    return () => unsub();
  }, [activeChurch?.id]);

  const handleConnectYouTube = async () => {
    if (!activeChurch?.id) {
      Alert.alert('Error', 'Please select an active church.');
      return;
    }
    setYtLoading(true);
    try {
      await YouTubeLiveService.connectYouTubeChannel(activeChurch.id);
    } catch (e: any) {
      Alert.alert('Connection Failed', e?.message || 'Could not initiate YouTube authorization.');
    } finally {
      setYtLoading(false);
    }
  };

  useEffect(() => {
    if (showSuccess) {
      Animated.spring(toastAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
        tension: 40
      }).start();
    } else {
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start();
    }
  }, [showSuccess]);




  const generateMeetLinkWithToken = async (accessToken: string) => {
    const res = await fetch('https://meet.googleapis.com/v2/spaces', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config: { accessType: 'OPEN' }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || 'Failed to create Meet space');
    }

    const data = await res.json();
    const meetLink = data.meetingUri;
    
    if (meetLink) {
      setForm(prev => ({ ...prev, meetingLink: meetLink }));
      setSuccessMsg({ title: 'Link Generated!', sub: 'Google Meet link successfully created.' });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    } else {
      throw new Error("No meeting URI returned from Meet API.");
    }
  };

  const handleGenerateMeetLink = async () => {
    setGeneratingMeet(true);
    try {
      GoogleSignin.configure({
        scopes: ['https://www.googleapis.com/auth/meetings.space.created'],
        offlineAccess: false,
        webClientId: '962252889183-jomnitu1s1317td9fmdq9qbo7d8sdbhb.apps.googleusercontent.com',
      });
      await GoogleSignin.hasPlayServices();

      let accessToken: string | null = null;
      try {
        await GoogleSignin.hasPlayServices();
        try {
          await GoogleSignin.signInSilently();
          const tokens = await GoogleSignin.getTokens();
          accessToken = tokens.accessToken;
        } catch (silentError) {
          // If silent fails, force sign out just to clear any corrupted state
          await GoogleSignin.signOut().catch(() => {});
          
          // Interactive sign-in
          await GoogleSignin.signIn();
          const tokens = await GoogleSignin.getTokens();
          accessToken = tokens.accessToken;
        }
      } catch (authError: any) {
        if (authError?.message?.includes('getTokens requires a user to be signed in')) {
          // Sometimes native state gets out of sync on Android
          await GoogleSignin.signOut().catch(() => {});
          throw new Error('Google Sign-In state was interrupted. Please try clicking Generate Link again.');
        }
        throw authError; // Pass other errors to the outer catch
      }

      if (!accessToken) {
        throw new Error('No access token received from Google.');
      }

      await generateMeetLinkWithToken(accessToken);

    } catch (error: any) {
      if (error?.message?.includes('SIGN_IN_CANCELLED')) {
        // User cancelled the sign-in flow, stop gracefully
        setGeneratingMeet(false);
        return;
      }
      
      if (error?.message?.includes('UNAUTHENTICATED') || error?.message?.includes('401') || error?.message?.includes('invalid authentication credentials')) {
        // The token was revoked from Google Account settings or expired
        await GoogleSignin.signOut().catch(() => {});
        setErrorMsg('Session expired or access revoked. Please click Generate Link again to reconnect.');
        setShowError(true);
        setGeneratingMeet(false);
        return;
      }

      if (error?.message?.includes('403') || error?.message?.includes('PERMISSION_DENIED') || error?.message?.includes('insufficient')) {
        setErrorMsg('Permission denied. Please ensure you check the box to allow Meet space creation during sign-in.');
        setShowError(true);
        // Force sign out so they can try again and check the box
        await GoogleSignin.signOut().catch(() => {});
        setGeneratingMeet(false);
        return;
      }

      console.error(error);
      setErrorMsg(error.message || 'Google Sign-In failed.');
      setShowError(true);
    } finally {
      setGeneratingMeet(false);
    }
  };


  const handleGenerateZoomLink = async () => {
    if (!form.title.trim()) {
      setErrorMsg("Please enter a Meeting Title first.");
      setShowError(true);
      return;
    }

    if (SHOW_YOUTUBE_LIVE && form.enableYouTubeLive && !ytStatus?.isConnected) {
      setErrorMsg("Please connect your Church YouTube Channel first using the red button below, or turn off 'Stream to YouTube Live'.");
      setShowError(true);
      return;
    }

    setGeneratingMeet(true);
    try {
      if (SHOW_YOUTUBE_LIVE && form.enableYouTubeLive) {
        // Create Zoom meeting AND provision YouTube Live broadcast + stream
        const ytData = await YouTubeLiveService.createZoomWithYouTubeLive({
          churchId: activeChurch?.id || '',
          title: form.title,
          description: form.description || form.bibleBook || '',
          startTime: form.startTime,
          endTime: form.endTime,
          durationMinutes: Math.max(15, Math.round((form.endTime.getTime() - form.startTime.getTime()) / (60 * 1000))),
          enableYouTubeLive: true,
          privacy: form.youtubePrivacy,
        });

        if (ytData && ytData.zoomJoinUrl) {
          setForm(prev => ({
            ...prev,
            meetingLink: ytData.zoomJoinUrl || '',
            meetingId: ytData.zoomMeetingId || '',
            password: ytData.zoomPassword || prev.password,
            youtubeLive: ytData.youtubeLive,
          }));
          const passText = ytData.zoomPassword ? ` • Passcode: ${ytData.zoomPassword}` : '';
          setSuccessMsg({
            title: 'Zoom + YouTube Live Created!',
            sub: `Zoom ID: ${ytData.zoomMeetingId || ''}${passText} • Stream linked to YouTube`,
          });
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3500);
        } else {
          throw new Error('Could not create Zoom + YouTube stream.');
        }
      } else {
        // Standard Zoom meeting creation
        const data = await createZoomMeeting({
          title: form.title,
          description: form.description || form.bibleBook || '',
          startTime: form.startTime,
          endTime: form.endTime,
          churchId: activeChurch?.id,
        });

        if (data && data.meetingUrl) {
          setForm(prev => ({ 
            ...prev, 
            meetingLink: data.meetingUrl,
            meetingId: data.meetingId || '',
            password: data.password || '',
            youtubeLive: null,
          }));
          const passText = data.password ? ` • Passcode: ${data.password}` : '';
          setSuccessMsg({ 
            title: 'Zoom Link Generated!', 
            sub: `Meeting ID: ${data.meetingId || ''}${passText}` 
          });
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        } else {
          throw new Error('No Zoom meeting link returned.');
        }
      }
    } catch (err: any) {
      console.error('[handleGenerateZoomLink] Error:', err);
      const msg = err?.message || 'Failed to generate Zoom meeting. Please check backend credentials.';
      setErrorMsg(msg);
      setShowError(true);
    } finally {
      setGeneratingMeet(false);
    }
  };

  const handleGenerateLink = () => {
    if (form.provider === 'zoom') {
      handleGenerateZoomLink();
    } else {
      handleGenerateMeetLink();
    }
  };

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState<'start' | 'end'>('start');

  const [form, setForm] = useState({
    title: '', // Re-purposed as Topic/Theme
    bibleBook: '',
    teacher: '',
    description: '',
    provider: 'google_meet',
    meetingLink: '',
    meetingId: '',
    password: '',
    date: new Date(),
    startTime: new Date(),
    endTime: new Date(new Date().getTime() + 60 * 60 * 1000),
    enableYouTubeLive: false,
    youtubePrivacy: 'public' as 'public' | 'unlisted' | 'private',
    youtubeLive: null as any,
  });

  useEffect(() => {
    if (editingData) {
      setForm(prev => ({
        ...prev,
        title: editingData.title || '',
        bibleBook: editingData.bibleBook || '',
        teacher: editingData.teacher || '',
        description: editingData.description || '',
        provider: editingData.provider || editingData.meetingType || 'google_meet',
        meetingLink: editingData.meetingLink || '',
        meetingId: editingData.meetingId || '',
        password: editingData.password || '',
        date: editingData.startTime ? new Date(editingData.startTime.seconds * 1000) : new Date(),
        startTime: editingData.startTime ? new Date(editingData.startTime.seconds * 1000) : new Date(),
        endTime: editingData.endTime ? new Date(editingData.endTime.seconds * 1000) : new Date(new Date().getTime() + 60 * 60 * 1000),
        enableYouTubeLive: Boolean(editingData.youtubeLive?.enabled),
        youtubePrivacy: editingData.youtubeLive?.privacy || 'public',
        youtubeLive: editingData.youtubeLive || null,
      }));
    }
  }, [editingData]);

  const handleDateConfirm = (selectedDate: Date) => {
    setShowDatePicker(false);
    
    // Update date portion of start and end times
    const updateTime = (timeObj: Date) => {
      const newTime = new Date(timeObj);
      newTime.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      return newTime;
    };

    setForm({ ...form, date: selectedDate, startTime: updateTime(form.startTime), endTime: updateTime(form.endTime) });
  };

  const handleTimeConfirm = (selectedTime: Date) => {
    setShowTimePicker(false);
    
    // Combine selected time with existing date
    const updatedTime = new Date(form.date);
    updatedTime.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);

    if (timePickerTarget === 'start') {
      // Auto-update end time to be 1 hour after new start time if end time is before start
      let newEndTime = form.endTime;
      if (updatedTime >= form.endTime) {
         newEndTime = new Date(updatedTime.getTime() + 60 * 60 * 1000);
      }
      setForm({ ...form, startTime: updatedTime, endTime: newEndTime });
    } else {
      setForm({ ...form, endTime: updatedTime });
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setErrorMsg("Title is required.");
      setShowError(true);
      return;
    }
    
    if (form.endTime <= form.startTime) {
      setErrorMsg("End time must be after start time.");
      setShowError(true);
      return;
    }



    if (!form.meetingLink.trim()) {
      setErrorMsg("Meeting Link is required. Please generate or paste one.");
      setShowError(true);
      return;
    }

    setLoading(true);
    try {
      if (!activeChurch?.id) throw new Error("No active church found.");

      const payload: any = {
        title: form.title,
        bibleBook: form.bibleBook,
        teacher: form.teacher,
        description: form.description,
        provider: form.provider || 'google_meet',
        meetingType: form.provider || 'google_meet',
        meetingLink: form.meetingLink,
        meetingId: form.meetingId || '',
        password: form.password || '',
        startTime: firestore.Timestamp.fromDate(form.startTime),
        endTime: firestore.Timestamp.fromDate(form.endTime),
        status: 'upcoming',
        createdAt: firestore.FieldValue.serverTimestamp()
      };

      if (form.youtubeLive) {
        payload.youtubeLive = form.youtubeLive;
      } else if (form.enableYouTubeLive && form.provider === 'zoom') {
        payload.youtubeLive = {
          enabled: true,
          privacy: form.youtubePrivacy,
          status: 'scheduled',
        };
      }
      
      if (editingData?.id) {
        await firestore().collection('churches').doc(activeChurch.id).collection('online_meetings').doc(editingData.id).update(payload);
      } else {
        const meetingRef = await firestore().collection('churches').doc(activeChurch.id).collection('online_meetings').add(payload);
        
        try {
          const timeStr = form.startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          const passNotice = form.password ? ` (Passcode: ${form.password})` : '';
          await firestore().collection('churches').doc(activeChurch.id).collection('broadcasts').add({
            title: `🎥 New Online Meeting`,
            content: `${form.title} has been scheduled for today at ${timeStr}.${passNotice}`,
            type: 'online_meeting',
            targetChurchId: activeChurch.id,
            createdAt: firestore.FieldValue.serverTimestamp(),
            meetingId: meetingRef.id,
            url: form.meetingLink || '',
            password: form.password || '',
            silent: true
          });
        } catch (bErr) {
          console.warn('Could not create broadcast for meeting:', bErr);
        }
      }
      
      setSuccessMsg({ 
        title: editingData ? 'Meeting Updated!' : 'Meeting Scheduled!', 
        sub: form.provider === 'zoom' ? 'Zoom meeting is saved.' : 'Google Meet is saved.' 
      });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        if (setTabByName) setTabByName('Online Meetings'); // Go back to Online Meetings list
        setEditingData(null);
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not save the meeting.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />
      
      {/* ── Hero Section (Unified Height & Alignment) ── */}
      <View style={styles.hero}>
        <View style={styles.heroTitleRow}>
          <TouchableOpacity 
            onPress={() => { if (setTabByName) setTabByName('Online Meetings'); }} 
            style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}
          >
            <ChevronLeft size={20} color="#fff" style={{ marginLeft: -4, marginRight: 2 }} />
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Back</Text>
          </TouchableOpacity>
          <Text style={[styles.heroTitle, { marginHorizontal: 12, opacity: 0.4 }]}>|</Text>
          <Text style={styles.heroTitle} numberOfLines={1}>Online Meetings</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Subtitle & Update Button Bar (below header text) */}
        <View style={styles.editorActionBar}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.editorSubText}>
              {editingData?.id 
                ? 'Update class schedule and details' 
                : (form.provider === 'zoom' ? 'Schedule a live session via Zoom API' : 'Schedule a live session via Google Meet')}
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.saveBtn, loading && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator size="small" color="#1a2d5a" /> : <Save size={16} color="#1a2d5a" />}
            <Text style={styles.saveBtnTxt}>{loading ? 'Scheduling...' : (editingData?.id ? 'Update' : 'Schedule')}</Text>
          </TouchableOpacity>
        </View>
        
        {/* Meeting Details */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Topic / Theme <Text style={{ color: '#DC2626' }}>*</Text></Text>
          <View style={styles.inputWrapper}>
            <Type size={18} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g., Sunday Service Broadcast"
              placeholderTextColor="#9CA3AF"
              value={form.title}
              onChangeText={t => setForm({ ...form, title: t })}
            />
          </View>

          <Text style={styles.inputLabel}>Bible Book / Passage</Text>
          <View style={styles.inputWrapper}>
            <FileText size={18} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g., John 3:16"
              placeholderTextColor="#9CA3AF"
              value={form.bibleBook}
              onChangeText={t => setForm({ ...form, bibleBook: t })}
            />
          </View>

          <Text style={styles.inputLabel}>Teacher / Host Name</Text>
          <View style={styles.inputWrapper}>
            <Type size={18} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g., Pastor John"
              placeholderTextColor="#9CA3AF"
              value={form.teacher}
              onChangeText={t => setForm({ ...form, teacher: t })}
            />
          </View>

          <Text style={styles.inputLabel}>
            {form.provider === 'zoom' ? 'Zoom Meeting Link ' : 'Google Meet Link '}
            <Text style={{ color: '#DC2626' }}>*</Text>
          </Text>
          <View style={[styles.inputWrapper, { paddingRight: 8 }]}>
            <LinkIcon size={18} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder={
                form.provider === 'zoom'
                  ? 'Paste Zoom link or generate one ->'
                  : 'Paste Meet link or generate one ->'
              }
              placeholderTextColor="#9CA3AF"
              value={form.meetingLink}
              onChangeText={t => setForm({ ...form, meetingLink: t })}
              autoCapitalize="none"
              keyboardType="url"
            />
            <TouchableOpacity 
              style={{
                backgroundColor: form.provider === 'zoom' ? '#2D8CFF' : '#2563EB',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 6,
                opacity: generatingMeet ? 0.7 : 1,
              }}
              onPress={handleGenerateLink}
              disabled={generatingMeet}
            >
              {generatingMeet ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                  {form.provider === 'zoom' ? 'Generate Zoom' : 'Generate Meet'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {form.provider === 'zoom' && (
            <>
              <Text style={styles.inputLabel}>Zoom Passcode (Required for Members)</Text>
              <View style={styles.inputWrapper}>
                <Key size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 123456"
                  placeholderTextColor="#9CA3AF"
                  value={form.password}
                  onChangeText={t => setForm({ ...form, password: t })}
                  autoCapitalize="none"
                />
              </View>

              {SHOW_YOUTUBE_LIVE && (
                <>
                  {/* YouTube Channel Connection Card inside Zoom section */}
                  {!ytStatus?.isConnected ? (
                    <View style={styles.ytRedConnectCard}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={styles.ytRedIconCircle}>
                          <Tv size={18} color="#DC2626" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.ytRedCardTitle}>Connect Church YouTube Channel</Text>
                          <Text style={styles.ytRedCardDesc}>
                            Authorize your church YouTube channel to stream this Zoom meeting live.
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.ytRedConnectBtn}
                        onPress={handleConnectYouTube}
                        disabled={ytLoading}
                      >
                        {ytLoading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Radio size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                            <Text style={styles.ytRedConnectBtnTxt}>Connect Church YouTube Channel</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.ytGreenConnectedCard}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <CheckCircle2 size={16} color="#16A34A" />
                        <View style={{ marginLeft: 8, flex: 1 }}>
                          <Text style={styles.ytGreenCardTitle}>
                            YouTube Connected: {ytStatus.channelTitle || 'Church Channel'}
                          </Text>
                          <Text style={styles.ytGreenCardSub}>
                            Ready to broadcast this Zoom meeting live to members
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* YouTube Live Stream Switch & Options */}
                  <View style={styles.ytSectionBox}>
                    <View style={styles.ytSwitchRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
                        <View style={styles.ytIconBadgeSmall}>
                          <Tv size={16} color="#DC2626" />
                        </View>
                        <View style={{ marginLeft: 10, flex: 1 }}>
                          <Text style={styles.ytSwitchTitle}>Stream to YouTube Live</Text>
                          <Text style={styles.ytSwitchSub}>
                            Automatically broadcast this Zoom meeting to YouTube
                          </Text>
                        </View>
                      </View>
                      <Switch
                        value={form.enableYouTubeLive}
                        onValueChange={(val) => setForm({ ...form, enableYouTubeLive: val })}
                        trackColor={{ false: '#D1D5DB', true: '#FCA5A5' }}
                        thumbColor={form.enableYouTubeLive ? '#DC2626' : '#9CA3AF'}
                      />
                    </View>

                    {form.enableYouTubeLive && (
                      <View style={styles.ytOptionsContainer}>
                        <Text style={styles.ytOptionLabel}>YouTube Privacy</Text>
                        <View style={styles.privacySelectorRow}>
                          <TouchableOpacity
                            style={[
                              styles.privacyOptionBtn,
                              form.youtubePrivacy === 'public' && styles.privacyOptionBtnActive
                            ]}
                            onPress={() => setForm({ ...form, youtubePrivacy: 'public' })}
                          >
                            <Globe size={14} color={form.youtubePrivacy === 'public' ? '#FFFFFF' : '#4B5563'} />
                            <Text style={[
                              styles.privacyOptionTxt,
                              form.youtubePrivacy === 'public' && styles.privacyOptionTxtActive
                            ]}>
                              Public
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.privacyOptionBtn,
                              form.youtubePrivacy === 'unlisted' && styles.privacyOptionBtnActive
                            ]}
                            onPress={() => setForm({ ...form, youtubePrivacy: 'unlisted' })}
                          >
                            <EyeOff size={14} color={form.youtubePrivacy === 'unlisted' ? '#FFFFFF' : '#4B5563'} />
                            <Text style={[
                              styles.privacyOptionTxt,
                              form.youtubePrivacy === 'unlisted' && styles.privacyOptionTxtActive
                            ]}>
                              Unlisted
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.privacyOptionBtn,
                              form.youtubePrivacy === 'private' && styles.privacyOptionBtnActive
                            ]}
                            onPress={() => setForm({ ...form, youtubePrivacy: 'private' })}
                          >
                            <Lock size={14} color={form.youtubePrivacy === 'private' ? '#FFFFFF' : '#4B5563'} />
                            <Text style={[
                              styles.privacyOptionTxt,
                              form.youtubePrivacy === 'private' && styles.privacyOptionTxtActive
                            ]}>
                              Private
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {form.youtubeLive?.watchUrl && (
                          <View style={styles.ytGeneratedLinkBox}>
                            <Radio size={13} color="#16A34A" />
                            <Text style={styles.ytGeneratedLinkText} numberOfLines={1}>
                              Live URL: {form.youtubeLive.watchUrl}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </>
              )}
            </>
          )}

          <Text style={styles.inputLabel}>Description / Agenda</Text>
          <View style={[styles.inputWrapper, { height: 100, alignItems: 'flex-start', paddingTop: 12 }]}>
            <FileText size={18} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="What will this meeting be about?"
              placeholderTextColor="#9CA3AF"
              value={form.description}
              onChangeText={t => setForm({ ...form, description: t })}
              multiline
            />
          </View>
        </View>

        {/* Schedule */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Schedule</Text>
          
          <Text style={styles.inputLabel}>Date</Text>
          <TouchableOpacity style={styles.inputWrapper} onPress={() => setShowDatePicker(true)}>
            <CalendarIcon size={18} color="#9CA3AF" style={styles.inputIcon} />
            <Text style={[styles.input, { color: '#111827', marginTop: 0, lineHeight: 50, textAlignVertical: 'center' }]}>
              {`${String(form.date.getDate()).padStart(2, '0')}/${String(form.date.getMonth() + 1).padStart(2, '0')}/${form.date.getFullYear()}`}
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Start Time</Text>
              <TouchableOpacity style={styles.inputWrapper} onPress={() => { setTimePickerTarget('start'); setShowTimePicker(true); }}>
                <Clock size={18} color="#9CA3AF" style={styles.inputIcon} />
                <Text style={[styles.input, { color: '#111827', marginTop: 0, lineHeight: 50, textAlignVertical: 'center' }]}>
                  {form.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>End Time</Text>
              <TouchableOpacity style={styles.inputWrapper} onPress={() => { setTimePickerTarget('end'); setShowTimePicker(true); }}>
                <Clock size={18} color="#9CA3AF" style={styles.inputIcon} />
                <Text style={[styles.input, { color: '#111827', marginTop: 0, lineHeight: 50, textAlignVertical: 'center' }]}>
                  {form.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.bottomSaveBtn, loading && { opacity: 0.7 }]} 
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator size="small" color="#1a2d5a" /> : <Save size={18} color="#1a2d5a" />}
          <Text style={styles.bottomSaveBtnTxt}>
            {loading ? 'Saving...' : (editingData?.id ? 'Update Meeting' : (form.provider === 'zoom' ? 'Schedule Zoom Meeting' : 'Schedule Google Meet'))}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Date Picker */}
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        date={form.date}
        onConfirm={handleDateConfirm}
        onCancel={() => setShowDatePicker(false)}
        minimumDate={new Date()}
      />

      {/* Time Picker */}
      <DateTimePickerModal
        isVisible={showTimePicker}
        mode="time"
        date={timePickerTarget === 'start' ? form.startTime : form.endTime}
        onConfirm={handleTimeConfirm}
        onCancel={() => setShowTimePicker(false)}
      />



      {/* Success Modal */}
      {showSuccess && (
        <View style={styles.toastOverlay} pointerEvents="none">
          <Animated.View style={[styles.premiumToastCard, {
            opacity: toastAnim,
            transform: [{
              translateY: toastAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0]
              })
            }, {
              scale: toastAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1]
              })
            }]
          }]}>
            <View style={styles.premiumToastIconBox}>
              <CheckCircle2 size={28} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.premiumToastTitle}>{successMsg.title}</Text>
              <Text style={styles.premiumToastSub}>{successMsg.sub}</Text>
            </View>
          </Animated.View>
        </View>
      )}

      {/* Error Modal */}
      {showError && (
        <View style={styles.toastOverlay}>
          <View style={[styles.toastCard, { borderColor: 'rgba(220,38,38,0.2)' }]}>
            <View style={[styles.toastIconBox, { backgroundColor: '#FEF2F2' }]}>
              <AlertCircle size={24} color="#DC2626" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toastTitle, { color: '#DC2626' }]}>Error</Text>
              <Text style={styles.toastSub}>{errorMsg}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowError(false)} style={{ padding: 4 }}>
              <X size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDE8DC' },
  scroll: { padding: 16, paddingBottom: 60 },
  
  // Hero Section (Unified across Online Meeting tab)
  hero: { 
    backgroundColor: '#1a2d5a', 
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 32,
    paddingBottom: 32,
    minHeight: 96,
    justifyContent: 'center',
    overflow: 'visible',
    position: 'relative',
  },
  heroTitleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'flex-start', 
    marginBottom: 0,
  },
  heroTitle: { 
    color: '#fff', 
    fontSize: 24, 
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', 
    fontWeight: '600', 
    letterSpacing: -0.5, 
    marginBottom: 0,
  },

  editorActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  editorSubText: {
    fontSize: 13,
    color: '#6B7593',
    fontWeight: '500',
    lineHeight: 18,
  },
  saveBtn: { 
    backgroundColor: '#C9A84C', 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    paddingHorizontal: 18, 
    paddingVertical: 9, 
    borderRadius: 12, 
    elevation: 4, 
    shadowColor: '#C9A84C', 
    shadowOpacity: 0.4, 
    shadowRadius: 6, 
    shadowOffset: { width: 0, height: 3 } 
  },
  saveBtnTxt: { 
    color: '#1a2d5a', 
    fontSize: 14, 
    fontWeight: '800' 
  },
  bottomSaveBtn: {
    backgroundColor: '#C9A84C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#C9A84C',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    marginTop: 8,
  },
  bottomSaveBtnTxt: {
    color: '#1a2d5a',
    fontSize: 15,
    fontWeight: '800',
  },

  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(26,45,90,0.06)', shadowColor: '#1a2d5a', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1a2d5a', marginBottom: 16 },

  inputLabel: { fontSize: 12, fontWeight: '700', color: '#4B5563', marginBottom: 8, marginTop: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, height: 50 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 50, color: '#111827', fontSize: 15 },
  
  dropdownBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, height: 54, marginBottom: 16 },
  dropdownTxt: { fontSize: 15, color: '#111827', fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(26,45,90,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1a2d5a', marginBottom: 20 },
  modalOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalOptionTxt: { fontSize: 16, color: '#4B5563' },

  toastOverlay: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center', zIndex: 999 },
  
  // Premium Success Toast
  premiumToastCard: { backgroundColor: '#10B981', borderRadius: 20, padding: 20, paddingRight: 24, flexDirection: 'row', alignItems: 'center', gap: 16, shadowColor: '#10B981', shadowOpacity: 0.4, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 8, maxWidth: '90%', minWidth: '85%' },
  premiumToastIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  premiumToastTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
  premiumToastSub: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 4, fontWeight: '500' },

  toastCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, paddingRight: 20, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6, maxWidth: '90%' },
  toastIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' },
  toastTitle: { fontSize: 14, fontWeight: '800', color: '#1a2d5a' },
  toastSub: { fontSize: 12, color: '#6B7280', marginTop: 2, fontWeight: '500' },

  // YouTube Live Form Section
  ytSectionBox: {
    backgroundColor: '#FFF1F2',
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  ytSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ytIconBadgeSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ytSwitchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
  },
  ytSwitchSub: {
    fontSize: 11,
    color: '#7F1D1D',
    marginTop: 1,
    lineHeight: 14,
  },
  ytOptionsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FECDD3',
  },
  ytOptionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991B1B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  privacySelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  privacyOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 8,
  },
  privacyOptionBtnActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  privacyOptionTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  privacyOptionTxtActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  ytGeneratedLinkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 6,
  },
  ytGeneratedLinkText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '600',
    flex: 1,
  },

  // YouTube Channel Connect Card in Zoom Form
  ytRedConnectCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
  },
  ytRedIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ytRedCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
  },
  ytRedCardDesc: {
    fontSize: 11,
    color: '#7F1D1D',
    marginTop: 2,
    lineHeight: 15,
  },
  ytRedConnectBtn: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  ytRedConnectBtnTxt: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  ytGreenConnectedCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  ytGreenCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  ytGreenCardSub: {
    fontSize: 11,
    color: '#166534',
    marginTop: 1,
  },
});
