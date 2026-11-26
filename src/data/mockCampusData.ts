import type {
  AppNotification,
  CampusAccount,
  CampusClub,
  CampusEvent,
  CampusHub,
  OfficialAnnouncement,
  UserProfile,
  UserRole,
} from '../types/collegeConnect.ts';

export const ROLES_ORDER: UserRole[] = [
  'student',
  'faculty',
  'club_incharge',
  'hub_incharge',
  'super_admin',
];

export const LEGACY_SEEDED_DUMMY_IDS = {
  hubs: ['hub-cultural', 'hub-tech', 'hub-entrepreneurship', 'hub-social'],
  clubs: ['club-music', 'club-photo', 'club-coding', 'club-venture', 'club-social', 'club-sports'],
  events: [
    'evt-music-fest',
    'evt-open-mic',
    'evt-photo-walk',
    'evt-bplan',
    'evt-blood-camp',
    'evt-hackathon',
    'evt-inter-track',
  ],
  announcements: ['ann-exam-form', 'ann-library-hours', 'ann-hostel-curfew', 'ann-tech-talk'],
  notifications: ['not-1', 'not-2', 'not-3', 'not-4', 'not-5'],
  accountIds: ['acc-student', 'acc-faculty', 'acc-hub', 'acc-admin'],
  accountEmails: [
    'aaryan.sharma@collegeconnect.edu',
    'meera.nair@collegeconnect.edu',
    'rohan.kulkarni@collegeconnect.edu',
    'vikram.rao@collegeconnect.edu',
  ],
} as const;

export const ROLE_PERSONAS: Record<
  UserRole,
  {
    label: string;
    shortLabel: string;
    badgeDescription: string;
    defaultName: string;
    defaultProgram: string;
    defaultYear: string;
    canPublishEvents: boolean;
    canPublishAnnouncements: boolean;
    canManageClub: boolean;
    canManageHub: boolean;
    canApproveSubmissions: boolean;
  }
> = {
  student: {
    label: 'Student',
    shortLabel: 'Student',
    badgeDescription: 'Browse, register, join clubs & manage personal schedule',
    defaultName: 'Campus Student',
    defaultProgram: 'Undergraduate',
    defaultYear: 'Student',
    canPublishEvents: false,
    canPublishAnnouncements: false,
    canManageClub: false,
    canManageHub: false,
    canApproveSubmissions: false,
  },
  faculty: {
    label: 'Faculty',
    shortLabel: 'Faculty',
    badgeDescription: 'Publish official academic announcements & department events',
    defaultName: 'Faculty Member',
    defaultProgram: 'Academic Department',
    defaultYear: 'Faculty',
    canPublishEvents: true,
    canPublishAnnouncements: true,
    canManageClub: false,
    canManageHub: false,
    canApproveSubmissions: false,
  },
  club_incharge: {
    label: 'Club In-charge',
    shortLabel: 'Club Lead',
    badgeDescription: 'Manage assigned Club, submit club events & inspect club rosters',
    defaultName: 'Club In-charge',
    defaultProgram: 'Student Society',
    defaultYear: 'Club Lead',
    canPublishEvents: true,
    canPublishAnnouncements: true,
    canManageClub: true,
    canManageHub: false,
    canApproveSubmissions: false,
  },
  hub_incharge: {
    label: 'Hub Head',
    shortLabel: 'Hub Head',
    badgeDescription: 'Manage assigned Hub, Clubs, live hub events & attendee rosters',
    defaultName: 'Hub Head',
    defaultProgram: 'Student Activities',
    defaultYear: 'Hub Head',
    canPublishEvents: true,
    canPublishAnnouncements: true,
    canManageClub: true,
    canManageHub: true,
    canApproveSubmissions: false,
  },
  super_admin: {
    label: 'Super Admin',
    shortLabel: 'Super Admin',
    badgeDescription: 'Full university governance, role assignments, hubs & approvals',
    defaultName: 'Campus Administrator',
    defaultProgram: 'University Administration',
    defaultYear: 'Super Admin',
    canPublishEvents: true,
    canPublishAnnouncements: true,
    canManageClub: true,
    canManageHub: true,
    canApproveSubmissions: true,
  },
};

export const INITIAL_ACCOUNTS: CampusAccount[] = [
  {
    id: 'acc-demo-001',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@campus.edu',
    password: 'student123',
    role: 'student',
    program: 'B.Tech Computer Science',
    year: '2nd Year',
    studentId: 'CC-2024-1021',
    assignedHubId: 'unassigned',
    assignedClubId: 'unassigned',
  },
  {
    id: 'acc-demo-002',
    name: 'Priya Patel',
    email: 'priya.patel@campus.edu',
    password: 'student123',
    role: 'student',
    program: 'B.Tech Electronics',
    year: '3rd Year',
    studentId: 'CC-2023-0847',
    assignedHubId: 'unassigned',
    assignedClubId: 'unassigned',
  },
  {
    id: 'acc-demo-003',
    name: 'Arjun Mehta',
    email: 'arjun.mehta@campus.edu',
    password: 'student123',
    role: 'student',
    program: 'B.Tech Mechanical',
    year: '1st Year',
    studentId: 'CC-2025-2210',
    assignedHubId: 'unassigned',
    assignedClubId: 'unassigned',
  },
  {
    id: 'acc-demo-004',
    name: 'Sneha Reddy',
    email: 'sneha.reddy@campus.edu',
    password: 'student123',
    role: 'student',
    program: 'B.Sc Data Science',
    year: '2nd Year',
    studentId: 'CC-2024-1388',
    assignedHubId: 'unassigned',
    assignedClubId: 'unassigned',
  },
  {
    id: 'acc-demo-005',
    name: 'Karan Joshi',
    email: 'karan.joshi@campus.edu',
    password: 'student123',
    role: 'student',
    program: 'B.Tech Civil Engineering',
    year: '4th Year',
    studentId: 'CC-2022-0334',
    assignedHubId: 'unassigned',
    assignedClubId: 'unassigned',
  },
  {
    id: 'acc-demo-006',
    name: 'Dr. Ananya Singh',
    email: 'ananya.singh@campus.edu',
    password: 'faculty123',
    role: 'faculty',
    program: 'Department of Computer Science',
    year: 'Faculty',
    studentId: 'FAC-2020-001',
    assignedHubId: 'unassigned',
    assignedClubId: 'unassigned',
  },
  {
    id: 'acc-demo-007',
    name: 'Vikram Nair',
    email: 'vikram.nair@campus.edu',
    password: 'student123',
    role: 'student',
    program: 'MBA',
    year: '1st Year',
    studentId: 'CC-2025-0901',
    assignedHubId: 'unassigned',
    assignedClubId: 'unassigned',
  },
  {
    id: 'acc-demo-008',
    name: 'Divya Krishnan',
    email: 'divya.krishnan@campus.edu',
    password: 'student123',
    role: 'student',
    program: 'B.Tech IT',
    year: '3rd Year',
    studentId: 'CC-2023-1562',
    assignedHubId: 'unassigned',
    assignedClubId: 'unassigned',
  },
];

export const INITIAL_PROFILE: UserProfile = {
  name: 'Campus Member',
  program: 'General',
  year: 'Member',
  studentId: 'CC-NEW',
  email: '',
  assignedHubId: 'unassigned',
  assignedClubId: 'unassigned',
};

export const INITIAL_HUBS: CampusHub[] = [];

export const INITIAL_CLUBS: CampusClub[] = [];

export const INITIAL_EVENTS: CampusEvent[] = [];

export const INITIAL_ANNOUNCEMENTS: OfficialAnnouncement[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];
