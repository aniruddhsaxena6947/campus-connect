import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCampusChatTurn, type ChatHistoryTurn } from './src/services/ai/geminiCampusChat.ts';
import { getTodayIsoDate } from './src/services/api/localCampusService.ts';
import { isValidDocumentId, BLUEPRINT_LIMITS, sanitizeSlugId } from './src/services/firebase/validation.ts';
import {
  buildSupabaseAnnouncementInsert,
  buildSupabaseClubInsert,
  buildSupabaseEventInsert,
  buildSupabaseHubInsert,
  buildSupabaseNotificationInsert,
  mapSupabaseAnnouncementRow,
  mapSupabaseClubRow,
  mapSupabaseEventRow,
  mapSupabaseHubRow,
  mapSupabaseNotificationRow,
  type CampusCatalogPayload,
  type SupabaseAnnouncementRow,
  type SupabaseClubRow,
  type SupabaseEventRow,
  type SupabaseHubRow,
  type SupabaseNotificationRow,
} from './src/services/supabase/supabaseMappers.ts';
import type {
  AppNotification,
  CampusClub,
  CampusEvent,
  CampusHub,
  OfficialAnnouncement,
  UserRole,
} from './src/types/collegeConnect.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BOOTSTRAPPED_ADMIN_EMAIL = 'aniruddhsaxena73@gmail.com';

interface FirebaseAppletConfig {
  projectId: string;
  firestoreDatabaseId: string;
}

function loadFirebaseAppletConfig(): FirebaseAppletConfig {
  const fallback: FirebaseAppletConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    firestoreDatabaseId: process.env.FIRESTORE_DATABASE_ID || '(default)',
  };
  try {
    const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8')) as Partial<FirebaseAppletConfig>;
      return {
        projectId: parsed.projectId || fallback.projectId,
        firestoreDatabaseId: parsed.firestoreDatabaseId || fallback.firestoreDatabaseId,
      };
    }
  } catch {
    // Ignore parse failures and fall back to env vars
  }
  return fallback;
}

const firebaseConfig = loadFirebaseAppletConfig();
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !key) {
    return null;
  }
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

interface VerifiedCaller {
  uid: string;
  email: string;
  role: UserRole;
  idToken: string;
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

async function resolveCallerRole(uid: string, email: string, idToken: string): Promise<UserRole> {
  if (email.trim().toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL) {
    return 'super_admin';
  }
  if (!firebaseConfig.projectId) {
    return 'student';
  }
  try {
    const dbId = encodeURIComponent(firebaseConfig.firestoreDatabaseId || '(default)');
    const docUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      firebaseConfig.projectId
    )}/databases/${dbId}/documents/users/${encodeURIComponent(uid)}/public/profile`;

    const res = await fetch(docUrl, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!res.ok) return 'student';
    const data = (await res.json()) as {
      fields?: { role?: { stringValue?: string } };
    };
    const rawRole = data.fields?.role?.stringValue;
    if (
      rawRole === 'student' ||
      rawRole === 'faculty' ||
      rawRole === 'club_incharge' ||
      rawRole === 'hub_incharge' ||
      rawRole === 'super_admin'
    ) {
      return rawRole;
    }
  } catch {
    // Fall back safely to least-privilege student role
  }
  return 'student';
}

async function verifyFirebaseCaller(req: Request): Promise<VerifiedCaller | null> {
  const idToken = extractBearerToken(req);
  if (!idToken || !firebaseConfig.projectId) {
    return null;
  }
  try {
    const { payload } = await jwtVerify(idToken, FIREBASE_JWKS, {
      issuer: `https://securetoken.google.com/${firebaseConfig.projectId}`,
      audience: firebaseConfig.projectId,
    });
    const uid = typeof payload.sub === 'string' ? payload.sub : '';
    const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
    const emailVerified = payload.email_verified === true;
    if (!uid || !isValidDocumentId(uid, BLUEPRINT_LIMITS.uidMax) || !emailVerified) {
      return null;
    }
    const role = await resolveCallerRole(uid, email, idToken);
    return { uid, email, role, idToken };
  } catch {
    return null;
  }
}

function isSchemaMissingError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    Boolean(error.message && error.message.includes('Could not find the table'))
  );
}

function canPublishCampusContent(role: UserRole): boolean {
  return (
    role === 'faculty' ||
    role === 'club_incharge' ||
    role === 'hub_incharge' ||
    role === 'super_admin'
  );
}

async function createServer() {
  const app = express();

  // Allow requests from Capacitor Android/iOS app origins + web
  app.use((req: Request, res: Response, next: NextFunction) => {
    const allowedOrigins = [
      'capacitor://localhost',
      'http://localhost',
      'http://localhost:3000',
      'http://localhost:5173',
      'ionic://localhost',
      'https://campus-connect-jqob.onrender.com',
    ];
    const origin = req.headers.origin as string | undefined;
    if (!origin || allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.use(express.json({ limit: '256kb' }));

  const router = express.Router();

  router.get('/health', async (_req: Request, res: Response) => {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      res.json({
        configured: false,
        schemaReady: false,
        message: 'Set SUPABASE_URL and SUPABASE_SECRET_KEY in environment secrets.',
      });
      return;
    }

    const { error } = await supabase.from('hubs').select('id').limit(1);
    if (error) {
      const missing = isSchemaMissingError(error);
      res.json({
        configured: true,
        schemaReady: !missing,
        message: missing
          ? 'Supabase tables not initialized yet. Run supabase/schema.sql in Supabase SQL Editor.'
          : 'Unable to query Supabase catalog.',
      });
      return;
    }

    res.json({ configured: true, schemaReady: true });
  });

  router.get('/catalog', async (req: Request, res: Response) => {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      const empty: CampusCatalogPayload = {
        configured: false,
        schemaReady: false,
        hubs: [],
        clubs: [],
        events: [],
        announcements: [],
        registrations: [],
        savedEvents: [],
        savedAnnouncements: [],
        readAnnouncements: [],
        clubMemberships: [],
        notifications: [],
      };
      res.json(empty);
      return;
    }

    const caller = await verifyFirebaseCaller(req);

    const [hubsRes, clubsRes, announcementsRes] = await Promise.all([
      supabase.from('hubs').select('*').eq('visibility', 'campus').order('created_at', { ascending: false }),
      supabase.from('clubs').select('*').eq('visibility', 'campus').order('created_at', { ascending: false }),
      supabase.from('announcements').select('*').eq('visibility', 'campus').order('date', { ascending: false }),
    ]);

    const firstError = hubsRes.error || clubsRes.error || announcementsRes.error;
    if (firstError) {
      if (isSchemaMissingError(firstError)) {
        const empty: CampusCatalogPayload = {
          configured: true,
          schemaReady: false,
          hubs: [],
          clubs: [],
          events: [],
          announcements: [],
          registrations: [],
          savedEvents: [],
          savedAnnouncements: [],
          readAnnouncements: [],
          clubMemberships: [],
          notifications: [],
        };
        res.json(empty);
        return;
      }
      res.status(500).json({ error: 'Failed to load campus catalog from Supabase.' });
      return;
    }

    let eventRows: SupabaseEventRow[];
    if (caller?.role === 'super_admin') {
      const evRes = await supabase.from('events').select('*').order('date', { ascending: true });
      if (evRes.error) {
        res.status(500).json({ error: 'Failed to load campus events.' });
        return;
      }
      eventRows = (evRes.data ?? []) as SupabaseEventRow[];
    } else if (caller) {
      const evRes = await supabase
        .from('events')
        .select('*')
        .or(`status.eq.approved,author_uid.eq.${caller.uid}`)
        .order('date', { ascending: true });
      if (evRes.error) {
        res.status(500).json({ error: 'Failed to load campus events.' });
        return;
      }
      eventRows = (evRes.data ?? []) as SupabaseEventRow[];
    } else {
      const evRes = await supabase
        .from('events')
        .select('*')
        .eq('status', 'approved')
        .order('date', { ascending: true });
      if (evRes.error) {
        res.status(500).json({ error: 'Failed to load campus events.' });
        return;
      }
      eventRows = (evRes.data ?? []) as SupabaseEventRow[];
    }

    let registrations: string[] = [];
    let savedEvents: string[] = [];
    let savedAnnouncements: string[] = [];
    let readAnnouncements: string[] = [];
    let clubMemberships: string[] = [];
    let notifications: AppNotification[] = [];

    if (caller) {
      const [regRes, savedEvRes, savedAnnRes, readAnnRes, memRes, notifRes] = await Promise.all([
        supabase.from('event_registrations').select('event_id').eq('user_id', caller.uid),
        supabase.from('saved_events').select('event_id').eq('user_id', caller.uid),
        supabase.from('saved_announcements').select('announcement_id').eq('user_id', caller.uid),
        supabase.from('read_announcements').select('announcement_id').eq('user_id', caller.uid),
        supabase.from('club_memberships').select('club_id').eq('user_id', caller.uid),
        supabase
          .from('notifications')
          .select('*')
          .eq('user_id', caller.uid)
          .order('created_at', { ascending: false }),
      ]);

      registrations = (regRes.data ?? []).map((r) => String(r.event_id));
      savedEvents = (savedEvRes.data ?? []).map((r) => String(r.event_id));
      savedAnnouncements = (savedAnnRes.data ?? []).map((r) => String(r.announcement_id));
      readAnnouncements = (readAnnRes.data ?? []).map((r) => String(r.announcement_id));
      clubMemberships = (memRes.data ?? []).map((r) => String(r.club_id));
      notifications = ((notifRes.data ?? []) as SupabaseNotificationRow[]).map(
        mapSupabaseNotificationRow
      );
    }

    const payload: CampusCatalogPayload = {
      configured: true,
      schemaReady: true,
      hubs: ((hubsRes.data ?? []) as SupabaseHubRow[]).map(mapSupabaseHubRow),
      clubs: ((clubsRes.data ?? []) as SupabaseClubRow[]).map(mapSupabaseClubRow),
      events: eventRows.map(mapSupabaseEventRow),
      announcements: ((announcementsRes.data ?? []) as SupabaseAnnouncementRow[]).map(
        mapSupabaseAnnouncementRow
      ),
      registrations,
      savedEvents,
      savedAnnouncements,
      readAnnouncements,
      clubMemberships,
      notifications,
    };

    res.json(payload);
  });

  // Require authenticated Firebase caller for all mutations below
  const requireCaller = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      res.status(503).json({
        error: 'Supabase is not configured on the server. Add SUPABASE_URL and SUPABASE_SECRET_KEY.',
      });
      return;
    }
    const caller = await verifyFirebaseCaller(req);
    if (!caller) {
      res.status(401).json({ error: 'Authentication required. Sign in with a verified account.' });
      return;
    }
    res.locals.caller = caller;
    res.locals.supabase = supabase;
    next();
  };

  router.post('/hubs', requireCaller, async (req: Request, res: Response) => {
    const caller = res.locals.caller as VerifiedCaller;
    const supabase = res.locals.supabase as SupabaseClient;
    if (caller.role !== 'super_admin') {
      res.status(403).json({ error: 'Only Super Admin can create campus hubs.' });
      return;
    }

    const body = req.body as Partial<CampusHub> | null;
    if (!body || typeof body.name !== 'string' || typeof body.focus !== 'string') {
      res.status(400).json({ error: 'Valid hub name and focus are required.' });
      return;
    }

    const row = buildSupabaseHubInsert({
      id: typeof body.id === 'string' && body.id ? body.id : `hub-${Date.now()}`,
      name: body.name,
      focus: body.focus,
      inChargeName: typeof body.inChargeName === 'string' ? body.inChargeName : 'Hub Head',
      building: typeof body.building === 'string' ? body.building : 'Main Campus',
      activeEventsCount: 0,
    });

    const { error } = await supabase.from('hubs').insert(row);
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(201).json({ hub: mapSupabaseHubRow(row) });
  });

  router.post('/clubs', requireCaller, async (req: Request, res: Response) => {
    const caller = res.locals.caller as VerifiedCaller;
    const supabase = res.locals.supabase as SupabaseClient;
    if (caller.role !== 'super_admin') {
      res.status(403).json({ error: 'Only Super Admin can create campus clubs.' });
      return;
    }

    const body = req.body as Partial<CampusClub> | null;
    if (!body || typeof body.name !== 'string' || typeof body.hubId !== 'string') {
      res.status(400).json({ error: 'Valid club name and hubId are required.' });
      return;
    }

    const safeHubId = sanitizeSlugId(body.hubId, 'hub');
    const hubRes = await supabase.from('hubs').select('id, name').eq('id', safeHubId).maybeSingle();
    if (hubRes.error || !hubRes.data) {
      res.status(400).json({ error: 'Referenced Campus Hub does not exist.' });
      return;
    }

    const row = buildSupabaseClubInsert({
      id: typeof body.id === 'string' && body.id ? body.id : `club-${Date.now()}`,
      name: body.name,
      hubId: hubRes.data.id,
      hubName: hubRes.data.name,
      tagline: typeof body.tagline === 'string' ? body.tagline : 'Official student club',
      meetingSchedule:
        typeof body.meetingSchedule === 'string' ? body.meetingSchedule : 'Weekly · TBD',
      location: typeof body.location === 'string' ? body.location : 'Main Campus',
      memberCount: 0,
      leadName: typeof body.leadName === 'string' ? body.leadName : 'Club Lead',
      isJoined: false,
    });

    const { error } = await supabase.from('clubs').insert(row);
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(201).json({ club: mapSupabaseClubRow(row) });
  });

  router.post('/events', requireCaller, async (req: Request, res: Response) => {
    const caller = res.locals.caller as VerifiedCaller;
    const supabase = res.locals.supabase as SupabaseClient;
    if (!canPublishCampusContent(caller.role)) {
      res.status(403).json({ error: 'Your role cannot publish campus events.' });
      return;
    }

    const body = req.body as {
      event?: Partial<CampusEvent>;
      notification?: Partial<AppNotification>;
    } | null;
    const evt = body?.event;
    if (!evt || typeof evt.title !== 'string' || typeof evt.hubId !== 'string') {
      res.status(400).json({ error: 'Valid event payload and hubId are required.' });
      return;
    }

    const safeHubId = sanitizeSlugId(evt.hubId, 'hub');
    const hubRes = await supabase.from('hubs').select('id, name').eq('id', safeHubId).maybeSingle();
    if (hubRes.error || !hubRes.data) {
      res.status(400).json({ error: 'Referenced Campus Hub does not exist.' });
      return;
    }

    const isDirectApproved = caller.role === 'super_admin' || caller.role === 'hub_incharge';
    const eventRow = buildSupabaseEventInsert(
      caller.uid,
      {
        id: typeof evt.id === 'string' && evt.id ? evt.id : `evt-${Date.now()}`,
        title: evt.title,
        category: evt.category ?? 'Cultural',
        date: typeof evt.date === 'string' ? evt.date : getTodayIsoDate(),
        dateDisplay: typeof evt.dateDisplay === 'string' ? evt.dateDisplay : 'Upcoming',
        time: typeof evt.time === 'string' ? evt.time : '4:00 PM',
        venue: typeof evt.venue === 'string' ? evt.venue : 'Main Campus',
        entryLabel: typeof evt.entryLabel === 'string' ? evt.entryLabel : 'Free Entry',
        isFree: evt.isFree !== false,
        description: typeof evt.description === 'string' ? evt.description : '',
        highlights: Array.isArray(evt.highlights) ? evt.highlights : [evt.category ?? 'Campus'],
        hubId: hubRes.data.id,
        hubName: hubRes.data.name,
        organizerName: typeof evt.organizerName === 'string' ? evt.organizerName : 'Campus Organizer',
        authorRole: caller.role,
        status: isDirectApproved ? 'approved' : 'pending',
        artwork: evt.artwork ?? 'campus_general',
        featured: false,
        attendeeCount: 0,
        capacity: typeof evt.capacity === 'number' && evt.capacity > 0 ? evt.capacity : 200,
        isRegistered: false,
        isSaved: false,
      },
      getTodayIsoDate()
    );

    const { error: eventError } = await supabase.from('events').insert(eventRow);
    if (eventError) {
      res.status(400).json({ error: eventError.message });
      return;
    }

    const notifInput = body?.notification;
    const notifRow = buildSupabaseNotificationInsert(caller.uid, {
      id: typeof notifInput?.id === 'string' && notifInput.id ? notifInput.id : `not-${Date.now()}`,
      type: isDirectApproved ? 'new_event' : 'approved',
      title:
        typeof notifInput?.title === 'string'
          ? notifInput.title
          : isDirectApproved
            ? 'New Event Published'
            : 'Submitted for Review',
      message:
        typeof notifInput?.message === 'string'
          ? notifInput.message
          : `${eventRow.title} processed.`,
      timeAgo: 'Just now',
      isRead: false,
      targetScreen: 'event_detail',
      targetId: eventRow.id,
    });

    await supabase.from('notifications').insert(notifRow);
    res.status(201).json({ event: mapSupabaseEventRow(eventRow) });
  });

  router.post('/events/:eventId/approve', requireCaller, async (req: Request, res: Response) => {
    const caller = res.locals.caller as VerifiedCaller;
    const supabase = res.locals.supabase as SupabaseClient;
    if (caller.role !== 'super_admin') {
      res.status(403).json({ error: 'Only Super Admin can approve submissions.' });
      return;
    }

    const eventId = String(req.params.eventId || '');
    if (!isValidDocumentId(eventId, BLUEPRINT_LIMITS.shortIdMax)) {
      res.status(400).json({ error: 'Invalid eventId.' });
      return;
    }

    const { error } = await supabase
      .from('events')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', eventId);

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    const body = req.body as { notification?: Partial<AppNotification> } | null;
    if (body?.notification) {
      const notifRow = buildSupabaseNotificationInsert(caller.uid, {
        id: body.notification.id || `not-${Date.now()}`,
        type: 'approved',
        title: body.notification.title || 'Event Approved',
        message: body.notification.message || 'Submission approved.',
        timeAgo: 'Just now',
        isRead: false,
        targetScreen: 'event_detail',
        targetId: eventId,
      });
      await supabase.from('notifications').insert(notifRow);
    }

    res.json({ ok: true });
  });

  router.delete('/events/:eventId', requireCaller, async (req: Request, res: Response) => {
    const caller = res.locals.caller as VerifiedCaller;
    const supabase = res.locals.supabase as SupabaseClient;
    if (caller.role !== 'super_admin') {
      res.status(403).json({ error: 'Only Super Admin can decline or remove events.' });
      return;
    }

    const eventId = String(req.params.eventId || '');
    if (!isValidDocumentId(eventId, BLUEPRINT_LIMITS.shortIdMax)) {
      res.status(400).json({ error: 'Invalid eventId.' });
      return;
    }

    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json({ ok: true });
  });

  router.post('/announcements', requireCaller, async (req: Request, res: Response) => {
    const caller = res.locals.caller as VerifiedCaller;
    const supabase = res.locals.supabase as SupabaseClient;
    if (!canPublishCampusContent(caller.role)) {
      res.status(403).json({ error: 'Your role cannot publish official notices.' });
      return;
    }

    const body = req.body as {
      announcement?: Partial<OfficialAnnouncement>;
      notification?: Partial<AppNotification>;
    } | null;
    const ann = body?.announcement;
    if (!ann || typeof ann.title !== 'string' || typeof ann.summary !== 'string') {
      res.status(400).json({ error: 'Valid announcement title and summary are required.' });
      return;
    }

    const annRow = buildSupabaseAnnouncementInsert(
      caller.uid,
      {
        id: typeof ann.id === 'string' && ann.id ? ann.id : `ann-${Date.now()}`,
        title: ann.title,
        category: ann.category ?? 'General',
        issuerTitle: typeof ann.issuerTitle === 'string' ? ann.issuerTitle : 'Campus Office',
        authorRole: caller.role,
        summary: ann.summary,
        postedAt: 'Just now',
        date: typeof ann.date === 'string' ? ann.date : getTodayIsoDate(),
        pinned: Boolean(ann.pinned) && (caller.role === 'super_admin' || caller.role === 'faculty'),
        isRead: false,
        isSaved: false,
      },
      getTodayIsoDate()
    );

    const { error } = await supabase.from('announcements').insert(annRow);
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    const notifInput = body?.notification;
    const notifRow = buildSupabaseNotificationInsert(caller.uid, {
      id: typeof notifInput?.id === 'string' && notifInput.id ? notifInput.id : `not-${Date.now()}`,
      type: 'announcement',
      title: typeof notifInput?.title === 'string' ? notifInput.title : 'Official Announcement',
      message: typeof notifInput?.message === 'string' ? notifInput.message : annRow.title,
      timeAgo: 'Just now',
      isRead: false,
      targetScreen: 'announcements',
      targetId: annRow.id,
    });
    await supabase.from('notifications').insert(notifRow);

    res.status(201).json({ announcement: mapSupabaseAnnouncementRow(annRow) });
  });

  router.post(
    '/events/:eventId/registration',
    requireCaller,
    async (req: Request, res: Response) => {
      const caller = res.locals.caller as VerifiedCaller;
      const supabase = res.locals.supabase as SupabaseClient;
      const eventId = String(req.params.eventId || '');
      const registered = Boolean((req.body as { registered?: boolean } | null)?.registered);

      if (!isValidDocumentId(eventId, BLUEPRINT_LIMITS.shortIdMax)) {
        res.status(400).json({ error: 'Invalid eventId.' });
        return;
      }

      const rpcRes = await supabase.rpc('toggle_event_registration', {
        p_user_id: caller.uid,
        p_event_id: eventId,
        p_register: registered,
      });

      if (!rpcRes.error) {
        res.json({ attendeeCount: Number(rpcRes.data ?? 0), registered });
        return;
      }

      // Fallback if RPC function is unavailable
      const evRes = await supabase
        .from('events')
        .select('attendee_count, capacity')
        .eq('id', eventId)
        .maybeSingle();
      if (evRes.error || !evRes.data) {
        res.status(404).json({ error: 'Event not found.' });
        return;
      }

      if (registered) {
        const existing = await supabase
          .from('event_registrations')
          .select('event_id')
          .eq('user_id', caller.uid)
          .eq('event_id', eventId)
          .maybeSingle();
        if (!existing.data) {
          await supabase
            .from('event_registrations')
            .insert({ user_id: caller.uid, event_id: eventId });
          await supabase
            .from('events')
            .update({
              attendee_count: Math.min(evRes.data.capacity, evRes.data.attendee_count + 1),
              updated_at: new Date().toISOString(),
            })
            .eq('id', eventId);
        }
      } else {
        const existing = await supabase
          .from('event_registrations')
          .select('event_id')
          .eq('user_id', caller.uid)
          .eq('event_id', eventId)
          .maybeSingle();
        if (existing.data) {
          await supabase
            .from('event_registrations')
            .delete()
            .eq('user_id', caller.uid)
            .eq('event_id', eventId);
          await supabase
            .from('events')
            .update({
              attendee_count: Math.max(0, evRes.data.attendee_count - 1),
              updated_at: new Date().toISOString(),
            })
            .eq('id', eventId);
        }
      }
      res.json({ ok: true, registered });
    }
  );

  router.post('/events/:eventId/save', requireCaller, async (req: Request, res: Response) => {
    const caller = res.locals.caller as VerifiedCaller;
    const supabase = res.locals.supabase as SupabaseClient;
    const eventId = String(req.params.eventId || '');
    const saved = Boolean((req.body as { saved?: boolean } | null)?.saved);

    if (!isValidDocumentId(eventId, BLUEPRINT_LIMITS.shortIdMax)) {
      res.status(400).json({ error: 'Invalid eventId.' });
      return;
    }

    if (saved) {
      const { error } = await supabase
        .from('saved_events')
        .upsert({ user_id: caller.uid, event_id: eventId }, { onConflict: 'user_id,event_id' });
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
    } else {
      const { error } = await supabase
        .from('saved_events')
        .delete()
        .eq('user_id', caller.uid)
        .eq('event_id', eventId);
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
    }
    res.json({ ok: true, saved });
  });

  router.post(
    '/announcements/:announcementId/save',
    requireCaller,
    async (req: Request, res: Response) => {
      const caller = res.locals.caller as VerifiedCaller;
      const supabase = res.locals.supabase as SupabaseClient;
      const announcementId = String(req.params.announcementId || '');
      const saved = Boolean((req.body as { saved?: boolean } | null)?.saved);

      if (!isValidDocumentId(announcementId, BLUEPRINT_LIMITS.shortIdMax)) {
        res.status(400).json({ error: 'Invalid announcementId.' });
        return;
      }

      if (saved) {
        const { error } = await supabase
          .from('saved_announcements')
          .upsert(
            { user_id: caller.uid, announcement_id: announcementId },
            { onConflict: 'user_id,announcement_id' }
          );
        if (error) {
          res.status(400).json({ error: error.message });
          return;
        }
      } else {
        const { error } = await supabase
          .from('saved_announcements')
          .delete()
          .eq('user_id', caller.uid)
          .eq('announcement_id', announcementId);
        if (error) {
          res.status(400).json({ error: error.message });
          return;
        }
      }
      res.json({ ok: true, saved });
    }
  );

  router.post(
    '/announcements/:announcementId/read',
    requireCaller,
    async (req: Request, res: Response) => {
      const caller = res.locals.caller as VerifiedCaller;
      const supabase = res.locals.supabase as SupabaseClient;
      const announcementId = String(req.params.announcementId || '');

      if (!isValidDocumentId(announcementId, BLUEPRINT_LIMITS.shortIdMax)) {
        res.status(400).json({ error: 'Invalid announcementId.' });
        return;
      }

      const { error } = await supabase
        .from('read_announcements')
        .upsert(
          { user_id: caller.uid, announcement_id: announcementId },
          { onConflict: 'user_id,announcement_id' }
        );
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.json({ ok: true });
    }
  );

  router.post('/clubs/:clubId/membership', requireCaller, async (req: Request, res: Response) => {
    const caller = res.locals.caller as VerifiedCaller;
    const supabase = res.locals.supabase as SupabaseClient;
    const clubId = String(req.params.clubId || '');
    const joined = Boolean((req.body as { joined?: boolean } | null)?.joined);

    if (!isValidDocumentId(clubId, BLUEPRINT_LIMITS.shortIdMax)) {
      res.status(400).json({ error: 'Invalid clubId.' });
      return;
    }

    const rpcRes = await supabase.rpc('toggle_club_membership', {
      p_user_id: caller.uid,
      p_club_id: clubId,
      p_join: joined,
    });

    if (!rpcRes.error) {
      res.json({ memberCount: Number(rpcRes.data ?? 0), joined });
      return;
    }

    const clubRes = await supabase
      .from('clubs')
      .select('member_count')
      .eq('id', clubId)
      .maybeSingle();
    if (clubRes.error || !clubRes.data) {
      res.status(404).json({ error: 'Club not found.' });
      return;
    }

    if (joined) {
      const existing = await supabase
        .from('club_memberships')
        .select('club_id')
        .eq('user_id', caller.uid)
        .eq('club_id', clubId)
        .maybeSingle();
      if (!existing.data) {
        await supabase.from('club_memberships').insert({ user_id: caller.uid, club_id: clubId });
        await supabase
          .from('clubs')
          .update({
            member_count: clubRes.data.member_count + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', clubId);
      }
    } else {
      const existing = await supabase
        .from('club_memberships')
        .select('club_id')
        .eq('user_id', caller.uid)
        .eq('club_id', clubId)
        .maybeSingle();
      if (existing.data) {
        await supabase
          .from('club_memberships')
          .delete()
          .eq('user_id', caller.uid)
          .eq('club_id', clubId);
        await supabase
          .from('clubs')
          .update({
            member_count: Math.max(0, clubRes.data.member_count - 1),
            updated_at: new Date().toISOString(),
          })
          .eq('id', clubId);
      }
    }
    res.json({ ok: true, joined });
  });

  router.post(
    '/notifications/read-all',
    requireCaller,
    async (_req: Request, res: Response) => {
      const caller = res.locals.caller as VerifiedCaller;
      const supabase = res.locals.supabase as SupabaseClient;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('user_id', caller.uid)
        .eq('is_read', false);

      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.json({ ok: true });
    }
  );

  router.post(
    '/notifications/:notificationId/read',
    requireCaller,
    async (req: Request, res: Response) => {
      const caller = res.locals.caller as VerifiedCaller;
      const supabase = res.locals.supabase as SupabaseClient;
      const notificationId = String(req.params.notificationId || '');

      if (!isValidDocumentId(notificationId, BLUEPRINT_LIMITS.shortIdMax)) {
        res.status(400).json({ error: 'Invalid notificationId.' });
        return;
      }

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', caller.uid);

      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.json({ ok: true });
    }
  );

  router.post('/chat', async (req: Request, res: Response) => {
    const body = req.body as { messages?: unknown } | null;
    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      res.status(400).json({ error: 'Send at least one message to Campus AI.' });
      return;
    }

    const messages: ChatHistoryTurn[] = body.messages
      .filter(
        (m): m is { role: unknown; text: unknown } =>
          Boolean(m) && typeof m === 'object' && typeof (m as { text?: unknown }).text === 'string'
      )
      .map((m) => ({
        role: m.role === 'model' ? ('model' as const) : ('user' as const),
        text: String(m.text),
      }));

    if (messages.length === 0) {
      res.status(400).json({ error: 'Chat message cannot be empty.' });
      return;
    }

    const caller = await verifyFirebaseCaller(req);
    const callerRole: UserRole = caller?.role ?? 'student';
    const supabase = getSupabaseAdmin();

    let hubs: CampusHub[] = [];
    let clubs: ReturnType<typeof mapSupabaseClubRow>[] = [];
    let events: ReturnType<typeof mapSupabaseEventRow>[] = [];

    if (supabase) {
      const [hubsRes, clubsRes] = await Promise.all([
        supabase
          .from('hubs')
          .select('*')
          .eq('visibility', 'campus')
          .order('created_at', { ascending: false }),
        supabase
          .from('clubs')
          .select('*')
          .eq('visibility', 'campus')
          .order('created_at', { ascending: false }),
      ]);

      if (!hubsRes.error && hubsRes.data) {
        hubs = (hubsRes.data as SupabaseHubRow[]).map(mapSupabaseHubRow);
      }
      if (!clubsRes.error && clubsRes.data) {
        clubs = (clubsRes.data as SupabaseClubRow[]).map(mapSupabaseClubRow);
      }

      if (caller?.role === 'super_admin') {
        const evRes = await supabase.from('events').select('*').order('date', { ascending: true });
        if (!evRes.error && evRes.data) {
          events = (evRes.data as SupabaseEventRow[]).map(mapSupabaseEventRow);
        }
      } else if (caller) {
        const evRes = await supabase
          .from('events')
          .select('*')
          .or(`status.eq.approved,author_uid.eq.${caller.uid}`)
          .order('date', { ascending: true });
        if (!evRes.error && evRes.data) {
          events = (evRes.data as SupabaseEventRow[]).map(mapSupabaseEventRow);
        }
      } else {
        const evRes = await supabase
          .from('events')
          .select('*')
          .eq('status', 'approved')
          .order('date', { ascending: true });
        if (!evRes.error && evRes.data) {
          events = (evRes.data as SupabaseEventRow[]).map(mapSupabaseEventRow);
        }
      }
    }

    try {
      const result = await runCampusChatTurn(messages, {
        todayIso: getTodayIsoDate(),
        callerRole,
        events,
        hubs,
        clubs,
      });
      res.json(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to reach Campus AI right now.';
      const lower = message.toLowerCase();
      const status =
        lower.includes('not configured') ||
        lower.includes('high demand') ||
        lower.includes('unavailable')
          ? 503
          : lower.includes('quota')
            ? 429
            : 500;
      res.status(status).json({ error: message });
    }
  });

  app.use('/api/campus', router);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`CollegeConnect server listening on http://0.0.0.0:${port}`);
  });
}

void createServer();
