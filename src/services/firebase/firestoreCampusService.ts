import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { LEGACY_SEEDED_DUMMY_IDS, ROLE_PERSONAS } from '../../data/mockCampusData';
import {
  AppNotification,
  CampusClub,
  CampusEvent,
  CampusHub,
  ManagedUserRecord,
  OfficialAnnouncement,
  RoleInviteRecord,
  UserProfile,
  UserRole,
} from '../../types/collegeConnect';
import { getTodayIsoDate } from '../api/localCampusService';
import { db, type User } from './firebaseApp';
import { handleFirestoreError, OperationType } from './firestoreErrors';
import {
  BLUEPRINT_LIMITS,
  sanitizeBoundedText,
  sanitizeMinMaxText,
  sanitizeSlugId,
  validateRoleAssignmentInput,
} from './validation';

const BOOTSTRAPPED_ADMIN_EMAIL = 'aniruddhsaxena73@gmail.com';
const inFlightProfileLoads = new Map<string, Promise<{ profile: UserProfile; role: UserRole }>>();
const inFlightPurges = new Map<string, Promise<void>>();

export function isBootstrappedAdminEmail(email: string | null | undefined): boolean {
  return (email ?? '').trim().toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL;
}

export function resolveUserRole(raw: unknown, fallback: UserRole = 'student'): UserRole {
  if (
    raw === 'student' ||
    raw === 'faculty' ||
    raw === 'club_incharge' ||
    raw === 'hub_incharge' ||
    raw === 'super_admin'
  ) {
    return raw;
  }
  return fallback;
}

export async function computeEmailHash(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
    const encoded = new TextEncoder().encode(normalized);
    const digest = await globalThis.crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  throw new Error('Web Crypto SHA-256 is unavailable in this environment.');
}

function mapManagedUserDoc(
  uid: string,
  data: Record<string, unknown>
): ManagedUserRecord {
  return {
    uid: typeof data.uid === 'string' ? data.uid : uid,
    name: typeof data.name === 'string' ? data.name : 'Campus Member',
    email: typeof data.email === 'string' ? data.email : '',
    studentId: typeof data.studentId === 'string' ? data.studentId : 'CC-0000',
    program: typeof data.program === 'string' ? data.program : 'General',
    year: typeof data.year === 'string' ? data.year : '1st Year',
    role: resolveUserRole(data.role, 'student'),
    assignedHubId: typeof data.assignedHubId === 'string' ? data.assignedHubId : 'unassigned',
    assignedClubId: typeof data.assignedClubId === 'string' ? data.assignedClubId : 'unassigned',
  };
}

function mapRoleInviteDoc(
  id: string,
  data: Record<string, unknown>
): RoleInviteRecord {
  return {
    id: typeof data.id === 'string' ? data.id : id,
    email: typeof data.email === 'string' ? data.email : '',
    role: resolveUserRole(data.role, 'student'),
    assignedHubId: typeof data.assignedHubId === 'string' ? data.assignedHubId : 'unassigned',
    assignedClubId: typeof data.assignedClubId === 'string' ? data.assignedClubId : 'unassigned',
    note: typeof data.note === 'string' ? data.note : '',
    invitedByUid: typeof data.invitedByUid === 'string' ? data.invitedByUid : '',
  };
}

export async function ensureUserFirestoreProfile(
  user: User
): Promise<{ profile: UserProfile; role: UserRole }> {
  const existingPromise = inFlightProfileLoads.get(user.uid);
  if (existingPromise) {
    return existingPromise;
  }

  const task = (async () => {
    const uid = user.uid;
    const publicRef = doc(db, 'users', uid, 'public', 'profile');
    const privateRef = doc(db, 'users', uid, 'private', 'info');
    const userDirRef = doc(db, 'userDirectory', uid);
    const publicPath = `users/${uid}/public/profile`;
    const privatePath = `users/${uid}/private/info`;

    const defaultRole: UserRole = isBootstrappedAdminEmail(user.email) ? 'super_admin' : 'student';
    const defaultName = sanitizeBoundedText(
      user.displayName ?? user.email?.split('@')[0] ?? 'Campus Member',
      BLUEPRINT_LIMITS.userNameMax,
      'Campus Member'
    );
    const safeName =
      defaultName.length >= BLUEPRINT_LIMITS.userNameMin ? defaultName : 'Campus Member';
    const safeEmail = sanitizeBoundedText(
      (user.email ?? `${uid}@collegeconnect.edu`).trim().toLowerCase(),
      BLUEPRINT_LIMITS.emailMax,
      `${uid}@collegeconnect.edu`
    );
    const generatedStudentId = sanitizeBoundedText(
      `CC-${new Date().getFullYear()}-${uid.slice(-4).toUpperCase()}`,
      BLUEPRINT_LIMITS.studentIdMax,
      'CC-1000'
    );

    const emailHash = await computeEmailHash(safeEmail);
    const emailDirRef = doc(db, 'emailDirectory', emailHash);
    const inviteRef = doc(db, 'roleInvites', emailHash);
    const adminRef = doc(db, 'admins', uid);
    const isPrimaryAdmin = isBootstrappedAdminEmail(safeEmail);

    const safeGetDoc = async (
      ref: ReturnType<typeof doc>,
      docPath: string
    ) => {
      try {
        return await getDoc(ref);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, docPath);
      }
    };

    const [publicSnap, privateSnap, userDirSnap, emailDirSnap, adminSnap, inviteSnap] =
      await Promise.all([
        safeGetDoc(publicRef, publicPath),
        safeGetDoc(privateRef, privatePath),
        safeGetDoc(userDirRef, `userDirectory/${uid}`),
        safeGetDoc(emailDirRef, `emailDirectory/${emailHash}`),
        getDoc(adminRef).catch(() => null),
        user.email ? getDoc(inviteRef).catch(() => null) : Promise.resolve(null),
      ]);

    const activeInvite =
      inviteSnap?.exists() && !isPrimaryAdmin
        ? mapRoleInviteDoc(inviteSnap.id, inviteSnap.data())
        : null;

    if (!publicSnap.exists() || !privateSnap.exists()) {
      const assignedRole: UserRole = isPrimaryAdmin
        ? 'super_admin'
        : activeInvite
          ? activeInvite.role
          : defaultRole;
      const assignedHubId = activeInvite ? activeInvite.assignedHubId : 'unassigned';
      const assignedClubId = activeInvite ? activeInvite.assignedClubId : 'unassigned';
      const initialProgram =
        assignedRole === 'super_admin'
          ? 'University Administration'
          : ROLE_PERSONAS[assignedRole].defaultProgram;
      const initialYear =
        assignedRole === 'super_admin'
          ? 'Super Admin'
          : ROLE_PERSONAS[assignedRole].defaultYear;

      const batch = writeBatch(db);
      if (!publicSnap.exists()) {
        batch.set(publicRef, {
          uid,
          name: safeName,
          program: initialProgram,
          year: initialYear,
          role: assignedRole,
          assignedHubId,
          assignedClubId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      if (!privateSnap.exists()) {
        batch.set(privateRef, {
          uid,
          email: safeEmail,
          studentId: generatedStudentId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      if (!userDirSnap.exists()) {
        batch.set(userDirRef, {
          uid,
          name: safeName,
          email: safeEmail,
          studentId: generatedStudentId,
          program: initialProgram,
          year: initialYear,
          role: assignedRole,
          assignedHubId,
          assignedClubId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      if (!emailDirSnap.exists()) {
        batch.set(emailDirRef, {
          uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      if (assignedRole === 'super_admin' && !adminSnap?.exists()) {
        batch.set(adminRef, {
          uid,
          grantedByUid: activeInvite?.invitedByUid || uid,
          createdAt: serverTimestamp(),
        });
      }
      if (activeInvite) {
        batch.delete(inviteRef);
      }

      try {
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `${publicPath} + ${privatePath}`);
      }

      return {
        role: assignedRole,
        profile: {
          name: safeName,
          program: initialProgram,
          year: initialYear,
          studentId: generatedStudentId,
          email: safeEmail,
          assignedHubId,
          assignedClubId,
        },
      };
    }

    const pubData = publicSnap.data();
    const privData = privateSnap.data();
    const resolvedName = typeof pubData.name === 'string' ? pubData.name : safeName;
    let resolvedProgram = typeof pubData.program === 'string' ? pubData.program : 'General';
    let resolvedYear = typeof pubData.year === 'string' ? pubData.year : '1st Year';
    const resolvedEmail = typeof privData.email === 'string' ? privData.email : safeEmail;
    const resolvedStudentId =
      typeof privData.studentId === 'string' ? privData.studentId : generatedStudentId;

    let resolvedRole = isPrimaryAdmin ? 'super_admin' : resolveUserRole(pubData.role, defaultRole);
    let resolvedHubId =
      typeof pubData.assignedHubId === 'string' ? pubData.assignedHubId : 'unassigned';
    let resolvedClubId =
      typeof pubData.assignedClubId === 'string' ? pubData.assignedClubId : 'unassigned';

    const syncBatch = writeBatch(db);
    let needsSync = false;

    if (isPrimaryAdmin && pubData.role !== 'super_admin') {
      resolvedRole = 'super_admin';
      resolvedProgram = 'University Administration';
      resolvedYear = 'Super Admin';
      syncBatch.update(publicRef, {
        role: 'super_admin',
        program: resolvedProgram,
        year: resolvedYear,
        updatedAt: serverTimestamp(),
      });
      needsSync = true;
    } else if (activeInvite) {
      resolvedRole = activeInvite.role;
      resolvedHubId = activeInvite.assignedHubId;
      resolvedClubId = activeInvite.assignedClubId;
      syncBatch.update(publicRef, {
        role: resolvedRole,
        assignedHubId: resolvedHubId,
        assignedClubId: resolvedClubId,
        updatedAt: serverTimestamp(),
      });
      syncBatch.delete(inviteRef);
      needsSync = true;
    }

    if (!userDirSnap.exists()) {
      syncBatch.set(userDirRef, {
        uid,
        name: resolvedName,
        email: resolvedEmail,
        studentId: resolvedStudentId,
        program: resolvedProgram,
        year: resolvedYear,
        role: resolvedRole,
        assignedHubId: resolvedHubId,
        assignedClubId: resolvedClubId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      needsSync = true;
    } else if (isPrimaryAdmin && userDirSnap.data()?.role !== 'super_admin') {
      syncBatch.update(userDirRef, {
        role: 'super_admin',
        program: resolvedProgram,
        year: resolvedYear,
        updatedAt: serverTimestamp(),
      });
      needsSync = true;
    } else if (activeInvite) {
      syncBatch.update(userDirRef, {
        role: resolvedRole,
        assignedHubId: resolvedHubId,
        assignedClubId: resolvedClubId,
        updatedAt: serverTimestamp(),
      });
      needsSync = true;
    }

    if (!emailDirSnap.exists()) {
      syncBatch.set(emailDirRef, {
        uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      needsSync = true;
    }

    if (
      !adminSnap?.exists() &&
      (isPrimaryAdmin || (activeInvite && activeInvite.role === 'super_admin'))
    ) {
      syncBatch.set(adminRef, {
        uid,
        grantedByUid: activeInvite?.invitedByUid || uid,
        createdAt: serverTimestamp(),
      });
      needsSync = true;
    }

    if (needsSync) {
      try {
        await syncBatch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `userDirectory/${uid}`);
      }
    }

    return {
      role: resolvedRole,
      profile: {
        name: resolvedName,
        program: resolvedProgram,
        year: resolvedYear,
        assignedHubId: resolvedHubId,
        assignedClubId: resolvedClubId,
        email: resolvedEmail,
        studentId: resolvedStudentId,
      },
    };
  })();

  inFlightProfileLoads.set(user.uid, task);
  try {
    return await task;
  } finally {
    inFlightProfileLoads.delete(user.uid);
  }
}

export function subscribeUserPublicProfile(
  uid: string,
  userEmail: string | null,
  onUpdate: (patch: {
    role: UserRole;
    name?: string;
    program?: string;
    year?: string;
    assignedHubId: string;
    assignedClubId: string;
  }) => void
): () => void {
  const path = `users/${uid}/public/profile`;
  return onSnapshot(
    doc(db, 'users', uid, 'public', 'profile'),
    (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      onUpdate({
        role: isBootstrappedAdminEmail(userEmail)
          ? 'super_admin'
          : resolveUserRole(data.role, 'student'),
        name: typeof data.name === 'string' ? data.name : undefined,
        program: typeof data.program === 'string' ? data.program : undefined,
        year: typeof data.year === 'string' ? data.year : undefined,
        assignedHubId: typeof data.assignedHubId === 'string' ? data.assignedHubId : 'unassigned',
        assignedClubId: typeof data.assignedClubId === 'string' ? data.assignedClubId : 'unassigned',
      });
    },
    (error) => handleFirestoreError(error, OperationType.GET, path)
  );
}

export async function updateUserFirestoreProfile(
  uid: string,
  patch: Partial<Pick<UserProfile, 'name' | 'program' | 'year' | 'assignedHubId'>>
): Promise<void> {
  const path = `users/${uid}/public/profile`;
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (patch.name !== undefined) {
    const cleanName = sanitizeBoundedText(patch.name, BLUEPRINT_LIMITS.userNameMax);
    if (cleanName.length >= BLUEPRINT_LIMITS.userNameMin) {
      payload.name = cleanName;
    }
  }
  if (patch.program !== undefined) {
    const cleanProgram = sanitizeBoundedText(patch.program, BLUEPRINT_LIMITS.programMax);
    if (cleanProgram.length >= 1) {
      payload.program = cleanProgram;
    }
  }
  if (patch.year !== undefined) {
    const cleanYear = sanitizeBoundedText(patch.year, BLUEPRINT_LIMITS.yearMax);
    if (cleanYear.length >= 1) {
      payload.year = cleanYear;
    }
  }
  if (patch.assignedHubId !== undefined) {
    payload.assignedHubId = sanitizeSlugId(patch.assignedHubId, 'hub');
  }

  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', uid, 'public', 'profile'), payload);
    batch.update(doc(db, 'userDirectory', uid), payload);
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function purgeLegacySeededData(uid: string, userEmail: string | null): Promise<void> {
  const key = uid;
  const existingTask = inFlightPurges.get(key);
  if (existingTask) {
    return existingTask;
  }

  const task = (async () => {
    // 1. Clean user's legacy seeded registrations & club memberships safely alongside parent counters
    const linkBatch = writeBatch(db);
    let hasLinkOps = false;

    for (const evtId of LEGACY_SEEDED_DUMMY_IDS.events) {
      const regRef = doc(db, 'users', uid, 'registrations', evtId);
      const evtRef = doc(db, 'events', evtId);
      const [regSnap, evtSnap] = await Promise.all([
        getDoc(regRef).catch(() => null),
        getDoc(evtRef).catch(() => null),
      ]);
      if (regSnap?.exists() && evtSnap?.exists()) {
        const curCount = Number(evtSnap.data()?.attendeeCount ?? 0);
        linkBatch.delete(regRef);
        linkBatch.update(evtRef, {
          attendeeCount: Math.max(0, curCount - 1),
          updatedAt: serverTimestamp(),
        });
        hasLinkOps = true;
      }
    }

    for (const clubId of LEGACY_SEEDED_DUMMY_IDS.clubs) {
      const memRef = doc(db, 'users', uid, 'clubMemberships', clubId);
      const clubRef = doc(db, 'clubs', clubId);
      const [memSnap, clubSnap] = await Promise.all([
        getDoc(memRef).catch(() => null),
        getDoc(clubRef).catch(() => null),
      ]);
      if (memSnap?.exists() && clubSnap?.exists()) {
        const curCount = Number(clubSnap.data()?.memberCount ?? 0);
        linkBatch.delete(memRef);
        linkBatch.update(clubRef, {
          memberCount: Math.max(0, curCount - 1),
          updatedAt: serverTimestamp(),
        });
        hasLinkOps = true;
      }
    }

    if (hasLinkOps) {
      await linkBatch.commit().catch((error) => {
        handleFirestoreError(error, OperationType.DELETE, `users/${uid}/legacy-links`);
      });
    }

    // 2. Clean user's legacy seeded notifications & bookmarks
    const userCleanupBatch = writeBatch(db);
    LEGACY_SEEDED_DUMMY_IDS.notifications.forEach((id) => {
      userCleanupBatch.delete(doc(db, 'users', uid, 'notifications', id));
    });
    LEGACY_SEEDED_DUMMY_IDS.events.forEach((id) => {
      userCleanupBatch.delete(doc(db, 'users', uid, 'savedEvents', id));
    });
    LEGACY_SEEDED_DUMMY_IDS.announcements.forEach((id) => {
      userCleanupBatch.delete(doc(db, 'users', uid, 'savedAnnouncements', id));
      userCleanupBatch.delete(doc(db, 'users', uid, 'readAnnouncements', id));
    });
    await userCleanupBatch.commit().catch((error) => {
      handleFirestoreError(error, OperationType.DELETE, `users/${uid}/legacy-cleanup`);
    });

    // 3. Only verified Firestore Admins can purge legacy seeded shared catalog docs
    const isAdminAccount =
      isBootstrappedAdminEmail(userEmail) ||
      (await getDoc(doc(db, 'admins', uid))
        .then((snap) => snap.exists())
        .catch(() => false));

    if (isAdminAccount) {
      const catalogBatch = writeBatch(db);
      let hasCatalogOps = false;

      const checks = await Promise.all([
        ...LEGACY_SEEDED_DUMMY_IDS.events.map(async (id) => ({
          ref: doc(db, 'events', id),
          snap: await getDoc(doc(db, 'events', id)).catch(() => null),
        })),
        ...LEGACY_SEEDED_DUMMY_IDS.clubs.map(async (id) => ({
          ref: doc(db, 'clubs', id),
          snap: await getDoc(doc(db, 'clubs', id)).catch(() => null),
        })),
        ...LEGACY_SEEDED_DUMMY_IDS.hubs.map(async (id) => ({
          ref: doc(db, 'hubs', id),
          snap: await getDoc(doc(db, 'hubs', id)).catch(() => null),
        })),
        ...LEGACY_SEEDED_DUMMY_IDS.announcements.map(async (id) => ({
          ref: doc(db, 'announcements', id),
          snap: await getDoc(doc(db, 'announcements', id)).catch(() => null),
        })),
      ]);

      checks.forEach(({ ref, snap }) => {
        if (snap?.exists()) {
          catalogBatch.delete(ref);
          hasCatalogOps = true;
        }
      });

      if (hasCatalogOps) {
        await catalogBatch.commit().catch((error) => {
          handleFirestoreError(error, OperationType.DELETE, 'legacy-campus-catalog');
        });
      }
    }
  })();

  inFlightPurges.set(key, task);
  try {
    await task;
  } finally {
    inFlightPurges.delete(key);
  }
}

export interface LiveCampusHandlers {
  onHubs: (hubs: CampusHub[]) => void;
  onClubs: (clubs: Omit<CampusClub, 'isJoined'>[]) => void;
  onEvents: (events: Omit<CampusEvent, 'isRegistered' | 'isSaved'>[]) => void;
  onAnnouncements: (announcements: Omit<OfficialAnnouncement, 'isRead' | 'isSaved'>[]) => void;
  onRegistrations: (eventIds: Set<string>) => void;
  onSavedEvents: (eventIds: Set<string>) => void;
  onSavedAnnouncements: (announcementIds: Set<string>) => void;
  onReadAnnouncements: (announcementIds: Set<string>) => void;
  onClubMemberships: (clubIds: Set<string>) => void;
  onNotifications: (notifications: AppNotification[]) => void;
}

export function subscribeCampusCatalog(
  uid: string,
  userEmail: string | null,
  handlers: LiveCampusHandlers
): () => void {
  const unsubs: Unsubscribe[] = [];

  unsubs.push(
    onSnapshot(
      query(collection(db, 'hubs'), where('visibility', '==', 'campus')),
      (snap) => {
        const rows: CampusHub[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id ?? d.id),
            name: String(data.name ?? ''),
            focus: String(data.focus ?? ''),
            inChargeName: String(data.inChargeName ?? ''),
            building: String(data.building ?? ''),
            activeEventsCount: Number(data.activeEventsCount ?? 0),
          };
        });
        handlers.onHubs(rows);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'hubs')
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(db, 'clubs'), where('visibility', '==', 'campus')),
      (snap) => {
        const rows = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id ?? d.id),
            name: String(data.name ?? ''),
            hubId: String(data.hubId ?? ''),
            hubName: String(data.hubName ?? ''),
            tagline: String(data.tagline ?? ''),
            meetingSchedule: String(data.meetingSchedule ?? ''),
            location: String(data.location ?? ''),
            memberCount: Number(data.memberCount ?? 0),
            leadName: String(data.leadName ?? ''),
          };
        });
        handlers.onClubs(rows);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'clubs')
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(db, 'announcements'), where('visibility', '==', 'campus')),
      (snap) => {
        const rows = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id ?? d.id),
            title: String(data.title ?? ''),
            category: data.category as OfficialAnnouncement['category'],
            issuerTitle: String(data.issuerTitle ?? ''),
            authorRole: data.authorRole as UserRole,
            summary: String(data.summary ?? ''),
            postedAt: String(data.postedAt ?? 'Recently'),
            date: String(data.date ?? getTodayIsoDate()),
            pinned: Boolean(data.pinned),
          };
        });
        handlers.onAnnouncements(rows);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'announcements')
    )
  );

  const mapEventDoc = (d: { id: string; data: () => Record<string, unknown> }) => {
    const data = d.data();
    return {
      id: String(data.id ?? d.id),
      title: String(data.title ?? ''),
      category: data.category as CampusEvent['category'],
      date: String(data.date ?? ''),
      dateDisplay: String(data.dateDisplay ?? ''),
      time: String(data.time ?? ''),
      venue: String(data.venue ?? ''),
      entryLabel: String(data.entryLabel ?? 'Free Entry'),
      isFree: Boolean(data.isFree),
      description: String(data.description ?? ''),
      highlights: Array.isArray(data.highlights) ? (data.highlights as string[]) : [],
      hubId: String(data.hubId ?? ''),
      hubName: String(data.hubName ?? ''),
      organizerName: String(data.organizerName ?? ''),
      authorRole: data.authorRole as UserRole,
      status: (data.status === 'pending' ? 'pending' : 'approved') as CampusEvent['status'],
      artwork: data.artwork as CampusEvent['artwork'],
      featured: typeof data.featured === 'boolean' ? data.featured : undefined,
      noteTag: typeof data.noteTag === 'string' ? data.noteTag : undefined,
      attendeeCount: Number(data.attendeeCount ?? 0),
      capacity: Number(data.capacity ?? 100),
    };
  };

  if (isBootstrappedAdminEmail(userEmail)) {
    unsubs.push(
      onSnapshot(
        collection(db, 'events'),
        (snap) => handlers.onEvents(snap.docs.map(mapEventDoc)),
        (error) => handleFirestoreError(error, OperationType.LIST, 'events')
      )
    );
  } else {
    let approvedRows: Omit<CampusEvent, 'isRegistered' | 'isSaved'>[] = [];
    let authoredRows: Omit<CampusEvent, 'isRegistered' | 'isSaved'>[] = [];

    const emitMergedEvents = () => {
      const merged = new Map<string, Omit<CampusEvent, 'isRegistered' | 'isSaved'>>();
      approvedRows.forEach((evt) => merged.set(evt.id, evt));
      authoredRows.forEach((evt) => merged.set(evt.id, evt));
      handlers.onEvents(Array.from(merged.values()));
    };

    unsubs.push(
      onSnapshot(
        query(collection(db, 'events'), where('status', '==', 'approved')),
        (snap) => {
          approvedRows = snap.docs.map(mapEventDoc);
          emitMergedEvents();
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'events (approved)')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'events'), where('authorUid', '==', uid)),
        (snap) => {
          authoredRows = snap.docs.map(mapEventDoc);
          emitMergedEvents();
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'events (authored)')
      )
    );
  }

  unsubs.push(
    onSnapshot(
      query(collection(db, 'users', uid, 'registrations'), where('userId', '==', uid)),
      (snap) => handlers.onRegistrations(new Set(snap.docs.map((d) => d.id))),
      (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/registrations`)
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(db, 'users', uid, 'savedEvents'), where('userId', '==', uid)),
      (snap) => handlers.onSavedEvents(new Set(snap.docs.map((d) => d.id))),
      (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/savedEvents`)
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(db, 'users', uid, 'savedAnnouncements'), where('userId', '==', uid)),
      (snap) => handlers.onSavedAnnouncements(new Set(snap.docs.map((d) => d.id))),
      (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/savedAnnouncements`)
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(db, 'users', uid, 'readAnnouncements'), where('userId', '==', uid)),
      (snap) => handlers.onReadAnnouncements(new Set(snap.docs.map((d) => d.id))),
      (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/readAnnouncements`)
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(db, 'users', uid, 'clubMemberships'), where('userId', '==', uid)),
      (snap) => handlers.onClubMemberships(new Set(snap.docs.map((d) => d.id))),
      (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/clubMemberships`)
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(db, 'users', uid, 'notifications'), where('userId', '==', uid)),
      (snap) => {
        const rows: AppNotification[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id ?? d.id),
            type: data.type as AppNotification['type'],
            title: String(data.title ?? ''),
            message: String(data.message ?? ''),
            timeAgo: String(data.timeAgo ?? 'Just now'),
            isRead: Boolean(data.isRead),
            targetScreen: data.targetScreen as AppNotification['targetScreen'],
            targetId: typeof data.targetId === 'string' ? data.targetId : undefined,
          };
        });
        handlers.onNotifications(rows);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/notifications`)
    )
  );

  return () => {
    unsubs.forEach((unsub) => unsub());
  };
}

export async function toggleFirestoreEventRegistration(
  uid: string,
  event: CampusEvent,
  nextRegistered: boolean
): Promise<void> {
  const regPath = `users/${uid}/registrations/${event.id}`;
  const eventPath = `events/${event.id}`;
  const batch = writeBatch(db);
  const regRef = doc(db, 'users', uid, 'registrations', event.id);
  const evtRef = doc(db, 'events', event.id);

  if (nextRegistered) {
    batch.set(regRef, {
      userId: uid,
      eventId: event.id,
      createdAt: serverTimestamp(),
    });
    batch.update(evtRef, {
      attendeeCount: Math.min(event.capacity, event.attendeeCount + 1),
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.delete(regRef);
    batch.update(evtRef, {
      attendeeCount: Math.max(0, event.attendeeCount - 1),
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${regPath} + ${eventPath}`);
  }
}

export async function toggleFirestoreBookmark(
  uid: string,
  subcollection: 'savedEvents' | 'savedAnnouncements',
  targetId: string,
  nextSaved: boolean
): Promise<void> {
  const path = `users/${uid}/${subcollection}/${targetId}`;
  const ref = doc(db, 'users', uid, subcollection, targetId);
  try {
    if (nextSaved) {
      await setDoc(ref, {
        userId: uid,
        targetId,
        createdAt: serverTimestamp(),
      });
    } else {
      const batch = writeBatch(db);
      batch.delete(ref);
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, nextSaved ? OperationType.CREATE : OperationType.DELETE, path);
  }
}

export async function markFirestoreAnnouncementRead(
  uid: string,
  announcementId: string
): Promise<void> {
  const path = `users/${uid}/readAnnouncements/${announcementId}`;
  try {
    await setDoc(doc(db, 'users', uid, 'readAnnouncements', announcementId), {
      userId: uid,
      targetId: announcementId,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function toggleFirestoreClubMembership(
  uid: string,
  club: CampusClub,
  nextJoined: boolean
): Promise<void> {
  const memPath = `users/${uid}/clubMemberships/${club.id}`;
  const clubPath = `clubs/${club.id}`;
  const batch = writeBatch(db);
  const memRef = doc(db, 'users', uid, 'clubMemberships', club.id);
  const clubRef = doc(db, 'clubs', club.id);

  if (nextJoined) {
    batch.set(memRef, {
      userId: uid,
      clubId: club.id,
      createdAt: serverTimestamp(),
    });
    batch.update(clubRef, {
      memberCount: club.memberCount + 1,
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.delete(memRef);
    batch.update(clubRef, {
      memberCount: Math.max(0, club.memberCount - 1),
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${memPath} + ${clubPath}`);
  }
}

export async function publishFirestoreEvent(
  uid: string,
  event: CampusEvent,
  notification: AppNotification
): Promise<void> {
  const safeId = sanitizeSlugId(event.id, 'evt');
  const notifId = sanitizeSlugId(notification.id, 'not');
  const safeHighlights = event.highlights
    .slice(0, BLUEPRINT_LIMITS.highlightsMax)
    .map((h) => sanitizeBoundedText(h, BLUEPRINT_LIMITS.highlightTagMax))
    .filter((h) => h.length > 0);

  const eventPayload: Record<string, unknown> = {
    id: safeId,
    title: sanitizeMinMaxText(
      event.title,
      BLUEPRINT_LIMITS.eventTitleMin,
      BLUEPRINT_LIMITS.eventTitleMax,
      'Campus Event'
    ),
    category: event.category,
    date: BLUEPRINT_LIMITS.isoDatePattern.test(event.date) ? event.date : getTodayIsoDate(),
    dateDisplay: sanitizeMinMaxText(
      event.dateDisplay,
      4,
      BLUEPRINT_LIMITS.eventDateDisplayMax,
      'Upcoming'
    ),
    time: sanitizeMinMaxText(event.time, 2, BLUEPRINT_LIMITS.eventTimeMax, '4:00 PM'),
    venue: sanitizeMinMaxText(event.venue, 2, BLUEPRINT_LIMITS.eventVenueMax, 'Main Campus'),
    entryLabel: sanitizeMinMaxText(
      event.entryLabel,
      2,
      BLUEPRINT_LIMITS.entryLabelMax,
      'Free Entry'
    ),
    isFree: event.isFree,
    description: sanitizeMinMaxText(
      event.description,
      BLUEPRINT_LIMITS.eventDescMin,
      BLUEPRINT_LIMITS.eventDescMax,
      'Campus event details.'
    ),
    highlights: safeHighlights.length > 0 ? safeHighlights : [event.category],
    hubId: sanitizeSlugId(event.hubId, 'hub'),
    hubName: sanitizeMinMaxText(event.hubName, 2, BLUEPRINT_LIMITS.hubNameMax, 'Campus Hub'),
    organizerName: sanitizeMinMaxText(
      event.organizerName,
      2,
      BLUEPRINT_LIMITS.userNameMax,
      'Campus Organizer'
    ),
    authorUid: uid,
    authorRole: event.authorRole,
    status: event.status,
    artwork: event.artwork,
    attendeeCount: Math.max(0, Math.min(event.capacity, event.attendeeCount)),
    capacity: Math.max(1, event.capacity),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const batch = writeBatch(db);
  batch.set(doc(db, 'events', safeId), eventPayload);
  batch.set(doc(db, 'users', uid, 'notifications', notifId), {
    id: notifId,
    userId: uid,
    type: notification.type,
    title: sanitizeMinMaxText(
      notification.title,
      BLUEPRINT_LIMITS.notificationTitleMin,
      BLUEPRINT_LIMITS.notificationTitleMax,
      'Campus Update'
    ),
    message: sanitizeMinMaxText(
      notification.message,
      BLUEPRINT_LIMITS.notificationMsgMin,
      BLUEPRINT_LIMITS.notificationMsgMax,
      'Event submitted.'
    ),
    timeAgo: sanitizeMinMaxText(notification.timeAgo, 1, BLUEPRINT_LIMITS.postedAtMax, 'Just now'),
    isRead: false,
    targetScreen: notification.targetScreen,
    targetId: safeId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `events/${safeId}`);
  }
}

export async function publishFirestoreAnnouncement(
  uid: string,
  announcement: OfficialAnnouncement,
  notification: AppNotification
): Promise<void> {
  const safeId = sanitizeSlugId(announcement.id, 'ann');
  const notifId = sanitizeSlugId(notification.id, 'not');

  const batch = writeBatch(db);
  batch.set(doc(db, 'announcements', safeId), {
    id: safeId,
    title: sanitizeMinMaxText(
      announcement.title,
      BLUEPRINT_LIMITS.announcementTitleMin,
      BLUEPRINT_LIMITS.announcementTitleMax,
      'Campus Notice'
    ),
    category: announcement.category,
    issuerTitle: sanitizeMinMaxText(
      announcement.issuerTitle,
      2,
      BLUEPRINT_LIMITS.issuerTitleMax,
      'Campus Office'
    ),
    authorUid: uid,
    authorRole: announcement.authorRole,
    summary: sanitizeMinMaxText(
      announcement.summary,
      BLUEPRINT_LIMITS.announcementSummaryMin,
      BLUEPRINT_LIMITS.announcementSummaryMax,
      'Official campus notice.'
    ),
    postedAt: sanitizeMinMaxText(
      announcement.postedAt,
      2,
      BLUEPRINT_LIMITS.postedAtMax,
      'Just now'
    ),
    date: BLUEPRINT_LIMITS.isoDatePattern.test(announcement.date)
      ? announcement.date
      : getTodayIsoDate(),
    pinned: Boolean(announcement.pinned),
    visibility: 'campus',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(db, 'users', uid, 'notifications', notifId), {
    id: notifId,
    userId: uid,
    type: notification.type,
    title: sanitizeMinMaxText(
      notification.title,
      BLUEPRINT_LIMITS.notificationTitleMin,
      BLUEPRINT_LIMITS.notificationTitleMax,
      'Official Notice'
    ),
    message: sanitizeMinMaxText(
      notification.message,
      BLUEPRINT_LIMITS.notificationMsgMin,
      BLUEPRINT_LIMITS.notificationMsgMax,
      'Announcement posted.'
    ),
    timeAgo: sanitizeMinMaxText(notification.timeAgo, 1, BLUEPRINT_LIMITS.postedAtMax, 'Just now'),
    isRead: false,
    targetScreen: notification.targetScreen,
    targetId: safeId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `announcements/${safeId}`);
  }
}

export async function approveFirestoreEvent(
  uid: string,
  eventId: string,
  notification: AppNotification
): Promise<void> {
  const notifId = sanitizeSlugId(notification.id, 'not');
  const batch = writeBatch(db);
  batch.update(doc(db, 'events', eventId), {
    status: 'approved',
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(db, 'users', uid, 'notifications', notifId), {
    id: notifId,
    userId: uid,
    type: notification.type,
    title: sanitizeMinMaxText(
      notification.title,
      BLUEPRINT_LIMITS.notificationTitleMin,
      BLUEPRINT_LIMITS.notificationTitleMax,
      'Event Approved'
    ),
    message: sanitizeMinMaxText(
      notification.message,
      BLUEPRINT_LIMITS.notificationMsgMin,
      BLUEPRINT_LIMITS.notificationMsgMax,
      'Submission approved.'
    ),
    timeAgo: sanitizeMinMaxText(notification.timeAgo, 1, BLUEPRINT_LIMITS.postedAtMax, 'Just now'),
    isRead: false,
    targetScreen: notification.targetScreen,
    targetId: sanitizeSlugId(eventId, 'evt'),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `events/${eventId}`);
  }
}

export async function rejectFirestoreEvent(eventId: string): Promise<void> {
  const path = `events/${eventId}`;
  const batch = writeBatch(db);
  batch.delete(doc(db, 'events', eventId));
  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function markFirestoreNotificationRead(
  uid: string,
  notificationId: string
): Promise<void> {
  const path = `users/${uid}/notifications/${notificationId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'notifications', notificationId), {
      isRead: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function markAllFirestoreNotificationsRead(
  uid: string,
  unreadIds: string[]
): Promise<void> {
  if (unreadIds.length === 0) return;
  const batch = writeBatch(db);
  unreadIds.forEach((id) => {
    batch.update(doc(db, 'users', uid, 'notifications', id), {
      isRead: true,
      updatedAt: serverTimestamp(),
    });
  });
  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}/notifications`);
  }
}

export async function createFirestoreHub(hub: CampusHub): Promise<void> {
  const safeId = sanitizeSlugId(hub.id, 'hub');
  try {
    await setDoc(doc(db, 'hubs', safeId), {
      id: safeId,
      name: sanitizeMinMaxText(hub.name, 2, 100, 'Campus Hub'),
      focus: sanitizeMinMaxText(hub.focus, 4, 240, 'Student community & campus events'),
      inChargeName: sanitizeMinMaxText(hub.inChargeName, 2, 80, 'Hub Head'),
      building: sanitizeMinMaxText(hub.building, 1, 100, 'Main Campus'),
      activeEventsCount: Math.max(0, hub.activeEventsCount),
      visibility: 'campus',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `hubs/${safeId}`);
  }
}

export async function createFirestoreClub(club: CampusClub): Promise<void> {
  const safeId = sanitizeSlugId(club.id, 'club');
  try {
    await setDoc(doc(db, 'clubs', safeId), {
      id: safeId,
      name: sanitizeMinMaxText(club.name, 2, 100, 'Campus Club'),
      hubId: sanitizeSlugId(club.hubId, 'hub'),
      hubName: sanitizeMinMaxText(club.hubName, 2, 100, 'Campus Hub'),
      tagline: sanitizeMinMaxText(club.tagline, 4, 240, 'Official student club'),
      meetingSchedule: sanitizeMinMaxText(club.meetingSchedule, 2, 80, 'Weekly'),
      location: sanitizeMinMaxText(club.location, 1, 100, 'Main Campus'),
      memberCount: Math.max(0, club.memberCount),
      leadName: sanitizeMinMaxText(club.leadName, 2, 80, 'Club Lead'),
      visibility: 'campus',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `clubs/${safeId}`);
  }
}

export function subscribeRoleManagementDirectory(
  uid: string,
  userEmail: string | null,
  handlers: {
    onUsers: (users: ManagedUserRecord[]) => void;
    onInvites: (invites: RoleInviteRecord[]) => void;
  }
): () => void {
  const unsubs: Unsubscribe[] = [];

  if (isBootstrappedAdminEmail(userEmail)) {
    unsubs.push(
      onSnapshot(
        collection(db, 'userDirectory'),
        (snap) => {
          const rows = snap.docs
            .map((d) => mapManagedUserDoc(d.id, d.data()))
            .sort((a, b) => a.name.localeCompare(b.name));
          handlers.onUsers(rows);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'userDirectory')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'roleInvites'),
        (snap) => {
          const rows = snap.docs
            .map((d) => mapRoleInviteDoc(d.id, d.data()))
            .sort((a, b) => a.email.localeCompare(b.email));
          handlers.onInvites(rows);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'roleInvites')
      )
    );
  } else {
    unsubs.push(
      onSnapshot(
        doc(db, 'userDirectory', uid),
        (snap) => {
          if (snap.exists()) {
            handlers.onUsers([mapManagedUserDoc(snap.id, snap.data())]);
          } else {
            handlers.onUsers([]);
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, `userDirectory/${uid}`)
      )
    );
    handlers.onInvites([]);
  }

  return () => {
    unsubs.forEach((unsub) => unsub());
  };
}

export async function lookupFirestoreUserByEmail(emailRaw: string): Promise<{
  user: ManagedUserRecord | null;
  invite: RoleInviteRecord | null;
}> {
  const email = emailRaw.trim().toLowerCase();
  if (!email) {
    return { user: null, invite: null };
  }
  const emailHash = await computeEmailHash(email);
  try {
    const [emailDirSnap, inviteSnap] = await Promise.all([
      getDoc(doc(db, 'emailDirectory', emailHash)),
      getDoc(doc(db, 'roleInvites', emailHash)),
    ]);

    let user: ManagedUserRecord | null = null;
    if (emailDirSnap.exists()) {
      const targetUid = String(emailDirSnap.data().uid ?? '');
      if (targetUid) {
        const userSnap = await getDoc(doc(db, 'userDirectory', targetUid));
        if (userSnap.exists()) {
          user = mapManagedUserDoc(userSnap.id, userSnap.data());
        }
      }
    }

    const invite = inviteSnap.exists()
      ? mapRoleInviteDoc(inviteSnap.id, inviteSnap.data())
      : null;

    return { user, invite };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `emailDirectory/${emailHash}`);
  }
}

export async function assignFirestoreUserRole(
  adminUid: string,
  target: ManagedUserRecord,
  updates: {
    role: UserRole;
    assignedHubId: string;
    assignedClubId: string;
    program?: string;
    year?: string;
  }
): Promise<void> {
  if (target.uid === adminUid && updates.role !== 'super_admin') {
    throw new Error('You cannot remove your own Super Admin access.');
  }
  if (isBootstrappedAdminEmail(target.email) && updates.role !== 'super_admin') {
    throw new Error('The primary bootstrapped Super Admin account cannot be demoted.');
  }

  const safeHubId = sanitizeSlugId(updates.assignedHubId || 'unassigned', 'hub');
  const safeClubId = sanitizeSlugId(updates.assignedClubId || 'unassigned', 'club');
  const cleanProgram = sanitizeBoundedText(
    updates.program ?? target.program,
    BLUEPRINT_LIMITS.programMax,
    target.program || 'General'
  );
  const cleanYear = sanitizeBoundedText(
    updates.year ?? target.year,
    BLUEPRINT_LIMITS.yearMax,
    target.year || ROLE_PERSONAS[updates.role].defaultYear
  );

  const notifId = sanitizeSlugId(`not-role-${Date.now()}`, 'not');
  const roleLabel = ROLE_PERSONAS[updates.role].label;

  const batch = writeBatch(db);
  const profilePatch = {
    role: updates.role,
    assignedHubId: safeHubId,
    assignedClubId: safeClubId,
    program: cleanProgram,
    year: cleanYear,
    updatedAt: serverTimestamp(),
  };

  batch.update(doc(db, 'users', target.uid, 'public', 'profile'), profilePatch);
  batch.update(doc(db, 'userDirectory', target.uid), profilePatch);

  if (target.uid !== adminUid && !isBootstrappedAdminEmail(target.email)) {
    const adminRef = doc(db, 'admins', target.uid);
    if (updates.role === 'super_admin') {
      batch.set(adminRef, {
        uid: target.uid,
        grantedByUid: adminUid,
        createdAt: serverTimestamp(),
      });
    } else {
      batch.delete(adminRef);
    }
  }

  batch.set(doc(db, 'users', target.uid, 'notifications', notifId), {
    id: notifId,
    userId: target.uid,
    type: 'approved',
    title: 'Campus Role Updated',
    message: `Your CollegeConnect role is now ${roleLabel}.`,
    timeAgo: 'Just now',
    isRead: false,
    targetScreen: 'profile',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${target.uid}/public/profile`);
  }
}

export async function upsertFirestoreRoleInvite(
  adminUid: string,
  input: {
    email: string;
    role: UserRole;
    assignedHubId: string;
    assignedClubId: string;
    note?: string;
  }
): Promise<RoleInviteRecord> {
  const validation = validateRoleAssignmentInput(input);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const cleanEmail = input.email.trim().toLowerCase();
  const safeHubId = sanitizeSlugId(input.assignedHubId || 'unassigned', 'hub');
  const safeClubId = sanitizeSlugId(input.assignedClubId || 'unassigned', 'club');
  const cleanNote = sanitizeBoundedText(input.note ?? '', BLUEPRINT_LIMITS.noteMax);
  const inviteId = await computeEmailHash(cleanEmail);
  const ref = doc(db, 'roleInvites', inviteId);

  try {
    const existingSnap = await getDoc(ref);
    if (existingSnap.exists()) {
      await updateDoc(ref, {
        role: input.role,
        assignedHubId: safeHubId,
        assignedClubId: safeClubId,
        note: cleanNote,
        invitedByUid: adminUid,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        id: inviteId,
        email: cleanEmail,
        role: input.role,
        assignedHubId: safeHubId,
        assignedClubId: safeClubId,
        note: cleanNote,
        invitedByUid: adminUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `roleInvites/${inviteId}`);
  }

  return {
    id: inviteId,
    email: cleanEmail,
    role: input.role,
    assignedHubId: safeHubId,
    assignedClubId: safeClubId,
    note: cleanNote,
    invitedByUid: adminUid,
  };
}

export async function deleteFirestoreRoleInvite(inviteId: string): Promise<void> {
  const path = `roleInvites/${inviteId}`;
  try {
    await deleteDoc(doc(db, 'roleInvites', inviteId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
