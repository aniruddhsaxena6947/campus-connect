import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  KeyIcon,
  LockIcon,
  MailIcon,
} from '../../../components/icons/NavIcons';
import { PaperPlaneDoodle, SwirlDoodle } from '../../../components/illustrations/CampusArtwork';
import { FormErrorBanner, FormField } from '../../../components/ui/FormField';
import { TactilePressable } from '../../../components/ui/RNPrimitives';
import { useAuth, useNavigation, useTheme } from '../../../store';
import { FONTS, RADII, SPACING, TOUCH_TARGET } from '../../../theme/tokens';

export const ForgotPasswordScreen: React.FC = () => {
  const { authPrefillEmail, requestPasswordReset, resetPassword } = useAuth();
  const { navigate } = useNavigation();
  const { theme } = useTheme();

  const [step, setStep] = useState<'email' | 'verify' | 'done'>('email');
  const [email, setEmail] = useState(authPrefillEmail || '');
  const [issuedCode, setIssuedCode] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSendCode = async () => {
    setErrorMsg(null);
    const res = await requestPasswordReset(email);
    if (!res.ok) {
      setErrorMsg(res.error ?? 'Could not send password reset email.');
      return;
    }
    if (res.code) {
      setIssuedCode(res.code);
      setCodeInput('');
      setStep('verify');
    } else {
      setStep('done');
    }
  };

  const handleReset = () => {
    setErrorMsg(null);
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    const res = resetPassword(email, codeInput, newPassword);
    if (!res.ok) {
      setErrorMsg(res.error ?? 'Could not reset password.');
      return;
    }
    setStep('done');
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
          { backgroundColor: theme.sage, opacity: theme.isDark ? 0.32 : 0.55 },
        ]}
      />

      <View style={styles.topBar}>
        <TactilePressable
          onPress={() => (step === 'verify' ? setStep('email') : navigate('login'))}
          scaleTo={0.92}
          accessibilityLabel="Back"
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

        <PaperPlaneDoodle color={theme.textMuted} width={60} height={30} />
      </View>

      <View style={styles.heroHeader}>
        <View style={styles.titleRow}>
          <KeyIcon size={22} color={theme.isDark ? theme.primaryBright : theme.primary} />
          <SwirlDoodle color={theme.textMuted} size={24} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Reset Password</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          {step === 'email'
            ? 'Enter your registered campus email to receive a 6-digit recovery code.'
            : step === 'verify'
              ? 'Enter the 6-digit code and choose a fresh password.'
              : 'Your campus account password has been updated.'}
        </Text>
      </View>

      <View style={styles.stepRow}>
        {[
          { key: 'email', num: '1', label: 'Email' },
          { key: 'verify', num: '2', label: 'Verify' },
          { key: 'done', num: '3', label: 'Updated' },
        ].map((item, idx) => {
          const activeIdx = step === 'email' ? 0 : step === 'verify' ? 1 : 2;
          const active = idx <= activeIdx;
          return (
            <View key={item.key} style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: active ? theme.primary : theme.surfaceTag,
                    borderColor: active ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.stepNum,
                    styles.tabular,
                    { color: active ? theme.primaryFg : theme.textMuted },
                  ]}
                >
                  {item.num}
                </Text>
              </View>
              <Text style={[styles.stepLabel, { color: active ? theme.text : theme.textMuted }]}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>

      {step === 'email' ? (
        <View
          style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <FormErrorBanner message={errorMsg} />

          <FormField
            label="Registered University Email"
            compact
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="name@collegeconnect.edu"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleSendCode}
            renderIcon={(color) => <MailIcon size={17} color={color} />}
          />

          <TactilePressable
            onPress={handleSendCode}
            scaleTo={0.97}
            accessibilityLabel="Send Recovery Code"
            style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={[styles.primaryBtnText, { color: theme.primaryFg }]}>
              Send Recovery Code
            </Text>
            <ArrowRightIcon size={17} color={theme.primaryFg} />
          </TactilePressable>
        </View>
      ) : step === 'verify' ? (
        <View
          style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <View
            style={[styles.codeBanner, { backgroundColor: theme.note, borderColor: theme.border }]}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.codeBannerTitle, { color: theme.noteInk }]}>
                Campus Inbox Code Sent
              </Text>
              <Text style={[styles.codeBannerBody, styles.tabular, { color: theme.noteInk }]}>
                Use code {issuedCode} for {email.trim().toLowerCase()}
              </Text>
            </View>
            <TactilePressable
              onPress={() => setCodeInput(issuedCode)}
              scaleTo={0.92}
              accessibilityLabel="Autofill verification code"
              style={[styles.autofillBtn, { backgroundColor: theme.primary }]}
            >
              <Text style={[styles.autofillText, { color: theme.primaryFg }]}>Fill</Text>
            </TactilePressable>
          </View>

          <FormErrorBanner message={errorMsg} />

          <FormField
            label="6-Digit Verification Code"
            compact
            value={codeInput}
            onChangeText={(t) => {
              setCodeInput(t);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="Enter 6-digit code"
            keyboardType="number-pad"
            maxLength={6}
            style={styles.tabular}
          />

          <FormField
            label="New Password (min. 6 characters)"
            compact
            value={newPassword}
            onChangeText={(t) => {
              setNewPassword(t);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="Enter new password"
            isPassword
            passwordVisible={showPassword}
            onTogglePassword={() => setShowPassword((prev) => !prev)}
            autoCapitalize="none"
            renderIcon={(color) => <LockIcon size={17} color={color} />}
          />

          <FormField
            label="Confirm New Password"
            compact
            value={confirmPassword}
            onChangeText={(t) => {
              setConfirmPassword(t);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="Re-enter new password"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleReset}
            renderIcon={(color) => <LockIcon size={17} color={color} />}
          />

          <TactilePressable
            onPress={handleReset}
            scaleTo={0.97}
            accessibilityLabel="Update Password"
            style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={[styles.primaryBtnText, { color: theme.primaryFg }]}>Update Password</Text>
            <ArrowRightIcon size={17} color={theme.primaryFg} />
          </TactilePressable>
        </View>
      ) : (
        <View
          style={[
            styles.successCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={[styles.successIconWrap, { backgroundColor: theme.successBg }]}>
            <CheckCircleIcon size={28} color={theme.success} />
          </View>
          <Text style={[styles.successTitle, { color: theme.text }]}>Password Reset Complete</Text>
          <Text style={[styles.successDesc, { color: theme.textMuted }]}>
            Your new password is active for {email.trim().toLowerCase()}. You can now sign in to
            your campus account.
          </Text>
          <TactilePressable
            onPress={() => navigate('login')}
            scaleTo={0.97}
            containerStyle={{ width: '100%' }}
            accessibilityLabel="Back to Sign In"
            style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={[styles.primaryBtnText, { color: theme.primaryFg }]}>Back to Sign In</Text>
            <ArrowRightIcon size={17} color={theme.primaryFg} />
          </TactilePressable>
        </View>
      )}

      {step !== 'done' ? (
        <View style={styles.footerWrap}>
          <Text style={[styles.footerPrompt, { color: theme.textMuted }]}>
            Remembered your password?
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
      ) : null}
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
  heroHeader: {
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
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
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 2,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    fontFamily: FONTS.ui,
    fontSize: 11,
    fontWeight: '700',
  },
  stepLabel: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    fontWeight: '600',
  },
  formCard: {
    borderRadius: RADII.xxl,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  codeBanner: {
    borderRadius: RADII.md,
    borderWidth: 1,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  codeBannerTitle: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    fontWeight: '700',
  },
  codeBannerBody: {
    fontFamily: FONTS.ui,
    fontSize: 11.5,
  },
  autofillBtn: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autofillText: {
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
  successCard: {
    borderRadius: RADII.xxl,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
    gap: 12,
  },
  successIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successTitle: {
    fontFamily: FONTS.ui,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  successDesc: {
    fontFamily: FONTS.ui,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
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
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});
