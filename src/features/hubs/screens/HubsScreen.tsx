import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  MapPinIcon,
  PlusIcon,
  ShieldIcon,
  UsersIcon,
} from '../../../components/icons/NavIcons';
import {
  EmptyStateCard,
  ScreenHeader,
  TactilePressable,
} from '../../../components/ui/RNPrimitives';
import { ScreenStateView } from '../../../components/ui/ScreenStateView';
import { filterClubsByHub } from '../../../services/api/localCampusService';
import { useAuth, useCampusData, useTheme, useUIState } from '../../../store';
import { FONTS, RADII, SPACING } from '../../../theme/tokens';

export const HubsScreen: React.FC = () => {
  const { role, roleMeta, profile, openPublishSheet } = useAuth();
  const { hubs, clubs, visibleEvents, toggleClubMembership } = useCampusData();
  const { uiStateMode, setUIStateMode } = useUIState();
  const { theme } = useTheme();

  const [selectedHubId, setSelectedHubId] = useState<string>('all');

  const activeHub = useMemo(
    () => hubs.find((h) => h.id === selectedHubId) ?? null,
    [hubs, selectedHubId]
  );

  const filteredClubs = useMemo(
    () => filterClubsByHub(clubs, selectedHubId),
    [clubs, selectedHubId]
  );

  const clubCountByHubId = useMemo(() => {
    const map = new Map<string, number>();
    clubs.forEach((club) => {
      map.set(club.hubId, (map.get(club.hubId) ?? 0) + 1);
    });
    return map;
  }, [clubs]);

  const eventCountByHubId = useMemo(() => {
    const map = new Map<string, number>();
    visibleEvents.forEach((evt) => {
      map.set(evt.hubId, (map.get(evt.hubId) ?? 0) + 1);
    });
    return map;
  }, [visibleEvents]);

  const hasNothingAtAll = hubs.length === 0 && clubs.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScreenHeader
        title="Hubs & Clubs"
        subtitle="Find your campus community."
        showBack
        handwrittenTitle
        rightSlot={
          roleMeta.canManageHub || roleMeta.canManageClub ? (
            <TactilePressable
              onPress={openPublishSheet}
              scaleTo={0.94}
              accessibilityLabel="Manage hubs, clubs, and events"
              style={[styles.headerAction, { backgroundColor: theme.primary }]}
            >
              <PlusIcon size={15} color={theme.primaryFg} />
              <Text style={[styles.headerActionText, { color: theme.primaryFg }]}>
                {role === 'super_admin'
                  ? 'Add Hub / Club'
                  : role === 'hub_incharge'
                    ? 'Hub Event'
                    : 'Club Event'}
              </Text>
            </TactilePressable>
          ) : null
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hubChipsRow}
        >
          <TactilePressable
            onPress={() => setSelectedHubId('all')}
            scaleTo={0.94}
            accessibilityLabel="All Hubs"
            style={[
              styles.hubChip,
              {
                backgroundColor: selectedHubId === 'all' ? theme.primary : theme.surfaceTag,
                borderColor: selectedHubId === 'all' ? theme.primary : theme.border,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.hubChipText,
                { color: selectedHubId === 'all' ? theme.primaryFg : theme.text },
              ]}
            >
              All Hubs ({hubs.length})
            </Text>
          </TactilePressable>

          {hubs.map((hub) => {
            const active = selectedHubId === hub.id;
            const isAssigned = role === 'hub_incharge' && profile.assignedHubId === hub.id;
            return (
              <TactilePressable
                key={hub.id}
                onPress={() => setSelectedHubId(hub.id)}
                scaleTo={0.94}
                accessibilityLabel={hub.name}
                style={[
                  styles.hubChip,
                  {
                    backgroundColor: active ? theme.primary : theme.surfaceTag,
                    borderColor: active ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[styles.hubChipText, { color: active ? theme.primaryFg : theme.text }]}
                >
                  {hub.name.replace(' Hub', '')}
                  {isAssigned ? ' · Yours' : ''}
                </Text>
              </TactilePressable>
            );
          })}
        </ScrollView>

        {activeHub ? (
          <View
            style={[styles.hubBanner, { backgroundColor: theme.sage, borderColor: theme.border }]}
          >
            <View style={styles.hubBannerTop}>
              <Text style={[styles.hubBannerTitle, { color: theme.text }]}>{activeHub.name}</Text>
              {role === 'hub_incharge' && profile.assignedHubId === activeHub.id ? (
                <View style={[styles.managedBadge, { backgroundColor: theme.primary }]}>
                  <ShieldIcon size={12} color={theme.primaryFg} />
                  <Text style={[styles.managedText, { color: theme.primaryFg }]}>
                    Managed by You
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.hubBannerFocus, { color: theme.textMuted }]}>
              {activeHub.focus}
            </Text>
            <Text style={[styles.hubBannerMeta, styles.tabular, { color: theme.text }]}>
              In-charge: {activeHub.inChargeName} · {activeHub.building} ·{' '}
              {Math.max(activeHub.activeEventsCount, eventCountByHubId.get(activeHub.id) ?? 0)}{' '}
              active events
            </Text>
          </View>
        ) : null}

        <ScreenStateView
          uiStateMode={uiStateMode}
          isEmpty={hasNothingAtAll}
          skeletonCount={3}
          emptyTitle="No hubs or clubs created yet"
          emptyDescription={
            role === 'super_admin'
              ? 'Start fresh by creating your first Campus Hub and Student Club from the console.'
              : 'Campus hubs and student clubs will appear here once added by administrators.'
          }
          emptyActionLabel={role === 'super_admin' ? 'Create Hub or Club' : 'Refresh'}
          onEmptyAction={() => {
            setUIStateMode('default');
            if (role === 'super_admin') {
              openPublishSheet();
            }
          }}
          onRetry={() => setUIStateMode('default')}
        >
          <View style={styles.sectionsWrap}>
            {selectedHubId === 'all' && hubs.length > 0 ? (
              <View style={styles.sectionBlock}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Campus Hubs ({hubs.length})
                </Text>
                <View style={styles.colWrap}>
                  {hubs.map((hub) => {
                    const isAssigned = role === 'hub_incharge' && profile.assignedHubId === hub.id;
                    const clubCount = clubCountByHubId.get(hub.id) ?? 0;
                    const eventCount = Math.max(
                      hub.activeEventsCount,
                      eventCountByHubId.get(hub.id) ?? 0
                    );
                    return (
                      <TactilePressable
                        key={hub.id}
                        onPress={() => setSelectedHubId(hub.id)}
                        scaleTo={0.985}
                        accessibilityLabel={`Open ${hub.name}`}
                        style={[
                          styles.clubCard,
                          { backgroundColor: theme.surface, borderColor: theme.border },
                        ]}
                      >
                        <View style={styles.clubCardHeader}>
                          <View style={{ flex: 1, gap: 3 }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                flexWrap: 'wrap',
                              }}
                            >
                              <Text
                                style={[
                                  styles.clubHubKicker,
                                  { color: theme.isDark ? theme.primaryBright : theme.primary },
                                ]}
                              >
                                CAMPUS HUB
                              </Text>
                              {isAssigned ? (
                                <View style={[styles.managedBadge, { backgroundColor: theme.sage }]}>
                                  <ShieldIcon
                                    size={11}
                                    color={theme.isDark ? theme.primaryBright : theme.primary}
                                  />
                                  <Text
                                    style={[
                                      styles.managedText,
                                      { color: theme.isDark ? theme.primaryBright : theme.primary },
                                    ]}
                                  >
                                    Managed by You
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                            <Text style={[styles.clubName, { color: theme.text }]}>{hub.name}</Text>
                          </View>

                          <View
                            style={[
                              styles.hubOpenPill,
                              { backgroundColor: theme.sage, borderColor: theme.border },
                            ]}
                          >
                            <Text
                              style={[
                                styles.hubOpenPillText,
                                { color: theme.isDark ? theme.primaryBright : theme.primary },
                              ]}
                            >
                              {clubCount} {clubCount === 1 ? 'Club' : 'Clubs'}
                            </Text>
                            <ArrowRightIcon
                              size={12}
                              color={theme.isDark ? theme.primaryBright : theme.primary}
                            />
                          </View>
                        </View>

                        <Text style={[styles.clubTagline, { color: theme.textMuted }]}>
                          {hub.focus}
                        </Text>

                        <View style={[styles.clubMetaRow, { borderTopColor: theme.border }]}>
                          <View style={styles.clubMetaItem}>
                            <UsersIcon size={13} color={theme.textMuted} />
                            <Text style={[styles.clubMetaText, { color: theme.textMuted }]}>
                              Head: {hub.inChargeName}
                            </Text>
                          </View>
                          <View style={styles.clubMetaItem}>
                            <MapPinIcon size={13} color={theme.textMuted} />
                            <Text style={[styles.clubMetaText, { color: theme.textMuted }]}>
                              {hub.building}
                            </Text>
                          </View>
                          <View style={styles.clubMetaItem}>
                            <ClockIcon size={13} color={theme.textMuted} />
                            <Text
                              style={[
                                styles.clubMetaText,
                                styles.tabular,
                                { color: theme.textMuted },
                              ]}
                            >
                              {eventCount} {eventCount === 1 ? 'event' : 'events'}
                            </Text>
                          </View>
                        </View>
                      </TactilePressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Student Clubs ({filteredClubs.length})
              </Text>

              {filteredClubs.length === 0 ? (
                <EmptyStateCard
                  title={clubs.length === 0 ? 'No student clubs yet' : 'No clubs in this hub'}
                  description={
                    clubs.length === 0
                      ? role === 'super_admin'
                        ? 'Your campus hub is live. Add a Student Club from the console so students can join.'
                        : 'Student clubs under these hubs will appear here once added by administrators.'
                      : 'Switch to All Hubs to view student societies across campus.'
                  }
                  actionLabel={
                    role === 'super_admin'
                      ? 'Create Club'
                      : selectedHubId !== 'all'
                        ? 'Show All Hubs'
                        : undefined
                  }
                  onAction={
                    role === 'super_admin'
                      ? openPublishSheet
                      : selectedHubId !== 'all'
                        ? () => setSelectedHubId('all')
                        : undefined
                  }
                />
              ) : (
                <View style={styles.colWrap}>
                  {filteredClubs.map((club) => (
                    <View
                      key={club.id}
                      style={[
                        styles.clubCard,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                      ]}
                    >
                      <View style={styles.clubCardHeader}>
                        <View style={{ flex: 1, gap: 3 }}>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 6,
                              flexWrap: 'wrap',
                            }}
                          >
                            <Text
                              numberOfLines={1}
                              style={[
                                styles.clubHubKicker,
                                { color: theme.isDark ? theme.primaryBright : theme.primary },
                              ]}
                            >
                              {club.hubName}
                            </Text>
                            {role === 'club_incharge' && profile.assignedClubId === club.id ? (
                              <View style={[styles.managedBadge, { backgroundColor: theme.sage }]}>
                                <ShieldIcon
                                  size={11}
                                  color={theme.isDark ? theme.primaryBright : theme.primary}
                                />
                                <Text
                                  style={[
                                    styles.managedText,
                                    { color: theme.isDark ? theme.primaryBright : theme.primary },
                                  ]}
                                >
                                  Managed by You
                                </Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={[styles.clubName, { color: theme.text }]}>{club.name}</Text>
                        </View>

                        <TactilePressable
                          onPress={() => toggleClubMembership(club.id)}
                          scaleTo={0.92}
                          accessibilityState={{ selected: club.isJoined }}
                          accessibilityLabel={
                            club.isJoined ? `Leave ${club.name}` : `Join ${club.name}`
                          }
                          style={[
                            styles.joinBtn,
                            {
                              backgroundColor: club.isJoined ? theme.surfaceTag : theme.primary,
                              borderColor: club.isJoined ? theme.borderStrong : theme.primary,
                              borderWidth: club.isJoined ? 1 : 0,
                            },
                          ]}
                        >
                          {club.isJoined ? (
                            <CheckIcon
                              size={14}
                              color={theme.isDark ? theme.primaryBright : theme.primary}
                            />
                          ) : null}
                          <Text
                            style={[
                              styles.joinBtnText,
                              {
                                color: club.isJoined
                                  ? theme.isDark
                                    ? theme.primaryBright
                                    : theme.primary
                                  : theme.primaryFg,
                              },
                            ]}
                          >
                            {club.isJoined ? 'Joined' : 'Join'}
                          </Text>
                        </TactilePressable>
                      </View>

                      <Text style={[styles.clubTagline, { color: theme.textMuted }]}>
                        {club.tagline}
                      </Text>

                      <View style={[styles.clubMetaRow, { borderTopColor: theme.border }]}>
                        <View style={styles.clubMetaItem}>
                          <ClockIcon size={13} color={theme.textMuted} />
                          <Text
                            style={[styles.clubMetaText, styles.tabular, { color: theme.textMuted }]}
                          >
                            {club.meetingSchedule}
                          </Text>
                        </View>
                        <View style={styles.clubMetaItem}>
                          <MapPinIcon size={13} color={theme.textMuted} />
                          <Text style={[styles.clubMetaText, { color: theme.textMuted }]}>
                            {club.location}
                          </Text>
                        </View>
                        <View style={styles.clubMetaItem}>
                          <UsersIcon size={13} color={theme.textMuted} />
                          <Text
                            style={[styles.clubMetaText, styles.tabular, { color: theme.textMuted }]}
                          >
                            {club.memberCount} members
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScreenStateView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
    paddingBottom: 92,
    gap: 12,
  },
  headerAction: {
    minHeight: 36,
    paddingHorizontal: 13,
    borderRadius: RADII.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  headerActionText: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    fontWeight: '700',
  },
  hubChipsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  hubChip: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: RADII.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubChipText: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    fontWeight: '600',
  },
  hubBanner: {
    padding: 14,
    borderRadius: RADII.xl,
    borderWidth: 1,
    gap: 5,
  },
  hubBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  hubBannerTitle: {
    fontFamily: FONTS.ui,
    fontSize: 15,
    fontWeight: '700',
  },
  managedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADII.pill,
  },
  managedText: {
    fontFamily: FONTS.ui,
    fontSize: 11,
    fontWeight: '700',
  },
  hubBannerFocus: {
    fontFamily: FONTS.ui,
    fontSize: 12.5,
    lineHeight: 18,
  },
  hubBannerMeta: {
    fontFamily: FONTS.ui,
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionsWrap: {
    gap: 16,
  },
  sectionBlock: {
    gap: 10,
  },
  sectionTitle: {
    fontFamily: FONTS.ui,
    fontSize: 15,
    fontWeight: '700',
  },
  hubOpenPill: {
    minHeight: 32,
    paddingHorizontal: 11,
    borderRadius: RADII.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  hubOpenPillText: {
    fontFamily: FONTS.ui,
    fontSize: 11.5,
    fontWeight: '700',
  },
  colWrap: {
    gap: 10,
  },
  clubCard: {
    padding: 14,
    borderRadius: RADII.xl,
    borderWidth: 1,
    gap: 9,
  },
  clubCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  clubHubKicker: {
    fontFamily: FONTS.ui,
    fontSize: 11,
    fontWeight: '700',
  },
  clubName: {
    fontFamily: FONTS.ui,
    fontSize: 15,
    fontWeight: '700',
  },
  joinBtn: {
    minHeight: 36,
    minWidth: 74,
    paddingHorizontal: 12,
    borderRadius: RADII.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  joinBtnText: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    fontWeight: '700',
  },
  clubTagline: {
    fontFamily: FONTS.ui,
    fontSize: 13,
    lineHeight: 18,
  },
  clubMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  clubMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clubMetaText: {
    fontFamily: FONTS.ui,
    fontSize: 11.5,
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});
