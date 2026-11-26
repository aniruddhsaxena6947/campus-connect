import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  MailIcon,
  PlusIcon,
  SearchIcon,
  ShieldIcon,
  UsersIcon,
  XIcon,
} from '../../../components/icons/NavIcons';
import { BottomSheetHeader } from '../../../components/ui/BottomSheetHeader';
import { FormField } from '../../../components/ui/FormField';
import {
  EmptyStateCard,
  ScreenHeader,
  SmoothBottomSheet,
  TactilePressable,
} from '../../../components/ui/RNPrimitives';
import { ROLE_PERSONAS, ROLES_ORDER } from '../../../data/mockCampusData';
import {
  assignFirestoreUserRole,
  deleteFirestoreRoleInvite,
  isBootstrappedAdminEmail,
  lookupFirestoreUserByEmail,
  subscribeRoleManagementDirectory,
  upsertFirestoreRoleInvite,
} from '../../../services/firebase/firestoreCampusService';
import { validateRoleAssignmentInput } from '../../../services/firebase/validation';
import { useAuth, useCampusData, useNavigation, useTheme, useUIState } from '../../../store';
import { FONTS, RADII, SPACING, TOUCH_TARGET } from '../../../theme/tokens';
import { ManagedUserRecord, RoleInviteRecord, UserRole } from '../../../types/collegeConnect';

export const RoleManagementScreen: React.FC = () => {
  const {
    role,
    accounts,
    firebaseUid,
    firebaseEmail,
    firebaseAuthReady,
    updateLocalAccountRole,
    addOrPromoteLocalAccount,
  } = useAuth();
  const { hubs, clubs } = useCampusData();
  const { navigate } = useNavigation();
  const { showFeedback } = useUIState();
  const { theme } = useTheme();

  const [liveUsers, setLiveUsers] = useState<ManagedUserRecord[]>([]);
  const [lookedUpUsers, setLookedUpUsers] = useState<ManagedUserRecord[]>([]);
  const [liveInvites, setLiveInvites] = useState<RoleInviteRecord[]>([]);
  const [lookedUpInvites, setLookedUpInvites] = useState<RoleInviteRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [lookupBusy, setLookupBusy] = useState(false);

  // Edit User Role sheet state
  const [editingUser, setEditingUser] = useState<ManagedUserRecord | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('student');
  const [editHubId, setEditHubId] = useState<string>('unassigned');
  const [editClubId, setEditClubId] = useState<string>('unassigned');
  const [editProgram, setEditProgram] = useState<string>('');
  const [editYear, setEditYear] = useState<string>('');
  const [savingUser, setSavingUser] = useState(false);

  // Promote / Pre-Assign Email sheet state
  const [inviteSheetOpen, setInviteSheetOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('faculty');
  const [inviteHubId, setInviteHubId] = useState<string>('unassigned');
  const [inviteClubId, setInviteClubId] = useState<string>('unassigned');
  const [inviteNote, setInviteNote] = useState('');
  const [savingInvite, setSavingInvite] = useState(false);

  useEffect(() => {
    if (role !== 'super_admin' || !firebaseAuthReady || !firebaseUid) return;
    return subscribeRoleManagementDirectory(firebaseUid, firebaseEmail, {
      onUsers: setLiveUsers,
      onInvites: setLiveInvites,
    });
  }, [role, firebaseAuthReady, firebaseUid, firebaseEmail]);

  const allUsers = useMemo<ManagedUserRecord[]>(() => {
    if (!firebaseUid) {
      return accounts.map((acc) => ({
        uid: acc.id,
        name: acc.name,
        email: acc.email,
        studentId: acc.studentId,
        program: acc.program,
        year: acc.year,
        role: acc.role,
        assignedHubId: acc.assignedHubId || 'unassigned',
        assignedClubId: acc.assignedClubId || 'unassigned',
      }));
    }
    const merged = new Map<string, ManagedUserRecord>();
    liveUsers.forEach((u) => merged.set(u.uid, u));
    lookedUpUsers.forEach((u) => merged.set(u.uid, u));
    return Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [firebaseUid, accounts, liveUsers, lookedUpUsers]);

  const allInvites = useMemo<RoleInviteRecord[]>(() => {
    const merged = new Map<string, RoleInviteRecord>();
    liveInvites.forEach((i) => merged.set(i.id, i));
    lookedUpInvites.forEach((i) => merged.set(i.id, i));
    return Array.from(merged.values()).sort((a, b) => a.email.localeCompare(b.email));
  }, [liveInvites, lookedUpInvites]);

  const roleCounts = useMemo(() => {
    const counts: Record<UserRole, number> = {
      student: 0,
      faculty: 0,
      club_incharge: 0,
      hub_incharge: 0,
      super_admin: 0,
    };
    allUsers.forEach((u) => {
      counts[u.role] += 1;
    });
    return counts;
  }, [allUsers]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allUsers.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (!q) return true;
      const haystack = `${u.name} ${u.email} ${u.studentId} ${u.program}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [allUsers, roleFilter, searchQuery]);

  const hubNameById = useMemo(() => {
    const map = new Map<string, string>();
    hubs.forEach((h) => map.set(h.id, h.name));
    return map;
  }, [hubs]);

  const clubNameById = useMemo(() => {
    const map = new Map<string, string>();
    clubs.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [clubs]);

  const openEditUser = (user: ManagedUserRecord) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditHubId(user.assignedHubId || 'unassigned');
    setEditClubId(user.assignedClubId || 'unassigned');
    setEditProgram(user.program);
    setEditYear(user.year);
  };

  const openNewInvite = (prefillEmail = '', defaultRole: UserRole = 'faculty') => {
    setInviteEmail(prefillEmail);
    setInviteRole(defaultRole);
    setInviteHubId(hubs[0]?.id ?? 'unassigned');
    setInviteClubId('unassigned');
    setInviteNote('');
    setInviteSheetOpen(true);
  };

  const handleSelectEditRole = (nextRole: UserRole) => {
    setEditRole(nextRole);
    const defaultYears = new Set([
      '',
      'Member',
      '1st Year',
      'Campus Admin',
      ...Object.values(ROLE_PERSONAS).map((p) => p.defaultYear),
    ]);
    const defaultPrograms = new Set([
      '',
      'General',
      ...Object.values(ROLE_PERSONAS).map((p) => p.defaultProgram),
    ]);
    if (defaultYears.has(editYear.trim())) {
      setEditYear(ROLE_PERSONAS[nextRole].defaultYear);
    }
    if (defaultPrograms.has(editProgram.trim())) {
      setEditProgram(ROLE_PERSONAS[nextRole].defaultProgram);
    }
  };

  const handleExactEmailLookup = async () => {
    const clean = searchQuery.trim().toLowerCase();
    if (!firebaseUid) return;
    if (!clean.includes('@')) {
      showFeedback('error', 'Enter Full Email', 'Type a full email address to look up an account.');
      return;
    }
    setLookupBusy(true);
    try {
      const res = await lookupFirestoreUserByEmail(clean);
      if (res.user) {
        setLookedUpUsers((prev) => [res.user!, ...prev.filter((u) => u.uid !== res.user!.uid)]);
      }
      if (res.invite) {
        setLookedUpInvites((prev) => [
          res.invite!,
          ...prev.filter((i) => i.id !== res.invite!.id),
        ]);
      }
      if (!res.user && !res.invite) {
        showFeedback(
          'info',
          'Not Signed In Yet',
          `No registered account or pending assignment found for ${clean}. You can pre-assign their role now.`
        );
      } else {
        showFeedback('success', 'Record Loaded', `Found campus record for ${clean}.`);
      }
    } catch (err) {
      showFeedback(
        'error',
        'Lookup Failed',
        err instanceof Error ? err.message : 'Unable to look up email right now.'
      );
    } finally {
      setLookupBusy(false);
    }
  };

  const handleSaveUserRole = async () => {
    if (!editingUser) return;
    const isSelf = Boolean(firebaseUid && editingUser.uid === firebaseUid);
    const isPrimary = isBootstrappedAdminEmail(editingUser.email);

    if ((isSelf || isPrimary) && editRole !== 'super_admin') {
      showFeedback(
        'error',
        'Protected Account',
        isSelf
          ? 'You cannot remove your own Super Admin access.'
          : 'The primary bootstrapped Super Admin account cannot be demoted.'
      );
      return;
    }

    const resolvedClub = clubs.find((c) => c.id === editClubId);
    const finalHubId =
      editHubId !== 'unassigned' ? editHubId : resolvedClub ? resolvedClub.hubId : 'unassigned';

    setSavingUser(true);
    try {
      if (firebaseUid) {
        await assignFirestoreUserRole(firebaseUid, editingUser, {
          role: editRole,
          assignedHubId: finalHubId,
          assignedClubId: editClubId,
          program: editProgram.trim() || editingUser.program,
          year: editYear.trim() || editingUser.year,
        });
        setLookedUpUsers((prev) =>
          prev.map((u) =>
            u.uid === editingUser.uid
              ? {
                  ...u,
                  role: editRole,
                  assignedHubId: finalHubId,
                  assignedClubId: editClubId,
                  program: editProgram.trim() || u.program,
                  year: editYear.trim() || u.year,
                }
              : u
          )
        );
      } else {
        updateLocalAccountRole(editingUser.uid, {
          role: editRole,
          assignedHubId: finalHubId,
          assignedClubId: editClubId,
          program: editProgram.trim() || editingUser.program,
          year: editYear.trim() || editingUser.year,
        });
      }

      showFeedback(
        'success',
        'Role Assigned',
        `${editingUser.name} is now ${ROLE_PERSONAS[editRole].label}.`
      );
      setEditingUser(null);
    } catch (err) {
      showFeedback(
        'error',
        'Update Failed',
        err instanceof Error ? err.message : 'Unable to save role assignment.'
      );
    } finally {
      setSavingUser(false);
    }
  };

  const handleSaveInvite = async () => {
    const resolvedClub = clubs.find((c) => c.id === inviteClubId);
    const finalHubId =
      inviteHubId !== 'unassigned' ? inviteHubId : resolvedClub ? resolvedClub.hubId : 'unassigned';

    const validation = validateRoleAssignmentInput({
      email: inviteEmail,
      role: inviteRole,
      assignedHubId: finalHubId,
      assignedClubId: inviteClubId,
      note: inviteNote,
    });
    if (!validation.ok) {
      showFeedback('error', 'Invalid Assignment', validation.error);
      return;
    }

    const cleanEmail = inviteEmail.trim().toLowerCase();

    if (!firebaseUid) {
      const localRes = addOrPromoteLocalAccount({
        email: cleanEmail,
        role: inviteRole,
        assignedHubId: finalHubId,
        assignedClubId: inviteClubId,
      });
      showFeedback(
        'success',
        localRes.created ? 'Account Promoted & Added' : 'Account Promoted',
        `${localRes.account.email} is now ${ROLE_PERSONAS[inviteRole].label}.`
      );
      setInviteSheetOpen(false);
      return;
    }

    setSavingInvite(true);
    try {
      const existing = await lookupFirestoreUserByEmail(cleanEmail);
      if (existing.user) {
        const defaultYears = new Set([
          '',
          'Member',
          '1st Year',
          'Campus Admin',
          ...Object.values(ROLE_PERSONAS).map((p) => p.defaultYear),
        ]);
        const nextYear = defaultYears.has(existing.user.year.trim())
          ? ROLE_PERSONAS[inviteRole].defaultYear
          : existing.user.year;
        await assignFirestoreUserRole(firebaseUid, existing.user, {
          role: inviteRole,
          assignedHubId: finalHubId,
          assignedClubId: inviteClubId,
          year: nextYear,
        });
        setLookedUpUsers((prev) => [
          {
            ...existing.user!,
            role: inviteRole,
            assignedHubId: finalHubId,
            assignedClubId: inviteClubId,
            year: nextYear,
          },
          ...prev.filter((u) => u.uid !== existing.user!.uid),
        ]);
        showFeedback(
          'success',
          'Account Promoted',
          `${existing.user.name} was updated directly to ${ROLE_PERSONAS[inviteRole].label}.`
        );
        setInviteSheetOpen(false);
        return;
      }

      const saved = await upsertFirestoreRoleInvite(firebaseUid, {
        email: cleanEmail,
        role: inviteRole,
        assignedHubId: finalHubId,
        assignedClubId: inviteClubId,
        note: inviteNote,
      });
      setLookedUpInvites((prev) => [saved, ...prev.filter((i) => i.id !== saved.id)]);
      showFeedback(
        'success',
        'Promotion Queued',
        `${cleanEmail} will activate as ${ROLE_PERSONAS[inviteRole].label} on Google sign-in.`
      );
      setInviteSheetOpen(false);
    } catch (err) {
      showFeedback(
        'error',
        'Promotion Failed',
        err instanceof Error ? err.message : 'Unable to save role promotion.'
      );
    } finally {
      setSavingInvite(false);
    }
  };

  const handleRevokeInvite = async (invite: RoleInviteRecord) => {
    try {
      await deleteFirestoreRoleInvite(invite.id);
      setLookedUpInvites((prev) => prev.filter((i) => i.id !== invite.id));
      showFeedback('info', 'Pre-Assignment Revoked', `Removed pending role for ${invite.email}.`);
    } catch (err) {
      showFeedback(
        'error',
        'Revoke Failed',
        err instanceof Error ? err.message : 'Unable to revoke pre-assignment.'
      );
    }
  };

  if (role !== 'super_admin') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <ScreenHeader
          title="Role Management"
          subtitle="Restricted campus governance"
          showBack
          handwrittenTitle
        />
        <View style={{ flex: 1, padding: SPACING.lg, justifyContent: 'center' }}>
          <EmptyStateCard
            title="Super Admin Access Required"
            description="Only verified Super Admins can promote accounts to Faculty, Hub Head, Club In-charge, or Super Admin."
            actionLabel="Back to Home"
            onAction={() => navigate('home')}
          />
        </View>
      </View>
    );
  }

  const editFilteredClubs =
    editHubId !== 'unassigned' ? clubs.filter((c) => c.hubId === editHubId) : clubs;
  const inviteFilteredClubs =
    inviteHubId !== 'unassigned' ? clubs.filter((c) => c.hubId === inviteHubId) : clubs;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScreenHeader
        title="Role Management"
        subtitle="Promote any account to Faculty, Hub Head, Club Lead & more."
        showBack
        handwrittenTitle
        rightSlot={
          <TactilePressable
            onPress={() => openNewInvite()}
            scaleTo={0.94}
            accessibilityLabel="Promote or assign role by email"
            style={[styles.headerAction, { backgroundColor: theme.primary }]}
          >
            <PlusIcon size={14} color={theme.primaryFg} />
            <Text style={[styles.headerActionText, { color: theme.primaryFg }]}>Promote</Text>
          </TactilePressable>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Role Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <TactilePressable
            onPress={() => setRoleFilter('all')}
            scaleTo={0.95}
            style={[
              styles.filterChip,
              {
                backgroundColor: roleFilter === 'all' ? theme.primary : theme.surfaceTag,
                borderColor: roleFilter === 'all' ? theme.primary : theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: roleFilter === 'all' ? theme.primaryFg : theme.text },
              ]}
            >
              All ({allUsers.length})
            </Text>
          </TactilePressable>

          {ROLES_ORDER.map((r) => {
            const active = roleFilter === r;
            return (
              <TactilePressable
                key={r}
                onPress={() => setRoleFilter(r)}
                scaleTo={0.95}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? theme.primary : theme.surfaceTag,
                    borderColor: active ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: active ? theme.primaryFg : theme.text },
                  ]}
                >
                  {ROLE_PERSONAS[r].shortLabel} ({roleCounts[r]})
                </Text>
              </TactilePressable>
            );
          })}
        </ScrollView>

        {/* Search & Exact Email Lookup */}
        <View
          style={[
            styles.searchBox,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <SearchIcon size={17} color={theme.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search name, email, or student ID..."
            placeholderTextColor={theme.textMuted}
            autoCapitalize="none"
            style={[styles.searchInput, { color: theme.text }]}
          />
          {searchQuery.length > 0 ? (
            <TactilePressable
              onPress={() => setSearchQuery('')}
              scaleTo={0.9}
              hitSlop={8}
              accessibilityLabel="Clear search"
            >
              <XIcon size={15} color={theme.textMuted} />
            </TactilePressable>
          ) : null}
          {firebaseUid && searchQuery.includes('@') ? (
            <TactilePressable
              onPress={handleExactEmailLookup}
              disabled={lookupBusy}
              scaleTo={0.94}
              style={[styles.lookupBtn, { backgroundColor: theme.primary }]}
            >
              <Text style={[styles.lookupBtnText, { color: theme.primaryFg }]}>
                {lookupBusy ? '...' : 'Lookup'}
              </Text>
            </TactilePressable>
          ) : null}
        </View>

        {firebaseUid && !isBootstrappedAdminEmail(firebaseEmail) ? (
          <View style={[styles.infoBanner, { backgroundColor: theme.sage, borderColor: theme.border }]}>
            <ShieldIcon size={16} color={theme.isDark ? theme.primaryBright : theme.primary} />
            <Text style={[styles.infoBannerText, { color: theme.text }]}>
              Delegated Super Admin view: enter a user&apos;s exact email above and tap Lookup, or use
              Pre-Assign to assign any campus email directly.
            </Text>
          </View>
        ) : null}

        {/* Registered Campus Accounts */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeader}>
              <UsersIcon size={16} color={theme.text} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Campus Accounts ({filteredUsers.length})
              </Text>
            </View>
            <TactilePressable
              onPress={() => openNewInvite()}
              scaleTo={0.95}
              style={styles.inlineAddBtn}
            >
              <Text
                style={[
                  styles.inlineAddText,
                  { color: theme.isDark ? theme.primaryBright : theme.primary },
                ]}
              >
                + Promote by Email
              </Text>
            </TactilePressable>
          </View>

          {filteredUsers.length === 0 ? (
            <EmptyStateCard
              title="No matching accounts"
              description={
                searchQuery.includes('@')
                  ? 'Promote this email directly — it applies immediately if registered, or activates on first sign-in.'
                  : 'Registered students, faculty, club leads, and hub heads appear here. Tap + Promote by Email to promote any address.'
              }
              actionLabel={searchQuery.includes('@') ? 'Promote This Email' : 'Clear Filters'}
              onAction={() => {
                if (searchQuery.includes('@')) {
                  openNewInvite(searchQuery.trim().toLowerCase());
                } else {
                  setSearchQuery('');
                  setRoleFilter('all');
                }
              }}
            />
          ) : (
            <View style={{ gap: 10 }}>
              {filteredUsers.map((user) => {
                const isSelf = Boolean(firebaseUid && user.uid === firebaseUid);
                const hubLabel =
                  user.assignedHubId && user.assignedHubId !== 'unassigned'
                    ? (hubNameById.get(user.assignedHubId) ?? user.assignedHubId)
                    : null;
                const clubLabel =
                  user.assignedClubId && user.assignedClubId !== 'unassigned'
                    ? (clubNameById.get(user.assignedClubId) ?? user.assignedClubId)
                    : null;

                return (
                  <TactilePressable
                    key={user.uid}
                    onPress={() => openEditUser(user)}
                    scaleTo={0.985}
                    accessibilityLabel={`Edit role for ${user.name}`}
                    style={[
                      styles.userCard,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                    ]}
                  >
                    <View style={styles.userTopRow}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={styles.nameBadgeRow}>
                          <Text numberOfLines={1} style={[styles.userName, { color: theme.text }]}>
                            {user.name}
                          </Text>
                          {isSelf ? (
                            <View style={[styles.selfTag, { backgroundColor: theme.surfaceTag }]}>
                              <Text style={[styles.selfTagText, { color: theme.textMuted }]}>You</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text numberOfLines={1} style={[styles.userEmail, { color: theme.textMuted }]}>
                          {user.email}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.rolePill,
                          {
                            backgroundColor:
                              user.role === 'super_admin'
                                ? theme.primary
                                : user.role === 'student'
                                  ? theme.surfaceTag
                                  : theme.sage,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.rolePillText,
                            {
                              color:
                                user.role === 'super_admin'
                                  ? theme.primaryFg
                                  : user.role === 'student'
                                    ? theme.textMuted
                                    : theme.isDark
                                      ? theme.primaryBright
                                      : theme.primary,
                            },
                          ]}
                        >
                          {ROLE_PERSONAS[user.role].label}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.scopeRow}>
                      <Text style={[styles.scopeMeta, styles.tabular, { color: theme.textMuted }]}>
                        {user.studentId} · {user.program}
                      </Text>
                      {hubLabel ? (
                        <View style={[styles.scopeChip, { backgroundColor: theme.surfaceMuted }]}>
                          <Text style={[styles.scopeChipText, { color: theme.text }]}>
                            Hub: {hubLabel.replace(' Hub', '')}
                          </Text>
                        </View>
                      ) : null}
                      {clubLabel ? (
                        <View style={[styles.scopeChip, { backgroundColor: theme.surfaceMuted }]}>
                          <Text style={[styles.scopeChipText, { color: theme.text }]}>
                            Club: {clubLabel}
                          </Text>
                        </View>
                      ) : null}
                      <View style={[styles.scopeChip, { backgroundColor: theme.sage }]}>
                        <Text
                          style={[
                            styles.scopeChipText,
                            { color: theme.isDark ? theme.primaryBright : theme.primary },
                          ]}
                        >
                          Promote / Edit
                        </Text>
                      </View>
                    </View>
                  </TactilePressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Pre-Assigned Email Invites */}
        {firebaseUid ? (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeader}>
                <MailIcon size={16} color={theme.text} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Pre-Assigned by Email ({allInvites.length})
                </Text>
              </View>
              <TactilePressable
                onPress={() => openNewInvite()}
                scaleTo={0.95}
                style={styles.inlineAddBtn}
              >
                <Text
                  style={[
                    styles.inlineAddText,
                    { color: theme.isDark ? theme.primaryBright : theme.primary },
                  ]}
                >
                  + Add Email
                </Text>
              </TactilePressable>
            </View>

            <Text style={[styles.sectionHint, { color: theme.textMuted }]}>
              Assign roles before someone logs in. Their role and hub/club scope activate
              automatically on first Google sign-in.
            </Text>

            {allInvites.length === 0 ? (
              <View
                style={[
                  styles.emptyInviteBox,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.emptyInviteText, { color: theme.textMuted }]}>
                  No pending email pre-assignments.
                </Text>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {allInvites.map((invite) => {
                  const hubLabel =
                    invite.assignedHubId && invite.assignedHubId !== 'unassigned'
                      ? (hubNameById.get(invite.assignedHubId) ?? invite.assignedHubId)
                      : null;
                  const clubLabel =
                    invite.assignedClubId && invite.assignedClubId !== 'unassigned'
                      ? (clubNameById.get(invite.assignedClubId) ?? invite.assignedClubId)
                      : null;
                  return (
                    <View
                      key={invite.id}
                      style={[
                        styles.inviteCard,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                      ]}
                    >
                      <View style={{ flex: 1, gap: 3 }}>
                        <Text numberOfLines={1} style={[styles.userName, { color: theme.text }]}>
                          {invite.email}
                        </Text>
                        <Text style={[styles.userEmail, { color: theme.textMuted }]}>
                          {ROLE_PERSONAS[invite.role].label}
                          {hubLabel ? ` · ${hubLabel}` : ''}
                          {clubLabel ? ` · ${clubLabel}` : ''}
                        </Text>
                        {invite.note ? (
                          <Text style={[styles.inviteNote, { color: theme.textMuted }]}>
                            {invite.note}
                          </Text>
                        ) : null}
                      </View>
                      <TactilePressable
                        onPress={() => handleRevokeInvite(invite)}
                        scaleTo={0.94}
                        accessibilityLabel={`Revoke invite for ${invite.email}`}
                        style={[
                          styles.revokeBtn,
                          { backgroundColor: theme.dangerBg, borderColor: theme.danger },
                        ]}
                      >
                        <Text style={[styles.revokeBtnText, { color: theme.danger }]}>Revoke</Text>
                      </TactilePressable>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>

      {/* Edit Registered User Role Sheet */}
      <SmoothBottomSheet
        visible={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        backdropOpacity={0.55}
        topSpacerFlex={0.14}
      >
        {editingUser ? (
          <View
            style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <BottomSheetHeader
              title="Promote / Assign Role"
              subtitle={`${editingUser.name} · ${editingUser.email}`}
              leftIcon={
                <ShieldIcon size={18} color={theme.isDark ? theme.primaryBright : theme.primary} />
              }
              onClose={() => setEditingUser(null)}
            />

            <ScrollView
              style={{ maxHeight: 450 }}
              contentContainerStyle={{ gap: 14, paddingBottom: 14 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Campus Position</Text>
                <View style={styles.rolePickerGrid}>
                  {ROLES_ORDER.map((r) => {
                    const active = editRole === r;
                    const lockedSelf =
                      ((firebaseUid && editingUser.uid === firebaseUid) ||
                        isBootstrappedAdminEmail(editingUser.email)) &&
                      r !== 'super_admin';
                    return (
                      <TactilePressable
                        key={r}
                        onPress={() => handleSelectEditRole(r)}
                        disabled={lockedSelf}
                        scaleTo={0.96}
                        containerStyle={{ width: '48.5%' }}
                        style={[
                          styles.rolePickerBtn,
                          {
                            backgroundColor: active ? theme.primary : theme.surfaceMuted,
                            borderColor: active ? theme.primary : theme.border,
                            opacity: lockedSelf ? 0.42 : 1,
                          },
                        ]}
                      >
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.rolePickerText,
                            { color: active ? theme.primaryFg : theme.text },
                          ]}
                        >
                          {ROLE_PERSONAS[r].label}
                        </Text>
                      </TactilePressable>
                    );
                  })}
                </View>
                <Text style={[styles.roleDescHint, { color: theme.textMuted }]}>
                  {ROLE_PERSONAS[editRole].badgeDescription}
                </Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                  Assigned Hub Scope
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  <TactilePressable
                    onPress={() => setEditHubId('unassigned')}
                    scaleTo={0.95}
                    style={[
                      styles.scopePickerChip,
                      {
                        backgroundColor:
                          editHubId === 'unassigned' ? theme.primary : theme.surfaceMuted,
                        borderColor: editHubId === 'unassigned' ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.scopePickerText,
                        { color: editHubId === 'unassigned' ? theme.primaryFg : theme.text },
                      ]}
                    >
                      Unassigned
                    </Text>
                  </TactilePressable>

                  {hubs.map((h) => {
                    const active = editHubId === h.id;
                    return (
                      <TactilePressable
                        key={h.id}
                        onPress={() => {
                          setEditHubId(h.id);
                          const curClub = clubs.find((c) => c.id === editClubId);
                          if (curClub && curClub.hubId !== h.id) {
                            setEditClubId('unassigned');
                          }
                        }}
                        scaleTo={0.95}
                        style={[
                          styles.scopePickerChip,
                          {
                            backgroundColor: active ? theme.primary : theme.surfaceMuted,
                            borderColor: active ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.scopePickerText,
                            { color: active ? theme.primaryFg : theme.text },
                          ]}
                        >
                          {h.name.replace(' Hub', '')}
                        </Text>
                      </TactilePressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                  Assigned Club Scope
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  <TactilePressable
                    onPress={() => setEditClubId('unassigned')}
                    scaleTo={0.95}
                    style={[
                      styles.scopePickerChip,
                      {
                        backgroundColor:
                          editClubId === 'unassigned' ? theme.primary : theme.surfaceMuted,
                        borderColor: editClubId === 'unassigned' ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.scopePickerText,
                        { color: editClubId === 'unassigned' ? theme.primaryFg : theme.text },
                      ]}
                    >
                      Unassigned
                    </Text>
                  </TactilePressable>

                  {editFilteredClubs.map((c) => {
                    const active = editClubId === c.id;
                    return (
                      <TactilePressable
                        key={c.id}
                        onPress={() => {
                          setEditClubId(c.id);
                          if (editHubId === 'unassigned') {
                            setEditHubId(c.hubId);
                          }
                        }}
                        scaleTo={0.95}
                        style={[
                          styles.scopePickerChip,
                          {
                            backgroundColor: active ? theme.primary : theme.surfaceMuted,
                            borderColor: active ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.scopePickerText,
                            { color: active ? theme.primaryFg : theme.text },
                          ]}
                        >
                          {c.name}
                        </Text>
                      </TactilePressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.twoColInputs}>
                <FormField
                  label="Department / Program"
                  compact
                  containerStyle={{ flex: 1 }}
                  value={editProgram}
                  onChangeText={setEditProgram}
                  placeholder="Program"
                />
                <FormField
                  label="Title / Year"
                  compact
                  containerStyle={{ flex: 1 }}
                  value={editYear}
                  onChangeText={setEditYear}
                  placeholder="Title or Year"
                />
              </View>

              <TactilePressable
                onPress={handleSaveUserRole}
                disabled={savingUser}
                style={[
                  styles.submitBtn,
                  { backgroundColor: theme.primary, opacity: savingUser ? 0.6 : 1 },
                ]}
              >
                <Text style={[styles.submitBtnText, { color: theme.primaryFg }]}>
                  {savingUser ? 'Saving...' : 'Save Role & Permissions'}
                </Text>
              </TactilePressable>
            </ScrollView>
          </View>
        ) : null}
      </SmoothBottomSheet>

      {/* Pre-Assign Role by Email Sheet */}
      <SmoothBottomSheet
        visible={inviteSheetOpen}
        onClose={() => setInviteSheetOpen(false)}
        backdropOpacity={0.55}
        topSpacerFlex={0.14}
      >
        <View
          style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <BottomSheetHeader
            title="Promote Account by Email"
            subtitle="Applies immediately if registered, or activates on sign-in"
            leftIcon={
              <MailIcon size={18} color={theme.isDark ? theme.primaryBright : theme.primary} />
            }
            onClose={() => setInviteSheetOpen(false)}
          />

          <ScrollView
            style={{ maxHeight: 450 }}
            contentContainerStyle={{ gap: 14, paddingBottom: 14 }}
            showsVerticalScrollIndicator={false}
          >
            <FormField
              label="Campus / Google Email"
              compact
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="e.g., faculty.member@university.edu"
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Promote to Position</Text>
              <View style={styles.rolePickerGrid}>
                {ROLES_ORDER.map((r) => {
                  const active = inviteRole === r;
                  return (
                    <TactilePressable
                      key={r}
                      onPress={() => setInviteRole(r)}
                      scaleTo={0.96}
                      containerStyle={{ width: '48.5%' }}
                      style={[
                        styles.rolePickerBtn,
                        {
                          backgroundColor: active ? theme.primary : theme.surfaceMuted,
                          borderColor: active ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.rolePickerText,
                          { color: active ? theme.primaryFg : theme.text },
                        ]}
                      >
                        {ROLE_PERSONAS[r].label}
                      </Text>
                    </TactilePressable>
                  );
                })}
              </View>
              <Text style={[styles.roleDescHint, { color: theme.textMuted }]}>
                {ROLE_PERSONAS[inviteRole].badgeDescription}
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Hub Scope</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                <TactilePressable
                  onPress={() => setInviteHubId('unassigned')}
                  scaleTo={0.95}
                  style={[
                    styles.scopePickerChip,
                    {
                      backgroundColor:
                        inviteHubId === 'unassigned' ? theme.primary : theme.surfaceMuted,
                      borderColor: inviteHubId === 'unassigned' ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.scopePickerText,
                      { color: inviteHubId === 'unassigned' ? theme.primaryFg : theme.text },
                    ]}
                  >
                    Unassigned
                  </Text>
                </TactilePressable>

                {hubs.map((h) => {
                  const active = inviteHubId === h.id;
                  return (
                    <TactilePressable
                      key={h.id}
                      onPress={() => {
                        setInviteHubId(h.id);
                        const curClub = clubs.find((c) => c.id === inviteClubId);
                        if (curClub && curClub.hubId !== h.id) {
                          setInviteClubId('unassigned');
                        }
                      }}
                      scaleTo={0.95}
                      style={[
                        styles.scopePickerChip,
                        {
                          backgroundColor: active ? theme.primary : theme.surfaceMuted,
                          borderColor: active ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.scopePickerText,
                          { color: active ? theme.primaryFg : theme.text },
                        ]}
                      >
                        {h.name.replace(' Hub', '')}
                      </Text>
                    </TactilePressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Club Scope</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                <TactilePressable
                  onPress={() => setInviteClubId('unassigned')}
                  scaleTo={0.95}
                  style={[
                    styles.scopePickerChip,
                    {
                      backgroundColor:
                        inviteClubId === 'unassigned' ? theme.primary : theme.surfaceMuted,
                      borderColor: inviteClubId === 'unassigned' ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.scopePickerText,
                      { color: inviteClubId === 'unassigned' ? theme.primaryFg : theme.text },
                    ]}
                  >
                    Unassigned
                  </Text>
                </TactilePressable>

                {inviteFilteredClubs.map((c) => {
                  const active = inviteClubId === c.id;
                  return (
                    <TactilePressable
                      key={c.id}
                      onPress={() => {
                        setInviteClubId(c.id);
                        if (inviteHubId === 'unassigned') {
                          setInviteHubId(c.hubId);
                        }
                      }}
                      scaleTo={0.95}
                      style={[
                        styles.scopePickerChip,
                        {
                          backgroundColor: active ? theme.primary : theme.surfaceMuted,
                          borderColor: active ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.scopePickerText,
                          { color: active ? theme.primaryFg : theme.text },
                        ]}
                      >
                        {c.name}
                      </Text>
                    </TactilePressable>
                  );
                })}
              </ScrollView>
            </View>

            <FormField
              label="Optional Note"
              compact
              value={inviteNote}
              onChangeText={setInviteNote}
              placeholder="e.g., Robotics Society Lead (2026)"
            />

            <TactilePressable
              onPress={handleSaveInvite}
              disabled={savingInvite}
              style={[
                styles.submitBtn,
                { backgroundColor: theme.primary, opacity: savingInvite ? 0.6 : 1 },
              ]}
            >
              <Text style={[styles.submitBtnText, { color: theme.primaryFg }]}>
                {savingInvite ? 'Saving...' : 'Promote & Save Position'}
              </Text>
            </TactilePressable>
          </ScrollView>
        </View>
      </SmoothBottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
    paddingBottom: 92,
    gap: 14,
  },
  headerAction: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: RADII.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  headerActionText: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    fontWeight: '700',
  },
  filterRow: {
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    minHeight: 36,
    paddingHorizontal: 13,
    borderRadius: RADII.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    fontWeight: '600',
  },
  searchBox: {
    minHeight: 46,
    borderRadius: RADII.lg,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.ui,
    fontSize: 13,
    height: 42,
    outlineStyle: 'none',
  },
  lookupBtn: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lookupBtnText: {
    fontFamily: FONTS.ui,
    fontSize: 11.5,
    fontWeight: '700',
  },
  infoBanner: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoBannerText: {
    flex: 1,
    fontFamily: FONTS.ui,
    fontSize: 11.5,
    lineHeight: 17,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sectionTitle: {
    fontFamily: FONTS.ui,
    fontSize: 14.5,
    fontWeight: '700',
  },
  sectionHint: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    lineHeight: 17,
  },
  inlineAddBtn: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  inlineAddText: {
    fontFamily: FONTS.ui,
    fontSize: 12.5,
    fontWeight: '700',
  },
  userCard: {
    borderRadius: RADII.xl,
    borderWidth: 1,
    padding: 13,
    gap: 8,
  },
  userTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontFamily: FONTS.ui,
    fontSize: 14.5,
    fontWeight: '700',
  },
  selfTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADII.sm,
  },
  selfTagText: {
    fontFamily: FONTS.ui,
    fontSize: 10,
    fontWeight: '700',
  },
  userEmail: {
    fontFamily: FONTS.ui,
    fontSize: 12,
  },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    borderWidth: 1,
  },
  rolePillText: {
    fontFamily: FONTS.ui,
    fontSize: 11,
    fontWeight: '700',
  },
  scopeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  scopeMeta: {
    fontFamily: FONTS.ui,
    fontSize: 11.5,
    marginRight: 4,
  },
  scopeChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.sm,
  },
  scopeChipText: {
    fontFamily: FONTS.ui,
    fontSize: 11,
    fontWeight: '600',
  },
  emptyInviteBox: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  emptyInviteText: {
    fontFamily: FONTS.ui,
    fontSize: 12.5,
  },
  inviteCard: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inviteNote: {
    fontFamily: FONTS.ui,
    fontSize: 11,
    fontStyle: 'italic',
  },
  revokeBtn: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: RADII.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revokeBtnText: {
    fontFamily: FONTS.ui,
    fontSize: 11.5,
    fontWeight: '700',
  },
  sheet: {
    borderTopLeftRadius: RADII.xxl,
    borderTopRightRadius: RADII.xxl,
    borderTopWidth: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: 12,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    fontWeight: '600',
  },
  rolePickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rolePickerBtn: {
    width: '100%',
    minHeight: TOUCH_TARGET,
    borderRadius: RADII.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  rolePickerText: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    fontWeight: '700',
  },
  roleDescHint: {
    fontFamily: FONTS.ui,
    fontSize: 11.5,
    lineHeight: 16,
  },
  scopePickerChip: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: RADII.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopePickerText: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    fontWeight: '600',
  },
  twoColInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  submitBtn: {
    minHeight: 48,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    fontFamily: FONTS.ui,
    fontSize: 14,
    fontWeight: '700',
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});
