import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, shadows, borderRadius } from '../lib/design';
import {
  signIn,
  signUp,
  confirmSignUp,
  confirmSignIn,
  getCurrentUser,
  signOut,
  type SignInOutput,
  type SignUpOutput,
} from 'aws-amplify/auth';
type SignInStepType =
  | 'DONE'
  | 'CONFIRM_SIGN_IN_WITH_SMS_CODE'
  | 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE'
  | 'CONFIRM_SIGN_IN_WITH_TOTP_CODE'
  | 'CONTINUE_SIGN_IN_WITH_MFA_SELECTION'
  | 'CONTINUE_SIGN_IN_WITH_MFA_SETUP_SELECTION'
  | 'CONTINUE_SIGN_IN_WITH_EMAIL_SETUP'
  | 'CONTINUE_SIGN_IN_WITH_TOTP_SETUP'
  | string;

type StepState =
  | { kind: 'signIn' }
  | { kind: 'signUp' }
  | { kind: 'confirm_signup' }
  | { kind: 'awaiting_otp'; via: 'SMS' | 'EMAIL' | 'TOTP' }
  | { kind: 'select_mfa'; options: string[] }
  | { kind: 'setup_email' }
  | { kind: 'setup_totp'; uri?: string }
  | { kind: 'done' };

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<{ userId: string; username?: string } | null>(null);
  const [step, setStep] = useState<StepState>({ kind: 'signIn' });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [mfa, setMfa] = useState<'EMAIL' | 'SMS' | 'TOTP' | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const padBottom = useMemo(() => insets.bottom + 96, [insets.bottom]);

  const refreshUser = useCallback(async () => {
    try {
      const u = await getCurrentUser();
      setUser({ userId: u.userId, username: (u as any)?.username });
      setStep({ kind: 'done' });
    } catch {
      setUser(null);
      setStep({ kind: 'signIn' });
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const handleNextStep = useCallback((nextStep: SignInOutput['nextStep']) => {
    const s = nextStep?.signInStep as SignInStepType;
    if (!s || s === 'DONE') {
      return refreshUser();
    }
    if (s === 'CONFIRM_SIGN_IN_WITH_SMS_CODE') {
      setStep({ kind: 'awaiting_otp', via: 'SMS' });
      return;
    }
    if (s === 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE') {
      setStep({ kind: 'awaiting_otp', via: 'EMAIL' });
      return;
    }
    if (s === 'CONFIRM_SIGN_IN_WITH_TOTP_CODE') {
      setStep({ kind: 'awaiting_otp', via: 'TOTP' });
      return;
    }
    if (s === 'CONTINUE_SIGN_IN_WITH_MFA_SELECTION' || s === 'CONTINUE_SIGN_IN_WITH_MFA_SETUP_SELECTION') {
      const allowed = (nextStep as any)?.allowedMFATypes as string[] | undefined;
      setStep({ kind: 'select_mfa', options: allowed && allowed.length ? allowed : ['EMAIL', 'SMS', 'TOTP'] });
      return;
    }
    if (s === 'CONTINUE_SIGN_IN_WITH_EMAIL_SETUP') {
      setStep({ kind: 'setup_email' });
      return;
    }
    if (s === 'CONTINUE_SIGN_IN_WITH_TOTP_SETUP') {
      const uri = (nextStep as any)?.totpSetupDetails?.getSetupUri?.();
      setStep({ kind: 'setup_totp', uri });
      return;
    }
    setError(`Unsupported next step: ${s}`);
  }, [refreshUser]);

  const onSignIn = useCallback(async () => {
    setError(null);
    if (!username || !password) {
      setError('Email/username and password are required');
      return;
    }
    setLoading(true);
    try {
      const out = await signIn({ username, password });
      await handleNextStep(out.nextStep);
    } catch (e: any) {
      setError(e?.message || 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  }, [username, password, handleNextStep]);

  const onSubmitOtp = useCallback(async () => {
    setError(null);
    if (!otp) { setError('Enter the code'); return; }
    setLoading(true);
    try {
      const out = await confirmSignIn({ challengeResponse: otp });
      await handleNextStep(out.nextStep);
    } catch (e: any) {
      setError(e?.message || 'Confirmation failed');
    } finally {
      setLoading(false);
    }
  }, [otp, handleNextStep]);

  const onSelectMfa = useCallback(async () => {
    setError(null);
    if (!mfa) { setError('Select an MFA type'); return; }
    setLoading(true);
    try {
      const out = await confirmSignIn({ challengeResponse: mfa });
      await handleNextStep(out.nextStep);
    } catch (e: any) {
      setError(e?.message || 'MFA selection failed');
    } finally {
      setLoading(false);
    }
  }, [mfa, handleNextStep]);

  const onSetupEmail = useCallback(async () => {
    setError(null);
    if (!email) { setError('Enter an email address'); return; }
    setLoading(true);
    try {
      const out = await confirmSignIn({ challengeResponse: email });
      await handleNextStep(out.nextStep);
    } catch (e: any) {
      setError(e?.message || 'Email setup failed');
    } finally {
      setLoading(false);
    }
  }, [email, handleNextStep]);

  const onSetupTotp = useCallback(async () => {
    setError(null);
    if (!otp) { setError('Enter the TOTP code'); return; }
    setLoading(true);
    try {
      const out = await confirmSignIn({ challengeResponse: otp });
      await handleNextStep(out.nextStep);
    } catch (e: any) {
      setError(e?.message || 'TOTP setup failed');
    } finally {
      setLoading(false);
    }
  }, [otp, handleNextStep]);

  const onSignUp = useCallback(async () => {
    setError(null);
    if (!username || !password) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    try {
      await signUp({ username, password, options: { userAttributes: { email: username } } });
      setStep({ kind: 'confirm_signup' });
    } catch (e: any) {
      setError(e?.message || 'Sign-up failed');
    } finally {
      setLoading(false);
    }
  }, [username, password]);

  const onConfirmSignUp = useCallback(async () => {
    setError(null);
    if (!confirmCode) {
      setError('Enter confirmation code');
      return;
    }
    setLoading(true);
    try {
      await confirmSignUp({ username, confirmationCode: confirmCode });
      setStep({ kind: 'signIn' });
      setConfirmCode('');
    } catch (e: any) {
      setError(e?.message || 'Confirmation failed');
    } finally {
      setLoading(false);
    }
  }, [username, confirmCode]);

  const onSignOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await signOut();
      setUser(null);
      setUsername('');
      setPassword('');
      setOtp('');
      setEmail('');
      setConfirmCode('');
      setMfa('');
      setStep({ kind: 'signIn' });
    } catch (e: any) {
      setError(e?.message || 'Sign-out failed');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.gray100, paddingTop: insets.top }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: padBottom }} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Settings</Text>

      {user ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Text style={styles.label}>User ID</Text>
          <Text style={styles.value}>{user.userId}</Text>
          {!!user.username && (
            <>
              <Text style={[styles.label, { marginTop: 12 }]}>Username</Text>
              <Text style={styles.value}>{user.username}</Text>
            </>
          )}

          <Pressable onPress={onSignOut} disabled={loading} style={[styles.primaryBtn, { backgroundColor: colors.error, marginTop: spacing.xl, opacity: loading ? 0.6 : 1 }]}> 
            <Text style={styles.primaryBtnText}>{loading ? 'Signing out…' : 'Sign Out'}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Sign In</Text>

          {step.kind === 'signIn' && (
            <>
              <Text style={styles.label}>Email / Username</Text>
              <TextInput
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                value={username}
                onChangeText={setUsername}
                placeholder="hello@mycompany.com"
              />
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                textContentType="password"
                autoComplete="password"
                passwordRules="minlength: 8; required: lower; required: upper; required: digit; required: special;"
                value={password}
                onChangeText={setPassword}
                placeholder="Min 8 chars, A-Z, a-z, 0-9, symbols"
              />

              <Pressable onPress={onSignIn} disabled={loading} style={[styles.primaryBtn, { opacity: loading ? 0.6 : 1 }]}> 
                <Text style={styles.primaryBtnText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
              </Pressable>
              
              <Pressable onPress={() => setStep({ kind: 'signUp' })} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Don't have an account? Sign Up</Text>
              </Pressable>
            </>
          )}

          {step.kind === 'signUp' && (
            <>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                value={username}
                onChangeText={setUsername}
                placeholder="hello@mycompany.com"
              />
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                textContentType="newPassword"
                autoComplete="password-new"
                passwordRules="minlength: 8; required: lower; required: upper; required: digit; required: special;"
                value={password}
                onChangeText={setPassword}
                placeholder="Min 8 chars, A-Z, a-z, 0-9, symbols"
              />

              <Pressable onPress={onSignUp} disabled={loading} style={[styles.primaryBtn, { opacity: loading ? 0.6 : 1 }]}> 
                <Text style={styles.primaryBtnText}>{loading ? 'Creating Account…' : 'Sign Up'}</Text>
              </Pressable>
              
              <Pressable onPress={() => setStep({ kind: 'signIn' })} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Already have an account? Sign In</Text>
              </Pressable>
            </>
          )}

          {step.kind === 'confirm_signup' && (
            <>
              <Text style={styles.label}>Confirmation Code</Text>
              <Text style={styles.helperText}>Check your email for the confirmation code</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={confirmCode}
                onChangeText={setConfirmCode}
                placeholder="123456"
                maxLength={6}
              />
              <Pressable onPress={onConfirmSignUp} disabled={loading} style={[styles.primaryBtn, { opacity: loading ? 0.6 : 1 }]}> 
                <Text style={styles.primaryBtnText}>{loading ? 'Confirming…' : 'Confirm'}</Text>
              </Pressable>
              
              <Pressable onPress={() => setStep({ kind: 'signUp' })} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Back to Sign Up</Text>
              </Pressable>
            </>
          )}

          {step.kind === 'awaiting_otp' && (
            <>
              <Text style={styles.label}>Enter {step.via} Code</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={otp}
                onChangeText={setOtp}
                placeholder="123456"
                maxLength={8}
              />
              <Pressable onPress={onSubmitOtp} disabled={loading} style={[styles.primaryBtn, { opacity: loading ? 0.6 : 1 }]}> 
                <Text style={styles.primaryBtnText}>{loading ? 'Confirming…' : 'Confirm'}</Text>
              </Pressable>
            </>
          )}

          {step.kind === 'select_mfa' && (
            <>
              <Text style={styles.label}>Select MFA Method</Text>
              <View style={{ marginVertical: 8 }}>
                {step.options.map((opt) => (
                  <Pressable key={opt} onPress={() => setMfa(opt as any)} style={[styles.choiceRow, { borderColor: mfa === opt ? colors.primary : colors.gray200, backgroundColor: mfa === opt ? colors.infoLight : colors.white }]}>
                    <Text style={{ color: colors.gray900, ...typography.bodySemibold }}>{opt}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable onPress={onSelectMfa} disabled={loading || !mfa} style={[styles.primaryBtn, { opacity: loading || !mfa ? 0.6 : 1 }]}> 
                <Text style={styles.primaryBtnText}>{loading ? 'Continuing…' : 'Continue'}</Text>
              </Pressable>
            </>
          )}

          {step.kind === 'setup_email' && (
            <>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                value={email}
                onChangeText={setEmail}
                placeholder="hello@mycompany.com"
              />
              <Pressable onPress={onSetupEmail} disabled={loading || !email} style={[styles.primaryBtn, { opacity: loading || !email ? 0.6 : 1 }]}> 
                <Text style={styles.primaryBtnText}>{loading ? 'Setting up…' : 'Continue'}</Text>
              </Pressable>
            </>
          )}

          {step.kind === 'setup_totp' && (
            <>
              {!!step.uri && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoTitle}>TOTP Setup URI</Text>
                  <Text selectable style={styles.infoText}>{step.uri}</Text>
                </View>
              )}
              <Text style={styles.label}>Enter TOTP Code</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={otp}
                onChangeText={setOtp}
                placeholder="123456"
                maxLength={8}
              />
              <Pressable onPress={onSetupTotp} disabled={loading || !otp} style={[styles.primaryBtn, { opacity: loading || !otp ? 0.6 : 1 }]}> 
                <Text style={styles.primaryBtnText}>{loading ? 'Verifying…' : 'Verify'}</Text>
              </Pressable>
            </>
          )}

          {!!error && (
            <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1, color: colors.gray900, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  sectionTitle: { ...typography.h3, color: colors.gray900, marginBottom: spacing.md },
  label: { ...typography.captionMedium, color: colors.gray600, marginBottom: 6 },
  value: { ...typography.small, color: colors.gray900 },
  input: {
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    ...typography.body,
  },
  primaryBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  primaryBtnText: { color: colors.white, ...typography.bodySemibold },
  secondaryBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { color: colors.primary, ...typography.bodySemibold },
  helperText: { ...typography.caption, color: colors.gray500, marginBottom: spacing.sm },
  choiceRow: {
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  infoBox: {
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoTitle: { ...typography.bodySemibold, color: colors.gray900, marginBottom: 6 },
  infoText: { ...typography.small, color: colors.gray900 },
  errorBox: { backgroundColor: colors.errorLight, borderRadius: borderRadius.sm, padding: spacing.sm, marginTop: spacing.md },
  errorText: { color: colors.error, ...typography.small },
});
