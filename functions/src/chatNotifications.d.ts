/**
 * Push notification trigger for new messages in church direct & group chats.
 */
export declare const onChatMessageCreated: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").QueryDocumentSnapshot | undefined, {
    churchId: string;
    chatId: string;
    messageId: string;
}>>;
//# sourceMappingURL=chatNotifications.d.ts.map