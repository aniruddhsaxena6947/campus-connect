import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONTS, LIGHT_THEME, RADII, SPACING, TOUCH_TARGET } from '../../theme/tokens';
import { TactilePressable } from './RNPrimitives';

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class FirebaseErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = {
    hasError: false,
    errorMessage: '',
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected error occurred.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('CollegeConnect ErrorBoundary caught error:', error, info);
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    let displayDetail = this.state.errorMessage;
    try {
      const parsed = JSON.parse(this.state.errorMessage) as {
        error?: string;
        operationType?: string;
        path?: string | null;
      };
      if (parsed && parsed.error) {
        displayDetail = `${parsed.error}${parsed.path ? ` (${parsed.operationType ?? 'op'} @ ${parsed.path})` : ''}`;
      }
    } catch {
      // Raw non-JSON error message
    }

    return (
      <View style={styles.root}>
        <View style={styles.card}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>
            CollegeConnect encountered an error while syncing campus data.
          </Text>
          <View style={styles.detailBox}>
            <Text style={styles.detailText} numberOfLines={4}>
              {displayDetail}
            </Text>
          </View>
          <TactilePressable onPress={this.handleReset} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try Again</Text>
          </TactilePressable>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LIGHT_THEME.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: LIGHT_THEME.surface,
    borderColor: LIGHT_THEME.border,
    borderWidth: 1,
    borderRadius: RADII.xxl,
    padding: SPACING.xxl,
    gap: 12,
    alignItems: 'center',
  },
  title: {
    fontFamily: FONTS.handwritten,
    fontSize: 30,
    fontWeight: '700',
    color: LIGHT_THEME.text,
    textAlign: 'center',
  },
  body: {
    fontFamily: FONTS.ui,
    fontSize: 13.5,
    color: LIGHT_THEME.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  detailBox: {
    width: '100%',
    backgroundColor: LIGHT_THEME.dangerBg,
    borderColor: LIGHT_THEME.danger,
    borderWidth: 1,
    borderRadius: RADII.md,
    padding: 10,
  },
  detailText: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    color: LIGHT_THEME.danger,
  },
  retryBtn: {
    minHeight: TOUCH_TARGET,
    paddingHorizontal: 24,
    borderRadius: RADII.pill,
    backgroundColor: LIGHT_THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  retryText: {
    fontFamily: FONTS.ui,
    fontSize: 14,
    fontWeight: '700',
    color: LIGHT_THEME.primaryFg,
  },
});
