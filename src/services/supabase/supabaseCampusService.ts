import type {
  AppNotification,
  CampusClub,
  CampusEvent,
  CampusHub,
  OfficialAnnouncement,
} from '../../types/collegeConnect';
import { auth } from '../firebase/firebaseApp';
import type { CampusCatalogPayload } from './supabaseMappers';

export interface SupabaseSyncStatus {
  configured: boolean;
  schemaReady: boolean;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Proceed without token if unavailable
    }
  }
  return headers;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');

function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(apiUrl(url), {
    ...init,
    headers: {
      ...authHeaders,
      ...(init?.headers ?? {}),
    },
  });

  const text = await res.text();
  let parsed: Record<string, unknown> | null;
  try {
    parsed = text ? (JSON.parse(text) as Record<string, unknown>) : null;
  } catch {
    parsed = null;
  }

  if (!res.ok) {
    const message =
      (parsed && typeof parsed.error === 'string' ? parsed.error : null) ||
      `Campus API request failed (${res.status})`;
    throw new Error(message);
  }

  return (parsed ?? {}) as T;
}

export async function fetchSupabaseCampusCatalog(): Promise<CampusCatalogPayload> {
  return requestJson<CampusCatalogPayload>('/api/campus/catalog', {
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

  const refresh = async () => {
    if (!active) return;
    if (inFlight) return inFlight;

    inFlight = fetchSupabaseCampusCatalog()
      .then((payload) => {
        if (active) {
          onData(payload);
        }
      })
      .catch((err) => {
        if (active) {
          onError(err instanceof Error ? err : new Error(String(err)));
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

  return {
    refresh,
    unsubscribe: () => {
      active = false;
      clearInterval(timer);
    },
  };
}

export async function createSupabaseHub(hub: CampusHub): Promise<void> {
  await requestJson('/api/campus/hubs', {
    method: 'POST',
    body: JSON.stringify(hub),
  });
}

export async function createSupabaseClub(club: CampusClub): Promise<void> {
  await requestJson('/api/campus/clubs', {
    method: 'POST',
    body: JSON.stringify(club),
  });
}

export async function publishSupabaseEvent(
  event: CampusEvent,
  notification: AppNotification
): Promise<void> {
  await requestJson('/api/campus/events', {
    method: 'POST',
    body: JSON.stringify({ event, notification }),
  });
}

export async function approveSupabaseEvent(
  eventId: string,
  notification: AppNotification
): Promise<void> {
  await requestJson(`/api/campus/events/${encodeURIComponent(eventId)}/approve`, {
    method: 'POST',
    body: JSON.stringify({ notification }),
  });
}

export async function rejectSupabaseEvent(eventId: string): Promise<void> {
  await requestJson(`/api/campus/events/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
  });
}

export async function publishSupabaseAnnouncement(
  announcement: OfficialAnnouncement,
  notification: AppNotification
): Promise<void> {
  await requestJson('/api/campus/announcements', {
    method: 'POST',
    body: JSON.stringify({ announcement, notification }),
  });
}

export async function toggleSupabaseEventRegistration(
  eventId: string,
  registered: boolean
): Promise<void> {
  await requestJson(`/api/campus/events/${encodeURIComponent(eventId)}/registration`, {
    method: 'POST',
    body: JSON.stringify({ registered }),
  });
}

export async function toggleSupabaseEventSaved(
  eventId: string,
  saved: boolean
): Promise<void> {
  await requestJson(`/api/campus/events/${encodeURIComponent(eventId)}/save`, {
    method: 'POST',
    body: JSON.stringify({ saved }),
  });
}

export async function toggleSupabaseAnnouncementSaved(
  announcementId: string,
  saved: boolean
): Promise<void> {
  await requestJson(`/api/campus/announcements/${encodeURIComponent(announcementId)}/save`, {
    method: 'POST',
    body: JSON.stringify({ saved }),
  });
}

export async function markSupabaseAnnouncementRead(announcementId: string): Promise<void> {
  await requestJson(`/api/campus/announcements/${encodeURIComponent(announcementId)}/read`, {
    method: 'POST',
  });
}

export async function toggleSupabaseClubMembership(
  clubId: string,
  joined: boolean
): Promise<void> {
  await requestJson(`/api/campus/clubs/${encodeURIComponent(clubId)}/membership`, {
    method: 'POST',
    body: JSON.stringify({ joined }),
  });
}

export async function markSupabaseNotificationRead(notificationId: string): Promise<void> {
  await requestJson(`/api/campus/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: 'POST',
  });
}

export async function markAllSupabaseNotificationsRead(): Promise<void> {
  await requestJson('/api/campus/notifications/read-all', {
    method: 'POST',
  });
}
