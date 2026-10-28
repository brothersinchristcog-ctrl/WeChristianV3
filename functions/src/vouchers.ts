import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Callable Cloud Function: redeemVoucherV1
 * Validates and atomically redeems a voucher code for a church.
 * Calculation: New Expiry = max(Current Subscription Expiry, Current Date) + durationDays
 */
export const redeemVoucherV1 = onCall(async (request) => {
  try {
    const { code, churchId, churchName, userId, userName } = request.data || {};

    if (!code || typeof code !== 'string') {
      throw new HttpsError('invalid-argument', 'Voucher code is required.');
    }
    if (!churchId || typeof churchId !== 'string') {
      throw new HttpsError('invalid-argument', 'Church ID is required.');
    }

    const normalizedCode = code.trim().toUpperCase().replace(/\s+/g, '');
    const db = getFirestore();

    const result = await db.runTransaction(async (transaction) => {
      const voucherRef = db.collection('vouchers').doc(normalizedCode);
      const churchRef = db.collection('churches').doc(churchId);

      // 1. Fetch Voucher Doc
      const voucherDoc = await transaction.get(voucherRef);
      if (!voucherDoc.exists) {
        throw new HttpsError('not-found', 'Invalid voucher code. Please check and try again.');
      }

      const voucherData = voucherDoc.data();
      if (!voucherData) {
        throw new HttpsError('not-found', 'Voucher data is empty.');
      }

      // 2. Validate Voucher Status
      if (voucherData.status === 'redeemed') {
        throw new HttpsError('already-exists', 'This voucher code has already been redeemed.');
      }
      if (voucherData.status === 'disabled') {
        throw new HttpsError('failed-precondition', 'This voucher code has been disabled. Please contact support.');
      }

      // 3. Validate Voucher Expiry (how long code is available to be redeemed)
      const now = new Date();
      if (voucherData.voucherExpiryDate) {
        const expDate = new Date(voucherData.voucherExpiryDate);
        if (expDate < now) {
          throw new HttpsError('failed-precondition', `This voucher expired on ${expDate.toLocaleDateString()} and can no longer be redeemed.`);
        }
      }

      // 4. Validate Church Restriction if specified
      if (voucherData.assignedChurchId && voucherData.assignedChurchId !== churchId) {
        throw new HttpsError('permission-denied', 'This voucher code is designated for another church.');
      }

      // 5. Fetch Church Doc
      const churchDoc = await transaction.get(churchRef);
      if (!churchDoc.exists) {
        throw new HttpsError('not-found', 'Church record not found.');
      }

      const churchData = churchDoc.data();

      // 6. Calculate New Subscription Expiry (Do not overwrite or reduce existing subscription)
      // New Expiry = max(Current Subscription Expiry, Current Date) + durationDays
      let baseDate = now;
      const currentValidUntil = churchData?.subscription?.validUntil;
      const trialEndsAt = churchData?.subscription?.trialEndsAt;

      if (currentValidUntil && new Date(currentValidUntil) > now) {
        baseDate = new Date(currentValidUntil);
      } else if (trialEndsAt && new Date(trialEndsAt) > now) {
        baseDate = new Date(trialEndsAt);
      } else if (churchData?.createdAt) {
        const createdDate = churchData.createdAt.toDate ? churchData.createdAt.toDate() : new Date(churchData.createdAt);
        const trialEnd = new Date(createdDate.getTime() + 60 * 24 * 60 * 60 * 1000);
        if (trialEnd > now) {
          baseDate = trialEnd;
        }
      }

      const durationDays = voucherData.durationDays || (voucherData.durationMonths ? voucherData.durationMonths * 30 : (voucherData.durationYears ? voucherData.durationYears * 365 : 365));
      const newExpiry = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

      const redemptionDateIso = now.toISOString();
      const newExpiryIso = newExpiry.toISOString();
      const transactionId = `VOUCHER_${normalizedCode}_${Date.now()}`;

      // 7. Update Voucher
      transaction.update(voucherRef, {
        status: 'redeemed',
        redeemedAt: redemptionDateIso,
        redeemedChurchId: churchId,
        redeemedChurchName: churchName || churchData?.name || 'Church',
        redeemedByUserId: userId || null,
        redeemedByUserName: userName || 'Admin',
      });

      // 8. Update Church Main Doc (same source of truth as paid subscriptions)
      transaction.update(churchRef, {
        'subscription.status': 'active',
        'subscription.tier': 'premium',
        'subscriptionTier': 'premium',
        'subscription.validUntil': newExpiryIso,
        'subscription.lastVoucherCode': normalizedCode,
        'subscription.voucherRedeemedAt': redemptionDateIso,
        'subscription.lastPaymentId': transactionId,
        'isActive': true,
      });

      // 9. Add record to church subscriptions subcollection (Audit Ledger)
      const receiptRef = churchRef.collection('subscriptions').doc(transactionId);
      transaction.set(receiptRef, {
        type: 'voucher',
        voucherCode: normalizedCode,
        plan: 'annual',
        amount: 0,
        status: 'active',
        durationDays: durationDays,
        validUntil: newExpiryIso,
        paidAt: redemptionDateIso,
        paymentId: transactionId,
        redeemedBy: userId || null,
        redeemedByName: userName || 'Church Admin',
        notes: `Redeemed Voucher: ${normalizedCode} (${durationDays} Days Subscription)`,
        platform: 'mobile',
      });

      return {
        success: true,
        message: `Voucher ${normalizedCode} applied successfully! Subscription active until ${newExpiry.toLocaleDateString()}.`,
        validUntil: newExpiryIso,
        voucherCode: normalizedCode,
        durationDays: durationDays,
        previousExpiry: baseDate !== now ? baseDate.toISOString() : undefined,
      };
    });

    return result;
  } catch (error: any) {
    console.error('redeemVoucherV1 Error:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', error.message || 'Error redeeming voucher code.');
  }
});

/**
 * Callable Cloud Function: getVouchersAdminV1
 * Fetches all vouchers using Admin SDK (100% immune to firestore/permission-denied).
 */
export const getVouchersAdminV1 = onCall(async (request) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('vouchers').orderBy('createdAt', 'desc').get();
    const vouchers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return { success: true, vouchers };
  } catch (error: any) {
    console.error('getVouchersAdminV1 Error:', error);
    throw new HttpsError('internal', error.message || 'Failed to fetch vouchers');
  }
});

/**
 * Callable Cloud Function: createVoucherAdminV1
 * Creates a single voucher using Admin SDK.
 */
export const createVoucherAdminV1 = onCall(async (request) => {
  try {
    const { code, durationDays, voucherExpiryDate, batchTag, createdBy, createdByName } = request.data || {};
    if (!code) throw new HttpsError('invalid-argument', 'Code is required');

    const normalizedCode = code.trim().toUpperCase().replace(/\s+/g, '');
    const db = getFirestore();
    const docRef = db.collection('vouchers').doc(normalizedCode);
    const existing = await docRef.get();
    if (existing.exists) {
      throw new HttpsError('already-exists', 'A voucher with this code already exists.');
    }

    await docRef.set({
      code: normalizedCode,
      status: 'unused',
      durationDays: durationDays || 365,
      voucherExpiryDate: voucherExpiryDate || null,
      createdAt: new Date().toISOString(),
      createdBy: createdBy || 'admin',
      createdByName: createdByName || 'Platform Admin',
      batchTag: batchTag || 'Manual',
    });

    return { success: true, code: normalizedCode };
  } catch (error: any) {
    console.error('createVoucherAdminV1 Error:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', error.message || 'Failed to create voucher');
  }
});

/**
 * Callable Cloud Function: bulkCreateVouchersAdminV1
 * Generates up to 100 vouchers in batch using Admin SDK.
 */
export const bulkCreateVouchersAdminV1 = onCall(async (request) => {
  try {
    const { count, prefix, durationDays, voucherExpiryDate, batchTag, createdBy, createdByName } = request.data || {};
    const numCount = Math.min(100, Math.max(1, parseInt(count, 10) || 10));
    const normalizedPrefix = (prefix || 'WC').trim().toUpperCase();
    const db = getFirestore();
    const batch = db.batch();
    const nowIso = new Date().toISOString();

    const digits = '23456789';
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const currentYear = new Date().getFullYear();
    const generatedCodes: string[] = [];

    for (let i = 0; i < numCount; i++) {
      let code = '';
      let attempts = 0;
      do {
        const num = digits.charAt(Math.floor(Math.random() * digits.length));
        let threeLetters = '';
        for (let j = 0; j < 3; j++) {
          threeLetters += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        code = `WC-${currentYear}-${num}${threeLetters}`;
        attempts++;
      } while (generatedCodes.includes(code) && attempts < 50);

      generatedCodes.push(code);
      const ref = db.collection('vouchers').doc(code);
      batch.set(ref, {
        code,
        status: 'unused',
        durationDays: durationDays || 365,
        voucherExpiryDate: voucherExpiryDate || null,
        createdAt: nowIso,
        createdBy: createdBy || 'admin',
        createdByName: createdByName || 'Platform Admin',
        batchTag: batchTag || `Batch_${Date.now()}`,
      });
    }

    await batch.commit();
    return { success: true, count: generatedCodes.length, codes: generatedCodes };
  } catch (error: any) {
    console.error('bulkCreateVouchersAdminV1 Error:', error);
    throw new HttpsError('internal', error.message || 'Failed to bulk generate vouchers');
  }
});

/**
 * Callable Cloud Function: toggleVoucherStatusAdminV1
 */
export const toggleVoucherStatusAdminV1 = onCall(async (request) => {
  try {
    const { code, newStatus } = request.data || {};
    if (!code || !newStatus) throw new HttpsError('invalid-argument', 'Code and new status required');
    const db = getFirestore();
    const ref = db.collection('vouchers').doc(code);
    await ref.update({
      status: newStatus,
      disabledAt: newStatus === 'disabled' ? new Date().toISOString() : null,
    });
    return { success: true };
  } catch (error: any) {
    console.error('toggleVoucherStatusAdminV1 Error:', error);
    throw new HttpsError('internal', error.message || 'Failed to update voucher status');
  }
});
