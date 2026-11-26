export type UserRole = 'student' | 'faculty' | 'club_incharge' | 'hub_incharge' | 'super_admin';

export type PlatformOS = 'ios' | 'android';

export type ThemeMode = 'system' | 'light' | 'dark';

export type UIStateMode = 'default' | 'loading' | 'empty' | 'error' | 'success';

export type ScreenId =
  | 'welcome'
  | 'login'
  | 'signup'
  | 'forgot_password'
  | 'home'
  | 'explore'
  | 'event_detail'
  | 'hubs'
  | 'announcements'
  | 'calendar'
  | 'saved'
  | 'notifications'
  | 'profile'
  | 'settings'
  | 'role_management'
  | 'assistant';

export type EventCategory = 'Cultural' | 'Tech' | 'Sports' | 'Workshop' | 'Competition' | 'Social';

export type EventArtworkTheme =
  | 'music_fest'
  | 'open_mic'
  | 'photography'
  | 'business_plan'
  | 'blood_camp'
  | 'hackathon'
  | 'campus_general';

export interface CampusEvent {
  id: string;
  title: string;
  category: EventCategory;
  date: string; // YYYY-MM-DD
  dateDisplay: string;
  time: string;
  venue: string;
  entryLabel: string;
  isFree: boolean;
  description: string;
  highlights: string[];
  hubId: string;
  hubName: string;
  organizerName: string;
  authorRole: UserRole;
  status: 'approved' | 'pending';
  artwork: EventArtworkTheme;
  featured?: boolean;
  noteTag?: string;
  attendeeCount: number;
  capacity: number;
  isRegistered: boolean;
  isSaved: boolean;
}

export type AnnouncementCategory = 'Academic' | 'Exam' | 'Hostel' | 'General';

export interface OfficialAnnouncement {
  id: string;
  title: string;
  category: AnnouncementCategory;
  issuerTitle: string;
  authorRole: UserRole;
  summary: string;
  postedAt: string;
  date: string; // YYYY-MM-DD
  pinned?: boolean;
  isRead: boolean;
  isSaved: boolean;
}

export interface CampusClub {
  id: string;
  name: string;
  hubId: string;
  hubName: string;
  tagline: string;
  meetingSchedule: string;
  location: string;
  memberCount: number;
  leadName: string;
  isJoined: boolean;
}

export interface CampusHub {
  id: string;
  name: string;
  focus: string;
  inChargeName: string;
  building: string;
  activeEventsCount: number;
}

export type NotificationType = 'reminder' | 'announcement' | 'club' | 'approved' | 'new_event';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timeAgo: string;
  isRead: boolean;
  targetScreen: ScreenId;
  targetId?: string;
}

export interface UserProfile {
  name: string;
  program: string;
  year: string;
  studentId: string;
  email: string;
  assignedHubId: string;
  assignedClubId?: string;
}

export interface CampusAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  program: string;
  year: string;
  studentId: string;
  assignedHubId: string;
  assignedClubId?: string;
}

export interface ManagedUserRecord {
  uid: string;
  name: string;
  email: string;
  studentId: string;
  program: string;
  year: string;
  role: UserRole;
  assignedHubId: string;
  assignedClubId: string;
}

export interface RoleInviteRecord {
  id: string;
  email: string;
  role: UserRole;
  assignedHubId: string;
  assignedClubId: string;
  note: string;
  invitedByUid: string;
}

export interface ScreenHandoffSpec {
  screenId: ScreenId;
  title: string;
  expoRoute: string;
  purpose: string;
  componentHierarchy: string[];
  spacingTokens: string[];
  typographyTokens: string[];
  colorTokens: {
    light: string[];
    oledDark: string[];
  };
  interactionBehavior: string[];
  rolePermissions: Record<UserRole, string>;
  responsiveRules: string[];
}

export interface FeedbackBanner {
  id: string;
  kind: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

export interface CampusChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  matchedEventIds?: string[];
  followUpSuggestions?: string[];
  createdAt: number;
  error?: boolean;
}
