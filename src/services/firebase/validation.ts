import type {
  AnnouncementCategory,
  EventArtworkTheme,
  EventCategory,
  ScreenId,
  UserRole,
} from '../../types/collegeConnect.ts';

/**
 * Validation limits & regex patterns mirrored verbatim from `firebase-blueprint.json`
 * and `firestore.rules` (Validation Synchronicity).
 */
export const BLUEPRINT_LIMITS = {
  idPattern: /^[a-zA-Z0-9_-]+$/,
  isoDatePattern: /^\d{4}-\d{2}-\d{2}$/,
  uidMax: 128,
  shortIdMax: 64,
  userNameMin: 2,
  userNameMax: 80,
  programMax: 60,
  yearMax: 40,
  emailMin: 3,
  emailMax: 160,
  studentIdMin: 2,
  studentIdMax: 40,
  hubNameMin: 2,
  hubNameMax: 100,
  eventTitleMin: 3,
  eventTitleMax: 120,
  eventDateDisplayMax: 32,
  eventTimeMax: 32,
  eventVenueMax: 100,
  entryLabelMax: 40,
  eventDescMin: 8,
  eventDescMax: 1200,
  highlightsMax: 6,
  highlightTagMax: 40,
  noteTagMax: 40,
  announcementTitleMin: 3,
  announcementTitleMax: 140,
  issuerTitleMax: 120,
  announcementSummaryMin: 8,
  announcementSummaryMax: 1200,
  postedAtMax: 32,
  notificationTitleMin: 2,
  notificationTitleMax: 100,
  notificationMsgMin: 2,
  notificationMsgMax: 240,
  noteMax: 120,
} as const;

export const ALLOWED_ROLES: readonly UserRole[] = [
  'student',
  'faculty',
  'club_incharge',
  'hub_incharge',
  'super_admin',
];

export const ALLOWED_EVENT_CATEGORIES: readonly EventCategory[] = [
  'Cultural',
  'Tech',
  'Sports',
  'Workshop',
  'Competition',
  'Social',
];

export const ALLOWED_ARTWORKS: readonly EventArtworkTheme[] = [
  'music_fest',
  'open_mic',
  'photography',
  'business_plan',
  'blood_camp',
  'hackathon',
  'campus_general',
];

export const ALLOWED_ANNOUNCEMENT_CATEGORIES: readonly AnnouncementCategory[] = [
  'Academic',
  'Exam',
  'Hostel',
  'General',
];

export const ALLOWED_TARGET_SCREENS: readonly ScreenId[] = [
  'home',
  'explore',
  'event_detail',
  'hubs',
  'announcements',
  'calendar',
  'saved',
  'notifications',
  'profile',
  'settings',
  'role_management',
  'assistant',
];

export function isValidDocumentId(id: string, maxLen: number = BLUEPRINT_LIMITS.uidMax): boolean {
  return (
    typeof id === 'string' &&
    id.length >= 1 &&
    id.length <= maxLen &&
    BLUEPRINT_LIMITS.idPattern.test(id)
  );
}

export function sanitizeBoundedText(value: string, maxLength: number, fallback = ''): string {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, maxLength);
}

export function sanitizeMinMaxText(
  value: string,
  minLength: number,
  maxLength: number,
  fallback: string
): string {
  const trimmed = value.trim().slice(0, maxLength);
  if (trimmed.length < minLength) {
    return fallback.slice(0, maxLength);
  }
  return trimmed;
}

export function sanitizeSlugId(raw: string, fallbackPrefix = 'item'): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, BLUEPRINT_LIMITS.shortIdMax);
  return isValidDocumentId(cleaned, BLUEPRINT_LIMITS.shortIdMax)
    ? cleaned
    : `${fallbackPrefix}-${Date.now()}`;
}

export interface ProfileUpdateCandidate {
  uid: string;
  name: string;
  program: string;
  year: string;
  role: UserRole;
  assignedHubId: string;
  assignedClubId?: string;
  extraKeys?: string[];
}

export function validatePublicProfilePayload(payload: ProfileUpdateCandidate): {
  ok: boolean;
  error?: string;
} {
  if (payload.extraKeys && payload.extraKeys.length > 0) {
    return { ok: false, error: 'Disallowed shadow keys in profile payload.' };
  }
  if (!isValidDocumentId(payload.uid, BLUEPRINT_LIMITS.uidMax)) {
    return { ok: false, error: 'Invalid UID format.' };
  }
  if (
    payload.name.length < BLUEPRINT_LIMITS.userNameMin ||
    payload.name.length > BLUEPRINT_LIMITS.userNameMax
  ) {
    return { ok: false, error: 'Display name must be between 2 and 80 characters.' };
  }
  if (payload.program.length < 1 || payload.program.length > BLUEPRINT_LIMITS.programMax) {
    return { ok: false, error: 'Program must be between 1 and 60 characters.' };
  }
  if (payload.year.length < 1 || payload.year.length > BLUEPRINT_LIMITS.yearMax) {
    return { ok: false, error: 'Year/title must be between 1 and 40 characters.' };
  }
  if (!ALLOWED_ROLES.includes(payload.role)) {
    return { ok: false, error: 'Unsupported role value.' };
  }
  if (!isValidDocumentId(payload.assignedHubId, BLUEPRINT_LIMITS.shortIdMax)) {
    return { ok: false, error: 'Invalid assignedHubId.' };
  }
  if (
    payload.assignedClubId !== undefined &&
    !isValidDocumentId(payload.assignedClubId, BLUEPRINT_LIMITS.shortIdMax)
  ) {
    return { ok: false, error: 'Invalid assignedClubId.' };
  }
  return { ok: true };
}

export interface RoleAssignmentCandidate {
  role: UserRole;
  assignedHubId: string;
  assignedClubId: string;
  email?: string;
  note?: string;
}

export function validateRoleAssignmentInput(
  candidate: RoleAssignmentCandidate
): { ok: true } | { ok: false; error: string } {
  if (!ALLOWED_ROLES.includes(candidate.role)) {
    return { ok: false, error: 'Select a valid campus role.' };
  }
  if (!isValidDocumentId(candidate.assignedHubId, BLUEPRINT_LIMITS.shortIdMax)) {
    return { ok: false, error: 'Invalid Hub assignment ID.' };
  }
  if (!isValidDocumentId(candidate.assignedClubId, BLUEPRINT_LIMITS.shortIdMax)) {
    return { ok: false, error: 'Invalid Club assignment ID.' };
  }
  if (candidate.email !== undefined) {
    const cleanEmail = candidate.email.trim().toLowerCase();
    if (
      !cleanEmail ||
      cleanEmail.length > BLUEPRINT_LIMITS.emailMax ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return { ok: false, error: 'Enter a valid university or Google email address.' };
    }
  }
  if (candidate.note !== undefined && candidate.note.trim().length > BLUEPRINT_LIMITS.noteMax) {
    return { ok: false, error: 'Note must be 120 characters or fewer.' };
  }
  return { ok: true };
}

export interface EventMutationCandidate {
  id: string;
  title: string;
  category: EventCategory;
  date: string;
  venue: string;
  description: string;
  highlights: string[];
  hubId: string;
  authorUid: string;
  authorRole: UserRole;
  status: 'approved' | 'pending';
  attendeeCount: number;
  capacity: number;
}

export function validateEventMutationPayload(payload: EventMutationCandidate): {
  ok: boolean;
  error?: string;
} {
  if (!isValidDocumentId(payload.id, BLUEPRINT_LIMITS.shortIdMax)) {
    return { ok: false, error: 'Event ID violates pattern or length limits.' };
  }
  if (
    payload.title.length < BLUEPRINT_LIMITS.eventTitleMin ||
    payload.title.length > BLUEPRINT_LIMITS.eventTitleMax
  ) {
    return { ok: false, error: 'Event title must be 3 to 120 characters.' };
  }
  if (!ALLOWED_EVENT_CATEGORIES.includes(payload.category)) {
    return { ok: false, error: 'Unsupported event category.' };
  }
  if (!BLUEPRINT_LIMITS.isoDatePattern.test(payload.date)) {
    return { ok: false, error: 'Date must follow YYYY-MM-DD format.' };
  }
  if (payload.venue.length < 2 || payload.venue.length > BLUEPRINT_LIMITS.eventVenueMax) {
    return { ok: false, error: 'Venue must be 2 to 100 characters.' };
  }
  if (
    payload.description.length < BLUEPRINT_LIMITS.eventDescMin ||
    payload.description.length > BLUEPRINT_LIMITS.eventDescMax
  ) {
    return { ok: false, error: 'Description must be 8 to 1200 characters.' };
  }
  if (
    !Array.isArray(payload.highlights) ||
    payload.highlights.length < 1 ||
    payload.highlights.length > BLUEPRINT_LIMITS.highlightsMax ||
    payload.highlights.some(
      (tag) =>
        typeof tag !== 'string' || tag.length === 0 || tag.length > BLUEPRINT_LIMITS.highlightTagMax
    )
  ) {
    return { ok: false, error: 'Highlights must contain 1 to 6 short strings.' };
  }
  if (!isValidDocumentId(payload.hubId, BLUEPRINT_LIMITS.shortIdMax)) {
    return { ok: false, error: 'Invalid hubId format.' };
  }
  if (!isValidDocumentId(payload.authorUid, BLUEPRINT_LIMITS.uidMax)) {
    return { ok: false, error: 'Invalid authorUid.' };
  }
  if (payload.authorRole === 'student') {
    return { ok: false, error: 'Students cannot create official events.' };
  }
  if (
    payload.attendeeCount < 0 ||
    payload.capacity < 1 ||
    payload.attendeeCount > payload.capacity
  ) {
    return { ok: false, error: 'Invalid attendeeCount or capacity bounds.' };
  }
  return { ok: true };
}
