import firestore from '@react-native-firebase/firestore';
import FirestoreService from './FirestoreService';

export interface AttendanceRecord {
  id?: string;
  memberId?: string;
  memberName?: string;
  memberPhone?: string;
  photoUrl?: string;
  status?: 'Present' | 'Absent';
  timestamp?: any;
  method?: 'QR_SCAN' | 'ADMIN_MANUAL' | 'SELF_CHECKIN';
  churchId?: string;
  eventId?: string;
  eventName?: string;
  scannedAt?: string;
}

export interface AttendanceQRPayload {
  action: 'WeChristian_Attendance' | 'ChurchOfGod_Attendance' | string;
  churchId: string;
  churchName: string;
  churchCode?: string;
  eventId?: string;
  eventName?: string;
  timestamp?: number;
  type?: string;
  version?: string;
  memberId?: string;
  memberName?: string;
  memberPhone?: string;
  accountId?: string;
}

class AttendanceService {
  /**
   * Generates a verifiable multi-church QR payload string.
   * Every church gets its own unique churchId encoded in the QR.
   */
  public generateAttendanceQRPayload(
    churchId: string,
    churchName: string,
    churchCode?: string,
    eventId?: string,
    eventName?: string
  ): string {
    const payload: AttendanceQRPayload = {
      action: 'WeChristian_Attendance',
      churchId: churchId || '',
      churchName: churchName || 'Church',
      churchCode: churchCode || '',
      eventId: eventId || 'general_service',
      eventName: eventName || 'General Service',
      timestamp: Date.now(),
      type: 'attendance_checkin',
      version: '2.0',
    };
    return JSON.stringify(payload);
  }

  /**
   * Safely parses and validates a scanned QR payload.
   * Backwards-compatible: if the legacy single-church QR is scanned,
   * it falls back to the active/default church gracefully.
   */
  public parseAttendanceQRPayload(
    rawString: string,
    currentChurchId?: string,
    currentChurchName?: string,
    currentChurchCode?: string,
    expectedEventId?: string,
    expectedEventName?: string
  ): { valid: boolean; payload?: AttendanceQRPayload; isLegacy?: boolean; isChurchQR?: boolean; error?: string } {
    if (!rawString || typeof rawString !== 'string') {
      return { valid: false, error: 'Empty or invalid QR code.' };
    }

    const trimmed = rawString.trim();

    try {
      const data = JSON.parse(trimmed);

      // Strict Rule 1: Must be an official Church Attendance payload or Member payload
      const isOfficialAction = data && typeof data === 'object' && (
        data.action === 'WeChristian_Attendance' ||
        data.action === 'ChurchOfGod_Attendance' ||
        data.action === 'WeChristian_Member' ||
        data.action === 'Member_Checkin' ||
        Boolean(data.memberId)
      );

      if (!isOfficialAction) {
        return {
          valid: false,
          error: `Please scan the official ${currentChurchName || 'Church of God'} attendance QR code.`,
        };
      }

      const qrChurchId = String(data.churchId || data.church_id || '').trim();
      const qrChurchCode = String(data.churchCode || data.church_code || '').trim();

      // Strict Rule 2: QR code MUST specify church identification (or member check-in)
      if (!qrChurchId && !qrChurchCode && !data.memberId) {
        return {
          valid: false,
          error: 'Invalid QR code: Missing church identification.',
        };
      }

      // Strict Rule 3: QR MUST belong to the current church
      if (currentChurchId) {
        const churchIdMatches = qrChurchId && qrChurchId.toLowerCase() === currentChurchId.toLowerCase();
        const churchCodeMatches = currentChurchCode && qrChurchCode && qrChurchCode.toLowerCase() === currentChurchCode.toLowerCase();

        if (!churchIdMatches && !churchCodeMatches) {
          return {
            valid: false,
            error: `This QR code does not belong to ${currentChurchName || 'your church'}.`,
          };
        }
      }

      const qrEventId = String(data.eventId || data.event_id || data.id || '').trim();
      const qrEventName = String(data.eventName || data.event_name || data.title || data.name || '').trim();

      // Classify QR type:
      // Church QR = generic/no specific event → marks attendance for the active event
      // Event QR  = specific eventId encoded  → must match the specific event being scanned for
      const GENERIC_EVENT_IDS = ['general_service', 'church_qr', 'general', ''];
      const isChurchQR =
        GENERIC_EVENT_IDS.includes(qrEventId.toLowerCase()) ||
        qrEventName.toLowerCase() === 'general church attendance' ||
        qrEventName.toLowerCase() === 'general service' ||
        qrEventName.toLowerCase() === 'church service';

      // Rule 4 (Event QR only): If the scanned QR has a SPECIFIC event encoded and the member is
      // checking in for a DIFFERENT specific event, reject it.
      // A Church QR (generic eventId) is ALWAYS accepted for the correct church — it will be
      // attributed to the active/selected event on the member's side.
      if (!isChurchQR && expectedEventId) {
        const cleanExpectedId = expectedEventId.trim().toLowerCase();
        const cleanQrId = qrEventId.trim().toLowerCase();
        const cleanExpectedName = (expectedEventName || '').trim().toLowerCase();
        const cleanQrName = qrEventName.trim().toLowerCase();

        const idMatches = cleanQrId && cleanQrId === cleanExpectedId;
        const nameMatches = cleanExpectedName && cleanQrName && (
          cleanQrName === cleanExpectedName ||
          cleanQrName.includes(cleanExpectedName) ||
          cleanExpectedName.includes(cleanQrName)
        );

        if (!idMatches && !nameMatches) {
          return {
            valid: false,
            error: `This QR code is for "${qrEventName || 'another event'}", not for "${expectedEventName || 'the selected event'}". Please scan the correct event QR code.`,
          };
        }
      }

      return {
        valid: true,
        isChurchQR,
        payload: {
          action: data.action || 'WeChristian_Attendance',
          churchId: qrChurchId || currentChurchId || '',
          churchName: data.churchName || data.church_name || currentChurchName || 'Church of God',
          churchCode: qrChurchCode || currentChurchCode || '',
          eventId: qrEventId || expectedEventId || 'general_service',
          eventName: qrEventName || expectedEventName || 'Church Service',
          timestamp: data.timestamp || Date.now(),
          type: data.type || 'attendance_checkin',
          version: data.version || '2.0',
          memberId: data.memberId || data.id || data.sfContactId,
          memberName: data.memberName || data.name || data.Name,
          memberPhone: data.memberPhone || data.phone || data.MobilePhone,
          accountId: data.accountId,
        },
        isLegacy: data.action === 'ChurchOfGod_Attendance',
      };
    } catch {
      // Not JSON, continue to check official URL format
    }

    // Official Deep Link URL format: e.g. https://wechristian.app/attendance?churchId=...
    if (trimmed.startsWith('https://wechristian.app/attendance') || trimmed.startsWith('wechristian://attendance')) {
      try {
        const queryStart = trimmed.indexOf('?');
        if (queryStart !== -1) {
          const qs = trimmed.substring(queryStart + 1);
          const params = new URLSearchParams(qs);
          const qrChurchId = String(params.get('churchId') || params.get('church_id') || '').trim();
          const qrChurchCode = String(params.get('churchCode') || params.get('church_code') || '').trim();
          const qrEventId = String(params.get('eventId') || params.get('event_id') || params.get('id') || '').trim();
          const qrEventName = String(params.get('eventName') || params.get('event_name') || params.get('title') || '').trim();

          if (!qrChurchId && !qrChurchCode) {
            return {
              valid: false,
              error: 'Invalid QR code: Missing church identification.',
            };
          }

          if (currentChurchId) {
            const churchIdMatches = qrChurchId && qrChurchId.toLowerCase() === currentChurchId.toLowerCase();
            const churchCodeMatches = currentChurchCode && qrChurchCode && qrChurchCode.toLowerCase() === currentChurchCode.toLowerCase();
            if (!churchIdMatches && !churchCodeMatches) {
              return {
                valid: false,
                error: `This QR code does not belong to ${currentChurchName || 'your church'}.`,
              };
            }
          }

          const GENERIC_EVENT_IDS_URL = ['general_service', 'church_qr', 'general', ''];
          const isChurchQR_URL =
            GENERIC_EVENT_IDS_URL.includes(qrEventId.toLowerCase()) ||
            qrEventName.toLowerCase() === 'general church attendance' ||
            qrEventName.toLowerCase() === 'general service' ||
            qrEventName.toLowerCase() === 'church service';

          if (!isChurchQR_URL && expectedEventId) {
            const cleanExpectedId = expectedEventId.trim().toLowerCase();
            const cleanQrId = qrEventId.trim().toLowerCase();
            const cleanExpectedName = (expectedEventName || '').trim().toLowerCase();
            const cleanQrName = qrEventName.trim().toLowerCase();

            const idMatches = cleanQrId && cleanQrId === cleanExpectedId;
            const nameMatches = cleanExpectedName && cleanQrName && (
              cleanQrName === cleanExpectedName ||
              cleanQrName.includes(cleanExpectedName) ||
              cleanExpectedName.includes(cleanQrName)
            );

            if (!idMatches && !nameMatches) {
              return {
                valid: false,
                error: `This QR code is for "${qrEventName || 'another event'}", not for "${expectedEventName || 'the selected event'}". Please scan the correct event QR code.`,
              };
            }
          }

          return {
            valid: true,
            isChurchQR: isChurchQR_URL,
            payload: {
              action: 'WeChristian_Attendance',
              churchId: qrChurchId || currentChurchId || '',
              churchName: currentChurchName || 'Church of God',
              churchCode: qrChurchCode || currentChurchCode || '',
              eventId: qrEventId || expectedEventId || 'general_service',
              eventName: qrEventName ? decodeURIComponent(qrEventName) : (expectedEventName || 'Church Service'),
              timestamp: Date.now(),
              version: '2.0',
            },
          };
        }
      } catch {}
    }

    // ALL OTHER CODES (random barcodes, dummy text, other apps' QRs) ARE STRICTLY REJECTED!
    return { 
      valid: false, 
      error: `Please scan the official ${currentChurchName || 'Church of God'} attendance QR code.` 
    };
  }

  /**
   * Fetches attendees strictly for a specific church and event.
   * Completely isolated: Church A's attendees never mix with Church B's.
   */
  public async getEventAttendees(churchId: string, eventId: string): Promise<AttendanceRecord[]> {
    if (!churchId) {
      console.warn('[AttendanceService] getEventAttendees called without churchId');
      return [];
    }

    try {
      const attendeesRef = firestore()
        .collection('churches')
        .doc(churchId)
        .collection('events')
        .doc(eventId)
        .collection('attendees');

      const snap = await attendeesRef.orderBy('timestamp', 'desc').get();
      const records: AttendanceRecord[] = [];

      snap.forEach((doc) => {
        const d = doc.data();
        records.push({
          id: doc.id,
          memberId: d.memberId || doc.id,
          memberName: d.memberName || 'Unknown Member',
          memberPhone: d.memberPhone || '',
          photoUrl: d.photoUrl || '',
          status: (d.status as 'Present' | 'Absent') || 'Present',
          timestamp: d.timestamp,
          method: d.method || 'QR_SCAN',
          churchId,
          eventId,
          eventName: d.eventName || '',
        });
      });

      // Backward compatibility fallback: check attendanceRequests subcollection if empty
      if (records.length === 0) {
        try {
          const reqResponses = await firestore()
            .collection('churches')
            .doc(churchId)
            .collection('attendanceRequests')
            .doc(eventId)
            .collection('responses')
            .get();

          reqResponses.forEach((doc) => {
            const d = doc.data();
            records.push({
              id: doc.id,
              memberId: d.memberId || doc.id,
              memberName: d.memberName || 'Unknown Member',
              memberPhone: d.memberPhone || '',
              status: d.response === 'No' ? 'Absent' : 'Present',
              timestamp: d.respondedAt || d.createdAt || null,
              method: 'SELF_CHECKIN',
              churchId,
              eventId,
            });
          });
        } catch {
          // Silent fallback
        }
      }

      return records;
    } catch (error) {
      console.error('[AttendanceService] Error fetching event attendees:', error);
      return [];
    }
  }

  /**
   * Fetches church roster members for attendance comparison (Present vs Absent).
   */
  public async getChurchMembers(churchId: string): Promise<any[]> {
    if (!churchId) return [];
    try {
      // 1. Try church-specific members collection
      const snap = await firestore()
        .collection('churches')
        .doc(churchId)
        .collection('members')
        .get();

      if (!snap.empty) {
        return snap.docs
          .filter((d) => d.data().status !== 'Left')
          .map((d) => {
            const data = d.data();
            const photo = data.profilePhoto || data.photoURL || data.photoUrl || data.profileImageUrl || data.PhotoUrl || data.avatarUrl || data.photo || data.profilePicture || '';
            return {
              id: d.id,
              Id: d.id,
              name: data.name || data.firstName || 'Member',
              Name: data.name || data.firstName || 'Member',
              phone: data.phone || data.MobilePhone || '',
              MobilePhone: data.phone || data.MobilePhone || '',
              photoURL: photo,
              profilePicture: photo,
              firstName: data.firstName || data.FirstName || '',
              lastName: data.lastName || data.LastName || '',
              ...data,
            };
          });
      }

      // 2. Fallback via FirestoreService
      const all = await FirestoreService.getAllMembers();
      return (all || []).map((m: any) => {
        const photo = m.profilePhoto || m.photoURL || m.photoUrl || m.profileImageUrl || m.PhotoUrl || m.avatarUrl || m.photo || m.profilePicture || '';
        return {
          id: m.id,
          Id: m.id,
          name: m.name || m.firstName || 'Member',
          Name: m.name || m.firstName || 'Member',
          phone: m.phone || m.MobilePhone || '',
          MobilePhone: m.phone || m.MobilePhone || '',
          photoURL: photo,
          profilePicture: photo,
          firstName: m.firstName || m.FirstName || '',
          lastName: m.lastName || m.LastName || '',
          ...m,
        };
      });
    } catch (e) {
      console.error('[AttendanceService] Error fetching church members:', e);
      return [];
    }
  }

  /**
   * Records member check-in under the designated church.
   * Ensures data isolation: saved under churches/{churchId}/...
   */
  public async recordAttendance(params: {
    churchId: string;
    eventId?: string;
    eventName?: string;
    memberId: string;
    memberName: string;
    memberPhone?: string;
    photoUrl?: string;
    method?: 'QR_SCAN' | 'ADMIN_MANUAL' | 'SELF_CHECKIN';
  }): Promise<{ success: boolean; alreadyMarked?: boolean; message?: string }> {
    const { churchId, eventId = 'general_service', eventName = 'General Service', memberId, memberName, memberPhone, photoUrl, method = 'QR_SCAN' } = params;

    if (!churchId || !memberId) {
      return { success: false, message: 'Missing church or member identifier.' };
    }

    try {
      const attendeeDocRef = firestore()
        .collection('churches')
        .doc(churchId)
        .collection('events')
        .doc(eventId)
        .collection('attendees')
        .doc(memberId);

      const existing = await attendeeDocRef.get().catch(() => null);
      const isAlreadyMarked = existing && (existing.data() !== undefined || (typeof (existing as any).exists === 'function' ? (existing as any).exists() : (existing as any).exists === true));
      if (isAlreadyMarked) {
        return {
          success: true,
          alreadyMarked: true,
          message: 'Attendance was already recorded for this event.',
        };
      }

      const recordData = {
        memberId,
        memberName: memberName || 'Member',
        memberPhone: memberPhone || '',
        photoUrl: photoUrl || '',
        status: 'Present',
        timestamp: firestore.FieldValue.serverTimestamp(),
        method,
        churchId,
        eventId,
        eventName,
        scannedAt: new Date().toISOString(),
      };

      let anySuccess = false;
      let lastError: any = null;

      // Concurrent parallel writes for ultra-fast performance
      await Promise.allSettled([
        attendeeDocRef.set(recordData),
        firestore()
          .collection('churches')
          .doc(churchId)
          .collection('attendanceRecords')
          .add(recordData)
          .catch((e: any) => {
            console.warn('[AttendanceService] Note writing to church attendanceRecords:', e?.message);
          }),
        firestore()
          .collection('churches')
          .doc(churchId)
          .collection('attendanceRequests')
          .doc(eventId)
          .collection('responses')
          .doc(memberId)
          .set({
            memberId,
            memberName: memberName || 'Member',
            response: 'Yes',
            status: 'Present',
            method,
            submittedAt: firestore.FieldValue.serverTimestamp(),
            respondedAt: firestore.FieldValue.serverTimestamp(),
            photoUrl: photoUrl || '',
            churchId,
            eventName,
          }, { merge: true })
          .catch(() => {})
      ]);

      return { success: true, message: 'Attendance recorded successfully!' };
    } catch (error: any) {
      console.error('[AttendanceService] Error recording attendance:', error);
      return { success: false, message: error?.message || 'Failed to record attendance.' };
    }
  }

  /**
   * Fetches full attendance history for a specific member under their church.
   */
  public async getMemberAttendanceHistory(churchId: string, memberId: string): Promise<AttendanceRecord[]> {
    if (!churchId || !memberId) return [];

    try {
      // 1. Fetch from church attendance records without composite index requirement
      const snap = await firestore()
        .collection('churches')
        .doc(churchId)
        .collection('attendanceRecords')
        .where('memberId', '==', memberId)
        .limit(60)
        .get();

      const list: AttendanceRecord[] = [];
      snap.forEach((doc) => {
        const d = doc.data();
        list.push({
          id: doc.id,
          ...d,
        } as AttendanceRecord);
      });

      // Sort descending in memory
      list.sort((a, b) => {
        const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.timestamp?.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp || a.scannedAt || 0).getTime());
        const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.timestamp?.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp || b.scannedAt || 0).getTime());
        return tB - tA;
      });

      return list;
    } catch (error) {
      console.error('[AttendanceService] Error fetching member attendance history:', error);
      return [];
    }
  }

  /**
   * Checks if member already marked attendance today without requiring a composite index.
   */
  public async getTodayAttendanceStatus(churchId: string, memberId: string): Promise<{ isPresent: boolean; record?: AttendanceRecord }> {
    if (!churchId || !memberId) return { isPresent: false };

    try {
      // Query strictly with equality filter on memberId so Firestore never needs a composite index
      const snap = await firestore()
        .collection('churches')
        .doc(churchId)
        .collection('attendanceRecords')
        .where('memberId', '==', memberId)
        .limit(30)
        .get();

      if (!snap.empty) {
        const now = new Date();
        const todayY = now.getFullYear();
        const todayM = now.getMonth();
        const todayD = now.getDate();

        for (const doc of snap.docs) {
          const d = doc.data();
          let recDate: Date | null = null;
          if (d.timestamp?.toDate) {
            recDate = d.timestamp.toDate();
          } else if (d.timestamp?.seconds) {
            recDate = new Date(d.timestamp.seconds * 1000);
          } else if (d.timestamp || d.scannedAt) {
            recDate = new Date(d.timestamp || d.scannedAt);
          }

          if (
            recDate &&
            recDate.getFullYear() === todayY &&
            recDate.getMonth() === todayM &&
            recDate.getDate() === todayD
          ) {
            return { isPresent: true, record: { id: doc.id, ...d } as AttendanceRecord };
          }
        }
      }

      // Fallback: check general_service event attendee
      try {
        const now = new Date();
        const todayY = now.getFullYear();
        const todayM = now.getMonth();
        const todayD = now.getDate();

        const genDoc = await firestore()
          .collection('churches')
          .doc(churchId)
          .collection('events')
          .doc('general_service')
          .collection('attendees')
          .doc(memberId)
          .get()
          .catch(() => null);

        if (genDoc && (genDoc.data() !== undefined || (typeof (genDoc as any).exists === 'function' ? (genDoc as any).exists() : (genDoc as any).exists === true))) {
          const d = genDoc.data();
          let recDate: Date | null = null;
          if (d?.timestamp?.toDate) {
            recDate = d.timestamp.toDate();
          } else if (d?.timestamp?.seconds) {
            recDate = new Date(d.timestamp.seconds * 1000);
          } else if (d?.timestamp || d?.scannedAt) {
            recDate = new Date(d.timestamp || d.scannedAt);
          }

          if (
            recDate &&
            recDate.getFullYear() === todayY &&
            recDate.getMonth() === todayM &&
            recDate.getDate() === todayD
          ) {
            return { isPresent: true, record: { id: genDoc.id, ...d } as AttendanceRecord };
          }
        }
      } catch {
        // Silent fallback
      }

      return { isPresent: false };
    } catch (error) {
      console.error('[AttendanceService] Error checking today attendance:', error);
      return { isPresent: false };
    }
  }
}

export default new AttendanceService();
