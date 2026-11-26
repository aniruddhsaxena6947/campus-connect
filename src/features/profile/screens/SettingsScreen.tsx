import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  CodeIcon,
  LogOutIcon,
  MoonIcon,
  RefreshIcon,
  ShieldIcon,
  SmartphoneIcon,
  SunIcon,
  UsersIcon,
} from '../../../components/icons/NavIcons';
import { FormField } from '../../../components/ui/FormField';
import { ScreenHeader, TactilePressable } from '../../../components/ui/RNPrimitives';
import { ROLE_PERSONAS, ROLES_ORDER } from '../../../data/mockCampusData';
import { useAuth, useCampusData, useNavigation, useTheme, useUIState } from '../../../store';
import { FONTS, RADII, SPACING } from '../../../theme/tokens';
import { PlatformOS, ThemeMode } from '../../../types/collegeConnect';

const THEME_OPTIONS: Array<{ id: ThemeMode; label: string }> = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'OLED Dark' },
];

const PLATFORM_OPTIONS: Array<{ id: PlatformOS; label: string }> = [
  { id: 'ios', label: 'iOS' },
  { id: 'android', label: 'Android' },
];

export const SettingsScreen: React.FC = () => {
  const { themeMode, setThemeMode, resolvedDark, platformOS, setPlatformOS, theme } = useTheme();
  const {
    role,
    setRole,
    canSwitchRole,
    profile,
    updateProfile,
    replayOnboarding,
    signOut,
  } = useAuth();
  const { navigate } = useNavigation();
  const { resetDemoData } = useCampusData();
  const { toggleInspector } = useUIState();

  const [prevProfile, setPrevProfile] = useState(profile);
  const [nameInput, setNameInput] = useState(profile.name);
  const [programInput, setProgramInput] = useState(profile.program);
  const [yearInput, setYearInput] = useState(profile.year);

  if (profile !== prevProfile) {
    setPrevProfile(profile);
    setNameInput(profile.name);
    setProgramInput(profile.program);
    setYearInput(profile.year);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScreenHeader
        title="Settings"
        subtitle="Theme, platform & campus role."
        showBack
        handwrittenTitle
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.cardTitleRow}>
            {resolvedDark ? (
              <MoonIcon size={18} color={theme.primaryBright} />
            ) : (
              <SunIcon size={18} color={theme.primary} />
            )}
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Appearance &amp; OLED Dark Theme
            </Text>
          </View>
          <Text style={[styles.cardDesc, { color: theme.textMuted }]}>
            Follows system preference or locks Warm Parchment / Pure Black OLED (#000000).
          </Text>

          <View style={styles.segmentRow}>
            {THEME_OPTIONS.map((opt) => {
              const active = themeMode === opt.id;
              return (
                <TactilePressable
                  key={opt.id}
                  onPress={() => setThemeMode(opt.id)}
                  scaleTo={0.95}
                  containerStyle={{ flex: 1 }}
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Theme ${opt.label}`}
                  style={[
                    styles.segmentBtn,
                    {
                      backgroundColor: active ? theme.primary : theme.surfaceTag,
                      borderColor: active ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[styles.segmentText, { color: active ? theme.primaryFg : theme.text }]}
                  >
                    {opt.label}
                  </Text>
                </TactilePressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.cardTitleRow}>
            <SmartphoneIcon size={18} color={theme.isDark ? theme.primaryBright : theme.primary} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Platform Ergonomics</Text>
          </View>
          <Text style={[styles.cardDesc, { color: theme.textMuted }]}>
            Switch header alignment and surface elevation between iOS and Android conventions.
          </Text>

          <View style={styles.segmentRow}>
            {PLATFORM_OPTIONS.map((opt) => {
              const active = platformOS === opt.id;
              return (
                <TactilePressable
                  key={opt.id}
                  onPress={() => setPlatformOS(opt.id)}
                  scaleTo={0.95}
                  containerStyle={{ flex: 1 }}
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Platform ${opt.label}`}
                  style={[
                    styles.segmentBtn,
                    {
                      backgroundColor: active ? theme.primary : theme.surfaceTag,
                      borderColor: active ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.segmentText, { color: active ? theme.primaryFg : theme.text }]}
                  >
                    {opt.label}
                  </Text>
                </TactilePressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.cardTitleRow}>
            <ShieldIcon size={18} color={theme.isDark ? theme.primaryBright : theme.primary} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Active Role Permission View
            </Text>
          </View>
          <Text style={[styles.cardDesc, { color: theme.textMuted }]}>
            {ROLE_PERSONAS[role].badgeDescription}
            {!canSwitchRole ? ' (Assigned in Firestore — managed by your Super Admin.)' : ''}
          </Text>

          <View style={styles.roleGrid}>
            {ROLES_ORDER.map((r) => {
              const active = role === r;
              return (
                <TactilePressable
                  key={r}
                  onPress={() => setRole(r)}
                  disabled={!canSwitchRole && !active}
                  scaleTo={0.95}
                  containerStyle={{ width: '48.5%' }}
                  accessibilityLabel={ROLE_PERSONAS[r].label}
                  style={[
                    styles.roleBtn,
                    {
                      backgroundColor: active ? theme.primary : theme.surfaceTag,
                      borderColor: active ? theme.primary : theme.border,
                      opacity: !canSwitchRole && !active ? 0.45 : 1,
                    },
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[styles.roleBtnText, { color: active ? theme.primaryFg : theme.text }]}
                  >
                    {ROLE_PERSONAS[r].label}
                  </Text>
                </TactilePressable>
              );
            })}
          </View>

          {role === 'super_admin' ? (
            <TactilePressable
              onPress={() => navigate('role_management')}
              scaleTo={0.97}
              accessibilityLabel="Open In-App Role Management"
              style={[
                styles.secondaryRowBtn,
                { borderColor: theme.primary, backgroundColor: theme.sage, marginTop: 2 },
              ]}
            >
              <UsersIcon size={16} color={theme.isDark ? theme.primaryBright : theme.primary} />
              <Text
                style={[
                  styles.secondaryRowText,
                  { color: theme.isDark ? theme.primaryBright : theme.primary },
                ]}
              >
                Open Role &amp; Access Management
              </Text>
            </TactilePressable>
          ) : null}
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Profile Details</Text>
          <FormField
            label="Full Name"
            compact
            value={nameInput}
            onChangeText={setNameInput}
            placeholder="Full Name"
          />
          <View style={styles.twoColInputs}>
            <FormField
              label="Program / Dept"
              compact
              containerStyle={{ flex: 1 }}
              value={programInput}
              onChangeText={setProgramInput}
              placeholder="Program"
            />
            <FormField
              label="Year / Title"
              compact
              containerStyle={{ flex: 1 }}
              value={yearInput}
              onChangeText={setYearInput}
              placeholder="Year"
            />
          </View>
          <TactilePressable
            onPress={() =>
              updateProfile({
                name: nameInput.trim() || profile.name,
                program: programInput.trim() || profile.program,
                year: yearInput.trim() || profile.year,
              })
            }
            scaleTo={0.97}
            accessibilityLabel="Save Profile"
            style={[styles.saveBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={[styles.saveBtnText, { color: theme.primaryFg }]}>Save Profile</Text>
          </TactilePressable>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TactilePressable
            onPress={toggleInspector}
            scaleTo={0.97}
            accessibilityLabel="Open RN Handoff and QA Inspector"
            style={[
              styles.secondaryRowBtn,
              { borderColor: theme.border, backgroundColor: theme.surfaceTag },
            ]}
          >
            <CodeIcon size={16} color={theme.isDark ? theme.primaryBright : theme.primary} />
            <Text style={[styles.secondaryRowText, { color: theme.text }]}>
              Open RN Handoff &amp; QA Inspector
            </Text>
          </TactilePressable>

          <TactilePressable
            onPress={signOut}
            scaleTo={0.97}
            accessibilityLabel="Sign Out or Switch Account"
            style={[styles.secondaryRowBtn, { borderColor: theme.border }]}
          >
            <LogOutIcon size={16} color={theme.text} />
            <Text style={[styles.secondaryRowText, { color: theme.text }]}>
              Sign Out / Switch Account
            </Text>
          </TactilePressable>

          <TactilePressable
            onPress={replayOnboarding}
            scaleTo={0.97}
            accessibilityLabel="Replay Welcome Onboarding"
            style={[styles.secondaryRowBtn, { borderColor: theme.border }]}
          >
            <Text style={[styles.secondaryRowText, { color: theme.text }]}>
              Replay Welcome Onboarding
            </Text>
          </TactilePressable>

          <TactilePressable
            onPress={resetDemoData}
            scaleTo={0.97}
            accessibilityLabel="Clear Local Workspace"
            style={[
              styles.secondaryRowBtn,
              { borderColor: theme.danger, backgroundColor: theme.dangerBg },
            ]}
          >
            <RefreshIcon size={16} color={theme.danger} />
            <Text style={[styles.secondaryRowText, { color: theme.danger }]}>
              Clear Local Workspace
            </Text>
          </TactilePressable>
        </View>
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
  card: {
    borderRadius: RADII.xl,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontFamily: FONTS.ui,
    fontSize: 14.5,
    fontWeight: '700',
  },
  cardDesc: {
    fontFamily: FONTS.ui,
    fontSize: 12.5,
    lineHeight: 18,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: RADII.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  segmentText: {
    fontFamily: FONTS.ui,
    fontSize: 12.5,
    fontWeight: '600',
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleBtn: {
    width: '100%',
    minHeight: 40,
    borderRadius: RADII.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  roleBtnText: {
    fontFamily: FONTS.ui,
    fontSize: 12.5,
    fontWeight: '600',
  },
  twoColInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  saveBtn: {
    minHeight: 44,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  saveBtnText: {
    fontFamily: FONTS.ui,
    fontSize: 13.5,
    fontWeight: '700',
  },
  secondaryRowBtn: {
    minHeight: 42,
    borderRadius: RADII.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  secondaryRowText: {
    fontFamily: FONTS.ui,
    fontSize: 13,
    fontWeight: '700',
  },
});
