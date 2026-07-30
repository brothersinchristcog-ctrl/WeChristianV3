import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Animated,
  Dimensions,
  Image,
  Text,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useChurch } from '../../context/ChurchContext';

const { width, height } = Dimensions.get('window');

// ── PARTICLE COMPONENT ──
const Particle = ({ delay, startX, size, duration }: any) => {
  const translateY = useRef(new Animated.Value(height)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.loop(
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: Math.random() * 0.4 + 0.1, duration: duration * 0.3, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: Math.random() * 0.6 + 0.2, duration: duration * 0.4, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: duration * 0.3, useNativeDriver: true })
          ])
        ])
      ).start();
    }, delay);
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        left: startX,
        bottom: -50,
        opacity,
        transform: [{ translateY }]
      }}
    />
  );
};

const Particles = () => {
  const particles = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    size: Math.random() * 6 + 2,
    startX: Math.random() * width,
    delay: Math.random() * 3000,
    duration: Math.random() * 6000 + 5000
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      {particles.map(p => (
        <Particle key={p.id} {...p} />
      ))}
    </View>
  );
};

export default function SplashScreen() {
  const { activeChurch } = useChurch();
  const [showChurch, setShowChurch] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Force the We Christian splash screen to display for 3.5 seconds
    const timer = setTimeout(() => {
      setShowChurch(true);
    }, 3500);

    // Initial entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Gentle continuous logo pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, { toValue: 1.05, duration: 2500, useNativeDriver: true }),
        Animated.timing(logoPulse, { toValue: 1, duration: 2500, useNativeDriver: true })
      ])
    ).start();

    return () => clearTimeout(timer);
  }, []);

  const displayChurch = showChurch ? activeChurch : null;

  return (
    <LinearGradient
      colors={['#020b22', '#081d4a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#020b22" />
      <Particles />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Animated.View style={[styles.logoRing, { transform: [{ scale: logoPulse }] }]}>
          <Image
            source={displayChurch?.theme?.logoUrl ? { uri: displayChurch.theme.logoUrl } : require('../../../assets/logo.png')}
            style={styles.logo}
            resizeMode="cover"
          />
        </Animated.View>

        <Text 
          style={styles.titleMain}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
        >
          {displayChurch?.name || 'We Christian'}
        </Text>
        <Text style={styles.titleSub}>{displayChurch?.tagline || 'Together in Christ'}</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 30,
    zIndex: 10,
    width: '100%',
  },
  logoRing: {
    width: 140, height: 140, borderRadius: 70, 
    backgroundColor: '#ffffff',
    justifyContent: 'center', alignItems: 'center', 
    marginBottom: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  logo: {
    width: 140,
    height: 140,
  },
  titleMain: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  titleSub: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fbbf24', // Golden tagline
    letterSpacing: 0.5,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  }
});

