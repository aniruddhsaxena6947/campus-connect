import type {
  AnnouncementCategory,
  AppNotification,
  CampusClub,
  CampusEvent,
  CampusHub,
  EventArtworkTheme,
  EventCategory,
  NotificationType,
  OfficialAnnouncement,
  ScreenId,
  UserRole,
} from '../../types/collegeConnect.ts';
import {
  ALLOWED_ANNOUNCEMENT_CATEGORIES,
  ALLOWED_ARTWORKS,
  ALLOWED_EVENT_CATEGORIES,
  ALLOWED_ROLES,
  ALLOWED_TARGET_SCREENS,
  BLUEPRINT_LIMITS,
  sanitizeBoundedText,
  sanitizeMinMaxText,
  sanitizeSlugId,
} from '../firebase/validation.ts';

export interface SupabaseHubRow {
  id: string;
  name: string;
  focus: string;
  in_charge_name: string;
  building: string;
  active_events_count: number;
  visibility?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseClubRow {
  id: string;
  name: string;
  hub_id: string;
  hub_name: string;
  tagline: string;
  meeting_schedule: string;
  location: string;
  member_count: number;
  lead_name: string;
  visibility?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseEventRow {
  id: string;
  title: string;
  category: string;
  date: string;
  date_display: string;
  time: string;
  venue: string;
  entry_label: string;
  is_free: boolean;
  description: string;
  highlights: string[] | null;
  hub_id: string;
  hub_name: string;
  organizer_name: string;
  author_uid: string;
  author_role: string;
  status: string;
  artwork: string;
  featured?: boolean | null;
  note_tag?: string | null;
  attendee_count: number;
  capacity: number;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseAnnouncementRow {
  id: string;
  title: string;
  category: string;
  issuer_title: string;
  author_uid: string;
  author_role: string;
  summary: string;
  posted_at: string;
  date: string;
  pinned?: boolean | null;
  visibility?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseNotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  time_ago: string;
  is_read: boolean;
  target_screen: string;
  target_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type CampusCatalogEvent = Omit<CampusEvent, 'isRegistered' | 'isSaved'>;
export type CampusCatalogClub = Omit<CampusClub, 'isJoined'>;
export type CampusCatalogAnnouncement = Omit<OfficialAnnouncement, 'isRead' | 'isSaved'>;

export interface CampusCatalogPayload {
  configured: boolean;
  schemaReady: boolean;
  hubs: CampusHub[];
  clubs: CampusCatalogClub[];
  events: CampusCatalogEvent[];
  announcements: CampusCatalogAnnouncement[];
  registrations: string[];
  savedEvents: string[];
  savedAnnouncements: string[];
  readAnnouncements: string[];
  clubMemberships: string[];
  notifications: AppNotification[];
}

function asEnum<T extends string>(raw: unknown, allowed: readonly T[], fallback: T): T {
  return typeof raw === 'string' && (allowed as readonly string[]).includes(raw)
    ? (raw as T)
    : fallback;
}

export function mapSupabaseHubRow(row: SupabaseHubRow): CampusHub {
  return {
    id: String(row.id ?? ''),
    name: String(row.name ?? ''),
    focus: String(row.focus ?? ''),
    inChargeName: String(row.in_charge_name ?? ''),
    building: String(row.building ?? ''),
    activeEventsCount: Math.max(0, Number(row.active_events_count ?? 0)),
  };
}

export function mapSupabaseClubRow(row: SupabaseClubRow): CampusCatalogClub {
  return {
    id: String(row.id ?? ''),
    name: String(row.name ?? ''),
    hubId: String(row.hub_id ?? ''),
    hubName: String(row.hub_name ?? ''),
    tagline: String(row.tagline ?? ''),
    meetingSchedule: String(row.meeting_schedule ?? ''),
    location: String(row.location ?? ''),
    memberCount: Math.max(0, Number(row.member_count ?? 0)),
    leadName: String(row.lead_name ?? ''),
  };
}

export function mapSupabaseEventRow(row: SupabaseEventRow): CampusCatalogEvent {
  const category = asEnum<EventCategory>(row.category, ALLOWED_EVENT_CATEGORIES, 'Cultural');
  const authorRole = asEnum<UserRole>(row.author_role, ALLOWED_ROLES, 'faculty');
  const artwork = asEnum<EventArtworkTheme>(row.artwork, ALLOWED_ARTWORKS, 'campus_general');
  const status: CampusEvent['status'] = row.status === 'pending' ? 'pending' : 'approved';

  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    category,
    date: String(row.date ?? ''),
    dateDisplay: String(row.date_display ?? ''),
    time: String(row.time ?? ''),
    venue: String(row.venue ?? ''),
    entryLabel: String(row.entry_label ?? 'Free Entry'),
    isFree: Boolean(row.is_free),
    description: String(row.description ?? ''),
    highlights: Array.isArray(row.highlights)
      ? row.highlights.filter((h): h is string => typeof h === 'string')
      : [],
    hubId: String(row.hub_id ?? ''),
    hubName: String(row.hub_name ?? ''),
    organizerName: String(row.organizer_name ?? ''),
    authorRole,
    status,
    artwork,
    featured: typeof row.featured === 'boolean' ? row.featured : undefined,
    noteTag: typeof row.note_tag === 'string' && row.note_tag ? row.note_tag : undefined,
    attendeeCount: Math.max(0, Number(row.attendee_count ?? 0)),
    capacity: Math.max(1, Number(row.capacity ?? 200)),
  };
}

export function mapSupabaseAnnouncementRow(
  row: SupabaseAnnouncementRow
): CampusCatalogAnnouncement {
  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    category: asEnum<AnnouncementCategory>(
      row.category,
      ALLOWED_ANNOUNCEMENT_CATEGORIES,
      'General'
    ),
    issuerTitle: String(row.issuer_title ?? ''),
    authorRole: asEnum<UserRole>(row.author_role, ALLOWED_ROLES, 'faculty'),
    summary: String(row.summary ?? ''),
    postedAt: String(row.posted_at ?? 'Just now'),
    date: String(row.date ?? ''),
    pinned: Boolean(row.pinned),
  };
}

const ALLOWED_NOTIFICATION_TYPES: readonly NotificationType[] = [
  'reminder',
  'announcement',
  'club',
  'approved',
  'new_event',
];

export function mapSupabaseNotificationRow(row: SupabaseNotificationRow): AppNotification {
  return {
    id: String(row.id ?? ''),
    type: asEnum<NotificationType>(row.type, ALLOWED_NOTIFICATION_TYPES, 'new_event'),
    title: String(row.title ?? ''),
    message: String(row.message ?? ''),
    timeAgo: String(row.time_ago ?? 'Just now'),
    isRead: Boolean(row.is_read),
    targetScreen: asEnum<ScreenId>(row.target_screen, ALLOWED_TARGET_SCREENS, 'home'),
    targetId: typeof row.target_id === 'string' && row.target_id ? row.target_id : undefined,
  };
}

export function buildSupabaseHubInsert(hub: CampusHub): SupabaseHubRow {
  return {
    id: sanitizeSlugId(hub.id, 'hub'),
    name: sanitizeMinMaxText(hub.name, 2, BLUEPRINT_LIMITS.hubNameMax, 'Campus Hub'),
    focus: sanitizeMinMaxText(hub.focus, 4, 240, 'Student community & campus events'),
    in_charge_name: sanitizeMinMaxText(hub.inChargeName, 2, 80, 'Hub Head'),
    building: sanitizeMinMaxText(hub.building, 1, 100, 'Main Campus'),
    active_events_count: Math.max(0, Math.floor(hub.activeEventsCount)),
    visibility: 'campus',
  };
}

export function buildSupabaseClubInsert(club: CampusClub): SupabaseClubRow {
  return {
    id: sanitizeSlugId(club.id, 'club'),
    name: sanitizeMinMaxText(club.name, 2, 100, 'Campus Club'),
    hub_id: sanitizeSlugId(club.hubId, 'hub'),
    hub_name: sanitizeMinMaxText(club.hubName, 2, BLUEPRINT_LIMITS.hubNameMax, 'Campus Hub'),
    tagline: sanitizeMinMaxText(club.tagline, 4, 240, 'Official student club'),
    meeting_schedule: sanitizeMinMaxText(club.meetingSchedule, 2, 80, 'Weekly'),
    location: sanitizeMinMaxText(club.location, 1, 100, 'Main Campus'),
    member_count: Math.max(0, Math.floor(club.memberCount)),
    lead_name: sanitizeMinMaxText(club.leadName, 2, 80, 'Club Lead'),
    visibility: 'campus',
  };
}

export function buildSupabaseEventInsert(
  uid: string,
  event: CampusEvent,
  todayIso: string
): SupabaseEventRow {
  const safeHighlights = event.highlights
    .slice(0, BLUEPRINT_LIMITS.highlightsMax)
    .map((h) => sanitizeBoundedText(h, BLUEPRINT_LIMITS.highlightTagMax))
    .filter((h) => h.length > 0);

  return {
    id: sanitizeSlugId(event.id, 'evt'),
    title: sanitizeMinMaxText(
      event.title,
      BLUEPRINT_LIMITS.eventTitleMin,
      BLUEPRINT_LIMITS.eventTitleMax,
      'Campus Event'
    ),
    category: asEnum<EventCategory>(event.category, ALLOWED_EVENT_CATEGORIES, 'Cultural'),
    date: BLUEPRINT_LIMITS.isoDatePattern.test(event.date) ? event.date : todayIso,
    date_display: sanitizeMinMaxText(
      event.dateDisplay,
      4,
      BLUEPRINT_LIMITS.eventDateDisplayMax,
      'Upcoming'
    ),
    time: sanitizeMinMaxText(event.time, 2, BLUEPRINT_LIMITS.eventTimeMax, '4:00 PM'),
    venue: sanitizeMinMaxText(event.venue, 2, BLUEPRINT_LIMITS.eventVenueMax, 'Main Campus'),
    entry_label: sanitizeMinMaxText(
      event.entryLabel,
      2,
      BLUEPRINT_LIMITS.entryLabelMax,
      'Free Entry'
    ),
    is_free: Boolean(event.isFree),
    description: sanitizeMinMaxText(
      event.description,
      BLUEPRINT_LIMITS.eventDescMin,
      BLUEPRINT_LIMITS.eventDescMax,
      'Campus event details.'
    ),
    highlights: safeHighlights.length > 0 ? safeHighlights : [event.category],
    hub_id: sanitizeSlugId(event.hubId, 'hub'),
    hub_name: sanitizeMinMaxText(event.hubName, 2, BLUEPRINT_LIMITS.hubNameMax, 'Campus Hub'),
    organizer_name: sanitizeMinMaxText(
      event.organizerName,
      2,
      BLUEPRINT_LIMITS.userNameMax,
      'Campus Organizer'
    ),
    author_uid: uid,
    author_role: asEnum<UserRole>(event.authorRole, ALLOWED_ROLES, 'faculty'),
    status: event.status === 'approved' ? 'approved' : 'pending',
    artwork: asEnum<EventArtworkTheme>(event.artwork, ALLOWED_ARTWORKS, 'campus_general'),
    featured: Boolean(event.featured),
    note_tag: event.noteTag ? sanitizeBoundedText(event.noteTag, BLUEPRINT_LIMITS.noteTagMax) : null,
    attendee_count: Math.max(0, Math.min(event.capacity, Math.floor(event.attendeeCount))),
    capacity: Math.max(1, Math.floor(event.capacity)),
  };
}

export function buildSupabaseAnnouncementInsert(
  uid: string,
  announcement: OfficialAnnouncement,
  todayIso: string
): SupabaseAnnouncementRow {
  return {
    id: sanitizeSlugId(announcement.id, 'ann'),
    title: sanitizeMinMaxText(
      announcement.title,
      BLUEPRINT_LIMITS.announcementTitleMin,
      BLUEPRINT_LIMITS.announcementTitleMax,
      'Campus Notice'
    ),
    category: asEnum<AnnouncementCategory>(
      announcement.category,
      ALLOWED_ANNOUNCEMENT_CATEGORIES,
      'General'
    ),
    issuer_title: sanitizeMinMaxText(
      announcement.issuerTitle,
      2,
      BLUEPRINT_LIMITS.issuerTitleMax,
      'Campus Office'
    ),
    author_uid: uid,
    author_role: asEnum<UserRole>(announcement.authorRole, ALLOWED_ROLES, 'faculty'),
    summary: sanitizeMinMaxText(
      announcement.summary,
      BLUEPRINT_LIMITS.announcementSummaryMin,
      BLUEPRINT_LIMITS.announcementSummaryMax,
      'Official campus notice.'
    ),
    posted_at: sanitizeMinMaxText(
      announcement.postedAt,
      2,
      BLUEPRINT_LIMITS.postedAtMax,
      'Just now'
    ),
    date: BLUEPRINT_LIMITS.isoDatePattern.test(announcement.date) ? announcement.date : todayIso,
    pinned: Boolean(announcement.pinned),
    visibility: 'campus',
  };
}

export function buildSupabaseNotificationInsert(
  uid: string,
  notification: AppNotification
): SupabaseNotificationRow {
  return {
    id: sanitizeSlugId(notification.id, 'not'),
    user_id: uid,
    type: asEnum<NotificationType>(notification.type, ALLOWED_NOTIFICATION_TYPES, 'new_event'),
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
      'Campus update available.'
    ),
    time_ago: sanitizeMinMaxText(notification.timeAgo, 1, BLUEPRINT_LIMITS.postedAtMax, 'Just now'),
    is_read: Boolean(notification.isRead),
    target_screen: asEnum<ScreenId>(
      notification.targetScreen,
      ALLOWED_TARGET_SCREENS,
      'home'
    ),
    target_id: notification.targetId ? sanitizeSlugId(notification.targetId, 'item') : null,
  };
}
