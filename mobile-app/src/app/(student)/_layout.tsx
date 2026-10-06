import { Redirect, Tabs } from 'expo-router';
import { useSession } from '../../session';

export default function StudentTabs() {
  const { student, booting } = useSession();
  if (booting) return null;
  if (!student) return <Redirect href="/login" />;

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#123B34',
      tabBarInactiveTintColor: '#71817B',
      tabBarStyle: { height: 62, paddingTop: 6, paddingBottom: 7, backgroundColor: '#FFFFFF', borderTopColor: '#E5E8DF' },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarLabel: 'Home' }} />
      <Tabs.Screen name="grades" options={{ title: 'Grades', tabBarLabel: 'Grades' }} />
      <Tabs.Screen name="assignments" options={{ title: 'Assignments', tabBarLabel: 'Tasks' }} />
      <Tabs.Screen name="reports" options={{ title: 'Reports', tabBarLabel: 'Reports' }} />
    </Tabs>
  );
}