import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Image,
  ActivityIndicator,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { ChevronLeft, Send, Sparkles, User, Heart } from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useChurch } from '../context/ChurchContext';

const QUICK_WISHES = [
  "Happy Birthday! 🎉",
  "God bless you abundantly! 🙏",
  "Wishing you a blessed day! ❤️",
  "Many more blessed years! 🎂"
];

export default function LiveCelebrationsChat({ navigation, route }: any) {
  const { colors } = useTheme();
  const { activeChurch } = useChurch();
  const { member, user } = useAuth();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const celebrations = route.params?.celebrations || [];

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!activeChurch?.id) return;

    const unsubscribe = firestore()
      .collection('churches')
      .doc(activeChurch.id)
      .collection('live_celebrations')
      .doc(todayStr)
      .collection('messages')
      .orderBy('createdAt', 'asc')
      .onSnapshot(snap => {
        if (snap) {
          const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setMessages(msgs);
        }
        setLoading(false);
      }, err => {
        console.error('Chat error:', err);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [activeChurch?.id]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !activeChurch?.id || !member) return;
    
    setInputText('');
    
    try {
      await firestore()
        .collection('churches')
        .doc(activeChurch.id)
        .collection('live_celebrations')
        .doc(todayStr)
        .collection('messages')
        .add({
          text: text.trim(),
          userId: member.id,
          userName: member.name || user?.displayName || 'Unknown',
          userPhoto: (member as any).profilePhoto || (member as any).photoURL || user?.photoURL || null,
          createdAt: firestore.FieldValue.serverTimestamp(),
          reactions: {}
        });
    } catch (e) {
      console.error('Send error:', e);
    }
  };

  const reactToMessage = async (msgId: string, emoji: string) => {
    if (!activeChurch?.id || !member?.id) return;
    try {
      const msgRef = firestore()
        .collection('churches')
        .doc(activeChurch.id)
        .collection('live_celebrations')
        .doc(todayStr)
        .collection('messages')
        .doc(msgId);

      await firestore().runTransaction(async (t) => {
        const doc = await t.get(msgRef);
        if (!doc.exists) return;
        const data = doc.data();
        const reactions = data?.reactions || {};
        const count = reactions[emoji] || 0;
        t.update(msgRef, {
          [`reactions.${emoji}`]: count + 1
        });
      });
    } catch (e) {
      console.log('Reaction error', e);
    }
  };

  const getCelebrationIcon = (type: string) => {
    if (type.toLowerCase().includes('birthday')) return '🎂';
    if (type.toLowerCase().includes('wedding') || type.toLowerCase().includes('anniversary')) return '💍';
    if (type.toLowerCase().includes('baptism')) return '💧';
    return '🎉';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#0f172a' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>🎉 Today's Celebrations</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE TODAY</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Celebrants ScrollView */}
      <View style={styles.celebrantsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.celebrantsList}>
          {celebrations.map((celeb: any, idx: number) => (
            <View key={idx} style={styles.celebrantCard}>
              <View style={styles.celebrantIconBox}>
                <Text style={styles.celebrantIcon}>{getCelebrationIcon(celeb.type || celeb.title || '')}</Text>
              </View>
              <View>
                <Text style={styles.celebrantName}>{celeb.Name || celeb.name || 'Member'}</Text>
                <Text style={styles.celebrantType}>{celeb.type || celeb.title || 'Celebration'}</Text>
              </View>
            </View>
          ))}
          {celebrations.length === 0 && (
            <Text style={styles.noCelebrantsText}>No celebrations listed today.</Text>
          )}
        </ScrollView>
      </View>

      {/* Messages */}
      <View style={styles.chatSection}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatTitle}>💬 Live Wishes</Text>
          <Text style={styles.participantCount}>{messages.length > 0 ? `${[...new Set(messages.map(m => m.userId))].length} members celebrating` : 'Be the first to send a wish!'}</Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#fbbf24" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => (
              <View style={styles.messageRow}>
                {item.userPhoto ? (
                  <Image source={{ uri: item.userPhoto }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <User color="#fff" size={16} />
                  </View>
                )}
                <View style={styles.messageContentBox}>
                  <Text style={styles.senderName}>{item.userName}</Text>
                  <Text style={styles.messageText}>{item.text}</Text>
                  
                  {/* Reactions Bar */}
                  <View style={styles.reactionsBar}>
                    {['❤️', '🙏', '🎉', '🎂'].map(emoji => (
                      <TouchableOpacity 
                        key={emoji} 
                        style={styles.reactionBtn}
                        onPress={() => reactToMessage(item.id, emoji)}
                      >
                        <Text style={styles.reactionEmoji}>{emoji}</Text>
                        {(item.reactions?.[emoji] > 0) && (
                          <Text style={styles.reactionCount}>{item.reactions[emoji]}</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* Input Area */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.inputArea}
      >
        {/* Quick Wishes */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickWishesScroll} contentContainerStyle={styles.quickWishesContainer}>
          {QUICK_WISHES.map((wish, idx) => (
            <TouchableOpacity key={idx} style={styles.quickWishBtn} onPress={() => sendMessage(wish)}>
              <Text style={styles.quickWishText}>{wish}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Write a blessing..."
            placeholderTextColor="#64748b"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]} 
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim()}
          >
            <Send color="#0f172a" size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center'
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700'
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
    marginRight: 6
  },
  liveText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  celebrantsContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  celebrantsList: {
    paddingHorizontal: 16,
    gap: 12
  },
  celebrantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155'
  },
  celebrantIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  celebrantIcon: {
    fontSize: 20
  },
  celebrantName: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: 'bold'
  },
  celebrantType: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2
  },
  noCelebrantsText: {
    color: '#94a3b8',
    fontStyle: 'italic'
  },
  chatSection: {
    flex: 1,
    backgroundColor: '#0f172a'
  },
  chatHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  chatTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold'
  },
  participantCount: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 16
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 8
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#334155',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  messageContentBox: {
    flex: 1,
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 16,
    borderTopLeftRadius: 4
  },
  senderName: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4
  },
  messageText: {
    color: '#f8fafc',
    fontSize: 15,
    lineHeight: 22
  },
  reactionsBar: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155'
  },
  reactionEmoji: {
    fontSize: 12
  },
  reactionCount: {
    color: '#94a3b8',
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '600'
  },
  inputArea: {
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingBottom: Platform.OS === 'ios' ? 20 : 12
  },
  quickWishesScroll: {
    maxHeight: 50,
  },
  quickWishesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8
  },
  quickWishBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16
  },
  quickWishText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '500'
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12
  },
  input: {
    flex: 1,
    backgroundColor: '#0f172a',
    color: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 44,
    maxHeight: 100,
    fontSize: 15
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fbbf24',
    justifyContent: 'center',
    alignItems: 'center'
  }
});
