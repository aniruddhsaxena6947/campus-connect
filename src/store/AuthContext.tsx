
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  INITIAL_ACCOUNTS,
  INITIAL_PROFILE,
  LEGACY_SEEDED_DUMMY_IDS,
  ROLE_PERSONAS,
} from '../data/mockCampusData';
import { localAuthRepository } from '../services/api/localCampusService';
import { AuthResult, PasswordResetRequestResult, SignUpInput } from '../services/api/types';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import {
  auth,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  googleProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile as updateFirebaseProfile,
} from '../services/firebase/firebaseApp';
import {
  ensureUserFirestoreProfile,
  isBootstrappedAdminEmail,
  subscribeUserPublicProfile,
  updateUserFirestoreProfile,
} from '../services/firebase/firestoreCampusService';
import {
  readStorageJson,
  removeStorageKey,
  STORAGE_KEYS,
  webStorageAdapter,
  writeStorageJson,
} from '../services/storage/storageAdapter';
import { CampusAccount, UserProfile, UserRole } from '../types/collegeConnect';
import { useNavigation } from './NavigationContext';
import { useUIState } from './UIContext';

export interface PersistedAuthState {
  profile: UserProfile;
  role: UserRole;
  onboardingComplete: boolean;
  accounts: CampusAccount[];
  isAuthenticated: boolean;
}

export function loadInitialAuthState(): PersistedAuthState {
  const saved =
    readStorageJson<PersistedAuthState>(STORAGE_KEYS.auth) ??
    readStorageJson<PersistedAuthState>(STORAGE_KEYS.legacyMonolith);

  const legacyEmails = new Set<string>(LEGACY_SEEDED_DUMMY_IDS.accountEmails);
  const legacyIds = new Set<string>(LEGACY_SEEDED_DUMMY_IDS.accountIds);
  const savedEmail = saved?.profile?.email?.toLowerCase() ?? '';
  const isLegacyDemoUser = legacyEmails.has(savedEmail);

  const filteredAccounts = (saved?.accounts ?? []).filter(
    (acc) => !legacyIds.has(acc.id) && !legacyEmails.has(acc.email.toLowerCase())
  );

  if (isLegacyDemoUser) {
    removeStorageKey(STORAGE_KEYS.legacyMonolith);
    removeStorageKey(STORAGE_KEYS.auth);
  }
  webStorageAdapter.setItem(STORAGE_KEYS.freshWorkspaceV1, '1');

  const resolvedProfile = !isLegacyDemoUser && saved?.profile ? saved.profile : INITIAL_PROFILE;
  const baseAccounts = filteredAccounts.length > 0 ? filteredAccounts : INITIAL_ACCOUNTS;
  const resolvedAccounts = baseAccounts.map((acc) =>
    isBootstrappedAdminEmail(acc.email) && acc.role !== 'super_admin'
      ? {
        ...acc,
        role: 'super_admin' as UserRole,
        program: 'University Administration',
        year: 'Super Admin',
      }
      : acc
  );
  const resolvedRole: UserRole = isBootstrappedAdminEmail(resolvedProfile.email)
    ? 'super_admin'
    : !isLegacyDemoUser && saved?.role
      ? saved.role
      : 'student';

  return {
    profile: resolvedProfile,
    role: resolvedRole,
    onboardingComplete: !isLegacyDemoUser && Boolean(saved?.onboardingComplete),
    accounts: resolvedAccounts,
    isAuthenticated: !isLegacyDemoUser && Boolean(saved?.isAuthenticated),
  };
}

interface AuthContextValue {
  accounts: CampusAccount[];
  profile: UserProfile;
  role: UserRole;
  roleMeta: (typeof ROLE_PERSONAS)[UserRole];
  isAuthenticated: boolean;
  onboardingComplete: boolean;
  authPrefillEmail: string;
  firebaseUid: string | null;
  firebaseEmail: string | null;
  firebaseAuthReady: boolean;
  authBusy: boolean;
  canSwitchRole: boolean;
  setAuthPrefillEmail: (email: string) => void;
  setRole: (role: UserRole) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  updateLocalAccountRole: (
    accountId: string,
    patch: {
      role: UserRole;
      assignedHubId: string;
      assignedClubId: string;
      program?: string;
      year?: string;
    }
  ) => void;
  addOrPromoteLocalAccount: (input: {
    email: string;
    name?: string;
    role: UserRole;
    assignedHubId: string;
    assignedClubId: string;
    program?: string;
    year?: string;
  }) => { created: boolean; account: CampusAccount };
  completeOnboarding: () => void;
  replayOnboarding: () => void;
  openPublishSheet: () => void;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signUp: (input: SignUpInput) => Promise<AuthResult>;
  requestPasswordReset: (email: string) => Promise<PasswordResetRequestResult>;
  resetPassword: (email: string, code: string, newPassword: string) => AuthResult;
  signOut: () => void;
  resetAuthState: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{
  initialAuth: PersistedAuthState;
  children: React.ReactNode;
}> = ({ initialAuth, children }) => {
  const { resetNavigation } = useNavigation();
  const { showFeedback, publishSheetOpen, setPublishSheetOpen } = useUIState();

  const [accounts, setAccounts] = useState<CampusAccount[]>(initialAuth.accounts);
  const [profile, setProfile] = useState<UserProfile>(initialAuth.profile);
  const [role, setRoleState] = useState<UserRole>(initialAuth.role);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean>(
    initialAuth.onboardingComplete
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialAuth.isAuthenticated);
  const [authPrefillEmail, setAuthPrefillEmail] = useState<string>(initialAuth.profile.email);
  const [pendingResetCodes, setPendingResetCodes] = useState<Record<string, string>>({});

  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
  const [firebaseEmail, setFirebaseEmail] = useState<string | null>(null);
  const [firebaseAuthReady, setFirebaseAuthReady] = useState<boolean>(false);
  const [authBusy, setAuthBusy] = useState<boolean>(false);
  const [authFatalError, setAuthFatalError] = useState<Error | null>(null);

  if (authFatalError) {
    throw authFatalError;
  }

  const authRef = useRef({
    accounts,
    isAuthenticated,
    pendingResetCodes,
    publishSheetOpen,
    role,
    firebaseUid,
    firebaseEmail,
  });

  useEffect(() => {
    authRef.current = {
      accounts,
      isAuthenticated,
      pendingResetCodes,
      publishSheetOpen,
      role,
      firebaseUid,
      firebaseEmail,
    };
  });

  useEffect(() => {
    let active = true;
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser) {
        if (!active) return;
        setFirebaseUid(null);
        setFirebaseEmail(null);
        setFirebaseAuthReady(true);
        return;
      }

      setFirebaseAuthReady(false);
      void ensureUserFirestoreProfile(fbUser)
        .then((resolved) => {
          if (!active) return;
          setProfile(resolved.profile);
          setRoleState(resolved.role);
          setFirebaseUid(fbUser.uid);
          setFirebaseEmail(fbUser.email ?? null);
          setIsAuthenticated(true);
          setOnboardingComplete(true);
          setAuthPrefillEmail(resolved.profile.email);
          setFirebaseAuthReady(true);
        })
        .catch((err) => {
          if (!active) return;
          setFirebaseAuthReady(true);
          setAuthFatalError(err instanceof Error ? err : new Error(String(err)));
        });
    });
    return () => {
      active = false;
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!firebaseAuthReady || !firebaseUid) return;
    const unsub = subscribeUserPublicProfile(firebaseUid, firebaseEmail, (livePatch) => {
      setRoleState((prevRole) => {
        if (prevRole !== livePatch.role) {
          showFeedback(
            'info',
            `Role Updated: ${ROLE_PERSONAS[livePatch.role].label}`,
            ROLE_PERSONAS[livePatch.role].badgeDescription
          );
        }
        return livePatch.role;
      });
      setProfile((prev) => ({
        ...prev,
        name: livePatch.name ?? prev.name,
        program: livePatch.program ?? prev.program,
        year: livePatch.year ?? prev.year,
        assignedHubId: livePatch.assignedHubId,
        assignedClubId: livePatch.assignedClubId,
      }));
    });
    return () => unsub();
  }, [firebaseAuthReady, firebaseUid, firebaseEmail, showFeedback]);

  useEffect(() => {
    const timer = setTimeout(() => {
      writeStorageJson<PersistedAuthState>(STORAGE_KEYS.auth, {
        profile,
        role,
        onboardingComplete,
        accounts,
        isAuthenticated,
      });
    }, 220);
    return () => clearTimeout(timer);
  }, [profile, role, onboardingComplete, accounts, isAuthenticated]);

  const setRole = useCallback(
    (nextRole: UserRole) => {
      if (authRef.current.firebaseUid && !isBootstrappedAdminEmail(authRef.current.firebaseEmail)) {
        showFeedback(
          'info',
          'Database-Enforced Role',
          'Your signed-in role is managed in Firestore by your Super Admin.'
        );
        return;
      }

      setRoleState(nextRole);
      const persona = ROLE_PERSONAS[nextRole];
      if (!authRef.current.firebaseUid) {
        setProfile((prev) => ({
          ...prev,
          name:
            prev.name &&
              prev.name !== INITIAL_PROFILE.name &&
              !Object.values(ROLE_PERSONAS).some((p) => p.defaultName === prev.name)
              ? prev.name
              : persona.defaultName,
          program: persona.defaultProgram,
          year: persona.defaultYear,
        }));
      }
      if (!persona.canPublishEvents && authRef.current.publishSheetOpen) {
        setPublishSheetOpen(false);
      }
      showFeedback('info', `Role: ${persona.label}`, persona.badgeDescription);
    },
    [setPublishSheetOpen, showFeedback]
  );

  const updateProfile = useCallback(
    (patch: Partial<UserProfile>) => {
      setProfile((prev) => ({ ...prev, ...patch }));
      const uid = authRef.current.firebaseUid;
      if (uid) {
        void updateUserFirestoreProfile(uid, patch).catch((err) => {
          setAuthFatalError(err instanceof Error ? err : new Error(String(err)));
        });
      }
      showFeedback('success', 'Profile Updated', 'Your campus profile details were saved.');
    },
    [showFeedback]
  );

  const updateLocalAccountRole = useCallback(
    (
      accountId: string,
      patch: {
        role: UserRole;
        assignedHubId: string;
        assignedClubId: string;
        program?: string;
        year?: string;
      }
    ) => {
      let updatedEmail = '';
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id !== accountId) return acc;
          updatedEmail = acc.email;
          return {
            ...acc,
            role: patch.role,
            assignedHubId: patch.assignedHubId,
            assignedClubId: patch.assignedClubId,
            program: patch.program ?? acc.program,
            year: patch.year ?? acc.year,
          };
        })
      );
      if (updatedEmail && updatedEmail.toLowerCase() === profile.email.toLowerCase()) {
        setRoleState(patch.role);
        setProfile((prev) => ({
          ...prev,
          assignedHubId: patch.assignedHubId,
          assignedClubId: patch.assignedClubId,
          program: patch.program ?? prev.program,
          year: patch.year ?? prev.year,
        }));
      }
    },
    [profile.email]
  );

  const addOrPromoteLocalAccount = useCallback(
    (input: {
      email: string;
      name?: string;
      role: UserRole;
      assignedHubId: string;
      assignedClubId: string;
      program?: string;
      year?: string;
    }): { created: boolean; account: CampusAccount } => {
      const cleanEmail = input.email.trim().toLowerCase();
      const persona = ROLE_PERSONAS[input.role];
      const existing = authRef.current.accounts.find(
        (acc) => acc.email.toLowerCase() === cleanEmail
      );

      if (existing) {
        const updated: CampusAccount = {
          ...existing,
          role: input.role,
          assignedHubId: input.assignedHubId || 'unassigned',
          assignedClubId: input.assignedClubId || 'unassigned',
          program: input.program?.trim() || existing.program || persona.defaultProgram,
          year: input.year?.trim() || persona.defaultYear,
        };
        setAccounts((prev) => prev.map((acc) => (acc.id === existing.id ? updated : acc)));
        if (cleanEmail === profile.email.toLowerCase()) {
          setRoleState(updated.role);
          setProfile((prev) => ({
            ...prev,
            assignedHubId: updated.assignedHubId,
            assignedClubId: updated.assignedClubId ?? 'unassigned',
            program: updated.program,
            year: updated.year,
          }));
        }
        return { created: false, account: updated };
      }

      const rawPrefix = cleanEmail.split('@')[0] || 'Campus Member';
      const formattedName =
        input.name?.trim() ||
        rawPrefix
          .split(/[._-]+/)
          .filter(Boolean)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ') ||
        persona.defaultName;

      const created: CampusAccount = {
        id: `acc-${Date.now()}`,
        name: formattedName,
        email: cleanEmail,
        password: Math.random().toString(36).slice(2, 12),
        role: input.role,
        program: input.program?.trim() || persona.defaultProgram,
        year: input.year?.trim() || persona.defaultYear,
        studentId: `CC-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 8999))}`,
        assignedHubId: input.assignedHubId || 'unassigned',
        assignedClubId: input.assignedClubId || 'unassigned',
      };

      setAccounts((prev) => [created, ...prev]);
      if (cleanEmail === profile.email.toLowerCase()) {
        setRoleState(created.role);
        setProfile((prev) => ({
          ...prev,
          name: created.name,
          assignedHubId: created.assignedHubId,
          assignedClubId: created.assignedClubId ?? 'unassigned',
          program: created.program,
          year: created.year,
        }));
      }
      return { created: true, account: created };
    },
    [profile.email]
  );

  const completeOnboarding = useCallback(() => {
    setOnboardingComplete(true);
    resetNavigation(authRef.current.isAuthenticated ? 'home' : 'login', 'forward');
  }, [resetNavigation]);

  const replayOnboarding = useCallback(() => {
    setOnboardingComplete(false);
    resetNavigation('welcome', 'back');
  }, [resetNavigation]);

  const openPublishSheet = useCallback(() => {
    const meta = ROLE_PERSONAS[authRef.current.role];
    if (!meta.canPublishEvents && !meta.canPublishAnnouncements) {
      showFeedback(
        'error',
        'Permission Restricted',
        'Only Faculty, Club In-charge, Hub Head, or Super Admin can publish official campus information.'
      );
      return;
    }
    setPublishSheetOpen(true);
  }, [setPublishSheetOpen, showFeedback]);

  const signIn = useCallback(
    async (emailRaw: string, password: string): Promise<AuthResult> => {
      const email = emailRaw.trim().toLowerCase();
      if (!email || !email.includes('@')) {
        return { ok: false, error: 'Enter a valid university email address.' };
      }
      if (!password) {
        return { ok: false, error: 'Enter your campus account password.' };
      }
      setAuthBusy(true);
      try {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = credential.user;
        const resolved = await ensureUserFirestoreProfile(fbUser);
        setFirebaseUid(fbUser.uid);
        setFirebaseEmail(fbUser.email ?? null);
        setRoleState(resolved.role);
        setProfile(resolved.profile);
        setIsAuthenticated(true);
        setOnboardingComplete(true);
        setAuthPrefillEmail(resolved.profile.email);
        resetNavigation('home', 'forward');
        showFeedback(
          'success',
          `Welcome, ${resolved.profile.name.split(' ')[0]}`,
          `Signed in as ${ROLE_PERSONAS[resolved.role].label}.`
        );
        return { ok: true };
      } catch (err: unknown) {
        const code =
          typeof err === 'object' && err !== null && 'code' in err
            ? String((err as { code?: unknown }).code)
            : '';
        if (
          code === 'auth/invalid-credential' ||
          code === 'auth/user-not-found' ||
          code === 'auth/wrong-password'
        ) {
          return {
            ok: false,
            error: 'Invalid email or password. Check your credentials or create an account.',
          };
        }
        if (code === 'auth/invalid-email') {
          return { ok: false, error: 'Enter a valid email address.' };
        }
        if (code === 'auth/too-many-requests') {
          return { ok: false, error: 'Too many failed attempts. Try again in a few minutes.' };
        }
        return {
          ok: false,
          error: err instanceof Error ? err.message : 'Unable to sign in right now.',
        };
      } finally {
        setAuthBusy(false);
      }
    },
    [resetNavigation, showFeedback]
  );

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    setAuthBusy(true);
    try {
      let fbUser;
      if (Capacitor.isNativePlatform()) {
        const nativeResult = await FirebaseAuthentication.signInWithGoogle();
        const idToken = nativeResult.credential?.idToken;
        if (!idToken) {
          return {
            ok: false,
            error: 'Google Sign-In did not return an ID token. Verify Firebase Android SHA-1 setup.',
          };
        }
        const credential = await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
        fbUser = credential.user;
      } else {
        const credential = await signInWithPopup(auth, googleProvider);
        fbUser = credential.user;
      }
      const resolved = await ensureUserFirestoreProfile(fbUser);
      setFirebaseUid(fbUser.uid);
      setFirebaseEmail(fbUser.email ?? null);
      setRoleState(resolved.role);
      setProfile(resolved.profile);
      setIsAuthenticated(true);
      setOnboardingComplete(true);
      setAuthPrefillEmail(resolved.profile.email);
      resetNavigation('home', 'forward');
      showFeedback(
        'success',
        `Welcome, ${resolved.profile.name.split(' ')[0]}`,
        `Connected via Google (${ROLE_PERSONAS[resolved.role].label}).`
      );
      return { ok: true };
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return { ok: false, error: 'Google sign-in popup was closed before completing.' };
      }
      const rawMessage =
        err instanceof Error ? err.message : 'Unable to sign in with Google right now.';
      if (
        rawMessage.includes('10:') ||
        rawMessage.toLowerCase().includes('developer_error') ||
        rawMessage.toLowerCase().includes('no credentials available')
      ) {
        return {
          ok: false,
          error:
            'Android Google Sign-In requires registering package com.collegeconnect.app and its SHA-1 fingerprint in Firebase Console.',
        };
      }
      return { ok: false, error: rawMessage };
    } finally {
      setAuthBusy(false);
    }
  }, [resetNavigation, showFeedback]);

  const signUp = useCallback(
    async (input: SignUpInput): Promise<AuthResult> => {
      const name = input.name.trim();
      const cleanEmail = input.email.trim().toLowerCase();
      const program = input.program.trim() || 'BCA';
      const year = input.year.trim() || '1st Year';

      if (name.length < 2) {
        return { ok: false, error: 'Enter your full name.' };
      }
      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return { ok: false, error: 'Enter a valid campus email address.' };
      }
      if (input.password.length < 6) {
        return { ok: false, error: 'Password must be at least 6 characters.' };
      }

      setAuthBusy(true);
      try {
        const credential = await createUserWithEmailAndPassword(auth, cleanEmail, input.password);
        const fbUser = credential.user;
        await updateFirebaseProfile(fbUser, { displayName: name });
        const resolved = await ensureUserFirestoreProfile(fbUser);
        const mergedProfile: UserProfile = {
          ...resolved.profile,
          name,
          program,
          year,
          studentId: input.studentId?.trim() || resolved.profile.studentId,
        };
        await updateUserFirestoreProfile(fbUser.uid, { name, program, year });
        setFirebaseUid(fbUser.uid);
        setFirebaseEmail(fbUser.email ?? null);
        setRoleState(resolved.role);
        setProfile(mergedProfile);
        setIsAuthenticated(true);
        setOnboardingComplete(true);
        setAuthPrefillEmail(cleanEmail);
        resetNavigation('home', 'forward');
        showFeedback(
          'success',
          'Account Created',
          `Welcome to CollegeConnect, ${name.split(' ')[0]}!`
        );
        return { ok: true };
      } catch (err: unknown) {
        const code =
          typeof err === 'object' && err !== null && 'code' in err
            ? String((err as { code?: unknown }).code)
            : '';
        if (code === 'auth/email-already-in-use') {
          return {
            ok: false,
            error: 'An account with this email already exists. Try signing in.',
          };
        }
        if (code === 'auth/weak-password') {
          return { ok: false, error: 'Password must be at least 6 characters.' };
        }
        if (code === 'auth/invalid-email') {
          return { ok: false, error: 'Enter a valid email address.' };
        }
        return {
          ok: false,
          error: err instanceof Error ? err.message : 'Unable to create account right now.',
        };
      } finally {
        setAuthBusy(false);
      }
    },
    [resetNavigation, showFeedback]
  );

  const requestPasswordReset = useCallback(
    async (emailRaw: string): Promise<PasswordResetRequestResult> => {
      const email = emailRaw.trim().toLowerCase();
      if (!email || !email.includes('@')) {
        return { ok: false, error: 'Enter a valid university email address.' };
      }
      setAuthBusy(true);
      try {
        await sendPasswordResetEmail(auth, email);
        showFeedback(
          'success',
          'Reset Email Sent',
          `Check ${email} for your Firebase password reset link.`
        );
        return { ok: true };
      } catch (err: unknown) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : 'Could not send password reset email.',
        };
      } finally {
        setAuthBusy(false);
      }
    },
    [showFeedback]
  );

  const resetPassword = useCallback(
    (emailRaw: string, codeRaw: string, newPassword: string): AuthResult => {
      const result = localAuthRepository.applyPasswordReset(
        authRef.current.accounts,
        authRef.current.pendingResetCodes,
        emailRaw,
        codeRaw,
        newPassword
      );
      if (!result.ok) {
        return { ok: false, error: result.error };
      }

      setAccounts(result.updatedAccounts);
      setPendingResetCodes((prev) => {
        const next = { ...prev };
        delete next[result.email];
        return next;
      });
      setAuthPrefillEmail(result.email);
      showFeedback('success', 'Password Updated', 'Sign in with your new campus password.');
      return { ok: true };
    },
    [showFeedback]
  );

  const signOut = useCallback(() => {
    if (authRef.current.firebaseUid) {
      void firebaseSignOut(auth).catch(() => { });
    }
    if (Capacitor.isNativePlatform()) {
      void FirebaseAuthentication.signOut().catch(() => { });
    }
    setFirebaseUid(null);
    setFirebaseEmail(null);
    setIsAuthenticated(false);
    setPublishSheetOpen(false);
    resetNavigation('login', 'back');
    showFeedback('info', 'Signed Out', 'You have signed out of CollegeConnect.');
  }, [resetNavigation, setPublishSheetOpen, showFeedback]);

  const resetAuthState = useCallback(() => {
    removeStorageKey(STORAGE_KEYS.auth);
    setProfile(INITIAL_PROFILE);
    setRoleState('student');
    setAccounts(INITIAL_ACCOUNTS);
    setIsAuthenticated(false);
    setPendingResetCodes({});
  }, []);

  const canSwitchRole = !firebaseUid || isBootstrappedAdminEmail(firebaseEmail);

  const value = useMemo<AuthContextValue>(
    () => ({
      accounts,
      profile,
      role,
      roleMeta: ROLE_PERSONAS[role],
      isAuthenticated,
      onboardingComplete,
      authPrefillEmail,
      firebaseUid,
      firebaseEmail,
      firebaseAuthReady,
      authBusy,
      canSwitchRole,
      setAuthPrefillEmail,
      setRole,
      updateProfile,
      updateLocalAccountRole,
      addOrPromoteLocalAccount,
      completeOnboarding,
      replayOnboarding,
      openPublishSheet,
      signIn,
      signInWithGoogle,
      signUp,
      requestPasswordReset,
      resetPassword,
      signOut,
      resetAuthState,
    }),
    [
      accounts,
      profile,
      role,
      isAuthenticated,
      onboardingComplete,
      authPrefillEmail,
      firebaseUid,
      firebaseEmail,
      firebaseAuthReady,
      authBusy,
      canSwitchRole,
      setRole,
      updateProfile,
      updateLocalAccountRole,
      addOrPromoteLocalAccount,
      completeOnboarding,
      replayOnboarding,
      openPublishSheet,
      signIn,
      signInWithGoogle,
      signUp,
      requestPasswordReset,
      resetPassword,
      signOut,
      resetAuthState,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
