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
  INITIAL_ANNOUNCEMENTS,
  INITIAL_CLUBS,
  INITIAL_EVENTS,
  INITIAL_HUBS,
  INITIAL_NOTIFICATIONS,
  LEGACY_SEEDED_DUMMY_IDS,
  ROLE_PERSONAS,
} from '../data/mockCampusData';
import {
  computeVisibleEvents,
  createAnnouncementRecord,
  createClubRecord,
  createEventRecord,
  createHubRecord,
} from '../services/api/localCampusService';
import {
  NewAnnouncementInput,
  NewClubInput,
  NewEventInput,
  NewHubInput,
} from '../services/api/types';
import {
  readStorageJson,
  removeStorageKey,
  STORAGE_KEYS,
  writeStorageJson,
} from '../services/storage/storageAdapter';
import {
  approveSupabaseEvent,
  createSupabaseClub,
  createSupabaseHub,
  markAllSupabaseNotificationsRead,
  markSupabaseAnnouncementRead,
  markSupabaseNotificationRead,
  publishSupabaseAnnouncement,
  publishSupabaseEvent,
  rejectSupabaseEvent,
  subscribeSupabaseCampusCatalog,
  toggleSupabaseAnnouncementSaved,
  toggleSupabaseClubMembership,
  toggleSupabaseEventRegistration,
  toggleSupabaseEventSaved,
} from '../services/supabase/supabaseCampusService';
import type {
  CampusCatalogAnnouncement,
  CampusCatalogClub,
  CampusCatalogEvent,
  CampusCatalogPayload,
} from '../services/supabase/supabaseMappers';
import {
  AppNotification,
  CampusClub,
  CampusEvent,
  CampusHub,
  OfficialAnnouncement,
} from '../types/collegeConnect';
import { useAuth } from './AuthContext';
import { useNavigation } from './NavigationContext';
import { useUIState } from './UIContext';

export interface PersistedCampusData {
  events: CampusEvent[];
  announcements: OfficialAnnouncement[];
  clubs: CampusClub[];
  hubs: CampusHub[];
  notifications: AppNotification[];
}

export function loadInitialCampusData(): PersistedCampusData {
  const saved =
    readStorageJson<PersistedCampusData>(STORAGE_KEYS.campusData) ??
    readStorageJson<PersistedCampusData>(STORAGE_KEYS.legacyMonolith);

  const legacyHubIds = new Set<string>(LEGACY_SEEDED_DUMMY_IDS.hubs);
  const legacyClubIds = new Set<string>(LEGACY_SEEDED_DUMMY_IDS.clubs);
  const legacyEventIds = new Set<string>(LEGACY_SEEDED_DUMMY_IDS.events);
  const legacyAnnouncementIds = new Set<string>(LEGACY_SEEDED_DUMMY_IDS.announcements);
  const legacyNotificationIds = new Set<string>(LEGACY_SEEDED_DUMMY_IDS.notifications);

  return {
    events: (saved?.events ?? INITIAL_EVENTS).filter((e) => !legacyEventIds.has(e.id)),
    announcements: (saved?.announcements ?? INITIAL_ANNOUNCEMENTS).filter(
      (a) => !legacyAnnouncementIds.has(a.id)
    ),
    clubs: (saved?.clubs ?? INITIAL_CLUBS).filter((c) => !legacyClubIds.has(c.id)),
    hubs: (saved?.hubs ?? INITIAL_HUBS).filter((h) => !legacyHubIds.has(h.id)),
    notifications: (saved?.notifications ?? INITIAL_NOTIFICATIONS).filter(
      (n) => !legacyNotificationIds.has(n.id)
    ),
  };
}

interface CampusDataContextValue {
  events: CampusEvent[];
  visibleEvents: CampusEvent[];
  pendingEvents: CampusEvent[];
  selectedEvent: CampusEvent | undefined;
  announcements: OfficialAnnouncement[];
  clubs: CampusClub[];
  hubs: CampusHub[];
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  isSupabaseSynced: boolean;
  isFirestoreSynced: boolean;
  refreshCampusData: () => Promise<void>;
  toggleEventRegistration: (eventId: string) => void;
  toggleEventSaved: (eventId: string) => void;
  toggleAnnouncementSaved: (announcementId: string) => void;
  markAnnouncementRead: (announcementId: string) => void;
  toggleClubMembership: (clubId: string) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  approveEvent: (eventId: string) => void;
  rejectEvent: (eventId: string) => void;
  createHub: (input: NewHubInput) => Promise<{ ok: boolean; error?: string }>;
  createClub: (input: NewClubInput) => Promise<{ ok: boolean; error?: string }>;
  publishEvent: (input: NewEventInput) => Promise<{ ok: boolean; error?: string }>;
  publishAnnouncement: (input: NewAnnouncementInput) => Promise<{ ok: boolean; error?: string }>;
  resetDemoData: () => void;
}

const CampusDataContext = createContext<CampusDataContextValue | null>(null);

export const CampusDataProvider: React.FC<{
  initialData: PersistedCampusData;
  children: React.ReactNode;
}> = ({ initialData, children }) => {
  const { role, profile, firebaseUid, firebaseAuthReady, resetAuthState } = useAuth();
  const { selectedEventId, navigate } = useNavigation();
  const { showFeedback, setPublishSheetOpen, setUIStateMode } = useUIState();

  const [events, setEvents] = useState<CampusEvent[]>(initialData.events);
  const [announcements, setAnnouncements] = useState<OfficialAnnouncement[]>(
    initialData.announcements
  );
  const [clubs, setClubs] = useState<CampusClub[]>(initialData.clubs);
  const [hubs, setHubs] = useState<CampusHub[]>(initialData.hubs);
  const [notifications, setNotifications] = useState<AppNotification[]>(initialData.notifications);

  // Live Supabase states
  const [supabaseReady, setSupabaseReady] = useState<boolean>(false);
  const [liveHubs, setLiveHubs] = useState<CampusHub[] | null>(null);
  const [liveClubs, setLiveClubs] = useState<CampusCatalogClub[] | null>(null);
  const [liveEvents, setLiveEvents] = useState<CampusCatalogEvent[] | null>(null);
  const [liveAnnouncements, setLiveAnnouncements] = useState<CampusCatalogAnnouncement[] | null>(
    null
  );
  const [liveRegIds, setLiveRegIds] = useState<Set<string>>(new Set());
  const [liveSavedEventIds, setLiveSavedEventIds] = useState<Set<string>>(new Set());
  const [liveSavedAnnIds, setLiveSavedAnnIds] = useState<Set<string>>(new Set());
  const [liveReadAnnIds, setLiveReadAnnIds] = useState<Set<string>>(new Set());
  const [liveClubIds, setLiveClubIds] = useState<Set<string>>(new Set());
  const [liveNotifications, setLiveNotifications] = useState<AppNotification[] | null>(null);

  const refreshRef = useRef<(() => Promise<void>) | null>(null);
  const syncWarningShownRef = useRef(false);

  const [prevFirebaseUid, setPrevFirebaseUid] = useState<string | null>(firebaseUid);
  if (firebaseUid !== prevFirebaseUid) {
    setPrevFirebaseUid(firebaseUid);
    if (!firebaseUid) {
      setLiveRegIds(new Set());
      setLiveSavedEventIds(new Set());
      setLiveSavedAnnIds(new Set());
      setLiveReadAnnIds(new Set());
      setLiveClubIds(new Set());
      setLiveNotifications(null);
    }
  }

  useEffect(() => {
    if (!firebaseAuthReady) return;

    const sub = subscribeSupabaseCampusCatalog(
      (payload: CampusCatalogPayload) => {
        syncWarningShownRef.current = false;
        const ready = Boolean(payload.configured && payload.schemaReady);
        setSupabaseReady(ready);
        if (!ready) {
          setLiveHubs(null);
          setLiveClubs(null);
          setLiveEvents(null);
          setLiveAnnouncements(null);
          setLiveNotifications(null);
          return;
        }
        setLiveHubs(payload.hubs);
        setLiveClubs(payload.clubs);
        setLiveEvents(payload.events);
        setLiveAnnouncements(payload.announcements);
        setLiveRegIds(new Set(payload.registrations));
        setLiveSavedEventIds(new Set(payload.savedEvents));
        setLiveSavedAnnIds(new Set(payload.savedAnnouncements));
        setLiveReadAnnIds(new Set(payload.readAnnouncements));
        setLiveClubIds(new Set(payload.clubMemberships));
        setLiveNotifications(firebaseUid ? payload.notifications : null);
      },
      (err) => {
        console.warn('Supabase campus sync warning:', err.message);
        if (!syncWarningShownRef.current) {
          syncWarningShownRef.current = true;
          showFeedback(
            'info',
            'Connecting to Campus Server',
            `Live sync will retry automatically (${err.message}).`
          );
        }
      }
    );

    refreshRef.current = sub.refresh;
    return () => {
      refreshRef.current = null;
      sub.unsubscribe();
    };
  }, [firebaseAuthReady, firebaseUid, showFeedback]);

  const refreshCampusData = useCallback(async () => {
    await refreshRef.current?.();
  }, []);

  const isSupabaseCatalogActive = Boolean(supabaseReady && liveEvents !== null);
  const isUserSupabaseSynced = Boolean(firebaseUid && isSupabaseCatalogActive);

  const mergedHubs = useMemo(
    () => (isSupabaseCatalogActive && liveHubs !== null ? liveHubs : hubs),
    [isSupabaseCatalogActive, liveHubs, hubs]
  );

  const mergedClubs = useMemo<CampusClub[]>(() => {
    if (isSupabaseCatalogActive && liveClubs !== null) {
      return liveClubs.map((c) => ({ ...c, isJoined: liveClubIds.has(c.id) }));
    }
    return clubs;
  }, [isSupabaseCatalogActive, liveClubs, liveClubIds, clubs]);

  const mergedEvents = useMemo<CampusEvent[]>(() => {
    if (isSupabaseCatalogActive && liveEvents !== null) {
      return liveEvents.map((e) => ({
        ...e,
        isRegistered: liveRegIds.has(e.id),
        isSaved: liveSavedEventIds.has(e.id),
      }));
    }
    return events;
  }, [isSupabaseCatalogActive, liveEvents, liveRegIds, liveSavedEventIds, events]);

  const mergedAnnouncements = useMemo<OfficialAnnouncement[]>(() => {
    if (isSupabaseCatalogActive && liveAnnouncements !== null) {
      return liveAnnouncements.map((a) => ({
        ...a,
        isRead: liveReadAnnIds.has(a.id),
        isSaved: liveSavedAnnIds.has(a.id),
      }));
    }
    return announcements;
  }, [isSupabaseCatalogActive, liveAnnouncements, liveReadAnnIds, liveSavedAnnIds, announcements]);

  const mergedNotifications = useMemo<AppNotification[]>(() => {
    if (isUserSupabaseSynced && liveNotifications !== null) {
      return liveNotifications;
    }
    return notifications;
  }, [isUserSupabaseSynced, liveNotifications, notifications]);

  const dataRef = useRef({
    events: mergedEvents,
    announcements: mergedAnnouncements,
    clubs: mergedClubs,
    hubs: mergedHubs,
    notifications: mergedNotifications,
    role,
    profile,
    firebaseUid,
    isUserSupabaseSynced,
  });

  useEffect(() => {
    dataRef.current = {
      events: mergedEvents,
      announcements: mergedAnnouncements,
      clubs: mergedClubs,
      hubs: mergedHubs,
      notifications: mergedNotifications,
      role,
      profile,
      firebaseUid,
      isUserSupabaseSynced,
    };
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      writeStorageJson<PersistedCampusData>(STORAGE_KEYS.campusData, {
        events,
        announcements,
        clubs,
        hubs,
        notifications,
      });
    }, 220);
    return () => clearTimeout(timer);
  }, [events, announcements, clubs, hubs, notifications]);

  const handleMutationError = useCallback(
    (title: string, err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unable to sync change to Supabase.';
      showFeedback('error', title, message);
      void refreshRef.current?.();
    },
    [showFeedback]
  );

  const toggleEventRegistration = useCallback(
    (eventId: string) => {
      const target = dataRef.current.events.find((e) => e.id === eventId);
      if (!target) return;
      const nextRegistered = !target.isRegistered;

      if (dataRef.current.firebaseUid) {
        setLiveRegIds((prev) => {
          const next = new Set(prev);
          if (nextRegistered) next.add(eventId);
          else next.delete(eventId);
          return next;
        });
        setLiveEvents((prev) =>
          prev
            ? prev.map((e) =>
                e.id === eventId
                  ? {
                      ...e,
                      attendeeCount: Math.max(
                        0,
                        Math.min(e.capacity, e.attendeeCount + (nextRegistered ? 1 : -1))
                      ),
                    }
                  : e
              )
            : prev
        );
        void toggleSupabaseEventRegistration(eventId, nextRegistered)
          .then(() => refreshRef.current?.())
          .catch((err) => handleMutationError('Registration Sync Failed', err));
      } else {
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  isRegistered: nextRegistered,
                  attendeeCount: Math.max(0, e.attendeeCount + (nextRegistered ? 1 : -1)),
                }
              : e
          )
        );
      }

      showFeedback(
        'success',
        nextRegistered ? 'Registration Confirmed' : 'Registration Cancelled',
        nextRegistered
          ? `Your pass for ${target.title} is available in Saved & Passes.`
          : `You cancelled your registration for ${target.title}.`
      );
    },
    [handleMutationError, showFeedback]
  );

  const toggleEventSaved = useCallback(
    (eventId: string) => {
      const target = dataRef.current.events.find((e) => e.id === eventId);
      if (!target) return;
      const nextSaved = !target.isSaved;

      if (dataRef.current.firebaseUid) {
        setLiveSavedEventIds((prev) => {
          const next = new Set(prev);
          if (nextSaved) next.add(eventId);
          else next.delete(eventId);
          return next;
        });
        void toggleSupabaseEventSaved(eventId, nextSaved)
          .then(() => refreshRef.current?.())
          .catch((err) => handleMutationError('Bookmark Sync Failed', err));
      } else {
        setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, isSaved: nextSaved } : e)));
      }

      showFeedback(
        'success',
        nextSaved ? 'Saved for Later' : 'Removed from Saved',
        nextSaved ? `${target.title} added to Saved.` : `${target.title} removed.`
      );
    },
    [handleMutationError, showFeedback]
  );

  const toggleAnnouncementSaved = useCallback(
    (announcementId: string) => {
      const target = dataRef.current.announcements.find((a) => a.id === announcementId);
      if (!target) return;
      const nextSaved = !target.isSaved;

      if (dataRef.current.firebaseUid) {
        setLiveSavedAnnIds((prev) => {
          const next = new Set(prev);
          if (nextSaved) next.add(announcementId);
          else next.delete(announcementId);
          return next;
        });
        void toggleSupabaseAnnouncementSaved(announcementId, nextSaved)
          .then(() => refreshRef.current?.())
          .catch((err) => handleMutationError('Bookmark Sync Failed', err));
      } else {
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === announcementId ? { ...a, isSaved: nextSaved } : a))
        );
      }

      showFeedback('success', nextSaved ? 'Notice Bookmarked' : 'Bookmark Removed', target.title);
    },
    [handleMutationError, showFeedback]
  );

  const markAnnouncementRead = useCallback(
    (announcementId: string) => {
      if (dataRef.current.firebaseUid) {
        setLiveReadAnnIds((prev) => {
          if (prev.has(announcementId)) return prev;
          const next = new Set(prev);
          next.add(announcementId);
          return next;
        });
        void markSupabaseAnnouncementRead(announcementId)
          .then(() => refreshRef.current?.())
          .catch((err) => handleMutationError('Read Sync Failed', err));
      } else {
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === announcementId && !a.isRead ? { ...a, isRead: true } : a))
        );
      }
    },
    [handleMutationError]
  );

  const toggleClubMembership = useCallback(
    (clubId: string) => {
      const target = dataRef.current.clubs.find((c) => c.id === clubId);
      if (!target) return;
      const nextJoined = !target.isJoined;

      if (dataRef.current.firebaseUid) {
        setLiveClubIds((prev) => {
          const next = new Set(prev);
          if (nextJoined) next.add(clubId);
          else next.delete(clubId);
          return next;
        });
        setLiveClubs((prev) =>
          prev
            ? prev.map((c) =>
                c.id === clubId
                  ? { ...c, memberCount: Math.max(0, c.memberCount + (nextJoined ? 1 : -1)) }
                  : c
              )
            : prev
        );
        void toggleSupabaseClubMembership(clubId, nextJoined)
          .then(() => refreshRef.current?.())
          .catch((err) => handleMutationError('Membership Sync Failed', err));
      } else {
        setClubs((prev) =>
          prev.map((c) =>
            c.id === clubId
              ? {
                  ...c,
                  isJoined: nextJoined,
                  memberCount: Math.max(0, c.memberCount + (nextJoined ? 1 : -1)),
                }
              : c
          )
        );
      }

      showFeedback(
        'success',
        nextJoined ? `Joined ${target.name}` : `Left ${target.name}`,
        nextJoined
          ? `Schedule: ${target.meetingSchedule} · ${target.location}`
          : 'Club membership updated.'
      );
    },
    [handleMutationError, showFeedback]
  );

  const markNotificationRead = useCallback(
    (notificationId: string) => {
      if (dataRef.current.firebaseUid) {
        const existsInSynced = dataRef.current.notifications.some(
          (n) => n.id === notificationId && !n.isRead
        );
        if (!existsInSynced) return;
        setLiveNotifications((prev) =>
          prev ? prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)) : prev
        );
        void markSupabaseNotificationRead(notificationId)
          .then(() => refreshRef.current?.())
          .catch((err) => handleMutationError('Notification Sync Failed', err));
      } else {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId && !n.isRead ? { ...n, isRead: true } : n))
        );
      }
    },
    [handleMutationError]
  );

  const markAllNotificationsRead = useCallback(() => {
    if (dataRef.current.firebaseUid) {
      const unreadIds = dataRef.current.notifications.filter((n) => !n.isRead).map((n) => n.id);
      if (unreadIds.length === 0) return;
      setLiveNotifications((prev) => (prev ? prev.map((n) => ({ ...n, isRead: true })) : prev));
      void markAllSupabaseNotificationsRead()
        .then(() => refreshRef.current?.())
        .catch((err) => handleMutationError('Notification Sync Failed', err));
    } else {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
    showFeedback('success', 'All Caught Up', 'All notifications marked as read.');
  }, [handleMutationError, showFeedback]);

  const approveEvent = useCallback(
    (eventId: string) => {
      const { role: curRole, events: curEvents, firebaseUid: curUid } = dataRef.current;
      if (!ROLE_PERSONAS[curRole].canApproveSubmissions) return;
      const target = curEvents.find((e) => e.id === eventId);
      if (!target) return;

      const notification: AppNotification = {
        id: `not-${Date.now()}`,
        type: 'approved',
        title: 'Event Approved',
        message: `"${target.title}" is now live on the campus feed.`,
        timeAgo: 'Just now',
        isRead: false,
        targetScreen: 'event_detail',
        targetId: target.id,
      };

      if (curUid) {
        setLiveEvents((prev) =>
          prev ? prev.map((e) => (e.id === eventId ? { ...e, status: 'approved' } : e)) : prev
        );
        setLiveNotifications((prev) => (prev ? [notification, ...prev] : prev));
        void approveSupabaseEvent(eventId, notification)
          .then(() => refreshRef.current?.())
          .catch((err) => handleMutationError('Approval Sync Failed', err));
      } else {
        setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, status: 'approved' } : e)));
        setNotifications((prev) => [notification, ...prev]);
      }

      showFeedback('success', 'Submission Approved', `${target.title} is now live.`);
    },
    [handleMutationError, showFeedback]
  );

  const rejectEvent = useCallback(
    (eventId: string) => {
      const { role: curRole, events: curEvents, firebaseUid: curUid } = dataRef.current;
      if (!ROLE_PERSONAS[curRole].canApproveSubmissions) return;
      const target = curEvents.find((e) => e.id === eventId);

      if (curUid) {
        setLiveEvents((prev) => (prev ? prev.filter((e) => e.id !== eventId) : prev));
        void rejectSupabaseEvent(eventId)
          .then(() => refreshRef.current?.())
          .catch((err) => handleMutationError('Rejection Sync Failed', err));
      } else {
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
      }

      showFeedback(
        'info',
        'Submission Removed',
        target ? `${target.title} removed from review queue.` : 'Submission removed.'
      );
    },
    [handleMutationError, showFeedback]
  );

  const createHub = useCallback(
    async (input: NewHubInput): Promise<{ ok: boolean; error?: string }> => {
      const { role: curRole, profile: curProfile, firebaseUid: curUid } = dataRef.current;
      const created = createHubRecord(input, curRole, curProfile);
      if (!created) {
        const msg = 'Only Super Admin can create a campus hub with a valid name and focus.';
        showFeedback('error', 'Cannot Create Hub', msg);
        return { ok: false, error: msg };
      }

      if (curUid) {
        try {
          await createSupabaseHub(created);
          setLiveHubs((prev) => (prev ? [created, ...prev] : [created]));
          void refreshRef.current?.();
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unable to save hub to Supabase.';
          handleMutationError('Hub Save Failed', err);
          return { ok: false, error: msg };
        }
      } else {
        setHubs((prev) => [created, ...prev]);
      }

      setPublishSheetOpen(false);
      showFeedback('success', 'Hub Created', `${created.name} is now ready for clubs and events.`);
      navigate('hubs');
      return { ok: true };
    },
    [handleMutationError, navigate, setPublishSheetOpen, showFeedback]
  );

  const createClub = useCallback(
    async (input: NewClubInput): Promise<{ ok: boolean; error?: string }> => {
      const {
        role: curRole,
        profile: curProfile,
        hubs: curHubs,
        firebaseUid: curUid,
      } = dataRef.current;
      const created = createClubRecord(input, curRole, curProfile, curHubs);
      if (!created) {
        const msg =
          curHubs.length === 0
            ? 'Create at least one Campus Hub before adding a club.'
            : 'Enter a valid club name, hub, and description.';
        showFeedback('error', 'Cannot Create Club', msg);
        return { ok: false, error: msg };
      }

      if (curUid) {
        try {
          await createSupabaseClub(created);
          const { isJoined: _ignored, ...clubCatalogRow } = created;
          setLiveClubs((prev) => (prev ? [clubCatalogRow, ...prev] : [clubCatalogRow]));
          void refreshRef.current?.();
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unable to save club to Supabase.';
          handleMutationError('Club Save Failed', err);
          return { ok: false, error: msg };
        }
      } else {
        setClubs((prev) => [created, ...prev]);
      }

      setPublishSheetOpen(false);
      showFeedback('success', 'Club Created', `${created.name} added under ${created.hubName}.`);
      navigate('hubs');
      return { ok: true };
    },
    [handleMutationError, navigate, setPublishSheetOpen, showFeedback]
  );

  const publishEvent = useCallback(
    async (input: NewEventInput): Promise<{ ok: boolean; error?: string }> => {
      const {
        role: curRole,
        profile: curProfile,
        hubs: curHubs,
        firebaseUid: curUid,
      } = dataRef.current;
      if (curHubs.length === 0) {
        const msg = 'Create a Campus Hub first before publishing an event.';
        showFeedback('error', 'No Hub Available', msg);
        return { ok: false, error: msg };
      }
      const created = createEventRecord(input, curRole, curProfile, curHubs);
      if (!created) {
        const msg = 'Your current role is not permitted to publish events.';
        showFeedback('error', 'Cannot Publish Event', msg);
        return { ok: false, error: msg };
      }

      if (curUid) {
        try {
          await publishSupabaseEvent(created.event, created.notification);
          const { isRegistered: _r, isSaved: _s, ...eventCatalogRow } = created.event;
          setLiveEvents((prev) => (prev ? [eventCatalogRow, ...prev] : [eventCatalogRow]));
          setLiveNotifications((prev) =>
            prev ? [created.notification, ...prev] : [created.notification]
          );
          void refreshRef.current?.();
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unable to publish event to Supabase.';
          handleMutationError('Event Publish Failed', err);
          return { ok: false, error: msg };
        }
      } else {
        setEvents((prev) => [created.event, ...prev]);
        setNotifications((prev) => [created.notification, ...prev]);
      }

      setPublishSheetOpen(false);
      showFeedback(
        'success',
        created.isDirectApproved ? 'Event Published' : 'Submitted for Review',
        created.isDirectApproved
          ? `${created.event.title} added to campus feed.`
          : `${created.event.title} awaits Super Admin approval.`
      );
      if (created.isDirectApproved) {
        navigate('event_detail', { eventId: created.event.id });
      }
      return { ok: true };
    },
    [handleMutationError, navigate, setPublishSheetOpen, showFeedback]
  );

  const publishAnnouncement = useCallback(
    async (input: NewAnnouncementInput): Promise<{ ok: boolean; error?: string }> => {
      const { role: curRole, profile: curProfile, firebaseUid: curUid } = dataRef.current;
      const created = createAnnouncementRecord(input, curRole, curProfile);
      if (!created) {
        const msg = 'Your current role is not permitted to publish official notices.';
        showFeedback('error', 'Cannot Publish Notice', msg);
        return { ok: false, error: msg };
      }

      if (curUid) {
        try {
          await publishSupabaseAnnouncement(created.announcement, created.notification);
          const { isRead: _r, isSaved: _s, ...annCatalogRow } = created.announcement;
          setLiveAnnouncements((prev) => (prev ? [annCatalogRow, ...prev] : [annCatalogRow]));
          setLiveNotifications((prev) =>
            prev ? [created.notification, ...prev] : [created.notification]
          );
          void refreshRef.current?.();
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : 'Unable to publish announcement to Supabase.';
          handleMutationError('Announcement Publish Failed', err);
          return { ok: false, error: msg };
        }
      } else {
        setAnnouncements((prev) => [created.announcement, ...prev]);
        setNotifications((prev) => [created.notification, ...prev]);
      }

      setPublishSheetOpen(false);
      showFeedback('success', 'Official Notice Published', created.announcement.title);
      navigate('announcements');
      return { ok: true };
    },
    [handleMutationError, navigate, setPublishSheetOpen, showFeedback]
  );

  const resetDemoData = useCallback(() => {
    removeStorageKey(STORAGE_KEYS.legacyMonolith);
    removeStorageKey(STORAGE_KEYS.campusData);
    setEvents(INITIAL_EVENTS);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    setClubs(INITIAL_CLUBS);
    setHubs(INITIAL_HUBS);
    setNotifications(INITIAL_NOTIFICATIONS);
    if (!dataRef.current.firebaseUid) {
      resetAuthState();
    }
    setUIStateMode('default');
    showFeedback('success', 'Workspace Cleared', 'Local workspace reset to a clean slate.');
  }, [resetAuthState, setUIStateMode, showFeedback]);

  const visibleEvents = useMemo(
    () => computeVisibleEvents(mergedEvents, role),
    [mergedEvents, role]
  );
  const pendingEvents = useMemo(
    () => mergedEvents.filter((e) => e.status === 'pending'),
    [mergedEvents]
  );
  const selectedEvent = useMemo(
    () => mergedEvents.find((e) => e.id === selectedEventId) ?? visibleEvents[0],
    [mergedEvents, selectedEventId, visibleEvents]
  );
  const unreadNotificationsCount = useMemo(
    () => mergedNotifications.filter((n) => !n.isRead).length,
    [mergedNotifications]
  );

  const value = useMemo<CampusDataContextValue>(
    () => ({
      events: mergedEvents,
      visibleEvents,
      pendingEvents,
      selectedEvent,
      announcements: mergedAnnouncements,
      clubs: mergedClubs,
      hubs: mergedHubs,
      notifications: mergedNotifications,
      unreadNotificationsCount,
      isSupabaseSynced: isUserSupabaseSynced,
      isFirestoreSynced: isUserSupabaseSynced,
      refreshCampusData,
      toggleEventRegistration,
      toggleEventSaved,
      toggleAnnouncementSaved,
      markAnnouncementRead,
      toggleClubMembership,
      markNotificationRead,
      markAllNotificationsRead,
      approveEvent,
      rejectEvent,
      createHub,
      createClub,
      publishEvent,
      publishAnnouncement,
      resetDemoData,
    }),
    [
      mergedEvents,
      visibleEvents,
      pendingEvents,
      selectedEvent,
      mergedAnnouncements,
      mergedClubs,
      mergedHubs,
      mergedNotifications,
      unreadNotificationsCount,
      isUserSupabaseSynced,
      refreshCampusData,
      toggleEventRegistration,
      toggleEventSaved,
      toggleAnnouncementSaved,
      markAnnouncementRead,
      toggleClubMembership,
      markNotificationRead,
      markAllNotificationsRead,
      approveEvent,
      rejectEvent,
      createHub,
      createClub,
      publishEvent,
      publishAnnouncement,
      resetDemoData,
    ]
  );

  return <CampusDataContext.Provider value={value}>{children}</CampusDataContext.Provider>;
};

export function useCampusData(): CampusDataContextValue {
  const ctx = useContext(CampusDataContext);
  if (!ctx) {
    throw new Error('useCampusData must be used inside CampusDataProvider');
  }
  return ctx;
}
