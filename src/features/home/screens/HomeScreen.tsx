import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  ArrowRightIcon,
  BellIcon,
  CalendarIcon,
  MapPinIcon,
  MegaphoneIcon,
  PlusIcon,
  SearchIcon,
  ShieldIcon,
  SparklesIcon,
  UsersIcon,
  XIcon,
} from '../../../components/icons/NavIcons';
import {
  EventArtworkCard,
  SparkStarDoodle,
  SwirlDoodle,
} from '../../../components/illustrations/CampusArtwork';
import { EventRowCard, TactilePressable } from '../../../components/ui/RNPrimitives';
import { ScreenStateView } from '../../../components/ui/ScreenStateView';
import { useAuth, useCampusData, useNavigation, useTheme, useUIState } from '../../../store';
import { FONTS, RADII, SPACING, TOUCH_TARGET } from '../../../theme/tokens';
import { ScreenId } from '../../../types/collegeConnect';

const SHORTCUTS: Array<{
  id: string;
  label: string;
  target: ScreenId;
  active?: boolean;
  icon: (color: string) => React.ReactNode;
}> = [
  {
    id: 'events',
    label: 'Events',
    target: 'explore',
    icon: (c) => <CalendarIcon size={24} color={c} />,
  },
  {
    id: 'notices',
    label: 'Notices',
    target: 'announcements',
    icon: (c) => <MegaphoneIcon size={24} color={c} />,
  },
  {
    id: 'clubs',
    label: 'Clubs',
    target: 'hubs',
    active: true,
    icon: (c) => <UsersIcon size={24} color={c} />,
  },
  {
    id: 'calendar',
    label: 'Calendar',
    target: 'calendar',
    icon: (c) => <CalendarIcon size={24} color={c} filled />,
  },
];

export const HomeScreen: React.FC = () => {
  const { profile, role, roleMeta, openPublishSheet } = useAuth();
  const { visibleEvents, pendingEvents, unreadNotificationsCount, toggleEventSaved } =
    useCampusData();
  const { navigate } = useNavigation();
  const { uiStateMode, setUIStateMode } = useUIState();
  const { theme } = useTheme();

  const [quickQuery, setQuickQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const firstName =
    profile.name && profile.name !== 'Campus Member' ? profile.name.split(' ')[0] : 'there';
  const featuredEvent = useMemo(
    () => visibleEvents.find((e) => e.featured) ?? visibleEvents[0],
    [visibleEvents]
  );
  const upcomingEvents = useMemo(
    () => visibleEvents.filter((e) => e.id !== featuredEvent?.id).slice(0, 3),
    [visibleEvents, featuredEvent?.id]
  );

  const initials = useMemo(
    () =>
      profile.name
        .split(' ')
        .filter(Boolean)
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'CC',
    [profile.name]
  );

  const handleSearchSubmit = () => {
    navigate('explore', { searchQuery: quickQuery });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Personalized Greeting Bar matching Tile 2 */}
      <View style={styles.greetingBar}>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={[styles.greetingTitle, { color: theme.text }]}>
            Hey, {firstName}
          </Text>
          <Text numberOfLines={1} style={[styles.greetingSub, { color: theme.textMuted }]}>
            {role === 'student'
              ? 'Good to see you back!'
              : `${roleMeta.label} · ${profile.program}`}
          </Text>
        </View>

        <View style={styles.topRightActions}>
          <TactilePressable
            onPress={() => navigate('profile')}
            scaleTo={0.93}
            accessibilityLabel="Open profile"
            style={[
              styles.avatarCircle,
              {
                backgroundColor: theme.note,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.avatarText, { color: theme.noteInk }]}>{initials}</Text>
          </TactilePressable>

          <TactilePressable
            onPress={() => navigate('assistant')}
            scaleTo={0.93}
            accessibilityLabel="Open Campus AI event finder"
            style={[
              styles.bellButton,
              {
                backgroundColor: theme.sage,
                borderColor: theme.border,
              },
            ]}
          >
            <SparklesIcon
              size={18}
              color={theme.isDark ? theme.primaryBright : theme.primary}
            />
          </TactilePressable>

          <TactilePressable
            onPress={() => navigate('notifications')}
            scaleTo={0.93}
            accessibilityLabel="Open notifications"
            style={[
              styles.bellButton,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <BellIcon size={19} color={theme.text} />
            {unreadNotificationsCount > 0 ? (
              <View
                style={[
                  styles.bellBadge,
                  { backgroundColor: theme.isDark ? theme.primaryBright : theme.primary },
                ]}
              >
                <Text
                  style={[styles.bellBadgeText, { color: theme.isDark ? '#04140B' : '#FFFFFF' }]}
                >
                  {unreadNotificationsCount}
                </Text>
              </View>
            ) : null}
          </TactilePressable>
        </View>
      </View>

      {/* Search Bar */}
      <View
        style={[
          styles.searchBox,
          {
            backgroundColor: theme.surface,
            borderColor: searchFocused
              ? theme.isDark
                ? theme.primaryBright
                : theme.primary
              : theme.border,
          },
        ]}
      >
        <SearchIcon
          size={18}
          color={
            searchFocused ? (theme.isDark ? theme.primaryBright : theme.primary) : theme.textMuted
          }
        />
        <TextInput
          value={quickQuery}
          onChangeText={setQuickQuery}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
          placeholder="Search events, clubs, notices..."
          placeholderTextColor={theme.textMuted}
          style={[styles.searchInput, { color: theme.text }]}
        />
        {quickQuery.length > 0 ? (
          <View style={styles.searchActions}>
            <TactilePressable
              onPress={() => setQuickQuery('')}
              scaleTo={0.9}
              hitSlop={8}
              accessibilityLabel="Clear search"
            >
              <XIcon size={15} color={theme.textMuted} />
            </TactilePressable>
              {quickQuery.trim().length > 0 ? (
              <TactilePressable
                onPress={handleSearchSubmit}
                scaleTo={0.92}
                accessibilityLabel="Submit search"
                style={[styles.searchGoBtn, { backgroundColor: theme.primary }]}
              >
                <ArrowRightIcon size={15} color={theme.primaryFg} />
              </TactilePressable>
            ) : null}
          </View>
        ) : (
          <TactilePressable
            onPress={() => navigate('assistant')}
            scaleTo={0.94}
            accessibilityLabel="Ask AI to find events"
            style={[
              styles.askAiPill,
              { backgroundColor: theme.sage, borderColor: theme.border },
            ]}
          >
            <SparklesIcon
              size={13}
              color={theme.isDark ? theme.primaryBright : theme.primary}
            />
            <Text
              style={[
                styles.askAiPillText,
                { color: theme.isDark ? theme.primaryBright : theme.primary },
              ]}
            >
              Ask AI
            </Text>
          </TactilePressable>
        )}
      </View>

      {/* 4 Hanging-Tag Shortcut Cards matching Tile 2 */}
      <View style={styles.hangingWrapper}>
        <View style={styles.shortcutGrid}>
          {SHORTCUTS.map((item) => {
            const isActive = item.active;
            const bg = isActive ? theme.primary : theme.surfaceTag;
            const fg = isActive ? theme.primaryFg : theme.text;
            return (
              <View key={item.id} style={styles.hangingColumn}>
                <View style={[styles.stringStem, { backgroundColor: theme.borderStrong }]} />
                <TactilePressable
                  onPress={() => navigate(item.target)}
                  scaleTo={0.94}
                  containerStyle={{ width: '100%' }}
                  accessibilityLabel={`Open ${item.label}`}
                  style={[
                    styles.shortcutTile,
                    {
                      backgroundColor: bg,
                      borderColor: isActive ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.holeRing,
                      {
                        borderColor: isActive ? 'rgba(255,255,255,0.4)' : theme.borderStrong,
                      },
                    ]}
                  />
                  {item.icon(fg)}
                  <Text numberOfLines={1} style={[styles.shortcutLabel, { color: fg }]}>
                    {item.label}
                  </Text>
                </TactilePressable>
              </View>
            );
          })}
        </View>
      </View>

      {/* Role-Gated Official Publishing / Governance Banner */}
      {role !== 'student' ? (
        <View
          style={[styles.roleBanner, { backgroundColor: theme.sage, borderColor: theme.border }]}
        >
          <View style={styles.roleBannerLeft}>
            <ShieldIcon size={18} color={theme.isDark ? theme.primaryBright : theme.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.roleBannerTitle, { color: theme.text }]}>
                {roleMeta.label} Mode
              </Text>
              <Text style={[styles.roleBannerDesc, { color: theme.textMuted }]}>
                {role === 'super_admin' && pendingEvents.length > 0
                  ? `${pendingEvents.length} submission awaiting review`
                  : roleMeta.badgeDescription}
              </Text>
            </View>
          </View>
          <View style={styles.roleBannerActions}>
            {role === 'super_admin' ? (
              <TactilePressable
                onPress={() => navigate('role_management')}
                scaleTo={0.94}
                accessibilityLabel="Manage campus roles"
                style={[
                  styles.roleBannerSecondaryBtn,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <UsersIcon size={13} color={theme.text} />
                <Text style={[styles.roleBannerBtnText, { color: theme.text }]}>Roles</Text>
              </TactilePressable>
            ) : null}
            <TactilePressable
              onPress={openPublishSheet}
              scaleTo={0.94}
              accessibilityLabel="Publish new event or notice"
              style={[styles.roleBannerBtn, { backgroundColor: theme.primary }]}
            >
              <PlusIcon size={14} color={theme.primaryFg} />
              <Text style={[styles.roleBannerBtnText, { color: theme.primaryFg }]}>Publish</Text>
            </TactilePressable>
          </View>
        </View>
      ) : null}

      <ScreenStateView
        uiStateMode={uiStateMode === 'empty' ? 'default' : uiStateMode}
        isEmpty={false}
        skeletonCount={3}
        emptyTitle="Your campus feed is fresh"
        emptyDescription="No events published yet."
        onRetry={() => setUIStateMode('default')}
      >
        <>
          {/* Tilted Featured Spotlight Frame matching Tile 2 (works both with live data and clean empty layout) */}
          <View style={styles.featuredOuter}>
            <View style={styles.doodleTopLeft} pointerEvents="none">
              <SwirlDoodle color={theme.text} size={28} />
            </View>
            <View style={styles.doodleTopRight} pointerEvents="none">
              <SparkStarDoodle color={theme.text} size={20} />
            </View>

            <View style={{ transform: [{ rotate: '-2deg' }] }}>
              <TactilePressable
                onPress={() => {
                  if (featuredEvent) {
                    navigate('event_detail', { eventId: featuredEvent.id });
                  } else if (roleMeta.canPublishEvents) {
                    openPublishSheet();
                  } else {
                    navigate('explore');
                  }
                }}
                scaleTo={0.98}
                accessibilityLabel={
                  featuredEvent
                    ? `Featured event ${featuredEvent.title}`
                    : roleMeta.canPublishEvents
                      ? 'Publish featured event'
                      : 'Browse campus events'
                }
                style={[
                  styles.featuredCard,
                  {
                    borderColor: theme.border,
                  },
                ]}
              >
                <EventArtworkCard
                  theme={featuredEvent?.artwork ?? 'campus_general'}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={[styles.featuredScrim, { backgroundColor: theme.scrim }]} />

                <View style={styles.featuredContent}>
                  <View style={styles.featuredTop}>
                    <View style={styles.featuredTag}>
                      <Text style={styles.featuredTagText}>Featured</Text>
                    </View>
                  </View>

                  <View style={styles.featuredBottom}>
                    {featuredEvent ? (
                      <View style={{ flex: 1, gap: 3 }}>
                        <Text numberOfLines={1} style={styles.featuredTitle}>
                          {featuredEvent.title}
                        </Text>
                        <Text numberOfLines={1} style={styles.featuredHighlights}>
                          {featuredEvent.highlights.join('  •  ')}
                        </Text>
                        <View style={styles.featuredMetaLine}>
                          <CalendarIcon size={12} color="rgba(255,255,255,0.85)" />
                          <Text numberOfLines={1} style={[styles.featuredMeta, styles.tabular]}>
                            {featuredEvent.dateDisplay.replace(/\s\d{4}$/, '')} •{' '}
                            {featuredEvent.time}
                          </Text>
                        </View>
                        <View style={styles.featuredMetaLine}>
                          <MapPinIcon size={12} color="rgba(255,255,255,0.85)" />
                          <Text numberOfLines={1} style={styles.featuredMeta}>
                            {featuredEvent.venue}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text numberOfLines={1} style={styles.featuredTitle}>
                          Campus Spotlight
                        </Text>
                        <Text numberOfLines={1} style={styles.featuredHighlights}>
                          {roleMeta.canPublishEvents
                            ? 'Publish an official event to feature it here'
                            : 'Featured campus events appear here'}
                        </Text>
                        <View style={styles.featuredMetaLine}>
                          <CalendarIcon size={12} color="rgba(255,255,255,0.75)" />
                          <Text numberOfLines={1} style={styles.featuredMeta}>
                            Schedule · Upcoming
                          </Text>
                        </View>
                        <View style={styles.featuredMetaLine}>
                          <MapPinIcon size={12} color="rgba(255,255,255,0.75)" />
                          <Text numberOfLines={1} style={styles.featuredMeta}>
                            Campus Venue
                          </Text>
                        </View>
                      </View>
                    )}

                    <View style={styles.featuredArrowCircle}>
                      <ArrowRightIcon size={18} color="#1E3A2B" />
                    </View>
                  </View>
                </View>
              </TactilePressable>
            </View>

            <View style={styles.doodleBottomRight} pointerEvents="none">
              <SwirlDoodle color={theme.text} size={32} />
            </View>
          </View>

          {/* Upcoming Events Section matching Tile 2 */}
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Upcoming Events</Text>
              <TactilePressable
                onPress={() => navigate('explore')}
                scaleTo={0.95}
                hitSlop={8}
                accessibilityLabel="See all events"
                style={styles.seeAllBtn}
              >
                <Text
                  style={[
                    styles.seeAllText,
                    { color: theme.isDark ? theme.primaryBright : theme.primary },
                  ]}
                >
                  See all
                </Text>
                <ArrowRightIcon
                  size={14}
                  color={theme.isDark ? theme.primaryBright : theme.primary}
                />
              </TactilePressable>
            </View>

            <View style={{ gap: 10 }}>
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <EventRowCard
                    key={event.id}
                    event={event}
                    showApprovalStatus={role === 'super_admin'}
                    onPress={() => navigate('event_detail', { eventId: event.id })}
                    onToggleSave={toggleEventSaved}
                  />
                ))
              ) : (
                <TactilePressable
                  onPress={() =>
                    roleMeta.canPublishEvents ? openPublishSheet() : navigate('hubs')
                  }
                  scaleTo={0.985}
                  accessibilityLabel={
                    roleMeta.canPublishEvents ? 'Create first campus event' : 'Browse campus hubs'
                  }
                  style={[
                    styles.emptyRowPattern,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <EventArtworkCard theme="campus_general" compact style={styles.emptyRowThumb} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text numberOfLines={1} style={[styles.emptyRowTitle, { color: theme.text }]}>
                      {featuredEvent ? 'No other upcoming events' : 'No upcoming events yet'}
                    </Text>
                    <View style={{ flexDirection: 'row' }}>
                      <View style={[styles.emptyRowTag, { backgroundColor: theme.surfaceTag }]}>
                        <Text style={[styles.emptyRowTagText, { color: theme.text }]}>
                          Upcoming
                        </Text>
                      </View>
                    </View>
                    <Text
                      numberOfLines={1}
                      style={[styles.emptyRowSub, { color: theme.textMuted }]}
                    >
                      {roleMeta.canPublishEvents
                        ? 'Tap to publish an event or hub update'
                        : 'Events published by clubs & hubs appear here'}
                    </Text>
                  </View>
                  <ArrowRightIcon
                    size={16}
                    color={theme.isDark ? theme.primaryBright : theme.primary}
                  />
                </TactilePressable>
              )}
            </View>
          </View>
        </>
      </ScreenStateView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 38,
    paddingBottom: 92,
    gap: 14,
  },
  greetingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  greetingTitle: {
    fontFamily: FONTS.handwritten,
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 34,
  },
  greetingSub: {
    fontFamily: FONTS.ui,
    fontSize: 13,
    marginTop: 1,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FONTS.ui,
    fontSize: 13,
    fontWeight: '700',
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: {
    fontFamily: FONTS.ui,
    fontSize: 10,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  searchBox: {
    minHeight: 46,
    borderRadius: RADII.lg,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.ui,
    fontSize: 13,
    height: 42,
    outlineStyle: 'none',
  },
  searchActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchGoBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  askAiPill: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: RADII.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  askAiPillText: {
    fontFamily: FONTS.ui,
    fontSize: 11.5,
    fontWeight: '700',
  },
  hangingWrapper: {
    marginTop: -6,
  },
  shortcutGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  hangingColumn: {
    flex: 1,
    alignItems: 'center',
  },
  stringStem: {
    width: 1.5,
    height: 12,
  },
  shortcutTile: {
    width: '100%',
    minHeight: 92,
    borderRadius: RADII.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    gap: 6,
  },
  holeRing: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.4,
    marginBottom: 2,
  },
  shortcutLabel: {
    fontFamily: FONTS.ui,
    fontSize: 12.5,
    fontWeight: '600',
  },
  roleBanner: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  roleBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBannerTitle: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    fontWeight: '700',
  },
  roleBannerDesc: {
    fontFamily: FONTS.ui,
    fontSize: 11,
  },
  roleBannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleBannerSecondaryBtn: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: RADII.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roleBannerBtn: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: RADII.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roleBannerBtnText: {
    fontFamily: FONTS.ui,
    fontSize: 11,
    fontWeight: '700',
  },
  featuredOuter: {
    position: 'relative',
    paddingTop: 8,
    paddingBottom: 14,
  },
  doodleTopLeft: {
    position: 'absolute',
    top: -4,
    left: 2,
    zIndex: 5,
  },
  doodleTopRight: {
    position: 'absolute',
    top: 2,
    right: 6,
    zIndex: 5,
  },
  doodleBottomRight: {
    position: 'absolute',
    bottom: -2,
    right: 16,
    zIndex: 5,
  },
  featuredCard: {
    minHeight: 168,
    borderRadius: RADII.xl,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  featuredScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
    minHeight: 168,
  },
  featuredTop: {
    flexDirection: 'row',
  },
  featuredTag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(230, 213, 184, 0.94)',
  },
  featuredTagText: {
    fontFamily: FONTS.ui,
    fontSize: 11,
    fontWeight: '700',
    color: '#1E3A2B',
  },
  featuredBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  featuredTitle: {
    fontFamily: FONTS.handwritten,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 32,
    color: '#FFFFFF',
  },
  featuredHighlights: {
    fontFamily: FONTS.ui,
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.88)',
  },
  featuredMetaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  featuredMeta: {
    fontFamily: FONTS.ui,
    fontSize: 11,
    color: 'rgba(255,255,255,0.86)',
  },
  featuredArrowCircle: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: 22,
    backgroundColor: '#FAF8F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: FONTS.ui,
    fontSize: 16,
    fontWeight: '700',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 36,
  },
  seeAllText: {
    fontFamily: FONTS.ui,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyRowPattern: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    borderRadius: RADII.lg,
    borderWidth: 1,
    gap: 12,
  },
  emptyRowThumb: {
    width: 72,
    height: 72,
    borderRadius: RADII.md,
  },
  emptyRowTitle: {
    fontFamily: FONTS.ui,
    fontSize: 14.5,
    fontWeight: '700',
  },
  emptyRowTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  emptyRowTagText: {
    fontFamily: FONTS.ui,
    fontSize: 10,
    fontWeight: '700',
  },
  emptyRowSub: {
    fontFamily: FONTS.ui,
    fontSize: 12,
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});
