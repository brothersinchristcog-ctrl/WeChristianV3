import * as functionsV1 from 'firebase-functions/v1';
export const sendWAGreeting = functionsV1.https.onCall(async (data, context) => {
    try {
        if (!data.phoneNumber || !data.messageText)
            throw new functionsV1.https.HttpsError('invalid-argument', 'Missing fields');
        return { success: true };
    }
    catch (e) {
        throw new functionsV1.https.HttpsError('internal', 'error');
    }
});
//# sourceMappingURL=testv1.js.map