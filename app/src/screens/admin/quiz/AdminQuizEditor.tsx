import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Plus,
  Trash2,
  BookOpen,
  ChevronLeft,
  CheckCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { BibleQuiz, QuizDifficulty, QuizQuestion, QuizQuestionType, QuizStatus } from '../../../types/Quiz';
import { QuizService } from '../../../services/QuizService';
import { QUIZ_CATEGORIES } from '../../../constants/BibleQuizCategories';
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
  const [category, setCategory] = useState<string>(initialQuiz?.category || 'Family');
  const [difficulty, setDifficulty] = useState<QuizDifficulty>(initialQuiz?.difficulty || 'easy');
  const [level, setLevel] = useState<number | undefined>(initialQuiz?.level || 1);
  const [description, setDescription] = useState<string>(initialQuiz?.description || '');

  // Optional settings
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<string>(
    initialQuiz?.timeLimitMinutes !== undefined ? String(initialQuiz.timeLimitMinutes) : '0'
  );
  const [passPercentage, setPassPercentage] = useState<string>(
    initialQuiz?.passPercentage ? String(initialQuiz.passPercentage) : '70'
  );

  // Questions state
  const [questions, setQuestions] = useState<QuizQuestion[]>(() => {
    if (initialQuiz?.questions && initialQuiz.questions.length > 0) {
      return initialQuiz.questions;
    }
    return [createBlankQuestion(1)];
  });

  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Bible Reference Picker Modal state
  const [pickerVisible, setPickerVisible] = useState<boolean>(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(null);

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

  const handleSave = async (targetStatus: QuizStatus) => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a Quiz Title.');
      return;
    }

    if (questions.length === 0) {
      Alert.alert('Missing Questions', 'Please add at least one question.');
      return;
    }

    // Friendly validation: Check question text and correct answer
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        Alert.alert('Incomplete Question', `Please type the question text for Question #${i + 1}.`);
        return;
      }

      const nonEmptyOptions = (q.options || []).filter(opt => opt.trim().length > 0);
      if (nonEmptyOptions.length < 2) {
        Alert.alert(
          'Missing Options',
          `Please provide at least 2 choices for Question #${i + 1}.`
        );
        return;
      }

      const hasCorrectAnswer = Array.isArray(q.correctAnswer)
        ? q.correctAnswer.length > 0
        : Boolean(q.correctAnswer && String(q.correctAnswer).trim());

      if (!hasCorrectAnswer) {
        Alert.alert(
          'Correct Answer Required',
          `Please select the correct answer for Question #${i + 1}.`
        );
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

      const payload: Partial<BibleQuiz> = {
        id: quizId,
        churchId,
        churchName,
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        difficulty,
        level: level || 1,
        language: 'en',
        timeLimitMinutes: parseInt(timeLimitMinutes, 10) || 0,
        marksPerQuestion: 1,
        passPercentage: parseInt(passPercentage, 10) || 70,
        isDailyQuiz: false,
        allowMultipleAttempts: true,
        status: targetStatus,
        questions: sanitizedQuestions,
      };

      const savedId = await QuizService.saveQuiz(payload);
      Alert.alert(
        targetStatus === 'published' ? 'Quiz Published! 🎉' : 'Draft Saved 👍',
        targetStatus === 'published'
          ? `Your quiz for "${category} · Level ${level || 1}" is now live!`
          : 'Your quiz draft has been saved successfully.',
        [{ text: 'OK', onPress: () => onSaved(savedId) }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save quiz. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft size={22} color="#1E293B" />
          <Text style={styles.backBtnTxt}>Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.topBarTitle}>
          {quizId ? 'Edit Bible Quiz' : 'Create Bible Quiz'}
        </Text>

        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Basic Information</Text>

          {/* Quiz Title */}
          <Text style={styles.label}>Quiz Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Family Bible Challenge"
            placeholderTextColor="#94A3B8"
          />

          {/* Category Dropdown/Chips */}
          <Text style={styles.label}>Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {QUIZ_CATEGORIES.map(cat => {
              const isSelected = category === cat.name;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catChip, isSelected && styles.catChipActive]}
                  onPress={() => setCategory(cat.name)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.catChipTxt, isSelected && styles.catChipTxtActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Difficulty: Easy | Medium | Hard */}
          <Text style={styles.label}>Difficulty</Text>
          <View style={styles.segmentedRow}>
            {(['easy', 'medium', 'hard'] as QuizDifficulty[]).map(d => {
              const isSelected = difficulty === d;
              return (
                <TouchableOpacity
                  key={d}
                  style={[styles.segmentBtn, isSelected && styles.segmentBtnActive]}
                  onPress={() => setDifficulty(d)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentBtnTxt, isSelected && styles.segmentBtnTxtActive]}>
                    {d.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Level: Level 1 to 30 */}
          <Text style={styles.label}>Level (1 - 30)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {Array.from({ length: 30 }, (_, idx) => {
              const lvlNum = idx + 1;
              const isSelected = level === lvlNum;
              return (
                <TouchableOpacity
                  key={lvlNum}
                  style={[styles.levelChip, isSelected && styles.levelChipActive]}
                  onPress={() => setLevel(lvlNum)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.levelChipTxt, isSelected && styles.levelChipTxtActive]}>
                    Level {lvlNum}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Optional Advanced Settings Accordion */}
          <TouchableOpacity
            style={styles.advancedToggle}
            onPress={() => setShowAdvanced(!showAdvanced)}
            activeOpacity={0.7}
          >
            <Text style={styles.advancedToggleTxt}>
              {showAdvanced ? 'Hide Optional Settings' : '+ Optional Settings (Time Limit, Pass Score)'}
            </Text>
            {showAdvanced ? (
              <ChevronUp size={16} color="#3B5998" />
            ) : (
              <ChevronDown size={16} color="#3B5998" />
            )}
          </TouchableOpacity>

          {showAdvanced && (
            <View style={styles.advancedBox}>
              <Text style={styles.label}>Description / Encouragement (Optional)</Text>
              <TextInput
                style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Words of encouragement for church members..."
                placeholderTextColor="#94A3B8"
                multiline
              />

              <View style={styles.rowTwoCols}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Time Limit (Minutes)</Text>
                  <TextInput
                    style={styles.input}
                    value={timeLimitMinutes}
                    onChangeText={setTimeLimitMinutes}
                    placeholder="0 for Untimed"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Passing Score (%)</Text>
                  <TextInput
                    style={styles.input}
                    value={passPercentage}
                    onChangeText={setPassPercentage}
                    placeholder="70"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Questions Builder Card (Google Forms Style) */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Questions ({questions.length})</Text>
          <Text style={styles.cardSubheading}>
            Select the radio circle (○) to mark the correct answer
          </Text>

          {questions.map((q, qIdx) => (
            <View key={q.id || qIdx} style={styles.googleFormQuestionBox}>
              {/* Question Header */}
              <View style={styles.qHeader}>
                <View style={styles.qIndexPill}>
                  <Text style={styles.qIndexTxt}>Question {qIdx + 1}</Text>
                </View>

                {/* Question Type Selector: Multiple Choice | True/False */}
                <View style={styles.typeSelectorRow}>
                  <TouchableOpacity
                    style={[
                      styles.typeBtn,
                      q.questionType === 'single_choice' && styles.typeBtnActive,
                    ]}
                    onPress={() => handleQuestionTypeChange(qIdx, 'single_choice')}
                  >
                    <Text
                      style={[
                        styles.typeBtnTxt,
                        q.questionType === 'single_choice' && styles.typeBtnTxtActive,
                      ]}
                    >
                      Multiple Choice
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeBtn,
                      q.questionType === 'true_false' && styles.typeBtnActive,
                    ]}
                    onPress={() => handleQuestionTypeChange(qIdx, 'true_false')}
                  >
                    <Text
                      style={[
                        styles.typeBtnTxt,
                        q.questionType === 'true_false' && styles.typeBtnTxtActive,
                      ]}
                    >
                      True / False
                    </Text>
                  </TouchableOpacity>
                </View>

                {questions.length > 1 && (
                  <TouchableOpacity
                    onPress={() => handleDeleteQuestion(qIdx)}
                    style={styles.deleteBtn}
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Question Input */}
              <TextInput
                style={styles.questionInput}
                value={q.question}
                onChangeText={val => handleUpdateQuestion(qIdx, 'question', val)}
                placeholder="Question (e.g. Who built the ark?)"
                placeholderTextColor="#94A3B8"
                multiline
              />

              {/* Options with Radio Circles (Google Forms style) */}
              <View style={styles.optionsWrap}>
                {q.options.map((optVal, optIdx) => {
                  const isCorrect = Boolean(optVal.trim()) && q.correctAnswer === optVal;
                  return (
                    <View
                      key={optIdx}
                      style={[
                        styles.optionRow,
                        isCorrect && styles.optionRowCorrect,
                      ]}
                    >
                      {/* Radio Circle */}
                      <TouchableOpacity
                        style={[
                          styles.radioCircle,
                          isCorrect && styles.radioCircleActive,
                        ]}
                        onPress={() => {
                          if (!optVal.trim()) {
                            Alert.alert('Notice', 'Please type option text first.');
                            return;
                          }
                          handleSetCorrectAnswer(qIdx, optVal);
                        }}
                        activeOpacity={0.7}
                      >
                        {isCorrect ? (
                          <View style={styles.radioInnerFilled} />
                        ) : null}
                      </TouchableOpacity>

                      {/* Option Text Input */}
                      <TextInput
                        style={[
                          styles.optionInput,
                          isCorrect && styles.optionInputCorrect,
                        ]}
                        value={optVal}
                        onChangeText={text => handleUpdateOption(qIdx, optIdx, text)}
                        placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                        placeholderTextColor="#94A3B8"
                      />

                      {isCorrect ? (
                        <CheckCircle size={16} color="#10B981" style={{ marginRight: 6 }} />
                      ) : null}
                    </View>
                  );
                })}
              </View>

              {/* Bible Reference & Explanation */}
              <View style={styles.refRow}>
                <BookOpen size={16} color="#3B5998" />
                <TextInput
                  style={styles.refInput}
                  value={q.bibleReference || ''}
                  onChangeText={ref => handleUpdateQuestion(qIdx, 'bibleReference', ref)}
                  placeholder="Bible Reference (e.g. Genesis 6)"
                  placeholderTextColor="#94A3B8"
                />
                <TouchableOpacity
                  style={styles.refPickerBtn}
                  onPress={() => {
                    setActiveQuestionIndex(qIdx);
                    setPickerVisible(true);
                  }}
                >
                  <Text style={styles.refPickerBtnTxt}>Pick</Text>
                </TouchableOpacity>
              </View>

              {/* Explanation Input */}
              <TextInput
                style={styles.explanationInput}
                value={q.explanation || ''}
                onChangeText={exp => handleUpdateQuestion(qIdx, 'explanation', exp)}
                placeholder="Short Explanation (e.g. Noah was instructed by God to build the ark.)"
                placeholderTextColor="#94A3B8"
              />
            </View>
          ))}

          {/* + Add Question Button */}
          <TouchableOpacity
            style={styles.addQuestionBtn}
            onPress={handleAddQuestion}
            activeOpacity={0.75}
          >
            <Plus size={20} color="#3B5998" />
            <Text style={styles.addQuestionBtnTxt}>+ Add Question</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.draftBtn}
          onPress={() => handleSave('draft')}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          <Text style={styles.draftBtnTxt}>Save as Draft</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.publishBtn}
          onPress={() => handleSave('published')}
          disabled={isSaving}
          activeOpacity={0.85}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={18} color="#ffffff" />
              <Text style={styles.publishBtnTxt}>Publish Quiz</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Scripture Reference Picker Modal */}
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
    backgroundColor: '#F1F5F9',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtnTxt: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '600',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollArea: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardSubheading: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0F172A',
  },
  chipsScroll: {
    marginBottom: 6,
  },
  catChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catChipActive: {
    backgroundColor: '#3B5998',
    borderColor: '#3B5998',
  },
  catChipTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  catChipTxtActive: {
    color: '#ffffff',
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  segmentBtnActive: {
    backgroundColor: '#3B5998',
    borderColor: '#3B5998',
  },
  segmentBtnTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  segmentBtnTxtActive: {
    color: '#ffffff',
  },
  levelChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  levelChipActive: {
    backgroundColor: '#3B5998',
    borderColor: '#3B5998',
  },
  levelChipTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  levelChipTxtActive: {
    color: '#ffffff',
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 8,
  },
  advancedToggleTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B5998',
  },
  advancedBox: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 12,
  },
  googleFormQuestionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 16,
  },
  qHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  qIndexPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  qIndexTxt: {
    fontSize: 12,
    fontWeight: '800',
    color: '#3B5998',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 6,
  },
  typeBtn: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBtnActive: {
    backgroundColor: '#3B5998',
  },
  typeBtnTxt: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  typeBtnTxtActive: {
    color: '#ffffff',
  },
  deleteBtn: {
    padding: 4,
  },
  questionInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0F172A',
    minHeight: 52,
    marginBottom: 12,
  },
  optionsWrap: {
    gap: 8,
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  optionRowCorrect: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioCircleActive: {
    borderColor: '#10B981',
  },
  radioInnerFilled: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  optionInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 8,
  },
  optionInputCorrect: {
    fontWeight: '600',
    color: '#065F46',
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 8,
    marginBottom: 8,
  },
  refInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 6,
  },
  refPickerBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  refPickerBtnTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B5998',
  },
  explanationInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  addQuestionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 6,
    marginTop: 6,
  },
  addQuestionBtnTxt: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3B5998',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 12,
  },
  draftBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftBtnTxt: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  publishBtn: {
    flex: 1.5,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  publishBtnTxt: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
