import { ScreenHandoffSpec, ScreenId } from '../types/collegeConnect';

export const HANDOFF_SPECS: Record<ScreenId, ScreenHandoffSpec> = {
  welcome: {
    screenId: 'welcome',
    title: 'Welcome & Campus Onboarding',
    expoRoute: 'app/(auth)/welcome.tsx',
    purpose:
      'Establishes CollegeConnect warm-ivory and forest-green campus identity and introduces events, notices, hubs, and calendar in two calm frames.',
    componentHierarchy: [
      'SafeAreaView (edges=["top","bottom"])',
      '  └─ View (flex-1, justifyContent: "space-between")',
      '       ├─ CampusDoodleHeader (crown + airplane SVG)',
      '       ├─ BrandLockup (Caveat 52px "CollegeConnect" + subtitle)',
      '       ├─ HangingKraftNote ("Events · Notices · Hubs & More")',
      '       ├─ CampusClocktowerIllustration (responsive SVG)',
      '       └─ Pressable CTA ("Get Started →", minHeight: 52)',
    ],
    spacingTokens: [
      'Screen gutter: 24px horizontal',
      'Vertical rhythm: 16px / 24px / 32px (8pt scale)',
      'Primary CTA height: 52px, borderRadius: 999',
    ],
    typographyTokens: [
      'Wordmark accent: Caveat Bold · 44–52px / lineHeight 54px',
      'Tagline: Caveat Medium · 22px',
      'CTA label: Plus Jakarta Sans SemiBold · 15px',
    ],
    colorTokens: {
      light: ['Canvas #F5F2EB', 'Kraft Note #E8D5B7', 'Forest CTA #1C3B2B'],
      oledDark: ['Canvas #000000', 'Kraft Note #231E15', 'Emerald CTA #2D6A4F'],
    },
    interactionBehavior: [
      'Horizontal swipe or pagination toggle previews Campus Story ("More than just events").',
      'Primary CTA sets onboardingComplete=true in AsyncStorage and navigates to Home.',
    ],
    rolePermissions: {
      student: 'Standard onboarding entry.',
      faculty: 'Standard onboarding entry.',
      club_incharge: 'Standard onboarding entry.',
      hub_incharge: 'Standard onboarding entry.',
      super_admin: 'Standard onboarding entry.',
    },
    responsiveRules: [
      'iOS: Respects top notch & bottom home indicator via SafeAreaView.',
      'Android: Edge-to-edge status bar with dark/light icon contrast.',
      'Tablet/Large: Centers content inside maxWidth 480px with balanced vertical breathing room.',
    ],
  },
  home: {
    screenId: 'home',
    title: 'Home Dashboard',
    expoRoute: 'app/(tabs)/home.tsx',
    purpose:
      'Primary campus pulse combining personalized greeting, quick search, 4 core category tiles, Featured Event spotlight, and Upcoming Events.',
    componentHierarchy: [
      'SafeAreaView (flex-1)',
      '  └─ ScrollView (stickyHeaderIndices=[0], contentContainerStyle pb: 100)',
      '       ├─ TopGreetingBar (Name + Subtitle + Avatar + BellBadge)',
      '       ├─ SearchTriggerInput (minHeight: 48, borderRadius: 16)',
      '       ├─ QuickCategoryRow (Events · Notices · Hubs · Calendar)',
      '       ├─ FeaturedEventCard (tilted hero card + dark gradient scrim)',
      '       └─ UpcomingEventsSection (Header + "See all →" + EventRowCard[])',
    ],
    spacingTokens: [
      'Screen gutter: 16px horizontal',
      'Section spacing: 24px',
      'Quick category tile height: 84px, gap: 10px',
      'Card padding: 14px, borderRadius: 20px',
    ],
    typographyTokens: [
      'Greeting: Caveat Bold · 30px / Plus Jakarta Sans Regular · 13px subtitle',
      'Section title: Plus Jakarta Sans Bold · 17px',
      'Featured title: Caveat Bold · 30px over measured dark scrim',
    ],
    colorTokens: {
      light: ['Canvas #F5F2EB', 'Surface #FFFFFF', 'Active Tile #1C3B2B'],
      oledDark: [
        'Canvas #000000',
        'Surface #0C0F0D + 1px rgba(255,255,255,0.11)',
        'Active Tile #2D6A4F',
      ],
    },
    interactionBehavior: [
      'Search input filters live or navigates into Explore with active query.',
      'Bell icon navigates to Notifications with unread count badge.',
      'Category tiles route directly to Explore, Announcements, Hubs & Clubs, or Calendar.',
    ],
    rolePermissions: {
      student: 'Read & discover campus feed; register/save events.',
      faculty: 'Shows quick "Publish Official Notice / Event" shortcut card.',
      club_incharge: 'Shows quick "Publish Club Event / Notice" shortcut card.',
      hub_incharge: 'Shows quick "Manage Hub & Publish" shortcut card.',
      super_admin: 'Shows "Pending Approvals, Roles & Publish" admin banner.',
    },
    responsiveRules: [
      'Mobile (<768px): 4-column category tiles, single-column Upcoming list.',
      'Tablet/Desktop (>=768px): Featured card + Upcoming list pair side-by-side.',
    ],
  },
  explore: {
    screenId: 'explore',
    title: 'Explore Events',
    expoRoute: 'app/(tabs)/explore.tsx',
    purpose:
      'Searchable, filterable directory of all approved university events with category chips and filter bottom sheet.',
    componentHierarchy: [
      'SafeAreaView (flex-1)',
      '  ├─ ScreenTitleHeader ("Explore" + "Find what excites you.")',
      '  ├─ SearchWithFilterBar (TextInput + FilterSheetTrigger)',
      '  ├─ HorizontalCategoryChips (ScrollView horizontal)',
      '  └─ FlatList (EventListCard[], SkeletonCard on loading, EmptyState on 0 matches)',
    ],
    spacingTokens: [
      'Horizontal gutter: 16px',
      'Chip height: 36px (hitbox 44px), gap: 8px',
      'Event row thumbnail: 76x76px, borderRadius: 14px',
    ],
    typographyTokens: [
      'Header: Caveat Bold · 34px',
      'Card title: Plus Jakarta Sans SemiBold · 15px',
      'Metadata: Plus Jakarta Sans Regular · 12px · tabular-nums',
    ],
    colorTokens: {
      light: ['Canvas #F5F2EB', 'Card #FFFFFF', 'Selected Chip #1C3B2B'],
      oledDark: ['Canvas #000000', 'Card #0C0F0D', 'Selected Chip #2D6A4F'],
    },
    interactionBehavior: [
      'Category chips and search filter immediately with zero network wait.',
      'Filter sheet toggles Free Entry Only, Hub filter, and Date Sort.',
      'Bookmark icon toggles saved state independently of row press.',
    ],
    rolePermissions: {
      student: 'Views approved events only.',
      faculty: 'Views approved events + own departmental drafts.',
      club_incharge: 'Views approved events + own club drafts.',
      hub_incharge: 'Views approved events + "+ Publish" trigger for hub events.',
      super_admin: 'Views approved & pending events with quick approval badge.',
    },
    responsiveRules: [
      'Mobile: Single-column FlatList.',
      'Tablet/Desktop: 2-column grid layout with sticky filter header.',
    ],
  },
  event_detail: {
    screenId: 'event_detail',
    title: 'Event Detail',
    expoRoute: 'app/events/[id].tsx',
    purpose:
      'Full-bleed event hero, structured logistics, student registration action, and role-gated attendee/approval controls.',
    componentHierarchy: [
      'View (flex-1)',
      '  ├─ ScrollView (bounces: true)',
      '  │    ├─ CurvedHeroArtwork (Back + Bookmark Floating Buttons + Kraft Note)',
      '  │    ├─ EventMetaContent (Category · Title · Description)',
      '  │    └─ LogisticsList (Date/Time · Venue · Entry · Organizing Hub · Seats)',
      '  └─ StickyBottomActionBar ("Register Now →" + Save + Share)',
    ],
    spacingTokens: [
      'Hero height: 260px with curved bottom wave cutout',
      'Floating icon buttons: 44x44px circular touch target',
      'Logistics row height: 48px, gap: 12px',
    ],
    typographyTokens: [
      'Event title: Caveat Bold · 34px',
      'Body description: Plus Jakarta Sans Regular · 15px / lineHeight 24px',
      'Seats & dates: Plus Jakarta Sans Medium · 14px · tabular-nums',
    ],
    colorTokens: {
      light: ['Canvas #F5F2EB', 'CTA #1C3B2B', 'Kraft Tag #E8D5B7'],
      oledDark: ['Canvas #000000', 'CTA #2D6A4F', 'Kraft Tag #231E15'],
    },
    interactionBehavior: [
      'Register Now toggles registration state, updates seat count, and triggers Success confirmation.',
      'Share copies structured event invite summary and confirms via toast.',
      'Authorized Hub In-charge / Super Admin can open Attendee Roster or Approve pending event.',
    ],
    rolePermissions: {
      student: 'Register / Cancel registration, Save, Share.',
      faculty: 'Same as Student + Edit note if author.',
      club_incharge: 'View registered student roster for club events.',
      hub_incharge: 'View registered student roster for their Hub events.',
      super_admin: 'Approve/Unpublish event + view full attendee roster.',
    },
    responsiveRules: [
      'iOS: Swipe-back gesture supported; bottom bar respects home indicator.',
      'Desktop: Hero artwork and details adapt cleanly without horizontal overflow.',
    ],
  },
  hubs: {
    screenId: 'hubs',
    title: 'Hubs & Clubs Directory',
    expoRoute: 'app/(tabs)/hubs.tsx',
    purpose:
      'Centralizes university Hubs and student Clubs with membership toggles and Hub In-charge visibility.',
    componentHierarchy: [
      'SafeAreaView (flex-1)',
      '  └─ ScrollView',
      '       ├─ Header ("Hubs & Clubs")',
      '       ├─ HubFilterPills (All Hubs + 4 Campus Hubs)',
      '       ├─ HubSummaryCard (In-Charge + Building + Active Events)',
      '       └─ ClubCardList (Club info + Join/Joined Pressable)',
    ],
    spacingTokens: [
      'Gutter: 16px',
      'Hub card radius: 20px, padding: 16px',
      'Join button minHeight: 40px, horizontal padding: 16px',
    ],
    typographyTokens: [
      'Screen heading: Caveat Bold · 34px',
      'Club title: Plus Jakarta Sans Bold · 16px',
      'Schedule & member count: 12px tabular-nums',
    ],
    colorTokens: {
      light: ['Canvas #F5F2EB', 'Surface #FFFFFF', 'Joined State #CED8CA / #1C3B2B'],
      oledDark: ['Canvas #000000', 'Surface #0C0F0D', 'Joined State #1A2720 / #74B492'],
    },
    interactionBehavior: [
      'Selecting a Hub filters its constituent Clubs.',
      'Tapping Join/Joined updates club member count and Profile stats immediately.',
    ],
    rolePermissions: {
      student: 'Browse hubs & join/leave clubs.',
      faculty: 'Browse hubs & view faculty advisor contact.',
      club_incharge: 'Displays "Managed by You" badge on assigned Club.',
      hub_incharge: 'Displays "Managed by You" badge on assigned Hub + Publish Hub Event shortcut.',
      super_admin: 'Displays governance overview across all Hubs & Clubs.',
    },
    responsiveRules: ['Mobile: Stacked Hub selector & Club cards.', 'Desktop: 2-column Club grid.'],
  },
  announcements: {
    screenId: 'announcements',
    title: 'Official Announcements',
    expoRoute: 'app/announcements.tsx',
    purpose:
      'Verified campus notices from Administration, Exam Cell, Faculty, and Hub In-charges with pinned priority.',
    componentHierarchy: [
      'SafeAreaView (flex-1)',
      '  ├─ HeaderWithBack ("Announcements")',
      '  ├─ CategoryTabs (All · Exam · Academic · Hostel · General)',
      '  └─ SectionList (Pinned Notices + Recent Notices)',
    ],
    spacingTokens: ['Gutter: 16px', 'Notice card padding: 16px, radius: 18px, gap: 12px'],
    typographyTokens: [
      'Title: Plus Jakarta Sans Bold · 15px',
      'Issuer & timestamp: 12px muted',
      'Body: 14px / lineHeight 21px',
    ],
    colorTokens: {
      light: ['Canvas #F5F2EB', 'Pinned Tint #E8D5B7/40', 'Unread Dot #1C3B2B'],
      oledDark: ['Canvas #000000', 'Pinned Tint #231E15', 'Unread Dot #74B492'],
    },
    interactionBehavior: [
      'Tapping a notice marks it read and expands full official details.',
      'Bookmark action saves notice into the Saved screen.',
    ],
    rolePermissions: {
      student: 'Read-only access; mark read & bookmark.',
      faculty: 'Can publish official Academic/General announcements.',
      club_incharge: 'Can publish Club-scoped announcements.',
      hub_incharge: 'Can publish Hub-scoped announcements.',
      super_admin: 'Can publish & pin university-wide Exam/Hostel/Academic announcements.',
    },
    responsiveRules: [
      'All viewports: Clean single reading measure (max 68ch) for comfortable legibility.',
    ],
  },
  calendar: {
    screenId: 'calendar',
    title: 'Campus Calendar',
    expoRoute: 'app/(tabs)/calendar.tsx',
    purpose:
      'Month-at-a-glance academic & event schedule with date markers and selected-day agenda list.',
    componentHierarchy: [
      'SafeAreaView (flex-1)',
      '  └─ ScrollView',
      '       ├─ Header ("Calendar" + "Your month at a glance.")',
      '       ├─ MonthCard (Prev/Next Month + 7-col Weekday Grid)',
      '       └─ SelectedDayAgenda (Date Banner + Event/Notice Cards)',
    ],
    spacingTokens: [
      'Calendar cell touch target: 44x44px',
      'Month card padding: 16px, borderRadius: 24px',
    ],
    typographyTokens: [
      'Heading: Caveat Bold · 34px',
      'Month label: Plus Jakarta Sans Bold · 16px',
      'Day numbers: Plus Jakarta Sans Medium · 14px · tabular-nums',
    ],
    colorTokens: {
      light: ['Canvas #F5F2EB', 'Selected Day #1C3B2B', 'Card #FFFFFF'],
      oledDark: ['Canvas #000000', 'Selected Day #2D6A4F', 'Card #0C0F0D'],
    },
    interactionBehavior: [
      'Tapping any day updates the agenda list below immediately.',
      'Dates with events/notices display subtle indicator dots underneath the numeral.',
    ],
    rolePermissions: {
      student: 'View campus calendar & open event details.',
      faculty: 'Quick "Add Event on Date" shortcut for authorized dates.',
      club_incharge: 'Quick "Schedule Club Event" shortcut.',
      hub_incharge: 'Quick "Schedule Hub Event" shortcut.',
      super_admin: 'Full schedule visibility including pending events.',
    },
    responsiveRules: [
      'Mobile: Month grid above agenda list.',
      'Desktop: Side-by-side month grid and agenda feed.',
    ],
  },
  saved: {
    screenId: 'saved',
    title: 'Saved & Registrations',
    expoRoute: 'app/(tabs)/saved.tsx',
    purpose:
      'Combines student Registered Events (with digital check-in passes) and Saved Events & Announcements.',
    componentHierarchy: [
      'SafeAreaView (flex-1)',
      '  ├─ ScreenHeader ("Saved & Passes")',
      '  ├─ SegmentedControl ("My Registrations" | "Saved Items")',
      '  └─ FlatList (PassCard[] or SavedItemCard[])',
    ],
    spacingTokens: [
      'Segmented control height: 44px, radius: 14px',
      'Card padding: 14px, gap: 12px',
    ],
    typographyTokens: [
      'Heading: Caveat Bold · 34px',
      'Pass ID: Plus Jakarta Sans SemiBold · 12px · tabular-nums',
    ],
    colorTokens: {
      light: ['Canvas #F5F2EB', 'Pass Accent #CED8CA', 'Surface #FFFFFF'],
      oledDark: ['Canvas #000000', 'Pass Accent #1A2720', 'Surface #0C0F0D'],
    },
    interactionBehavior: [
      'Segmented control switches between active event passes and bookmarked items.',
      'Users can cancel a registration or unbookmark directly with immediate feedback.',
    ],
    rolePermissions: {
      student: 'Personal registrations & saved items.',
      faculty: 'Personal registrations & saved items.',
      club_incharge: 'Personal registrations & saved items.',
      hub_incharge: 'Personal registrations & saved items.',
      super_admin: 'Personal registrations & saved items.',
    },
    responsiveRules: ['Mobile: Full-width stacked cards.', 'Desktop: 2-column card layout.'],
  },
  notifications: {
    screenId: 'notifications',
    title: 'Notifications',
    expoRoute: 'app/notifications.tsx',
    purpose:
      'Timely campus alerts for event reminders, official notices, club updates, and approval statuses.',
    componentHierarchy: [
      'SafeAreaView (flex-1)',
      '  ├─ HeaderWithBadge ("Notifications" + Bell Count + "Mark all read")',
      '  └─ FlatList (NotificationRow[] with icon + title + body + timeAgo)',
    ],
    spacingTokens: [
      'Row minHeight: 68px, horizontal padding: 16px, vertical padding: 14px',
      'Icon badge: 40x40px circular container',
    ],
    typographyTokens: [
      'Heading: Caveat Bold · 34px',
      'Row title: Plus Jakarta Sans SemiBold · 14px',
      'Timestamp: 12px tabular-nums',
    ],
    colorTokens: {
      light: ['Canvas #F5F2EB', 'Unread Row #FFFFFF', 'Hairline Divider rgba(26,36,30,0.08)'],
      oledDark: ['Canvas #000000', 'Unread Row #0D1410', 'Hairline Divider rgba(255,255,255,0.09)'],
    },
    interactionBehavior: [
      'Tapping a notification marks it read and deep-links to its target Event, Notice, or Hub.',
      '"Mark all read" clears all unread states in one tap.',
    ],
    rolePermissions: {
      student: 'Receives reminders, announcements, club updates & new events.',
      faculty: 'Also receives publish confirmations.',
      club_incharge: 'Also receives club event & role notifications.',
      hub_incharge: 'Also receives hub roster & submission updates.',
      super_admin: 'Also receives pending approval alerts.',
    },
    responsiveRules: ['Consistent full-bleed hairline list layout across all phone widths.'],
  },
  profile: {
    screenId: 'profile',
    title: 'Profile & Summary',
    expoRoute: 'app/(tabs)/profile.tsx',
    purpose:
      'Displays campus identity, current role permissions summary, 3 live engagement counters, and account navigation.',
    componentHierarchy: [
      'View (flex-1)',
      '  ├─ CurvedDarkHeader (Avatar + Name + Program/Role + Settings Icon)',
      '  ├─ StatTileRow (Events Joined · Clubs · Saved)',
      '  └─ MenuList (My Registrations · Saved · Notifications · Help · Settings)',
    ],
    spacingTokens: [
      'Header bottom curve padding: 24px',
      '3-column stat grid gap: 10px, card radius: 16px',
      'Menu row minHeight: 56px',
    ],
    typographyTokens: [
      'Name: Plus Jakarta Sans Bold · 20px',
      'Stat figures: Plus Jakarta Sans Bold · 22px · tabular-nums',
      'Menu labels: Plus Jakarta Sans Medium · 15px',
    ],
    colorTokens: {
      light: ['Header #1C3B2B', 'Canvas #F5F2EB', 'Menu Surface #FFFFFF'],
      oledDark: ['Header #0D1611', 'Canvas #000000', 'Menu Surface #0C0F0D'],
    },
    interactionBehavior: [
      'Stat tiles tap directly into Registrations, Hubs & Clubs, or Saved.',
      'Authorized roles see an "Official Publishing & Governance" shortcut row.',
    ],
    rolePermissions: {
      student: 'Standard student profile & personal stats.',
      faculty: 'Shows Faculty badge + Publish shortcut.',
      club_incharge: 'Shows Club In-charge badge + Publish shortcut.',
      hub_incharge: 'Shows Hub In-charge badge + Hub Management shortcut.',
      super_admin: 'Shows Super Admin badge + Approval Queue + Role Management.',
    },
    responsiveRules: [
      'Mobile: Edge-to-edge curved header.',
      'Desktop: Profile header card + 2-column menu layout.',
    ],
  },
  settings: {
    screenId: 'settings',
    title: 'Settings & Preferences',
    expoRoute: 'app/settings.tsx',
    purpose:
      'Controls Pure-Black OLED Dark Theme, iOS/Android convention preview, Role Inspector, profile details, and demo reset.',
    componentHierarchy: [
      'SafeAreaView (flex-1)',
      '  └─ ScrollView',
      '       ├─ HeaderWithBack ("Settings")',
      '       ├─ AppearanceCard (System · Light · Pure OLED Dark)',
      '       ├─ PlatformPreviewCard (iOS · Android)',
      '       ├─ ProfileEditorCard (Name · Program/Department)',
      '       └─ ActionsCard (Replay Welcome · Reset Campus Data)',
    ],
    spacingTokens: [
      'Section gap: 16px',
      'Option button minHeight: 44px',
      'Card radius: 20px, padding: 16px',
    ],
    typographyTokens: [
      'Section label: Plus Jakarta Sans Bold · 13px',
      'Control label: Plus Jakarta Sans Medium · 14px',
    ],
    colorTokens: {
      light: ['Canvas #F5F2EB', 'Active Option #1C3B2B'],
      oledDark: ['Canvas #000000', 'Active Option #2D6A4F'],
    },
    interactionBehavior: [
      'Theme selector switches between System auto-detect, Light Ivory, and Pure Black OLED immediately.',
      'Platform toggle previews iOS vs. Android header/tab bar conventions.',
    ],
    rolePermissions: {
      student: 'Full access to personal theme & profile preferences.',
      faculty: 'Full access to personal theme & profile preferences.',
      club_incharge: 'Full access to personal theme & profile preferences.',
      hub_incharge: 'Full access to personal theme & profile preferences.',
      super_admin: 'Full access to personal theme, profile & Role Management shortcut.',
    },
    responsiveRules: ['All controls stay single-line with >= 44px hit areas.'],
  },
  login: {
    screenId: 'login',
    title: 'Campus Sign In',
    expoRoute: 'app/(auth)/login.tsx',
    purpose:
      'Authenticates students, faculty, hub in-charges, and super admins using campus email and password with forgot-password and new-user routing.',
    componentHierarchy: [
      'SafeAreaView (flex-1)',
      '  └─ ScrollView (keyboardShouldPersistTaps="handled")',
      '       ├─ TopBackRow + Crown/Swirl Doodles',
      '       ├─ HandwrittenHeader ("Sign In" + "Your campus, one tap away.")',
      '       ├─ FormCard (Email Input + Password Input w/ Eye Toggle + "Forgot password?")',
      '       ├─ PrimaryCTA ("Sign In →", minHeight: 50)',
      '       ├─ QuickDemoPersonas (Student · Faculty · Hub · Admin)',
      '       └─ FooterLink ("New to CollegeConnect? Create Account")',
    ],
    spacingTokens: [
      'Screen gutter: 20px horizontal',
      'Input height: 48px, borderRadius: 14px',
      'Primary CTA minHeight: 50px, borderRadius: 999',
    ],
    typographyTokens: [
      'Header: Kalam Bold · 36px',
      'Input text: Plus Jakarta Sans Regular · 14px',
      'Action links: Plus Jakarta Sans Bold · 13px',
    ],
    colorTokens: {
      light: ['Canvas #F4F1EA', 'Form Card #FAF8F3', 'CTA #1E3A2B'],
      oledDark: ['Canvas #000000', 'Form Card #0C100E', 'CTA #244B37'],
    },
    interactionBehavior: [
      'Inline validation checks email format and password before signing in.',
      'Password visibility toggle maintains >= 44px touch target.',
      'Quick Demo Sign-In populates & enters any of the 4 campus RBAC roles.',
    ],
    rolePermissions: {
      student: 'Signs into personal campus feed & registrations.',
      faculty: 'Signs into faculty publishing & official notices.',
      club_incharge: 'Signs into assigned Club publishing & rosters.',
      hub_incharge: 'Signs into assigned Hub management.',
      super_admin: 'Signs into full governance, role management & approval console.',
    },
    responsiveRules: ['Scrolls cleanly above soft keyboard on compact 360px devices.'],
  },
  signup: {
    screenId: 'signup',
    title: 'Create New User Account',
    expoRoute: 'app/(auth)/signup.tsx',
    purpose:
      'Registers new student accounts with university email, department details, and password confirmation while enforcing role governance.',
    componentHierarchy: [
      'SafeAreaView (flex-1)',
      '  └─ ScrollView (keyboardShouldPersistTaps="handled")',
      '       ├─ BackHeader + HandwrittenTitle ("Create Account")',
      '       ├─ FormCard (Full Name · University Email · Program · Year · Password · Confirm)',
      '       ├─ GovernanceNote (Student role assigned on self-signup)',
      '       └─ PrimaryCTA ("Create Account →") + SignInLink',
    ],
    spacingTokens: [
      'Screen gutter: 20px horizontal',
      'Field spacing: 12px',
      'Input minHeight: 46px',
    ],
    typographyTokens: [
      'Title: Kalam Bold · 34px',
      'Field labels: Plus Jakarta Sans SemiBold · 12px',
    ],
    colorTokens: {
      light: ['Canvas #F4F1EA', 'Kraft Governance Note #E6D5B8', 'CTA #1E3A2B'],
      oledDark: ['Canvas #000000', 'Kraft Note #252017', 'CTA #244B37'],
    },
    interactionBehavior: [
      'Validates unique campus email, >= 6 character password, and matching confirmation.',
      'Persists new account to AsyncStorage / localStorage and signs directly into Home.',
    ],
    rolePermissions: {
      student: 'Default role assigned on public self-registration.',
      faculty: 'Provisioned by Super Admin in Role Management.',
      club_incharge: 'Provisioned by Super Admin in Role Management.',
      hub_incharge: 'Provisioned by Super Admin in Role Management.',
      super_admin: 'Provisioned by Super Admin in Role Management.',
    },
    responsiveRules: [
      'Two-column compact row for Program and Year stacks cleanly on narrow screens.',
    ],
  },
  forgot_password: {
    screenId: 'forgot_password',
    title: 'Forgot & Reset Password',
    expoRoute: 'app/(auth)/forgot-password.tsx',
    purpose:
      'Guides users through verifying their campus email, entering a 6-digit recovery code, and setting a new password.',
    componentHierarchy: [
      'SafeAreaView (flex-1)',
      '  └─ ScrollView',
      '       ├─ BackHeader + HandwrittenTitle ("Reset Password")',
      '       ├─ StepIndicator (1. Email · 2. Verify & Reset · 3. Done)',
      '       ├─ StepFormCard (Email input OR 6-digit OTP + New Password)',
      '       └─ PrimaryCTA + ReturnToLoginLink',
    ],
    spacingTokens: [
      'Screen gutter: 20px horizontal',
      'Card padding: 18px, borderRadius: 22px',
      'Primary CTA minHeight: 50px',
    ],
    typographyTokens: [
      'Title: Kalam Bold · 34px',
      'OTP & Codes: Plus Jakarta Sans Bold · tabular-nums',
    ],
    colorTokens: {
      light: ['Canvas #F4F1EA', 'Kraft Demo Code Note #E6D5B8', 'CTA #1E3A2B'],
      oledDark: ['Canvas #000000', 'Kraft Note #252017', 'CTA #244B37'],
    },
    interactionBehavior: [
      'Step 1 validates registered campus email and issues a 6-digit recovery code.',
      'Step 2 verifies the code and updates the stored account password.',
      'Step 3 confirms password update and pre-fills the login email.',
    ],
    rolePermissions: {
      student: 'Available for all registered campus accounts.',
      faculty: 'Available for all registered campus accounts.',
      club_incharge: 'Available for all registered campus accounts.',
      hub_incharge: 'Available for all registered campus accounts.',
      super_admin: 'Available for all registered campus accounts.',
    },
    responsiveRules: ['Centered single-column form card with >= 44px touch targets.'],
  },
  role_management: {
    screenId: 'role_management',
    title: 'Super Admin Role Governance',
    expoRoute: 'app/admin/roles.tsx',
    purpose:
      'Enables Super Admins to divide campus responsibilities across Students, Faculty, Club In-charges, Hub In-charges, and delegated Super Admins with Hub/Club scope assignment and email pre-invites.',
    componentHierarchy: [
      'SafeAreaView (flex-1)',
      '  ├─ ScreenHeader ("Role Management" + "+ Pre-Assign")',
      '  ├─ SearchInput + RoleSummaryFilterChips',
      '  ├─ ScrollView (RegisteredUserCard[] + PendingRoleInviteCard[])',
      '  └─ SmoothBottomSheet (Role, Assigned Hub, Assigned Club & Title Editor)',
    ],
    spacingTokens: [
      'Screen gutter: 16px horizontal',
      'Card padding: 14px, borderRadius: 20px, gap: 10px',
    ],
    typographyTokens: [
      'Header: Caveat Bold · 32px',
      'User name: Plus Jakarta Sans Bold · 15px',
      'Role & scope metadata: Plus Jakarta Sans Medium · 12px',
    ],
    colorTokens: {
      light: ['Canvas #F5F2EB', 'Surface #FFFFFF', 'Active Role #1C3B2B'],
      oledDark: ['Canvas #000000', 'Surface #0C0F0D', 'Active Role #2D6A4F'],
    },
    interactionBehavior: [
      'Super Admin searches campus accounts, filters by role, and updates role + hub/club scope atomically in Firestore.',
      'Email pre-assignments automatically grant the chosen role when the user next signs in with verified Google Auth.',
    ],
    rolePermissions: {
      student: 'Access denied (redirects or shows restricted notice).',
      faculty: 'Access denied.',
      club_incharge: 'Access denied.',
      hub_incharge: 'Access denied.',
      super_admin: 'Full read & write governance over campus user roles and assignments.',
    },
    responsiveRules: ['All role chips and hub/club pickers wrap cleanly across mobile & tablet widths.'],
  },
  assistant: {
    screenId: 'assistant',
    title: 'Campus AI Event Assistant',
    expoRoute: 'app/assistant.tsx',
    purpose:
      'Multi-turn Gemini chatbot grounded in live campus events so students can discover events by interest, category, date, or fee.',
    componentHierarchy: [
      'SafeAreaView (flex-1)',
      '  ├─ ScreenHeader ("Campus AI" + Clear Thread button)',
      '  ├─ ScrollView (StarterPromptsCard + MessageBubble[] + Matched EventRowCard[])',
      '  └─ BottomComposer (Prompt TextInput + Send Button)',
    ],
    spacingTokens: [
      'Screen gutter: 16px horizontal',
      'Message bubble padding: 14px, borderRadius: 18px, gap: 12px',
    ],
    typographyTokens: [
      'Header: Caveat Bold · 32px',
      'Chat body: Plus Jakarta Sans Regular/Medium · 14px',
      'Starter chips: Plus Jakarta Sans SemiBold · 12px',
    ],
    colorTokens: {
      light: ['Canvas #F5F2EB', 'User Bubble #1C3B2B', 'AI Bubble #FFFFFF'],
      oledDark: ['Canvas #000000', 'User Bubble #244B37', 'AI Bubble #0C0F0D'],
    },
    interactionBehavior: [
      'Calls /api/campus/chat backed by server-side Gemini gemini-4-hydrogen and live Supabase event catalog.',
      'Renders interactive EventRowCard matches inside AI responses for one-tap detail view or bookmarking.',
    ],
    rolePermissions: {
      student: 'Full conversational discovery across approved campus events.',
      faculty: 'Full discovery across approved and self-authored pending events.',
      club_incharge: 'Full discovery across approved and club-authored pending events.',
      hub_incharge: 'Full discovery across approved and hub-authored events.',
      super_admin: 'Full discovery across all approved and pending campus events.',
    },
    responsiveRules: ['Composer bar remains pinned above the keyboard and scales cleanly across mobile & wide preview frames.'],
  },
};
