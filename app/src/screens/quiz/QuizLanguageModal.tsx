import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Check, X, Globe } from 'lucide-react-native';
import { useQuizLanguage } from '../../context/QuizLanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { SupportedLanguage } from '../../locales';
import { getQuizStrings } from '../../constants/BibleQuizTranslations';

interface QuizLanguageModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function QuizLanguageModal({ visible, onClose }: QuizLanguageModalProps) {
  const { quizLanguage, setQuizLanguage, languages } = useQuizLanguage();
  const { isDark } = useTheme();
  const ui = getQuizStrings(quizLanguage);

  const handleSelect = (code: SupportedLanguage) => {
    onClose();
    setQuizLanguage(code);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: isDark ? '#141d2e' : '#ffffff',
                  borderColor: isDark ? '#26354a' : '#e2e8f0',
                },
              ]}
            >
              {/* Header */}
              <View
                style={[
                  styles.headerRow,
                  { borderBottomColor: isDark ? '#26354a' : '#e2e8f0' },
                ]}
              >
                <View style={styles.titleWrap}>
                  <Globe size={18} color="#2563EB" />
                  <Text
                    style={[
                      styles.title,
                      { color: isDark ? '#f8fafc' : '#0f172a' },
                    ]}
                  >
                    {ui.selectLanguage}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={[
                    styles.closeBtn,
                    { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
                  ]}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={16} color={isDark ? '#cbd5e1' : '#64748b'} />
                </TouchableOpacity>
              </View>

              {/* Language Options List from Member View */}
              <ScrollView style={styles.listArea} showsVerticalScrollIndicator={false}>
                {languages.map((lang) => {
                  const isSelected = quizLanguage === lang.code;
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.langItem,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? 'rgba(37, 99, 235, 0.16)'
                              : '#eff6ff'
                            : 'transparent',
                          borderColor: isSelected
                            ? '#2563EB'
                            : isDark
                            ? '#1e293b'
                            : '#f1f5f9',
                        },
                      ]}
                      onPress={() => handleSelect(lang.code)}
                      activeOpacity={0.7}
                    >
                      <View>
                        <Text
                          style={[
                            styles.langNative,
                            {
                              color: isSelected
                                ? '#2563EB'
                                : isDark
                                ? '#f8fafc'
                                : '#0f172a',
                            },
                          ]}
                        >
                          {lang.nativeName}
                        </Text>
                        <Text
                          style={[
                            styles.langEnglish,
                            { color: isDark ? '#94a3b8' : '#64748b' },
                          ]}
                        >
                          {lang.name}
                        </Text>
                      </View>

                      {isSelected && (
                        <View style={styles.checkCircle}>
                          <Check size={14} color="#ffffff" strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listArea: {
    maxHeight: 360,
    padding: 10,
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
  langNative: {
    fontSize: 15,
    fontWeight: '700',
  },
  langEnglish: {
    fontSize: 12,
    marginTop: 2,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
