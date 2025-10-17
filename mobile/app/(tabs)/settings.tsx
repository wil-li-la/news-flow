import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, shadows, borderRadius } from '../../lib/design';
import { signIn, signUp, confirmSignUp, type AuthUser } from 'aws-amplify/auth';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../lib/userService';

type StepState =
  | { kind: 'signIn' }
  | { kind: 'signUp' }
  | { kind: 'confirm_signup' }
  | { kind: 'done' };

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, loading: authLoading, logout, checkUser } = useAuth();
  const [step, setStep] = useState<StepState>({ kind: 'signIn' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customizationLevel, setCustomizationLevel] = useState(50);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const padBottom = useMemo(() => insets.bottom + 88, [insets.bottom]);

  useEffect(() => {
    if (user) {
      setStep({ kind: 'done' });
    } else {
      setStep({ kind: 'signIn' });
    }
  }, [user]);

  useEffect(() => {
    if (user && step.kind === 'done') {
      const timer = setTimeout(() => {
        require('expo-router').router.replace('/(tabs)/swipepage');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, step.kind]);

  const loadUserPreferences = useCallback(async () => {
    if (user) {
      try {
        const prefs = await userService.getUserPreferences();
        setUserPreferences(prefs);
        if (prefs?.customizationLevel !== undefined) {
          setCustomizationLevel(prefs.customizationLevel);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    }
  }, [user]);

  const refreshPreferences = useCallback(async () => {
    setRefreshing(true);
    await loadUserPreferences();
    setRefreshing(false);
  }, [loadUserPreferences]);

  useEffect(() => {
    loadUserPreferences();
  }, [loadUserPreferences]);

  const onSignIn = useCallback(async () => {
    setError(null);
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    try {
      await signIn({ 
        username: email, 
        password,
        options: { authFlowType: "USER_PASSWORD_AUTH" }
      });
      await checkUser(); // Refresh user state
      setStep({ kind: 'done' });
    } catch (e: any) {
      setError(e?.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }, [email, password, checkUser]);

  const onSignUp = useCallback(async () => {
    setError(null);
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    try {
      await signUp({ username: email, password, options: { userAttributes: { email } } });
      setStep({ kind: 'confirm_signup' });
    } catch (e: any) {
      setError(e?.message || 'Sign-up failed');
    } finally {
      setLoading(false);
    }
  }, [email, password]);

  const onConfirmSignUp = useCallback(async () => {
    setError(null);
    if (!confirmCode) {
      setError('Enter confirmation code');
      return;
    }
    setLoading(true);
    try {
      await confirmSignUp({ username: email, confirmationCode: confirmCode });
      setStep({ kind: 'signIn' });
      setConfirmCode('');
    } catch (e: any) {
      setError(e?.message || 'Confirmation failed');
    } finally {
      setLoading(false);
    }
  }, [email, confirmCode]);

  const onSignOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await logout();
      setEmail('');
      setPassword('');
      setConfirmCode('');
      setStep({ kind: 'signIn' });
    } catch (e: any) {
      setError(e?.message || 'Sign-out failed');
    } finally {
      setLoading(false);
    }
  }, [logout]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.gray100 }}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.spacer} />
        <Text style={styles.title}>Settings</Text>
        <View style={styles.spacer} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: padBottom }} keyboardShouldPersistTaps="handled">

      {authLoading ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Loading...</Text>
        </View>
      ) : user ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user.signInDetails?.loginId || email || 'N/A'}</Text>

          <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>News Customization</Text>
          <Text style={styles.label}>Customization Level: {customizationLevel}%</Text>
          <Text style={styles.helperText}>
            {customizationLevel === 0 ? 'No customization - completely random news' :
             customizationLevel === 100 ? 'Fully customized - highly personalized news' :
             `${customizationLevel}% customized - balanced mix of personalized and general news`}
          </Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>0%</Text>
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, { width: `${customizationLevel}%` }]} />
              <View style={styles.sliderButtons}>
                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(value => (
                  <Pressable
                    key={value}
                    style={[styles.sliderButton, customizationLevel === value && styles.sliderButtonActive]}
                    onPress={() => {
                      setCustomizationLevel(value);
                      userService.updateCustomizationLevel(value);
                    }}
                  />
                ))}
              </View>
            </View>
            <Text style={styles.sliderLabel}>100%</Text>
          </View>

          {userPreferences && (
            <>
              
              {userPreferences.preferredLabels && Object.keys(userPreferences.preferredLabels).length > 0 && (
                <View style={styles.preferenceSection}>
                  <Text style={styles.preferenceTitle}>Preferred Labels</Text>
                  <View style={styles.tagsContainer}>
                    {Object.entries(userPreferences.preferredLabels)
                      .sort(([,a], [,b]) => (b as number) - (a as number))
                      .map(([label, count]) => (
                      <View key={label} style={styles.tag}>
                        <Text style={styles.tagText}>{label} ({count as number})</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              
              {userPreferences.preferredCategories && Object.keys(userPreferences.preferredCategories).length > 0 && (
                <View style={styles.preferenceSection}>
                  <Text style={styles.preferenceTitle}>Preferred Categories</Text>
                  <View style={styles.tagsContainer}>
                    {Object.entries(userPreferences.preferredCategories)
                      .sort(([,a], [,b]) => (b as number) - (a as number))
                      .map(([category, count]) => (
                      <View key={category} style={styles.tag}>
                        <Text style={styles.tagText}>{category} ({count as number})</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
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
              <Text style={styles.label}>Email</Text>
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
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                textContentType="password"
                autoComplete="password"
                value={password}
                onChangeText={setPassword}
                placeholder="Min 6 characters"
              />

              <Pressable onPress={onSignIn} disabled={loading} style={[styles.primaryBtn, { opacity: loading ? 0.6 : 1 }]}> 
                <Text style={styles.primaryBtnText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
              </Pressable>
              
              <Pressable onPress={() => setStep({ kind: 'signUp' })} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Don&apos;t have an account? Sign Up</Text>
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
                value={email}
                onChangeText={setEmail}
                placeholder="hello@mycompany.com"
              />
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                textContentType="newPassword"
                autoComplete="password-new"
                value={password}
                onChangeText={setPassword}
                placeholder="Min 6 characters"
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



          {!!error && (
            <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
          )}
        </View>
      )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2, color: colors.gray900 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.gray100,
  },
  spacer: { width: 36, height: 36 },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  sectionTitle: { ...typography.h3, color: colors.gray900, marginBottom: spacing.md, marginTop: spacing.md },
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
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.gray200,
    borderRadius: 3,
    marginHorizontal: spacing.md,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  sliderButtons: {
    position: 'absolute',
    top: -6,
    left: 0,
    right: 0,
    height: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray300,
  },
  sliderButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  sliderLabel: {
    ...typography.caption,
    color: colors.gray600,
    minWidth: 30,
    textAlign: 'center',
  },
  preferencesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refreshBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  refreshBtnText: {
    color: colors.white,
    ...typography.captionMedium,
  },
  preferenceSection: {
    marginBottom: spacing.md,
  },
  preferenceTitle: {
    ...typography.bodySemibold,
    color: colors.gray700,
    marginBottom: spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    color: colors.primary,
    ...typography.caption,
  },
});
