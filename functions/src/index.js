import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as functionsCompat from 'firebase-functions/v1';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { getStorage } from 'firebase-admin/storage';
import { SalesforceBackend } from './services/SalesforceBackend.js';
import { sendWhatsAppTemplateInternal } from './whatsapp.js';
import { generateCelebrationImage } from './imageGenerator.js';
import { randomUUID } from 'crypto';
export { weCelebrationDailySweepV3, weCelebrationWishCreatedTrigger, weCelebrationBatchedWishes, executeBatchedWishes, triggerMorningCelebrations } from './celebrations.js';
// Initialize Firebase Admin once at top level
initializeApp();
// TODO: When Salesforce integration becomes multi-tenant, remove this and loop over churches.
const DEFAULT_CHURCH_ID = 'KhmBeNWxlrxwS1hGhuw';
// Lazy initialization helpers
let _db;
let _messaging;
let _sfBackend;
const getDb = () => _db || (_db = getFirestore());
const getMsg = () => _messaging || (_messaging = getMessaging());
const getSf = () => {
    if (!_sfBackend) {
        _sfBackend = new SalesforceBackend({
            consumerKey: process.env.SF_CONSUMER_KEY || '',
            username: process.env.SF_USERNAME || '',
            loginUrl: process.env.SF_LOGIN_URL || 'https://test.salesforce.com',
            privateKey: (process.env.SF_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        });
    }
    return _sfBackend;
};
// Helper to remove HTML tags from rich text before sending push notifications
const stripHtml = (html) => {
    if (!html)
        return '';
    return html.replace(/<[^>]*>?/gm, '').trim();
};
/**
 * 📖 GET DAILY PROMISE
 */
export const getDailyPromise = onCall({ invoker: 'public' }, async (request) => {
    try {
        const promise = await getSf().getDailyPromise();
        return { success: true, data: promise };
    }
    catch (error) {
        console.error('getDailyPromise Error:', error);
        throw new HttpsError('internal', error.message);
    }
});
/**
 * 📅 GET UPCOMING EVENTS
 */
export const getUpcomingEvents = onCall({ invoker: 'public' }, async (request) => {
    try {
        const limit = request.data?.limit || 5;
        const events = await getSf().getUpcomingEvents(limit);
        return { success: true, data: events };
    }
    catch (error) {
        console.error('getUpcomingEvents Error:', error);
        throw new HttpsError('internal', error.message);
    }
});
/**
 * 🛡️ CHECK CONTACT EXISTS
 */
export const checkContactExists = onCall({ invoker: 'public' }, async (request) => {
    try {
        const phone = request.data?.phone;
        if (!phone) {
            throw new HttpsError('invalid-argument', 'Phone number is required');
        }
        const result = await getSf().checkContact(phone);
        return { success: true, ...result };
    }
    catch (error) {
        console.error('checkContactExists Error:', error);
        throw new HttpsError('internal', error.message);
    }
});
/**
 * 🔔 NOTIFY MEMBERS
 */
export const notifyMembersV2 = onRequest(async (request, response) => {
    const { title, body, target, type } = request.body;
    if (!title || !body) {
        response.status(400).send({ success: false, error: 'Missing title or body' });
        return;
    }
    try {
        console.log(`🔔 Sending Notification: [${title}] to [${target || 'All'}]`);
        let query = getDb().collection('users');
        if (target && target !== 'all') {
            query = query.where('cellGroup', '==', target);
        }
        const snapshot = await query.get();
        const tokenSet = new Set();
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.fcmToken)
                tokenSet.add(data.fcmToken);
        });
        const tokens = Array.from(tokenSet);
        if (tokens.length === 0) {
            response.status(200).send({ success: true, message: 'No registered tokens found' });
            return;
        }
        const message = {
            notification: { title, body },
            data: { type: type || 'general' },
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    priority: 'max',
                    channelId: 'church_alerts'
                }
            },
            apns: {
                headers: {
                    'apns-priority': '10'
                },
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1
                    }
                }
            },
            tokens: tokens
        };
        const fcmResponse = await getMsg().sendEachForMulticast(message);
        console.log(`✅ Push Sent: ${fcmResponse.successCount} success, ${fcmResponse.failureCount} failed`);
        response.status(200).send({
            success: true, sent: fcmResponse.successCount, failed: fcmResponse.failureCount
        });
    }
    catch (error) {
        console.error('notifyMembers Error:', error);
        response.status(500).send({ success: false, error: error.message });
    }
});
/**
 * ⏰ AUTOMATED DAILY PROMISE SCHEDULER
 * Scheduled to run every day at 07:00 AM IST (01:30 AM UTC)
 */
export const automatedDailyPromise = onSchedule({ schedule: '0 5 * * *', timeZone: 'Asia/Kolkata' }, async (event) => {
    try {
        console.log('⏰ Running automatedDailyPromise scheduler...');
        const db = getDb();
        // Check if enabled
        const settingsDoc = await db.collection('churches').doc(DEFAULT_CHURCH_ID).collection('settings').doc('notifications').get();
        const settings = settingsDoc.data();
        if (settings && settings.dailyPromise && settings.dailyPromise.enabled === false) {
            console.log('🛑 Daily Promise automation is disabled.');
            return;
        }
        const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const dStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const promiseSnap = await db.collection('churches').doc(DEFAULT_CHURCH_ID).collection('promises').where('date', '==', dStr).limit(1).get();
        if (promiseSnap.empty) {
            console.log('⚠️ No daily promise found in Firestore for today (' + dStr + ').');
            return;
        }
        const promise = promiseSnap.docs[0].data();
        const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        // Fallbacks for content based on app schema
        const content = promise.textEn || promise.text || promise.Promises__c || promise.Promise_text_telugu__c || 'Grace and Peace be multiplied to you today.';
        // Pushed to broadcasts collection
        await db.collection('churches').doc(DEFAULT_CHURCH_ID).collection('broadcasts').add({
            title: '📖 Today\'s Promise · ఈ రోజు వాగ్దానం',
            content: content,
            date: dateStr,
            type: 'announcement',
            silent: true,
            createdAt: FieldValue.serverTimestamp()
        });
        // Send push notification
        const snapshot = await db.collection('users').get();
        const tokenSet = new Set();
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.fcmToken)
                tokenSet.add(data.fcmToken);
        });
        const tokens = Array.from(tokenSet);
        if (tokens.length > 0) {
            const message = {
                notification: {
                    title: '📖 Daily Promise · ఈ రోజు వాగ్దానం',
                    body: stripHtml(content).slice(0, 100) + '...'
                },
                data: { type: 'general' },
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default',
                        priority: 'max',
                        channelId: 'church_alerts'
                    }
                },
                apns: {
                    headers: {
                        'apns-priority': '10'
                    },
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1
                        }
                    }
                },
                tokens: tokens
            };
            await getMsg().sendEachForMulticast(message);
            console.log(`✅ Automated Daily Promise sent to ${tokens.length} members`);
        }
    }
    catch (error) {
        console.error('Error in automatedDailyPromise scheduler:', error);
    }
});
/**
 * ⏰ AUTOMATED DAILY BIRTHDAYS TRIGGER (Manual Cloud Scheduler Endpoint)
 */
export const triggerAutomatedBirthdays = onRequest({ timeoutSeconds: 300, cors: true }, async (req, res) => {
    try {
        console.log('⏰ Running automatedDailyBirthdays scheduler...');
        const db = getDb();
        // Check if enabled
        const settingsDoc = await db.collection('churches').doc(DEFAULT_CHURCH_ID).collection('settings').doc('notifications').get();
        const settings = settingsDoc.data();
        if (settings && settings.birthdayNotif && settings.birthdayNotif.enabled === false) {
            console.log('🔇 Birthday greetings automation is disabled.');
            res.status(200).send('Birthday greetings automation is disabled.');
            return;
        }
        // Fetch birthdays from Firestore members collection instead of Salesforce
        const today = new Date();
        const m = today.getMonth() + 1;
        const d = today.getDate();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const currentMonthStr = monthNames[today.getMonth()];
        const churchesSnap = await db.collection('churches')
            .where('whatsappIntegrationEnabled', '==', true)
            .where('automatedWhatsappWishesEnabled', '==', true)
            .get();
        const enabledChurchIds = new Set();
        const churchTemplates = new Map();
        churchesSnap.forEach((doc) => {
            enabledChurchIds.add(doc.id);
            const data = doc.data();
            const monthly = data.monthlyCelebrationTemplates;
            const fallback = data.automatedWeCelebrationTemplate || {};
            const tpl = (monthly && monthly[currentMonthStr]) ? monthly[currentMonthStr] : fallback;
            // Store the actual church name from the document so we can use it in the image
            tpl.actualChurchName = data.name || data.churchName || '';
            churchTemplates.set(doc.id, tpl);
        });
        const legacyMembersSnap = await db.collection('members').get();
        const churchMembersSnap = await db.collectionGroup('members').get();
        const processedMemberIds = new Set();
        const bdays = [];
        const processDoc = (doc, churchId) => {
            if (processedMemberIds.has(doc.id))
                return;
            processedMemberIds.add(doc.id);
            const data = doc.data();
            const dobStr = data.dateOfBirth || data.dob || data.birthday;
            if (!dobStr)
                return;
            const parts = dobStr.split(/[-/]/);
            if (parts.length < 3)
                return;
            let month, day;
            if (parts[0].length === 4) { // YYYY-MM-DD
                month = parseInt(parts[1], 10);
                day = parseInt(parts[2], 10);
            }
            else if (parts[2].length === 4) { // DD-MM-YYYY
                day = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10);
            }
            else {
                return;
            }
            if (month === m && day === d) {
                bdays.push({
                    id: doc.id,
                    churchId,
                    name: data.name || (data.firstName ? data.firstName + ' ' + (data.lastName || '') : 'Unknown'),
                    phone: data.phone || data.mobile
                });
            }
        };
        legacyMembersSnap.forEach((doc) => processDoc(doc, DEFAULT_CHURCH_ID));
        churchMembersSnap.forEach((doc) => {
            const cId = doc.ref.parent.parent?.id || DEFAULT_CHURCH_ID;
            processDoc(doc, cId);
        });
        if (bdays.length === 0) {
            console.log('📆 No birthdays celebrating today.');
            res.status(200).send('No birthdays celebrating today.');
            return;
        }
        const greetingTemplate = settings?.birthdayNotif?.greeting || 'Wishing you a very Happy Birthday! May God bless you abundantly and fulfill all your prayers today. 🎂🙏';
        const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        // Send push notifications
        const snapshot = await db.collection('users').get();
        const userMap = new Map(); // name/phone -> fcmToken
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.fcmToken) {
                if (data.name)
                    userMap.set(data.name.toLowerCase(), data.fcmToken);
                if (data.phone)
                    userMap.set(data.phone.slice(-10), data.fcmToken);
            }
        });
        for (const member of bdays) {
            const personalGreeting = `Dear ${member.name}, ${greetingTemplate}`;
            // Save to broadcasts (targeted to this member only)
            const targetChurchId = member.churchId || DEFAULT_CHURCH_ID;
            const docRef = await db.collection('churches').doc(targetChurchId).collection('broadcasts').add({
                title: `🎂 Happy Birthday, ${member.name}!`,
                content: personalGreeting,
                date: dateStr,
                type: 'birthday',
                targetPhone: member.phone || '',
                silent: true,
                createdAt: FieldValue.serverTimestamp()
            });
            // Target individual user token if matches
            const token = userMap.get(member.name.toLowerCase()) || (member.phone ? userMap.get(member.phone.slice(-10)) : null);
            if (token) {
                const message = {
                    notification: {
                        title: `🎂 Happy Birthday, ${member.name}!`,
                        body: greetingTemplate
                    },
                    data: {
                        type: 'birthday',
                        id: docRef.id
                    },
                    android: {
                        priority: 'high',
                        notification: {
                            sound: 'default',
                            priority: 'max',
                            channelId: 'church_alerts'
                        }
                    },
                    apns: {
                        headers: {
                            'apns-priority': '10'
                        },
                        payload: {
                            aps: {
                                sound: 'default',
                                badge: 1
                            }
                        }
                    },
                    token: token
                };
                await getMsg().send(message);
                console.log(`✅ Individual Birthday FCM sent to ${member.name}`);
            }
            // Automatically send WhatsApp message
            if (member.phone && enabledChurchIds.has(member.churchId)) {
                try {
                    const tpl = churchTemplates.get(member.churchId) || {};
                    let msg = tpl.message || greetingTemplate;
                    let firstWord = member.name.split(' ')[0];
                    let formattedMsg = msg.includes(firstWord) || msg.toLowerCase().includes('dear ')
                        ? msg
                        : `Dear ${firstWord}, ${msg}`;
                    const verseStr = tpl.verseText ? `"${tpl.verseText}" — ${tpl.verseRef}` : '';
                    let imageUrl = tpl.imageUrl;
                    if (!imageUrl) {
                        const color = tpl.themeColor || '#3b82f6';
                        const pngBuffer = await generateCelebrationImage({
                            themeColor: color,
                            type: 'birthday',
                            name: member.name,
                            message: formattedMsg,
                            churchName: tpl.actualChurchName || tpl.churchName
                        });
                        const fileName = `automated_wishes/${member.churchId}/birthday_${Date.now()}.png`;
                        const file = getStorage().bucket().file(fileName);
                        const downloadToken = randomUUID();
                        try {
                            await file.save(pngBuffer, {
                                contentType: 'image/png',
                                metadata: { metadata: { firebaseStorageDownloadTokens: downloadToken } }
                            });
                            imageUrl = `https://firebasestorage.googleapis.com/v0/b/${file.bucket.name}/o/${encodeURIComponent(file.name)}?alt=media&token=${downloadToken}`;
                        }
                        catch (uploadErr) {
                            console.warn('⚠️ Local upload failed, using fallback image for WhatsApp testing');
                            imageUrl = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80';
                        }
                    }
                    await sendWhatsAppTemplateInternal(member.churchId, member.phone, 'birthday_card', 'en', imageUrl, 'Automated Birthday Wish', [formattedMsg, verseStr]);
                    console.log(`✅ WhatsApp Birthday message sent to ${member.name}`);
                }
                catch (waErr) {
                    console.error(`❌ Failed to send WhatsApp to ${member.name}:`, waErr);
                }
            }
        }
        res.status(200).send(`Birthday automation completed. Processed ${bdays.length} members.`);
    }
    catch (error) {
        console.error('Error in automatedDailyBirthdays:', error);
        res.status(500).send('Error executing birthday automation.');
    }
});
/**
 * ⏰ AUTOMATED DAILY ANNIVERSARIES TRIGGER (Manual Cloud Scheduler Endpoint)
 */
export const triggerAutomatedAnniversaries = onRequest({ timeoutSeconds: 300, cors: true }, async (req, res) => {
    try {
        console.log('⏰ Running automatedDailyAnniversaries scheduler...');
        const db = getDb();
        // Check if enabled
        const settingsDoc = await db.collection('churches').doc(DEFAULT_CHURCH_ID).collection('settings').doc('notifications').get();
        const settings = settingsDoc.data();
        if (settings && settings.anniversaryNotif && settings.anniversaryNotif.enabled === false) {
            console.log('🔇 Anniversary greetings automation is disabled.');
            res.status(200).send('Anniversary greetings automation is disabled.');
            return;
        }
        // Fetch anniversaries from Firestore members collection
        const today = new Date();
        const m = today.getMonth() + 1;
        const d = today.getDate();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const currentMonthStr = monthNames[today.getMonth()];
        const churchesSnap = await db.collection('churches')
            .where('whatsappIntegrationEnabled', '==', true)
            .where('automatedWhatsappWishesEnabled', '==', true)
            .get();
        const enabledChurchIds = new Set();
        const churchTemplates = new Map();
        churchesSnap.forEach((doc) => {
            enabledChurchIds.add(doc.id);
            const data = doc.data();
            const monthly = data.monthlyCelebrationTemplates;
            const fallback = data.automatedWeCelebrationTemplate || {};
            const tpl = (monthly && monthly[currentMonthStr]) ? monthly[currentMonthStr] : fallback;
            tpl.actualChurchName = data.name || data.churchName || '';
            churchTemplates.set(doc.id, tpl);
        });
        const legacyMembersSnap = await db.collection('members').get();
        const churchMembersSnap = await db.collectionGroup('members').get();
        const processedMemberIds = new Set();
        const annivs = [];
        const processDoc = (doc, churchId) => {
            if (processedMemberIds.has(doc.id))
                return;
            processedMemberIds.add(doc.id);
            const data = doc.data();
            const annivStr = data.marriageDate || data.anniversaryDate || data.anniversary;
            if (!annivStr)
                return;
            const parts = annivStr.split(/[-/]/);
            if (parts.length < 3)
                return;
            let year, month, day;
            if (parts[0].length === 4) { // YYYY-MM-DD
                year = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10);
                day = parseInt(parts[2], 10);
            }
            else if (parts[2].length === 4) { // DD-MM-YYYY
                day = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10);
                year = parseInt(parts[2], 10);
            }
            else {
                return;
            }
            if (month === m && day === d) {
                const currentYear = new Date().getFullYear();
                const years = year > 1900 ? currentYear - year : 0;
                let husband = data.husbandName;
                let wife = data.wifeName;
                if (!husband && !wife) {
                    if (data.gender === 'Male') {
                        husband = data.name || (data.firstName ? data.firstName + ' ' + (data.lastName || '') : 'Unknown');
                        wife = data.spouseName || 'Sister';
                    }
                    else {
                        wife = data.name || (data.firstName ? data.firstName + ' ' + (data.lastName || '') : 'Unknown');
                        husband = data.spouseName || 'Brother';
                    }
                }
                annivs.push({
                    id: doc.id,
                    churchId,
                    husband: husband || 'Brother',
                    wife: wife || 'Sister',
                    years: years || '',
                    phone: data.phone || data.mobile
                });
            }
        };
        legacyMembersSnap.forEach((doc) => processDoc(doc, DEFAULT_CHURCH_ID));
        churchMembersSnap.forEach((doc) => {
            const cId = doc.ref.parent.parent?.id || DEFAULT_CHURCH_ID;
            processDoc(doc, cId);
        });
        if (annivs.length === 0) {
            console.log('📆 No wedding anniversaries celebrating today.');
            res.status(200).send('No wedding anniversaries celebrating today.');
            return;
        }
        const greetingTemplate = settings?.anniversaryNotif?.greeting || 'Wishing you a wonderful wedding anniversary! May God bless your home with love, joy, and peace. 💐💒';
        const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        // Send push notifications
        const snapshot = await db.collection('users').get();
        const userMap = new Map();
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.fcmToken) {
                if (data.name)
                    userMap.set(data.name.toLowerCase(), data.fcmToken);
                if (data.phone)
                    userMap.set(data.phone.slice(-10), data.fcmToken);
            }
        });
        for (const ann of annivs) {
            const coupleNames = `${ann.husband} & ${ann.wife}`;
            const husbandTitle = ann.husband === 'Brother' ? '' : 'Brother ';
            const wifeTitle = ann.wife === 'Sister' ? '' : 'Sister ';
            const yearsText = ann.years ? `${ann.years}th ` : '';
            const personalGreeting = `Wishing ${husbandTitle}${ann.husband} & ${wifeTitle}${ann.wife} a wonderful ${yearsText}Wedding Anniversary! ${greetingTemplate}`;
            // Save to broadcasts (targeted to this couple only)
            const targetChurchId = ann.churchId || DEFAULT_CHURCH_ID;
            const docRef = await db.collection('churches').doc(targetChurchId).collection('broadcasts').add({
                title: `💐 Happy Wedding Anniversary!`,
                content: personalGreeting,
                date: dateStr,
                type: 'anniversary',
                targetPhone: ann.phone || '',
                silent: true,
                createdAt: FieldValue.serverTimestamp()
            });
            // Target spouses
            const husbandToken = userMap.get(ann.husband.toLowerCase());
            const wifeToken = userMap.get(ann.wife.toLowerCase());
            const phoneToken = ann.phone ? userMap.get(ann.phone.slice(-10)) : null;
            const targetTokens = [...new Set([husbandToken, wifeToken, phoneToken].filter(Boolean))];
            if (targetTokens.length > 0) {
                const message = {
                    notification: {
                        title: `💐 Happy Wedding Anniversary!`,
                        body: `Wishing you a wonderful anniversary! ${greetingTemplate}`
                    },
                    data: {
                        type: 'anniversary',
                        id: docRef.id
                    },
                    android: {
                        priority: 'high',
                        notification: {
                            sound: 'default',
                            priority: 'max',
                            channelId: 'church_alerts'
                        }
                    },
                    apns: {
                        headers: {
                            'apns-priority': '10'
                        },
                        payload: {
                            aps: {
                                sound: 'default',
                                badge: 1
                            }
                        }
                    },
                    tokens: targetTokens
                };
                await getMsg().sendEachForMulticast(message);
                console.log(`✅ Individual Anniversary FCM sent to couple`);
            }
            // Automatically send WhatsApp message
            if (ann.phone) {
                try {
                    if (ann.churchId === DEFAULT_CHURCH_ID || enabledChurchIds.has(ann.churchId)) {
                        const tpl = churchTemplates.get(ann.churchId) || {};
                        let msg = tpl.message || greetingTemplate;
                        let couple = `${ann.husband} & ${ann.wife}`;
                        let formattedMsg = msg.includes(couple) || msg.toLowerCase().includes('dear ')
                            ? msg
                            : `Dear ${couple}, ${msg}`;
                        const verseStr = tpl.verseText ? `"${tpl.verseText}" — ${tpl.verseRef}` : '';
                        let imageUrl = tpl.imageUrl;
                        if (!imageUrl) {
                            const color = tpl.themeColor || '#3b82f6';
                            const pngBuffer = await generateCelebrationImage({
                                themeColor: color,
                                type: 'anniversary',
                                name: couple,
                                message: formattedMsg,
                                churchName: tpl.actualChurchName || tpl.churchName
                            });
                            const fileName = `automated_wishes/${ann.churchId}/anniversary_${Date.now()}.png`;
                            const file = getStorage().bucket().file(fileName);
                            const downloadToken = randomUUID();
                            try {
                                await file.save(pngBuffer, {
                                    contentType: 'image/png',
                                    metadata: { metadata: { firebaseStorageDownloadTokens: downloadToken } }
                                });
                                imageUrl = `https://firebasestorage.googleapis.com/v0/b/${file.bucket.name}/o/${encodeURIComponent(file.name)}?alt=media&token=${downloadToken}`;
                            }
                            catch (uploadErr) {
                                console.warn('⚠️ Local upload failed, using fallback image for WhatsApp testing');
                                imageUrl = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80';
                            }
                        }
                        await sendWhatsAppTemplateInternal(ann.churchId, ann.phone, 'birthday_card', 'en', imageUrl, 'Automated Anniversary Wish', [formattedMsg, verseStr]);
                        console.log(`✅ WhatsApp Anniversary message sent to ${ann.husband} & ${ann.wife}`);
                    }
                }
                catch (waErr) {
                    console.error(`❌ Failed to send WhatsApp Anniversary to ${ann.husband}:`, waErr);
                }
            }
        }
        res.status(200).send(`Anniversary automation completed. Processed ${annivs.length} couples.`);
    }
    catch (error) {
        console.error('Error in automatedDailyAnniversaries:', error);
        res.status(500).send('Error executing anniversary automation.');
    }
});
/**
 * ⏰ AUTOMATED DAILY BAPTISM ANNIVERSARIES TRIGGER (Manual Cloud Scheduler Endpoint)
 */
export const triggerAutomatedBaptisms = onRequest({ timeoutSeconds: 300, cors: true }, async (req, res) => {
    try {
        console.log('⏰ Running automatedDailyBaptisms scheduler...');
        const db = getDb();
        // Check if enabled
        const settingsDoc = await db.collection('churches').doc(DEFAULT_CHURCH_ID).collection('settings').doc('notifications').get();
        const settings = settingsDoc.data();
        if (settings && settings.baptismNotif && settings.baptismNotif.enabled === false) {
            console.log('🔇 Baptism greetings automation is disabled.');
            res.status(200).send('Baptism greetings automation is disabled.');
            return;
        }
        // Fetch baptisms from Firestore members collection
        const today = new Date();
        const m = today.getMonth() + 1;
        const d = today.getDate();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const currentMonthStr = monthNames[today.getMonth()];
        const churchesSnap = await db.collection('churches')
            .where('whatsappIntegrationEnabled', '==', true)
            .where('automatedWhatsappWishesEnabled', '==', true)
            .get();
        const enabledChurchIds = new Set();
        const churchTemplates = new Map();
        churchesSnap.forEach((doc) => {
            enabledChurchIds.add(doc.id);
            const data = doc.data();
            const monthly = data.monthlyCelebrationTemplates;
            const fallback = data.automatedWeCelebrationTemplate || {};
            const tpl = (monthly && monthly[currentMonthStr]) ? monthly[currentMonthStr] : fallback;
            tpl.actualChurchName = data.name || data.churchName || '';
            churchTemplates.set(doc.id, tpl);
        });
        const legacyMembersSnap = await db.collection('members').get();
        const churchMembersSnap = await db.collectionGroup('members').get();
        const processedMemberIds = new Set();
        const baptisms = [];
        const processDoc = (doc, churchId) => {
            if (processedMemberIds.has(doc.id))
                return;
            processedMemberIds.add(doc.id);
            const data = doc.data();
            const bapStr = data.baptismDate || data.baptism;
            if (!bapStr)
                return;
            const parts = bapStr.split(/[-/]/);
            if (parts.length < 3)
                return;
            let year, month, day;
            if (parts[0].length === 4) { // YYYY-MM-DD
                year = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10);
                day = parseInt(parts[2], 10);
            }
            else if (parts[2].length === 4) { // DD-MM-YYYY
                day = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10);
                year = parseInt(parts[2], 10);
            }
            else {
                return;
            }
            if (month === m && day === d) {
                const currentYear = new Date().getFullYear();
                const years = year > 1900 ? currentYear - year : 0;
                baptisms.push({
                    id: doc.id,
                    churchId,
                    name: data.name || (data.firstName ? data.firstName + ' ' + (data.lastName || '') : 'Unknown'),
                    years: years || '',
                    phone: data.phone || data.mobile
                });
            }
        };
        legacyMembersSnap.forEach((doc) => processDoc(doc, DEFAULT_CHURCH_ID));
        churchMembersSnap.forEach((doc) => {
            const cId = doc.ref.parent.parent?.id || DEFAULT_CHURCH_ID;
            processDoc(doc, cId);
        });
        if (baptisms.length === 0) {
            console.log('📆 No baptism anniversaries celebrating today.');
            console.log('No baptism anniversaries celebrating today.');
            return;
        }
        const greetingTemplate = settings?.baptismNotif?.greeting || 'Happy Baptism Anniversary! May you continue to grow in faith and walk in His light. 🙏🕊️';
        const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        // Send push notifications
        const snapshot = await db.collection('users').get();
        const userMap = new Map(); // name/phone -> fcmToken
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.fcmToken) {
                if (data.name)
                    userMap.set(data.name.toLowerCase(), data.fcmToken);
                if (data.phone)
                    userMap.set(data.phone.slice(-10), data.fcmToken);
            }
        });
        for (const member of baptisms) {
            const personalGreeting = `Dear ${member.name}, ${greetingTemplate}`;
            // Save to broadcasts (targeted to this member only)
            const targetChurchId = member.churchId || DEFAULT_CHURCH_ID;
            const docRef = await db.collection('churches').doc(targetChurchId).collection('broadcasts').add({
                title: `🕊️ Happy Baptism Anniversary, ${member.name}!`,
                content: personalGreeting,
                date: dateStr,
                type: 'baptism',
                targetPhone: member.phone || '',
                silent: true,
                createdAt: FieldValue.serverTimestamp()
            });
            // Target individual user token if matches
            const token = userMap.get(member.name.toLowerCase()) || (member.phone ? userMap.get(member.phone.slice(-10)) : null);
            if (token) {
                const message = {
                    notification: {
                        title: `🕊️ Happy Baptism Anniversary, ${member.name}!`,
                        body: greetingTemplate
                    },
                    data: {
                        type: 'baptism',
                        id: docRef.id
                    },
                    android: {
                        priority: 'high',
                        notification: {
                            sound: 'default',
                            priority: 'max',
                            channelId: 'church_alerts'
                        }
                    },
                    apns: {
                        headers: {
                            'apns-priority': '10'
                        },
                        payload: {
                            aps: {
                                sound: 'default',
                                badge: 1
                            }
                        }
                    },
                    token: token
                };
                await getMsg().send(message);
                console.log(`✅ Individual Baptism FCM sent to ${member.name}`);
            }
            // Automatically send WhatsApp message
            if (member.phone) {
                try {
                    if (member.churchId === DEFAULT_CHURCH_ID || enabledChurchIds.has(member.churchId)) {
                        const tpl = churchTemplates.get(member.churchId) || {};
                        let msg = tpl.message || greetingTemplate;
                        let firstWord = member.name.split(' ')[0];
                        let formattedMsg = msg.includes(firstWord) || msg.toLowerCase().includes('dear ')
                            ? msg
                            : `Dear ${firstWord}, ${msg}`;
                        const verseStr = tpl.verseText ? `"${tpl.verseText}" — ${tpl.verseRef}` : '';
                        let imageUrl = tpl.imageUrl;
                        if (!imageUrl) {
                            const color = tpl.themeColor || '#3b82f6'; // Default blue
                            const pngBuffer = await generateCelebrationImage({
                                themeColor: color,
                                type: 'baptism',
                                name: member.name,
                                message: formattedMsg,
                                churchName: tpl.actualChurchName || tpl.churchName
                            });
                            const fileName = `automated_wishes/${member.churchId}/baptism_${Date.now()}.png`;
                            const file = getStorage().bucket().file(fileName);
                            const downloadToken = randomUUID();
                            try {
                                await file.save(pngBuffer, {
                                    contentType: 'image/png',
                                    metadata: { metadata: { firebaseStorageDownloadTokens: downloadToken } }
                                });
                                imageUrl = `https://firebasestorage.googleapis.com/v0/b/${file.bucket.name}/o/${encodeURIComponent(file.name)}?alt=media&token=${downloadToken}`;
                            }
                            catch (uploadErr) {
                                console.warn('⚠️ Local upload failed, using fallback image for WhatsApp testing');
                                imageUrl = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80';
                            }
                        }
                        await sendWhatsAppTemplateInternal(member.churchId, member.phone, 'birthday_card', 'en', imageUrl, 'Automated Baptism Wish', [formattedMsg, verseStr]);
                        console.log(`✅ WhatsApp Baptism message sent to ${member.name}`);
                    }
                }
                catch (waErr) {
                    console.error(`❌ Failed to send WhatsApp Baptism message to ${member.name}:`, waErr);
                }
            }
        }
        res.status(200).send(`Baptism automation completed. Processed ${baptisms.length} members.`);
    }
    catch (error) {
        console.error('Error in automatedDailyBaptisms:', error);
        res.status(500).send('Error executing baptism automation.');
    }
});
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
/**
 * 📣 ON BROADCAST CREATED TRIGGER (Gen 2)
 * Automatically sends push notifications when a new broadcast is added to Firestore (e.g. Emergency Meeting or custom admin updates)
 */
export const processBroadcastPushNotifications = functionsCompat
    .region('us-central1')
    .firestore
    .document('churches/{churchId}/broadcasts/{messageId}')
    .onCreate(async (snapshot, context) => {
    if (!snapshot) {
        console.log('No data associated with the event');
        return;
    }
    const data = snapshot.data();
    if (!data)
        return;
    // Skip if silent/already handled by scheduler
    if (data.silent === true) {
        console.log(`🛑 Skipping broadcast push for silent document: ${context.params.messageId}`);
        return;
    }
    const title = data.title || 'Church Update';
    const body = data.content || '';
    const type = data.type || 'general';
    console.log(`🔔 onBroadcastCreatedV2 fired for: [${title}] type: [${type}]`);
    try {
        const db = getDb();
        let query = db.collection('users');
        const churchId = context.params.churchId;
        if (churchId) {
            query = query.where('primaryChurchId', '==', churchId);
        }
        // Filter by target phone number if provided (for individual greetings)
        if (data.targetPhone) {
            // We do NOT use query.where() here because if the DB stores +91... it will fail the lexicographical >= check
            // We will rely on the in-memory .includes() check below instead.
        }
        const snapshotUsers = await query.get();
        const tokenSet = new Set();
        snapshotUsers.forEach((doc) => {
            const uData = doc.data();
            // If targetPhone is provided, we do a stricter match since Firestore where clauses on strings can be imprecise
            if (data.targetPhone && uData.phone) {
                const rawDigits = data.targetPhone.replace(/\D/g, '');
                const last10 = rawDigits.slice(-10);
                if (!uData.phone.includes(last10))
                    return;
            }
            if (uData.fcmToken)
                tokenSet.add(uData.fcmToken);
        });
        const tokens = Array.from(tokenSet);
        if (tokens.length === 0) {
            console.log('🛑 No registered FCM tokens found.');
            return;
        }
        const plainBody = stripHtml(body);
        const message = {
            notification: {
                title,
                body: plainBody.length > 200 ? plainBody.substring(0, 197) + '...' : plainBody
            },
            data: {
                type,
                id: context.params.messageId
            },
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    priority: 'max',
                    channelId: 'church_alerts'
                }
            },
            apns: {
                headers: {
                    'apns-priority': '10'
                },
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1
                    }
                }
            },
            tokens: tokens
        };
        const response = await getMsg().sendEachForMulticast(message);
        console.log(`✅ Broadcast push delivered: ${response.successCount} success, ${response.failureCount} failed.`);
    }
    catch (error) {
        console.error('Error sending broadcast push:', error);
    }
});
/**
 * 📤 UPLOAD EVENT IMAGE
 */
export const uploadEventImage = onCall({ invoker: 'public' }, async (request) => {
    try {
        const base64Data = request.data?.image;
        const fileName = request.data?.fileName || `img_${Date.now()}.jpg`;
        if (!base64Data) {
            throw new HttpsError('invalid-argument', 'Image data is required');
        }
        const bucket = getStorage().bucket('church-mobile-app-b7e27-event-banners');
        const file = bucket.file(`events/${fileName}`);
        await file.save(Buffer.from(base64Data, 'base64'), {
            metadata: {
                contentType: 'image/jpeg',
            }
        });
        // Make the file publicly accessible
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
        return { success: true, url: publicUrl };
    }
    catch (error) {
        console.error('uploadEventImage Error:', error);
        throw new HttpsError('internal', error.message);
    }
});
/**
 * Helper to fetch a URL using global fetch (Node 18+)
 */
async function fetchPage(url) {
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
        }
    });
    return res.text();
}
/**
 * ⏰ YOUTUBE LIVE CHECK SCHEDULER
 * Runs every 5 minutes to check if YouTube channel is live
 */
export const checkYouTubeLive = onSchedule('*/5 * * * *', async (event) => {
    try {
        console.log('⏰ Checking YouTube Live status...');
        const url = 'https://www.youtube.com/@Brothersinchristfellowship/live';
        const html = await fetchPage(url).catch(() => '');
        // Check if the stream is live
        const isLive = html.includes('"isLive":true') || html.includes('LIVE_STREAM') || html.includes('"style":"LIVE"');
        // Try to find the videoId
        let videoId;
        const match = html.match(/"liveStreamability".*?"videoId":"([^"]+)"/) || html.match(/"videoRenderer".*?"videoId":"([^"]+)"/);
        if (match && match[1]) {
            videoId = match[1];
        }
        const liveUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : url;
        const db = getDb();
        const liveRef = db.collection('churches').doc(DEFAULT_CHURCH_ID).collection('settings').doc('youtube_live');
        const liveSnap = await liveRef.get();
        const prevState = liveSnap.exists ? liveSnap.data() : { isLive: false };
        // Save new state
        await liveRef.set({
            isLive,
            url: liveUrl,
            videoId: videoId || '',
            lastChecked: FieldValue.serverTimestamp()
        }, { merge: true });
        // State transition: was offline, now live!
        if (isLive && !prevState?.isLive) {
            console.log('🚨 YouTube Live Stream detected! Sending notifications...');
            // 1. Add to broadcasts
            const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
            const docRef = await db.collection('churches').doc(DEFAULT_CHURCH_ID).collection('broadcasts').add({
                title: '🎥 YouTube Live Stream Started!',
                content: 'Brothers in Christ Fellowship is now LIVE on YouTube. Click to join the stream and worship with us! 🎥🙏',
                date: dateStr,
                type: 'youtube_live',
                url: liveUrl,
                silent: true, // skip standard Gen1 trigger so we can send customized push
                createdAt: FieldValue.serverTimestamp()
            });
            // 2. Fetch all user tokens
            const snapshotUsers = await db.collection('users').get();
            const tokenSet = new Set();
            snapshotUsers.forEach((doc) => {
                const uData = doc.data();
                if (uData.fcmToken)
                    tokenSet.add(uData.fcmToken);
            });
            const tokens = Array.from(tokenSet);
            if (tokens.length > 0) {
                const message = {
                    notification: {
                        title: '🚨 We are Live on YouTube!',
                        body: 'Join the Brothers in Christ Fellowship live stream now! 🎥🙏'
                    },
                    data: {
                        type: 'youtube_live',
                        url: liveUrl,
                        id: docRef.id
                    },
                    android: {
                        priority: 'high',
                        notification: {
                            sound: 'default',
                            priority: 'max',
                            channelId: 'church_alerts'
                        }
                    },
                    apns: {
                        headers: {
                            'apns-priority': '10'
                        },
                        payload: {
                            aps: {
                                sound: 'default',
                                badge: 1
                            }
                        }
                    },
                    tokens: tokens
                };
                const response = await getMsg().sendEachForMulticast(message);
                console.log(`✅ YouTube Live push delivered: ${response.successCount} success, ${response.failureCount} failed.`);
            }
        }
    }
    catch (error) {
        console.error('Error in checkYouTubeLive scheduler:', error);
    }
});
/**
 * 📢 TRIGGER TEST YOUTUBE LIVE NOTIFICATION
 */
export const triggerTestYouTubeLive = onCall({ invoker: 'public' }, async (request) => {
    try {
        const liveUrl = request.data?.url || 'https://www.youtube.com/@Brothersinchristfellowship/live';
        const db = getDb();
        // Save to Firestore first
        const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        const docRef = await db.collection('churches').doc(DEFAULT_CHURCH_ID).collection('broadcasts').add({
            title: '🎥 YouTube Live Stream Started!',
            content: 'Brothers in Christ Fellowship is now LIVE on YouTube. Click to join the stream and worship with us! 🎥🙏',
            date: dateStr,
            type: 'youtube_live',
            url: liveUrl,
            silent: true,
            createdAt: FieldValue.serverTimestamp()
        });
        const snapshotUsers = await db.collection('users').get();
        const tokenSet = new Set();
        snapshotUsers.forEach((doc) => {
            const uData = doc.data();
            if (uData.fcmToken)
                tokenSet.add(uData.fcmToken);
        });
        const tokens = Array.from(tokenSet);
        if (tokens.length === 0) {
            return { success: false, message: 'No registered user tokens found' };
        }
        const message = {
            notification: {
                title: '🚨 We are Live on YouTube!',
                body: 'Join the Brothers in Christ Fellowship live stream now! 🎥🙏'
            },
            data: {
                type: 'youtube_live',
                url: liveUrl,
                id: docRef.id
            },
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    priority: 'max',
                    channelId: 'church_alerts'
                }
            },
            apns: {
                headers: {
                    'apns-priority': '10'
                },
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1
                    }
                }
            },
            tokens: tokens
        };
        const response = await getMsg().sendEachForMulticast(message);
        return { success: true, sent: response.successCount, failed: response.failureCount, broadcastId: docRef.id };
    }
    catch (error) {
        console.error('triggerTestYouTubeLive Error:', error);
        throw new HttpsError('internal', error.message);
    }
});
export const testBdaysV10 = functionsCompat.https.onRequest(async (req, res) => {
    try {
        const db = getDb();
        const settingsDoc = await db.collection('churches').doc(DEFAULT_CHURCH_ID).collection('settings').doc('notifications').get();
        const settings = settingsDoc.data();
        if (settings && settings.birthdayNotif && settings.birthdayNotif.enabled === false) {
            console.log('Birthday greetings disabled.');
            return;
        }
        const today = new Date();
        const m = today.getMonth() + 1;
        const d = today.getDate();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const currentMonthStr = monthNames[today.getMonth()];
        const churchesSnap = await db.collection('churches').where('whatsappIntegrationEnabled', '==', true).where('automatedWhatsappWishesEnabled', '==', true).get();
        const enabledChurchIds = new Set();
        const churchTemplates = new Map();
        churchesSnap.forEach((doc) => {
            enabledChurchIds.add(doc.id);
            const data = doc.data();
            const monthly = data.monthlyCelebrationTemplates;
            const fallback = data.automatedWeCelebrationTemplate || {};
            const tpl = (monthly && monthly[currentMonthStr]) ? monthly[currentMonthStr] : fallback;
            tpl.actualChurchName = data.name || data.churchName || '';
            churchTemplates.set(doc.id, tpl);
        });
        const legacyMembersSnap = await db.collection('members').get();
        const legacyMembers = [];
        legacyMembersSnap.forEach((doc) => {
            const data = doc.data();
            if (data.dob && data.status === 'Active')
                legacyMembers.push({ id: doc.id, ...data });
        });
        const multiTenantMembersSnap = await db.collectionGroup('members').get();
        const multiTenantMembers = [];
        multiTenantMembersSnap.forEach((doc) => {
            const data = doc.data();
            if (data.dob && data.status === 'Active')
                multiTenantMembers.push({ id: doc.id, churchId: doc.ref.parent.parent?.id, ...data });
        });
        const allMembers = [...legacyMembers, ...multiTenantMembers];
        const uniqueMembers = new Map();
        allMembers.forEach(m => {
            if (m.phone && !uniqueMembers.has(m.phone))
                uniqueMembers.set(m.phone, m);
        });
        const dedupedMembers = Array.from(uniqueMembers.values());
        let count = 0;
        for (const member of dedupedMembers) {
            if (!member.dob)
                continue;
            const [year, monthStr, dayStr] = member.dob.split('-');
            if (!monthStr || !dayStr)
                continue;
            if (parseInt(monthStr) === m && parseInt(dayStr) === d) {
                count++;
                const targetChurchId = member.churchId || DEFAULT_CHURCH_ID;
                const bdayRef = db.collection('churches').doc(targetChurchId).collection('broadcasts').doc();
                await bdayRef.set({
                    title: `🎂 Happy Birthday ${member.name}!`,
                    content: `Wishing you a very Happy Birthday! May God bless you abundantly and fulfill all your prayers today. 🙏🎈`,
                    date: today.toISOString(),
                    type: 'birthday',
                    category: 'Birthday',
                    author: 'Church Admin',
                    likes: [],
                    comments: 0,
                    targetPhone: member.phone
                });
                const tokenSnap = await db.collection('users').where('phone', '==', member.phone).get();
                if (!tokenSnap.empty) {
                    const userDoc = tokenSnap.docs[0];
                    const userData = userDoc?.data();
                    if (userData?.fcmToken) {
                        await getMsg().send({
                            token: userData.fcmToken,
                            notification: { title: `🎂 Happy Birthday ${member.name}!`, body: 'May God bless you abundantly today! Tap to view.' },
                            data: { type: 'birthday', id: bdayRef.id }
                        });
                    }
                }
            }
        }
        console.log(`Done bdays. Count: ${count}`);
    }
    catch (error) {
        res.status(500).send(error.message);
    }
});
export const testAnnivsV1 = functionsCompat.https.onRequest(async (req, res) => {
    try {
        const db = getDb();
        const settingsDoc = await db.collection('churches').doc(DEFAULT_CHURCH_ID).collection('settings').doc('notifications').get();
        const settings = settingsDoc.data();
        if (settings && settings.anniversaryNotif && settings.anniversaryNotif.enabled === false) {
            console.log('Annivs disabled.');
            return;
        }
        const today = new Date();
        const m = today.getMonth() + 1;
        const d = today.getDate();
        const legacyMembersSnap = await db.collection('members').get();
        const legacyMembers = [];
        legacyMembersSnap.forEach((doc) => {
            const data = doc.data();
            if (data.weddingAnniversary && data.status === 'Active')
                legacyMembers.push({ id: doc.id, ...data });
        });
        const multiTenantMembersSnap = await db.collectionGroup('members').get();
        const multiTenantMembers = [];
        multiTenantMembersSnap.forEach((doc) => {
            const data = doc.data();
            if (data.weddingAnniversary && data.status === 'Active')
                multiTenantMembers.push({ id: doc.id, churchId: doc.ref.parent.parent?.id, ...data });
        });
        const allMembers = [...legacyMembers, ...multiTenantMembers];
        const uniqueMembers = new Map();
        allMembers.forEach(mem => {
            if (mem.phone && !uniqueMembers.has(mem.phone))
                uniqueMembers.set(mem.phone, mem);
        });
        const dedupedMembers = Array.from(uniqueMembers.values());
        let count = 0;
        for (const ann of dedupedMembers) {
            if (!ann.weddingAnniversary)
                continue;
            const [year, monthStr, dayStr] = ann.weddingAnniversary.split('-');
            if (!monthStr || !dayStr)
                continue;
            if (parseInt(monthStr) === m && parseInt(dayStr) === d) {
                count++;
                const targetChurchId = ann.churchId || DEFAULT_CHURCH_ID;
                const annRef = db.collection('churches').doc(targetChurchId).collection('broadcasts').doc();
                await annRef.set({
                    title: `💐 Happy Wedding Anniversary ${ann.name}!`,
                    content: `Wishing you a wonderful wedding anniversary! May God bless your home with love, joy, and peace. 💒💖`,
                    date: today.toISOString(),
                    type: 'anniversary',
                    category: 'Anniversary',
                    author: 'Church Admin',
                    likes: [],
                    comments: 0,
                    targetPhone: ann.phone
                });
                const tokenSnap = await db.collection('users').where('phone', '==', ann.phone).get();
                if (!tokenSnap.empty) {
                    const userDoc = tokenSnap.docs[0];
                    const userData = userDoc?.data();
                    if (userData?.fcmToken) {
                        await getMsg().send({
                            token: userData.fcmToken,
                            notification: { title: `💐 Happy Anniversary ${ann.name}!`, body: 'May God bless your home with love! Tap to view.' },
                            data: { type: 'anniversary', id: annRef.id }
                        });
                    }
                }
            }
        }
        console.log(`Done annivs. Count: ${count}`);
    }
    catch (error) {
        res.status(500).send(error.message);
    }
});
export const testBaptismsV1 = functionsCompat.https.onRequest(async (req, res) => {
    try {
        const db = getDb();
        const today = new Date();
        const m = today.getMonth() + 1;
        const d = today.getDate();
        const legacyMembersSnap = await db.collection('members').get();
        const legacyMembers = [];
        legacyMembersSnap.forEach((doc) => {
            const data = doc.data();
            if (data.baptismDate && data.status === 'Active')
                legacyMembers.push({ id: doc.id, ...data });
        });
        const multiTenantMembersSnap = await db.collectionGroup('members').get();
        const multiTenantMembers = [];
        multiTenantMembersSnap.forEach((doc) => {
            const data = doc.data();
            if (data.baptismDate && data.status === 'Active')
                multiTenantMembers.push({ id: doc.id, churchId: doc.ref.parent.parent?.id, ...data });
        });
        const allMembers = [...legacyMembers, ...multiTenantMembers];
        const uniqueMembers = new Map();
        allMembers.forEach(mem => {
            if (mem.phone && !uniqueMembers.has(mem.phone))
                uniqueMembers.set(mem.phone, mem);
        });
        const dedupedMembers = Array.from(uniqueMembers.values());
        let count = 0;
        for (const member of dedupedMembers) {
            if (!member.baptismDate)
                continue;
            const [year, monthStr, dayStr] = member.baptismDate.split('-');
            if (!monthStr || !dayStr)
                continue;
            if (parseInt(monthStr) === m && parseInt(dayStr) === d) {
                count++;
                const targetChurchId = member.churchId || DEFAULT_CHURCH_ID;
                const bdayRef = db.collection('churches').doc(targetChurchId).collection('broadcasts').doc();
                await bdayRef.set({
                    title: `🕊️ Happy Baptism Anniversary ${member.name}!`,
                    content: `Happy Baptism Anniversary! May you continue to grow in faith and walk in His light. 🙏🕊️`,
                    date: today.toISOString(),
                    type: 'celebration',
                    category: 'Baptism',
                    author: 'Church Admin',
                    likes: [],
                    comments: 0,
                    targetPhone: member.phone
                });
                const tokenSnap = await db.collection('users').where('phone', '==', member.phone).get();
                if (!tokenSnap.empty) {
                    const userDoc = tokenSnap.docs[0];
                    const userData = userDoc?.data();
                    if (userData?.fcmToken) {
                        await getMsg().send({
                            token: userData.fcmToken,
                            notification: { title: `🕊️ Happy Baptism Anniversary ${member.name}!`, body: 'May you continue to grow in faith! Tap to view.' },
                            data: { type: 'baptism', id: bdayRef.id }
                        });
                    }
                }
            }
        }
        console.log(`Done baptisms. Count: ${count}`);
    }
    catch (error) {
        res.status(500).send(error.message);
    }
});
export * from './payments.js';
export * from './checkPaymentStatus.js';
/**
 * 🎥 CREATE GOOGLE MEET (REST API)
 * Creates an "OPEN" Google Meet link using a Service Account
 */
export const createGoogleMeet = onCall({ invoker: 'public' }, async (request) => {
    try {
        const { churchId, topic, bibleBook, teacher, startTime, endTime, description } = request.data;
        if (!churchId)
            throw new HttpsError('invalid-argument', 'churchId is required');
        // 1. Authenticate with Google API using Service Account
        // NOTE: This assumes you have placed your Google Service Account key at:
        // functions/src/config/google-credentials.json 
        // AND that the service account is configured in Google Workspace to allow OPEN spaces.
        const { GoogleAuth } = await import('google-auth-library');
        // We catch initialization errors in case the user hasn't set up the JSON file yet.
        let auth;
        try {
            auth = new GoogleAuth({
                keyFilename: './src/config/google-credentials.json',
                scopes: ['https://www.googleapis.com/auth/meetings.space.created'],
            });
        }
        catch (e) {
            throw new Error('Google credentials not found on backend. Please configure google-credentials.json in functions/src/config/');
        }
        const client = await auth.getClient();
        // 2. Call the Google Meet REST API to create an OPEN space
        const meetResponse = await client.request({
            url: 'https://meet.googleapis.com/v2/spaces',
            method: 'POST',
            data: {
                config: {
                    accessType: 'OPEN', // Allows anyone to join without knocking
                }
            }
        });
        const meetingUri = meetResponse.data.meetingUri;
        if (!meetingUri)
            throw new Error('Failed to generate Google Meet link');
        // 3. Save to Firestore
        const db = getDb();
        const payload = {
            title: topic || 'Online Meeting',
            bibleBook: bibleBook || '',
            teacher: teacher || '',
            description: description || '',
            provider: 'google_meet',
            meetingLink: meetingUri,
            startTime: startTime ? new Date(startTime) : new Date(),
            endTime: endTime ? new Date(endTime) : new Date(new Date().getTime() + 60 * 60 * 1000),
            status: 'upcoming',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };
        const docRef = await db.collection('churches').doc(churchId).collection('online_meetings').add(payload);
        // 4. Send Push Notification to Church Members
        const titleText = `Live Meeting Scheduled: ${payload.title}`;
        const bodyText = `${teacher ? teacher + ' will be teaching' : 'Join us'} on ${payload.startTime.toLocaleDateString()}. Tap to view details.`;
        const usersSnap = await db.collection('users').get();
        const tokens = new Set();
        usersSnap.forEach((doc) => {
            const data = doc.data();
            if (data.fcmToken)
                tokens.add(data.fcmToken);
        });
        if (tokens.size > 0) {
            const message = {
                notification: { title: titleText, body: bodyText },
                data: { type: 'meeting', meetingId: docRef.id, link: meetingUri },
                tokens: Array.from(tokens),
                android: { priority: 'high' },
            };
            await getMsg().sendEachForMulticast(message);
        }
        return { success: true, meetingUri, meetingId: docRef.id };
    }
    catch (error) {
        console.error('createGoogleMeet Error:', error);
        throw new HttpsError('internal', error.message || 'Unknown error creating Google Meet');
    }
});
export * from './notifications.js';
export { createRazorpayOrderV4, razorpayWebhookV1, createRazorpayDonationOrderV6, verifyRazorpayDonationV6 } from './razorpay.js';
//# sourceMappingURL=index.js.map