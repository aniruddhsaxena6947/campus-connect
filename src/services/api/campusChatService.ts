import type { CampusChatMessage } from '../../types/collegeConnect';
import { auth } from '../firebase/firebaseApp';

export interface CampusChatApiResponse {
  reply: string;
  matchedEventIds: string[];
  followUpSuggestions: string[];
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');

export async function sendCampusChatMessages(
  messages: Array<Pick<CampusChatMessage, 'role' | 'text'>>
): Promise<CampusChatApiResponse> {
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

  const res = await fetch(`${API_BASE_URL}/api/campus/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages: messages.map((m) => ({
        role: m.role,
        text: m.text,
      })),
    }),
  });

  const text = await res.text();
  let parsed: Record<string, unknown> | null;
  try {
    parsed = text ? (JSON.parse(text) as Record<string, unknown>) : null;
  } catch {
    parsed = null;
  }

  if (!res.ok) {
    const errorMsg =
      (parsed && typeof parsed.error === 'string' ? parsed.error : null) ||
      `Campus AI request failed (${res.status})`;
    throw new Error(errorMsg);
  }

  return {
    reply: typeof parsed?.reply === 'string' ? parsed.reply : '',
    matchedEventIds: Array.isArray(parsed?.matchedEventIds)
      ? parsed.matchedEventIds.filter((id): id is string => typeof id === 'string')
      : [],
    followUpSuggestions: Array.isArray(parsed?.followUpSuggestions)
      ? parsed.followUpSuggestions.filter((s): s is string => typeof s === 'string')
      : [],
  };
}

export function createChatMessage(
  partial: Omit<CampusChatMessage, 'id' | 'createdAt'>
): CampusChatMessage {
  const now = Date.now();
  const prefix = partial.error ? 'err' : partial.role === 'user' ? 'usr' : 'ai';
  return {
    ...partial,
    id: `${prefix}-${now}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: now,
  };
}
