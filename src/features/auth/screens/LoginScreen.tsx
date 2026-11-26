import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  GoogleGIcon,
  LockIcon,
  MailIcon,
} from '../../../components/icons/NavIcons';
import {
  BotanicalLeavesDoodle,
  CrownDoodle,
  PaperPlaneDoodle,
  SwirlDoodle,
} from '../../../components/illustrations/CampusArtwork';
import { FormErrorBanner, FormField } from '../../../components/ui/FormField';
import { TactilePressable } from '../../../components/ui/RNPrimitives';
import { useAuth, useNavigation, useTheme } from '../../../store';
import { FONTS, RADII, SPACING, TOUCH_TARGET } from '../../../theme/tokens';

export const LoginScreen: React.FC = () => {
  const { authBusy, authPrefillEmail, signIn, signInWithGoogle } = useAuth();
  const { navigate } = useNavigation();
  const { theme } = useTheme();

  const [prevPrefillEmail, setPrevPrefillEmail] = useState(authPrefillEmail);
  const [email, setEmail] = useState(authPrefillEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (authPrefillEmail !== prevPrefillEmail) {
    setPrevPrefillEmail(authPrefillEmail);
    if (authPrefillEmail) {
      setEmail(authPrefillEmail);
    }
  }

  const handleLogin = async () => {
    setErrorMsg(null);
    const res = await signIn(email, password);
    if (!res.ok) {
      setErrorMsg(res.error ?? 'Unable to sign in.');
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    const res = await signInWithGoogle();
    if (!res.ok && res.error) {
      setErrorMsg(res.error);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View
        pointerEvents="none"
        style={[
          styles.blobTopRight,
          { backgroundColor: theme.sage, opacity: theme.isDark ? 0.35 : 0.6 },
        ]}
      />

      <View style={styles.topBar}>
        <TactilePressable
          onPress={() => navigate('welcome')}
          scaleTo={0.92}
          accessibilityLabel="Back to welcome"
          style={[
            styles.backBtn,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <ChevronLeftIcon size={20} color={theme.text} />
        </TactilePressable>

        <PaperPlaneDoodle color={theme.textMuted} width={64} height={32} />
      </View>

      <View style={styles.heroHeader}>
        <View style={styles.titleRow}>
          <CrownDoodle color={theme.text} width={30} height={20} />
          <SwirlDoodle color={theme.textMuted} size={24} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Sign in to your campus events, clubs &amp; passes.
        </Text>
      </View>

      <View
        style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <FormErrorBanner message={errorMsg} />

        <FormField
          label="University Email"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            if (errorMsg) setErrorMsg(null);
          }}
          placeholder="name@collegeconnect.edu"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          renderIcon={(color) => <MailIcon size={17} color={color} />}
        />

        <FormField
          label="Password"
          rightHeaderSlot={
            <TactilePressable
              onPress={() => navigate('forgot_password')}
              scaleTo={0.95}
              hitSlop={8}
              accessibilityLabel="Forgot password"
            >
              <Text
                style={[
                  styles.forgotLink,
                  { color: theme.isDark ? theme.primaryBright : theme.primary },
                ]}
              >
                Forgot password?
              </Text>
            </TactilePressable>
          }
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            if (errorMsg) setErrorMsg(null);
          }}
          placeholder="Enter your password"
          isPassword
          passwordVisible={showPassword}
          onTogglePassword={() => setShowPassword((prev) => !prev)}
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={handleLogin}
          renderIcon={(color) => <LockIcon size={17} color={color} />}
        />

        <TactilePressable
          onPress={handleLogin}
          disabled={authBusy}
          scaleTo={0.97}
          accessibilityLabel="Sign In"
          style={[
            styles.primaryBtn,
            { backgroundColor: theme.primary, opacity: authBusy ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.primaryBtnText, { color: theme.primaryFg }]}>Sign In</Text>
          <ArrowRightIcon size={17} color={theme.primaryFg} />
        </TactilePressable>

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          <Text style={[styles.dividerText, { color: theme.textMuted }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
        </View>

        <TactilePressable
          onPress={() => {
            void handleGoogleSignIn();
          }}
          disabled={authBusy}
          scaleTo={0.97}
          accessibilityLabel="Continue with Google"
          style={[
            styles.googleBtn,
            {
              backgroundColor: theme.surfaceElevated,
              borderColor: theme.border,
              opacity: authBusy ? 0.65 : 1,
            },
          ]}
        >
          <GoogleGIcon size={18} />
          <Text style={[styles.googleBtnText, { color: theme.text }]}>
            {authBusy ? 'Connecting to Google...' : 'Continue with Google'}
          </Text>
        </TactilePressable>
      </View>

      <View style={styles.footerWrap}>
        <Text style={[styles.footerPrompt, { color: theme.textMuted }]}>
          New to CollegeConnect?
        </Text>
        <TactilePressable
          onPress={() => navigate('signup')}
          scaleTo={0.95}
          hitSlop={8}
          accessibilityLabel="Create Account"
          style={styles.footerActionBtn}
        >
          <Text
            style={[
              styles.footerActionText,
              { color: theme.isDark ? theme.primaryBright : theme.primary },
            ]}
          >
            Create Account
          </Text>
        </TactilePressable>
      </View>

      <View style={styles.bottomLeaf} pointerEvents="none">
        <BotanicalLeavesDoodle isDark={theme.isDark} size={74} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: 40,
    paddingBottom: 32,
    gap: 16,
    position: 'relative',
  },
  blobTopRight: {
    position: 'absolute',
    top: -36,
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: RADII.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroHeader: {
    gap: 2,
    paddingTop: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  title: {
    fontFamily: FONTS.handwritten,
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 40,
  },
  subtitle: {
    fontFamily: FONTS.ui,
    fontSize: 13.5,
    lineHeight: 19,
  },
  formCard: {
    borderRadius: RADII.xxl,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  forgotLink: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    fontWeight: '700',
  },
  primaryBtn: {
    minHeight: 50,
    borderRadius: RADII.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2,
  },
  primaryBtnText: {
    fontFamily: FONTS.ui,
    fontSize: 15,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    fontWeight: '600',
  },
  googleBtn: {
    minHeight: 48,
    borderRadius: RADII.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleBtnText: {
    fontFamily: FONTS.ui,
    fontSize: 14,
    fontWeight: '700',
  },
  footerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 2,
  },
  footerPrompt: {
    fontFamily: FONTS.ui,
    fontSize: 13,
  },
  footerActionBtn: {
    minHeight: TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  footerActionText: {
    fontFamily: FONTS.ui,
    fontSize: 13.5,
    fontWeight: '700',
  },
  bottomLeaf: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    opacity: 0.35,
  },
});
