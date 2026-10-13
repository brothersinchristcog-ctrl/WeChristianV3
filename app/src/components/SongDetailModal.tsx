import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ChevronLeft, Bookmark, Globe } from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import { SupportedLanguage } from '../locales';
import { WorshipSong } from '../services/FirestoreService';
import { SongLanguageHelper } from '../services/SongLanguageHelper';

interface SongDetailModalProps {
  visible: boolean;
  song: WorshipSong | null;
  onClose: () => void;
  isDark: boolean;
  isSaved?: boolean;
  onToggleSave?: (song: WorshipSong) => void;
  currentSongIndex?: number;
  totalSongs?: number;
  onNext?: () => void;
  onPrev?: () => void;
  headerColors?: [string, string];
  bottomBarColors?: [string, string];
  onEdit?: (song: WorshipSong) => void;
  onDelete?: (song: WorshipSong) => void;
}

export default function SongDetailModal({
  visible,
  song,
  onClose,
  isDark,
  isSaved = false,
  onToggleSave,
  currentSongIndex = -1,
  totalSongs = 0,
  onNext,
  onPrev,
  headerColors = ['#2b52a1', '#1a3673'],
  bottomBarColors = ['#2b52a1', '#1a3673'],
  onEdit,
  onDelete
}: SongDetailModalProps) {
  const { language, t } = useLanguage();
  const [selectedLangOverride, setSelectedLangOverride] = useState<SupportedLanguage | null>(null);

  useEffect(() => {
    setSelectedLangOverride(null);
  }, [song?.id]);

  if (!visible || !song) return null;

  const activeLyricsLang = selectedLangOverride || language;
  const { primary, secondary } = SongLanguageHelper.getSongTitle(song, activeLyricsLang);
  const subtitle = secondary || (song.category ? SongLanguageHelper.getLocalizedCategory(song.category, language) : '');

  const availableLanguages = SongLanguageHelper.getAvailableSongLanguages(song, language);
  const lyricsInfo = SongLanguageHelper.getSongLyrics(song, activeLyricsLang);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.modalCard, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} bounces={false}>
          <LinearGradient 
            colors={headerColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalHeader}
          >
            <TouchableOpacity style={styles.backBtn} onPress={onClose} hitSlop={{top:10, bottom:10, left:10, right:10}}>
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
            
            <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
              <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 20 }}>
                <Text style={styles.modalTitleEn} numberOfLines={1}>
                  {primary}
                </Text>
                {subtitle ? (
                  <Text style={styles.modalTitleTe} numberOfLines={1}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
            </View>
            <View style={{ width: 24 }} />
          </LinearGradient>

          <View style={styles.modalScroll}>
            {/* Multiple translations tab switcher */}
            {availableLanguages.length > 1 && (
              <View style={styles.langSelectorRow}>
                <Globe size={14} color={isDark ? '#94a3b8' : '#64748b'} style={{ marginRight: 4 }} />
                {availableLanguages.map(item => {
                  const isSelected = (lyricsInfo.langCode === item.code);
                  return (
                    <TouchableOpacity
                      key={item.code}
                      style={[
                        styles.langPill,
                        { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderColor: isDark ? '#334155' : '#e2e8f0' },
                        isSelected && { backgroundColor: '#1a2d5a', borderColor: '#1a2d5a' }
                      ]}
                      onPress={() => setSelectedLangOverride(item.code)}
                    >
                      <Text style={[
                        styles.langPillTxt,
                        { color: isDark ? '#94a3b8' : '#64748b' },
                        isSelected && { color: '#fff', fontWeight: '800' }
                      ]}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <Text style={[styles.modalSecHeader, { color: isDark ? '#fff' : '#1a2d5a' }]}>
              {t('songs.lyricsAndScripts')}
              {lyricsInfo.langName ? ` · ${lyricsInfo.langName}` : ''}
            </Text>

            <View style={[styles.lyricsBox, { backgroundColor: isDark ? '#1e293b' : '#fff', position: 'relative' }]}>
              
              <View style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, flexDirection: 'row', gap: 8 }}>
                {onEdit && (
                  <TouchableOpacity 
                    style={{ 
                      flexDirection: 'row', alignItems: 'center', gap: 6,
                      backgroundColor: isDark ? '#334155' : '#f1f5f9',
                      borderWidth: 1, borderColor: isDark ? '#475569' : '#e2e8f0',
                      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12
                    }} 
                    onPress={() => onEdit(song)}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#94a3b8' : '#64748b' }}>
                      {t('songs.edit')}
                    </Text>
                  </TouchableOpacity>
                )}
                {onDelete && (
                  <TouchableOpacity 
                    style={{ 
                      flexDirection: 'row', alignItems: 'center', gap: 6,
                      backgroundColor: '#fee2e2',
                      borderWidth: 1, borderColor: '#fecaca',
                      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12
                    }} 
                    onPress={() => onDelete(song)}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#dc2626' }}>
                      {t('songs.delete')}
                    </Text>
                  </TouchableOpacity>
                )}
                {onToggleSave && (
                  <TouchableOpacity 
                    style={{ 
                      flexDirection: 'row', alignItems: 'center', gap: 6,
                      backgroundColor: isSaved ? '#fee2e2' : (isDark ? '#334155' : '#f1f5f9'),
                      borderWidth: 1, borderColor: isSaved ? '#fecaca' : (isDark ? '#475569' : '#e2e8f0'),
                      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12
                    }} 
                    onPress={() => onToggleSave(song)}
                  >
                    <Bookmark size={14} color={isSaved ? '#c0392b' : (isDark ? '#94a3b8' : '#64748b')} fill={isSaved ? '#c0392b' : 'transparent'} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: isSaved ? '#c0392b' : (isDark ? '#94a3b8' : '#64748b') }}>
                      {isSaved ? t('songs.saved') : t('songs.save')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ marginTop: (onToggleSave || onEdit || onDelete) ? 36 : 0, marginBottom: 12 }}>
                {lyricsInfo.isTransliterated && (
                  <View style={[styles.transliteratedBadge, { backgroundColor: isDark ? '#1e3a5f' : '#eff6ff', borderColor: isDark ? '#2b52a1' : '#bfdbfe' }]}>
                    <Text style={[styles.transliteratedBadgeTxt, { color: isDark ? '#93c5fd' : '#1d4ed8' }]}>
                      ✨ {lyricsInfo.langName} Transliteration
                    </Text>
                  </View>
                )}

                {lyricsInfo.isFallback && (
                  <View style={[styles.fallbackNotice, { backgroundColor: isDark ? '#334155' : '#fef3c7', borderColor: isDark ? '#475569' : '#fde68a' }]}>
                    <Text style={[styles.fallbackNoticeTxt, { color: isDark ? '#f8fafc' : '#92400e' }]}>
                      ℹ️ {t('songs.originalContentNotice', { lang: lyricsInfo.langName })}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={[styles.lyricsText, { color: isDark ? '#e2e8f0' : '#1e293b' }]}>
                {lyricsInfo.lyrics || t('songs.noLyrics')}
              </Text>
            </View>
            <View style={{ height: 120 }} />
          </View>
        </ScrollView>

        {(totalSongs > 0 && onPrev && onNext) && (
          <LinearGradient 
            colors={bottomBarColors}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.bottomBar}
          >
            <TouchableOpacity 
              style={[styles.barAction, currentSongIndex <= 0 && { opacity: 0.3 }, { backgroundColor: 'transparent' }]} 
              onPress={onPrev}
              disabled={currentSongIndex <= 0}
            >
              <ChevronLeft color="#fff" size={24} />
            </TouchableOpacity>
            
            <View style={styles.barMain}>
              <Text style={[styles.barMainTxt, { color: '#fff' }]}>
                {currentSongIndex !== -1 ? `${currentSongIndex + 1} / ${totalSongs}` : ''}
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.barAction, currentSongIndex >= totalSongs - 1 && { opacity: 0.3 }, { backgroundColor: 'transparent' }]}
              onPress={onNext}
              disabled={currentSongIndex >= totalSongs - 1}
            >
              <ChevronLeft color="#fff" size={24} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
          </LinearGradient>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalCard: { flex: 1 },
  modalHeader: {
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight ?? 24) + 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: Platform.OS === 'ios' ? 120 : 100,
  },
  modalTitleEn: { fontSize: 13, fontWeight: '800', color: '#fff', textAlign: 'center', marginHorizontal: 56 },
  modalTitleTe: { fontSize: 12, color: '#aac4e8', marginTop: 2, fontWeight: '600', textAlign: 'center', marginHorizontal: 56 },
  backBtn: { zIndex: 10, padding: 5, marginLeft: -10 },
  modalScroll: { flex: 1, padding: 20 },
  langSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8
  },
  langPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1
  },
  langPillTxt: {
    fontSize: 12,
    fontWeight: '600'
  },
  transliteratedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'center',
    marginBottom: 8,
  },
  transliteratedBadgeTxt: {
    fontSize: 11,
    fontWeight: '700',
  },
  fallbackNotice: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'stretch',
    marginBottom: 8,
  },
  fallbackNoticeTxt: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalSecHeader: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 15, textAlign: 'center' },
  lyricsBox: { borderRadius: 16, padding: 24, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  lyricsText: { fontSize: 16, lineHeight: 28, fontWeight: '500', fontStyle: 'italic', textAlign: 'center' },
  bottomBar: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    elevation: 12,
    shadowColor: '#1a2d5a',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 }
  },
  barAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center'
  },
  barMain: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  barMainTxt: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5
  },
});
