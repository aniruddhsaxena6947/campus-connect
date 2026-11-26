import type {
  AppNotification,
  CampusClub,
  CampusEvent,
  CampusHub,
  OfficialAnnouncement,
} from '../../types/collegeConnect';
import { requestCampusApi } from '../api/campusApiClient';
import type { CampusCatalogPayload } from './supabaseMappers';

export interface SupabaseSyncStatus {
  configured: boolean;
  schemaReady: boolean;
}

export async function fetchSupabaseCampusCatalog(): Promise<CampusCatalogPayload> {
  return requestCampusApi<CampusCatalogPayload>('/api/campus/catalog', {
    method: 'GET',
  });
}

export function subscribeSupabaseCampusCatalog(
  onData: (payload: CampusCatalogPayload) => void,
  onError: (err: Error) => void,
  pollIntervalMs = 15000
): { refresh: () => Promise<void>; unsubscribe: () => void } {
  let active = true;
  let inFlight: Promise<void> | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let consecutiveFailures = 0;

  const refresh = async () => {
    if (!active) return;
    if (inFlight) return inFlight;

    inFlight = fetchSupabaseCampusCatalog()
      .then((payload) => {
        consecutiveFailures = 0;
        if (retryTimer) {
          clearTimeout(retryTimer);
          retryTimer = null;
        }
        if (active) {
          onData(payload);
        }
      })
      .catch((err) => {
        consecutiveFailures += 1;
        if (active) {
          onError(err instanceof Error ? err : new Error(String(err)));
          if (consecutiveFailures <= 2 && !retryTimer) {
            retryTimer = setTimeout(() => {
              retryTimer = null;
              void refresh();
            }, 3000);
          }
        }
      })
      .finally(() => {
        inFlight = null;
      });

    return inFlight;
  };

  void refresh();
  const timer = setInterval(() => {
    void refresh();
  }, pollIntervalMs);

  const handleVisibilityChange = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      void refresh();
    }
  };
  const handleFocusOrOnline = () => {
    void refresh();
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('focus', handleFocusOrOnline);
    window.addEventListener('online', handleFocusOrOnline);
  }

  return {
    refresh,
    unsubscribe: () => {
      active = false;
      clearInterval(timer);
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocusOrOnline);
        window.removeEventListener('online', handleFocusOrOnline);
      }
    },
  };
}

export async function createSupabaseHub(hub: CampusHub): Promise<void> {
  await requestCampusApi('/api/campus/hubs', {
    method: 'POST',
    body: hub,
  });
}

export async function createSupabaseClub(club: CampusClub): Promise<void> {
  await requestCampusApi('/api/campus/clubs', {
    method: 'POST',
    body: club,
  });
}

export async function publishSupabaseEvent(
  event: CampusEvent,
  notification: AppNotification
): Promise<void> {
  await requestCampusApi('/api/campus/events', {
    method: 'POST',
    body: { event, notification },
  });
}

export async function approveSupabaseEvent(
  eventId: string,
  notification: AppNotification
): Promise<void> {
  await requestCampusApi(`/api/campus/events/${encodeURIComponent(eventId)}/approve`, {
    method: 'POST',
    body: { notification },
  });
}

export async function rejectSupabaseEvent(eventId: string): Promise<void> {
  await requestCampusApi(`/api/campus/events/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
  });
}

export async function publishSupabaseAnnouncement(
  announcement: OfficialAnnouncement,
  notification: AppNotification
): Promise<void> {
  await requestCampusApi('/api/campus/announcements', {
    method: 'POST',
    body: { announcement, notification },
  });
}

export async function toggleSupabaseEventRegistration(
  eventId: string,
  registered: boolean
): Promise<void> {
  await requestCampusApi(`/api/campus/events/${encodeURIComponent(eventId)}/registration`, {
    method: 'POST',
    body: { registered },
  });
}

export async function toggleSupabaseEventSaved(
  eventId: string,
  saved: boolean
): Promise<void> {
  await requestCampusApi(`/api/campus/events/${encodeURIComponent(eventId)}/save`, {
    method: 'POST',
    body: { saved },
  });
}

export async function toggleSupabaseAnnouncementSaved(
  announcementId: string,
  saved: boolean
): Promise<void> {
  await requestCampusApi(`/api/campus/announcements/${encodeURIComponent(announcementId)}/save`, {
    method: 'POST',
    body: { saved },
  });
}

export async function markSupabaseAnnouncementRead(announcementId: string): Promise<void> {
  await requestCampusApi(`/api/campus/announcements/${encodeURIComponent(announcementId)}/read`, {
    method: 'POST',
  });
}

export async function toggleSupabaseClubMembership(
  clubId: string,
  joined: boolean
): Promise<void> {
  await requestCampusApi(`/api/campus/clubs/${encodeURIComponent(clubId)}/membership`, {
    method: 'POST',
    body: { joined },
  });
}

export async function markSupabaseNotificationRead(notificationId: string): Promise<void> {
  await requestCampusApi(`/api/campus/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: 'POST',
  });
}

export async function markAllSupabaseNotificationsRead(): Promise<void> {
  await requestCampusApi('/api/campus/notifications/read-all', {
    method: 'POST',
  });
}
