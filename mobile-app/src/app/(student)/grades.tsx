import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { EmptyState, PageHeading, StudentFrame, color } from '../../components/StudentUI';
import { useSession } from '../../session';

export default function GradesScreen() {
  const { grades, loading, refresh } = useSession();
  return (
    <StudentFrame refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={color.green} />}>
      <PageHeading eyebrow="YOUR PROGRESS" title="Grades" body="Term results and subject marks shared by your school." />
      {grades.map(report => (
        <View key={report.id} style={styles.reportCard}>
          <View style={styles.reportHeading}>
            <View style={styles.termDetails}><Text style={styles.year}>{report.academic_year || 'ACADEMIC YEAR'}</Text><Text style={styles.term}>{report.term}</Text></View>
            <View style={styles.average}><Text style={styles.averageValue}>{Math.round(report.average_score)}%</Text><Text style={styles.averageLabel}>AVERAGE</Text></View>
          </View>
          <Text style={styles.reportMeta}>{report.class_name}  ·  Position {report.class_position}/{report.total_students}</Text>
          <View style={styles.subjectList}>
            {report.subjects.map((subject, index) => (
              <View key={`${report.id}-${subject.subject_name}`} style={[styles.subjectRow, index === report.subjects.length - 1 && styles.lastRow]}>
                <View style={styles.subjectInfo}><Text style={styles.subjectName}>{subject.subject_name}</Text><Text style={styles.subjectScores}>Class {Math.round(subject.ca_score)}  ·  Exam {Math.round(subject.exam_score)}</Text></View>
                <View style={styles.gradeInfo}><Text style={styles.total}>{Math.round(subject.total_score)}</Text><Text style={styles.grade}>{subject.grade}</Text></View>
              </View>
            ))}
          </View>
          {report.teacher_remarks ? <Text style={styles.remarks}>“{report.teacher_remarks}”</Text> : null}
        </View>
      ))}
      {grades.length === 0 ? <EmptyState title="No grades posted yet" body="Your school's published term results will appear here." /> : null}
    </StudentFrame>
  );
}

const styles = StyleSheet.create({
  reportCard: { backgroundColor: color.white, borderRadius: 15, borderWidth: 1, borderColor: color.line, padding: 15, marginBottom: 13 },
  reportHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  termDetails: { flex: 1, paddingRight: 9 },
  year: { color: color.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  term: { color: color.ink, fontSize: 15, fontWeight: '800', marginTop: 4 },
  average: { backgroundColor: color.leaf, borderRadius: 11, paddingHorizontal: 11, paddingVertical: 7, alignItems: 'center' },
  averageValue: { color: color.forest, fontSize: 16, fontWeight: '900' },
  averageLabel: { color: color.green, fontSize: 7, fontWeight: '900', letterSpacing: 0.8, marginTop: 1 },
  reportMeta: { color: color.muted, fontSize: 10, marginTop: 8 },
  subjectList: { marginTop: 12, borderTopWidth: 1, borderTopColor: color.line },
  subjectRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: color.line, paddingVertical: 7 },
  lastRow: { borderBottomWidth: 0 },
  subjectInfo: { flex: 1, paddingRight: 8 },
  subjectName: { color: color.ink, fontSize: 11, fontWeight: '700' },
  subjectScores: { color: color.muted, fontSize: 9, marginTop: 3 },
  gradeInfo: { minWidth: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
  total: { color: color.forest, fontSize: 12, fontWeight: '800' },
  grade: { color: color.green, fontSize: 10, fontWeight: '900', width: 17, textAlign: 'right' },
  remarks: { color: color.muted, fontSize: 10, lineHeight: 15, fontStyle: 'italic', borderTopWidth: 1, borderTopColor: color.line, paddingTop: 10 },
});
