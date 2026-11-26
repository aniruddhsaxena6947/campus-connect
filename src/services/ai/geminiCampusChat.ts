import {
  GoogleGenAI,
  ThinkingLevel,
  Type,
  type Content,
  type GenerateContentResponse,
} from '@google/genai';
import type {
  CampusCatalogClub,
  CampusCatalogEvent,
} from '../supabase/supabaseMappers.ts';
import type { CampusHub, UserRole } from '../../types/collegeConnect.ts';

export interface ChatHistoryTurn {
  role: 'user' | 'model';
  text: string;
}

export interface CampusChatContextSnapshot {
  todayIso: string;
  callerRole: UserRole;
  events: CampusCatalogEvent[];
  hubs: CampusHub[];
  clubs: CampusCatalogClub[];
}

export interface CampusChatReply {
  reply: string;
  matchedEventIds: string[];
  followUpSuggestions: string[];
}

const PRIMARY_MODEL = 'gemini-4-hydrogen';
const FALLBACK_MODEL = 'gemini-3.1-flash-lite';
const MODEL_CANDIDATES = [PRIMARY_MODEL, FALLBACK_MODEL] as const;

function createGeminiClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export function buildCampusSystemInstruction(context: CampusChatContextSnapshot): string {
  const compactEvents = context.events.map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category,
    date: e.date,
    dateDisplay: e.dateDisplay,
    time: e.time,
    venue: e.venue,
    entryLabel: e.entryLabel,
    isFree: e.isFree,
    hubName: e.hubName,
    organizerName: e.organizerName,
    highlights: e.highlights,
    description: e.description,
    seatsRemaining: Math.max(0, e.capacity - e.attendeeCount),
    status: e.status,
  }));

  const compactHubs = context.hubs.map((h) => ({
    id: h.id,
    name: h.name,
    focus: h.focus,
    building: h.building,
  }));

  const compactClubs = context.clubs.map((c) => ({
    id: c.id,
    name: c.name,
    hubName: c.hubName,
    tagline: c.tagline,
    meetingSchedule: c.meetingSchedule,
    location: c.location,
  }));

  return [
    'You are Campus Guide, the helpful AI event & campus discovery assistant inside CollegeConnect.',
    `Today's date is ${context.todayIso}. The signed-in user role is "${context.callerRole}".`,
    '',
    'YOUR ROLE:',
    '- Help students discover campus events, workshops, competitions, fests, hubs, and clubs tailored to their interests, schedule, and budget.',
    '- When a student asks about an interest or topic (for example: "list all events related to tech", "coding workshops", "free cultural fests", "weekend events", or "anything about AI"), carefully scan EVERY event in the LIVE CAMPUS EVENTS list below across title, category, description, highlights, hubName, and organizerName.',
    '- Return all genuinely relevant events in `matchedEventIds` (ordered by best match, then soonest date) and clearly summarize why they fit in `reply`.',
    '- NEVER invent, hallucinate, or assume any event that is not present in the LIVE CAMPUS EVENTS JSON below.',
    '- If LIVE CAMPUS EVENTS is empty or zero events match the user interest, say so honestly and warmly, mention what categories or hubs currently exist (if any), and suggest practical follow-up prompts.',
    '- Keep `reply` clear, concise, and easy to scan on a mobile screen (no raw JSON, no internal field names like `hubId`).',
    '- Always provide 2 to 3 short, natural `followUpSuggestions` the student can tap next.',
    '',
    `LIVE CAMPUS EVENTS (${compactEvents.length}):`,
    JSON.stringify(compactEvents),
    '',
    `LIVE CAMPUS HUBS (${compactHubs.length}):`,
    JSON.stringify(compactHubs),
    '',
    `LIVE STUDENT CLUBS (${compactClubs.length}):`,
    JSON.stringify(compactClubs),
  ].join('\n');
}

export function normalizeChatHistory(turns: ChatHistoryTurn[]): {
  history: Content[];
  lastUserText: string;
} {
  const sanitizedTurns = turns
    .map((m) => ({
      role: m.role === 'model' ? ('model' as const) : ('user' as const),
      text: m.text.trim().slice(0, 2000),
    }))
    .filter((m) => m.text.length > 0)
    .slice(-20);

  const lastTurn = sanitizedTurns[sanitizedTurns.length - 1];
  if (!lastTurn || lastTurn.role !== 'user') {
    throw new Error('Please enter a message for Campus AI.');
  }

  const priorTurns = sanitizedTurns.slice(0, -1);
  const firstUserIdx = priorTurns.findIndex((t) => t.role === 'user');
  if (firstUserIdx < 0) {
    return { history: [], lastUserText: lastTurn.text };
  }

  // Merge any consecutive same-role turns so chat history strictly alternates
  const normalized: ChatHistoryTurn[] = [];
  for (const turn of priorTurns.slice(firstUserIdx)) {
    const prev = normalized[normalized.length - 1];
    if (prev && prev.role === turn.role) {
      prev.text = `${prev.text}\n${turn.text}`;
    } else {
      normalized.push({ role: turn.role, text: turn.text });
    }
  }

  // Since the final message sent via sendMessage is a user turn, history should end on a model turn
  if (normalized.length > 0 && normalized[normalized.length - 1].role === 'user') {
    normalized.pop();
  }

  return {
    history: normalized.map((t) => ({
      role: t.role,
      parts: [{ text: t.text }],
    })),
    lastUserText: lastTurn.text,
  };
}

function parseAssistantJson(
  rawText: string | undefined,
  validEventIds: Set<string>
): CampusChatReply {
  const cleaned = (rawText ?? '').trim();
  if (!cleaned) {
    throw new Error('Campus AI returned an empty response. Please try again.');
  }

  try {
    const parsed = JSON.parse(cleaned) as {
      reply?: unknown;
      matchedEventIds?: unknown;
      followUpSuggestions?: unknown;
    };

    const reply =
      typeof parsed.reply === 'string' && parsed.reply.trim().length > 0
        ? parsed.reply.trim()
        : 'Here is what I found in the live campus schedule.';

    const matchedEventIds = Array.isArray(parsed.matchedEventIds)
      ? Array.from(
          new Set(
            parsed.matchedEventIds
              .filter((id): id is string => typeof id === 'string')
              .filter((id) => validEventIds.has(id))
          )
        )
      : [];

    const followUpSuggestions = Array.isArray(parsed.followUpSuggestions)
      ? parsed.followUpSuggestions
          .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
          .map((s) => s.trim())
          .slice(0, 3)
      : [];

    return { reply, matchedEventIds, followUpSuggestions };
  } catch {
    return {
      reply: cleaned,
      matchedEventIds: [],
      followUpSuggestions: [],
    };
  }
}

function isRetryableOrFallbackError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('500') ||
    msg.includes('429') ||
    msg.includes('unavailable') ||
    msg.includes('high demand') ||
    msg.includes('resource_exhausted') ||
    msg.includes('timeout') ||
    msg.includes('econnreset') ||
    msg.includes('fetch failed')
  );
}

function unwrapErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  try {
    const parsed = JSON.parse(raw) as {
      error?: { message?: string };
      message?: string;
    };
    const inner = parsed?.error?.message || parsed?.message;
    if (typeof inner === 'string' && inner.trim().length > 0) {
      return inner.trim();
    }
  } catch {
    // Raw message is plain text
  }
  return raw;
}

function formatGeminiError(err: unknown): Error {
  const clean = unwrapErrorMessage(err);
  const lower = clean.toLowerCase();
  if (lower.includes('api_key_invalid') || lower.includes('permission_denied') || lower.includes('403')) {
    return new Error(
      'Gemini API key was rejected. Check GEMINI_API_KEY in Settings > Secrets.'
    );
  }
  if (lower.includes('resource_exhausted') || lower.includes('429')) {
    return new Error(
      'Gemini API quota limit reached right now. Please wait a moment and try again.'
    );
  }
  if (lower.includes('high demand') || lower.includes('unavailable') || lower.includes('503')) {
    return new Error(
      'Campus AI is briefly experiencing high demand. Please tap Try Again in a moment.'
    );
  }
  if (lower.includes('not_found') || lower.includes('404')) {
    return new Error('Requested Gemini model is unavailable. Verify model configuration.');
  }
  return new Error(clean || 'Failed to get response from Campus AI.');
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runCampusChatTurn(
  messages: ChatHistoryTurn[],
  context: CampusChatContextSnapshot
): Promise<CampusChatReply> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'Gemini API key is not configured on the server. Add GEMINI_API_KEY in Settings > Secrets.'
    );
  }

  const { history, lastUserText } = normalizeChatHistory(messages);
  const systemInstruction = buildCampusSystemInstruction(context);
  const validEventIds = new Set(context.events.map((e) => e.id));
  const ai = createGeminiClient(apiKey);

  let lastErr: unknown;
  for (let modelIndex = 0; modelIndex < MODEL_CANDIDATES.length; modelIndex += 1) {
    const model = MODEL_CANDIDATES[modelIndex];
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const chat = ai.chats.create({
          model,
          history,
          config: {
            systemInstruction,
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.LOW,
            },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reply: {
                  type: Type.STRING,
                  description:
                    'Helpful conversational answer grounded strictly in the live campus catalog.',
                },
                matchedEventIds: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description:
                    'Exact IDs from LIVE CAMPUS EVENTS that match the student interest or question.',
                },
                followUpSuggestions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Up to 3 short follow-up questions or filters the user can tap next.',
                },
              },
              required: ['reply', 'matchedEventIds'],
            },
          },
        });

        const response: GenerateContentResponse = await chat.sendMessage({
          message: lastUserText,
        });

        return parseAssistantJson(response.text, validEventIds);
      } catch (err) {
        lastErr = err;
        console.warn(
          `Campus AI call failed on ${model} (attempt ${attempt + 1}):`,
          unwrapErrorMessage(err)
        );
        const canRetryOrFailover = isRetryableOrFallbackError(err);
        if (!canRetryOrFailover) {
          throw formatGeminiError(err);
        }
        if (attempt === 0) {
          await sleep(600);
        }
      }
    }
  }

  throw formatGeminiError(lastErr);
}
