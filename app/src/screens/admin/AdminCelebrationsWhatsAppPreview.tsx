import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Image, ActivityIndicator } from 'react-native';
import { Edit2 } from 'lucide-react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Circle, G, Path } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';

const ICONS = {
  whatsapp: (
    <Svg viewBox="0 0 24 24" fill="currentColor" width={16} height={16}>
      <G>
        <Path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.7.8-.8 1-.2.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5.1-.1.2-.3.4-.4.1-.2.2-.3.2-.5.1-.2 0-.4 0-.5 0-.1-.6-1.5-.8-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-1 1-1 2.3 0 1.4 1 2.7 1.1 2.9.1.2 2 3 4.8 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2-.1-.2-.2-.2-.4-.3Z" />
      </G>
    </Svg>
  ),
};

export default function AdminCelebrationsWhatsAppPreview({ 
  member, 
  category,
  theme,
  layout,
  photoUri,
  titleOverlay,
  nameOverlay,
  message, 
  verse,
  churchName,
  onEdit, 
  onSendWhatsApp,
  onSendPush
}: { 
  member: any, 
  category: string,
  theme: any,
  layout?: 'theme' | 'photo',
  photoUri?: string | null,
  titleOverlay?: string,
  nameOverlay?: string,
  message: string,
  verse: {ref: string, text: string},
  churchName: string,
  onEdit: () => void, 
  onSendWhatsApp: (imageUri: string) => Promise<void>,
  onSendPush: (imageUri: string) => Promise<void>
}) {
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [isSendingPush, setIsSendingPush] = useState(false);
  
  const colors = theme?.imageUrl 
    ? ['#000000', '#000000'] 
    : (theme?.color ? [theme.color, theme.color] : (theme?.c || ['#5A6BC4', '#1E2A63']));
  
  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
  
  // Create initials
  const parts = member.name.split(' ');
  const initials = (parts[0][0] + (parts[1]?parts[1][0]:'')).toUpperCase();

  const viewRef = useRef<View>(null);

  const handleCaptureAndSend = async (type: 'whatsapp' | 'push') => {
    if (type === 'whatsapp') setIsSendingWhatsApp(true);
    if (type === 'push') setIsSendingPush(true);
    
    try {
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
      });
      
      if (type === 'whatsapp') {
        await onSendWhatsApp(uri);
      } else {
        await onSendPush(uri);
      }
    } catch (err) {
      console.error(`Capture for ${type} failed`, err);
    } finally {
      setIsSendingWhatsApp(false);
      setIsSendingPush(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>PREVIEW</Text>

        <View style={styles.waHeader}>
          <View style={[styles.avatar, { backgroundColor: colors[1] }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.waName}>{member.name}</Text>
            <Text style={styles.waStatus}>{member.phone}</Text>
          </View>
        </View>

        <View style={styles.waBody}>
          <View style={styles.waBubble}>
            <View ref={viewRef} collapsable={false}>
              <View style={styles.greetingFrame}>
                {theme?.imageUrl && (
                  <Image source={{ uri: theme.imageUrl }} style={[StyleSheet.absoluteFillObject, { resizeMode: 'cover' }]} />
                )}
              <Svg width="100%" height={350} viewBox="0 0 400 500">
                <Defs>
                  <LinearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor={colors[0]} stopOpacity={theme?.imageUrl ? 0.2 : 1} />
                    <Stop offset="100%" stopColor={colors[1]} stopOpacity={theme?.imageUrl ? 0.7 : 1} />
                  </LinearGradient>
                </Defs>
                <Rect width="400" height="500" fill="url(#pg)" />
                {!theme?.imageUrl && (
                  <>
                    <G fill="#ffffff" opacity="0.10">
                      <Circle cx="60" cy="60" r="70" />
                      <Circle cx="360" cy="440" r="90" />
                      <Circle cx="370" cy="60" r="40" />
                    </G>
                    <G fill="none" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1.5">
                      <Circle cx="200" cy="250" r="150" />
                      <Circle cx="200" cy="250" r="110" />
                    </G>
                  </>
                )}
              </Svg>

              <View style={styles.greetingOverlay}>
                <Text style={styles.gCrest}>{churchName || 'Grace Community Church'}</Text>
                
                {layout === 'theme' && photoUri && (
                  <View style={{alignItems: 'center', marginVertical: 8}}>
                    <Image source={{uri: photoUri}} style={{width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#fff'}} />
                  </View>
                )}

                <Text style={styles.gTitle}>{titleOverlay || categoryLabel}</Text>
                <Text style={styles.gName}>{nameOverlay || member.name}</Text>
                <Text style={styles.gMsg}>{message}</Text>
                {verse?.text ? (
                  <Text style={[styles.gVerse, /[\u0C00-\u0C7F]/.test(verse.text) && { fontFamily: undefined }]}>
                    "{verse.text.length > 100 ? verse.text.substring(0, 100) + '...' : verse.text}"
                    {'\n'}— {verse.ref}
                  </Text>
                ) : null}
                <Text style={styles.gSender}>Sent with love</Text>
              </View>
            </View>
            </View>

            <Text style={styles.waCaption}>Praise the Lord!{'\n\n'}{message}</Text>
            {verse?.text && <Text style={styles.waVerse}>{'\n\n'}"{verse.text}"{'\n'}— {verse.ref}</Text>}
            <Text style={styles.waCaption}>{'\n\n'}With Love ❤️{'\n'}{churchName || 'Your Church'}</Text>
            <Text style={styles.waTime}>9:41 AM ✓✓</Text>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.btnOutline} onPress={onEdit} disabled={isSendingWhatsApp || isSendingPush}>
            <Edit2 stroke="#475569" width={16} height={16} />
            <Text style={styles.btnOutlineText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: '#37469B' }]} onPress={() => handleCaptureAndSend('push')} disabled={isSendingWhatsApp || isSendingPush}>
            {isSendingPush ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.btnPrimaryText}>Send</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: '#128C7E' }]} onPress={() => handleCaptureAndSend('whatsapp')} disabled={isSendingWhatsApp || isSendingPush}>
            {isSendingWhatsApp ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                {ICONS.whatsapp}
                <Text style={styles.btnPrimaryText}>WhatsApp</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    letterSpacing: 1.5,
    color: '#64748B',
    marginBottom: 12,
  },
  waHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#075E54',
    padding: 12,
    paddingHorizontal: 14,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontFamily: 'Fraunces-Bold',
    fontSize: 13,
  },
  waName: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  waStatus: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    opacity: 0.8,
  },
  waBody: {
    backgroundColor: '#E5DDD5',
    padding: 16,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  waBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 8,
    maxWidth: '90%',
    marginLeft: 'auto', // push to right
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 10,
  },
  waCaption: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#111111',
    lineHeight: 19.5,
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 2,
  },
  waVerse: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 13,
    color: '#333333',
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  waTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: '#8b8b8b',
    textAlign: 'right',
    paddingRight: 4,
    paddingTop: 2,
  },
  greetingFrame: {
    width: '100%',
    height: 350,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#1E2A63',
  },
  greetingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gCrest: {
    fontFamily: 'Inter-Bold',
    fontSize: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#FFFFFF',
    opacity: 0.85,
    marginBottom: 8,
    textAlign: 'center',
  },
  gTitle: {
    fontFamily: 'Fraunces-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  gName: {
    fontFamily: 'Fraunces-SemiBold',
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  gMsg: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  gVerse: {
    fontFamily: 'Inter-Italic',
    fontSize: 10,
    lineHeight: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  gSender: {
    fontFamily: 'Inter-Medium',
    fontSize: 9,
    color: '#FFFFFF',
    opacity: 0.7,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  btnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#F1F5F9', // light gray solid background
  },
  btnOutlineText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: '#475569', // slate gray text
  },
  btnPrimary: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#BE9A3A',
    shadowColor: '#BE9A3A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 6,
  },
  btnPrimaryText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  }
});
