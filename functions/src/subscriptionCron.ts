import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Scheduled cron job to check church subscription expirations and send push notifications.
 * Runs daily at 9:00 AM.
 * 
 * Target: churches
 * Checks the validUntil field or 60 days from createdAt. 
 * Sends FCM notifications for 3 days, 1 day, and 0 days (expiry) to church admins.
 */
export const checkSubscriptionExpirations = onSchedule({
  schedule: '0 9 * * *',
  timeZone: 'Asia/Kolkata',
}, async (event) => {
  const db = getFirestore();
  const messaging = getMessaging();

  const now = new Date();
  
  try {
    console.log('Running daily church subscription expiration check at:', now.toISOString());

    const churchesSnapshot = await db.collection('churches').get();

    if (churchesSnapshot.empty) {
      console.log('No churches found.');
      return;
    }

    let notificationsSent = 0;
    let expiredUpdated = 0;

    for (const doc of churchesSnapshot.docs) {
      const data = doc.data();
      
      // Calculate expiration date
      let expirationDate: Date | null = null;
      
      if (data.subscription?.validUntil) {
        let validUntil = data.subscription.validUntil;
        if (typeof validUntil === 'string') {
          expirationDate = new Date(validUntil);
        } else if (validUntil.toDate) {
          expirationDate = validUntil.toDate();
        } else if (validUntil.seconds) {
          expirationDate = new Date(validUntil.seconds * 1000);
        }
      } 
      
      if (!expirationDate) {
        // Fallback to 60 days after createdAt
        let createdAt = data.createdAt;
        if (createdAt) {
          if (typeof createdAt === 'string') {
            expirationDate = new Date(createdAt);
          } else if (createdAt.toDate) {
            expirationDate = createdAt.toDate();
          } else if (createdAt.seconds) {
            expirationDate = new Date(createdAt.seconds * 1000);
          }
          if (expirationDate) {
            expirationDate.setDate(expirationDate.getDate() + 60); // 60 days trial
          }
        }
      }

      if (!expirationDate) {
        // Cannot determine expiration, skip
        continue;
      }

      const timeDiff = expirationDate.getTime() - now.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      // 1. Check if completely expired
      if (daysLeft < 0) {
        // Expired! Update status in Firestore if not already marked inactive
        if (data.subscription?.status !== 'expired' || data.isActive !== false) {
          await doc.ref.update({
            'subscription.status': 'expired',
            isActive: false
          });
          expiredUpdated++;
        }
        continue;
      }

      // 2. Check for upcoming expiry notifications
      if (daysLeft === 3 || daysLeft === 1 || daysLeft === 0) {
        // Find admins for this church
        const adminsSnapshot = await doc.ref.collection('members').where('role', 'in', ['admin', 'pastor']).get();
        let tokens: string[] = [];
        
        for (const adminDoc of adminsSnapshot.docs) {
           const adminData = adminDoc.data();
           // Get global user to find FCM tokens
           const globalUserDoc = await db.collection('users').doc(adminDoc.id).get();
           if (globalUserDoc.exists) {
              const globalData = globalUserDoc.data();
              if (globalData?.fcmTokens && Array.isArray(globalData.fcmTokens)) {
                tokens.push(...globalData.fcmTokens);
              } else if (globalData?.fcmToken) {
                tokens.push(globalData.fcmToken);
              }
           }
        }

        if (tokens.length > 0) {
          let title = '';
          let body = '';
          
          if (daysLeft === 3) {
            title = 'Church Subscription Expiring Soon';
            body = 'Your church subscription/trial expires in 3 days. Please renew to avoid losing access for all members.';
          } else if (daysLeft === 1) {
            title = 'Church Subscription Expires Tomorrow';
            body = 'Your church subscription/trial expires tomorrow. Renew now to maintain app access.';
          } else if (daysLeft === 0) {
            title = 'Church Subscription Expiring Today';
            body = 'Your church subscription/trial expires today. Please renew your plan immediately.';
          }

          if (title && body) {
            const message = {
              notification: { title, body },
              data: { type: 'subscription_reminder' },
              tokens: [...new Set(tokens)] // Unique tokens
            };

            try {
              const response = await messaging.sendEachForMulticast(message);
              notificationsSent += response.successCount;
            } catch (err) {
              console.error(`Error sending notification to church ${doc.id} admins:`, err);
            }
          }
        }
      }
    }

    console.log(`Cron job completed. Sent ${notificationsSent} notifications. Marked ${expiredUpdated} churches as expired/inactive.`);
  } catch (error) {
    console.error('Error running checkSubscriptionExpirations cron job:', error);
  }
});
