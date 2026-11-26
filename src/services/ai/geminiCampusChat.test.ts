import { describe, expect, it } from 'bun:test';
import { buildCampusSystemInstruction, normalizeChatHistory } from './geminiCampusChat.ts';

describe('geminiCampusChat', () => {
  it('embeds all live events, hubs, and clubs into the system instruction', () => {
    const prompt = buildCampusSystemInstruction({
      todayIso: '2026-11-25',
      callerRole: 'student',
      hubs: [
        {
          id: 'hub-tech',
          name: 'Tech & Innovation Hub',
          focus: 'AI, robotics, and hackathons',
          inChargeName: 'Dr. Rao',
          building: 'Block B',
          activeEventsCount: 1,
        },
      ],
      clubs: [
        {
          id: 'club-ai',
          name: 'AI Guild',
          hubId: 'hub-tech',
          hubName: 'Tech & Innovation Hub',
          tagline: 'Weekly ML & coding jams',
          meetingSchedule: 'Thu 5 PM',
          location: 'Lab 2',
          memberCount: 30,
          leadName: 'Riya',
        },
      ],
      events: [
        {
          id: 'evt-tech-1',
          title: 'Hackathon 2.0',
          category: 'Tech',
          date: '2026-11-30',
          dateDisplay: '30 Nov 2026',
          time: '10:00 AM',
          venue: 'Seminar Hall',
          entryLabel: 'Free Entry',
          isFree: true,
          description: 'Build AI and web prototypes in 24 hours.',
          highlights: ['Tech', 'AI', 'Free'],
          hubId: 'hub-tech',
          hubName: 'Tech & Innovation Hub',
          organizerName: 'AI Guild',
          authorRole: 'hub_incharge',
          status: 'approved',
          artwork: 'hackathon',
          attendeeCount: 40,
          capacity: 200,
        },
      ],
    });

    expect(prompt).toContain('Campus Guide');
    expect(prompt).toContain('2026-11-25');
    expect(prompt).toContain('evt-tech-1');
    expect(prompt).toContain('Hackathon 2.0');
    expect(prompt).toContain('Tech & Innovation Hub');
    expect(prompt).toContain('AI Guild');
  });

  it('normalizes consecutive turns so Gemini history strictly alternates user and model', () => {
    const result = normalizeChatHistory([
      { role: 'model', text: 'Ignored leading greeting' },
      { role: 'user', text: 'First prompt' },
      { role: 'user', text: 'Clarification' },
      { role: 'model', text: 'First answer' },
      { role: 'user', text: 'Dangling user turn' },
      { role: 'user', text: 'List tech events' },
    ]);

    expect(result.lastUserText).toBe('List tech events');
    expect(result.history).toEqual([
      { role: 'user', parts: [{ text: 'First prompt\nClarification' }] },
      { role: 'model', parts: [{ text: 'First answer' }] },
    ]);
  });
});
