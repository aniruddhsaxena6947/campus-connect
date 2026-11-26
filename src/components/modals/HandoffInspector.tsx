import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { HANDOFF_SPECS } from '../../data/handoffSpecs';
import { ROLE_PERSONAS, ROLES_ORDER } from '../../data/mockCampusData';
import { useAuth, useNavigation, useTheme, useUIState } from '../../store';
import { FONTS, RADII, TOUCH_TARGET } from '../../theme/tokens';
import { PlatformOS, ThemeMode, UIStateMode } from '../../types/collegeConnect';
import { CodeIcon, XIcon } from '../icons/NavIcons';
import { SmoothBottomSheet } from '../ui/RNPrimitives';

const STATES: UIStateMode[] = ['default', 'loading', 'empty', 'error', 'success'];
const THEMES: Array<{ id: ThemeMode; label: string }> = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'OLED' },
];
const PLATFORMS: Array<{ id: PlatformOS; label: string }> = [
  { id: 'ios', label: 'iOS' },
  { id: 'android', label: 'Android' },
];

const InspectorBody: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { activeScreen } = useNavigation();
  const { role, setRole, canSwitchRole } = useAuth();
  const { uiStateMode, setUIStateMode, showFeedback } = useUIState();
  const { themeMode, setThemeMode, platformOS, setPlatformOS, theme } = useTheme();

  const spec = HANDOFF_SPECS[activeScreen];

  return (
    <View
      style={[styles.panelWrap, { backgroundColor: theme.surface, borderLeftColor: theme.border }]}
    >
      <View style={[styles.panelHeader, { borderBottomColor: theme.border }]}>
        <View style={styles.panelTitleGroup}>
          <CodeIcon size={18} color={theme.isDark ? theme.primaryBright : theme.primary} />
          <View>
            <Text style={[styles.panelTitle, { color: theme.text }]}>
              RN / Expo Handoff &amp; QA
            </Text>
            <Text style={[styles.panelSub, { color: theme.textMuted }]}>{spec.expoRoute}</Text>
          </View>
        </View>

        <Pressable
          onPress={onClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Close inspector"
          style={styles.closeBtn}
        >
          <XIcon size={20} color={theme.textMuted} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.panelScroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Role Switcher */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
            Role View (RBAC){!canSwitchRole ? ' · Firestore Locked' : ''}
          </Text>
          <View style={styles.pillGrid}>
            {ROLES_ORDER.map((r) => {
              const active = role === r;
              return (
                <Pressable
                  key={r}
                  onPress={() => setRole(r)}
                  disabled={!canSwitchRole && !active}
                  style={[
                    styles.pillBtn,
                    {
                      backgroundColor: active ? theme.primary : theme.surfaceMuted,
                      borderColor: active ? theme.primary : theme.border,
                      opacity: !canSwitchRole && !active ? 0.45 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.pillText, { color: active ? theme.primaryFg : theme.text }]}>
                    {ROLE_PERSONAS[r].shortLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* UI State Switcher */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
            Screen State Preview
          </Text>
          <View style={styles.pillGrid}>
            {STATES.map((st) => {
              const active = uiStateMode === st;
              return (
                <Pressable
                  key={st}
                  onPress={() => {
                    if (st === 'success') {
                      setUIStateMode('default');
                      showFeedback(
                        'success',
                        'Success State Verified',
                        `${spec.title} action completed cleanly.`
                      );
                    } else {
                      setUIStateMode(st);
                    }
                  }}
                  style={[
                    styles.pillBtn,
                    {
                      backgroundColor: active ? theme.primary : theme.surfaceMuted,
                      borderColor: active ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.pillText, { color: active ? theme.primaryFg : theme.text }]}>
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Theme & Platform */}
        <View style={styles.rowTwo}>
          <View style={[styles.section, { flex: 1.3 }]}>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Theme</Text>
            <View style={styles.inlineBtns}>
              {THEMES.map((t) => {
                const active = themeMode === t.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => setThemeMode(t.id)}
                    style={[
                      styles.miniBtn,
                      {
                        backgroundColor: active ? theme.primary : theme.surfaceMuted,
                        borderColor: active ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.miniBtnText, { color: active ? theme.primaryFg : theme.text }]}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={[styles.section, { flex: 1 }]}>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Platform</Text>
            <View style={styles.inlineBtns}>
              {PLATFORMS.map((p) => {
                const active = platformOS === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setPlatformOS(p.id)}
                    style={[
                      styles.miniBtn,
                      {
                        backgroundColor: active ? theme.primary : theme.surfaceMuted,
                        borderColor: active ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.miniBtnText, { color: active ? theme.primaryFg : theme.text }]}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Per-Screen Spec Documentation */}
        <View
          style={[
            styles.specBox,
            { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.specHeading, { color: theme.text }]}>{spec.title}</Text>
          <Text style={[styles.specPurpose, { color: theme.textMuted }]}>{spec.purpose}</Text>

          <Text style={[styles.specSubhead, { color: theme.text }]}>Component Hierarchy</Text>
          {spec.componentHierarchy.map((line, i) => (
            <Text key={i} style={[styles.monoLine, { color: theme.textMuted }]}>
              {line}
            </Text>
          ))}

          <Text style={[styles.specSubhead, { color: theme.text }]}>
            Spacing &amp; Touch Targets
          </Text>
          {spec.spacingTokens.map((line, i) => (
            <Text key={i} style={[styles.bulletLine, { color: theme.textMuted }]}>
              · {line}
            </Text>
          ))}

          <Text style={[styles.specSubhead, { color: theme.text }]}>Typography Tokens</Text>
          {spec.typographyTokens.map((line, i) => (
            <Text key={i} style={[styles.bulletLine, { color: theme.textMuted }]}>
              · {line}
            </Text>
          ))}

          <Text style={[styles.specSubhead, { color: theme.text }]}>
            Color Tokens ({theme.isDark ? 'Pure OLED Dark' : 'Warm Ivory Light'})
          </Text>
          {(theme.isDark ? spec.colorTokens.oledDark : spec.colorTokens.light).map((line, i) => (
            <Text key={i} style={[styles.bulletLine, { color: theme.textMuted }]}>
              · {line}
            </Text>
          ))}

          <Text style={[styles.specSubhead, { color: theme.text }]}>
            Active Role Rule ({ROLE_PERSONAS[role].label})
          </Text>
          <Text
            style={[
              styles.bulletLine,
              { color: theme.isDark ? theme.primaryBright : theme.primary },
            ]}
          >
            {spec.rolePermissions[role]}
          </Text>

          <Text style={[styles.specSubhead, { color: theme.text }]}>
            Interaction &amp; Responsive Rules
          </Text>
          {[...spec.interactionBehavior, ...spec.responsiveRules].map((line, i) => (
            <Text key={i} style={[styles.bulletLine, { color: theme.textMuted }]}>
              · {line}
            </Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export const HandoffInspector: React.FC = () => {
  const { inspectorOpen, setInspectorOpen } = useUIState();
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const isDesktopPane = width >= 900;

  if (isDesktopPane) {
    if (!inspectorOpen) return null;
    return (
      <View
        style={{
          width: 370,
          height: Math.min(height - 32, 860),
          borderRadius: 28,
          borderWidth: 1,
          borderColor: theme.borderStrong,
          overflow: 'hidden',
        }}
      >
        <InspectorBody onClose={() => setInspectorOpen(false)} />
      </View>
    );
  }

  return (
    <SmoothBottomSheet
      visible={inspectorOpen}
      onClose={() => setInspectorOpen(false)}
      backdropOpacity={0.55}
      topSpacerFlex={0.12}
    >
      <View
        style={{
          height: Math.min(height * 0.85, 700),
          borderTopLeftRadius: RADII.xxl,
          borderTopRightRadius: RADII.xxl,
          overflow: 'hidden',
        }}
      >
        <InspectorBody onClose={() => setInspectorOpen(false)} />
      </View>
    </SmoothBottomSheet>
  );
};

const styles = StyleSheet.create({
  panelWrap: {
    flex: 1,
    borderLeftWidth: 1,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  panelTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  panelTitle: {
    fontFamily: FONTS.ui,
    fontSize: 14,
    fontWeight: '700',
  },
  panelSub: {
    fontFamily: FONTS.ui,
    fontSize: 11,
  },
  closeBtn: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelScroll: {
    padding: 16,
    gap: 14,
  },
  section: {
    gap: 6,
  },
  sectionLabel: {
    fontFamily: FONTS.ui,
    fontSize: 11,
    fontWeight: '700',
  },
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pillBtn: {
    minHeight: 34,
    paddingHorizontal: 11,
    borderRadius: RADII.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    fontWeight: '600',
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 10,
  },
  inlineBtns: {
    flexDirection: 'row',
    gap: 5,
  },
  miniBtn: {
    flex: 1,
    minHeight: 34,
    borderRadius: RADII.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  miniBtnText: {
    fontFamily: FONTS.ui,
    fontSize: 11,
    fontWeight: '600',
  },
  specBox: {
    borderRadius: RADII.xl,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  specHeading: {
    fontFamily: FONTS.ui,
    fontSize: 15,
    fontWeight: '700',
  },
  specPurpose: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  specSubhead: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  monoLine: {
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
  bulletLine: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    lineHeight: 17,
  },
});
