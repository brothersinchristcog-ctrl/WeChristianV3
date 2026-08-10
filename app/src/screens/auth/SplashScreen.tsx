import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Animated,
  Image,
  Text,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useChurch } from '../../context/ChurchContext';
import { Heart } from 'lucide-react-native';

export default function SplashScreen() {
  const { activeChurch, loading } = useChurch();
  
  const logoDrop = useRef(new Animated.Value(-300)).current;
  const logoScale = useRef(new Animated.Value(0.75)).current;
  
  const textDrop = useRef(new Animated.Value(-40)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  
  const lineScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Logo Drop-in
    Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        Animated.spring(logoDrop, { toValue: 0, friction: 6, tension: 40, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true })
      ])
    ]).start();

    // 2. Texts Drop-in
    Animated.sequence([
      Animated.delay(950),
      Animated.parallel([
        Animated.timing(textDrop, { toValue: 0, duration: 700, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 1, duration: 700, useNativeDriver: true })
      ])
    ]).start();

    // 3. Line grow
    Animated.sequence([
      Animated.delay(1700),
      Animated.timing(lineScale, { toValue: 1, duration: 800, useNativeDriver: true })
    ]).start();

  }, []);

  const displayChurch = activeChurch ? activeChurch : null;

  return (
    <View style={styles.stage}>
      <StatusBar barStyle="light-content" backgroundColor="#020b22" />
      
      {/* Background */}
      <LinearGradient
        colors={['#020b22', '#081d4a']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.entrance}>
        
        {(!activeChurch && loading) ? (
          <View style={{ height: 210, justifyContent: 'center' }} />
        ) : (
          <>
            {/* Emblem Wrap */}
            <Animated.View style={[
              styles.emblemWrap, 
              { 
                transform: [{ translateY: logoDrop }, { scale: logoScale }] 
              }
            ]}>
              {/* Logo / Emblem */}
              <View style={styles.emblem}>
                <Image
                  source={displayChurch?.theme?.logoUrl ? { uri: displayChurch.theme.logoUrl } : require('../../../assets/logo.png')}
                  style={styles.logoImage}
                  resizeMode="cover"
                />
              </View>
            </Animated.View>

            {/* Texts */}
            <View style={styles.titles}>
              <Animated.Text 
                style={[
                  styles.titleLine, 
                  { 
                    opacity: textOpacity,
                    transform: [{ translateY: textDrop }]
                  }
                ]}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
              >
                {displayChurch?.name || 'We Christian'}
              </Animated.Text>

              <Animated.View style={{ 
                opacity: textOpacity, 
                transform: [{ translateY: textDrop }],
                alignItems: 'center',
                width: '100%'
              }}>
                <Text style={styles.tagline}>
                  {displayChurch?.tagline || 'Together in Christ'}
                </Text>
                {/* Growing Line */}
                <Animated.View style={[
                  styles.taglineLine, 
                  { transform: [{ scaleX: lineScale }] }
                ]} />
              </Animated.View>
              
            </View>
          </>
        )}
      </View>

      {/* Footer Text */}
      <View style={styles.footerContainer}>
        <Text style={styles.poweredText}>Powered by</Text>
        <Text style={styles.companyText}>Covenant Synergy Pvt Ltd</Text>
        <View style={styles.footerLineContainer}>
          <View style={styles.footerLine} />
          <View style={styles.footerDot} />
          <Heart size={16} color="rgba(255, 255, 255, 0.7)" strokeWidth={2} style={styles.footerHeart} />
          <View style={styles.footerDot} />
          <View style={styles.footerLine} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  entrance: {
    zIndex: 2,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  emblemWrap: {
    width: 150,
    height: 150,
    marginBottom: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emblem: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(246,244,236,0.9)',
    backgroundColor: '#060505',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  titles: {
    alignItems: 'center',
    width: '100%',
  },
  titleLine: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#f6f4ec',
    textAlign: 'center',
    marginBottom: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: '#d4af37',
    textAlign: 'center',
    paddingBottom: 8,
  },
  taglineLine: {
    height: 1,
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#f0c14b',
    position: 'absolute',
    bottom: 0,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
    width: '100%',
  },
  poweredText: {
    fontSize: 12,
    color: 'rgba(246, 244, 236, 0.7)',
    marginBottom: 4,
  },
  companyText: {
    fontSize: 14,
    color: 'rgba(246, 244, 236, 0.7)',
    fontWeight: '600',
    letterSpacing: 1,
  },
  footerLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    justifyContent: 'center',
    marginTop: 8,
  },
  footerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginHorizontal: 4,
  },
  footerHeart: {
    marginHorizontal: 6,
  }
});
