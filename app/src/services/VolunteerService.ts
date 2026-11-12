import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import {
  VolunteerApplication,
  VolunteerStatus,
  VolunteerType,
  EventVolunteerRole,
} from '../types/volunteer';

class VolunteerService {
  private getCollection(churchId: string) {
    const cid = churchId || 'default';
    return firestore().collection('churches').doc(cid).collection('volunteer_applications');
  }

  /**
   * Submit a General Church Volunteer Application
   * Enforces Resubmission Rule: Only one pending application at a time.
   */
  async submitGeneralApplication(
    churchId: string,
    member: { id: string; name: string; phone?: string; email?: string },
    data: {
      preferredMinistries: string[];
      skills: string[];
      availabilityNotes?: string;
    }
  ): Promise<string> {
    const col = this.getCollection(churchId);

    // 1. Check for existing pending application for General Volunteering
    try {
      const pendingSnap = await col
        .where('memberId', '==', member.id)
        .where('volunteerType', '==', 'general')
        .where('status', '==', 'pending')
        .limit(1)
        .get();

      if (!pendingSnap.empty) {
        throw new Error(
          'Your previous volunteer application is currently under review. You can submit a new application once the review is completed.'
        );
      }
    } catch (err: any) {
      if (err.message?.includes('currently under review')) {
        throw err;
      }
      // Index fallback
      const snap = await col.where('memberId', '==', member.id).get();
      const hasPending = snap.docs.some(
        (d) => d.data().volunteerType === 'general' && d.data().status === 'pending'
      );
      if (hasPending) {
        throw new Error(
          'Your previous volunteer application is currently under review. You can submit a new application once the review is completed.'
        );
      }
    }

    const docRef = col.doc();

    let memberFcmToken = '';
    try {
      memberFcmToken = await messaging().getToken();
    } catch (_) {}

    const application: Partial<VolunteerApplication> = {
      id: docRef.id,
      churchId: churchId || 'default',
      memberId: member.id,
      memberName: member.name || 'Church Member',
      memberPhone: member.phone || '',
      memberEmail: member.email || '',
      memberFcmToken: memberFcmToken || '',
      volunteerType: 'general',
      status: 'pending',
      preferredMinistries: data.preferredMinistries || [],
      skills: data.skills || [],
      availabilityNotes: data.availabilityNotes || '',
      adminNotified: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    await docRef.set(application);
    await this.notifyAdminApplicationSubmitted(churchId, docRef.id, member.name, 'general');
    return docRef.id;
  }

  /**
   * Submit an Event-Based Volunteer Application
   * Enforces Resubmission Rule: Only one pending application per event.
   */
  async submitEventApplication(
    churchId: string,
    member: { id: string; name: string; phone?: string; email?: string },
    event: { id: string; title: string; date?: string; time?: string; location?: string },
    data: {
      preferredRole: string;
      skills?: string[];
      availabilityNotes?: string;
    }
  ): Promise<string> {
    const col = this.getCollection(churchId);

    // 1. Check for existing pending application for this specific event
    try {
      const pendingSnap = await col
        .where('memberId', '==', member.id)
        .where('volunteerType', '==', 'event')
        .where('eventId', '==', event.id)
        .where('status', '==', 'pending')
        .limit(1)
        .get();

      if (!pendingSnap.empty) {
        throw new Error(
          'Your previous volunteer application is currently under review. You can submit a new application once the review is completed.'
        );
      }
    } catch (err: any) {
      if (err.message?.includes('currently under review')) {
        throw err;
      }
      // Index fallback
      const snap = await col
        .where('memberId', '==', member.id)
        .where('eventId', '==', event.id)
        .get();
      const hasPending = snap.docs.some(
        (d) => d.data().volunteerType === 'event' && d.data().status === 'pending'
      );
      if (hasPending) {
        throw new Error(
          'Your previous volunteer application is currently under review. You can submit a new application once the review is completed.'
        );
      }
    }

    const docRef = col.doc();

    let memberFcmToken = '';
    try {
      memberFcmToken = await messaging().getToken();
    } catch (_) {}

    const application: Partial<VolunteerApplication> = {
      id: docRef.id,
      churchId: churchId || 'default',
      memberId: member.id,
      memberName: member.name || 'Church Member',
      memberPhone: member.phone || '',
      memberEmail: member.email || '',
      memberFcmToken: memberFcmToken || '',
      volunteerType: 'event',
      status: 'pending',
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date || '',
      eventTime: event.time || '',
      eventLocation: event.location || '',
      preferredRole: data.preferredRole,
      skills: data.skills || [],
      availabilityNotes: data.availabilityNotes || '',
      adminNotified: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    await docRef.set(application);
    await this.notifyAdminApplicationSubmitted(churchId, docRef.id, member.name, 'event', event);
    return docRef.id;
  }

  /**
   * Get applications submitted by a specific member
   */
  async getMyApplications(churchId: string, memberId: string): Promise<VolunteerApplication[]> {
    if (!memberId) return [];
    try {
      const snap = await this.getCollection(churchId)
        .where('memberId', '==', memberId)
        .orderBy('createdAt', 'desc')
        .get();

      return snap.docs.map(d => ({ id: d.id, ...d.data() } as VolunteerApplication));
    } catch (e) {
      // Fallback query if composite index is building
      const snap = await this.getCollection(churchId)
        .where('memberId', '==', memberId)
        .get();
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as VolunteerApplication));
      return list.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
    }
  }

  /**
   * Check if a member has already applied for a specific event
   * Prioritizes active pending application, then approved, then latest application.
   */
  async getMemberEventApplication(
    churchId: string,
    eventId: string,
    memberId: string
  ): Promise<VolunteerApplication | null> {
    if (!eventId || !memberId) return null;
    try {
      const snap = await this.getCollection(churchId)
        .where('eventId', '==', eventId)
        .where('memberId', '==', memberId)
        .get();

      if (snap.empty) return null;
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as VolunteerApplication));

      // Prioritize pending application
      const pending = list.find(a => a.status === 'pending');
      if (pending) return pending;

      // Prioritize approved application
      const approved = list.find(a => a.status === 'approved');
      if (approved) return approved;

      // Otherwise return most recent application
      list.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      return list[0];
    } catch (err) {
      console.warn('Error checking member event volunteer application:', err);
      return null;
    }
  }

  /**
   * Check if member has an active pending general volunteer application
   */
  async getPendingGeneralApplication(
    churchId: string,
    memberId: string
  ): Promise<VolunteerApplication | null> {
    if (!memberId) return null;
    try {
      const snap = await this.getCollection(churchId)
        .where('memberId', '==', memberId)
        .where('volunteerType', '==', 'general')
        .where('status', '==', 'pending')
        .limit(1)
        .get();
      if (!snap.empty) {
        return { id: snap.docs[0].id, ...snap.docs[0].data() } as VolunteerApplication;
      }
      return null;
    } catch (e) {
      const list = await this.getMyApplications(churchId, memberId);
      return list.find(a => a.volunteerType === 'general' && a.status === 'pending') || null;
    }
  }

  /**
   * Listen to all applications for Church Admins
   */
  subscribeApplications(
    churchId: string,
    onUpdate: (applications: VolunteerApplication[]) => void,
    onError?: (error: Error) => void
  ) {
    return this.getCollection(churchId)
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        snap => {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as VolunteerApplication));
          onUpdate(list);
        },
        err => {
          console.warn('Volunteer applications snapshot error, falling back to unordered:', err);
          this.getCollection(churchId).onSnapshot(
            fallbackSnap => {
              const list = fallbackSnap.docs.map(d => ({ id: d.id, ...d.data() } as VolunteerApplication));
              onUpdate(list);
            },
            fallbackErr => {
              if (onError) onError(fallbackErr);
            }
          );
        }
      );
  }

  /**
   * Approve a volunteer application (with optional role assignment for events)
   */
  async approveApplication(
    churchId: string,
    applicationId: string,
    admin: { id: string; name: string },
    assignment?: {
      assignedRole?: string;
      assignedDate?: string;
      assignedTimeSlot?: string;
      assignedLocation?: string;
      assignedResponsibility?: string;
    }
  ): Promise<void> {
    const docRef = this.getCollection(churchId).doc(applicationId);
    const appSnap = await docRef.get().catch(() => null);
    const existing = appSnap?.exists ? (appSnap.data() as any) : null;

    const updateData: any = {
      status: 'approved',
      reviewedBy: admin.id,
      reviewedByName: admin.name,
      reviewedAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    if (assignment) {
      if (assignment.assignedRole) updateData.assignedRole = assignment.assignedRole;
      if (assignment.assignedDate) updateData.assignedDate = assignment.assignedDate;
      if (assignment.assignedTimeSlot) updateData.assignedTimeSlot = assignment.assignedTimeSlot;
      if (assignment.assignedLocation) updateData.assignedLocation = assignment.assignedLocation;
      if (assignment.assignedResponsibility) updateData.assignedResponsibility = assignment.assignedResponsibility;
      updateData.assignedAt = firestore.FieldValue.serverTimestamp();
    }

    await docRef.update(updateData);

    if (existing?.memberId) {
      const isEventVolunteer = existing.volunteerType === 'event';
      const eventName = (existing.eventTitle || 'the church event').trim();
      const roleAssigned = assignment?.assignedRole || existing.assignedRole;
      const body = isEventVolunteer
        ? `Your application for ${eventName} has been approved.${roleAssigned ? ` Assigned Role: ${roleAssigned}.` : ''} Please check your event details.`
        : 'Your volunteer application has been approved. Thank you for your willingness to serve the church.';

      await this.writeInAppNotification(
        churchId,
        `vol_status_${applicationId}_approved`,
        {
          type: 'volunteer_application_member',
          targetMemberId: existing.memberId,
          recipientId: existing.memberId,
          recipientRole: 'member',
          targetPhone: existing.memberPhone || '',
          title: '🎉 Volunteer Application Approved!',
          body,
          content: body,
          status: 'approved',
          volunteerType: existing.volunteerType || 'general',
          eventId: existing.eventId || '',
          eventTitle: isEventVolunteer ? eventName : '',
          applicationId,
          referenceId: applicationId,
          referenceType: isEventVolunteer ? 'event_volunteer' : 'general_volunteer',
        },
        true
      );
    }
  }

  /**
   * Reject a volunteer application with optional reason
   */
  async rejectApplication(
    churchId: string,
    applicationId: string,
    admin: { id: string; name: string },
    rejectionReason?: string
  ): Promise<void> {
    const docRef = this.getCollection(churchId).doc(applicationId);
    const appSnap = await docRef.get().catch(() => null);
    const existing = appSnap?.exists ? (appSnap.data() as any) : null;
    const cleanReason = rejectionReason?.trim() || '';

    await docRef.update({
      status: 'rejected',
      rejectionReason: cleanReason,
      reviewedBy: admin.id,
      reviewedByName: admin.name,
      reviewedAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    if (existing?.memberId) {
      const isEventVolunteer = existing.volunteerType === 'event';
      const eventName = (existing.eventTitle || 'the church event').trim();
      const reasonPart = cleanReason
        ? ` Reason: ${cleanReason}`
        : ' Please check your application details in the app.';
      const body = isEventVolunteer
        ? `Your volunteer application for ${eventName} has not been approved.${reasonPart}`
        : `Your volunteer application has not been approved.${reasonPart}`;

      await this.writeInAppNotification(
        churchId,
        `vol_status_${applicationId}_rejected`,
        {
          type: 'volunteer_application_member',
          targetMemberId: existing.memberId,
          recipientId: existing.memberId,
          recipientRole: 'member',
          targetPhone: existing.memberPhone || '',
          title: 'Volunteer Application Update',
          body,
          content: body,
          status: 'rejected',
          volunteerType: existing.volunteerType || 'general',
          eventId: existing.eventId || '',
          eventTitle: isEventVolunteer ? eventName : '',
          applicationId,
          referenceId: applicationId,
          referenceType: isEventVolunteer ? 'event_volunteer' : 'general_volunteer',
        },
        true
      );
    }
  }

  /**
   * Assign or modify duties for an approved volunteer
   */
  async assignVolunteerDuty(
    churchId: string,
    applicationId: string,
    assignment: {
      assignedRole: string;
      assignedDate?: string;
      assignedTimeSlot?: string;
      assignedLocation?: string;
      assignedResponsibility?: string;
    }
  ): Promise<void> {
    const docRef = this.getCollection(churchId).doc(applicationId);
    const appSnap = await docRef.get().catch(() => null);
    const existing = appSnap?.exists ? (appSnap.data() as any) : null;

    await docRef.update({
      assignedRole: assignment.assignedRole,
      assignedDate: assignment.assignedDate || '',
      assignedTimeSlot: assignment.assignedTimeSlot || '',
      assignedLocation: assignment.assignedLocation || '',
      assignedResponsibility: assignment.assignedResponsibility || '',
      assignedAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    if (existing?.memberId && String(existing.status || '').toLowerCase() === 'approved') {
      const eventName = (existing.eventTitle || 'the church event').trim();
      const roleText = assignment.assignedRole ? `as ${assignment.assignedRole}` : 'a volunteer';
      const body = `You have been assigned ${roleText} for ${eventName}.${assignment.assignedResponsibility ? ` Duty: ${assignment.assignedResponsibility}.` : ''} Please check your assignment details.`;
      const assignKey = this.computeAssignmentKey(assignment);

      await this.writeInAppNotification(
        churchId,
        `vol_assign_${applicationId}_${assignKey}`,
        {
          type: 'volunteer_assignment',
          targetMemberId: existing.memberId,
          recipientId: existing.memberId,
          recipientRole: 'member',
          targetPhone: existing.memberPhone || '',
          title: '⭐ You Have Been Assigned!',
          body,
          content: body,
          volunteerType: existing.volunteerType || 'event',
          eventId: existing.eventId || '',
          eventTitle: eventName,
          applicationId,
          referenceId: applicationId,
          referenceType: 'event_volunteer',
        },
        true
      );
    }
  }

  /**
   * Member withdraws their application
   */
  async withdrawApplication(churchId: string, applicationId: string, memberId: string): Promise<void> {
    await this.getCollection(churchId).doc(applicationId).update({
      status: 'withdrawn',
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  }

  /**
   * Admin permanently deletes a volunteer application
   */
  async deleteApplication(churchId: string, applicationId: string): Promise<void> {
    await this.getCollection(churchId).doc(applicationId).delete();
  }

  private async notifyAdminApplicationSubmitted(
    churchId: string,
    applicationId: string,
    memberNameRaw: string,
    volunteerType: 'general' | 'event',
    event?: { id: string; title: string }
  ): Promise<void> {
    const memberDisplayName = (memberNameRaw || '').trim() || 'A Church Member';
    const isEvent = volunteerType === 'event';
    const eventTitleClean = (event?.title || 'Church Event').trim();
    const title = isEvent ? '📅 New Event Volunteer Application!' : '📋 New Volunteer Application!';
    const body = isEvent
      ? `${memberDisplayName} has applied to volunteer for ${eventTitleClean}. Please review the application.`
      : `${memberDisplayName} has submitted a new General Volunteer application. Please review the application.`;

    await this.writeInAppNotification(
      churchId,
      `vol_admin_${applicationId}`,
      {
        type: 'volunteer_application_admin',
        targetRole: 'admin',
        title,
        body,
        content: body,
        memberName: memberDisplayName,
        volunteerType,
        eventId: isEvent ? (event?.id || '') : '',
        eventTitle: isEvent ? eventTitleClean : '',
        applicationId,
        referenceId: applicationId,
        referenceType: isEvent ? 'event_volunteer' : 'general_volunteer',
      },
      false
    );
  }

  private computeAssignmentKey(data: {
    assignedRole?: string;
    assignedDate?: string;
    assignedTimeSlot?: string;
    assignedLocation?: string;
    assignedResponsibility?: string;
  }): string {
    const raw = [
      data.assignedRole || '',
      data.assignedDate || '',
      data.assignedTimeSlot || '',
      data.assignedLocation || '',
      data.assignedResponsibility || '',
    ].join('|');
    let hash = 5381;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) + hash + raw.charCodeAt(i)) >>> 0;
    }
    return hash.toString(36);
  }

  private async writeInAppNotification(
    churchId: string,
    docId: string,
    payload: Record<string, any>,
    writeToBroadcast: boolean
  ): Promise<void> {
    const cid = churchId || 'default';
    const docData = {
      ...payload,
      churchId: cid,
      read: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
    };
    try {
      await firestore()
        .collection('churches')
        .doc(cid)
        .collection('notifications')
        .doc(docId)
        .set(docData, { merge: true });
    } catch (err) {
      console.warn('[VolunteerService] In-app notification write warning:', err);
    }

    if (writeToBroadcast) {
      try {
        await firestore()
          .collection('churches')
          .doc(cid)
          .collection('broadcasts')
          .doc(docId)
          .set({ ...docData, silent: true }, { merge: true });
      } catch (err) {
        console.warn('[VolunteerService] In-app broadcast write warning:', err);
      }
    }

    const targetMemberId = String(payload?.targetMemberId || payload?.recipientId || '').trim();
    if (targetMemberId) {
      try {
        await firestore()
          .collection('churches')
          .doc(cid)
          .collection('members')
          .doc(targetMemberId)
          .collection('notifications')
          .doc(docId)
          .set(docData, { merge: true });
      } catch (err) {
        console.warn('[VolunteerService] Member notification subcollection write warning:', err);
      }
    }
  }
}

export default new VolunteerService();

