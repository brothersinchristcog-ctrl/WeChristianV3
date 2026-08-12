const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'screens', 'HomeScreen.tsx');
let content = fs.readFileSync(file, 'utf8');

// Add Animated & PanResponder imports if missing
if (!content.includes('PanResponder')) {
  content = content.replace(
    /import {\s*StyleSheet,\s*View,\s*Text,/,
    "import {\n  StyleSheet,\n  View,\n  Text,\n  Animated,\n  PanResponder,"
  );
}
if (!content.includes('import AsyncStorage from')) {
  content = content.replace(
    "import firestore from '@react-native-firebase/firestore';",
    "import firestore from '@react-native-firebase/firestore';\nimport AsyncStorage from '@react-native-async-storage/async-storage';"
  );
}

// 1. Add Floating Button State & Logic
const floatingBtnState = `  // Floating Live Celebrations State
  const [liveCelebrations, setLiveCelebrations] = useState<any[]>([]);
  const pan = useRef(new Animated.ValueXY()).current;
  const emojiAnim = useRef(new Animated.Value(0)).current;
  const [currentEmojiIdx, setCurrentEmojiIdx] = useState(0);

  const fetchLiveCelebrations = async () => {
    if (!activeChurch?.id) return;
    try {
      // For simplicity in MVP, check recent celebrations or use a direct query
      // To save reads on Home Screen, we can check if there's a live_celebrations doc for today
      const todayStr = new Date().toISOString().split('T')[0];
      const docSnap = await firestore()
        .collection('churches')
        .doc(activeChurch.id)
        .collection('live_celebrations')
        .doc(todayStr)
        .get();
      
      // If doc doesn't exist, maybe it hasn't been created, but wait we need to know who is celebrating.
      // Alternatively, we use FirestoreService to get today's birthdays etc.
      const FirestoreService = require('../services/FirestoreService').default;
      const allCelebs = await FirestoreService.getAllCelebrations(activeChurch.id);
      
      const today = new Date();
      const m = today.getMonth() + 1;
      const d = today.getDate();
      
      const todays = allCelebs.filter((c: any) => {
        let isCeleb = false;
        ['Birthdate', 'Anniversary_Date__c', 'Baptism_Date__c'].forEach(field => {
          if (c[field]) {
            const parts = c[field].split('-');
            let mm, dd;
            if (parts[0].length === 4) { mm = parseInt(parts[1], 10); dd = parseInt(parts[2], 10); } 
            else { dd = parseInt(parts[0], 10); mm = parseInt(parts[1], 10); }
            if (mm === m && dd === d) isCeleb = true;
          }
        });
        return isCeleb;
      });
      
      setLiveCelebrations(todays);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLiveCelebrations();
    
    // Load saved position
    AsyncStorage.getItem('@live_celebrations_pos').then(val => {
      if (val) {
        const { x, y } = JSON.parse(val);
        pan.setValue({ x, y });
      }
    });
  }, [activeChurch?.id]);

  useEffect(() => {
    if (liveCelebrations.length === 0) return;
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(emojiAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(emojiAnim, { toValue: 0, duration: 250, useNativeDriver: true })
      ]).start(() => {
        setCurrentEmojiIdx(prev => (prev + 1) % 4);
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [liveCelebrations.length]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (e, gesture) => {
        pan.extractOffset();
        AsyncStorage.setItem('@live_celebrations_pos', JSON.stringify({ x: pan.x._value + pan.x._offset, y: pan.y._value + pan.y._offset }));
      }
    })
  ).current;

  const getEmoji = () => {
    const emojis = ['🎂', '💍', '💧', '🎉'];
    return emojis[currentEmojiIdx];
  };
`;

if (!content.includes('const [liveCelebrations, setLiveCelebrations]')) {
  content = content.replace(
    "const [refreshing, setRefreshing] = useState(false);",
    "const [refreshing, setRefreshing] = useState(false);\n" + floatingBtnState
  );
}

// 2. Add UI
const floatingUI = `
      {liveCelebrations.length > 0 && (
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.floatingBtnContainer,
            { transform: [{ translateX: pan.x }, { translateY: pan.y }] }
          ]}
        >
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => navigation.navigate('LiveCelebrationsChat', { celebrations: liveCelebrations })}
            style={styles.floatingBtn}
          >
            <Animated.Text style={[styles.floatingEmoji, { opacity: emojiAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
              {getEmoji()}
            </Animated.Text>
            <View style={styles.floatingIndicator} />
          </TouchableOpacity>
          <Text style={styles.floatingLabel}>Live Celebrations</Text>
        </Animated.View>
      )}
`;

if (!content.includes('styles.floatingBtnContainer')) {
  content = content.replace(
    "</View>\n  );\n}\n",
    floatingUI + "\n    </View>\n  );\n}\n"
  );
  
  const floatingStyles = `
  floatingBtnContainer: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    alignItems: 'center',
    zIndex: 999,
  },
  floatingBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.5)', // Gold border
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  floatingEmoji: {
    fontSize: 28,
  },
  floatingIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  floatingLabel: {
    color: '#1a2d5a',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 4,
    borderRadius: 4,
    overflow: 'hidden'
  },`;
  content = content.replace("const styles = StyleSheet.create({", "const styles = StyleSheet.create({\n" + floatingStyles);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated HomeScreen.tsx');
