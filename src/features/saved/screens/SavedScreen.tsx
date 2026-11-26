import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BookmarkIcon, TicketIcon } from '../../../components/icons/NavIcons';
import { EventRowCard, ScreenHeader, TactilePressable } from '../../../components/ui/RNPrimitives';
import { ScreenStateView } from '../../../components/ui/ScreenStateView';
import { useAuth, useCampusData, useNavigation, useTheme, useUIState } from '../../../store';
import { FONTS, RADII, SPACING, TOUCH_TARGET } from '../../../theme/tokens';

export const SavedScreen: React.FC = () => {
  const { profile } = useAuth();
  const {
    visibleEvents,
    announcements,
    toggleEventRegistration,
    toggleEventSaved,
    toggleAnnouncementSaved,
  } = useCampusData();
  const { navigate } = useNavigation();
  const { uiStateMode, setUIStateMode } = useUIState();
  const { theme } = useTheme();

  const [tab, setTab] = useState<'registrations' | 'saved'>('registrations');

  const registeredEvents = useMemo(
    () => visibleEvents.filter((e) => e.isRegistered),
    [visibleEvents]
  );
  const savedEvents = useMemo(() => visibleEvents.filter((e) => e.isSaved), [visibleEvents]);
  const savedNotices = useMemo(() => announcements.filter((a) => a.isSaved), [announcements]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScreenHeader title="Saved" subtitle="Your registered passes & bookmarks." handwrittenTitle />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.segmentBar,
            { backgroundColor: theme.surfaceTag, borderColor: theme.border },
          ]}
        >
          {[
            { id: 'registrations' as const, label: `My Passes (${registeredEvents.length})` },
            {
              id: 'saved' as const,
              label: `Saved (${savedEvents.length + savedNotices.length})`,
            },
          ].map((opt) => {
            const active = tab === opt.id;
            return (
              <TactilePressable
                key={opt.id}
                onPress={() => setTab(opt.id)}
                scaleTo={0.96}
                containerStyle={{ flex: 1 }}
                accessibilityState={{ selected: active }}
                accessibilityLabel={opt.label}
                style={[styles.segmentBtn, active ? { backgroundColor: theme.primary } : null]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.segmentText,
                    styles.tabular,
                    { color: active ? theme.primaryFg : theme.text },
                  ]}
                >
                  {opt.label}
                </Text>
              </TactilePressable>
            );
          })}
        </View>

        {tab === 'registrations' ? (
          <ScreenStateView
            uiStateMode={uiStateMode}
            isEmpty={registeredEvents.length === 0}
            skeletonCount={3}
            emptyTitle="No active event registrations"
            emptyDescription="Register for campus fests, hackathons, or workshops to view your student entry pass here."
            emptyActionLabel="Browse Events"
            onEmptyAction={() => {
              setUIStateMode('default');
              navigate('explore');
            }}
            onRetry={() => setUIStateMode('default')}
          >
            <View style={styles.listWrap}>
              {registeredEvents.map((event) => (
                <View
                  key={event.id}
                  style={[
                    styles.passCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <View style={[styles.passHeader, { backgroundColor: theme.sage }]}>
                    <View style={styles.passBadgeRow}>
                      <TicketIcon
                        size={15}
                        color={theme.isDark ? theme.primaryBright : theme.primary}
                      />
                      <Text
                        style={[
                          styles.passId,
                          styles.tabular,
                          { color: theme.isDark ? theme.primaryBright : theme.primary },
                        ]}
                      >
                        PASS · {profile.studentId}
                      </Text>
                    </View>
                    <Text style={[styles.passStatus, { color: theme.text }]}>Confirmed</Text>
                  </View>

                  <View style={styles.passBody}>
                    <Text style={[styles.passTitle, { color: theme.text }]}>{event.title}</Text>
                    <Text style={[styles.passMeta, styles.tabular, { color: theme.textMuted }]}>
                      {event.dateDisplay} · {event.time} · {event.venue}
                    </Text>

                    <View style={styles.passActions}>
                      <TactilePressable
                        onPress={() => navigate('event_detail', { eventId: event.id })}
                        scaleTo={0.96}
                        containerStyle={{ flex: 1 }}
                        accessibilityLabel={`View ${event.title}`}
                        style={[styles.passBtnPrimary, { backgroundColor: theme.primary }]}
                      >
                        <Text style={[styles.passBtnPrimaryText, { color: theme.primaryFg }]}>
                          View Event
                        </Text>
                      </TactilePressable>
                      <TactilePressable
                        onPress={() => toggleEventRegistration(event.id)}
                        scaleTo={0.95}
                        accessibilityLabel={`Cancel registration for ${event.title}`}
                        style={[styles.passBtnGhost, { borderColor: theme.border }]}
                      >
                        <Text style={[styles.passBtnGhostText, { color: theme.danger }]}>
                          Cancel Seat
                        </Text>
                      </TactilePressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ScreenStateView>
        ) : (
          <ScreenStateView
            uiStateMode={uiStateMode}
            isEmpty={savedEvents.length === 0 && savedNotices.length === 0}
            skeletonCount={3}
            emptyTitle="Nothing saved yet"
            emptyDescription="Bookmark events or official notices to keep them handy for later."
            emptyActionLabel="Explore Campus"
            onEmptyAction={() => {
              setUIStateMode('default');
              navigate('explore');
            }}
            onRetry={() => setUIStateMode('default')}
          >
            <View style={styles.listWrap}>
              {savedEvents.map((event) => (
                <EventRowCard
                  key={event.id}
                  event={event}
                  onPress={() => navigate('event_detail', { eventId: event.id })}
                  onToggleSave={toggleEventSaved}
                />
              ))}

              {savedNotices.map((notice) => (
                <View
                  key={notice.id}
                  style={[
                    styles.savedNoticeCard,
                    { backgroundColor: theme.note, borderColor: theme.border },
                  ]}
                >
                  <TactilePressable
                    onPress={() => navigate('announcements')}
                    scaleTo={0.985}
                    containerStyle={{ flex: 1 }}
                    accessibilityLabel={`Read saved notice ${notice.title}`}
                    style={{ gap: 3 }}
                  >
                    <Text style={[styles.savedNoticeKicker, { color: theme.noteInk }]}>
                      Official Notice · {notice.category}
                    </Text>
                    <Text style={[styles.savedNoticeTitle, { color: theme.noteInk }]}>
                      {notice.title}
                    </Text>
                    <Text style={[styles.savedNoticeIssuer, { color: theme.noteInk }]}>
                      {notice.issuerTitle}
                    </Text>
                  </TactilePressable>
                  <TactilePressable
                    onPress={() => toggleAnnouncementSaved(notice.id)}
                    hitSlop={8}
                    scaleTo={0.85}
                    accessibilityLabel="Remove saved notice"
                    style={styles.unsaveBtn}
                  >
                    <BookmarkIcon size={18} color={theme.noteInk} filled />
                  </TactilePressable>
                </View>
              ))}
            </View>
          </ScreenStateView>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
    paddingBottom: 92,
    gap: 14,
  },
  segmentBar: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: RADII.lg,
    borderWidth: 1,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  segmentText: {
    fontFamily: FONTS.ui,
    fontSize: 12.5,
    fontWeight: '700',
  },
  listWrap: {
    gap: 10,
  },
  passCard: {
    borderRadius: RADII.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  passHeader: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  passId: {
    fontFamily: FONTS.ui,
    fontSize: 11.5,
    fontWeight: '700',
  },
  passStatus: {
    fontFamily: FONTS.ui,
    fontSize: 11.5,
    fontWeight: '700',
  },
  passBody: {
    padding: 14,
    gap: 5,
  },
  passTitle: {
    fontFamily: FONTS.ui,
    fontSize: 15.5,
    fontWeight: '700',
  },
  passMeta: {
    fontFamily: FONTS.ui,
    fontSize: 12.5,
  },
  passActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  passBtnPrimary: {
    flex: 1,
    minHeight: 42,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passBtnPrimaryText: {
    fontFamily: FONTS.ui,
    fontSize: 13,
    fontWeight: '700',
  },
  passBtnGhost: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: RADII.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passBtnGhostText: {
    fontFamily: FONTS.ui,
    fontSize: 12.5,
    fontWeight: '600',
  },
  savedNoticeCard: {
    padding: 14,
    borderRadius: RADII.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  savedNoticeKicker: {
    fontFamily: FONTS.ui,
    fontSize: 11,
    fontWeight: '700',
  },
  savedNoticeTitle: {
    fontFamily: FONTS.ui,
    fontSize: 14.5,
    fontWeight: '700',
  },
  savedNoticeIssuer: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    opacity: 0.85,
  },
  unsaveBtn: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});
