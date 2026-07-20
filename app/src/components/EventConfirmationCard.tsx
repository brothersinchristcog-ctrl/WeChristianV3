import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, radius, spacing, typography, shadow } from '../theme/Theme';
import { EventDraft } from '../services/groqApi';
import Ionicons from '@expo/vector-icons/Ionicons';
import dayjs from 'dayjs';

interface Props {
  draft: EventDraft;
  onConfirm: () => void;
  onEdit: () => void;
  isSaving?: boolean;
  conflictWarning?: string | null;
}

export default function EventConfirmationCard({ draft, onConfirm, onEdit, isSaving, conflictWarning }: Props) {
  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    return dayjs(isoString).format('h:mm A');
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    return dayjs(isoString).format('dddd, MMMM D');
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="checkmark-circle" size={24} color={colors.success} />
        <Text style={styles.title}>Please Confirm Details</Text>
      </View>

      {conflictWarning && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={18} color="#991b1b" />
          <Text style={styles.warningText}>{conflictWarning}</Text>
        </View>
      )}

      <ScrollView style={styles.detailsContainer}>
        <Text style={styles.eventTitle}>{draft.title}</Text>
        
        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          <Text style={styles.text}>{formatDate(draft.startDateTime)}</Text>
        </View>

        <View style={styles.row}>
          <Ionicons name="time-outline" size={18} color={colors.primary} />
          <Text style={styles.text}>
            {formatTime(draft.startDateTime)} – {formatTime(draft.endDateTime)}
          </Text>
        </View>

        <View style={styles.row}>
          <Ionicons name="location-outline" size={18} color={colors.primary} />
          <View>
            <Text style={styles.text}>{draft.venueName}</Text>
            {draft.address && <Text style={styles.subtext}>{draft.address}</Text>}
            {draft.city && <Text style={styles.subtext}>{draft.city}</Text>}
          </View>
        </View>

        {draft.notes && (
          <View style={[styles.row, { alignItems: 'flex-start', marginTop: spacing.md }]}>
            <Ionicons name="document-text-outline" size={18} color={colors.primary} />
            <Text style={[styles.text, { flex: 1, fontStyle: 'italic' }]}>{draft.notes}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.editButton} onPress={onEdit} disabled={isSaving}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.saveButton} onPress={onConfirm} disabled={isSaving}>
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Event'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.md,
    padding: spacing.lg,
    ...shadow.card,
    maxHeight: '80%'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
    marginBottom: spacing.md
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    marginLeft: spacing.sm
  },
  warningBanner: {
    backgroundColor: '#fef2f2',
    borderColor: '#f87171',
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  warningText: {
    color: '#991b1b',
    fontSize: 13,
    fontWeight: '600',
    flex: 1
  },
  detailsContainer: {
    marginBottom: spacing.lg
  },
  eventTitle: {
    ...typography.h2,
    color: colors.primaryDark,
    marginBottom: spacing.md
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm
  },
  text: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500'
  },
  subtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md
  },
  editButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border
  },
  editButtonText: {
    color: colors.textSecondary,
    fontWeight: '600'
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.full,
    ...shadow.card
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600'
  }
});
