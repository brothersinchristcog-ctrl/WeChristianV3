import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Lock,
  HelpCircle,
  LogOut,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  Star,
  Award,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export type QuizAlertModalType =
  | 'locked'
  | 'unanswered'
  | 'exit'
  | 'timeup'
  | 'warning'
  | 'error'
  | 'success'
  | 'info';

export interface QuizAlertModalProps {
  visible: boolean;
  type?: QuizAlertModalType;
  badgeText?: string;
  title: string;
  message: string;
  highlightText?: string;
  highlightIcon?: 'star' | 'lock' | 'alert' | 'award';
  primaryBtnText?: string;
  primaryBtnGradient?: [string, string];
  secondaryBtnText?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  onClose?: () => void;
  cancelable?: boolean;
}

export default function QuizAlertModal({
  visible,
  type = 'info',
  badgeText,
  title,
  message,
  highlightText,
  highlightIcon,
  primaryBtnText = 'OK',
  primaryBtnGradient,
  secondaryBtnText,
  onPrimary,
  onSecondary,
  onClose,
  cancelable = true,
}: QuizAlertModalProps) {
  const { isDark } = useTheme();

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleDismiss = () => {
    if (onClose) {
      onClose();
    } else if (onSecondary) {
      onSecondary();
    }
  };

  const handlePrimaryPress = () => {
    if (onPrimary) {
      onPrimary();
    } else {
      handleDismiss();
    }
  };

  const handleSecondaryPress = () => {
    if (onSecondary) {
      onSecondary();
    } else {
      handleDismiss();
    }
  };

  // Determine theme styles based on modal type
  const getTypeConfig = () => {
    switch (type) {
      case 'locked':
        return {
          icon: <Lock size={30} color="#FFFFFF" strokeWidth={2.4} />,
          gradient: ['#F59E0B', '#D97706'] as [string, string],
          haloColor: 'rgba(245, 158, 11, 0.28)',
          badgeBg: isDark ? 'rgba(245, 158, 11, 0.18)' : '#FEF3C7',
          badgeTextColor: isDark ? '#FBBF24' : '#B45309',
          defaultBadge: 'LEVEL LOCKED',
          btnGradient: ['#2563EB', '#1D4ED8'] as [string, string],
          cardBorder: isDark ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.3)',
        };
      case 'unanswered':
        return {
          icon: <HelpCircle size={32} color="#FFFFFF" strokeWidth={2.4} />,
          gradient: ['#F97316', '#EA580C'] as [string, string],
          haloColor: 'rgba(249, 115, 22, 0.3)',
          badgeBg: isDark ? 'rgba(249, 115, 22, 0.18)' : '#FFEDD5',
          badgeTextColor: isDark ? '#FB923C' : '#C2410C',
          defaultBadge: 'ATTENTION NEEDED',
          btnGradient: ['#2563EB', '#1D4ED8'] as [string, string],
          cardBorder: isDark ? 'rgba(249, 115, 22, 0.25)' : 'rgba(249, 115, 22, 0.3)',
        };
      case 'exit':
        return {
          icon: <LogOut size={30} color="#FFFFFF" strokeWidth={2.4} />,
          gradient: ['#EF4444', '#DC2626'] as [string, string],
          haloColor: 'rgba(239, 68, 68, 0.3)',
          badgeBg: isDark ? 'rgba(239, 68, 68, 0.18)' : '#FEE2E2',
          badgeTextColor: isDark ? '#F87171' : '#B91C1C',
          defaultBadge: 'EXIT QUIZ',
          btnGradient: ['#EF4444', '#DC2626'] as [string, string],
          cardBorder: isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.3)',
        };
      case 'timeup':
        return {
          icon: <Clock size={32} color="#FFFFFF" strokeWidth={2.4} />,
          gradient: ['#8B5CF6', '#6D28D9'] as [string, string],
          haloColor: 'rgba(139, 92, 246, 0.3)',
          badgeBg: isDark ? 'rgba(139, 92, 246, 0.18)' : '#EDE9FE',
          badgeTextColor: isDark ? '#A78BFA' : '#6D28D9',
          defaultBadge: "TIME'S UP",
          btnGradient: ['#8B5CF6', '#6D28D9'] as [string, string],
          cardBorder: isDark ? 'rgba(139, 92, 246, 0.25)' : 'rgba(139, 92, 246, 0.3)',
        };
      case 'success':
        return {
          icon: <CheckCircle2 size={32} color="#FFFFFF" strokeWidth={2.4} />,
          gradient: ['#10B981', '#059669'] as [string, string],
          haloColor: 'rgba(16, 185, 129, 0.3)',
          badgeBg: isDark ? 'rgba(16, 185, 129, 0.18)' : '#D1FAE5',
          badgeTextColor: isDark ? '#34D399' : '#047857',
          defaultBadge: 'SUCCESS',
          btnGradient: ['#10B981', '#059669'] as [string, string],
          cardBorder: isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.3)',
        };
      case 'error':
        return {
          icon: <AlertTriangle size={32} color="#FFFFFF" strokeWidth={2.4} />,
          gradient: ['#F43F5E', '#BE123C'] as [string, string],
          haloColor: 'rgba(244, 63, 94, 0.3)',
          badgeBg: isDark ? 'rgba(244, 63, 94, 0.18)' : '#FFE4E6',
          badgeTextColor: isDark ? '#FB7185' : '#BE123C',
          defaultBadge: 'ERROR',
          btnGradient: ['#F43F5E', '#BE123C'] as [string, string],
          cardBorder: isDark ? 'rgba(244, 63, 94, 0.25)' : 'rgba(244, 63, 94, 0.3)',
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={32} color="#FFFFFF" strokeWidth={2.4} />,
          gradient: ['#F59E0B', '#D97706'] as [string, string],
          haloColor: 'rgba(245, 158, 11, 0.3)',
          badgeBg: isDark ? 'rgba(245, 158, 11, 0.18)' : '#FEF3C7',
          badgeTextColor: isDark ? '#FBBF24' : '#B45309',
          defaultBadge: 'WARNING',
          btnGradient: ['#F59E0B', '#D97706'] as [string, string],
          cardBorder: isDark ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.3)',
        };
      default:
        return {
          icon: <Info size={32} color="#FFFFFF" strokeWidth={2.4} />,
          gradient: ['#3B82F6', '#1D4ED8'] as [string, string],
          haloColor: 'rgba(59, 130, 246, 0.3)',
          badgeBg: isDark ? 'rgba(59, 130, 246, 0.18)' : '#DBEAFE',
          badgeTextColor: isDark ? '#60A5FA' : '#1D4ED8',
          defaultBadge: 'INFORMATION',
          btnGradient: ['#3B82F6', '#1D4ED8'] as [string, string],
          cardBorder: isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.3)',
        };
    }
  };

  const config = getTypeConfig();
  const activeBadgeText = badgeText || config.defaultBadge;
  const finalBtnGradient = primaryBtnGradient || config.btnGradient;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={cancelable ? handleDismiss : undefined}
    >
      <TouchableWithoutFeedback onPress={cancelable ? handleDismiss : undefined}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalCard,
                {
                  backgroundColor: isDark ? '#0D1527' : '#FFFFFF',
                  borderColor: config.cardBorder,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* Optional Close Button */}
              {cancelable && (
                <TouchableOpacity
                  onPress={handleDismiss}
                  style={[
                    styles.closeBtn,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.7}
                >
                  <X size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                </TouchableOpacity>
              )}

              {/* Glowing Halo & Floating Icon Badge */}
              <View style={styles.badgeWrapper}>
                <View
                  style={[
                    styles.haloCircle,
                    { backgroundColor: config.haloColor },
                  ]}
                />
                <LinearGradient
                  colors={config.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconCircle}
                >
                  {config.icon}
                </LinearGradient>
              </View>

              {/* Status / Category Tag */}
              {activeBadgeText ? (
                <View
                  style={[
                    styles.tagBadge,
                    { backgroundColor: config.badgeBg },
                  ]}
                >
                  <Text
                    style={[
                      styles.tagText,
                      { color: config.badgeTextColor },
                    ]}
                  >
                    {activeBadgeText}
                  </Text>
                </View>
              ) : null}

              {/* Title */}
              <Text
                style={[
                  styles.title,
                  { color: isDark ? '#F8FAFC' : '#0F172A' },
                ]}
              >
                {title}
              </Text>

              {/* Message */}
              <Text
                style={[
                  styles.message,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                {message}
              </Text>

              {/* Highlight Banner (e.g. Target Score, Question Count) */}
              {highlightText ? (
                <View
                  style={[
                    styles.highlightBox,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.04)'
                        : 'rgba(0, 0, 0, 0.03)',
                      borderColor: isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.06)',
                    },
                  ]}
                >
                  {highlightIcon === 'star' && (
                    <Star size={15} color="#F59E0B" fill="#F59E0B" />
                  )}
                  {highlightIcon === 'lock' && (
                    <Lock size={14} color={isDark ? '#94A3B8' : '#64748B'} />
                  )}
                  {highlightIcon === 'award' && (
                    <Award size={15} color="#10B981" />
                  )}
                  {highlightIcon === 'alert' && (
                    <AlertTriangle size={15} color="#F97316" />
                  )}
                  <Text
                    style={[
                      styles.highlightText,
                      { color: isDark ? '#CBD5E1' : '#334155' },
                    ]}
                  >
                    {highlightText}
                  </Text>
                </View>
              ) : null}

              {/* Action Buttons */}
              <View
                style={[
                  styles.btnRow,
                  secondaryBtnText ? styles.btnRowDual : styles.btnRowSingle,
                ]}
              >
                {secondaryBtnText ? (
                  <TouchableOpacity
                    style={[
                      styles.secondaryBtn,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.06)'
                          : '#F1F5F9',
                        borderColor: isDark
                          ? 'rgba(255, 255, 255, 0.12)'
                          : '#E2E8F0',
                      },
                    ]}
                    onPress={handleSecondaryPress}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.secondaryBtnText,
                        { color: isDark ? '#E2E8F0' : '#475569' },
                      ]}
                      numberOfLines={1}
                    >
                      {secondaryBtnText}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={[
                    styles.primaryBtnTouch,
                    secondaryBtnText ? { flex: 1.15 } : { width: '100%' },
                  ]}
                  onPress={handlePrimaryPress}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={finalBtnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryBtnGradient}
                  >
                    <Text style={styles.primaryBtnText} numberOfLines={1}>
                      {primaryBtnText}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    borderWidth: 1.5,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 20,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  badgeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    position: 'relative',
  },
  haloCircle: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  iconCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3.5,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
    marginBottom: 10,
  },
  tagText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  message: {
    fontSize: 14.5,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 6,
  },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 18,
  },
  highlightText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  btnRow: {
    width: '100%',
    marginTop: 4,
  },
  btnRowSingle: {
    flexDirection: 'column',
  },
  btnRowDual: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  secondaryBtn: {
    flex: 0.95,
    height: 48,
    borderRadius: 16,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  primaryBtnTouch: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnGradient: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
