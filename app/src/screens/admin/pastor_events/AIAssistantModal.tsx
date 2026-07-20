import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Easing
} from 'react-native';
import { colors, radius, spacing, typography } from '../../../theme/Theme';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { sendToGroq, Message, EventDraft, transcribeAudio } from '../../../services/groqApi';
import EventConfirmationCard from '../../../components/EventConfirmationCard';
import EventSuccessCard from '../../../components/EventSuccessCard';
import FirestoreService from '../../../services/FirestoreService';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

let globalActiveRecording: Audio.Recording | null = null;
const parseSafeDate = (dStr: string) => {
  let s = dStr.replace(' ', 'T');
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date() : d;
};

export default function AIAssistantModal({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "🙏 Hello Pastor! I can help you create an event. What are we planning?" }
  ]);
  const [selectedLang, setSelectedLang] = useState<'en' | 'te'>('en');

  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'assistant') {
      if (selectedLang === 'te') {
        setMessages([{ role: 'assistant', content: "🙏 ఓ పాస్టర్ గారు! నేను ఈవెంట్‌ను క్రియేట్ చేయడానికి మీకు సహాయం చేయగలను. మనం ఏమి ప్లాన్ చేస్తున్నాము?" }]);
      } else {
        setMessages([{ role: 'assistant', content: "🙏 Hello Pastor! I can help you create an event. What are we planning?" }]);
      }
    }
  }, [selectedLang]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [draft, setDraft] = useState<EventDraft>({});
  const [isConfirmationReady, setIsConfirmationReady] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [lastInputWasVoice, setLastInputWasVoice] = useState(false);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceState, setVoiceState] = useState<'idle'|'listening'|'thinking'|'speaking'>('idle');
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  
  const handleVoiceTapRef = useRef<() => Promise<void>>(async () => {});
  
  const scrollViewRef = useRef<ScrollView>(null);
  const isHandlingVoiceRef = useRef(false);

  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVoiceMode && voiceState === 'listening') {
      Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true
        })
      ).start();
    } else {
      waveAnim.stopAnimation();
      waveAnim.setValue(0);
    }
  }, [isVoiceMode, voiceState]);

  const opacity1 = waveAnim.interpolate({ inputRange: [0, 0.2, 0.4, 1], outputRange: [0.3, 1, 0.3, 0.3] });
  const opacity2 = waveAnim.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 1], outputRange: [0.3, 0.3, 1, 0.3, 0.3] });
  const opacity3 = waveAnim.interpolate({ inputRange: [0, 0.4, 0.6, 0.8, 1], outputRange: [0.3, 0.3, 0.3, 1, 0.3] });

  const containsTelugu = (text: string) => /[\u0C00-\u0C7F]/.test(text);

  const speakMessage = async (text: string, index: number) => {
    try {
      const isCurrentlySpeaking = await Speech.isSpeakingAsync();
      if (isCurrentlySpeaking) {
        await Speech.stop();
        if (speakingMessageIndex === index) {
          setSpeakingMessageIndex(null);
          return;
        }
      }
      setSpeakingMessageIndex(index);

      // Clean the text before speaking — strip updateDraft tags and emojis that break TTS
      const cleanText = text
        .replace(/<updateDraft>[\s\S]*?<\/updateDraft>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/[\u{1F300}-\u{1FFFF}]/gu, '')
        .trim();
      
      if (!cleanText) return;
      
      const isTelugu = containsTelugu(cleanText) || selectedLang === 'te';
      const targetLang = isTelugu ? 'te-IN' : 'en-US';
      
      const options: any = {
        language: targetLang,
        pitch: 1.0,
        rate: 0.9,
        volume: 1.0,
        onDone: () => setSpeakingMessageIndex(null),
        onStopped: () => setSpeakingMessageIndex(null),
        onError: (err: any) => {
          console.error("Speech Error:", err);
          setSpeakingMessageIndex(null);
        },
      };

      if (isTelugu) {
        // Check if a Telugu voice is available; log a warning if not
        const voices = await Speech.getAvailableVoicesAsync();
        const teluguVoice = voices.find(v => v.language && v.language.toLowerCase().startsWith('te'));
        if (teluguVoice) {
          options.voice = teluguVoice.identifier;
        } else {
          console.warn('No Telugu voice found on this device. Install a Telugu TTS engine from device settings.');
          // Still try with language code — Android may use a generic fallback
        }
      } else {
        const voices = await Speech.getAvailableVoicesAsync();
        const availableVoices = voices.filter(v => v.language.startsWith('en'));
        const maleNames = ['alex', 'daniel', 'aaron', 'fred', 'rishi', 'arthur', 'bruce'];
        const isMale = (v: any) => v.name && (v.name.toLowerCase().includes('male') || maleNames.some(name => v.name.toLowerCase().includes(name)));
        
        let bestVoice = availableVoices.find(v => isMale(v) && v.quality === Speech.VoiceQuality.Enhanced) 
                     || availableVoices.find(v => isMale(v))
                     || availableVoices.find(v => v.quality === Speech.VoiceQuality.Enhanced) 
                     || availableVoices[0];
                     
        if (bestVoice) {
          options.voice = bestVoice.identifier;
        }
      }
      
      Speech.speak(cleanText, options);
    } catch (err) {
      console.error("Speech catch error:", err);
      setSpeakingMessageIndex(null);
    }
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (globalActiveRecording) {
        globalActiveRecording.stopAndUnloadAsync().catch(() => {});
        globalActiveRecording = null;
      }
      Speech.stop();
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const checkAndSetConflicts = async (currentDraft: EventDraft = draft): Promise<string[]> => {
    if (!currentDraft.startDateTime) return [];
    try {
      const { checkScheduleConflicts } = require('../../../utils/schedule');
      const startMs = parseSafeDate(currentDraft.startDateTime).getTime();
      const conflicts = await checkScheduleConflicts(
        currentDraft.startDateTime,
        startMs,
        currentDraft.durationMinutes || 60
      );
      if (conflicts && conflicts.length > 0) {
        setConflictWarning(`You already have another event scheduled at this time: ${conflicts.join(', ')}`);
        return conflicts;
      } else {
        setConflictWarning(null);
        return [];
      }
    } catch (e) {
      console.warn('Conflict check failed', e);
      setConflictWarning(null);
      return [];
    }
  };

  const handleSend = async (textToSend: string = inputText) => {
    if (!textToSend.trim()) return;

    setInputText('');
    Speech.stop();

    const newMessages: Message[] = [...messages, { role: 'user', content: textToSend }];
    setMessages(newMessages);

    // 1. Short-circuit if the draft is already ready and the user says Yes/Create
    let directConfirm = draft.isReadyForConfirmation && 
      ['yes', 'confirm', 'save', 'create', 'ok', 'sure', 'yeah', 'do it', 'perfect', 'yep'].some(word => textToSend.toLowerCase().includes(word));
      
    if (directConfirm) {
      setMessages([...newMessages, { role: 'assistant', content: "I have prepared the confirmation card for you. Please review the details." }]);
      setIsLoading(true);
      await checkAndSetConflicts();
      setIsLoading(false);
      setIsConfirmationReady(true);
      return;
    }

    setIsLoading(true);
    
    if (isVoiceMode) setVoiceState('thinking');

    try {
      let readyToConfirm = false;
      const currentConflicts = await checkAndSetConflicts(draft);
      
      const responseText = await sendToGroq(newMessages, draft, (update: Partial<EventDraft>) => {
        setDraft((prev: EventDraft) => ({ ...prev, ...update }));
        if (update.isReadyForConfirmation) {
          readyToConfirm = true;
        }
      }, currentConflicts, selectedLang);

      let willConfirm = readyToConfirm;

      setMessages([...newMessages, { role: 'assistant', content: responseText }]);
      
      // If we are in Voice Mode, automatically speak the reply and then open the mic!
      // Even if willConfirm is true, we want to ask "Shall I create this event?" and wait for "yes".
      if (isVoiceMode) {
        setVoiceState('speaking');
        setSpeakingMessageIndex(newMessages.length);
        
        const isTelugu = containsTelugu(responseText) || selectedLang === 'te';
        const targetLang = isTelugu ? 'te-IN' : 'en-US';
        
        const options: any = {
          language: targetLang,
          pitch: 1.0,
          rate: 0.95,
          volume: 1.0,
          onDone: () => {
            setSpeakingMessageIndex(null);
            startRecordingFn();
          },
          onStopped: () => {
            setSpeakingMessageIndex(null);
            if (isVoiceMode) startRecordingFn();
          },
          onError: (err: any) => {
            console.error("Auto Speech Error:", err);
            setSpeakingMessageIndex(null);
            if (isVoiceMode) startRecordingFn();
          }
        };

        // Clean text before speaking — strip updateDraft tags and emojis
        const cleanResponseText = responseText
          .replace(/<updateDraft>[\s\S]*?<\/updateDraft>/gi, '')
          .replace(/<[^>]+>/g, '')
          .replace(/[\u{1F300}-\u{1FFFF}]/gu, '')
          .trim();

        if (isTelugu) {
          const voices = await Speech.getAvailableVoicesAsync();
          const teluguVoice = voices.find(v => v.language && v.language.toLowerCase().startsWith('te'));
          if (teluguVoice) {
            options.voice = teluguVoice.identifier;
          } else {
            console.warn('No Telugu voice found on this device.');
          }
        } else {
          const voices = await Speech.getAvailableVoicesAsync();
          const availableVoices = voices.filter(v => v.language.startsWith('en'));
          
          const maleNames = ['alex', 'daniel', 'aaron', 'fred', 'rishi', 'arthur', 'bruce'];
          const isMale = (v: any) => v.name && (v.name.toLowerCase().includes('male') || maleNames.some(name => v.name.toLowerCase().includes(name)));
          
          let bestVoice = availableVoices.find(v => isMale(v) && v.quality === Speech.VoiceQuality.Enhanced) 
                       || availableVoices.find(v => isMale(v))
                       || availableVoices.find(v => v.quality === Speech.VoiceQuality.Enhanced) 
                       || availableVoices[0];
          
          if (bestVoice) {
            options.voice = bestVoice.identifier;
          }
        }
        
        Speech.speak(cleanResponseText, options);
      }
      
    } catch (e: any) {
      console.error(e);
      if (e?.message && e.message.includes('429')) {
        Alert.alert("Server busy", "The server is currently busy. Please try again in a moment.");
      } else {
        Alert.alert("Error", "Could not connect to the assistant. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const startRecordingFn = async () => {
    const permission = await Audio.requestPermissionsAsync();
    if (permission.status === 'granted') {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      if (globalActiveRecording) {
        try { await globalActiveRecording.stopAndUnloadAsync(); } catch(e) {}
        globalActiveRecording = null;
      }
      if (recording) {
        try { await recording.stopAndUnloadAsync(); } catch(e) {}
        setRecording(null);
      }

      try {
        let silenceStartTime: number | null = null;
        let hasSpoken = false;

        const { recording: newRecording } = await Audio.Recording.createAsync(
          { ...Audio.RecordingOptionsPresets.LOW_QUALITY, isMeteringEnabled: true },
          (status) => {
            if (status.isRecording && status.metering !== undefined) {
              const isSpeaking = status.metering > -35; 
              if (isSpeaking) {
                hasSpoken = true;
                silenceStartTime = null;
              } else if (hasSpoken) {
                if (silenceStartTime === null) {
                  silenceStartTime = Date.now();
                } else if (Date.now() - silenceStartTime > 1500) {
                  // 1.5 seconds of silence -> Auto stop!
                  newRecording.setOnRecordingStatusUpdate(null);
                  if (handleVoiceTapRef.current) handleVoiceTapRef.current();
                }
              }
            }
          },
          200
        );
        globalActiveRecording = newRecording;
        setRecording(newRecording);
        setIsRecording(true);
        if (isVoiceMode) setVoiceState('listening');
      } catch (createErr: any) {
        Alert.alert("Microphone Error", "Microphone could not be started.");
      }
    } else {
      Alert.alert("Permission Required", "Please grant microphone permission.");
    }
  };

  const handleVoiceTap = async (forceExit: boolean = false) => {
    if (isHandlingVoiceRef.current) return;
    isHandlingVoiceRef.current = true;

    try {
      if (forceExit || (isVoiceMode && voiceState !== 'listening')) {
        // User tapped the Voice UI button to exit Voice Mode
        setIsVoiceMode(false);
        Speech.stop();
        if (recording || globalActiveRecording) {
          try { await (recording || globalActiveRecording)?.stopAndUnloadAsync(); } catch(e){}
        }
        setIsRecording(false);
        setRecording(null);
        globalActiveRecording = null;
        setMessages(prev => [...prev, { role: 'system', content: 'Voice Chat Ended' }]);
        return;
      }

      if (isRecording) {
        // User tapped the Big Mic to stop recording and send
        setIsRecording(false);
        setIsTranscribing(true);

        const recToStop = recording || globalActiveRecording;
        if (recToStop) {
          try {
            try { await recToStop.stopAndUnloadAsync(); } catch(e) { console.log('Recording already unloaded, proceeding...'); }
            const uri = recToStop.getURI();
            setRecording(null);
            globalActiveRecording = null;

            if (uri) {
              const text = await transcribeAudio(uri, selectedLang);
              if (text && text.trim()) {
                setInputText(text);
                setLastInputWasVoice(true);
                // Auto-send in voice mode
                if (isVoiceMode) {
                  handleSend(text);
                }
              }
            }
          } catch (e: any) {
            console.error(e);
            if (e?.message && e.message.includes('429')) {
              Alert.alert("Server busy", "The server is currently busy. Please try again in a moment.");
            } else {
              Alert.alert("Audio Error", "We could not understand your audio. Please speak again.");
            }
          }
        }
        setIsTranscribing(false);
      } else {
        // User tapped the mic to START voice mode
        setIsVoiceMode(true);
        setVoiceState('listening');
        startRecordingFn();
      }
    } catch (err) {
      console.error('Failed to handle recording', err);
      setIsRecording(false);
      setIsTranscribing(false);
    } finally {
      isHandlingVoiceRef.current = false;
    }
  };

  useEffect(() => {
    handleVoiceTapRef.current = handleVoiceTap;
  }, [handleVoiceTap]);

  const saveEvent = async () => {
    try {
      Speech.stop(); // Stop any ongoing speech when user clicks save
      setIsSaving(true);

      let startDateTimeStr = draft.startDateTime ? parseSafeDate(draft.startDateTime).toISOString() : new Date().toISOString();
      let endDateTimeStr = draft.endDateTime ? parseSafeDate(draft.endDateTime).toISOString() : '';
      if (!endDateTimeStr) {
        const d = new Date(startDateTimeStr);
        d.setHours(d.getHours() + 1);
        endDateTimeStr = d.toISOString();
      }

      const fullLocation = [draft.venueName, draft.city, draft.address]
        .filter(Boolean)
        .join(' — ');
      const payload = {
        Subject: draft.title || 'Untitled Event',
        StartDateTime: startDateTimeStr,
        EndDateTime: endDateTimeStr,
        Location: fullLocation,
        Description: draft.notes || ''
      };
      
      await FirestoreService.createPastorEvent(payload);
      setIsSuccessVisible(true);
    } catch (e: any) {
      Alert.alert("Error", "Could not save the event. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#fff' }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 80}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: '#fff' }]} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBadge}>
            <Text style={styles.backBadgeText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.langToggleContainer}>
            <TouchableOpacity 
              style={[styles.langButton, selectedLang === 'en' && styles.langButtonActive]}
              onPress={() => setSelectedLang('en')}
            >
              <Text style={[styles.langButtonText, selectedLang === 'en' && styles.langButtonTextActive]}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.langButton, selectedLang === 'te' && styles.langButtonActive]}
              onPress={() => setSelectedLang('te')}
            >
              <Text style={[styles.langButtonText, selectedLang === 'te' && styles.langButtonTextActive]}>తెలుగు</Text>
            </TouchableOpacity>
          </View>
        </View>

      {isSuccessVisible ? (
        <View style={styles.confirmationContainer}>
          <EventSuccessCard onDone={() => navigation.navigate('Dashboard', { refresh: true })} />
        </View>
      ) : isConfirmationReady ? (
        <View style={styles.confirmationContainer}>
          <EventConfirmationCard 
            draft={draft} 
            onConfirm={saveEvent}
            onEdit={() => {
              setIsConfirmationReady(false);
              setConflictWarning(null);
              if (isVoiceMode) {
                setVoiceState('listening');
                startRecordingFn();
              }
            }}
            isSaving={isSaving}
            conflictWarning={conflictWarning}
          />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView ref={scrollViewRef} style={styles.chatArea} contentContainerStyle={{ padding: spacing.md }}>
            {messages.map((msg, idx) => {
              if (msg.role === 'system') {
                return (
                  <View key={idx} style={styles.systemMessageContainer}>
                    <Text style={styles.systemMessageText}>{msg.content}</Text>
                  </View>
                );
              }
              return (
                <View key={idx}>
                  <View 
                    style={[
                      styles.messageBubble, 
                      msg.role === 'user' ? styles.userBubble : styles.aiBubble
                    ]}
                  >
                    {msg.role === 'assistant' && (
                      <Ionicons name="sparkles" size={14} color={colors.primaryDark} style={{ marginRight: 6, marginTop: 2 }} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[
                        styles.messageText, 
                        msg.role === 'user' ? styles.userText : styles.aiText
                      ]}>
                        {msg.content}
                      </Text>
                    </View>
                    {msg.role === 'assistant' && (
                      <TouchableOpacity 
                        style={{ paddingLeft: 8, justifyContent: 'flex-end', paddingBottom: 2 }}
                        onPress={() => speakMessage(msg.content || '', idx)}
                      >
                        <Ionicons 
                          name={speakingMessageIndex === idx ? "stop-circle" : "volume-high"} 
                          size={20} 
                          color={speakingMessageIndex === idx ? colors.error : colors.primary} 
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  {/* Suggested actions below the last AI message */}
                  {!isConfirmationReady && !isLoading && idx === messages.length - 1 && msg.role === 'assistant' && (
                    <View style={{ flexDirection: 'row', paddingBottom: spacing.sm, paddingLeft: 4, gap: 8, flexWrap: 'wrap', marginTop: -8, marginBottom: spacing.md }}>
                      {messages.length === 1 && (
                        <TouchableOpacity 
                          style={{ backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.primary }}
                          onPress={() => handleSend("I want to create an event")}
                        >
                          <Text style={{ color: colors.primary, fontWeight: '600' }}>Create Event</Text>
                        </TouchableOpacity>
                      )}
                      {draft.isReadyForConfirmation && (
                        <TouchableOpacity 
                          style={{ backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.success }}
                          onPress={() => handleSend("Yes, create it")}
                        >
                          <Text style={{ color: colors.success, fontWeight: '600' }}>Yes, create it</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
            {isLoading && (
              <View style={[styles.messageBubble, styles.aiBubble, { width: 60 }]}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
          </ScrollView>

          {/* Draft Preview Bar */}
          {Object.keys(draft).length > 0 && (
            <View style={styles.draftPreviewBar}>
              <Text style={styles.draftPreviewText} numberOfLines={1}>
                <Ionicons name="document-text-outline" size={12} /> Drafting: {draft.title || 'Event'} {draft.startDateTime ? '📅' : ''}
              </Text>
            </View>
          )}

          <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder={isVoiceMode ? (voiceState === 'listening' ? 'Listening...' : voiceState === 'thinking' ? 'Thinking...' : 'Speaking...') : "Type or use voice..."}
                placeholderTextColor={isVoiceMode ? colors.primary : colors.textTertiary}
                value={inputText}
                onChangeText={(txt) => {
                  setInputText(txt);
                  if (!txt.trim()) setLastInputWasVoice(false);
                }}
                multiline
                editable={!isVoiceMode}
              />

              <View style={{ marginBottom: 4, marginRight: 4 }}>
                {isVoiceMode ? (
                  <TouchableOpacity 
                    style={styles.endBadge} 
                    onPress={() => handleVoiceTap(true)}
                  >
                    {voiceState === 'thinking' ? (
                      <ActivityIndicator size="small" color="#fff" style={{ marginRight: 4 }} />
                    ) : voiceState === 'speaking' ? (
                      <Ionicons name="volume-high" size={16} color="#fff" style={{ marginRight: 4 }} />
                    ) : (
                      <View style={{ flexDirection: 'row', marginRight: 6, alignItems: 'center', height: 16 }}>
                        <Animated.View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff', opacity: opacity1, marginRight: 2 }} />
                        <Animated.View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff', opacity: opacity2, marginRight: 2 }} />
                        <Animated.View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff', opacity: opacity3 }} />
                      </View>
                    )}
                    <Text style={styles.endBadgeText}>End</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.actionButton} 
                    onPress={() => inputText.trim() ? handleSend() : handleVoiceTap()}
                    disabled={inputText.trim() ? isLoading : isTranscribing}
                  >
                    {isTranscribing || (inputText.trim() && isLoading) ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : inputText.trim() ? (
                      <Ionicons name="send" size={20} color={colors.primary} style={{ marginLeft: 2 }} />
                    ) : (
                      <Ionicons name="mic" size={22} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgSecondary
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: 0,
    paddingBottom: spacing.sm,
    backgroundColor: '#fff',
  },
  backBadge: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  chatArea: {
    flex: 1
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    flexDirection: 'row'
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 0
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 0,
    borderWidth: 1,
    borderColor: colors.border
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1
  },
  userText: {
    color: '#fff'
  },
  aiText: {
    color: colors.textPrimary
  },
  draftPreviewBar: {
    backgroundColor: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  draftPreviewText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  inputContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: '#fff',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 20,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    color: colors.textPrimary
  },
  actionButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    marginRight: 4,
  },
  confirmationContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg
  },
  endBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  endBadgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  systemMessageContainer: {
    alignSelf: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginVertical: 8,
  },
  systemMessageText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  langToggleContainer: {
    flexDirection: 'row',
    marginLeft: 'auto',
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  langButtonActive: {
    backgroundColor: colors.primary,
  },
  langButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  langButtonTextActive: {
    color: '#fff',
  },
});
