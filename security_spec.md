# CollegeConnect Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants

1. **Zero-Trust Identity & Email Verification**: All writes require `request.auth != null && request.auth.token.email_verified == true`.
2. **Self-Assigned Role Prevention**: Self-registered users writing `/users/{userId}/public/profile` and `/userDirectory/{userId}` can only create with `role == 'student'` unless claiming a verified, matching `/roleInvites/{inviteId}` (deleted atomically via `!existsAfter`) or passing `isAdmin()`. Users can never self-elevate `role` or `assignedClubId` during profile updates (`incoming().role == existing().role`).
3. **Strict PII Isolation (Split Collection & Admin-Only Directory)**: Email and `studentId` live in `/users/{userId}/private/info` and `/userDirectory/{userId}`, readable only by the owner (`request.auth.uid == userId`) or `isAdmin()` (and listable only by `isBootstrappedAdmin()` or self-UID). `/emailDirectory/{emailHash}` stores only `{ uid }` keyed by SHA-256 hash and is readable solely by `isAdmin()`.
4. **Master Gate & Referential Integrity**:
   - Creating a `CampusClub` requires `exists(/databases/$(database)/documents/hubs/$(incoming().hubId))`.
   - Creating a `CampusEvent` requires `exists(/databases/$(database)/documents/hubs/$(incoming().hubId))` and `incoming().authorUid == request.auth.uid`.
   - Registering or saving an event requires `exists(/databases/$(database)/documents/events/$(eventId))`.
   - Joining a club requires `exists(/databases/$(database)/documents/clubs/$(clubId))`.
   - Creating `/admins/{userId}` requires `isAdmin()` (with `incoming().grantedByUid == request.auth.uid`) OR `isOwner(userId)` claiming a verified `super_admin` `/roleInvites/{callerEmailInviteId()}` (with `incoming().grantedByUid == invite.invitedByUid` and `!existsAfter` deleting the invite atomically). Updating `/admins/{userId}` requires `isAdmin()`, and deleting `/admins/{userId}` blocks self-lockout (`userId != request.auth.uid`).
5. **Atomicity Guarantee (`existsAfter` / `getAfter`)**:
   - Creating `/users/{userId}/registrations/{eventId}` must occur in the same atomic batch that increments `/events/{eventId}.attendeeCount` by `+1`.
   - Deleting `/users/{userId}/registrations/{eventId}` must occur in the same atomic batch that decrements `/events/{eventId}.attendeeCount` by `-1`.
   - Creating/deleting `/users/{userId}/clubMemberships/{clubId}` must atomically increment/decrement `/clubs/{clubId}.memberCount` by `1`.
   - Claiming a `/roleInvites/{inviteId}` must delete it in the same atomic batch (`!existsAfter(...)`).
6. **Terminal State Locking**: Once an event reaches `status == 'approved'`, non-admin authors cannot alter event details or revert `status`.
7. **Temporal Integrity**: All `createdAt` and `updatedAt` timestamps must match `request.time`, and `createdAt` is immutable on update.
8. **Secure List Queries**: No blanket `allow list: if isSignedIn();` rules. Every `allow list` validates `resource.data` directly without `get()`/`exists()` calls (`resource.data.userId == request.auth.uid`, `resource.data.visibility == 'campus'`, `resource.data.status == 'approved'`, `resource.data.uid == request.auth.uid`, or `isBootstrappedAdmin()`).

---

## 2. The "Dirty Dozen" Adversarial Payloads (Expected: `PERMISSION_DENIED`)

1. **Self-Assigned Super Admin Role (`create /users/{uid}/public/profile`)**:
   `{ "uid": "u1", "name": "Mallory", "program": "CS", "year": "1st", "role": "super_admin", "assignedHubId": "hub-tech", "createdAt": "<SERVER>", "updatedAt": "<SERVER>" }`
2. **Privilege Escalation Update (`update /users/{uid}/public/profile`)**:
   `{ "role": "faculty", "updatedAt": "<SERVER>" }`
3. **Ghost Shadow Field Injection (`create /users/{uid}/public/profile`)**:
   `{ "uid": "u1", "name": "Mallory", "program": "CS", "year": "1st", "role": "student", "assignedHubId": "hub-tech", "isVerified": true, "createdAt": "<SERVER>", "updatedAt": "<SERVER>" }`
4. **PII Cross-User Read (`get /users/victim-uid/private/info` as non-owner non-admin)**
5. **Unverified Email Admin Spoof (`email == "aniruddhsaxena73@gmail.com"`, `email_verified == false`)**
6. **Student Creating Official Event (`create /events/evt-spoof` as `role == 'student'`)**:
   `{ "id": "evt-spoof", "title": "Fake Event", ..., "authorUid": "student-1", "authorRole": "student", "status": "approved" }`
7. **Orphaned Event Referencing Non-Existent Hub (`create /events/evt-orphan`)**:
   `{ "id": "evt-orphan", "hubId": "non-existent-hub-999", ... }`
8. **Out-of-Bounds / Poisoned Document ID (`create /events/{1500-char-id}`)**:
   Path ID fails `isValidId()` (`size() <= 128 && matches('^[a-zA-Z0-9_\\-]+$')`).
9. **Unbounded or Type-Poisoned Array (`create /events/evt-bad` by publisher)**:
   `highlights: [12345]` or `highlights.size() > 6`.
10. **Desynced Registration Without Batch `attendeeCount` Increment (`create /users/{uid}/registrations/evt-music-fest` alone)**
11. **Arbitrary `attendeeCount` Inflation (`update /events/evt-music-fest` setting `attendeeCount: 999999`)**
12. **Client-Forged Timestamp & Immutable Field Tampering (`update /events/evt-music-fest` with `createdAt` modified or `updatedAt != request.time`)**
