import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../store';
import { FONTS, TOUCH_TARGET } from '../../theme/tokens';
import { XIcon } from '../icons/NavIcons';
import { TactilePressable } from './RNPrimitives';

export const BottomSheetHeader: React.FC<{
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  showHandle?: boolean;
  onClose: () => void;
}> = memo(({ title, subtitle, leftIcon, showHandle = true, onClose }) => {
  const { theme } = useTheme();

  return (
    <>
      {showHandle ? (
        <View style={[styles.grabHandle, { backgroundColor: theme.borderStrong }]} />
      ) : null}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          {leftIcon}
          <View>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text>
            ) : null}
          </View>
        </View>
        <TactilePressable
          onPress={onClose}
          scaleTo={0.9}
          hitSlop={8}
          accessibilityLabel="Close sheet"
          style={styles.closeBtn}
        >
          <XIcon size={20} color={theme.textMuted} />
        </TactilePressable>
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  grabHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontFamily: FONTS.ui,
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: FONTS.ui,
    fontSize: 12,
  },
  closeBtn: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
