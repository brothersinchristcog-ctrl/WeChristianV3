import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Generate static stars once so they don't change on re-render
const generateStars = (count: number) => {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * 2000,
    });
  }
  return stars;
};

const stars1 = generateStars(150);
const stars2 = generateStars(75);
const stars3 = generateStars(40);

const StarLayer = ({ stars, size, duration }: { stars: any[], size: number, duration: number }) => {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(translateY, {
        toValue: -2000,
        duration: duration,
        useNativeDriver: true,
      })
    ).start();
  }, [translateY, duration]);

  // We render stars twice in height (y and y + 2000) so that as it scrolls up
  // the pattern seamlessly repeats.
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY }] }]}>
      <Svg width={width} height={4000} style={{ position: 'absolute', top: 0, left: 0 }}>
        {stars.map((star, i) => (
          <React.Fragment key={i}>
            <Rect x={star.x} y={star.y} width={size} height={size} fill="#FFF" />
            <Rect x={star.x} y={star.y + 2000} width={size} height={size} fill="#FFF" />
          </React.Fragment>
        ))}
      </Svg>
    </Animated.View>
  );
};

export default function StarBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="grad" cx="50%" cy="100%" rx="100%" ry="100%" fx="50%" fy="100%">
            <Stop offset="0" stopColor="#1a2d5a" />
            <Stop offset="1" stopColor="#0A1128" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#grad)" />
      </Svg>
      
      <StarLayer stars={stars1} size={1} duration={50000} />
      <StarLayer stars={stars2} size={2} duration={100000} />
      <StarLayer stars={stars3} size={3} duration={150000} />
    </View>
  );
}
