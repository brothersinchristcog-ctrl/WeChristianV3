import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';
/**
 * Scheduled cron job to check subscription expirations and send push notifications.
 * Runs daily at 9:00 AM.
 *
 * Target: users where subscription.status === 'trial' or 'active' (specifically 'trial' based on requirements).
 * Checks the validUntil field. Sends FCM notifications for 3 days, 1 day, and 0 days (expiry).
 */
export const checkSubscriptionExpirations = onSchedule({
    schedule: '0 9 * * *',
    timeZone: 'Asia/Kolkata',
}, async (event) => {
    const db = getFirestore();
    const messaging = getMessaging();
    const now = new Date();
    try {
        console.log('Running daily subscription expiration check at:', now.toISOString());
        // Only look at users whose subscription hasn't already completely expired
        const usersSnapshot = await db.collection('users')
            .where('subscription.status', 'in', ['trial', 'active'])
            .get();
        if (usersSnapshot.empty) {
            console.log('No active/trial users found.');
            return;
        }
        let notificationsSent = 0;
        let expiredUpdated = 0;
        for (const doc of usersSnapshot.docs) {
            const data = doc.data();
            const subscription = data.subscription;
            if (!subscription || !subscription.validUntil) {
                continue;
            }
            // Handle Timestamp or ISO String
            let validUntilDate;
            if (typeof subscription.validUntil === 'string') {
                validUntilDate = new Date(subscription.validUntil);
            }
            else if (subscription.validUntil.toDate) {
                validUntilDate = subscription.validUntil.toDate();
            }
            else if (subscription.validUntil.seconds) {
                validUntilDate = new Date(subscription.validUntil.seconds * 1000);
            }
            else {
                continue;
            }
            const timeDiff = validUntilDate.getTime() - now.getTime();
            const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            // 1. Check if completely expired
            if (daysLeft < 0) {
                // Expired! Update status in Firestore
                await doc.ref.update({
                    'subscription.status': 'expired'
                });
                expiredUpdated++;
                continue;
            }
            // 2. Check for upcoming expiry notifications
            let tokens = [];
            if (data.fcmTokens && Array.isArray(data.fcmTokens) && data.fcmTokens.length > 0) {
                tokens = data.fcmTokens;
            }
            else if (data.fcmToken && typeof data.fcmToken === 'string') {
                tokens = [data.fcmToken];
            }
            if (tokens.length > 0) {
                let title = '';
                let body = '';
                if (daysLeft === 3) {
                    title = 'Subscription Expiring Soon';
                    body = 'Your subscription trial expires in 3 days. Renew now to avoid losing access.';
                }
                else if (daysLeft === 1) {
                    title = 'Subscription Expires Tomorrow';
                    body = 'Your subscription trial expires tomorrow. Renew now to maintain full access to the app.';
                }
                else if (daysLeft === 0) {
                    title = 'Subscription Expiring Today';
                    body = 'Your subscription trial expires today. Please renew your plan to continue using all features.';
                }
                if (title && body) {
                    const message = {
                        notification: { title, body },
                        data: { type: 'subscription_reminder' },
                        tokens: tokens
                    };
                    try {
                        const response = await messaging.sendEachForMulticast(message);
                        notificationsSent += response.successCount;
                        if (response.failureCount > 0) {
                            console.log(`Failed to send ${response.failureCount} notifications to user ${doc.id}`);
                        }
                    }
                    catch (err) {
                        console.error(`Error sending notification to user ${doc.id}:`, err);
                    }
                }
            }
        }
        console.log(`Cron job completed. Sent ${notificationsSent} notifications. Marked ${expiredUpdated} users as expired.`);
    }
    catch (error) {
        console.error('Error running checkSubscriptionExpirations cron job:', error);
    }
});
//# sourceMappingURL=subscriptionCron.js.map