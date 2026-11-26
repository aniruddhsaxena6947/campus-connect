# CollegeConnect — Pure React Native UI/UX App & Technical Handoff

A complete **React Native TypeScript** implementation of **CollegeConnect**—built strictly with React Native primitives (`View`, `Text`, `Pressable`, `ScrollView`, `FlatList`, `TextInput`, `Switch`, `Modal`, `Animated`, `StyleSheet`, `Platform`, `useWindowDimensions`, `useColorScheme`, and `react-native-svg`) with **zero HTML elements or CSS utility classes** in app screens, compiled to run live in the Vite preview via `react-native-web` while remaining directly portable to **Expo / React Native**.

---

### User Review & Critical Decisions

> [!IMPORTANT] Updated Architecture: Every screen, card, navigation bar, modal, and SVG illustration is now written in genuine **React Native (`react-native` + `react-native-svg`)** using `StyleSheet.create`, `Animated`, and `useWindowDimensions` rather than HTML/CSS.

- **Pure React Native Codebase**: All UI modules import from `'react-native'` and `'react-native-svg'` (no `<div>`, `<span>`, `<button>`, or Tailwind CSS classes inside app components). Vite aliases `'react-native'` to `'react-native-web'` for instant live previewing.
- **Warm Ivory & Forest Green + Pure-Black OLED Dark Mode**: Uses a centralized React Native theme token system synced with `useColorScheme()` (`System`, `Light`, `OLED Dark` `#000000`) and subtle optical contrast adjustments.
- **Strict 4-Role Permissions (`Student`, `Faculty`, `Hub In-charge`, `Super Admin`)**: Official publishing, hub management, and approval queues are strictly gated by role—without inventing backend functionality.
- **Complete Mobile Screens & All 5 UI States**: Full-screen implementations for Onboarding, Home, Explore, Event Detail, Hubs & Clubs, Official Announcements, Calendar, Saved & Registrations, Notifications, Profile & Settings, and Role-Gated Publish/Moderation—each testable across **Default**, **Loading**, **Empty**, **Error**, and **Success** states.
- **Responsive Across All Screen Sizes + Per-Screen Handoff Spec**: Driven by `useWindowDimensions()` to adapt seamlessly between compact mobile (`< 768px` bottom tab bar) and tablet/desktop (`>= 768px` side navigation rail + multi-column grids), with a toggleable **Screen Spec & State Inspector** panel for reviewing component trees, spacing, typography, color tokens, interactions, and iOS/Android platform rules.

---

### 1. Overview & Core Concept

- **What It Does**: **CollegeConnect** centralizes university events, official campus announcements, student hubs, clubs, event registrations, and notifications in a genuine React Native mobile interface.
- **Four User Roles & Permission Boundaries**:
  1. **Student**: Browses events, announcements, hubs, and clubs; registers for events; bookmarks items; views personal calendar and registration passes; receives notifications. Cannot publish or edit official campus info.
  2. **Faculty**: Student capabilities plus publishing official academic/exam announcements and proposing department events.
  3. **Hub In-charge**: Manages assigned Hub and Clubs, publishes/updates hub events and notices, and views hub event registration rosters.
  4. **Super Admin**: Full governance—approves or rejects pending events/announcements, manages all hubs/clubs, and oversees campus-wide registrations.
- **Key Value**: Delivers real, reusable React Native (`StyleSheet` + `Animated` + `react-native-svg`) screens and interactive state behavior instead of static HTML mockups.

---

### 2. User Experience, Screens & Visual Design

- **Complete React Native Screen Flow**:
  1. **Welcome & Campus Story**: Full-screen warm ivory / OLED dark intro featuring custom `react-native-svg` campus clocktower & botanical illustrations, `Caveat` display accent (*"Same Campus. Bigger Vibes."*), hanging kraft note card, and **Get Started** `Pressable` CTA, plus swipeable/toggleable *"More than just events — Stay Connected, Stay Ahead"* campus story card.
  2. **Home**: Personalized role/student greeting, avatar & Notification Bell with unread count, search bar, 4 hanging-tag shortcut tiles (**Events**, **Announcements**, **Hubs & Clubs**, **Calendar**), angled **Featured Event** hero card (*Music Fest 2025*), and **Upcoming Events** `FlatList`.
  3. **Explore**: Live `TextInput` search, horizontal `ScrollView` category filter chips (`All`, `Cultural`, `Tech`, `Sports`, `Workshop`, `Academic`), advanced filter `Modal` (free entry, date sort), and `FlatList` event cards.
  4. **Event Detail**: Full-bleed curved-wave `react-native-svg` header, floating back/bookmark `Pressable` icons (`>= 44dp`), metadata rows (date, time, venue, entry, organizing hub), primary **Register Now** `Pressable` (or **View Roster / Approve** for authorized roles), **Save**, and **Share**.
  5. **Hubs & Clubs**: Grouped university Hubs and affiliated Clubs rendered via React Native cards with member counts (`tabular-nums`), schedules, **Join / Joined** toggle, and role-gated **Manage Hub** sheet.
  6. **Official Announcements**: Verified notice feed (`Pinned`, `Academic`, `Exam`, `Hostel`, `General`) with official issuer attribution, read-state indicators, and bookmarking.
  7. **Calendar**: Interactive monthly grid built with pure React Native `View` & `Pressable` cells (`tabular-nums`), event indicator marks, active forest/sage selection circle, and synchronized day-agenda list.
  8. **Saved & My Registrations**: Segmented `Pressable` switch between **My Registrations** (with digital pass confirmation details & cancel flow) and **Saved Bookmarks**.
  9. **Notifications**: Chronological alert list (*Event Reminder*, *Official Announcement*, *Club Update*, *Event Approved*) with mark-all-read and deep-link navigation.
  10. **Profile & Settings**: Curved forest/OLED header (`react-native-svg`), user identity & role badge, 3 live summary stat tiles (**Events Joined**, **Clubs**, **Saved**), menu rows, **Theme Mode** (`System`, `Light`, `OLED Dark`), **iOS / Android** platform ergonomics switch, and **Reset Demo Data**.
  11. **Authorized Publish & Moderation (`+` / Manage)**: Accessible strictly to **Faculty**, **Hub In-charge**, and **Super Admin** via `Modal` slide-up sheet to create official announcements/events or approve pending submissions. Hidden/restricted for **Student**.

- **Visual Tokens (`StyleSheet` Theme Objects)**:
  - **Light Theme (Warm Ivory & Forest Green)**:
    - `background`: `#F5F2EB` | `surface`: `#FFFFFF` | `surfaceMuted`: `#ECE8DF` | `surfaceSage`: `#CED8CA` | `kraftNote`: `#E8D5B7`
    - `primary`: `#1C3B2B` | `primaryText`: `#FFFFFF` | `text`: `#1A241E` | `textMuted`: `#5B665F` | `border`: `rgba(26, 36, 30, 0.10)`
  - **Pure-Black OLED Dark Theme**:
    - `background`: `#000000` | `surface`: `#0D110E` | `surfaceMuted`: `#141916` | `surfaceSage`: `#16241C` | `kraftNote`: `#231E15`
    - `primary`: `#74B492` (with deep forest `#234B36` containers) | `primaryText`: `#04140B` | `text`: `#F3F5F0` | `textMuted`: `#9BA59E` | `border`: `rgba(255, 255, 255, 0.12)`
  - **Typography**:
    - Loaded fonts: `Plus Jakarta Sans` (400, 500, 600, 700) for UI hierarchy and `Caveat` (600, 700) for selective handwritten brand/header accents.
  - **Restrained Native Motion & Touch Ergonomics**:
    - Uses React Native `Animated.timing` / `Animated.spring` strictly on `opacity` and `transform` (`<= 200ms`), respecting reduced-motion settings.
    - All `Pressable` targets maintain `minHeight: 44`, `minWidth: 44` (`48` for primary CTAs).
    - Adapts header alignment, tab bar active indicator, and modal/sheet styling cleanly between **iOS** and **Android** conventions.

- **All 5 Required UI States**:
  - Every primary data view implements **Default**, **Loading** (React Native skeleton blocks), **Empty** (clear guidance & reset/action CTA), **Error** (retry `Pressable`), and **Success** (confirmation banner/toast).

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Genuine `react-native` + `react-native-svg` Bridged via `react-native-web` in Vite**
  - *Chosen Approach*: Author all app screens, theme tokens, layouts, illustrations, and animations strictly using React Native APIs (`react-native` and `react-native-svg`), configured in Vite with `react-native` -> `react-native-web` aliasing.
  - *Why*: Fulfills the explicit requirement that the app be written in React Native rather than HTML and CSS, while still rendering a live, interactive preview directly in the workspace.
  - *Alternatives Considered*: Standard HTML/Tailwind web app with React Native docs—rejected because the user explicitly asked for the app itself to be in React Native.

- **Decision 2: Responsive Breakpoints via `useWindowDimensions()` + Integrated Expo Handoff Drawer**
  - *Chosen Approach*: Compute responsive column counts, padding, and navigation posture (mobile bottom tab bar below `768px`, persistent left rail + multi-column grids at `>= 768px`) inside React Native `View` layouts, paired with an optional **Inspector & RN Handoff** side-drawer/modal for testing roles, states, iOS/Android styles, and viewing each screen's documented spec.
  - *Why*: Ensures every component adapts cleanly across phone, tablet, and desktop widths while keeping the mobile UI unpolluted by developer metadata.
  - *Alternatives Considered*: Hardcoding fixed `375px` mobile dimensions—rejected because the app must remain fully responsive across screen sizes.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **React Native Architecture Diagram**:
```text
┌─────────────────────────────────────────────────────────────────────────┐
│        App Context: Theme (System/Light/OLED) · Role (4) · UI State     │
│        + Cross-Platform Storage Adapter (localStorage / AsyncStorage)   │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
          ┌─────────────────────────┴─────────────────────────┐
          ▼                                                   ▼
┌────────────────────────────────────────┐   ┌────────────────────────────┐
│   Pure React Native App Shell          │   │  Handoff & QA Inspector    │
│   (View · Text · Pressable · Animated) │   │  (RN Modal / Side Pane)    │
│   • Responsive Nav (TabBar / SideRail) │◄─►│  • Role Switcher (4 Roles) │
│   • 11 Complete Campus Screens         │   │  • State Switcher (5)      │
│   • Custom react-native-svg Artwork    │   │  • Platform (iOS / Android)│
│   • Role-Gated Publish & Approval Flow │   │  • Per-Screen RN Spec Docs │
└────────────────────────────────────────┘   └────────────────────────────┘
```

- **Cross-Platform Storage & State**:
  - Async-compatible storage wrapper (`getItem` / `setItem`) backed by `localStorage` on web and drop-in compatible with `@react-native-async-storage/async-storage` in Expo.
  - Persists user profile, active role preview, theme mode (`system` | `light` | `dark`), platform preview (`ios` | `android`), onboarding status, registered events, saved bookmarks, joined clubs, read notices/notifications, and newly published or approved items.

- **Per-Screen Handoff Documentation Registry**:
  - Typed specification dictionary keyed by screen ID documenting: `componentTree`, `spacingTokens`, `typographyTokens`, `colorTokens`, `interactionBehavior`, `rolePermissions`, and `responsivePlatformRules` for direct handoff to an Expo + TypeScript mobile repository.
