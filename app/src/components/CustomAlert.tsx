import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Animated } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { spacing, radius, typography, shadow } from '../theme/Theme';
import { useTheme } from '../context/ThemeContext';

export type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

interface CustomAlertProps {
  visible?: boolean;
  title?: string;
  message?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  buttons?: AlertButton[];
  onClose?: () => void;
}

export interface CustomAlertRef {
  alert: (title: string, message: string, buttons?: AlertButton[], type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const CustomAlert = forwardRef<CustomAlertRef, CustomAlertProps>((props, ref) => {
  const { colors, isDark } = useTheme();

  // Internal state for imperative usage
  const [internalVisible, setInternalVisible] = useState(false);
  const [internalTitle, setInternalTitle] = useState('');
  const [internalMessage, setInternalMessage] = useState('');
  const [internalType, setInternalType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [internalButtons, setInternalButtons] = useState<AlertButton[] | undefined>(undefined);

  const visible = props.visible !== undefined ? props.visible : internalVisible;
  const title = props.title !== undefined ? props.title : internalTitle;
  const message = props.message !== undefined ? props.message : internalMessage;
  const type = props.type !== undefined ? props.type : internalType;
  const buttons = props.buttons !== undefined ? props.buttons : internalButtons;

  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useImperativeHandle(ref, () => ({
    alert: (t: string, m: string, b?: AlertButton[], ty?: 'success' | 'error' | 'warning' | 'info') => {
      setInternalTitle(t);
      setInternalMessage(m);
      if (b) setInternalButtons(b);
      else setInternalButtons(undefined);
      if (ty) setInternalType(ty);
      else {
        // Auto-detect success/error from title
        if (t.toLowerCase().includes('success') || t.includes('విజయం')) setInternalType('success');
        else if (t.toLowerCase().includes('error') || t.toLowerCase().includes('fail')) setInternalType('error');
        else setInternalType('info');
      }
      setInternalVisible(true);
    }
  }));

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.8, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true })
    ]).start(() => {
      setInternalVisible(false);
      if (props.onClose) props.onClose();
    });
  };

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const getIcon = () => {
    switch (type) {
      case 'success': return <Ionicons name="checkmark-circle" size={56} color={colors.primary} />;
      case 'error': return <Ionicons name="close-circle" size={56} color="#ef4444" />;
      case 'warning': return <Ionicons name="warning" size={56} color="#f59e0b" />;
      default: return <Ionicons name="information-circle" size={56} color={colors.primary} />;
    }
  };

  const getHeaderColor = () => {
    switch (type) {
      case 'success': return colors.primary;
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      default: return colors.primary;
    }
  };

  const getIconBgColor = () => {
    switch (type) {
      case 'success': return colors.primary + '15';
      case 'error': return '#fee2e2';
      case 'warning': return '#fef3c7';
      default: return colors.primary + '15';
    }
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.alertBox, { backgroundColor: colors.card, transform: [{ scale: scaleAnim }] }]}>
          
          <View style={[styles.iconContainer, { backgroundColor: getIconBgColor() }]}>
            {getIcon()}
          </View>

          <Text style={[styles.title, { color: getHeaderColor() }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

          <View style={styles.buttonContainer}>
            {buttons && buttons.length > 0 ? (
              buttons.map((btn, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    { backgroundColor: colors.primary, shadowColor: colors.primary },
                    btn.style === 'cancel' && { backgroundColor: isDark ? '#334155' : '#F3F4F6', shadowOpacity: 0, elevation: 0 },
                    btn.style === 'destructive' && { backgroundColor: '#ef4444', shadowColor: '#ef4444' },
                    buttons.length === 2 && styles.buttonHalf
                  ]}
                  onPress={() => {
                    if (btn.onPress) btn.onPress();
                    if (!btn.onPress || btn.style === 'cancel') handleClose();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.buttonText,
                    btn.style === 'cancel' && { color: colors.text },
                    btn.style === 'destructive' && { color: '#FFFFFF' }
                  ]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: colors.primary, shadowColor: colors.primary }]} 
                onPress={handleClose} 
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>OK</Text>
              </TouchableOpacity>
            )}
          </View>

        </Animated.View>
      </Animated.View>
    </Modal>
  );
});

export const globalAlertRef = React.createRef<CustomAlertRef>();

export const AppAlert = {
  alert: (title: string, message: string, buttons?: AlertButton[], type?: 'success' | 'error' | 'warning' | 'info') => {
    globalAlertRef.current?.alert(title, message, buttons, type);
  }
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl
  },
  alertBox: {
    width: width - spacing.xl * 2,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
  },
  iconContainer: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 50,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.sm,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800'
  },
  message: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
    fontSize: 15
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    gap: spacing.md
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 100, // Pill shape
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  buttonHalf: {
    flex: 1
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center'
  }
});
