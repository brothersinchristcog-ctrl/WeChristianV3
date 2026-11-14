import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
} from 'react-native';
import {
  X,
  Search,
  ChevronLeft,
  BookOpen,
  Check,
  Hash,
} from 'lucide-react-native';
import { BibleService, BIBLE_BOOKS, CHAPTER_COUNTS } from '../../../services/BibleService';

export interface BiblePickerResult {
  book: string;
  bookIndex: number;
  chapter: number;
  verse?: number | string;
  chapterRange?: string;
  referenceString: string;
}

export interface BibleScopeResult {
  book: string;
  bookIndex: number;
  chapterStart: number;
  chapterEnd: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  mode: 'reference' | 'scope'; // 'reference' for questions, 'scope' for quiz book/chapters
  initialBook?: string;
  initialChapter?: number;
  onSelectReference?: (result: BiblePickerResult) => void;
  onSelectScope?: (result: BibleScopeResult) => void;
}

export default function BibleReferencePickerModal({
  visible,
  onClose,
  mode,
  initialBook,
  initialChapter,
  onSelectReference,
  onSelectScope,
}: Props) {
  // Step: 1 = Book, 2 = Chapter, 3 = Verse (only for 'reference' mode)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [chapterMode, setChapterMode] = useState<'multiple' | 'single'>('multiple');

  // Selection states
  const [selectedBookIndex, setSelectedBookIndex] = useState<number | null>(() => {
    if (initialBook) {
      const idx = BibleService.getBookIndex(initialBook);
      return idx >= 0 ? idx : null;
    }
    return null;
  });
  const [selectedChapter, setSelectedChapter] = useState<number>(initialChapter || 1);
  const [startChapter, setStartChapter] = useState<number>(1);
  const [endChapter, setEndChapter] = useState<number>(1);
  const [customVerse, setCustomVerse] = useState<string>('');

  // Book search & testament filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [testamentFilter, setTestamentFilter] = useState<'ALL' | 'OT' | 'NT'>('ALL');

  // Build full 66 book list
  const allBooks = useMemo(() => {
    const list: Array<{
      index: number;
      nameEn: string;
      nameTe: string;
      testament: 'OT' | 'NT';
      totalChapters: number;
    }> = [];

    const enOT = BIBLE_BOOKS.en.OT;
    const enNT = BIBLE_BOOKS.en.NT;
    const teOT = BIBLE_BOOKS.te?.OT || [];
    const teNT = BIBLE_BOOKS.te?.NT || [];

    for (let i = 0; i < 39; i++) {
      list.push({
        index: i,
        nameEn: enOT[i] || '',
        nameTe: teOT[i] || '',
        testament: 'OT',
        totalChapters: CHAPTER_COUNTS[i] || 1,
      });
    }

    for (let i = 0; i < 27; i++) {
      const globalIdx = 39 + i;
      list.push({
        index: globalIdx,
        nameEn: enNT[i] || '',
        nameTe: teNT[i] || '',
        testament: 'NT',
        totalChapters: CHAPTER_COUNTS[globalIdx] || 1,
      });
    }

    return list;
  }, []);

  // Filtered books
  const filteredBooks = useMemo(() => {
    let result = allBooks;
    if (testamentFilter === 'OT') {
      result = result.filter(b => b.testament === 'OT');
    } else if (testamentFilter === 'NT') {
      result = result.filter(b => b.testament === 'NT');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        b =>
          b.nameEn.toLowerCase().includes(q) ||
          b.nameTe.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allBooks, testamentFilter, searchQuery]);

  const currentBook = selectedBookIndex !== null ? allBooks[selectedBookIndex] : null;
  const maxChapters = currentBook ? currentBook.totalChapters : 1;

  // Handle book selection
  const handleSelectBook = (bookIdx: number) => {
    setSelectedBookIndex(bookIdx);
    setSelectedChapter(1);
    setStartChapter(1);
    const maxCh = allBooks[bookIdx]?.totalChapters || 1;
    setEndChapter(maxCh > 5 ? 5 : maxCh);
    setStep(2);
  };

  // Handle chapter selection in reference mode
  const handleSelectChapterForReference = (ch: number) => {
    setSelectedChapter(ch);
    setCustomVerse('');
    setStep(3); // Advance to verse
  };

  // Finalize Reference Selection with verse
  const handleSelectVerse = (vNum: number | string) => {
    if (!currentBook) return;
    const vStr = String(vNum).trim();
    const ref = vStr ? `${currentBook.nameEn} ${selectedChapter}:${vStr}` : `${currentBook.nameEn} ${selectedChapter}`;
    onSelectReference?.({
      book: currentBook.nameEn,
      bookIndex: currentBook.index,
      chapter: selectedChapter,
      verse: vNum,
      referenceString: ref,
    });
    handleClose();
  };

  // Finalize Multi-Chapter Reference Selection (e.g. Genesis 1-6)
  const handleConfirmMultiChapterReference = (wholeBook: boolean = false) => {
    if (!currentBook) return;
    const sCh = wholeBook ? 1 : Math.min(startChapter, endChapter);
    const eCh = wholeBook ? maxChapters : Math.max(startChapter, endChapter);
    const ref = sCh === eCh ? `${currentBook.nameEn} ${sCh}` : `${currentBook.nameEn} ${sCh}-${eCh}`;
    onSelectReference?.({
      book: currentBook.nameEn,
      bookIndex: currentBook.index,
      chapter: sCh,
      chapterRange: `${sCh}-${eCh}`,
      referenceString: ref,
    });
    handleClose();
  };

  // Finalize Whole Single Chapter Reference without needing verse
  const handleConfirmSingleChapterOnly = (ch: number) => {
    if (!currentBook) return;
    onSelectReference?.({
      book: currentBook.nameEn,
      bookIndex: currentBook.index,
      chapter: ch,
      referenceString: `${currentBook.nameEn} ${ch}`,
    });
    handleClose();
  };

  // Finalize Scope Selection (for quiz book/chapter start & end)
  const handleConfirmScope = (wholeBook: boolean = false) => {
    if (!currentBook) return;
    const sCh = wholeBook ? 1 : Math.max(1, Math.min(startChapter, endChapter));
    const eCh = wholeBook ? maxChapters : Math.min(maxChapters, Math.max(startChapter, endChapter));
    onSelectScope?.({
      book: currentBook.nameEn,
      bookIndex: currentBook.index,
      chapterStart: sCh,
      chapterEnd: eCh,
    });
    handleClose();
  };

  const handleClose = () => {
    setStep(1);
    setSearchQuery('');
    setCustomVerse('');
    onClose();
  };

  const handleBackStep = () => {
    if (step === 3) {
      setStep(2);
    } else if (step === 2) {
      setStep(1);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            {step > 1 ? (
              <TouchableOpacity onPress={handleBackStep} style={styles.headerBtn}>
                <ChevronLeft size={22} color="#1e293b" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 32 }} />
            )}

            <View style={{ alignItems: 'center' }}>
              <Text style={styles.modalTitle}>
                {step === 1
                  ? 'Select Bible Book'
                  : step === 2
                  ? `${currentBook?.nameEn} · Select Chapters`
                  : `${currentBook?.nameEn} ${selectedChapter} · Select Verse`}
              </Text>
              <Text style={styles.modalSubtitle}>
                {step === 1
                  ? 'Choose from 66 Books of Scripture'
                  : step === 2
                  ? `${currentBook?.totalChapters} Chapters available · Single or Multiple Chapters`
                  : 'Tap a verse number or enter a verse range'}
              </Text>
            </View>

            <TouchableOpacity onPress={handleClose} style={styles.headerBtn}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* ──────────────── STEP 1: BOOK SELECTION ──────────────── */}
          {step === 1 && (
            <View style={{ flex: 1 }}>
              {/* Search & Testament Filter */}
              <View style={styles.searchBox}>
                <Search size={16} color="#94a3b8" />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search Book (e.g. Genesis, John, యోహాను)..."
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={15} color="#94a3b8" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Testament Filter Tabs */}
              <View style={styles.tabsRow}>
                {(['ALL', 'OT', 'NT'] as const).map(tab => (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.tabBtn, testamentFilter === tab && styles.tabBtnActive]}
                    onPress={() => setTestamentFilter(tab)}
                  >
                    <Text
                      style={[styles.tabBtnTxt, testamentFilter === tab && styles.tabBtnTxtActive]}
                    >
                      {tab === 'ALL'
                        ? 'All (66)'
                        : tab === 'OT'
                        ? 'Old Testament (39)'
                        : 'New Testament (27)'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Books List */}
              <FlatList
                data={filteredBooks}
                keyExtractor={item => String(item.index)}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item }) => {
                  const isSelected = selectedBookIndex === item.index;
                  return (
                    <TouchableOpacity
                      style={[styles.bookItem, isSelected && styles.bookItemActive]}
                      onPress={() => handleSelectBook(item.index)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.bookIconWrap}>
                        <BookOpen size={16} color={item.testament === 'OT' ? '#b45309' : '#1e40af'} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.bookNameEn}>{item.nameEn}</Text>
                        {item.nameTe ? (
                          <Text style={styles.bookNameTe}>{item.nameTe}</Text>
                        ) : null}
                      </View>
                      <View style={styles.chaptersBadge}>
                        <Text style={styles.chaptersBadgeTxt}>{item.totalChapters} Chs</Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          )}

          {/* ──────────────── STEP 2: CHAPTER SELECTION ──────────────── */}
          {step === 2 && currentBook && (
            <View style={{ flex: 1 }}>
              {/* Tab Selector: Multiple Chapters / Range vs Single Chapter & Verse */}
              <View style={styles.chapterModeTabs}>
                <TouchableOpacity
                  style={[
                    styles.chapterModeTabBtn,
                    chapterMode === 'multiple' && styles.chapterModeTabBtnActive,
                  ]}
                  onPress={() => setChapterMode('multiple')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.chapterModeTabBtnTxt,
                      chapterMode === 'multiple' && styles.chapterModeTabBtnTxtActive,
                    ]}
                  >
                    Multiple Chapters / Range
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.chapterModeTabBtn,
                    chapterMode === 'single' && styles.chapterModeTabBtnActive,
                  ]}
                  onPress={() => setChapterMode('single')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.chapterModeTabBtnTxt,
                      chapterMode === 'single' && styles.chapterModeTabBtnTxtActive,
                    ]}
                  >
                    Single Chapter & Verse
                  </Text>
                </TouchableOpacity>
              </View>

              {chapterMode === 'multiple' ? (
                /* Multiple Chapters / Range Mode */
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                  <TouchableOpacity
                    style={styles.quickAllBtn}
                    onPress={() => {
                      setStartChapter(1);
                      setEndChapter(maxChapters);
                    }}
                    activeOpacity={0.8}
                  >
                    <Check size={16} color="#059669" />
                    <Text style={styles.quickAllBtnTxt}>
                      Cover Whole Book (Chapters 1 to {maxChapters})
                    </Text>
                  </TouchableOpacity>

                  <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Select Chapter Range:</Text>

                  <View style={styles.rangeSelectorRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rangeLabel}>From Chapter</Text>
                      <View style={styles.counterRow}>
                        <TouchableOpacity
                          style={styles.counterBtn}
                          onPress={() => setStartChapter(Math.max(1, startChapter - 1))}
                        >
                          <Text style={styles.counterBtnTxt}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.counterVal}>{startChapter}</Text>
                        <TouchableOpacity
                          style={styles.counterBtn}
                          onPress={() => setStartChapter(Math.min(maxChapters, startChapter + 1))}
                        >
                          <Text style={styles.counterBtnTxt}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={{ width: 16 }} />

                    <View style={{ flex: 1 }}>
                      <Text style={styles.rangeLabel}>To Chapter</Text>
                      <View style={styles.counterRow}>
                        <TouchableOpacity
                          style={styles.counterBtn}
                          onPress={() => setEndChapter(Math.max(1, endChapter - 1))}
                        >
                          <Text style={styles.counterBtnTxt}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.counterVal}>{endChapter}</Text>
                        <TouchableOpacity
                          style={styles.counterBtn}
                          onPress={() => setEndChapter(Math.min(maxChapters, endChapter + 1))}
                        >
                          <Text style={styles.counterBtnTxt}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Tap Chapter to Set Range / Quick Select:</Text>
                  <View style={styles.chipsGrid}>
                    {Array.from({ length: maxChapters }, (_, i) => i + 1).map(ch => {
                      const minCh = Math.min(startChapter, endChapter);
                      const maxCh = Math.max(startChapter, endChapter);
                      const inRange = ch >= minCh && ch <= maxCh;
                      const isEdge = ch === minCh || ch === maxCh;

                      return (
                        <TouchableOpacity
                          key={ch}
                          style={[
                            styles.chipBtn,
                            inRange && styles.chipBtnActive,
                            isEdge && styles.chipBtnEdge,
                          ]}
                          onPress={() => {
                            if (ch > startChapter) {
                              setEndChapter(ch);
                            } else if (ch < startChapter) {
                              setStartChapter(ch);
                            } else {
                              setStartChapter(ch);
                              setEndChapter(ch);
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.chipBtnTxt,
                              inRange && styles.chipBtnTxtActive,
                              isEdge && { fontWeight: '900' },
                            ]}
                          >
                            {ch}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={() => {
                      if (mode === 'scope') {
                        handleConfirmScope(false);
                      } else {
                        handleConfirmMultiChapterReference(false);
                      }
                    }}
                    activeOpacity={0.88}
                  >
                    <Check size={18} color="#fff" />
                    <Text style={styles.confirmBtnTxt}>
                      Confirm: {currentBook.nameEn} (Ch {Math.min(startChapter, endChapter)} - {Math.max(startChapter, endChapter)})
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              ) : (
                /* Single Chapter Mode */
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                  <Text style={styles.sectionTitle}>Tap a Chapter to Select:</Text>
                  <View style={styles.chipsGrid}>
                    {Array.from({ length: maxChapters }, (_, i) => i + 1).map(ch => (
                      <TouchableOpacity
                        key={ch}
                        style={[
                          styles.chapterGridBtn,
                          selectedChapter === ch && styles.chapterGridBtnActive,
                        ]}
                        onPress={() => setSelectedChapter(ch)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.chapterGridBtnTxt,
                            selectedChapter === ch && styles.chapterGridBtnTxtActive,
                          ]}
                        >
                          {ch}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Actions for Selected Chapter */}
                  <View style={styles.singleChapterActionsBox}>
                    <Text style={styles.singleChapterSelectedTxt}>
                      Selected Chapter: <Text style={{ fontWeight: '800', color: '#1a2d5a' }}>{currentBook.nameEn} {selectedChapter}</Text>
                    </Text>

                    <TouchableOpacity
                      style={styles.nextToVerseBtn}
                      onPress={() => handleSelectChapterForReference(selectedChapter)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.nextToVerseBtnTxt}>Next: Select Specific Verse →</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.confirmChapterOnlyBtn}
                      onPress={() => handleConfirmSingleChapterOnly(selectedChapter)}
                      activeOpacity={0.85}
                    >
                      <Check size={16} color="#059669" />
                      <Text style={styles.confirmChapterOnlyBtnTxt}>
                        Confirm Chapter Only: {currentBook.nameEn} {selectedChapter}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              )}
            </View>
          )}

          {/* ──────────────── STEP 3: VERSE SELECTION ──────────────── */}
          {step === 3 && currentBook && mode === 'reference' && (
            <View style={{ flex: 1 }}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                {/* Custom Verse / Range input */}
                <View style={styles.customVerseBox}>
                  <Hash size={16} color="#7c3aed" />
                  <TextInput
                    style={styles.customVerseInput}
                    placeholder="Type custom verse e.g. 16 or 16-17"
                    placeholderTextColor="#94a3b8"
                    value={customVerse}
                    onChangeText={setCustomVerse}
                    keyboardType="numbers-and-punctuation"
                  />
                  {customVerse.trim().length > 0 && (
                    <TouchableOpacity
                      style={styles.customVerseApplyBtn}
                      onPress={() => handleSelectVerse(customVerse.trim())}
                    >
                      <Text style={styles.customVerseApplyBtnTxt}>Apply</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Quick Whole Chapter Option */}
                <TouchableOpacity
                  style={styles.quickAllBtn}
                  onPress={() => handleSelectVerse('')}
                  activeOpacity={0.8}
                >
                  <Check size={16} color="#059669" />
                  <Text style={styles.quickAllBtnTxt}>
                    Reference Entire Chapter ({currentBook.nameEn} {selectedChapter})
                  </Text>
                </TouchableOpacity>

                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Or Tap a Verse Number (1 to 50):</Text>
                <View style={styles.chipsGrid}>
                  {Array.from({ length: 50 }, (_, i) => i + 1).map(v => (
                    <TouchableOpacity
                      key={v}
                      style={styles.chapterGridBtn}
                      onPress={() => handleSelectVerse(v)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.chapterGridBtnTxt}>{v}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '84%',
    maxHeight: 700,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerBtn: {
    padding: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    padding: 0,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#1e293b',
  },
  tabBtnTxt: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  tabBtnTxtActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 12,
  },
  bookItemActive: {
    borderColor: '#7c3aed',
    backgroundColor: '#f5f3ff',
  },
  bookIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bookNameEn: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  bookNameTe: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  chaptersBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chaptersBadgeTxt: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 10,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chapterGridBtn: {
    width: '17.5%',
    aspectRatio: 1.2,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterGridBtnActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  chapterGridBtnTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  chapterGridBtnTxtActive: {
    color: '#ffffff',
  },
  chipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipBtnActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  chipBtnTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  chipBtnTxtActive: {
    color: '#ffffff',
  },
  quickAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  quickAllBtnTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065f46',
  },
  rangeSelectorRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  rangeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  counterBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
  },
  counterBtnTxt: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
  },
  counterVal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  confirmBtnTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  customVerseBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
    marginBottom: 10,
    gap: 8,
  },
  customVerseInput: {
    flex: 1,
    fontSize: 13,
    color: '#1e293b',
    padding: 0,
  },
  customVerseApplyBtn: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  customVerseApplyBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  chapterModeTabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
    marginTop: 6,
  },
  chapterModeTabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterModeTabBtnActive: {
    backgroundColor: '#1a2d5a',
    shadowColor: '#1a2d5a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  chapterModeTabBtnTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  chapterModeTabBtnTxtActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  chipBtnEdge: {
    borderColor: '#1a2d5a',
    borderWidth: 2,
    backgroundColor: '#1a2d5a',
  },
  singleChapterActionsBox: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  singleChapterSelectedTxt: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 4,
  },
  nextToVerseBtn: {
    backgroundColor: '#1a2d5a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  nextToVerseBtnTxt: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  confirmChapterOnlyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6,
  },
  confirmChapterOnlyBtnTxt: {
    color: '#065f46',
    fontSize: 13,
    fontWeight: '700',
  },
});
