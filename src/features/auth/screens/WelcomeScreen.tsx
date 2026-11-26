import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowRightIcon, GoogleGIcon } from '../../../components/icons/NavIcons';
import {
  BotanicalLeavesDoodle,
  CampusClocktowerIllustration,
  CrownDoodle,
  CurvedWaveCutout,
  PaperPlaneDoodle,
  SparkStarDoodle,
  SwirlDoodle,
} from '../../../components/illustrations/CampusArtwork';
import { TactilePressable, useReducedMotion } from '../../../components/ui/RNPrimitives';
import { useAuth, useNavigation, useTheme } from '../../../store';
import { FONTS, RADII, SPACING } from '../../../theme/tokens';

export const WelcomeScreen: React.FC = () => {
  const { authBusy, completeOnboarding, signInWithGoogle } = useAuth();
  const { navigate } = useNavigation();
  const { theme } = useTheme();
  const [slide, setSlide] = useState<0 | 1>(0);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const reduced = useReducedMotion();
  const [slideAnim] = useState(() => new Animated.Value(1));
  const [slideShift] = useState(() => new Animated.Value(0));
  const prevSlideRef = useRef<0 | 1>(0);

  const handleGoogleSignIn = async () => {
    setGoogleError(null);
    const res = await signInWithGoogle();
    if (!res.ok && res.error) {
      setGoogleError(res.error);
    }
  };

  useEffect(() => {
    if (prevSlideRef.current === slide) return;
    const dir = slide > prevSlideRef.current ? 1 : -1;
    prevSlideRef.current = slide;
    if (reduced) {
      slideAnim.setValue(1);
      slideShift.setValue(0);
      return;
    }
    slideAnim.setValue(0.15);
    slideShift.setValue(16 * dir);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 210,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(slideShift, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [slide, slideAnim, slideShift, reduced]);

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.bg }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Organic corner sage blobs matching Tile 1 & Tile 8 */}
      <View
        pointerEvents="none"
        style={[
          styles.blobTopLeft,
          { backgroundColor: theme.sage, opacity: theme.isDark ? 0.45 : 0.72 },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.blobTopRight,
          { backgroundColor: theme.sage, opacity: theme.isDark ? 0.35 : 0.55 },
        ]}
      />

      <Animated.View
        style={[styles.slideWrap, { opacity: slideAnim, transform: [{ translateX: slideShift }] }]}
      >
        {slide === 0 ? (
          <View style={styles.slideWrap}>
            <View style={styles.heroHeader}>
              <View style={styles.doodleRow}>
                <View style={{ width: 54 }} />
                <CrownDoodle color={theme.text} width={34} height={24} />
                <PaperPlaneDoodle color={theme.text} width={66} height={34} />
              </View>

              <Text style={[styles.brandDisplay, { color: theme.text }]}>CollegeConnect</Text>
              <Text style={[styles.taglineText, { color: theme.textMuted }]}>
                Same Campus. Bigger Vibes.
              </Text>

              <View style={styles.noteArea}>
                <SwirlDoodle color={theme.textMuted} size={28} />
                {/* Hanging tilted kraft note matching Tile 1 */}
                <View
                  style={[
                    styles.kraftNote,
                    {
                      backgroundColor: theme.note,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.notePin,
                      {
                        backgroundColor: theme.isDark
                          ? 'rgba(232,213,183,0.45)'
                          : 'rgba(125,83,56,0.4)',
                      },
                    ]}
                  />
                  <Text style={[styles.kraftNoteText, { color: theme.noteInk }]}>
                    Events{'\n'}Notices{'\n'}Clubs &amp; More
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.clocktowerWrap}>
              <CampusClocktowerIllustration isDark={theme.isDark} height={205} />
              <View style={styles.waveCut}>
                <CurvedWaveCutout fillColor={theme.bg} height={26} />
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.slideWrap, styles.storyCenter]}>
            <View style={styles.storyClipWrap}>
              <View style={styles.storySwirlLeft} pointerEvents="none">
                <SwirlDoodle color={theme.text} size={28} />
              </View>
              <View style={[styles.storyThread, { backgroundColor: theme.textMuted }]} />
              <View
                style={[
                  styles.pinnedCard,
                  { backgroundColor: theme.note, borderColor: theme.border },
                ]}
              >
                <View style={styles.clipBadge}>
                  <Text style={styles.clipLabel}>PIN</Text>
                </View>
                <Text style={[styles.storyQuote, { color: theme.noteInk }]}>
                  More than just events :)
                </Text>
              </View>
            </View>

            <View style={styles.storyFooterRow}>
              <View style={styles.storyLeavesBox}>
                <View
                  pointerEvents="none"
                  style={[
                    styles.storyCircleBackdrop,
                    { backgroundColor: theme.primary, opacity: theme.isDark ? 0.45 : 0.88 },
                  ]}
                />
                <BotanicalLeavesDoodle isDark={theme.isDark} size={108} />
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <SparkStarDoodle color={theme.textMuted} size={18} />
                <Text style={[styles.storyHeadline, { color: theme.text }]}>Stay Connected</Text>
                <Text
                  style={[
                    styles.storyHeadline,
                    { color: theme.isDark ? theme.primaryBright : theme.primary },
                  ]}
                >
                  Stay Ahead
                </Text>
              </View>
            </View>
          </View>
        )}
      </Animated.View>

      <View style={styles.bottomActions}>
        <View style={styles.dotsRow}>
          <Pressable
            onPress={() => setSlide(0)}
            accessibilityRole="button"
            accessibilityLabel="Welcome screen"
            hitSlop={10}
            style={[
              styles.dot,
              {
                width: slide === 0 ? 26 : 9,
                backgroundColor:
                  slide === 0
                    ? theme.isDark
                      ? theme.primaryBright
                      : theme.primary
                    : theme.sageDeep,
              },
            ]}
          />
          <Pressable
            onPress={() => setSlide(1)}
            accessibilityRole="button"
            accessibilityLabel="Campus story screen"
            hitSlop={10}
            style={[
              styles.dot,
              {
                width: slide === 1 ? 26 : 9,
                backgroundColor:
                  slide === 1
                    ? theme.isDark
                      ? theme.primaryBright
                      : theme.primary
                    : theme.sageDeep,
              },
            ]}
          />
        </View>

        {googleError ? (
          <Text style={[styles.googleErrorText, { color: theme.danger }]}>{googleError}</Text>
        ) : null}

        <TactilePressable
          onPress={completeOnboarding}
          disabled={authBusy}
          accessibilityLabel="Get Started"
          style={[
            styles.ctaButton,
            { backgroundColor: theme.primary, opacity: authBusy ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.ctaLabel, { color: theme.primaryFg }]}>Get Started</Text>
          <ArrowRightIcon size={18} color={theme.primaryFg} />
        </TactilePressable>

        <TactilePressable
          onPress={() => {
            void handleGoogleSignIn();
          }}
          disabled={authBusy}
          scaleTo={0.97}
          accessibilityLabel="Continue with Google"
          style={[
            styles.googleButton,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: authBusy ? 0.65 : 1,
            },
          ]}
        >
          <GoogleGIcon size={18} />
          <Text style={[styles.googleLabel, { color: theme.text }]}>
            {authBusy ? 'Connecting to Google...' : 'Continue with Google'}
          </Text>
        </TactilePressable>

        <View style={styles.authLinksRow}>
          <TactilePressable
            onPress={() => navigate('login')}
            scaleTo={0.95}
            hitSlop={8}
            accessibilityLabel="Sign In"
            style={styles.authTextBtn}
          >
            <Text style={[styles.authLinkText, { color: theme.textMuted }]}>Sign In</Text>
          </TactilePressable>
          <Text style={[styles.authSep, { color: theme.textMuted }]}>·</Text>
          <TactilePressable
            onPress={() => navigate('signup')}
            scaleTo={0.95}
            hitSlop={8}
            accessibilityLabel="New User Create Account"
            style={styles.authTextBtn}
          >
            <Text
              style={[
                styles.authLinkBold,
                { color: theme.isDark ? theme.primaryBright : theme.primary },
              ]}
            >
              New User? Create Account
            </Text>
          </TactilePressable>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: 42,
    paddingBottom: SPACING.xxl,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  blobTopLeft: {
    position: 'absolute',
    top: -45,
    left: -45,
    width: 175,
    height: 175,
    borderRadius: 88,
  },
  blobTopRight: {
    position: 'absolute',
    top: 40,
    right: -55,
    width: 135,
    height: 135,
    borderRadius: 68,
  },
  slideWrap: {
    flex: 1,
    justifyContent: 'space-between',
  },
  heroHeader: {
    alignItems: 'center',
    paddingTop: 6,
  },
  doodleRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  brandDisplay: {
    fontFamily: FONTS.handwritten,
    fontSize: 44,
    fontWeight: '700',
    lineHeight: 50,
    textAlign: 'center',
    marginTop: 2,
    transform: [{ rotate: '-2deg' }],
  },
  taglineText: {
    fontFamily: FONTS.handwritten,
    fontSize: 22,
    fontWeight: '400',
    marginTop: 6,
    textAlign: 'center',
    transform: [{ rotate: '-1deg' }],
  },
  noteArea: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    gap: 14,
    marginTop: 18,
    paddingRight: 8,
  },
  kraftNote: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: RADII.sm,
    borderWidth: 1,
    transform: [{ rotate: '4deg' }],
  },
  notePin: {
    width: 22,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 6,
  },
  kraftNoteText: {
    fontFamily: FONTS.handwritten,
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 23,
  },
  clocktowerWrap: {
    marginHorizontal: -SPACING.xl,
    marginTop: 8,
    position: 'relative',
  },
  waveCut: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
  },
  storyCenter: {
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 28,
  },
  storyClipWrap: {
    alignItems: 'center',
    position: 'relative',
  },
  storySwirlLeft: {
    position: 'absolute',
    top: 8,
    left: 16,
  },
  storyThread: {
    width: 1.5,
    height: 28,
    marginBottom: -4,
    opacity: 0.45,
  },
  storyLeavesBox: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyCircleBackdrop: {
    position: 'absolute',
    bottom: -14,
    left: -26,
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  pinnedCard: {
    alignSelf: 'center',
    width: '86%',
    maxWidth: 270,
    paddingHorizontal: 22,
    paddingVertical: 36,
    borderRadius: RADII.md,
    borderWidth: 1,
    alignItems: 'center',
    transform: [{ rotate: '-2deg' }],
  },
  clipBadge: {
    position: 'absolute',
    top: -12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#4A534D',
  },
  clipLabel: {
    fontFamily: FONTS.ui,
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  storyQuote: {
    fontFamily: FONTS.handwritten,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 40,
    textAlign: 'center',
  },
  storyFooterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  storyHeadline: {
    fontFamily: FONTS.handwritten,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  bottomActions: {
    gap: 14,
    paddingTop: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    height: 9,
    borderRadius: 5,
  },
  ctaButton: {
    minHeight: 52,
    borderRadius: RADII.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  ctaLabel: {
    fontFamily: FONTS.ui,
    fontSize: 15,
    fontWeight: '700',
  },
  googleButton: {
    minHeight: 48,
    borderRadius: RADII.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  googleLabel: {
    fontFamily: FONTS.ui,
    fontSize: 14,
    fontWeight: '700',
  },
  googleErrorText: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  authLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  authTextBtn: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  authLinkText: {
    fontFamily: FONTS.ui,
    fontSize: 13,
    fontWeight: '600',
  },
  authSep: {
    fontFamily: FONTS.ui,
    fontSize: 13,
  },
  authLinkBold: {
    fontFamily: FONTS.ui,
    fontSize: 13,
    fontWeight: '700',
  },
});
