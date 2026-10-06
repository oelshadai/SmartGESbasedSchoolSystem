import { useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useSession } from '../session';

const palette = { forest: '#123B34', green: '#1D6855', paper: '#F6F4EC', white: '#FFFFFF', muted: '#71817B', line: '#E5E8DF', gold: '#E9B949' };

export default function LoginRoute() {
  const { student, signIn } = useSession();
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  if (student) return <Redirect href="/(student)" />;

  const submit = async () => {
    if (!studentId.trim() || !password) {
      setError('Enter your student ID and password to continue.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await signIn(studentId, password);
      setPassword('');
      router.replace('/(student)');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Sign in failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.brand}>
        <View style={styles.brandStamp}><Text style={styles.brandStampText}>SG</Text></View>
        <Text style={styles.brandName}>SMARTGES</Text>
        <Text style={styles.brandEdition}>STUDENT DESK · MOBILE</Text>
      </View>
      <View style={styles.panel}>
        <Text style={styles.eyebrow}>YOUR SCHOOL, IN REACH</Text>
        <Text style={styles.title}>Welcome{ '\n' }back.</Text>
        <Text style={styles.copy}>Sign in with the student ID and password provided by your school.</Text>
        <Text style={styles.label}>STUDENT ID</Text>
        <TextInput autoCapitalize="characters" autoCorrect={false} onChangeText={setStudentId} placeholder="e.g. STU-2026-014" placeholderTextColor="#94A09A" returnKeyType="next" style={styles.input} value={studentId} />
        <Text style={styles.label}>PASSWORD</Text>
        <TextInput onChangeText={setPassword} onSubmitEditing={submit} placeholder="Your password" placeholderTextColor="#94A09A" secureTextEntry style={styles.input} value={password} />
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <Pressable accessibilityRole="button" disabled={submitting} onPress={submit} style={({ pressed }) => [styles.button, pressed && styles.pressed, submitting && styles.disabled]}>
          {submitting ? <ActivityIndicator color={palette.white} /> : <Text style={styles.buttonText}>Enter student desk <Text style={styles.arrow}>→</Text></Text>}
        </Pressable>
        <Text style={styles.footnote}>Need access? Please contact your school administrator.</Text>
      </View>
      <Text style={styles.footer}>A calmer way to stay close to learning.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.paper, justifyContent: 'center', paddingHorizontal: 24 },
  brand: { alignItems: 'center', marginBottom: 26 },
  brandStamp: { width: 52, height: 52, borderRadius: 18, backgroundColor: palette.forest, alignItems: 'center', justifyContent: 'center', marginBottom: 12, transform: [{ rotate: '-4deg' }] },
  brandStampText: { color: palette.gold, fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  brandName: { color: palette.forest, fontSize: 13, fontWeight: '900', letterSpacing: 3 },
  brandEdition: { color: palette.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1.8, marginTop: 5 },
  panel: { backgroundColor: palette.white, borderRadius: 20, borderWidth: 1, borderColor: palette.line, padding: 22 },
  eyebrow: { color: palette.green, fontSize: 9, fontWeight: '900', letterSpacing: 1.8 },
  title: { color: palette.forest, fontSize: 38, lineHeight: 41, fontWeight: '800', marginTop: 9 },
  copy: { color: palette.muted, fontSize: 13, lineHeight: 19, marginTop: 9, marginBottom: 22 },
  label: { color: palette.forest, fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginTop: 14, marginBottom: 7 },
  input: { height: 49, backgroundColor: '#F7F8F4', borderRadius: 10, borderWidth: 1, borderColor: palette.line, paddingHorizontal: 13, color: '#172A27', fontSize: 14 },
  error: { color: '#A93C31', fontSize: 12, lineHeight: 17, marginTop: 12 },
  button: { height: 51, borderRadius: 10, backgroundColor: palette.forest, alignItems: 'center', justifyContent: 'center', marginTop: 19 },
  buttonText: { color: palette.white, fontSize: 13, fontWeight: '700' },
  arrow: { color: palette.gold, fontSize: 18, fontWeight: '700' },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.65 },
  footnote: { color: palette.muted, fontSize: 10, textAlign: 'center', marginTop: 14 },
  footer: { color: palette.muted, fontSize: 11, textAlign: 'center', marginTop: 20 },
});