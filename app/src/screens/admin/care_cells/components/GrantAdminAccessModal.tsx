import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Shield, Check, User, Users } from 'lucide-react-native';
import CareCellService from '../../../../services/CareCellService';
import { CareCell } from '../../../../types/CareCellTypes';
import { useAdminTheme, createAdminThemedStyles } from '../../../../utils/adminThemeHelper';

interface GrantAdminAccessModalProps {
  visible: boolean;
  cell: CareCell | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function GrantAdminAccessModal({
  visible,
  cell,
  onClose,
  onSaved,
}: GrantAdminAccessModalProps) {
  const { isDark, primaryText, secondaryText } = useAdminTheme();
  const primaryBtnBg = isDark ? '#FFFFFF' : '#0F172A';
  const primaryBtnText = isDark ? '#000000' : '#FFFFFF';
  const secondaryBtnBg = isDark ? '#27272A' : '#F8FAFC';
  const secondaryBtnBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1';
  const secondaryBtnText = isDark ? '#E4E4E7' : '#334155';

  const [admins, setAdmins] = useState<{ id: string; name: string; phone?: string; userType: string }[]>([]);
  const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && cell) {
      loadAdmins();
      setSelectedUids(new Set(cell.assignedAdminIds || []));
    }
  }, [visible, cell]);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const churchId = await CareCellService.getChurchId();
      const list = await CareCellService.getChurchAdmins(churchId);
      setAdmins(list);
    } catch (e) {
      console.error('Error fetching admins:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdmin = (uid: string) => {
    setSelectedUids((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        next.add(uid);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!cell) return;
    setSaving(true);
    try {
      const churchId = await CareCellService.getChurchId();
      const idsArray = Array.from(selectedUids);
      await CareCellService.grantAdminAccess(churchId, cell.id, idsArray);
      Alert.alert(
        'Access Updated',
        `Successfully granted Care Cell access to ${idsArray.length} administrator(s). They will now see this cell in their Admin Dashboard.`
      );
      onSaved();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update Care Cell admin access.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Shield size={20} color={primaryText} />
              </View>
              <View>
                <Text style={styles.title}>Grant Admin Access</Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {cell?.cellCode} • {cell?.name}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={secondaryText} />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.instructionBanner}>
            <Users size={16} color={primaryText} style={{ marginRight: 8, marginTop: 2 }} />
            <Text style={styles.instructionText}>
              Select church administrators who should have access to manage this Care Cell in their Admin Dashboard.
            </Text>
          </View>

          {/* Admins List */}
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={primaryText} />
              <Text style={styles.loadingTxt}>Loading church administrators...</Text>
            </View>
          ) : admins.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTxt}>No other registered church administrators found.</Text>
            </View>
          ) : (
            <FlatList
              data={admins}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingVertical: 8 }}
              renderItem={({ item }) => {
                const isSelected = selectedUids.has(item.id);
                return (
                  <TouchableOpacity
                    style={[styles.adminRow, isSelected && styles.adminRowSelected]}
                    onPress={() => toggleAdmin(item.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.adminAvatar}>
                      <User size={18} color={isSelected ? primaryText : secondaryText} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.adminName, isSelected && { color: primaryText, fontWeight: '700' }]}>
                        {item.name}
                      </Text>
                      <Text style={styles.adminMeta}>
                        {item.userType || 'Admin'} {item.phone ? `• ${item.phone}` : ''}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.checkbox,
                        isSelected && { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg },
                      ]}
                    >
                      {isSelected && <Check size={14} color={primaryBtnText} strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.cancelBtn, { backgroundColor: secondaryBtnBg, borderWidth: 1, borderColor: secondaryBtnBorder }]}
            >
              <Text style={[styles.cancelBtnTxt, { color: secondaryBtnText }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: primaryBtnBg }, saving && { opacity: 0.7 }]}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={primaryBtnText} />
              ) : (
                <Text style={[styles.saveBtnTxt, { color: primaryBtnText }]}>
                  Save Permissions ({selectedUids.size})
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = createAdminThemedStyles({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
  },
  instructionBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 6,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  instructionText: {
    flex: 1,
    fontSize: 12.5,
    color: '#0369A1',
    lineHeight: 18,
  },
  loadingWrap: {
    padding: 40,
    alignItems: 'center',
  },
  loadingTxt: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 10,
  },
  emptyWrap: {
    padding: 30,
    alignItems: 'center',
  },
  emptyTxt: {
    fontSize: 13,
    color: '#94A3B8',
  },
  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  adminRowSelected: {
    backgroundColor: '#F8FAFC',
  },
  adminAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminName: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#1E293B',
  },
  adminNameSelected: {
    color: '#1E3A8A',
    fontWeight: '700',
  },
  adminMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelBtnTxt: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#475569',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
  },
  saveBtnTxt: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

