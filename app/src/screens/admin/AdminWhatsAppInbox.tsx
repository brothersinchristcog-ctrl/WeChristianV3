import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, ImageBackground, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageSquare, ArrowLeft, Send, CheckCheck, MoreVertical, Phone as PhoneIcon, Video } from 'lucide-react-native';
import { firestore, functions } from '../../services/firebaseConfig';
import { useChurch } from '../../context/ChurchContext';

interface WhatsAppMessage {
  id: string;
  from: string;
  text: string;
  status: string;
  timestamp: any;
  createdAt: any;
  direction?: 'inbound' | 'outbound';
}

interface Member {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
}

interface Conversation {
  phone: string;
  member?: Member;
  messages: WhatsAppMessage[];
  lastMessage: WhatsAppMessage;
}

export default function AdminWhatsAppInbox() {
  const { activeChurch } = useChurch();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const flatListRef = useRef<FlatList>(null);
  
  // Chat state
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!activeChurch) return;

    const fetchMembers = async () => {
      try {
        const snap = await firestore()
          .collection('churches')
          .doc(activeChurch.id)
          .collection('members')
          .get();
        
        const membersData = snap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || data.firstName || 'Unknown',
            phone: data.phone || data.mobile || '',
            avatarUrl: data.profilePhoto || data.avatarUrl || data.photoUrl || null
          };
        });
        setMembers(membersData);
      } catch (err) {
        console.error("Error fetching members:", err);
      }
    };

    fetchMembers();
  }, [activeChurch]);

  useEffect(() => {
    if (!activeChurch || members.length === 0) {
      if (loading) setLoading(false);
      return;
    }

    let mappedMsgs: WhatsAppMessage[] = [];
    let unmappedMsgs: WhatsAppMessage[] = [];

    const processMessages = () => {
      const allMsgs = [...mappedMsgs, ...unmappedMsgs];
      
      const groups = new Map<string, WhatsAppMessage[]>();
      allMsgs.forEach(m => {
        // Assume from is the remote phone regardless of inbound/outbound now based on our backend code
        const remotePhone = m.from; 
        if (!groups.has(remotePhone)) groups.set(remotePhone, []);
        groups.get(remotePhone)!.push(m);
      });

      const newConvos: Conversation[] = [];
      groups.forEach((groupMsgs, phone) => {
        const member = members.find(m => {
          if (!m.phone) return false;
          const cleanMetaPhone = phone.replace(/\D/g, '');
          const cleanMemberPhone = m.phone.replace(/\D/g, '');
          if (cleanMetaPhone.length < 10 || cleanMemberPhone.length < 10) return false;
          return cleanMetaPhone.endsWith(cleanMemberPhone.slice(-10));
        });

        const uniqueMsgsMap = new Map<string, WhatsAppMessage>();
        groupMsgs.forEach(m => uniqueMsgsMap.set(m.id, m));
        const uniqueMsgs = Array.from(uniqueMsgsMap.values());

        const sortedMsgs = uniqueMsgs.sort((a, b) => {
           const t1 = a.timestamp ? a.timestamp.toMillis() : 0;
           const t2 = b.timestamp ? b.timestamp.toMillis() : 0;
           return t1 - t2;
        });

        newConvos.push({
          phone,
          member,
          messages: sortedMsgs,
          lastMessage: sortedMsgs[sortedMsgs.length - 1]
        });
      });

      newConvos.sort((a, b) => {
          const t1 = a.lastMessage?.timestamp ? a.lastMessage.timestamp.toMillis() : 0;
          const t2 = b.lastMessage?.timestamp ? b.lastMessage.timestamp.toMillis() : 0;
          return t2 - t1;
      });
      
      setConversations(newConvos);
      setLoading(false);
    };

    const unsubscribe = firestore()
      .collection('churches')
      .doc(activeChurch.id)
      .collection('whatsappMessages')
      .orderBy('timestamp', 'desc')
      .onSnapshot((snapshot) => {
        if (!snapshot) return;
        mappedMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WhatsAppMessage));
        processMessages();
      }, err => {
        console.error("Error fetching whatsapp messages:", err);
      });

    const unsubscribeUnmapped = firestore()
      .collection('unmappedWhatsappMessages')
      .orderBy('timestamp', 'desc')
      .onSnapshot((snapshot) => {
        if (!snapshot) return;
        unmappedMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WhatsAppMessage));
        processMessages();
      }, err => {
        console.error("Error fetching unmapped messages:", err);
      });

    return () => {
      unsubscribe();
      unsubscribeUnmapped();
    };
  }, [activeChurch, members]);

  // Sync selectedConversation when conversations update
  useEffect(() => {
    if (selectedConversation) {
      const updated = conversations.find(c => c.phone === selectedConversation.phone);
      if (updated && updated.messages.length !== selectedConversation.messages.length) {
        setSelectedConversation(updated);
      }
    }
  }, [conversations]);

  // Scroll to bottom when new messages arrive or conversation is opened
  useEffect(() => {
    if (selectedConversation && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [selectedConversation?.messages.length, selectedConversation?.phone]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConversation) return;
    setSending(true);
    try {
      const sendWhatsApp = functions().httpsCallable('sendWAGreetingLatest');
      await sendWhatsApp({
        phoneNumber: selectedConversation.phone,
        messageText: replyText.trim(),
        churchId: activeChurch?.id
      });
      setReplyText('');
    } catch (err) {
      console.error("Error sending WhatsApp reply:", err);
      alert("Failed to send reply. Check console for details.");
    } finally {
      setSending(false);
    }
  };

  // Added search state
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(c => {
    const name = c.member ? c.member.name.toLowerCase() : '';
    const phone = c.phone.toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || phone.includes(query);
  });

  const renderInbox = () => (
    <View style={styles.container}>
      <View style={styles.inboxHeader}>
        <Text style={styles.inboxHeaderTitle}>WhatsApp</Text>
        <View style={styles.inboxHeaderIcons}>
          <TouchableOpacity><MoreVertical size={22} color="#8696A0" /></TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={{color: '#8696A0', marginRight: 8}}>🔍</Text>
          <TextInput 
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#8696A0"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#00A884" />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.center}>
          <MessageSquare size={48} color="#202C33" />
          <Text style={styles.emptyText}>No WhatsApp messages yet.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={item => item.phone}
          renderItem={({ item }) => {
            const isOutbound = item.lastMessage.direction === 'outbound';
            return (
              <TouchableOpacity 
                style={styles.convoCard}
                onPress={() => setSelectedConversation(item)}
              >
                <View style={styles.avatar}>
                  {item.member?.avatarUrl ? (
                    <Image source={{ uri: item.member.avatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>
                      {item.member ? item.member.name.charAt(0).toUpperCase() : '#'}
                    </Text>
                  )}
                </View>
                <View style={styles.convoDetails}>
                  <View style={styles.convoHeader}>
                    <Text style={styles.convoName}>{item.member ? item.member.name : item.phone}</Text>
                    <Text style={[styles.convoTime, !isOutbound && { color: '#8696A0' }]}>
                      {item.lastMessage.timestamp ? item.lastMessage.timestamp.toDate().toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                    </Text>
                  </View>
                  <View style={styles.previewRow}>
                    {isOutbound && (
                      <CheckCheck size={16} color={item.lastMessage.status === 'read' ? "#53bdeb" : "#8696A0"} style={styles.previewCheck} />
                    )}
                    <Text style={styles.convoPreview} numberOfLines={1}>
                      {item.lastMessage.text}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )
          }}
        />
      )}
    </View>
  );

  const renderChat = () => {
    if (!selectedConversation) return null;
    return (
      <View style={styles.container}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setSelectedConversation(null)} style={styles.backButton}>
            <ArrowLeft size={24} color="#E9EDEF" />
            <View style={[styles.avatar, styles.smallAvatar]}>
              {selectedConversation.member?.avatarUrl ? (
                <Image source={{ uri: selectedConversation.member.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarTextSmall}>
                  {selectedConversation.member ? selectedConversation.member.name.charAt(0).toUpperCase() : '#'}
                </Text>
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatHeaderTitle} numberOfLines={1}>
              {selectedConversation.member ? selectedConversation.member.name : selectedConversation.phone}
            </Text>
          </View>
          <View style={styles.chatHeaderIcons}>
            <TouchableOpacity><PhoneIcon size={20} color="#E9EDEF" style={styles.iconSpaced} /></TouchableOpacity>
            <TouchableOpacity><MoreVertical size={20} color="#E9EDEF" /></TouchableOpacity>
          </View>
        </View>

        <View style={styles.chatBackground}>
          <FlatList
            ref={flatListRef}
            data={selectedConversation.messages}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.chatListContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => {
              const isOutbound = item.direction === 'outbound';
              return (
                <View style={[
                  styles.messageBubble, 
                  isOutbound ? styles.messageBubbleOutbound : styles.messageBubbleInbound
                ]}>
                  <Text style={styles.messageText}>{item.text}</Text>
                  
                  <View style={styles.messageFooter}>
                    {isOutbound && (
                      <Text style={styles.sentByText}>Sent by Admin</Text>
                    )}
                    <Text style={styles.messageTime}>
                      {item.timestamp ? item.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </Text>
                    {isOutbound && (
                      <CheckCheck size={14} color={item.status === 'read' ? "#53bdeb" : "#8696a0"} style={styles.messageCheck} />
                    )}
                  </View>
                </View>
              )
            }}
          />
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.inputArea}
        >
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Message"
              placeholderTextColor="#8696A0"
              value={replyText}
              onChangeText={setReplyText}
              multiline
            />
          </View>
          <TouchableOpacity 
            style={[styles.sendButton, !replyText.trim() && { opacity: 0.5 }]} 
            onPress={handleSendReply}
            disabled={!replyText.trim() || sending}
          >
            {sending ? <ActivityIndicator color="#fff" size="small" /> : <Send size={20} color="#fff" style={{ marginLeft: 2 }} />}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#202C33' }} edges={['top']}>
      <View style={{ flex: 1, backgroundColor: '#111B21' }}>
        {selectedConversation ? renderChat() : renderInbox()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111B21',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#202C33',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inboxHeaderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E9EDEF',
  },
  inboxHeaderIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSpaced: {
    marginRight: 20,
  },
  searchContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#111B21',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202C33',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 40,
  },
  searchInput: {
    flex: 1,
    color: '#E9EDEF',
    fontSize: 15,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8696A0',
  },
  convoCard: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6C7175',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '500',
  },
  smallAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: 4,
  },
  avatarTextSmall: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  convoDetails: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222D34',
    paddingBottom: 12,
  },
  convoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  convoName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#E9EDEF',
  },
  convoTime: {
    fontSize: 12,
    color: '#8696A0',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewCheck: {
    marginRight: 4,
  },
  convoPreview: {
    fontSize: 14,
    color: '#8696A0',
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202C33',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatHeaderInfo: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  chatHeaderTitle: {
    color: '#E9EDEF',
    fontSize: 16,
    fontWeight: '600',
  },
  chatHeaderSubtitle: {
    color: '#8696A0',
    fontSize: 12,
  },
  chatHeaderIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  chatBackground: {
    flex: 1,
    backgroundColor: '#0B141A',
  },
  chatListContent: {
    padding: 12,
    paddingBottom: 24,
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: '85%',
  },
  messageBubbleInbound: {
    alignSelf: 'flex-start',
    backgroundColor: '#202C33',
    borderTopLeftRadius: 0,
  },
  messageBubbleOutbound: {
    alignSelf: 'flex-end',
    backgroundColor: '#005C4B',
    borderTopRightRadius: 0,
  },
  messageText: {
    fontSize: 15,
    color: '#E9EDEF',
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  sentByText: {
    fontSize: 10,
    color: '#8696A0',
    fontStyle: 'italic',
    marginRight: 8,
  },
  messageTime: {
    fontSize: 11,
    color: '#8696A0',
    marginLeft: 4,
  },
  messageCheck: {
    marginLeft: 4,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    backgroundColor: '#0B141A',
  },
  inputContainer: {
    flex: 1,
    backgroundColor: '#202C33',
    borderRadius: 24,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  input: {
    fontSize: 16,
    color: '#E9EDEF',
    maxHeight: 120,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00A884',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
});
