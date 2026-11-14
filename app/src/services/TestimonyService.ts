import * as FileSystem from 'expo-file-system';
import { firestore, storage, FieldValue } from './firebaseConfig';
import FirestoreService from './FirestoreService';
import {
  Testimony,
  TestimonyAttachment,
  TestimonyPrivacy,
  TestimonyStatus,
  TestimonyType,
  TestimonyUploadConfig,
  DEFAULT_TESTIMONY_UPLOAD_CONFIG,
  LocalMediaSelection,
} from '../types/testimony';

export interface SubmitTestimonyInput {
  testimonyId?: string;
  churchId?: string;
  memberId: string;
  memberName?: string;
  memberPhotoUrl?: string | null;
  memberPhone?: string | null;
  title: string;
  description: string;
  testimonyType: TestimonyType;
  writtenContent: string;
  category?: string | null;
  videoStoragePath: string | null;
  videoDurationMs?: number | null;
  videoSizeBytes?: number | null;
  videoMimeType?: string | null;
  attachmentStoragePaths: TestimonyAttachment[];
  privacy: TestimonyPrivacy;
  publicConsentGranted: boolean;
}

export interface MemberSummary {
  id: string;
  name: string;
  photoURL: string | null;
  phone: string | null;
  role: string;
  exists: boolean;
}

// Helper function to safely check DocumentSnapshot existence in both Web and React Native Firebase
function checkDocExists(doc: any): boolean {
  if (!doc) return false;
  if (typeof doc.exists === 'function') return doc.exists();
  return Boolean(doc.exists);
}

class TestimonyService {
  private uploadConfig: TestimonyUploadConfig = { ...DEFAULT_TESTIMONY_UPLOAD_CONFIG };
  private _publicFeedCache = new Map<string, Testimony[]>();
  private _myTestimoniesCache = new Map<string, Testimony[]>();
  private _adminTestimoniesCache = new Map<string, Testimony[]>();

  getCachedPublicFeed(churchId?: string): Testimony[] | null {
    return this._publicFeedCache.get(this.resolveChurchId(churchId)) || null;
  }

  getCachedMyTestimonies(churchId: string, memberId: string): Testimony[] | null {
    if (!memberId) return null;
    return this._myTestimoniesCache.get(`${this.resolveChurchId(churchId)}:${memberId}`) || null;
  }

  getCachedAdminTestimonies(churchId?: string): Testimony[] | null {
    return this._adminTestimoniesCache.get(this.resolveChurchId(churchId)) || null;
  }

  getUploadConfig(): TestimonyUploadConfig {
    return { ...this.uploadConfig };
  }

  setUploadConfig(overrides: Partial<TestimonyUploadConfig>): void {
    this.uploadConfig = {
      ...this.uploadConfig,
      ...overrides,
    };
  }

  private resolveChurchId(churchId?: string | null): string {
    return (churchId && churchId.trim()) ? churchId.trim() : 'default';
  }

  private getCollectionRef(churchId?: string | null) {
    const targetChurchId = this.resolveChurchId(churchId);
    return firestore()
      .collection('churches')
      .doc(targetChurchId)
      .collection('testimonies');
  }

  generateTestimonyId(churchId?: string | null): string {
    return this.getCollectionRef(churchId).doc().id;
  }

  private getFileExtension(nameOrUri: string): string {
    const clean = (nameOrUri || '').split('?')[0].toLowerCase();
    const lastDot = clean.lastIndexOf('.');
    return lastDot >= 0 ? clean.substring(lastDot) : '';
  }

  async resolveFileSizeBytes(uri: string, fallbackSize?: number): Promise<number> {
    if (typeof fallbackSize === 'number' && fallbackSize > 0) {
      return fallbackSize;
    }
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists && typeof (info as any).size === 'number') {
        return (info as any).size;
      }
    } catch (e) {
      // Ignore file-system read error and fall back
    }
    return fallbackSize || 0;
  }

  async validateVideoSelection(file: LocalMediaSelection): Promise<{
    valid: boolean;
    error?: string;
    warning?: string;
    sizeBytes: number;
  }> {
    const config = this.getUploadConfig();
    const ext = this.getFileExtension(file.name || file.uri);
    const mime = (file.mimeType || '').toLowerCase();

    const extAllowed = config.allowedVideoExtensions.includes(ext);
    const mimeAllowed = config.allowedVideoMimeTypes.some((m) => mime.includes(m));

    if (!extAllowed && !mimeAllowed) {
      return {
        valid: false,
        error: `Unsupported video format. Please select an MP4 or MOV video.`,
        sizeBytes: file.sizeBytes || 0,
      };
    }

    const sizeBytes = await this.resolveFileSizeBytes(file.uri, file.sizeBytes);
    if (sizeBytes > config.maxVideoSizeBytes) {
      const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `Video size (${sizeMB} MB) exceeds the ${config.maxVideoSizeMB} MB maximum limit. Please choose a shorter or compressed video.`,
        sizeBytes,
      };
    }

    let warning: string | undefined;
    if (
      typeof file.durationMs === 'number' &&
      file.durationMs > config.recommendedVideoDurationSeconds * 1000
    ) {
      const mins = Math.round(file.durationMs / 60000);
      warning = `This video is ~${mins} minutes long. Recommended duration is up to ${Math.round(
        config.recommendedVideoDurationSeconds / 60
      )} minutes.`;
    }

    return {
      valid: true,
      warning,
      sizeBytes,
    };
  }

  async validateDocumentSelection(file: LocalMediaSelection): Promise<{
    valid: boolean;
    error?: string;
    sizeBytes: number;
  }> {
    const config = this.getUploadConfig();
    const ext = this.getFileExtension(file.name || file.uri);
    const mime = (file.mimeType || '').toLowerCase();

    const extAllowed = config.allowedDocumentExtensions.includes(ext);
    const mimeAllowed = config.allowedDocumentMimeTypes.some((m) => mime.includes(m));

    if (!extAllowed && !mimeAllowed) {
      return {
        valid: false,
        error: `Unsupported file "${file.name}". Only PDF, JPG, and PNG files are allowed.`,
        sizeBytes: file.sizeBytes || 0,
      };
    }

    const sizeBytes = await this.resolveFileSizeBytes(file.uri, file.sizeBytes);
    if (sizeBytes > config.maxDocumentSizeBytes) {
      const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `"${file.name}" (${sizeMB} MB) exceeds the ${config.maxDocumentSizeMB} MB maximum file size limit.`,
        sizeBytes,
      };
    }

    return {
      valid: true,
      sizeBytes,
    };
  }

  buildVideoStoragePath(
    churchId: string,
    memberId: string,
    testimonyId: string,
    fileName: string
  ): string {
    const targetChurch = this.resolveChurchId(churchId);
    const ext = this.getFileExtension(fileName) || '.mp4';
    const safeExt = ['.mp4', '.mov'].includes(ext) ? ext : '.mp4';
    return `churches/${targetChurch}/testimonies/${memberId}/${testimonyId}/video/testimony_${Date.now()}${safeExt}`;
  }

  buildAttachmentStoragePath(
    churchId: string,
    memberId: string,
    testimonyId: string,
    fileName: string,
    index: number
  ): string {
    const targetChurch = this.resolveChurchId(churchId);
    const sanitizedName = (fileName || `attachment_${index}`)
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(-60);
    return `churches/${targetChurch}/testimonies/${memberId}/${testimonyId}/attachments/${Date.now()}_${index}_${sanitizedName}`;
  }

  async uploadFileWithProgress(
    storagePath: string,
    localUri: string,
    contentType: string,
    onProgress?: (percent: number) => void
  ): Promise<string> {
    const ref = storage().ref(storagePath);
    const task = ref.putFile(localUri, { contentType });

    if (onProgress) {
      task.on('state_changed', (snap) => {
        if (snap.totalBytes > 0) {
          const pct = Math.min(100, Math.max(0, Math.round((snap.bytesTransferred / snap.totalBytes) * 100)));
          onProgress(pct);
        }
      });
    }

    await task;
    if (onProgress) onProgress(100);
    return storagePath;
  }

  async getSignedMediaUrl(storagePath?: string | null): Promise<string | null> {
    if (!storagePath) return null;
    if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
      return storagePath;
    }
    try {
      return await storage().ref(storagePath).getDownloadURL();
    } catch (error) {
      console.warn('⚠️ [TestimonyService] Could not resolve Storage URL:', storagePath, error);
      return null;
    }
  }

  async deleteStoragePaths(paths: (string | null | undefined)[]): Promise<void> {
    const validPaths = paths.filter((p): p is string => Boolean(p && !p.startsWith('http')));
    await Promise.all(
      validPaths.map(async (path) => {
        try {
          await storage().ref(path).delete();
        } catch (err: any) {
          if (err?.code !== 'storage/object-not-found') {
            console.warn('⚠️ [TestimonyService] Failed deleting storage file:', path, err?.message);
          }
        }
      })
    );
  }

  /**
   * Resolves a photo field if stored as a Firebase Storage path or gs:// URL.
   */
  async resolveStoragePhotoUrl(rawPhoto?: string | null): Promise<string | null> {
    if (!rawPhoto || typeof rawPhoto !== 'string' || rawPhoto.trim() === '') return null;
    const trimmed = rawPhoto.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    try {
      if (trimmed.startsWith('gs://')) {
        return await storage().refFromURL(trimmed).getDownloadURL();
      }
      return await storage().ref(trimmed).getDownloadURL();
    } catch (err: any) {
      console.warn('⚠️ [TestimonyService] Failed resolving photo URL from storage:', trimmed, err?.message);
      return null;
    }
  }

  /**
   * Batch fetches member profile photos and names from the church's existing member records.
   * Maps memberId, clean phone (last 10 digits), and full phone to { photoURL, name }.
   */
  async getChurchMemberPhotos(
    churchId: string,
    memberIds: string[] = [],
    phones: string[] = []
  ): Promise<Record<string, { photoURL: string; name: string }>> {
    const targetChurchId = this.resolveChurchId(churchId);
    const photosMap: Record<string, { photoURL: string; name: string }> = {};

    try {
      // 1. Fetch church members collection
      const snap = await firestore()
        .collection('churches')
        .doc(targetChurchId)
        .collection('members')
        .limit(300)
        .get();

      const docsToProcess: any[] = [...snap.docs];

      // 2. Fetch any missing member documents by doc ID
      const foundDocIds = new Set(docsToProcess.map((d) => d.id));
      const missingDocIds = memberIds.filter((id) => id && !foundDocIds.has(id));

      if (missingDocIds.length > 0) {
        const extraDocs = await Promise.all(
          missingDocIds.map((mId) =>
            firestore()
              .collection('churches')
              .doc(targetChurchId)
              .collection('members')
              .doc(mId)
              .get()
              .catch(() => null)
          )
        );
        for (const ed of extraDocs) {
          if (ed && checkDocExists(ed)) {
            docsToProcess.push(ed);
          }
        }
      }

      // 3. Extract and resolve photos
      await Promise.all(
        docsToProcess.map(async (doc) => {
          if (!checkDocExists(doc)) return;
          const data = doc.data() || {};
          const rawPhoto =
            data.ProfilePhoto ||
            data.profilePhoto ||
            data.photoURL ||
            data.photoUrl ||
            data.Photo ||
            data.PhotoUrl ||
            data.profileImage ||
            data.profileImageUrl ||
            data.avatar ||
            data.avatarUrl ||
            data.photo ||
            data.image ||
            data.picture ||
            null;

          const resolved = await this.resolveStoragePhotoUrl(rawPhoto);
          if (resolved) {
            const entry = {
              photoURL: resolved,
              name: data.name || data.displayName || '',
            };

            photosMap[doc.id] = entry;
            if (data.uid) photosMap[data.uid] = entry;
            if (data.userId) photosMap[data.userId] = entry;
            if (data.memberId) photosMap[data.memberId] = entry;
            if (data.id) photosMap[data.id] = entry;

            const ph = data.phone || data.phoneNumber || data.mobile;
            if (ph) {
              const clean = String(ph).replace(/\D/g, '').slice(-10);
              if (clean) photosMap[clean] = entry;
              photosMap[String(ph)] = entry;
            }
          }
        })
      );
    } catch (err: any) {
      console.warn('⚠️ [TestimonyService] Error batch loading church member photos:', err?.message);
    }

    return photosMap;
  }

  /**
   * Look up member details strictly from `churches/{churchId}/members/{memberId}`.
   * Gracefully handles deleted member records by returning fallback values.
   */
  async getMemberSummary(
    churchId: string,
    memberId: string,
    fallbackName?: string,
    fallbackPhoto?: string | null,
    fallbackPhone?: string | null
  ): Promise<MemberSummary> {
    const targetChurchId = this.resolveChurchId(churchId);
    if (!memberId) {
      const resolvedFallback = await this.resolveStoragePhotoUrl(fallbackPhoto);
      return {
        id: '',
        name: fallbackName || 'Church Member',
        photoURL: resolvedFallback,
        phone: fallbackPhone || null,
        role: 'Member',
        exists: false,
      };
    }

    try {
      const doc = await firestore()
        .collection('churches')
        .doc(targetChurchId)
        .collection('members')
        .doc(memberId)
        .get();

      if (checkDocExists(doc)) {
        const data = doc.data() || {};
        const photo =
          data.ProfilePhoto ||
          data.profilePhoto ||
          data.photoURL ||
          data.photoUrl ||
          data.Photo ||
          data.PhotoUrl ||
          data.profileImage ||
          data.profileImageUrl ||
          data.avatar ||
          data.avatarUrl ||
          data.photo ||
          data.image ||
          data.imageUrl ||
          fallbackPhoto ||
          null;

        const resolvedPhoto = await this.resolveStoragePhotoUrl(photo);

        return {
          id: doc.id,
          name: data.name || fallbackName || 'Church Member',
          photoURL: resolvedPhoto,
          phone: data.phone || fallbackPhone || null,
          role: data.userType || data.role || (data.isAdmin ? 'Admin' : 'Member'),
          exists: true,
        };
      } else {
        // Fallback: search members by uid or userId or phone
        let qSnap = await firestore()
          .collection('churches')
          .doc(targetChurchId)
          .collection('members')
          .where('uid', '==', memberId)
          .limit(1)
          .get();

        if (qSnap.empty) {
          qSnap = await firestore()
            .collection('churches')
            .doc(targetChurchId)
            .collection('members')
            .where('userId', '==', memberId)
            .limit(1)
            .get();
        }

        if (qSnap.empty && fallbackPhone) {
          qSnap = await firestore()
            .collection('churches')
            .doc(targetChurchId)
            .collection('members')
            .where('phone', '==', fallbackPhone)
            .limit(1)
            .get();
        }

        if (!qSnap.empty) {
          const matchedDoc = qSnap.docs[0];
          const data = matchedDoc.data() || {};
          const photo =
            data.ProfilePhoto ||
            data.profilePhoto ||
            data.photoURL ||
            data.photoUrl ||
            data.Photo ||
            data.PhotoUrl ||
            data.profileImage ||
            data.profileImageUrl ||
            data.avatar ||
            data.avatarUrl ||
            data.photo ||
            data.image ||
            data.imageUrl ||
            fallbackPhoto ||
            null;

          const resolvedPhoto = await this.resolveStoragePhotoUrl(photo);

          return {
            id: matchedDoc.id,
            name: data.name || fallbackName || 'Church Member',
            photoURL: resolvedPhoto,
            phone: data.phone || fallbackPhone || null,
            role: data.userType || data.role || (data.isAdmin ? 'Admin' : 'Member'),
            exists: true,
          };
        }
      }
    } catch (e) {
      console.warn('⚠️ [TestimonyService] Member lookup error:', e);
    }

    const resolvedFallback = await this.resolveStoragePhotoUrl(fallbackPhoto);
    return {
      id: memberId,
      name: fallbackName || 'Church Member',
      photoURL: resolvedFallback,
      phone: fallbackPhone || null,
      role: 'Member',
      exists: false,
    };
  }

  private mapDocToTestimony(doc: any): Testimony {
    const data = doc.data() || {};
    return {
      testimonyId: doc.id,
      churchId: data.churchId || 'default',
      memberId: data.memberId || '',
      memberName: data.memberName || 'Church Member',
      memberPhotoUrl: data.memberPhotoUrl ?? null,
      memberPhone: data.memberPhone ?? null,
      title: data.title || '',
      description: data.description || '',
      testimonyType: (data.testimonyType as TestimonyType) || 'Written',
      writtenContent: data.writtenContent || '',
      category: data.category ?? null,
      videoStoragePath: data.videoStoragePath ?? null,
      videoDurationMs: data.videoDurationMs ?? null,
      videoSizeBytes: data.videoSizeBytes ?? null,
      videoMimeType: data.videoMimeType ?? null,
      attachmentStoragePaths: Array.isArray(data.attachmentStoragePaths)
        ? data.attachmentStoragePaths
        : [],
      privacy: (data.privacy as TestimonyPrivacy) || 'Private',
      publicConsentGranted: Boolean(data.publicConsentGranted),
      status: (data.status as TestimonyStatus) || 'Private',
      createdAt: data.createdAt || null,
      updatedAt: data.updatedAt || null,
      reviewedAt: data.reviewedAt ?? null,
      reviewedBy: data.reviewedBy ?? null,
      reviewedByName: data.reviewedByName ?? null,
      publishedAt: data.publishedAt ?? null,
      rejectionReason: data.rejectionReason ?? null,
      adminPushSent: Boolean(data.adminPushSent),
      lastMemberNotifiedStatus: data.lastMemberNotifiedStatus ?? null,
      publicationPushSent: Boolean(data.publicationPushSent),
    };
  }

  private getTimestampMillis(ts: any): number {
    if (!ts) return 0;
    if (typeof ts.toMillis === 'function') return ts.toMillis();
    if (typeof ts.seconds === 'number') return ts.seconds * 1000;
    if (ts instanceof Date) return ts.getTime();
    const parsed = Date.parse(String(ts));
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Create a new Testimony in `churches/{churchId}/testimonies/{testimonyId}`.
   */
  async submitTestimony(input: SubmitTestimonyInput): Promise<Testimony> {
    const churchId = this.resolveChurchId(input.churchId);
    const testimonyId = input.testimonyId || this.generateTestimonyId(churchId);

    if (!input.memberId) {
      throw new Error('You must be signed in as a member to submit a testimony.');
    }
    if (!input.title.trim()) {
      throw new Error('Please enter a testimony title.');
    }

    if (input.privacy === 'Public' && !input.publicConsentGranted) {
      throw new Error(
        'Please confirm your consent to share this testimony publicly with church members after Admin review.'
      );
    }

    const initialStatus: TestimonyStatus =
      input.privacy === 'Private' ? 'Private' : 'Pending Review';

    const payload = {
      testimonyId,
      churchId,
      memberId: input.memberId,
      memberName: (input.memberName || 'Church Member').trim(),
      memberPhotoUrl: input.memberPhotoUrl || null,
      memberPhone: input.memberPhone || null,
      title: input.title.trim(),
      description: (input.description || '').trim(),
      testimonyType: input.testimonyType,
      writtenContent: (input.writtenContent || '').trim(),
      category: input.category || null,
      videoStoragePath: input.videoStoragePath || null,
      videoDurationMs: input.videoDurationMs ?? null,
      videoSizeBytes: input.videoSizeBytes ?? null,
      videoMimeType: input.videoMimeType || null,
      attachmentStoragePaths: (input.attachmentStoragePaths || []).map((att) => ({
        path: att.path,
        name: att.name || 'Attachment',
        mimeType: att.mimeType || 'application/octet-stream',
        sizeBytes: att.sizeBytes || 0,
      })),
      privacy: input.privacy,
      publicConsentGranted: input.privacy === 'Public' ? Boolean(input.publicConsentGranted) : false,
      status: initialStatus,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      reviewedAt: null,
      reviewedBy: null,
      reviewedByName: null,
      publishedAt: null,
      rejectionReason: null,
      adminPushSent: false,
      lastMemberNotifiedStatus: null,
      publicationPushSent: false,
    };

    await this.getCollectionRef(churchId).doc(testimonyId).set(payload);

    return {
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Member updates their own testimony.
   * - Any edit to a Public testimony resets status to 'Pending Review' and requires Admin review before publication.
   * - Any edit with privacy 'Private' sets status to 'Private' and unpublishes immediately.
   * - Converting a 'Private' testimony to 'Public' requires explicit consent and sets status to 'Pending Review'.
   */
  async updateMemberTestimony(
    churchId: string,
    testimonyId: string,
    memberId: string,
    updates: {
      title: string;
      description: string;
      testimonyType: TestimonyType;
      writtenContent: string;
      category?: string | null;
      videoStoragePath: string | null;
      videoDurationMs?: number | null;
      videoSizeBytes?: number | null;
      videoMimeType?: string | null;
      attachmentStoragePaths: TestimonyAttachment[];
      privacy: TestimonyPrivacy;
      publicConsentGranted: boolean;
    }
  ): Promise<void> {
    const targetChurch = this.resolveChurchId(churchId);
    const docRef = this.getCollectionRef(targetChurch).doc(testimonyId);
    const snap = await docRef.get();

    if (!checkDocExists(snap)) {
      throw new Error('Testimony not found.');
    }

    const existing = this.mapDocToTestimony(snap);
    if (existing.memberId !== memberId) {
      throw new Error('You can only edit your own testimonies.');
    }

    if (updates.privacy === 'Public' && !updates.publicConsentGranted) {
      throw new Error(
        'Please confirm your consent to share this testimony publicly with church members.'
      );
    }

    const nextStatus: TestimonyStatus =
      updates.privacy === 'Private' ? 'Private' : 'Pending Review';

    // Clean up replaced storage files if paths changed
    const pathsToDelete: string[] = [];
    if (
      existing.videoStoragePath &&
      existing.videoStoragePath !== updates.videoStoragePath
    ) {
      pathsToDelete.push(existing.videoStoragePath);
    }
    const updatedAttachmentSet = new Set(
      (updates.attachmentStoragePaths || []).map((a) => a.path)
    );
    for (const oldAtt of existing.attachmentStoragePaths || []) {
      if (oldAtt.path && !updatedAttachmentSet.has(oldAtt.path)) {
        pathsToDelete.push(oldAtt.path);
      }
    }

    await docRef.update({
      title: updates.title.trim(),
      description: (updates.description || '').trim(),
      testimonyType: updates.testimonyType,
      writtenContent: (updates.writtenContent || '').trim(),
      category: updates.category || null,
      videoStoragePath: updates.videoStoragePath || null,
      videoDurationMs: updates.videoDurationMs ?? null,
      videoSizeBytes: updates.videoSizeBytes ?? null,
      videoMimeType: updates.videoMimeType || null,
      attachmentStoragePaths: (updates.attachmentStoragePaths || []).map((att) => ({
        path: att.path,
        name: att.name || 'Attachment',
        mimeType: att.mimeType || 'application/octet-stream',
        sizeBytes: att.sizeBytes || 0,
      })),
      privacy: updates.privacy,
      publicConsentGranted:
        updates.privacy === 'Public' ? Boolean(updates.publicConsentGranted) : false,
      status: nextStatus,
      updatedAt: FieldValue.serverTimestamp(),
      reviewedAt: null,
      reviewedBy: null,
      reviewedByName: null,
      publishedAt: null,
      rejectionReason: null,
      adminPushSent: false,
      lastMemberNotifiedStatus: null,
      publicationPushSent: false,
    });

    if (pathsToDelete.length > 0) {
      await this.deleteStoragePaths(pathsToDelete);
    }
  }

  /**
   * Real-time subscription to Published & Public testimonies for the Member Feed.
   */
  subscribeToPublicFeed(
    churchId: string,
    onUpdate: (items: Testimony[]) => void,
    onError?: (err: any) => void
  ): () => void {
    const cid = this.resolveChurchId(churchId);
    const cached = this._publicFeedCache.get(cid);
    if (cached) onUpdate(cached);

    const ref = this.getCollectionRef(churchId)
      .where('privacy', '==', 'Public')
      .where('status', '==', 'Published');

    return ref.onSnapshot(
      (snapshot) => {
        const items = snapshot.docs
          .map((doc) => this.mapDocToTestimony(doc))
          // Defense-in-depth filter: never allow Private or non-Published items in the public feed
          .filter((item) => item.privacy === 'Public' && item.status === 'Published')
          .sort(
            (a, b) =>
              this.getTimestampMillis(b.publishedAt || b.createdAt) -
              this.getTimestampMillis(a.publishedAt || a.createdAt)
          );
        this._publicFeedCache.set(cid, items);
        onUpdate(items);
      },
      (err) => {
        console.error('❌ [TestimonyService] subscribeToPublicFeed error:', err);
        if (onError) onError(err);
      }
    );
  }

  /**
   * Real-time subscription to a Member's own testimonies.
   */
  subscribeToMyTestimonies(
    churchId: string,
    memberId: string,
    onUpdate: (items: Testimony[]) => void,
    onError?: (err: any) => void
  ): () => void {
    if (!memberId) {
      onUpdate([]);
      return () => {};
    }

    const cid = this.resolveChurchId(churchId);
    const cacheKey = `${cid}:${memberId}`;
    const cached = this._myTestimoniesCache.get(cacheKey);
    if (cached) onUpdate(cached);

    const ref = this.getCollectionRef(churchId).where('memberId', '==', memberId);

    return ref.onSnapshot(
      (snapshot) => {
        const items = snapshot.docs
          .map((doc) => this.mapDocToTestimony(doc))
          .sort(
            (a, b) =>
              this.getTimestampMillis(b.createdAt) - this.getTimestampMillis(a.createdAt)
          );
        this._myTestimoniesCache.set(cacheKey, items);
        onUpdate(items);
      },
      (err) => {
        console.error('❌ [TestimonyService] subscribeToMyTestimonies error:', err);
        if (onError) onError(err);
      }
    );
  }

  /**
   * Real-time subscription to all testimonies for Authorized Admins.
   */
  subscribeToAdminTestimonies(
    churchId: string,
    onUpdate: (items: Testimony[]) => void,
    onError?: (err: any) => void
  ): () => void {
    const cid = this.resolveChurchId(churchId);
    const cached = this._adminTestimoniesCache.get(cid);
    if (cached) onUpdate(cached);

    const ref = this.getCollectionRef(churchId);

    return ref.onSnapshot(
      (snapshot) => {
        const items = snapshot.docs
          .map((doc) => this.mapDocToTestimony(doc))
          .sort(
            (a, b) =>
              this.getTimestampMillis(b.createdAt) - this.getTimestampMillis(a.createdAt)
          );
        this._adminTestimoniesCache.set(cid, items);
        onUpdate(items);
      },
      (err) => {
        console.error('❌ [TestimonyService] subscribeToAdminTestimonies error:', err);
        if (onError) onError(err);
      }
    );
  }

  /**
   * Fetch a single testimony by ID.
   */
  async getTestimonyById(churchId: string, testimonyId: string): Promise<Testimony | null> {
    if (!testimonyId) return null;
    try {
      const doc = await this.getCollectionRef(churchId).doc(testimonyId).get();
      if (!checkDocExists(doc)) return null;
      return this.mapDocToTestimony(doc);
    } catch (e) {
      console.warn('⚠️ [TestimonyService] getTestimonyById error:', e);
      return null;
    }
  }

  /**
   * Real-time listener on a single testimony (used by TestimonyDetailScreen so if an Admin
   * unpublishes or deletes a testimony while open, access is revoked immediately).
   */
  subscribeToTestimonyById(
    churchId: string,
    testimonyId: string,
    onUpdate: (item: Testimony | null) => void,
    onError?: (err: any) => void
  ): () => void {
    if (!testimonyId) {
      onUpdate(null);
      return () => {};
    }
    return this.getCollectionRef(churchId)
      .doc(testimonyId)
      .onSnapshot(
        (doc) => {
          if (!checkDocExists(doc)) {
            onUpdate(null);
            return;
          }
          onUpdate(this.mapDocToTestimony(doc));
        },
        (err) => {
          console.warn('⚠️ [TestimonyService] subscribeToTestimonyById error:', err);
          if (onError) onError(err);
        }
      );
  }

  /**
   * Admin Action: Approve a Public testimony ('Pending Review' -> 'Approved').
   * Strictly blocked for Private testimonies.
   */
  async adminApproveTestimony(
    churchId: string,
    testimonyId: string,
    adminUid: string,
    adminName?: string
  ): Promise<void> {
    const docRef = this.getCollectionRef(churchId).doc(testimonyId);
    const snap = await docRef.get();
    if (!checkDocExists(snap)) throw new Error('Testimony not found.');

    const data = this.mapDocToTestimony(snap);
    if (data.privacy === 'Private') {
      throw new Error(
        'Private testimonies must remain private. Only the submitting Member can change privacy to Public.'
      );
    }

    await docRef.update({
      status: 'Approved',
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: adminUid,
      reviewedByName: adminName || 'Admin',
      rejectionReason: null,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  /**
   * Admin Action: Publish an Approved Public testimony ('Approved' -> 'Published').
   * Strictly blocked for Private testimonies.
   */
  async adminPublishTestimony(
    churchId: string,
    testimonyId: string,
    adminUid: string,
    adminName?: string
  ): Promise<void> {
    const docRef = this.getCollectionRef(churchId).doc(testimonyId);
    const snap = await docRef.get();
    if (!checkDocExists(snap)) throw new Error('Testimony not found.');

    const data = this.mapDocToTestimony(snap);
    if (data.privacy === 'Private') {
      throw new Error(
        'Private testimonies can never be published. The submitting Member must explicitly change sharing preference to Public first.'
      );
    }
    if (data.status !== 'Approved' && data.status !== 'Published') {
      throw new Error('Please approve this testimony before publishing it.');
    }

    await docRef.update({
      status: 'Published',
      publishedAt: FieldValue.serverTimestamp(),
      reviewedAt: data.reviewedAt || FieldValue.serverTimestamp(),
      reviewedBy: adminUid,
      reviewedByName: adminName || 'Admin',
      rejectionReason: null,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  /**
   * Admin Action: Reject a Public testimony with an optional rejection reason.
   */
  async adminRejectTestimony(
    churchId: string,
    testimonyId: string,
    adminUid: string,
    rejectionReason?: string | null,
    adminName?: string
  ): Promise<void> {
    const docRef = this.getCollectionRef(churchId).doc(testimonyId);
    const snap = await docRef.get();
    if (!checkDocExists(snap)) throw new Error('Testimony not found.');

    const data = this.mapDocToTestimony(snap);
    if (data.privacy === 'Private') {
      throw new Error('Private testimonies are kept private and cannot be rejected as public submissions.');
    }

    await docRef.update({
      status: 'Rejected',
      rejectionReason: rejectionReason && rejectionReason.trim() ? rejectionReason.trim() : null,
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: adminUid,
      reviewedByName: adminName || 'Admin',
      publishedAt: null,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  /**
   * Admin Action: Unpublish a Published testimony so it is immediately removed from the Public Feed.
   */
  async adminUnpublishTestimony(
    churchId: string,
    testimonyId: string,
    adminUid: string,
    adminName?: string
  ): Promise<void> {
    const docRef = this.getCollectionRef(churchId).doc(testimonyId);
    const snap = await docRef.get();
    if (!checkDocExists(snap)) throw new Error('Testimony not found.');

    await docRef.update({
      status: 'Approved',
      publishedAt: null,
      reviewedBy: adminUid,
      reviewedByName: adminName || 'Admin',
      updatedAt: FieldValue.serverTimestamp(),
      publicationPushSent: false,
    });
  }

  /**
   * Admin Action: Acknowledge/Review a Private testimony while keeping it strictly Private.
   */
  async adminAcknowledgePrivateTestimony(
    churchId: string,
    testimonyId: string,
    adminUid: string,
    adminName?: string
  ): Promise<void> {
    const docRef = this.getCollectionRef(churchId).doc(testimonyId);
    const snap = await docRef.get();
    if (!checkDocExists(snap)) throw new Error('Testimony not found.');

    await docRef.update({
      privacy: 'Private',
      status: 'Private',
      publishedAt: null,
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: adminUid,
      reviewedByName: adminName || 'Admin',
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  /**
   * Delete a testimony and clean up its Storage files.
   */
  async deleteTestimony(churchId: string, testimonyId: string): Promise<void> {
    const docRef = this.getCollectionRef(churchId).doc(testimonyId);
    const snap = await docRef.get();

    if (checkDocExists(snap)) {
      const data = this.mapDocToTestimony(snap);
      const storagePaths: string[] = [];
      if (data.videoStoragePath) {
        storagePaths.push(data.videoStoragePath);
      }
      for (const att of data.attachmentStoragePaths || []) {
        if (att.path) storagePaths.push(att.path);
      }
      await docRef.delete();
      if (storagePaths.length > 0) {
        await this.deleteStoragePaths(storagePaths);
      }
    }
  }
}

export default new TestimonyService();
