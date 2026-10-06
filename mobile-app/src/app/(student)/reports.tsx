import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { EmptyState, PageHeading, StudentFrame, color, formatDate } from '../../components/StudentUI';
import { useSession } from '../../session';

export default function ReportsScreen() {
  const { publishedReports, loading, refresh } = useSession();
  return (
    <StudentFrame refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={color.green} />}>
      <PageHeading eyebrow="SCHOOL RECORDS" title="Report cards" body="Published reports available in your student portal." />
      {publishedReports.map(report => (
        <View key={report.id} style={styles.reportRow}>
          <View style={styles.documentMark}><Text style={styles.documentMarkText}>PDF</Text></View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportTitle}>{report.term_name}</Text>
            <Text style={styles.reportMeta}>{report.academic_year}  ·  {report.published_at ? `Published ${formatDate(report.published_at)}` : 'Published report'}</Text>
          </View>
          <Text style={styles.ready}>READY</Text>
        </View>
      ))}
      {publishedReports.length === 0 ? <EmptyState title="No reports published" body="Your terminal report will appear here when the school publishes it." /> : null}
    </StudentFrame>
  );
}

const styles = StyleSheet.create({
  reportRow: { backgroundColor: color.white, borderWidth: 1, borderColor: color.line, borderRadius: 13, padding: 13, marginBottom: 9, flexDirection: 'row', alignItems: 'center' },
  documentMark: { width: 39, height: 43, borderRadius: 8, backgroundColor: '#F8EBD0', alignItems: 'center', justifyContent: 'center' },
  documentMarkText: { color: '#8E6820', fontSize: 9, fontWeight: '900' },
  reportInfo: { flex: 1, paddingHorizontal: 11 },
  reportTitle: { color: color.ink, fontSize: 14, fontWeight: '800' },
  reportMeta: { color: color.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  ready: { color: color.green, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
});
