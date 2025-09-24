import React, { useEffect, useMemo, useState } from 'react';
import { Stack } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, LogOut, LogIn, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { confirmSignUp, getCurrentUser, signIn, signOut, signUp, subscribeAuth } from '../lib/auth';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [authUser, setAuthUser] = useState(getCurrentUser());
  const [mode, setMode] = useState<'signin' | 'signup' | 'confirm'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeAuth(setAuthUser);
    return () => { unsubscribe(); };
  }, []);

  const onSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      setError(e?.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const onSignUp = async () => {
    setError(null);
    setLoading(true);
    try {
      await signUp({ email: email.trim(), password, name: name.trim() });
      setMode('confirm');
    } catch (e: any) {
      setError(e?.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const onConfirm = async () => {
    setError(null);
    setLoading(true);
    try {
      await confirmSignUp(email.trim(), code.trim());
      setMode('signin');
    } catch (e: any) {
      setError(e?.message || 'Confirmation failed');
    } finally {
      setLoading(false);
    }
  };

  const onSignOut = async () => {
    setError(null);
    setLoading(true);
    try {
      await signOut();
    } catch (e: any) {
      setError(e?.message || 'Sign out failed');
    } finally {
      setLoading(false);
    }
  };

  const BOTTOM_BAR_HEIGHT = 64;
  const BOTTOM_BAR_MARGIN = 12;
  const paddingBottom = insets.bottom + BOTTOM_BAR_HEIGHT + BOTTOM_BAR_MARGIN + 16;
  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 12, paddingBottom }}>
        {authUser ? (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <User color="#2563eb" size={20} />
              <Text style={styles.title}>Welcome</Text>
            </View>
            <View style={{ gap: 6 }}>
              <Text style={styles.row}><Text style={styles.label}>Name:</Text> {authUser.name || '—'}</Text>
              <Text style={styles.row}><Text style={styles.label}>Email:</Text> {authUser.email || '—'}</Text>
              <Pressable onPress={onSignOut} style={[styles.primaryBtn, { backgroundColor: '#ef4444', marginTop: 8 }]} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <><LogOut color="#fff" size={16} />
                <Text style={styles.btnText}>Sign Out</Text></>}
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              {mode === 'signin' ? <LogIn color="#2563eb" size={20} /> : mode === 'signup' ? <UserPlus color="#2563eb" size={20} /> : <CheckCircle2 color="#2563eb" size={20} />}
              <Text style={styles.title}>
                {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Confirm Email'}
              </Text>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <AlertCircle color="#ef4444" size={16} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {mode !== 'confirm' && (
              <>
                <TextInput value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" style={styles.input} />
                <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry style={styles.input} />
              </>
            )}
            {mode === 'signup' && (
              <TextInput value={name} onChangeText={setName} placeholder="Name (optional)" style={styles.input} />
            )}
            {mode === 'confirm' && (
              <>
                <TextInput value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" style={styles.input} />
                <TextInput value={code} onChangeText={setCode} placeholder="Verification Code" keyboardType="number-pad" style={styles.input} />
              </>
            )}

            {mode === 'signin' && (
              <Pressable onPress={onSignIn} style={styles.primaryBtn} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <><LogIn color="#fff" size={16} /><Text style={styles.btnText}>Sign In</Text></>}
              </Pressable>
            )}
            {mode === 'signup' && (
              <Pressable onPress={onSignUp} style={styles.primaryBtn} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <><UserPlus color="#fff" size={16} /><Text style={styles.btnText}>Create Account</Text></>}
              </Pressable>
            )}
            {mode === 'confirm' && (
              <Pressable onPress={onConfirm} style={styles.primaryBtn} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <><CheckCircle2 color="#fff" size={16} /><Text style={styles.btnText}>Confirm</Text></>}
              </Pressable>
            )}

            <View style={{ alignItems: 'center', marginTop: 12 }}>
              {mode === 'signin' ? (
                <Pressable onPress={() => { setMode('signup'); setError(null); }}><Text style={styles.link}>No account? Create one</Text></Pressable>
              ) : mode === 'signup' ? (
                <Pressable onPress={() => { setMode('signin'); setError(null); }}><Text style={styles.link}>Have an account? Sign in</Text></Pressable>
              ) : (
                <Pressable onPress={() => { setMode('signin'); setError(null); }}><Text style={styles.link}>Back to sign in</Text></Pressable>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#eef2f7', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '800', color: '#111' },
  input: { backgroundColor: '#f8fafc', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 10 },
  primaryBtn: { marginTop: 12, backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { color: 'white', fontWeight: '700' },
  link: { color: '#2563eb', fontWeight: '600' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fee2e2', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#fecaca', marginBottom: 8 },
  errorText: { color: '#991b1b' },
  row: { color: '#0f172a' },
  label: { color: '#64748b' },
});
