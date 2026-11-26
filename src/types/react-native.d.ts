declare module 'react-native' {
  import * as React from 'react';

  export type ColorValue = string;
  export type DimensionValue = number | 'auto' | `${number}%`;

  export interface ViewStyle {
    alignContent?:
      'flex-start' | 'flex-end' | 'center' | 'stretch' | 'space-between' | 'space-around';
    alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
    alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
    aspectRatio?: number | string;
    backgroundColor?: ColorValue;
    borderBottomColor?: ColorValue;
    borderBottomLeftRadius?: number;
    borderBottomRightRadius?: number;
    borderBottomWidth?: number;
    borderColor?: ColorValue;
    borderLeftColor?: ColorValue;
    borderLeftWidth?: number;
    borderRadius?: number;
    borderRightColor?: ColorValue;
    borderRightWidth?: number;
    borderStyle?: 'solid' | 'dotted' | 'dashed';
    borderTopColor?: ColorValue;
    borderTopLeftRadius?: number;
    borderTopRightRadius?: number;
    borderTopWidth?: number;
    borderWidth?: number;
    bottom?: DimensionValue;
    columnGap?: number;
    display?: 'none' | 'flex';
    elevation?: number;
    flex?: number;
    flexBasis?: DimensionValue;
    flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
    flexGrow?: number;
    flexShrink?: number;
    flexWrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
    gap?: number;
    height?: DimensionValue;
    justifyContent?:
      'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
    left?: DimensionValue;
    margin?: DimensionValue;
    marginBottom?: DimensionValue;
    marginHorizontal?: DimensionValue;
    marginLeft?: DimensionValue;
    marginRight?: DimensionValue;
    marginTop?: DimensionValue;
    marginVertical?: DimensionValue;
    maxHeight?: DimensionValue;
    maxWidth?: DimensionValue;
    minHeight?: DimensionValue;
    minWidth?: DimensionValue;
    opacity?: number;
    overflow?: 'visible' | 'hidden' | 'scroll';
    padding?: DimensionValue;
    paddingBottom?: DimensionValue;
    paddingHorizontal?: DimensionValue;
    paddingLeft?: DimensionValue;
    paddingRight?: DimensionValue;
    paddingTop?: DimensionValue;
    paddingVertical?: DimensionValue;
    position?: 'absolute' | 'relative' | 'fixed' | 'sticky';
    right?: DimensionValue;
    rowGap?: number;
    shadowColor?: ColorValue;
    shadowOffset?: { width: number; height: number };
    shadowOpacity?: number;
    shadowRadius?: number;
    top?: DimensionValue;
    transform?: ReadonlyArray<Record<string, unknown>>;
    width?: DimensionValue;
    zIndex?: number;
    // Web-safe cursor/outline hints supported by react-native-web
    cursor?: 'pointer' | 'default' | 'auto';
    outlineStyle?: 'none' | 'solid';
  }

  export interface TextStyle extends ViewStyle {
    color?: ColorValue;
    fontFamily?: string;
    fontSize?: number;
    fontStyle?: 'normal' | 'italic';
    fontVariant?: Array<
      'small-caps' | 'oldstyle-nums' | 'lining-nums' | 'tabular-nums' | 'proportional-nums'
    >;
    fontWeight?:
      'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    letterSpacing?: number;
    lineHeight?: number;
    textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';
    textDecorationLine?: 'none' | 'underline' | 'line-through' | 'underline line-through';
    textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase';
  }

  export interface ImageStyle extends ViewStyle {
    resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
    tintColor?: ColorValue;
  }

  export type RegisteredStyle<T> = number & { __registeredStyleBrand: T };
  export type StyleProp<T> =
    T | RegisteredStyle<T> | false | null | undefined | Array<StyleProp<T>>;

  export interface AccessibilityProps {
    accessible?: boolean;
    accessibilityLabel?: string;
    accessibilityHint?: string;
    accessibilityRole?: string;
    accessibilityState?: {
      disabled?: boolean;
      selected?: boolean;
      checked?: boolean | 'mixed';
      busy?: boolean;
      expanded?: boolean;
    };
  }

  export interface ViewProps extends AccessibilityProps {
    children?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    testID?: string;
    pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
    onLayout?: (event: {
      nativeEvent: { layout: { x: number; y: number; width: number; height: number } };
    }) => void;
  }

  export interface TextProps extends AccessibilityProps {
    children?: React.ReactNode;
    style?: StyleProp<TextStyle>;
    numberOfLines?: number;
    ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
    selectable?: boolean;
    onPress?: () => void;
  }

  export interface PressableStateCallbackType {
    pressed: boolean;
    hovered?: boolean;
    focused?: boolean;
  }

  export interface PressableProps extends AccessibilityProps {
    children?: React.ReactNode | ((state: PressableStateCallbackType) => React.ReactNode);
    style?: StyleProp<ViewStyle> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
    onPress?: (event?: unknown) => void;
    onPressIn?: (event?: unknown) => void;
    onPressOut?: (event?: unknown) => void;
    onLongPress?: (event?: unknown) => void;
    disabled?: boolean;
    hitSlop?: number | { top?: number; bottom?: number; left?: number; right?: number };
    android_ripple?: { color?: string; borderless?: boolean; radius?: number };
    testID?: string;
  }

  export interface ScrollViewProps extends ViewProps {
    horizontal?: boolean;
    showsHorizontalScrollIndicator?: boolean;
    showsVerticalScrollIndicator?: boolean;
    contentContainerStyle?: StyleProp<ViewStyle>;
    keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
    bounces?: boolean;
    stickyHeaderIndices?: number[];
  }

  export interface FlatListProps<ItemT> extends ViewProps {
    data: ReadonlyArray<ItemT> | null | undefined;
    renderItem: (info: { item: ItemT; index: number }) => React.ReactElement | null;
    keyExtractor?: (item: ItemT, index: number) => string;
    ListHeaderComponent?: React.ComponentType<Record<string, unknown>> | React.ReactElement | null;
    ListFooterComponent?: React.ComponentType<Record<string, unknown>> | React.ReactElement | null;
    ListEmptyComponent?: React.ComponentType<Record<string, unknown>> | React.ReactElement | null;
    ItemSeparatorComponent?: React.ComponentType<Record<string, unknown>> | null;
    contentContainerStyle?: StyleProp<ViewStyle>;
    numColumns?: number;
    horizontal?: boolean;
    showsVerticalScrollIndicator?: boolean;
    showsHorizontalScrollIndicator?: boolean;
    scrollEnabled?: boolean;
  }

  export interface TextInputProps extends AccessibilityProps {
    value?: string;
    defaultValue?: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    placeholderTextColor?: ColorValue;
    multiline?: boolean;
    numberOfLines?: number;
    editable?: boolean;
    maxLength?: number;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'number-pad' | 'phone-pad';
    returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
    onSubmitEditing?: () => void;
    secureTextEntry?: boolean;
    onFocus?: () => void;
    onBlur?: () => void;
    style?: StyleProp<TextStyle>;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    autoCorrect?: boolean;
  }

  export interface SwitchProps extends AccessibilityProps {
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    disabled?: boolean;
    trackColor?: { false?: ColorValue; true?: ColorValue };
    thumbColor?: ColorValue;
    ios_backgroundColor?: ColorValue;
    style?: StyleProp<ViewStyle>;
  }

  export interface ModalProps {
    visible?: boolean;
    transparent?: boolean;
    animationType?: 'none' | 'slide' | 'fade';
    onRequestClose?: () => void;
    children?: React.ReactNode;
    statusBarTranslucent?: boolean;
  }

  export interface ActivityIndicatorProps extends ViewProps {
    animating?: boolean;
    color?: ColorValue;
    size?: 'small' | 'large' | number;
  }

  export const View: React.ComponentType<ViewProps>;
  export const SafeAreaView: React.ComponentType<ViewProps>;
  export const Text: React.ComponentType<TextProps>;
  export const Pressable: React.ComponentType<PressableProps>;
  export const TouchableOpacity: React.ComponentType<PressableProps & { activeOpacity?: number }>;
  export const ScrollView: React.ComponentType<ScrollViewProps>;
  export function FlatList<ItemT>(props: FlatListProps<ItemT>): React.ReactElement | null;
  export const TextInput: React.ComponentType<TextInputProps>;
  export const Switch: React.ComponentType<SwitchProps>;
  export const Modal: React.ComponentType<ModalProps>;
  export const ActivityIndicator: React.ComponentType<ActivityIndicatorProps>;

  export namespace StyleSheet {
    type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };
    export function create<T extends NamedStyles<T>>(styles: T & NamedStyles<T>): T;
    export const hairlineWidth: number;
    export const absoluteFillObject: ViewStyle;
  }

  export const Platform: {
    OS: 'ios' | 'android' | 'web' | 'windows' | 'macos';
    select: <T>(specifics: { ios?: T; android?: T; web?: T; default?: T }) => T | undefined;
    Version: string | number;
  };

  export const Dimensions: {
    get: (dim: 'window' | 'screen') => {
      width: number;
      height: number;
      scale: number;
      fontScale: number;
    };
  };

  export function useWindowDimensions(): {
    width: number;
    height: number;
    scale: number;
    fontScale: number;
  };
  export function useColorScheme(): 'light' | 'dark' | null | undefined;

  export const Appearance: {
    getColorScheme: () => 'light' | 'dark' | null | undefined;
    addChangeListener: (
      listener: (preferences: { colorScheme: 'light' | 'dark' | null | undefined }) => void
    ) => {
      remove: () => void;
    };
  };

  export namespace Animated {
    export interface AnimatedInterpolation {
      readonly __animatedInterpolationBrand?: true;
    }

    export class Value {
      constructor(value: number);
      setValue(value: number): void;
      interpolate(config: {
        inputRange: number[];
        outputRange: number[] | string[];
        extrapolate?: 'extend' | 'clamp' | 'identity';
      }): AnimatedInterpolation;
    }

    export interface CompositeAnimation {
      start: (callback?: (result: { finished: boolean }) => void) => void;
      stop: () => void;
    }

    export function timing(
      value: Value,
      config: {
        toValue: number;
        duration?: number;
        delay?: number;
        easing?: (value: number) => number;
        useNativeDriver: boolean;
      }
    ): CompositeAnimation;

    export function spring(
      value: Value,
      config: {
        toValue: number;
        friction?: number;
        tension?: number;
        speed?: number;
        bounciness?: number;
        delay?: number;
        useNativeDriver: boolean;
      }
    ): CompositeAnimation;

    export function parallel(animations: CompositeAnimation[]): CompositeAnimation;
    export function loop(animation: CompositeAnimation): CompositeAnimation;
    export function sequence(animations: CompositeAnimation[]): CompositeAnimation;

    export type AnimatedStyle<T> = StyleProp<T | Record<string, unknown>>;

    export const View: React.ComponentType<
      Omit<ViewProps, 'style'> & { style?: AnimatedStyle<ViewStyle> }
    >;
    export const Text: React.ComponentType<
      Omit<TextProps, 'style'> & { style?: AnimatedStyle<TextStyle> }
    >;
  }

  export const Easing: {
    out: (easing: (t: number) => number) => (t: number) => number;
    inOut: (easing: (t: number) => number) => (t: number) => number;
    cubic: (t: number) => number;
    quad: (t: number) => number;
    linear: (t: number) => number;
  };
}

declare module 'react-native-web' {
  export * from 'react-native';
}
