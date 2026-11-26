import React, { memo, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useNavigation, useTheme, useUIState } from '../../store';
import { FONTS, RADII, SPACING, TOUCH_TARGET } from '../../theme/tokens';
import { CampusEvent } from '../../types/collegeConnect';
import {
  AlertCircleIcon,
  BookmarkIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  MapPinIcon,
  RefreshIcon,
  XIcon,
} from '../icons/NavIcons';
import { EventArtworkCard } from '../illustrations/CampusArtwork';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const reducedMotionListeners = new Set<() => void>();
let sharedMediaQuery: MediaQueryList | null = null;
let mediaListenerAttached = false;

function handleReducedMotionChange() {
  reducedMotionListeners.forEach((listener) => listener());
}

function getMediaQuery(): MediaQueryList | null {
  if (
    !sharedMediaQuery &&
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function'
  ) {
    sharedMediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  }
  return sharedMediaQuery;
}

function getReducedMotionSnapshot(): boolean {
  return getMediaQuery()?.matches ?? false;
}

function subscribeReducedMotion(onStoreChange: () => void): () => void {
  reducedMotionListeners.add(onStoreChange);
  const mq = getMediaQuery();
  if (mq && !mediaListenerAttached) {
    mq.addEventListener?.('change', handleReducedMotionChange);
    mediaListenerAttached = true;
  }
  return () => {
    reducedMotionListeners.delete(onStoreChange);
    if (reducedMotionListeners.size === 0 && mq && mediaListenerAttached) {
      mq.removeEventListener?.('change', handleReducedMotionChange);
      mediaListenerAttached = false;
    }
  };
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotionSnapshot, () => false);
}

export const TactilePressable: React.FC<{
  onPress?: () => void;
  disabled?: boolean;
  scaleTo?: number;
  pressedOpacity?: number;
  accessibilityRole?: string;
  accessibilityLabel?: string;
  accessibilityState?: { disabled?: boolean; selected?: boolean };
  hitSlop?: number;
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}> = memo(
  ({
    onPress,
    disabled = false,
    scaleTo = 0.97,
    pressedOpacity = 0.88,
    accessibilityRole = 'button',
    accessibilityLabel,
    accessibilityState,
    hitSlop,
    containerStyle,
    style,
    children,
  }) => {
    const reduced = useReducedMotion();
    const [scale] = useState(() => new Animated.Value(1));
    const [opacity] = useState(() => new Animated.Value(1));

    const handlePressIn = useCallback(() => {
      if (disabled) return;
      if (reduced) {
        opacity.setValue(pressedOpacity);
        return;
      }
      Animated.parallel([
        Animated.spring(scale, {
          toValue: scaleTo,
          speed: 38,
          bounciness: 3,
          useNativeDriver: false,
        }),
        Animated.timing(opacity, {
          toValue: pressedOpacity,
          duration: 90,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ]).start();
    }, [disabled, opacity, pressedOpacity, reduced, scale, scaleTo]);

    const handlePressOut = useCallback(() => {
      if (reduced) {
        opacity.setValue(1);
        return;
      }
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          speed: 26,
          bounciness: 6,
          useNativeDriver: false,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 130,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();
    }, [opacity, reduced, scale]);

    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        hitSlop={hitSlop}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={accessibilityState}
        style={[{ cursor: disabled ? 'default' : 'pointer' }, containerStyle]}
      >
        <Animated.View style={[style, { opacity, transform: [{ scale }] }]}>
          {children}
        </Animated.View>
      </Pressable>
    );
  }
);

export const AnimatedScreen: React.FC<{
  screenKey: string;
  direction?: 'forward' | 'back' | 'tab';
  children: React.ReactNode;
  style?: ViewStyle;
}> = ({ screenKey, direction = 'tab', children, style }) => {
  const reduced = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(1));
  const [translateX] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(0));
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (reduced) {
      opacity.setValue(1);
      translateX.setValue(0);
      translateY.setValue(0);
      return;
    }

    const startX = direction === 'forward' ? 18 : direction === 'back' ? -14 : 0;
    const startY = direction === 'tab' ? 6 : 0;

    opacity.setValue(0.35);
    translateX.setValue(startX);
    translateY.setValue(startY);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 165,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: 190,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 170,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [screenKey, direction, opacity, translateX, translateY, reduced]);

  return (
    <Animated.View
      style={[
        {
          flex: 1,
          opacity,
          transform: [{ translateX }, { translateY }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

export const SmoothBottomSheet: React.FC<{
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  backdropOpacity?: number;
  topSpacerFlex?: number;
}> = ({ visible, onClose, children, backdropOpacity = 0.54, topSpacerFlex = 1 }) => {
  const reduced = useReducedMotion();
  const [rendered, setRendered] = useState(visible);
  const [fade] = useState(() => new Animated.Value(0));
  const [slideY] = useState(() => new Animated.Value(320));
  const visibleRef = useRef(visible);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  if (visible && !rendered) {
    setRendered(true);
  } else if (!visible && rendered && reduced) {
    setRendered(false);
  }

  useEffect(() => {
    if (visible) {
      if (reduced) {
        fade.setValue(1);
        slideY.setValue(0);
        return;
      }
      fade.setValue(0);
      slideY.setValue(280);
      const openAnim = Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.spring(slideY, {
          toValue: 0,
          speed: 22,
          bounciness: 4,
          useNativeDriver: false,
        }),
      ]);
      openAnim.start();
      return () => openAnim.stop();
    } else if (rendered && !reduced) {
      const closeAnim = Animated.parallel([
        Animated.timing(fade, {
          toValue: 0,
          duration: 145,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(slideY, {
          toValue: 260,
          duration: 155,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]);
      closeAnim.start(() => {
        if (!visibleRef.current) setRendered(false);
      });
      const fallbackTimer = setTimeout(() => {
        if (!visibleRef.current) setRendered(false);
      }, 220);
      return () => {
        closeAnim.stop();
        clearTimeout(fallbackTimer);
      };
    }
  }, [visible, rendered, fade, slideY, reduced]);

  if (!rendered) return null;

  return (
    <Modal visible={rendered} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.sheetRoot}>
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: `rgba(0,0,0,${backdropOpacity})`,
              opacity: fade,
            },
          ]}
        />
        <Pressable style={{ flex: topSpacerFlex }} onPress={onClose} />
        <Animated.View style={{ transform: [{ translateY: slideY }] }}>{children}</Animated.View>
      </View>
    </Modal>
  );
};

export const ScreenHeader: React.FC<{
  title: string;
  subtitle?: string;
  showBack?: boolean;
  handwrittenTitle?: boolean;
  rightSlot?: React.ReactNode;
  onBack?: () => void;
}> = memo(({ title, subtitle, showBack = false, handwrittenTitle = false, rightSlot, onBack }) => {
  const { theme, platformOS } = useTheme();
  const { goBack } = useNavigation();
  const isIOS = platformOS === 'ios';

  return (
    <View
      style={[
        styles.headerContainer,
        {
          backgroundColor: theme.bg,
        },
      ]}
    >
      <View style={styles.headerRow}>
        {showBack ? (
          <TactilePressable
            onPress={onBack ?? goBack}
            scaleTo={0.92}
            accessibilityLabel="Go back"
            style={[
              styles.iconButton,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <ChevronLeftIcon size={20} color={theme.text} />
          </TactilePressable>
        ) : null}

        <View style={[styles.headerTitleBox, isIOS && showBack ? { alignItems: 'center' } : null]}>
          <Text
            numberOfLines={1}
            style={[
              handwrittenTitle ? styles.handwrittenHeaderTitle : styles.standardHeaderTitle,
              { color: theme.text },
            ]}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text numberOfLines={1} style={[styles.headerSubtitle, { color: theme.textMuted }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightSlot ? (
          <View style={styles.headerRight}>{rightSlot}</View>
        ) : showBack && isIOS ? (
          <View style={{ width: TOUCH_TARGET }} />
        ) : null}
      </View>
    </View>
  );
});

export const EventRowCard: React.FC<{
  event: CampusEvent;
  onPress: () => void;
  onToggleSave: (eventId: string) => void;
  showApprovalStatus?: boolean;
  style?: ViewStyle;
}> = memo(({ event, onPress, onToggleSave, showApprovalStatus = false, style }) => {
  const { theme, platformOS } = useTheme();
  const [bookmarkScale] = useState(() => new Animated.Value(1));
  const reduced = useReducedMotion();

  const handleBookmark = useCallback(() => {
    if (!reduced) {
      bookmarkScale.setValue(0.78);
      Animated.spring(bookmarkScale, {
        toValue: 1,
        speed: 22,
        bounciness: 10,
        useNativeDriver: false,
      }).start();
    }
    onToggleSave(event.id);
  }, [bookmarkScale, event.id, onToggleSave, reduced]);

  return (
    <View
      style={[
        styles.eventCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        !theme.isDark && platformOS === 'android'
          ? { elevation: 1.5, shadowColor: '#000000' }
          : !theme.isDark
            ? {
                shadowColor: '#1C261F',
                shadowOpacity: 0.05,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
              }
            : null,
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Open ${event.title}`}
        style={({ pressed }) => [
          styles.eventMainPressable,
          {
            opacity: pressed ? 0.82 : 1,
            transform: [{ scale: pressed ? 0.985 : 1 }],
            cursor: 'pointer',
          },
        ]}
      >
        <EventArtworkCard theme={event.artwork} compact style={styles.eventThumb} />

        <View style={styles.eventCardBody}>
          <Text numberOfLines={1} style={[styles.eventTitle, { color: theme.text }]}>
            {event.title}
          </Text>

          <View style={styles.tagRow}>
            <View style={[styles.categoryTag, { backgroundColor: theme.surfaceTag }]}>
              <Text style={[styles.categoryTagText, { color: theme.text }]}>{event.category}</Text>
            </View>
            {event.isRegistered ? (
              <Text
                style={[
                  styles.registeredHint,
                  { color: theme.isDark ? theme.primaryBright : theme.primary },
                ]}
              >
                · Registered
              </Text>
            ) : null}
            {showApprovalStatus && event.status === 'pending' ? (
              <Text style={[styles.registeredHint, { color: theme.danger }]}>· Pending</Text>
            ) : null}
          </View>

          <View style={styles.eventDetailRow}>
            <MapPinIcon size={12} color={theme.textMuted} />
            <Text numberOfLines={1} style={[styles.eventDetailText, { color: theme.textMuted }]}>
              {event.venue}
            </Text>
          </View>

          <View style={styles.eventDetailRow}>
            <CalendarIcon size={12} color={theme.textMuted} />
            <Text
              numberOfLines={1}
              style={[styles.eventDetailText, styles.tabular, { color: theme.textMuted }]}
            >
              {event.dateDisplay} · {event.time}
            </Text>
          </View>
        </View>
      </Pressable>

      <Pressable
        onPress={handleBookmark}
        accessibilityRole="button"
        accessibilityLabel={event.isSaved ? 'Remove bookmark' : 'Save event'}
        hitSlop={6}
        style={({ pressed }) => [
          styles.bookmarkHitbox,
          { opacity: pressed ? 0.7 : 1, cursor: 'pointer' },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: bookmarkScale }] }}>
          <BookmarkIcon
            size={18}
            color={
              event.isSaved ? (theme.isDark ? theme.primaryBright : theme.primary) : theme.textMuted
            }
            filled={event.isSaved}
          />
        </Animated.View>
      </Pressable>
    </View>
  );
});

export const LoadingSkeletonList: React.FC<{ count?: number }> = memo(({ count = 4 }) => {
  const { theme } = useTheme();
  const reduced = useReducedMotion();
  const [pulse] = useState(() => new Animated.Value(reduced ? 0.7 : 0.45));

  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.9, duration: 680, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0.45, duration: 680, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduced]);

  return (
    <View style={{ gap: 10 }}>
      {Array.from({ length: count }).map((_, idx) => (
        <Animated.View
          key={idx}
          style={[
            styles.skeletonCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: pulse,
            },
          ]}
        >
          <View style={[styles.skeletonThumb, { backgroundColor: theme.surfaceMuted }]} />
          <View style={{ flex: 1, gap: 8, justifyContent: 'center' }}>
            <View
              style={[
                styles.skeletonLine,
                { width: '75%', height: 14, backgroundColor: theme.surfaceMuted },
              ]}
            />
            <View
              style={[styles.skeletonLine, { width: '32%', backgroundColor: theme.surfaceMuted }]}
            />
            <View
              style={[styles.skeletonLine, { width: '58%', backgroundColor: theme.surfaceMuted }]}
            />
          </View>
        </Animated.View>
      ))}
    </View>
  );
});

export const EmptyStateCard: React.FC<{
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}> = memo(({ title, description, actionLabel, onAction }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.stateCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.stateIconWrap, { backgroundColor: theme.sage }]}>
        <CalendarIcon size={24} color={theme.isDark ? theme.primaryBright : theme.primary} />
      </View>
      <Text style={[styles.stateTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.stateDescription, { color: theme.textMuted }]}>{description}</Text>
      {actionLabel && onAction ? (
        <TactilePressable
          onPress={onAction}
          style={[styles.stateCta, { backgroundColor: theme.primary }]}
        >
          <Text style={[styles.stateCtaText, { color: theme.primaryFg }]}>{actionLabel}</Text>
        </TactilePressable>
      ) : null}
    </View>
  );
});

export const ErrorStateCard: React.FC<{
  title?: string;
  description?: string;
  onRetry: () => void;
}> = memo(
  ({
    title = 'Unable to load campus feed',
    description = 'Check your connection or retry refreshing the latest university updates.',
    onRetry,
  }) => {
    const { theme } = useTheme();

    return (
      <View
        style={[styles.stateCard, { backgroundColor: theme.surface, borderColor: theme.danger }]}
      >
        <View style={[styles.stateIconWrap, { backgroundColor: theme.dangerBg }]}>
          <AlertCircleIcon size={24} color={theme.danger} />
        </View>
        <Text style={[styles.stateTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.stateDescription, { color: theme.textMuted }]}>{description}</Text>
        <TactilePressable
          onPress={onRetry}
          style={[
            styles.stateCta,
            {
              backgroundColor: theme.danger,
              flexDirection: 'row',
              gap: 8,
            },
          ]}
        >
          <RefreshIcon size={16} color="#FFFFFF" />
          <Text style={[styles.stateCtaText, { color: '#FFFFFF' }]}>Try Again</Text>
        </TactilePressable>
      </View>
    );
  }
);

export const FeedbackBannerView: React.FC = () => {
  const { feedback, clearFeedback } = useUIState();
  const { theme } = useTheme();
  const reduced = useReducedMotion();
  const [slideY] = useState(() => new Animated.Value(18));
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!feedback) return;
    if (reduced) {
      slideY.setValue(0);
      opacity.setValue(1);
      return;
    }
    slideY.setValue(18);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(slideY, {
        toValue: 0,
        speed: 26,
        bounciness: 6,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [feedback, opacity, reduced, slideY]);

  if (!feedback) return null;

  const isError = feedback.kind === 'error';
  const isSuccess = feedback.kind === 'success';
  const bg = isError ? theme.dangerBg : isSuccess ? theme.successBg : theme.surfaceElevated;
  const accent = isError ? theme.danger : isSuccess ? theme.success : theme.primaryBright;

  return (
    <Animated.View
      style={[
        styles.toastWrap,
        {
          backgroundColor: theme.surface,
          borderColor: accent,
          opacity,
          transform: [{ translateY: slideY }],
        },
      ]}
    >
      <View style={[styles.toastInner, { backgroundColor: bg }]}>
        {isError ? (
          <AlertCircleIcon size={18} color={accent} />
        ) : (
          <CheckCircleIcon size={18} color={accent} />
        )}
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={[styles.toastTitle, { color: theme.text }]}>
            {feedback.title}
          </Text>
          <Text numberOfLines={2} style={[styles.toastMsg, { color: theme.textMuted }]}>
            {feedback.message}
          </Text>
        </View>
        <Pressable
          onPress={clearFeedback}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Dismiss banner"
          style={styles.toastClose}
        >
          <XIcon size={16} color={theme.textMuted} />
        </Pressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  headerContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 38,
    paddingBottom: SPACING.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: TOUCH_TARGET,
  },
  iconButton: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: RADII.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    flex: 1,
    justifyContent: 'center',
  },
  handwrittenHeaderTitle: {
    fontFamily: FONTS.handwritten,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 36,
  },
  standardHeaderTitle: {
    fontFamily: FONTS.ui,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  headerSubtitle: {
    fontFamily: FONTS.ui,
    fontSize: 13,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    borderRadius: RADII.lg,
    borderWidth: 1,
    gap: 8,
  },
  eventMainPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eventThumb: {
    width: 72,
    height: 72,
    borderRadius: RADII.md,
  },
  eventCardBody: {
    flex: 1,
    gap: 3,
  },
  eventTitle: {
    fontFamily: FONTS.ui,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 1,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryTagText: {
    fontFamily: FONTS.ui,
    fontSize: 10,
    fontWeight: '700',
  },
  registeredHint: {
    fontFamily: FONTS.ui,
    fontSize: 11,
    fontWeight: '700',
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  eventDetailText: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    flexShrink: 1,
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
  bookmarkHitbox: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: -4,
    marginRight: -6,
  },
  skeletonCard: {
    flexDirection: 'row',
    padding: 11,
    borderRadius: RADII.lg,
    borderWidth: 1,
    gap: 12,
    alignItems: 'center',
  },
  skeletonThumb: {
    width: 72,
    height: 72,
    borderRadius: RADII.md,
  },
  skeletonLine: {
    height: 11,
    borderRadius: 6,
  },
  stateCard: {
    padding: SPACING.xxl,
    borderRadius: RADII.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginVertical: SPACING.sm,
  },
  stateIconWrap: {
    width: 52,
    height: 52,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stateTitle: {
    fontFamily: FONTS.ui,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  stateDescription: {
    fontFamily: FONTS.ui,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },
  stateCta: {
    minHeight: TOUCH_TARGET,
    paddingHorizontal: 20,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  stateCtaText: {
    fontFamily: FONTS.ui,
    fontSize: 14,
    fontWeight: '600',
  },
  toastWrap: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  toastTitle: {
    fontFamily: FONTS.ui,
    fontSize: 13,
    fontWeight: '700',
  },
  toastMsg: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    marginTop: 1,
  },
  toastClose: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
