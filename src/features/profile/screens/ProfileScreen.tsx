import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  BellIcon,
  BookmarkIcon,
  ChevronRightIcon,
  CodeIcon,
  HelpCircleIcon,
  LogOutIcon,
  SettingsIcon,
  ShieldIcon,
  TicketIcon,
  UsersIcon,
} from '../../../components/icons/NavIcons';
import {
  CurvedWaveCutout,
  PaperPlaneDoodle,
  SwirlDoodle,
} from '../../../components/illustrations/CampusArtwork';
import { BottomSheetHeader } from '../../../components/ui/BottomSheetHeader';
import { SmoothBottomSheet, TactilePressable } from '../../../components/ui/RNPrimitives';
import { useAuth, useCampusData, useNavigation, useTheme, useUIState } from '../../../store';
import { FONTS, RADII, SPACING } from '../../../theme/tokens';

export const ProfileScreen: React.FC = () => {
  const { profile, role, roleMeta, openPublishSheet, signOut } = useAuth();
  const { events, clubs, announcements, pendingEvents, unreadNotificationsCount } = useCampusData();
  const { navigate } = useNavigation();
  const { toggleInspector } = useUIState();
  const { theme } = useTheme();

  const [helpOpen, setHelpOpen] = useState(false);

  const eventsJoinedCount = useMemo(() => events.filter((e) => e.isRegistered).length, [events]);
  const clubsJoinedCount = useMemo(() => clubs.filter((c) => c.isJoined).length, [clubs]);
  const savedTotalCount = useMemo(
    () => events.filter((e) => e.isSaved).length + announcements.filter((a) => a.isSaved).length,
    [events, announcements]
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

  const menuRows: Array<{
    id: string;
    label: string;
    meta?: string;
    icon: React.ReactNode;
    onPress: () => void;
  }> = [
    {
      id: 'registrations',
      label: 'My Registrations',
      meta: `${eventsJoinedCount} active`,
      icon: <TicketIcon size={18} color={theme.text} />,
      onPress: () => navigate('saved'),
    },
    {
      id: 'saved',
      label: 'Saved Events',
      meta: `${savedTotalCount} saved`,
      icon: <BookmarkIcon size={18} color={theme.text} />,
      onPress: () => navigate('saved'),
    },
    {
      id: 'notifications',
      label: 'Notifications',
      meta: unreadNotificationsCount > 0 ? `${unreadNotificationsCount} unread` : 'Caught up',
      icon: <BellIcon size={18} color={theme.text} />,
      onPress: () => navigate('notifications'),
    },
    ...(role === 'super_admin'
      ? [
          {
            id: 'role_management',
            label: 'Role & Access Management',
            meta: 'Assign Club, Hub, Faculty & Admin roles',
            icon: (
              <UsersIcon size={18} color={theme.isDark ? theme.primaryBright : theme.primary} />
            ),
            onPress: () => navigate('role_management'),
          },
        ]
      : []),
    ...(role !== 'student'
      ? [
          {
            id: 'publish',
            label:
              role === 'super_admin'
                ? 'Governance & Approval Queue'
                : 'Official Publishing Console',
            meta:
              role === 'super_admin' && pendingEvents.length > 0
                ? `${pendingEvents.length} pending`
                : roleMeta.label,
            icon: (
              <ShieldIcon size={18} color={theme.isDark ? theme.primaryBright : theme.primary} />
            ),
            onPress: openPublishSheet,
          },
        ]
      : []),
    {
      id: 'help',
      label: 'Help & Support',
      icon: <HelpCircleIcon size={18} color={theme.text} />,
      onPress: () => setHelpOpen(true),
    },
    {
      id: 'settings',
      label: 'Settings',
      meta: 'Theme, Platform & Role',
      icon: <SettingsIcon size={18} color={theme.text} />,
      onPress: () => navigate('settings'),
    },
    {
      id: 'handoff',
      label: 'RN Spec & Role Switcher',
      meta: `${roleMeta.shortLabel} · Expo Handoff`,
      icon: <CodeIcon size={18} color={theme.isDark ? theme.primaryBright : theme.primary} />,
      onPress: toggleInspector,
    },
    {
      id: 'signout',
      label: 'Sign Out / Switch Account',
      meta: profile.email,
      icon: <LogOutIcon size={18} color={theme.danger} />,
      onPress: signOut,
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 92 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.darkHeader, { backgroundColor: theme.headerDarkBg }]}>
          <View style={styles.headerTopRow}>
            <View style={styles.roleCaptionWrap}>
              <Text style={styles.roleCaptionText}>{roleMeta.label}</Text>
            </View>
            <TactilePressable
              onPress={() => navigate('settings')}
              scaleTo={0.92}
              accessibilityLabel="Open settings"
              style={styles.gearBtn}
            >
              <SettingsIcon size={19} color="#F3F5F0" />
            </TactilePressable>
          </View>

          <View style={styles.doodlePlaneOverlay} pointerEvents="none">
            <PaperPlaneDoodle color="rgba(255,255,255,0.45)" width={70} height={36} />
          </View>
          <View style={styles.doodleSwirlOverlay} pointerEvents="none">
            <SwirlDoodle color="rgba(255,255,255,0.4)" size={24} />
          </View>

          <View style={styles.identityRow}>
            <View style={styles.avatarRing}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text numberOfLines={1} style={styles.profileName}>
                {profile.name}
              </Text>
              <Text numberOfLines={1} style={styles.profileProgram}>
                {profile.program} · {profile.year}
              </Text>
              <Text numberOfLines={1} style={[styles.profileId, styles.tabular]}>
                ID {profile.studentId}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <TactilePressable
              onPress={() => navigate('saved')}
              scaleTo={0.95}
              containerStyle={{ flex: 1 }}
              accessibilityLabel="Events joined"
              style={styles.statTile}
            >
              <Text style={[styles.statNumber, styles.tabular]}>{eventsJoinedCount}</Text>
              <Text numberOfLines={1} style={styles.statLabel}>
                Events Joined
              </Text>
            </TactilePressable>

            <TactilePressable
              onPress={() => navigate('hubs')}
              scaleTo={0.95}
              containerStyle={{ flex: 1 }}
              accessibilityLabel="Clubs joined"
              style={styles.statTile}
            >
              <Text style={[styles.statNumber, styles.tabular]}>{clubsJoinedCount}</Text>
              <Text numberOfLines={1} style={styles.statLabel}>
                Clubs
              </Text>
            </TactilePressable>

            <TactilePressable
              onPress={() => navigate('saved')}
              scaleTo={0.95}
              containerStyle={{ flex: 1 }}
              accessibilityLabel="Saved items"
              style={styles.statTile}
            >
              <Text style={[styles.statNumber, styles.tabular]}>{savedTotalCount}</Text>
              <Text numberOfLines={1} style={styles.statLabel}>
                Saved
              </Text>
            </TactilePressable>
          </View>

          <View style={styles.waveBottom}>
            <CurvedWaveCutout fillColor={theme.bg} height={26} />
          </View>
        </View>

        <View style={styles.menuContainer}>
          <View
            style={[styles.menuCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            {menuRows.map((row, idx) => {
              const isLast = idx === menuRows.length - 1;
              return (
                <TactilePressable
                  key={row.id}
                  onPress={row.onPress}
                  scaleTo={0.985}
                  pressedOpacity={0.78}
                  accessibilityLabel={row.label}
                  style={[
                    styles.menuRow,
                    {
                      borderBottomColor: theme.border,
                      borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                    },
                  ]}
                >
                  <View style={[styles.menuIconWrap, { backgroundColor: theme.surfaceTag }]}>
                    {row.icon}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.menuLabel, { color: theme.text }]}>{row.label}</Text>
                    {row.meta ? (
                      <Text style={[styles.menuMeta, { color: theme.textMuted }]}>{row.meta}</Text>
                    ) : null}
                  </View>
                  <ChevronRightIcon size={18} color={theme.textMuted} />
                </TactilePressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <SmoothBottomSheet
        visible={helpOpen}
        onClose={() => setHelpOpen(false)}
        backdropOpacity={0.52}
      >
        <View
          style={[styles.helpSheet, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <BottomSheetHeader
            title="Campus Help & Support"
            showHandle={false}
            onClose={() => setHelpOpen(false)}
          />
          <Text style={[styles.helpItemTitle, { color: theme.text }]}>
            How do event passes work?
          </Text>
          <Text style={[styles.helpItemBody, { color: theme.textMuted }]}>
            Tap Register Now on any event to reserve a seat. Your digital confirmation ID appears
            under Saved for gate verification.
          </Text>
          <Text style={[styles.helpItemTitle, { color: theme.text }]}>
            Who can publish official campus announcements?
          </Text>
          <Text style={[styles.helpItemBody, { color: theme.textMuted }]}>
            Only verified Faculty, Hub Heads, Club In-charges, and Super Admins can publish official
            campus notices and events. Students have read and registration access.
          </Text>
        </View>
      </SmoothBottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  darkHeader: {
    paddingTop: 42,
    paddingHorizontal: SPACING.lg,
    paddingBottom: 42,
    gap: 16,
    position: 'relative',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleCaptionWrap: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  roleCaptionText: {
    fontFamily: FONTS.ui,
    fontSize: 11,
    fontWeight: '700',
    color: '#F3F5F0',
  },
  gearBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doodlePlaneOverlay: {
    position: 'absolute',
    top: 46,
    right: 68,
  },
  doodleSwirlOverlay: {
    position: 'absolute',
    top: 112,
    right: 26,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#E6D5B8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  avatarInitials: {
    fontFamily: FONTS.ui,
    fontSize: 20,
    fontWeight: '700',
    color: '#1E3A2B',
  },
  profileName: {
    fontFamily: FONTS.ui,
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileProgram: {
    fontFamily: FONTS.ui,
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
  },
  profileId: {
    fontFamily: FONTS.ui,
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statTile: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: RADII.lg,
    paddingVertical: 11,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 2,
  },
  statNumber: {
    fontFamily: FONTS.ui,
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontFamily: FONTS.ui,
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.82)',
  },
  waveBottom: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
  },
  menuContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
  },
  menuCard: {
    borderRadius: RADII.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontFamily: FONTS.ui,
    fontSize: 14,
    fontWeight: '600',
  },
  menuMeta: {
    fontFamily: FONTS.ui,
    fontSize: 11,
    marginTop: 1,
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
  helpSheet: {
    borderTopLeftRadius: RADII.xxl,
    borderTopRightRadius: RADII.xxl,
    borderTopWidth: 1,
    padding: SPACING.xl,
    gap: 12,
  },
  helpItemTitle: {
    fontFamily: FONTS.ui,
    fontSize: 14,
    fontWeight: '700',
  },
  helpItemBody: {
    fontFamily: FONTS.ui,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 6,
  },
});
