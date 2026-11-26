import React, { memo, useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { useTheme } from '../../store';
import { FONTS, RADII, TOUCH_TARGET } from '../../theme/tokens';
import { AlertCircleIcon, EyeIcon, EyeOffIcon } from '../icons/NavIcons';
import { TactilePressable } from './RNPrimitives';

export const FormErrorBanner: React.FC<{ message: string | null }> = memo(({ message }) => {
  const { theme } = useTheme();
  if (!message) return null;

  return (
    <View style={[styles.errorBox, { backgroundColor: theme.dangerBg, borderColor: theme.danger }]}>
      <AlertCircleIcon size={16} color={theme.danger} />
      <Text style={[styles.errorText, { color: theme.danger }]}>{message}</Text>
    </View>
  );
});

export interface FormFieldProps extends TextInputProps {
  label: string;
  renderIcon?: (color: string) => React.ReactNode;
  rightHeaderSlot?: React.ReactNode;
  isPassword?: boolean;
  passwordVisible?: boolean;
  onTogglePassword?: () => void;
  containerStyle?: ViewStyle;
  compact?: boolean;
}

export const FormField: React.FC<FormFieldProps> = memo(
  ({
    label,
    renderIcon,
    rightHeaderSlot,
    isPassword = false,
    passwordVisible = false,
    onTogglePassword,
    containerStyle,
    compact = false,
    onFocus,
    onBlur,
    style,
    ...inputProps
  }) => {
    const { theme } = useTheme();
    const [focused, setFocused] = useState(false);
    const activeFocusColor = theme.isDark ? theme.primaryBright : theme.primary;

    return (
      <View style={[styles.fieldGroup, containerStyle]}>
        {rightHeaderSlot ? (
          <View style={styles.labelRow}>
            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{label}</Text>
            {rightHeaderSlot}
          </View>
        ) : (
          <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{label}</Text>
        )}

        <View
          style={[
            renderIcon ? styles.inputWrap : styles.inputWrapPlain,
            compact ? styles.inputWrapCompact : null,
            {
              backgroundColor: theme.surfaceMuted,
              borderColor: focused ? activeFocusColor : theme.border,
            },
          ]}
        >
          {renderIcon ? renderIcon(focused ? activeFocusColor : theme.textMuted) : null}

          <TextInput
            {...inputProps}
            secureTextEntry={isPassword ? !passwordVisible : inputProps.secureTextEntry}
            placeholderTextColor={theme.textMuted}
            onFocus={() => {
              setFocused(true);
              onFocus?.();
            }}
            onBlur={() => {
              setFocused(false);
              onBlur?.();
            }}
            style={[
              styles.input,
              compact ? styles.inputCompact : null,
              { color: theme.text },
              style,
            ]}
          />

          {isPassword && onTogglePassword ? (
            <TactilePressable
              onPress={onTogglePassword}
              scaleTo={0.9}
              accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
              style={styles.eyeBtn}
            >
              {passwordVisible ? (
                <EyeOffIcon size={17} color={theme.textMuted} />
              ) : (
                <EyeIcon size={17} color={theme.textMuted} />
              )}
            </TactilePressable>
          ) : null}
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  errorBox: {
    borderRadius: RADII.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontFamily: FONTS.ui,
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 17,
  },
  fieldGroup: {
    gap: 5,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    fontWeight: '600',
  },
  inputWrap: {
    minHeight: 48,
    borderRadius: RADII.md,
    borderWidth: 1,
    paddingLeft: 12,
    paddingRight: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputWrapPlain: {
    minHeight: 48,
    borderRadius: RADII.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  inputWrapCompact: {
    minHeight: 44,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.ui,
    fontSize: 14,
    height: 44,
    outlineStyle: 'none',
  },
  inputCompact: {
    fontSize: 13.5,
    height: 40,
  },
  eyeBtn: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
