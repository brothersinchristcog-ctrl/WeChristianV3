import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Share,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Share2, ArrowRight, UserCheck, UserPlus, ShieldCheck } from 'lucide-react-native';
import { useChurch } from '../../context/ChurchContext';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'JoinSuccess'>;
  route: RouteProp<AuthStackParamList, 'JoinSuccess'>;
};

export default function JoinSuccessScreen({ navigation, route }: Props) {
  const { churchName, isNewChurch, churchCode } = route.params;
  const { activeChurch } = useChurch();
  const primary = activeChurch?.theme?.primaryColor || '#1a2d5a';

  const handleShare = () => {
    if (!churchCode) return;
    Share.share({
      message: `Join "${churchName}" on WeChristian!\n\nUse the church code: ${churchCode}\n\nDownload the app here: https://play.google.com/store/apps/details?id=com.wechristian.app`,
      title: `Join ${churchName} on WeChristian`,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070d1e" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Title & Church Details */}
          <View style={styles.headerTextBlock}>
            <Text style={styles.title}>
              {isNewChurch ? 'Church Registered! 🎉' : 'Welcome to the Family! 🙏'}
            </Text>
            <View style={styles.churchNamePill}>
              <ShieldCheck size={16} color="#38BDF8" />
              <Text style={styles.churchNameText}>{churchName || 'Your Church'}</Text>
            </View>
            <Text style={styles.subtitle}>
              {isNewChurch
                ? 'Your church has been successfully created. Share your church code with your members to start connecting.'
                : 'Select your membership status below to continue:'}
            </Text>
          </View>

          {/* New Church Admin Code Display */}
          {isNewChurch && churchCode && (
            <View style={styles.codeCard}>
              <Text style={styles.codeLabel}>YOUR CHURCH CODE</Text>
              <Text style={styles.codeValue}>{churchCode}</Text>
              <Text style={styles.codeHint}>Share this code with your congregation members</Text>
              <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                <Share2 size={16} color="#38BDF8" />
                <Text style={styles.shareBtnTxt}>Share Code</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Member Guidance Cards (Clickable options with interactive feedback) */}
          {!isNewChurch && (
            <View style={styles.guidanceContainer}>
              {/* Option 1: Existing Member via SMS/WhatsApp -> Navigate to Sign In */}
              <TouchableOpacity
                activeOpacity={0.78}
                style={styles.optionCard}
                onPress={() => navigation.navigate('Login', { showPhoneInput: true, fromJoinSuccess: true })}
              >
                <View style={styles.optionHeader}>
                  <View style={[styles.optionIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                    <UserCheck size={20} color="#38BDF8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionTag}>ALREADY REGISTERED MEMBER</Text>
                    <Text style={styles.optionHeading}>Invitation via SMS or WhatsApp</Text>
                  </View>
                  <View style={styles.chevronWrap}>
                    <ArrowRight size={18} color="#38BDF8" />
                  </View>
                </View>
                <Text style={styles.optionBody}>
                  If your pastor added you as a church member and sent you the Church Code along with your invitation via <Text style={styles.highlightText}>SMS or WhatsApp</Text>, your church profile has already been registered. You do not need to Sign Up. Enter the Church Code and select <Text style={styles.highlightText}>Sign In</Text> using your registered mobile number.
                </Text>
                <View style={styles.cardTapAction}>
                  <Text style={styles.cardTapActionText}>👉 Tap this card to Sign In</Text>
                </View>
              </TouchableOpacity>

              {/* Option 2: New Member -> Navigate to Sign Up */}
              <TouchableOpacity
                activeOpacity={0.78}
                style={[styles.optionCard, styles.optionCardSecondary]}
                onPress={() => navigation.navigate('SignUp')}
              >
                <View style={styles.optionHeader}>
                  <View style={[styles.optionIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                    <UserPlus size={20} color="#F59E0B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionTag, { color: '#F59E0B' }]}>NEW CHURCH MEMBER</Text>
                    <Text style={styles.optionHeading}>Code shared without personal invitation</Text>
                  </View>
                  <View style={[styles.chevronWrap, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
                    <ArrowRight size={18} color="#F59E0B" />
                  </View>
                </View>
                <Text style={styles.optionBody}>
                  If your pastor has only shared the Church Code with you, without adding you as a member and sending you a personal invitation via <Text style={styles.highlightText}>SMS or WhatsApp</Text>, enter the Church Code and select <Text style={styles.highlightText}>Sign Up</Text> to register as a new church member.
                </Text>
                <View style={[styles.cardTapAction, styles.cardTapActionSecondary]}>
                  <Text style={[styles.cardTapActionText, { color: '#F59E0B' }]}>👉 Tap this card to Sign Up</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* For New Church Admin Only: Continue Button */}
          {isNewChurch && (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.btnSignIn}
              onPress={() => {
                const authUser = require('@react-native-firebase/auth').default().currentUser;
                if (authUser) {
                  try {
                    navigation.getParent()?.navigate('MainModes');
                  } catch (e) {
                    navigation.navigate('Login');
                  }
                } else {
                  navigation.navigate('Login');
                }
              }}
            >
              <Text style={styles.btnSignInText}>Continue to App</Text>
              <ArrowRight size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070D1E',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 32,
    paddingBottom: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Titles
  headerTextBlock: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  churchNamePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    marginBottom: 10,
  },
  churchNameText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },

  // Guidance Cards
  guidanceContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 26,
  },
  optionCard: {
    backgroundColor: '#0F1A30',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  optionCardSecondary: {
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  optionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTag: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  optionHeading: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 1,
  },
  chevronWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBody: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 20,
  },
  highlightText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cardTapAction: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'flex-start',
  },
  cardTapActionSecondary: {
    borderTopColor: 'rgba(245, 158, 11, 0.15)',
  },
  cardTapActionText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Code Card (for New Church Admin)
  codeCard: {
    width: '100%',
    backgroundColor: '#0F1A30',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    marginBottom: 26,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  codeLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  codeValue: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 6,
    color: '#38BDF8',
    marginBottom: 6,
  },
  codeHint: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  shareBtn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 22,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  shareBtnTxt: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
  },

  // Action Buttons
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btnSignIn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    elevation: 6,
    shadowColor: '#2563EB',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
  },
  btnSignInText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  btnSignUp: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#0F1A30',
    borderWidth: 1.5,
    borderColor: 'rgba(147, 197, 253, 0.35)',
  },
  btnSignUpText: {
    color: '#93C5FD',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
