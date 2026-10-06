import { RefreshControl } from 'react-native';
import { AssignmentCard, EmptyState, PageHeading, StudentFrame, color } from '../../components/StudentUI';
import { useSession } from '../../session';

export default function AssignmentsScreen() {
  const { assignments, loading, refresh } = useSession();
  return (
    <StudentFrame refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={color.green} />}>
      <PageHeading eyebrow="KEEP YOUR MOMENTUM" title="Assignments" body="Published work and submission progress for your class." />
      {assignments.map(assignment => <AssignmentCard key={assignment.id} assignment={assignment} />)}
      {assignments.length === 0 ? <EmptyState title="No assignments yet" body="When your teachers publish work, it will appear here." /> : null}
    </StudentFrame>
  );
}
