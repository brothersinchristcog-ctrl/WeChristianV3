import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, radius, typography, shadow } from '../app/src/theme/Theme';
import FirestoreService from '../app/src/services/FirestoreService';
import { useAuth } from '../app/src/context/AuthContext';
import { CustomAlert, AlertButton } from '../app/src/components/CustomAlert';
import { checkScheduleConflicts } from '../app/src/utils/schedule';

export const CreatePastorEvent = ({ route, navigation }: { route: any; navigation: any }) => {
  const { member } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fallbackContactId, setFallbackContactId] = useState<string | null>(null);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    buttons?: AlertButton[];
  }>({ visible: false, title: '', message: '', type: 'info' });

  const closeAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Form State
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('');
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    return d;
  });
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  // UI state for Pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Wizard state
  const [step, setStep] = useState(1);

  // Derived state
  const durationMinsNum = Math.max(0, (endTime.getTime() - startTime.getTime()) / 60000);
  const durationHoursDerived = durationMinsNum > 0 ? (durationMinsNum / 60).toFixed(1).replace(/\.0$/, '') : '0';

  const editEvent = route?.params?.editEvent;

  useEffect(() => {
    if (editEvent) {
      setTitle(editEvent.title || '');
      setEventType(editEvent.type === 'worship' ? '' : editEvent.type);
      
      if (editEvent.date) setDate(new Date(editEvent.date));
      
      if (editEvent.startTime) {
        const timeDate = new Date();
        const [time, modifier] = editEvent.startTime.split(' ');
        if (time && modifier) {
          let [hours, minutes] = time.split(':');
          let h = parseInt(hours, 10);
          if (h === 12) h = 0;
          if (modifier.toUpperCase() === 'PM') h += 12;
          timeDate.setHours(h, parseInt(minutes || '0', 10), 0, 0);
          setStartTime(timeDate);
          
          if (editEvent.durationMins) {
            setEndTime(new Date(timeDate.getTime() + editEvent.durationMins * 60000));
          } else {
            setEndTime(new Date(timeDate.getTime() + 60 * 60000));
          }
        }
      }
      
      setVenue(editEvent.venue || '');
      setCity(editEvent.city || '');
      
      let addr = editEvent.address || '';
      if (editEvent.venue && addr.startsWith(`${editEvent.venue} — `)) {
        addr = addr.substring(editEvent.venue.length + 3);
      }
      setAddress(addr);
      setDescription(editEvent.description || '');
    }
  }, [editEvent]);

  useEffect(() => {
    // If not authenticated or member profile is missing, search Firestore for an admin contact
    if (!member?.id) {
      const loadFallbackContact = async () => {
        try {
          const admins = await FirestoreService.getAdminMembers();
          if (admins && admins.length > 0) {
            setFallbackContactId(admins[0].Id);
          }
        } catch (e) {
          console.warn('Failed to load fallback admin contact', e);
        }
      };
      loadFallbackContact();
    }
  }, [member]);

  const handleNext = () => {
    setErrors({});
    let newErrors: { [key: string]: string } = {};

    if (step === 1) {
      if (!title.trim()) newErrors.title = 'Please enter an event title.';
      if (endTime <= startTime) newErrors.time = 'End Time must be greater than Start Time.';
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!venue.trim()) newErrors.venue = 'Please enter a venue name.';
      if (!city.trim()) newErrors.city = 'Please enter a Town / Village.';
      if (!address.trim()) newErrors.address = 'Please enter a full address for maps integration.';
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setStep(3);
    }
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSave = async () => {
    setErrors({});
    let newErrors: { [key: string]: string } = {};

    if (!title.trim()) newErrors.title = 'Please enter an event title.';
    if (!venue.trim()) newErrors.venue = 'Please enter a venue name.';
    if (!city.trim()) newErrors.city = 'Please enter a Town / Village.';
    if (!address.trim()) newErrors.address = 'Please enter a full address for maps integration.';
    if (endTime <= startTime) newErrors.time = 'End Time must be greater than Start Time.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Determine which step has errors to navigate back to it
      if (newErrors.title || newErrors.time) setStep(1);
      else if (newErrors.venue || newErrors.city || newErrors.address) setStep(2);
      return;
    }

    const targetContactId = member?.id || fallbackContactId;
    if (!targetContactId) {
      setAlertConfig({ visible: true, title: 'Database Error', message: 'Could not locate an Admin Contact record to link this event to. Please check your internet connection.', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      // Calculate start and end date times
      const startDateTime = new Date(date);
      startDateTime.setHours(startTime.getHours());
      startDateTime.setMinutes(startTime.getMinutes());
      startDateTime.setSeconds(0);
      startDateTime.setMilliseconds(0);

      const endDateTime = new Date(startDateTime.getTime() + durationMinsNum * 60 * 1000);

      // Build full address with PIN code for geocoding
      const fullLocation = [venue.trim(), city.trim(), address.trim()]
        .filter(Boolean)
        .join(' — ');

      // Construct Firestore Event payload — using app standard fields
      const payload: any = {
        title: title,
        date: startDateTime.toISOString().split('T')[0],
        startTime: startDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        endTime: endDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        venue: venue.trim(),
        city: city.trim(),
        address: address.trim(),
        description: description.trim(),
        notes: notes.trim(),
        lat: null, // Will be updated by geocoder logic if applicable
        lng: null
      };

      if (targetContactId) {
         payload.targetContactId = targetContactId;
      }

      const executeSave = async () => {
        try {
          if (editEvent) {
            await FirestoreService.updatePastorEvent(editEvent.id, payload);
            setAlertConfig({
              visible: true,
              title: 'Success',
              message: 'Pastor event updated successfully!',
              type: 'success',
              buttons: [{ text: 'OK', onPress: () => { closeAlert(); navigation.navigate('Dashboard'); } }]
            });
          } else {
            await FirestoreService.createPastorEvent(payload);
            setAlertConfig({
              visible: true,
              title: 'Success',
              message: 'Pastor event created successfully!',
              type: 'success',
              buttons: [{ text: 'OK', onPress: () => { closeAlert(); navigation.navigate('Dashboard'); } }]
            });
          }
        } catch (e: any) {
          const msg = e?.message || 'An unexpected error occurred.';
          console.error('❌ [CreatePastorEvent] Save failed:', msg);
          setAlertConfig({ visible: true, title: 'Save Failed', message: msg, type: 'error' });
        } finally {
          setLoading(false);
        }
      };

      // --- Schedule Overlap Conflict Detection ---
      try {
        const conflicts = await checkScheduleConflicts(
          startDateTime.toISOString(),
          startDateTime.getTime(),
          durationMinsNum,
          editEvent?.id
        );
        
        if (conflicts && conflicts.length > 0) {
          setAlertConfig({
            visible: true,
            title: 'Schedule Conflict',
            message: `You already have another event scheduled at this exact same time:\n\n${conflicts.join('\n')}\n\nAre you sure you want to double-book?`,
            type: 'warning',
            buttons: [
              { text: 'Cancel', style: 'cancel', onPress: () => { setLoading(false); closeAlert(); } },
              { text: 'Proceed Anyway', onPress: () => { closeAlert(); executeSave(); } }
            ]
          });
          return; // Pause here!
        }
      } catch (err) {
        console.warn('Overlap check failed', err);
      }

      // --- Travel Time Detection Logic ---
      try {
        const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || '';
        if (GOOGLE_KEY) {
          const existingEvents = await FirestoreService.getPastorEvents();
          
          // Helper to parse the 12-hour AM/PM string into a comparable Date
          const parseTime = (timeStr: string, dateObj: Date) => {
            const [time, modifier] = timeStr.split(' ');
            let [hours, minutes] = time.split(':');
            let h = parseInt(hours, 10);
            if (h === 12) h = 0;
            if (modifier === 'PM') h += 12;
            const d = new Date(dateObj);
            d.setHours(h, parseInt(minutes, 10), 0, 0);
            return d;
          };

          const targetDateStr = startDateTime.toISOString().split('T')[0];
          
          const sameDayEvents = existingEvents
            .filter((e: any) => e.date === targetDateStr && e.id !== editEvent?.id)
            .sort((a: any, b: any) => parseTime(a.startTime, startDateTime).getTime() - parseTime(b.startTime, startDateTime).getTime());

          const newEventStartMs = startDateTime.getTime();
          
          // Find the event that happens immediately BEFORE this new event
          const prevEvents = sameDayEvents.filter(e => parseTime(e.startTime, startDateTime).getTime() < newEventStartMs);
          
          if (prevEvents.length > 0) {
            const prevEvent = prevEvents[prevEvents.length - 1];

            // Get lat/lng of the NEW event
            const combinedAddress = [address.trim(), city.trim()].filter(Boolean).join(', ');
            const geoResp = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(combinedAddress)}&key=${GOOGLE_KEY}`);
            const geoData = await geoResp.json();
            
            if (geoData.status === 'OK' && geoData.results.length > 0) {
              const newLat = geoData.results[0].geometry.location.lat;
              const newLng = geoData.results[0].geometry.location.lng;

              if (newLat && newLng && prevEvent.lat && prevEvent.lng) {
                const origins = `${prevEvent.lat},${prevEvent.lng}`;
                const destinations = `${newLat},${newLng}`;
                const distResp = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&key=${GOOGLE_KEY}`);
                const distData = await distResp.json();

                if (distData.status === 'OK' && distData.rows[0].elements[0].status === 'OK') {
                  const travelTimeSeconds = distData.rows[0].elements[0].duration.value;
                  const travelTimeMins = Math.round(travelTimeSeconds / 60);
                  
                  const prevStartTimeMs = parseTime(prevEvent.startTime, startDateTime).getTime();
                  const prevEndTimeMs = prevStartTimeMs + (prevEvent.durationMins * 60000);
                  
                  const requiredArrivalTimeMs = prevEndTimeMs + (travelTimeMins * 60000);
                  
                  if (requiredArrivalTimeMs > newEventStartMs) {
                    setAlertConfig({
                      visible: true,
                      title: 'Schedule Conflict',
                      message: `Insufficient travel time between your previous stop (${prevEvent.title}) and this new location.\n\nEstimated travel time is ${travelTimeMins >= 60 ? `${Math.round(travelTimeMins / 60 * 10) / 10} hours` : `${travelTimeMins} minutes`}.`,
                      type: 'warning',
                      buttons: [
                        { text: 'Cancel', style: 'cancel', onPress: () => { setLoading(false); closeAlert(); } },
                        { text: 'Proceed Anyway', onPress: () => { closeAlert(); executeSave(); } }
                      ]
                    });
                    return; // Pause here!
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('Conflict detection failed, proceeding with save.', err);
      }

      await executeSave();

    } catch (e: any) {
      const msg = e?.message || 'An unexpected error occurred.';
      console.error('❌ [CreatePastorEvent] Pre-save failed:', msg);
      setAlertConfig({ visible: true, title: 'Save Failed', message: msg, type: 'error' });
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgPrimary} />
      
      <CustomAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={closeAlert}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editEvent ? 'Edit Pastor Event' : 'Create Pastor Event'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Step Indicator */}
      <View style={styles.stepContainer}>
        {[1, 2, 3].map((s, idx) => (
          <React.Fragment key={s}>
            <View style={[styles.stepCircle, step >= s ? styles.stepCircleActive : null]}>
              <Text style={[styles.stepText, step >= s ? styles.stepTextActive : null]}>{s}</Text>
            </View>
            {s < 3 && (
              <View style={[styles.stepLine, step > s ? styles.stepLineActive : null]} />
            )}
          </React.Fragment>
        ))}
      </View>
      <View style={styles.stepLabels}>
        <Text style={[styles.stepLabelText, step >= 1 && styles.stepLabelTextActive]}>Event Info</Text>
        <Text style={[styles.stepLabelText, step >= 2 && styles.stepLabelTextActive, { textAlign: 'center' }]}>Destination</Text>
        <Text style={[styles.stepLabelText, step >= 3 && styles.stepLabelTextActive, { textAlign: 'right' }]}>Notes</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Event Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Event Title *</Text>
              <TextInput
                style={[styles.input, errors.title && { borderColor: '#ef4444', borderWidth: 1 }]}
                placeholderTextColor={colors.textTertiary}
                placeholder="e.g. Sunday Service & Prayer"
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  if (errors.title) setErrors({ ...errors, title: '' });
                }}
              />
              {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Event Type</Text>
              <TextInput
                style={styles.input}
                placeholderTextColor={colors.textTertiary}
                placeholder="e.g. Worship Service, Prayer Meeting"
                value={eventType}
                onChangeText={setEventType}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date *</Text>
              <TouchableOpacity style={styles.dropdown} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dropdownText}>
                  {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
                <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setDate(selectedDate);
                  }}
                />
              )}
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Start Time *</Text>
                <TouchableOpacity style={styles.dropdown} onPress={() => setShowTimePicker(true)}>
                  <Text style={styles.dropdownText}>
                    {startTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </Text>
                  <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    value={startTime}
                    mode="time"
                    display="default"
                    is24Hour={false}
                    onChange={(event, selectedTime) => {
                      setShowTimePicker(false);
                      if (selectedTime) setStartTime(selectedTime);
                    }}
                  />
                )}
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.md }]}>
                <Text style={styles.label}>End Time *</Text>
                <TouchableOpacity 
                  style={[styles.dropdown, errors.time && { borderColor: '#ef4444', borderWidth: 1 }]} 
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <Text style={styles.dropdownText}>
                    {endTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </Text>
                  <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                {showEndTimePicker && (
                  <DateTimePicker
                    value={endTime}
                    mode="time"
                    display="default"
                    is24Hour={false}
                    onChange={(event, selectedTime) => {
                      setShowEndTimePicker(false);
                      if (selectedTime) {
                        setEndTime(selectedTime);
                        if (errors.time) setErrors({ ...errors, time: '' });
                      }
                    }}
                  />
                )}
              </View>
            </View>
            {errors.time && <Text style={[styles.errorText, { marginTop: -8, marginBottom: 12 }]}>{errors.time}</Text>}

            <View style={[styles.inputGroup, { marginTop: spacing.md }]}>
              <Text style={styles.label}>Meeting Length (Calculated)</Text>
              <View style={[styles.input, { backgroundColor: colors.bgSecondary, justifyContent: 'center' }]}>
                <Text style={{ color: colors.textPrimary }}>
                  {durationHoursDerived} Hour{parseFloat(durationHoursDerived) !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Destination</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Venue Name *</Text>
              <TextInput
                style={[styles.input, errors.venue && { borderColor: '#ef4444', borderWidth: 1 }]}
                placeholderTextColor={colors.textTertiary}
                placeholder="e.g. Calvary Temple"
                value={venue}
                onChangeText={(text) => {
                  setVenue(text);
                  if (errors.venue) setErrors({ ...errors, venue: '' });
                }}
              />
              {errors.venue && <Text style={styles.errorText}>{errors.venue}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Town / Village * (For Live Tracker Landmark)</Text>
              <TextInput
                style={[styles.input, errors.city && { borderColor: '#ef4444', borderWidth: 1 }]}
                placeholderTextColor={colors.textTertiary}
                placeholder="e.g. Guntur"
                value={city}
                onChangeText={(text) => {
                  setCity(text);
                  if (errors.city) setErrors({ ...errors, city: '' });
                }}
              />
              {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Address * (Used for Maps Routing)</Text>
              <TextInput
                style={[styles.input, styles.textArea, errors.address && { borderColor: '#ef4444', borderWidth: 1 }]}
                placeholderTextColor={colors.textTertiary}
                placeholder="e.g. Ring Road, Arundelpet, Guntur, AP, 522002"
                multiline
                numberOfLines={3}
                value={address}
                onChangeText={(text) => {
                  setAddress(text);
                  if (errors.address) setErrors({ ...errors, address: '' });
                }}
              />
              {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Additional Context</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
                placeholderTextColor={colors.textTertiary}
                placeholder="What is this itinerary appointment for?"
                multiline
                numberOfLines={6}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Special Notes</Text>
              <TextInput
                style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
                placeholderTextColor={colors.textTertiary}
                placeholder="Any items to bring, contacts to meet, or preparations to make?"
                multiline
                numberOfLines={6}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </View>
        )}

        {/* Navigation Buttons */}
        <View style={styles.navigationRow}>
          {step > 1 && (
            <TouchableOpacity style={styles.prevButton} onPress={handlePrev} disabled={loading}>
              <Text style={styles.prevButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          {step < 3 ? (
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.saveButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled, { flex: 1, marginTop: 0, marginBottom: 0 }]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                  <Text style={styles.saveButtonText}>{editEvent ? 'Update Event' : 'Create Event'}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgSecondary
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    height: 56,
    backgroundColor: colors.bgPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  backButton: {
    padding: spacing.xs
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center'
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md
  },
  card: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card
  },
  cardTitle: {
    ...typography.h3,
    color: colors.primaryDark,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgTertiary,
    paddingBottom: spacing.xs
  },
  inputGroup: {
    marginBottom: spacing.md
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.bgSecondary
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  row: {
    flexDirection: 'row'
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    backgroundColor: colors.bgSecondary
  },
  dropdownText: {
    fontSize: 14,
    color: colors.textPrimary
  },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
    backgroundColor: colors.bgPrimary,
    ...shadow.card
  },
  dropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgTertiary
  },
  dropdownItemActive: {
    backgroundColor: colors.primaryLight
  },
  dropdownItemText: {
    fontSize: 14,
    color: colors.textPrimary
  },
  dropdownItemTextActive: {
    color: colors.primary,
    fontWeight: '600'
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    gap: 8,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    ...shadow.card
  },
  saveButtonDisabled: {
    backgroundColor: colors.textTertiary
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700'
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.bgSecondary,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  stepText: {
    color: colors.textSecondary,
    fontWeight: 'bold',
    fontSize: 14
  },
  stepTextActive: {
    color: '#FFF'
  },
  stepLine: {
    width: 50,
    height: 3,
    backgroundColor: colors.border,
    marginHorizontal: 8
  },
  stepLineActive: {
    backgroundColor: colors.primary
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bgSecondary,
  },
  stepLabelText: {
    fontSize: 12,
    color: colors.textSecondary,
    width: 80,
    textAlign: 'left'
  },
  stepLabelTextActive: {
    color: colors.primary,
    fontWeight: 'bold'
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    gap: spacing.md
  },
  prevButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  prevButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600'
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadow.card
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4
  }
});

export default CreatePastorEvent;
