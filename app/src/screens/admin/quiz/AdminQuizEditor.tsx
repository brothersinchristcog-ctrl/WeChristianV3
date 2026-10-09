import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import {
  Plus,
  Trash2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Calendar as CalendarIcon,
  Clock,
  Upload,
  FileText,
  Eye,
  Sparkles,
  X,
  Check,
  Send,
  Save,
  Globe,
  HelpCircle,
  Bell,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { BibleQuiz, QuizDifficulty, QuizQuestion, QuizQuestionType, QuizStatus } from '../../../types/Quiz';
import { QuizService } from '../../../services/QuizService';
import { QuizAIService } from '../../../services/QuizAIService';
import BibleReferencePickerModal, {
  BiblePickerResult,
} from './BibleReferencePickerModal';

interface Props {
  initialQuiz?: Partial<BibleQuiz> | null;
  churchId: string;
  churchName?: string;
  onBack: () => void;
  onSaved: (quizId: string) => void;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
];

const TIME_PRESETS = ['05:00', '06:00', '07:00', '09:00', '18:00', '20:00'];

const createBlankQuestion = (order: number, type: QuizQuestionType = 'single_choice'): QuizQuestion => ({
  id: `q_${Date.now()}_${order}`,
  order,
  questionType: type,
  question: '',
  options: type === 'true_false' ? ['True', 'False'] : ['', '', '', ''],
  correctAnswer: '',
  bibleReference: '',
  explanation: '',
  marks: 1,
});

export default function AdminQuizEditor({
  initialQuiz,
  churchId,
  churchName,
  onBack,
  onSaved,
}: Props) {
  const [quizId] = useState<string | undefined>(initialQuiz?.id);
  const [title, setTitle] = useState<string>(initialQuiz?.title || '');
  const [topic, setTopic] = useState<string>(initialQuiz?.topic || initialQuiz?.category || '');
  const [difficulty, setDifficulty] = useState<QuizDifficulty>(initialQuiz?.difficulty || 'medium');
  const [language, setLanguage] = useState<string>(initialQuiz?.language || 'en');
  const [description, setDescription] = useState<string>(initialQuiz?.description || '');
  const [sourceFile, setSourceFile] = useState<string>(initialQuiz?.sourceFile || '');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(initialQuiz?.timeLimitMinutes || 0);

  // Scheduling State (matching Daily Promise workflow)
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const [scheduledDate, setScheduledDate] = useState<string>(initialQuiz?.scheduledDate || initialQuiz?.dailyDate || todayStr);
  const [scheduledTime, setScheduledTime] = useState<string>(initialQuiz?.scheduledTime || '06:00');
  const [publishStatus, setPublishStatus] = useState<'published' | 'scheduled' | 'draft'>(
    initialQuiz?.status === 'scheduled' ? 'scheduled' : initialQuiz?.status === 'draft' ? 'draft' : 'published'
  );
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);

  // Convert 24-hr time (e.g. "06:30") to user-friendly "6:30 AM"
  const formatTimeDisplay = (time24: string) => {
    if (!time24) return '6:00 AM';
    const [hStr, mStr] = time24.split(':');
    const h = parseInt(hStr, 10) || 0;
    const m = (mStr || '00').padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  const handleConfirmTime = (date: Date) => {
    let hNum = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');

    // Smart 12h PM detection: If scheduling for today and selected hour is in the past as AM,
    // but upcoming as PM (e.g. 2:57 AM while it is currently 2:51 PM), save as PM (14:57)
    const now = new Date();
    if (scheduledDate === todayStr && hNum < 12) {
      if (hNum < now.getHours() && (hNum + 12) >= now.getHours()) {
        hNum += 12;
      }
    }

    const hours = String(hNum).padStart(2, '0');
    setScheduledTime(`${hours}:${minutes}`);
    setShowTimePicker(false);
  };

  // Calendar Picker state
  const [pickerYear, setPickerYear] = useState<number>(() => {
    const p = (scheduledDate || todayStr).split('-');
    return parseInt(p[0], 10) || new Date().getFullYear();
  });
  const [pickerMonth, setPickerMonth] = useState<number>(() => {
    const p = (scheduledDate || todayStr).split('-');
    return (parseInt(p[1], 10) - 1) || new Date().getMonth();
  });

  // Questions state
  const [questions, setQuestions] = useState<QuizQuestion[]>(() => {
    if (initialQuiz?.questions && initialQuiz.questions.length > 0) {
      return initialQuiz.questions;
    }
    return [createBlankQuestion(1)];
  });

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isGeneratingFromFile, setIsGeneratingFromFile] = useState<boolean>(false);
  const [generatingStatus, setGeneratingStatus] = useState<string>('');

  // Bible Reference Picker Modal state
  const [pickerVisible, setPickerVisible] = useState<boolean>(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(null);

  // Preview Modal state
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [previewSelectedAnswers, setPreviewSelectedAnswers] = useState<Record<number, string>>({});
  const [previewShowAnswers, setPreviewShowAnswers] = useState<boolean>(false);

  const scrollViewRef = React.useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates?.height || 300);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Upload Celebratory Success Modal state
  const [uploadSuccessData, setUploadSuccessData] = useState<{
    visible: boolean;
    fileName: string;
    questionCount: number;
    language: string;
    title: string;
    firstQuestion?: string;
    firstOptions?: string[];
  }>({
    visible: false,
    fileName: '',
    questionCount: 0,
    language: 'English',
    title: '',
  });

  // Quiz Save / Publish / Schedule Success Modal state
  const [saveSuccessData, setSaveSuccessData] = useState<{
    visible: boolean;
    status: 'published' | 'scheduled' | 'draft';
    title: string;
    questionCount: number;
    scheduledDate?: string;
    scheduledTime?: string;
    savedId: string;
  } | null>(null);

  // ─── File Upload Handler (PDF, DOCX, TXT, XLSX, CSV) ──────────────────────────
  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'text/plain',
          'text/csv',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
          '*/*',
        ],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        setIsGeneratingFromFile(true);
        setGeneratingStatus(`Reading "${asset.name}" and extracting up to 10 questions...`);

        const generated = await QuizAIService.generateQuizFromFile(asset, {
          category: topic || 'Bible Study',
          difficulty,
          language,
          questionCount: 10,
        });

        // Automatically update language to match the document
        const isTe = generated.language === 'te' || /[\u0C00-\u0C7F]/.test(generated.questions[0]?.question || '');
        if (isTe) {
          setLanguage('te');
        } else if (generated.language) {
          setLanguage(generated.language);
        } else {
          setLanguage('en');
        }

        if (generated.title) {
          setTitle(generated.title);
        }
        if (generated.description && !description.trim()) {
          setDescription(generated.description);
        }
        if (generated.questions && generated.questions.length > 0) {
          setQuestions(generated.questions);
        }

        setSourceFile(asset.name || 'Uploaded File');

        const langName = isTe
          ? 'Telugu (తెలుగు లిపి)'
          : generated.language === 'ta'
          ? 'Tamil (தமிழ்)'
          : generated.language === 'hi'
          ? 'Hindi (हिन्दी)'
          : generated.language === 'kn'
          ? 'Kannada (ಕನ್ನಡ)'
          : generated.language === 'ml'
          ? 'Malayalam (മലയാളം)'
          : 'English';

        // Open beautiful celebratory success card with live extracted preview
        setUploadSuccessData({
          visible: true,
          fileName: asset.name || 'Document',
          questionCount: generated.questions.length,
          language: langName,
          title: generated.title || title || 'Bible Quiz',
          firstQuestion: generated.questions[0]?.question,
          firstOptions: generated.questions[0]?.options,
        });
      }
    } catch (err: any) {
      console.error('[AdminQuizEditor] Document upload failed:', err);
      Alert.alert('Upload Error', err?.message || 'Could not process the uploaded file. Please try a TXT, PDF, DOCX, or CSV file.');
    } finally {
      setIsGeneratingFromFile(false);
      setGeneratingStatus('');
    }
  };

  const handleSelectReference = (res: BiblePickerResult) => {
    if (activeQuestionIndex !== null && activeQuestionIndex >= 0) {
      handleUpdateQuestion(activeQuestionIndex, 'bibleReference', res.referenceString);
    }
  };

  const handleAddQuestion = () => {
    setQuestions(prev => [...prev, createBlankQuestion(prev.length + 1)]);
  };

  const handleUpdateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    setQuestions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleQuestionTypeChange = (qIdx: number, newType: QuizQuestionType) => {
    setQuestions(prev => {
      const updated = [...prev];
      const q = updated[qIdx];
      let newOptions = q.options;
      if (newType === 'true_false') {
        newOptions = ['True', 'False'];
      } else if (newOptions.length < 4) {
        newOptions = ['True', 'False', '', ''];
      }
      updated[qIdx] = {
        ...q,
        questionType: newType,
        options: newOptions,
        correctAnswer: '',
      };
      return updated;
    });
  };

  const handleUpdateOption = (qIdx: number, optIdx: number, text: string) => {
    setQuestions(prev => {
      const updated = [...prev];
      const opts = [...(updated[qIdx].options || ['', '', '', ''])];
      opts[optIdx] = text;
      updated[qIdx] = { ...updated[qIdx], options: opts };
      if (updated[qIdx].correctAnswer === (prev[qIdx].options?.[optIdx] || '')) {
        updated[qIdx].correctAnswer = text;
      }
      return updated;
    });
  };

  const handleSetCorrectAnswer = (qIdx: number, optText: string) => {
    setQuestions(prev => {
      const updated = [...prev];
      updated[qIdx] = { ...updated[qIdx], correctAnswer: optText };
      return updated;
    });
  };

  const handleDeleteQuestion = (index: number) => {
    if (questions.length <= 1) {
      Alert.alert('Notice', 'A quiz must have at least one question.');
      return;
    }
    setQuestions(prev => prev.filter((_, idx) => idx !== index));
  };

  // ─── Save / Schedule / Publish ────────────────────────────────────────────────
  const handleSave = async (targetStatus?: 'published' | 'scheduled' | 'draft') => {
    const finalStatus: QuizStatus = targetStatus || publishStatus;

    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a Quiz Title.');
      return;
    }

    if (questions.length === 0) {
      Alert.alert('Missing Questions', 'Please add at least one question.');
      return;
    }

    // Validate questions and answers
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        Alert.alert('Incomplete Question', `Please type the question text for Question #${i + 1}.`);
        return;
      }

      const nonEmptyOptions = (q.options || []).filter(opt => opt.trim().length > 0);
      if (nonEmptyOptions.length < 2) {
        Alert.alert('Missing Options', `Please provide at least 2 choices for Question #${i + 1}.`);
        return;
      }

      const hasCorrectAnswer = Array.isArray(q.correctAnswer)
        ? q.correctAnswer.length > 0
        : Boolean(q.correctAnswer && String(q.correctAnswer).trim());

      if (!hasCorrectAnswer) {
        Alert.alert('Correct Answer Required', `Please tap the circle next to the correct answer for Question #${i + 1}.`);
        return;
      }
    }

    try {
      setIsSaving(true);

      const sanitizedQuestions = questions.map((q, idx) => ({
        ...q,
        id: q.id || `q_${Date.now()}_${idx + 1}`,
        order: idx + 1,
        options: (q.options || []).filter(opt => opt.trim().length > 0),
        marks: 1,
      }));

      const finalScheduledDate = scheduledDate || todayStr;
      const finalScheduledTime = scheduledTime || '06:00';

      const payload: Partial<BibleQuiz> = {
        id: quizId,
        churchId: initialQuiz?.churchId || churchId,
        churchName: initialQuiz?.churchName || churchName,
        title: title.trim(),
        description: description.trim(),
        category: topic.trim() || 'General',
        topic: topic.trim() || 'General',
        difficulty,
        level: 1,
        language,
        scheduledDate: finalStatus === 'scheduled' ? finalScheduledDate : (scheduledDate || todayStr),
        scheduledTime: finalStatus === 'scheduled' ? finalScheduledTime : (scheduledTime || '06:00'),
        scheduledAt: finalStatus === 'scheduled' ? `${finalScheduledDate}T${finalScheduledTime}:00` : null,
        sourceFile: sourceFile || '',
        timeLimitMinutes: Number(timeLimitMinutes) || 0,
        marksPerQuestion: 1,
        passPercentage: 70,
        isDailyQuiz: finalStatus === 'scheduled' ? false : Boolean(initialQuiz?.isDailyQuiz),
        allowMultipleAttempts: true,
        status: finalStatus,
        questions: sanitizedQuestions,
      };

      const savedId = await QuizService.saveQuiz(payload);
      setShowScheduleModal(false);

      setSaveSuccessData({
        visible: true,
        status: finalStatus,
        title: title.trim(),
        questionCount: sanitizedQuestions.length,
        scheduledDate: finalStatus === 'scheduled' ? finalScheduledDate : undefined,
        scheduledTime: finalStatus === 'scheduled' ? finalScheduledTime : undefined,
        savedId,
      });
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save quiz. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Render Date Picker Modal (Calendar) ──────────────────────────────────────
  const renderCalendarModal = () => {
    const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
    const firstDayIndex = new Date(pickerYear, pickerMonth, 1).getDay();

    const MONTH_NAMES = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    return (
      <Modal visible={showDatePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.calendarCard}>
            <View style={styles.calHeader}>
              <Text style={styles.calTitle}>Select Schedule Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.calNavRow}>
              <TouchableOpacity
                onPress={() => {
                  if (pickerMonth === 0) {
                    setPickerMonth(11);
                    setPickerYear(y => y - 1);
                  } else {
                    setPickerMonth(m => m - 1);
                  }
                }}
                style={styles.calNavBtn}
              >
                <ChevronLeft size={20} color="#1a2d5a" />
              </TouchableOpacity>

              <Text style={styles.calMonthYearTxt}>
                {MONTH_NAMES[pickerMonth]} {pickerYear}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  if (pickerMonth === 11) {
                    setPickerMonth(0);
                    setPickerYear(y => y + 1);
                  } else {
                    setPickerMonth(m => m + 1);
                  }
                }}
                style={styles.calNavBtn}
              >
                <ChevronRight size={20} color="#1a2d5a" />
              </TouchableOpacity>
            </View>

            <View style={styles.weekdaysRow}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                <Text key={d} style={[styles.weekdayTxt, (i === 0 || i === 6) && { color: '#c0392b' }]}>{d}</Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {Array.from({ length: firstDayIndex }).map((_, idx) => (
                <View key={`b_${idx}`} style={styles.emptyDayCell} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dStr = `${pickerYear}-${String(pickerMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isSelected = scheduledDate === dStr;
                return (
                  <TouchableOpacity
                    key={`d_${dayNum}`}
                    style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                    onPress={() => {
                      setScheduledDate(dStr);
                      setShowDatePicker(false);
                    }}
                  >
                    <Text style={[styles.dayCellTxt, isSelected && styles.dayCellTxtSelected]}>
                      {dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.todayShortcutBtn}
              onPress={() => {
                const now = new Date();
                setPickerYear(now.getFullYear());
                setPickerMonth(now.getMonth());
                setScheduledDate(todayStr);
                setShowDatePicker(false);
              }}
            >
              <Text style={styles.todayShortcutTxt}>Today</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // ─── Render Schedule Dialog Modal ─────────────────────────────────────────────
  const renderScheduleModal = () => (
    <Modal visible={showScheduleModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.scheduleModalCard}>
          <View style={styles.modalHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <CalendarIcon size={20} color="#1a2d5a" />
              <Text style={styles.modalTitle}>Schedule Bible Quiz</Text>
            </View>
            <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>
            Choose the release date and time for this quiz to automatically unlock for church members.
          </Text>

          {/* Date Picker trigger */}
          <Text style={styles.inputLabel}>Release Date</Text>
          <TouchableOpacity
            style={styles.datePickerTrigger}
            onPress={() => {
              setShowScheduleModal(false);
              setTimeout(() => setShowDatePicker(true), 150);
            }}
            activeOpacity={0.8}
          >
            <CalendarIcon size={18} color="#1a2d5a" />
            <Text style={styles.datePickerTriggerTxt}>{scheduledDate}</Text>
            <Text style={{ marginLeft: 'auto', fontSize: 12, color: '#1a2d5a', fontWeight: '700' }}>Change Date 📅</Text>
          </TouchableOpacity>

          {/* Clock Picker Trigger (Interactive Native Clock / Wheel) */}
          <Text style={styles.inputLabel}>Release Time (Clock Picker)</Text>
          <TouchableOpacity
            style={styles.timePickerTrigger}
            onPress={() => {
              setShowScheduleModal(false);
              setTimeout(() => setShowTimePicker(true), 150);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.timePickerLeft}>
              <View style={styles.timePickerIconCircle}>
                <Clock size={18} color="#1a2d5a" />
              </View>
              <View>
                <Text style={styles.timePickerLabel}>SCHEDULED TIME</Text>
                <Text style={styles.timePickerValueTxt}>
                  {formatTimeDisplay(scheduledTime)} <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748B' }}>({scheduledTime})</Text>
                </Text>
              </View>
            </View>
            <View style={styles.timePickerChangeBtn}>
              <Text style={styles.timePickerChangeBtnTxt}>Pick Clock ⏰</Text>
            </View>
          </TouchableOpacity>

          {/* Explicit AM / PM Quick Switcher */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 4 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 8,
                alignItems: 'center',
                backgroundColor: parseInt(scheduledTime.split(':')[0], 10) < 12 ? '#1a2d5a' : '#F1F5F9',
                borderWidth: 1,
                borderColor: parseInt(scheduledTime.split(':')[0], 10) < 12 ? '#1a2d5a' : '#CBD5E1',
              }}
              onPress={() => {
                const [h, m] = scheduledTime.split(':');
                let hNum = parseInt(h, 10) || 0;
                if (hNum >= 12) hNum -= 12;
                setScheduledTime(`${String(hNum).padStart(2, '0')}:${m || '00'}`);
              }}
              activeOpacity={0.8}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: '700',
                color: parseInt(scheduledTime.split(':')[0], 10) < 12 ? '#ffffff' : '#475569',
              }}>
                🌅 AM (Morning)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 8,
                alignItems: 'center',
                backgroundColor: parseInt(scheduledTime.split(':')[0], 10) >= 12 ? '#1a2d5a' : '#F1F5F9',
                borderWidth: 1,
                borderColor: parseInt(scheduledTime.split(':')[0], 10) >= 12 ? '#1a2d5a' : '#CBD5E1',
              }}
              onPress={() => {
                const [h, m] = scheduledTime.split(':');
                let hNum = parseInt(h, 10) || 0;
                if (hNum < 12) hNum += 12;
                setScheduledTime(`${String(hNum).padStart(2, '0')}:${m || '00'}`);
              }}
              activeOpacity={0.8}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: '700',
                color: parseInt(scheduledTime.split(':')[0], 10) >= 12 ? '#ffffff' : '#475569',
              }}>
                🌆 PM (Afternoon/Evening)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Time Presets */}
          <Text style={[styles.inputLabel, { marginTop: 4 }]}>Quick Presets</Text>
          <View style={styles.timePresetsRow}>
            {[
              { time: '09:00', label: '9:00 AM' },
              { time: '12:00', label: '12:00 PM' },
              { time: '14:30', label: '2:30 PM' },
              { time: '15:00', label: '3:00 PM' },
              { time: '18:00', label: '6:00 PM' },
              { time: '20:00', label: '8:00 PM' },
            ].map(p => {
              const isSelected = scheduledTime === p.time;
              return (
                <TouchableOpacity
                  key={p.time}
                  style={[styles.timeChip, isSelected && styles.timeChipActive]}
                  onPress={() => setScheduledTime(p.time)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.timeChipTxt, isSelected && styles.timeChipTxtActive]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Time Limit Setting in Schedule Modal */}
          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Time Limit</Text>
          <View style={styles.timePresetsRow}>
            {[
              { label: 'Untimed', value: 0 },
              { label: '5 Mins', value: 5 },
              { label: '10 Mins', value: 10 },
              { label: '15 Mins', value: 15 },
              { label: '20 Mins', value: 20 },
              { label: '30 Mins', value: 30 },
              { label: '60 Mins', value: 60 },
            ].map(item => {
              const isSelected = timeLimitMinutes === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[styles.timeChip, isSelected && styles.timeChipActive]}
                  onPress={() => setTimeLimitMinutes(item.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.timeChipTxt, isSelected && styles.timeChipTxtActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.scheduleInfoBox}>
            <Clock size={16} color="#1a2d5a" />
            <Text style={styles.scheduleInfoTxt}>
              Members will automatically see this quiz in Church Quizzes on <Text style={{ fontWeight: '700' }}>{scheduledDate}</Text> at <Text style={{ fontWeight: '700' }}>{formatTimeDisplay(scheduledTime)}</Text>.
            </Text>
          </View>

          <View style={styles.modalActionsRow}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowScheduleModal(false)}
            >
              <Text style={styles.modalCancelBtnTxt}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={() => {
                setPublishStatus('scheduled');
                setShowScheduleModal(false);
                if (title.trim() && questions.length > 0) {
                  handleSave('scheduled');
                } else {
                  Alert.alert(
                    'Schedule Configured',
                    `Scheduled for ${scheduledDate} at ${formatTimeDisplay(scheduledTime)}. Complete your quiz questions below and tap "Schedule Quiz".`
                  );
                }
              }}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.modalConfirmBtnTxt}>Confirm Schedule</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ─── Render Live Preview Modal ────────────────────────────────────────────────
  const renderPreviewModal = () => (
    <Modal visible={previewVisible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <View>
              <Text style={styles.previewBadge}>MEMBER PREVIEW</Text>
              <Text style={styles.previewTitle}>{title || 'Bible Quiz'}</Text>
              <Text style={styles.previewSub}>
                {topic || 'Scripture Knowledge'} · {difficulty.toUpperCase()} · {questions.length} Questions
              </Text>
            </View>
            <TouchableOpacity onPress={() => setPreviewVisible(false)}>
              <X size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.previewScroll} showsVerticalScrollIndicator={false}>
            {questions.map((q, idx) => {
              const selectedOpt = previewSelectedAnswers[idx];

              return (
                <View key={q.id || idx} style={styles.previewQuestionBox}>
                  <View style={styles.previewQHeader}>
                    <Text style={styles.previewQNumber}>Question {idx + 1} of {questions.length}</Text>
                    {Boolean(q.bibleReference) && (
                      <Text style={styles.previewQRef}>{q.bibleReference}</Text>
                    )}
                  </View>

                  <Text style={styles.previewQText}>{q.question || `(Question ${idx + 1})`}</Text>

                  <View style={styles.previewOptionsCol}>
                    {q.options?.map((opt, optIdx) => {
                      const isSelected = selectedOpt === opt;
                      const isCorrect = q.correctAnswer === opt;

                      return (
                        <TouchableOpacity
                          key={optIdx}
                          style={[
                            styles.previewOptionBtn,
                            isSelected && styles.previewOptionSelected,
                            previewShowAnswers && isCorrect && styles.previewOptionCorrect,
                          ]}
                          onPress={() => {
                            setPreviewSelectedAnswers(prev => ({ ...prev, [idx]: opt }));
                          }}
                        >
                          <Text
                            style={[
                              styles.previewOptionTxt,
                              isSelected && styles.previewOptionTxtSelected,
                              previewShowAnswers && isCorrect && styles.previewOptionTxtCorrect,
                            ]}
                          >
                            {String.fromCharCode(65 + optIdx)}. {opt}
                          </Text>
                          {previewShowAnswers && isCorrect && (
                            <Check size={16} color="#10b981" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {previewShowAnswers && Boolean(q.explanation) && (
                    <View style={styles.previewExpBox}>
                      <Text style={styles.previewExpLabel}>Biblical Explanation:</Text>
                      <Text style={styles.previewExpTxt}>{q.explanation}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.previewFooter}>
            <TouchableOpacity
              style={styles.previewToggleBtn}
              onPress={() => setPreviewShowAnswers(!previewShowAnswers)}
            >
              <Text style={styles.previewToggleBtnTxt}>
                {previewShowAnswers ? 'Hide Answers' : 'Reveal Answers & Scripture'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.previewCloseBtn}
              onPress={() => setPreviewVisible(false)}
            >
              <Text style={styles.previewCloseBtnTxt}>Close Preview</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ─── Document Upload Success Modal ───────────────────────────────────────────
  const renderSuccessModal = () => (
    <Modal visible={uploadSuccessData.visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.celebrationCard}>
          {/* Top Close Button */}
          <TouchableOpacity
            onPress={() => setUploadSuccessData(prev => ({ ...prev, visible: false }))}
            style={styles.celebrationCloseBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={18} color="#64748B" />
          </TouchableOpacity>

          {/* Clean Emerald Checkmark Circle */}
          <View style={styles.celebrationIconCircle}>
            <CheckCircle size={28} color="#059669" />
          </View>

          <Text style={styles.celebrationTitle}>10 Questions Extracted!</Text>
          <Text style={styles.celebrationSubtitle}>
            Successfully extracted from "{uploadSuccessData.fileName || 'your document'}".
          </Text>

          {/* 2 Clean Info Chips */}
          <View style={styles.celebrationBadgeRow}>
            <View style={styles.celebrationCountBadge}>
              <BookOpen size={13} color="#1a2d5a" />
              <Text style={styles.celebrationCountBadgeTxt}>
                {uploadSuccessData.questionCount || 10} Questions Ready
              </Text>
            </View>
            <View style={styles.celebrationLangBadge}>
              <Globe size={13} color="#059669" />
              <Text style={styles.celebrationLangBadgeTxt}>{uploadSuccessData.language}</Text>
            </View>
          </View>

          {/* First Question Sample Preview */}
          {Boolean(uploadSuccessData.firstQuestion) && (
            <View style={styles.celebrationSampleBox}>
              <Text style={styles.celebrationSampleTag}>QUESTION 1 SAMPLE</Text>
              <Text style={styles.celebrationSampleQText} numberOfLines={2}>
                "{uploadSuccessData.firstQuestion}"
              </Text>
              {Boolean(uploadSuccessData.firstOptions && uploadSuccessData.firstOptions.length > 0) && (
                <View style={styles.celebrationSampleOptionsGrid}>
                  {uploadSuccessData.firstOptions?.slice(0, 4).map((opt, oIdx) => (
                    <View key={oIdx} style={styles.celebrationSampleOptionPill}>
                      <Text style={styles.celebrationSampleOptionTxt} numberOfLines={1}>
                        <Text style={{ fontWeight: '700', color: '#1a2d5a' }}>{String.fromCharCode(65 + oIdx)}. </Text>
                        {opt}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.celebrationActionsCol}>
            <TouchableOpacity
              style={styles.celebrationPrimaryBtn}
              onPress={() => {
                setUploadSuccessData(prev => ({ ...prev, visible: false }));
                setTimeout(() => {
                  scrollViewRef.current?.scrollTo({ y: 380, animated: true });
                }, 200);
              }}
              activeOpacity={0.85}
            >
              <Check size={16} color="#ffffff" />
              <Text style={styles.celebrationPrimaryBtnTxt}>Review & Edit Questions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.celebrationSecondaryBtn}
              onPress={() => {
                setUploadSuccessData(prev => ({ ...prev, visible: false }));
                setPreviewVisible(true);
              }}
              activeOpacity={0.7}
            >
              <Eye size={15} color="#1a2d5a" />
              <Text style={styles.celebrationSecondaryBtnTxt}>Preview Member Experience</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ─── Quiz Save / Publish / Schedule Success Modal (Neat, Clean & Modern) ───
  const renderSaveSuccessModal = () => {
    if (!saveSuccessData || !saveSuccessData.visible) return null;

    const isPub = saveSuccessData.status === 'published';
    const isSched = saveSuccessData.status === 'scheduled';

    const getLangLabel = () => {
      const match = SUPPORTED_LANGUAGES.find(l => l.code === language);
      return match ? match.name : language.toUpperCase();
    };

    return (
      <Modal visible={saveSuccessData.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.celebrationCard}>
            {/* Top Close Button */}
            <TouchableOpacity
              onPress={() => {
                const sId = saveSuccessData.savedId;
                setSaveSuccessData(null);
                onSaved(sId);
              }}
              style={styles.celebrationCloseBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>

            {/* Top Decorative Icon */}
            <View
              style={[
                styles.celebrationIconCircle,
                isPub
                  ? { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }
                  : isSched
                  ? { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }
                  : { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' },
              ]}
            >
              {isPub ? (
                <CheckCircle size={32} color="#059669" strokeWidth={2.5} />
              ) : isSched ? (
                <Clock size={30} color="#1a2d5a" strokeWidth={2.5} />
              ) : (
                <Save size={28} color="#475569" strokeWidth={2.5} />
              )}
            </View>

            {/* Title & Status */}
            <Text style={styles.celebrationTitle}>
              {isPub
                ? 'Quiz Published Live!'
                : isSched
                ? 'Quiz Scheduled!'
                : 'Draft Saved Safely'}
            </Text>

            {/* Quiz Title Box */}
            <View style={styles.cleanQuizTitleBox}>
              <Text style={styles.cleanQuizTitleTxt} numberOfLines={2}>
                {saveSuccessData.title}
              </Text>
            </View>

            {/* Subtitle / Context Note */}
            <Text style={styles.celebrationSubtitle}>
              {isPub
                ? 'This quiz is now active and accessible to your congregation.'
                : isSched
                ? `Automatically unlocks on ${saveSuccessData.scheduledDate} at ${formatTimeDisplay(saveSuccessData.scheduledTime || '')}.`
                : 'Your changes have been safely saved as a draft.'}
            </Text>

            {/* Push Notification Banner (Compact & Neat) */}
            {isPub && (
              <View style={styles.saveSuccessNotificationBox}>
                <View style={styles.saveSuccessBellCircle}>
                  <Bell size={13} color="#059669" />
                </View>
                <Text style={styles.saveSuccessNotificationTitle}>
                  Push notification broadcasted live to members
                </Text>
              </View>
            )}

            {isSched && (
              <View style={[styles.saveSuccessNotificationBox, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                <View style={[styles.saveSuccessBellCircle, { backgroundColor: '#DBEAFE' }]}>
                  <Clock size={13} color="#1E40AF" />
                </View>
                <Text style={[styles.saveSuccessNotificationTitle, { color: '#1E40AF' }]}>
                  Notification scheduled for {formatTimeDisplay(saveSuccessData.scheduledTime || '')} · Members will be notified at start time
                </Text>
              </View>
            )}

            {/* Summary Info Chips (3 Clean Symmetrical Pills) */}
            <View style={styles.celebrationBadgeRow}>
              <View style={styles.celebrationCountBadge}>
                <BookOpen size={12} color="#1a2d5a" />
                <Text style={styles.celebrationCountBadgeTxt}>
                  {saveSuccessData.questionCount} Questions
                </Text>
              </View>
              <View style={styles.saveSuccessDifficultyBadge}>
                <Text style={styles.saveSuccessDifficultyTxt}>
                  {difficulty.toUpperCase()}
                </Text>
              </View>
              <View style={styles.celebrationLangBadge}>
                <Globe size={12} color="#059669" />
                <Text style={styles.celebrationLangBadgeTxt}>
                  {getLangLabel()}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.celebrationActionsCol}>
              <TouchableOpacity
                style={styles.celebrationPrimaryBtn}
                onPress={() => {
                  const sId = saveSuccessData.savedId;
                  setSaveSuccessData(null);
                  onSaved(sId);
                }}
                activeOpacity={0.85}
              >
                <Check size={16} color="#ffffff" />
                <Text style={styles.celebrationPrimaryBtnTxt}>Done · View Quiz Library</Text>
              </TouchableOpacity>

              {isPub && (
                <TouchableOpacity
                  style={styles.celebrationSecondaryBtn}
                  onPress={() => {
                    setSaveSuccessData(null);
                    setPreviewVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Eye size={15} color="#1a2d5a" />
                  <Text style={styles.celebrationSecondaryBtnTxt}>Preview Member Experience</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Signature Navy Hero (Matching Daily Promise Header) ── */}
        <View style={styles.hero}>
          <View style={styles.heroTitleRow}>
            <TouchableOpacity onPress={onBack} style={styles.heroBackBtn} activeOpacity={0.7}>
              <ChevronLeft size={20} color="#fff" style={{ marginLeft: -4, marginRight: 2 }} />
              <Text style={styles.heroBackTxt}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.heroDivider}>|</Text>
            <Text style={styles.heroTitle}>{quizId ? 'Edit Bible Quiz' : 'New Bible Quiz'}</Text>
          </View>

          <TouchableOpacity
            style={styles.heroPreviewPill}
            onPress={() => setPreviewVisible(true)}
            activeOpacity={0.8}
          >
            <Eye size={15} color="#fff" />
            <Text style={styles.heroPreviewPillTxt}>Preview</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(keyboardHeight + 100, 420) },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          automaticallyAdjustKeyboardInsets={true}
          showsVerticalScrollIndicator={true}
          bounces={true}
        >
        {/* ── 1. Create Quiz from Uploaded Document (Up to 10 Questions) ── */}
        <View style={[styles.sectionCard, styles.topperCard]}>
          <View style={styles.secHeader}>
            <View style={styles.secHdPill}>
              <FileText size={14} color="#fff" />
            </View>
            <View>
              <Text style={styles.secHeadingText}>Upload Document</Text>
              <Text style={styles.topperSubHint}>Auto-extracts up to 10 questions</Text>
            </View>
          </View>

          {Boolean(sourceFile) && (
            <View style={styles.docAttachedBanner}>
              <FileText size={16} color="#1a2d5a" />
              <Text style={styles.docAttachedBannerTxt} numberOfLines={1}>{sourceFile}</Text>
              <TouchableOpacity onPress={() => setSourceFile('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.docAttachedRemoveBtn}>
                <X size={12} color="#dc2626" />
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.docUploadSub}>
            Supports PDF, Word (DOC/DOCX), Excel (XLSX), CSV, or Notepad (TXT) study notes. Automatically extracts and generates up to 10 questions.
          </Text>

          {/* Quick Language Target Selector (Symmetrical 2x2 Grid) */}
          <View style={styles.docLangContainer}>
            <Text style={styles.docLangLabel}>DOCUMENT / TARGET LANGUAGE:</Text>
            <View style={styles.docLangGrid}>
              {[
                { code: 'te', label: 'Telugu (తెలుగు)' },
                { code: 'en', label: 'English' },
                { code: 'hi', label: 'Hindi (हिन्दी)' },
                { code: 'ta', label: 'Tamil (தமிழ்)' },
              ].map(l => {
                const isSel = language === l.code;
                return (
                  <TouchableOpacity
                    key={l.code}
                    style={[styles.docLangPill, isSel && styles.docLangPillActive]}
                    onPress={() => setLanguage(l.code)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.docLangPillTxt, isSel && styles.docLangPillTxtActive]}>
                      {l.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {isGeneratingFromFile ? (
            <View style={styles.docLoadingRow}>
              <ActivityIndicator size="small" color="#1a2d5a" />
              <Text style={styles.docLoadingTxt}>{generatingStatus}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.docUploadActionBtn}
              onPress={handlePickDocument}
              activeOpacity={0.85}
            >
              <Upload size={16} color="#ffffff" />
              <Text style={styles.docUploadActionTxt}>Choose Document & Generate Quiz</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── 2. Schedule & Publication Section (Matching Daily Promise secNavy) ── */}
        <View style={styles.sectionCard}>
          <View style={styles.secHeader}>
            <View style={styles.secHdPill}>
              <CalendarIcon size={14} color="#fff" />
            </View>
            <Text style={styles.secHeadingText}>Schedule & Availability</Text>
          </View>

          {/* Status Segment Control: Draft | Scheduled | Publish Now */}
          <View style={styles.statusSegmentRow}>
            {(
              [
                { key: 'draft', label: 'Save Draft' },
                { key: 'scheduled', label: 'Scheduled' },
                { key: 'published', label: 'Publish Live' },
              ] as const
            ).map(opt => {
              const isSelected = publishStatus === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.statusSegmentBtn, isSelected && styles.statusSegmentBtnActive]}
                  onPress={() => {
                    setPublishStatus(opt.key);
                    if (opt.key === 'scheduled') {
                      setShowScheduleModal(true);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.statusSegmentTxt, isSelected && styles.statusSegmentTxtActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Inline Schedule Controls when Scheduled */}
          {publishStatus === 'scheduled' && (
            <View style={{ marginTop: 14 }}>
              <View style={styles.scheduleInfoBox}>
                <Clock size={16} color="#1a2d5a" />
                <Text style={styles.scheduleInfoTxt}>
                  Members will automatically unlock this quiz on{' '}
                  <Text style={{ fontWeight: '700' }}>{scheduledDate}</Text> at{' '}
                  <Text style={{ fontWeight: '700' }}>{formatTimeDisplay(scheduledTime)}</Text>.
                </Text>
              </View>

              {/* Release Date Trigger */}
              <Text style={styles.inputLabel}>Release Date</Text>
              <TouchableOpacity
                style={styles.datePickerTrigger}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
              >
                <CalendarIcon size={18} color="#1a2d5a" />
                <Text style={styles.datePickerTriggerTxt}>{scheduledDate}</Text>
                <Text style={{ marginLeft: 'auto', fontSize: 12, color: '#1a2d5a', fontWeight: '700' }}>
                  Pick Date 📅
                </Text>
              </TouchableOpacity>

              {/* Clock Picker Trigger */}
              <Text style={styles.inputLabel}>Release Time (Interactive Clock)</Text>
              <TouchableOpacity
                style={styles.timePickerTrigger}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.8}
              >
                <View style={styles.timePickerLeft}>
                  <View style={styles.timePickerIconCircle}>
                    <Clock size={18} color="#1a2d5a" />
                  </View>
                  <View>
                    <Text style={styles.timePickerLabel}>SCHEDULED TIME</Text>
                    <Text style={styles.timePickerValueTxt}>
                      {formatTimeDisplay(scheduledTime)}{' '}
                      <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748B' }}>
                        ({scheduledTime})
                      </Text>
                    </Text>
                  </View>
                </View>
                <View style={styles.timePickerChangeBtn}>
                  <Text style={styles.timePickerChangeBtnTxt}>Pick Clock ⏰</Text>
                </View>
              </TouchableOpacity>

              {/* Quick Time Presets */}
              <Text style={[styles.inputLabel, { marginTop: 4 }]}>Quick Presets</Text>
              <View style={styles.timePresetsRow}>
                {[
                  { time: '05:00', label: '5:00 AM' },
                  { time: '06:00', label: '6:00 AM' },
                  { time: '07:00', label: '7:00 AM' },
                  { time: '09:00', label: '9:00 AM' },
                  { time: '18:00', label: '6:00 PM' },
                  { time: '20:00', label: '8:00 PM' },
                ].map(p => {
                  const isSelected = scheduledTime === p.time;
                  return (
                    <TouchableOpacity
                      key={p.time}
                      style={[styles.timeChip, isSelected && styles.timeChipActive]}
                      onPress={() => setScheduledTime(p.time)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.timeChipTxt, isSelected && styles.timeChipTxtActive]}>
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* ── 3. Quiz Details (Clean, Simple, No confusing category chips) ── */}
        <View style={styles.sectionCard}>
          <View style={styles.secHeader}>
            <View style={styles.secHdPill}>
              <BookOpen size={14} color="#fff" />
            </View>
            <Text style={styles.secHeadingText}>Quiz Information</Text>
          </View>

          {/* Quiz Title */}
          <Text style={styles.fieldLabel}>Quiz Title <Text style={{ color: '#c0392b' }}>*</Text></Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Sunday Fellowship Bible Challenge"
            placeholderTextColor="#94A3B8"
          />

          {/* Bible Topic / Series */}
          <Text style={styles.fieldLabel}>Topic / Series (Optional)</Text>
          <TextInput
            style={styles.textInput}
            value={topic}
            onChangeText={setTopic}
            placeholder="e.g. Gospel of John, Life of David, Parables..."
            placeholderTextColor="#94A3B8"
          />

          {/* Difficulty Segment */}
          <Text style={styles.fieldLabel}>Difficulty</Text>
          <View style={styles.diffSegmentRow}>
            {(['easy', 'medium', 'hard'] as QuizDifficulty[]).map(d => {
              const isSelected = difficulty === d;
              return (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.diffSegmentBtn,
                    isSelected && (
                      d === 'easy'
                        ? styles.diffSegmentBtnEasyActive
                        : d === 'medium'
                        ? styles.diffSegmentBtnMediumActive
                        : styles.diffSegmentBtnHardActive
                    ),
                  ]}
                  onPress={() => setDifficulty(d)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.diffSegmentTxt, isSelected && styles.diffSegmentTxtActive]}>
                    {d.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Language Selector */}
          <Text style={styles.fieldLabel}>Language</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langChipsScroll}>
            {SUPPORTED_LANGUAGES.map(lang => {
              const isSelected = language === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langChip, isSelected && styles.langChipActive]}
                  onPress={() => setLanguage(lang.code)}
                >
                  <Text style={[styles.langChipTxt, isSelected && styles.langChipTxtActive]}>
                    {lang.name} ({lang.native})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Time Limit Selector */}
          <Text style={styles.fieldLabel}>Time Limit (Per Attempt)</Text>
          <Text style={styles.fieldHelpTxt}>
            A live countdown timer will be displayed during the quiz. Choose "No Limit" for relaxed untimed study.
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langChipsScroll}>
            {[
              { label: 'No Limit (Untimed)', value: 0 },
              { label: '5 Minutes', value: 5 },
              { label: '10 Minutes', value: 10 },
              { label: '15 Minutes', value: 15 },
              { label: '20 Minutes', value: 20 },
              { label: '30 Minutes', value: 30 },
              { label: '45 Minutes', value: 45 },
              { label: '60 Minutes', value: 60 },
            ].map(item => {
              const isSelected = timeLimitMinutes === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[styles.timeLimitChip, isSelected && styles.timeLimitChipActive]}
                  onPress={() => setTimeLimitMinutes(item.value)}
                  activeOpacity={0.75}
                >
                  <Clock size={12} color={isSelected ? '#ffffff' : '#475569'} />
                  <Text style={[styles.timeLimitChipTxt, isSelected && styles.timeLimitChipTxtActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── 4. Questions Builder (Google Forms style with premium styling) ── */}
        <View style={styles.sectionCard}>
          <View style={styles.secHeader}>
            <View style={styles.secHdPill}>
              <HelpCircle size={14} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.secHeadingText}>Quiz Questions ({questions.length})</Text>
              <Text style={styles.secSubheadingText}>
                Tap the circle (○) to mark the correct answer
              </Text>
            </View>
          </View>

          {questions.map((q, qIdx) => (
            <View key={q.id || qIdx} style={styles.questionCard}>
              {/* Question Header */}
              <View style={styles.qCardHeader}>
                <View style={styles.qNumberPill}>
                  <Text style={styles.qNumberTxt}>Q{qIdx + 1}</Text>
                </View>

                {/* Type toggle */}
                <View style={styles.qTypeToggleRow}>
                  <TouchableOpacity
                    style={[styles.qTypeBtn, q.questionType === 'single_choice' && styles.qTypeBtnActive]}
                    onPress={() => handleQuestionTypeChange(qIdx, 'single_choice')}
                  >
                    <Text style={[styles.qTypeBtnTxt, q.questionType === 'single_choice' && styles.qTypeBtnTxtActive]}>
                      Multiple Choice
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.qTypeBtn, q.questionType === 'true_false' && styles.qTypeBtnActive]}
                    onPress={() => handleQuestionTypeChange(qIdx, 'true_false')}
                  >
                    <Text style={[styles.qTypeBtnTxt, q.questionType === 'true_false' && styles.qTypeBtnTxtActive]}>
                      True / False
                    </Text>
                  </TouchableOpacity>
                </View>

                {questions.length > 1 && (
                  <TouchableOpacity
                    onPress={() => handleDeleteQuestion(qIdx)}
                    style={styles.qDeleteBtn}
                  >
                    <Trash2 size={16} color="#c0392b" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Question Text */}
              <TextInput
                style={styles.qInput}
                value={q.question}
                onChangeText={text => handleUpdateQuestion(qIdx, 'question', text)}
                placeholder="Type the question text here..."
                placeholderTextColor="#94A3B8"
                multiline
              />

              {/* Options */}
              <View style={styles.optionsWrap}>
                {(q.options || []).map((optVal, optIdx) => {
                  const isCorrect = q.correctAnswer === optVal && optVal.trim().length > 0;

                  return (
                    <View key={optIdx} style={styles.optionRow}>
                      <TouchableOpacity
                        style={[styles.radioCircle, isCorrect && styles.radioCircleActive]}
                        onPress={() => handleSetCorrectAnswer(qIdx, optVal)}
                        activeOpacity={0.7}
                      >
                        {isCorrect ? <View style={styles.radioDot} /> : null}
                      </TouchableOpacity>

                      <View style={[styles.optionInputWrap, isCorrect && styles.optionInputWrapCorrect]}>
                        <Text style={styles.optLetter}>{String.fromCharCode(65 + optIdx)}.</Text>
                        <TextInput
                          style={styles.optionTextInput}
                          value={optVal}
                          onChangeText={text => handleUpdateOption(qIdx, optIdx, text)}
                          placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                          placeholderTextColor="#94A3B8"
                        />
                        {isCorrect ? (
                          <CheckCircle size={16} color="#10B981" style={{ marginLeft: 6 }} />
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Bible Reference with Pick button */}
              <View style={styles.refRow}>
                <BookOpen size={16} color="#1a2d5a" />
                <TextInput
                  style={styles.refInput}
                  value={q.bibleReference || ''}
                  onChangeText={ref => handleUpdateQuestion(qIdx, 'bibleReference', ref)}
                  placeholder="Bible Reference (e.g. John 3:16)"
                  placeholderTextColor="#94A3B8"
                />
                <TouchableOpacity
                  style={styles.refPickBtn}
                  onPress={() => {
                    setActiveQuestionIndex(qIdx);
                    setPickerVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.refPickBtnTxt}>Pick Verse</Text>
                </TouchableOpacity>
              </View>

              {/* Explanation Input */}
              <TextInput
                style={styles.explanationInput}
                value={q.explanation || ''}
                onChangeText={exp => handleUpdateQuestion(qIdx, 'explanation', exp)}
                placeholder="Scripture Explanation / Devotional Insight (optional)"
                placeholderTextColor="#94A3B8"
              />
            </View>
          ))}

          {/* Add Question Button */}
          <TouchableOpacity
            style={styles.addQuestionBtn}
            onPress={handleAddQuestion}
            activeOpacity={0.75}
          >
            <Plus size={18} color="#1a2d5a" />
            <Text style={styles.addQuestionBtnTxt}>Add Another Question</Text>
          </TouchableOpacity>
        </View>

        {/* ── 5. Footer Buttons (Matching Daily Promise Footer) ── */}
        <View style={styles.footerBtnRow}>
          <TouchableOpacity
            style={styles.btnDraft}
            onPress={() => handleSave('draft')}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            <Save size={16} color="#1a2d5a" />
            <Text style={styles.btnDraftTxt}>Save as Draft</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.btnPublish,
              publishStatus === 'scheduled' && styles.btnScheduled,
            ]}
            onPress={() => handleSave(publishStatus)}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : publishStatus === 'scheduled' ? (
              <>
                <Clock size={16} color="#ffffff" />
                <Text style={styles.btnPublishTxt}>Schedule Quiz</Text>
              </>
            ) : publishStatus === 'draft' ? (
              <>
                <Save size={16} color="#ffffff" />
                <Text style={styles.btnPublishTxt}>Save Draft</Text>
              </>
            ) : (
              <>
                <Send size={16} color="#ffffff" />
                <Text style={styles.btnPublishTxt}>Publish Quiz Live</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Modals */}
      {renderCalendarModal()}
      {renderScheduleModal()}
      {renderPreviewModal()}
      {renderSuccessModal()}
      {renderSaveSuccessModal()}

      {/* Native Interactive Clock Time Picker (Root Level - No Modal Nesting Conflicts) */}
      <DateTimePickerModal
        isVisible={showTimePicker}
        mode="time"
        date={(() => {
          const d = new Date();
          if (scheduledTime) {
            const [h, m] = scheduledTime.split(':');
            let hNum = parseInt(h, 10);
            if (scheduledDate === todayStr && hNum < 12 && d.getHours() >= 12) {
              hNum += 12;
            }
            d.setHours(hNum || 12, parseInt(m, 10) || 0, 0, 0);
          } else {
            d.setMinutes(d.getMinutes() + 10);
          }
          return d;
        })()}
        onConfirm={handleConfirmTime}
        onCancel={() => setShowTimePicker(false)}
      />

      <BibleReferencePickerModal
        visible={pickerVisible}
        onClose={() => {
          setPickerVisible(false);
          setActiveQuestionIndex(null);
        }}
        mode="reference"
        onSelectReference={handleSelectReference}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDE8DC',
  },
  // ── Hero Header ─────────────────────────────────────────────────────────────
  hero: {
    backgroundColor: '#1a2d5a',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingTop: Platform.OS === 'ios' ? 52 : 22,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroBackTxt: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  heroDivider: {
    color: '#ffffff',
    marginHorizontal: 10,
    opacity: 0.4,
    fontSize: 14,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  heroPreviewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  heroPreviewPillTxt: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
    paddingBottom: 400,
  },
  // ── Topper AI Studio Card ──────────────────────────────────────────────────
  topperCard: {
    borderWidth: 1.5,
    borderColor: 'rgba(26, 45, 90, 0.12)',
    borderRadius: 18,
    backgroundColor: '#ffffff',
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  topperIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#1a2d5a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topperSubHint: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
    fontWeight: '500',
  },
  topperBadge: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  topperBadgeTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 0.3,
  },
  docAttachedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  docAttachedBannerTxt: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#1a2d5a',
  },
  docAttachedRemoveBtn: {
    padding: 4,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  secHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  secHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  docAttachedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxWidth: '45%',
  },
  docAttachedPillTxt: {
    color: '#1a2d5a',
    fontSize: 11,
    fontWeight: '600',
  },
  docUploadSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  docLangContainer: {
    marginBottom: 14,
  },
  docLangLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  docLangGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  docLangPill: {
    flexBasis: '48%',
    flexGrow: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  docLangPillActive: {
    backgroundColor: '#1a2d5a',
    borderColor: '#1a2d5a',
  },
  docLangPillTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  docLangPillTxtActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  docUploadActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1a2d5a',
    paddingVertical: 13,
    borderRadius: 12,
    shadowColor: '#1a2d5a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  docUploadActionTxt: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  docLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
  },
  docLoadingTxt: {
    color: '#1a2d5a',
    fontSize: 12,
    fontWeight: '600',
  },
  // ── Section Card (Signature Daily Promise secNavy) ──────────────────────────
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  secHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  secHdPill: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#1a2d5a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secHeadingText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1a2d5a',
    letterSpacing: 0.3,
  },
  secSubheadingText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  // ── Status Segment Control ──────────────────────────────────────────────────
  statusSegmentRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    gap: 3,
    marginBottom: 10,
  },
  statusSegmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusSegmentBtnActive: {
    backgroundColor: '#1a2d5a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusSegmentTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  statusSegmentTxtActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  scheduleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scheduleInfoRowTxt: {
    fontSize: 12,
    color: '#475569',
  },
  // ── Inputs & Details ────────────────────────────────────────────────────────
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    marginBottom: 6,
  },
  diffSegmentRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    gap: 6,
    marginBottom: 6,
  },
  diffSegmentBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  diffSegmentBtnEasyActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  diffSegmentBtnMediumActive: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  diffSegmentBtnHardActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  diffSegmentTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  diffSegmentTxtActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  langChipsScroll: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  langChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langChipActive: {
    backgroundColor: '#1a2d5a',
    borderColor: '#1a2d5a',
  },
  langChipTxt: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  langChipTxtActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  timeLimitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  timeLimitChipActive: {
    backgroundColor: '#1a2d5a',
    borderColor: '#1a2d5a',
    shadowColor: '#1a2d5a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  timeLimitChipTxt: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '600',
  },
  timeLimitChipTxtActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  fieldHelpTxt: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
    lineHeight: 15,
  },
  // ── Question Cards ──────────────────────────────────────────────────────────
  questionCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    backgroundColor: '#FAFAFA',
  },
  qCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  qNumberPill: {
    backgroundColor: '#1a2d5a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qNumberTxt: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  qTypeToggleRow: {
    flexDirection: 'row',
    gap: 6,
  },
  qTypeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EEF2F6',
  },
  qTypeBtnActive: {
    backgroundColor: '#1a2d5a',
  },
  qTypeBtnTxt: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
  },
  qTypeBtnTxtActive: {
    color: '#ffffff',
  },
  qDeleteBtn: {
    padding: 4,
  },
  qInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#ffffff',
    marginBottom: 10,
    minHeight: 48,
  },
  optionsWrap: {
    gap: 8,
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioCircleActive: {
    borderColor: '#10B981',
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#10B981',
  },
  optionInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#ffffff',
  },
  optionInputWrapCorrect: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  optLetter: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginRight: 6,
  },
  optionTextInput: {
    flex: 1,
    paddingVertical: 7,
    fontSize: 13,
    color: '#0F172A',
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  refInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 12.5,
    color: '#0F172A',
  },
  refPickBtn: {
    backgroundColor: '#1a2d5a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  refPickBtnTxt: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  explanationInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 8,
    fontSize: 12,
    color: '#475569',
    backgroundColor: '#ffffff',
  },
  addQuestionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#1a2d5a',
    borderStyle: 'dashed',
    borderRadius: 10,
    marginTop: 4,
  },
  addQuestionBtnTxt: {
    color: '#1a2d5a',
    fontSize: 13,
    fontWeight: '700',
  },
  // ── Footer Action Buttons (Matching Daily Promise) ──────────────────────────
  footerBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  btnDraft: {
    flex: 1,
    backgroundColor: '#F5F0E8',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(26,45,90,0.30)',
  },
  btnDraftTxt: {
    color: '#1a2d5a',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  btnPublish: {
    flex: 1,
    backgroundColor: '#2E6B4F',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    elevation: 6,
    shadowColor: '#2E6B4F',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  btnScheduled: {
    backgroundColor: '#1a2d5a',
    shadowColor: '#1a2d5a',
  },
  btnPublishTxt: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  // ── Modals ──────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  calendarCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
  },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  calNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calNavBtn: {
    padding: 6,
  },
  calMonthYearTxt: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a2d5a',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekdayTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    width: 38,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  emptyDayCell: {
    width: '14.28%',
    height: 38,
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  dayCellSelected: {
    backgroundColor: '#1a2d5a',
  },
  dayCellTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  dayCellTxtSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  todayShortcutBtn: {
    alignSelf: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
  },
  todayShortcutTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a2d5a',
  },
  scheduleModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  datePickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  datePickerTriggerTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a2d5a',
  },
  timePresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  timeChipActive: {
    backgroundColor: '#1a2d5a',
  },
  timeChipTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  timeChipTxtActive: {
    color: '#ffffff',
  },
  customTimeInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 12,
  },
  scheduleInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  scheduleInfoTxt: {
    flex: 1,
    fontSize: 11,
    color: '#1E40AF',
    lineHeight: 15,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  modalCancelBtnTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  modalConfirmBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#1a2d5a',
  },
  modalConfirmBtnTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  previewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  previewBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1a2d5a',
    marginBottom: 2,
  },
  previewTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  previewSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  previewScroll: {
    padding: 16,
  },
  previewQuestionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewQHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  previewQNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  previewQRef: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a2d5a',
  },
  previewQText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 10,
    lineHeight: 19,
  },
  previewOptionsCol: {
    gap: 6,
  },
  previewOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewOptionSelected: {
    borderColor: '#1a2d5a',
    backgroundColor: '#F0F5FF',
  },
  previewOptionCorrect: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  previewOptionTxt: {
    fontSize: 13,
    color: '#334155',
  },
  previewOptionTxtSelected: {
    fontWeight: '700',
    color: '#1a2d5a',
  },
  previewOptionTxtCorrect: {
    fontWeight: '700',
    color: '#10B981',
  },
  previewExpBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  previewExpLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  previewExpTxt: {
    fontSize: 12,
    color: '#334155',
    marginTop: 2,
  },
  previewFooter: {
    flexDirection: 'row',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  previewToggleBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  previewToggleBtnTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  previewCloseBtn: {
    paddingHorizontal: 18,
    backgroundColor: '#1a2d5a',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  previewCloseBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },


  // ── Document Upload Success Modal ───────────────────────────────────────────
  celebrationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    paddingTop: 24,
    width: '92%',
    maxWidth: 420,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
  },
  celebrationCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  celebrationIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  celebrationTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  celebrationSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  celebrationBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  celebrationLangBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  celebrationLangBadgeTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  celebrationCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  celebrationCountBadgeTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a2d5a',
  },
  celebrationSampleBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 16,
  },

  celebrationSampleTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },

  celebrationSampleQText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 18,
    marginBottom: 8,
  },
  celebrationSampleOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  celebrationSampleOptionPill: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  celebrationSampleOptionTxt: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
  celebrationActionsCol: {
    width: '100%',
    gap: 8,
  },
  celebrationPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1a2d5a',
    paddingVertical: 13,
    borderRadius: 12,
    shadowColor: '#1a2d5a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  celebrationPrimaryBtnTxt: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  celebrationSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  celebrationSecondaryBtnTxt: {
    color: '#1a2d5a',
    fontSize: 13,
    fontWeight: '600',
  },
  saveSuccessNotificationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: '100%',
    marginBottom: 12,
  },
  saveSuccessBellCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveSuccessNotificationTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#065F46',
    flex: 1,
  },
  saveSuccessDifficultyBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  saveSuccessDifficultyTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  cleanQuizTitleBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginBottom: 8,
    width: '100%',
    alignItems: 'center',
  },
  cleanQuizTitleTxt: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1a2d5a',
    textAlign: 'center',
    lineHeight: 19,
  },
  timePickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  timePickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timePickerIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickerLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timePickerValueTxt: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A2D5A',
  },
  timePickerChangeBtn: {
    backgroundColor: '#1A2D5A',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  timePickerChangeBtnTxt: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
