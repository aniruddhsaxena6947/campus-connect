import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  GoogleGIcon,
  LockIcon,
  MailIcon,
  ShieldIcon,
  UserIcon,
} from '../../../components/icons/NavIcons';
import { SparkStarDoodle, SwirlDoodle } from '../../../components/illustrations/CampusArtwork';
import { FormErrorBanner, FormField } from '../../../components/ui/FormField';
import { TactilePressable } from '../../../components/ui/RNPrimitives';
import { useAuth, useNavigation, useTheme } from '../../../store';
import { FONTS, RADII, SPACING, TOUCH_TARGET } from '../../../theme/tokens';

export const SignUpScreen: React.FC = () => {
  const { authBusy, signInWithGoogle, signUp } = useAuth();
  const { navigate } = useNavigation();
  const { theme } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [program, setProgram] = useState('BCA');
  const [year, setYear] = useState('1st Year');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreateAccount = async () => {
    setErrorMsg(null);
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Re-enter both fields.');
      return;
    }

    const res = await signUp({
      name,
      email,
      program,
      year,
      studentId,
      password,
    });
    if (!res.ok) {
      setErrorMsg(res.error ?? 'Unable to create account.');
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
          styles.blobTopLeft,
          { backgroundColor: theme.sage, opacity: theme.isDark ? 0.3 : 0.55 },
        ]}
      />

      <View style={styles.topBar}>
        <TactilePressable
          onPress={() => navigate('login')}
          scaleTo={0.92}
          accessibilityLabel="Back to sign in"
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

        <View style={styles.doodlesRight}>
          <SparkStarDoodle color={theme.text} size={18} />
          <SwirlDoodle color={theme.textMuted} size={24} />
        </View>
      </View>

      <View style={styles.heroHeader}>
        <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Join CollegeConnect for events, clubs &amp; student passes.
        </Text>
      </View>

      <View
        style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <FormErrorBanner message={errorMsg} />

        <FormField
          label="Full Name"
          compact
          value={name}
          onChangeText={(t) => {
            setName(t);
            if (errorMsg) setErrorMsg(null);
          }}
          placeholder="e.g. Ananya Verma"
          returnKeyType="next"
          renderIcon={(color) => <UserIcon size={17} color={color} />}
        />

        <FormField
          label="University Email"
          compact
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            if (errorMsg) setErrorMsg(null);
          }}
          placeholder="you@collegeconnect.edu"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          renderIcon={(color) => <MailIcon size={17} color={color} />}
        />

        <View style={styles.twoCol}>
          <FormField
            label="Program"
            compact
            containerStyle={{ flex: 1 }}
            value={program}
            onChangeText={setProgram}
            placeholder="B.Tech CS"
          />
          <FormField
            label="Year"
            compact
            containerStyle={{ flex: 1 }}
            value={year}
            onChangeText={setYear}
            placeholder="1st Year"
          />
        </View>

        <FormField
          label="Student ID (Optional)"
          compact
          value={studentId}
          onChangeText={setStudentId}
          placeholder="Auto-generated if left blank (e.g. CC-2025-0642)"
          autoCapitalize="characters"
        />

        <FormField
          label="Password (min. 6 characters)"
          compact
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            if (errorMsg) setErrorMsg(null);
          }}
          placeholder="Create a password"
          isPassword
          passwordVisible={showPassword}
          onTogglePassword={() => setShowPassword((prev) => !prev)}
          autoCapitalize="none"
          renderIcon={(color) => <LockIcon size={17} color={color} />}
        />

        <FormField
          label="Confirm Password"
          compact
          value={confirmPassword}
          onChangeText={(t) => {
            setConfirmPassword(t);
            if (errorMsg) setErrorMsg(null);
          }}
          placeholder="Re-enter password"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={handleCreateAccount}
          renderIcon={(color) => <LockIcon size={17} color={color} />}
        />

        <View
          style={[
            styles.governanceNote,
            { backgroundColor: theme.note, borderColor: theme.border },
          ]}
        >
          <ShieldIcon size={16} color={theme.noteInk} />
          <Text style={[styles.governanceText, { color: theme.noteInk }]}>
            New self-registered accounts start with Student access. Official publishing roles are
            provisioned by university administrators.
          </Text>
        </View>

        <TactilePressable
          onPress={handleCreateAccount}
          disabled={authBusy}
          scaleTo={0.97}
          accessibilityLabel="Create Account"
          style={[
            styles.primaryBtn,
            { backgroundColor: theme.primary, opacity: authBusy ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.primaryBtnText, { color: theme.primaryFg }]}>Create Account</Text>
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
          Already have an account?
        </Text>
        <TactilePressable
          onPress={() => navigate('login')}
          scaleTo={0.95}
          hitSlop={8}
          accessibilityLabel="Sign In"
          style={styles.footerActionBtn}
        >
          <Text
            style={[
              styles.footerActionText,
              { color: theme.isDark ? theme.primaryBright : theme.primary },
            ]}
          >
            Sign In
          </Text>
        </TactilePressable>
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
    gap: 14,
    position: 'relative',
  },
  blobTopLeft: {
    position: 'absolute',
    top: -32,
    left: -36,
    width: 140,
    height: 140,
    borderRadius: 70,
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
  doodlesRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroHeader: {
    gap: 2,
  },
  title: {
    fontFamily: FONTS.handwritten,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 38,
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
    gap: 12,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  governanceNote: {
    borderRadius: RADII.md,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  governanceText: {
    flex: 1,
    fontFamily: FONTS.ui,
    fontSize: 11.5,
    lineHeight: 16,
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
});
