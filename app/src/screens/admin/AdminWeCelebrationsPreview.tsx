import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Dimensions, Image } from 'react-native';
import { ArrowLeft, Edit2 } from 'lucide-react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Circle, G } from 'react-native-svg';

const { width } = Dimensions.get('window');

const ICONS = {
  whatsapp: (
    <Svg viewBox="0 0 24 24" fill="currentColor" width={16} height={16}>
      <G>
        <Path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.7.8-.8 1-.2.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5.1-.1.2-.3.4-.4.1-.2.2-.3.2-.5.1-.2 0-.4 0-.5 0-.1-.6-1.5-.8-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-1 1-1 2.3 0 1.4 1 2.7 1.1 2.9.1.2 2 3 4.8 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2-.1-.2-.2-.2-.4-.3Z" />
      </G>
    </Svg>
  ),
};

// Extracted from original stitch code
import { Path } from 'react-native-svg';

export default function AdminWeCelebrationsPreview({ 
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
  onBack, 
  onEdit, 
  onContinue 
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
  onBack: () => void, 
  onEdit: () => void, 
  onContinue: () => void 
}) {
  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
  const colors = theme?.imageUrl 
    ? ['#000000', '#000000'] 
    : (theme?.color ? [theme.color, theme.color] : (theme?.c || ['#5A6BC4', '#1E2A63']));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft stroke="#162057" width={20} height={20} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerSubtitle}>Prepare Wish</Text>
          <Text style={styles.headerTitle}>Preview</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>GREETING PREVIEW</Text>

        <View style={styles.greetingFrame}>
          {theme?.imageUrl && (
            <Image source={{ uri: theme.imageUrl }} style={[StyleSheet.absoluteFillObject, { resizeMode: 'cover' }]} />
          )}
          <Svg width="100%" height={450} viewBox="0 0 400 500">
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
              <View style={{alignItems: 'center', marginVertical: 12}}>
                <Image source={{uri: photoUri}} style={{width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#fff'}} />
              </View>
            )}

            <Text style={styles.gTitle}>{titleOverlay || categoryLabel}</Text>
            <Text style={styles.gName}>{nameOverlay || member.name}</Text>
            <Text style={styles.gMsg}>{message}</Text>
            <Text style={styles.gVerse}>
              "{verse?.text?.length > 100 ? verse.text.substring(0, 100) + '...' : (verse?.text || '')}"
              {'\n'}— {verse?.ref || ''}
            </Text>
            <Text style={styles.gSender}>Sent with love</Text>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.btnOutline} onPress={onEdit}>
            <Edit2 stroke="#37469B" width={16} height={16} />
            <Text style={styles.btnOutlineText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnPrimary} onPress={onContinue}>
            {ICONS.whatsapp}
            <Text style={styles.btnPrimaryText}>Continue</Text>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: '#F8FAFC',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E2A63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  headerTitles: {
    alignItems: 'center',
  },
  headerSubtitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#BE9A3A',
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: 'Fraunces-SemiBold',
    fontSize: 20,
    color: '#162057',
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
  greetingFrame: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#1E2A63',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.22,
    shadowRadius: 40,
    elevation: 10,
    position: 'relative',
    backgroundColor: '#37469B',
  },
  greetingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    padding: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gCrest: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#FFFFFF',
    opacity: 0.85,
    marginBottom: 10,
    textAlign: 'center',
  },
  gTitle: {
    fontFamily: 'Fraunces-Bold',
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  gName: {
    fontFamily: 'Fraunces-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  gMsg: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 21,
    color: '#FFFFFF',
    opacity: 0.95,
    marginBottom: 16,
    textAlign: 'center',
  },
  gVerse: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 15,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  gSender: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.75,
    letterSpacing: 0.4,
    textAlign: 'center',
    marginTop: 14,
  },
    buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    alignItems: 'stretch',
  },
  btnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#37469B',
    backgroundColor: 'transparent',
  },
  btnOutlineText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: '#37469B',
  },
    btnPrimary: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#37469B',
    shadowColor: '#1E2A63',
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
