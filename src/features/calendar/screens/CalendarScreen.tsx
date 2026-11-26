import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '../../../components/icons/NavIcons';
import {
  BotanicalLeavesDoodle,
  EventArtworkCard,
  SparkStarDoodle,
  SwirlDoodle,
} from '../../../components/illustrations/CampusArtwork';
import { EventRowCard, ScreenHeader, TactilePressable } from '../../../components/ui/RNPrimitives';
import { ScreenStateView } from '../../../components/ui/ScreenStateView';
import { formatShortReadableDate, getTodayIsoDate } from '../../../services/api/localCampusService';
import { useAuth, useCampusData, useNavigation, useTheme, useUIState } from '../../../store';
import { FONTS, RADII, SPACING, TOUCH_TARGET } from '../../../theme/tokens';

interface MonthDescriptor {
  year: number;
  month: number;
  label: string;
  days: number;
  startOffset: number;
}

function buildMonthWindow(centerYear: number, centerMonth: number): MonthDescriptor[] {
  const result: MonthDescriptor[] = [];
  for (let offset = -2; offset <= 4; offset++) {
    const firstDay = new Date(centerYear, centerMonth + offset, 1);
    const y = firstDay.getFullYear();
    const m = firstDay.getMonth();
    const days = new Date(y, m + 1, 0).getDate();
    const startOffset = (firstDay.getDay() + 6) % 7;
    const label = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    result.push({ year: y, month: m, label, days, startOffset });
  }
  return result;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function toIsoDate(year: number, monthIndex: number, day: number): string {
  const mm = String(monthIndex + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export const CalendarScreen: React.FC = () => {
  const { role, roleMeta, openPublishSheet } = useAuth();
  const { visibleEvents, announcements, toggleEventSaved } = useCampusData();
  const { navigate } = useNavigation();
  const { uiStateMode, setUIStateMode } = useUIState();
  const { theme } = useTheme();

  const todayIso = useMemo(() => getTodayIsoDate(), []);
  const months = useMemo(() => {
    const now = new Date();
    return buildMonthWindow(now.getFullYear(), now.getMonth());
  }, []);
  const todayMonthIdx = 2;

  const [monthIdx, setMonthIdx] = useState(todayMonthIdx);
  const [selectedIso, setSelectedIso] = useState(todayIso);

  const currentMonth = months[monthIdx];

  const eventDateSet = useMemo(() => {
    const set = new Set<string>();
    visibleEvents.forEach((e) => set.add(e.date));
    announcements.forEach((a) => set.add(a.date));
    return set;
  }, [visibleEvents, announcements]);

  const dayEvents = useMemo(
    () => visibleEvents.filter((e) => e.date === selectedIso),
    [visibleEvents, selectedIso]
  );

  const dayNotices = useMemo(
    () => announcements.filter((a) => a.date === selectedIso),
    [announcements, selectedIso]
  );

  const calendarCells = useMemo(() => {
    const cells: Array<{ day: number | null; iso: string | null }> = [];
    for (let i = 0; i < currentMonth.startOffset; i++) {
      cells.push({ day: null, iso: null });
    }
    for (let d = 1; d <= currentMonth.days; d++) {
      cells.push({ day: d, iso: toIsoDate(currentMonth.year, currentMonth.month, d) });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: null, iso: null });
    }
    return cells;
  }, [currentMonth]);

  const weeks = useMemo(() => {
    const rows: (typeof calendarCells)[] = [];
    for (let i = 0; i < calendarCells.length; i += 7) {
      rows.push(calendarCells.slice(i, i + 7));
    }
    return rows;
  }, [calendarCells]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, position: 'relative' }}>
      <ScreenHeader
        title="Calendar"
        subtitle="Your month at a glance."
        handwrittenTitle
        rightSlot={
          roleMeta.canPublishEvents ? (
            <TactilePressable
              onPress={openPublishSheet}
              scaleTo={0.94}
              accessibilityLabel="Schedule new event"
              style={[styles.addBtn, { backgroundColor: theme.primary }]}
            >
              <PlusIcon size={15} color={theme.primaryFg} />
              <Text style={[styles.addBtnText, { color: theme.primaryFg }]}>Schedule</Text>
            </TactilePressable>
          ) : (
            <SparkStarDoodle color={theme.text} size={22} />
          )
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.monthCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <View style={styles.monthHeader}>
            <TactilePressable
              onPress={() => setMonthIdx((i) => Math.max(0, i - 1))}
              disabled={monthIdx === 0}
              scaleTo={0.88}
              accessibilityLabel="Previous month"
              style={[styles.monthNavBtn, { opacity: monthIdx === 0 ? 0.35 : 1 }]}
            >
              <ChevronLeftIcon size={20} color={theme.text} />
            </TactilePressable>

            <Text style={[styles.monthTitle, { color: theme.text }]}>{currentMonth.label}</Text>

            <TactilePressable
              onPress={() => setMonthIdx((i) => Math.min(months.length - 1, i + 1))}
              disabled={monthIdx === months.length - 1}
              scaleTo={0.88}
              accessibilityLabel="Next month"
              style={[styles.monthNavBtn, { opacity: monthIdx === months.length - 1 ? 0.35 : 1 }]}
            >
              <ChevronRightIcon size={20} color={theme.text} />
            </TactilePressable>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((day) => (
              <View key={day} style={styles.weekdayCell}>
                <Text style={[styles.weekdayText, { color: theme.textMuted }]}>{day}</Text>
              </View>
            ))}
          </View>

          <View style={{ gap: 2 }}>
            {weeks.map((week, wIdx) => (
              <View key={wIdx} style={styles.weekRow}>
                {week.map((cell, cIdx) => {
                  if (!cell.day || !cell.iso) {
                    return <View key={cIdx} style={styles.dayCell} />;
                  }
                  const selected = cell.iso === selectedIso;
                  const hasItems = eventDateSet.has(cell.iso);
                  return (
                    <TactilePressable
                      key={cell.iso}
                      onPress={() => setSelectedIso(cell.iso!)}
                      scaleTo={0.88}
                      containerStyle={{ flex: 1 }}
                      accessibilityState={{ selected }}
                      accessibilityLabel={`Select ${cell.iso}`}
                      style={styles.dayCell}
                    >
                      <View
                        style={[
                          styles.dayCircle,
                          selected
                            ? { backgroundColor: theme.primary }
                            : hasItems
                              ? { backgroundColor: theme.surfaceTag }
                              : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayNumber,
                            styles.tabular,
                            {
                              color: selected ? theme.primaryFg : theme.text,
                              fontWeight: selected || hasItems ? '700' : '500',
                            },
                          ]}
                        >
                          {cell.day}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.eventMarker,
                          {
                            backgroundColor: hasItems
                              ? selected
                                ? theme.primaryBright
                                : theme.primary
                              : 'transparent',
                          },
                        ]}
                      />
                    </TactilePressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.agendaHeaderPill}>
          <View style={styles.dateChipGroup}>
            <View style={[styles.dateChip, { backgroundColor: theme.surfaceTag }]}>
              <Text style={[styles.dateChipText, styles.tabular, { color: theme.text }]}>
                {selectedIso === todayIso
                  ? `Today, ${formatShortReadableDate(selectedIso)}`
                  : formatShortReadableDate(selectedIso)}
              </Text>
            </View>

            {selectedIso !== todayIso || monthIdx !== todayMonthIdx ? (
              <TactilePressable
                onPress={() => {
                  setMonthIdx(todayMonthIdx);
                  setSelectedIso(todayIso);
                }}
                scaleTo={0.93}
                accessibilityLabel="Jump to today"
                style={[styles.todayJumpChip, { borderColor: theme.borderStrong }]}
              >
                <Text
                  style={[
                    styles.todayJumpText,
                    { color: theme.isDark ? theme.primaryBright : theme.primary },
                  ]}
                >
                  Today
                </Text>
              </TactilePressable>
            ) : null}
          </View>

          <View style={styles.agendaRight}>
            <Text style={[styles.agendaCount, styles.tabular, { color: theme.textMuted }]}>
              {dayEvents.length + dayNotices.length} scheduled
            </Text>
            <SwirlDoodle color={theme.text} size={26} />
          </View>
        </View>

        <ScreenStateView
          uiStateMode={uiStateMode === 'empty' ? 'default' : uiStateMode}
          isEmpty={false}
          skeletonCount={2}
          emptyTitle="Clear schedule on this date"
          emptyDescription="No campus events or official deadlines are scheduled for this day."
          onRetry={() => setUIStateMode('default')}
        >
          <View style={{ gap: 10 }}>
            {dayEvents.length === 0 && dayNotices.length === 0 ? (
              <TactilePressable
                onPress={() => {
                  setUIStateMode('default');
                  if (roleMeta.canPublishEvents) {
                    openPublishSheet();
                  } else {
                    navigate('explore');
                  }
                }}
                scaleTo={0.985}
                accessibilityLabel={
                  roleMeta.canPublishEvents ? 'Schedule event' : 'Browse all events'
                }
                style={[
                  styles.emptyAgendaRow,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <EventArtworkCard theme="campus_general" compact style={styles.emptyAgendaThumb} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text numberOfLines={1} style={[styles.emptyAgendaTitle, { color: theme.text }]}>
                    Clear schedule on this date
                  </Text>
                  <View style={{ flexDirection: 'row' }}>
                    <View style={[styles.emptyAgendaTag, { backgroundColor: theme.surfaceTag }]}>
                      <Text style={[styles.emptyAgendaTagText, { color: theme.text }]}>
                        {roleMeta.canPublishEvents ? 'Tap to schedule' : 'Agenda'}
                      </Text>
                    </View>
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[styles.emptyAgendaSub, { color: theme.textMuted }]}
                  >
                    No campus events or deadlines on this date
                  </Text>
                </View>
              </TactilePressable>
            ) : null}

            {dayEvents.map((event) => (
              <EventRowCard
                key={event.id}
                event={event}
                showApprovalStatus={role === 'super_admin'}
                onPress={() => navigate('event_detail', { eventId: event.id })}
                onToggleSave={toggleEventSaved}
              />
            ))}

            {dayNotices.map((notice) => (
              <TactilePressable
                key={notice.id}
                onPress={() => navigate('announcements')}
                scaleTo={0.985}
                accessibilityLabel={`Open notice ${notice.title}`}
                style={[
                  styles.noticeMiniCard,
                  { backgroundColor: theme.note, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.noticeMiniKicker, { color: theme.noteInk }]}>
                  Official Notice · {notice.category}
                </Text>
                <Text style={[styles.noticeMiniTitle, { color: theme.noteInk }]}>
                  {notice.title}
                </Text>
                <Text style={[styles.noticeMiniIssuer, { color: theme.noteInk }]}>
                  {notice.issuerTitle}
                </Text>
              </TactilePressable>
            ))}
          </View>
        </ScreenStateView>
      </ScrollView>

      <View style={styles.bottomCornerDoodle} pointerEvents="none">
        <BotanicalLeavesDoodle isDark={theme.isDark} size={86} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
    paddingBottom: 96,
    gap: 14,
  },
  addBtn: {
    minHeight: 36,
    paddingHorizontal: 13,
    borderRadius: RADII.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  addBtnText: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    fontWeight: '700',
  },
  monthCard: {
    borderRadius: RADII.xxl,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthNavBtn: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontFamily: FONTS.ui,
    fontSize: 16,
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 3,
  },
  weekdayText: {
    fontFamily: FONTS.ui,
    fontSize: 11,
    fontWeight: '600',
  },
  dayCell: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontFamily: FONTS.ui,
    fontSize: 13,
  },
  eventMarker: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  agendaHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateChipGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADII.md,
  },
  dateChipText: {
    fontFamily: FONTS.ui,
    fontSize: 13,
    fontWeight: '700',
  },
  todayJumpChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    borderWidth: 1,
  },
  todayJumpText: {
    fontFamily: FONTS.ui,
    fontSize: 11.5,
    fontWeight: '700',
  },
  agendaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  agendaCount: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    fontWeight: '600',
  },
  noticeMiniCard: {
    padding: 14,
    borderRadius: RADII.lg,
    borderWidth: 1,
    gap: 4,
  },
  noticeMiniKicker: {
    fontFamily: FONTS.ui,
    fontSize: 11,
    fontWeight: '700',
  },
  noticeMiniTitle: {
    fontFamily: FONTS.ui,
    fontSize: 14,
    fontWeight: '700',
  },
  noticeMiniIssuer: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    opacity: 0.85,
  },
  emptyAgendaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    borderRadius: RADII.lg,
    borderWidth: 1,
    gap: 12,
  },
  emptyAgendaThumb: {
    width: 68,
    height: 68,
    borderRadius: RADII.md,
  },
  emptyAgendaTitle: {
    fontFamily: FONTS.ui,
    fontSize: 14.5,
    fontWeight: '700',
  },
  emptyAgendaTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  emptyAgendaTagText: {
    fontFamily: FONTS.ui,
    fontSize: 10,
    fontWeight: '700',
  },
  emptyAgendaSub: {
    fontFamily: FONTS.ui,
    fontSize: 12,
  },
  bottomCornerDoodle: {
    position: 'absolute',
    right: -4,
    bottom: 72,
    opacity: 0.72,
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});
