import * as functionsV1 from 'firebase-functions/v1';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import axios from 'axios';
import { onRequest, onCall, HttpsError } from 'firebase-functions/v2/https';

/**
 * Internal helper to send a WhatsApp Template (used by Cron Jobs)
 */
export const sendWhatsAppTemplateInternal = async (
  churchId: string,
  phoneNumber: string,
  templateName: string,
  languageCode: string = 'en',
  imageUrl?: string,
  logText?: string,
  bodyParams?: string[]
) => {
  if (!phoneNumber || !churchId) {
    throw new Error('Phone number and churchId are required');
  }

  // Format phone number to international format without + sign
  let formattedPhone = phoneNumber.replace(/\D/g, '');
  if (formattedPhone.length === 10) {
    formattedPhone = `91${formattedPhone}`; // Default to India if only 10 digits
  }

  const db = getFirestore();
  const secretsDoc = await db.collection('churches').doc(churchId).collection('secrets').doc('payment').get();
  const secrets = secretsDoc.data();

  let WA_ACCESS_TOKEN = "";
  let WA_PHONE_NUMBER_ID = "";

  if (secrets?.useWeChristianWhatsApp) {
    WA_ACCESS_TOKEN = "EAAbDAG4HrdcBR7CZCEl8CjzaZAO2kq0pw1H64slZC1n2QyRqHl6FO6x691ILR5jSeMuynh6p1uaashhbyD4UcOIVFbpUafsgab4YVOgAZAvPtwv7NzDa8yECxMg7BxKeBkzXOc3bPFfBaK1pJxyHcXo41ez5Afftlz5qt3PmZAZAgsUNKlvZAXihZAAFEMAsnQzadAZDZD";
    WA_PHONE_NUMBER_ID = "1183530004847802";
  } else {
    if (!secrets || !secrets.whatsappAccessToken || !secrets.whatsappPhoneId) {
      throw new Error('This church has not configured their WhatsApp credentials in Admin Settings.');
    }
    WA_ACCESS_TOKEN = secrets.whatsappAccessToken;
    WA_PHONE_NUMBER_ID = secrets.whatsappPhoneId;
  }

  const url = `https://graph.facebook.com/v17.0/${WA_PHONE_NUMBER_ID}/messages`;

  let payload: any = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: formattedPhone,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: languageCode
      },
      components: []
    }
  };

  if (imageUrl) {
    payload.template.components.push({
      type: "header",
      parameters: [
        {
          type: "image",
          image: {
            link: imageUrl
          }
        }
      ]
    });
  }

  if (bodyParams && bodyParams.length > 0) {
    payload.template.components.push({
      type: "body",
      parameters: bodyParams.map(text => ({
        type: "text",
        text: text || " "
      }))
    });
  }

  const response = await axios.post(url, payload, {
    headers: {
      'Authorization': `Bearer ${WA_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  if (response.data && response.data.messages) {
    const messageId = response.data.messages[0].id;
    // Log outbound message
    await db.collection('churches').doc(churchId).collection('whatsappMessages').doc(messageId).set({
      phoneNumberId: WA_PHONE_NUMBER_ID,
      from: formattedPhone, // Remote phone
      text: logText || `[Template] ${templateName}`,
      messageId,
      churchId,
      direction: 'outbound',
      status: 'sent',
      timestamp: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp()
    }, { merge: true });

    return { success: true, messageId };
  } else {
    throw new Error("Failed to send WhatsApp message");
  }
};

/**
 * Send a WhatsApp Greeting using the Meta Cloud API with Church BYOC architecture
 */
export const sendWAGreetingLatest = onCall({ invoker: 'public' }, async (request) => {
    const data = request.data;

  try {
    const { phoneNumber, messageText, type, churchId, imageUrl } = data;

    if (!phoneNumber || !messageText) {
      throw new HttpsError('invalid-argument', 'Phone number and message text are required');
    }

    if (!churchId) {
      throw new HttpsError('invalid-argument', 'churchId is required for Multi-Tenant WhatsApp integration');
    }

    // Format phone number to international format without + sign
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.length === 10) {
      formattedPhone = `91${formattedPhone}`; // Default to India if only 10 digits
    }

    // 1. Fetch Church's BYOC WhatsApp Credentials
    const db = getFirestore();
    const secretsDoc = await db.collection('churches').doc(churchId).collection('secrets').doc('payment').get();
    const secrets = secretsDoc.data();

    let WA_ACCESS_TOKEN = "";
    let WA_PHONE_NUMBER_ID = "";

    if (secrets?.useWeChristianWhatsApp) {
      // Use official We Christian Platform Account
      WA_ACCESS_TOKEN = "EAAbDAG4HrdcBR7CZCEl8CjzaZAO2kq0pw1H64slZC1n2QyRqHl6FO6x691ILR5jSeMuynh6p1uaashhbyD4UcOIVFbpUafsgab4YVOgAZAvPtwv7NzDa8yECxMg7BxKeBkzXOc3bPFfBaK1pJxyHcXo41ez5Afftlz5qt3PmZAZAgsUNKlvZAXihZAAFEMAsnQzadAZDZD";
      WA_PHONE_NUMBER_ID = "1183530004847802";
    } else {
      // Use Church's BYOC Account
      if (!secrets || !secrets.whatsappAccessToken || !secrets.whatsappPhoneId) {
        throw new HttpsError(
          'failed-precondition', 
          'This church has not configured their WhatsApp credentials in Admin Settings.'
        );
      }
      WA_ACCESS_TOKEN = secrets.whatsappAccessToken;
      WA_PHONE_NUMBER_ID = secrets.whatsappPhoneId;
    }

    // API Endpoint for WhatsApp Cloud API
    const url = `https://graph.facebook.com/v17.0/${WA_PHONE_NUMBER_ID}/messages`;

    // 2. Standard Message Payload
    let payload: any = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedPhone,
    };

    if (imageUrl) {
      payload.type = "image";
      payload.image = {
        link: imageUrl,
        caption: messageText
      };
    } else {
      payload.type = "text";
      payload.text = { 
        preview_url: false,
        body: messageText
      };
    }

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${WA_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.messages) {
      const messageId = response.data.messages[0].id;
      
      // Log outbound message
      await db.collection('churches').doc(churchId).collection('whatsappMessages').doc(messageId).set({
        phoneNumberId: WA_PHONE_NUMBER_ID,
        from: formattedPhone, // Remote phone
        text: imageUrl ? `[Image] ${messageText}` : messageText,
        messageId,
        churchId,
        direction: 'outbound',
        status: 'sent',
        timestamp: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp()
      }, { merge: true });

      return { success: true, messageId };
    } else {
      throw new Error("Failed to send WhatsApp message");
    }

  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error.response?.data || error);
    throw new HttpsError('internal', error.message || 'Failed to send WhatsApp message');
  }
});

/**
 * WhatsApp Webhook to receive incoming messages and status updates
 */
export const metaWebhookReceiver = onRequest({ cors: true, invoker: 'public' }, async (req, res) => {
  const VERIFY_TOKEN = "Wechristian_2026";

  // 1. Verification Request from Meta (GET)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
      } else {
        res.status(403).send('Forbidden');
      }
    } else {
      res.status(400).send('Bad Request');
    }
    return;
  }

  // 2. Incoming Webhook from Meta (POST)
  if (req.method === 'POST') {
    const body = req.body;

    // Check if it's a WhatsApp API event
    if (body.object) {
      if (
        body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0] &&
        body.entry[0].changes[0].value.messages &&
        body.entry[0].changes[0].value.messages[0]
      ) {
        const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id;
        const from = body.entry[0].changes[0].value.messages[0].from;
        const msgBody = body.entry[0].changes[0].value.messages[0].text?.body || '';
        const messageId = body.entry[0].changes[0].value.messages[0].id;
        const timestamp = body.entry[0].changes[0].value.messages[0].timestamp;

        console.log(`[WhatsApp Webhook] Incoming message from ${from} (Phone ID: ${phoneNumberId}): ${msgBody}`);

        // Save the incoming message to Firestore under the specific church
        try {
          const db = getFirestore();
          // Find the church that owns this phone number
          const secretsSnapshot = await db.collectionGroup('secrets').where('whatsappPhoneId', '==', phoneNumberId).limit(1).get();
          
          let churchId = 'unmapped'; // Fallback if we can't find the church
          const secretDoc = secretsSnapshot.docs[0];
          if (secretDoc && secretDoc.ref.parent.parent) {
            // secretDoc.ref path is churches/{churchId}/secrets/{secretId}
            churchId = secretDoc.ref.parent.parent.id || 'unmapped';
          }

          const targetCollection = churchId === 'unmapped' ? 
            db.collection('unmappedWhatsappMessages') : 
            db.collection('churches').doc(churchId).collection('whatsappMessages');

          await targetCollection.doc(messageId).set({
            phoneNumberId,
            from,
            text: msgBody,
            messageId,
            churchId,
            direction: 'inbound',
            timestamp: timestamp ? Timestamp.fromMillis(parseInt(timestamp) * 1000) : FieldValue.serverTimestamp(),
            status: 'received',
            createdAt: FieldValue.serverTimestamp()
          }, { merge: true });
        } catch (error) {
          console.error('[WhatsApp Webhook] Error saving message to Firestore:', error);
        }
        
      } else if (
        body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0] &&
        body.entry[0].changes[0].value.statuses
      ) {
        // Message status update (delivered, read, failed)
        const status = body.entry[0].changes[0].value.statuses[0];
        console.log(`[WhatsApp Webhook] Message ${status.id} status update: ${status.status}`);

        // Update the message status in Firestore
        try {
          // Find the message across all churches to update its status
          const db = getFirestore();
          const messageSnapshot = await db.collectionGroup('whatsappMessages').where('messageId', '==', status.id).limit(1).get();
          
          const msgDoc = messageSnapshot.docs[0];
          if (msgDoc) {
            await msgDoc.ref.update({
              status: status.status,
              updatedAt: FieldValue.serverTimestamp()
            });
          }
        } catch (error) {
          console.error('[WhatsApp Webhook] Error updating status in Firestore:', error);
        }
      }

      // Meta requires a 200 OK response within 20 seconds
      res.status(200).send('EVENT_RECEIVED');
    } else {
      res.status(404).send('Not Found');
    }
    return;
  }
});
