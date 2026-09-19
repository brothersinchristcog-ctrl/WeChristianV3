import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * 🔔 SEND MEETING NOTIFICATION
 * Triggered when a new online meeting is scheduled in Firestore.
 * Sends a notification to the church's topic.
 */
export const pushMeetingLive = onDocumentCreated('churches/{churchId}/online_meetings/{meetingId}', async (event) => {
  const snap = event.data;
  if (!snap) return;

  const meeting = snap.data();
  const churchId = event.params.churchId;
  const meetingId = event.params.meetingId;

  // Format the start time
  const startDate = meeting.startTime.toDate();
  const timeString = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });

  const payload = {
    notification: {
      title: `📅 New Online Meeting`,
      body: `${meeting.title} has been scheduled for today at ${timeString}.`,
    },
    data: {
      type: 'online_meeting',
      meetingId: meetingId,
      churchId: churchId,
      provider: meeting.provider || '',
      url: meeting.meetingUrl || '',
    },
    topic: `church_${churchId}`,
  };

  try {
    const response = await getMessaging().send(payload);
    console.log('Successfully sent meeting creation notification:', response);
  } catch (error) {
    console.error('Error sending meeting notification:', error);
  }
});

/**
 * 🙏 NOTIFY ADMIN OF PUBLIC PRAYER REQUEST
 * Triggered when a new prayer request is created.
 */
export const pushPrayerRequestAdmin = onDocumentCreated('churches/{churchId}/prayerRequests/{prayerId}', async (event) => {
  const snap = event.data;
  if (!snap) return;

  const prayer = snap.data();
  const churchId = event.params.churchId;

  if (prayer.isPublic === true) {
    const payload = {
      notification: {
        title: `🙏 Pending Prayer Request`,
        body: `${prayer.name || 'A member'} has requested community prayer. Please review and approve.`,
      },
      data: { type: 'prayer_request_admin', churchId: churchId },
      // Send to admin topic (Assuming church_{id}_admin exists, else we can fall back to general church alerts or specific admin tokens, but for now we'll target church_{id}_admin)
      topic: `church_${churchId}_admin`,
    };

    try {
      await getMessaging().send(payload);
    } catch (error) {
      console.error('Error sending prayer admin notification:', error);
    }
  }
});

/**
 * 🙏 NOTIFY COMMUNITY OF APPROVED PRAYER REQUEST
 * Triggered when a prayer request is approved (isAnswered becomes true).
 */
export const pushPrayerRequestApproved = onDocumentUpdated('churches/{churchId}/prayerRequests/{prayerId}', async (event) => {
  const snap = event.data;
  if (!snap) return;

  const before = snap.before.data();
  const after = snap.after.data();
  const churchId = event.params.churchId;

  // Check if it just became approved AND is public
  if (!before.isAnswered && after.isAnswered && after.isPublic) {
    const payload = {
      notification: {
        title: `🙏 Community Prayer`,
        body: `Please join in prayer for ${after.name || 'a member'}.`,
      },
      data: { type: 'prayer_request_public', churchId: churchId },
      topic: `church_${churchId}`,
    };

    try {
      await getMessaging().send(payload);
    } catch (error) {
      console.error('Error sending prayer community notification:', error);
    }
  }
});

/**
 * ⏱ CHECK ONLINE MEETINGS (CRON JOB)
 * Cron Job: Runs every minute to check if any online meeting is starting now (or within 5 minutes)
 */
export const monitorMeetingLive = onSchedule('* * * * *', async (event) => {
  const db = getFirestore();
  const now = new Date();
  const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);

  try {
    const churchesSnapshot = await db.collection('churches').get();
    
    for (const churchDoc of churchesSnapshot.docs) {
      const churchId = churchDoc.id;
      
      // Query meetings that are scheduled or live
      const meetingsSnapshot = await churchDoc.ref.collection('online_meetings')
        .where('status', 'in', ['scheduled', 'live'])
        .get();

      for (const meetingDoc of meetingsSnapshot.docs) {
        const meeting = meetingDoc.data();
        if (!meeting.startTime) continue;
        
        const startTime = meeting.startTime.toDate();
        const updates: any = {};
        
        // 1. Check for "Live" notification
        if (startTime <= now && !meeting.liveNotified) {
          const payload = {
            notification: {
              title: `🔴 Live Meeting Now`,
              body: `${meeting.title} is now live.`,
            },
            data: {
              type: 'online_meeting',
              meetingId: meetingDoc.id,
              churchId: churchId,
              provider: meeting.provider || '',
              url: meeting.meetingUrl || '',
            },
            topic: `church_${churchId}`,
          };
          
          await getMessaging().send(payload).catch(e => console.error('Error sending Live notification', e));
          
          updates.liveNotified = true;
          if (meeting.status !== 'live') updates.status = 'live';
        }
        
        // 2. Check for "Reminder" notification (5 mins after start)
        if (startTime <= fiveMinsAgo && !meeting.reminderNotified) {
          const payload = {
            notification: {
              title: `🔔 Meeting Reminder`,
              body: `${meeting.title} is still live. Join now to participate.`,
            },
            data: {
              type: 'online_meeting',
              meetingId: meetingDoc.id,
              churchId: churchId,
              provider: meeting.provider || '',
              url: meeting.meetingUrl || '',
            },
            topic: `church_${churchId}`,
          };
          
          await getMessaging().send(payload).catch(e => console.error('Error sending Reminder notification', e));
          
          updates.reminderNotified = true;
        }

        // Apply updates if any notifications were sent
        if (Object.keys(updates).length > 0) {
          await meetingDoc.ref.update(updates);
        }
      }
    }
  } catch (error) {
    console.error('Error in checkOnlineMeetings cron job:', error);
  }
});
