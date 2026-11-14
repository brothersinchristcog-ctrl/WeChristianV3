import firestore from '@react-native-firebase/firestore';
import FirestoreService from './FirestoreService';
import { Share } from 'react-native';

export type EventRsvpStatus = 'Going' | 'Interested' | 'Not Going' | 'Not Interested';

export interface EventRsvpRecord {
  id: string; // memberId
  memberId: string;
  memberName: string;
  memberPhone?: string;
  memberPhoto?: string;
  status: EventRsvpStatus;
  rsvpStatus?: EventRsvpStatus;
  isRsvp?: boolean;
  eventId: string;
  eventTitle?: string;
  churchId: string;
  createdAt: any;
  updatedAt: any;
}

export interface EventRsvpStats {
  goingCount: number;
  interestedCount: number;
  notGoingCount: number;
  totalResponses: number;
}

export interface MemberRsvpListItem {
  id: string;
  name: string;
  phone?: string;
  photo?: string;
  status: EventRsvpStatus | 'Not Responded';
  respondedAt?: any;
}

function checkDocExists(doc: any): boolean {
  if (!doc) return false;
  return typeof doc.exists === 'function' ? doc.exists() : !!doc.exists;
}

class EventRsvpService {
  // WeChristian2 uses 'churches/{churchId}' collection structure
  private getEventsCol(churchId: string) {
    return firestore().collection('churches').doc(churchId).collection('events');
  }

  private getRsvpsCol(churchId: string, eventId: string) {
    return this.getEventsCol(churchId).doc(eventId).collection('rsvps');
  }

  private getAttendeesCol(churchId: string, eventId: string) {
    return this.getEventsCol(churchId).doc(eventId).collection('attendees');
  }

  /**
   * Submit or update a member's RSVP response.
   * Directly sets the member document in `events/{eventId}/rsvps/{memberId}`.
   * Falls back to `events/{eventId}/attendees/{memberId}` with `isRsvp: true` if blocked.
   */
  async submitRsvp(
    churchIdParam: string | undefined,
    eventId: string,
    eventTitle: string,
    member: { id: string; name?: string; phone?: string; profilePicture?: string; photoURL?: string },
    newStatus: EventRsvpStatus
  ): Promise<void> {
    if (!eventId || !member?.id) {
      throw new Error('Event ID and Member ID are required to submit RSVP');
    }

    const churchId = churchIdParam || (await FirestoreService.getChurchId()) || '';
    if (!churchId) throw new Error('Church ID is required');

    const eventRef = this.getEventsCol(churchId).doc(eventId);
    const rsvpRef = this.getRsvpsCol(churchId, eventId).doc(member.id);
    const attendeeRef = this.getAttendeesCol(churchId, eventId).doc(member.id);

    const now = firestore.FieldValue.serverTimestamp();
    const rsvpData: EventRsvpRecord = {
      id: member.id,
      memberId: member.id,
      memberName: member.name || 'Member',
      memberPhone: member.phone || '',
      memberPhoto: member.profilePicture || member.photoURL || '',
      status: newStatus,
      rsvpStatus: newStatus,
      isRsvp: true,
      eventId,
      eventTitle: eventTitle || 'Church Event',
      churchId,
      createdAt: now,
      updatedAt: now,
    };

    let writeSucceeded = false;

    // 1. Primary write to `rsvps` subcollection
    try {
      await rsvpRef.set(rsvpData, { merge: true });
      writeSucceeded = true;
    } catch (primaryErr: any) {
      console.warn(
        '[EventRsvpService] rsvps subcollection write failed (rules pending), using attendees fallback:',
        primaryErr?.message || primaryErr
      );
    }

    // 2. Fallback write to `attendees` subcollection if primary was blocked by rules
    if (!writeSucceeded) {
      await attendeeRef.set(
        {
          ...rsvpData,
          isRsvp: true,
          rsvpStatus: newStatus,
          status: newStatus,
        },
        { merge: true }
      );
    }

    // 3. Parent event update with aggregated RSVP stats
    try {
      const snap = await this.getRsvpsCol(churchId, eventId).get();
      let going = 0;
      let notGoing = 0;
      let interested = 0;
      snap.forEach((d) => {
        const data = d.data();
        const st = data?.status || data?.rsvpStatus;
        if (st === 'Going') going++;
        else if (st === 'Not Going') notGoing++;
        else if (st === 'Not Interested' || st === 'Interested') interested++;
      });
      await eventRef.update({
        rsvpStats: {
          goingCount: going,
          notGoingCount: notGoing,
          interestedCount: interested,
          totalResponses: going + notGoing + interested,
        },
        updatedAt: now,
      });
    } catch {
      // Quietly ignore if parent write fails
    }
  }

  /**
   * Listen to a specific member's active RSVP response in real-time.
   */
  listenToMemberRsvp(
    churchIdParam: string | undefined,
    eventId: string,
    memberId: string,
    callback: (rsvp: EventRsvpRecord | null) => void
  ): () => void {
    if (!eventId || !memberId) {
      callback(null);
      return () => {};
    }

    let unsubRsvp: (() => void) | null = null;
    let unsubAttendee: (() => void) | null = null;

    (async () => {
      const churchId = churchIdParam || (await FirestoreService.getChurchId()) || '';
      if (!churchId) { callback(null); return; }

      const rsvpDocRef = this.getRsvpsCol(churchId, eventId).doc(memberId);
      const attendeeDocRef = this.getAttendeesCol(churchId, eventId).doc(memberId);

      unsubRsvp = rsvpDocRef.onSnapshot(
        (doc: any) => {
          if (checkDocExists(doc) && doc.data()?.status) {
            callback(doc.data() as EventRsvpRecord);
          } else {
            attendeeDocRef
              .get()
              .then((attDoc: any) => {
                const data = attDoc.data() || {};
                if (
                  checkDocExists(attDoc) &&
                  (data?.isRsvp || ['Going', 'Interested', 'Not Going', 'Not Interested'].includes(data?.status || data?.rsvpStatus))
                ) {
                  callback({
                    ...data,
                    status: data.status || data.rsvpStatus,
                  } as EventRsvpRecord);
                } else {
                  callback(null);
                }
              })
              .catch(() => callback(null));
          }
        },
        () => {
          unsubAttendee = attendeeDocRef.onSnapshot(
            (attDoc: any) => {
              const data = attDoc.data() || {};
              if (
                checkDocExists(attDoc) &&
                (data?.isRsvp || ['Going', 'Interested', 'Not Going', 'Not Interested'].includes(data?.status || data?.rsvpStatus))
              ) {
                callback({
                  ...data,
                  status: data.status || data.rsvpStatus,
                } as EventRsvpRecord);
              } else {
                callback(null);
              }
            },
            () => callback(null)
          );
        }
      );
    })();

    return () => {
      if (unsubRsvp) unsubRsvp();
      if (unsubAttendee) unsubAttendee();
    };
  }

  /**
   * Listen to real-time aggregate stats calculated directly from actual RSVP responses.
   */
  listenToEventStats(
    churchIdParam: string | undefined,
    eventId: string,
    callback: (stats: EventRsvpStats, eventData: any) => void
  ): () => void {
    if (!eventId) return () => {};

    let unsubRsvp: (() => void) | null = null;
    let unsubAttendee: (() => void) | null = null;
    let unsubEvent: (() => void) | null = null;

    (async () => {
      const churchId = churchIdParam || (await FirestoreService.getChurchId()) || '';
      if (!churchId) return;

      const eventRef = this.getEventsCol(churchId).doc(eventId);
      const rsvpsCol = this.getRsvpsCol(churchId, eventId);
      const attendeesCol = this.getAttendeesCol(churchId, eventId);

      let cachedEventData: any = {};
      unsubEvent = eventRef.onSnapshot(
        (doc: any) => {
          if (checkDocExists(doc)) {
            cachedEventData = doc.data() || {};
          }
        },
        () => {}
      );

      const computeAndEmit = (docs: any[]) => {
        let going = 0;
        let interested = 0;
        let notGoing = 0;

        docs.forEach((d) => {
          const data = typeof d.data === 'function' ? d.data() : d;
          const status = data?.status || data?.rsvpStatus;
          if (status === 'Going') going++;
          else if (status === 'Interested' || status === 'Not Interested') interested++;
          else if (status === 'Not Going') notGoing++;
        });

        const total = going + interested + notGoing;
        callback(
          {
            goingCount: going,
            interestedCount: interested,
            notGoingCount: notGoing,
            totalResponses: total,
          },
          cachedEventData
        );
      };

      unsubRsvp = rsvpsCol.onSnapshot(
        (snap) => {
          if (!snap.empty) {
            computeAndEmit(snap.docs);
          } else {
            attendeesCol
              .where('isRsvp', '==', true)
              .get()
              .then((attSnap) => {
                computeAndEmit(attSnap.docs);
              })
              .catch(() => computeAndEmit([]));
          }
        },
        () => {
          unsubAttendee = attendeesCol.where('isRsvp', '==', true).onSnapshot(
            (attSnap) => {
              computeAndEmit(attSnap.docs);
            },
            () => computeAndEmit([])
          );
        }
      );
    })();

    return () => {
      if (unsubRsvp) unsubRsvp();
      if (unsubAttendee) unsubAttendee();
      if (unsubEvent) unsubEvent();
    };
  }

  /**
   * Listen to all RSVP responses for an event in real-time (for Admin Dashboard).
   */
  listenToAllEventRsvps(
    churchIdParam: string | undefined,
    eventId: string,
    callback: (rsvps: EventRsvpRecord[]) => void
  ): () => void {
    if (!eventId) return () => {};

    let unsubRsvp: (() => void) | null = null;
    let unsubAttendee: (() => void) | null = null;

    (async () => {
      const churchId = churchIdParam || (await FirestoreService.getChurchId()) || '';
      if (!churchId) { callback([]); return; }

      const rsvpsCol = this.getRsvpsCol(churchId, eventId);
      const attendeesCol = this.getAttendeesCol(churchId, eventId);

      const parseDocs = (docs: any[]): EventRsvpRecord[] => {
        return docs
          .map((d) => (typeof d.data === 'function' ? d.data() : d) as EventRsvpRecord)
          .filter((r) => ['Going', 'Interested', 'Not Going'].includes(r.status || r.rsvpStatus || ''));
      };

      unsubRsvp = rsvpsCol.onSnapshot(
        (snap) => {
          if (!snap.empty) {
            callback(parseDocs(snap.docs));
          } else {
            attendeesCol
              .where('isRsvp', '==', true)
              .get()
              .then((attSnap) => {
                callback(parseDocs(attSnap.docs));
              })
              .catch(() => callback([]));
          }
        },
        () => {
          unsubAttendee = attendeesCol.where('isRsvp', '==', true).onSnapshot(
            (attSnap) => callback(parseDocs(attSnap.docs)),
            () => callback([])
          );
        }
      );
    })();

    return () => {
      if (unsubRsvp) unsubRsvp();
      if (unsubAttendee) unsubAttendee();
    };
  }

  /**
   * Fetch all active church members for RSVP Total Invited & Not Responded list.
   */
  async getChurchMembersForRsvp(
    churchIdParam?: string
  ): Promise<{ id: string; name: string; phone?: string; photo?: string }[]> {
    try {
      const churchId = churchIdParam || (await FirestoreService.getChurchId()) || '';
      if (!churchId) return [];

      const snap = await firestore()
        .collection('churches')
        .doc(churchId)
        .collection('members')
        .where('membershipStatus', '==', 'Active')
        .limit(500)
        .get();

      if (snap.empty) {
        const fallbackSnap = await firestore()
          .collection('churches')
          .doc(churchId)
          .collection('members')
          .limit(500)
          .get();
        return fallbackSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || data.fullName || data.firstName || 'Member',
            phone: data.phone || data.mobile || '',
            photo: data.profilePicture || data.photoURL || '',
          };
        });
      }

      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || data.fullName || data.firstName || 'Member',
          phone: data.phone || data.mobile || '',
          photo: data.profilePicture || data.photoURL || '',
        };
      });
    } catch (e) {
      console.warn('[EventRsvpService] Error fetching church members:', e);
      return [];
    }
  }

  /**
   * Notify members when RSVP is enabled on an already published event.
   */
  async notifyRsvpOpened(
    param1: string | { churchId?: string; eventId: string; eventTitle: string; eventDate: string } | undefined,
    param2?: string,
    param3?: string,
    param4?: string
  ): Promise<void> {
    let churchIdParam: string | undefined;
    let eventId = '';
    let eventTitle = 'Church Event';
    let eventDate = '';

    if (typeof param1 === 'string' || typeof param1 === 'undefined') {
      churchIdParam = param1;
      eventId = param2 || '';
      eventTitle = param3 || 'Church Event';
      eventDate = param4 || '';
    } else if (param1 && typeof param1 === 'object') {
      churchIdParam = param1.churchId;
      eventId = param1.eventId || '';
      eventTitle = param1.eventTitle || 'Church Event';
      eventDate = param1.eventDate || '';
    }

    try {
      const churchId = churchIdParam || (await FirestoreService.getChurchId()) || '';
      await FirestoreService.createNotificationBroadcast({
        title: `📝 RSVP Open: ${eventTitle}`,
        content: `Participation confirmation is now open for "${eventTitle}" on ${eventDate}. Tap to let us know if you'll be Going, Interested, or Not Going!`,
        type: 'event_rsvp',
        eventId,
        id: eventId,
        screen: 'EventDetails',
        targetChurchId: churchId,
      });
    } catch (err) {
      console.warn('⚠️ [EventRsvpService] Failed to dispatch RSVP opened notification:', err);
    }
  }

  /**
   * Generate and export a comprehensive participation report (CSV format).
   */
  async exportParticipationReport(
    param1: any,
    param2?: EventRsvpStats,
    param3?: MemberRsvpListItem[]
  ): Promise<void> {
    let eventTitle = 'Event';
    let eventDate = 'N/A';
    let stats: EventRsvpStats = { goingCount: 0, interestedCount: 0, notGoingCount: 0, totalResponses: 0 };
    let allMembersRoster: MemberRsvpListItem[] = [];

    if (param1 && typeof param1 === 'object' && (param1.members || param1.stats)) {
      eventTitle = param1.eventTitle || param1.title || 'Event';
      eventDate = param1.eventDate || param1.date || 'N/A';
      stats = param1.stats || stats;
      allMembersRoster = param1.members || [];
    } else {
      eventTitle = param1?.title || param1?.name || 'Event';
      eventDate = param1?.date || 'N/A';
      stats = param2 || stats;
      allMembersRoster = param3 || [];
    }

    const totalMembers = allMembersRoster.length;

    let csv = `Event Participation Report: ${eventTitle}\n`;
    csv += `Event Date: ${eventDate}\n`;
    csv += `Generated On: ${new Date().toLocaleString()}\n`;
    csv += `\n`;
    csv += `SUMMARY STATISTICS\n`;
    csv += `Total Invited,${totalMembers}\n`;
    csv += `Going,${stats.goingCount} (${totalMembers > 0 ? Math.round((stats.goingCount / totalMembers) * 100) : 0}%)\n`;
    csv += `Interested,${stats.interestedCount} (${totalMembers > 0 ? Math.round((stats.interestedCount / totalMembers) * 100) : 0}%)\n`;
    csv += `Not Going,${stats.notGoingCount} (${totalMembers > 0 ? Math.round((stats.notGoingCount / totalMembers) * 100) : 0}%)\n`;
    const notResponded = Math.max(0, totalMembers - stats.totalResponses);
    csv += `Not Responded,${notResponded} (${totalMembers > 0 ? Math.round((notResponded / totalMembers) * 100) : 0}%)\n`;
    csv += `\n`;
    csv += `MEMBER ROSTER\n`;
    csv += `Index,Member Name,Mobile Number,RSVP Status\n`;

    allMembersRoster.forEach((m, idx) => {
      const safeName = (m.name || 'Member').replace(/,/g, ' ');
      const safePhone = (m.phone || 'N/A').replace(/,/g, ' ');
      csv += `${idx + 1},${safeName},${safePhone},${m.status}\n`;
    });

    try {
      await Share.share({
        title: `RSVP Report - ${eventTitle}`,
        message: csv,
      });
    } catch (e) {
      console.warn('[EventRsvpService] Error sharing CSV report:', e);
    }
  }
}

export default new EventRsvpService();

