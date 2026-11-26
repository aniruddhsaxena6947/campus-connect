import { ROLE_PERSONAS } from '../../data/mockCampusData.ts';
import type {
  AnnouncementCategory,
  AppNotification,
  CampusAccount,
  CampusClub,
  CampusEvent,
  CampusHub,
  OfficialAnnouncement,
  UserProfile,
  UserRole,
} from '../../types/collegeConnect.ts';
import type {
  AuthRepository,
  CampusRepository,
  EventFilterCriteria,
  NewAnnouncementInput,
  NewClubInput,
  NewEventInput,
  NewHubInput,
  SignUpInput,
} from './types.ts';

export function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeIsoDateInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const isoMatch = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(trimmed);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    const d = new Date(year, month - 1, day);
    if (d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    return null;
  }

  const dmyMatch = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(trimmed);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]);
    const year = Number(dmyMatch[3]);
    const d = new Date(year, month - 1, day);
    if (d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    return null;
  }

  return null;
}

export function formatDateDisplay(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatShortReadableDate(iso: string): string {
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

export function computeVisibleEvents(events: CampusEvent[], role: UserRole): CampusEvent[] {
  if (role === 'super_admin') return events;
  return events.filter((e) => e.status === 'approved' || e.authorRole === role);
}

export function filterAndSortEvents(
  events: CampusEvent[],
  criteria: EventFilterCriteria
): CampusEvent[] {
  const q = criteria.searchQuery.trim().toLowerCase();
  return events
    .filter((event) => {
      if (criteria.category !== 'All' && event.category !== criteria.category) return false;
      if (criteria.freeOnly && !event.isFree) return false;
      if (q) {
        const highlightsText = Array.isArray(event.highlights) ? event.highlights.join(' ') : '';
        const haystack = `${event.title ?? ''} ${event.category ?? ''} ${event.venue ?? ''} ${
          event.hubName ?? ''
        } ${event.organizerName ?? ''} ${event.description ?? ''} ${highlightsText}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (criteria.sortOrder === 'popular') {
        return Number(b.attendeeCount ?? 0) - Number(a.attendeeCount ?? 0);
      }
      return String(a.date ?? '').localeCompare(String(b.date ?? ''));
    });
}

export function filterAnnouncementsByCategory(
  announcements: OfficialAnnouncement[],
  category: 'All' | AnnouncementCategory
): OfficialAnnouncement[] {
  const base =
    category === 'All' ? announcements : announcements.filter((a) => a.category === category);
  return [...base].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));
}

export function filterClubsByHub(clubs: CampusClub[], hubId: string): CampusClub[] {
  return hubId === 'all' ? clubs : clubs.filter((c) => c.hubId === hubId);
}

export function createHubRecord(
  input: NewHubInput,
  role: UserRole,
  profile: UserProfile
): CampusHub | null {
  if (role !== 'super_admin') return null;
  const name = input.name.trim();
  const focus = input.focus.trim();
  const building = input.building.trim() || 'Main Campus';
  const inChargeName = input.inChargeName.trim() || profile.name || 'Campus Coordinator';
  if (name.length < 2 || focus.length < 4) return null;

  return {
    id: `hub-${Date.now()}`,
    name,
    focus,
    inChargeName,
    building,
    activeEventsCount: 0,
  };
}

export function createClubRecord(
  input: NewClubInput,
  role: UserRole,
  profile: UserProfile,
  hubs: CampusHub[]
): CampusClub | null {
  if (role !== 'super_admin') return null;
  const hub = hubs.find((h) => h.id === input.hubId) ?? hubs[0];
  if (!hub) return null;
  const name = input.name.trim();
  const tagline = input.tagline.trim();
  if (name.length < 2 || tagline.length < 4) return null;

  return {
    id: `club-${Date.now()}`,
    name,
    hubId: hub.id,
    hubName: hub.name,
    tagline,
    meetingSchedule: input.meetingSchedule.trim() || 'Weekly · TBD',
    location: input.location.trim() || hub.building,
    memberCount: 0,
    leadName: input.leadName.trim() || profile.name || 'Club Lead',
    isJoined: false,
  };
}

export function createEventRecord(
  input: NewEventInput,
  role: UserRole,
  profile: UserProfile,
  hubs: CampusHub[]
): { event: CampusEvent; notification: AppNotification; isDirectApproved: boolean } | null {
  if (!ROLE_PERSONAS[role].canPublishEvents) return null;
  const hub = hubs.find((h) => h.id === input.hubId) ?? hubs[0];
  if (!hub) return null;

  const isDirectApproved = role === 'super_admin' || role === 'hub_incharge';
  const newId = `evt-${Date.now()}`;
  const normalizedDate = normalizeIsoDateInput(input.date) ?? getTodayIsoDate();

  const event: CampusEvent = {
    id: newId,
    title: input.title.trim(),
    category: input.category,
    date: normalizedDate,
    dateDisplay: formatDateDisplay(normalizedDate),
    time: input.time.trim() || '4:00 PM',
    venue: input.venue.trim() || hub.building,
    entryLabel: input.isFree ? 'Free Entry' : input.entryLabel.trim() || 'Paid Entry',
    isFree: input.isFree,
    description: input.description.trim(),
    highlights: [
      input.category,
      hub.name.split(' ')[0] || 'Campus',
      input.isFree ? 'Free' : 'Pass',
    ],
    hubId: hub.id,
    hubName: hub.name,
    organizerName: profile.name || ROLE_PERSONAS[role].defaultName,
    authorRole: role,
    status: isDirectApproved ? 'approved' : 'pending',
    artwork: input.artwork,
    attendeeCount: 0,
    capacity: 200,
    isRegistered: false,
    isSaved: false,
  };

  const notification: AppNotification = {
    id: `not-${Date.now()}`,
    type: isDirectApproved ? 'new_event' : 'approved',
    title: isDirectApproved ? 'New Event Published' : 'Submitted for Review',
    message: isDirectApproved
      ? `${event.title} on ${event.dateDisplay} is now live.`
      : `${event.title} sent to Super Admin for approval.`,
    timeAgo: 'Just now',
    isRead: false,
    targetScreen: 'event_detail',
    targetId: newId,
  };

  return { event, notification, isDirectApproved };
}

export function createAnnouncementRecord(
  input: NewAnnouncementInput,
  role: UserRole,
  profile: UserProfile
): { announcement: OfficialAnnouncement; notification: AppNotification } | null {
  const meta = ROLE_PERSONAS[role];
  if (!meta.canPublishAnnouncements) return null;

  const announcement: OfficialAnnouncement = {
    id: `ann-${Date.now()}`,
    title: input.title.trim(),
    category: input.category,
    issuerTitle: `${profile.name || meta.defaultName} · ${meta.label}`,
    authorRole: role,
    summary: input.summary.trim(),
    postedAt: 'Just now',
    date: getTodayIsoDate(),
    pinned: input.pinned && (role === 'super_admin' || role === 'faculty'),
    isRead: false,
    isSaved: false,
  };

  const notification: AppNotification = {
    id: `not-${Date.now()}`,
    type: 'announcement',
    title: 'Official Announcement',
    message: announcement.title,
    timeAgo: 'Just now',
    isRead: false,
    targetScreen: 'announcements',
    targetId: announcement.id,
  };

  return { announcement, notification };
}

export const localAuthRepository: AuthRepository = {
  authenticate(accounts, emailRaw, password) {
    const email = emailRaw.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return { ok: false, error: 'Enter a valid university email address.' };
    }
    if (!password) {
      return { ok: false, error: 'Enter your campus account password.' };
    }
    const found = accounts.find((acc) => acc.email.toLowerCase() === email);
    if (!found) {
      return {
        ok: false,
        error: 'No campus account found for that email. Try creating a new account.',
      };
    }
    if (found.password !== password) {
      return { ok: false, error: 'Incorrect password. Use Forgot Password to reset it.' };
    }
    return { ok: true, account: found };
  },

  registerStudent(accounts: CampusAccount[], input: SignUpInput) {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    const program = input.program.trim() || 'B.Tech';
    const year = input.year.trim() || '1st Year';

    if (name.length < 2) {
      return { ok: false, error: 'Enter your full name.' };
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, error: 'Enter a valid campus email address.' };
    }
    if (accounts.some((a) => a.email.toLowerCase() === email)) {
      return {
        ok: false,
        error: 'An account with this email already exists. Try signing in.',
      };
    }
    if (input.password.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters.' };
    }

    const generatedId =
      input.studentId?.trim() ||
      `CC-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 8999))}`;

    const account: CampusAccount = {
      id: `acc-${Date.now()}`,
      name,
      email,
      password: input.password,
      role: 'student',
      program,
      year,
      studentId: generatedId,
      assignedHubId: 'unassigned',
      assignedClubId: 'unassigned',
    };

    return { ok: true, account };
  },

  issueResetCode(accounts, emailRaw) {
    const email = emailRaw.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return { ok: false, error: 'Enter a valid university email address.' };
    }
    const found = accounts.find((acc) => acc.email.toLowerCase() === email);
    if (!found) {
      return { ok: false, error: 'No registered campus account matches that email.' };
    }
    const code = String(Math.floor(100000 + Math.random() * 899999));
    return { ok: true, email, code };
  },

  applyPasswordReset(accounts, pendingCodes, emailRaw, codeRaw, newPassword) {
    const email = emailRaw.trim().toLowerCase();
    const expected = pendingCodes[email];
    if (!expected || codeRaw.trim() !== expected) {
      return { ok: false, error: 'Invalid or expired 6-digit verification code.' };
    }
    if (newPassword.length < 6) {
      return { ok: false, error: 'New password must be at least 6 characters.' };
    }
    const updatedAccounts = accounts.map((acc) =>
      acc.email.toLowerCase() === email ? { ...acc, password: newPassword } : acc
    );
    return { ok: true, email, updatedAccounts };
  },
};

export const localCampusRepository: CampusRepository = {
  getVisibleEvents: computeVisibleEvents,
  filterAndSortEvents,
  filterAnnouncements: filterAnnouncementsByCategory,
};
