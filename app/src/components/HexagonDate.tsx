import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

export default function HexagonDate() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const monthName = now.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const dateNum = now.getDate();

  return (
    <View style={styles.container}>
      <View style={styles.hexWrapper}>
        <Svg width="48" height="54" viewBox="0 0 48 54">
          <Polygon 
            points="24,1 47,13.5 47,40.5 24,53 1,40.5 1,13.5" 
            fill="#1C212B" 
            stroke="#DDBA76" 
            strokeWidth="2" 
          />
        </Svg>
        <View style={styles.dateContent}>
          <Text style={styles.monthText}>{monthName}</Text>
          <Text style={styles.dateText}>{dateNum}</Text>
        </View>
      </View>
      <Text style={styles.dayText}>{dayName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hexWrapper: {
    width: 48,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    color: '#DDBA76',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
  dateText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: -4,
  },
  dayText: {
    color: '#8295AD',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  }
});
