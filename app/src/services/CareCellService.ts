import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import FirestoreService from './FirestoreService';
const CHURCHES_ROOT_COLLECTION = 'churches';
import {
  CareCell,
  CareCellMembership,
  CareCellMeeting,
  CareCellAttendance,
  CareCellPrayerRequest,
  CareCellFollowup,
  CareCellAnnouncement,
  CareCellMeetingReport,
  CareCellOverviewStats,
  CareCellVisit,
  CareCellVisitMemberResponse,
  MemberVisitResponseStatus,
  VisitStatus,
  AttendanceStatus,
} from '../types/CareCellTypes';

/**
 * Recursively strips undefined keys and nested undefined properties to prevent Firestore exceptions:
 * "Unsupported field value: undefined"
 */
function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeForFirestore) as any;
  }
  if (typeof data === 'object') {
    // Preserve Firestore FieldValue and Timestamp instances
    if (
      (data as any).constructor &&
      ((data as any).constructor.name === 'FieldValue' ||
        (data as any).constructor.name === 'Timestamp' ||
        data instanceof Date)
    ) {
      return data;
    }
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) {
        clean[k] = sanitizeForFirestore(v);
      }
    }
    return clean as any;
  }
  return data;
}

function normalizePhoneDigits(phone?: string): string {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function phonesMatch(a?: string, b?: string): boolean {
  const pa = normalizePhoneDigits(a);
  const pb = normalizePhoneDigits(b);
  return pa.length >= 7 && pb.length >= 7 && pa === pb;
}

function formatVisitDateDisplay(dateStr?: string): string {
  const raw = String(dateStr || '').trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : raw;
}

function formatVisitTimeDisplay(timeStr?: string): string {
  const raw = String(timeStr || '').trim();
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(raw);
  if (!m) return raw;
  const h = parseInt(m[1], 10);
  const min = m[2];
  if (Number.isNaN(h)) return raw;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${min} ${ampm}`;
}

/**
 * Known approximate coordinates for mandals & regions in Kurnool / Nandyal district
 */
export const KNOWN_REGION_COORDS: Record<string, { lat: number; lng: number; radiusKm: number }> = {
  koilakuntla: { lat: 15.2333, lng: 78.3167, radiusKm: 25 },
  kollakuntla: { lat: 15.2333, lng: 78.3167, radiusKm: 25 },
  owk: { lat: 15.2167, lng: 78.1167, radiusKm: 18 },
  sivavaram: { lat: 15.2600, lng: 78.3300, radiusKm: 15 },
  singanapalli: { lat: 15.3500, lng: 78.2800, radiusKm: 15 },
  banaganapalle: { lat: 15.3200, lng: 78.2300, radiusKm: 20 },
  kurnool: { lat: 15.8281, lng: 78.0373, radiusKm: 15 },
  nandyal: { lat: 15.4770, lng: 78.4836, radiusKm: 18 },
  dhone: { lat: 15.4200, lng: 77.8700, radiusKm: 18 },
  allagadda: { lat: 15.1300, lng: 78.5100, radiusKm: 18 },
  bethamcherla: { lat: 15.4700, lng: 78.1600, radiusKm: 18 },
};

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Checks whether a church member's saved residential address, locality, city, village,
 * mandal, or Google Maps GPS coordinates are within the target location.
 */
export function isMemberInLocation(
  member: any,
  targetLocation?: string,
  targetLat?: number,
  targetLng?: number
): boolean {
  if (!targetLocation || !targetLocation.trim()) {
    return true;
  }

  const rawTarget = targetLocation.trim().toLowerCase();
  
  // Extract keywords (e.g. "Koilakuntla", "Budhawarpet", "C Camp")
  const targetTokens = rawTarget
    .split(/[\s,./\-_]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 3 && !['near', 'opp', 'road', 'street', 'hall', 'town', 'dist', 'district', 'area', 'center', 'city'].includes(s));

  if (targetTokens.length === 0) {
    targetTokens.push(rawTarget);
  }

  // 1. Textual match against all saved member address & location fields
  const memberLocationStrings = [
    member.city,
    member.mailingCity,
    member.village,
    member.mandal,
    member.locality,
    member.area,
    member.district,
    member.address,
    member.street,
    member.mailingStreet,
  ]
    .filter((s) => typeof s === 'string' && s.trim().length > 0)
    .map((s) => (s as string).trim().toLowerCase());

  const hasTextMatch = memberLocationStrings.some((fieldStr) => {
    return targetTokens.some((tok) => fieldStr.includes(tok) || tok.includes(fieldStr));
  });

  if (hasTextMatch) {
    return true;
  }

  // 2. GPS / Google Maps coordinates proximity match
  let centerLat = targetLat;
  let centerLng = targetLng;
  let maxRadius = 20; // 20 km radius for mandal matching

  if (centerLat === undefined || centerLng === undefined) {
    for (const tok of targetTokens) {
      if (KNOWN_REGION_COORDS[tok]) {
        centerLat = KNOWN_REGION_COORDS[tok].lat;
        centerLng = KNOWN_REGION_COORDS[tok].lng;
        maxRadius = KNOWN_REGION_COORDS[tok].radiusKm;
        break;
      }
    }
  }

  const memLat = typeof member.latitude === 'number' ? member.latitude : (member.lat ? Number(member.lat) : undefined);
  const memLng = typeof member.longitude === 'number' ? member.longitude : (member.lng ? Number(member.lng) : undefined);

  if (
    centerLat !== undefined &&
    centerLng !== undefined &&
    memLat !== undefined &&
    memLng !== undefined &&
    !isNaN(memLat) &&
    !isNaN(memLng)
  ) {
    const dist = calculateDistanceKm(centerLat, centerLng, memLat, memLng);
    if (dist <= maxRadius) {
      return true;
    }
  }

  return false;
}

class CareCellService {
  private _cellsCache = new Map<string, { data: CareCell[]; ts: number }>();

  getCachedCareCells(churchId?: string): CareCell[] | null {
    const entry = churchId ? this._cellsCache.get(churchId) : Array.from(this._cellsCache.values())[0];
    return entry ? entry.data : null;
  }

  invalidateCareCellsCache(churchId?: string) {
    if (churchId) this._cellsCache.delete(churchId);
    else this._cellsCache.clear();
  }

  /**
   * Helper to retrieve active Church ID with reliable fallback.
   */
  async getChurchId(): Promise<string> {
    try {
      const id = await FirestoreService.getChurchId();
      return id || 'default';
    } catch {
      return 'default';
    }
  }

  // ── Subcollection Helpers ───────────────────────────────────────────────────

  async getCareCellsRef(churchId?: string) {
    const id = churchId || (await this.getChurchId());
    return firestore().collection(CHURCHES_ROOT_COLLECTION).doc(id).collection('careCells');
  }

  async getMembershipsRef(churchId?: string) {
    const id = churchId || (await this.getChurchId());
    return firestore().collection(CHURCHES_ROOT_COLLECTION).doc(id).collection('careCellMemberships');
  }

  async getMeetingsRef(churchId?: string) {
    const id = churchId || (await this.getChurchId());
    return firestore().collection(CHURCHES_ROOT_COLLECTION).doc(id).collection('careCellMeetings');
  }

  async getAttendanceRef(churchId?: string) {
    const id = churchId || (await this.getChurchId());
    return firestore().collection(CHURCHES_ROOT_COLLECTION).doc(id).collection('careCellAttendance');
  }

  async getPrayerRequestsRef(churchId?: string) {
    const id = churchId || (await this.getChurchId());
    return firestore().collection(CHURCHES_ROOT_COLLECTION).doc(id).collection('careCellPrayerRequests');
  }

  async getFollowupsRef(churchId?: string) {
    const id = churchId || (await this.getChurchId());
    return firestore().collection(CHURCHES_ROOT_COLLECTION).doc(id).collection('careCellFollowups');
  }

  async getAnnouncementsRef(churchId?: string) {
    const id = churchId || (await this.getChurchId());
    return firestore().collection(CHURCHES_ROOT_COLLECTION).doc(id).collection('careCellAnnouncements');
  }

  async getReportsRef(churchId?: string) {
    const id = churchId || (await this.getChurchId());
    return firestore().collection(CHURCHES_ROOT_COLLECTION).doc(id).collection('careCellMeetingReports');
  }

  async getVisitsRef(churchId?: string) {
    const id = churchId || (await this.getChurchId());
    return firestore().collection(CHURCHES_ROOT_COLLECTION).doc(id).collection('careCellVisits');
  }

  // ── Unique Code Generator (Rhema_CareCell-001) ──────────────────────────────

  /**
   * Generates the next sequential unique Care Cell code (CareCell-001, CareCell-002, etc.).
   * Validates against Firestore to guarantee zero duplicate codes within the church.
   */
  async getNextCareCellCode(churchId?: string): Promise<string> {
    try {
      const col = await this.getCareCellsRef(churchId);
      const snap = await col.get();

      let maxNum = 0;
      snap.docs.forEach((doc) => {
        const code = String(doc.data()?.cellCode || '').trim();
        const match = code.match(/^(?:Rhema_|WC_)?CareCell-(\d+)$/i);
        if (match) {
          const parsed = parseInt(match[1], 10);
          if (!isNaN(parsed) && parsed > maxNum) {
            maxNum = parsed;
          }
        }
      });

      let candidateNum = maxNum + 1;
      let candidateCode = `CareCell-${String(candidateNum).padStart(3, '0')}`;

      // Extra safety check in case of custom or manual codes
      let collision = true;
      while (collision) {
        const checkSnap = await col.where('cellCode', '==', candidateCode).limit(1).get();
        if (checkSnap.empty) {
          collision = false;
        } else {
          candidateNum++;
          candidateCode = `CareCell-${String(candidateNum).padStart(3, '0')}`;
        }
      }

      return candidateCode;
    } catch (error) {
      console.error('Error generating Care Cell code:', error);
      return 'CareCell-001';
    }
  }

  // ── Care Cell CRUD ──────────────────────────────────────────────────────────

  async createCareCell(
    churchId: string | undefined,
    data: Omit<CareCell, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const col = await this.getCareCellsRef(churchId);
    
    // Ensure code uniqueness
    let finalCode = (data.cellCode || '').trim();
    if (!finalCode) {
      finalCode = await this.getNextCareCellCode(churchId);
    } else {
      const existing = await col.where('cellCode', '==', finalCode).limit(1).get();
      if (!existing.empty) {
        throw new Error(`A Care Cell with code "${finalCode}" already exists.`);
      }
    }

    const docRef = col.doc();
    const payload = {
      ...data,
      cellCode: finalCode,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    await docRef.set(sanitizeForFirestore(payload)); this.invalidateCareCellsCache(churchId);
    return docRef.id;
  }

  async updateCareCell(
    churchId: string | undefined,
    cellId: string,
    updates: Partial<CareCell>
  ): Promise<void> {
    const col = await this.getCareCellsRef(churchId);

    // If updating cellCode, ensure uniqueness against OTHER cells
    if (updates.cellCode) {
      const codeToCheck = updates.cellCode.trim();
      const existing = await col.where('cellCode', '==', codeToCheck).limit(2).get();
      const conflict = existing.docs.find((d) => d.id !== cellId);
      if (conflict) {
        throw new Error(`Care Cell code "${codeToCheck}" is already taken by another cell.`);
      }
    }

    await col.doc(cellId).update(
      sanitizeForFirestore({
        ...updates,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      })
    );
    this.invalidateCareCellsCache(churchId);
  }

  async archiveCareCell(churchId: string | undefined, cellId: string): Promise<void> {
    await this.updateCareCell(churchId, cellId, { status: 'Archived' });
  }

  async deleteCareCell(churchId: string | undefined, cellId: string): Promise<void> {
    const activeChurchId = churchId || (await this.getChurchId());
    const cellCol = await this.getCareCellsRef(activeChurchId);

    // 1. Delete Care Cell document
    await cellCol.doc(cellId).delete(); this.invalidateCareCellsCache(activeChurchId);

    // 2. Remove associated memberships
    try {
      const memCol = await this.getMembershipsRef(activeChurchId);
      const memSnap = await memCol.where('cellId', '==', cellId).get();
      if (!memSnap.empty) {
        const batch = firestore().batch();
        memSnap.docs.forEach((d) => {
          batch.delete(d.ref);
        });
        await batch.commit();
      }
    } catch (e) {
      console.warn('Non-fatal error cleaning up memberships after care cell deletion:', e);
    }
  }

  async getCareCells(churchId?: string, statusFilter?: 'All' | 'Active' | 'Inactive' | 'Archived'): Promise<CareCell[]> {
    try {
      const cid = churchId || (await this.getChurchId());
      const cached = this._cellsCache.get(cid);
      const now = Date.now();

      const fetchAndCache = async () => {
        const col = await this.getCareCellsRef(cid);
        const snap = await col.get();
        const list = (snap.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
        })) as CareCell[]).sort((a, b) => (a.cellCode || '').localeCompare(b.cellCode || ''));
        this._cellsCache.set(cid, { data: list, ts: Date.now() });
        return list;
      };

      let list: CareCell[];
      if (cached && now - cached.ts < 30_000) {
        list = cached.data;
      } else if (cached && now - cached.ts < 600_000) {
        list = cached.data;
        fetchAndCache().catch(() => {});
      } else {
        list = await fetchAndCache();
      }

      if (statusFilter && statusFilter !== 'All') {
        return list.filter(c => c.status === statusFilter);
      }
      return list;
    } catch (error) {
      console.error('Error fetching Care Cells:', error);
      return [];
    }
  }

  async getCareCellById(churchId: string | undefined, cellId: string): Promise<CareCell | null> {
    try {
      const col = await this.getCareCellsRef(churchId);
      const snap = await col.doc(cellId).get();
      if (!snap.exists) return null;
      return { id: snap.id, ...snap.data() } as CareCell;
    } catch (error) {
      console.error('Error fetching Care Cell by ID:', error);
      return null;
    }
  }


  /**
   * Checks whether a regular Admin has been granted explicit access to any Care Cell
   * (or is a leader/assistant leader).
   */
  async checkAdminHasCareCellAccess(churchId: string, adminUid: string): Promise<boolean> {
    try {
      if (!adminUid) return false;
      const col = await this.getCareCellsRef(churchId);
      
      // Check 1: assignedAdminIds contains adminUid
      const assignedSnap = await col.where('assignedAdminIds', 'array-contains', adminUid).limit(1).get();
      if (!assignedSnap.empty) return true;

      // Check 2: leaderId == adminUid
      const leaderSnap = await col.where('leaderId', '==', adminUid).limit(1).get();
      if (!leaderSnap.empty) return true;

      // Check 3: assistantLeaderId == adminUid
      const asstSnap = await col.where('assistantLeaderId', '==', adminUid).limit(1).get();
      if (!asstSnap.empty) return true;

      return false;
    } catch (error) {
      console.warn('⚠️ [CareCellService] checkAdminHasCareCellAccess fallback check:', error);
      try {
        const allCells = await this.getCareCells(churchId);
        return allCells.some(
          c => (Array.isArray(c.assignedAdminIds) && c.assignedAdminIds.includes(adminUid)) ||
               c.leaderId === adminUid ||
               c.assistantLeaderId === adminUid
        );
      } catch (e) {
        return false;
      }
    }
  }

  /**
   * Fetches only the Care Cells that a regular Admin has explicit access to.
   */
  async getCareCellsForAdmin(churchId?: string, adminUid?: string): Promise<CareCell[]> {
    try {
      const allCells = await this.getCareCells(churchId);
      if (!adminUid) return allCells;
      return allCells.filter(
        c => (Array.isArray(c.assignedAdminIds) && c.assignedAdminIds.includes(adminUid)) ||
             c.leaderId === adminUid ||
             c.assistantLeaderId === adminUid
      );
    } catch (error) {
      console.error('Error fetching Care Cells for admin:', error);
      return [];
    }
  }

  /**
   * Grants or updates Admin access to a specific Care Cell. Only Super Admin should call this.
   */
  async grantAdminAccess(churchId: string, cellId: string, assignedAdminIds: string[]): Promise<void> {
    try {
      const col = await this.getCareCellsRef(churchId);
      await col.doc(cellId).update({
        assignedAdminIds: assignedAdminIds || [],
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Error granting Care Cell admin access:', error);
      throw error;
    }
  }

  /**
   * Fetches all registered church members with Admin privileges for access delegation.
   */
  async getChurchAdmins(churchId?: string): Promise<{ id: string; name: string; phone?: string; userType: string }[]> {
    try {
      const id = churchId || (await this.getChurchId());
      const membersRef = firestore().collection(CHURCHES_ROOT_COLLECTION).doc(id).collection('members');
      const snap = await membersRef.get();
      const admins: { id: string; name: string; phone?: string; userType: string }[] = [];
      
      snap.docs.forEach(doc => {
        const data = doc.data();
        const uType = String(data.userType || '').toLowerCase();
        if (uType.includes('admin') || uType.includes('pastor') || uType.includes('super')) {
          admins.push({
            id: doc.id,
            name: data.name || data.firstName || 'Administrator',
            phone: data.phone,
            userType: data.userType || 'Admin',
          });
        }
      });
      return admins;
    } catch (error) {
      console.error('Error fetching church admins:', error);
      return [];
    }
  }

  // ── Membership & Deduplication Engine ───────────────────────────────────────

  /**
   * Fetches all active memberships belonging to a specific Care Cell.
   */
  async getActiveCellMemberships(churchId: string | undefined, cellId: string): Promise<CareCellMembership[]> {
    try {
      const col = await this.getMembershipsRef(churchId);
      const snap = await col.where('cellId', '==', cellId).where('membershipStatus', '==', 'Active').get();
      return snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as CareCellMembership[];
    } catch (error) {
      console.error('Error fetching active cell memberships:', error);
      return [];
    }
  }

  /**
   * Fetches all active memberships across all Care Cells in the church.
   * Keyed by memberId for O(1) deduplication lookup.
   */
  async getAllActiveMembershipsMap(churchId?: string): Promise<Map<string, CareCellMembership>> {
    const map = new Map<string, CareCellMembership>();
    try {
      const col = await this.getMembershipsRef(churchId);
      const snap = await col.where('membershipStatus', '==', 'Active').get();
      snap.docs.forEach((doc: any) => {
        const data = { id: doc.id, ...doc.data() } as CareCellMembership;
        if (data.memberId) {
          map.set(data.memberId, data);
        }
      });
    } catch (error) {
      console.error('Error fetching all active memberships map:', error);
    }
    return map;
  }

  /**
   * Assigns multiple members to a Care Cell with strict 2-tier deduplication:
   * 1. Intra-Cell: Rejects any member already active in this cell.
   * 2. Inter-Cell: If autoTransfer=true, moves members from other cells by marking previous records as Transferred.
   */
  async assignMembersToCell(
    churchId: string | undefined,
    cellId: string,
    cellMeta: { cellCode?: string; cellName?: string },
    membersToAssign: Array<{
      id: string;
      name: string;
      phone?: string;
      photoUrl?: string;
      address?: string;
      locality?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
    }>,
    assignedBy: string,
    autoTransfer: boolean = false
  ): Promise<{ assignedCount: number; transferredCount: number; skippedCount: number }> {
    const col = await this.getMembershipsRef(churchId);
    const existingInThisCell = await this.getActiveCellMemberships(churchId, cellId);
    const existingMemberIdsSet = new Set(existingInThisCell.map((m) => m.memberId));

    const allActiveMap = await this.getAllActiveMembershipsMap(churchId);

    const batch = firestore().batch();
    let assignedCount = 0;
    let transferredCount = 0;
    let skippedCount = 0;

    for (const mem of membersToAssign) {
      // 1. Intra-cell deduplication: never add if already in this cell
      if (existingMemberIdsSet.has(mem.id)) {
        skippedCount++;
        continue;
      }

      // 2. Inter-cell check: if already active in another cell
      const activeInOther = allActiveMap.get(mem.id);
      if (activeInOther && activeInOther.cellId !== cellId) {
        if (!autoTransfer) {
          skippedCount++;
          continue;
        }
        // Mark previous cell membership as Transferred
        const prevDocRef = col.doc(activeInOther.id);
        batch.update(
          prevDocRef,
          sanitizeForFirestore({
            membershipStatus: 'Transferred',
            leftAt: firestore.FieldValue.serverTimestamp(),
            transferredToCellId: cellId,
            transferredToCellName: cellMeta.cellName || '',
            updatedAt: firestore.FieldValue.serverTimestamp(),
          })
        );
        transferredCount++;
      }

      // Create new active membership document in this cell
      const newDocRef = col.doc();
      const newMembership: Omit<CareCellMembership, 'id'> = {
        cellId,
        cellCode: cellMeta.cellCode || '',
        cellName: cellMeta.cellName || '',
        memberId: mem.id,
        memberName: mem.name || 'Member',
        memberPhone: mem.phone || '',
        memberPhoto: mem.photoUrl || '',
        address: mem.address || '',
        locality: mem.locality || '',
        city: mem.city || '',
        latitude: mem.latitude,
        longitude: mem.longitude,
        membershipStatus: 'Active',
        joinedAt: firestore.FieldValue.serverTimestamp(),
        assignedBy,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      batch.set(newDocRef, sanitizeForFirestore(newMembership));
      assignedCount++;
    }

    if (assignedCount > 0 || transferredCount > 0) {
      await batch.commit();
    }

    return { assignedCount, transferredCount, skippedCount };
  }

  /**
   * Safely removes a member from a Care Cell without deleting their church member record.
   */
  async removeMemberFromCell(churchId: string | undefined, membershipId: string): Promise<void> {
    const col = await this.getMembershipsRef(churchId);
    await col.doc(membershipId).update(
      sanitizeForFirestore({
        membershipStatus: 'Removed',
        leftAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      })
    );
  }

  /**
   * Finds the Care Cell assigned to a specific member.
   */
  async getMemberActiveCareCell(
    churchId: string | undefined,
    memberId: string,
    memberPhone?: string
  ): Promise<{ cell: CareCell | null; membership: CareCellMembership | null }> {
    try {
      const memCol = await this.getMembershipsRef(churchId);
      const snap = await memCol.where('memberId', '==', memberId).where('membershipStatus', '==', 'Active').limit(1).get();

      if (snap.empty) {
        // Fallback: if pre-login contact ID was used in membership before syncMember migrated the doc to Auth UID, match by phone
        if (normalizePhoneDigits(memberPhone).length >= 7) {
          const allActiveSnap = await memCol.where('membershipStatus', '==', 'Active').get();
          const phoneMatchedDoc = allActiveSnap.docs.find((d: any) =>
            phonesMatch(d.data()?.memberPhone, memberPhone)
          );
          if (phoneMatchedDoc) {
            const membership = { id: phoneMatchedDoc.id, ...phoneMatchedDoc.data() } as CareCellMembership;
            const cell = await this.getCareCellById(churchId, membership.cellId);
            return { cell, membership };
          }
        }

        // Also check if member is assigned as Leader or Assistant Leader
        const cellsCol = await this.getCareCellsRef(churchId);
        const leaderSnap = await cellsCol.where('leaderId', '==', memberId).where('status', '==', 'Active').limit(1).get();
        if (!leaderSnap.empty) {
          const cell = { id: leaderSnap.docs[0].id, ...leaderSnap.docs[0].data() } as CareCell;
          return { cell, membership: null };
        }
        const asstSnap = await cellsCol.where('assistantLeaderId', '==', memberId).where('status', '==', 'Active').limit(1).get();
        if (!asstSnap.empty) {
          const cell = { id: asstSnap.docs[0].id, ...asstSnap.docs[0].data() } as CareCell;
          return { cell, membership: null };
        }
        return { cell: null, membership: null };
      }

      const membership = { id: snap.docs[0].id, ...snap.docs[0].data() } as CareCellMembership;
      const cell = await this.getCareCellById(churchId, membership.cellId);
      return { cell, membership };
    } catch (error) {
      console.error('Error fetching member active Care Cell:', error);
      return { cell: null, membership: null };
    }
  }

  /**
   * Checks if a member is a Cell Leader or Assistant Leader for any active Care Cell.
   */
  async getMemberLedCareCells(churchId: string | undefined, memberId: string): Promise<CareCell[]> {
    try {
      const col = await this.getCareCellsRef(churchId);
      const [leaderSnap, asstSnap] = await Promise.all([
        col.where('leaderId', '==', memberId).where('status', '==', 'Active').get(),
        col.where('assistantLeaderId', '==', memberId).where('status', '==', 'Active').get(),
      ]);

      const map = new Map<string, CareCell>();
      leaderSnap.docs.forEach((d: any) => map.set(d.id, { id: d.id, ...d.data() } as CareCell));
      asstSnap.docs.forEach((d: any) => map.set(d.id, { id: d.id, ...d.data() } as CareCell));

      return Array.from(map.values());
    } catch (error) {
      console.error('Error fetching member led care cells:', error);
      return [];
    }
  }

  // ── Meeting Scheduling ──────────────────────────────────────────────────────

  async createMeeting(
    churchId: string | undefined,
    data: Omit<CareCellMeeting, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const activeChurchId = churchId || (await this.getChurchId());
    const col = await this.getMeetingsRef(activeChurchId);
    const docRef = col.doc();
    await docRef.set(
      sanitizeForFirestore({
        ...data,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      })
    );

    // Dispatch in-app notifications strictly to members of this specific Care Cell
    try {
      const cellMembers = await this.getActiveCellMemberships(activeChurchId, data.cellId);
      const notifBatch = firestore().batch();
      let notifCount = 0;

      for (const mem of cellMembers) {
        if (!mem.memberId) continue;
        const memberNotifRef = firestore()
          .collection(CHURCHES_ROOT_COLLECTION)
          .doc(activeChurchId)
          .collection('members')
          .doc(mem.memberId)
          .collection('notifications')
          .doc();

        notifBatch.set(
          memberNotifRef,
          sanitizeForFirestore({
            id: memberNotifRef.id,
            type: 'care_cell_meeting',
            title: `🤝 ${data.cellName || 'Care Cell'} Gathering`,
            body: `${data.title} on ${data.date} at ${data.startTime}${data.endTime ? ` – ${data.endTime}` : ''}${data.location ? ` at ${data.location}` : ''}. Tap to view Scripture & location!`,
            meetingId: docRef.id,
            cellId: data.cellId,
            cellName: data.cellName || '',
            date: data.date,
            startTime: data.startTime,
            endTime: data.endTime || '',
            location: data.location || '',
            read: false,
            createdAt: firestore.FieldValue.serverTimestamp(),
          })
        );
        notifCount++;
      }

      if (notifCount > 0) {
        await notifBatch.commit();
      }
    } catch (notifErr) {
      console.warn('⚠️ Non-fatal error delivering in-app meeting notifications:', notifErr);
    }

    return docRef.id;
  }

  async updateMeeting(
    churchId: string | undefined,
    meetingId: string,
    updates: Partial<CareCellMeeting>
  ): Promise<void> {
    const col = await this.getMeetingsRef(churchId);
    await col.doc(meetingId).update(
      sanitizeForFirestore({
        ...updates,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      })
    );
  }

  async cancelMeeting(churchId: string | undefined, meetingId: string): Promise<void> {
    await this.updateMeeting(churchId, meetingId, { status: 'Cancelled' });
  }

  async getMeetings(
    churchId: string | undefined,
    cellId?: string,
    options?: { month?: number; year?: number; status?: string }
  ): Promise<CareCellMeeting[]> {
    try {
      const col = await this.getMeetingsRef(churchId);
      let query: any = col;

      if (cellId && cellId !== 'ALL') {
        query = query.where('cellId', '==', cellId);
      }
      if (options?.status && options.status !== 'All') {
        query = query.where('status', '==', options.status);
      }

      const snap = await query.get();
      let list = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as CareCellMeeting[];

      // Sort by date descending in-memory (avoids requiring composite indexes)
      list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      // In-memory filter for month & year if provided
      if (options?.year) {
        list = list.filter((m) => {
          const parts = (m.date || '').split('-');
          if (parts.length < 2) return true;
          const y = parseInt(parts[0], 10);
          const mo = parseInt(parts[1], 10);
          if (options.year && y !== options.year) return false;
          if (options.month && mo !== options.month) return false;
          return true;
        });
      }

      return list;
    } catch (error) {
      console.error('Error fetching Care Cell meetings:', error);
      return [];
    }
  }

  // ── Attendance Engine (Atomic Key Format: ${meetingId}_${memberId}) ─────────

  /**
   * Records or updates meeting attendance in bulk.
   * Document ID format "${meetingId}_${memberId}" guarantees absolute zero duplicate records.
   */
  async recordMeetingAttendance(
    churchId: string | undefined,
    meetingId: string,
    cellId: string,
    records: Array<{
      memberId: string;
      memberName: string;
      memberPhone?: string;
      memberPhoto?: string;
      attendanceStatus: AttendanceStatus;
      notes?: string;
    }>,
    markedBy: string
  ): Promise<void> {
    const col = await this.getAttendanceRef(churchId);
    const batch = firestore().batch();

    for (const rec of records) {
      const compositeDocId = `${meetingId}_${rec.memberId}`;
      const docRef = col.doc(compositeDocId);

      const payload: CareCellAttendance = {
        id: compositeDocId,
        meetingId,
        cellId,
        memberId: rec.memberId,
        memberName: rec.memberName || 'Member',
        memberPhone: rec.memberPhone || '',
        memberPhoto: rec.memberPhoto || '',
        attendanceStatus: rec.attendanceStatus,
        notes: rec.notes || '',
        markedBy,
        markedAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      batch.set(docRef, sanitizeForFirestore(payload), { merge: true });
    }

    await batch.commit();

    // Automatically mark the meeting as Completed if not already
    const meetingsCol = await this.getMeetingsRef(churchId);
    await meetingsCol.doc(meetingId).update(
      sanitizeForFirestore({
        status: 'Completed',
        updatedAt: firestore.FieldValue.serverTimestamp(),
      })
    ).catch(() => {});
  }

  async getMeetingAttendance(churchId: string | undefined, meetingId: string): Promise<CareCellAttendance[]> {
    try {
      const col = await this.getAttendanceRef(churchId);
      const snap = await col.where('meetingId', '==', meetingId).get();
      return snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as CareCellAttendance[];
    } catch (error) {
      console.error('Error fetching meeting attendance:', error);
      return [];
    }
  }

  async getMemberAttendanceHistory(churchId: string | undefined, memberId: string): Promise<CareCellAttendance[]> {
    try {
      const col = await this.getAttendanceRef(churchId);
      const snap = await col.where('memberId', '==', memberId).get();
      return snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as CareCellAttendance[];
    } catch (error) {
      console.error('Error fetching member attendance history:', error);
      return [];
    }
  }

  // ── Overview Statistics Aggregator ──────────────────────────────────────────

  async getOverviewStats(
    churchId?: string,
    filters?: { month?: number; year?: number; cellId?: string; status?: string }
  ): Promise<CareCellOverviewStats> {
    try {
      const [cellsSnap, membershipsSnap, meetingsSnap, followupsSnap] = await Promise.all([
        (await this.getCareCellsRef(churchId)).get(),
        (await this.getMembershipsRef(churchId)).where('membershipStatus', '==', 'Active').get(),
        (await this.getMeetingsRef(churchId)).get(),
        (await this.getFollowupsRef(churchId)).where('status', 'in', ['Pending', 'Needs Further Follow-up']).get(),
      ]);

      const cells = cellsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as CareCell[];
      const totalCareCells = cells.length;
      const activeCareCells = cells.filter((c) => c.status === 'Active').length;
      const inactiveCareCells = cells.filter((c) => c.status === 'Inactive').length;

      // Unique leaders count
      const leaderIds = new Set<string>();
      cells.forEach((c) => {
        if (c.leaderId) leaderIds.add(c.leaderId);
        if (c.assistantLeaderId) leaderIds.add(c.assistantLeaderId);
      });
      const totalCellLeaders = leaderIds.size;

      // Assigned active members count
      let memberships = membershipsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as CareCellMembership[];
      if (filters?.cellId && filters.cellId !== 'ALL') {
        memberships = memberships.filter((m) => m.cellId === filters.cellId);
      }
      const totalAssignedMembers = memberships.length;

      // Monthly meetings count
      const now = new Date();
      const currentYear = filters?.year || now.getFullYear();
      const currentMonth = filters?.month || now.getMonth() + 1;

      let meetings = meetingsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as CareCellMeeting[];
      if (filters?.cellId && filters.cellId !== 'ALL') {
        meetings = meetings.filter((m) => m.cellId === filters.cellId);
      }

      const meetingsThisMonth = meetings.filter((m) => {
        const parts = (m.date || '').split('-');
        if (parts.length < 2) return false;
        const y = parseInt(parts[0], 10);
        const mo = parseInt(parts[1], 10);
        return y === currentYear && mo === currentMonth;
      });

      // Attendance Rate Calculation
      // Average Attendance % = (Present + Late) / Total Expected * 100
      let attendanceRate = 0;
      try {
        const attendanceCol = await this.getAttendanceRef(churchId);
        let attQuery: any = attendanceCol;
        if (filters?.cellId && filters.cellId !== 'ALL') {
          attQuery = attQuery.where('cellId', '==', filters.cellId);
        }
        const attSnap = await attQuery.get();
        const attDocs = attSnap.docs.map((d: any) => d.data());
        if (attDocs.length > 0) {
          const presentOrLate = attDocs.filter((a: any) => a.attendanceStatus === 'Present' || a.attendanceStatus === 'Late').length;
          attendanceRate = Math.round((presentOrLate / attDocs.length) * 100);
        }
      } catch (attErr) {
        console.warn('Attendance rate calculation error:', attErr);
      }

      // Pending/overdue followups
      const membersRequiringFollowup = followupsSnap.docs.length;

      return {
        totalCareCells,
        activeCareCells,
        inactiveCareCells,
        totalCellLeaders,
        totalAssignedMembers,
        totalMeetingsThisMonth: meetingsThisMonth.length,
        averageAttendanceRate: attendanceRate,
        membersRequiringFollowup,
      };
    } catch (error) {
      console.error('Error fetching Care Cell overview stats:', error);
      return {
        totalCareCells: 0,
        activeCareCells: 0,
        inactiveCareCells: 0,
        totalCellLeaders: 0,
        totalAssignedMembers: 0,
        totalMeetingsThisMonth: 0,
        averageAttendanceRate: 0,
        membersRequiringFollowup: 0,
      };
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── PHASE 2: MEMBER CARE & COMMUNICATION ──────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  // ── 1. Care Cell Prayer Requests ──────────────────────────────────────────

  async createPrayerRequest(
    churchId: string | undefined,
    data: Omit<CareCellPrayerRequest, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const activeChurchId = churchId || (await this.getChurchId());
    const col = await this.getPrayerRequestsRef(activeChurchId);
    const docRef = col.doc();
    const payload = {
      ...data,
      id: docRef.id,
      status: data.status || 'New',
      privacy: data.privacy || 'Cell',
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };
    await docRef.set(sanitizeForFirestore(payload));

    // Mirror "Church Prayer Wall" requests to the main Prayer Wall collection so
    // Admins can review/approve them and Church Prayer Wall subscribers receive notifications.
    if (data.privacy === 'Public') {
      try {
        const currentUid = auth().currentUser?.uid || data.memberId || '';
        const combinedText = data.title && data.description
          ? `${data.title}: ${data.description}`
          : data.description || data.title || '';
        await firestore()
          .collection(CHURCHES_ROOT_COLLECTION)
          .doc(activeChurchId)
          .collection('prayerRequests')
          .add(
            sanitizeForFirestore({
              uid: currentUid,
              authorId: data.memberId || currentUid,
              name: data.memberName || 'Church Member',
              phone: data.memberPhone || '',
              title: data.title || 'Care Cell Prayer Request',
              request: combinedText,
              text: combinedText,
              category: 'Care Cell Prayer',
              isPublic: true,
              isAnswered: false,
              type: 'public',
              source: 'care_cell',
              careCellId: data.cellId || '',
              careCellName: (data as any).cellName || '',
              careCellPrayerId: docRef.id,
              createdAt: firestore.FieldValue.serverTimestamp(),
            })
          );
      } catch (mirrorErr) {
        console.warn('Error mirroring public prayer request to Church Prayer Wall:', mirrorErr);
      }
    }

    this.invalidateCareCellsCache(activeChurchId);
    return docRef.id;
  }

  async getCellPrayerRequests(
    churchId: string | undefined,
    cellId: string,
    includePublic: boolean = true
  ): Promise<CareCellPrayerRequest[]> {
    try {
      const col = await this.getPrayerRequestsRef(churchId);
      let query: any = col;
      if (cellId && cellId !== 'ALL') {
        query = query.where('cellId', '==', cellId);
      }
      const snap = await query.get();
      const list = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as CareCellPrayerRequest[];
      list.sort((a, b) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
        return tB - tA;
      });
      return list;
    } catch (error) {
      console.error('Error fetching Care Cell prayer requests:', error);
      return [];
    }
  }

  async updatePrayerRequestStatus(
    churchId: string | undefined,
    requestId: string,
    status: CareCellPrayerRequest['status'],
    pastoralResponse?: string,
    respondedBy?: string
  ): Promise<void> {
    const col = await this.getPrayerRequestsRef(churchId);
    const updateData: any = {
      status,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };
    if (pastoralResponse !== undefined) {
      updateData.pastoralResponse = pastoralResponse.trim();
    }
    if (respondedBy) {
      updateData.respondedBy = respondedBy;
      updateData.respondedAt = firestore.FieldValue.serverTimestamp();
    }
    await col.doc(requestId).update(sanitizeForFirestore(updateData));
  }

  async deletePrayerRequest(churchId: string | undefined, requestId: string): Promise<void> {
    const col = await this.getPrayerRequestsRef(churchId);
    await col.doc(requestId).delete();
  }

  // ── 2. Member Follow-up System ────────────────────────────────────────────

  async createFollowup(
    churchId: string | undefined,
    data: Omit<CareCellFollowup, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const col = await this.getFollowupsRef(churchId);
    const docRef = col.doc();
    const payload = {
      ...data,
      id: docRef.id,
      status: data.status || 'Pending',
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };
    await docRef.set(sanitizeForFirestore(payload)); this.invalidateCareCellsCache(churchId);
    return docRef.id;
  }

  async getCellFollowups(
    churchId: string | undefined,
    cellId?: string,
    statusFilter?: string
  ): Promise<CareCellFollowup[]> {
    try {
      const col = await this.getFollowupsRef(churchId);
      let query: any = col;
      if (cellId && cellId !== 'ALL') {
        query = query.where('cellId', '==', cellId);
      }
      const snap = await query.get();
      let list = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as CareCellFollowup[];

      if (statusFilter && statusFilter !== 'ALL') {
        list = list.filter((f) => f.status === statusFilter);
      }

      list.sort((a, b) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
        return tB - tA;
      });
      return list;
    } catch (error) {
      console.error('Error fetching Care Cell follow-ups:', error);
      return [];
    }
  }

  async updateFollowupStatus(
    churchId: string | undefined,
    followupId: string,
    status: CareCellFollowup['status'],
    notes?: string,
    nextFollowupDate?: string
  ): Promise<void> {
    const col = await this.getFollowupsRef(churchId);
    const updateData: any = {
      status,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };
    if (notes !== undefined) {
      updateData.notes = notes.trim();
    }
    if (nextFollowupDate !== undefined) {
      updateData.nextFollowupDate = nextFollowupDate;
    }
    await col.doc(followupId).update(sanitizeForFirestore(updateData));
  }

  /**
   * Phase 3 Automation: Detects members who missed 2+ consecutive recent meetings in a cell.
   * Returns member IDs with attendance history and dates missed so leaders can trigger 1-tap follow-up.
   */
  async detectInactiveMembers(
    churchId: string | undefined,
    cellId: string
  ): Promise<{ memberId: string; memberName: string; memberPhone?: string; missedCount: number; lastPresentDate?: string }[]> {
    try {
      const [meetings, memberships] = await Promise.all([
        this.getMeetings(churchId, cellId),
        this.getActiveCellMemberships(churchId, cellId),
      ]);

      const completedMeetings = meetings
        .filter((m) => m.status === 'Completed' || m.status === 'Upcoming')
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        .slice(0, 5); // Check up to last 5 meetings

      if (completedMeetings.length < 2) return [];

      const inactiveList: { memberId: string; memberName: string; memberPhone?: string; missedCount: number; lastPresentDate?: string }[] = [];

      // Query attendance for each meeting
      const meetingAttendanceMaps: Record<string, Record<string, string>> = {};
      for (const m of completedMeetings) {
        const attDocs = await this.getMeetingAttendance(churchId, m.id);
        const map: Record<string, string> = {};
        attDocs.forEach((a) => {
          map[a.memberId] = a.attendanceStatus;
        });
        meetingAttendanceMaps[m.id] = map;
      }

      memberships.forEach((mem) => {
        let consecutiveMissed = 0;
        let lastPresentDate: string | undefined;

        for (const m of completedMeetings) {
          const status = meetingAttendanceMaps[m.id]?.[mem.memberId];
          if (status === 'Absent' || status === undefined) {
            consecutiveMissed++;
          } else if (status === 'Present' || status === 'Late') {
            if (!lastPresentDate) lastPresentDate = m.date;
            break;
          }
        }

        if (consecutiveMissed >= 2) {
          inactiveList.push({
            memberId: mem.memberId,
            memberName: mem.memberName,
            memberPhone: mem.memberPhone,
            missedCount: consecutiveMissed,
            lastPresentDate,
          });
        }
      });

      return inactiveList;
    } catch (error) {
      console.error('Error detecting inactive care cell members:', error);
      return [];
    }
  }

  // ── 3. Care Cell Announcements ────────────────────────────────────────────

  async createAnnouncement(
    churchId: string | undefined,
    data: Omit<CareCellAnnouncement, 'id' | 'createdAt'>
  ): Promise<string> {
    const col = await this.getAnnouncementsRef(churchId);
    const docRef = col.doc();
    const payload = {
      ...data,
      id: docRef.id,
      status: 'Active',
      createdAt: firestore.FieldValue.serverTimestamp(),
    };
    await docRef.set(sanitizeForFirestore(payload)); this.invalidateCareCellsCache(churchId);
    return docRef.id;
  }

  async getCellAnnouncements(
    churchId: string | undefined,
    cellId?: string
  ): Promise<CareCellAnnouncement[]> {
    try {
      const col = await this.getAnnouncementsRef(churchId);
      const snap = await col.where('status', '==', 'Active').get();
      let list = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as CareCellAnnouncement[];

      if (cellId && cellId !== 'ALL') {
        list = list.filter((a) => a.cellId === cellId || a.cellId === 'ALL');
      }

      list.sort((a, b) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
        return tB - tA;
      });
      return list;
    } catch (error) {
      console.error('Error fetching Care Cell announcements:', error);
      return [];
    }
  }

  async archiveAnnouncement(churchId: string | undefined, announcementId: string): Promise<void> {
    const col = await this.getAnnouncementsRef(churchId);
    await col.doc(announcementId).update({
      status: 'Archived',
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── CARE CELL VISITS & NOTIFICATIONS MANAGEMENT ───────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Creates a new Care Cell visit notification for a specific Care Cell.
   * Automatically initializes response tracking for all assigned members of the cell,
   * saves the visit, and dispatches in-app notifications to each member.
   */
  async createVisitNotification(
    churchId: string | undefined,
    data: {
      cellId: string;
      cellCode?: string;
      cellName?: string;
      title: string;
      purpose?: string;
      visitDate: string;
      visitTime: string;
      visitors: string;
      createdBy: string;
      createdByName?: string;
      targetMemberIds?: string[];
    }
  ): Promise<string> {
    const activeChurchId = churchId || (await this.getChurchId());
    const col = await this.getVisitsRef(activeChurchId);
    const docRef = col.doc();

    // 1. Fetch all active members assigned to this specific Care Cell
    const allCellMembers = await this.getActiveCellMemberships(activeChurchId, data.cellId);

    // Filter to selected members if specific members were selected
    const targetMembers = data.targetMemberIds && data.targetMemberIds.length > 0
      ? allCellMembers.filter((mem) => data.targetMemberIds!.includes(mem.memberId))
      : allCellMembers;

    // 2. Initialize each target member's availability response as 'Pending'
    const responses: Record<string, CareCellVisitMemberResponse> = {};
    for (const mem of targetMembers) {
      responses[mem.memberId] = {
        memberId: mem.memberId,
        memberName: mem.memberName,
        memberPhone: mem.memberPhone || '',
        memberPhoto: mem.memberPhoto || '',
        response: 'Pending',
        preferredTime: mem.preferredVisitTime || '',
      };
    }

    const payload: CareCellVisit = {
      id: docRef.id,
      churchId: activeChurchId,
      cellId: data.cellId,
      cellCode: data.cellCode || '',
      cellName: data.cellName || 'Care Cell',
      title: data.title || 'Pastoral Home Visit',
      purpose: data.purpose || '',
      visitDate: data.visitDate,
      visitTime: data.visitTime,
      visitors: data.visitors,
      status: 'Scheduled',
      notificationSent: false,
      createdBy: data.createdBy || auth().currentUser?.uid || '',
      createdByName: data.createdByName || '',
      totalMembersCount: targetMembers.length,
      acceptedCount: 0,
      declinedCount: 0,
      pendingCount: targetMembers.length,
      responses,
      targetMemberIds: data.targetMemberIds && data.targetMemberIds.length > 0 ? data.targetMemberIds : undefined,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    await docRef.set(sanitizeForFirestore(payload)); this.invalidateCareCellsCache(churchId);

    // 3. Dispatch in-app notifications strictly to target members (including migrated UID member docs)
    try {
      const membersRef = firestore()
        .collection(CHURCHES_ROOT_COLLECTION)
        .doc(activeChurchId)
        .collection('members');

      let allChurchMembersDocs: any[] | null = null;
      const getAllChurchMembersDocs = async () => {
        if (allChurchMembersDocs === null) {
          const allSnap = await membersRef.get();
          allChurchMembersDocs = allSnap.docs;
        }
        return allChurchMembersDocs;
      };

      const formattedDate = formatVisitDateDisplay(data.visitDate);
      const formattedTime = formatVisitTimeDisplay(data.visitTime);
      const purposeLine = data.purpose?.trim() ? ` Purpose: ${data.purpose.trim()}.` : '';
      const notifBody = `${data.cellName || 'Care Cell'} visit scheduled on ${formattedDate} at ${formattedTime} by ${data.visitors}.${purposeLine} Please confirm your availability and preferred visit time!`;
      const notifTitle = `🏡 Care Cell Visit: ${data.title || 'Pastoral Home Visit'}`;
      const notifId = `cc_visit_${docRef.id}`;

      const notifBatch = firestore().batch();
      const writtenDocIds = new Set<string>();

      for (const mem of targetMembers) {
        if (!mem.memberId) continue;

        const resolvedIds = new Set<string>([mem.memberId]);
        const directSnap = await membersRef.doc(mem.memberId).get();
        if (!directSnap.exists && normalizePhoneDigits(mem.memberPhone).length >= 7) {
          const docs = await getAllChurchMembersDocs();
          for (const d of docs) {
            const mData = d.data();
            if (phonesMatch(mData?.phone || mData?.phoneNumber, mem.memberPhone)) {
              resolvedIds.add(d.id);
            }
          }
        }

        for (const targetDocId of resolvedIds) {
          if (writtenDocIds.has(targetDocId)) continue;
          writtenDocIds.add(targetDocId);

          const memberNotifRef = membersRef
            .doc(targetDocId)
            .collection('notifications')
            .doc(notifId);

          notifBatch.set(
            memberNotifRef,
            sanitizeForFirestore({
              id: notifId,
              type: 'care_cell_visit',
              title: notifTitle,
              content: notifBody,
              body: notifBody,
              visitId: docRef.id,
              relatedId: docRef.id,
              cellId: data.cellId,
              cellName: data.cellName || '',
              visitDate: data.visitDate,
              visitTime: data.visitTime,
              visitors: data.visitors,
              purpose: data.purpose || '',
              screen: 'CareCell',
              targetTab: 'visits',
              targetMemberId: targetDocId,
              recipientId: targetDocId,
              recipientRole: 'member',
              ...(mem.memberPhone ? { targetPhone: mem.memberPhone } : {}),
              read: false,
              createdAt: firestore.FieldValue.serverTimestamp(),
            }),
            { merge: true }
          );
        }
      }

      if (writtenDocIds.size > 0) {
        await notifBatch.commit();
      }

      // Mark in-app notification as sent on the visit record (pushCareCellVisit owns pushNotificationSent)
      await docRef.update({
        notificationSent: true,
        notificationSentAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (notifError) {
      console.warn('⚠️ Non-fatal error delivering in-app notifications for visit:', notifError);
    }

    return docRef.id;
  }

  /**
   * Fetches visits for a specific cell or church-wide, with optional status filter.
   */
  async getVisits(
    churchId: string | undefined,
    cellId?: string,
    statusFilter?: string
  ): Promise<CareCellVisit[]> {
    try {
      const col = await this.getVisitsRef(churchId);
      let query: any = col;

      if (cellId && cellId !== 'ALL') {
        query = query.where('cellId', '==', cellId);
      }

      if (statusFilter && statusFilter !== 'ALL') {
        query = query.where('status', '==', statusFilter);
      }

      const snap = await query.get();
      const list = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as CareCellVisit[];

      // Sort in-memory: scheduled/newest first
      list.sort((a, b) => {
        const dateA = a.visitDate ? new Date(`${a.visitDate}T${a.visitTime || '00:00'}`).getTime() : 0;
        const dateB = b.visitDate ? new Date(`${b.visitDate}T${b.visitTime || '00:00'}`).getTime() : 0;
        return dateB - dateA;
      });

      return list;
    } catch (error) {
      console.error('Error fetching Care Cell visits:', error);
      return [];
    }
  }

  /**
   * Member records their response (Accept / Decline) for an assigned Care Cell visit.
   */
  async respondToVisit(
    churchId: string | undefined,
    visitId: string,
    memberId: string,
    response: MemberVisitResponseStatus,
    notes?: string,
    preferredTime?: string,
    memberPhone?: string
  ): Promise<void> {
    const col = await this.getVisitsRef(churchId);
    const visitDoc = await col.doc(visitId).get();

    if (!visitDoc.exists) {
      throw new Error('Visit notification not found.');
    }

    const currentData = visitDoc.data() as CareCellVisit;
    const responses = { ...(currentData.responses || {}) };

    // Resolve existing response key (handles pre-login contact ID -> Auth UID migration via phone)
    let responseKey = memberId;
    if (!responses[responseKey] && normalizePhoneDigits(memberPhone).length >= 7) {
      const matchedKey = Object.keys(responses).find(
        (k) =>
          responses[k]?.memberId === memberId ||
          phonesMatch(responses[k]?.memberPhone, memberPhone)
      );
      if (matchedKey) {
        responseKey = matchedKey;
      }
    }

    if (!responses[responseKey]) {
      responses[responseKey] = {
        memberId,
        memberName: 'Cell Member',
        memberPhone: memberPhone || '',
        response: 'Pending',
      };
    }

    responses[responseKey] = {
      ...responses[responseKey],
      response,
      respondedAt: new Date().toISOString(),
      notes: notes !== undefined ? notes : responses[responseKey].notes || '',
      preferredTime: preferredTime !== undefined ? preferredTime : responses[responseKey].preferredTime || '',
    };

    // Recalculate response counters
    let accepted = 0;
    let declined = 0;
    let pending = 0;

    Object.values(responses).forEach((r) => {
      if (r.response === 'Accepted') accepted++;
      else if (r.response === 'Declined') declined++;
      else pending++;
    });

    await col.doc(visitId).update(
      sanitizeForFirestore({
        [`responses.${responseKey}`]: responses[responseKey],
        acceptedCount: accepted,
        declinedCount: declined,
        pendingCount: pending,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      })
    );
  }

  /**
   * Updates the overall status of a Care Cell visit (Scheduled, Completed, Cancelled).
   */
  async updateVisitStatus(
    churchId: string | undefined,
    visitId: string,
    status: VisitStatus
  ): Promise<void> {
    const col = await this.getVisitsRef(churchId);
    await col.doc(visitId).update({
      status,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  }

  /**
   * Deletes a visit notification record.
   */
  async deleteVisit(churchId: string | undefined, visitId: string): Promise<void> {
    const col = await this.getVisitsRef(churchId);
    await col.doc(visitId).delete();
  }

  /**
   * Fetches upcoming visits for a specific member in their assigned Care Cell.
   */
  async getMemberUpcomingVisits(
    churchId: string | undefined,
    cellId: string,
    memberId: string,
    memberPhone?: string
  ): Promise<(CareCellVisit & { myResponse?: CareCellVisitMemberResponse })[]> {
    try {
      const col = await this.getVisitsRef(churchId);
      const snap = await col.where('cellId', '==', cellId).where('status', '==', 'Scheduled').get();
      const list = snap.docs
        .map((d: any) => {
          const data = d.data() as CareCellVisit;
          const responsesMap = data.responses || {};
          const matchedKey = responsesMap[memberId]
            ? memberId
            : Object.keys(responsesMap).find(
                (k) =>
                  responsesMap[k]?.memberId === memberId ||
                  (memberPhone && phonesMatch(responsesMap[k]?.memberPhone, memberPhone))
              );

          // Respect specific targetMemberIds so other cell members do not see private targeted visits
          if (Array.isArray(data.targetMemberIds) && data.targetMemberIds.length > 0) {
            const isExplicitTarget =
              data.targetMemberIds.includes(memberId) || Boolean(matchedKey);
            if (!isExplicitTarget) {
              return null;
            }
          }

          const myResponse = (matchedKey ? responsesMap[matchedKey] : undefined) || {
            memberId,
            memberName: '',
            response: 'Pending' as MemberVisitResponseStatus,
          };
          return {
            ...data,
            id: d.id,
            myResponse,
          };
        })
        .filter((item): item is CareCellVisit & { myResponse: CareCellVisitMemberResponse } => item !== null);

      list.sort((a, b) => {
        const dateA = a.visitDate ? new Date(`${a.visitDate}T${a.visitTime || '00:00'}`).getTime() : 0;
        const dateB = b.visitDate ? new Date(`${b.visitDate}T${b.visitTime || '00:00'}`).getTime() : 0;
        return dateA - dateB; // Upcoming earliest first
      });

      return list;
    } catch (e) {
      console.error('Error fetching member Care Cell visits:', e);
      return [];
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── PHASE 3: REPORTS & AUTOMATION ─────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Generates CSV format string of Care Cell members roster for spreadsheet export.
   */
  generateMembersCSV(members: CareCellMembership[], cellName?: string): string {
    const header = ['Cell Code', 'Cell Name', 'Member Name', 'Phone Number', 'Status', 'Joined Date'].join(',');
    const rows = members.map((m) => {
      const cleanPhone = (m.memberPhone || '').replace(/,/g, '');
      const cleanName = (m.memberName || '').replace(/,/g, '');
      const code = (m.cellCode || '').replace(/,/g, '');
      const name = (m.cellName || cellName || '').replace(/,/g, '');
      const status = m.membershipStatus || 'Active';
      const joined = m.joinedAt?.toDate ? m.joinedAt.toDate().toLocaleDateString('en-GB') : '';
      return `"${code}","${name}","${cleanName}","${cleanPhone}","${status}","${joined}"`;
    });
    return [header, ...rows].join('\n');
  }

  /**
   * Generates CSV format string of Meeting Attendance Roll-call for export.
   */
  generateAttendanceCSV(
    attendance: CareCellAttendance[],
    meetingTitle: string,
    meetingDate: string
  ): string {
    const header = ['Meeting Title', 'Meeting Date', 'Member Name', 'Phone Number', 'Attendance Status', 'Notes'].join(',');
    const rows = attendance.map((a) => {
      const cleanName = (a.memberName || '').replace(/,/g, '');
      const cleanPhone = (a.memberPhone || '').replace(/,/g, '');
      const status = a.attendanceStatus || 'Absent';
      const notes = (a.notes || '').replace(/,/g, ' ').replace(/"/g, '""');
      return `"${meetingTitle}","${meetingDate}","${cleanName}","${cleanPhone}","${status}","${notes}"`;
    });
    return [header, ...rows].join('\n');
  }
}

export default new CareCellService();

