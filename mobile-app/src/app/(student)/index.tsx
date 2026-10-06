import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { StudentFrame, AssignmentCard, EmptyState, StatCard, color } from '../../components/StudentUI';
import { useSession } from '../../session';

export default function StudentHome() {
  const { student, grades, assignments, publishedReports, loading, refresh } = useSession();
  const openAssignments = assignments.filter(item => !['SUBMITTED', 'GRADED'].includes(item.status.toUpperCase()));
  const firstName = student?.first_name || student?.name.split(' ')[0] || 'Student';
  return (
    <StudentFrame refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={color.green} />}>
      <View style={styles.welcome}>
        <View style={styles.welcomeText}>
          <Text style={styles.eyebrow}>STUDENT DESK</Text>
          <Text style={styles.greeting}>Hello, {firstName}.</Text>
          <Text style={styles.meta}>{student?.class || 'Class not assigned'}  ·  {student?.student_id}</Text>
        </View>
        <View style={styles.avatar}><Text style={styles.avatarText}>{firstName.slice(0, 1).toUpperCase()}</Text></View>
      </View>
      <View style={styles.hero}>
        <View style={styles.heroTop}><Text style={styles.heroKicker}>LEARNING, IN VIEW</Text><Text style={styles.heroDot}>●</Text></View>
        <Text style={styles.heroTitle}>Small steps{ '\n' }make strong terms.</Text>
        <Text style={styles.heroCaption}>{grades.length} term report{grades.length === 1 ? '' : 's'}  ·  {publishedReports.length} published</Text>
        <View style={styles.heroRule} />
        <Text style={styles.heroFoot}>Keep your work moving forward.</Text>
      </View>
      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Your learning</Text><Text style={styles.sectionAside}>THIS YEAR</Text></View>
      <View style={styles.stats}><StatCard label="To complete" value={openAssignments.length} accent={color.gold} /><StatCard label="Grades posted" value={grades.length} accent={color.coral} /></View>
      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Coming up</Text><Text style={styles.sectionAside}>{openAssignments.length} OPEN</Text></View>
      {openAssignments.slice(0, 3).map(assignment => <AssignmentCard key={assignment.id} assignment={assignment} />)}
      {openAssignments.length === 0 ? <EmptyState title="You're all caught up" body="New assignments from your teachers will show here." /> : null}
      {loading ? <View style={styles.loading}><ActivityIndicator color={color.green} /><Text style={styles.loadingText}>Refreshing school data…</Text></View> : null}
    </StudentFrame>
  );
}

const styles = StyleSheet.create({
  welcome: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5, marginBottom: 18 },
  welcomeText: { flex: 1, paddingRight: 12 },
  eyebrow: { color: color.green, fontSize: 9, fontWeight: '900', letterSpacing: 1.8 },
  greeting: { color: color.forest, fontSize: 25, fontWeight: '800', marginTop: 5 },
  meta: { color: color.muted, fontSize: 11, marginTop: 5 },
  avatar: { width: 45, height: 45, backgroundColor: color.gold, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: color.forest, fontSize: 19, fontWeight: '900' },
  hero: { backgroundColor: color.forest, borderRadius: 17, padding: 19, minHeight: 182, overflow: 'hidden' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between' },
  heroKicker: { color: '#BDD5C6', fontSize: 9, fontWeight: '800', letterSpacing: 1.6 },
  heroDot: { color: color.gold, fontSize: 9 },
  heroTitle: { color: color.white, fontSize: 28, lineHeight: 31, fontWeight: '800', marginTop: 13 },
  heroCaption: { color: '#BED1C6', fontSize: 10, marginTop: 10 },
  heroRule: { height: 1, backgroundColor: '#45645A', marginTop: 14 },
  heroFoot: { color: color.gold, fontSize: 10, marginTop: 9, fontWeight: '700' },
  sectionHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 23, marginBottom: 11 },
  sectionTitle: { color: color.ink, fontSize: 17, fontWeight: '800' },
  sectionAside: { color: color.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  stats: { flexDirection: 'row', gap: 10 },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 13 },
  loadingText: { color: color.muted, fontSize: 10 },
});
