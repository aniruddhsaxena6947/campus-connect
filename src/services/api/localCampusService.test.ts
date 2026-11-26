import { describe, expect, it } from 'bun:test';
import {
  CampusAccount,
  CampusClub,
  CampusEvent,
  CampusHub,
  OfficialAnnouncement,
  UserProfile,
} from '../../types/collegeConnect';
import {
  computeVisibleEvents,
  createAnnouncementRecord,
  createClubRecord,
  createEventRecord,
  createHubRecord,
  filterAnnouncementsByCategory,
  filterAndSortEvents,
  filterClubsByHub,
  localAuthRepository,
  normalizeIsoDateInput,
} from './localCampusService';

const TEST_ACCOUNTS: CampusAccount[] = [
  {
    id: 'test-student-1',
    name: 'Test Student',
    email: 'student@campus.edu',
    password: 'password123',
    role: 'student',
    program: 'B.Tech',
    year: '2nd Year',
    studentId: 'CC-TEST-001',
    assignedHubId: 'unassigned',
  },
];

const TEST_PROFILE: UserProfile = {
  name: 'Test Coordinator',
  program: 'Engineering',
  year: 'Coordinator',
  studentId: 'CC-TEST-999',
  email: 'coord@campus.edu',
  assignedHubId: 'hub-1',
};

const TEST_HUBS: CampusHub[] = [
  {
    id: 'hub-1',
    name: 'Cultural Hub',
    focus: 'Arts and student festivals',
    inChargeName: 'Coordinator',
    building: 'Block A',
    activeEventsCount: 1,
  },
  {
    id: 'hub-2',
    name: 'Tech Hub',
    focus: 'Engineering and hackathons',
    inChargeName: 'Tech Lead',
    building: 'Block B',
    activeEventsCount: 1,
  },
];

const TEST_CLUBS: CampusClub[] = [
  {
    id: 'club-1',
    name: 'Music Collective',
    hubId: 'hub-1',
    hubName: 'Cultural Hub',
    tagline: 'Campus music society',
    meetingSchedule: 'Fri · 5 PM',
    location: 'Room 101',
    memberCount: 24,
    leadName: 'Lead One',
    isJoined: false,
  },
  {
    id: 'club-2',
    name: 'AI Guild',
    hubId: 'hub-2',
    hubName: 'Tech Hub',
    tagline: 'Applied AI sprints',
    meetingSchedule: 'Thu · 4 PM',
    location: 'Lab 2',
    memberCount: 40,
    leadName: 'Lead Two',
    isJoined: true,
  },
];

const TEST_EVENTS: CampusEvent[] = [
  {
    id: 'evt-1',
    title: 'Annual Tech Hackathon',
    category: 'Tech',
    date: '2026-05-10',
    dateDisplay: '10 May 2026',
    time: '9:00 AM',
    venue: 'Lab Complex',
    entryLabel: 'Free Entry',
    isFree: true,
    description: '24-hour student build event.',
    highlights: ['24-Hr', 'Tech'],
    hubId: 'hub-2',
    hubName: 'Tech Hub',
    organizerName: 'AI Guild',
    authorRole: 'faculty',
    status: 'approved',
    artwork: 'hackathon',
    attendeeCount: 120,
    capacity: 200,
    isRegistered: false,
    isSaved: false,
  },
  {
    id: 'evt-2',
    title: 'Paid Case Challenge',
    category: 'Competition',
    date: '2026-05-05',
    dateDisplay: '05 May 2026',
    time: '11:00 AM',
    venue: 'Auditorium',
    entryLabel: '₹150',
    isFree: false,
    description: 'Inter-department case competition.',
    highlights: ['Case', 'Team'],
    hubId: 'hub-1',
    hubName: 'Cultural Hub',
    organizerName: 'Coordinator',
    authorRole: 'hub_incharge',
    status: 'pending',
    artwork: 'business_plan',
    attendeeCount: 45,
    capacity: 100,
    isRegistered: false,
    isSaved: false,
  },
];

const TEST_ANNOUNCEMENTS: OfficialAnnouncement[] = [
  {
    id: 'ann-1',
    title: 'Lab Schedule Updated',
    category: 'Academic',
    issuerTitle: 'Academic Office',
    authorRole: 'faculty',
    summary: 'Open until 8 PM.',
    postedAt: 'Just now',
    date: '2026-05-01',
    pinned: false,
    isRead: false,
    isSaved: false,
  },
  {
    id: 'ann-2',
    title: 'Exam Form Deadline',
    category: 'Exam',
    issuerTitle: 'Exam Cell',
    authorRole: 'super_admin',
    summary: 'Submit before Friday.',
    postedAt: '1h ago',
    date: '2026-05-02',
    pinned: true,
    isRead: false,
    isSaved: false,
  },
];

describe('localAuthRepository', () => {
  it('authenticates account with valid credentials', () => {
    const res = localAuthRepository.authenticate(
      TEST_ACCOUNTS,
      'STUDENT@CAMPUS.EDU',
      'password123'
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.account.role).toBe('student');
      expect(res.account.email).toBe('student@campus.edu');
    }
  });

  it('rejects unknown email and wrong password', () => {
    const unknown = localAuthRepository.authenticate(
      TEST_ACCOUNTS,
      'unknown@campus.edu',
      'password123'
    );
    expect(unknown.ok).toBe(false);

    const wrongPwd = localAuthRepository.authenticate(
      TEST_ACCOUNTS,
      'student@campus.edu',
      'wrongpass'
    );
    expect(wrongPwd.ok).toBe(false);
  });

  it('registers a new student account and blocks duplicate email', () => {
    const duplicate = localAuthRepository.registerStudent(TEST_ACCOUNTS, {
      name: 'Duplicate User',
      email: 'student@campus.edu',
      program: 'BCA',
      year: '1st Year',
      password: 'password123',
    });
    expect(duplicate.ok).toBe(false);

    const created = localAuthRepository.registerStudent(TEST_ACCOUNTS, {
      name: 'New Student',
      email: 'new.student@campus.edu',
      program: 'B.Tech CS',
      year: '2nd Year',
      studentId: 'CC-2026-0999',
      password: 'password123',
    });
    expect(created.ok).toBe(true);
    if (created.ok) {
      expect(created.account.role).toBe('student');
      expect(created.account.studentId).toBe('CC-2026-0999');
      expect(created.account.assignedHubId).toBe('unassigned');
    }
  });

  it('issues verification code and applies password reset', () => {
    const issued = localAuthRepository.issueResetCode(TEST_ACCOUNTS, 'student@campus.edu');
    expect(issued.ok).toBe(true);
    if (!issued.ok) return;
    expect(issued.code).toHaveLength(6);

    const invalidCode = localAuthRepository.applyPasswordReset(
      TEST_ACCOUNTS,
      { [issued.email]: issued.code },
      issued.email,
      '000000',
      'newpass123'
    );
    expect(invalidCode.ok).toBe(false);

    const reset = localAuthRepository.applyPasswordReset(
      TEST_ACCOUNTS,
      { [issued.email]: issued.code },
      issued.email,
      issued.code,
      'newpass123'
    );
    expect(reset.ok).toBe(true);
    if (!reset.ok) return;

    const loginAfter = localAuthRepository.authenticate(
      reset.updatedAccounts,
      issued.email,
      'newpass123'
    );
    expect(loginAfter.ok).toBe(true);
  });
});

describe('localCampusService RBAC & filtering', () => {
  it('enforces event visibility across roles', () => {
    const studentVisible = computeVisibleEvents(TEST_EVENTS, 'student');
    const hubVisible = computeVisibleEvents(TEST_EVENTS, 'hub_incharge');
    const adminVisible = computeVisibleEvents(TEST_EVENTS, 'super_admin');

    expect(studentVisible.every((e) => e.status === 'approved')).toBe(true);
    expect(adminVisible.length).toBe(TEST_EVENTS.length);
    expect(hubVisible.length).toBeGreaterThanOrEqual(studentVisible.length);
  });

  it('filters and sorts events by search query, free entry, and popularity', () => {
    const freeSorted = filterAndSortEvents(TEST_EVENTS, {
      searchQuery: '',
      category: 'All',
      freeOnly: true,
      sortOrder: 'popular',
    });
    expect(freeSorted.every((e) => e.isFree)).toBe(true);

    const techSearch = filterAndSortEvents(TEST_EVENTS, {
      searchQuery: 'hackathon',
      category: 'Tech',
      freeOnly: false,
      sortOrder: 'soonest',
    });
    expect(techSearch.length).toBe(1);
    expect(techSearch[0].category).toBe('Tech');
  });

  it('orders pinned announcements first and filters by category', () => {
    const allSorted = filterAnnouncementsByCategory(TEST_ANNOUNCEMENTS, 'All');
    expect(allSorted[0].pinned).toBe(true);

    const examOnly = filterAnnouncementsByCategory(TEST_ANNOUNCEMENTS, 'Exam');
    expect(examOnly.every((a) => a.category === 'Exam')).toBe(true);
  });

  it('filters clubs by hub', () => {
    expect(filterClubsByHub(TEST_CLUBS, 'all')).toHaveLength(TEST_CLUBS.length);
    const techClubs = filterClubsByHub(TEST_CLUBS, 'hub-2');
    expect(techClubs.every((c) => c.hubId === 'hub-2')).toBe(true);
  });

  it('guards empty hubs and creates hubs, clubs, events, and announcements by role', () => {
    const noHubEvent = createEventRecord(
      {
        title: 'No Hub Event',
        category: 'Social',
        date: '2026-05-12',
        time: '5:00 PM',
        venue: 'Quad',
        hubId: 'hub-1',
        isFree: true,
        entryLabel: 'Free Entry',
        description: 'Cannot create without a hub',
        artwork: 'campus_general',
      },
      'super_admin',
      TEST_PROFILE,
      []
    );
    expect(noHubEvent).toBeNull();

    const blockedHub = createHubRecord(
      { name: 'Student Hub', focus: 'Unauthorized', inChargeName: 'Student', building: 'Hall' },
      'student',
      TEST_PROFILE
    );
    expect(blockedHub).toBeNull();

    const createdHub = createHubRecord(
      {
        name: 'Design Hub',
        focus: 'Product and visual arts',
        inChargeName: 'Dean Arts',
        building: 'Design Wing',
      },
      'super_admin',
      TEST_PROFILE
    );
    expect(createdHub?.name).toBe('Design Hub');

    const createdClub = createClubRecord(
      {
        name: 'UX Guild',
        hubId: 'hub-1',
        tagline: 'Design critique sessions',
        meetingSchedule: 'Wed · 4 PM',
        location: 'Studio 2',
        leadName: 'Lead',
      },
      'super_admin',
      TEST_PROFILE,
      TEST_HUBS
    );
    expect(createdClub?.hubId).toBe('hub-1');

    const blockedStudent = createEventRecord(
      {
        title: 'Unauthorized Event',
        category: 'Social',
        date: '2026-05-12',
        time: '5:00 PM',
        venue: 'Quad',
        hubId: 'hub-1',
        isFree: true,
        entryLabel: 'Free Entry',
        description: 'Should be blocked',
        artwork: 'campus_general',
      },
      'student',
      TEST_PROFILE,
      TEST_HUBS
    );
    expect(blockedStudent).toBeNull();

    const facultyDraft = createEventRecord(
      {
        title: 'AI Ethics Colloquium',
        category: 'Workshop',
        date: '2026-05-14',
        time: '11:00 AM',
        venue: 'Seminar Hall',
        hubId: 'hub-2',
        isFree: true,
        entryLabel: 'Free Entry',
        description: 'Department talk',
        artwork: 'hackathon',
      },
      'faculty',
      TEST_PROFILE,
      TEST_HUBS
    );
    expect(facultyDraft?.isDirectApproved).toBe(false);
    expect(facultyDraft?.event.status).toBe('pending');

    const adminLive = createEventRecord(
      {
        title: 'Convocation Rehearsal',
        category: 'Social',
        date: '2026-05-18',
        time: '9:00 AM',
        venue: 'Main Auditorium',
        hubId: 'hub-1',
        isFree: true,
        entryLabel: 'Free Entry',
        description: 'Mandatory briefing',
        artwork: 'music_fest',
      },
      'super_admin',
      TEST_PROFILE,
      TEST_HUBS
    );
    expect(adminLive?.isDirectApproved).toBe(true);
    expect(adminLive?.event.status).toBe('approved');
    expect(adminLive?.event.attendeeCount).toBe(0);

    const noticeByHubIncharge = createAnnouncementRecord(
      {
        title: 'Lab Timings Updated',
        category: 'Academic',
        summary: 'Open until 8 PM',
        pinned: true,
      },
      'hub_incharge',
      TEST_PROFILE
    );
    expect(noticeByHubIncharge?.announcement.pinned).toBe(false);

    const clubLeadDraft = createEventRecord(
      {
        title: 'Acoustic Jam Session',
        category: 'Cultural',
        date: '2026-05-20',
        time: '5:00 PM',
        venue: 'Open Air Stage',
        hubId: 'hub-1',
        isFree: true,
        entryLabel: 'Free Entry',
        description: 'Weekly club showcase',
        artwork: 'music_fest',
      },
      'club_incharge',
      TEST_PROFILE,
      TEST_HUBS
    );
    expect(clubLeadDraft?.isDirectApproved).toBe(false);
    expect(clubLeadDraft?.event.status).toBe('pending');
    expect(clubLeadDraft?.event.authorRole).toBe('club_incharge');
  });

  it('normalizes valid date strings and rejects impossible calendar dates', () => {
    expect(normalizeIsoDateInput('2026-11-28')).toBe('2026-11-28');
    expect(normalizeIsoDateInput('2026/5/4')).toBe('2026-05-04');
    expect(normalizeIsoDateInput('28-11-2026')).toBe('2026-11-28');
    expect(normalizeIsoDateInput('5/6/2026')).toBe('2026-06-05');
    expect(normalizeIsoDateInput('31-02-2026')).toBeNull();
    expect(normalizeIsoDateInput('not-a-date')).toBeNull();

    const normalizedEvent = createEventRecord(
      {
        title: 'Winter Hackathon',
        category: 'Tech',
        date: '28/11/2026',
        time: '10:00 AM',
        venue: 'Main Auditorium',
        hubId: 'hub-1',
        isFree: true,
        entryLabel: 'Free Entry',
        description: 'Annual campus coding sprint for all teams.',
        artwork: 'hackathon',
      },
      'super_admin',
      TEST_PROFILE,
      TEST_HUBS
    );
    expect(normalizedEvent?.event.date).toBe('2026-11-28');
  });
});
