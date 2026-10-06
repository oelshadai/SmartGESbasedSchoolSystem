import { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type RefreshControlProps } from 'react-native';
import { router } from 'expo-router';
import { useSession } from '../session';
import type { StudentAssignment } from '../api';

export const color = {
  forest: '#123B34',
  green: '#1D6855',
  leaf: '#DCEBE2',
  paper: '#F6F4EC',
  white: '#FFFFFF',
  ink: '#172A27',
  muted: '#71817B',
  gold: '#E9B949',
  coral: '#D96C4F',
  line: '#E5E8DF',
  blue: '#49798A',
};

export function StudentFrame({ children, refreshControl }: { children: ReactNode; refreshControl?: React.ReactElement<RefreshControlProps> }) {
  const { student, error, signOut } = useSession();
  const leave = async () => {
    await signOut();
    router.replace('/login');
  };
  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <Text style={styles.topBrand}>SMARTGES <Text style={styles.brandSlash}>/</Text> STUDENT</Text>
          <Text style={styles.topSchool}>{student?.school || 'School portal'}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={leave} style={styles.logoutButton}><Text style={styles.logoutText}>Sign out</Text></Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content} refreshControl={refreshControl}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {children}
        <Text style={styles.bottomNote}>Pull down to refresh your school data.</Text>
      </ScrollView>
    </View>
  );
}

export function PageHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <View style={styles.pageHeading}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.pageTitle}>{title}</Text>
      <Text style={styles.pageBody}>{body}</Text>
    </View>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.goldRule} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

export function AssignmentCard({ assignment }: { assignment: StudentAssignment }) {
  const tone = statusTone(assignment.status);
  return (
    <View style={styles.assignmentCard}>
      <View style={styles.rowBetween}>
        <Text style={styles.subjectLabel}>{assignment.subject_name || 'GENERAL'}</Text>
        <View style={[styles.statusPill, { backgroundColor: `${tone}18` }]}><Text style={[styles.statusText, { color: tone }]}>{assignment.status.replace(/_/g, ' ')}</Text></View>
      </View>
      <Text style={styles.assignmentTitle}>{assignment.title}</Text>
      {assignment.description ? <Text style={styles.assignmentBody} numberOfLines={3}>{assignment.description}</Text> : null}
      <View style={styles.assignmentFooter}>
        <Text style={styles.assignmentMeta}>DUE  {formatDate(assignment.due_date)}</Text>
        <Text style={styles.assignmentPoints}>{assignment.points} PTS</Text>
      </View>
    </View>
  );
}

export function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statAccent, { backgroundColor: accent }]} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function formatDate(value?: string | null): string {
  if (!value) return 'No due date';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusTone(status: string): string {
  const value = status.toLowerCase();
  if (value.includes('graded') || value.includes('published') || value.includes('submitted')) return color.green;
  if (value.includes('progress')) return color.blue;
  return color.coral;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.paper },
  topBar: { backgroundColor: color.forest, paddingHorizontal: 21, paddingTop: 12, paddingBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { flex: 1 },
  topBrand: { color: color.white, fontSize: 10, fontWeight: '900', letterSpacing: 1.6 },
  brandSlash: { color: color.gold },
  topSchool: { color: '#B9CFC4', fontSize: 11, marginTop: 4 },
  logoutButton: { paddingHorizontal: 11, paddingVertical: 8, borderWidth: 1, borderColor: '#55766B', borderRadius: 9 },
  logoutText: { color: '#E4ECE7', fontSize: 10, fontWeight: '700' },
  content: { padding: 18, paddingBottom: 22 },
  error: { color: '#A93C31', backgroundColor: '#F9E6E1', borderRadius: 9, padding: 10, fontSize: 11, marginBottom: 12 },
  pageHeading: { marginTop: 7, marginBottom: 19 },
  eyebrow: { color: color.green, fontSize: 9, fontWeight: '900', letterSpacing: 1.8 },
  pageTitle: { color: color.forest, fontSize: 31, fontWeight: '800', marginTop: 7 },
  pageBody: { color: color.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  empty: { backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: 13, padding: 17, marginTop: 5 },
  goldRule: { width: 26, height: 3, borderRadius: 2, backgroundColor: color.gold, marginBottom: 10 },
  emptyTitle: { color: color.ink, fontSize: 13, fontWeight: '800' },
  emptyBody: { color: color.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
  assignmentCard: { backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: 13, padding: 14, marginBottom: 10 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subjectLabel: { color: color.blue, fontSize: 8, fontWeight: '900', letterSpacing: 1.2, flex: 1 },
  statusPill: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 8, fontWeight: '800' },
  assignmentTitle: { color: color.ink, fontSize: 14, fontWeight: '800', marginTop: 8 },
  assignmentBody: { color: color.muted, fontSize: 11, lineHeight: 16, marginTop: 6 },
  assignmentFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 9, borderTopWidth: 1, borderTopColor: color.line },
  assignmentMeta: { color: color.muted, fontSize: 8, fontWeight: '800', letterSpacing: 0.7 },
  assignmentPoints: { color: color.forest, fontSize: 8, fontWeight: '800' },
  statCard: { flex: 1, backgroundColor: color.white, borderRadius: 12, padding: 13, borderWidth: 1, borderColor: color.line, minHeight: 86 },
  statAccent: { width: 19, height: 3, borderRadius: 2, marginBottom: 8 },
  statValue: { color: color.forest, fontSize: 22, fontWeight: '800' },
  statLabel: { color: color.muted, fontSize: 10, marginTop: 2 },
  bottomNote: { color: color.muted, fontSize: 9, textAlign: 'center', marginVertical: 16 },
});
