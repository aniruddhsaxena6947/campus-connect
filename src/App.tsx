import React, { lazy, memo, Suspense, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import {
  BookmarkIcon,
  CodeIcon,
  CompassIcon,
  HomeIcon,
  MoonIcon,
  PlusIcon,
  SunIcon,
  UserIcon,
} from './components/icons/NavIcons';
import { AnimatedScreen, FeedbackBannerView, TactilePressable } from './components/ui/RNPrimitives';
import { FirebaseErrorBoundary } from './components/ui/FirebaseErrorBoundary';
import { LoginScreen } from './features/auth/screens/LoginScreen';
import { WelcomeScreen } from './features/auth/screens/WelcomeScreen';
import { HomeScreen } from './features/home/screens/HomeScreen';
import { AppProviders, useAuth, useNavigation, useTheme, useUIState } from './store';
import { FONTS, RADII, TOUCH_TARGET } from './theme/tokens';

const SignUpScreen = lazy(() =>
  import('./features/auth/screens/SignUpScreen').then((m) => ({
    default: m.SignUpScreen,
  }))
);
const ForgotPasswordScreen = lazy(() =>
  import('./features/auth/screens/ForgotPasswordScreen').then((m) => ({
    default: m.ForgotPasswordScreen,
  }))
);
const ExploreScreen = lazy(() =>
  import('./features/events/screens/ExploreScreen').then((m) => ({
    default: m.ExploreScreen,
  }))
);
const EventDetailScreen = lazy(() =>
  import('./features/events/screens/EventDetailScreen').then((m) => ({
    default: m.EventDetailScreen,
  }))
);
const HubsScreen = lazy(() =>
  import('./features/hubs/screens/HubsScreen').then((m) => ({
    default: m.HubsScreen,
  }))
);
const AnnouncementsScreen = lazy(() =>
  import('./features/announcements/screens/AnnouncementsScreen').then((m) => ({
    default: m.AnnouncementsScreen,
  }))
);
const CalendarScreen = lazy(() =>
  import('./features/calendar/screens/CalendarScreen').then((m) => ({
    default: m.CalendarScreen,
  }))
);
const SavedScreen = lazy(() =>
  import('./features/saved/screens/SavedScreen').then((m) => ({
    default: m.SavedScreen,
  }))
);
const NotificationsScreen = lazy(() =>
  import('./features/notifications/screens/NotificationsScreen').then((m) => ({
    default: m.NotificationsScreen,
  }))
);
const ProfileScreen = lazy(() =>
  import('./features/profile/screens/ProfileScreen').then((m) => ({
    default: m.ProfileScreen,
  }))
);
const SettingsScreen = lazy(() =>
  import('./features/profile/screens/SettingsScreen').then((m) => ({
    default: m.SettingsScreen,
  }))
);
const RoleManagementScreen = lazy(() =>
  import('./features/admin/screens/RoleManagementScreen').then((m) => ({
    default: m.RoleManagementScreen,
  }))
);
const CampusAssistantScreen = lazy(() =>
  import('./features/assistant/screens/CampusAssistantScreen').then((m) => ({
    default: m.CampusAssistantScreen,
  }))
);
const HandoffInspector = lazy(() =>
  import('./components/modals/HandoffInspector').then((m) => ({
    default: m.HandoffInspector,
  }))
);
const PublishModal = lazy(() =>
  import('./components/modals/PublishModal').then((m) => ({
    default: m.PublishModal,
  }))
);

const BottomTabButton: React.FC<{
  label: string;
  active: boolean;
  activeColor: string;
  inactiveColor: string;
  onPress: () => void;
  renderIcon: (color: string, filled: boolean) => React.ReactNode;
}> = memo(({ label, active, activeColor, inactiveColor, onPress, renderIcon }) => {
  const color = active ? activeColor : inactiveColor;
  return (
    <TactilePressable
      onPress={onPress}
      scaleTo={0.92}
      pressedOpacity={0.8}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={styles.tabBtnWrap}
    >
      <View
        style={[styles.tabActivePill, { backgroundColor: active ? activeColor : 'transparent' }]}
      />
      {renderIcon(color, active)}
      <Text
        numberOfLines={1}
        style={[styles.tabLabel, { color, fontWeight: active ? '700' : '600' }]}
      >
        {label}
      </Text>
    </TactilePressable>
  );
});

const AppShell: React.FC = () => {
  const { activeScreen, navDirection, navigate } = useNavigation();
  const { roleMeta, openPublishSheet } = useAuth();
  const { inspectorOpen, toggleInspector, publishSheetOpen, showFeedback } = useUIState();
  const { resolvedDark, setThemeMode, platformOS, theme } = useTheme();

  // Keep modal bundles unloaded until first opened, then keep mounted for smooth close animations
  const [mountInspector, setMountInspector] = useState(inspectorOpen);
  const [mountPublish, setMountPublish] = useState(publishSheetOpen);

  if (inspectorOpen && !mountInspector) {
    setMountInspector(true);
  }
  if (publishSheetOpen && !mountPublish) {
    setMountPublish(true);
  }

  const { width, height } = useWindowDimensions();
  const isWideHost = width >= 520;
  const isFullScreenRoute =
    activeScreen === 'welcome' ||
    activeScreen === 'login' ||
    activeScreen === 'signup' ||
    activeScreen === 'forgot_password' ||
    activeScreen === 'event_detail' ||
    activeScreen === 'assistant';
  const canPublish = roleMeta.canPublishEvents || roleMeta.canPublishAnnouncements;

  const renderScreen = () => {
    switch (activeScreen) {
      case 'welcome':
        return <WelcomeScreen />;
      case 'login':
        return <LoginScreen />;
      case 'signup':
        return <SignUpScreen />;
      case 'forgot_password':
        return <ForgotPasswordScreen />;
      case 'home':
        return <HomeScreen />;
      case 'explore':
        return <ExploreScreen />;
      case 'event_detail':
        return <EventDetailScreen />;
      case 'hubs':
        return <HubsScreen />;
      case 'announcements':
        return <AnnouncementsScreen />;
      case 'calendar':
        return <CalendarScreen />;
      case 'saved':
        return <SavedScreen />;
      case 'notifications':
        return <NotificationsScreen />;
      case 'profile':
        return <ProfileScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'role_management':
        return <RoleManagementScreen />;
      case 'assistant':
        return <CampusAssistantScreen />;
      default:
        return <HomeScreen />;
    }
  };

  const handleCenterButton = () => {
    if (canPublish) {
      openPublishSheet();
    } else {
      showFeedback(
        'info',
        'Student Quick Jump',
        'Official publishing is restricted to Faculty, Club In-charge, Hub Head & Super Admin. Opening Hubs & Clubs.'
      );
      navigate('hubs');
    }
  };

  const mobileFrameStyle = isWideHost
    ? [
        styles.mobilePhoneFrame,
        {
          backgroundColor: theme.bg,
          borderColor: theme.borderStrong,
          height: Math.min(height - 32, 860),
        },
        !theme.isDark
          ? {
              shadowColor: '#1C261F',
              shadowOpacity: 0.14,
              shadowRadius: 28,
              shadowOffset: { width: 0, height: 12 },
            }
          : null,
      ]
    : [styles.mobileFullBleed, { backgroundColor: theme.bg }];

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: isWideHost ? theme.backdrop : theme.bg }]}
    >
      {isWideHost ? (
        <View style={styles.previewCornerTools}>
          <TactilePressable
            onPress={() => setThemeMode(resolvedDark ? 'light' : 'dark')}
            scaleTo={0.95}
            accessibilityLabel="Toggle OLED Dark Mode"
            style={[
              styles.cornerPill,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            {resolvedDark ? (
              <SunIcon size={15} color={theme.primaryBright} />
            ) : (
              <MoonIcon size={15} color={theme.primary} />
            )}
            <Text style={[styles.cornerPillText, { color: theme.text }]}>
              {resolvedDark ? 'OLED Dark' : 'Warm Light'}
            </Text>
          </TactilePressable>

          <TactilePressable
            onPress={toggleInspector}
            scaleTo={0.95}
            accessibilityLabel="Open Role & RN Spec Inspector"
            style={[
              styles.cornerPill,
              {
                backgroundColor: inspectorOpen ? theme.primary : theme.surface,
                borderColor: inspectorOpen ? theme.primary : theme.border,
              },
            ]}
          >
            <CodeIcon size={15} color={inspectorOpen ? theme.primaryFg : theme.text} />
            <Text
              style={[
                styles.cornerPillText,
                { color: inspectorOpen ? theme.primaryFg : theme.text },
              ]}
            >
              {roleMeta.shortLabel} · RN Spec
            </Text>
          </TactilePressable>
        </View>
      ) : null}

      <View style={[styles.centerStage, isWideHost ? styles.centerStageWide : null]}>
        <View style={mobileFrameStyle}>
          <View style={{ flex: 1, position: 'relative' }}>
            <AnimatedScreen screenKey={activeScreen} direction={navDirection}>
              <Suspense fallback={<View style={{ flex: 1, backgroundColor: theme.bg }} />}>
                {renderScreen()}
              </Suspense>
            </AnimatedScreen>

            <View style={styles.toastContainer} pointerEvents="box-none">
              <FeedbackBannerView />
            </View>

            {!isFullScreenRoute ? (
              <View
                style={[
                  styles.bottomTabBar,
                  {
                    backgroundColor: theme.tabBarBg,
                    borderTopColor: theme.border,
                  },
                  !theme.isDark && platformOS === 'android'
                    ? { elevation: 10, shadowColor: '#000' }
                    : null,
                ]}
              >
                <View style={styles.tabBtn}>
                  <BottomTabButton
                    label="Home"
                    active={activeScreen === 'home'}
                    activeColor={theme.isDark ? theme.primaryBright : theme.primary}
                    inactiveColor={theme.textMuted}
                    onPress={() => navigate('home')}
                    renderIcon={(c, f) => <HomeIcon size={21} color={c} filled={f} />}
                  />
                </View>

                <View style={styles.tabBtn}>
                  <BottomTabButton
                    label="Explore"
                    active={activeScreen === 'explore'}
                    activeColor={theme.isDark ? theme.primaryBright : theme.primary}
                    inactiveColor={theme.textMuted}
                    onPress={() => navigate('explore')}
                    renderIcon={(c, f) => <CompassIcon size={21} color={c} filled={f} />}
                  />
                </View>

                <View style={styles.centerTabSlot}>
                  <TactilePressable
                    onPress={handleCenterButton}
                    scaleTo={0.9}
                    accessibilityLabel={
                      canPublish ? 'Publish official event or announcement' : 'Open Campus Hubs'
                    }
                    style={[styles.centerFab, { backgroundColor: theme.primary }]}
                  >
                    <PlusIcon size={22} color={theme.primaryFg} />
                  </TactilePressable>
                </View>

                <View style={styles.tabBtn}>
                  <BottomTabButton
                    label="Saved"
                    active={activeScreen === 'saved'}
                    activeColor={theme.isDark ? theme.primaryBright : theme.primary}
                    inactiveColor={theme.textMuted}
                    onPress={() => navigate('saved')}
                    renderIcon={(c, f) => <BookmarkIcon size={21} color={c} filled={f} />}
                  />
                </View>

                <View style={styles.tabBtn}>
                  <BottomTabButton
                    label="Profile"
                    active={activeScreen === 'profile'}
                    activeColor={theme.isDark ? theme.primaryBright : theme.primary}
                    inactiveColor={theme.textMuted}
                    onPress={() => navigate('profile')}
                    renderIcon={(c, f) => <UserIcon size={21} color={c} filled={f} />}
                  />
                </View>
              </View>
            ) : null}
          </View>
        </View>

        {mountInspector ? (
          <Suspense fallback={null}>
            <HandoffInspector />
          </Suspense>
        ) : null}
      </View>

      {mountPublish ? (
        <Suspense fallback={null}>
          <PublishModal />
        </Suspense>
      ) : null}
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <FirebaseErrorBoundary>
      <AppProviders>
        <AppShell />
      </AppProviders>
    </FirebaseErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  previewCornerTools: {
    position: 'absolute',
    top: 14,
    right: 16,
    zIndex: 60,
    flexDirection: 'row',
    gap: 8,
  },
  cornerPill: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: RADII.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cornerPillText: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    fontWeight: '700',
  },
  centerStage: {
    flex: 1,
    flexDirection: 'row',
  },
  centerStageWide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 20,
  },
  mobileFullBleed: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  mobilePhoneFrame: {
    width: '100%',
    maxWidth: 412,
    borderRadius: 36,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 82,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 68,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  tabBtn: {
    flex: 1,
    minHeight: TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnWrap: {
    minWidth: 56,
    minHeight: TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabActivePill: {
    width: 18,
    height: 2.5,
    borderRadius: 2,
    marginBottom: 1,
  },
  tabLabel: {
    fontFamily: FONTS.ui,
    fontSize: 10,
    fontWeight: '600',
  },
  centerTabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
