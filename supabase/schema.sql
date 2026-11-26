-- CollegeConnect Non-Auth Campus Data Schema for Supabase (PostgreSQL)
-- Run this script once in the Supabase Dashboard SQL Editor.
-- Auth & RBAC user profiles remain in Firebase Auth / Firestore; all campus
-- catalog and user activity data live in these Supabase tables.

CREATE TABLE IF NOT EXISTS public.hubs (
  id text PRIMARY KEY,
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  focus text NOT NULL CHECK (char_length(focus) BETWEEN 4 AND 240),
  in_charge_name text NOT NULL CHECK (char_length(in_charge_name) BETWEEN 2 AND 80),
  building text NOT NULL CHECK (char_length(building) BETWEEN 1 AND 100),
  active_events_count integer NOT NULL DEFAULT 0 CHECK (active_events_count >= 0),
  visibility text NOT NULL DEFAULT 'campus' CHECK (visibility IN ('campus')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clubs (
  id text PRIMARY KEY,
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  hub_id text NOT NULL REFERENCES public.hubs(id) ON DELETE CASCADE,
  hub_name text NOT NULL CHECK (char_length(hub_name) BETWEEN 2 AND 100),
  tagline text NOT NULL CHECK (char_length(tagline) BETWEEN 4 AND 240),
  meeting_schedule text NOT NULL CHECK (char_length(meeting_schedule) BETWEEN 2 AND 80),
  location text NOT NULL CHECK (char_length(location) BETWEEN 1 AND 100),
  member_count integer NOT NULL DEFAULT 0 CHECK (member_count >= 0),
  lead_name text NOT NULL CHECK (char_length(lead_name) BETWEEN 2 AND 80),
  visibility text NOT NULL DEFAULT 'campus' CHECK (visibility IN ('campus')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.events (
  id text PRIMARY KEY,
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  category text NOT NULL CHECK (category IN ('Cultural', 'Tech', 'Sports', 'Workshop', 'Competition', 'Social')),
  date text NOT NULL CHECK (date ~ '^\d{4}-\d{2}-\d{2}$'),
  date_display text NOT NULL CHECK (char_length(date_display) BETWEEN 4 AND 32),
  time text NOT NULL CHECK (char_length(time) BETWEEN 2 AND 32),
  venue text NOT NULL CHECK (char_length(venue) BETWEEN 2 AND 100),
  entry_label text NOT NULL CHECK (char_length(entry_label) BETWEEN 2 AND 40),
  is_free boolean NOT NULL DEFAULT true,
  description text NOT NULL CHECK (char_length(description) BETWEEN 8 AND 1200),
  highlights text[] NOT NULL DEFAULT '{}',
  hub_id text NOT NULL REFERENCES public.hubs(id) ON DELETE CASCADE,
  hub_name text NOT NULL CHECK (char_length(hub_name) BETWEEN 2 AND 100),
  organizer_name text NOT NULL CHECK (char_length(organizer_name) BETWEEN 2 AND 80),
  author_uid text NOT NULL CHECK (char_length(author_uid) BETWEEN 1 AND 128),
  author_role text NOT NULL CHECK (author_role IN ('student', 'faculty', 'club_incharge', 'hub_incharge', 'super_admin')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('approved', 'pending')),
  artwork text NOT NULL CHECK (artwork IN ('music_fest', 'open_mic', 'photography', 'business_plan', 'blood_camp', 'hackathon', 'campus_general')),
  featured boolean NOT NULL DEFAULT false,
  note_tag text,
  attendee_count integer NOT NULL DEFAULT 0 CHECK (attendee_count >= 0),
  capacity integer NOT NULL DEFAULT 200 CHECK (capacity >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id text PRIMARY KEY,
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 140),
  category text NOT NULL CHECK (category IN ('Academic', 'Exam', 'Hostel', 'General')),
  issuer_title text NOT NULL CHECK (char_length(issuer_title) BETWEEN 2 AND 120),
  author_uid text NOT NULL CHECK (char_length(author_uid) BETWEEN 1 AND 128),
  author_role text NOT NULL CHECK (author_role IN ('student', 'faculty', 'club_incharge', 'hub_incharge', 'super_admin')),
  summary text NOT NULL CHECK (char_length(summary) BETWEEN 8 AND 1200),
  posted_at text NOT NULL CHECK (char_length(posted_at) BETWEEN 2 AND 32),
  date text NOT NULL CHECK (date ~ '^\d{4}-\d{2}-\d{2}$'),
  pinned boolean NOT NULL DEFAULT false,
  visibility text NOT NULL DEFAULT 'campus' CHECK (visibility IN ('campus')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_registrations (
  user_id text NOT NULL CHECK (char_length(user_id) BETWEEN 1 AND 128),
  event_id text NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);

CREATE TABLE IF NOT EXISTS public.saved_events (
  user_id text NOT NULL CHECK (char_length(user_id) BETWEEN 1 AND 128),
  event_id text NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);

CREATE TABLE IF NOT EXISTS public.saved_announcements (
  user_id text NOT NULL CHECK (char_length(user_id) BETWEEN 1 AND 128),
  announcement_id text NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, announcement_id)
);

CREATE TABLE IF NOT EXISTS public.read_announcements (
  user_id text NOT NULL CHECK (char_length(user_id) BETWEEN 1 AND 128),
  announcement_id text NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, announcement_id)
);

CREATE TABLE IF NOT EXISTS public.club_memberships (
  user_id text NOT NULL CHECK (char_length(user_id) BETWEEN 1 AND 128),
  club_id text NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, club_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id text PRIMARY KEY,
  user_id text NOT NULL CHECK (char_length(user_id) BETWEEN 1 AND 128),
  type text NOT NULL CHECK (type IN ('reminder', 'announcement', 'club', 'approved', 'new_event')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 100),
  message text NOT NULL CHECK (char_length(message) BETWEEN 2 AND 240),
  time_ago text NOT NULL CHECK (char_length(time_ago) BETWEEN 1 AND 32),
  is_read boolean NOT NULL DEFAULT false,
  target_screen text NOT NULL,
  target_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for fast feed, hub, and per-user lookups
CREATE INDEX IF NOT EXISTS idx_clubs_hub_id ON public.clubs(hub_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_hub_id ON public.events(hub_id);
CREATE INDEX IF NOT EXISTS idx_events_author_uid ON public.events(author_uid);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_announcements_date ON public.announcements(date DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

-- Lock down direct browser/anon access via RLS; the Express backend uses SUPABASE_SECRET_KEY
-- after verifying Firebase Auth ID tokens and Firestore RBAC roles.
ALTER TABLE public.hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.read_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Atomic event registration toggle keeping attendee_count in sync
CREATE OR REPLACE FUNCTION public.toggle_event_registration(
  p_user_id text,
  p_event_id text,
  p_register boolean
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_capacity integer;
  v_count integer;
  v_exists boolean;
BEGIN
  SELECT capacity, attendee_count INTO v_capacity, v_count
  FROM public.events
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.event_registrations
    WHERE user_id = p_user_id AND event_id = p_event_id
  ) INTO v_exists;

  IF p_register AND NOT v_exists THEN
    IF v_count >= v_capacity THEN
      RAISE EXCEPTION 'Event capacity reached';
    END IF;
    INSERT INTO public.event_registrations (user_id, event_id)
    VALUES (p_user_id, p_event_id);
    UPDATE public.events
    SET attendee_count = LEAST(capacity, attendee_count + 1), updated_at = now()
    WHERE id = p_event_id
    RETURNING attendee_count INTO v_count;
  ELSIF (NOT p_register) AND v_exists THEN
    DELETE FROM public.event_registrations
    WHERE user_id = p_user_id AND event_id = p_event_id;
    UPDATE public.events
    SET attendee_count = GREATEST(0, attendee_count - 1), updated_at = now()
    WHERE id = p_event_id
    RETURNING attendee_count INTO v_count;
  END IF;

  RETURN v_count;
END;
$$;

-- Atomic club membership toggle keeping member_count in sync
CREATE OR REPLACE FUNCTION public.toggle_club_membership(
  p_user_id text,
  p_club_id text,
  p_join boolean
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
  v_exists boolean;
BEGIN
  SELECT member_count INTO v_count
  FROM public.clubs
  WHERE id = p_club_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Club not found';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.club_memberships
    WHERE user_id = p_user_id AND club_id = p_club_id
  ) INTO v_exists;

  IF p_join AND NOT v_exists THEN
    INSERT INTO public.club_memberships (user_id, club_id)
    VALUES (p_user_id, p_club_id);
    UPDATE public.clubs
    SET member_count = member_count + 1, updated_at = now()
    WHERE id = p_club_id
    RETURNING member_count INTO v_count;
  ELSIF (NOT p_join) AND v_exists THEN
    DELETE FROM public.club_memberships
    WHERE user_id = p_user_id AND club_id = p_club_id;
    UPDATE public.clubs
    SET member_count = GREATEST(0, member_count - 1), updated_at = now()
    WHERE id = p_club_id
    RETURNING member_count INTO v_count;
  END IF;

  RETURN v_count;
END;
$$;
