import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { getTodayIsoDate, normalizeIsoDateInput } from '../../services/api/localCampusService';
import { useAuth, useCampusData, useNavigation, useTheme, useUIState } from '../../store';
import { FONTS, RADII, SPACING, TOUCH_TARGET } from '../../theme/tokens';
import { AnnouncementCategory, EventArtworkTheme, EventCategory } from '../../types/collegeConnect';
import { AlertCircleIcon, ArrowRightIcon, CheckIcon, ShieldIcon } from '../icons/NavIcons';
import { BottomSheetHeader } from '../ui/BottomSheetHeader';
import { SmoothBottomSheet, TactilePressable } from '../ui/RNPrimitives';

const EVENT_CATEGORIES: EventCategory[] = [
  'Cultural',
  'Tech',
  'Sports',
  'Workshop',
  'Competition',
  'Social',
];

const NOTICE_CATEGORIES: AnnouncementCategory[] = ['Academic', 'Exam', 'Hostel', 'General'];

const ARTWORK_OPTIONS: Array<{ id: EventArtworkTheme; label: string }> = [
  { id: 'music_fest', label: 'Stage Lights' },
  { id: 'hackathon', label: 'Tech Lab' },
  { id: 'photography', label: 'Camera' },
  { id: 'business_plan', label: 'Pitch' },
  { id: 'blood_camp', label: 'Civic' },
  { id: 'campus_general', label: 'Campus' },
];

type ConsoleMode = 'event' | 'announcement' | 'hub' | 'club' | 'approvals';

export const PublishModal: React.FC = () => {
  const { publishSheetOpen, closePublishSheet } = useUIState();
  const { navigate } = useNavigation();
  const { role, roleMeta, profile } = useAuth();
  const {
    hubs,
    clubs,
    pendingEvents,
    createHub,
    createClub,
    publishEvent,
    publishAnnouncement,
    approveEvent,
    rejectEvent,
  } = useCampusData();
  const { theme } = useTheme();

  const assignedClubHubId = clubs.find((c) => c.id === profile.assignedClubId)?.hubId;

  const [mode, setMode] = useState<ConsoleMode>('event');
  const [title, setTitle] = useState('');
  const [eventCat, setEventCat] = useState<EventCategory>('Cultural');
  const [date, setDate] = useState(() => getTodayIsoDate());
  const [time, setTime] = useState('4:30 PM');
  const [venue, setVenue] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [entryLabel, setEntryLabel] = useState('₹100');
  const [hubId, setHubId] = useState(
    assignedClubHubId || profile.assignedHubId || hubs[0]?.id || ''
  );
  const [artwork, setArtwork] = useState<EventArtworkTheme>('campus_general');
  const [description, setDescription] = useState('');

  const [noticeCat, setNoticeCat] = useState<AnnouncementCategory>('Academic');
  const [noticePinned, setNoticePinned] = useState(false);

  const [hubBuilding, setHubBuilding] = useState('');
  const [hubCoordinator, setHubCoordinator] = useState('');
  const [clubSchedule, setClubSchedule] = useState('');
  const [clubLocation, setClubLocation] = useState('');
  const [clubLead, setClubLead] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [prevSheetOpen, setPrevSheetOpen] = useState(publishSheetOpen);

  if (publishSheetOpen !== prevSheetOpen) {
    setPrevSheetOpen(publishSheetOpen);
    if (!publishSheetOpen) {
      setFormError(null);
      setSubmitting(false);
    }
  }

  const handleClose = () => {
    setFormError(null);
    setSubmitting(false);
    closePublishSheet();
  };

  const effectiveHubId = hubs.some((h) => h.id === hubId) ? hubId : (hubs[0]?.id ?? '');

  const failValidation = (message: string) => {
    setFormError(message);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setFormError(null);

    if (mode === 'hub') {
      const cleanName = title.trim();
      const cleanFocus = description.trim();
      if (cleanName.length < 2) {
        failValidation('Hub name must be at least 2 characters.');
        return;
      }
      if (cleanFocus.length < 4) {
        failValidation(
          `Hub focus description needs at least 4 characters (currently ${cleanFocus.length}/4).`
        );
        return;
      }
      if (hubCoordinator.trim().length > 0 && hubCoordinator.trim().length < 2) {
        failValidation('Hub Head name must be at least 2 characters.');
        return;
      }
      setSubmitting(true);
      try {
        const res = await createHub({
          name: cleanName,
          focus: cleanFocus,
          building: hubBuilding.trim() || 'Main Campus',
          inChargeName: hubCoordinator.trim() || profile.name,
        });
        if (res.ok) {
          setTitle('');
          setDescription('');
          setHubBuilding('');
          setHubCoordinator('');
          setFormError(null);
        } else {
          failValidation(res.error || 'Unable to create campus hub. Please try again.');
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (mode === 'club') {
      if (!effectiveHubId) {
        failValidation('Create a Campus Hub first before adding a club.');
        return;
      }
      const cleanName = title.trim();
      const cleanTagline = description.trim();
      if (cleanName.length < 2) {
        failValidation('Club name must be at least 2 characters.');
        return;
      }
      if (cleanTagline.length < 4) {
        failValidation(
          `Club tagline needs at least 4 characters (currently ${cleanTagline.length}/4).`
        );
        return;
      }
      if (clubLead.trim().length > 0 && clubLead.trim().length < 2) {
        failValidation('Club Lead name must be at least 2 characters.');
        return;
      }
      if (clubSchedule.trim().length > 0 && clubSchedule.trim().length < 2) {
        failValidation('Meeting schedule must be at least 2 characters.');
        return;
      }
      setSubmitting(true);
      try {
        const res = await createClub({
          name: cleanName,
          hubId: effectiveHubId,
          tagline: cleanTagline,
          meetingSchedule: clubSchedule.trim() || 'Weekly · TBD',
          location: clubLocation.trim() || 'Main Campus',
          leadName: clubLead.trim() || profile.name,
        });
        if (res.ok) {
          setTitle('');
          setDescription('');
          setClubSchedule('');
          setClubLocation('');
          setClubLead('');
          setFormError(null);
        } else {
          failValidation(res.error || 'Unable to create student club. Please try again.');
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();

    if (mode === 'event') {
      if (!effectiveHubId) {
        failValidation('Create a Campus Hub first before publishing an event.');
        return;
      }
      if (cleanTitle.length < 3) {
        failValidation(`Event title must be at least 3 characters (currently ${cleanTitle.length}/3).`);
        return;
      }
      const normalizedDate = normalizeIsoDateInput(date);
      if (!normalizedDate) {
        failValidation('Enter a valid event date in YYYY-MM-DD format (e.g., 2026-11-28).');
        return;
      }
      if (time.trim().length < 2) {
        failValidation('Enter an event start time (e.g., 4:30 PM).');
        return;
      }
      if (venue.trim().length === 1) {
        failValidation('Venue must be at least 2 characters (or leave blank to use hub building).');
        return;
      }
      if (!isFree && entryLabel.trim().length < 2) {
        failValidation('Enter an entry fee label of at least 2 characters (e.g., ₹150).');
        return;
      }
      if (cleanDescription.length < 8) {
        failValidation(
          `Event summary needs at least 8 characters (currently ${cleanDescription.length}/8).`
        );
        return;
      }

      setSubmitting(true);
      try {
        const res = await publishEvent({
          title: cleanTitle,
          category: eventCat,
          date: normalizedDate,
          time: time.trim(),
          venue: venue.trim(),
          entryLabel: entryLabel.trim(),
          isFree,
          description: cleanDescription,
          hubId: effectiveHubId,
          artwork,
        });
        if (res.ok) {
          setTitle('');
          setDescription('');
          setVenue('');
          setDate(getTodayIsoDate());
          setFormError(null);
        } else {
          failValidation(res.error || 'Unable to publish event. Please try again.');
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (mode === 'announcement') {
      if (cleanTitle.length < 3) {
        failValidation(
          `Announcement headline must be at least 3 characters (currently ${cleanTitle.length}/3).`
        );
        return;
      }
      if (cleanDescription.length < 8) {
        failValidation(
          `Official summary needs at least 8 characters (currently ${cleanDescription.length}/8).`
        );
        return;
      }
      setSubmitting(true);
      try {
        const res = await publishAnnouncement({
          title: cleanTitle,
          category: noticeCat,
          summary: cleanDescription,
          pinned: noticePinned,
        });
        if (res.ok) {
          setTitle('');
          setDescription('');
          setFormError(null);
        } else {
          failValidation(res.error || 'Unable to publish official notice. Please try again.');
        }
      } finally {
        setSubmitting(false);
      }
    }
  };

  const modeTabs: Array<{ id: ConsoleMode; label: string }> = [
    { id: 'event', label: 'New Event' },
    { id: 'announcement', label: 'Official Notice' },
    ...(role === 'super_admin'
      ? [
          { id: 'hub' as const, label: 'New Hub' },
          { id: 'club' as const, label: 'New Club' },
        ]
      : []),
    ...(roleMeta.canApproveSubmissions
      ? [{ id: 'approvals' as const, label: `Queue (${pendingEvents.length})` }]
      : []),
  ];

  const needsHubPrompt = (mode === 'event' || mode === 'club') && hubs.length === 0;
  const minTitleLen = mode === 'hub' || mode === 'club' ? 2 : 3;
  const minDescLen = mode === 'hub' || mode === 'club' ? 4 : 8;
  const titleLen = title.trim().length;
  const descLen = description.trim().length;

  return (
    <SmoothBottomSheet
      visible={publishSheetOpen}
      onClose={handleClose}
      backdropOpacity={0.58}
      topSpacerFlex={0.15}
    >
      <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <BottomSheetHeader
          title="Official Campus Console"
          subtitle={`Signed in as ${roleMeta.label}`}
          leftIcon={
            <ShieldIcon size={18} color={theme.isDark ? theme.primaryBright : theme.primary} />
          }
          onClose={handleClose}
        />

        {role === 'super_admin' ? (
          <TactilePressable
            onPress={() => {
              handleClose();
              navigate('role_management');
            }}
            scaleTo={0.98}
            accessibilityLabel="Open Role Management"
            style={[
              styles.roleMgmtBanner,
              { backgroundColor: theme.sage, borderColor: theme.border },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.roleMgmtBannerTitle, { color: theme.text }]}>
                In-App Role &amp; Access Management
              </Text>
              <Text style={[styles.roleMgmtBannerSub, { color: theme.textMuted }]}>
                Promote or assign Faculty, Club In-charge, Hub Head &amp; Super Admin roles
              </Text>
            </View>
            <ArrowRightIcon size={16} color={theme.isDark ? theme.primaryBright : theme.primary} />
          </TactilePressable>
        ) : null}

        {/* Mode Selector Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.modeBarScroll, { backgroundColor: theme.surfaceMuted }]}
          contentContainerStyle={styles.modeBarContent}
        >
          {modeTabs.map((tab) => {
            const active = mode === tab.id;
            return (
              <TactilePressable
                key={tab.id}
                onPress={() => {
                  setMode(tab.id);
                  setFormError(null);
                }}
                scaleTo={0.96}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={[styles.modeTab, active ? { backgroundColor: theme.primary } : null]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.modeTabText,
                    { color: active ? theme.primaryFg : theme.textMuted },
                  ]}
                >
                  {tab.label}
                </Text>
              </TactilePressable>
            );
          })}
        </ScrollView>

        <ScrollView
          style={{ maxHeight: 380 }}
          contentContainerStyle={{ gap: 14, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {mode === 'approvals' ? (
            pendingEvents.length === 0 ? (
              <View style={[styles.emptyQueue, { borderColor: theme.border }]}>
                <CheckIcon size={24} color={theme.isDark ? theme.primaryBright : theme.primary} />
                <Text style={[styles.emptyQueueTitle, { color: theme.text }]}>
                  Approval queue clear
                </Text>
                <Text style={[styles.emptyQueueDesc, { color: theme.textMuted }]}>
                  All faculty and club event submissions have been reviewed.
                </Text>
              </View>
            ) : (
              pendingEvents.map((evt) => (
                <View
                  key={evt.id}
                  style={[
                    styles.queueCard,
                    { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.queueTitle, { color: theme.text }]}>{evt.title}</Text>
                  <Text style={[styles.queueMeta, { color: theme.textMuted }]}>
                    {evt.category} · {evt.dateDisplay} · {evt.venue} · by {evt.organizerName}
                  </Text>
                  <View style={styles.queueActions}>
                    <TactilePressable
                      onPress={() => approveEvent(evt.id)}
                      scaleTo={0.96}
                      containerStyle={{ flex: 1 }}
                      style={[styles.queueApprove, { backgroundColor: theme.primary }]}
                    >
                      <Text style={[styles.queueBtnText, { color: theme.primaryFg }]}>
                        Approve &amp; Publish
                      </Text>
                    </TactilePressable>
                    <TactilePressable
                      onPress={() => rejectEvent(evt.id)}
                      scaleTo={0.96}
                      style={[
                        styles.queueReject,
                        { backgroundColor: theme.dangerBg, borderColor: theme.danger },
                      ]}
                    >
                      <Text style={[styles.queueBtnText, { color: theme.danger }]}>Decline</Text>
                    </TactilePressable>
                  </View>
                </View>
              ))
            )
          ) : needsHubPrompt ? (
            <View style={[styles.emptyQueue, { borderColor: theme.border }]}>
              <Text style={[styles.emptyQueueTitle, { color: theme.text }]}>
                Create a Campus Hub First
              </Text>
              <Text style={[styles.emptyQueueDesc, { color: theme.textMuted }]}>
                {role === 'super_admin'
                  ? 'Every club and event belongs to a Campus Hub. Add your first hub to unlock publishing.'
                  : 'Ask your Super Admin to create at least one Campus Hub before publishing events.'}
              </Text>
              {role === 'super_admin' ? (
                <TactilePressable
                  onPress={() => setMode('hub')}
                  scaleTo={0.96}
                  style={[
                    styles.submitBtn,
                    { backgroundColor: theme.primary, paddingHorizontal: 20 },
                  ]}
                >
                  <Text style={[styles.submitBtnText, { color: theme.primaryFg }]}>
                    Create First Hub
                  </Text>
                </TactilePressable>
              ) : null}
            </View>
          ) : (
            <>
              <View style={styles.fieldGroup}>
                <View style={styles.fieldHeaderRow}>
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                    {mode === 'event'
                      ? 'Event Title'
                      : mode === 'announcement'
                        ? 'Announcement Headline'
                        : mode === 'hub'
                          ? 'Hub Name'
                          : 'Club Name'}
                  </Text>
                  <Text
                    style={[
                      styles.fieldHint,
                      {
                        color:
                          titleLen > 0 && titleLen < minTitleLen ? theme.danger : theme.textMuted,
                      },
                    ]}
                  >
                    {titleLen < minTitleLen ? `min ${minTitleLen} chars` : `${titleLen} chars`}
                  </Text>
                </View>
                <TextInput
                  value={title}
                  onChangeText={(text) => {
                    setTitle(text);
                    if (formError) setFormError(null);
                  }}
                  placeholder={
                    mode === 'event'
                      ? 'e.g., Robotics Expo'
                      : mode === 'announcement'
                        ? 'e.g., Revised Lab Schedule'
                        : mode === 'hub'
                          ? 'e.g., Innovation & Tech Hub'
                          : 'e.g., Robotics & AI Guild'
                  }
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surfaceMuted,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                />
              </View>

              {(mode === 'event' || mode === 'announcement') && (
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Category</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    {(mode === 'event' ? EVENT_CATEGORIES : NOTICE_CATEGORIES).map((cat) => {
                      const active = mode === 'event' ? eventCat === cat : noticeCat === cat;
                      return (
                        <TactilePressable
                          key={cat}
                          onPress={() =>
                            mode === 'event'
                              ? setEventCat(cat as EventCategory)
                              : setNoticeCat(cat as AnnouncementCategory)
                          }
                          scaleTo={0.95}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: active ? theme.primary : theme.surfaceMuted,
                              borderColor: active ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              { color: active ? theme.primaryFg : theme.text },
                            ]}
                          >
                            {cat}
                          </Text>
                        </TactilePressable>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {mode === 'hub' ? (
                <View style={styles.rowTwo}>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                      Building / Wing
                    </Text>
                    <TextInput
                      value={hubBuilding}
                      onChangeText={setHubBuilding}
                      placeholder="e.g., Block B"
                      placeholderTextColor={theme.textMuted}
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.surfaceMuted,
                          borderColor: theme.border,
                          color: theme.text,
                        },
                      ]}
                    />
                  </View>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                      Hub Head
                    </Text>
                    <TextInput
                      value={hubCoordinator}
                      onChangeText={setHubCoordinator}
                      placeholder={profile.name || 'Coordinator name'}
                      placeholderTextColor={theme.textMuted}
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.surfaceMuted,
                          borderColor: theme.border,
                          color: theme.text,
                        },
                      ]}
                    />
                  </View>
                </View>
              ) : null}

              {mode === 'club' ? (
                <>
                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Parent Hub</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 8 }}
                    >
                      {hubs.map((h) => {
                        const active = effectiveHubId === h.id;
                        return (
                          <TactilePressable
                            key={h.id}
                            onPress={() => setHubId(h.id)}
                            scaleTo={0.95}
                            style={[
                              styles.chip,
                              {
                                backgroundColor: active ? theme.primary : theme.surfaceMuted,
                                borderColor: active ? theme.primary : theme.border,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                { color: active ? theme.primaryFg : theme.text },
                              ]}
                            >
                              {h.name.replace(' Hub', '')}
                            </Text>
                          </TactilePressable>
                        );
                      })}
                    </ScrollView>
                  </View>

                  <View style={styles.rowTwo}>
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Schedule</Text>
                      <TextInput
                        value={clubSchedule}
                        onChangeText={setClubSchedule}
                        placeholder="e.g., Thu · 4:30 PM"
                        placeholderTextColor={theme.textMuted}
                        style={[
                          styles.input,
                          {
                            backgroundColor: theme.surfaceMuted,
                            borderColor: theme.border,
                            color: theme.text,
                          },
                        ]}
                      />
                    </View>
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Location</Text>
                      <TextInput
                        value={clubLocation}
                        onChangeText={setClubLocation}
                        placeholder="e.g., Room 104"
                        placeholderTextColor={theme.textMuted}
                        style={[
                          styles.input,
                          {
                            backgroundColor: theme.surfaceMuted,
                            borderColor: theme.border,
                            color: theme.text,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Club Lead</Text>
                    <TextInput
                      value={clubLead}
                      onChangeText={setClubLead}
                      placeholder={profile.name || 'Lead name'}
                      placeholderTextColor={theme.textMuted}
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.surfaceMuted,
                          borderColor: theme.border,
                          color: theme.text,
                        },
                      ]}
                    />
                  </View>
                </>
              ) : null}

              {mode === 'event' ? (
                <>
                  <View style={styles.rowTwo}>
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                        Date (YYYY-MM-DD)
                      </Text>
                      <TextInput
                        value={date}
                        onChangeText={(text) => {
                          setDate(text);
                          if (formError) setFormError(null);
                        }}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={theme.textMuted}
                        style={[
                          styles.input,
                          {
                            backgroundColor: theme.surfaceMuted,
                            borderColor: theme.border,
                            color: theme.text,
                          },
                        ]}
                      />
                    </View>
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Time</Text>
                      <TextInput
                        value={time}
                        onChangeText={(text) => {
                          setTime(text);
                          if (formError) setFormError(null);
                        }}
                        placeholder="4:30 PM"
                        placeholderTextColor={theme.textMuted}
                        style={[
                          styles.input,
                          {
                            backgroundColor: theme.surfaceMuted,
                            borderColor: theme.border,
                            color: theme.text,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Venue</Text>
                    <TextInput
                      value={venue}
                      onChangeText={(text) => {
                        setVenue(text);
                        if (formError) setFormError(null);
                      }}
                      placeholder="e.g., Main Auditorium"
                      placeholderTextColor={theme.textMuted}
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.surfaceMuted,
                          borderColor: theme.border,
                          color: theme.text,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                      Organizing Hub
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 8 }}
                    >
                      {hubs.map((h) => {
                        const active = effectiveHubId === h.id;
                        return (
                          <TactilePressable
                            key={h.id}
                            onPress={() => setHubId(h.id)}
                            scaleTo={0.95}
                            style={[
                              styles.chip,
                              {
                                backgroundColor: active ? theme.primary : theme.surfaceMuted,
                                borderColor: active ? theme.primary : theme.border,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                { color: active ? theme.primaryFg : theme.text },
                              ]}
                            >
                              {h.name.replace(' Hub', '')}
                            </Text>
                          </TactilePressable>
                        );
                      })}
                    </ScrollView>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                      Cover Visual Theme
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 8 }}
                    >
                      {ARTWORK_OPTIONS.map((art) => {
                        const active = artwork === art.id;
                        return (
                          <TactilePressable
                            key={art.id}
                            onPress={() => setArtwork(art.id)}
                            scaleTo={0.95}
                            style={[
                              styles.chip,
                              {
                                backgroundColor: active ? theme.primary : theme.surfaceMuted,
                                borderColor: active ? theme.primary : theme.border,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                { color: active ? theme.primaryFg : theme.text },
                              ]}
                            >
                              {art.label}
                            </Text>
                          </TactilePressable>
                        );
                      })}
                    </ScrollView>
                  </View>

                  <View style={styles.switchRow}>
                    <Text style={[styles.switchLabel, { color: theme.text }]}>
                      Free Student Entry
                    </Text>
                    <Switch
                      value={isFree}
                      onValueChange={setIsFree}
                      trackColor={{ false: theme.surfaceMuted, true: theme.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  {!isFree ? (
                    <TextInput
                      value={entryLabel}
                      onChangeText={setEntryLabel}
                      placeholder="Entry Fee (e.g., ₹150)"
                      placeholderTextColor={theme.textMuted}
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.surfaceMuted,
                          borderColor: theme.border,
                          color: theme.text,
                        },
                      ]}
                    />
                  ) : null}
                </>
              ) : mode === 'announcement' ? (
                <View style={styles.switchRow}>
                  <Text style={[styles.switchLabel, { color: theme.text }]}>
                    Pin Official Notice at Top
                  </Text>
                  <Switch
                    value={noticePinned}
                    onValueChange={setNoticePinned}
                    trackColor={{ false: theme.surfaceMuted, true: theme.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              ) : null}

              <View style={styles.fieldGroup}>
                <View style={styles.fieldHeaderRow}>
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                    {mode === 'hub'
                      ? 'Hub Focus Areas'
                      : mode === 'club'
                        ? 'Club Tagline / Activities'
                        : 'Description / Official Summary'}
                  </Text>
                  <Text
                    style={[
                      styles.fieldHint,
                      {
                        color: descLen > 0 && descLen < minDescLen ? theme.danger : theme.textMuted,
                      },
                    ]}
                  >
                    {descLen < minDescLen
                      ? `${descLen}/${minDescLen} min chars`
                      : `${descLen} chars`}
                  </Text>
                </View>
                <TextInput
                  value={description}
                  onChangeText={(text) => {
                    setDescription(text);
                    if (formError) setFormError(null);
                  }}
                  multiline
                  numberOfLines={3}
                  placeholder={
                    mode === 'hub'
                      ? 'Describe the communities and events managed under this hub...'
                      : mode === 'club'
                        ? 'Describe weekly meetups, workshops, and member activities...'
                        : 'Provide complete campus details, eligibility, or instructions...'
                  }
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: theme.surfaceMuted,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                />
              </View>
            </>
          )}
        </ScrollView>

        {mode !== 'approvals' && !needsHubPrompt ? (
          <View style={styles.footerWrap}>
            {formError ? (
              <View
                style={[
                  styles.inlineErrorBox,
                  { backgroundColor: theme.dangerBg, borderColor: theme.danger },
                ]}
              >
                <AlertCircleIcon size={16} color={theme.danger} />
                <Text style={[styles.inlineErrorText, { color: theme.danger }]}>{formError}</Text>
              </View>
            ) : null}

            <TactilePressable
              onPress={() => {
                void handleSubmit();
              }}
              disabled={submitting}
              accessibilityLabel="Submit publish form"
              style={[
                styles.submitBtn,
                {
                  backgroundColor: theme.primary,
                  opacity: submitting ? 0.65 : 1,
                },
              ]}
            >
              <Text style={[styles.submitBtnText, { color: theme.primaryFg }]}>
                {submitting
                  ? mode === 'event' || mode === 'announcement'
                    ? 'Publishing...'
                    : 'Saving...'
                  : mode === 'event'
                    ? role === 'faculty' || role === 'club_incharge'
                      ? 'Submit Event for Approval'
                      : 'Publish Event Live'
                    : mode === 'announcement'
                      ? 'Publish Official Notice'
                      : mode === 'hub'
                        ? 'Create Campus Hub'
                        : 'Create Student Club'}
              </Text>
            </TactilePressable>
          </View>
        ) : null}
      </View>
    </SmoothBottomSheet>
  );
};

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: RADII.xxl,
    borderTopRightRadius: RADII.xxl,
    borderTopWidth: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: 14,
  },
  roleMgmtBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADII.lg,
    borderWidth: 1,
  },
  roleMgmtBannerTitle: {
    fontFamily: FONTS.ui,
    fontSize: 12.5,
    fontWeight: '700',
  },
  roleMgmtBannerSub: {
    fontFamily: FONTS.ui,
    fontSize: 11,
    marginTop: 1,
  },
  modeBarScroll: {
    borderRadius: RADII.lg,
    flexGrow: 0,
  },
  modeBarContent: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
  },
  modeTab: {
    minHeight: 40,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  modeTabText: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    fontWeight: '700',
  },
  fieldGroup: {
    gap: 6,
  },
  fieldHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  fieldLabel: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    fontWeight: '600',
  },
  fieldHint: {
    fontFamily: FONTS.ui,
    fontSize: 11,
    fontWeight: '600',
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    minHeight: TOUCH_TARGET,
    borderRadius: RADII.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontFamily: FONTS.ui,
    fontSize: 14,
    outlineStyle: 'none',
  },
  textArea: {
    minHeight: 86,
    borderRadius: RADII.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FONTS.ui,
    fontSize: 14,
    outlineStyle: 'none',
  },
  chip: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: RADII.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  switchLabel: {
    fontFamily: FONTS.ui,
    fontSize: 14,
    fontWeight: '600',
  },
  footerWrap: {
    gap: 8,
    paddingTop: 2,
  },
  inlineErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADII.md,
    borderWidth: 1,
  },
  inlineErrorText: {
    flex: 1,
    fontFamily: FONTS.ui,
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 17,
  },
  submitBtn: {
    minHeight: 50,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontFamily: FONTS.ui,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyQueue: {
    padding: SPACING.xxl,
    borderRadius: RADII.xl,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
  },
  emptyQueueTitle: {
    fontFamily: FONTS.ui,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyQueueDesc: {
    fontFamily: FONTS.ui,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  queueCard: {
    padding: 14,
    borderRadius: RADII.lg,
    borderWidth: 1,
    gap: 8,
  },
  queueTitle: {
    fontFamily: FONTS.ui,
    fontSize: 15,
    fontWeight: '700',
  },
  queueMeta: {
    fontFamily: FONTS.ui,
    fontSize: 12,
  },
  queueActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  queueApprove: {
    flex: 1,
    minHeight: 40,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueReject: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: RADII.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueBtnText: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    fontWeight: '700',
  },
});
