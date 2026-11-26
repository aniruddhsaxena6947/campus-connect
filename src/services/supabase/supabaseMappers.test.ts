import { describe, expect, it } from 'bun:test';
import {
  buildSupabaseAnnouncementInsert,
  buildSupabaseClubInsert,
  buildSupabaseEventInsert,
  buildSupabaseHubInsert,
  buildSupabaseNotificationInsert,
  mapSupabaseAnnouncementRow,
  mapSupabaseClubRow,
  mapSupabaseEventRow,
  mapSupabaseHubRow,
  mapSupabaseNotificationRow,
} from './supabaseMappers';

describe('supabaseMappers', () => {
  it('maps and builds hub rows cleanly', () => {
    const insert = buildSupabaseHubInsert({
      id: 'hub-tech',
      name: '  Innovation & Tech Hub  ',
      focus: '  Robotics, AI, and engineering sprints  ',
      inChargeName: 'Dr. Nair',
      building: 'Block B',
      activeEventsCount: -3,
    });
    expect(insert.active_events_count).toBe(0);
    expect(insert.visibility).toBe('campus');

    const mapped = mapSupabaseHubRow(insert);
    expect(mapped).toEqual({
      id: 'hub-tech',
      name: 'Innovation & Tech Hub',
      focus: 'Robotics, AI, and engineering sprints',
      inChargeName: 'Dr. Nair',
      building: 'Block B',
      activeEventsCount: 0,
    });
  });

  it('maps and builds club rows cleanly', () => {
    const insert = buildSupabaseClubInsert({
      id: 'club-ai',
      name: 'AI Guild',
      hubId: 'hub-tech',
      hubName: 'Innovation & Tech Hub',
      tagline: 'Weekly ML study jams',
      meetingSchedule: 'Thu 5 PM',
      location: 'Lab 2',
      memberCount: 12,
      leadName: 'Aarav',
      isJoined: true,
    });
    const mapped = mapSupabaseClubRow(insert);
    expect(mapped.memberCount).toBe(12);
    expect(mapped.hubId).toBe('hub-tech');
  });

  it('sanitizes and maps event rows with bounded highlights and capacity', () => {
    const insert = buildSupabaseEventInsert(
      'uid-faculty-1',
      {
        id: 'evt-hack-1',
        title: 'Campus Hackathon',
        category: 'Tech',
        date: '2026-12-01',
        dateDisplay: '01 Dec 2026',
        time: '9:00 AM',
        venue: 'Main Hall',
        entryLabel: 'Free Entry',
        isFree: true,
        description: 'Build a campus utility in 24 hours.',
        highlights: ['24-Hr', 'Tech', 'Free', 'H4', 'H5', 'H6', 'H7'],
        hubId: 'hub-tech',
        hubName: 'Innovation & Tech Hub',
        organizerName: 'AI Guild',
        authorRole: 'faculty',
        status: 'pending',
        artwork: 'hackathon',
        attendeeCount: 500,
        capacity: 100,
        isRegistered: false,
        isSaved: false,
      },
      '2026-11-25'
    );

    expect(insert.highlights).toHaveLength(6);
    expect(insert.attendee_count).toBe(100);
    expect(insert.author_uid).toBe('uid-faculty-1');

    const mapped = mapSupabaseEventRow(insert);
    expect(mapped.status).toBe('pending');
    expect(mapped.category).toBe('Tech');
  });

  it('maps announcement and notification rows safely', () => {
    const annInsert = buildSupabaseAnnouncementInsert(
      'uid-admin',
      {
        id: 'ann-1',
        title: 'Exam Timetable Released',
        category: 'Exam',
        issuerTitle: 'Exam Cell',
        authorRole: 'super_admin',
        summary: 'Check the updated semester timetable.',
        postedAt: 'Just now',
        date: 'bad-date',
        pinned: true,
        isRead: false,
        isSaved: false,
      },
      '2026-11-25'
    );
    expect(annInsert.date).toBe('2026-11-25');
    expect(mapSupabaseAnnouncementRow(annInsert).pinned).toBe(true);

    const notInsert = buildSupabaseNotificationInsert('uid-admin', {
      id: 'not-1',
      type: 'announcement',
      title: 'Official Notice',
      message: 'Exam Timetable Released',
      timeAgo: 'Just now',
      isRead: false,
      targetScreen: 'announcements',
      targetId: 'ann-1',
    });
    const mappedNotif = mapSupabaseNotificationRow(notInsert);
    expect(mappedNotif.targetScreen).toBe('announcements');
    expect(mappedNotif.targetId).toBe('ann-1');
  });
});
