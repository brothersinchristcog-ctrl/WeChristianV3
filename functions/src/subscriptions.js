import * as functionsV1 from 'firebase-functions/v1';
import crypto from 'crypto';
import axios from 'axios';
// --- PHONEPE CREDENTIALS (REPLACE WITH YOUR LIVE KEYS) ---
const MERCHANT_ID = "PGTESTPAYUAT86"; // Example PhonePe UAT Merchant ID
const SALT_KEY = "96434309-7796-489d-8924-ab56988a6076"; // Example PhonePe UAT Salt Key
const SALT_INDEX = "1";
// Use "https://api.phonepe.com/apis/hermes" for LIVE
const PHONEPE_HOST_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";
/**
 * Generate a PhonePe Order and URL for Personal Subscription
 */
export const initPhonePe = functionsV1.https.onCall(async (data, context) => {
    try {
        const amount = data.amount; // Amount in paise
        const planId = data.planId;
        const userId = context.auth?.uid || `guest_${Date.now()}`;
        const transactionId = `T${Date.now()}`;
        if (!amount || amount <= 0) {
            throw new functionsV1.https.HttpsError('invalid-argument', 'Valid amount is required');
        }
        // PhonePe Payload Structure
        const payload = {
            merchantId: MERCHANT_ID,
            merchantTransactionId: transactionId,
            merchantUserId: userId,
            amount: amount,
            // redirectUrl: "wechristian://subscription-success", // Replace with your app's deep link URL
            redirectUrl: "exp://localhost:8081/--/subscription-success",
            redirectMode: "REDIRECT",
            callbackUrl: "https://us-central1-wechristian-4e6f6.cloudfunctions.net/phonePeCallback",
            mobileNumber: data.mobileNumber || "9999999999",
            paymentInstrument: {
                type: "PAY_PAGE"
            }
        };
        // 1. Base64 Encode Payload
        const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
        // 2. Generate Checksum (X-VERIFY)
        // SHA256(base64Payload + apiEndPoint + saltKey) + ### + saltIndex
        const apiEndPoint = "/pg/v1/pay";
        const stringToHash = base64Payload + apiEndPoint + SALT_KEY;
        const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
        const checksum = sha256 + "###" + SALT_INDEX;
        // 3. Make HTTP request to PhonePe
        const options = {
            method: 'POST',
            url: `${PHONEPE_HOST_URL}${apiEndPoint}`,
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'X-VERIFY': checksum
            },
            data: {
                request: base64Payload
            }
        };
        const response = await axios.request(options);
        // 4. Return Redirect URL to Client
        if (response.data.success) {
            return {
                success: true,
                transactionId: transactionId,
                redirectUrl: response.data.data.instrumentResponse.redirectInfo.url
            };
        }
        else {
            console.error("PhonePe Error:", response.data);
            throw new Error(response.data.message || "Failed to initiate PhonePe payment");
        }
    }
    catch (error) {
        console.error('Error creating PhonePe order:', error);
        throw new functionsV1.https.HttpsError('internal', error.message || 'Failed to create order');
    }
});
//# sourceMappingURL=subscriptions.js.map