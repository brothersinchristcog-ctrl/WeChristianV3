import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getMessaging } from 'firebase-admin/messaging';
/**
 * 🔔 SEND MEETING NOTIFICATION
 * Triggered when a new online meeting is scheduled in Firestore.
 * Sends a notification to the church's topic.
 */
export const sendMeetingNotification = onDocumentCreated('churches/{churchId}/onlineMeetings/{meetingId}', async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const meeting = snap.data();
    const churchId = event.params.churchId;
    const meetingId = event.params.meetingId;
    // Format the start time
    const startDate = meeting.startTime.toDate();
    const timeString = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const payload = {
        notification: {
            title: `🔴 Online Meeting Scheduled`,
            body: `${meeting.title} today at ${timeString}. Tap to view meeting.`,
        },
        data: {
            type: 'online_meeting',
            meetingId: meetingId,
            churchId: churchId,
            provider: meeting.provider,
        },
        topic: `church_${churchId}`,
    };
    try {
        const response = await getMessaging().send(payload);
        console.log('Successfully sent meeting notification:', response);
    }
    catch (error) {
        console.error('Error sending meeting notification:', error);
    }
});
//# sourceMappingURL=notifications.js.map