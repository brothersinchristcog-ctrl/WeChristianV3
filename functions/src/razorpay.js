import * as functions from 'firebase-functions/v1';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
/**
 * Helper to get the Razorpay instance
 */
const getRazorpayInstance = () => {
    const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_live_TRsx05AgR0CwMk';
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'Vz8oYPOYf0yOJ2st13r0abn0';
    if (!key_id || !key_secret) {
        console.error('Razorpay keys are missing from environment variables.');
    }
    return new Razorpay({
        key_id: key_id,
        key_secret: key_secret,
    });
};
/**
 * Callable function to create a Razorpay order before checkout
 */
export const createRazorpayOrderV4 = functions.https.onCall(async (data, context) => {
    try {
        const { amount, receipt } = data;
        if (!amount || amount <= 0) {
            throw new functions.https.HttpsError('invalid-argument', 'Valid amount in INR is required');
        }
        const instance = getRazorpayInstance();
        const options = {
            amount: amount * 100, // amount in the smallest currency unit (paise)
            currency: "INR",
            receipt: receipt || `receipt_${Date.now()}`
        };
        const order = await instance.orders.create(options);
        return {
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID || 'rzp_live_TRsx05AgR0CwMk'
        };
    }
    catch (error) {
        console.error('createRazorpayOrder Error:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to create Razorpay order');
    }
});
/**
 * Webhook to listen to Razorpay payment events
 */
export const razorpayWebhookV1 = functions.https.onRequest(async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'YOUR_WEBHOOK_SECRET';
    const signature = req.headers['x-razorpay-signature'];
    if (!signature || Array.isArray(signature)) {
        res.status(400).send('Signature missing or invalid');
        return;
    }
    const expectedSignature = crypto.createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');
    if (expectedSignature !== signature) {
        res.status(400).send('Invalid signature');
        return;
    }
    try {
        const event = req.body.event;
        const payment = req.body.payload.payment.entity;
        const db = getFirestore();
        // Optionally handle async webhook verification logic here
        if (event === 'payment.captured' || event === 'payment.authorized') {
            console.log(`Payment successful for order: ${payment.order_id}, payment: ${payment.id}`);
            // NOTE: Subscriptions are currently activated optimistically in the app via the Razorpay success handler.
            // If you want backend verification to activate it, you can add logic here to update Firestore based on payment.notes or order tracking.
        }
        else if (event === 'payment.failed') {
            console.log(`Payment failed for order: ${payment.order_id}`);
        }
        res.status(200).send({ status: 'ok' });
    }
    catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).send('Internal Server Error');
    }
});
/**
 * Callable function to create a church-specific Razorpay order for Giving/Tithing
 */
export const createRazorpayDonationOrderV6 = functions.https.onCall(async (data, context) => {
    try {
        const { amount, churchId, purpose } = data;
        if (!amount) {
            throw new functions.https.HttpsError('invalid-argument', 'Amount is required');
        }
        if (!churchId) {
            throw new functions.https.HttpsError('invalid-argument', 'Church ID is required');
        }
        const db = getFirestore();
        const secretDoc = await db.collection('churches').doc(churchId).collection('secrets').doc('payment').get();
        const secrets = secretDoc.data();
        const keyId = secrets?.razorpayKeyId;
        const keySecret = secrets?.razorpayKeySecret;
        if (!keyId || !keySecret) {
            throw new functions.https.HttpsError('failed-precondition', 'Giving is not configured for this church yet.');
        }
        const instance = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });
        const options = {
            amount: amount * 100, // amount in the smallest currency unit (paise)
            currency: "INR",
            receipt: `donation_${Date.now()}`
        };
        const order = await instance.orders.create(options);
        return {
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: keyId // Send key to frontend for initialization
        };
    }
    catch (error) {
        console.error('createRazorpayDonationOrder Error:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Unknown error creating order');
    }
});
/**
 * Callable function to verify a church-specific Razorpay donation signature
 */
export const verifyRazorpayDonationV6 = functions.https.onCall(async (data, context) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, churchId, donationId } = data;
        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !churchId) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required payment verification data');
        }
        const db = getFirestore();
        const secretDoc = await db.collection('churches').doc(churchId).collection('secrets').doc('payment').get();
        const secrets = secretDoc.data();
        const keySecret = secrets?.razorpayKeySecret;
        if (!keySecret) {
            throw new functions.https.HttpsError('failed-precondition', 'Giving is not configured for this church yet.');
        }
        // Verify signature
        const hmac = crypto.createHmac('sha256', keySecret);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generated_signature = hmac.digest('hex');
        if (generated_signature !== razorpay_signature) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid payment signature');
        }
        // Payment is verified, update the donation record if donationId is provided
        if (donationId) {
            await db.collection('churches').doc(churchId).collection('donations').doc(donationId).update({
                status: 'SUCCESS',
                paymentId: razorpay_payment_id,
                updatedAt: FieldValue.serverTimestamp()
            });
        }
        return {
            success: true,
            message: 'Payment verified successfully'
        };
    }
    catch (error) {
        console.error('verifyRazorpayDonation Error:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Unknown error verifying payment');
    }
});
//# sourceMappingURL=razorpay.js.map