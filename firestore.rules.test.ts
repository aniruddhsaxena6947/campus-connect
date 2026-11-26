import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import {
  BLUEPRINT_LIMITS,
  isValidDocumentId,
  validateEventMutationPayload,
  validatePublicProfilePayload,
  validateRoleAssignmentInput,
} from './src/services/firebase/validation';

const rulesPath = path.resolve(import.meta.dirname, 'firestore.rules');
const draftRulesPath = path.resolve(import.meta.dirname, 'DRAFT_firestore.rules');

function readActiveRules(): string {
  if (fs.existsSync(rulesPath)) return fs.readFileSync(rulesPath, 'utf8');
  return fs.readFileSync(draftRulesPath, 'utf8');
}

describe('Phase 0 Security TDD: Dirty Dozen & Rules Invariants', () => {
  test('rejects poisoned >128 char and invalid-character document IDs (Payload #8)', () => {
    const oversizedId = 'a'.repeat(129);
    expect(isValidDocumentId(oversizedId)).toBe(false);
    expect(isValidDocumentId('../admin/root')).toBe(false);
    expect(isValidDocumentId('evt-valid_123', BLUEPRINT_LIMITS.shortIdMax)).toBe(true);
  });

  test('rejects shadow ghost fields on user profile writes (Payload #3)', () => {
    const result = validatePublicProfilePayload({
      uid: 'uid-123',
      name: 'Mallory',
      program: 'CS',
      year: '1st Year',
      role: 'student',
      assignedHubId: 'hub-tech',
      assignedClubId: 'unassigned',
      extraKeys: ['isVerified'],
    });
    expect(result.ok).toBe(false);
  });

  test('validates role assignment payloads including hub_incharge, club_incharge, and super_admin', () => {
    expect(
      validateRoleAssignmentInput({
        email: 'club.lead@campus.edu',
        role: 'club_incharge',
        assignedHubId: 'hub-tech',
        assignedClubId: 'club-ai',
        note: 'Robotics club lead',
      }).ok
    ).toBe(true);

    expect(
      validateRoleAssignmentInput({
        email: 'hub.head@campus.edu',
        role: 'hub_incharge',
        assignedHubId: 'unassigned',
        assignedClubId: 'unassigned',
        note: 'Promoted to Hub Head prior to hub creation',
      }).ok
    ).toBe(true);

    expect(
      validateRoleAssignmentInput({
        email: 'dean.admin@campus.edu',
        role: 'super_admin',
        assignedHubId: 'unassigned',
        assignedClubId: 'unassigned',
      }).ok
    ).toBe(true);

    expect(
      validateRoleAssignmentInput({
        email: 'bad-email',
        role: 'faculty',
        assignedHubId: 'unassigned',
        assignedClubId: 'unassigned',
      }).ok
    ).toBe(false);
  });

  test('rejects student attempting to create official events (Payload #6)', () => {
    const result = validateEventMutationPayload({
      id: 'evt-spoof',
      title: 'Unauthorized Campus Party',
      category: 'Social',
      date: '2025-05-01',
      venue: 'Main Quad',
      description: 'Attempting to bypass publisher RBAC gate.',
      highlights: ['Free'],
      hubId: 'hub-cultural',
      authorUid: 'student-123',
      authorRole: 'student',
      status: 'approved',
      attendeeCount: 1,
      capacity: 100,
    });
    expect(result.ok).toBe(false);
  });

  test('rejects unbounded or oversized highlight tag arrays on events (Payload #9)', () => {
    const result = validateEventMutationPayload({
      id: 'evt-bad-array',
      title: 'Overflow Event',
      category: 'Tech',
      date: '2025-05-01',
      venue: 'Lab 1',
      description: 'Valid description for overflow test.',
      highlights: ['1', '2', '3', '4', '5', '6', '7'],
      hubId: 'hub-tech',
      authorUid: 'faculty-123',
      authorRole: 'faculty',
      status: 'pending',
      attendeeCount: 0,
      capacity: 100,
    });
    expect(result.ok).toBe(false);
  });

  test('rejects invalid capacity / attendeeCount inflation (Payload #11)', () => {
    const result = validateEventMutationPayload({
      id: 'evt-inflate',
      title: 'Valid Title',
      category: 'Tech',
      date: '2025-05-01',
      venue: 'Auditorium',
      description: 'Attempting to inflate attendee count past capacity.',
      highlights: ['Tech'],
      hubId: 'hub-tech',
      authorUid: 'faculty-123',
      authorRole: 'faculty',
      status: 'pending',
      attendeeCount: 999999,
      capacity: 150,
    });
    expect(result.ok).toBe(false);
  });

  test('enforces Eight Pillars primitives inside Firestore security rules', () => {
    const rules = readActiveRules();

    // Global safety net & rules_version
    expect(rules).toContain("rules_version = '2';");
    expect(rules).toContain('match /{document=**} {\n      allow read, write: if false;');

    // Verified email gate & bootstrapped admin email check (Payloads #4, #5)
    expect(rules).toContain('request.auth.token.email_verified == true');
    expect(rules).toContain("request.auth.token.email.lower() == 'aniruddhsaxena73@gmail.com'");

    // Self-assigned role & escalation lock + email invite verification (Payloads #1, #2)
    expect(rules).toContain("incoming().role == 'student'");
    expect(rules).toContain('hasMatchingRoleInvite');
    expect(rules).toContain('hasMatchingAdminInvite');
    expect(rules).toContain('incoming().role == existing().role');
    expect(rules).toContain("'club_incharge'");

    // Role management & split collection PII isolation (Payload #4)
    expect(rules).toContain('match /private/info');
    expect(rules).toContain('match /userDirectory/{userId}');
    expect(rules).toContain('match /emailDirectory/{emailHash}');
    expect(rules).toContain('match /roleInvites/{inviteId}');
    expect(rules).toContain('userId != request.auth.uid');

    // Master Gate referential integrity & atomicity (Payloads #7, #10)
    expect(rules).toContain('exists(/databases/$(database)/documents/hubs/$(incoming().hubId))');
    expect(rules).toContain('getAfter(/databases/$(database)/documents/events/$(eventId))');
    expect(rules).toContain(
      'existsAfter(/databases/$(database)/documents/users/$(request.auth.uid)/registrations/$(eventId))'
    );

    // Temporal integrity (Payload #12)
    expect(rules).toContain('incoming().createdAt == request.time');
    expect(rules).toContain('incoming().updatedAt == request.time');
    expect(rules).toContain('incoming().createdAt == existing().createdAt');

    // Zero blanket signed-in list rules
    expect(rules).not.toMatch(/allow\s+list\s*:\s*if\s+isSignedIn\(\)\s*;/);
  });
});
