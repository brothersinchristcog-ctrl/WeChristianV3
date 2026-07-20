/**
 * Internal helper to send a WhatsApp Template (used by Cron Jobs)
 */
export declare const sendWhatsAppTemplateInternal: (churchId: string, phoneNumber: string, templateName: string, languageCode?: string, imageUrl?: string, logText?: string, bodyParams?: string[]) => Promise<{
    success: boolean;
    messageId: any;
}>;
/**
 * Send a WhatsApp Greeting using the Meta Cloud API with Church BYOC architecture
 */
export declare const sendWAGreetingLatest: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    messageId: any;
}>, unknown>;
/**
 * WhatsApp Webhook to receive incoming messages and status updates
 */
export declare const metaWebhookReceiver: import("firebase-functions/v2/https").HttpsFunction;
//# sourceMappingURL=whatsapp.d.ts.map