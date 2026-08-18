import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Share,
  Platform,
  ScrollView,
  Easing
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, G, Rect } from 'react-native-svg';
import { useChurch } from '../context/ChurchContext';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

type CelebrationType = 'birthday' | 'wedding' | 'baptism';

interface RouteParams {
  type: CelebrationType;
  name: string;
}

// ================= ANIMATION COMPONENTS =================

const ConfettiPiece = ({ delay, duration, left, color }: any) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, { toValue: 1, duration, delay, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-50, height + 100] });
  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '540deg'] });
  return (
    <Animated.View style={{
      position: 'absolute', left, top: -20, width: 9, height: 14, backgroundColor: color,
      opacity: 0.9, transform: [{ translateY }, { rotate }]
    }} />
  );
};

const Balloon = ({ delay, duration, left, color }: any) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, { toValue: 1, duration, delay, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [height + 100, -200] });
  const translateX = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 18, -10] });
  return (
    <Animated.View style={{
      position: 'absolute', left, bottom: -100, transform: [{ translateY }, { translateX }]
    }}>
      <View style={{
        width: 46, height: 58, backgroundColor: color, opacity: 0.95,
        borderRadius: 24, // roughly oval
      }} />
      <View style={{ width: 1, height: 60, backgroundColor: 'rgba(255,255,255,0.35)', alignSelf: 'center' }} />
    </Animated.View>
  );
};

const Sparkle = ({ delay, duration, left, top }: any) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, { toValue: 1, duration, delay, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
    ).start();
  }, []);
  const scale = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 1.1, 0.4] });
  const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0] });
  return (
    <Animated.View style={{
      position: 'absolute', left, top, width: 4, height: 4, backgroundColor: '#F6D989', borderRadius: 2,
      shadowColor: '#F6D989', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4, elevation: 4,
      transform: [{ scale }], opacity
    }} />
  );
};

const GoldParticle = ({ delay, duration, left }: any) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, { toValue: 1, duration, delay, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -height - 150] });
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 20] });
  const opacity = anim.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 1, 1, 0] });
  return (
    <Animated.View style={{
      position: 'absolute', left, bottom: -20, width: 5, height: 5, backgroundColor: '#F1CBB0', borderRadius: 2.5,
      shadowColor: '#F1CBB0', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 4, elevation: 4,
      transform: [{ translateY }, { translateX }], opacity
    }} />
  );
};

const FloatingHeart = ({ delay, duration, left }: any) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, { toValue: 1, duration, delay, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -height - 150] });
  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['-6deg', '6deg'] });
  const opacity = anim.interpolate({ inputRange: [0, 0.14, 0.86, 1], outputRange: [0, 0.6, 0.6, 0] });
  return (
    <Animated.View style={{
      position: 'absolute', left, bottom: -30, transform: [{ translateY }, { rotate }], opacity
    }}>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#E8C29F" strokeWidth="1.4">
        <Path d="M12 21s-7.5-4.6-10-9.2C.5 8.4 2.4 5 6 5c2 0 3.3 1 4 2.2C10.7 6 12 5 14 5c3.6 0 5.5 3.4 4 6.8C19.5 16.4 12 21 12 21z" />
      </Svg>
    </Animated.View>
  );
};

const WeddingRings = () => {
  return (
    <View style={{ position: 'absolute', top: '14%', left: '50%', width: 230, height: 230, marginLeft: -115, opacity: 0.5 }}>
      <View style={{ position: 'absolute', top: '50%', left: '32%', width: 140, height: 140, marginTop: -70, marginLeft: -70, borderRadius: 70, borderWidth: 1, borderColor: 'rgba(232,190,150,0.55)' }} />
      <View style={{ position: 'absolute', top: '50%', left: '68%', width: 140, height: 140, marginTop: -70, marginLeft: -70, borderRadius: 70, borderWidth: 1, borderColor: 'rgba(232,190,150,0.55)' }} />
    </View>
  );
};

const Rays = () => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, { toValue: 1, duration: 60000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);
  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  
  // Generating rays
  const rays = [];
  for (let i = 0; i < 360; i += 24) {
    rays.push(
      <Path key={i} d={`M 450 450 L ${450 + 450 * Math.cos(i * Math.PI / 180)} ${450 + 450 * Math.sin(i * Math.PI / 180)} L ${450 + 450 * Math.cos((i + 8) * Math.PI / 180)} ${450 + 450 * Math.sin((i + 8) * Math.PI / 180)} Z`} fill="rgba(255,255,255,0.05)" />
    );
  }

  return (
    <View style={{ position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -450 }, { translateY: -450 }] }}>
      <Animated.View style={{ width: 900, height: 900, transform: [{ rotate }] }}>
        <Svg width={900} height={900} viewBox="0 0 900 900">
          {rays}
        </Svg>
      </Animated.View>
    </View>
  );
};

const Ripple = ({ delay }: any) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, { toValue: 1, duration: 4000, delay, easing: Easing.out(Easing.ease), useNativeDriver: true })
    ).start();
  }, []);
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 26] }); // 20px to 520px
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] });
  return (
    <Animated.View style={{
      position: 'absolute', left: width / 2 - 10, bottom: -10, width: 20, height: 20,
      borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
      transform: [{ scale }], opacity
    }} />
  );
};

// ================= MAIN SCREEN =================

const CelebrationScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { activeChurch } = useChurch();
  const { user, member, viewMode } = useAuth();
  
  const params = route.params || {};
  let celebrations: CelebrationType[] = [];
  if (params.celebrations && Array.isArray(params.celebrations)) {
    celebrations = params.celebrations;
  } else if (params.type) {
    celebrations = [params.type as CelebrationType];
  } else {
    celebrations = ['birthday'];
  }
  console.log("CelebrationScreen loaded with celebrations:", celebrations);
  
  // Dynamically resolve name to prevent race conditions during boot
  const resolveName = () => {
    if (params.name && params.name !== 'Family' && params.name !== 'Member') return params.name;
    const m = member as any;
    if (m) {
      if (m.firstName) return m.firstName;
      if (m.FirstName) return m.FirstName;
      if (m.name) return m.name.split(' ')[0];
      if (m.Name) return m.Name.split(' ')[0];
      if (m.MemberName) return m.MemberName.split(' ')[0];
    }
    if (user?.displayName) return user.displayName.split(' ')[0];
    return 'Family';
  };
  
  const name = resolveName();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleContinue = () => {
    // Go back to the previous screen (works for both Admin and Member views)
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Fallback in case there is no history
      if (viewMode === 'admin') {
        navigation.navigate('AdminRoot');
      } else {
        navigation.navigate('Tabs');
      }
    }
  };

  // Generate arrays for random items
  const birthdayConfetti = useMemo(() => Array.from({ length: 34 }).map((_, i) => ({
    id: i, color: ['#C13C5C', '#3E6FB0', '#D9A441', '#3C8A66', '#8B62C4'][i % 5],
    duration: 3200 + Math.random() * 2600, delay: Math.random() * 4000, left: `${Math.random() * 100}%`
  })), []);
  const birthdayBalloons = useMemo(() => Array.from({ length: 7 }).map((_, i) => ({
    id: i, color: ['#C13C5C', '#D9A441', '#8B62C4', '#3E6FB0'][i % 4],
    duration: 7000 + Math.random() * 4000, delay: Math.random() * 5000, left: `${8 + Math.random() * 80}%`
  })), []);
  const birthdaySparkles = useMemo(() => Array.from({ length: 20 }).map((_, i) => ({
    id: i, duration: 1600 + Math.random() * 2000, delay: Math.random() * 3000,
    left: `${Math.random() * 100}%`, top: `${Math.random() * 80}%`
  })), []);

  const annivParticles = useMemo(() => Array.from({ length: 22 }).map((_, i) => ({
    id: i, duration: 5000 + Math.random() * 4000, delay: Math.random() * 5000, left: `${Math.random() * 100}%`
  })), []);
  const annivHearts = useMemo(() => Array.from({ length: 9 }).map((_, i) => ({
    id: i, duration: 6000 + Math.random() * 4000, delay: Math.random() * 5000, left: `${Math.random() * 90}%`
  })), []);

  const renderBackground = (type: CelebrationType) => {
    if (type === 'birthday') {
      return (
        <LinearGradient colors={['#2B1A38', '#401F3E', '#2B1A38']} style={StyleSheet.absoluteFill}>
          {birthdayConfetti.map(c => <ConfettiPiece key={`c-${c.id}`} {...c} />)}
          {birthdayBalloons.map(b => <Balloon key={`b-${b.id}`} {...b} />)}
          {birthdaySparkles.map(s => <Sparkle key={`s-${s.id}`} {...s} />)}
        </LinearGradient>
      );
    }
    if (type === 'wedding') {
      return (
        <LinearGradient colors={['#3A1B29', '#2A1220', '#1D0E17']} style={StyleSheet.absoluteFill}>
          <WeddingRings />
          {annivParticles.map(p => <GoldParticle key={`p-${p.id}`} {...p} />)}
          {annivHearts.map(h => <FloatingHeart key={`h-${h.id}`} {...h} />)}
        </LinearGradient>
      );
    }
    // baptism
    return (
      <LinearGradient colors={['#0E2036', '#163654', '#1C4467']} style={StyleSheet.absoluteFill}>
        <Rays />
        <Ripple delay={0} />
        <Ripple delay={1300} />
        <Ripple delay={2600} />
      </LinearGradient>
    );
  };

  const getStyles = (type: CelebrationType) => {
    const isBirthday = type === 'birthday';
    const isAnniv = type === 'wedding';
    const isBaptism = type === 'baptism';

    return {
      eyebrow: {
        fontSize: 11, fontWeight: '700' as const, letterSpacing: 3, textTransform: 'uppercase' as const,
        color: isBirthday ? '#E8B84B' : isAnniv ? '#E3B48A' : '#8FC5E8',
        marginBottom: 14, textAlign: 'center' as const
      },
      title: {
        fontFamily: isIOS ? 'Georgia' : 'serif', fontWeight: '700' as const, fontStyle: 'italic' as const,
        fontSize: 34, lineHeight: 40, textAlign: 'center' as const,
        color: '#fff',
        textShadowColor: 'rgba(0,0,0,0.35)',
        textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 18,
        marginBottom: 8
      },
      titleTe: {
        fontSize: 18, fontWeight: '600' as const, textAlign: 'center' as const,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 22
      },
      verseCard: {
        backgroundColor: isAnniv ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.08)',
        borderWidth: 1, borderColor: isAnniv ? 'rgba(232,178,150,0.22)' : 'rgba(255,255,255,0.16)',
        borderRadius: 18, padding: 18, marginBottom: 18, width: '100%' as const
      },
      verse: {
        fontFamily: isIOS ? 'Georgia' : 'serif', fontStyle: 'italic' as const,
        fontSize: 17, lineHeight: 26, textAlign: 'center' as const,
        color: 'rgba(255,255,255,0.92)'
      },
      verseTe: {
        fontFamily: isIOS ? 'Georgia' : 'serif',
        fontSize: 14, lineHeight: 22, textAlign: 'center' as const, marginTop: 8,
        color: 'rgba(255,255,255,0.8)'
      },
      verseRef: {
        fontSize: 10.5, fontWeight: '700' as const, letterSpacing: 1, textTransform: 'uppercase' as const,
        textAlign: 'center' as const, marginTop: 12,
        color: isAnniv ? 'rgba(243,224,208,0.55)' : 'rgba(255,255,255,0.5)'
      },
      blessing: {
        fontSize: 13.5, lineHeight: 22, textAlign: 'center' as const,
        color: 'rgba(255,255,255,0.78)',
        marginBottom: 6
      },
      blessingTe: {
        fontSize: 12, lineHeight: 18, textAlign: 'center' as const,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 30
      },
      btnContinue: {
        paddingVertical: 15, borderRadius: 100, alignItems: 'center' as const, justifyContent: 'center' as const,
        marginBottom: 10,
        backgroundColor: 'transparent',
      },
      btnContinueText: {
        fontWeight: '800' as const, fontSize: 14,
        color: isBirthday ? '#2B1A38' : isAnniv ? '#3A1B29' : '#0E2036'
      },
      btnShare: {
        display: 'none'
      },
      btnShareText: {
        display: 'none'
      },
      footer: {
        fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' as const, fontWeight: '700' as const,
        textAlign: 'center' as const, marginTop: 26,
        color: 'rgba(255,255,255,0.4)'
      }
    };
  };

  const content = {
    birthday: {
      eyebrow: 'A Special Day',
      title: `🎉 Happy Birthday,\n${name}!`,
      titleTe: `పుట్టినరోజు శుభాకాంక్షలు, ${name}!`,
      verse: '"This is the day the Lord hath made; we will rejoice and be glad in it."',
      verseTe: '"యెహోవా ఏర్పాటు చేసిన దినము ఇదే, దీనియందు మనము ఉత్సహించి సంతోషించుదము."',
      ref: 'Psalm 118:24',
      blessing: `From all of us at ${activeChurch?.name || 'Grace Fellowship'} — may this new year of life be filled with His peace, His provision, and His presence over you and your family.`,
      blessingTe: 'ఈ నూతన సంవత్సరంలో దేవుని కృప, సమాధానం మీపై సమృద్ధిగా ఉండును గాక.',
    },
    wedding: {
      eyebrow: 'Wedding Anniversary',
      title: `💍 Happy Anniversary,\n${name}!`,
      titleTe: `వివాహ వార్షికోత్సవ శుభాకాంక్షలు, ${name}!`,
      verse: '"And above all these things put on charity, which is the bond of perfectness."',
      verseTe: '"వీటన్నిటిపైన ప్రేమను ధరించుకొనుడి, అది పరిపూర్ణతా బంధము."',
      ref: 'Colossians 3:14',
      blessing: 'Wishing you both many more years of love, laughter, and faith walked out together. The whole church family celebrates with you today.',
      blessingTe: 'మీ వివాహ వార్షికోత్సవ సందర్భంగా దేవుడు మీ కుటుంబాన్ని నిరంతరం తన ప్రేమతో నింపును గాక.',
    },
    baptism: {
      eyebrow: 'Baptism Anniversary',
      title: `✝️ Happy Baptism\nAnniversary, ${name}!`,
      titleTe: `బాప్తిస్మపు వార్షికోత్సవ శుభాకాంక్షలు, ${name}!`,
      verse: '"Buried with him in baptism... risen with him through the faith of the operation of God."',
      verseTe: '"బాప్తిస్మమందు మీరు ఆయనతోకూడ పాతిపెట్టబడినవారై... ఆయనతోకూడ లేపబడితిరి."',
      ref: 'Colossians 2:12',
      blessing: 'On this day you declared your faith before the world. May you keep walking boldly in the new life you were given.',
      blessingTe: 'మీ ఆత్మీయ జన్మదిన సందర్భంగా దేవుని వెలుగులో మీరు మరింతగా ఎదగాలని కోరుకుంటున్నాము.',
    }
  };

  // Render gradients for buttons based on type
  const renderContinueButton = (type: CelebrationType, s: any) => {
    if (type === 'birthday') {
      return (
        <TouchableOpacity onPress={handleContinue} style={{ shadowColor: '#D9A441', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.6, shadowRadius: 24, elevation: 8 }}>
          <LinearGradient colors={['#F6D989', '#D9A441']} start={{x:0, y:0}} end={{x:1, y:1}} style={s.btnContinue}>
            <Text style={s.btnContinueText}>Continue to Home</Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    }
    if (type === 'baptism') {
      return (
        <TouchableOpacity onPress={handleContinue} style={{ shadowColor: '#5FA8D6', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.6, shadowRadius: 24, elevation: 8 }}>
          <LinearGradient colors={['#9FD4EF', '#5FA8D6']} start={{x:0, y:0}} end={{x:1, y:1}} style={s.btnContinue}>
            <Text style={s.btnContinueText}>Continue to Home</Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    }
    // Anniversary
    return (
      <TouchableOpacity onPress={handleContinue} style={{ shadowColor: '#C98F6E', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.6, shadowRadius: 24, elevation: 8 }}>
        <LinearGradient colors={['#F1CBB0', '#C98F6E']} start={{x:0, y:0}} end={{x:1, y:1}} style={s.btnContinue}>
          <Text style={s.btnContinueText}>Continue to Home</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView 
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          {celebrations.map((celebType, index) => {
            const s = getStyles(celebType);
            const c = content[celebType];
            
            return (
              <View key={index} style={{ width, height, position: 'relative' }}>
                {renderBackground(celebType)}
                
                <ScrollView 
                  contentContainerStyle={{ 
                    flexGrow: 1, 
                    justifyContent: 'center', 
                    paddingHorizontal: 26, 
                    paddingTop: insets.top + 40, 
                    paddingBottom: insets.bottom + 40 
                  }}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={s.eyebrow}>{c.eyebrow}</Text>
                  <Text style={s.title}>{c.title}</Text>

                  <View style={s.verseCard}>
                    <Text style={s.verse}>{c.verse}</Text>
                    {c.verseTe ? <Text style={s.verseTe}>{c.verseTe}</Text> : null}
                    <Text style={s.verseRef}>{c.ref}</Text>
                  </View>

                  <Text style={s.blessing}>{c.blessing}</Text>

                  <View style={{ marginTop: 20 }}>
                    {renderContinueButton(celebType, s)}
                  </View>

                  <Text style={s.footer}>{activeChurch?.name || 'Grace Fellowship Church'}</Text>

                  {/* Swipe Indicator for Carousel */}
                  {celebrations.length > 1 && (
                    <Text style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', marginTop: 26, fontSize: 13, letterSpacing: 1 }}>
                      {index < celebrations.length - 1 ? 'SWIPE FOR MORE ➔' : '❮ SWIPE BACK'}
                    </Text>
                  )}
                </ScrollView>
              </View>
            );
          })}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

export default CelebrationScreen;
