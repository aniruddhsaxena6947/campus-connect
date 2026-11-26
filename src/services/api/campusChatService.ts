import type { CampusChatMessage } from '../../types/collegeConnect';
import { requestCampusApi } from './campusApiClient';

export interface CampusChatApiResponse {
  reply: string;
  matchedEventIds: string[];
  followUpSuggestions: string[];
}

export async function sendCampusChatMessages(
  messages: Array<Pick<CampusChatMessage, 'role' | 'text'>>
): Promise<CampusChatApiResponse> {
  const parsed = await requestCampusApi<Record<string, unknown>>('/api/campus/chat', {
    method: 'POST',
    body: {
      messages: messages.map((m) => ({
        role: m.role,
        text: m.text,
      })),
    },
    errorLabel: 'Campus AI request failed',
  });

  return {
    reply: typeof parsed.reply === 'string' ? parsed.reply : '',
    matchedEventIds: Array.isArray(parsed.matchedEventIds)
      ? parsed.matchedEventIds.filter((id): id is string => typeof id === 'string')
      : [],
    followUpSuggestions: Array.isArray(parsed.followUpSuggestions)
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
