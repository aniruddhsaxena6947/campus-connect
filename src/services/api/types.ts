import type {
  AnnouncementCategory,
  CampusAccount,
  CampusEvent,
  EventArtworkTheme,
  EventCategory,
  OfficialAnnouncement,
  UserRole,
} from '../../types/collegeConnect.ts';

export interface NewEventInput {
  title: string;
  category: EventCategory;
  date: string;
  time: string;
  venue: string;
  entryLabel: string;
  isFree: boolean;
  description: string;
  hubId: string;
  artwork: EventArtworkTheme;
}

export interface NewAnnouncementInput {
  title: string;
  category: AnnouncementCategory;
  summary: string;
  pinned: boolean;
}

export interface NewHubInput {
  name: string;
  focus: string;
  inChargeName: string;
  building: string;
}

export interface NewClubInput {
  name: string;
  hubId: string;
  tagline: string;
  meetingSchedule: string;
  location: string;
  leadName: string;
}

export interface SignUpInput {
  name: string;
  email: string;
  program: string;
  year: string;
  studentId?: string;
  password: string;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
}

export interface PasswordResetRequestResult {
  ok: boolean;
  code?: string;
  error?: string;
}

export interface EventFilterCriteria {
  category: 'All' | EventCategory;
  freeOnly: boolean;
  sortOrder: 'soonest' | 'popular';
  searchQuery: string;
}

export interface AuthRepository {
  authenticate: (
    accounts: CampusAccount[],
    emailRaw: string,
    password: string
  ) => { ok: true; account: CampusAccount } | { ok: false; error: string };
  registerStudent: (
    accounts: CampusAccount[],
    input: SignUpInput
  ) => { ok: true; account: CampusAccount } | { ok: false; error: string };
  issueResetCode: (
    accounts: CampusAccount[],
    emailRaw: string
  ) => { ok: true; email: string; code: string } | { ok: false; error: string };
  applyPasswordReset: (
    accounts: CampusAccount[],
    pendingCodes: Record<string, string>,
    emailRaw: string,
    codeRaw: string,
    newPassword: string
  ) => { ok: true; email: string; updatedAccounts: CampusAccount[] } | { ok: false; error: string };
}

export interface CampusRepository {
  getVisibleEvents: (events: CampusEvent[], role: UserRole) => CampusEvent[];
  filterAndSortEvents: (events: CampusEvent[], criteria: EventFilterCriteria) => CampusEvent[];
  filterAnnouncements: (
    announcements: OfficialAnnouncement[],
    category: 'All' | AnnouncementCategory
  ) => OfficialAnnouncement[];
}
