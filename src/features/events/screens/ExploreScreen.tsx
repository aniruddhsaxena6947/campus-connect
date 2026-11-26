import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import {
  PlusIcon,
  SearchIcon,
  SlidersIcon,
  SparklesIcon,
  XIcon,
} from '../../../components/icons/NavIcons';
import {
  EventArtworkCard,
  SwirlDoodle,
} from '../../../components/illustrations/CampusArtwork';
import { BottomSheetHeader } from '../../../components/ui/BottomSheetHeader';
import {
  EventRowCard,
  SmoothBottomSheet,
  TactilePressable,
} from '../../../components/ui/RNPrimitives';
import { ScreenStateView } from '../../../components/ui/ScreenStateView';
import { filterAndSortEvents } from '../../../services/api/localCampusService';
import { useAuth, useCampusData, useNavigation, useTheme, useUIState } from '../../../store';
import { FONTS, RADII, SPACING, TOUCH_TARGET } from '../../../theme/tokens';
import { EventCategory } from '../../../types/collegeConnect';

const CATEGORIES: Array<'All' | EventCategory> = [
  'All',
  'Cultural',
  'Tech',
  'Sports',
  'Workshop',
  'Competition',
  'Social',
];

export const ExploreScreen: React.FC = () => {
  const { role, roleMeta, openPublishSheet } = useAuth();
  const { visibleEvents, toggleEventSaved } = useCampusData();
  const { exploreSearchQuery, setExploreSearchQuery, navigate } = useNavigation();
  const { uiStateMode, setUIStateMode } = useUIState();
  const { theme } = useTheme();

  const [prevExploreQuery, setPrevExploreQuery] = useState(exploreSearchQuery);
  const [localSearch, setLocalSearch] = useState(exploreSearchQuery);
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'All' | EventCategory>('All');
  const [freeOnly, setFreeOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<'soonest' | 'popular'>('soonest');
  const [filterOpen, setFilterOpen] = useState(false);

  if (exploreSearchQuery !== prevExploreQuery) {
    setPrevExploreQuery(exploreSearchQuery);
    setLocalSearch(exploreSearchQuery);
  }

  const activeFiltersCount = (freeOnly ? 1 : 0) + (sortOrder === 'popular' ? 1 : 0);
  const hasAnyFilter =
    selectedCategory !== 'All' ||
    freeOnly ||
    sortOrder !== 'soonest' ||
    localSearch.trim().length > 0;

  const filteredEvents = useMemo(
    () =>
      filterAndSortEvents(visibleEvents, {
        searchQuery: localSearch,
        category: selectedCategory,
        freeOnly,
        sortOrder,
      }),
    [visibleEvents, localSearch, selectedCategory, freeOnly, sortOrder]
  );

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setFreeOnly(false);
    setSortOrder('soonest');
    setLocalSearch('');
    setExploreSearchQuery('');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>Explore</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              Find what excites you.
            </Text>
          </View>
          <View style={styles.headerRight}>
            <SwirlDoodle color={theme.text} size={28} />
            <TactilePressable
              onPress={() => navigate('assistant')}
              scaleTo={0.94}
              accessibilityLabel="Ask Campus AI"
              style={[
                styles.askAiHeaderBtn,
                { backgroundColor: theme.sage, borderColor: theme.border },
              ]}
            >
              <SparklesIcon
                size={14}
                color={theme.isDark ? theme.primaryBright : theme.primary}
              />
              <Text
                style={[
                  styles.askAiHeaderText,
                  { color: theme.isDark ? theme.primaryBright : theme.primary },
                ]}
              >
                Ask AI
              </Text>
            </TactilePressable>
            {roleMeta.canPublishEvents ? (
              <TactilePressable
                onPress={openPublishSheet}
                scaleTo={0.92}
                accessibilityLabel="Publish event"
                style={[styles.publishMiniBtn, { backgroundColor: theme.primary }]}
              >
                <PlusIcon size={15} color={theme.primaryFg} />
              </TactilePressable>
            ) : null}
          </View>
        </View>

        <View style={styles.searchRow}>
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
                searchFocused
                  ? theme.isDark
                    ? theme.primaryBright
                    : theme.primary
                  : theme.textMuted
              }
            />
            <TextInput
              value={localSearch}
              onChangeText={setLocalSearch}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search events, clubs, or keywords..."
              placeholderTextColor={theme.textMuted}
              style={[styles.searchInput, { color: theme.text }]}
            />
            {localSearch.length > 0 ? (
              <TactilePressable
                onPress={() => {
                  setLocalSearch('');
                  setExploreSearchQuery('');
                }}
                scaleTo={0.9}
                hitSlop={8}
                accessibilityLabel="Clear search"
              >
                <XIcon size={16} color={theme.textMuted} />
              </TactilePressable>
            ) : null}
          </View>

          <TactilePressable
            onPress={() => setFilterOpen(true)}
            scaleTo={0.93}
            accessibilityLabel="Filter events"
            style={[
              styles.filterBtn,
              {
                backgroundColor: activeFiltersCount > 0 ? theme.primary : theme.surface,
                borderColor: activeFiltersCount > 0 ? theme.primary : theme.border,
              },
            ]}
          >
            <SlidersIcon size={18} color={activeFiltersCount > 0 ? theme.primaryFg : theme.text} />
            {activeFiltersCount > 0 ? (
              <View style={[styles.filterCountBadge, { backgroundColor: theme.note }]}>
                <Text style={[styles.filterCountText, { color: theme.noteInk }]}>
                  {activeFiltersCount}
                </Text>
              </View>
            ) : null}
          </TactilePressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <TactilePressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                scaleTo={0.95}
                accessibilityState={{ selected: active }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? theme.primary : theme.surfaceTag,
                    borderColor: active ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[styles.chipText, { color: active ? theme.primaryFg : theme.text }]}
                >
                  {cat}
                </Text>
              </TactilePressable>
            );
          })}
        </ScrollView>

        {uiStateMode === 'default' ? (
          <View style={styles.resultsMetaRow}>
            <Text style={[styles.resultsCountText, styles.tabular, { color: theme.textMuted }]}>
              {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
              {sortOrder === 'popular' ? ' · Most popular' : ' · Soonest first'}
              {freeOnly ? ' · Free only' : ''}
            </Text>
            {hasAnyFilter ? (
              <TactilePressable
                onPress={handleResetFilters}
                scaleTo={0.95}
                hitSlop={8}
                accessibilityLabel="Reset filters"
              >
                <Text
                  style={[
                    styles.clearFilterText,
                    { color: theme.isDark ? theme.primaryBright : theme.primary },
                  ]}
                >
                  Reset
                </Text>
              </TactilePressable>
            ) : null}
          </View>
        ) : null}

        <ScreenStateView
          uiStateMode={uiStateMode === 'empty' ? 'default' : uiStateMode}
          isEmpty={false}
          skeletonCount={4}
          emptyTitle="No campus events published yet"
          emptyDescription="Published campus events will appear here."
          onRetry={() => setUIStateMode('default')}
        >
          <View style={styles.listCol}>
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <EventRowCard
                  key={event.id}
                  event={event}
                  showApprovalStatus={role === 'super_admin'}
                  onPress={() => navigate('event_detail', { eventId: event.id })}
                  onToggleSave={toggleEventSaved}
                />
              ))
            ) : (
              <View
                style={[
                  styles.emptyListRow,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <EventArtworkCard theme="campus_general" compact style={styles.emptyListThumb} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[styles.emptyListTitle, { color: theme.text }]}>
                    {visibleEvents.length === 0
                      ? 'No campus events published yet'
                      : 'No matching events found'}
                  </Text>
                  <Text style={[styles.emptyListSub, { color: theme.textMuted }]}>
                    {visibleEvents.length === 0
                      ? roleMeta.canPublishEvents
                        ? 'Create a hub or publish your first event from the console.'
                        : 'Events published by campus clubs & hubs appear here.'
                      : 'Try clearing your search or switching category tabs.'}
                  </Text>
                  <View style={{ flexDirection: 'row', marginTop: 4 }}>
                    <TactilePressable
                      onPress={() => {
                        setUIStateMode('default');
                        if (visibleEvents.length === 0 && roleMeta.canPublishEvents) {
                          openPublishSheet();
                        } else {
                          handleResetFilters();
                        }
                      }}
                      scaleTo={0.95}
                      style={[styles.emptyActionPill, { backgroundColor: theme.primary }]}
                    >
                      <Text style={[styles.emptyActionPillText, { color: theme.primaryFg }]}>
                        {visibleEvents.length === 0 && roleMeta.canPublishEvents
                          ? 'Publish Event'
                          : hasAnyFilter
                            ? 'Reset Filters'
                            : 'Refresh'}
                      </Text>
                    </TactilePressable>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScreenStateView>
      </ScrollView>

      <SmoothBottomSheet visible={filterOpen} onClose={() => setFilterOpen(false)}>
        <View
          style={[styles.sheetCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <BottomSheetHeader title="Filter & Sort" onClose={() => setFilterOpen(false)} />

          <View style={[styles.toggleRow, { borderBottomColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toggleTitle, { color: theme.text }]}>
                Free Entry Events Only
              </Text>
              <Text style={[styles.toggleSub, { color: theme.textMuted }]}>
                Hide paid competition passes
              </Text>
            </View>
            <Switch
              value={freeOnly}
              onValueChange={setFreeOnly}
              trackColor={{ false: theme.surfaceMuted, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={{ gap: 10 }}>
            <Text style={[styles.toggleTitle, { color: theme.text }]}>Sort Order</Text>
            <View style={styles.sortRow}>
              {[
                { id: 'soonest' as const, label: 'Soonest Date' },
                { id: 'popular' as const, label: 'Most Popular' },
              ].map((opt) => {
                const active = sortOrder === opt.id;
                return (
                  <TactilePressable
                    key={opt.id}
                    onPress={() => setSortOrder(opt.id)}
                    scaleTo={0.96}
                    containerStyle={{ flex: 1 }}
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Sort by ${opt.label}`}
                    style={[
                      styles.sortBtn,
                      {
                        backgroundColor: active ? theme.primary : theme.surfaceMuted,
                        borderColor: active ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.sortBtnText, { color: active ? theme.primaryFg : theme.text }]}
                    >
                      {opt.label}
                    </Text>
                  </TactilePressable>
                );
              })}
            </View>
          </View>

          <TactilePressable
            onPress={() => setFilterOpen(false)}
            style={[styles.applyBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={[styles.applyBtnText, { color: theme.primaryFg }]}>
              Show {filteredEvents.length} Events
            </Text>
          </TactilePressable>
        </View>
      </SmoothBottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 38,
    paddingBottom: 92,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: FONTS.handwritten,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 38,
  },
  subtitle: {
    fontFamily: FONTS.ui,
    fontSize: 13,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  publishMiniBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  askAiHeaderBtn: {
    minHeight: 36,
    paddingHorizontal: 11,
    borderRadius: RADII.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  askAiHeaderText: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    fontWeight: '700',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBox: {
    flex: 1,
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
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: RADII.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterCountText: {
    fontFamily: FONTS.ui,
    fontSize: 10,
    fontWeight: '700',
  },
  chipsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    minHeight: 36,
    paddingHorizontal: 15,
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
  resultsMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  resultsCountText: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    fontWeight: '500',
  },
  clearFilterText: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    fontWeight: '700',
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
  listCol: {
    gap: 10,
  },
  emptyListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADII.lg,
    borderWidth: 1,
    gap: 12,
  },
  emptyListThumb: {
    width: 72,
    height: 72,
    borderRadius: RADII.md,
  },
  emptyListTitle: {
    fontFamily: FONTS.ui,
    fontSize: 15,
    fontWeight: '700',
  },
  emptyListSub: {
    fontFamily: FONTS.ui,
    fontSize: 12.5,
    lineHeight: 17,
  },
  emptyActionPill: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyActionPillText: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    fontWeight: '700',
  },
  sheetCard: {
    borderTopLeftRadius: RADII.xxl,
    borderTopRightRadius: RADII.xxl,
    borderTopWidth: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxxl,
    gap: 18,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  toggleTitle: {
    fontFamily: FONTS.ui,
    fontSize: 14,
    fontWeight: '600',
  },
  toggleSub: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    marginTop: 2,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sortBtn: {
    width: '100%',
    minHeight: TOUCH_TARGET,
    borderRadius: RADII.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortBtnText: {
    fontFamily: FONTS.ui,
    fontSize: 13,
    fontWeight: '600',
  },
  applyBtn: {
    minHeight: 48,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontFamily: FONTS.ui,
    fontSize: 14,
    fontWeight: '700',
  },
});
